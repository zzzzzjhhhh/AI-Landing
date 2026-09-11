"""Verify generated data, measured-pose frame alignment, missing tracking and angle exports."""
import argparse
import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from rerun.experimental import RrdReader

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[2] / "public/rerun")
parser.add_argument("--raw-pose", type=Path, help="Optional original task clip for exact head-height sample verification")
args = parser.parse_args()
manifest = json.loads((args.output_dir / "right-hand-pressure.json").read_text())
estimated_pressure = manifest["pressure_source"] == "video_pose_estimate"
for asset in ("data", "blueprint", "flexion_csv", *(["pressure_csv", "pressure_samples"] if estimated_pressure else [])):
    assert hashlib.sha256((args.output_dir / Path(manifest[asset]["path"]).name).read_bytes()).hexdigest() == manifest[asset]["sha256"]
reader = RrdReader(args.output_dir / "right-hand-pressure.rrd")
entry, = reader.recordings()
assert entry.application_id == manifest["application_id"] and entry.recording_id == manifest["recording_id"]
assert manifest["pressure_source"] in ("simulated", "video_pose_estimate") and manifest["hand"] == "right"
assert manifest["flexion"]["source"] in ("recorded_pose_keypoints", "recorded_pose_with_visual_video_estimates")
if manifest["flexion"]["overlay_reprojection_max_px"] is not None:
    assert manifest["flexion"]["overlay_reprojection_max_px"] <= 0.001
with (args.output_dir / "right-hand-flexion.csv").open() as handle:
    rows = list(csv.DictReader(handle))
csv_times = [int(row["tracking_time_ns"]) for row in rows]
assert len(rows) == manifest["flexion"]["frame_count"] and np.all(np.diff(csv_times) > 0)
valid_rows = [row for row in rows if row["valid"] == "True"]
valid_times = sorted(int(row["tracking_time_ns"]) for row in valid_rows)
missing_times = {int(row["tracking_time_ns"]) for row in rows if row["valid"] == "False"}
assert len(valid_rows) == manifest["flexion"]["valid_frame_count"]
assert len(missing_times) == manifest["flexion"]["missing_frame_count"]
for row in rows:
    assert int(row["capture_time_ns"]) - int(row["tracking_time_ns"]) == manifest["capture_start_ns"]
for row in valid_rows:
    if row.get("pose_source", "recorded_pose") == "recorded_pose":
        assert float(row["pose_distance_ms"]) <= 50
        assert float(row["direction_error_deg"]) < 0.01
    else:
        assert row["pose_source"] == "visual_video_estimate"
        assert row["pose_sample_index"] == row["pose_distance_ms"] == row["direction_error_deg"] == ""
    assert all(np.isfinite(float(value)) for name, value in row.items() if name.endswith("_deg") and value != "")
pressure_times, mesh_times, cleared_times, status_times = [], [], set(), []
pressure_visible_counts, pressure_status_times, pressure_levels = {}, [], {}
mesh_count = 0
for chunk in reader.store().stream().to_chunks():
    path = str(chunk.entity_path)
    assert path.startswith(("/demo/glove_pressure/right", "/derived/hand_flexion/right")), path
    if "/mesh/" in path:
        mesh_count += 1
    if chunk.is_static:
        continue
    batch = chunk.to_record_batch()
    tracking = batch["tracking_time"].cast("int64").to_numpy()
    capture = batch["capture_time"].cast("int64").to_numpy()
    np.testing.assert_array_equal(capture - tracking, np.full(len(tracking), manifest["capture_start_ns"]))
    if path == "/demo/glove_pressure/right/pressure":
        pressure_times.extend(tracking.tolist())
        for instant, points in zip(tracking.tolist(), batch["Points3D:positions"].to_pylist()):
            pressure_visible_counts[instant] = len(points)
    elif path == "/demo/glove_pressure/right/status":
        pressure_status_times.extend(tracking.tolist())
    elif path.startswith("/demo/glove_pressure/right/relative/"):
        region = path.rsplit("/", 1)[1]
        pressure_levels.setdefault(region, {}).update(zip(tracking.tolist(), [v[0] for v in batch["Scalars:scalars"].to_pylist()]))
    elif path.startswith("/derived/hand_flexion/right/mesh/"):
        mesh_times.extend(tracking.tolist())
    elif path == "/derived/hand_flexion/right/mesh":
        assert "Clear:is_recursive" in batch.schema.names
        cleared_times.update(tracking.tolist())
    elif path.endswith("/tracking_valid"):
        status_times.extend(tracking.tolist())
    for field, column in zip(batch.schema, batch.columns):
        if "positions" in field.name or "normals" in field.name:
            for row in column.to_pylist():
                assert np.isfinite(np.asarray(row)).all()
assert mesh_count > 0
pressure_times.sort()
assert len(pressure_times) == manifest["frame_count"]
assert pressure_times[0] == 0 and pressure_times[-1] == manifest["duration_ns"]
assert np.all(np.diff(pressure_times) > 0)
if not estimated_pressure:
    assert np.max(np.diff(pressure_times)) <= 100_000_000
if estimated_pressure:
    assert manifest["pressure"]["measured"] is False and manifest["pressure"]["units"] == "relative_0_100"
    assert pressure_times == sorted(set(csv_times + [manifest["duration_ns"]]))
    assert sorted(pressure_status_times) == pressure_times
    samples = [json.loads(line) for line in (args.output_dir / "right-hand-pressure-samples.jsonl").read_text().splitlines()]
    pressure_rows = list(csv.DictReader((args.output_dir / "right-hand-pressure.csv").open()))
    assert len(samples) == len(pressure_rows) == len(pressure_times)
    assert [sample["tracking_time_ns"] for sample in samples] == pressure_times
    pose_by_time = {int(row["tracking_time_ns"]): row for row in rows}
    source_counts = {"video_contact_and_recorded_pose": 0, "video_contact_only": 0}
    for sample, row in zip(samples, pressure_rows):
        instant = sample["tracking_time_ns"]
        assert sample["capture_time_ns"] - instant == manifest["capture_start_ns"]
        assert int(row["tracking_time_ns"]) == instant and int(row["capture_time_ns"]) == sample["capture_time_ns"]
        assert row["source"] == sample["source"] and row["phase"] == sample["phase"]
        assert len(sample["matrix"]) == 460 and all(isinstance(v, int) and 0 <= v <= 255 for v in sample["matrix"])
        assert 0 <= sample["peak"] <= 100 and float(row["peak_relative_0_100"]) == sample["peak"]
        assert abs(sample["peak"] - max(sample["matrix"]) / 255 * 100) < .051
        for region, level in sample["levels"].items():
            assert 0 <= level <= 100
            assert abs(pressure_levels[region][instant] - level) < .001
            assert float(row[f"{region}_relative_0_100"]) == level
        if sample["contact_strength"] == 0:
            assert not any(sample["matrix"]), "No-contact frames must be unloaded"
            assert pressure_visible_counts[instant] == 0, "Release must clear the pressure cloud"
        if not sample["endpoint_hold"]:
            pose = pose_by_time[instant]
            source_counts[sample["source"]] += 1
            if sample["source"] == "video_contact_and_recorded_pose":
                assert pose["valid"] == "True" and pose["pose_source"] == "recorded_pose"
                assert sample["pose_sample_index"] == int(pose["pose_sample_index"])
            else:
                assert sample["pose_sample_index"] is None
    assert source_counts["video_contact_and_recorded_pose"] == manifest["pressure"]["pose_modulated_frames"]
    assert source_counts["video_contact_only"] == manifest["pressure"]["video_only_frames"]
    print(f"Verified {len(samples)} estimated-pressure frames, region scalars, 23x20 matrices, source labels and release clearing.")
assert sorted(mesh_times) == valid_times
assert sorted(status_times) == csv_times
assert cleared_times == missing_times | {0}, "Missing tracking must clear the last displayed mesh"
print(f"Verified {len(rows)} video-aligned flexion frames ({len(valid_rows)} valid / {len(missing_times)} cleared), angle CSV, finite meshes and both clocks.")
if "dashboard" in manifest:
    from dashboard_layout import verify_dashboard
    verify_dashboard(args.output_dir, args.raw_pose)
