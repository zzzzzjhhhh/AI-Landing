import importlib.util
import hashlib
import json
import sys
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).parent))
spec = importlib.util.spec_from_file_location("pressure", Path(__file__).with_name("build-recording.py"))
pressure = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pressure)


class PressureBlueprintTests(unittest.TestCase):
    def test_supplementary_layout_preserves_camera_bounds_and_equal_columns(self):
        dimensions = {"left": (960, 720), "right": (1280, 960)}
        with patch.object(pressure.rrb, "Spatial2DView") as view, patch.object(pressure.rrb, "VisualBounds2D") as bounds, patch.object(pressure.rrb, "Horizontal") as horizontal, patch.object(pressure.rrb, "Vertical"), patch.object(pressure.rrb, "Blueprint"):
            pressure.pressure_blueprint(dimensions)
        self.assertEqual(bounds.call_args_list[0].kwargs, {"x_range": [0, 960], "y_range": [0, 720]})
        self.assertEqual(bounds.call_args_list[1].kwargs, {"x_range": [0, 1280], "y_range": [0, 960]})
        self.assertTrue(all("visual_bounds" in call.kwargs for call in view.call_args_list))
        self.assertEqual(horizontal.call_args_list[0].kwargs["column_shares"], [1, 1])

    def test_pressure_view_preserves_status_and_scale_with_minimal_title(self):
        with patch.object(pressure.rrb, "Spatial3DView") as view, patch.object(pressure.rrb, "Horizontal"), patch.object(pressure.rrb, "Vertical"), patch.object(pressure.rrb, "Blueprint"):
            pressure.pressure_blueprint({"left": (960, 720), "right": (960, 720)}, estimated_pressure=True)
        self.assertEqual(view.call_args_list[0].kwargs["name"], "Right pressure")
        self.assertIn("$origin/status", view.call_args_list[0].kwargs["contents"])
        self.assertIn("$origin/legend", view.call_args_list[0].kwargs["contents"])
        self.assertEqual(view.call_args_list[1].kwargs["name"], "Right hand flexion · POSE")

    def test_pressure_profile_rejects_wrong_episode_and_stale_raw_data(self):
        with tempfile.TemporaryDirectory() as temporary:
            raw = Path(temporary)
            names = ["sync_manifest.json", "right_camera.mp4", "right_camera_timestamps.csv", "pose_samples.bin", "pose_schema.json"]
            for name in names:
                (raw / name).write_text('{"episode":"test"}' if name == "sync_manifest.json" else name)
            profile = {"version": 1, "episode_id": "test", "duration_s": 1,
                       "source_files": {name: hashlib.sha256((raw / name).read_bytes()).hexdigest() for name in names}}
            path = raw / "profile.json"
            path.write_text(json.dumps(profile))
            self.assertIn("profile_sha256", pressure.load_pressure_profile(raw, path, 1_000_000_000))
            with self.assertRaisesRegex(ValueError, "duration"):
                pressure.load_pressure_profile(raw, path, 2_000_000_000)
            profile["episode_id"] = "other"
            path.write_text(json.dumps(profile))
            with self.assertRaisesRegex(ValueError, "episode"):
                pressure.load_pressure_profile(raw, path, 1_000_000_000)
            profile["episode_id"] = "test"
            path.write_text(json.dumps(profile))
            (raw / "pose_samples.bin").write_text("changed")
            with self.assertRaisesRegex(ValueError, "pose_samples"):
                pressure.load_pressure_profile(raw, path, 1_000_000_000)


if __name__ == "__main__":
    unittest.main()
