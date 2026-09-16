import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {createPressureProcessor} from './processor.mjs';
const [samplePath,clockPath]=process.argv.slice(2);
const read=p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse);
const samples=read(samplePath),clock=read(clockPath);
if(samples.length!==221||clock.length!==2920)throw Error('Unexpected 170529 sample/clock count');
const processPressure=await createPressureProcessor();
const rendered=samples.map((s,i)=>{
 if(s.source!=='visual_contact_patches'||s.data.length!==460||s.requested_time_s!==i*.5||i&&s.time_ns<=samples[i-1].time_ns)throw Error('Invalid V3 samples');
 if(!clock.some(c=>c.tracking_time_ns===s.time_ns))throw Error('Sample not on app source clock');
 return processPressure(Uint8Array.from(s.data),{min:0,max:189,height:.7,stride:2});
});
let index=0;
for(const [frame_index,c] of clock.entries()){
 if(frame_index&&c.tracking_time_ns<=clock[frame_index-1].tracking_time_ns)throw Error('Invalid clock');
 while(index+1<samples.length&&samples[index+1].time_ns<=c.tracking_time_ns)index++;
 const s=samples[index];
 const row={frame_index,time_ns:c.tracking_time_ns,...rendered[index],state:s.state,source_sample_id:s.sample_id,levels:s.levels};
 if(!process.stdout.write(JSON.stringify(row)+'\n'))await once(process.stdout,'drain');
}
