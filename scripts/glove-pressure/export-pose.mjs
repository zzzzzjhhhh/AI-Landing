import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { once } from "node:events";
import { loadRightHandRig } from "./right-hand-rig.mjs";
import { inferRightHand } from "./pose-retargeting.mjs";

const rig = await loadRightHandRig();
try {
  for await (const line of createInterface({ input: createReadStream(process.argv[2]), crlfDelay: Infinity })) {
    const { joints, ...frame } = JSON.parse(line);
    frame.pose_source ??= frame.valid ? "recorded_pose" : "unavailable";
    let inferred;
    if (frame.valid && !frame.estimated_angles) {
      try { inferred = inferRightHand(joints); }
      catch { frame.valid = false; frame.reason = "degenerate_pose"; }
    }
    const result = frame.valid ? (frame.estimated_angles ? { meshes: rig.sample(frame.estimated_angles), angles: frame.estimated_angles } : rig.samplePose(joints)) : {};
    let directionErrorDeg = null;
    if (frame.valid && inferred) {
      directionErrorDeg = 0;
      for (const [name, direction] of Object.entries(result.directions)) {
        const target = inferred.directions[name];
        const dot = direction.reduce((sum, value, i) => sum + value * target[i], 0);
        directionErrorDeg = Math.max(directionErrorDeg, Math.acos(Math.min(1, Math.max(-1, dot))) * 180 / Math.PI);
      }
    }
    delete frame.estimated_angles;
    if (!process.stdout.write(JSON.stringify({ ...frame, ...result, directionErrorDeg }) + "\n")) await once(process.stdout, "drain");
  }
} finally { rig.dispose(); }
