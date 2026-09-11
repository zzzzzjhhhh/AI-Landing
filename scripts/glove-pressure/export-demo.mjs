import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createPressureProcessor, regions } from "./processor.mjs";
import { loadRightHandRig } from "./right-hand-rig.mjs";

export function simulatedPressure(seconds) {
  const data = new Uint8Array(460);
  for (let index = 0; index < regions.length; index++) {
    const region = regions[index];
    const pulse = 0.5 + 0.5 * Math.sin(seconds * 1.35 - index * 0.7);
    const amplitude = 20 + 120 * pulse ** 2;
    for (let row = 0; row < region.height; row++) {
      for (let col = 0; col < region.width; col++) {
        const u = (col + 0.5) / region.width;
        const v = (row + 0.5) / region.height;
        const centerU = 0.5 + 0.12 * Math.sin(seconds * 0.7 + index);
        const centerV = index === 0 ? 0.58 : 0.72;
        const distance = ((u - centerU) / 0.32) ** 2 + ((v - centerV) / 0.34) ** 2;
        data[(row + region.y) * 20 + col + region.x] = Math.round(amplitude * Math.exp(-distance));
      }
    }
  }
  return data;
}

async function emit(value) {
  if (!process.stdout.write(JSON.stringify(value) + "\n")) await once(process.stdout, "drain");
}

async function main() {
  const duration = Number(process.argv[2] ?? 90.531), fps = Number(process.argv[3] ?? 10);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(fps) || fps <= 0) throw new Error("Expected positive duration and fps");
  const processor = await createPressureProcessor();
  const rig = await loadRightHandRig();
  try {
    const meshes = rig.sample().map((mesh, index) => ({ ...mesh, ...rig.topology[index] }));
    await emit({ type: "model", hand: "right", meshes, source: "simulated" });
    const count = Math.ceil(duration * fps);
    for (let index = 0; index <= count; index++) {
      const time = Math.min(index / fps, duration);
      const data = simulatedPressure(time);
      const cloud = processor(data, { height: 0.35, stride: 2 });
      await emit({ type: "frame", time, ...cloud });
    }
  } finally { rig.dispose(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
