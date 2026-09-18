import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {regions} from './processor.mjs';
import {surfaceAddress} from './surface-contact-field.mjs';
import {gloveSurfaceSamples,createContinuousGloveDisplay,GLOVE_PITCH,CLEAN_DISPLAY_SCALE} from './continuous-glove-display.mjs';

test('one lattice follows real hand triangles and fills space outside the old rectangles',async()=>{
 const rig=await loadRightHandRig();
 try{
  const meshes=rig.sample().map((m,i)=>({...m,...rig.topology[i]}));
  const samples=gloveSurfaceSamples(meshes,rig.wristPosition[1]);
  assert.ok(samples.length>700);
  assert.ok(samples.filter(s=>!surfaceAddress(s.position,s.normal)).length>100,'must not clip to the six old boxes');
  for(const s of samples){
   assert.ok(s.position[1]>rig.wristPosition[1]);
   assert.ok(s.normal[2]>.12);
   for(let axis=0;axis<3;axis++){
    const actual=s.weights.reduce((sum,w,i)=>sum+w*meshes[s.part].positions[s.ids[i]*3+axis],0);
    assert.ok(Math.abs(actual-s.position[axis])<1e-6,'point must be on a real mesh triangle');
   }
  }
  const rows=new Map();
  for(const s of samples){const y=s.position[1];if(!rows.has(y))rows.set(y,[]);rows.get(y).push(s.position[0]);}
  const ys=[...rows.keys()].sort((a,b)=>a-b);
  for(let i=1;i<ys.length;i++)assert.ok(Math.abs((ys[i]-ys[i-1])/(GLOVE_PITCH*Math.sqrt(3)/2)-1)<1e-6);
  for(const xs of rows.values())for(let i=1;i<xs.length;i++){
   const distance=(xs[i]-xs[i-1])/GLOVE_PITCH;
   assert.ok(Math.abs(distance-Math.round(distance))<1e-6,'one shared lattice phase, no region reset');
  }
 }finally{rig.dispose();}
});
test('contact changes colors only; inactive points remain neutral on the full hand',async()=>{
 const render=await createContinuousGloveDisplay();
 const empty=render(new Uint8Array(460)),full=render(new Uint8Array(460).fill(140));
 assert.deepEqual(empty.positions,full.positions);
 assert.ok(empty.colors.every(c=>c.join()==='78,94,112,100'));
 assert.ok(full.colors.some(c=>c.join()!=='78,94,112,100'));
 assert.equal(full.positions.length,full.colors.length);
});
test('clean display hides zero contact without changing geometry, RGB or levels',async()=>{
 const baseline=await createContinuousGloveDisplay(),clean=await createContinuousGloveDisplay({hideInactive:true});
 for(const value of [0,1,12,24,140]){
  const data=new Uint8Array(460).fill(value),a=baseline(data),b=clean(data);
  const indices=b.positions.map(p=>a.positions.findIndex(q=>q.every((v,i)=>v===p[i])));
  assert.ok(indices.every(i=>i>=0));
  assert.deepEqual(a.levels,b.levels);
  assert.deepEqual(indices.map(i=>a.colors[i].slice(0,3)),b.colors.map(c=>c.slice(0,3)));
  assert.ok(b.colors.every(c=>c[3]===255),'alpha must not darken the contact boundary in Rerun');
  if(value===0)assert.equal(b.positions.length,0);
  if(value>=24)assert.ok(b.colors.some(c=>c[3]===255));
 }
});
test('matrix-supported diffusion uses the shared lattice and never fills an inactive finger',async()=>{
 const direct=await createContinuousGloveDisplay({completeCoverage:true,hideInactive:true});
 const smooth=await createContinuousGloveDisplay({supportedDiffusion:true,hideInactive:true});
 assert.deepEqual(smooth(new Uint8Array(460)).positions,[]);
 const full=new Uint8Array(460).fill(140);
 assert.deepEqual(smooth(full),direct(full),'uniform fields must be invariant');
 for(const region of regions){
  const data=new Uint8Array(460);
  for(let y=0;y<region.height;y++)for(let x=0;x<region.width;x++)data[(region.y+y)*20+region.x+x]=140;
  const original=data.slice(),before=direct(data),after=smooth(data);
  const allowed=new Set(before.positions.map(p=>p.join(',')));
  assert.ok(after.positions.length>0);
  assert.ok(after.positions.every(p=>allowed.has(p.join(','))),`must not spread outside ${region.name} support`);
  assert.deepEqual(after.levels,before.levels);
  assert.deepEqual(data,original);
  assert.ok(after.colors.every(c=>c[3]===255));
 }
 await assert.rejects(()=>createContinuousGloveDisplay({naturalContact:true,supportedDiffusion:true}));
});
test('color gain changes only RGB, not support, position, alpha or numeric levels',async()=>{
 const before=await createContinuousGloveDisplay({supportedDiffusion:true,hideInactive:true});
 const after=await createContinuousGloveDisplay({supportedDiffusion:true,hideInactive:true,colorGain:1.2});
 for(const value of [0,1,10,70,140]){
  const data=new Uint8Array(460).fill(value),a=before(data),b=after(data);
  assert.deepEqual(a.positions,b.positions);
  assert.deepEqual(a.levels,b.levels);
  assert.equal(a.peak_relative_0_100,b.peak_relative_0_100);
  assert.deepEqual(a.colors.map(c=>c[3]),b.colors.map(c=>c[3]));
  if(value===70)assert.notDeepEqual(a.colors,b.colors);
 }
});
test('shared 0/22/44 scale changes colors only and saturates above 44',async()=>{
 assert.equal(CLEAN_DISPLAY_SCALE.displayMax,255*.44);
 assert.equal(CLEAN_DISPLAY_SCALE.colorGain,1);
 const old=await createContinuousGloveDisplay({hideInactive:true});
 const aligned=await createContinuousGloveDisplay({hideInactive:true,...CLEAN_DISPLAY_SCALE});
 const data=new Uint8Array(460).fill(56),a=old(data),b=aligned(data);
 assert.deepEqual(a.positions,b.positions);assert.deepEqual(a.levels,b.levels);
 assert.notDeepEqual(a.colors,b.colors);
 assert.deepEqual(aligned(new Uint8Array(460).fill(113)).colors,aligned(new Uint8Array(460).fill(255)).colors);
 assert.equal(aligned(new Uint8Array(460)).positions.length,0);
});
