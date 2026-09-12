import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { createPressureProcessor } from "./processor.mjs";
import { loadRightHandRig } from "./right-hand-rig.mjs";
import { inferPressure, validatePressureProfile } from "./pressure-inference.mjs";

const [sourcePath, profilePath] = process.argv.slice(2);
const profile = JSON.parse(await readFile(profilePath, "utf8"));
validatePressureProfile(profile);
const frames = (await readFile(sourcePath, "utf8")).trim().split("\n").map(JSON.parse);
const end = Math.round(profile.duration_s * 1e9);
if (frames[0]?.time_ns !== 0 || frames.at(-1).time_ns > end || frames.some((frame, i) => i && frame.time_ns <= frames[i - 1].time_ns)) {
  throw new Error("Invalid pressure source timeline");
}
// Explicit endpoint holds the last video exposure's pose for the final fraction of a frame.
if (frames.at(-1).time_ns < end) frames.push({ ...frames.at(-1), time_ns: end, endpoint_hold: true });
const processor = await createPressureProcessor();
const rig = await loadRightHandRig();
const DISPLAY_HEIGHT = 0.7;
async function emit(item) {
  if (!process.stdout.write(JSON.stringify(item) + "\n")) await once(process.stdout, "drain");
}
try {
  await emit({ type: "model", meshes: rig.sample().map((mesh, index) => ({ ...mesh, ...rig.topology[index] })) });
  const estimates = frames.map((frame) => {
    const { data, ...estimate } = inferPressure(frame, profile);
    return { frame, data, estimate };
  });
  // Display-only normalisation: stretch the shared WebHand colormap so this
  // episode's peak level reaches the palette end. Data, levels and labels
  // stay relative 0–100; the demo export keeps the full 0–255 span.
  let peakValue = 0;
  for (const { data } of estimates) for (const value of data) if (value > peakValue) peakValue = value;
  const displayMax = peakValue > 0 ? peakValue : 255;
  await emit({ type: "display", max_value: displayMax, height: DISPLAY_HEIGHT,
    peak_level: Math.round(peakValue / 255 * 1000) / 10 });
  for (const { frame, data, estimate } of estimates) {
    await emit({ type: "frame", time: frame.time_ns / 1e9, time_ns: frame.time_ns,
      ...processor(data, { min: 0, max: displayMax, height: DISPLAY_HEIGHT, stride: 2 }),
      estimate: { ...estimate, matrix: Array.from(data), endpoint_hold: frame.endpoint_hold ?? false } });
  }
} finally { rig.dispose(); }
