#!/usr/bin/env python3
"""Convert a local PICO raw sidecar clip into a Rerun recording."""

from __future__ import annotations

import argparse
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


def projected_bone_strips(projected: dict[int, list[float]], joint_names: list[str]) -> list[list[list[float]]]:
    name_to_index = {name: index for index, name in enumerate(joint_names)}
    strips: list[list[list[float]]] = []
    for start_name, end_name in HAND_BONES:
        start_index = name_to_index[start_name]
        end_index = name_to_index[end_name]
        if start_index in projected and end_index in projected:
            strips.append([projected[start_index], projected[end_index]])
    return strips


def log_hand(
    side: str,
    joints_xyz_xyzw: np.ndarray,
    mask: int,
    joint_names: list[str],
    color: tuple[int, int, int],
    head_pose: np.ndarray,
    camera_characteristics_by_side: dict[str, dict],
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
    for camera_side, camera_characteristics in camera_characteristics_by_side.items():
        projected = project_hand_to_video(joints_xyz, mask, head_pose, camera_characteristics)
        projected_points = np.asarray(list(projected.values()), dtype=np.float32).reshape((-1, 2))
        rr.log(
            f"camera/{camera_side}/hand_pose/{side}/joints",
            rr.Points2D(
                projected_points,
                radii=rr.Radius.ui_points(3.0),
                colors=color,
                draw_order=20.0,
            ),
        )
        rr.log(
            f"camera/{camera_side}/hand_pose/{side}/bones",
            rr.LineStrips2D(
                projected_bone_strips(projected, joint_names),
                radii=rr.Radius.ui_points(1.7),
                colors=color,
                draw_order=19.0,
            ),
        )
    valid_count = count_valid(mask, len(joint_names))
    rr.log(f"stats/hands/{side}/valid_joints", rr.Scalars(valid_count))
    rr.log(f"stats/hands/{side}/active", rr.Scalars(1.0 if valid_count > 0 else 0.0))


def log_camera_pose_rows(rows: Iterable[dict], start_ms: int) -> None:
    for row in rows:
        side = row.get("side")
        if side not in {"left", "right"}:
            continue
        rr.set_time("tracking_time", duration=(row["t_unix_ms"] - start_ms) / 1000.0)
        head_pose = np.asarray(
            [*row["head"]["position"], *row["head"]["rotation_xyzw"]],
            dtype=np.float64,
        )
        camera_position, camera_rotation = camera_world_pose(head_pose, row["camera_extrinsics"])
        rr.log(
            f"world/cameras/{side}",
            rr.Transform3D(
                translation=unity_position_to_rerun(camera_position),
                quaternion=Quaternion(xyzw=unity_quaternion_to_rerun(camera_rotation)),
            ),
        )


def default_blueprint(camera_sides: list[str], overlay_sides: set[str]) -> rrb.Blueprint:
    camera_views = [
        rrb.Spatial2DView(
            origin=f"camera/{side}" if side in overlay_sides else f"camera/{side}/video",
            contents="$origin/**",
            name=f"{side.title()} camera",
        )
        for side in camera_sides
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
    camera_characteristics_by_side = {}
    for side in camera_sides:
        characteristics = load_camera_characteristics(raw_clip, camera_pose_rows, side)
        if characteristics:
            camera_characteristics_by_side[side] = scale_camera_characteristics(
                characteristics,
                video_root / f"{side}_camera.mp4",
            )

    start_ms = int(pose_samples[0]["t_unix_ms"])
    end_ms = int(pose_samples[-1]["t_unix_ms"])

    recording_id = args.recording_id or default_recording_id(raw_clip)
    application_id = "pico_raw_stereo" if len(camera_sides) > 1 else "pico_raw_local"
    rr.init(application_id, recording_id=recording_id, spawn=False)
    rr.save(output)
    rr.send_blueprint(default_blueprint(camera_sides, set(camera_characteristics_by_side)))
    rr.log("world", rr.ViewCoordinates.RIGHT_HAND_Y_UP, static=True)

    video_paths: dict[str, Path] = {}
    video_frame_counts: dict[str, int] = {}
    for camera_side in camera_sides:
        video_path = video_root / f"{camera_side}_camera.mp4"
        video_paths[camera_side] = video_path
        video_asset = rr.AssetVideo(path=video_path)
        entity_path = f"camera/{camera_side}/video"
        rr.log(entity_path, video_asset, static=True)
        frame_timestamps_ns = video_asset.read_frame_timestamps_nanos()
        video_frame_counts[camera_side] = int(len(frame_timestamps_ns))
        rr.send_columns(
            entity_path,
            indexes=[rr.TimeColumn("tracking_time", duration=frame_timestamps_ns * 1e-9)],
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
            head,
            camera_characteristics_by_side,
        )
        log_hand(
            "right",
            sample["right_joints_xyz_xyzw"],
            int(sample["right_joint_valid_mask"]),
            joint_names,
            (244, 114, 182),
            head,
            camera_characteristics_by_side,
        )

    log_camera_pose_rows(camera_pose_rows, start_ms)

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
        "camera_characteristics": camera_characteristics_by_side,
        "clip_summary": clip_summary or manifest,
        "logged_channels": [
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
