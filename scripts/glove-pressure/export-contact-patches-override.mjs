import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {createPressureProcessor} from './processor.mjs';
import {regions} from './processor.mjs';
import {interpolateContact} from './contact-display-smoothing.mjs';
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
 const smooth=process.argv.includes('--smooth');
 const data=smooth?interpolateContact(s,samples[Math.min(index+1,samples.length-1)],c.tracking_time_ns):s.data;
 const levels=smooth?Object.fromEntries(regions.map(r=>{
  let max=0;for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)max=Math.max(max,data[(r.y+y)*20+r.x+x]);
  return [r.name,max?max/255*100:null];
 })):s.levels;
 const visual=smooth?processPressure(Uint8Array.from(data),{min:0,max:189,height:.7,stride:2}):rendered[index];
 const row={frame_index,time_ns:c.tracking_time_ns,...visual,state:s.state,source_sample_id:s.sample_id,levels};
 if(!process.stdout.write(JSON.stringify(row)+'\n'))await once(process.stdout,'drain');
}
