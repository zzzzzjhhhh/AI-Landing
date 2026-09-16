"""Build a reversible Rerun overlay for reviewed 165650 visual Pressure.

The original hand RRD, CSV, and metadata remain untouched. The app sends this
recording after the original, replacing only the right Pressure presentation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
import rerun as rr


ENTITY = "demo/glove_pressure/right"


def digest(path: Path) -> str:
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def build(args: argparse.Namespace) -> None:
    original = json.loads(args.hand_manifest.read_text())
    episode = json.loads(args.episode_manifest.read_text())
    if episode["episode_id"] != "20260911_165650" or original["recording_id"] != episode["recording_id"]:
        raise ValueError("This visual patch only belongs to the reviewed 165650 recording")
    expected_clock = original["pressure"]["source_files"]["right_camera_timestamps.csv"]
    if digest(args.timestamps) != expected_clock:
        raise ValueError("Right-camera timeline differs from the original pressure recording")
    for path, expected_count in ((args.first, 41), (args.second, 45)):
        with path.open() as handle:
            if sum(1 for _ in handle) != expected_count:
                raise ValueError(f"Wrong visual review sample count: {path}")
    output = args.output
    output.mkdir(parents=True, exist_ok=True)
    recording_path = output / "visual-pressure-override.rrd"
    command = ["node", str(Path(__file__).with_name("export-visual-pressure-override.mjs")),
               str(args.first), str(args.second), str(args.timestamps), str(original["duration_ns"])]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, text=True)
    recording = rr.RecordingStream(original["application_id"], recording_id=original["recording_id"], send_properties=False)
    recording.save(recording_path)
    recording.log(f"{ENTITY}/provenance", rr.TextDocument(
        "VISUAL CONTACT ESTIMATE, NOT measured force or glove pressure. "
        "86 independently reviewed synchronized stereo samples at 0.5 s spacing; "
        "intermediate frames interpolate only within contact intervals, with a short pre-release fade. "
        "Unknown or occluded contact remains an unasserted estimate. "
        "The original pose, flexion and pressure RRD remain unchanged on disk."
    ), static=True)
    count = active = previous = 0
    try:
        assert process.stdout is not None
        for line in process.stdout:
            frame = json.loads(line)
            instant = int(frame["time_ns"])
            if count and instant <= previous or instant > original["duration_ns"]:
                raise ValueError("Pressure override time sequence is invalid")
            if frame["frame_index"] != count:
                raise ValueError("Pressure override frame index is invalid")
            previous = instant
            recording.set_time("tracking_time", duration=np.timedelta64(instant, "ns"))
            recording.set_time("capture_time", timestamp=np.datetime64(original["capture_start_ns"] + instant, "ns"))
            # Same entity and timestamps as the old panel; the later-sent patch
            # clears stale points at no-contact frames before logging new data.
            recording.log(f"{ENTITY}/pressure", rr.Clear(recursive=False))
            if frame["positions"]:
                recording.log(f"{ENTITY}/pressure", rr.Points3D(
                    np.asarray(frame["positions"], dtype=np.float32).reshape(-1, 3),
                    colors=np.asarray(frame["colors"], dtype=np.uint8).reshape(-1, 4), radii=0.023))
                active += 1
            status = f"VISUAL {frame['contact_state']} · {frame['peak_relative_0_100']:.0f}/100"
            recording.log(f"{ENTITY}/status", rr.Points3D(
                [[-0.45, -2.65, 0.9]], radii=0, colors=[180, 213, 222, 255],
                labels=[status], show_labels=True))
            for region, level in frame["levels"].items():
                recording.log(f"{ENTITY}/relative/{region}", rr.Scalars(level))
            count += 1
        if process.wait() != 0:
            raise RuntimeError("Visual-pressure frame export failed")
        if count != 1143 or previous != original["duration_ns"]:
            raise ValueError(f"Expected 1142 source exposures plus endpoint; got {count}")
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()
        recording.flush()
        recording.disconnect()
    metadata = {
        "episode_id": episode["episode_id"], "recording_id": original["recording_id"],
        "source": "reviewed_stereo_visual_pressure_contact_gated_display_interpolation",
        "sample_count": 86, "right_camera_frames": 1142, "override_frames": count,
        "active_frames": active, "measured": False, "force_units": None,
        "source_files": {"first_review": digest(args.first), "second_review": digest(args.second),
                         "right_camera_timestamps": expected_clock,
                         "original_hand_rrd": original["data"]["sha256"]},
        "data": {"path": f"/rerun/episodes/{episode['episode_id']}/visual-pressure-override.rrd",
                 "sha256": digest(recording_path), "bytes": recording_path.stat().st_size},
        "rollback": "Remove pressure_override from sample-episodes.ts; original right-hand-pressure.rrd is unchanged.",
    }
    (output / "visual-pressure-override.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"ALL COMPLETED {episode['episode_id']}: {count} timeline frames, {active} estimated-contact frames, {recording_path.stat().st_size} RRD bytes", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hand-manifest", type=Path, required=True)
    parser.add_argument("--episode-manifest", type=Path, required=True)
    parser.add_argument("--timestamps", type=Path, required=True)
    parser.add_argument("--first", type=Path, required=True)
    parser.add_argument("--second", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    build(parser.parse_args())
