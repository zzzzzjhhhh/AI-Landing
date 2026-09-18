import { regions } from './processor.mjs';

export const digits = ['thumb', 'index', 'middle', 'ring', 'little'];
export const segments = ['distal', 'middle', 'proximal'];
// Canonical palm UV (u=1 thumb side, v=1 finger bases). These are schematic
// anatomical regions, NOT measured contact boundaries in the camera image.
export const palmZones = [
  { name: 'thenar', u: .80, v: .46, ru: .24, rv: .30 },
  { name: 'hypothenar', u: .19, v: .43, ru: .22, rv: .31 },
  { name: 'center', u: .49, v: .48, ru: .23, rv: .25 },
  { name: 'distal_radial', u: .72, v: .84, ru: .27, rv: .19 },
  { name: 'distal_ulnar', u: .27, v: .82, ru: .27, rv: .20 },
  { name: 'heel_radial', u: .70, v: .12, ru: .29, rv: .17 },
  { name: 'heel_ulnar', u: .28, v: .12, ru: .27, rv: .17 },
];
export const stateNames = { c: 'inferred_contact', n: 'no_contact', u: 'unknown' };

export function parseAudit(text) {
  const rows = text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#')).map((line, index) => {
    const fields = line.split('|');
    if (fields.length !== 4) throw Error(`Invalid audit line ${index + 1}`);
    const [rawTime, digitCodes, palmCode, evidence] = fields;
    const time = Number(rawTime), codes = digitCodes.trim().split(/\s+/);
    if (!rawTime.trim() || !Number.isFinite(time) || time < 0 || codes.length !== 5 ||
        codes.some(c => !/^[cnu]{3}$/.test(c)) || !/^[cnu]{7}$/.test(palmCode) || !evidence.trim()) {
      throw Error(`Invalid annotation at ${rawTime}s`);
    }
    return { requested_time_s: time,
      digits: Object.fromEntries(digits.map((d, i) => [d, Object.fromEntries(segments.map((s, j) => [s, codes[i][j]]))])),
      palm: Object.fromEntries(palmZones.map((p, i) => [p.name, palmCode[i]])),
      evidence: evidence.trim(), compact: `${digitCodes}|${palmCode}` };
  });
  for (let i = 1; i < rows.length; i++) if (rows[i].requested_time_s <= rows[i - 1].requested_time_s) throw Error('Times must be unique and increasing');
  return rows;
}

export function validateTimeline(rows, source) {
  if (!rows.length || rows.length !== source.length) throw Error('Audit/source coverage mismatch');
  rows.forEach((r, i) => {
    if (r.requested_time_s !== source[i].requested_time_s) throw Error(`Time mismatch at sample ${i}`);
    if (!Number.isFinite(source[i].time_ns) || (i && source[i].time_ns <= source[i - 1].time_ns)) throw Error('Invalid source timestamps');
  });
}

export function surfaceZone(region, u, v) {
  if (region === 'palm') {
    return palmZones.reduce((best, p) => {
      const d = ((u - p.u) / p.ru) ** 2 + ((v - p.v) / p.rv) ** 2;
      return !best || d < best.distance ? { name: p.name, distance: d, zone: p } : best;
    }, null);
  }
  if (!digits.includes(region)) throw Error(`Unknown region ${region}`);
  // Display zones, including three pad zones on the thumb: not three thumb phalanges.
  const segment = v >= .70 ? 'distal' : v >= .35 ? 'middle' : 'proximal';
  const center = segment === 'distal' ? .85 : segment === 'middle' ? .525 : .175;
  const radius = segment === 'distal' ? .15 : .175;
  return { name: segment, distance: ((u - .5) / .44) ** 2 + ((v - center) / radius) ** 2 };
}

export function surfaceState(row, region, u, v) {
  const zone = surfaceZone(region, u, v);
  const state = region === 'palm' ? row.palm[zone.name] : row.digits[region][zone.name];
  if (!(state in stateNames)) throw Error('Missing contact state');
  // Hard ownership before rasterization: c never leaks into n/u neighbors.
  return { ...zone, state, footprint: state === 'c' && zone.distance < 1.15 };
}

export function toTaxels(row) {
  const data = Array(460).fill(0), known_mask = Array(460).fill(0), unknown_mask = Array(460).fill(0);
  for (const r of regions) for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) {
    const at = (y + r.y) * 20 + x + r.x;
    const s = surfaceState(row, r.name, (x + .5) / r.width, (y + .5) / r.height);
    known_mask[at] = Number(s.state !== 'u'); unknown_mask[at] = Number(s.state === 'u');
    // Constant display value, not a fabricated force magnitude.
    if (s.footprint) data[at] = 120;
  }
  return { data, known_mask, unknown_mask };
}

export function siteSummary(row) {
  const result = { inferred_contact: [], no_contact: [], unknown: [] };
  for (const d of digits) for (const s of segments) result[stateNames[row.digits[d][s]]].push(`${d}.${s}`);
  for (const p of palmZones) result[stateNames[row.palm[p.name]]].push(`palm.${p.name}`);
  return result;
}
