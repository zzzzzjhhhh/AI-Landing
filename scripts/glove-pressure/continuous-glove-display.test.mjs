import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {surfaceAddress} from './surface-contact-field.mjs';
import {gloveSurfaceSamples,createContinuousGloveDisplay,GLOVE_PITCH} from './continuous-glove-display.mjs';

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
