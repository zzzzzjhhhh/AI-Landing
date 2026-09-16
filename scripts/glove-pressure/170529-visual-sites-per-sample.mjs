/** Explicit 0.5s visual-site audit for all 221 sampled frames of 170529.
 * Codes were checked in chronological contact sheets and ambiguous frames
 * kept unknown. This does not claim to resolve events between source frames.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pressureSites, visualSitesToTaxels } from "./visual-pressure-site-map.mjs";

const [firstPath, middlePath, lastPath, observationsPath, taxelsPath] = process.argv.slice(2);
if (![firstPath, middlePath, lastPath, observationsPath, taxelsPath].every(Boolean)) {
  throw new Error("Usage: node 170529-visual-sites-per-sample.mjs 0to10-manifest 10to30-manifest 30to110-manifest observations.json taxels.jsonl");
}
const manifests = [firstPath, middlePath, lastPath].map((path) => JSON.parse(readFileSync(path, "utf8")));
if (manifests.some((m) => m.episode !== "20260911_170529")) throw new Error("Unexpected episode");
const samples = manifests.flatMap((manifest) => manifest.samples);
if (samples.length !== 221 || samples.some((sample, index) => sample.requested_time_s !== index * 0.5)) {
  throw new Error("Expected 221 consecutive 0.5s stereo samples from 0 through 110s");
}

// One symbol PER inspected stereo sample. N = visibly away; U = unresolved;
// G = cloth follows an opposed edge grip; T = light fingertip contact;
// B = broad, flat smoothing with cloth compression. The site map below remains
// conservative when individual gloved finger pads are hidden.
const blocks = [
  "N N N N U B B B B B G G G G G G G G G G",       // 0–9.5
  "G G G G G G G G G G G B B T T G G G T B",       // 10–19.5
  "B B B B B B B B B B N N N N N U G G G G",       // 20–29.5
  "G G G G G G G G G G G G G G G G G G G G",       // 30–39.5
  "G G U N N N N N U G G G N U N U G G U G",       // 40–49.5
  "G G G G G G G G G G G G G G G U U U T T",       // 50–59.5
  "G G G G T T U G G G U N N N U G G N N N",       // 60–69.5
  "N U U G G G G G G G G G G G G G B B B B",       // 70–79.5
  "B B G G G B B B B N N U G G G G G G G G",       // 80–89.5
  "G G G G G G G G G U U U B B B B B B B B",       // 90–99.5
  "B B B B B B B G G G G B B B B B U N N N",       // 100–109.5
  "N",                                               // 110
];
const codes = blocks.flatMap((row, block) => {
  const entries = row.split(/\s+/);
  if (entries.length !== (block === 11 ? 1 : 20)) throw new Error(`Bad visual audit block ${block}`);
  return entries;
});
if (codes.length !== samples.length || codes.some((code) => !"NUGTB".includes(code))) throw new Error("Bad sample code sequence");
// Full-resolution stereo rechecks of the fast fold/release examples. Keep
// borderline frames unknown instead of extending pressure from a neighbor.
for (const [time, code] of [[14, "U"], [15, "B"], [16, "G"], [17, "U"],
  [46, "U"], [84, "N"]]) codes[Math.round(time * 2)] = code;

const mark = (contact, relative_load = null, evidence = "direct", confidence = 0.9) =>
  ({ contact, relative_load, evidence, confidence });
function sitesFor(code) {
  const all = Object.fromEntries(pressureSites.map((site) => [site, mark(code === "N" ? "no" : "unknown", null,
    code === "N" ? "direct" : "occluded", code === "N" ? 0.92 : 0.25)]));
  if (code === "G") {
    all.thumb_tip = mark("yes", 2, "stereo_support", 0.69);
    all.index_tip = mark("yes", 2, "stereo_support", 0.71);
  } else if (code === "T") {
    all.index_tip = mark("yes", 1, "stereo_support", 0.62);
    all.middle_tip = mark("yes", 1, "stereo_support", 0.58);
  } else if (code === "B") {
    all.palm_center = mark("yes", 1, "temporal_motion", 0.55);
    for (const finger of ["index", "middle"]) {
      all[`${finger}_tip`] = mark("yes", 1, "stereo_support", 0.59);
      all[`${finger}_middle`] = mark("yes", 1, "stereo_support", 0.56);
    }
  }
  return all;
}
const evidence = {
  N: "The right glove is visibly clear of the garment in this stereo sample.",
  U: "A release, reach, or 2D overlap makes garment contact unresolved in this stereo sample.",
  G: "The garment edge moves with the gloved right-hand opposed grip in this stereo sample.",
  T: "Only light right-glove fingertip contact is supported by the garment edge in this stereo sample.",
  B: "The right glove is spread on the garment and its wrinkles flatten in this stereo sample.",
};
const observations = samples.map((sample, index) => {
  const code = codes[index];
  const sites = sitesFor(code);
  const t = sample.requested_time_s;
  // In these flat, spread-hand frames the ring/little fingertips and middle
  // phalanges are distinguishable on the cloth in both camera views.
  if (code === "B" && ((t >= 19.5 && t <= 23) || (t >= 82.5 && t <= 83.5) ||
      (t >= 96 && t <= 102.5))) {
    for (const finger of ["ring", "little"]) {
      sites[`${finger}_tip`] = mark("yes", 1, "stereo_support", 0.55);
      sites[`${finger}_middle`] = mark("yes", 1, "stereo_support", 0.53);
    }
  }
  return { schema_version: "visual-pressure-sites-v1", sample_id: `170529-site-${String(index).padStart(4, "0")}`,
    time_s: sample.right.actual_time_s, requested_time_s: sample.requested_time_s,
    left_source_frame_index: sample.left.source_frame_index, right_source_frame_index: sample.right.source_frame_index,
    left_image: sample.left.full_image, right_image: sample.right.full_image,
    contact_state: code === "N" ? "no_contact" : code === "U" ? "uncertain" : code === "G" ? "supporting" : "touching",
    contact_code: code, sites, short_evidence: evidence[code],
    limitations: "A 0.5s image sample cannot reveal pressure force or brief contact changes between samples. Hidden finger sites remain unknown.",
  };
});
const mapped = observations.map((item) => {
  const result = visualSitesToTaxels(item);
  return { sample_id: item.sample_id, time_ns: Math.round(item.time_s * 1e9), data: Array.from(result.data),
    levels: result.levels, unknown_regions: [...new Set(result.unknown_sites.map((site) => site.split("_")[0]))],
    inferred_regions: [...new Set(result.inferred_sites.map((site) => site.split("_")[0]))],
    active_sites: Object.entries(item.sites).filter(([, mark]) => mark.contact === "yes").map(([site]) => site),
    unknown_sites: result.unknown_sites, inferred_sites: result.inferred_sites,
    contact_state: item.contact_state, source: result.source, measured: false };
});
writeFileSync(observationsPath, JSON.stringify({ schema_version: "visual-pressure-sites-batch-v1", episode: "20260911_170529", sampling_hz: 2, observations }, null, 2) + "\n");
writeFileSync(taxelsPath, mapped.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(`Wrote ${observations.length} explicit 11-site visual audits and taxel samples`);
