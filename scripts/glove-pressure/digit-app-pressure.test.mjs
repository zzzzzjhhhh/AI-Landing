import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAudit,toTaxels} from './digit-contact-audit.mjs';
import {appPressureData} from './digit-app-pressure.mjs';
import {createPressureProcessor} from './processor.mjs';

test('app uses tapered heatmaps within audit masks and original renderer',async()=>{
 const [a,b]=parseAudit('0|ccc nnn ccc ccc nnn|cuuuunn|contact\n0.5|nnn nnn nnn nnn nnn|nnnnnnn|release');
 a.time_ns=0;b.time_ns=500e6;
 const data=appPressureData(a,b,0),mask=toTaxels(a);
 assert.ok(new Set([...data].filter(Boolean)).size>5,'not a constant-height binary tile');
 assert.ok([...data].every((v,i)=>!v || mask.data[i]>0),'no contact outside approved footprint');
 assert.ok([...appPressureData(a,b,440e6)].every((v,i)=>Math.abs(v-data[i]/2)<=1));
 assert.ok(appPressureData(a,b,500e6).every(v=>v===0));
 const process=await createPressureProcessor(),options={min:0,max:189,height:.7,stride:2};
 const rendered=process(data,options);
 assert.ok(rendered.positions.length>0);
 assert.ok(new Set(rendered.colors.map(c=>c.slice(0,3).join(','))).size>5);
});
test('unknown is retained separately and does not fabricate heat',()=>{
 const [a]=parseAudit('0|uuu uuu uuu uuu uuu|uuuuuuu|occluded');a.time_ns=0;
 assert.ok(toTaxels(a).unknown_mask.some(Boolean));
 assert.ok(appPressureData(a,a,0).every(v=>v===0));
});
