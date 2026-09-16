/** Visual/contact-gated 170529 continuation. Evidence is original stereo frames
 * sampled every 0.5s; loads are ordinal, not measured force.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error("Usage: node 170529-visual-batch-10to30.mjs input-manifest.json visual-pressure-observations.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.episode !== "20260911_170529" || manifest.samples.length !== 40 ||
    manifest.samples[0].requested_time_s !== 10.5 || manifest.samples.at(-1).requested_time_s !== 30) {
  throw new Error("Expected the 40-sample 170529 10.5–30s manifest");
}
const names = ["palm", "thumb", "index", "middle", "ring", "little"];
const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0.2 });
const no = () => ({ contact: "no", relative_load: null, location: null, evidence: "direct", confidence: 0.9 });
const yes = (load, location, evidence, confidence) => ({ contact: "yes", relative_load: load, location, evidence, confidence });
const all = (make) => Object.fromEntries(names.map((name) => [name, make()]));
const pinch = (strong = false, wide = false) => ({ palm: unknown(),
  thumb: yes(strong ? 2 : 1, "distal_pad", "stereo_support", 0.70),
  index: yes(strong ? 2 : 1, "distal_pad", "stereo_support", 0.72),
  middle: yes(strong ? 2 : 1, "middle_pad", "grip_prior", 0.56),
  ring: wide ? yes(1, "middle_pad", "grip_prior", 0.51) : unknown(),
  little: unknown() });
const spread = () => ({ palm: unknown(), thumb: unknown(),
  index: yes(1, "middle_pad", "stereo_support", 0.63),
  middle: yes(1, "middle_pad", "stereo_support", 0.61),
  ring: yes(1, "middle_pad", "stereo_support", 0.53), little: unknown() });

function judge(sample) {
  const t = sample.requested_time_s;
  let contact_object = "other", contact_state, regions, short_evidence, limitations;
  if (t <= 13.5) {
    contact_state = "supporting"; regions = pinch(t <= 12.5, t <= 11.5);
    short_evidence = "The gloved right hand remains on the green waistband as both hands rotate and lower the trousers; fabric co-moves with the pinch.";
    limitations = "Only thumb/index contact is comparatively clear; middle and, during the broad early hold, ring are grip inferences. Palm-center and little finger remain unknown.";
  } else if (t <= 14.5) {
    contact_state = "releasing"; regions = pinch(false, false);
    short_evidence = "The right glove guides the green garment down onto the table while loosening its edge grip.";
    limitations = "The cloth is becoming table-supported; exact finger force is unmeasured and palm contact is not asserted.";
  } else if (t <= 16.5) {
    contact_state = "touching"; regions = spread();
    short_evidence = "The open right glove smooths the green trouser leg on the table; fabric directly beneath the fingers flattens.";
    limitations = "The glove back is visible but not its palm surface. Finger-pad contact is supported, while palm-center contact remains unresolved.";
  } else if (t <= 19.0) {
    contact_state = "supporting"; regions = pinch(false, false);
    short_evidence = "The right hand lifts or folds an edge of the green fabric; the edge follows the gloved pinch.";
    limitations = "The opposing finger pads are occluded. No broad palm or little/ring load is invented.";
  } else if (t <= 24.5) {
    contact_state = "touching"; regions = spread();
    short_evidence = "The glove stays spread over the folded green trousers while both hands flatten and align the fabric.";
    limitations = "Only light distributed finger contact is estimated. The dorsal view cannot establish palm-center load, despite a palm-down pose.";
  } else if (t <= 27.0) {
    contact_object = "none"; contact_state = "no_contact"; regions = all(no);
    short_evidence = "The right glove opens and moves away from the folded green trousers while the bare left hand reaches toward the next garment.";
    limitations = "No supported right-glove contact is asserted in these sampled views.";
  } else if (t <= 27.5) {
    contact_state = "uncertain"; regions = all(unknown);
    short_evidence = "The glove moves toward the light-colored trousers; contact onset is not yet resolved in both views.";
    limitations = "Unknown is not measured zero; the 0.5s sample does not locate first contact more precisely.";
  } else {
    contact_state = "supporting"; regions = pinch(t >= 29, t >= 29);
    short_evidence = "The right glove pinches the light-colored waistband opposite the bare left hand; both hands lift and stretch the fabric.";
    limitations = "Thumb/index contact is supported by the opposed grip. Hidden middle and, in the broader stretch, ring are labeled inferences; palm/little remain unknown.";
  }
  return { schema_version: "visual-pressure-observation-v1", sample_id: sample.sample_id,
    time_s: sample.right.actual_time_s, contact_object, contact_state, regions,
    short_evidence, limitations };
}

const annotations = manifest.samples.map(judge);
writeFileSync(outputPath, JSON.stringify({ schema_version: "visual-pressure-batch-v1", episode: manifest.episode, annotations }, null, 2) + "\n");
console.log(`Wrote ${annotations.length} visual/contact-gated estimates for 170529 10.5–30s to ${outputPath}`);
