"""Combine explicitly approximate visual keyframes with valid native hand tracking."""
import bisect
import hashlib
import json
from pathlib import Path


def estimate_angles(time_s: float, annotations: dict):
    keys = annotations["keyframes"]
    times = [key["time_s"] for key in keys]
    if any(b <= a for a, b in zip(times, times[1:])):
        raise ValueError("Video estimate keyframes must be strictly increasing")
    if time_s < times[0] or time_s > times[-1]:
        return None
    left = max(0, bisect.bisect_right(times, time_s) - 1)
    right = min(left + 1, len(keys) - 1)
    a, b = keys[left], keys[right]
    if a["pose"] is None or b["pose"] is None:
        return None
    fraction = (time_s - times[left]) / (times[right] - times[left]) if right != left else 0
    profiles = annotations["profiles"]
    angles = {}
    for finger in ("thumb", "index", "middle", "ring", "little"):
        for joint, (x, y) in enumerate(zip(profiles[a["pose"]][finger], profiles[b["pose"]][finger]), start=1):
            if not 0 <= x <= 100 or not 0 <= y <= 100:
                raise ValueError("Visual estimate angles must be plausible hinge values")
            angles[f"{finger}0{joint}_z_deg"] = x + (y - x) * fraction
    return angles


def merge_video_estimates(raw: Path, frames_path: Path, annotations_path: Path, metadata: dict) -> None:
    annotations = json.loads(annotations_path.read_text())
    sync = json.loads((raw / "sync_manifest.json").read_text())
    if annotations["episode_id"] != sync["episode"] or annotations["source_video"] != "right_camera.mp4":
        raise ValueError("Video estimates belong to a different episode/camera")
    digest = hashlib.sha256((raw / annotations["source_video"]).read_bytes()).hexdigest()
    if digest != annotations["source_sha256"]:
        raise ValueError("Video estimates do not match the source video")
    frames = [json.loads(line) for line in frames_path.read_text().splitlines()]
    native, estimated = 0, 0
    for frame in frames:
        frame["pose_source"] = "recorded_pose" if frame["valid"] else "unavailable"
        if frame["valid"]:
            native += 1
            continue
        angles = estimate_angles(frame["time_ns"] / 1e9, annotations)
        if angles is None:
            continue
        frame.update({"valid": True, "pose_source": "visual_video_estimate", "estimated_angles": angles,
                      "pose_sample_index": None, "pose_unix_ms": None, "pose_distance_ms": None})
        estimated += 1
    frames_path.write_text("".join(json.dumps(frame) + "\n" for frame in frames))
    metadata.update({"source": "recorded_pose_with_visual_video_estimates", "native_frame_count": native,
                     "video_estimated_frame_count": estimated,
                     "video_estimate": {"method": annotations["method"], "description": annotations["description"],
                                        "source_sha256": digest, "annotations_sha256": hashlib.sha256(annotations_path.read_bytes()).hexdigest()}})
