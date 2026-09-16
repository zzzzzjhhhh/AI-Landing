#!/usr/bin/env python3
"""Package an accepted fixed-topology hand cloud as dynamic Gaussian splats.

The output is an additive Rerun recording for the existing episode recording id.
It preserves the source tracking timeline and the accepted cloud's per-frame
validity/confidence. This is a point-cloud-to-Gaussian conversion, not a newly
photometrically trained 4DGS model.
"""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

import numpy as np
import rerun as rr
import rerun.blueprint as rrb


SAMPLES_PER_FACE = 15
# The accepted clouds use the same 15 barycentric samples for every MANO face.
# This is one of the three samples nearest the face centroid.
FACE_CENTER_SAMPLE = 6
ENTITY_ROOT = "replay_dashboard/placeholder/gaussian"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def face_geometry(xyz: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return center, anisotropic half-size and xyzw normal quaternion per face."""
    if xyz.ndim != 2 or xyz.shape[1] != 3 or len(xyz) % SAMPLES_PER_FACE:
        raise ValueError(f"Expected Nx3 fixed-topology samples divisible by {SAMPLES_PER_FACE}, got {xyz.shape}")
    samples = xyz.reshape(-1, SAMPLES_PER_FACE, 3)
    centers = samples[:, FACE_CENTER_SAMPLE]
    # These indices are the three vertices in the pipeline's barycentric order.
    v2, v1, v0 = samples[:, 0], samples[:, 4], samples[:, 14]
    cross = np.cross(v1 - v0, v2 - v0)
    norm = np.linalg.norm(cross, axis=1, keepdims=True)
    normal = cross / np.maximum(norm, 1e-8)
    area = norm[:, 0] * 0.5
    tangent = np.clip(np.sqrt(np.maximum(area, 1e-10) / SAMPLES_PER_FACE) * 1.25, 0.00045, 0.0035)
    half_sizes = np.column_stack((tangent, tangent, np.maximum(tangent * 0.28, 0.00018)))

    w = np.sqrt(np.maximum((1.0 + normal[:, 2]) * 0.5, 1e-8))
    quaternions = np.column_stack((-normal[:, 1] / (2 * w), normal[:, 0] / (2 * w), np.zeros(len(normal)), w))
    quaternions[normal[:, 2] < -0.9999] = np.array([1, 0, 0, 0], dtype=np.float32)
    quaternions /= np.maximum(np.linalg.norm(quaternions, axis=1, keepdims=True), 1e-8)
    return centers.astype(np.float32), half_sizes.astype(np.float32), quaternions.astype(np.float32)


def frame_face_color(rgb: np.ndarray) -> np.ndarray:
    """Average the 15 same-face samples to avoid the old dark sampling grid."""
    if rgb.ndim != 2 or rgb.shape[1] != 3 or len(rgb) % SAMPLES_PER_FACE:
        raise ValueError(f"Expected Nx3 RGB samples divisible by {SAMPLES_PER_FACE}, got {rgb.shape}")
    return np.rint(rgb.reshape(-1, SAMPLES_PER_FACE, 3).mean(axis=1)).astype(np.uint8)


def gaussian_dashboard_blueprint(manifest_path: Path, output: Path) -> None:
    """Rebuild the established dashboard with only the Gaussian tile upgraded to 3D."""
    manifest = json.loads(manifest_path.read_text())
    dashboard = manifest["dashboard"]
    dimensions = manifest["camera_dimensions"]
    labels = {
        "left_camera": "Stereo left", "right_camera": "Stereo right", "left": "Stereo left", "right": "Stereo right",
        "left_side": "Left side", "right_side": "Right side", "back": "Back",
    }
    background = [9, 11, 16]
    cameras = [
        rrb.Spatial2DView(
            origin=f"camera/{name}", name=labels.get(name, name),
            visual_bounds=rrb.VisualBounds2D(x_range=[0, size[0]], y_range=[0, size[1]]),
        )
        for name, size in dimensions.items()
    ]
    estimated = manifest["pressure_source"] == "video_pose_estimate"
    video_flexion = "video_estimate" in manifest["flexion"]
    movement = rrb.Spatial3DView(
        origin="derived/hand_flexion/right", contents=["$origin/mesh/**", "$origin/status"],
        name="Movement · VIDEO ESTIMATE" if video_flexion else "Movement", background=background, line_grid=False,
        eye_controls=rrb.EyeControls3D(position=[2.6, 1.1, 6.7], look_target=[-0.45, 0.4, 0.2], eye_up=[0, 1, 0]),
    )
    pressure = rrb.Spatial3DView(
        origin="demo/glove_pressure/right",
        contents=["$origin/mesh/**", "$origin/pressure", "$origin/status", "$origin/legend"],
        name="Pressure" if estimated else "Pressure · DEMO", background=background, line_grid=False,
        eye_controls=rrb.EyeControls3D(
            position=[-0.45, 0, 8.0] if estimated else [-0.45, 0.5, 6.5],
            look_target=[-0.45, 0 if estimated else 0.5, 0.2], eye_up=[0, 1, 0],
        ),
    )

    def document(name: str, title: str) -> rrb.TextDocumentView:
        return rrb.TextDocumentView(
            origin=f"replay_dashboard/task/{name}", name=title,
            format_options=rrb.archetypes.TextDocumentFormat(word_wrap=True, monospace=False),
        )

    left = rrb.Vertical(
        rrb.Horizontal(movement, pressure, column_shares=[1, 1]),
        rrb.Horizontal(
            rrb.Vertical(document("main", "Main task"), document("objects", "Objects"), row_shares=[1.7, 1]),
            rrb.Vertical(
                document("subtask", "Sub task"), document("interaction", "Interaction"),
                document("action", "Current action"), row_shares=[1, 1, 1],
            ),
            column_shares=[1, 1],
        ),
        rrb.StateTimelineView(
            origin="replay_dashboard/task_timeline", contents=["replay_dashboard/task_timeline/Task"], name="Task timeline",
        ),
        row_shares=[0.58, 0.28, 0.14],
    )
    depth = dashboard.get("depth")
    depth_view = rrb.Spatial2DView(
        origin="replay_dashboard/depth", name="Depth",
        visual_bounds=rrb.VisualBounds2D(x_range=[0, depth["width"]], y_range=[0, depth["height"]]),
    )
    tiles = [depth_view, *cameras]
    camera_grid = rrb.Vertical(
        *[rrb.Horizontal(*tiles[index : index + 3], column_shares=[1] * len(tiles[index : index + 3])) for index in range(0, len(tiles), 3)],
        row_shares=[1] * ((len(tiles) + 2) // 3),
    )
    duration = manifest["duration_ns"] / 1e9
    head: rrb.TimeSeriesView | rrb.Vertical = rrb.TimeSeriesView(
        origin=dashboard["head_height_entity"], name="Head height · m", plot_legend=rrb.PlotLegend(visible=False),
        background=rrb.archetypes.PlotBackground(color=background, show_grid=True),
        axis_x=rrb.TimeAxis(
            view_range=rr.TimeRange(
                start=rrb.TimeRangeBoundary.absolute(seconds=0), end=rrb.TimeRangeBoundary.absolute(seconds=duration),
            ),
            zoom_lock=True,
        ),
    )
    imu = dashboard.get("imu")
    if imu:
        def imu_plot(kind: str) -> rrb.TimeSeriesView:
            values = [imu["statistics"][f"{kind}_{axis}"] for axis in "xyz"]
            low = min(0, min(value["min"] for value in values))
            high = max(0, max(value["max"] for value in values))
            pad = max((high - low) * 0.08, 0.2)
            return rrb.TimeSeriesView(
                origin=f'{imu["entity"]}/{kind}', name=f"IMU {kind}", plot_legend=rrb.PlotLegend(visible=False),
                background=rrb.archetypes.PlotBackground(color=background, show_grid=True),
                axis_x=rrb.TimeAxis(
                    view_range=rr.TimeRange(
                        start=rrb.TimeRangeBoundary.absolute(seconds=0),
                        end=rrb.TimeRangeBoundary.absolute(seconds=duration),
                    ),
                    zoom_lock=True,
                ),
                axis_y=rrb.ScalarAxis(range=[low - pad, high + pad], zoom_lock=True),
            )
        head = rrb.Vertical(imu_plot("accel"), imu_plot("gyro"), row_shares=[1, 1])

    gaussian = rrb.Spatial3DView(
        origin=ENTITY_ROOT, contents=["$origin/left_hand", "$origin/right_hand"], name="Gaussian Splat",
        background=background, line_grid=False,
        eye_controls=rrb.EyeControls3D(position=[0, 0, 0], look_target=[0, 0, 0.55], eye_up=[0, -1, 0]),
    )
    right = rrb.Vertical(
        camera_grid, rrb.Horizontal(gaussian, head, column_shares=[1, 1.8]), row_shares=[0.64, 0.36],
    )
    blueprint = rrb.Blueprint(
        rrb.Horizontal(left, right, column_shares=[1.18, 1]),
        rrb.TimePanel(state="collapsed", timeline="tracking_time"), auto_layout=False, auto_views=False,
    )
    blueprint.save(manifest["application_id"], output)


def split_asset(path: Path, max_part_bytes: int) -> list[Path]:
    if path.stat().st_size <= max_part_bytes:
        return []
    parts: list[Path] = []
    with path.open("rb") as source:
        index = 0
        while block := source.read(max_part_bytes):
            part = path.with_name(f"{path.name}.part-{index:03d}")
            part.write_bytes(block)
            parts.append(part)
            index += 1
    return parts


def build(args: argparse.Namespace) -> None:
    cloud_paths = sorted(args.cloud_dir.glob("cloud_*.npz"))
    if not cloud_paths:
        raise FileNotFoundError(f"No cloud_*.npz files in {args.cloud_dir}")
    args.output_dir.mkdir(parents=True, exist_ok=False)

    first = np.load(cloud_paths[0], allow_pickle=False)
    point_count = len(first["xyz"])
    if point_count % SAMPLES_PER_FACE:
        raise ValueError(f"Point count {point_count} is not the expected fixed topology")
    first_hand_ids = first["hand_id"].reshape(-1, SAMPLES_PER_FACE)[:, FACE_CENTER_SAMPLE]
    if set(np.unique(first_hand_ids).tolist()) != {0, 1}:
        raise ValueError("Both physical hand ids must be present in the fixed topology")

    face_count = point_count // SAMPLES_PER_FACE
    support_hits = np.zeros(face_count, dtype=np.uint32)
    support_total = np.zeros(face_count, dtype=np.uint32)
    observed_rgb_sum = np.zeros((face_count, 3), dtype=np.float64)
    fallback_rgb_sum = np.zeros((face_count, 3), dtype=np.float64)
    times_us: list[int] = []

    # First pass: reproduce V2's observed-first, time-fused SH0-like color.
    for index, path in enumerate(cloud_paths):
        data = np.load(path, allow_pickle=False)
        if len(data["xyz"]) != point_count or not np.array_equal(data["hand_id"], first["hand_id"]):
            raise ValueError(f"Topology/identity changed at {path.name}")
        time_us = int(data["t_sync_us"])
        if times_us and time_us <= times_us[-1]:
            raise ValueError(f"Non-increasing t_sync_us at {path.name}")
        times_us.append(time_us)
        colors = frame_face_color(data["rgb"])
        support = data["observed_support"].reshape(-1, SAMPLES_PER_FACE).any(axis=1)
        valid = data["hand_valid"].reshape(-1, SAMPLES_PER_FACE).any(axis=1)
        observed_rgb_sum[support] += colors[support]
        support_hits += support
        support_total += valid
        fallback_rgb_sum += colors
        if index % 100 == 0:
            print(f"COLOR {index}/{len(cloud_paths)}", flush=True)

    fallback = fallback_rgb_sum / len(cloud_paths)
    fused_rgb = np.where(
        (support_hits > 0)[:, None],
        observed_rgb_sum / np.maximum(support_hits[:, None], 1),
        fallback,
    )
    support_frequency = support_hits / np.maximum(support_total, 1)
    fused_rgb = np.clip(np.rint(fused_rgb), 0, 255).astype(np.uint8)

    output_rrd = args.output_dir / "hand-dynamic-gaussians.rrd"
    recording = rr.RecordingStream(args.application_id, recording_id=args.recording_id)
    recording.save(output_rrd)
    recording.log(ENTITY_ROOT, rr.ViewCoordinates.RDF, static=True)
    recording.log(
        f"{ENTITY_ROOT}/provenance",
        rr.TextDocument(
            "Dynamic colored hand Gaussian splats converted from the accepted fixed-topology V8/V11 cloud. "
            "Stereo support, MANO completion, tracking confidence and source labels are preserved in metadata. "
            "This is not a newly photometrically trained 4DGS model."
        ),
        static=True,
    )

    confidence_min = 1.0
    source_counts: Counter[str] = Counter()
    low_confidence_frames = [0, 0]
    for index, path in enumerate(cloud_paths):
        data = np.load(path, allow_pickle=False)
        recording.set_time("tracking_time", duration=np.timedelta64(times_us[index], "us"))
        centers, half_sizes, quaternions = face_geometry(data["xyz"])
        face_valid = data["hand_valid"].reshape(-1, SAMPLES_PER_FACE).any(axis=1)
        frame_support = data["observed_support"].reshape(-1, SAMPLES_PER_FACE).any(axis=1)
        hand_confidence = np.asarray(data["tracking_confidence"], dtype=np.float32)
        confidence_min = min(confidence_min, float(hand_confidence.min()))
        sources = [str(value) for value in np.asarray(data["tracking_source"]).tolist()]
        for hand_id, source in enumerate(sources):
            source_counts[f"{hand_id}:{source}"] += 1
            if hand_confidence[hand_id] < 0.5:
                low_confidence_frames[hand_id] += 1
        recording.log(
            f"{ENTITY_ROOT}/tracking_provenance",
            rr.TextDocument(json.dumps({
                "left": {"source": sources[0], "confidence": float(hand_confidence[0])},
                "right": {"source": sources[1], "confidence": float(hand_confidence[1])},
            }, separators=(",", ":"))),
        )

        for hand_id, label in ((0, "left_hand"), (1, "right_hand")):
            selected = (first_hand_ids == hand_id) & face_valid
            if not selected.any():
                recording.log(f"{ENTITY_ROOT}/{label}", rr.Clear(recursive=True))
                continue
            # Alpha communicates trust without replacing the accepted RGB material.
            alpha = np.clip(
                150 + 72 * support_frequency[selected] + 28 * frame_support[selected].astype(np.float32),
                150,
                250,
            )
            alpha *= np.clip(float(hand_confidence[hand_id]), 0.55, 1.0)
            rgba = np.column_stack((fused_rgb[selected], np.clip(alpha, 80, 250).astype(np.uint8)))
            recording.log(
                f"{ENTITY_ROOT}/{label}",
                rr.Ellipsoids3D(
                    centers=centers[selected],
                    half_sizes=half_sizes[selected],
                    quaternions=quaternions[selected],
                    colors=rgba,
                    fill_mode="solid",
                ),
            )
        if index % 50 == 0:
            print(f"RRD {index}/{len(cloud_paths)}", flush=True)

    recording.flush()
    # `flush` drains the batcher, while `disconnect` also closes the file sink
    # and writes its footer. Hashing or splitting before this point produces an
    # internally readable but byte-incomplete web asset.
    recording.disconnect()
    if args.episode_manifest:
        gaussian_dashboard_blueprint(args.episode_manifest, args.output_dir / "replay-dashboard-with-gaussians.rbl")

    parts = split_asset(output_rrd, args.max_part_mib * 1024 * 1024)
    asset_paths = parts or [output_rrd]
    metadata = {
        "version": 1,
        "episode_id": args.episode_id,
        "application_id": args.application_id,
        "recording_id": args.recording_id,
        "entity_root": ENTITY_ROOT,
        "representation": "fixed-identity anisotropic dynamic Gaussian splats",
        "source_cloud": str(args.cloud_dir),
        "source_revision": args.source_revision,
        "frames": len(cloud_paths),
        "source_points_per_frame": point_count,
        "gaussians_per_frame": face_count,
        "time_range_us": [times_us[0], times_us[-1]],
        "color_model": "observed-first time-fused RGB, SH degree 0 equivalent",
        "geometry_model": "per-frame centers, face-area anisotropic scale and surface-normal quaternion",
        "confidence": {"minimum": confidence_min, "low_confidence_frames_per_hand": low_confidence_frames},
        "tracking_source_counts": dict(sorted(source_counts.items())),
        "limitations": [
            "Point-cloud-to-Gaussian conversion; not newly photometrically trained 4DGS.",
            "Occluded geometry inherits the accepted MANO prior and tracking uncertainty.",
            "RGBA confidence changes visibility only; accepted RGB identity is preserved.",
        ],
        "data": {"path": f"/rerun/episodes/{args.episode_id}/{output_rrd.name}", "sha256": sha256(output_rrd), "bytes": output_rrd.stat().st_size},
        "data_parts": [
            {"path": f"/rerun/episodes/{args.episode_id}/{part.name}", "sha256": sha256(part), "bytes": part.stat().st_size}
            for part in parts
        ],
    }
    blueprint = args.output_dir / "replay-dashboard-with-gaussians.rbl"
    if blueprint.exists():
        metadata["blueprint"] = {
            "path": f"/rerun/episodes/{args.episode_id}/{blueprint.name}",
            "sha256": sha256(blueprint),
            "bytes": blueprint.stat().st_size,
        }
    (args.output_dir / "hand-dynamic-gaussians.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"COMPLETE {args.output_dir}", flush=True)
    print(json.dumps({"rrd_bytes": output_rrd.stat().st_size, "parts": len(asset_paths), "frames": len(cloud_paths)}), flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cloud-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--episode-id", required=True)
    parser.add_argument("--application-id", required=True)
    parser.add_argument("--recording-id", required=True)
    parser.add_argument("--source-revision", required=True, help="Accepted cloud revision, e.g. V8 or V11")
    parser.add_argument("--episode-manifest", type=Path, help="Existing right-hand-pressure.json used to preserve the dashboard layout")
    parser.add_argument("--max-part-mib", type=int, default=60)
    return parser.parse_args()


if __name__ == "__main__":
    build(parse_args())
