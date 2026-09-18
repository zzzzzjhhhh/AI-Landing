/** Display-only adapter: retain each episode's existing contact data/clock. */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {createContinuousGloveDisplay} from './continuous-glove-display.mjs';
import {interpolateContact} from './contact-display-smoothing.mjs';

const [episodeDir,firstPath,secondPath]=process.argv.slice(2);
const read=p=>readFileSync(p,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const episode=JSON.parse(readFileSync(join(episodeDir,'manifest.json')));
const clockPath=join(episodeDir,'right-hand-pressure-samples.jsonl'),clock=read(clockPath);
const meta=JSON.parse(readFileSync(join(episodeDir,'right-hand-pressure.json')));
let reviews=null;
if(episode.episode_id==='20260911_165650'){
 const previous=JSON.parse(readFileSync(join(episodeDir,'visual-pressure-override.json')));
 if(!firstPath||!secondPath||sha(firstPath)!==previous.source_files.first_review||sha(secondPath)!==previous.source_files.second_review)throw Error('Must use the exact previously reviewed 165650 matrices');
 reviews=[...read(firstPath),...read(secondPath)].map(s=>({...s,state:['supporting','touching'].includes(s.contact_state)?'contact':s.contact_state}));
 if(reviews.length!==86||reviews.some((s,i)=>s.data.length!==460||(i&&s.time_ns<=reviews[i-1].time_ns)))throw Error('Invalid review samples');
}else if(episode.episode_id!=='20260911_155825')throw Error('This adapter is only for 165650 / 155825');
if(clock.length!==meta.frame_count||clock.at(-1).tracking_time_ns!==meta.duration_ns)throw Error('Invalid source clock');
const display=await createContinuousGloveDisplay({supportedDiffusion:true,hideInactive:true,colorGain:1.2});
let index=0;
for(const [frame_index,c] of clock.entries()){
 const time_ns=c.tracking_time_ns;
 if(frame_index&&time_ns<=clock[frame_index-1].tracking_time_ns)throw Error('Non-increasing source clock');
 let data,state;
 if(reviews){
  while(index+1<reviews.length&&reviews[index+1].time_ns<=time_ns)index++;
  const a=reviews[index],b=reviews[Math.min(index+1,reviews.length-1)];
  data=Uint8Array.from(interpolateContact(a,b,time_ns));state=a.contact_state;
 }else{
  if(c.matrix.length!==460)throw Error('Invalid native matrix');
  data=Uint8Array.from(c.matrix);state=c.phase;
 }
 const rendered=display(data);
 if(!data.some(v=>v>0)&&rendered.positions.length)throw Error('Invented contact at zero-source frame');
 const row={frame_index,time_ns,...rendered,state,source_active:data.some(v=>v>0),matrix_sha256:createHash('sha256').update(data).digest('hex')};
 if(!process.stdout.write(JSON.stringify(row)+'\n'))await once(process.stdout,'drain');
}
