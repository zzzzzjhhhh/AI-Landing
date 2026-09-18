import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { loadRightHandRig } from './right-hand-rig.mjs';
import { movementFrames, movementOptions } from './movement-playback.mjs';
import { namedHand21 } from './accepted-movement.mjs';

const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const rig = await loadRightHandRig();
try {
  const frames = input.frames.map(frame => ({ time_ns: frame.time_ns, valid: true,
    angles: rig.samplePose(namedHand21(frame.joints)).angles }));
  const output = movementFrames(frames, input.duration_ns, { ...movementOptions,
    smoothingRadiusSeconds: 0.12, holdMissing: true });
  for (const frame of output) {
    if (!frame.valid) throw new Error('Missing fitted Movement frame');
    if (!process.stdout.write(JSON.stringify({ time_ns: frame.time_ns,
      meshes: rig.sampleRotations(frame.rotations) }) + '\n')) await once(process.stdout, 'drain');
  }
} finally { rig.dispose(); }
