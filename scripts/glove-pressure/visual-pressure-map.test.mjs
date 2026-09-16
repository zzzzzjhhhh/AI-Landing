import test from "node:test";
import assert from "node:assert/strict";
import { visualPressureToTaxels } from "./visual-pressure-map.mjs";

const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0 });
const base = () => ({ schema_version: "visual-pressure-observation-v1", sample_id: "test", time_s: 3,
  contact_object: "kettle_handle", contact_state: "touching", short_evidence: "Synthetic test", limitations: "None", regions: {
    palm: unknown(), thumb: unknown(), index: unknown(), middle: unknown(), ring: unknown(), little: unknown(),
  } });

test("one observed index-pad contact lights only the index ROI", () => {
  const item = base();
  item.regions.index = { contact: "yes", relative_load: 2, location: "distal_pad", evidence: "direct", confidence: 0.9 };
  const result = visualPressureToTaxels(item);
  assert.equal(result.data.length, 460);
  assert.ok(result.levels.index > 0);
  assert.deepEqual(result.unknown, ["palm", "middle", "ring", "little", "thumb"]);
  for (let row = 0; row < 23; row++) for (let col = 0; col < 20; col++) {
    if (row < 15 || col < 12 || col >= 16) assert.equal(result.data[row * 20 + col], 0);
  }
  assert.equal(result.data.some(Boolean), true);
});

test("no-contact annotation renders no pressure and cannot conceal a loaded finger", () => {
  const item = base();
  item.contact_object = "none";
  item.contact_state = "no_contact";
  for (const name of Object.keys(item.regions)) item.regions[name] = { contact: "no", relative_load: null, location: null, evidence: "direct", confidence: 0.9 };
  assert.equal(visualPressureToTaxels(item).data.some(Boolean), false);
  item.regions.thumb = { contact: "yes", relative_load: 3, location: "tip", evidence: "direct", confidence: 0.9 };
  assert.throws(() => visualPressureToTaxels(item));
});

test("occluded but mechanically supported grip renders finger pressure with inference provenance", () => {
  const item = base();
  item.contact_state = "supporting";
  item.regions.index = { contact: "yes", relative_load: 2, location: "middle_pad", evidence: "grip_prior", confidence: 0.62 };
  item.regions.middle = { contact: "yes", relative_load: 2, location: "middle_pad", evidence: "grip_prior", confidence: 0.6 };
  const result = visualPressureToTaxels(item);
  assert.deepEqual(result.inferred, ["index", "middle"]);
  assert.ok(result.levels.index > 0 && result.levels.middle > 0);
  assert.ok(result.unknown.includes("ring"));
});

test("approaching 2D overlap cannot light Pressure without an asserted contact", () => {
  const item = base();
  item.contact_state = "approaching";
  assert.equal(visualPressureToTaxels(item).data.some(Boolean), false);
  item.regions.thumb = { contact: "yes", relative_load: 1, location: "distal_pad", evidence: "direct", confidence: 0.8 };
  assert.throws(() => visualPressureToTaxels(item), /Non-contact state/);
});
