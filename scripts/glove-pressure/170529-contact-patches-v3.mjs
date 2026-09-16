/** Per-sample visual hypotheses, NOT measured forces. No temporal interpolation.
 * Each pipe-separated entry is one inspected 0.5 s image. The compact notation
 * records individual finger extent instead of mapping an action to fixed sites.
 * I73 = index center v=.7, longitudinal radius=.3; optional < / > shifts to
 * a lateral pad. P(u,v,ru,rv) is an explicitly located palm footprint.
 * All hidden pad locations are inferred, including when cloth contact is clear.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {contactPatchesToTaxels} from './visual-pressure-patch-map.mjs';
const [work,output]=process.argv.slice(2);
if(!work||!output) throw Error('Usage: node 170529-contact-patches-v3.mjs work-stage output');
const dirs=['pressure_vision_170529_0to10_pilot','pressure_vision_170529_10to30_batch','pressure_vision_170529_30to110_batch'];
const samples=dirs.flatMap(d=>{
 const path=join(work,d,'input-manifest.json'),m=JSON.parse(readFileSync(path));
 if(m.episode!=='20260911_170529')throw Error('Wrong episode');
 return m.samples.map(s=>({...s,left_image:join(dirname(path),s.left.full_image),right_image:join(dirname(path),s.right.full_image)}));
});
// N: clear separation. U: overlap/onset/out-of-frame unresolved, not a zero-force label.
const blocks=[
 // 0–9.5: hover, broad placement, then lifted waistband.
 `N|N|N|N|U|I64 M64 R63 L62 P(.55,.65,.28,.22)|I64 M64 R64 L63 P(.52,.6,.3,.25)|I64 M64 R64 L63 P(.56,.62,.28,.24)|I64 M64 R63 L62 P(.6,.67,.25,.2)|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I73 M72|T82 I73 M62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62`,
 // 10–19.5: rotations, incomplete visibility, flattening and edge folding.
 `T82 I63 M63 R62|T82 I63 M63 R62|T82 I73 M63 R62|T82 I82 M63|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63|U|U|T82 I73 M73 R62|I64 M64 R64 L63 P(.6,.65,.25,.22)|I64 M64 R64 L63 P(.55,.6,.28,.25)|T82 I73 M63 R62|T82 I73 M63 R62|U|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|T82 I63 M63 R62|I64 M64 R63 L62 P(.55,.7,.28,.18)`,
 // 20–29.5: cloth/table border is not whole-palm contact; distinct release.
 `I64 M64 R64 L63 P(.5,.65,.3,.22)|I64 M64 R64 L63 P(.5,.6,.3,.25)|I64 M64 R64 L63 P(.52,.62,.28,.24)|I64 M64 R63 L62 P(.45,.72,.25,.17)|I73 M73 R72 P(.4,.82,.2,.12)|U|I64 M64 R64 L63 P(.55,.64,.27,.22)|I64 M64 R64 L63 P(.55,.64,.27,.22)|U|N|N|N|N|N|N|U|T82 I73 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62`,
 // 30–39.5: waistband grip, out-of-frame uncertainty, approach/recontact.
 `T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63|T82 I73 M63|U|U|U|U|U|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63 R62|I73 M73 R62|U|I64 M64 R63 P(.55,.72,.24,.18)|T82 I63 M63 R62`,
 // 40–49.5: transfer, empty reach, shirt edge support with repeated releases.
 `T82 I63 M63 R62|T82 I63 M63 R62|I73 M73 R72 P(.55,.8,.2,.12)|N|N|N|N|N|U|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|M62< R52< L42< P(.28,.74,.14,.17)|T82 I73 M62|N|I63< M63< R62<|I63< M63< R62<|N|U|T82 I73 M63 R62`,
 // 50–59.5: cloth hangs over several fingers, hem repositioning.
 `T82 I73 M63 R62|I73 M73 R62|I73 M73 R62|T82 I73 M63 R62|T82 I73 M63|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63|T82 I73 M63|T82 I73 M63|U|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|U|U|I73 M73 R72 L72|I73 M73 R72|T82 I63 M63 R62`,
 // 60–69.5: edge handling -> broad press -> supporting stack -> clear release.
 `T82 I63 M63 R62|U|T82 I63 M63 R62|T82 I63 M63 R62|I64 M64 R63 L62 P(.55,.82,.22,.12)|I73 M73 R73 L72|I73 M73 R72 L72|T82 I73 M73 R72 L72|T82 I73 M73 R72|T82 I63 M63 R62|U|I64 M64 R64 L63 P(.55,.64,.28,.24)|I64 M64 R64 L63 P(.53,.6,.3,.25)|I63< M63< R63< L62< P(.25,.64,.17,.22)|I64 M64 R63 L63 P(.67,.65,.22,.24)|I64 M64 R64 L63 P(.55,.65,.28,.23)|N|N|N|N`,
 // 70–79.5: approach then green waistband grip; lower fold.
 `U|T82 I73 M63|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I73 M63 R62|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63|T82 I63 M63 R62|T82 I73 M63|T82 I73 M73 R72|I73 M73 R72|I73 M73 R72|T82 I73 M63 R62|T82 I73 M63 R62|I64 M64 R64 L63 P(.6,.67,.26,.2)`,
 // 80–89.5: flat contact, lifting stack, release and next garment.
 `I64 M64 R64 L63 P(.55,.65,.28,.22)|I64 M64 R64 L63 P(.55,.65,.28,.22)|T82 I63 M63 R63 L62 P(.35,.72,.2,.18)|T82 I63 M63 R63 L62 P(.3,.68,.18,.2)|I64 M64 R63 L62 P(.6,.7,.24,.19)|I64 M64 R64 L63 P(.5,.6,.3,.26)|I64 M64 R64 L63 P(.5,.6,.3,.26)|N|N|N|N|U|I73 M73 R72|T82 I73 M63 R62|T82 I73 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I73 M63 R62|T82 I73 M63 R62|T82 I73 M63 R62`,
 // 90–99.5: some raised fingers while other fingers retain edge grip.
 `T82 I62 M52 R52|T82 I62 M52 R52|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I63 M63 R62|T82 I62 M52 R52|T82 I62 M52 R52|T82 I73 M63|U|T82 I63 M63 R62|T82 I73 M63 R62|I64 M64 R64 L63 P(.55,.7,.26,.2)|I64 M64 R64 L63 P(.5,.65,.29,.24)|I64 M64 R64 L63 P(.5,.65,.29,.24)|I64 M64 R64 L63 P(.5,.65,.29,.24)|I73 M73 R73 L72 P(.5,.82,.24,.12)|U|T82 I73 M63 R62`,
 // 100–109.5: bottom fold, repeated pressing then releasing.
 `T82 I73 M63 R62|T82 I73 M63 R62|I64 M64 R64 L63 P(.55,.7,.25,.18)|I64 M64 R64 L63 P(.52,.62,.29,.24)|I73 M73 R63 L62 P(.35,.72,.2,.18)|T82 I73 M63 R62|T82 I73 M63|T82 I73 M63 R62|T82 I73 M63 R62|I64 M64 R63 P(.6,.72,.24,.18)|I64 M64 R63 P(.65,.68,.22,.2)|I64 M64 R63 P(.6,.68,.25,.2)|T63 I64 M63 P(.68,.62,.23,.24)|T63 I64 M63 P(.68,.62,.23,.24)|T63 I64 M63 P(.68,.62,.23,.24)|T63 I64 M63 P(.65,.65,.24,.22)|U|N|N|N`,
 `N`,
];
const entries=blocks.flatMap((b,i)=>{const a=b.split('|');if(a.length!==(i===11?1:20))throw Error(`Bad block ${i}: ${a.length}`);return a;});
// Final enlarged stereo recheck: do not infer a whole ulnar palm at 46 s.
// At 65.5/66 s the thumb-side hand is on the fold but the outer little finger
// extends beyond it. Include the thumb/proximal ring pad, not all four tips.
entries[46*2]='M63 R63 L52';
entries[65.5*2]='T63 I64 M63 R43 P(.73,.56,.18,.24)';
entries[66*2]='T63 I64 M63 R43 P(.72,.55,.19,.24)';
if(samples.length!==221||entries.length!==221||samples.some((s,i)=>s.requested_time_s!==i*.5))throw Error('Sample mismatch');
const names={T:'thumb',I:'index',M:'middle',R:'ring',L:'little'};
const all=['thumb','index','middle','ring','little','palm'];
const detailed=new Map([
 [24.5,'Raised open glove, visible separation from folded green cloth.'],
 [38.5,'Open glove approaching beige fold; overlap is not sufficient to establish contact.'],
 [46,'Cloth suspended against curled middle/ring/little support; exact hidden pads inferred, palm contact unresolved.'],
 [46.5,'Opposed edge grip; middle finger support inferred, palm not established.'],
 [47,'Open glove separated from shirt held by left hand.'],
 [47.5,'Several finger sides support the folded edge; palm center not established.'],
 [48,'Index/middle/ring side support along hanging shirt, not an isolated fingertip pinch.'],
 [48.5,'Right hand has dropped away from shirt: release.'],
 [49,'Possible fingertip touch at edge, insufficient separation evidence: unknown.'],
 [49.5,'Regrip at edge; thumb opposes index/middle, ring support inferred.'],
 [50,'Fabric drapes over index/middle and likely ring, palm center exposed.'],
 [60,'Bunched hem supported by multiple curled finger pads, not only thumb/index tips.'],
 [60.5,'Open side-on glove below edge; concealed support versus release unresolved.'],
 [61,'Several curled fingers retain bunched hem; exact pad footprint inferred.'],
 [61.5,'Fold lifted with opposed thumb and several finger pads.'],
 [62,'Four fingers over cloth; only upper palm supported, not entire heel.'],
 [62.5,'Finger pads over garment border; lower palm/thumb on or over TABLE, excluded.'],
 [63,'Finger pads at fabric edge; palm heel outside garment, excluded.'],
 [63.5,'Lower edge held by finger pads and opposed thumb; palm not established.'],
 [64,'Finger pads/edge grip; little finger support unresolved.'],
 [64.5,'Both hands lift fold, multigit support with palm away.'],
 [65,'Blurred open-hand placement transition; contact onset unresolved.'],
 [65.5,'Thumb/index/middle and proximal ring support on fold; thumb-side palm inferred, outer little finger not established.'],
 [66,'Thumb-side palm and several finger pads on fold; outer little finger not automatically included.'],
 [66.5,'Lifted folded shirt supported along finger sides and ulnar palm.'],
 [67,'Placed stack supported by finger pads and thumb-side/upper palm.'],
 [67.5,'Glove still on folded stack before release, four fingers and palm.'],
 [68,'Both hands lifted clear of stack.'],
 [68.5,'Open glove above next garment, no supported cloth contact.'],
 [69,'Left hand reaches garment; right glove remains open nearby.'],
 [69.5,'Right glove hovering; do not propagate old stack pressure.'],
 [70,'Approach to waistband, right contact onset unresolved.'],
 [95.5,'Hooked elastic waistband grip: thumb plus index/middle/ring, palm center not established.'],
]);
function decode(s){
 if(s==='N'||s==='U')return [];
 return s.split(' ').map(token=>{
  const palm=token.match(/^P\(([^)]+)\)$/);
  if(palm){const [u,v,ru,rv]=palm[1].split(',').map(Number);return {region:'palm',u,v,ru,rv,angle:0,load:.5,confidence:.55,evidence:'inferred_surface_footprint'};}
  const m=token.match(/^([TIMRL])([1-9])([1-9])([<>])?$/);
  if(!m)throw Error(`Invalid patch ${token}`);
  return {region:names[m[1]],u:m[4]==='<'?.25:m[4]==='>'?.75:.5,v:+m[2]/10,ru:m[4]?.22:.35,rv:+m[3]/10,angle:m[4]?12:0,load:.5,confidence:.6,evidence:'inferred_surface_footprint'};
 });
}
const observations=samples.map((s,i)=>{
 const code=entries[i],patches=decode(code),state=code==='N'?'no_contact':code==='U'?'uncertain':'contact';
 const active=[...new Set(patches.map(p=>p.region))];
 return {schema_version:'visual-contact-patches-v3',sample_id:`170529-patches-${String(i).padStart(4,'0')}`,requested_time_s:s.requested_time_s,time_s:s.right.actual_time_s,
  left_source_frame_index:s.left.source_frame_index,right_source_frame_index:s.right.source_frame_index,left_image:s.left_image,right_image:s.right_image,
  state,patches,active_regions:active,inferred_regions:active,unknown_regions:state==='no_contact'?[]:all.filter(r=>!active.includes(r)),
  inspection:detailed.has(s.requested_time_s)?'stereo_targeted_recheck':'right_eye_chronological_sheet',
  note:detailed.get(s.requested_time_s)??(state==='contact'?'Selected finger/palm contact footprints are visual hypotheses; hidden pad boundaries not measured.':state==='no_contact'?'Glove clear of garment.':'Contact cannot be resolved from this sample; no pressure invented.'),
  measured:false,scope:'right glove against clothing only',compact_annotation:code};
});
const taxels=observations.map(o=>({...o,...contactPatchesToTaxels(o),time_ns:Math.round(o.time_s*1e9),source:'visual_contact_patches',finger_count:o.active_regions.filter(r=>r!=='palm').length}));
mkdirSync(output,{recursive:true});
writeFileSync(join(output,'contact-patches-observations.json'),JSON.stringify({episode:'20260911_170529',sample_interval_s:.5,observations},null,2));
writeFileSync(join(output,'contact-patches-taxels.jsonl'),taxels.map(o=>JSON.stringify(o)).join('\n')+'\n');
console.log(JSON.stringify({samples:taxels.length,contact:taxels.filter(o=>o.state==='contact').length,no_contact:taxels.filter(o=>o.state==='no_contact').length,uncertain:taxels.filter(o=>o.state==='uncertain').length,targeted:detailed.size}));
