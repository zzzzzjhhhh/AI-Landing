"""Add a reference-style replay dashboard without rewriting video, pose or pressure."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

import numpy as np
import rerun as rr
import rerun.blueprint as rrb
from rerun.experimental import RrdReader

from pose_source import read_pose_samples
from head_imu import build_head_imu, infer_source, CHANNELS

ROOT = "replay_dashboard"
PRESSURE = "demo/glove_pressure/right"
FLEXION = "derived/hand_flexion/right"
BACKGROUND = [9, 11, 16]


def dashboard_blueprint(manifest: dict, head_entity: str, depth: dict | None = None, imu: dict | None = None) -> rrb.Blueprint:
    dimensions = manifest["camera_dimensions"]
    labels = {"left_camera": "PICO left", "right_camera": "PICO right", "left": "PICO left", "right": "PICO right",
              "left_side": "Left side", "right_side": "Right side", "back": "Back"}
    cameras = [rrb.Spatial2DView(origin=f"camera/{name}", name=labels.get(name, name),
                               visual_bounds=rrb.VisualBounds2D(x_range=[0, size[0]], y_range=[0, size[1]]))
               for name, size in dimensions.items()]
    estimated = manifest["pressure_source"] == "video_pose_estimate"
    video_flexion = "video_estimate" in manifest["flexion"]
    movement = rrb.Spatial3DView(
        origin=FLEXION, contents=["$origin/mesh/**", "$origin/status"],
        name="Movement · VIDEO ESTIMATE" if video_flexion else "Movement · POSE",
        background=BACKGROUND, line_grid=False,
        eye_controls=rrb.EyeControls3D(position=[2.6, 1.1, 6.7], look_target=[-0.45, 0.4, 0.2], eye_up=[0, 1, 0]),
    )
    pressure = rrb.Spatial3DView(
        origin=PRESSURE, contents=["$origin/mesh/**", "$origin/pressure", "$origin/status", "$origin/legend"],
        name="Pressure · ESTIMATED" if estimated else "Pressure · DEMO",
        background=BACKGROUND, line_grid=False,
        eye_controls=rrb.EyeControls3D(position=[-0.45, 0, 8.0] if estimated else [-0.45, 0.5, 6.5],
                                     look_target=[-0.45, 0 if estimated else 0.5, 0.2], eye_up=[0, 1, 0]),
    )

    def document(name, title):
        return rrb.TextDocumentView(origin=f"{ROOT}/task/{name}", name=title,
                                   format_options=rrb.archetypes.TextDocumentFormat(word_wrap=True, monospace=False))

    def placeholder(name, title):
        return rrb.Spatial2DView(origin=f"{ROOT}/placeholder/{name}", name=title,
                                 background=[22, 35, 48],
                                 visual_bounds=rrb.VisualBounds2D(x_range=[0, 1], y_range=[0, 1]))

    left = rrb.Vertical(
        rrb.Horizontal(movement, pressure, column_shares=[1, 1]),
        rrb.Horizontal(
            rrb.Vertical(document("main", "Main task"), document("objects", "Objects"), row_shares=[1.7, 1]),
            rrb.Vertical(document("subtask", "Sub task"), document("interaction", "Interaction"),
                         document("action", "Current action"), row_shares=[1, 1, 1]),
            column_shares=[1, 1],
        ),
        rrb.StateTimelineView(origin=f"{ROOT}/task_timeline", contents=[f"{ROOT}/task_timeline/Task"],
                              name="Task timeline · VIDEO" if estimated else "Task timeline"),
        row_shares=[0.58, 0.28, 0.14],
    )
    depth_view = rrb.Spatial2DView(origin=f"{ROOT}/depth", name="Depth · ESTIMATED",
        visual_bounds=rrb.VisualBounds2D(x_range=[0, depth["width"]], y_range=[0, depth["height"]])) if depth else placeholder("depth", "Depth")
    tiles = [depth_view, *cameras]
    camera_grid = rrb.Vertical(
        *[rrb.Horizontal(*tiles[i:i + 3], column_shares=[1] * len(tiles[i:i + 3])) for i in range(0, len(tiles), 3)],
        row_shares=[1] * ((len(tiles) + 2) // 3),
    )
    duration = manifest["duration_ns"] / 1e9
    head = rrb.TimeSeriesView(
        origin=head_entity, name="Head height · m", plot_legend=rrb.PlotLegend(visible=False),
        background=rrb.archetypes.PlotBackground(color=BACKGROUND, show_grid=True),
        axis_x=rrb.TimeAxis(view_range=rr.TimeRange(start=rrb.TimeRangeBoundary.absolute(seconds=0),
                                                  end=rrb.TimeRangeBoundary.absolute(seconds=duration)), zoom_lock=True),
    )
    if imu:
        def imu_plot(kind, unit):
            values = [imu["statistics"][f"{kind}_{axis}"] for axis in "xyz"]
            low = min(0, min(value["min"] for value in values))
            high = max(0, max(value["max"] for value in values))
            pad = max((high - low) * 0.08, 0.2)
            return rrb.TimeSeriesView(
                origin=f'{imu["entity"]}/{kind}', name=f"IMU {kind} · EST · {unit}",
                plot_legend=rrb.PlotLegend(corner="LeftTop", visible=True),
                background=rrb.archetypes.PlotBackground(color=BACKGROUND, show_grid=True),
                axis_x=rrb.TimeAxis(view_range=rr.TimeRange(start=rrb.TimeRangeBoundary.absolute(seconds=0),
                    end=rrb.TimeRangeBoundary.absolute(seconds=duration)), zoom_lock=True),
                axis_y=rrb.ScalarAxis(range=[low - pad, high + pad], zoom_lock=True),
            )
        head = rrb.Vertical(imu_plot("accel", "m/s²"), imu_plot("gyro", "rad/s"), row_shares=[1, 1])
    right = rrb.Vertical(
        camera_grid,
        rrb.Horizontal(placeholder("gaussian", "Gaussian Splat"), head, column_shares=[1, 1.8]),
        row_shares=[0.64, 0.36],
    )
    return rrb.Blueprint(rrb.Horizontal(left, right, column_shares=[1.18, 1]),
                         rrb.TimePanel(state="collapsed", timeline="tracking_time"), auto_layout=False, auto_views=False)


def head_samples(raw: Path, manifest: dict):
    if hashlib.sha256((raw / "pose_samples.bin").read_bytes()).hexdigest() != manifest["flexion"]["pose_sha256"]:
        raise ValueError("Dashboard head pose does not match this episode")
    if hashlib.sha256((raw / "pose_schema.json").read_bytes()).hexdigest() != manifest["flexion"]["schema_sha256"]:
        raise ValueError("Dashboard pose schema does not match this episode")
    samples, _ = read_pose_samples(raw)
    if "t_sync_us" not in samples.dtype.names:
        raise ValueError("Use the base recording's head-height series for the original stereo episode")
    sync = json.loads((raw / "sync_manifest.json").read_text())
    if int(sync["timeline_origin"]["unix_time_us"]) * 1000 != manifest["capture_start_ns"]:
        raise ValueError("Dashboard source clock differs from the recording")
    times = np.asarray(samples["t_sync_us"], dtype=np.int64) * 1000
    heights = np.asarray(samples["head_pose_xyz_xyzw"][:, 1], dtype=np.float32)
    if np.any(np.diff(times) <= 0) or times[0] < 0 or times[-1] > manifest["duration_ns"] or not np.isfinite(heights).all():
        raise ValueError("Invalid head-height samples or timeline")
    return times, heights


def task_stage(time_s: float) -> tuple[str, str]:
    # These boundaries follow the reviewed 153529 video-contact annotations.
    if time_s < 7.2:
        interaction = "Right reaches for cup handle." if time_s < 2.1 else "Right steadies cup; left pours." if time_s < 6.3 else "Right holds cup near table."
        return "Fill and steady cup", interaction
    if time_s < 12.5:
        return "Lift and carry cup", "Right holds and carries cup by handle."
    if time_s < 15.65:
        interaction = "Right moves cup into microwave." if time_s < 14.3 else "Right lowers cup onto turntable." if time_s < 14.8 else "Cup rests inside; right releases grip."
        return "Place cup and release", interaction
    return "Cup placed", "Right hand is open; no cup contact."


def task_annotations(profile: dict | None) -> dict | None:
    """Optional episode-specific task text, tied to the validated contact profile."""
    task = profile.get("task") if profile else None
    if task is None:
        return None
    if not all(isinstance(task.get(key), str) and task[key].strip() for key in ("main", "objects")):
        raise ValueError("Task annotations require main task and object text")
    stages = task.get("stages", [])
    if not stages or stages[0].get("time_s") != 0:
        raise ValueError("Task stages must start at the beginning of the clip")
    previous = -1
    for stage in stages:
        time = stage.get("time_s")
        color = stage.get("color", [])
        if (not isinstance(time, (int, float)) or not previous < time < profile["duration_s"]
                or not all(isinstance(stage.get(key), str) and stage[key].strip() for key in ("name", "interaction"))
                or len(color) != 3 or not all(isinstance(value, int) and 0 <= value <= 255 for value in color)):
            raise ValueError("Invalid task stage time, text or color")
        previous = time
    return task


def annotation_events(profile: dict, task: dict | None):
    keys = profile["keyframes"]
    stages = task["stages"] if task else []
    event_times = sorted({key["time_s"] for key in keys} | {stage["time_s"] for stage in stages})
    for time in event_times:
        action = next(key["phase"] for key in reversed(keys) if key["time_s"] <= time)
        if task:
            current = next(stage for stage in reversed(stages) if stage["time_s"] <= time)
            stage, interaction = current["name"], current["interaction"]
        else:
            stage, interaction = task_stage(time)
        yield time, stage, interaction, action


def load_depth(output: Path, manifest: dict, raw: Path | None = None) -> dict | None:
    path = output / "foundation-stereo-depth.json"
    if not path.exists():
        return None
    depth = json.loads(path.read_text())
    base = json.loads((output / "manifest.json").read_text())
    assert depth["source"] == "foundation_stereo" and depth["episode_id"] == base["episode_id"]
    assert base["recording_id"] == manifest["recording_id"]
    assert depth["capture_start_ns"] == manifest["capture_start_ns"]
    assert depth["duration_us"] * 1000 == manifest["duration_ns"]
    assert depth["source_sha256"]["sync_manifest.json"] == base["sync_manifest_sha256"]
    if raw:
        for name, digest in depth["source_sha256"].items():
            assert hashlib.sha256((raw / name).read_bytes()).hexdigest() == digest, f"Depth source changed: {name}"
    for camera in base["cameras"]:
        if camera["name"] in ("left_camera", "right_camera"):
            assert depth["source_sha256"][f'{camera["name"]}.mp4'] == camera["source_sha256"]
    for name in ("video", "timestamps", "depth_archive"):
        asset = depth[name]
        assert hashlib.sha256((output / Path(asset["path"]).name).read_bytes()).hexdigest() == asset["sha256"]
    rows = list(csv.DictReader((output / Path(depth["timestamps"]["path"]).name).open()))
    assert len(rows) == depth["frame_count"]
    assert [int(r["frame_index"]) for r in rows] == list(range(len(rows)))
    times = [int(r["t_sync_us"]) for r in rows]
    assert times[0] == 0 and all(b > a for a, b in zip(times, times[1:]))
    assert [int(r["frame_duration_us"]) for r in rows] == np.diff(times + [depth["duration_us"]]).tolist()
    assert times[-1] < depth["duration_us"]
    return depth


def depth_timestamps(output: Path, depth: dict) -> np.ndarray:
    with (output / Path(depth["timestamps"]["path"]).name).open() as handle:
        return np.array([int(r["t_sync_us"]) * 1000 for r in csv.DictReader(handle)], dtype=np.int64)


def build_dashboard(output: Path, raw: Path | None = None, with_head_imu: bool = False) -> dict:
    manifest_path = output / "right-hand-pressure.json"
    manifest = json.loads(manifest_path.read_text())
    depth = load_depth(output, manifest, raw)
    five_camera = len(manifest["camera_dimensions"]) > 2
    if five_camera and raw is None:
        raise ValueError("The five-camera dashboard requires its original head pose")
    times, heights = head_samples(raw, manifest) if five_camera else (None, None)
    imu, imu_times, imu_values = None, None, None
    if with_head_imu or manifest.get("dashboard", {}).get("imu"):
        if not five_camera or raw is None:
            raise ValueError("Head IMU estimation requires the original synchronized six-DoF poses")
        imu, imu_times, imu_values = build_head_imu(raw, manifest, output)
        np.testing.assert_array_equal(imu_times, times)
    head_entity = f"{ROOT}/head_height" if five_camera else "world/head_height"
    profile = manifest.get("pressure") if manifest["pressure_source"] == "video_pose_estimate" else None
    task = task_annotations(profile)
    annotated = bool(task or (profile and profile["episode_id"] == "20260910_153529"))
    data_path, blueprint_path = output / "replay-dashboard.rrd", output / "replay-dashboard.rbl"
    recording = rr.RecordingStream(manifest["application_id"], recording_id=manifest["recording_id"], send_properties=False)
    recording.save(data_path)

    def instant(ns):
        recording.set_time("tracking_time", duration=np.timedelta64(ns, "ns"))
        recording.set_time("capture_time", timestamp=np.datetime64(manifest["capture_start_ns"] + ns, "ns"))

    try:
        placeholders = [("gaussian", "Gaussian Splat\nPlaceholder")]
        if depth is None:
            placeholders.append(("depth", "Depth\nPlaceholder"))
        for name, label in placeholders:
            recording.log(f"{ROOT}/placeholder/{name}", rr.Points2D([[0.5, 0.44]], radii=0,
                          colors=[189, 211, 231], labels=[label], show_labels=True), static=True)
        recording.log(f"{ROOT}/provenance", rr.TextDocument(
            ("Depth is a FoundationStereo estimate using recorded stereo pairs and calibration. Gaussian Splat remains a placeholder. "
             if depth else "Depth and Gaussian Splat are placeholders with no generated data. ") +
            ("IMU accel and gyro are estimated from head pose, not measured: head-local specific force (m/s², includes gravity) and angular velocity (rad/s). "
             if imu else "Head height is the original tracking-space head Y coordinate in meters, not IMU data. ") +
            "Task text and states are reviewed video annotations when available; otherwise explicitly unavailable."
        ), static=True)
        if depth:
            entity = f"{ROOT}/depth/video"
            asset = rr.AssetVideo(path=output / Path(depth["video"]["path"]).name)
            pts = asset.read_frame_timestamps_nanos()
            depth_times = depth_timestamps(output, depth)
            np.testing.assert_array_equal(pts, depth_times)
            recording.log(entity, asset, static=True)
            recording.send_columns(entity, indexes=[
                rr.TimeColumn("tracking_time", duration=depth_times.astype("timedelta64[ns]")),
                rr.TimeColumn("capture_time", timestamp=(depth_times + manifest["capture_start_ns"]).astype("datetime64[ns]")),
            ], columns=rr.VideoFrameReference.columns_nanos(pts))
            recording.log(f"{ROOT}/depth/provenance", rr.TextDocument(json.dumps(depth)), static=True)
        if five_camera:
            recording.log(head_entity, rr.SeriesLines(colors=[70, 207, 202], widths=1.5, names="Head height (m)"), static=True)
            recording.send_columns(head_entity, indexes=[
                rr.TimeColumn("tracking_time", duration=times.astype("timedelta64[ns]")),
                rr.TimeColumn("capture_time", timestamp=(times + manifest["capture_start_ns"]).astype("datetime64[ns]")),
            ], columns=rr.Scalars.columns(scalars=heights))
        if imu:
            colors = [[244, 77, 89], [65, 220, 117], [76, 141, 255]]
            for i, channel in enumerate(CHANNELS):
                kind, axis = channel.split("_")
                entity = f'{imu["entity"]}/{kind}/{axis}'
                recording.log(entity, rr.SeriesLines(colors=colors[i % 3], widths=1.25, names=axis.upper()), static=True)
                recording.send_columns(entity, indexes=[
                    rr.TimeColumn("tracking_time", duration=imu_times.astype("timedelta64[ns]")),
                    rr.TimeColumn("capture_time", timestamp=(imu_times + manifest["capture_start_ns"]).astype("datetime64[ns]")),
                ], columns=rr.Scalars.columns(scalars=imu_values[:, i]))
            recording.log(f'{imu["entity"]}/provenance', rr.TextDocument(json.dumps(imu)), static=True)
        static_text = {
            "main": "Fill a cup and place it in the microwave.\n\nVideo annotation." if annotated else "Recorded task clip.\n\nTask annotations unavailable.",
            "objects": "Glass cup · kettle · microwave\nVideo annotation." if annotated else "Object annotations unavailable.",
        }
        if task:
            static_text = {"main": task["main"] + "\n\nVideo annotation.", "objects": task["objects"] + "\nVideo annotation."}
        for name, value in static_text.items():
            recording.log(f"{ROOT}/task/{name}", rr.TextDocument(value), static=True)
        if annotated:
            state_names = [stage["name"] for stage in task["stages"]] if task else ["Fill and steady cup", "Lift and carry cup", "Place cup and release", "Cup placed"]
            state_colors = [stage["color"] for stage in task["stages"]] if task else [[50, 173, 151], [83, 138, 211], [204, 158, 68], [112, 125, 143]]
            recording.log(f"{ROOT}/task_timeline/Task", rr.StateConfiguration(values=state_names,
                colors=state_colors), static=True)
            previous_stage = None
            for time, stage, interaction, action in annotation_events(profile, task):
                instant(round(time * 1e9))
                for name, value in (("subtask", stage), ("interaction", interaction), ("action", action)):
                    recording.log(f"{ROOT}/task/{name}", rr.TextDocument(value))
                if stage != previous_stage:
                    recording.log(f"{ROOT}/task_timeline/Task", rr.StateChange(state=stage))
                    previous_stage = stage
                recording.log(f"{ROOT}/task_timeline/Action", rr.StateChange(state=action))
        else:
            instant(0)
            for name in ("subtask", "interaction", "action"):
                recording.log(f"{ROOT}/task/{name}", rr.TextDocument("Not annotated"), static=True)
            recording.log(f"{ROOT}/task_timeline/Task", rr.StateChange(state="Not annotated"))
        instant(manifest["duration_ns"])
        recording.log(f"{ROOT}/end", rr.TextDocument("End of clip"))
    finally:
        recording.flush()
        recording.disconnect()
    dashboard_blueprint(manifest, head_entity, depth, imu).save(manifest["application_id"], blueprint_path)
    prefix = manifest["data"]["path"].rsplit("/", 1)[0]
    dashboard = {"layout_version": 2 if imu else 1, "head_height_entity": head_entity,
                 "head_height_source": "original_pose_y" if five_camera else "base_recording_head_height",
                 "head_height_sample_count": len(times) if five_camera else None,
                 "pose_sha256": manifest["flexion"]["pose_sha256"],
                 "task_source": "reviewed_video_annotation" if annotated else "unavailable",
                 "placeholders": ["gaussian_splat"] if depth else ["depth", "gaussian_splat"]}
    if depth:
        dashboard["depth"] = depth
    if imu:
        dashboard["imu"] = imu
    for name, path in (("data", data_path), ("blueprint", blueprint_path)):
        dashboard[name] = {"path": f"{prefix}/{path.name}", "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    manifest["dashboard"] = dashboard
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(dashboard, indent=2))
    return dashboard


def verify_dashboard(output: Path, raw: Path | None = None) -> None:
    manifest = json.loads((output / "right-hand-pressure.json").read_text())
    dashboard = manifest["dashboard"]
    depth = load_depth(output, manifest, raw)
    assert dashboard.get("depth") == depth
    for name in ("data", "blueprint"):
        asset = dashboard[name]
        assert hashlib.sha256((output / Path(asset["path"]).name).read_bytes()).hexdigest() == asset["sha256"]
    reader = RrdReader(output / "replay-dashboard.rrd")
    entry, = reader.recordings()
    assert entry.application_id == manifest["application_id"] and entry.recording_id == manifest["recording_id"]
    times, heights, paths, video_times, video_pts = [], [], set(), [], []
    imu_samples = {name: [] for name in CHANNELS}
    for chunk in reader.store().stream().to_chunks():
        path = str(chunk.entity_path)
        assert path.startswith(f"/{ROOT}/"), "Dashboard must not overwrite original video or hand entities"
        paths.add(path)
        if chunk.is_static:
            continue
        batch = chunk.to_record_batch()
        tracking = batch["tracking_time"].cast("int64").to_numpy()
        capture = batch["capture_time"].cast("int64").to_numpy()
        np.testing.assert_array_equal(capture - tracking, manifest["capture_start_ns"])
        assert tracking.min() >= 0 and tracking.max() <= manifest["duration_ns"]
        if path == f"/{ROOT}/head_height":
            times.extend(tracking.tolist())
            heights.extend(value[0] for value in batch["Scalars:scalars"].to_pylist())
        if path == f"/{ROOT}/depth/video":
            video_times.extend(tracking.tolist())
            video_pts.extend(value[0] for value in batch["VideoFrameReference:timestamp"].to_pylist())
        for name in CHANNELS:
            if path == f'/{ROOT}/imu/{name.replace("_", "/")}':
                imu_samples[name].extend(zip(tracking.tolist(), [v[0] for v in batch["Scalars:scalars"].to_pylist()]))
    assert {f"/{ROOT}/placeholder/gaussian", f"/{ROOT}/task_timeline/Task"} <= paths
    if depth:
        assert f"/{ROOT}/placeholder/depth" not in paths
        expected = depth_timestamps(output, depth)
        np.testing.assert_array_equal(np.sort(video_times), expected)
        np.testing.assert_array_equal(np.asarray(video_pts)[np.argsort(video_times)], expected)
    else:
        assert f"/{ROOT}/placeholder/depth" in paths and not video_times
    if dashboard["head_height_source"] == "original_pose_y":
        assert len(times) == dashboard["head_height_sample_count"]
        assert np.isfinite(heights).all() and len(set(times)) == len(times)
        assert dashboard["pose_sha256"] == manifest["flexion"]["pose_sha256"]
        if raw:
            expected_times, expected_heights = head_samples(raw, manifest)
            order = np.argsort(times)
            np.testing.assert_array_equal(np.asarray(times)[order], expected_times)
            np.testing.assert_array_equal(np.asarray(heights)[order], expected_heights)
    else:
        assert dashboard["head_height_entity"] == "world/head_height" and not times
    imu = dashboard.get("imu")
    if imu:
        for asset in (imu["csv"], imu["metadata"]):
            assert hashlib.sha256((output / Path(asset["path"]).name).read_bytes()).hexdigest() == asset["sha256"]
        rows = list(csv.DictReader((output / Path(imu["csv"]["path"]).name).open()))
        assert len(rows) == imu["sample_count"] == len(times)
        expected_times = np.array([int(row["t_sync_us"]) * 1000 for row in rows])
        np.testing.assert_array_equal(expected_times, np.sort(times))
        np.testing.assert_array_equal([int(row["capture_time_ns"]) for row in rows], expected_times + manifest["capture_start_ns"])
        assert [int(row["source_pose_index"]) for row in rows] == list(range(len(rows)))
        assert all(row["source"] == "HEAD_POSE_ESTIMATE" for row in rows)
        if raw:
            source_times, expected_imu, _, _ = infer_source(raw, manifest)
            np.testing.assert_array_equal(source_times, expected_times)
        for i, name in enumerate(CHANNELS):
            series = sorted(imu_samples[name])
            np.testing.assert_array_equal([t for t, _ in series], expected_times)
            field = f'{name}_{"m_s2" if name.startswith("accel") else "rad_s"}'
            values = np.array([float(row[field]) if row[field] else np.nan for row in rows])
            np.testing.assert_allclose([v for _, v in series], values, rtol=0, atol=1e-12, equal_nan=True)
            if raw:
                np.testing.assert_allclose(values, expected_imu["values"][:, i], rtol=0, atol=1e-12, equal_nan=True)
    else:
        assert not any(imu_samples.values())
    print(f"Verified dashboard identity, asset hashes, {len(video_times)} depth frames, {len(times)} original head samples and {sum(map(len, imu_samples.values()))} IMU scalar values.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--raw-pose", type=Path)
    parser.add_argument("--head-imu", action="store_true", help="Replace the height view with pose-estimated accel/gyro panels")
    args = parser.parse_args()
    build_dashboard(args.output_dir, args.raw_pose, args.head_imu)
