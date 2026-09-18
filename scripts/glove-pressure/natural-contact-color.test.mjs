import test from 'node:test';
import assert from 'node:assert/strict';
import {diffuseContact,surfaceNeighbors,anatomicalAddress} from './natural-contact-color.mjs';
import {createContinuousGloveDisplay,gloveSurfaceSamples} from './continuous-glove-display.mjs';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {parseAudit,surfaceState} from './digit-contact-audit.mjs';
import {digitReferenceTaxels} from './digit-reference-adapter.mjs';

test('surface smoothing removes a rectangular step rather than relocating points',()=>{
 const n=11,graph=Array.from({length:n*n},(_,i)=>{
  const x=i%n,y=Math.floor(i/n);
  return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&a<n&&b>=0&&b<n).map(([a,b])=>b*n+a);
 });
 const raw=Array.from({length:n*n},(_,i)=>{const x=i%n,y=Math.floor(i/n);return x>=3&&x<=7&&y>=3&&y<=7?160:0;});
 const smooth=diffuseContact(raw,raw.map(()=>true),graph);
 assert.ok(smooth[5*n+2]>0,'color must fade beyond the old rectangle instead of hard clipping');
 assert.ok(smooth[5*n+3]-smooth[5*n+2]<80,'reduce the hard step');
 const blocked=raw.map((_,i)=>i%n>=3);
 const guarded=diffuseContact(raw,blocked,graph);
 assert.ok(guarded.every((v,i)=>blocked[i]||v===0));
 assert.ok(diffuseContact(raw.map(()=>0),blocked,graph).every(v=>v===0));
});
test('adjacent samples across a narrow finger gap are not neighbors',()=>{
 const quad=(lo,hi)=>({positions:[lo,-1,0,hi,-1,0,hi,1,0,lo,1,0],indices:[0,1,2,0,2,3]});
 const samples=[{position:[-.02,0,0],normal:[0,0,1]},{position:[.02,0,0],normal:[0,0,1]}];
 assert.deepEqual(surfaceNeighbors(samples,[quad(-1,-.01),quad(.01,1)]),[[],[]]);
 assert.deepEqual(surfaceNeighbors(samples,[quad(-1,1)]),[[1],[0]]);
});
test('same 1168 points and levels, with no color on raised index/little or uncertain sites',async()=>{
 const legacy=await createContinuousGloveDisplay(),natural=await createContinuousGloveDisplay({naturalContact:true});
 const [a]=parseAudit('75|ccu nnn ccu ccu nnn|cuuuunn|raised fingers');a.state='contact';a.time_ns=75e9;
 const data=digitReferenceTaxels(a),before=data.slice();
 const original=legacy(data),result=natural(data,{a,b:a,time_ns:a.time_ns});
 assert.deepEqual(result.positions,original.positions);
 assert.deepEqual(result.levels,original.levels);
 assert.deepEqual(data,before);
 const rig=await loadRightHandRig();
 try{
  const samples=gloveSurfaceSamples(rig.sample().map((m,i)=>({...m,...rig.topology[i]})),rig.wristPosition[1]);
  let guarded=0;
  samples.forEach((s,i)=>{
   const address=anatomicalAddress(s);
   if(surfaceState(a,address.region,address.u,address.v).state!=='c'){
    assert.deepEqual(result.colors[i],[78,94,112,100]);guarded++;
   }
  });
  assert.ok(guarded>100);
 }finally{rig.dispose();}
 const [released]=parseAudit('76|nnn nnn nnn nnn nnn|nnnnnnn|released');released.state='no_contact';released.time_ns=76e9;
 assert.ok(natural(new Uint8Array(460),{a:released,b:released,time_ns:76e9}).colors.every(c=>c.join()==='78,94,112,100'));
});

test('every surface point including the finger-palm transition can respond when contact is supported',async()=>{
 const render=await createContinuousGloveDisplay({naturalContact:true});
 const [a]=parseAudit('0|ccc ccc ccc ccc ccc|ccccccc|synthetic coverage test only');
 a.state='contact';a.time_ns=0;
 const full=render(new Uint8Array(460).fill(189),{a,b:a,time_ns:0});
 assert.equal(full.positions.length,1168);
 assert.ok(full.colors.every(c=>c[3]===255 && c.slice(0,3).join()!=='78,94,112'),'no permanently unresponsive points');
 const zero=render(new Uint8Array(460),{a,b:a,time_ns:0});
 assert.ok(zero.colors.every(c=>c.join()==='78,94,112,100'),'coverage must not invent signal');
});
