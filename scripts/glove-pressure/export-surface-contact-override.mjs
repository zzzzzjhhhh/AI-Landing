import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {createSurfaceContactRenderer} from './surface-contact-field.mjs';
import {siteSummary} from './digit-contact-audit.mjs';
const read=p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse);
const [samplePath,clockPath]=process.argv.slice(2),samples=read(samplePath),clock=read(clockPath);
async function emit(row){if(!process.stdout.write(JSON.stringify(row)+'\n'))await once(process.stdout,'drain');}
if(samples.length!==221||clock.length!==2920)throw Error('Unexpected coverage');
for(const [i,s] of samples.entries()){
  siteSummary(s);
  if(s.schema_version!=='visual-digit-contact-v4'||(i&&s.time_ns<=samples[i-1].time_ns)||!clock.some(c=>c.tracking_time_ns===s.time_ns))throw Error('Invalid audit clock');
}
const rig=await loadRightHandRig();
try {
  const meshes=rig.sample().map((m,i)=>({...m,...rig.topology[i]}));
  await emit({type:'model',meshes});
  const render=await createSurfaceContactRenderer(meshes);
  let index=0;
  for(const [frame_index,c] of clock.entries()){
    const time_ns=c.tracking_time_ns;
    if(frame_index&&time_ns<=clock[frame_index-1].tracking_time_ns)throw Error('Invalid source clock');
    while(index+1<samples.length&&samples[index+1].time_ns<=time_ns)index++;
    const a=samples[index],b=samples[Math.min(index+1,samples.length-1)];
    await emit({frame_index,time_ns,vertex_colors:render(a,b,time_ns),positions:[],state:a.state,levels:{},unknown_sites:siteSummary(a).unknown,source_sample_id:a.sample_id});
  }
} finally {rig.dispose();}
