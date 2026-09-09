import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np


spec = importlib.util.spec_from_file_location("converter", Path(__file__).with_name("convert-pico-raw-to-rerun.py"))
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)


class FrameSynchronizationTests(unittest.TestCase):
    def timestamps(self, offset=9):
        return {
            "frame_index": np.arange(4),
            "capture_time_ns": np.array([100, 133, 183, 250]) * 1_000_000,
            "t_unix_ms": np.array([0, 33, 83, 150]) + 1000 + offset,
            "presentation_time_us": np.array([0, 33, 83, 150]) * 1000,
        }

    def test_selected_frames_preserve_source_clock(self):
        aligned = converter.align_video_frames(np.array([0, 83_000_000, 150_000_000]), self.timestamps(), np.arange(1000, 1200, 10), 1000)
        np.testing.assert_array_equal(aligned["source_indices"], [0, 2, 3])
        np.testing.assert_array_equal(aligned["timeline_ns"], [9_000_000, 92_000_000, 159_000_000])
        np.testing.assert_array_equal(aligned["pose_indices"], [1, 9, 16])

    def test_stereo_clock_offsets_are_not_collapsed_to_zero(self):
        for offset in [9, 28]:
            aligned = converter.align_video_frames(np.array([0]), self.timestamps(offset), np.arange(1000, 1200, 10), 1000)
            self.assertEqual(aligned["report"]["first_frame_offset_ms"], offset)

    def test_cfr_retimed_video_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "regenerate"):
            converter.align_video_frames(np.array([0, 50_000_000]), self.timestamps(), np.arange(1000, 1200, 10), 1000)

    def test_missing_pose_is_cleared_instead_of_held(self):
        aligned = converter.align_video_frames(np.array([0, 83_000_000, 150_000_000]), self.timestamps(), np.array([1000, 1010, 1180]), 1000)
        np.testing.assert_array_equal(aligned["valid_pose"], [True, False, True])
        self.assertEqual(aligned["report"]["frames_without_pose"], 1)

    def test_pose_before_start_and_after_end_are_not_extrapolated(self):
        aligned = converter.align_video_frames(np.array([0, 150_000_000]), self.timestamps(), np.array([1010, 1150]), 1000)
        np.testing.assert_array_equal(aligned["valid_pose"], [False, False])

    def test_nearest_pose_uses_future_sample_when_closer(self):
        np.testing.assert_array_equal(converter.nearest_indices(np.array([0, 14, 30]), np.array([-1, 8, 15, 40])), [0, 1, 1, 2])

    def test_csv_requires_monotonic_clock(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "timestamps.csv"
            path.write_text("frame_index,capture_time_ns,t_unix_ms,presentation_time_us\n0,100,10,0\n1,90,20,10\n")
            with self.assertRaisesRegex(ValueError, "capture_time_ns"):
                converter.read_camera_timestamps(path)

    def test_overlay_logs_only_at_video_frame_times(self):
        aligned = converter.align_video_frames(np.array([0, 150_000_000]), self.timestamps(), np.array([1000, 1010, 1160]), 1000)
        samples = np.zeros(3, dtype=converter.pose_dtype())
        samples["head_pose_xyz_xyzw"][:, 6] = 1
        with patch.object(converter.rr, "set_time") as set_time, patch.object(converter.rr, "log"), patch.object(converter, "project_hand_to_video", return_value={}):
            joint_names = list(dict.fromkeys(name for bone in converter.HAND_BONES for name in bone))
            converter.log_frame_overlays("left", aligned, samples, joint_names, {}, [])
        tracking = [call.kwargs["duration"] for call in set_time.call_args_list if call.args[0] == "tracking_time"]
        self.assertEqual(tracking, [np.timedelta64(9, "ms"), np.timedelta64(159, "ms")])


class CameraExtrinsicsTests(unittest.TestCase):
    def extrinsics(self):
        return {"position": [-0.03, 0.0, -0.07], "rotation_xyzw": [1.0, 0.0, 0.0, 0.0]}

    def test_recorded_is_default_and_does_not_mutate_input(self):
        source = self.extrinsics()
        original = copy.deepcopy(source)
        result = converter.convert_camera_extrinsics(source, "recorded")
        self.assertEqual(result, original)
        result["position"][2] = 99
        result["rotation_xyzw"][0] = 99
        self.assertEqual(source, original)
        with patch("sys.argv", ["converter"]):
            self.assertEqual(converter.parse_args().camera_extrinsics_convention, "recorded")

    def test_reflection_changes_translation_and_rotation_basis_together(self):
        source = {"position": [0.03, -0.002, -0.069], "rotation_xyzw": [0.7, -0.2, 0.1, 0.6]}
        original = copy.deepcopy(source)
        result = converter.convert_camera_extrinsics(source, "reflect-z")
        np.testing.assert_allclose(result["position"], [0.03, -0.002, 0.069])
        reflection = np.array([1, 1, -1])
        vectors = np.eye(3)
        np.testing.assert_allclose(
            converter.rotate_vectors(vectors * reflection, np.array(result["rotation_xyzw"])),
            converter.rotate_vectors(vectors, np.array(source["rotation_xyzw"])) * reflection,
        )
        self.assertEqual(source, original)
        self.assertEqual(converter.convert_camera_extrinsics(result, "reflect-z"), source)

    def test_camera_basis_fix_projects_stereo_points_at_both_head_orientations(self):
        for camera_x in [-0.03, 0.03]:
            source = self.extrinsics()
            source["position"][0] = camera_x
            characteristics = {
                "width": 1000, "height": 800,
                "intrinsics": {"focal_length": [500, 500], "principal_point": [499.5, 399.5]},
                "video_transform": "flip_vertical",
                "extrinsics": converter.convert_camera_extrinsics(source, "reflect-z"),
            }
            # This ray is (0.1, 0.1, -0.5) in the corrected camera frame.
            joint_in_head = np.array([[camera_x + 0.1, -0.1, 0.57]])
            for head_rotation in ([0, 0, 0, 1], [0, np.sqrt(0.5), 0, np.sqrt(0.5)]):
                head = np.array([1, 2, 3, *head_rotation])
                world_joint = converter.rotate_vectors(joint_in_head, head[3:]) + head[:3]
                projected = converter.project_hand_to_video(world_joint, 1, head, characteristics)
                np.testing.assert_allclose(projected[0], [599.5, 499.5])
                original = {**characteristics, "extrinsics": source}
                before = converter.project_hand_to_video(world_joint, 1, head, original)
                self.assertGreater(np.linalg.norm(np.array(before[0]) - projected[0]), 30)

    def test_3d_camera_uses_the_same_corrected_extrinsics_as_overlay(self):
        row = {
            "side": "left", "t_unix_ms": 1000,
            "head": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]},
            "camera_extrinsics": self.extrinsics(),
        }
        with patch.object(converter.rr, "set_time"), patch.object(converter.rr, "log"), patch.object(converter.rr, "Transform3D") as transform:
            converter.log_camera_pose_rows([row], 1000, "reflect-z")
        # The corrected +Z Unity camera translation becomes -Z in Rerun.
        np.testing.assert_allclose(transform.call_args.kwargs["translation"], [-0.03, 0, -0.07])
        self.assertEqual(row["camera_extrinsics"], self.extrinsics())

    def test_unknown_convention_fails_closed(self):
        with self.assertRaises(ValueError):
            converter.convert_camera_extrinsics(self.extrinsics(), "guess")


if __name__ == "__main__":
    unittest.main()
