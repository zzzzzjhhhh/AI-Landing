import { Matrix4, Vector3 } from "three";

export const fingerChains = {
  thumb: ["Wrist", "ThumbMetacarpal", "ThumbProximal", "ThumbDistal", "ThumbTip"],
  index: ["IndexMetacarpal", "IndexProximal", "IndexIntermediate", "IndexDistal", "IndexTip"],
  middle: ["MiddleMetacarpal", "MiddleProximal", "MiddleIntermediate", "MiddleDistal", "MiddleTip"],
  ring: ["RingMetacarpal", "RingProximal", "RingIntermediate", "RingDistal", "RingTip"],
  little: ["LittleMetacarpal", "LittleProximal", "LittleIntermediate", "LittleDistal", "LittleTip"],
};

function unit(vector) {
  if (!vector.toArray().every(Number.isFinite) || vector.length() < 1e-6) throw new Error("Invalid or degenerate hand pose");
  return vector.normalize();
}

/** A right-handed palm frame: +X toward index, +Y toward middle MCP, +Z palm normal. */
export function palmBasis(wrist, index, middle, little) {
  const y = unit(middle.clone().sub(wrist));
  const x = index.clone().sub(little);
  unit(x.addScaledVector(y, -x.dot(y)));
  const z = unit(new Vector3().crossVectors(x, y));
  return new Matrix4().makeBasis(x, y, z);
}

/** Infer directions and geometric joint bends from recorded 3D keypoints, in Rerun's RH basis. */
export function inferRightHand(joints) {
  const required = new Set(["Wrist", ...Object.values(fingerChains).flat()]);
  const points = {};
  for (const name of required) {
    const xyz = joints[name];
    if (!Array.isArray(xyz) || xyz.length !== 3 || !xyz.every(Number.isFinite)) throw new Error(`Missing valid right-hand joint: ${name}`);
    points[name] = new Vector3(...xyz);
  }
  const basis = palmBasis(points.Wrist, points.IndexProximal, points.MiddleProximal, points.LittleProximal);
  const inverse = basis.clone().invert();
  const directions = {}, bends = {};
  for (const [finger, chain] of Object.entries(fingerChains)) {
    const segments = chain.slice(1).map((name, i) => unit(points[name].clone().sub(points[chain[i]])));
    for (let joint = 1; joint <= 3; joint++) {
      const bone = `${finger}0${joint}`;
      directions[bone] = segments[joint].clone().transformDirection(inverse).toArray();
      // Unsigned 3D bend: 0 is straight. MCP/CMC includes any out-of-plane spread.
      bends[`${bone}_bend_deg`] = segments[joint - 1].angleTo(segments[joint]) * 180 / Math.PI;
    }
  }
  return { directions, bends };
}
