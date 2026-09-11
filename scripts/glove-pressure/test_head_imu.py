"""Physical reference cases for head-pose-derived virtual IMU channels."""
import unittest

import numpy as np
from scipy.spatial.transform import Rotation

from head_imu import GRAVITY, estimate_imu


class HeadImuTests(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(4)
        self.ns = np.r_[0, np.cumsum(rng.integers(9_000_000, 19_000_000, 240))]
        self.t = self.ns / 1e9

    def test_stationary_and_constant_velocity_have_only_gravity(self):
        for velocity in ([0, 0, 0], [0.2, -0.1, 0.3]):
            positions = self.t[:, None] * velocity + [0, 1.5, 0]
            q = np.tile([0, 0, 0, 1.0], (len(self.t), 1))
            q[::2] *= -1  # Quaternion sign changes must not produce gyro spikes.
            result = estimate_imu(self.ns, positions, q)
            np.testing.assert_allclose(result["values"], np.tile([0, 9.80665, 0, 0, 0, 0], (len(self.t), 1)), atol=1e-10)

    def test_known_acceleration_in_a_tilted_head_frame(self):
        acceleration = np.array([1.2, -0.3, 0.5])
        positions = 0.5 * self.t[:, None]**2 * acceleration
        orientation = Rotation.from_euler("xyz", [0.7, -0.4, 0.2])
        q = np.tile(orientation.as_quat(), (len(self.t), 1))
        result = estimate_imu(self.ns, positions, q)
        expected = orientation.inv().apply(acceleration - GRAVITY)
        np.testing.assert_allclose(result["values"][:, :3], np.tile(expected, (len(self.t), 1)), atol=1e-9)
        np.testing.assert_allclose(result["values"][:, 3:], 0, atol=1e-10)

    def test_body_gyro_has_correct_axis_sign_and_rad_per_second(self):
        omega = np.array([0.25, -0.5, 0.3])
        orientation = Rotation.from_euler("xyz", [0.4, 0.6, -0.3]) * Rotation.from_rotvec(self.t[:, None] * omega)
        q = orientation.as_quat()
        q[::3] *= -1
        result = estimate_imu(self.ns, np.zeros((len(self.t), 3)), q)
        np.testing.assert_allclose(result["values"][:, 3:], np.tile(omega, (len(self.t), 1)), atol=1e-10)
        np.testing.assert_allclose(result["values"][:, :3], orientation.inv().apply(np.tile(-GRAVITY, (len(self.t), 1))), atol=1e-10)

    def test_smooth_motion_peaks_stay_on_the_original_clock(self):
        frequency = 2 * np.pi * 0.7
        positions = np.column_stack([0.1 * np.sin(frequency * self.t), np.zeros((len(self.t), 2))])
        q = np.tile([0, 0, 0, 1], (len(self.t), 1))
        result = estimate_imu(self.ns, positions, q)
        expected = -0.1 * frequency**2 * np.sin(frequency * self.t)
        interior = ~result["edge"]
        np.testing.assert_allclose(result["accel_world"][interior, 0], expected[interior], atol=0.05)
        first_cycle = self.t < 1 / 0.7
        observed_peak = self.t[first_cycle][np.argmin(result["accel_world"][first_cycle, 0])]
        expected_peak = self.t[first_cycle][np.argmin(expected[first_cycle])]
        self.assertLess(abs(observed_peak - expected_peak), 0.02)

    def test_tracking_reset_is_not_interpreted_as_a_force_impulse(self):
        positions = np.zeros((len(self.t), 3))
        positions[len(self.t) // 2:, 0] = 0.5
        q = np.tile([0, 0, 0, 1], (len(self.t), 1))
        result = estimate_imu(self.ns, positions, q)
        self.assertEqual(result["discontinuity_count"], 1)
        np.testing.assert_allclose(result["accel_world"], 0, atol=1e-10)

    def test_invalid_quaternion_and_duplicate_timestamp_fail(self):
        positions = np.zeros((len(self.t), 3))
        q = np.tile([0, 0, 0, 1.0], (len(self.t), 1))
        duplicate = self.ns.copy()
        duplicate[1] = duplicate[0]
        with self.assertRaises(ValueError):
            estimate_imu(duplicate, positions, q)
        q[20] = 0
        with self.assertRaises(ValueError):
            estimate_imu(self.ns, positions, q)


if __name__ == "__main__":
    unittest.main()
