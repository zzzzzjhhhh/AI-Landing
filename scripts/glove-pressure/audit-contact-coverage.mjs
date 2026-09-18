// Separate geometric mapping holes from n/u labels in the existing audits.
import {readFileSync,writeFileSync} from 'node:fs';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {gloveSurfaceSamples,createContinuousGloveDisplay} from './continuous-glove-display.mjs';
import {surfaceAddress} from './surface-contact-field.mjs';
import {anatomicalAddress} from './natural-contact-color.mjs';
import {surfaceState} from './digit-contact-audit.mjs';
import {digitReferenceTaxels} from './digit-reference-adapter.mjs';

const [input,output]=process.argv.slice(2);
const audits=readFileSync(input,'utf8').trim().split('\n').map(JSON.parse);
const rig=await loadRightHandRig();
let samples;
try{samples=gloveSurfaceSamples(rig.sample().map((m,i)=>({...m,...rig.topology[i]})),rig.wristPosition[1]);}
finally{rig.dispose();}
const before=await createContinuousGloveDisplay({naturalContact:true,completeCoverage:false});
const after=await createContinuousGloveDisplay({naturalContact:true,completeCoverage:true});
const transition=samples.map((s,i)=>({s,i,address:anatomicalAddress(s)})).filter(({s})=>s.position[1]>.45&&s.position[1]<1.0);
const stats={contact_point_observations:0,no_contact_point_observations:0,unknown_point_observations:0,before_contact_neutral:0,after_contact_neutral:0,before_contact_faint:0,after_contact_faint:0};
for(const a of audits){
 const data=digitReferenceTaxels(a),context={a,b:a,time_ns:a.time_ns};
 const old=before(data,context),fresh=after(data,context);
 for(const {i,address} of transition){
  const state=surfaceState(a,address.region,address.u,address.v).state;
  if(state==='c'){
   stats.contact_point_observations++;
   for(const [name,result] of [['before',old],['after',fresh]]){
    if(result.colors[i].slice(0,3).join()==='78,94,112')stats[name+'_contact_neutral']++;
    if(result.colors[i][3]<130)stats[name+'_contact_faint']++;
   }
  }else{
   stats[state==='n'?'no_contact_point_observations':'unknown_point_observations']++;
   if(fresh.colors[i].join()!=='78,94,112,100')throw Error('n/u site falsely activated');
  }
 }
}
const report={audits:audits.length,total_points:samples.length,transition_points:transition.length,old_unmapped_transition_points:transition.filter(({s})=>!surfaceAddress(s.position,s.normal)).length,new_unmapped_transition_points:transition.filter(({address})=>!address).length,...stats,note:'Counts are point-observations over 221 audited timestamps, not video frames or new visual judgments. Residual faint points can be legitimate display falloff near an n/u boundary.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
