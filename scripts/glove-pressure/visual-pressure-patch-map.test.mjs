import test from 'node:test';
import assert from 'node:assert/strict';
import {contactPatchesToTaxels} from './visual-pressure-patch-map.mjs';
import {createPressureProcessor} from './processor.mjs';
const patch=(u,v)=>({region:'palm',u,v,ru:.15,rv:.18,angle:0,load:.5,confidence:.7});
test('palm contact can move from heel to thumb side without lighting fingers',()=>{
 const a=contactPatchesToTaxels({state:'contact',patches:[patch(.25,.2)]});
 const b=contactPatchesToTaxels({state:'contact',patches:[patch(.8,.6)]});
 assert.notDeepEqual(a.data,b.data);
 assert.ok(a.data.some(Boolean)&&b.data.some(Boolean));
 assert.ok(a.data.slice(300).every(v=>v===0));
 assert.equal(a.data[14*20+15],0);
});
test('anatomical v=1 maps toward fingertips in the actual Pressure renderer',async()=>{
 const renderer=await createPressureProcessor();
 const ys=[];
 for(const v of [.2,.8]){
  const {data}=contactPatchesToTaxels({state:'contact',patches:[{...patch(.5,v),region:'index',ru:.35,rv:.12}]});
  const {positions}=renderer(Uint8Array.from(data));
  assert.ok(positions.length>0);
  ys.push(positions.reduce((sum,p)=>sum+p[1],0)/positions.length);
 }
 assert.ok(ys[1]>ys[0]+.4);
});
test('release is exactly zero and unsupported frames cannot carry patches',()=>{
 assert.ok(contactPatchesToTaxels({state:'no_contact',patches:[]}).data.every(v=>v===0));
 assert.throws(()=>contactPatchesToTaxels({state:'uncertain',patches:[patch(.5,.5)]}));
});
