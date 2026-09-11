"""Reconstruct an ideal, explicitly estimated head IMU from recorded 6-DoF pose."""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.spatial.transform import Rotation

from pose_source import converter, read_pose_samples

GRAVITY = np.array([0.0, -9.80665, 0.0])
WINDOW_S = 0.24
MAX_GAP_S = 0.1
ROOT = "replay_dashboard/imu"
CHANNELS = [f"{kind}_{axis}" for kind in ("accel", "gyro") for axis in "xyz"]


def estimate_imu(times_ns, positions, quaternions):
    """Input: right-handed, Y-up world positions and head-to-world xyzw rotations.

    Fit local cubic polynomials at the original irregular timestamps. Position's
    second derivative gives world acceleration; the slope of log(R_i^-1 R_j)
    gives angular velocity in the current head frame. A centered window avoids
    a causal filter's playback delay; boundary windows use only recorded poses.
    """
    times = np.asarray(times_ns, dtype=np.int64) / 1e9
    positions = np.asarray(positions, dtype=np.float64)
    quaternions = np.asarray(quaternions, dtype=np.float64)
    if (len(times) < 7 or positions.shape != (len(times), 3) or quaternions.shape != (len(times), 4)
            or np.any(np.diff(times) <= 0) or not np.isfinite(positions).all()
            or not np.isfinite(quaternions).all()
            or np.any(abs(np.linalg.norm(quaternions, axis=1) - 1) > 0.01)):
        raise ValueError("IMU estimation requires finite, ordered head poses with unit quaternions")
    rotations = Rotation.from_quat(quaternions)
    # Avoid inventing acceleration across missing tracking or a localization reset.
    discontinuity = ((np.diff(times) > MAX_GAP_S)
                     | (np.linalg.norm(np.diff(positions, axis=0), axis=1) > 0.15)
                     | ((rotations[:-1].inv() * rotations[1:]).magnitude() > np.deg2rad(30)))
    splits = np.r_[0, np.flatnonzero(discontinuity) + 1, len(times)]
    accel_world = np.full_like(positions, np.nan)
    gyro = np.full_like(positions, np.nan)
    edge = np.zeros(len(times), dtype=bool)
    half = WINDOW_S / 2
    for start, end in zip(splits[:-1], splits[1:]):
        for i in range(start, end):
            lower = max(times[start], min(times[i] - half, times[end - 1] - WINDOW_S))
            upper = min(times[end - 1], lower + WINDOW_S)
            lo = max(start, np.searchsorted(times, lower, side="left"))
            hi = min(end, np.searchsorted(times, upper, side="right"))
            if hi - lo < 7 or times[hi - 1] - times[lo] < 0.07:
                continue
            dt = (times[lo:hi] - times[i]) / half
            design = np.polynomial.polynomial.polyvander(dt, 3)
            local_rotation = (rotations[i].inv() * rotations[lo:hi]).as_rotvec()
            values = np.column_stack((positions[lo:hi] - positions[i], local_rotation))
            coefficients = np.linalg.lstsq(design, values, rcond=None)[0]
            accel_world[i] = 2 * coefficients[2, :3] / half**2
            gyro[i] = coefficients[1, 3:] / half
            edge[i] = times[i] - times[start] < half or times[end - 1] - times[i] < half
    # Specific force includes the apparent gravity load: stationary upright +Y = g.
    accel = rotations.inv().apply(accel_world - GRAVITY)
    values = np.column_stack((accel, gyro))
    return {"values": values, "valid": np.isfinite(values).all(axis=1), "edge": edge,
            "accel_world": accel_world, "discontinuity_count": int(discontinuity.sum())}


def infer_source(raw: Path, manifest: dict):
    source_sha256 = {name: hashlib.sha256((raw / name).read_bytes()).hexdigest()
                     for name in ("pose_samples.bin", "pose_schema.json", "sync_manifest.json")}
    if (source_sha256["pose_samples.bin"] != manifest["flexion"]["pose_sha256"]
            or source_sha256["pose_schema.json"] != manifest["flexion"]["schema_sha256"]):
        raise ValueError("IMU head pose belongs to a different recording")
    sync = json.loads((raw / "sync_manifest.json").read_text())
    if int(sync["timeline_origin"]["unix_time_us"]) * 1000 != manifest["capture_start_ns"]:
        raise ValueError("IMU source clock differs from the recording")
    samples, _ = read_pose_samples(raw)
    times = np.asarray(samples["t_sync_us"], dtype=np.int64) * 1000
    if times[0] < 0 or times[-1] > manifest["duration_ns"]:
        raise ValueError("IMU source timestamps lie outside the episode")
    pose = samples["head_pose_xyz_xyzw"]
    # Same basis change as the replay: p'=S p and R'=S R S, S=diag(1,1,-1).
    result = estimate_imu(times, converter.unity_position_to_rerun(pose[:, :3]),
                          converter.unity_quaternion_to_rerun(pose[:, 3:]))
    return times, result, source_sha256, sync["episode"]


def build_head_imu(raw: Path, manifest: dict, output: Path):
    times, result, source_sha256, episode_id = infer_source(raw, manifest)
    if not result["valid"].any():
        raise ValueError("No head-pose interval supports IMU estimation")
    prefix = manifest["data"]["path"].rsplit("/", 1)[0]
    csv_path = output / "head-imu-estimates.csv"
    with csv_path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["t_sync_us", "capture_time_ns", "source_pose_index", "source", "quality",
                         *[f"{c}_{'m_s2' if c.startswith('accel') else 'rad_s'}" for c in CHANNELS]])
        for i, (ns, value, valid, edge) in enumerate(zip(times, result["values"], result["valid"], result["edge"])):
            writer.writerow([int(ns) // 1000, manifest["capture_start_ns"] + int(ns), i, "HEAD_POSE_ESTIMATE",
                             "unavailable" if not valid else "edge_fit" if edge else "estimated",
                             *(value.tolist() if valid else [""] * 6)])
    stats = {name: {"min": float(np.nanmin(result["values"][:, i])),
                    "max": float(np.nanmax(result["values"][:, i]))} for i, name in enumerate(CHANNELS)}
    info = {
        "version": 1, "episode_id": episode_id, "source": "head_pose_estimate", "label": "ESTIMATED",
        "entity": ROOT, "recording_id": manifest["recording_id"], "capture_start_ns": manifest["capture_start_ns"],
        "duration_ns": manifest["duration_ns"], "source_sha256": source_sha256,
        "sample_count": len(times), "valid_sample_count": int(result["valid"].sum()),
        "edge_sample_count": int(result["edge"].sum()), "discontinuity_count": result["discontinuity_count"],
        "sample_rate_hz_median": float(1e9 / np.median(np.diff(times))),
        "time_range_ns": times[[0, -1]].tolist(),
        "frame": "Virtual IMU at the tracked head origin; right-handed +X right, +Y up, +Z back. Gyro uses the right-hand rule.",
        "basis_conversion": "S=diag(1,1,-1); position'=S position, rotation'=S rotation S; quaternion'=(-qx,-qy,qz,qw).",
        "accel": {"unit": "m/s^2", "quantity": "specific_force", "formula": "R_head_to_world.T @ (d2p_world/dt2 - gravity_world)",
                  "gravity_world_m_s2": GRAVITY.tolist()},
        "gyro": {"unit": "rad/s", "quantity": "body_angular_velocity", "formula": "d/dt log(R(t_i).T @ R(t)) at t_i"},
        "filter": {"method": "Local cubic least-squares on actual irregular timestamps and relative rotation vectors",
                   "window_s": WINDOW_S, "max_gap_s": MAX_GAP_S,
                   "boundary": "One-sided/shifted recorded window, tagged edge_fit; no extrapolation or endpoint fill."},
        "assumptions": ["Tracking world is gravity-aligned with +Y up.", "Virtual IMU origin equals tracked head origin; physical sensor offset is unknown.",
                        "No added random noise, sensor bias, drift or vibration; high-frequency raw IMU cannot be recovered from fused pose.",
                        "Tracking-state flags are absent from the compact pose schema; numerical validity and jump/gap checks are used."],
        "statistics": stats,
        "references": ["https://raw.githubusercontent.com/ros-infrastructure/rep/master/rep-0145.rst",
                       "https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.transform.Rotation.as_rotvec.html"],
        "csv": {"path": f"{prefix}/{csv_path.name}", "sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest()},
    }
    metadata_path = output / "head-imu-estimates.json"
    metadata_path.write_text(json.dumps(info, indent=2) + "\n")
    return {**info, "metadata": {"path": f"{prefix}/{metadata_path.name}",
                                "sha256": hashlib.sha256(metadata_path.read_bytes()).hexdigest()}}, times, result["values"]
