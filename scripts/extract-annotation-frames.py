"""Extract timestamped review images; action labels are assigned separately after viewing."""
from __future__ import annotations

import argparse
from bisect import bisect_left
import csv
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


def sha256(path: Path) -> str:
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def extract(source: Path, videos: Path, output: Path, cameras: list[str], step: float, targets: list[float] | None):
    duration = json.loads((source / "sync_manifest.json").read_text())["duration_seconds"]
    if not np.isfinite(step) or step <= 0:
        raise ValueError("Step must be positive and finite")
    targets = sorted(set(targets)) if targets is not None else np.arange(0, duration, step).tolist()
    if not targets or any(not np.isfinite(t) or not 0 <= t < duration for t in targets):
        raise ValueError("Review times must lie inside the clip")
    output.mkdir(parents=True, exist_ok=True)
    manifest = {"source": str(source), "video_root": str(videos), "duration_s": duration,
                "selection": "first actual exposure at or after each requested time; final exposure if no later frame exists",
                "requested_times_s": targets, "automatic_action_detection": False, "cameras": {}}
    for camera in cameras:
        timestamps = source / f"{camera}_timestamps.csv"
        video = videos / f"{camera}.mp4"
        rows = list(csv.DictReader(timestamps.open()))
        times = [int(row["t_sync_us"]) for row in rows]
        if not times or any(b <= a for a, b in zip(times, times[1:])):
            raise ValueError("Expected increasing source exposure timestamps")
        selected = {}
        for target in targets:
            index = min(bisect_left(times, round(target * 1e6)), len(times) - 1)
            selected.setdefault(index, []).append(target)
        cap = cv2.VideoCapture(str(video))
        frames, images = [], []
        try:
            for index in range(len(rows)):
                ok, frame = cap.read()
                if not ok:
                    raise ValueError(f"Decode ended before frame {index}: {video}")
                if index not in selected:
                    continue
                # Verify that a preview still has the exposure ordering of the source.
                if abs(cap.get(cv2.CAP_PROP_POS_MSEC) * 1000 - times[index]) > 1000:
                    raise ValueError(f"Preview timestamp differs from source at frame {index}")
                image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                path = output / f"{camera}-{index:05d}-{times[index]/1e6:.6f}.jpg"
                image.save(path, quality=92)
                frames.append({"frame_index": index, "time_us": times[index], "requested_times_s": selected[index],
                               "image": path.name, "sha256": sha256(path)})
                images.append(image)
            if cap.read()[0]:
                raise ValueError("Preview contains more frames than source timestamps")
        finally:
            cap.release()
        pages = []
        for start in range(0, len(images), 12):
            batch = images[start:start + 12]
            board = Image.new("RGB", (1600, ((len(batch) + 3) // 4) * 330), "#0c0f14")
            draw = ImageDraw.Draw(board)
            for offset, original in enumerate(batch):
                image = original.copy()
                image.thumbnail((400, 300))
                x, y = offset % 4 * 400, offset // 4 * 330
                board.paste(image, (x, y + 25))
                row = frames[start + offset]
                draw.text((x + 8, y + 7), f"{camera} | {row['time_us']/1e6:.3f}s | frame {row['frame_index']}", fill="white")
            page = output / f"{camera}-sheet-{start//12:02d}.jpg"
            board.save(page, quality=94)
            pages.append(page.name)
        manifest["cameras"][camera] = {"video_sha256": sha256(video), "timestamps_sha256": sha256(timestamps),
                                        "frames": frames, "sheets": pages}
    (output / "review-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({camera: len(data["frames"]) for camera, data in manifest["cameras"].items()}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--video-root", type=Path, help="Optional verified previews with unchanged frame order and PTS")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--cameras", nargs="+", choices=["left_camera", "right_camera", "left_side", "right_side", "back"], default=["right_camera"])
    parser.add_argument("--step", type=float, default=0.75)
    parser.add_argument("--times", nargs="+", type=float, help="Explicit review times instead of uniform sampling")
    args = parser.parse_args()
    extract(args.source, args.video_root or args.source, args.output, args.cameras, args.step, args.times)
