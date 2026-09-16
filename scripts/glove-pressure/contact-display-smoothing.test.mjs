import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolateContact as mix} from './contact-display-smoothing.mjs';
const a={time_ns:0,state:'contact',data:[100,0]},b={time_ns:500e6,state:'contact',data:[0,100]};
test('contact interpolation preserves anchors and moves continuously',()=>{
 assert.deepEqual(mix(a,b,0),a.data);assert.deepEqual(mix(a,b,500e6),b.data);
 assert.deepEqual(mix(a,b,250e6),[50,50]);
});
test('release has no trailing contact and unknown does not bridge',()=>{
 const off={...b,state:'no_contact',data:[0,0]};
 assert.deepEqual(mix(a,off,500e6),[0,0]);
 assert.deepEqual(mix(a,{...off,data:[35,0]},500e6),[0,0]);
 assert.ok(mix(a,off,450e6)[0]<100);
 assert.deepEqual(mix({...a,state:'uncertain',data:[0,0]},b,250e6),[0,0]);
 assert.deepEqual(mix(a,a,1e9),a.data);
});
