import test from "node:test";
import assert from "node:assert/strict";
import { pressureSites, visualSitesToTaxels } from "./visual-pressure-site-map.mjs";

const mark = (contact, load = null) => ({ contact, relative_load: load, evidence: "direct", confidence: contact === "yes" ? 0.8 : 0.9 });
const sample = () => ({ schema_version: "visual-pressure-sites-v1", sample_id: "test", time_s: 1,
  contact_state: "touching", sites: Object.fromEntries(pressureSites.map((site) => [site, mark("no")])) });

test("tip and middle contact on one finger occupy only that finger's taxels", () => {
  const item = sample();
  item.sites.index_tip = mark("yes", 2);
  item.sites.index_middle = mark("yes", 1);
  const result = visualSitesToTaxels(item);
  assert.ok(result.levels.index > 0);
  assert.equal(result.levels.palm, null);
  for (let row = 0; row < 23; row++) for (let col = 0; col < 20; col++) {
    if (row < 15 || col < 12 || col >= 16) assert.equal(result.data[row * 20 + col], 0);
  }
});

test("a hovering hand has no Pressure and an unknown site is not zero evidence", () => {
  const item = sample();
  item.contact_state = "no_contact";
  item.sites.thumb_tip = mark("unknown");
  const result = visualSitesToTaxels(item);
  assert.equal(result.data.some(Boolean), false);
  assert.deepEqual(result.unknown_sites, ["thumb_tip"]);
  item.sites.index_tip = mark("yes", 1);
  assert.throws(() => visualSitesToTaxels(item), /unsupported pressure/);
});
