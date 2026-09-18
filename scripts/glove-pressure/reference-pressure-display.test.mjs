import test from 'node:test';
import assert from 'node:assert/strict';
import {createReferencePressureDisplay} from './reference-pressure-display.mjs';
import {createPressureProcessor,regions} from './processor.mjs';
import {paintPressureRegion} from './pressure-region-kernel.mjs';
import {digitReferenceTaxels} from './digit-reference-adapter.mjs';
import {parseAudit,surfaceState} from './digit-contact-audit.mjs';

test('shared display is numerically identical to the original 165650 renderer',async()=>{
 const shared=await createReferencePressureDisplay(),legacy=await createPressureProcessor();
 for(const amplitude of [0,1/3,2/3,1]){
  const data=new Uint8Array(460);
  for(const region of regions)paintPressureRegion(data,region,{centerU:.5,centerV:.48,widthU:.38,widthV:.20,amplitude});
  const expected=legacy(data,{min:0,max:189,height:.7,stride:2}),actual=shared(data);
  assert.deepEqual(actual.positions,expected.positions);
  assert.deepEqual(actual.colors,expected.colors);
 }
});
test('extracted Gaussian kernel preserves original 165650 taxels exactly',()=>{
 for(const region of regions){
  const actual=new Uint8Array(460),expected=new Uint8Array(460);
  const shape={centerU:.5,centerV:.48,widthU:.38,widthV:.2,amplitude:2/3};
  paintPressureRegion(actual,region,shape);
  for(let row=0;row<region.height;row++)for(let col=0;col<region.width;col++){
   const u=(col+.5)/region.width,v=(row+.5)/region.height;
   const distance=((u-shape.centerU)/shape.widthU)**2+((v-shape.centerV)/shape.widthV)**2;
   expected[(row+region.y)*20+col+region.x]=Math.round(255*shape.amplitude*Math.exp(-distance));
  }
  assert.deepEqual(actual,expected);
 }
});
test('three touching finger segments produce one connected lobe, not three peaks',()=>{
 const [row]=parseAudit('0|ccc ccc ccc ccc ccc|ccccccc|contact');
 const data=digitReferenceTaxels(row);
 for(const region of regions.filter(r=>r.name!=='palm')){
  const center=Array.from({length:region.height},(_,y)=>data[(region.y+y)*20+region.x+1]);
  assert.ok(center.every(v=>v>0));
  let falling=false;
  for(let i=1;i<center.length;i++){
   if(center[i]<center[i-1])falling=true;
   if(falling)assert.ok(center[i]<=center[i-1]);
  }
 }
});
test('adaptation retains no-contact and uncertain zones, including raised index/little',()=>{
 const [row]=parseAudit('75|ccu nnn ccu ccu nnn|cuuuunn|raised index and little');
 const data=digitReferenceTaxels(row);
 for(const r of regions)for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){
  const state=surfaceState(row,r.name,(x+.5)/r.width,(y+.5)/r.height).state;
  if(state!=='c')assert.equal(data[(r.y+y)*20+r.x+x],0);
 }
});
