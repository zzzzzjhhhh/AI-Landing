/** Second half of the 165650 visual Pressure review: sampled stereo evidence,
 * not measured force. Contact objects and states were audited on the full
 * original camera images; hidden finger loads are deliberately conservative.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error("Usage: node 165650-visual-batch-20to42.mjs input-manifest.json visual-pressure-observations.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.episode !== "20260911_165650" || manifest.samples.length !== 45 ||
    manifest.samples[0].requested_time_s !== 20.5 || manifest.samples.at(-1).requested_time_s !== 42.5) {
  throw new Error("Expected the 45-sample 165650 20.5–42.5s manifest");
}
const names = ["palm", "thumb", "index", "middle", "ring", "little"];
const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0.2 });
const no = () => ({ contact: "no", relative_load: null, location: null, evidence: "direct", confidence: 0.9 });
const yes = (load, location, evidence, confidence) => ({ contact: "yes", relative_load: load, location, evidence, confidence });
const all = (make) => Object.fromEntries(names.map((name) => [name, make()]));
const none = () => all(no);
const cup = (light = false) => ({ palm: unknown(),
  thumb: yes(light ? 1 : 2, "distal_pad", "stereo_support", 0.72),
  index: yes(light ? 1 : 2, "middle_pad", "stereo_support", 0.70),
  middle: yes(light ? 1 : 2, "middle_pad", "grip_prior", 0.58),
  ring: unknown(), little: unknown() });
const doorEdge = (light = false) => ({ palm: unknown(),
  thumb: yes(1, "middle_pad", "stereo_support", 0.60),
  index: yes(light ? 1 : 2, "distal_pad", "stereo_support", 0.69),
  middle: yes(light ? 1 : 2, "distal_pad", "stereo_support", 0.64),
  ring: unknown(), little: unknown() });
const doorPush = () => ({ palm: yes(1, "palm_center", "stereo_support", 0.61),
  thumb: unknown(), index: yes(1, "middle_pad", "stereo_support", 0.67),
  middle: yes(1, "middle_pad", "stereo_support", 0.65),
  ring: yes(1, "middle_pad", "stereo_support", 0.55), little: unknown() });
const cupPlace = () => ({ palm: unknown(),
  thumb: yes(1, "middle_pad", "stereo_support", 0.59),
  index: yes(1, "middle_pad", "stereo_support", 0.60),
  middle: yes(1, "middle_pad", "grip_prior", 0.52),
  ring: unknown(), little: unknown() });

function judge(sample) {
  const t = sample.requested_time_s;
  let contact_object = "none", contact_state = "no_contact", regions = none();
  let short_evidence = "The right glove is separated from the next contact object in both original camera views.";
  let limitations = "No right-glove load asserted from mere image proximity.";
  if (t >= 21.5 && t <= 26.0) {
    contact_object = "other"; contact_state = "supporting"; regions = cup(t >= 25.5);
    short_evidence = "The right glove opposes the bare left hand on the glass measuring cup; the cup and glove move together.";
    limitations = "Glass-cup contact is visible, but load sharing with the left hand and exact finger forces are unknown.";
  } else if (t >= 27.0 && t <= 27.5) {
    contact_object = "other"; contact_state = "uncertain"; regions = all(unknown);
    short_evidence = "The glove reaches the microwave front while the bare hand alone carries the cup.";
    limitations = "A single view can make the fingertips overlap the door; direct force is not yet established.";
  } else if (t >= 28.0 && t <= 30.5) {
    contact_object = "other"; contact_state = "supporting";
    regions = doorEdge();
    short_evidence = "The gloved fingers stay on the microwave edge as the door opens; the bare hand still carries the cup.";
    limitations = "The door edge obscures opposing pads; ring/little and palm loads are not asserted.";
  } else if (t >= 31.0 && t <= 31.5) {
    contact_object = "other"; contact_state = "uncertain"; regions = all(unknown);
    short_evidence = "The microwave door is open and the glove transitions from the door toward the cup.";
    limitations = "Contact object and force are ambiguous in this transition; unknown is not zero force.";
  } else if (t >= 32.0 && t <= 37.0) {
    contact_object = "other"; contact_state = "supporting"; regions = cupPlace();
    short_evidence = "The gloved hand contacts the cup while both hands move it into the microwave cavity.";
    limitations = "The bare left hand also supports the cup, and the microwave hides much of the right-hand contact surface.";
  } else if (t === 37.5) {
    contact_object = "other"; contact_state = "uncertain"; regions = all(unknown);
    short_evidence = "The right glove withdraws from the cup and moves toward the microwave door.";
    limitations = "The target of contact changes within the sampled interval, so no specific load is asserted.";
  } else if (t >= 38.0 && t <= 39.5) {
    contact_object = "other"; contact_state = "supporting"; regions = doorPush();
    short_evidence = "The right glove contacts the microwave door as it swings closed; the left hand also assists.";
    limitations = "A light distributed door-push estimate only; force magnitude and precise finger loading cannot be seen.";
  } else if (t >= 40.0 && t <= 41.5) {
    contact_object = "other"; contact_state = "touching";
    regions = { ...all(unknown), index: yes(1, "distal_pad", "stereo_support", 0.61),
      middle: yes(1, "distal_pad", "stereo_support", 0.56) };
    short_evidence = "The gloved fingertips rest or press on the microwave front/control area after the door closes.";
    limitations = "Which control is pressed is uncertain; no palm or hidden-finger pressure is invented.";
  }
  return { schema_version: "visual-pressure-observation-v1", sample_id: sample.sample_id,
    time_s: sample.right.actual_time_s, contact_object, contact_state, regions,
    short_evidence, limitations };
}

const annotations = manifest.samples.map(judge);
writeFileSync(outputPath, JSON.stringify({ schema_version: "visual-pressure-batch-v1", episode: manifest.episode, annotations }, null, 2) + "\n");
console.log(`Wrote ${annotations.length} visual/contact-gated estimates for 20.5–42.5s to ${outputPath}`);
