/** Contact-gated estimates for the remainder of 170529. These are ordinal
 * visual hypotheses from 0.5s stereo samples, never measured pressure.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error("Usage: node 170529-visual-batch-30to110.mjs input-manifest.json observations.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.episode !== "20260911_170529" || manifest.samples.length !== 160 ||
    manifest.samples[0].requested_time_s !== 30.5 || manifest.samples.at(-1).requested_time_s !== 110) {
  throw new Error("Expected 160 original-stereo samples at 30.5–110s");
}

const names = ["palm", "thumb", "index", "middle", "ring", "little"];
const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0.2 });
const no = () => ({ contact: "no", relative_load: null, location: null, evidence: "direct", confidence: 0.9 });
const yes = (relative_load, location, evidence, confidence) => ({ contact: "yes", relative_load, location, evidence, confidence });
const all = (factory) => Object.fromEntries(names.map((name) => [name, factory()]));
const pinch = (strong = false) => ({ palm: unknown(),
  thumb: yes(strong ? 2 : 1, "distal_pad", "stereo_support", 0.71),
  index: yes(strong ? 2 : 1, "distal_pad", "stereo_support", 0.72),
  middle: yes(1, "middle_pad", "grip_prior", 0.54),
  ring: unknown(), little: unknown() });
const flat = (palm) => ({
  palm: palm ? yes(1, "palm_center", "temporal_motion", 0.55) : unknown(),
  thumb: unknown(), index: yes(1, "middle_pad", "stereo_support", 0.63),
  middle: yes(1, "middle_pad", "stereo_support", 0.64),
  ring: yes(1, "middle_pad", "stereo_support", 0.58),
  little: palm ? yes(1, "middle_pad", "stereo_support", 0.52) : unknown(),
});

// Boundaries follow the visible garment changes and right-glove release/regrip
// events, not the old Pressure envelope. Ambiguous onset frames remain unknown.
const phases = [
  [32.0, "pinch", "Printed beige trousers are lifted by the right glove at the hem and follow both hands.", "Pinch pads are visible; middle is a grip inference. Palm and ulnar fingers are unresolved."],
  [36.5, "pinch_strong", "Both hands stretch and rotate the printed beige trousers while the glove retains the edge.", "No exact force is measured; hidden opposing pads are only grip-constrained."],
  [41.0, "pinch", "The right glove keeps an edge grip while lowering and gathering the printed beige trousers.", "The hand is not flat in this interval, so palm-center pressure is not asserted."],
  [43.5, "none", "Both hands move clear of the beige trousers while reaching toward the next garment.", "No right-hand garment pressure supported in these sampled frames."],
  [44.0, "unknown", "The glove approaches the light gray shirt; first touch is ambiguous.", "Unknown is not zero force; contact onset is between sampled times."],
  [45.5, "pinch", "The right glove and bare left hand lift the gray shirt by opposing edges.", "Thumb/index pads supported by cloth co-motion; middle contact is inferred."],
  [47.0, "pinch_strong", "The gray shirt is raised and opened while the right glove holds its edge.", "Occluded finger loads and palm contact are not asserted."],
  [48.0, "unknown", "The right glove briefly loosens or repositions on the gray shirt.", "The 0.5-second stills cannot prove continuous load through this regrip."],
  [57.0, "pinch", "The glove again holds the gray shirt edge as the hands stretch and turn it.", "Only the opposed grip is supported; hidden pads remain an inference."],
  [57.5, "unknown", "The gray shirt is lowered onto the table as the glove changes contact.", "Release timing and which pads still touch are unresolved."],
  [58.5, "unknown", "The glove hovers or changes contact as the gray shirt lands on the table.", "Exact contact onset of the smoothing action is unresolved."],
  [59.5, "flat", "The right glove uses its fingers to settle the gray shirt edge on the table.", "The glove palm is not clearly on the cloth, so palm-center load remains unknown."],
  [61.5, "pinch", "The right glove gathers the gray shirt hem for another fold.", "The folded cloth follows the fingers; broad palm pressure is unsupported."],
  [62.5, "flat", "The gloved fingers touch the gray folded shirt without a clear palm press.", "The palm overlaps the table and cloth boundary, so its garment contact is unknown."],
  [63.0, "unknown", "The glove lies partly beside the folded shirt on the table.", "Garment contact cannot be distinguished from table contact at this sample."],
  [64.5, "pinch", "The gloved fingers adjust the lower edge of the folded gray shirt.", "The cloth edge follows the pinch; palm-center garment contact is not established."],
  [65.0, "unknown", "The glove rises or shifts away from the gray shirt.", "Any remaining contact is ambiguous."],
  [66.5, "none", "The right glove lifts away from the folded gray shirt.", "No supported contact during the reach to the next garment."],
  [67.0, "unknown", "The glove reaches for a fabric edge; exact first contact is ambiguous.", "No pressure invented for the hidden contact transition."],
  [68.0, "pinch", "The right glove folds and places the last gray-shirt edge.", "Pinch is visible but palm and remaining fingers are unresolved."],
  [71.0, "unknown", "The right glove approaches and begins to gather the green trousers waistband.", "The exact onset of pressure is unresolved."],
  [77.0, "pinch_strong", "The glove holds the green waistband opposite the left hand while the garment is lifted, stretched, and turned.", "Thumb/index grip supported; middle is inferred. Palm, ring, and little remain unknown."],
  [78.0, "pinch", "The waistband is lowered and the right glove guides its fold.", "Grip is loosening, without a measurable force trajectory."],
  [80.0, "flat_palm", "The glove smooths the green trousers on the table and visible wrinkles flatten.", "Dorsal glove and fabric motion support low-confidence palm contact only while flat."],
  [82.0, "pinch", "The glove folds a green edge while the bare hand holds the opposite side.", "Contact is localized to the edge; broad palm load is unsupported."],
  [82.5, "unknown", "The glove changes from edge grip to table contact.", "The contact transfer is not resolved by this sample."],
  [83.0, "none", "The glove lifts clear of the green garment.", "No garment contact supported."],
  [85.5, "flat_palm", "The glove returns flat onto the green trousers and smooths them with the left hand.", "Palm-center contact remains inferred from compression and co-motion."],
  [87.0, "none", "The glove lifts and moves toward the beige garment.", "No pressure assigned during this reach."],
  [87.5, "unknown", "The glove arrives near the beige garment; first touch is uncertain.", "Transition is not resolved in the still frames."],
  [89.0, "pinch", "The right glove gathers a beige fabric edge and lifts it.", "Hidden middle finger is grip-inferred; other hidden contact is unknown."],
  [94.0, "pinch_strong", "Both hands lift and stretch the beige garment while the right glove holds an edge.", "Only opposed grip is supported; no broad palm pressure asserted."],
  [94.5, "unknown", "The garment is lowered and the glove releases its elevated grip.", "Exact release frame and remaining fingertip loads are uncertain."],
  [95.0, "unknown", "The beige garment has just been lowered and the right glove changes to table contact.", "The grip-to-smoothing transition is unresolved."],
  [103.0, "flat_palm", "The right glove smooths the beige garment flat on the table beside the bare hand.", "Palm is inferred from flat hand and fabric flattening, never treated as measured force."],
  [105.0, "pinch", "The glove gathers and folds the beige fabric edge.", "Occluded opposing fingers use a grip prior, not a direct visual force reading."],
  [107.5, "flat_palm", "The glove presses the final beige fold flat on the table.", "Low-confidence palm inference applies only while the glove is flat on the cloth."],
  [108.0, "unknown", "Both hands begin to release and lift from the finished stack.", "Contact cessation falls between samples."],
  [110.0, "none", "Both open hands are raised clear of the garments.", "No right-hand contact supported at the end of the video."],
];

function judge(sample) {
  const t = sample.requested_time_s;
  const phase = phases.find(([end]) => t <= end);
  if (!phase) throw new Error(`No contact phase for ${t}s`);
  const [, mode, short_evidence, limitations] = phase;
  const regions = mode === "none" ? all(no) : mode === "unknown" ? all(unknown)
    : mode === "pinch" ? pinch() : mode === "pinch_strong" ? pinch(true)
    : mode === "flat" ? flat(false) : flat(true);
  const contact_state = mode === "none" ? "no_contact" : mode === "unknown" ? "uncertain"
    : mode.startsWith("pinch") ? "supporting" : "touching";
  return { schema_version: "visual-pressure-observation-v1", sample_id: sample.sample_id,
    time_s: sample.right.actual_time_s, contact_object: mode === "none" ? "none" : "other",
    contact_state, regions, short_evidence, limitations };
}

const annotations = manifest.samples.map(judge);
writeFileSync(outputPath, JSON.stringify({ schema_version: "visual-pressure-batch-v1", episode: manifest.episode, annotations }, null, 2) + "\n");
console.log(`Wrote ${annotations.length} contact-gated visual estimates for 170529 30.5–110s to ${outputPath}`);
