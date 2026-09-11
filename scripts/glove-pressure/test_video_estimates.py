import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from video_estimates import estimate_angles, merge_video_estimates


class VisualEstimateTests(unittest.TestCase):
    def setUp(self):
        self.annotations = json.loads((Path(__file__).parent / "episodes/20260910_150529-video-estimates.json").read_text())

    def test_video_observations_drive_grasp_release_and_preserve_missing_intervals(self):
        self.assertIsNone(estimate_angles(1, self.annotations))
        self.assertIsNone(estimate_angles(8, self.annotations))
        self.assertIsNone(estimate_angles(52, self.annotations))
        carry = estimate_angles(4, self.annotations)
        released = estimate_angles(19, self.annotations)
        self.assertGreater(carry["index02_z_deg"], released["index02_z_deg"] + 50)
        self.assertTrue(all(0 <= angle <= 100 for angle in carry.values()))

    def test_native_pose_always_wins_over_a_video_estimate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "right_camera.mp4").write_bytes(b"fixture-video")
            (root / "sync_manifest.json").write_text(json.dumps({"episode": self.annotations["episode_id"]}))
            self.annotations["source_sha256"] = hashlib.sha256(b"fixture-video").hexdigest()
            annotations = root / "annotations.json"
            annotations.write_text(json.dumps(self.annotations))
            frames = root / "frames.jsonl"
            original = {"time_ns": 4_000_000_000, "valid": True, "joints": {"Wrist": [1, 2, 3]}, "pose_sample_index": 5}
            frames.write_text(json.dumps(original) + "\n" + json.dumps({"time_ns": 5_000_000_000, "valid": False, "joints": None}) + "\n")
            metadata = {}
            merge_video_estimates(root, frames, annotations, metadata)
            native, estimated = map(json.loads, frames.read_text().splitlines())
            self.assertEqual(native["joints"], original["joints"])
            self.assertEqual(native["pose_sample_index"], 5)
            self.assertNotIn("estimated_angles", native)
            self.assertEqual(estimated["pose_source"], "visual_video_estimate")
            self.assertIsNone(estimated["pose_sample_index"])
            self.assertEqual(metadata["native_frame_count"], 1)
            self.assertEqual(metadata["video_estimated_frame_count"], 1)


if __name__ == "__main__":
    unittest.main()
