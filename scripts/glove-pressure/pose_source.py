"""Bind original right-hand samples to the exact frames already shown by Rerun."""
import csv
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from rerun.experimental import RrdReader

spec = importlib.util.spec_from_file_location("pico_converter", Path(__file__).parents[1] / "convert-pico-raw-to-rerun.py")
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)

INTRINSICS_SOURCE_FILES = ("sync_manifest.json", "pose_samples.bin", "pose_schema.json", "camera_pose_tracking.jsonl",
                           "left_camera_characteristics.json", "right_camera_characteristics.json",
                           "left_camera_timestamps.csv", "right_camera_timestamps.csv", "left_camera.mp4", "right_camera.mp4")


def validate_intrinsics_profile(raw: Path, profile: dict) -> None:
    if profile.get("version") != 1 or profile.get("episode_id") != json.loads((raw / "sync_manifest.json").read_text())["episode"]:
        raise ValueError("Intrinsics profile belongs to a different episode or version")
    for name in INTRINSICS_SOURCE_FILES:
        with (raw / name).open("rb") as handle:
            digest = hashlib.file_digest(handle, "sha256").hexdigest()
        if profile.get("source_sha256", {}).get(name) != digest:
            raise ValueError(f"Intrinsics profile source mismatch: {name}")
    if set(profile.get("cameras", {})) != {"left_camera", "right_camera"}:
        raise ValueError("Expected fixed intrinsics for both PICO cameras")
    for camera in profile["cameras"].values():
        size = np.asarray([camera["width"], camera["height"]], dtype=float)
        focal, center = np.asarray(camera["focal_length"]), np.asarray(camera["principal_point"])
        if focal.shape != (2,) or center.shape != (2,) or not np.isfinite([size, focal, center]).all() or np.any(size <= 0) or np.any(focal <= 0) or np.any(center < 0) or np.any(center >= size):
            raise ValueError("Invalid fixed intrinsics")


def load_intrinsics_profile(raw: Path, path: Path) -> dict:
    profile = json.loads(path.read_text())
    validate_intrinsics_profile(raw, profile)
    return {**profile, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def read_pose_samples(raw: Path):
    schema = json.loads((raw / "pose_schema.json").read_text())
    if schema["record_size_bytes"] not in (1500, 1508) or schema["byte_order"] != "little_endian":
        raise ValueError("Unsupported raw pose schema")
    names = schema["joint_order"]
    if len(names) != 26 or names[0] != "Wrist":
        raise ValueError("Expected named PICO 26-joint schema")
    dtype = converter.pose_dtype()
    if schema["record_size_bytes"] == 1508:
        if not any(field["name"] == "t_sync_us" and field["offset_bytes"] == 1500 for field in schema["record_layout"]):
            raise ValueError("Expected appended clip-relative timestamp")
        dtype = np.dtype({"names": [*dtype.names, "t_sync_us"], "formats": [*[dtype.fields[name][0] for name in dtype.names], "<i8"],
                          "offsets": [*[dtype.fields[name][1] for name in dtype.names], 1500], "itemsize": 1508})
    samples = np.memmap(raw / "pose_samples.bin", dtype=dtype, mode="r")
    return samples, names


def aligned_camera_calibration(raw: Path, camera_name: str, width: int, height: int, extrinsics_convention: str = "recorded", intrinsics_profile: dict | None = None) -> dict:
    calibration = json.loads((raw / f"{camera_name}_characteristics.json").read_text())
    calibration["recorded_extrinsics"] = calibration["extrinsics"]
    calibration["extrinsics"] = converter.convert_camera_extrinsics(calibration["extrinsics"], extrinsics_convention)
    calibration["extrinsics_convention"] = extrinsics_convention
    scale = [width / calibration["width"], height / calibration["height"]]
    for field in ("focal_length", "principal_point"):
        calibration["intrinsics"][field] = [value * factor for value, factor in zip(calibration["intrinsics"][field], scale)]
    calibration.update(width=width, height=height, calibration_source="recorded_scaled_video")
    if intrinsics_profile:
        calibration["recorded_intrinsics"] = json.loads((raw / f"{camera_name}_characteristics.json").read_text())["intrinsics"]
        refined = intrinsics_profile["cameras"][camera_name]
        factors = [width / refined["width"], height / refined["height"]]
        calibration["intrinsics"] = {field: [float(value * factor) for value, factor in zip(refined[field], factors)]
                                      for field in ("focal_length", "principal_point")}
        calibration["calibration_source"] = "episode_refined_intrinsics"
        calibration["intrinsics_profile_sha256"] = intrinsics_profile["sha256"]
    return calibration


def project_synced_frames(raw: Path, camera_name: str, calibration: dict, samples, names):
    """Project each camera exposure using its own head pose and the shared pose clock."""
    with (raw / f"{camera_name}_timestamps.csv").open() as handle:
        rows = list(csv.DictReader(handle))
    side = camera_name.removesuffix("_camera")
    camera_rows = {int(row["frame_index"]): row for row in converter.read_jsonl(raw / "camera_pose_tracking.jsonl") if row["side"] == side}
    times = np.asarray([int(row["t_sync_us"]) for row in rows], dtype=np.int64)
    indices = converter.nearest_indices(samples["t_sync_us"], times)
    width, height = calibration["width"], calibration["height"]
    for row, instant, index in zip(rows, times, indices):
        camera_row = camera_rows[int(row["frame_index"])]
        if int(camera_row["t_sync_us"]) != instant:
            raise ValueError("Camera head pose does not match its video exposure")
        head = np.asarray([*camera_row["head"]["position"], *camera_row["head"]["rotation_xyzw"]])
        sample = samples[index]
        error = abs(int(sample["t_sync_us"]) - int(instant))
        hands = {}
        for hand in ("left", "right"):
            mask = int(sample[f"{hand}_joint_valid_mask"]) if error <= 50_000 else 0
            projected = converter.project_hand_to_video(sample[f"{hand}_joints_xyz_xyzw"][:, :3], mask, head, calibration)
            hands[hand] = {
                "points": np.asarray([point for point in projected.values() if 0 <= point[0] <= width - 1 and 0 <= point[1] <= height - 1], dtype=np.float32).reshape(-1, 2),
                "bones": converter.projected_bone_strips(projected, names, width, height),
            }
        yield {"time_ns": int(instant) * 1000, "pose_sample_index": int(index), "pose_distance_us": error, "hands": hands}


def export_source(base: Path, raw: Path, target: Path) -> dict:
    samples, names = read_pose_samples(raw)
    if "t_sync_us" in samples.dtype.names:
        return export_synced_source(base, raw, target, samples, names)
    times_ms = samples["t_unix_ms"]
    if not len(samples) or np.any(np.diff(times_ms) <= 0):
        raise ValueError("Pose times must be strictly increasing")
    start_ms = int(times_ms[0])
    frame_times, world, overlays = [], {}, {}
    calibration = None
    for chunk in RrdReader(base).store().stream().to_chunks():
        path = str(chunk.entity_path)
        if path not in ("/camera/right/video", "/world/hands/right/joints", "/camera/right/hand_pose/right/joints", "/recording/camera_calibration"):
            continue
        batch = chunk.to_record_batch()
        if path == "/recording/camera_calibration":
            calibration = json.loads(batch["TextDocument:text"][0].as_py()[0])["right"]
        if chunk.is_static:
            continue
        instants = batch["tracking_time"].cast("int64").to_pylist()
        if path == "/camera/right/video":
            frame_times.extend(instants)
        elif path == "/world/hands/right/joints":
            world.update(zip(instants, batch["Points3D:positions"].to_pylist()))
        else:
            overlays.update(zip(instants, batch["Points2D:positions"].to_pylist()))
    if not frame_times or calibration is None:
        raise ValueError("Base recording is missing right-camera video/calibration")
    # Fail closed if this raw file is from a different episode or joint ordering.
    if len(world) != len(samples):
        raise ValueError("Raw pose count differs from the base recording")
    for sample in samples:
        instant = (int(sample["t_unix_ms"]) - start_ms) * 1_000_000
        valid = converter.valid_indices(int(sample["right_joint_valid_mask"]), 26)
        expected = converter.unity_position_to_rerun(sample["right_joints_xyz_xyzw"][valid, :3])
        observed = np.asarray(world.get(instant, []), dtype=np.float32).reshape(-1, 3)
        if expected.shape != observed.shape or not np.allclose(expected, observed, atol=1e-7, rtol=0):
            raise ValueError(f"Raw right-hand pose differs from base RRD at {instant}")
    frame_times = np.asarray(sorted(set(frame_times)), dtype=np.int64)
    frame_ms = start_ms + frame_times // 1_000_000
    indices = converter.nearest_indices(times_ms, frame_ms)
    distance_ms = abs(times_ms[indices] - frame_ms)
    available = (frame_ms >= times_ms[0]) & (frame_ms <= times_ms[-1]) & (distance_ms <= 50)
    camera_times = converter.read_camera_timestamps(raw / "right_camera_timestamps.csv")
    source_frames = {int(t): int(i) for t, i in zip(camera_times["t_unix_ms"], camera_times["frame_index"])}
    camera_rows = {int(row["frame_index"]): row for row in converter.read_jsonl(raw / "camera_pose_tracking.jsonl") if row.get("side") == "right"}
    valid_count, max_projection_error = 0, 0.0
    with target.open("w") as output:
        for instant, unix_ms, index, valid, distance in zip(frame_times, frame_ms, indices, available, distance_ms):
            sample = samples[index]
            mask = int(sample["right_joint_valid_mask"])
            # Confirm the exact same source sample produces the displayed 2D keypoints.
            if valid:
                row = camera_rows.get(source_frames[int(unix_ms)])
                head = sample["head_pose_xyz_xyzw"] if row is None else np.asarray([*row["head"]["position"], *row["head"]["rotation_xyzw"]])
                projected = converter.project_hand_to_video(sample["right_joints_xyz_xyzw"][:, :3], mask, head, calibration)
                expected = np.asarray([point for point in projected.values() if 0 <= point[0] <= calibration["width"] - 1 and 0 <= point[1] <= calibration["height"] - 1], dtype=np.float32).reshape(-1, 2)
                observed = np.asarray(overlays.get(int(instant), []), dtype=np.float32).reshape(-1, 2)
                if expected.shape != observed.shape or not np.allclose(expected, observed, atol=0.001, rtol=0):
                    raise ValueError(f"Source pose does not reproduce right-camera keypoints at {instant}")
                if expected.size:
                    max_projection_error = max(max_projection_error, float(abs(expected - observed).max()))
            valid = bool(valid and mask == (1 << 26) - 1)
            valid_count += valid
            positions = converter.unity_position_to_rerun(sample["right_joints_xyz_xyzw"][:, :3])
            output.write(json.dumps({
                "time_ns": int(instant), "pose_sample_index": int(index), "pose_unix_ms": int(times_ms[index]),
                "pose_distance_ms": int(distance), "valid": valid,
                "joints": dict(zip(names, positions.tolist())) if valid else None,
            }) + "\n")
    return {
        "source": "recorded_pose_keypoints", "reference_camera": "right", "pose_sample_count": len(samples),
        "frame_count": len(frame_times), "valid_frame_count": valid_count, "missing_frame_count": len(frame_times) - valid_count,
        "pose_distance_max_ms": int(distance_ms[available].max()), "overlay_reprojection_max_px": max_projection_error,
        "pose_sha256": hashlib.sha256((raw / "pose_samples.bin").read_bytes()).hexdigest(),
        "schema_sha256": hashlib.sha256((raw / "pose_schema.json").read_bytes()).hexdigest(),
        "alignment": "Same nearest raw sample and frame timestamps as the right-camera keypoint overlay; maximum distance 50 ms.",
    }


def export_synced_source(base: Path, raw: Path, target: Path, samples, names) -> dict:
    """Use the task clip's explicit common clock, not its unre-based Unix camera fields."""
    pose_times = samples["t_sync_us"]
    if not len(samples) or np.any(np.diff(pose_times) <= 0):
        raise ValueError("Aligned pose timestamps must be strictly increasing")
    frame_times, world, overlays = [], {}, {}
    calibrations = None
    for chunk in RrdReader(base).store().stream().to_chunks():
        path = str(chunk.entity_path)
        if path == "/recording/hand_projection":
            calibrations = json.loads(chunk.to_record_batch()["TextDocument:text"][0].as_py()[0])
        if chunk.is_static or path not in ("/camera/right_camera/video", "/world/hands/right/joints", "/camera/right_camera/hand_pose/right/joints"):
            continue
        batch = chunk.to_record_batch()
        instants = batch["tracking_time"].cast("int64").to_pylist()
        if path.endswith("/video"):
            frame_times.extend(instants)
        elif path == "/world/hands/right/joints":
            world.update(zip(instants, batch["Points3D:positions"].to_pylist()))
        else:
            overlays.update(zip(instants, batch["Points2D:positions"].to_pylist()))
    if not frame_times or len(world) != len(samples):
        raise ValueError("Aligned source does not match the recording")
    for sample in samples:
        valid = converter.valid_indices(int(sample["right_joint_valid_mask"]), 26)
        expected = converter.unity_position_to_rerun(sample["right_joints_xyz_xyzw"][valid, :3])
        observed = np.asarray(world.get(int(sample["t_sync_us"]) * 1000, []), dtype=np.float32).reshape(-1, 3)
        if expected.shape != observed.shape or not np.array_equal(expected, observed):
            raise ValueError("Aligned source joints differ from the base recording")
    frame_times = np.asarray(sorted(set(frame_times)), dtype=np.int64)
    with (raw / "right_camera_timestamps.csv").open() as handle:
        source_times = np.asarray([int(row["t_sync_us"]) * 1000 for row in csv.DictReader(handle)], dtype=np.int64)
    np.testing.assert_array_equal(frame_times, source_times)
    indices = converter.nearest_indices(pose_times, frame_times // 1000)
    errors = abs(pose_times[indices] - frame_times // 1000)
    max_projection_error = None
    if calibrations is not None:
        projected_frames = list(project_synced_frames(raw, "right_camera", calibrations["right_camera"], samples, names))
        np.testing.assert_array_equal([frame["time_ns"] for frame in projected_frames], frame_times)
        np.testing.assert_array_equal([frame["pose_sample_index"] for frame in projected_frames], indices)
        if set(overlays) != set(frame_times):
            raise ValueError("Right-camera keypoints must update on every video frame")
        max_projection_error = 0.0
        for frame in projected_frames:
            expected = frame["hands"]["right"]["points"]
            observed = np.asarray(overlays[frame["time_ns"]], dtype=np.float32).reshape(-1, 2)
            np.testing.assert_allclose(observed, expected, atol=0.001, rtol=0)
            if expected.size:
                max_projection_error = max(max_projection_error, float(abs(expected - observed).max()))
    valid_count = 0
    with target.open("w") as output:
        for instant, index, error in zip(frame_times, indices, errors):
            sample = samples[index]
            valid = bool(error <= 50_000 and int(sample["right_joint_valid_mask"]) == (1 << 26) - 1)
            valid_count += valid
            positions = converter.unity_position_to_rerun(sample["right_joints_xyz_xyzw"][:, :3])
            output.write(json.dumps({"time_ns": int(instant), "pose_sample_index": int(index), "pose_unix_ms": int(sample["t_unix_ms"]),
                                     "pose_distance_ms": float(error / 1000), "valid": valid,
                                     "joints": dict(zip(names, positions.tolist())) if valid else None}) + "\n")
    return {"source": "recorded_pose_keypoints", "reference_camera": "right_camera", "pose_sample_count": len(samples),
            "camera_extrinsics_convention": calibrations["right_camera"].get("extrinsics_convention", "recorded") if calibrations else None,
            "intrinsics_profile_sha256": calibrations["right_camera"].get("intrinsics_profile_sha256") if calibrations else None,
            "frame_count": len(frame_times), "valid_frame_count": valid_count, "missing_frame_count": len(frame_times) - valid_count,
            "pose_distance_max_ms": float(errors.max() / 1000), "overlay_reprojection_max_px": max_projection_error,
            "pose_sha256": hashlib.sha256((raw / "pose_samples.bin").read_bytes()).hexdigest(),
            "schema_sha256": hashlib.sha256((raw / "pose_schema.json").read_bytes()).hexdigest(),
            "alignment": "Exact right-camera frame timestamps on the task clip t_sync_us clock; nearest original pose within 50 ms." +
                         (" The same raw samples reproduce the right-camera keypoints using the selected camera calibration and recorded exposure head pose." if calibrations is not None else " No 2D reprojection calibration is assumed.")}
