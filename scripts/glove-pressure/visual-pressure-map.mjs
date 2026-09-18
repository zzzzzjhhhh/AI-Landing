import { regions } from "./processor.mjs";
import { paintPressureRegion } from "./pressure-region-kernel.mjs";

// Same 23x20 right-glove taxel layout used by the existing Pressure hand model.
const fingerCenters = { tip: 0.84, distal_pad: 0.69, middle_pad: 0.48, proximal_pad: 0.27 };
const palmCenters = {
  palm_center: [0.5, 0.5], palm_thumb_side: [0.77, 0.48], palm_little_side: [0.24, 0.48],
};
const regionNames = regions.map(({ name }) => name);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateVisualPressureAnnotation(item) {
  check(item?.schema_version === "visual-pressure-observation-v1", "Invalid annotation schema");
  check(typeof item.sample_id === "string" && item.sample_id.length > 0, "Missing sample_id");
  check(Number.isFinite(item.time_s) && item.time_s >= 0, "Invalid time_s");
  check(["none", "kettle_handle", "kettle_body", "other", "unknown"].includes(item.contact_object), "Invalid contact_object");
  check(["no_contact", "approaching", "touching", "supporting", "releasing", "uncertain"].includes(item.contact_state), "Invalid contact_state");
  check(typeof item.short_evidence === "string" && item.short_evidence.trim(), "Missing short_evidence");
  check(typeof item.limitations === "string", "Missing limitations");
  check(item.regions && Object.keys(item.regions).length === regionNames.length, "Expected six regions");
  for (const name of regionNames) {
    const region = item.regions[name];
    check(region && ["yes", "no", "unknown"].includes(region.contact), `Invalid ${name} contact`);
    check(Number.isFinite(region.confidence) && region.confidence >= 0 && region.confidence <= 1, `Invalid ${name} confidence`);
    check(["direct", "stereo_support", "temporal_motion", "grip_prior", "occluded", "none"].includes(region.evidence), `Invalid ${name} evidence`);
    if (region.contact === "yes") {
      check(Number.isInteger(region.relative_load) && region.relative_load >= 1 && region.relative_load <= 3, `Invalid ${name} load`);
      check(name === "palm" ? Object.hasOwn(palmCenters, region.location) : Object.hasOwn(fingerCenters, region.location),
        `Invalid ${name} location`);
      check(region.confidence >= 0.5, `Unsupported ${name} pressure: confidence below 0.5`);
    } else {
      check(region.relative_load === null && region.location === null, `Non-contact ${name} must not invent load/location`);
    }
  }
  if (item.contact_state === "no_contact" || item.contact_state === "approaching") {
    check(regionNames.every((name) => item.regions[name].contact !== "yes"), "Non-contact state cannot have loaded regions");
  }
}

/** Map explicit per-region visual observations to the existing right-hand taxel mesh.
 * Unknown/occluded regions are left at zero and reported separately; zero here
 * means no rendered estimate, not proof of zero force. Physically constrained
 * hidden grip contacts can instead be labeled `grip_prior` and remain explicit.
 */
export function visualPressureToTaxels(item) {
  validateVisualPressureAnnotation(item);
  const data = new Uint8Array(23 * 20);
  const levels = {}, unknown = [], inferred = [];
  for (const region of regions) {
    const observation = item.regions[region.name];
    if (observation.contact === "unknown") unknown.push(region.name);
    if (observation.contact !== "yes") {
      levels[region.name] = null;
      continue;
    }
    if (observation.evidence === "grip_prior" || observation.evidence === "temporal_motion") inferred.push(region.name);
    const [centerU, centerV] = region.name === "palm"
      ? palmCenters[observation.location] : [0.5, fingerCenters[observation.location]];
    const widthU = region.name === "palm" ? 0.34 : 0.38;
    const widthV = region.name === "palm" ? 0.32 : 0.20;
    const amplitude = observation.relative_load / 3;
    const maximum = paintPressureRegion(data,region,{centerU,centerV,widthU,widthV,amplitude});
    levels[region.name] = Math.round(maximum / 255 * 1000) / 10;
  }
  return { data, levels, unknown, inferred, source: "visual_region_relative_load", measured: false };
}
