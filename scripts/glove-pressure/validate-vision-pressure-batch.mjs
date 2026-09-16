import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { visualPressureToTaxels } from "./visual-pressure-map.mjs";

if (process.argv.length !== 5) {
  throw new Error("Usage: node validate-vision-pressure-batch.mjs input-manifest.json visual-pressure-observations.json validated-taxels.jsonl");
}
const manifest = JSON.parse(readFileSync(process.argv[2], "utf8"));
const batch = JSON.parse(readFileSync(process.argv[3], "utf8"));
if (batch.schema_version !== "visual-pressure-batch-v1" || batch.episode !== manifest.episode ||
    !Array.isArray(batch.annotations) || batch.annotations.length !== manifest.samples.length) {
  throw new Error("Batch schema, episode, or sample count does not match the source manifest");
}
const converted = batch.annotations.map((item, index) => {
  const sample = manifest.samples[index];
  if (item.sample_id !== sample.sample_id || Math.abs(item.time_s - sample.right.actual_time_s) > 0.000001) {
    throw new Error(`Sample ID or right-camera timestamp mismatch at ${index + 1}`);
  }
  const result = visualPressureToTaxels(item);
  return { sample_id: item.sample_id, time_ns: Math.round(item.time_s * 1e9), data: Array.from(result.data),
    levels: result.levels, unknown_regions: result.unknown, inferred_regions: result.inferred,
    source: result.source, measured: false,
    contact_object: item.contact_object, contact_state: item.contact_state,
    short_evidence: item.short_evidence, limitations: item.limitations };
});
const output = resolve(process.argv[4]);
writeFileSync(output, converted.map((item) => JSON.stringify(item)).join("\n") + "\n");
console.log(`Validated ${converted.length} visual observations; taxel samples: ${output}`);
