import { regions } from "./processor.mjs";
import { inferRightHand } from "./pose-retargeting.mjs";

const clamp = (value) => Math.max(0, Math.min(1, value));

export function validatePressureProfile(profile) {
  if (profile.version !== 1 || !(profile.duration_s > 0) || !Array.isArray(profile.keyframes) || profile.keyframes.length < 2) {
    throw new Error("Invalid pressure profile");
  }
  const keys = profile.keyframes;
  if (keys[0].time_s !== 0 || keys.at(-1).time_s !== profile.duration_s) throw new Error("Pressure profile must cover the full clip");
  for (const [index, key] of keys.entries()) {
    if (!Number.isFinite(key.time_s) || (index && key.time_s <= keys[index - 1].time_s) ||
        !Number.isFinite(key.strength) || key.strength < 0 || key.strength > 1 || !key.phase) {
      throw new Error("Invalid pressure contact keyframe");
    }
  }
  for (const region of regions) {
    const contact = profile.contacts[region.name];
    if (!contact || ["weight", "center_u", "center_v", "width_u", "width_v"].some((key) =>
      !Number.isFinite(contact[key]) || contact[key] < 0 || contact[key] > 1) || !contact.width_u || !contact.width_v) {
      throw new Error(`Invalid pressure contact region: ${region.name}`);
    }
  }
}

/** Interpolate an explicitly annotated contact envelope, never a periodic demo. */
export function contactAt(time, profile) {
  if (!Number.isFinite(time) || time < 0 || time > profile.duration_s) throw new Error("Pressure time outside annotated clip");
  const keys = profile.keyframes;
  let index = 0;
  while (index + 1 < keys.length && keys[index + 1].time_s <= time) index++;
  const a = keys[index], b = keys[Math.min(index + 1, keys.length - 1)];
  const f = a === b ? 0 : (time - a.time_s) / (b.time_s - a.time_s);
  const eased = f * f * (3 - 2 * f);
  return { strength: a.strength + (b.strength - a.strength) * eased, phase: a.phase };
}

/** Relative contact simulation. Joint bend modulates an observed contact; it is not force. */
export function inferPressure(frame, profile) {
  const contact = contactAt(frame.time_ns / 1e9, profile);
  let bends;
  if (frame.valid && !frame.estimated_angles) {
    try { bends = inferRightHand(frame.joints).bends; } catch { /* Use video contact only for invalid geometry. */ }
  }
  const source = bends ? "video_contact_and_recorded_pose" : "video_contact_only";
  const data = new Uint8Array(460);
  const levels = {}, curls = {};
  for (const region of regions) {
    const shape = profile.contacts[region.name];
    // Distal hinge bends avoid treating MCP spread as contact. The thumb needs
    // a different bend range. Missing tracking uses a declared neutral prior.
    const curl = region.name === "palm" ? 0.5 : bends
      ? clamp((bends[`${region.name}02_bend_deg`] + bends[`${region.name}03_bend_deg`]) / (region.name === "thumb" ? 80 : 160))
      : 0.55;
    curls[region.name] = bends && region.name !== "palm" ? curl : null;
    const amplitude = contact.strength * shape.weight * (0.65 + 0.35 * curl);
    let maximum = 0;
    for (let row = 0; row < region.height; row++) {
      for (let col = 0; col < region.width; col++) {
        const u = (col + 0.5) / region.width, v = (row + 0.5) / region.height;
        const distance = ((u - shape.center_u) / shape.width_u) ** 2 + ((v - shape.center_v) / shape.width_v) ** 2;
        const value = Math.round(255 * amplitude * Math.exp(-distance));
        data[(row + region.y) * 20 + col + region.x] = value;
        maximum = Math.max(maximum, value);
      }
    }
    levels[region.name] = Math.round(maximum / 255 * 1000) / 10;
  }
  return { data, levels, curls, source, phase: contact.phase, contact_strength: contact.strength,
    peak: Math.max(...Object.values(levels)), pose_sample_index: bends ? frame.pose_sample_index : null };
}
