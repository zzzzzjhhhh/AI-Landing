import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { digits, palmZones, parseAudit, toTaxels, validateTimeline, surfaceState, siteSummary } from './digit-contact-audit.mjs';
import { regions } from './processor.mjs';
const rows = parseAudit(readFileSync(new URL('./170529-v4-digit-audit.txt', import.meta.url), 'utf8'));
test('all 221 sampled timestamps have 22 explicit states and an evidence note', () => {
  assert.equal(rows.length, 221);
  rows.forEach((r, i) => {
    assert.equal(r.requested_time_s, i * .5);
    assert.equal(Object.values(siteSummary(r)).flat().length, 22);
    assert.ok(r.evidence.length > 20);
  });
});
test('75s raised index and little have no contact anywhere; thumb/middle/ring retained', () => {
  const r = rows[150], m = toTaxels(r);
  for (const name of ['index', 'little']) {
    assert.deepEqual(Object.values(r.digits[name]), ['n', 'n', 'n']);
    const p = regions.find(x => x.name === name);
    for(let y=p.y;y<p.y+p.height;y++) for(let x=p.x;x<p.x+p.width;x++) assert.equal(m.data[y*20+x],0);
  }
  for(const name of ['thumb','middle','ring']) assert.ok(Object.values(r.digits[name]).includes('c'));
});
test('little contact is present in flattening, not globally disabled', () => {
  for (const t of [20, 23, 67.5, 79.5, 83, 97.5]) assert.ok(Object.values(rows[t*2].digits.little).includes('c'));
});
test('no-contact and unknown stay distinct, both produce no pressure', () => {
  for(const code of ['n','u']) {
    const r=parseAudit(`0|${Array(5).fill(code.repeat(3)).join(' ')}|${code.repeat(7)}|Test evidence`)[0];
    const m=toTaxels(r);
    assert.ok(m.data.every(v=>v===0));
    assert.equal(m.unknown_mask.filter(Boolean).length,code==='u'?400:0);
  }
});
test('hard masks exclude every no-contact/unknown taxel and every fine-render point', () => {
  for(const r of rows) {
    const m=toTaxels(r);
    for(const p of regions) for(let y=0;y<p.height;y++) for(let x=0;x<p.width;x++) {
      const at=(p.y+y)*20+p.x+x,s=surfaceState(r,p.name,(x+.5)/p.width,(y+.5)/p.height);
      if(s.state!=='c') assert.equal(m.data[at],0);
      assert.equal(m.unknown_mask[at],Number(s.state==='u'));
    }
    for(const p of regions) for(let y=0;y<24;y++) for(let x=0;x<12;x++) {
      const s=surfaceState(r,p.name,(x+.5)/12,(y+.5)/24);
      if(s.state!=='c') assert.equal(s.footprint,false);
    }
  }
});
test('bad schema, duplicate times, missing coverage, shifted timestamps are rejected', () => {
  for(const text of ['0|ccc|ccccccc|note','0|ccc ccc ccc ccc ccx|ccccccc|note','0|ccc ccc ccc ccc ccc|cccccc|note']) assert.throws(()=>parseAudit(text));
  const line='0|nnn nnn nnn nnn nnn|nnnnnnn|note';
  assert.throws(()=>parseAudit(`${line}\n${line}`));
  assert.throws(()=>validateTimeline(rows,[]));
  assert.throws(()=>validateTimeline(rows,rows.map((r,i)=>({requested_time_s:r.requested_time_s+.1,time_ns:i*5e8}))));
  validateTimeline(rows, rows.map((r,i)=>({requested_time_s:r.requested_time_s,time_ns:i*5e8})));
});
test('palm seven zones and all digits covered',()=>{
  assert.equal(palmZones.length,7); assert.equal(digits.length,5);
});
