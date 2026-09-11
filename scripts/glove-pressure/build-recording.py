"""Build native right-hand pressure and flexion panels sharing the sample timelines.

Requires scripts/requirements-rerun.txt. Pressure input is explicitly simulated.
The original episode and its video/pose data are never modified.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import rerun as rr
import rerun.blueprint as rrb
from rerun.experimental import RrdReader
from pose_source import export_source
from video_estimates import merge_video_estimates

ROOT = Path(__file__).resolve().parents[2]
ENTITY = "demo/glove_pressure/right"
FLEXION_ENTITY = "derived/hand_flexion/right"


def pressure_blueprint(camera_dimensions: dict[str, tuple[int, int]], video_estimates: bool = False, estimated_pressure: bool = False) -> rrb.Blueprint:
    labels = {"left_camera": "PICO left", "right_camera": "PICO right", "left_side": "Left side", "right_side": "Right side", "back": "Back"}
    cameras = [rrb.Spatial2DView(origin=f"camera/{side}", name=labels.get(side, f"{side.title()} camera"),
                               visual_bounds=rrb.VisualBounds2D(x_range=[0, width], y_range=[0, height]))
               for side, (width, height) in camera_dimensions.items()]
    camera_layout = rrb.Vertical(
        rrb.Horizontal(*cameras[:2], column_shares=[1, 1]),
        rrb.Horizontal(*cameras[2:], column_shares=[1] * (len(cameras) - 2)) if len(cameras) > 2 else rrb.TimeSeriesView(origin="world/head_height", name="Head height"),
        row_shares=[1.5, 1] if len(cameras) > 2 else [3, 1],
    )
    return rrb.Blueprint(
        rrb.Horizontal(
            camera_layout,
            rrb.Vertical(
                rrb.Spatial3DView(
                    origin=ENTITY,
                    contents=["$origin/mesh/**", "$origin/pressure", "$origin/status", "$origin/legend"],
                    name="Right pressure" if estimated_pressure else "Right hand pressure · DEMO",
                    background=[9, 11, 16],
                    line_grid=False,
                    eye_controls=rrb.archetypes.EyeControls3D(
                        position=[-0.45, 0, 8.0] if estimated_pressure else [-0.45, 0.5, 7.2 if len(cameras) > 2 else 5.3],
                        look_target=[-0.45, 0 if estimated_pressure else 0.5, 0.2],
                        eye_up=[0, 1, 0],
                    ),
                ),
                rrb.Spatial3DView(
                    origin=FLEXION_ENTITY,
                    contents=["$origin/mesh/**", "$origin/status"],
                    name="Right flexion · VIDEO ESTIMATE" if video_estimates else "Right hand flexion · POSE",
                    background=[9, 11, 16],
                    line_grid=False,
                    eye_controls=rrb.archetypes.EyeControls3D(
                        position=[3.2, 1.4, 6.7] if len(cameras) > 2 else [2.1, 1.1, 4.7],
                        look_target=[-0.45, 0.5, 0.2],
                        eye_up=[0, 1, 0],
                    ),
                ),
                row_shares=[1, 1],
            ),
            column_shares=[2.3, 1],
        ),
        *([rrb.TimePanel(state="collapsed", timeline="tracking_time")] if len(cameras) > 2 else []),
        auto_layout=False,
        auto_views=False,
    )


def base_metadata(path: Path) -> dict:
    reader = RrdReader(path)
    recordings = reader.recordings()
    if len(recordings) != 1:
        raise ValueError("Expected exactly one base recording")
    bounds: dict[str, tuple[int, int]] = {}
    camera_dimensions: dict[str, tuple[int, int]] = {}
    for chunk in reader.store().stream().to_chunks():
        if str(chunk.entity_path) == "/recording/camera_calibration":
            calibration = json.loads(chunk.to_record_batch()["TextDocument:text"][0].as_py()[0])
            camera_dimensions = {side: (int(calibration[side]["width"]), int(calibration[side]["height"])) for side in ("left", "right")}
        if str(chunk.entity_path) == "/recording/source":
            source = json.loads(chunk.to_record_batch()["TextDocument:text"][0].as_py()[0])
            if "cameras" in source:
                camera_dimensions = {camera["name"]: (camera["width"], camera["height"]) for camera in source["cameras"]}
        if chunk.is_static:
            continue
        batch = chunk.to_record_batch()
        for name in ("tracking_time", "capture_time"):
            if name not in batch.schema.names:
                continue
            values = batch[name].cast("int64").drop_null().to_numpy()
            if not len(values):
                continue
            low, high = int(values.min()), int(values.max())
            previous = bounds.get(name, (low, high))
            bounds[name] = min(low, previous[0]), max(high, previous[1])
    if bounds.get("tracking_time", (None,))[0] != 0 or "capture_time" not in bounds:
        raise ValueError("Expected tracking_time starting at zero and a capture_time timeline")
    if not camera_dimensions or any(min(size) <= 0 for size in camera_dimensions.values()):
        raise ValueError("Expected recorded stereo camera dimensions for fixed video bounds")
    entry = recordings[0]
    return {
        "application_id": entry.application_id,
        "recording_id": entry.recording_id,
        "duration_ns": bounds["tracking_time"][1],
        "capture_start_ns": bounds["capture_time"][0],
        "base_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "camera_dimensions": camera_dimensions,
    }


def node_items(script: str, *args):
    process = subprocess.Popen(["node", str(Path(__file__).with_name(script)), *map(str, args)], stdout=subprocess.PIPE, text=True)
    try:
        assert process.stdout is not None
        for line in process.stdout:
            yield json.loads(line)
        if process.wait() != 0:
            raise RuntimeError(f"{script} failed")
    finally:
        if process.poll() is None:
            process.terminate()
            process.wait()


def load_pressure_profile(raw: Path, path: Path, duration_ns: int) -> dict:
    profile = json.loads(path.read_text())
    sync = json.loads((raw / "sync_manifest.json").read_text())
    if profile["version"] != 1 or profile["episode_id"] != sync["episode"] or round(profile["duration_s"] * 1e9) != duration_ns:
        raise ValueError("Pressure profile belongs to a different episode or duration")
    required = {"sync_manifest.json", "right_camera.mp4", "right_camera_timestamps.csv", "pose_samples.bin", "pose_schema.json"}
    if set(profile["source_files"]) != required:
        raise ValueError("Pressure profile must identify its original video, pose and clock")
    for name, digest in profile["source_files"].items():
        if hashlib.sha256((raw / name).read_bytes()).hexdigest() != digest:
            raise ValueError(f"Pressure profile does not match source {name}")
    return {**profile, "profile_sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def build(base: Path, raw_pose: Path, output_dir: Path, asset_prefix: str = "/rerun", video_estimates: Path | None = None,
          pressure_profile: Path | None = None) -> None:
    metadata = base_metadata(base)
    pressure_metadata = load_pressure_profile(raw_pose, pressure_profile, metadata["duration_ns"]) if pressure_profile else None
    with tempfile.TemporaryDirectory(prefix="right-hand-pose-") as temporary:
        source_path = Path(temporary) / "frames.jsonl"
        flexion_metadata = export_source(base, raw_pose, source_path)
        if video_estimates is not None:
            merge_video_estimates(raw_pose, source_path, video_estimates, flexion_metadata)
        write_recording(metadata, flexion_metadata, source_path, output_dir, asset_prefix, pressure_profile, pressure_metadata)
    from dashboard_layout import build_dashboard
    build_dashboard(output_dir, raw_pose)


def write_recording(metadata: dict, flexion_metadata: dict, source_path: Path, output_dir: Path, asset_prefix: str,
                    pressure_profile: Path | None = None, pressure_metadata: dict | None = None) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    recording = rr.RecordingStream(metadata["application_id"], recording_id=metadata["recording_id"], send_properties=False)
    data_path = output_dir / "right-hand-pressure.rrd"
    blueprint_path = output_dir / "right-hand-pressure.rbl"
    recording.save(data_path)
    recording.log(ENTITY, rr.ViewCoordinates.RIGHT_HAND_Y_UP, static=True)
    pressure_description = (
        "ESTIMATED pressure from visually annotated object-contact phases and original right-finger bends. "
        "Relative intensity 0–100, NOT measured pressure, force or kPa. "
        "Missing native tracking uses VIDEO ONLY contact assumptions, not a reconstructed pose. "
        "Fixed open-hand contact atlas. Original pose, flexion and videos are unchanged.\n" + json.dumps(pressure_metadata)
    ) if pressure_metadata else (
        "SIMULATED pressure data for visualization demonstration only. "
        "Not measured by the PICO recording and not correlated with its actions. "
        "Right hand only. Original WebHand DataHandler.wasm processing; arbitrary 0–255 units."
    )
    recording.log(f"{ENTITY}/provenance", rr.TextDocument(pressure_description), static=True)
    if pressure_metadata:
        recording.log(f"{ENTITY}/legend", rr.Points3D(
            [[x, 2.9, 0.9] for x in (-1.15, -0.8, -0.45, -0.1, 0.25)], radii=0.065,
            colors=[[78, 94, 112], [76, 132, 173], [132, 197, 192], [251, 234, 132], [237, 81, 63]],
            labels=["0", "", "50", "", "100"], show_labels=True,
        ), static=True)
    recording.log(FLEXION_ENTITY, rr.ViewCoordinates.RIGHT_HAND_Y_UP, static=True)
    recording.log(f"{FLEXION_ENTITY}/provenance", rr.TextDocument(
        "Right-hand flexion INFERRED from the recorded PICO 3D keypoints. "
        "Uses the right-camera frame timestamps and nearest original source pose. "
        "Palm-normalized segment directions drive the WebHand rig; original model lengths and rest axial twist are retained. "
        "Not measured glove sensor angles. Native pose retargeting does not use WASM angle solving. "
        "Any video fallback is a COARSE VISUAL KEYFRAME ESTIMATE with interpolated hinge angles, not an automatic keypoint or 3D reconstruction result. "
        "Missing tracking clears the mesh. Left/right camera frames have independent timestamps.\n" + json.dumps(flexion_metadata)
    ), static=True)
    recording.set_time("tracking_time", duration=np.timedelta64(0, "ns"))
    recording.set_time("capture_time", timestamp=np.datetime64(metadata["capture_start_ns"], "ns"))
    recording.log(f"{FLEXION_ENTITY}/mesh", rr.Clear(recursive=True))
    frame_count = 0
    pressure_rows, pressure_samples = [], []
    try:
        pressure_items = node_items("export-pressure-estimate.mjs", source_path, pressure_profile) if pressure_profile else node_items("export-demo.mjs", metadata["duration_ns"] / 1e9, 10)
        for item in pressure_items:
            if item["type"] == "model":
                for index, mesh in enumerate(item["meshes"]):
                    recording.log(f"{ENTITY}/mesh/{index}", rr.Mesh3D(
                        vertex_positions=np.asarray(mesh["positions"], dtype=np.float32).reshape(-1, 3),
                        triangle_indices=np.asarray(mesh["indices"], dtype=np.uint32).reshape(-1, 3),
                        vertex_normals=np.asarray(mesh["normals"], dtype=np.float32).reshape(-1, 3),
                        albedo_factor=[78, 94, 112, 255] if pressure_metadata else [190, 203, 219, 255],
                    ), static=True)
                    # Topology and material stay static; per-frame vertex data supplies the skinning.
                    recording.log(f"{FLEXION_ENTITY}/mesh/{index}", rr.Mesh3D.from_fields(
                        triangle_indices=np.asarray(mesh["indices"], dtype=np.uint32).reshape(-1, 3),
                        albedo_factor=[117, 208, 222, 255],
                    ), static=True)
            elif item["type"] == "frame":
                time_ns = item.get("time_ns", round(item["time"] * 1e9))
                recording.set_time("tracking_time", duration=np.timedelta64(time_ns, "ns"))
                recording.set_time("capture_time", timestamp=np.datetime64(metadata["capture_start_ns"] + time_ns, "ns"))
                recording.log(f"{ENTITY}/pressure", rr.Points3D(
                    np.asarray(item["positions"], dtype=np.float32).reshape(-1, 3),
                    colors=np.asarray(item["colors"], dtype=np.uint8).reshape(-1, 4),
                    radii=0.023 if pressure_metadata else 0.016,
                ))
                if pressure_metadata:
                    estimate = item["estimate"]
                    recording.log(f"{ENTITY}/status", rr.Points3D(
                        [[-0.45, -2.65, 0.9]], radii=0, colors=[180, 213, 222, 255],
                        labels=[f"{estimate['phase']} · {estimate['peak']:.0f}/100"], show_labels=True,
                    ))
                    for region, level in estimate["levels"].items():
                        recording.log(f"{ENTITY}/relative/{region}", rr.Scalars(level))
                    pressure_rows.append({
                        "tracking_time_ns": time_ns, "capture_time_ns": metadata["capture_start_ns"] + time_ns,
                        "pose_sample_index": estimate["pose_sample_index"], "source": estimate["source"], "phase": estimate["phase"],
                        "peak_relative_0_100": estimate["peak"], "contact_strength": estimate["contact_strength"],
                        **{f"{name}_relative_0_100": level for name, level in estimate["levels"].items()},
                        "endpoint_hold": estimate["endpoint_hold"],
                    })
                    pressure_samples.append({"tracking_time_ns": time_ns, "capture_time_ns": metadata["capture_start_ns"] + time_ns, **estimate})
                frame_count += 1
        csv_path = output_dir / "right-hand-flexion.csv"
        fields = ["tracking_time_ns", "capture_time_ns", "pose_sample_index", "pose_unix_ms", "pose_distance_ms", "valid", "pose_source"]
        bone_names = [f"{finger}0{joint}" for finger in ("thumb", "index", "middle", "ring", "little") for joint in (1, 2, 3)]
        fields += [f"{bone}_bend_deg" for bone in bone_names]
        fields += [f"{bone}_{axis}_deg" for bone in bone_names for axis in ("x", "y", "z")]
        fields += ["direction_error_deg"]
        max_direction_error, valid_frames = 0.0, 0
        with csv_path.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            for item in node_items("export-pose.mjs", source_path):
                instant = item["time_ns"]
                recording.set_time("tracking_time", duration=np.timedelta64(instant, "ns"))
                recording.set_time("capture_time", timestamp=np.datetime64(metadata["capture_start_ns"] + instant, "ns"))
                if item["valid"]:
                    valid_frames += 1
                    recording.log(f"{FLEXION_ENTITY}/status", rr.Clear(recursive=True))
                    for index, mesh in enumerate(item["meshes"]):
                        recording.log(f"{FLEXION_ENTITY}/mesh/{index}", rr.Mesh3D.from_fields(
                            vertex_positions=np.asarray(mesh["positions"], dtype=np.float32).reshape(-1, 3),
                            vertex_normals=np.asarray(mesh["normals"], dtype=np.float32).reshape(-1, 3),
                        ))
                    if item["directionErrorDeg"] is not None:
                        max_direction_error = max(max_direction_error, item["directionErrorDeg"])
                else:
                    recording.log(f"{FLEXION_ENTITY}/mesh", rr.Clear(recursive=True))
                    recording.log(f"{FLEXION_ENTITY}/status", rr.Points3D(
                        [[-0.45, 0.5, 0.2]], radii=0, colors=[180, 192, 204, 255], labels=["Tracking\nunavailable"], show_labels=True,
                    ))
                recording.log(f"{FLEXION_ENTITY}/tracking_valid", rr.Scalars(int(item["valid"])))
                writer.writerow({
                    "tracking_time_ns": instant, "capture_time_ns": metadata["capture_start_ns"] + instant,
                    **{key: item[key] for key in ("pose_sample_index", "pose_unix_ms", "pose_distance_ms", "valid", "pose_source")},
                    **item.get("bends", {}), **item.get("angles", {}),
                    "direction_error_deg": item["directionErrorDeg"] if item["valid"] else "",
                })
        if max_direction_error > 0.01:
            raise ValueError(f"Retargeted finger directions differ from source: {max_direction_error} degrees")
        flexion_metadata.update({"valid_frame_count": valid_frames, "missing_frame_count": flexion_metadata["frame_count"] - valid_frames,
                                "segment_direction_error_max_deg": max_direction_error})
    finally:
        recording.flush()
        # Finalize the file sink before hashing; its footer is written on disconnect.
        recording.disconnect()
    pressure_blueprint(metadata["camera_dimensions"], "video_estimate" in flexion_metadata, bool(pressure_metadata)).save(metadata["application_id"], blueprint_path)
    metadata.update({"source": "mixed", "pressure_source": "video_pose_estimate" if pressure_metadata else "simulated", "hand": "right", "fps": None if pressure_metadata else 10, "frame_count": frame_count,
                     "views": ["pressure", "flexion"], "flexion": flexion_metadata})
    assets = [("data", data_path), ("blueprint", blueprint_path), ("flexion_csv", csv_path)]
    if pressure_metadata:
        pressure_csv = output_dir / "right-hand-pressure.csv"
        with pressure_csv.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(pressure_rows[0]))
            writer.writeheader()
            writer.writerows(pressure_rows)
        samples_path = output_dir / "right-hand-pressure-samples.jsonl"
        samples_path.write_text("".join(json.dumps(sample, separators=(",", ":")) + "\n" for sample in pressure_samples))
        metadata["pressure"] = {**pressure_metadata, "units": "relative_0_100", "measured": False,
            "timeline": "Exact right-camera frame times plus a final endpoint hold",
            "pose_modulated_frames": sum(row["source"] == "video_contact_and_recorded_pose" and not row["endpoint_hold"] for row in pressure_rows),
            "video_only_frames": sum(row["source"] == "video_contact_only" and not row["endpoint_hold"] for row in pressure_rows)}
        assets += [("pressure_csv", pressure_csv), ("pressure_samples", samples_path)]
    for name, path in assets:
        metadata[name] = {"path": f"{asset_prefix.rstrip('/')}/{path.name}", "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    (output_dir / "right-hand-pressure.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-rrd", type=Path, required=True)
    parser.add_argument("--raw-pose", type=Path, required=True, help="Original episode directory with pose and camera sidecars")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "public/rerun")
    parser.add_argument("--asset-prefix", default="/rerun")
    parser.add_argument("--video-estimates", type=Path, help="Explicit visual-keyframe annotation JSON for missing native tracking")
    parser.add_argument("--pressure-profile", type=Path, help="Source-verified visual contact annotations for relative pressure simulation")
    args = parser.parse_args()
    build(args.base_rrd, args.raw_pose, args.output_dir, args.asset_prefix, args.video_estimates, args.pressure_profile)
