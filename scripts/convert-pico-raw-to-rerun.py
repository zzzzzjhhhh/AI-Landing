#!/usr/bin/env python3
"""Convert a local PICO raw sidecar clip into a Rerun recording."""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
import rerun as rr
import rerun.blueprint as rrb
from rerun.datatypes import Quaternion


DEFAULT_RAW_CLIP = Path(
    "/Users/zzj/Documents/ego-bj-qa/reports/ad_hoc/"
    "two_hand_visible_pose_sidecar_smoke_20260624/episodes/"
    "8082__20260620_105715/clips/clip_000"
)
DEFAULT_OUTPUT = Path("data/rerun/pico-raw-8082-clip-000/pico_raw_clip_000.rrd")
NOMINAL_PICO_1280X960_INTRINSICS = {
    "focal_length": [814.0255, 814.065857],
    "principal_point": [639.5, 479.5],
    "fov": [76.35, 61.05],
}

HAND_BONES = [
    ("Wrist", "Palm"),
    ("Wrist", "ThumbMetacarpal"),
    ("ThumbMetacarpal", "ThumbProximal"),
    ("ThumbProximal", "ThumbDistal"),
    ("ThumbDistal", "ThumbTip"),
    ("Wrist", "IndexMetacarpal"),
    ("IndexMetacarpal", "IndexProximal"),
    ("IndexProximal", "IndexIntermediate"),
    ("IndexIntermediate", "IndexDistal"),
    ("IndexDistal", "IndexTip"),
    ("Wrist", "MiddleMetacarpal"),
    ("MiddleMetacarpal", "MiddleProximal"),
    ("MiddleProximal", "MiddleIntermediate"),
    ("MiddleIntermediate", "MiddleDistal"),
    ("MiddleDistal", "MiddleTip"),
    ("Wrist", "RingMetacarpal"),
    ("RingMetacarpal", "RingProximal"),
    ("RingProximal", "RingIntermediate"),
    ("RingIntermediate", "RingDistal"),
    ("RingDistal", "RingTip"),
    ("Wrist", "LittleMetacarpal"),
    ("LittleMetacarpal", "LittleProximal"),
    ("LittleProximal", "LittleIntermediate"),
    ("LittleIntermediate", "LittleDistal"),
    ("LittleDistal", "LittleTip"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-clip", type=Path, default=DEFAULT_RAW_CLIP)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--recording-id", default=None)
    parser.add_argument(
        "--video-root",
        type=Path,
        default=None,
        help="Optional directory containing derived left_camera.mp4 and right_camera.mp4 assets.",
    )
    parser.add_argument("--max-samples", type=int, default=0, help="0 means convert all samples")
    parser.add_argument("--compact-video", action="store_true", help="Create 960px-wide H.264 video with original frame timestamps, at most 20 fps.")
    parser.add_argument(
        "--camera-extrinsics-convention",
        choices=("recorded", "reflect-z"),
        default="recorded",
        help="Explicit camera/head basis correction; use reflect-z only for a verified source episode.",
    )
    return parser.parse_args()


def read_json(path: Path) -> dict:
    return json.loads(path.read_text())


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def read_json_if_exists(path: Path) -> dict:
    return read_json(path) if path.is_file() else {}


def read_jsonl_if_exists(path: Path) -> list[dict]:
    return read_jsonl(path) if path.is_file() else []


def default_recording_id(raw_clip: Path) -> str:
    if raw_clip == DEFAULT_RAW_CLIP.resolve():
        return "pico_raw_8082_clip_000"
    return "pico_raw_" + "_".join(raw_clip.parts[-2:])


def load_camera_characteristics(raw_clip: Path, camera_pose_rows: list[dict], side: str) -> dict:
    characteristics = read_json_if_exists(raw_clip / f"{side}_camera_characteristics.json")
    if {"width", "height", "intrinsics", "extrinsics"}.issubset(characteristics):
        characteristics["calibration_source"] = "recorded"
        return characteristics

    if side != "left" or raw_clip != DEFAULT_RAW_CLIP.resolve():
        return {}
    # The extracted 8082 clip retained device extrinsics but omitted the characteristics sidecar.
    left_row = next((row for row in camera_pose_rows if row.get("side") == "left"), None)
    if not left_row:
        return {}
    return {
        "runtime": "pico",
        "backend": "PXR_CameraImage",
        "width": 1280,
        "height": 960,
        "video_transform": "flip_vertical",
        "intrinsics": NOMINAL_PICO_1280X960_INTRINSICS,
        "extrinsics": left_row["camera_extrinsics"],
        "calibration_source": "nominal_pico_1280x960",
    }


def video_dimensions(video_path: Path) -> tuple[int, int]:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "json",
            str(video_path),
        ],
        capture_output=True,
        check=True,
        text=True,
    )
    stream = json.loads(result.stdout)["streams"][0]
    return int(stream["width"]), int(stream["height"])


def compact_video(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    # Select source frames without moving them onto a constant-rate time grid.
    subprocess.run([
        "ffmpeg", "-v", "error", "-nostdin", "-n", "-i", str(source),
        "-map", "0:v:0", "-an", "-vf",
        "select='isnan(prev_selected_t)+gt(floor(t*20),floor(prev_selected_t*20))',scale=960:-2",
        "-fps_mode", "vfr", "-enc_time_base", "1:1000000", "-c:v", "libx264",
        "-preset", "fast", "-crf", "28", "-pix_fmt", "yuv420p", "-bf", "0",
        "-movflags", "+faststart", str(target),
    ], check=True)


def read_camera_timestamps(path: Path) -> dict[str, np.ndarray]:
    with path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError(f"Empty camera timestamp file: {path}")
    data = {
        key: np.asarray([int(row[key]) for row in rows], dtype=np.int64)
        for key in ("frame_index", "capture_time_ns", "t_unix_ms", "presentation_time_us")
    }
    for key in ("frame_index", "capture_time_ns", "t_unix_ms", "presentation_time_us"):
        if np.any(np.diff(data[key]) <= 0):
            raise ValueError(f"Camera {key} must be strictly increasing: {path}")
    if not np.array_equal(data["frame_index"], np.arange(len(rows))):
        raise ValueError(f"Camera frame indices must be contiguous: {path}")
    return data


def nearest_indices(sorted_values: np.ndarray, queries: np.ndarray) -> np.ndarray:
    if len(sorted_values) == 0 or np.any(np.diff(sorted_values) < 0):
        raise ValueError("Expected nonempty sorted timestamps")
    right = np.clip(np.searchsorted(sorted_values, queries), 0, len(sorted_values) - 1)
    left = np.maximum(right - 1, 0)
    return np.where(abs(queries - sorted_values[left]) <= abs(sorted_values[right] - queries), left, right)


def align_video_frames(
    frame_timestamps_ns: np.ndarray,
    timestamps: dict[str, np.ndarray],
    pose_times_ms: np.ndarray,
    start_ms: int,
) -> dict[str, np.ndarray | dict]:
    source_pts_ns = timestamps["presentation_time_us"] * 1000
    source_indices = nearest_indices(source_pts_ns, frame_timestamps_ns)
    error_ns = abs(source_pts_ns[source_indices] - frame_timestamps_ns)
    # Timestamp rounding is allowed; CFR re-timing and trimmed videos are not.
    if len(error_ns) == 0 or np.max(error_ns) > 1_000_000:
        raise ValueError("Video timestamps do not match raw frames; regenerate using --compact-video")
    source_times_ms = timestamps["t_unix_ms"][source_indices]
    pose_indices = nearest_indices(pose_times_ms, source_times_ms)
    pose_error_ms = abs(pose_times_ms[pose_indices] - source_times_ms)
    # Never retain the last valid pose indefinitely across missing tracking data.
    valid_pose = (source_times_ms >= pose_times_ms[0]) & (source_times_ms <= pose_times_ms[-1]) & (pose_error_ms <= 50)
    return {
        "source_indices": source_indices,
        "source_times_ms": source_times_ms,
        "timeline_ns": (source_times_ms - start_ms) * 1_000_000,
        "pose_indices": pose_indices,
        "valid_pose": valid_pose,
        "report": {
            "mode": "camera_timestamp_csv_nearest_pose_per_video_frame",
            "first_frame_offset_ms": int(source_times_ms[0] - start_ms),
            "frame_count": int(len(source_times_ms)),
            "source_pts_error_max_ms": float(np.max(error_ns) / 1e6),
            "pose_error_median_ms": float(np.median(pose_error_ms[valid_pose])) if np.any(valid_pose) else None,
            "pose_error_p95_ms": float(np.percentile(pose_error_ms[valid_pose], 95)) if np.any(valid_pose) else None,
            "pose_error_max_ms": int(np.max(pose_error_ms[valid_pose])) if np.any(valid_pose) else None,
            "frames_without_pose": int(np.count_nonzero(~valid_pose)),
            "max_pose_distance_ms": 50,
            "clock_limit": "Camera Unix time is anchored at first acquisition; sensor-to-tracker latency is not measured.",
        },
    }


def scale_camera_characteristics(camera_characteristics: dict, video_path: Path) -> dict:
    target_width, target_height = video_dimensions(video_path)
    source_width = int(camera_characteristics["width"])
    source_height = int(camera_characteristics["height"])
    if (source_width, source_height) == (target_width, target_height):
        return camera_characteristics

    scaled = json.loads(json.dumps(camera_characteristics))
    scale_x = target_width / source_width
    scale_y = target_height / source_height
    scaled["width"] = target_width
    scaled["height"] = target_height
    scaled["intrinsics"]["focal_length"] = [
        scaled["intrinsics"]["focal_length"][0] * scale_x,
        scaled["intrinsics"]["focal_length"][1] * scale_y,
    ]
    scaled["intrinsics"]["principal_point"] = [
        scaled["intrinsics"]["principal_point"][0] * scale_x,
        scaled["intrinsics"]["principal_point"][1] * scale_y,
    ]
    scaled["calibration_source"] = f"{scaled['calibration_source']}_scaled_video"
    return scaled


def pose_dtype() -> np.dtype:
    return np.dtype(
        {
            "names": [
                "t_unix_ms",
                "head_pose_xyz_xyzw",
                "left_joint_valid_mask",
                "right_joint_valid_mask",
                "left_joints_xyz_xyzw",
                "right_joints_xyz_xyzw",
            ],
            "formats": [
                "<i8",
                ("<f4", (7,)),
                "<u4",
                "<u4",
                ("<f4", (26, 7)),
                ("<f4", (26, 7)),
            ],
            "offsets": [0, 8, 36, 40, 44, 772],
            "itemsize": 1500,
        }
    )


def valid_indices(mask: int, count: int) -> list[int]:
    return [index for index in range(count) if mask & (1 << index)]


def count_valid(mask: int, count: int) -> int:
    return len(valid_indices(mask, count))


def quaternion_multiply(left: np.ndarray, right: np.ndarray) -> np.ndarray:
    left_xyz = left[:3]
    right_xyz = right[:3]
    return np.array(
        [
            left[3] * right_xyz[0]
            + left_xyz[0] * right[3]
            + left_xyz[1] * right_xyz[2]
            - left_xyz[2] * right_xyz[1],
            left[3] * right_xyz[1]
            - left_xyz[0] * right_xyz[2]
            + left_xyz[1] * right[3]
            + left_xyz[2] * right_xyz[0],
            left[3] * right_xyz[2]
            + left_xyz[0] * right_xyz[1]
            - left_xyz[1] * right_xyz[0]
            + left_xyz[2] * right[3],
            left[3] * right[3] - np.dot(left_xyz, right_xyz),
        ],
        dtype=np.float64,
    )


def rotate_vectors(vectors: np.ndarray, quaternion: np.ndarray) -> np.ndarray:
    quaternion = quaternion / np.linalg.norm(quaternion)
    xyz = quaternion[:3]
    return vectors + 2.0 * np.cross(xyz, np.cross(xyz, vectors) + quaternion[3] * vectors)


def convert_camera_extrinsics(extrinsics: dict, convention: str) -> dict:
    position = np.array(extrinsics["position"], dtype=np.float64, copy=True)
    rotation = np.array(extrinsics["rotation_xyzw"], dtype=np.float64, copy=True)
    if convention == "reflect-z":
        # Change the relative-pose basis with S=diag(1,1,-1): t'=St, R'=SRS.
        # Source SDK conventions are not recorded, so this is never inferred.
        position[2] *= -1
        rotation[:2] *= -1
    elif convention != "recorded":
        raise ValueError(f"Unknown camera extrinsics convention: {convention}")
    return {**extrinsics, "position": position.tolist(), "rotation_xyzw": rotation.tolist()}


def camera_world_pose(head_pose: np.ndarray, camera_extrinsics: dict) -> tuple[np.ndarray, np.ndarray]:
    head_position = np.asarray(head_pose[:3], dtype=np.float64)
    head_rotation = np.asarray(head_pose[3:], dtype=np.float64)
    camera_position_in_head = np.asarray(camera_extrinsics["position"], dtype=np.float64)
    camera_rotation_in_head = np.asarray(camera_extrinsics["rotation_xyzw"], dtype=np.float64)
    camera_position = head_position + rotate_vectors(camera_position_in_head, head_rotation)
    camera_rotation = quaternion_multiply(head_rotation, camera_rotation_in_head)
    return camera_position, camera_rotation / np.linalg.norm(camera_rotation)


def unity_position_to_rerun(position: np.ndarray) -> np.ndarray:
    converted = np.asarray(position, dtype=np.float64).copy()
    converted[..., 2] *= -1.0
    return converted


def unity_quaternion_to_rerun(quaternion: np.ndarray) -> np.ndarray:
    converted = np.asarray(quaternion, dtype=np.float64).copy()
    converted[..., 0:2] *= -1.0
    return converted


def valid_bone_strips(joints_xyz: np.ndarray, mask: int, joint_names: list[str]) -> list[list[list[float]]]:
    name_to_index = {name: index for index, name in enumerate(joint_names)}
    strips: list[list[list[float]]] = []
    for start_name, end_name in HAND_BONES:
        start_index = name_to_index[start_name]
        end_index = name_to_index[end_name]
        if mask & (1 << start_index) and mask & (1 << end_index):
            strips.append([joints_xyz[start_index].tolist(), joints_xyz[end_index].tolist()])
    return strips


def project_hand_to_video(
    joints_xyz: np.ndarray,
    mask: int,
    head_pose: np.ndarray,
    camera_characteristics: dict,
) -> dict[int, list[float]]:
    intrinsics = camera_characteristics["intrinsics"]
    width = int(camera_characteristics["width"])
    height = int(camera_characteristics["height"])
    focal_x, focal_y = intrinsics["focal_length"]
    principal_x, principal_y = intrinsics["principal_point"]
    camera_position, camera_rotation = camera_world_pose(head_pose, camera_characteristics["extrinsics"])
    camera_from_world = np.array(
        [-camera_rotation[0], -camera_rotation[1], -camera_rotation[2], camera_rotation[3]],
        dtype=np.float64,
    )
    camera_points = rotate_vectors(np.asarray(joints_xyz, dtype=np.float64) - camera_position, camera_from_world)

    projected: dict[int, list[float]] = {}
    for index in valid_indices(mask, len(joints_xyz)):
        x, y, z = camera_points[index]
        # PICO camera coordinates are Right/Up/Back; the encoded MP4 is vertically flipped.
        depth = -z
        if depth <= 0.01:
            continue
        pixel_x = principal_x + focal_x * x / depth
        native_pixel_y = principal_y - focal_y * y / depth
        pixel_y = (
            height - 1.0 - native_pixel_y
            if camera_characteristics.get("video_transform") == "flip_vertical"
            else native_pixel_y
        )
        if np.isfinite(pixel_x) and np.isfinite(pixel_y):
            projected[index] = [float(pixel_x), float(pixel_y)]
    return projected


def clip_line_to_video(start: list[float], end: list[float], width: int, height: int) -> list[list[float]] | None:
    start_xy = np.asarray(start, dtype=np.float64)
    end_xy = np.asarray(end, dtype=np.float64)
    if not np.isfinite([start_xy, end_xy]).all():
        return None
    delta = end_xy - start_xy
    maximum = np.array([width - 1, height - 1], dtype=np.float64)
    enter, leave = 0.0, 1.0
    # Intersect the segment's parameter interval with each image-axis slab.
    for axis in range(2):
        if delta[axis] == 0:
            if not 0 <= start_xy[axis] <= maximum[axis]:
                return None
            continue
        first = -start_xy[axis] / delta[axis]
        last = (maximum[axis] - start_xy[axis]) / delta[axis]
        enter = max(enter, min(first, last))
        leave = min(leave, max(first, last))
        if enter > leave:
            return None
    # Remove only floating-point roundoff after geometric intersection.
    return np.clip([start_xy + enter * delta, start_xy + leave * delta], 0, maximum).tolist()


def projected_bone_strips(
    projected: dict[int, list[float]], joint_names: list[str], width: int, height: int,
) -> list[list[list[float]]]:
    name_to_index = {name: index for index, name in enumerate(joint_names)}
    strips: list[list[list[float]]] = []
    for start_name, end_name in HAND_BONES:
        start_index = name_to_index[start_name]
        end_index = name_to_index[end_name]
        if start_index in projected and end_index in projected:
            clipped = clip_line_to_video(projected[start_index], projected[end_index], width, height)
            if clipped is not None:
                strips.append(clipped)
    return strips


def log_hand(
    side: str,
    joints_xyz_xyzw: np.ndarray,
    mask: int,
    joint_names: list[str],
    color: tuple[int, int, int],
) -> None:
    joints_xyz = joints_xyz_xyzw[:, :3]
    valid = valid_indices(mask, len(joint_names))
    rerun_joints_xyz = unity_position_to_rerun(joints_xyz)
    valid_xyz = rerun_joints_xyz[valid]

    rr.log(
        f"world/hands/{side}/joints",
        rr.Points3D(
            valid_xyz,
            radii=0.007,
            colors=[color for _ in valid_xyz],
        ),
    )
    rr.log(
        f"world/hands/{side}/bones",
        rr.LineStrips3D(
            valid_bone_strips(rerun_joints_xyz, mask, joint_names),
            radii=0.004,
            colors=color,
        ),
    )
    valid_count = count_valid(mask, len(joint_names))
    rr.log(f"stats/hands/{side}/valid_joints", rr.Scalars(valid_count))
    rr.log(f"stats/hands/{side}/active", rr.Scalars(1.0 if valid_count > 0 else 0.0))


def log_frame_overlays(
    camera_side: str,
    alignment: dict,
    pose_samples: np.ndarray,
    joint_names: list[str],
    characteristics: dict,
    camera_pose_rows: list[dict],
) -> None:
    camera_frames = {int(row["frame_index"]): row for row in camera_pose_rows if row.get("side") == camera_side}
    width, height = int(characteristics["width"]), int(characteristics["height"])
    for index, unix_ms in enumerate(alignment["source_times_ms"]):
        rr.set_time("tracking_time", duration=np.timedelta64(int(alignment["timeline_ns"][index]), "ns"))
        rr.set_time("capture_time", timestamp=np.datetime64(int(unix_ms), "ms"))
        sample = pose_samples[alignment["pose_indices"][index]]
        camera_frame = camera_frames.get(int(alignment["source_indices"][index]))
        head = sample["head_pose_xyz_xyzw"]
        if camera_frame is not None:
            head = np.asarray([*camera_frame["head"]["position"], *camera_frame["head"]["rotation_xyzw"]])
        for side, color in (("left", (45, 212, 191)), ("right", (244, 114, 182))):
            entity = f"camera/{camera_side}/hand_pose/{side}"
            if not alignment["valid_pose"][index]:
                rr.log(entity, rr.Clear(recursive=True))
                continue
            projected = project_hand_to_video(
                sample[f"{side}_joints_xyz_xyzw"][:, :3],
                int(sample[f"{side}_joint_valid_mask"]), head, characteristics,
            )
            visible_points = [point for point in projected.values() if 0 <= point[0] <= width - 1 and 0 <= point[1] <= height - 1]
            rr.log(f"{entity}/joints", rr.Points2D(
                np.asarray(visible_points, dtype=np.float32).reshape((-1, 2)),
                radii=rr.Radius.ui_points(3.0), colors=color, draw_order=20.0,
            ))
            rr.log(f"{entity}/bones", rr.LineStrips2D(
                projected_bone_strips(projected, joint_names, width, height),
                radii=rr.Radius.ui_points(1.7), colors=color, draw_order=19.0,
            ))


def log_camera_pose_rows(rows: Iterable[dict], start_ms: int, extrinsics_convention: str = "recorded") -> None:
    for row in rows:
        side = row.get("side")
        if side not in {"left", "right"}:
            continue
        rr.set_time("tracking_time", duration=(row["t_unix_ms"] - start_ms) / 1000.0)
        rr.set_time("capture_time", timestamp=np.datetime64(int(row["t_unix_ms"]), "ms"))
        head_pose = np.asarray(
            [*row["head"]["position"], *row["head"]["rotation_xyzw"]],
            dtype=np.float64,
        )
        extrinsics = convert_camera_extrinsics(row["camera_extrinsics"], extrinsics_convention)
        camera_position, camera_rotation = camera_world_pose(head_pose, extrinsics)
        rr.log(
            f"world/cameras/{side}",
            rr.Transform3D(
                translation=unity_position_to_rerun(camera_position),
                quaternion=Quaternion(xyzw=unity_quaternion_to_rerun(camera_rotation)),
            ),
        )


def default_blueprint(camera_dimensions: dict[str, tuple[int, int]], overlay_sides: set[str]) -> rrb.Blueprint:
    camera_views = [
        rrb.Spatial2DView(
            origin=f"camera/{side}" if side in overlay_sides else f"camera/{side}/video",
            contents="$origin/**",
            name=f"{side.title()} camera",
            visual_bounds=rrb.VisualBounds2D(x_range=[0, width], y_range=[0, height]),
        )
        for side, (width, height) in camera_dimensions.items()
    ]
    if len(camera_views) == 1:
        primary_view = camera_views[0]
    else:
        primary_view = rrb.Horizontal(*camera_views, column_shares=[1 for _ in camera_views])
    return rrb.Blueprint(
        rrb.Vertical(
            primary_view,
            rrb.TimeSeriesView(
                origin="world/head_height",
                name="Head height",
            ),
            row_shares=[3, 1],
        ),
        auto_layout=False,
        auto_views=False,
    )


def main() -> None:
    args = parse_args()
    raw_clip = args.raw_clip.resolve()
    video_root = args.video_root.resolve() if args.video_root else raw_clip
    output = args.output.resolve()
    if args.compact_video and args.video_root:
        raise ValueError("Use either --compact-video or --video-root")
    output.parent.mkdir(parents=True, exist_ok=True)

    schema = read_json(raw_clip / "pose_schema.json")
    joint_names = schema["joint_order"]
    pose_samples = np.memmap(raw_clip / "pose_samples.bin", dtype=pose_dtype(), mode="r")
    if args.max_samples > 0:
        pose_samples = pose_samples[: args.max_samples]
    pose_index = read_jsonl_if_exists(raw_clip / "pose_samples_index.jsonl")
    camera_pose_rows = read_jsonl_if_exists(raw_clip / "camera_pose_tracking.jsonl")
    clip_summary = read_json_if_exists(raw_clip / "clip_summary.json")
    manifest = read_json_if_exists(raw_clip / "manifest.json")
    camera_sides = [side for side in ("left", "right") if (video_root / f"{side}_camera.mp4").is_file()]
    if not camera_sides:
        raise FileNotFoundError(f"No camera video found in {raw_clip}")
    camera_timestamps = {side: read_camera_timestamps(raw_clip / f"{side}_camera_timestamps.csv") for side in camera_sides}
    if args.compact_video:
        video_root = output.parent / f"{output.stem}_video"
        for side in camera_sides:
            compact_video(raw_clip / f"{side}_camera.mp4", video_root / f"{side}_camera.mp4")
    camera_characteristics_by_side = {}
    for side in camera_sides:
        characteristics = load_camera_characteristics(raw_clip, camera_pose_rows, side)
        if characteristics:
            characteristics = {
                **characteristics,
                "recorded_extrinsics": characteristics["extrinsics"],
                "extrinsics_convention": args.camera_extrinsics_convention,
                "extrinsics": convert_camera_extrinsics(characteristics["extrinsics"], args.camera_extrinsics_convention),
            }
            camera_characteristics_by_side[side] = scale_camera_characteristics(
                characteristics,
                video_root / f"{side}_camera.mp4",
            )

    start_ms = int(pose_samples[0]["t_unix_ms"])
    end_ms = int(pose_samples[-1]["t_unix_ms"])
    video_assets = {side: rr.AssetVideo(path=video_root / f"{side}_camera.mp4") for side in camera_sides}
    video_timestamps = {side: asset.read_frame_timestamps_nanos() for side, asset in video_assets.items()}
    alignments = {side: align_video_frames(video_timestamps[side], camera_timestamps[side], pose_samples["t_unix_ms"], start_ms) for side in camera_sides}

    recording_id = args.recording_id or default_recording_id(raw_clip)
    application_id = "pico_raw_frame_synced_v1"
    rr.init(application_id, recording_id=recording_id, spawn=False)
    rr.save(output)
    camera_dimensions = {side: video_dimensions(video_root / f"{side}_camera.mp4") for side in camera_sides}
    rr.send_blueprint(default_blueprint(camera_dimensions, set(camera_characteristics_by_side)))
    rr.log("world", rr.ViewCoordinates.RIGHT_HAND_Y_UP, static=True)
    rr.log("recording/camera_calibration", rr.TextDocument(json.dumps(camera_characteristics_by_side, indent=2)), static=True)

    video_paths: dict[str, Path] = {}
    video_frame_counts: dict[str, int] = {}
    for camera_side in camera_sides:
        video_path = video_root / f"{camera_side}_camera.mp4"
        video_paths[camera_side] = video_path
        video_asset = video_assets[camera_side]
        entity_path = f"camera/{camera_side}/video"
        rr.log(entity_path, video_asset, static=True)
        frame_timestamps_ns = video_timestamps[camera_side]
        video_frame_counts[camera_side] = int(len(frame_timestamps_ns))
        rr.send_columns(
            entity_path,
            indexes=[
                rr.TimeColumn("tracking_time", duration=alignments[camera_side]["timeline_ns"].astype("timedelta64[ns]")),
                rr.TimeColumn("capture_time", timestamp=alignments[camera_side]["source_times_ms"].astype("datetime64[ms]")),
            ],
            columns=rr.VideoFrameReference.columns_nanos(frame_timestamps_ns),
        )

    for sample in pose_samples:
        t_unix_ms = int(sample["t_unix_ms"])
        rr.set_time("tracking_time", duration=(t_unix_ms - start_ms) / 1000.0)
        rr.set_time("capture_time", timestamp=datetime.fromtimestamp(t_unix_ms / 1000.0, tz=timezone.utc))
        head = sample["head_pose_xyz_xyzw"]
        rr.log(
            "world/head",
            rr.Transform3D(
                translation=unity_position_to_rerun(head[:3]),
                quaternion=Quaternion(xyzw=unity_quaternion_to_rerun(head[3:])),
            ),
        )
        rr.log("world/head_height", rr.Scalars(float(head[1])))
        log_hand(
            "left",
            sample["left_joints_xyz_xyzw"],
            int(sample["left_joint_valid_mask"]),
            joint_names,
            (45, 212, 191),
        )
        log_hand(
            "right",
            sample["right_joints_xyz_xyzw"],
            int(sample["right_joint_valid_mask"]),
            joint_names,
            (244, 114, 182),
        )

    for side, characteristics in camera_characteristics_by_side.items():
        log_frame_overlays(side, alignments[side], pose_samples, joint_names, characteristics, camera_pose_rows)
    log_camera_pose_rows(camera_pose_rows, start_ms, args.camera_extrinsics_convention)

    summary = {
        "source": "local_pico_raw_sidecar",
        "raw_clip": str(raw_clip),
        "video_root": str(video_root),
        "output_rrd": str(output),
        "video": str(video_paths[camera_sides[0]]),
        "videos": {side: str(path) for side, path in video_paths.items()},
        "duration_sec": round((end_ms - start_ms) / 1000.0, 3),
        "pose_sample_count": int(len(pose_samples)),
        "pose_index_rows": len(pose_index),
        "camera_pose_rows": len(camera_pose_rows),
        "video_frame_count": video_frame_counts[camera_sides[0]],
        "video_frame_counts": video_frame_counts,
        "application_id": application_id,
        "recording_id": recording_id,
        "camera_overlay": bool(camera_characteristics_by_side),
        "camera_extrinsics_convention": args.camera_extrinsics_convention,
        "camera_characteristics": camera_characteristics_by_side,
        "synchronization": {side: alignment["report"] for side, alignment in alignments.items()},
        "clip_summary": clip_summary or manifest,
        "logged_channels": [
            "/recording/camera_calibration",
            *[f"/camera/{side}/video" for side in camera_sides],
            *(
                [
                    f"/camera/{camera_side}/hand_pose/{hand_side}/{part}"
                    for camera_side in camera_characteristics_by_side
                    for hand_side in ("left", "right")
                    for part in ("joints", "bones")
                ]
                if camera_characteristics_by_side
                else []
            ),
            "/world/head",
            "/world/head_height",
            "/world/hands/left/joints",
            "/world/hands/left/bones",
            "/world/hands/right/joints",
            "/world/hands/right/bones",
            "/world/cameras/left",
            "/world/cameras/right",
            "/stats/hands/left/active",
            "/stats/hands/left/valid_joints",
            "/stats/hands/right/active",
            "/stats/hands/right/valid_joints",
        ],
    }
    (output.parent / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
