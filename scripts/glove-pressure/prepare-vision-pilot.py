"""Extract exact source frames for the 165650 visual-pressure pilot.

Requires ffmpeg and ImageMagick. The original camera pixels are never rescaled;
the crops are additional context, not replacements for the full frames.
"""
from __future__ import annotations

import argparse
from bisect import bisect_left
import csv
import hashlib
import json
from pathlib import Path
import subprocess


PILOT_TIMES = (2.20, 2.60, 3.00, 3.40, 3.80, 4.20, 4.60, 18.40, 18.80, 19.20, 19.60)
CAMERAS = ("left_camera", "right_camera")
CROP = "600x590+600+180"  # kettle, handle, gray/black right glove; 1:1 pixels


def digest(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def nearest_index(rows: list[dict], requested: float) -> int:
    times = [int(row["t_sync_us"]) for row in rows]
    wanted = round(requested * 1_000_000)
    right = bisect_left(times, wanted)
    return min((max(right - 1, 0), min(right, len(times) - 1)), key=lambda i: abs(times[i] - wanted))


def prepare(video_root: Path, metadata_root: Path, output: Path, requested_times: tuple[float, ...] = PILOT_TIMES) -> None:
    output.mkdir(parents=True, exist_ok=True)
    frames = {camera: [] for camera in CAMERAS}
    sources = {}
    for camera in CAMERAS:
        video = video_root / f"{camera}.mp4"
        timestamps = metadata_root / f"{camera}_timestamps.csv"
        with timestamps.open(newline="") as handle:
            rows = list(csv.DictReader(handle))
        if not rows or any(int(b["t_sync_us"]) <= int(a["t_sync_us"]) for a, b in zip(rows, rows[1:])):
            raise ValueError(f"Non-increasing or empty timestamps: {timestamps}")
        indices = [nearest_index(rows, t) for t in requested_times]
        if len(set(indices)) != len(indices):
            raise ValueError(f"Repeated source frame selection for {camera}")
        # Decode once per camera. Output order follows source frame order.
        expression = "+".join(f"eq(n\\,{i})" for i in indices)
        temporary = output / f"{camera}__extract_%02d.png"
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(video),
            "-vf", f"select={expression}", "-fps_mode", "vfr", "-compression_level", "2",
            "-y", str(temporary))
        sources[camera] = {"video": str(video), "video_sha256": digest(video),
                           "timestamps": str(timestamps), "timestamps_sha256": digest(timestamps)}
        for ordinal, (requested, index) in enumerate(zip(requested_times, indices), 1):
            extracted = output / f"{camera}__extract_{ordinal:02d}.png"
            if not extracted.exists():
                raise ValueError(f"Missing extracted frame: {extracted}")
            full = output / f"sample_{ordinal:02d}__{camera}__full.png"
            extracted.rename(full)
            crop = output / f"sample_{ordinal:02d}__{camera}__right_contact_crop.png"
            run("magick", str(full), "-crop", CROP, "+repage", str(crop))
            frames[camera].append({"requested_time_s": requested, "source_frame_index": index,
                                   "actual_time_s": int(rows[index]["t_sync_us"]) / 1_000_000,
                                   "full_image": full.name, "full_sha256": digest(full),
                                   "contact_crop": crop.name, "crop_sha256": digest(crop)})
    samples = []
    for ordinal, requested in enumerate(requested_times):
        left, right = (frames[camera][ordinal] for camera in CAMERAS)
        if abs(left["actual_time_s"] - right["actual_time_s"]) > 0.05:
            raise ValueError(f"Stereo selection exceeds 50 ms: sample {ordinal + 1}")
        board = output / f"sample_{ordinal + 1:02d}__stereo_vision_input.png"
        run("magick", "-size", "2560x1550", "xc:#101010",
            str(output / left["full_image"]), "-geometry", "+0+0", "-composite",
            str(output / right["full_image"]), "-geometry", "+1280+0", "-composite",
            str(output / left["contact_crop"]), "-geometry", "+0+960", "-composite",
            str(output / right["contact_crop"]), "-geometry", "+1280+960", "-composite",
            str(board))
        samples.append({"sample_id": f"165650-pressure-{ordinal + 1:02d}",
                        "requested_time_s": requested, "left": left, "right": right,
                        "board_image": board.name, "board_sha256": digest(board)})
    manifest = {"schema_version": "visual-pressure-pilot-input-v1", "episode": "20260911_165650",
                "source": "original synchronized left/right camera pixels", "source_files": sources,
                "crop_xywh": [600, 180, 600, 590], "samples": samples}
    (output / "input-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Prepared {len(samples)} stereo samples in {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video-root", type=Path, required=True)
    parser.add_argument("--metadata-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--times", type=float, nargs="*", help="Exact requested seconds; defaults to the 11-frame pilot")
    parser.add_argument("--start", type=float, help="Start of a uniform requested-time range")
    parser.add_argument("--end", type=float, help="Inclusive end of a uniform requested-time range")
    parser.add_argument("--step", type=float, help="Step of a uniform requested-time range")
    args = parser.parse_args()
    interval = (args.start, args.end, args.step)
    if args.times and any(value is not None for value in interval):
        raise ValueError("Use either --times or --start/--end/--step")
    if any(value is not None for value in interval):
        if any(value is None for value in interval) or args.step <= 0 or args.start < 0 or args.end < args.start:
            raise ValueError("Uniform range requires valid --start, --end and --step")
        count = int(round((args.end - args.start) / args.step)) + 1
        times = tuple(round(args.start + i * args.step, 6) for i in range(count))
    else:
        times = tuple(args.times) if args.times else PILOT_TIMES
    if any(t < 0 for t in times) or sorted(set(times)) != list(times):
        raise ValueError("Requested times must be nonnegative, unique and increasing")
    prepare(args.video_root, args.metadata_root, args.output, times)
