import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAudit,surfaceState} from './digit-contact-audit.mjs';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {BASE_COLOR,contactField,sampleField,surfaceAddress,createSurfaceContactRenderer} from './surface-contact-field.mjs';

const row=(code,palm='ccccccc')=>({...parseAudit(`0|${code} ${code} ${code} ${code} ${code}|${palm}|test`)[0],time_ns:0});
test('adjacent finger and palm contacts form a continuous field, not individual peaks',()=>{
 const a=row('ccc'),finger=contactField(a,'index'),palm=contactField(a,'palm');
 for(const v of [.2,.34,.35,.36,.5,.69,.7,.71,.8])assert.ok(sampleField(finger,.5,v)>.99);
 for(const u of [.25,.4,.5,.6,.75])assert.ok(sampleField(palm,u,.5)>.99);
});
test('field boundary softens inside contact only; no-contact and unknown stay empty',()=>{
 const a=row('cnu','cuuuunn'),field=contactField(a,'index');
 assert.equal(sampleField(field,.5,.6),0);
 assert.equal(sampleField(field,.5,.2),0);
 assert.ok(sampleField(field,.5,.71)<sampleField(field,.5,.82));
 for(let y=0;y<40;y++)for(let x=0;x<40;x++){
  const u=(x+.5)/40,v=(y+.5)/40;
  if(surfaceState(a,'index',u,v).state!=='c')assert.equal(sampleField(field,u,v),0);
 }
});
test('rendering changes vertex colors only; original geometry remains byte-identical',async()=>{
 const rig=await loadRightHandRig();
 try {
  const meshes=rig.sample().map((m,i)=>({...m,...rig.topology[i]})),snapshot=JSON.stringify(meshes);
  const render=await createSurfaceContactRenderer(meshes),a=row('ccc'),b={...row('nnn','nnnnnnn'),time_ns:500e6};
  const colors=render(a,b,0),released=render(b,b,500e6),transition=render(a,b,440e6);
  assert.equal(JSON.stringify(meshes),snapshot);
  assert.equal(colors[0].length,meshes[0].positions.length/3);
  assert.ok(colors[0].some(c=>c.join()!==BASE_COLOR.join()));
  assert.ok(released.flat().every(c=>c.join()===BASE_COLOR.join()));
  assert.notDeepEqual(transition,colors);
  for(let i=0;i<meshes[0].positions.length/3;i++){
   if(meshes[0].normals[i*3+2]<=0)assert.deepEqual(colors[0][i],BASE_COLOR);
   assert.ok(colors[0][i].every(v=>Number.isInteger(v)&&v>=0&&v<=255));
  }
  assert.equal(surfaceAddress([0,0,0],[0,0,-1]),null);
 } finally {rig.dispose();}
});
