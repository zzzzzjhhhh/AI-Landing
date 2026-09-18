import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {appPressureData} from './digit-app-pressure.mjs';
import {createPressureProcessor,regions} from './processor.mjs';
import {siteSummary} from './digit-contact-audit.mjs';
const read=p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse);
const [samplePath,clockPath]=process.argv.slice(2), samples=read(samplePath),clock=read(clockPath);
if(samples.length!==221 || clock.length!==2920) throw Error('Unexpected coverage');
for(const [i,s] of samples.entries()) {
  siteSummary(s);
  if(s.schema_version!=='visual-digit-contact-v4' || (i && s.time_ns<=samples[i-1].time_ns) || !clock.some(c=>c.tracking_time_ns===s.time_ns)) throw Error('Invalid source clock or schema');
}
let index=0;
const processor=await createPressureProcessor();
for(const [frame_index,c] of clock.entries()) {
  const time_ns=c.tracking_time_ns;
  if(frame_index && time_ns<=clock[frame_index-1].tracking_time_ns) throw Error('Invalid clock');
  while(index+1<samples.length && samples[index+1].time_ns<=time_ns) index++;
  const a=samples[index],b=samples[Math.min(index+1,samples.length-1)];
  const data=appPressureData(a,b,time_ns);
  // Identical mesh-overlay renderer and display parameters to 165650.
  const rendered=processor(data,{min:0,max:189,height:.7,stride:2});
  const levels=Object.fromEntries(regions.map(r=>{
    const values=[];
    for(let y=0;y<r.height;y++) for(let x=0;x<r.width;x++) values.push(data[(r.y+y)*20+r.x+x]);
    return [r.name,Math.max(...values)/255*100];
  }));
  const row={frame_index,time_ns,...rendered,state:a.state,levels,source_sample_id:a.sample_id,unknown_sites:siteSummary(a).unknown};
  if(!process.stdout.write(JSON.stringify(row)+'\n')) await once(process.stdout,'drain');
}
