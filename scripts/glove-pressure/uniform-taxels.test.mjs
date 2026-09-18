import test from 'node:test';
import assert from 'node:assert/strict';
import {createPressureProcessor,regions,uniformTaxelSamples,UNIFORM_TAXELS} from './processor.mjs';
import {createReferencePressureDisplay} from './reference-pressure-display.mjs';

test('palm and fingers use approximately equal physical pitch, not equal raster counts',()=>{
 for(const r of regions){
  const grid=uniformTaxelSamples(r,50,50);
  const columns=[...new Set(grid.map(p=>p.col))],rows=[...new Set(grid.map(p=>p.row))];
  const dx=(columns[1]-columns[0])/49*r.size[0],dy=(rows[1]-rows[0])/49*r.size[1];
  assert.ok(Math.abs(dx-UNIFORM_TAXELS.spacing)<.007);
  assert.ok(Math.abs(dy-UNIFORM_TAXELS.spacing)<.007);
  assert.ok(Math.max(dx,dy)/Math.min(dx,dy)<1.15);
 }
});
test('uniform points stay at identical coordinates and count for zero, partial and full contact',async()=>{
 const processor=await createPressureProcessor();
 const options={min:0,max:189,height:.7,stride:2,uniformTaxels:true};
 const blank=processor(new Uint8Array(460),options);
 assert.ok(blank.positions.length>500);
 assert.ok(blank.colors.every(c=>c.slice(0,3).join() === '78,94,112' && c[3]<=85));
 for(const value of [6,50,120,189]){
  const data=new Uint8Array(460).fill(value),rendered=processor(data,options);
  assert.deepEqual(rendered.positions,blank.positions);
  assert.equal(rendered.colors.length,blank.colors.length);
  assert.notDeepEqual(rendered.colors,blank.colors);
 }
});
test('uniform option alters layout only, not taxel levels or contact input',async()=>{
 const legacy=await createReferencePressureDisplay(),uniform=await createReferencePressureDisplay({uniformTaxels:true});
 const data=Uint8Array.from({length:460},(_,i)=>i%190),before=data.slice();
 const a=legacy(data),b=uniform(data);
 assert.deepEqual(a.levels,b.levels);
 assert.equal(a.peak_relative_0_100,b.peak_relative_0_100);
 assert.deepEqual(data,before);
});
