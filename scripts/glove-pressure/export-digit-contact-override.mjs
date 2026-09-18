import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {renderContact} from './digit-display-smoothing.mjs';
import {siteSummary} from './digit-contact-audit.mjs';
const read=p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse);
const [samplePath,clockPath]=process.argv.slice(2), samples=read(samplePath),clock=read(clockPath);
if(samples.length!==221 || clock.length!==2920) throw Error('Unexpected coverage');
for(const [i,s] of samples.entries()) {
  siteSummary(s);
  if(s.schema_version!=='visual-digit-contact-v4' || (i && s.time_ns<=samples[i-1].time_ns) || !clock.some(c=>c.tracking_time_ns===s.time_ns)) throw Error('Invalid source clock or schema');
}
let index=0;
for(const [frame_index,c] of clock.entries()) {
  const time_ns=c.tracking_time_ns;
  if(frame_index && time_ns<=clock[frame_index-1].tracking_time_ns) throw Error('Invalid clock');
  while(index+1<samples.length && samples[index+1].time_ns<=time_ns) index++;
  const a=samples[index],b=samples[Math.min(index+1,samples.length-1)];
  const row={frame_index,time_ns,...renderContact(a,b,time_ns),state:a.state,levels:{},source_sample_id:a.sample_id};
  if(!process.stdout.write(JSON.stringify(row)+'\n')) await once(process.stdout,'drain');
}
