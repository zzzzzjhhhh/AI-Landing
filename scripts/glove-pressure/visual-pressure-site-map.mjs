import { regions } from "./processor.mjs";

// A separate visual-contact format: a finger can touch at its tip, middle,
// both, or neither. It deliberately does not turn "unknown" into force.
export const pressureSites = ["palm_center", ...["thumb", "index", "middle", "ring", "little"].flatMap((finger) => [`${finger}_tip`, `${finger}_middle`])];
const fingerCenter = { tip: 0.84, middle: 0.48 };
const siteRegion = (site) => site === "palm_center" ? "palm" : site.split("_")[0];

export function visualSitesToTaxels(item) {
  if (item?.schema_version !== "visual-pressure-sites-v1" || !item.sample_id ||
      !Number.isFinite(item.time_s) || !item.sites ||
      pressureSites.some((site) => !Object.hasOwn(item.sites, site))) {
    throw new Error("Invalid visual pressure site annotation");
  }
  const noContact = item.contact_state === "no_contact";
  const data = new Uint8Array(460);
  const levels = Object.fromEntries(regions.map(({ name }) => [name, null]));
  const unknown_sites = [], inferred_sites = [];
  for (const site of pressureSites) {
    const mark = item.sites[site];
    if (!["yes", "no", "unknown"].includes(mark?.contact) ||
        !Number.isFinite(mark.confidence) || mark.confidence < 0 || mark.confidence > 1) {
      throw new Error(`Invalid ${site} contact mark`);
    }
    if (mark.contact === "unknown") unknown_sites.push(site);
    if (mark.contact !== "yes") {
      if (mark.relative_load !== null) throw new Error(`${site}: non-contact cannot have load`);
      continue;
    }
    if (noContact || !Number.isInteger(mark.relative_load) || mark.relative_load < 1 || mark.relative_load > 3 || mark.confidence < 0.5) {
      throw new Error(`${site}: unsupported pressure`);
    }
    if (mark.evidence === "grip_prior" || mark.evidence === "temporal_motion") inferred_sites.push(site);
    const region = regions.find(({ name }) => name === siteRegion(site));
    const centerV = site === "palm_center" ? 0.5 : fingerCenter[site.split("_")[1]];
    const centerU = 0.5;
    const widthU = site === "palm_center" ? 0.34 : 0.38;
    const widthV = site === "palm_center" ? 0.32 : 0.17;
    for (let row = 0; row < region.height; row++) for (let col = 0; col < region.width; col++) {
      const u = (col + 0.5) / region.width, v = (row + 0.5) / region.height;
      const distance = ((u - centerU) / widthU) ** 2 + ((v - centerV) / widthV) ** 2;
      const value = Math.round(255 * mark.relative_load / 3 * Math.exp(-distance));
      const index = (row + region.y) * 20 + col + region.x;
      data[index] = Math.max(data[index], value);
      levels[region.name] = Math.max(levels[region.name] ?? 0, value / 255 * 100);
    }
  }
  for (const name of Object.keys(levels)) if (levels[name] !== null) levels[name] = Math.round(levels[name] * 10) / 10;
  return { data, levels, unknown_sites, inferred_sites, source: "visual_site_contact_ordinal", measured: false };
}
