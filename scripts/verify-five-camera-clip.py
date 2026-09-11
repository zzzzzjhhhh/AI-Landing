"""Check native RRD frame references against each independent task-clip clock."""
import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from rerun.experimental import RrdReader

sys.path.insert(0, str(Path(__file__).parent / "glove-pressure"))
from pose_source import aligned_camera_calibration, project_synced_frames, read_pose_samples, validate_intrinsics_profile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--source", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
manifest = json.loads((args.output / "manifest.json").read_text())
path = args.output / "recording.rrd"
assert hashlib.sha256(path.read_bytes()).hexdigest() == manifest["recording"]["sha256"]
reader = RrdReader(path)
entry, = reader.recordings()
assert (entry.application_id, entry.recording_id) == (manifest["application_id"], manifest["recording_id"])
times, pts, assets, overlays, recorded_calibrations = {}, {}, set(), {}, None
for chunk in reader.store().stream().to_chunks():
    entity = str(chunk.entity_path)
    if entity == "/recording/hand_projection":
        recorded_calibrations = json.loads(chunk.to_record_batch()["TextDocument:text"][0].as_py()[0])
    if "/hand_pose/" in entity and not chunk.is_static:
        batch = chunk.to_record_batch()
        field = "Points2D:positions" if entity.endswith("/joints") else "LineStrips2D:strips"
        overlays.setdefault(entity, {}).update(zip(batch["tracking_time"].cast("int64").to_pylist(), batch[field].to_pylist()))
    if not entity.startswith("/camera/") or not entity.endswith("/video"):
        continue
    name = entity.split("/")[2]
    batch = chunk.to_record_batch()
    if chunk.is_static:
        assert "AssetVideo:blob" in batch.schema.names
        assets.add(name)
    else:
        times.setdefault(name, []).extend(batch["tracking_time"].cast("int64").to_pylist())
        pts.setdefault(name, []).extend(int(row[0]) for row in batch["VideoFrameReference:timestamp"].to_pylist())
assert assets == {camera["name"] for camera in manifest["cameras"]}
for camera in manifest["cameras"]:
    name = camera["name"]
    with (args.source / f"{name}_timestamps.csv").open() as handle:
        rows = list(csv.DictReader(handle))
    expected = [int(row["t_sync_us"]) * 1000 for row in rows]
    ordered = sorted(zip(times[name], pts[name]))
    assert len(ordered) == camera["frame_count"]
    np.testing.assert_array_equal([t for t, _ in ordered], expected)
    np.testing.assert_array_equal([p for _, p in ordered], expected)
assert times["left_camera"] != times["right_camera"], "The right camera must retain its own exposure sequence"
print("Verified five distinct native video assets and every frame reference against the source's independent timestamps.")
if "hand_keypoints" in manifest:
    samples, names = read_pose_samples(args.source)
    profile = manifest["hand_keypoints"].get("intrinsics_profile")
    if profile:
        validate_intrinsics_profile(args.source, profile)
    expected_entities = set()
    for camera in manifest["cameras"]:
        name = camera["name"]
        if name not in manifest["hand_keypoints"]["cameras"]:
            continue
        convention = manifest["hand_keypoints"].get("camera_extrinsics_convention", "recorded")
        calibration = aligned_camera_calibration(args.source, name, camera["width"], camera["height"], convention, profile)
        if "camera_extrinsics_convention" in manifest["hand_keypoints"]:
            assert recorded_calibrations[name] == calibration, "Recording must retain the original and effective extrinsics"
        for frame in project_synced_frames(args.source, name, calibration, samples, names):
            for hand, projection in frame["hands"].items():
                for component, data, shape in (("joints", projection["points"], (-1, 2)), ("bones", projection["bones"], (-1, 2, 2))):
                    entity = f"/camera/{name}/hand_pose/{hand}/{component}"
                    expected_entities.add(entity)
                    assert set(overlays[entity]) == set(times[name])
                    actual = np.asarray(overlays[entity][frame["time_ns"]], dtype=np.float32).reshape(shape)
                    np.testing.assert_allclose(actual, np.asarray(data, dtype=np.float32).reshape(shape), atol=0.001, rtol=0)
    assert set(overlays) == expected_entities
    print("Verified both hands' keypoints and clipped bones on every PICO exposure, including empty tracking frames; no uncalibrated external overlays.")
