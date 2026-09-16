/** Small 170529 stereo Pressure pilot. The right hand wears the gray/black glove.
 * Values are ordinal visual estimates, not measured force.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error("Usage: node 170529-visual-pilot-0to10.mjs input-manifest.json visual-pressure-observations.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.episode !== "20260911_170529" || manifest.samples.length !== 21 ||
    manifest.samples[0].requested_time_s !== 0 || manifest.samples.at(-1).requested_time_s !== 10) {
  throw new Error("Expected the 21-sample 170529 0–10s manifest");
}
const names = ["palm", "thumb", "index", "middle", "ring", "little"];
const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0.2 });
const no = () => ({ contact: "no", relative_load: null, location: null, evidence: "direct", confidence: 0.9 });
const yes = (load, location, evidence, confidence) => ({ contact: "yes", relative_load: load, location, evidence, confidence });
const all = (make) => Object.fromEntries(names.map((name) => [name, make()]));
const flatCloth = () => ({ palm: yes(1, "palm_center", "stereo_support", 0.70),
  thumb: unknown(), index: yes(1, "middle_pad", "stereo_support", 0.65),
  middle: yes(1, "middle_pad", "stereo_support", 0.64),
  ring: yes(1, "middle_pad", "stereo_support", 0.57), little: unknown() });
const pinchCloth = (stretch) => ({ palm: unknown(),
  thumb: yes(stretch ? 2 : 1, "distal_pad", "stereo_support", 0.71),
  index: yes(stretch ? 2 : 1, "distal_pad", "stereo_support", 0.72),
  middle: yes(stretch ? 2 : 1, "middle_pad", "grip_prior", 0.56),
  ring: unknown(), little: unknown() });

function judge(sample) {
  const t = sample.requested_time_s;
  let contact_object = "none", contact_state = "no_contact", regions = all(no);
  let short_evidence = "The right glove is open above the clothing with no established fabric contact in either eye.";
  let limitations = "No load asserted from image proximity.";
  if (t === 2) {
    contact_object = "other"; contact_state = "approaching"; regions = all(unknown);
    short_evidence = "The glove approaches green clothing, but the frame does not yet establish supported contact.";
    limitations = "The cloth may be touched between sampled frames; this frame has no asserted pressure.";
  } else if (t >= 2.5 && t <= 4.5) {
    contact_object = "other"; contact_state = "touching"; regions = flatCloth();
    short_evidence = "The open right glove visibly rests or presses on the green fabric on the table in both eyes.";
    limitations = "Broad soft-fabric contact only; cloth deformation does not calibrate finger force.";
  } else if (t >= 5 && t <= 5.5) {
    contact_object = "other"; contact_state = "supporting"; regions = pinchCloth(false);
    short_evidence = "The gloved thumb and fingertips begin pinching the garment edge while the other hand assists.";
    limitations = "The opposing pads are partially occluded by fabric; middle-finger load is a low-confidence grip inference.";
  } else if (t >= 6 && t <= 10) {
    contact_object = "other"; contact_state = "supporting"; regions = pinchCloth(t >= 7);
    short_evidence = "The right glove keeps a pinch on the garment waistband while both hands lift and stretch it; the cloth co-moves with the hand.";
    limitations = "Ordinal tension-related estimate only; fabric stretch, load sharing, and individual finger force cannot be measured from video.";
  }
  return { schema_version: "visual-pressure-observation-v1", sample_id: sample.sample_id,
    time_s: sample.right.actual_time_s, contact_object, contact_state, regions,
    short_evidence, limitations };
}

const annotations = manifest.samples.map(judge);
writeFileSync(outputPath, JSON.stringify({ schema_version: "visual-pressure-batch-v1", episode: manifest.episode, annotations }, null, 2) + "\n");
console.log(`Wrote ${annotations.length} visual/contact-gated estimates for 170529 0–10s to ${outputPath}`);
