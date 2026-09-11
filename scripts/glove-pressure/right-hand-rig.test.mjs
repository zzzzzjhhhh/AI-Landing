import test from "node:test";
import assert from "node:assert/strict";
import { gripAngles, loadRightHandRig, simulatedGrip } from "./right-hand-rig.mjs";

test("the real right-hand skin bends while the palm/forearm stay anchored", async () => {
  const rig = await loadRightHandRig();
  try {
    const open = rig.sample(gripAngles(simulatedGrip(0)));
    const closed = rig.sample(gripAngles(simulatedGrip(4)));
    assert.equal(open.length, rig.topology.length);
    let moved = 0, anchored = 0;
    for (let part = 0; part < open.length; part++) {
      const start = open[part], end = closed[part];
      assert.equal(start.positions.length, end.positions.length);
      assert.equal(end.normals.length, end.positions.length);
      assert.ok(end.positions.every(Number.isFinite) && end.normals.every(Number.isFinite));
      for (let i = 0; i < start.positions.length; i += 3) {
        const distance = Math.hypot(...start.positions.slice(i, i + 3).map((v, axis) => v - end.positions[i + axis]));
        if (distance > 0.1) moved++;
        if (distance < 1e-6) anchored++;
      }
      assert.ok(rig.topology[part].indices.every((index) => index >= 0 && index < start.positions.length / 3));
    }
    assert.ok(moved > 100, "Finger vertices must articulate, not just change material or rotate the whole hand");
    assert.ok(anchored > 100, "Palm and forearm must remain anchored");
    assert.deepEqual(rig.sample(gripAngles(simulatedGrip(8))), open, "The cycle returns exactly to the open pose");
    assert.notDeepEqual(rig.sample(gripAngles(0.5)), open);
    assert.throws(() => rig.sample({ missing_bone_z_deg: 30 }), /Invalid joint/);
  } finally { rig.dispose(); }
  assert.throws(() => rig.sample(), /disposed/);
});
