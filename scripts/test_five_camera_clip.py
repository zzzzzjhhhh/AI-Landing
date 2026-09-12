import csv
import importlib.util
import json
import hashlib
import numpy as np
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("five_camera", Path(__file__).with_name("convert-five-camera-clip.py"))
five = importlib.util.module_from_spec(spec)
spec.loader.exec_module(five)


class TimestampTests(unittest.TestCase):
    def test_fixed_intrinsics_preserve_raw_pose_and_account_for_video_flip(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = {"width": 100, "height": 100, "video_transform": "flip_vertical",
                      "intrinsics": {"focal_length": [100, 100], "principal_point": [50, 50]},
                      "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}}
            (root / "right_camera_characteristics.json").write_text(json.dumps(source))
            profile = {"sha256": "test-profile", "cameras": {"right_camera": {"width": 200, "height": 200,
                       "focal_length": [400, 600], "principal_point": [100, 100]}}}
            corrected = five.aligned_camera_calibration(root, "right_camera", 100, 100, intrinsics_profile=profile)
            joints = np.array([[0.1, 0.1, -1.0]])
            before = joints.copy()
            actual = five.converter.project_hand_to_video(joints, 1, np.array([0, 0, 0, 0, 0, 0, 1]), corrected)
            np.testing.assert_allclose(actual[0], [70, 79])
            np.testing.assert_array_equal(joints, before)
            self.assertEqual(corrected["recorded_intrinsics"], source["intrinsics"])
            self.assertEqual(corrected["extrinsics"], source["extrinsics"])
            self.assertEqual(json.loads((root / "right_camera_characteristics.json").read_text()), source)

    def test_intrinsics_profile_rejects_a_different_episode_or_changed_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "sync_manifest.json").write_text(json.dumps({"episode": "test-episode"}))
            for name in five.INTRINSICS_SOURCE_FILES:
                if name != "sync_manifest.json": (root / name).write_text(name)
            profile = {"version": 1, "episode_id": "test-episode", "source_sha256": {
                name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in five.INTRINSICS_SOURCE_FILES},
                "cameras": {camera: {"width": 960, "height": 720, "focal_length": [800, 800], "principal_point": [480, 360]}
                            for camera in ("left_camera", "right_camera")}}
            five.validate_intrinsics_profile(root, profile)
            profile["episode_id"] = "different"
            with self.assertRaisesRegex(ValueError, "episode"):
                five.validate_intrinsics_profile(root, profile)
            profile["episode_id"] = "test-episode"
            (root / "pose_samples.bin").write_text("changed recording")
            with self.assertRaisesRegex(ValueError, "source"):
                five.validate_intrinsics_profile(root, profile)

    def profile_v2(self, root, distortion, latency):
        (root / "sync_manifest.json").write_text(json.dumps({"episode": "test-episode"}))
        for name in five.INTRINSICS_SOURCE_FILES:
            if name != "sync_manifest.json": (root / name).write_text(name)
        return {"version": 2, "episode_id": "test-episode", "source_sha256": {
            name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in five.INTRINSICS_SOURCE_FILES},
            "cameras": {camera: {"width": 100, "height": 100, "focal_length": [100, 100], "principal_point": [50, 50],
                                 "distortion": distortion, "pose_latency_us": latency}
                        for camera in ("left_camera", "right_camera")}, "sha256": "test-profile-v2"}

    def test_profile_v2_distortion_and_latency_flow_into_projection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            profile = self.profile_v2(root, [0.1, 0, 0, 0, 0], 20_000)
            five.validate_intrinsics_profile(root, profile)
            source = {"width": 100, "height": 100, "video_transform": "flip_vertical",
                      "intrinsics": {"focal_length": [100, 100], "principal_point": [50, 50]},
                      "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}}
            (root / "right_camera_characteristics.json").write_text(json.dumps(source))
            corrected = five.aligned_camera_calibration(root, "right_camera", 100, 100, intrinsics_profile=profile)
            self.assertEqual(corrected["distortion"], [0.1, 0, 0, 0, 0])
            self.assertEqual(corrected["pose_latency_us"], 20_000.0)
            joints = np.array([[0.1, 0.1, -1.0]])
            head = np.array([0, 0, 0, 0, 0, 0, 1])
            actual = five.converter.project_hand_to_video(joints, 1, head, corrected)
            # Normalized ray (0.1, 0.1): r^2 = 0.02, radial 1 + 0.1 * 0.02 = 1.002.
            np.testing.assert_allclose(actual[0], [50 + 100 * 0.1 * 1.002, 99 - (50 - 100 * 0.1 * 1.002)], atol=1e-3)
            for bad in ([5.0, 0, 0, 0, 0], [0.1, 0, 0, 0]):
                with self.assertRaises(ValueError):
                    five.validate_intrinsics_profile(root, self.profile_v2(root, bad, 0))
            with self.assertRaises(ValueError):
                five.validate_intrinsics_profile(root, self.profile_v2(root, [0.1, 0, 0, 0, 0], 10**9))

    def test_overlay_interpolates_bracketing_poses_and_applies_latency(self):
        names = list(dict.fromkeys(joint for bone in five.converter.HAND_BONES for joint in bone))
        wrist = names.index("Wrist")
        samples = np.zeros(3, dtype=[("t_sync_us", "i8"), ("left_joint_valid_mask", "u4"), ("right_joint_valid_mask", "u4"),
                                     ("left_joints_xyz_xyzw", "f4", (26, 7)), ("right_joints_xyz_xyzw", "f4", (26, 7))])
        samples["t_sync_us"] = [0, 20_000, 40_000]
        samples["right_joint_valid_mask"][:] = 1 << wrist
        samples["right_joints_xyz_xyzw"][:, wrist, 0] = [0.0, 0.2, 0.4]
        samples["right_joints_xyz_xyzw"][:, wrist, 2] = -1.0
        calibration = {"width": 100, "height": 100, "intrinsics": {"focal_length": [100, 100], "principal_point": [50, 50]},
                       "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}, "video_transform": "flip_vertical",
                       "distortion": [0.0] * 5, "pose_latency_us": 0.0}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "right_camera_timestamps.csv").write_text("frame_index,t_sync_us\n0,20000\n1,30000\n")
            rows = [{"side": "right", "frame_index": index, "t_sync_us": t,
                     "head": {"position": [0.1, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}} for index, t in enumerate([20_000, 30_000])]
            (root / "camera_pose_tracking.jsonl").write_text("\n".join(json.dumps(row) for row in rows))
            frames = list(five.project_synced_frames(root, "right_camera", calibration, samples, names))
            self.assertEqual(frames[0]["pose_sample_index"], 1)
            np.testing.assert_allclose(frames[0]["hands"]["right"]["points"], [[60, 49]], atol=1e-5)
            self.assertEqual(frames[1]["pose_alpha"], 0.5)
            np.testing.assert_allclose(frames[1]["hands"]["right"]["points"], [[70, 49]], atol=1e-5)
            shifted, _ = five.project_synced_frames(root, "right_camera", {**calibration, "pose_latency_us": 10_000.0}, samples, names)
            self.assertEqual(shifted["time_ns"], 20_000_000)
            np.testing.assert_allclose(shifted["hands"]["right"]["points"], [[70, 49]], atol=1e-5)
            earlier, _ = five.project_synced_frames(root, "right_camera", {**calibration, "pose_latency_us": -10_000.0}, samples, names)
            np.testing.assert_allclose(earlier["hands"]["right"]["points"], [[50, 49]], atol=1e-5)

    def test_explicit_basis_correction_reaches_aligned_overlay_once(self):
        names = list(dict.fromkeys(joint for bone in five.converter.HAND_BONES for joint in bone))
        wrist = names.index("Wrist")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for side, camera_x in (("left", -0.03), ("right", 0.03)):
                camera = f"{side}_camera"
                source = {"width": 1000, "height": 800, "video_transform": "flip_vertical",
                          "intrinsics": {"focal_length": [500, 500], "principal_point": [499.5, 399.5]},
                          "extrinsics": {"position": [camera_x, 0, -0.07], "rotation_xyzw": [1, 0, 0, 0]}}
                sidecar = root / f"{camera}_characteristics.json"
                sidecar.write_text(json.dumps(source))
                (root / f"{camera}_timestamps.csv").write_text("frame_index,t_sync_us\n0,20000\n")
                samples = np.zeros(1, dtype=[("t_sync_us", "i8"), ("left_joint_valid_mask", "u4"), ("right_joint_valid_mask", "u4"),
                                           ("left_joints_xyz_xyzw", "f4", (26, 7)), ("right_joints_xyz_xyzw", "f4", (26, 7))])
                samples["t_sync_us"] = 20_000
                samples["right_joint_valid_mask"] = 1 << wrist
                for rotation in ([0, 0, 0, 1], [0, np.sqrt(0.5), 0, np.sqrt(0.5)]):
                    head = np.array([1, 2, 3, *rotation])
                    # Known ray (0.1, 0.1, -0.5) in the corrected camera frame.
                    point = np.array([[camera_x + 0.1, -0.1, 0.57]])
                    samples["right_joints_xyz_xyzw"][0, wrist, :3] = five.converter.rotate_vectors(point, head[3:])[0] + head[:3]
                    row = {"side": side, "frame_index": 0, "t_sync_us": 20_000,
                           "head": {"position": head[:3].tolist(), "rotation_xyzw": rotation}, "camera_extrinsics": source["extrinsics"]}
                    (root / "camera_pose_tracking.jsonl").write_text(json.dumps(row))
                    corrected = five.aligned_camera_calibration(root, camera, 500, 400, "reflect-z")
                    frame, = five.project_synced_frames(root, camera, corrected, samples, names)
                    np.testing.assert_allclose(frame["hands"]["right"]["points"], [[299.75, 249.25]], atol=0.0001)
                    self.assertEqual(corrected["extrinsics_convention"], "reflect-z")
                    self.assertEqual(corrected["recorded_extrinsics"], source["extrinsics"])
                    original = five.aligned_camera_calibration(root, camera, 500, 400)
                    before, = five.project_synced_frames(root, camera, original, samples, names)
                    self.assertGreater(np.linalg.norm(before["hands"]["right"]["points"] - frame["hands"]["right"]["points"]), 15)
                    self.assertEqual(json.loads(sidecar.read_text()), source)

    def test_overlay_uses_each_exposure_head_pose_and_clears_missing_tracking(self):
        names = list(dict.fromkeys(joint for bone in five.converter.HAND_BONES for joint in bone))
        wrist = names.index("Wrist")
        samples = np.zeros(3, dtype=[("t_sync_us", "i8"), ("left_joint_valid_mask", "u4"), ("right_joint_valid_mask", "u4"),
                                     ("left_joints_xyz_xyzw", "f4", (26, 7)), ("right_joints_xyz_xyzw", "f4", (26, 7))])
        samples["t_sync_us"] = [0, 20_000, 60_000]
        samples["right_joint_valid_mask"][:2] = 1 << wrist
        samples["right_joints_xyz_xyzw"][:, wrist, :3] = [[0, 0, -1], [0.2, 0.1, -1], [0.4, 0, -1]]
        calibration = {"width": 100, "height": 100, "intrinsics": {"focal_length": [100, 100], "principal_point": [50, 50]},
                       "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}, "video_transform": "flip_vertical"}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "right_camera_timestamps.csv").write_text("frame_index,t_sync_us\n0,20000\n1,60000\n2,200000\n")
            rows = [{"side": "right", "frame_index": index, "t_sync_us": t,
                     "head": {"position": [0.1, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}} for index, t in enumerate([20_000, 60_000, 200_000])]
            (root / "camera_pose_tracking.jsonl").write_text("\n".join(json.dumps(row) for row in rows))
            frames = list(five.project_synced_frames(root, "right_camera", calibration, samples, names))
            self.assertEqual([f["time_ns"] for f in frames], [20_000_000, 60_000_000, 200_000_000])
            self.assertEqual(frames[0]["pose_sample_index"], 1)
            np.testing.assert_allclose(frames[0]["hands"]["right"]["points"], [[60, 59]], atol=1e-5)
            self.assertEqual(frames[1]["hands"]["right"]["points"].size, 0)
            # A valid but stale source sample must also clear the overlay.
            samples["right_joint_valid_mask"][-1] = 1 << wrist
            stale = list(five.project_synced_frames(root, "right_camera", calibration, samples, names))[-1]
            self.assertEqual(stale["hands"]["right"]["points"].size, 0)
            self.assertEqual(stale["hands"]["right"]["bones"], [])

    def test_variable_intervals_and_last_frame_duration_are_preserved(self):
        rows = [{"presentation_time_us": 0, "frame_duration_us": 40005}, {"presentation_time_us": 40005, "frame_duration_us": 20004}]
        packets = [{"pts": 0, "duration": 40005}, {"pts": 40005, "duration": 20004}]
        info = {"streams": [{"time_base": "1/1000000"}], "packets": packets}
        five.verify_video(info, rows)
        packets[-1]["duration"] = 40005
        with self.assertRaisesRegex(ValueError, "duration differs"):
            five.verify_video(info, rows)
        packets[-1]["duration"] = 20004
        packets[-1]["pts"] = 40000
        with self.assertRaisesRegex(ValueError, "pts differs"):
            five.verify_video(info, rows)

    def test_short_interior_gaps_are_bridged_but_edges_and_long_gaps_stay_cleared(self):
        names = list(dict.fromkeys(joint for bone in five.converter.HAND_BONES for joint in bone))
        wrist = names.index("Wrist")
        metacarpal = names.index("IndexMetacarpal")
        samples = np.zeros(3, dtype=[("t_sync_us", "i8"), ("left_joint_valid_mask", "u4"), ("right_joint_valid_mask", "u4"),
                                     ("left_joints_xyz_xyzw", "f4", (26, 7)), ("right_joints_xyz_xyzw", "f4", (26, 7))])
        samples["t_sync_us"] = [0, 300_000, 600_000]
        samples["right_joint_valid_mask"][:2] = (1 << wrist) | (1 << metacarpal)
        samples["right_joint_valid_mask"][2] = 1 << wrist
        samples["right_joints_xyz_xyzw"][:, wrist, 0] = [0.0, 0.2, 0.5]
        samples["right_joints_xyz_xyzw"][:, metacarpal, 0] = [0.02, 0.22, 0.0]
        samples["right_joints_xyz_xyzw"][:, (wrist, metacarpal), 2] = -1.0
        calibration = {"width": 100, "height": 100, "intrinsics": {"focal_length": [100, 100], "principal_point": [50, 50]},
                       "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}, "video_transform": "flip_vertical",
                       "distortion": [0.0] * 5, "pose_latency_us": 0.0}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "right_camera_timestamps.csv").write_text(
                "frame_index,t_sync_us\n0,100000\n1,300000\n2,400000\n3,500000\n4,600000\n")
            rows = [{"side": "right", "frame_index": index, "t_sync_us": t,
                     "head": {"position": [0.1, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}}
                    for index, t in enumerate([100_000, 300_000, 400_000, 500_000, 600_000])]
            (root / "camera_pose_tracking.jsonl").write_text("\n".join(json.dumps(row) for row in rows))
            frames = list(five.project_synced_frames(root, "right_camera", calibration, samples, names))
            self.assertEqual([bool(f.get("bridged", False)) for f in frames], [False, False, True, True, False])
            self.assertEqual(frames[0]["hands"]["right"]["points"].size, 0)
            np.testing.assert_allclose(frames[1]["hands"]["right"]["points"], [[60, 49], [62, 49]], atol=1e-4)
            self.assertEqual(len(frames[1]["hands"]["right"]["bones"]), 1)
            # Bridged joints are limited to those visible at both ends and interpolated in image space.
            self.assertEqual(frames[2]["hands"]["right"]["indices"], [wrist])
            np.testing.assert_allclose(frames[2]["hands"]["right"]["points"], [[70, 49]], atol=1e-4)
            np.testing.assert_allclose(frames[3]["hands"]["right"]["points"], [[80, 49]], atol=1e-4)
            np.testing.assert_allclose(frames[4]["hands"]["right"]["points"], [[90, 49]], atol=1e-4)

    def test_long_gaps_are_never_bridged(self):
        names = list(dict.fromkeys(joint for bone in five.converter.HAND_BONES for joint in bone))
        wrist = names.index("Wrist")
        samples = np.zeros(3, dtype=[("t_sync_us", "i8"), ("left_joint_valid_mask", "u4"), ("right_joint_valid_mask", "u4"),
                                     ("left_joints_xyz_xyzw", "f4", (26, 7)), ("right_joints_xyz_xyzw", "f4", (26, 7))])
        samples["t_sync_us"] = [0, 200_000, 1_400_000]
        samples["right_joint_valid_mask"][:] = 1 << wrist
        samples["right_joints_xyz_xyzw"][:, wrist, 0] = [0.0, 0.2, 0.4]
        samples["right_joints_xyz_xyzw"][:, wrist, 2] = -1.0
        calibration = {"width": 100, "height": 100, "intrinsics": {"focal_length": [100, 100], "principal_point": [50, 50]},
                       "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}, "video_transform": "flip_vertical",
                       "distortion": [0.0] * 5, "pose_latency_us": 0.0}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "right_camera_timestamps.csv").write_text("frame_index,t_sync_us\n0,100000\n1,800000\n2,1400000\n")
            rows = [{"side": "right", "frame_index": index, "t_sync_us": t,
                     "head": {"position": [0.1, 0, 0], "rotation_xyzw": [0, 0, 0, 1]}} for index, t in enumerate([100_000, 800_000, 1_400_000])]
            (root / "camera_pose_tracking.jsonl").write_text("\n".join(json.dumps(row) for row in rows))
            frames = list(five.project_synced_frames(root, "right_camera", calibration, samples, names))
            # The 1.2 s interior gap exceeds the 500 ms bridge; edges are never bridged.
            self.assertEqual([f["hands"]["right"]["points"].size for f in frames], [0, 0, 2])
            self.assertFalse(any(f.get("bridged", False) for f in frames))

    def test_reused_source_frames_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "timestamps.csv"
            fields = ["frame_index", "t_sync_us", "presentation_time_us", "frame_duration_us", "source_frame_index", "repeated_source_frame"]
            with path.open("w") as handle:
                writer = csv.writer(handle)
                writer.writerow(fields)
                writer.writerows([[0, 0, 0, 40005, 10, 0], [1, 40005, 40005, 20004, 11, 0]])
            self.assertEqual(len(five.read_timestamps(path, 60009)), 2)
            path.write_text(path.read_text().replace("20004,11,0", "20004,10,0"))
            with self.assertRaisesRegex(ValueError, "Repeated source"):
                five.read_timestamps(path, 60009)


if __name__ == "__main__":
    unittest.main()
