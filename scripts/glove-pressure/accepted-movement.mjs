import { fingerChains } from './pose-retargeting.mjs';

/** Standard hand21 -> original WebHand rig names. No fingertip substitution. */
export function namedHand21(points) {
  if (points.length !== 21 || points.some(p => p.length !== 3 || !p.every(Number.isFinite))) throw new Error('Expected 21 finite XYZ joints');
  const joints = { Wrist: points[0] };
  Object.entries(fingerChains).forEach(([finger, chain], f) => {
    for (let k = 1; k <= 4; k++) joints[chain[k]] = points[1 + f * 4 + k - 1];
    // The extra metacarpal only supplies a reference bend; driven segments
    // remain MCP->PIP->DIP->tip, exactly as in the original rig.
    if (finger !== 'thumb') joints[chain[0]] = points[0].map((v, a) => (v + points[1 + f * 4][a]) / 2);
  });
  return joints;
}
