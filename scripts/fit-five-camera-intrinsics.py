"""Fit fixed camera intrinsics from audit references; never replace recorded joints."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).parent / "glove-pressure"))
from pose_source import INTRINSICS_SOURCE_FILES, aligned_camera_calibration

MAPPING = [0, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24, 25]


def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def observations(records):
    result = []
    for record in records:
        for side, hand in record["hands"].items():
            if "detection_index" not in hand:
                continue
            projection = hand["projections"]["recorded"]
            if not all(str(joint) in projection for joint in MAPPING):
                continue
            result.append({"camera": record["camera"], "side": side,
                           "frame_index": record["frame_index"], "time_s": record["time_s"],
                           "projected": np.asarray([projection[str(joint)] for joint in MAPPING]),
                           "reference": np.asarray(record["detections"][hand["detection_index"]]["xy"])})
    return result


def corrected(points, center, parameters):
    return (points - center) * parameters[:2] + center + parameters[2:]


def metrics(items, calibrations, parameters):
    result = {}
    for camera in ("left_camera", "right_camera", "both"):
        for side in ("left", "right", "both"):
            chosen = [item for item in items if camera in ("both", item["camera"]) and side in ("both", item["side"])]
            before, after = [], []
            for item in chosen:
                calibration = calibrations[item["camera"]]
                cx, cy = calibration["intrinsics"]["principal_point"]
                p = corrected(item["projected"], [cx, calibration["height"] - 1 - cy], parameters[item["camera"]])
                before.extend(np.linalg.norm(item["projected"] - item["reference"], axis=1))
                after.extend(np.linalg.norm(p - item["reference"], axis=1))
            summarize = lambda values: {"median_px": float(np.median(values)), "p95_px": float(np.percentile(values, 95))} if values else None
            result[f"{camera}/{side}"] = {"matched_hands": len(chosen), "before": summarize(before), "after": summarize(after)}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--confirmation", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--allow-partial", action="store_true", help="Refine only cameras improving on both independent sets; keep other cameras unchanged")
    args = parser.parse_args()
    episode = json.loads((args.source / "sync_manifest.json").read_text())["episode"]
    audit, confirmation = [json.loads(path.read_text()) for path in (args.audit, args.confirmation)]
    if audit["episode"] != episode or confirmation["episode"] != episode:
        raise ValueError("Audit episode differs from source")
    train_records = [record for record in audit["records"] if record["set"] == "exploratory"]
    validation_records = [record for record in audit["records"] if record["set"] == "held_out"]
    keys = lambda records: {(record["camera"], record["frame_index"]) for record in records}
    if keys(train_records) & (keys(validation_records) | keys(confirmation["records"])):
        raise ValueError("Training and validation frames must be disjoint")
    train = observations(train_records)
    calibrations, parameters, cameras = {}, {}, {}
    for camera in ("left_camera", "right_camera"):
        calibration = calibrations[camera] = aligned_camera_calibration(args.source, camera, 960, 720)
        cx, cy = calibration["intrinsics"]["principal_point"]
        center = [cx, 719 - cy]
        chosen = [item for item in train if item["camera"] == camera]
        if len(chosen) < 15:
            raise ValueError("Insufficient camera reference coverage")
        residual = lambda p: np.concatenate([(corrected(item["projected"], center, p) - item["reference"]).ravel() for item in chosen])
        fit = least_squares(residual, [1, 1, 0, 0], loss="soft_l1", f_scale=10,
                            bounds=([0.7, 0.7, -60, -60], [1.5, 1.5, 60, 60]))
        if not fit.success:
            raise ValueError("Intrinsics fit failed")
        p = parameters[camera] = fit.x
        cameras[camera] = {"width": 960, "height": 720,
                           "focal_length": (np.asarray(calibration["intrinsics"]["focal_length"]) * p[:2]).tolist(),
                           # Encoded video is vertically flipped, so pixel dy changes native cy with the opposite sign.
                           "principal_point": [cx + p[2], cy - p[3]]}
    reports = {"validation": metrics(observations(validation_records), calibrations, parameters),
               "confirmation": metrics(observations(confirmation["records"]), calibrations, parameters)}
    candidate_reports = reports
    accepted = [camera for camera in cameras if all(
        report[f"{camera}/both"]["after"] and report[f"{camera}/both"]["before"] and all(
            report[f"{camera}/both"]["after"][metric] < report[f"{camera}/both"]["before"][metric]
            for metric in ("median_px", "p95_px")) for report in reports.values())]
    if not accepted or (not args.allow_partial and len(accepted) != len(cameras)):
        raise ValueError("Candidate does not improve both cameras on independent frames")
    for camera in cameras.keys() - set(accepted):
        parameters[camera] = np.array([1., 1., 0., 0.])
        cameras[camera] = {"width": 960, "height": 720, **calibrations[camera]["intrinsics"]}
    if len(accepted) != len(cameras):
        reports = {"validation": metrics(observations(validation_records), calibrations, parameters),
                   "confirmation": metrics(observations(confirmation["records"]), calibrations, parameters)}
    profile = {"version": 1, "episode_id": episode, "method": "estimated_fixed_per_camera_intrinsics",
               "description": "Fixed focal lengths and principal points fitted per camera from original 3D pose and independent image references. Estimated calibration, not a calibration-board measurement. Original pose, timestamps and extrinsics are unchanged.",
               "source_sha256": {name: digest(args.source / name) for name in INTRINSICS_SOURCE_FILES},
               "cameras": cameras,
               "refined_cameras": accepted,
               "unchanged_cameras": sorted(cameras.keys() - set(accepted)),
               "evaluation": {"reference": audit["reference"], "audit_sha256": digest(args.audit),
                              "confirmation_sha256": digest(args.confirmation), "training_matched_hands": len(train),
                              "training_frames": [list(key) for key in sorted(keys(train_records))],
                              "validation_frames": [list(key) for key in sorted(keys(validation_records))],
                              "confirmation_frames": [list(key) for key in sorted(keys(confirmation["records"]))],
                              "reports": reports,
                              "candidate_reports": candidate_reports,
                              "limits": "References are predominantly the bare left hand; right-glove references are limited to open-hand frames near the end. Occluded finger accuracy is not established."}}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(profile, indent=2) + "\n")
    print(json.dumps({"profile": str(args.output), "cameras": cameras, "reports": reports}, indent=2))


if __name__ == "__main__":
    main()
