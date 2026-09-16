/** 0–20 s first-pass visual review of 41 original synchronized stereo boards.
 * Contact gates were audited with 0.1 s stereo onset/release sequences.
 * Loads remain relative biomechanical estimates, not sensor measurements.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error("Usage: node 165650-visual-batch-0to20.mjs input-manifest.json visual-pressure-observations.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.episode !== "20260911_165650" || manifest.samples.length !== 41) throw new Error("Expected the 41-sample 165650 0–20s manifest");
const unknown = () => ({ contact: "unknown", relative_load: null, location: null, evidence: "occluded", confidence: 0.2 });
const no = (confidence = 0.9) => ({ contact: "no", relative_load: null, location: null, evidence: "direct", confidence });
const yes = (relative_load, location, evidence, confidence) => ({ contact: "yes", relative_load, location, evidence, confidence });
const empty = () => Object.fromEntries(["palm", "thumb", "index", "middle", "ring", "little"].map((name) => [name, unknown()]));
const noContact = () => Object.fromEntries(["palm", "thumb", "index", "middle", "ring", "little"].map((name) => [name, no()]));
const grip = ({ light = false, pour = false } = {}) => ({
  palm: light ? unknown() : yes(1, "palm_thumb_side", "temporal_motion", 0.55),
  thumb: yes(light ? 1 : 2, "middle_pad", "stereo_support", 0.72),
  index: yes(light ? 1 : 2, "middle_pad", "grip_prior", 0.64),
  middle: yes(light ? 1 : 2, "middle_pad", "grip_prior", 0.62),
  ring: yes(light ? 1 : pour ? 2 : 1, "middle_pad", "grip_prior", 0.55),
  little: yes(1, "middle_pad", "grip_prior", 0.51),
});

function judge(sample) {
  const t = sample.requested_time_s;
  let contact_object = "kettle_handle", contact_state, regions, short_evidence, limitations;
  if (t < 2) {
    contact_object = "none";
    contact_state = "no_contact";
    regions = noContact();
    short_evidence = "Open right glove is away from the kettle in the synchronized views.";
    limitations = "No kettle contact; no force estimate is made.";
  } else if (t <= 2.5) {
    contact_state = t === 2 ? "approaching" : "uncertain";
    regions = empty();
    short_evidence = "The glove approaches or overlaps the kettle in one projection, but a stereo gap and stationary kettle do not establish contact.";
    limitations = "Unknown is not physical zero; the model intentionally shows no asserted pressure before the contact gate.";
  } else if (t === 3) {
    contact_state = "touching";
    regions = { ...empty(), thumb: yes(1, "middle_pad", "stereo_support", 0.62),
      index: yes(1, "middle_pad", "grip_prior", 0.53), middle: yes(1, "middle_pad", "grip_prior", 0.52) };
    short_evidence = "Both eyes show the glove beginning to enclose the handle near 2.8–3.0s; stable kettle support is not yet established.";
    limitations = "Light first contact only; ring/little and palm loads are not asserted.";
  } else if (t <= 6.5) {
    contact_state = "supporting";
    regions = grip();
    short_evidence = "The gray glove encloses the handle and kettle/hand move together; this is sustained grip rather than 2D overlap.";
    limitations = "Hidden finger loads are relative grip-prior estimates, not directly visible force.";
  } else if (t <= 16.5) {
    contact_state = "supporting";
    regions = grip({ pour: t >= 9 });
    short_evidence = t >= 9
      ? "The glove remains on the handle while the kettle is tilted and pours into the cup; hand and kettle co-move."
      : "The glove maintains a handle grip as the kettle moves toward the cup and begins to tilt.";
    limitations = "Changing kettle torque motivates only a modest relative change; water mass and exact per-finger force are unknown.";
  } else if (t <= 17.5) {
    contact_state = "supporting";
    regions = grip();
    short_evidence = "The glove still grips the handle as the kettle rotates back toward upright.";
    limitations = "Opposed finger-pad contact remains inferred because it is behind the handle.";
  } else if (t <= 18.5) {
    contact_state = "supporting";
    regions = grip({ light: true });
    short_evidence = "The kettle has returned to the table, but both views still show a closed right-hand grip on the handle.";
    limitations = "Table support lowers plausible load; exact force is unmeasured.";
  } else {
    contact_object = "none";
    contact_state = "no_contact";
    regions = noContact();
    short_evidence = "The right glove opens and separates from the handle; the kettle remains on the table.";
    limitations = "Dense 18.5–19.5s stereo review places the release before this sampled time; exact onset is not sensor-measured.";
  }
  return { schema_version: "visual-pressure-observation-v1", sample_id: sample.sample_id,
    time_s: sample.right.actual_time_s, contact_object, contact_state,
    regions, short_evidence, limitations };
}

const annotations = manifest.samples.map(judge);
writeFileSync(outputPath, JSON.stringify({ schema_version: "visual-pressure-batch-v1", episode: manifest.episode, annotations }, null, 2) + "\n");
console.log(`Wrote ${annotations.length} visual/contact-gated estimates for 0–20s to ${outputPath}`);
