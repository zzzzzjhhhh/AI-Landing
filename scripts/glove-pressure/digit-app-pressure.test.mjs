import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAudit,toTaxels} from './digit-contact-audit.mjs';
import {appPressureData} from './digit-app-pressure.mjs';
import {createPressureProcessor} from './processor.mjs';

test('app uses exact audit taxels at anchors and original heatmap renderer',async()=>{
 const [a,b]=parseAudit('0|ccc nnn ccc ccc nnn|cuuuunn|contact\n0.5|nnn nnn nnn nnn nnn|nnnnnnn|release');
 a.time_ns=0;b.time_ns=500e6;
 assert.deepEqual([...appPressureData(a,b,0)],toTaxels(a).data);
 assert.ok(appPressureData(a,b,440e6).some(v=>v===60));
 assert.ok(appPressureData(a,b,500e6).every(v=>v===0));
 const process=await createPressureProcessor(),options={min:0,max:189,height:.7,stride:2};
 assert.deepEqual(process(appPressureData(a,b,0),options),process(Uint8Array.from(toTaxels(a).data),options));
});
test('unknown is retained separately and does not fabricate heat',()=>{
 const [a]=parseAudit('0|uuu uuu uuu uuu uuu|uuuuuuu|occluded');a.time_ns=0;
 assert.ok(toTaxels(a).unknown_mask.some(Boolean));
 assert.ok(appPressureData(a,a,0).every(v=>v===0));
});
