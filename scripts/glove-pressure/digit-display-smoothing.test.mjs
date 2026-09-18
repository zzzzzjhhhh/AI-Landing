import test from 'node:test';
import assert from 'node:assert/strict';
import {contactOpacity,renderContact} from './digit-display-smoothing.mjs';
import {parseAudit} from './digit-contact-audit.mjs';

test('all categorical anchor pairs remain exact',()=>{
 for(const a of ['c','n','u']) for(const b of ['c','n','u']) {
  assert.equal(contactOpacity(a,b,0,0,500e6),Number(a==='c'));
  assert.equal(contactOpacity(a,b,500e6,0,500e6),Number(b==='c'));
 }
});
test('120ms transition without release ghosts or unknown bridging',()=>{
 assert.equal(contactOpacity('c','n',440e6,0,500e6),.5);
 assert.equal(contactOpacity('n','c',440e6,0,500e6),.5);
 assert.equal(contactOpacity('c','n',501e6,0,500e6),0);
 assert.equal(contactOpacity('u','c',499e6,0,500e6),0);
 assert.equal(contactOpacity('u','n',440e6,0,500e6),0);
});
test('unknown stays amber and released zones have no markers',()=>{
 const [u,n]=parseAudit('0|uuu uuu uuu uuu uuu|uuuuuuu|unknown\n0.5|nnn nnn nnn nnn nnn|nnnnnnn|released');
 u.time_ns=0;n.time_ns=500e6;
 const visual=renderContact(u,n,250e6);
 assert.ok(visual.positions.length>0);
 assert.ok(visual.colors.every(c=>c[0]===255&&c[1]===195));
 assert.equal(renderContact(n,n,500e6).positions.length,0);
});
