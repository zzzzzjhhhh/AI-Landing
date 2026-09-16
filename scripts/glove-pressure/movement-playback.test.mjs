import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion } from 'three';
import { movementFrames, rotationsFromAngles, blendRotations } from './movement-playback.mjs';
const frame = (t, angle, valid = true) => ({ time_ns: t * 1e9, valid, angles: { index01_x_deg: 0, index01_y_deg: 0, index01_z_deg: angle } });
const options = { fps: 30, maxGapSeconds: 2, smoothingRadiusSeconds: 0 };
const angle = r => 2 * Math.atan2(r[2], r[3]) * 180 / Math.PI;
test('bounded tracking gap stays visible and interpolates by timestamp', () => {
  const source = [frame(0, 0), frame(.3, 0, false), frame(.7, 70), frame(1, 100)];
  const before = JSON.stringify(source);
  const result = movementFrames(source, 1e9, options);
  assert.equal(result.length, 31); assert.ok(result.every(f => f.valid));
  assert.ok(Math.abs(angle(result[15].rotations.index01) - 50) < 1e-8);
  assert.equal(JSON.stringify(source), before);
});
test('long and unbounded gaps remain unavailable, with no frozen missing tail', () => {
  const result = movementFrames([frame(0, 0, false), frame(.1, 10), frame(3, 30), frame(3.1, 0, false)], 3.2e9, options);
  assert.equal(result[0].valid, false);
  assert.equal(result[30].valid, false);
  assert.equal(result.at(-1).valid, false);
});
test('optional display hold freezes the last valid pose and resumes when tracking returns', () => {
  const source = [frame(0, 0, false), frame(.1, 10), frame(3, 30), frame(3.1, 0, false)];
  const result = movementFrames(source, 3.2e9, { ...options, holdMissing: true });
  assert.equal(result[0].valid, false);
  assert.equal(result[0].held, true);
  assert.equal(result[30].valid, true);
  assert.equal(result[30].held, true);
  assert.ok(Math.abs(angle(result[30].rotations.index01) - 10) < 1e-8);
  assert.equal(result[90].valid, true);
  assert.equal(result[90].held, false);
  assert.equal(result.at(-1).valid, true);
  assert.equal(result.at(-1).held, true);
});
test('quaternion interpolation follows shortest arc across Euler wrap', () => {
  const a = rotationsFromAngles(frame(0, 179).angles), b = rotationsFromAngles(frame(0, -179).angles);
  const mid = blendRotations(a, b, .5).index01;
  assert.ok(Math.abs(Math.abs(angle(mid)) - 180) < 1e-8);
  assert.ok(Math.abs(new Quaternion().fromArray(mid).length() - 1) < 1e-10);
});
test('symmetric smoothing reduces an isolated jitter spike', () => {
  const frames = [frame(0, 0), frame(1/30, 30), frame(2/30, 0)];
  const result = movementFrames(frames, 2e9/30, { ...options, smoothingRadiusSeconds: .06 });
  assert.ok(angle(result[1].rotations.index01) < 20);
});
