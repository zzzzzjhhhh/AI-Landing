/** Static review renders using the SAME rig and 23x20 pressure processor as Pressure. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPressureProcessor } from "./processor.mjs";
import { loadRightHandRig } from "./right-hand-rig.mjs";

const [samplesPath, outputDir, baselinePath, baselineManifestPath] = process.argv.slice(2);
const baselineManifest = baselineManifestPath ? JSON.parse(readFileSync(baselineManifestPath, "utf8")) : null;
const findDisplay = (value) => value && typeof value === "object" ? value.display_normalisation || Object.values(value).map(findDisplay).find(Boolean) : null;
const baselineDisplay = findDisplay(baselineManifest);
if (!samplesPath || !outputDir) throw new Error("Usage: node render-vision-pressure-pilot.mjs validated-taxels.jsonl output-dir [original-pressure-samples.jsonl]");
const samples = readFileSync(samplesPath, "utf8").trim().split("\n").map(JSON.parse);
const baseline = baselinePath ? readFileSync(baselinePath, "utf8").trim().split("\n").map(JSON.parse) : [];
// Current 165650 app recording uses 189 for display-normalized WebHand colors.
const displayMax = 189;
const rig = await loadRightHandRig();
const processor = await createPressureProcessor();
const mesh = rig.sample()[0];
const triangles = rig.topology[0].indices;
const width = 720, height = 850;
const px = (x) => (x + 2.2) / 3.5 * width;
const py = (y) => (3.25 - y) / 5.6 * height;
const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const faces = [];
for (let n = 0; n < triangles.length; n += 3) {
  const a = triangles[n] * 3, b = triangles[n + 1] * 3, c = triangles[n + 2] * 3;
  const p = mesh.positions;
  const za = p[a + 2], zb = p[b + 2], zc = p[c + 2];
  const shade = Math.round(97 + 30 * Math.max(0, (mesh.normals[a + 2] + mesh.normals[b + 2] + mesh.normals[c + 2]) / 3));
  faces.push({ z: (za + zb + zc) / 3,
    svg: `<polygon points="${px(p[a]).toFixed(1)},${py(p[a + 1]).toFixed(1)} ${px(p[b]).toFixed(1)},${py(p[b + 1]).toFixed(1)} ${px(p[c]).toFixed(1)},${py(p[c + 1]).toFixed(1)}" fill="rgb(${shade},${shade + 11},${shade + 20})"/>` });
}
faces.sort((a, b) => a.z - b.z);
const skin = faces.map((face) => face.svg).join("");
function render(item, index, prefix, title, note) {
  const pressure = processor(Uint8Array.from(item.data), { min: 0, max: item.displayMax ?? displayMax, height: item.displayHeight ?? 0.7, stride: 2 });
  const dots = pressure.positions.map((position, i) => {
    const color = pressure.colors[i];
    return `<circle cx="${px(position[0]).toFixed(1)}" cy="${py(position[1]).toFixed(1)}" r="2.4" fill="rgb(${color[0]},${color[1]},${color[2]})" fill-opacity="${(color[3] / 255).toFixed(2)}"/>`;
  }).join("");
  const levels = Object.entries(item.levels).filter(([, value]) => value !== null).map(([name, value]) => `${name} ${value.toFixed(0)}`).join(" · ") || "none";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<rect width="100%" height="100%" fill="#10151c"/><g>${skin}</g><g>${dots}</g>`
    + `<rect x="10" y="10" width="700" height="93" rx="9" fill="#071018" fill-opacity=".92"/>`
    + `<text x="26" y="40" font-size="23" fill="#ecf6f6" font-family="sans-serif">${escape(title)} · ${Number(item.time_ns / 1e9).toFixed(3)}s</text>`
    + `<text x="26" y="66" font-size="17" fill="#b7cbd1" font-family="sans-serif">${item.source === "visual_contact_patches" ? "Contact map (not force)" : "Relative load"}: ${escape(levels)}</text>`
    + `<text x="26" y="89" font-size="15" fill="#edae77" font-family="sans-serif">${escape(note)}</text>`
    + `</svg>`;
  writeFileSync(join(outputDir, `${prefix}-${String(index + 1).padStart(2, "0")}.svg`), svg);
  return pressure.positions.length;
}
try {
  for (const [index, item] of samples.entries()) {
    const siteAudit = item.source === "visual_site_contact_ordinal";
    const patchAudit = item.source === "visual_contact_patches";
    const shortSite = (site) => site === "palm_center" ? "P" : `${site[0].toUpperCase()}${site.endsWith("_tip") ? "t" : "m"}`;
    const evidence = patchAudit ? `${item.state} · ${item.finger_count} fingers · inferred footprints; not measured force`
      : siteAudit ? `Contact sites: ${item.active_sites.map(shortSite).join(", ") || "none"} · ${item.unknown_sites.length} unknown`
      : item.inferred_regions?.length ? `Inferred grip: ${item.inferred_regions.join(", ")}`
      : item.unknown_regions.length ? `Hidden / unknown: ${item.unknown_regions.join(", ")}` : "No hidden finger assumptions";
    const count = render(item, index, "pressure-model", patchAudit ? "V3 contact patches" : siteAudit ? "Visual site audit" : "Visual + grip prior", evidence);
    if (baseline.length) {
      const old = baseline.reduce((best, row) => Math.abs(row.tracking_time_ns - item.time_ns) < Math.abs(best.tracking_time_ns - item.time_ns) ? row : best);
      render({ time_ns: item.time_ns, data: old.matrix, levels: old.levels,
        displayMax: baselineDisplay?.colormap_max, displayHeight: baselineDisplay?.height_scale }, index, "pressure-original",
        baselineManifest ? "APP current Pressure" : "Previous Pressure",
        baselineManifest ? `App data + app color scale (max ${baselineDisplay?.colormap_max ?? displayMax}); not measured force` : "Old global contact envelope + fixed finger weights");
    }
    console.log(`${item.sample_id}: ${count} visual pressure points`);
  }
} finally { rig.dispose(); }
