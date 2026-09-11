import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contactAt, inferPressure, validatePressureProfile } from "./pressure-inference.mjs";
import { fingerChains } from "./pose-retargeting.mjs";

const profile = JSON.parse(readFileSync(new URL("./episodes/20260910_153529-pressure-estimates.json", import.meta.url)));
function hand() {
  const joints = { Wrist: [0, 0, 0] };
  for (const [finger, chain] of Object.entries(fingerChains)) {
    const x = { thumb: 2, index: 1, middle: 0, ring: -1, little: -2 }[finger];
    for (let i = 1; i < chain.length; i++) joints[chain[i]] = [x, i, 0];
    if (finger !== "thumb") joints[chain[0]] = [x, 0, 0];
  }
  return joints;
}
const frame = (time, joints = hand()) => ({ time_ns: time * 1e9, valid: true, pose_sample_index: 42, joints });

test("contact envelope supports the full episode and rejects invalid annotations", () => {
  validatePressureProfile(profile);
  assert.equal(contactAt(0, profile).strength, profile.keyframes[0].strength);
  assert.equal(contactAt(profile.duration_s, profile).strength, 0);
  for (const value of [-1, profile.duration_s + 1, NaN]) assert.throws(() => contactAt(value, profile));
  const invalid = structuredClone(profile);
  invalid.keyframes[1].time_s = 0;
  assert.throws(() => validatePressureProfile(invalid), /keyframe/);
  invalid.keyframes[1].time_s = .6;
  invalid.contacts.index.weight = 1.2;
  assert.throws(() => validatePressureProfile(invalid), /region/);
});

test("lift/carry strengthens contact; release clears every taxel even with curled fingers", () => {
  const curled = hand();
  curled.IndexDistal = [1, 2, 1];
  curled.IndexTip = [1, 1, 1];
  const held = inferPressure(frame(4, curled), profile);
  const lifted = inferPressure(frame(7.8, curled), profile);
  assert.ok(lifted.peak > held.peak * 1.5);
  assert.ok(lifted.levels.index > lifted.levels.little * 5);
  assert.ok(lifted.levels.index > lifted.levels.palm * 5);
  for (const time of [15.65, 16, profile.duration_s]) {
    const released = inferPressure(frame(time, curled), profile);
    assert.equal(released.peak, 0);
    assert.ok(released.data.every((value) => value === 0));
  }
});

test("recorded finger bends independently modulate only annotated contacts", () => {
  const joints = hand(), before = structuredClone(joints);
  const straight = inferPressure(frame(10, joints), profile);
  assert.deepEqual(joints, before);
  joints.IndexDistal = [1, 2, 1];
  joints.IndexTip = [1, 1, 1];
  const curled = inferPressure(frame(10, joints), profile);
  assert.ok(curled.levels.index > straight.levels.index);
  assert.equal(curled.levels.middle, straight.levels.middle);
  assert.equal(curled.source, "video_contact_and_recorded_pose");
  assert.equal(curled.pose_sample_index, 42);
  assert.deepEqual(curled, inferPressure(frame(10, joints), profile));
  assert.equal(curled.data.length, 460);
  // Unused cells in the glove's 23x20 sensor layout remain unloaded.
  for (let row = 0; row < 15; row++) assert.ok(curled.data.slice(row * 20 + 16, row * 20 + 20).every((v) => v === 0));
});

test("missing and degenerate pose use declared video-only pressure without a fake pose index", () => {
  for (const item of [{ ...frame(10), valid: false, joints: null }, frame(10, {})]) {
    const result = inferPressure(item, profile);
    assert.equal(result.source, "video_contact_only");
    assert.equal(result.pose_sample_index, null);
    assert.ok(result.peak > 0);
    assert.ok(Object.values(result.curls).every((v) => v === null));
  }
});
