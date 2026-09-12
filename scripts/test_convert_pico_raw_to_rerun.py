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
            converter.log_frame_overlays("left", aligned, samples, joint_names, {"width": 960, "height": 720}, [])
        tracking = [call.kwargs["duration"] for call in set_time.call_args_list if call.args[0] == "tracking_time"]
        self.assertEqual(tracking, [np.timedelta64(9, "ms"), np.timedelta64(159, "ms")])


class VideoBoundsTests(unittest.TestCase):
    def test_clips_crossing_bones_without_clamping_their_direction(self):
        cases = [
            ([2, 2], [8, 6], [[2, 2], [8, 6]]),
            ([-5, 0], [5, 10], [[0, 5], [2, 7]]),
            ([-5, 3], [15, 3], [[0, 3], [9, 3]]),
            ([3, -5], [3, 15], [[3, 0], [3, 7]]),
            ([15, 3], [-5, 3], [[9, 3], [0, 3]]),
            ([0, 0], [0, 7], [[0, 0], [0, 7]]),
            ([4, 3], [4, 3], [[4, 3], [4, 3]]),
        ]
        for start, end, expected in cases:
            with self.subTest(start=start, end=end):
                np.testing.assert_allclose(converter.clip_line_to_video(start, end, 10, 8), expected)

    def test_rejects_fully_outside_and_nonfinite_bones(self):
        for start, end in [([-5, 0], [-1, 7]), ([0, 9], [9, 9]), ([12, 4], [12, 4]), ([np.nan, 0], [3, 3]), ([0, 0], [np.inf, 3])]:
            with self.subTest(start=start, end=end):
                self.assertIsNone(converter.clip_line_to_video(start, end, 10, 8))

    def test_frame_logging_filters_points_but_retains_visible_bone_sections(self):
        samples = np.zeros(1, dtype=converter.pose_dtype())
        joint_names = list(dict.fromkeys(name for bone in converter.HAND_BONES for name in bone))
        first, second = (joint_names.index(name) for name in converter.HAND_BONES[0])
        projected = {first: [100, 100], second: [1100, 600]}
        original = copy.deepcopy(projected)
        alignment = {"source_times_ms": [1000], "timeline_ns": [0], "pose_indices": [0], "pose_left_indices": [0],
                     "pose_right_indices": [0], "pose_alpha": [0.0], "source_indices": [0], "valid_pose": [True]}
        with patch.object(converter.rr, "set_time"), patch.object(converter.rr, "log"), patch.object(converter, "project_hand_to_video", return_value=projected), patch.object(converter.rr, "Points2D") as points, patch.object(converter.rr, "LineStrips2D") as bones:
            converter.log_frame_overlays("left", alignment, samples, joint_names, {"width": 960, "height": 720}, [])
        for call in points.call_args_list:
            np.testing.assert_array_equal(call.args[0], [[100, 100]])
        for call in bones.call_args_list:
            np.testing.assert_allclose(call.args[0], [[[100, 100], [959, 529.5]]])
        self.assertEqual(projected, original)

    def test_empty_visible_overlay_clears_previous_points_and_bones(self):
        samples = np.zeros(1, dtype=converter.pose_dtype())
        joint_names = list(dict.fromkeys(name for bone in converter.HAND_BONES for name in bone))
        alignment = {"source_times_ms": [1000], "timeline_ns": [0], "pose_indices": [0], "pose_left_indices": [0],
                     "pose_right_indices": [0], "pose_alpha": [0.0], "source_indices": [0], "valid_pose": [True]}
        with patch.object(converter.rr, "set_time"), patch.object(converter.rr, "log"), patch.object(converter, "project_hand_to_video", return_value={0: [-10, -20]}), patch.object(converter.rr, "Points2D") as points, patch.object(converter.rr, "LineStrips2D") as bones:
            converter.log_frame_overlays("right", alignment, samples, joint_names, {"width": 960, "height": 720}, [])
        for call in points.call_args_list:
            self.assertEqual(call.args[0].shape, (0, 2))
        for call in bones.call_args_list:
            self.assertEqual(call.args[0], [])

    def test_camera_views_use_video_dimensions_not_overlay_bounds(self):
        dimensions = {"left": (960, 720), "right": (1280, 960)}
        with patch.object(converter.rrb, "Spatial2DView") as view, patch.object(converter.rrb, "VisualBounds2D") as bounds, patch.object(converter.rrb, "Horizontal"), patch.object(converter.rrb, "Vertical"), patch.object(converter.rrb, "Blueprint"):
            converter.default_blueprint(dimensions, {"left", "right"})
        self.assertEqual(bounds.call_count, 2)
        self.assertEqual(bounds.call_args_list[0].kwargs, {"x_range": [0, 960], "y_range": [0, 720]})
        self.assertEqual(bounds.call_args_list[1].kwargs, {"x_range": [0, 1280], "y_range": [0, 960]})
        self.assertTrue(all("visual_bounds" in call.kwargs for call in view.call_args_list))


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


class DistortionTests(unittest.TestCase):
    def characteristics(self, distortion=None):
        characteristics = {
            "width": 1000, "height": 800,
            "intrinsics": {"focal_length": [500, 500], "principal_point": [499.5, 399.5]},
            "video_transform": "flip_vertical",
            "extrinsics": {"position": [0, 0, 0], "rotation_xyzw": [0, 0, 0, 1]},
        }
        if distortion is not None:
            characteristics["distortion"] = distortion
        return characteristics

    def ray_joint(self):
        # World joint on the camera ray (0.1, 0.1, -0.5) for an identity head pose.
        return np.array([[0.1, 0.1, -0.5]])

    def test_missing_or_zero_distortion_keeps_pinhole_projection(self):
        head = np.array([0, 0, 0, 0, 0, 0, 1])
        plain = converter.project_hand_to_video(self.ray_joint(), 1, head, self.characteristics())
        zeros = converter.project_hand_to_video(self.ray_joint(), 1, head, self.characteristics([0.0] * 5))
        np.testing.assert_allclose(plain[0], [599.5, 499.5])
        np.testing.assert_allclose(zeros[0], plain[0])

    def test_radial_and_tangential_terms_follow_brown_conrady(self):
        head = np.array([0, 0, 0, 0, 0, 0, 1])
        # Normalized ray (0.2, 0.2): radial 1 + k1 r^2 with r^2 = 0.08.
        radial = converter.project_hand_to_video(self.ray_joint(), 1, head, self.characteristics([0.1, 0, 0, 0, 0]))
        np.testing.assert_allclose(radial[0], [499.5 + 500 * 0.2 * 1.008, 799 - (399.5 - 500 * 0.2 * 1.008)])
        tangential = converter.project_hand_to_video(self.ray_joint(), 1, head, self.characteristics([0, 0, 0.05, 0, 0]))
        np.testing.assert_allclose(tangential[0], [499.5 + 500 * 0.204, 799 - (399.5 - 500 * 0.208)])
        mixed = converter.project_hand_to_video(self.ray_joint(), 1, head, self.characteristics([0.1, -0.2, 0.05, -0.05, 0.3]))
        self.assertTrue(np.isfinite(mixed[0]).all())

    def test_invalid_distortion_fails_closed(self):
        for value in ([0.1, 0.2], [0.1, 0, 0, 0, np.nan], [2.0, 0, 0, 0, 0], "barrel"):
            with self.assertRaises(ValueError):
                converter.parse_distortion(value)
        self.assertIsNone(converter.parse_distortion(None))
        np.testing.assert_allclose(converter.parse_distortion([0.1, -0.2, 0.05, -0.05, 0.3]), [0.1, -0.2, 0.05, -0.05, 0.3])

    def test_normalized_rays_reproject_back_through_pinhole(self):
        head = np.array([0, 0, 0, 0, 0, 0, 1])
        rays = converter.normalized_rays(self.ray_joint(), 1, head, self.characteristics())
        np.testing.assert_allclose(rays[0], [0.2, 0.2])
        characteristics = self.characteristics()
        xn, yn = rays[0]
        pixel = [499.5 + 500 * xn, 799 - (399.5 - 500 * yn)]
        np.testing.assert_allclose(converter.project_hand_to_video(self.ray_joint(), 1, head, characteristics)[0], pixel)
        self.assertEqual(converter.normalized_rays(np.array([[0.1, 0.1, 0.5]]), 1, head, characteristics), {})


class PoseInterpolationTests(unittest.TestCase):
    def samples(self, times, wrist_positions, wrist_bit):
        samples = np.zeros(len(times), dtype=converter.pose_dtype())
        samples["t_unix_ms"] = times
        samples["right_joint_valid_mask"] = wrist_bit
        samples["right_joints_xyz_xyzw"][:, 0, 0] = wrist_positions
        return samples

    def test_brackets_cover_exact_hits_midpoints_and_out_of_range(self):
        times = np.array([0, 10, 30])
        left, right, fraction, distance, in_range = converter.pose_brackets(times, np.array([-5.0, 0.0, 5.0, 15.0, 35.0]))
        np.testing.assert_array_equal(left, [0, 0, 0, 1, 1])
        np.testing.assert_array_equal(right, [1, 1, 1, 2, 2])
        np.testing.assert_allclose(fraction, [-0.5, 0.0, 0.5, 0.25, 1.25])
        np.testing.assert_allclose(distance, [5.0, 0.0, 5.0, 5.0, 5.0])
        np.testing.assert_array_equal(in_range, [False, True, True, True, False])

    def test_interpolation_blends_positions_and_ands_masks(self):
        wrist_bit = 1 | (1 << 5)
        samples = self.samples([0, 100], [0.0, 2.0], wrist_bit)
        blended = converter.interpolated_pose_sample(samples, 0, 1, 0.5)
        np.testing.assert_allclose(blended["right_joints_xyz_xyzw"][0, 0], 1.0)
        self.assertEqual(blended["right_joint_valid_mask"], wrist_bit)
        head = converter.interpolated_pose_sample(samples, 0, 1, 0.25)
        np.testing.assert_allclose(head["right_joints_xyz_xyzw"][0, 0], 0.5)
        samples["right_joint_valid_mask"][1] = 1
        partial = converter.interpolated_pose_sample(samples, 0, 1, 0.5)
        self.assertEqual(partial["right_joint_valid_mask"], 1)
        self.assertEqual(partial["right_joints_xyz_xyzw"][5, 0], 0.0)

    def test_exact_sample_hit_uses_single_sample_without_next_mask(self):
        wrist_bit = 1 | (1 << 5)
        samples = self.samples([0, 100], [0.0, 2.0], wrist_bit)
        samples["right_joint_valid_mask"][1] = 1
        exact = converter.interpolated_pose_sample(samples, 1, 1, 0.0)
        self.assertEqual(exact["right_joint_valid_mask"], 1)
        np.testing.assert_allclose(exact["right_joints_xyz_xyzw"][0, 0], 2.0)

    def test_align_video_frames_applies_pose_latency(self):
        timestamps = {
            "frame_index": np.arange(1),
            "capture_time_ns": np.array([100]) * 1_000_000,
            "t_unix_ms": np.array([1009]),
            "presentation_time_us": np.array([0]),
        }
        pose_times = np.arange(1000, 1200, 10)
        aligned = converter.align_video_frames(np.array([0]), timestamps, pose_times, 1000)
        self.assertEqual(aligned["pose_indices"], [1])
        shifted = converter.align_video_frames(np.array([0]), timestamps, pose_times, 1000, pose_latency_ms=-5.0)
        self.assertEqual(shifted["pose_indices"], [0])
        self.assertEqual(shifted["report"]["pose_latency_ms"], -5.0)
        self.assertEqual(shifted["report"]["mode"], "camera_timestamp_csv_bracketed_pose_interpolation_per_video_frame")


if __name__ == "__main__":
    unittest.main()
