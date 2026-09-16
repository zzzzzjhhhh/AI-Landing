/** Expand the reviewed half-second 165650 visual estimates onto the original
 * right-camera clock for a display-only Rerun replacement. Intermediate frames
 * are interpolated estimates, NOT fresh visual classifications or measurements.
 */
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { createPressureProcessor, regions } from "./processor.mjs";
import { interpolateContact } from "./contact-display-smoothing.mjs";

const [firstPath, secondPath, timestampsPath, durationText] = process.argv.slice(2);
if (!firstPath || !secondPath || !timestampsPath || !durationText) {
  throw new Error("Usage: node export-visual-pressure-override.mjs first-taxels.jsonl second-taxels.jsonl right_camera_timestamps.csv duration_ns");
}
const readSamples = (path) => readFileSync(path, "utf8").trim().split(/\r?\n/).map(JSON.parse);
const samples = [...readSamples(firstPath), ...readSamples(secondPath)];
if (samples.length !== 86 || samples.some((item, index) => item.data.length !== 460 ||
    (index > 0 && item.time_ns <= samples[index - 1].time_ns))) {
  throw new Error("Expected 86 ordered 23x20 stereo-reviewed samples");
}
const durationNs = Number(durationText);
const lines = readFileSync(timestampsPath, "utf8").trim().split(/\r?\n/);
const header = lines.shift().split(",");
const timeIndex = header.indexOf("t_sync_us"), frameIndex = header.indexOf("frame_index");
if (timeIndex < 0 || frameIndex < 0) throw new Error("Missing original right-camera clock columns");
const times = lines.map((line, index) => {
  const values = line.split(",");
  if (Number(values[frameIndex]) !== index) throw new Error(`Right-camera frame sequence mismatch at ${index}`);
  return Number(values[timeIndex]) * 1000;
});
if (times[0] !== 0 || times.at(-1) > durationNs || times.some((time, index) => index && time <= times[index - 1])) {
  throw new Error("Invalid original right-camera timeline");
}
times.push(durationNs); // explicit final hold on the episode endpoint
const processor = await createPressureProcessor();
let left = 0;
for (const [frameIndexNumber, timeNs] of times.entries()) {
  while (left + 1 < samples.length && samples[left + 1].time_ns <= timeNs) left++;
  const a = samples[left], b = samples[Math.min(left + 1, samples.length - 1)];
  const contactState = (sample) => ["supporting", "touching"].includes(sample.contact_state) ? "contact" : sample.contact_state;
  const data = Uint8Array.from(interpolateContact(
    { time_ns: a.time_ns, state: contactState(a), data: a.data },
    { time_ns: b.time_ns, state: contactState(b), data: b.data }, timeNs));
  const rendered = processor(data, { min: 0, max: 189, height: 0.7, stride: 2 });
  const levels = Object.fromEntries(regions.map((region) => {
    let peak = 0;
    for (let row = 0; row < region.height; row++) for (let col = 0; col < region.width; col++) {
      peak = Math.max(peak, data[(row + region.y) * 20 + col + region.x]);
    }
    return [region.name, Math.round(peak / 255 * 1000) / 10];
  }));
  const item = { frame_index: frameIndexNumber, time_ns: timeNs,
    positions: rendered.positions, colors: rendered.colors,
    contact_object: a.contact_object, contact_state: a.contact_state,
    source_sample_id: a.sample_id, interpolated: timeNs !== a.time_ns && timeNs !== b.time_ns,
    peak_relative_0_100: Math.round(Math.max(...data) / 255 * 1000) / 10, levels };
  if (!process.stdout.write(JSON.stringify(item) + "\n")) await once(process.stdout, "drain");
}
