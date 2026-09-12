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
WIDTH, HEIGHT = 960, 720


def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def observations(records):
    """Matched-hand training items: normalized rays, base projection and reference pixels."""
    result = []
    for record in records:
        for side, hand in record["hands"].items():
            if "detection_index" not in hand:
                continue
            projection = hand["projections"]["recorded"]
            rays = hand.get("rays", {}).get("recorded")
            if not all(str(joint) in projection for joint in MAPPING):
                continue
            if rays is None or not all(str(joint) in rays for joint in MAPPING):
                raise ValueError("Audit lacks normalized rays; regenerate it with evaluate-five-camera-projection.py")
            result.append({"camera": record["camera"], "side": side,
                           "frame_index": record["frame_index"], "time_s": record["time_s"],
                           "rays": np.asarray([rays[str(joint)] for joint in MAPPING]),
                           "projected": np.asarray([projection[str(joint)] for joint in MAPPING]),
                           "reference": np.asarray(record["detections"][hand["detection_index"]]["xy"])})
    return result


def reproject(rays, parameters):
    """Pinhole-plus-Brown-Conrady reprojection of normalized rays into encoded pixels.

    The encoded video is vertically flipped, so the fitted vertical center is
    (HEIGHT - 1 - cy) and the profile converts it back to native principal points.
    """
    focal_x, focal_y, center_x, center_y_encoded, k1, k2, p1, p2, k3 = parameters
    x_n, y_n = rays[:, 0], rays[:, 1]
    radius_squared = x_n**2 + y_n**2
    radial = 1.0 + k1 * radius_squared + k2 * radius_squared**2 + k3 * radius_squared**3
    x_d = x_n * radial + 2.0 * p1 * x_n * y_n + p2 * (radius_squared + 2.0 * x_n**2)
    y_d = y_n * radial + p1 * (radius_squared + 2.0 * y_n**2) + 2.0 * p2 * x_n * y_n
    return np.stack([center_x + focal_x * x_d, center_y_encoded + focal_y * y_d], axis=1)


def base_parameters(calibration):
    focal = np.asarray(calibration["intrinsics"]["focal_length"], dtype=float)
    center_x, center_y = calibration["intrinsics"]["principal_point"]
    return np.array([focal[0], focal[1], center_x, HEIGHT - 1 - center_y, 0.0, 0.0, 0.0, 0.0, 0.0])


def parameters_to_camera(parameters):
    return {"width": WIDTH, "height": HEIGHT,
            "focal_length": [float(parameters[0]), float(parameters[1])],
            "principal_point": [float(parameters[2]), float(HEIGHT - 1 - parameters[3])],
            "distortion": [float(value) for value in parameters[4:]]}


def metrics(items, calibrations, parameters):
    result = {}
    for camera in ("left_camera", "right_camera", "both"):
        for side in ("left", "right", "both"):
            chosen = [item for item in items if camera in ("both", item["camera"]) and side in ("both", item["side"])]
            before, after = [], []
            for item in chosen:
                before.extend(np.linalg.norm(item["projected"] - item["reference"], axis=1))
                after.extend(np.linalg.norm(reproject(item["rays"], parameters[item["camera"]]) - item["reference"], axis=1))
            summarize = lambda values: {"median_px": float(np.median(values)), "p95_px": float(np.percentile(values, 95))} if values else None
            result[f"{camera}/{side}"] = {"matched_hands": len(chosen), "before": summarize(before), "after": summarize(after)}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--confirmation", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--latency", type=Path, help="latency.json from evaluate-five-camera-projection.py --latency-sweep; embeds one constant pose_latency_us per camera")
    parser.add_argument("--allow-partial", action="store_true", help="Refine only cameras improving on both independent sets; keep other cameras unchanged")
    args = parser.parse_args()
    episode = json.loads((args.source / "sync_manifest.json").read_text())["episode"]
    audit, confirmation = [json.loads(path.read_text()) for path in (args.audit, args.confirmation)]
    if audit["episode"] != episode or confirmation["episode"] != episode:
        raise ValueError("Audit episode differs from source")
    latency_profile = None
    if args.latency:
        latency_profile = json.loads(args.latency.read_text())
        if latency_profile.get("episode") != episode or latency_profile.get("source_sha256") != {
            name: digest(args.source / name) for name in INTRINSICS_SOURCE_FILES}:
            raise ValueError("Latency sweep belongs to a different episode or changed source")
    train_records = [record for record in audit["records"] if record["set"] == "exploratory"]
    validation_records = [record for record in audit["records"] if record["set"] == "held_out"]
    keys = lambda records: {(record["camera"], record["frame_index"]) for record in records}
    if keys(train_records) & (keys(validation_records) | keys(confirmation["records"])):
        raise ValueError("Training and validation frames must be disjoint")
    train = observations(train_records)
    calibrations, parameters, cameras = {}, {}, {}
    for camera in ("left_camera", "right_camera"):
        calibration = calibrations[camera] = aligned_camera_calibration(args.source, camera, WIDTH, HEIGHT)
        chosen = [item for item in train if item["camera"] == camera]
        if len(chosen) < 15:
            raise ValueError("Insufficient camera reference coverage")
        initial = base_parameters(calibration)
        lower = np.array([0.6 * initial[0], 0.6 * initial[1],
                          max(0.0, initial[2] - 80), max(0.0, initial[3] - 80),
                          -0.5, -0.5, -0.05, -0.05, -0.5])
        upper = np.array([1.6 * initial[0], 1.6 * initial[1],
                          min(WIDTH - 1.0, initial[2] + 80), min(HEIGHT - 1.0, initial[3] + 80),
                          0.5, 0.5, 0.05, 0.05, 0.5])
        residual = lambda p: np.concatenate([(reproject(item["rays"], p) - item["reference"]).ravel() for item in chosen])
        fit = least_squares(residual, initial, loss="soft_l1", f_scale=10, bounds=(lower, upper))
        if not fit.success:
            raise ValueError("Intrinsics fit failed")
        parameters[camera] = fit.x
        cameras[camera] = parameters_to_camera(fit.x)
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
        parameters[camera] = base_parameters(calibrations[camera])
        cameras[camera] = parameters_to_camera(parameters[camera])
    if len(accepted) != len(cameras):
        reports = {"validation": metrics(observations(validation_records), calibrations, parameters),
                   "confirmation": metrics(observations(confirmation["records"]), calibrations, parameters)}
    if latency_profile:
        for camera in cameras:
            cameras[camera]["pose_latency_us"] = float(latency_profile["sweep"][camera]["best_offset_us"])
    profile = {"version": 2, "episode_id": episode, "method": "estimated_fixed_per_camera_intrinsics_and_distortion",
               "description": "Fixed focal lengths, principal points and Brown-Conrady distortion fitted per camera by reprojection from original 3D pose rays and independent image references. Optional constant pose_latency_us shifts when the pose stream is sampled per exposure. Estimated calibration, not a calibration-board measurement. Original pose, timestamps and extrinsics are unchanged.",
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
                              **({"latency": {"measurement_sha256": digest(args.latency), "sweep": latency_profile["sweep"]}} if latency_profile else {}),
                              "limits": "References are predominantly the bare left hand; right-glove references are limited to open-hand frames near the end. Occluded finger accuracy is not established."}}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(profile, indent=2) + "\n")
    print(json.dumps({"profile": str(args.output), "cameras": cameras, "reports": reports}, indent=2))


if __name__ == "__main__":
    main()
