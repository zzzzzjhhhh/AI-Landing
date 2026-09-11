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
async function emit(item) {
  if (!process.stdout.write(JSON.stringify(item) + "\n")) await once(process.stdout, "drain");
}
try {
  await emit({ type: "model", meshes: rig.sample().map((mesh, index) => ({ ...mesh, ...rig.topology[index] })) });
  for (const frame of frames) {
    const { data, ...estimate } = inferPressure(frame, profile);
    await emit({ type: "frame", time: frame.time_ns / 1e9, time_ns: frame.time_ns,
      ...processor(data, { min: 0, max: 255, height: 0.35, stride: 2 }),
      estimate: { ...estimate, matrix: Array.from(data), endpoint_hold: frame.endpoint_hold ?? false } });
  }
} finally { rig.dispose(); }
