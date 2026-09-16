/** 11 original stereo boards plus explicit, confidence-tagged grip mechanics.
 * Occlusion is not zero pressure when a handle is visibly held and moved.
 */
import { readFileSync, writeFileSync } from "node:fs";

const manifestPath = process.argv[2];
const outputPath = process.argv[3];
if (!manifestPath || !outputPath) throw new Error("Usage: node 165650-visual-pilot-judgment.mjs input-manifest.json visual-pressure-observations.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0.2 });
const no = (confidence = 0.9) => ({ contact: "no", relative_load: null, location: null, evidence: "direct", confidence });
const yes = (relative_load, location, evidence, confidence) => ({ contact: "yes", relative_load, location, evidence, confidence });
const grip = (index, middle, ring, little) => ({
  index: yes(index, "middle_pad", "grip_prior", 0.64),
  middle: yes(middle, "middle_pad", "grip_prior", 0.62),
  ring: yes(ring, "middle_pad", "grip_prior", 0.56),
  little: yes(little, "middle_pad", "grip_prior", 0.52),
});
const firstGrip = () => ({
  index: yes(1, "middle_pad", "grip_prior", 0.53),
  middle: yes(1, "middle_pad", "grip_prior", 0.52),
});
const item = (index, contact_object, contact_state, observations, short_evidence, limitations) => {
  const sample = manifest.samples[index - 1];
  return { schema_version: "visual-pressure-observation-v1", sample_id: sample.sample_id,
    time_s: sample.right.actual_time_s, contact_object, contact_state,
    regions: { palm: unknown(), thumb: unknown(), index: unknown(), middle: unknown(), ring: unknown(), little: unknown(), ...observations },
    short_evidence, limitations };
};

const annotations = [
  item(1, "kettle_handle", "uncertain", {},
    "The glove overlaps the kettle in one 2D projection, but stereo views do not establish surface contact; the kettle remains still.",
    "Contact is unresolved at 2.200s. The visual pilot renders no pressure, which is not a proof of zero physical force."),
  item(2, "kettle_handle", "approaching", { thumb: no(0.7) },
    "The glove closes toward the handle, while a gap remains visible in the other eye and the kettle stays table-supported.",
    "The hidden fingers cannot be evaluated; no grip pressure is asserted at 2.580s."),
  item(3, "kettle_handle", "touching", { ...firstGrip(), thumb: yes(1, "middle_pad", "stereo_support", 0.62) },
    "The glove begins enclosing the handle in both eyes around 2.8–3.0s; sustained object support is not yet established.",
    "This is light initial contact. Index/middle involvement is weak grip inference; ring/little and palm remain unresolved."),
  item(4, "kettle_handle", "supporting", { ...grip(2, 2, 1, 1), thumb: yes(2, "middle_pad", "stereo_support", 0.73), palm: yes(1, "palm_thumb_side", "temporal_motion", 0.56) },
    "The right hand remains wrapped around the handle across both eyes.",
    "Dorsal glove is visible; four finger-pad loads follow a grip prior because pads are behind the handle."),
  item(5, "kettle_handle", "supporting", { ...grip(2, 2, 1, 1), thumb: yes(2, "middle_pad", "stereo_support", 0.75), palm: yes(1, "palm_thumb_side", "temporal_motion", 0.6) },
    "Stable grip accompanies displacement of the kettle; thumb-side contact remains aligned with the handle.",
    "Individual loads and pad locations are mechanically inferred, not measured or directly seen."),
  item(6, "kettle_handle", "supporting", { ...grip(2, 2, 1, 1), thumb: yes(2, "middle_pad", "stereo_support", 0.7), palm: yes(1, "palm_thumb_side", "temporal_motion", 0.58) },
    "The right glove still grips the handle as kettle and camera move left.",
    "Full stereo frames support the held object; per-finger loads remain grip-prior estimates."),
  item(7, "kettle_handle", "supporting", { ...grip(2, 2, 1, 1), thumb: yes(2, "middle_pad", "stereo_support", 0.64), palm: yes(1, "palm_thumb_side", "temporal_motion", 0.55) },
    "The glove and visible handle remain joined during the leftward movement.",
    "The hand nears the crop edge; four-finger pad location and load are inferred from maintained grip."),
  item(8, "kettle_handle", "supporting", { ...grip(2, 2, 1, 1), thumb: yes(2, "middle_pad", "stereo_support", 0.76), palm: yes(1, "palm_thumb_side", "temporal_motion", 0.57) },
    "Both eyes show a maintained grip at the handle while the kettle is being set down.",
    "Table support reduces the likely grip load; four finger pads remain hidden and inferred."),
  item(9, "kettle_handle", "supporting", { ...grip(1, 1, 1, 1), thumb: yes(1, "middle_pad", "stereo_support", 0.72), palm: yes(1, "palm_thumb_side", "temporal_motion", 0.54) },
    "The glove has not yet fully opened, but the kettle now rests on the table.",
    "Residual finger pressure is weak and inferred from the maintained handle grip."),
  item(10, "kettle_handle", "releasing", { thumb: yes(1, "distal_pad", "stereo_support", 0.59), palm: no(0.73), index: no(0.65), middle: no(0.65), ring: no(0.65), little: no(0.65) },
    "The hand opens and withdraws; the thumb-side edge is still close to the handle.",
    "This may be the last light thumb-side touch rather than measurable pressure."),
  item(11, "none", "no_contact", { palm: no(), thumb: no(), index: no(), middle: no(), ring: no(), little: no() },
    "The open right glove is separated from the kettle in both eyes.",
    "No pressure on the kettle is inferred after visible separation."),
];

writeFileSync(outputPath, JSON.stringify({ schema_version: "visual-pressure-batch-v1", episode: "20260911_165650", annotations }, null, 2) + "\n");
console.log(`Wrote ${annotations.length} conservative visual judgments to ${outputPath}`);
