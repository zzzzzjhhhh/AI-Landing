/** Display-only quaternion interpolation. Native pose/angle exports remain untouched. */
import { Euler, Quaternion } from 'three';

export const movementOptions = { fps: 30, maxGapSeconds: 2, smoothingRadiusSeconds: 0.06 };

export function rotationsFromAngles(angles) {
  const names = Object.keys(angles).filter(key => key.endsWith('_x_deg')).map(key => key.slice(0, -6));
  return Object.fromEntries(names.map(name => [name, new Quaternion().setFromEuler(new Euler(
    ...['x', 'y', 'z'].map(axis => angles[`${name}_${axis}_deg`] * Math.PI / 180), 'XYZ',
  )).toArray()]));
}

export function blendRotations(a, b, amount) {
  return Object.fromEntries(Object.keys(a).map(name => [name,
    new Quaternion().fromArray(a[name]).slerp(new Quaternion().fromArray(b[name]), amount).normalize().toArray(),
  ]));
}

export function movementFrames(frames, durationNs, options = movementOptions) {
  const valid = frames.filter(frame => frame.valid).map(frame => ({ ...frame, rotations: rotationsFromAngles(frame.angles) }));
  const radiusNs = options.smoothingRadiusSeconds * 1e9;
  const maxGapNs = options.maxGapSeconds * 1e9;
  // Symmetric local averaging reduces tracking jitter without introducing playback lag.
  const filtered = valid.map((frame, i) => {
    let rotations = frame.rotations, total = 1;
    for (let j = i - 1; j >= 0 && frame.time_ns - valid[j].time_ns < radiusNs; j--) {
      const weight = 1 - (frame.time_ns - valid[j].time_ns) / radiusNs;
      rotations = blendRotations(rotations, valid[j].rotations, weight / (total + weight)); total += weight;
    }
    for (let j = i + 1; j < valid.length && valid[j].time_ns - frame.time_ns < radiusNs; j++) {
      const weight = 1 - (valid[j].time_ns - frame.time_ns) / radiusNs;
      rotations = blendRotations(rotations, valid[j].rotations, weight / (total + weight)); total += weight;
    }
    return { ...frame, rotations };
  });
  const times = Array.from({ length: Math.ceil(durationNs / 1e9 * options.fps) }, (_, i) => Math.round(i * 1e9 / options.fps));
  times.push(durationNs);
  let index = 0;
  return times.map(time_ns => {
    while (index + 1 < filtered.length && filtered[index + 1].time_ns <= time_ns) index++;
    const a = filtered[index], b = filtered[index + 1];
    if (!a || time_ns < a.time_ns) return { time_ns, valid: false };
    // Only hold the final valid exposure to the clip boundary, never a missing tail.
    if (!b) return frames.at(-1)?.valid ? { time_ns, valid: true, rotations: a.rotations } : { time_ns, valid: time_ns === a.time_ns, rotations: a.rotations };
    if (b.time_ns - a.time_ns > maxGapNs && time_ns !== a.time_ns) return { time_ns, valid: false };
    return { time_ns, valid: true, rotations: blendRotations(a.rotations, b.rotations, (time_ns - a.time_ns) / (b.time_ns - a.time_ns)) };
  });
}
