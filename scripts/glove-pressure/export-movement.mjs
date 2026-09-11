import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { loadRightHandRig } from './right-hand-rig.mjs';
import { movementFrames } from './movement-playback.mjs';

// The generated numeric CSV has no quoted or comma-containing fields.
const [header, ...lines] = readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).map(line => line.split(','));
const frames = lines.map(values => {
  const row = Object.fromEntries(header.map((key, i) => [key, values[i]]));
  return { time_ns: Number(row.tracking_time_ns), valid: row.valid === 'True',
    angles: Object.fromEntries(Object.entries(row).filter(([key]) => /_[xyz]_deg$/.test(key)).map(([key, value]) => [key, Number(value)])) };
});
const rig = await loadRightHandRig();
try {
  for (const frame of movementFrames(frames, Number(process.argv[3]))) {
    const result = { time_ns: frame.time_ns, valid: frame.valid, meshes: frame.valid ? rig.sampleRotations(frame.rotations) : [] };
    if (!process.stdout.write(JSON.stringify(result) + '\n')) await once(process.stdout, 'drain');
  }
} finally { rig.dispose(); }
