import test from "node:test";
import assert from "node:assert/strict";
import { Quaternion, Vector3 } from "three";
import { fingerChains, inferRightHand } from "./pose-retargeting.mjs";
import { loadRightHandRig } from "./right-hand-rig.mjs";
import { rotationsFromAngles } from "./movement-playback.mjs";

function straightHand() {
  const joints = { Wrist: [0, 0, 0] };
  for (const [finger, chain] of Object.entries(fingerChains)) {
    const x = { thumb: 2, index: 1, middle: 0, ring: -1, little: -2 }[finger];
    for (let i = 1; i < chain.length; i++) joints[chain[i]] = [x, i, 0];
    if (finger !== "thumb") joints[chain[0]] = [x, 0, 0];
  }
  return joints;
}

test("keypoint inference preserves independent finger bends and ignores global hand motion", () => {
  const joints = straightHand();
  assert.ok(inferRightHand(joints).bends.index02_bend_deg < 1e-5);
  joints.IndexDistal = [1, 2, 1];
  joints.IndexTip = [1, 2, 2];
  const inferred = inferRightHand(joints);
  assert.ok(Math.abs(inferred.bends.index02_bend_deg - 90) < 1e-5);
  assert.ok(inferred.bends.index03_bend_deg < 1e-5);
  assert.ok(inferred.bends.middle02_bend_deg < 1e-5);
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(1, 2, 3).normalize(), 1.7);
  const moved = Object.fromEntries(Object.entries(joints).map(([name, xyz]) => [name, new Vector3(...xyz).multiplyScalar(0.04).applyQuaternion(rotation).add(new Vector3(2, 5, -7)).toArray()]));
  const other = inferRightHand(moved);
  for (const name of Object.keys(inferred.directions)) {
    assert.ok(new Vector3(...inferred.directions[name]).distanceTo(new Vector3(...other.directions[name])) < 1e-10);
  }
  assert.throws(() => inferRightHand({ ...joints, IndexTip: null }), /Missing valid/);
  assert.throws(() => inferRightHand({ ...joints, IndexTip: joints.IndexDistal }), /degenerate/);
});

test("the skinned right-hand model reproduces source directions and exports replayable angles", async () => {
  const rig = await loadRightHandRig();
  try {
    const joints = straightHand();
    const open = rig.samplePose(joints);
    joints.IndexDistal = [1, 2, 1];
    joints.IndexTip = [1, 1, 1];
    const result = rig.samplePose(joints);
    const target = inferRightHand(joints);
    for (const [name, direction] of Object.entries(result.directions)) {
      assert.ok(new Vector3(...direction).distanceTo(new Vector3(...target.directions[name])) < 1e-6, name);
    }
    assert.notDeepEqual(result.meshes, open.meshes);
    assert.ok(result.meshes.every((mesh) => [...mesh.positions, ...mesh.normals].every(Number.isFinite)));
    const replay = rig.sample(result.angles);
    result.meshes.forEach((mesh, i) => mesh.positions.forEach((value, j) => assert.ok(Math.abs(value - replay[i].positions[j]) < 1e-5)));
    const quaternionReplay = rig.sampleRotations(rotationsFromAngles(result.angles));
    result.meshes.forEach((mesh, i) => mesh.positions.forEach((value, j) => assert.ok(Math.abs(value - quaternionReplay[i].positions[j]) < 1e-5)));
    assert.deepEqual(rig.samplePose(straightHand()).meshes, open.meshes);
  } finally { rig.dispose(); }
});
