"""Package five independently timestamped task-clip videos for the sample-data viewer."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from fractions import Fraction
from pathlib import Path

import numpy as np
import rerun as rr
import rerun.blueprint as rrb

sys.path.insert(0, str(Path(__file__).parent / "glove-pressure"))
from pose_source import (INTRINSICS_SOURCE_FILES, aligned_camera_calibration, converter, load_intrinsics_profile,
                         project_synced_frames, read_pose_samples, validate_intrinsics_profile)

CAMERAS = {"left_camera": "Stereo left", "right_camera": "Stereo right", "left_side": "Left side", "right_side": "Right side", "back": "Back"}


def sha256(path: Path) -> str:
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def probe(path: Path) -> dict:
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_streams", "-show_packets",
        "-show_entries", "stream=codec_name,width,height,color_primaries,color_transfer,color_space,time_base:packet=pts,duration", "-of", "json", str(path),
    ]))


def read_timestamps(path: Path, duration_us: int) -> list[dict]:
    with path.open() as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError(f"Empty timestamp file: {path}")
    for row in rows:
        for key in ("frame_index", "t_sync_us", "presentation_time_us", "frame_duration_us", "source_frame_index", "repeated_source_frame"):
            row[key] = int(row[key])
    times = [row["t_sync_us"] for row in rows]
    if times[0] != 0 or any(b <= a for a, b in zip(times, times[1:])):
        raise ValueError(f"Expected strictly increasing rebased timestamps: {path}")
    if [row["frame_index"] for row in rows] != list(range(len(rows))):
        raise ValueError(f"Non-contiguous frame indices: {path}")
    if len({row["source_frame_index"] for row in rows}) != len(rows) or any(row["repeated_source_frame"] for row in rows):
        raise ValueError(f"Repeated source frames: {path}")
    if any(row["presentation_time_us"] != row["t_sync_us"] for row in rows):
        raise ValueError(f"Video and common PTS differ: {path}")
    ends = times[1:] + [duration_us]
    if any(row["frame_duration_us"] != end - row["t_sync_us"] for row, end in zip(rows, ends)):
        raise ValueError(f"Frame durations do not cover the shared interval: {path}")
    return rows


def verify_video(info: dict, rows: list[dict]) -> None:
    time_base = Fraction(info["streams"][0]["time_base"])
    packets = info["packets"]
    if len(packets) != len(rows):
        raise ValueError("Transcoding changed the number of video frames")
    for packet, row in zip(packets, rows):
        for actual, expected in (("pts", "presentation_time_us"), ("duration", "frame_duration_us")):
            value_us = Fraction(int(packet[actual])) * time_base * 1_000_000
            if abs(value_us - row[expected]) > 1:
                raise ValueError(f"Video {actual} differs from its source timestamp: {value_us} / {row[expected]}")


def transcode(source: Path, work: Path, name: str, duration_us: int) -> dict:
    video = source / f"{name}.mp4"
    rows = read_timestamps(source / f"{name}_timestamps.csv", duration_us)
    info = probe(video)
    verify_video(info, rows)
    stream = info["streams"][0]
    target = work / f"{name}.mp4"
    signature = {"source_sha256": sha256(video), "profile": "960w_h264_crf24_sdr709_vfr_v1"}
    marker = target.with_suffix(".json")
    if not target.exists() or not marker.exists() or json.loads(marker.read_text()) != signature:
        primaries, transfer = stream.get("color_primaries", "bt709"), stream.get("color_transfer", "bt709")
        scale = f"scale=960:-2:in_primaries={primaries}:in_transfer={transfer}:out_primaries=bt709:out_transfer=bt709:out_color_matrix=bt709:intent=perceptual,format=yuv420p"
        command = [
            "ffmpeg", "-v", "error", "-nostdin", "-y", "-threads", "2", "-i", str(video), "-map", "0:v:0", "-an",
            "-vf", scale, "-fps_mode", "passthrough", "-enc_time_base", "1:1000000",
            "-c:v", "libx264", "-threads", "2",
            "-preset", "fast", "-crf", "24", "-bf", "0", "-g", "30", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            # Preserve the source's final display interval as well as every PTS.
            "-bsf:v", f"setts=duration='if(eq(N,{len(rows)-1}),{rows[-1]['frame_duration_us']},DURATION)':time_base=1/1000000",
            "-video_track_timescale", "1000000", "-movflags", "+faststart", str(target),
        ]
        subprocess.run(command, check=True)
        verify_video(probe(target), rows)
        marker.write_text(json.dumps(signature))
    result = probe(target)
    verify_video(result, rows)
    if result["streams"][0]["codec_name"] != "h264":
        raise ValueError("Expected browser-compatible H.264")
    print(f"{name}: {len(rows)} frames; all PTS and durations preserved", flush=True)
    return {"name": name, "label": CAMERAS[name], "video": target, "rows": rows, "source_sha256": signature["source_sha256"],
            "width": result["streams"][0]["width"], "height": result["streams"][0]["height"]}


def camera_blueprint(cameras: list[dict]) -> rrb.Blueprint:
    views = [rrb.Spatial2DView(origin=f"camera/{camera['name']}", name=camera["label"],
                              visual_bounds=rrb.VisualBounds2D(x_range=[0, camera["width"]], y_range=[0, camera["height"]])) for camera in cameras]
    return rrb.Blueprint(
        rrb.Vertical(rrb.Horizontal(*views[:2], column_shares=[1, 1]), rrb.Horizontal(*views[2:], column_shares=[1, 1, 1]), row_shares=[1.5, 1]),
        rrb.TimePanel(state="collapsed", timeline="tracking_time"), auto_layout=False, auto_views=False,
    )


def build(source: Path, output: Path, work: Path, camera_extrinsics_convention: str = "recorded", intrinsics_profile_path: Path | None = None) -> None:
    sync = json.loads((source / "sync_manifest.json").read_text())
    intrinsics_profile = load_intrinsics_profile(source, intrinsics_profile_path) if intrinsics_profile_path else None
    episode = sync["episode"]
    duration_us = int(sync["duration_us"])
    work.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        cameras = list(pool.map(lambda name: transcode(source, work, name, duration_us), CAMERAS))
    projection_sources = [source / f"{name}_characteristics.json" for name in ("left_camera", "right_camera")]
    projection_sources += [source / "camera_pose_tracking.jsonl", source / "pose_samples.bin", source / "pose_schema.json"]
    fingerprint = hashlib.sha256((json.dumps([camera["source_sha256"] for camera in cameras]) + sha256(source / "sync_manifest.json") + json.dumps([sha256(path) for path in projection_sources]) + "five_camera_overlay_v6:" + camera_extrinsics_convention + (intrinsics_profile["sha256"] if intrinsics_profile else "")).encode()).hexdigest()[:12]
    application_id, recording_id = "five_camera_task_clip_v1", f"five_camera_{episode}_{fingerprint}"
    path = output / "recording.rrd"
    recording = rr.RecordingStream(application_id, recording_id=recording_id)
    recording.save(path)
    samples, joint_names = read_pose_samples(source)
    if "t_sync_us" not in samples.dtype.names:
        raise ValueError("This converter requires an aligned task clip with t_sync_us")
    origin_ns = int(sync["timeline_origin"]["unix_time_us"]) * 1000
    metadata = {"episode_id": episode, "title": "Five-camera task replay", "duration_seconds": duration_us / 1e6,
                "application_id": application_id, "recording_id": recording_id, "source": "task_clip",
                "timeline": "tracking_time", "duration_us": duration_us, "sync_manifest_sha256": sha256(source / "sync_manifest.json"),
                "external_alignment_estimate_seconds": sync["external_alignment"]["estimated_accuracy_seconds"],
                "pose_sample_count": len(samples), "pose_sha256": sha256(source / "pose_samples.bin"),
                "cameras": [{key: camera[key] for key in ("name", "label", "width", "height", "source_sha256")} |
                            {"frame_count": len(camera["rows"]), "first_frame_us": 0, "last_frame_us": camera["rows"][-1]["t_sync_us"]} for camera in cameras]}
    calibrations = {camera["name"]: aligned_camera_calibration(source, camera["name"], camera["width"], camera["height"], camera_extrinsics_convention, intrinsics_profile)
                    for camera in cameras if camera["name"] in ("left_camera", "right_camera")}
    # Materialize overlay projections first so the display-only gap-bridging counts can be
    # recorded in the static source metadata before it is logged.
    overlay_frames = {camera["name"]: list(project_synced_frames(source, camera["name"], calibrations[camera["name"]], samples, joint_names))
                      for camera in cameras if camera["name"] in calibrations}
    bridged_frames = {name: sum(1 for frame in frames if frame.pop("bridged", False)) for name, frames in overlay_frames.items()}
    metadata["hand_keypoints"] = {"source": "recorded_pose", "cameras": list(calibrations), "hands": ["left", "right"],
                                 "camera_extrinsics_convention": camera_extrinsics_convention,
                                 "alignment": "Per-camera t_sync_us, joints linearly interpolated between bracketing poses within 50 ms of the latency-corrected exposure query, per-exposure recorded head pose.",
                                 "gap_bridging": {"max_gap_ms": converter.BRIDGE_MAX_GAP_US // 1000, "bridged_frames": bridged_frames,
                                                  "method": "Short tracking dropouts bridged by image-space linear interpolation between the surrounding tracked frames. Display-only; recorded tracking is unchanged. Longer dropouts, stream edges and joints missing at either end stay cleared."},
                                 "external_views": "No spatial calibration available; no projected keypoints."}
    if intrinsics_profile:
        metadata["hand_keypoints"]["intrinsics_profile"] = intrinsics_profile
    try:
        recording.log("recording/source", rr.TextDocument(json.dumps(metadata)), static=True)
        recording.log("recording/hand_projection", rr.TextDocument(json.dumps(calibrations)), static=True)
        for camera in cameras:
            entity = f"camera/{camera['name']}/video"
            asset = rr.AssetVideo(path=camera["video"])
            pts = asset.read_frame_timestamps_nanos()
            times = np.asarray([row["t_sync_us"] * 1000 for row in camera["rows"]], dtype=np.int64)
            np.testing.assert_array_equal(pts, times)
            recording.log(entity, asset, static=True)
            recording.send_columns(entity, indexes=[rr.TimeColumn("tracking_time", duration=times.astype("timedelta64[ns]")),
                                                    rr.TimeColumn("capture_time", timestamp=(origin_ns + times).astype("datetime64[ns]"))],
                                   columns=rr.VideoFrameReference.columns_nanos(pts))
            if camera["name"] in calibrations:
                for frame in overlay_frames[camera["name"]]:
                    recording.set_time("tracking_time", duration=np.timedelta64(frame["time_ns"], "ns"))
                    recording.set_time("capture_time", timestamp=np.datetime64(origin_ns + frame["time_ns"], "ns"))
                    for hand, color in (("left", [45, 212, 191]), ("right", [244, 114, 182])):
                        overlay = f"camera/{camera['name']}/hand_pose/{hand}"
                        projected = frame["hands"][hand]
                        # Empty batches explicitly clear stale points and bones when tracking is lost.
                        recording.log(f"{overlay}/joints", rr.Points2D(projected["points"], radii=rr.Radius.ui_points(2.2), colors=color, draw_order=20))
                        recording.log(f"{overlay}/bones", rr.LineStrips2D(projected["bones"], radii=rr.Radius.ui_points(1.1), colors=color, draw_order=19))
        recording.log("world", rr.ViewCoordinates.RIGHT_HAND_Y_UP, static=True)
        for sample in samples:
            instant = int(sample["t_sync_us"]) * 1000
            recording.set_time("tracking_time", duration=np.timedelta64(instant, "ns"))
            recording.set_time("capture_time", timestamp=np.datetime64(origin_ns + instant, "ns"))
            valid = converter.valid_indices(int(sample["right_joint_valid_mask"]), len(joint_names))
            recording.log("world/hands/right/joints", rr.Points3D(converter.unity_position_to_rerun(sample["right_joints_xyz_xyzw"][valid, :3]), colors=[244, 114, 182]))
        # Include the final frame's display interval in the playback range.
        recording.set_time("tracking_time", duration=np.timedelta64(duration_us, "us"))
        recording.set_time("capture_time", timestamp=np.datetime64(origin_ns + duration_us * 1000, "ns"))
        recording.log("recording/end", rr.TextDocument("End of task clip"))
        recording.send_blueprint(camera_blueprint(cameras))
    finally:
        recording.flush()
        recording.disconnect()
    metadata["recording"] = {"path": f"/rerun/episodes/{episode}/recording.rrd", "sha256": sha256(path), "bytes": path.stat().st_size}
    (output / "manifest.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--work", type=Path, required=True)
    parser.add_argument("--camera-extrinsics-convention", choices=("recorded", "reflect-z"), default="recorded",
                        help="Explicit camera/head basis correction, applied once before projection; use only after episode validation.")
    parser.add_argument("--intrinsics-profile", type=Path, help="Verified episode-specific fixed intrinsics; source hashes must match.")
    args = parser.parse_args()
    build(args.source, args.output, args.work, args.camera_extrinsics_convention, args.intrinsics_profile)
