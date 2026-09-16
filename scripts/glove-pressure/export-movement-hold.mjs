import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { loadRightHandRig } from './right-hand-rig.mjs';
import { movementFrames, movementOptions } from './movement-playback.mjs';

const [header, ...lines] = readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).map(line => line.split(','));
const frames = lines.map(values => {
  const row = Object.fromEntries(header.map((key, i) => [key, values[i]]));
  return { time_ns: Number(row.tracking_time_ns), valid: row.valid === 'True',
    angles: Object.fromEntries(Object.entries(row).filter(([key]) => /_[xyz]_deg$/.test(key)).map(([key, value]) => [key, Number(value)])) };
});
const held = movementFrames(frames, Number(process.argv[3]), { ...movementOptions, holdMissing: true }).filter(frame => frame.held);
const rig = held.some(frame => frame.valid) ? await loadRightHandRig() : null;
try {
  for (const frame of held) {
    const result = { time_ns: frame.time_ns, held: true, valid: frame.valid,
      meshes: frame.valid ? rig.sampleRotations(frame.rotations) : [] };
    if (!process.stdout.write(JSON.stringify(result) + '\n')) await once(process.stdout, 'drain');
  }
} finally { rig?.dispose(); }
