import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const [out,oldDir]=process.argv.slice(2);
if(!out||!oldDir)throw Error('Usage: node render-contact-patches-review.mjs v3-dir v2-dir');
const rows=readFileSync(join(out,'contact-patches-taxels.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const font='/System/Library/Fonts/Supplemental/Arial.ttf';
let next=0,done=0;
await Promise.all(Array.from({length:3},async()=>{
 while(next<rows.length){
  const i=next++,row=rows[i],id=String(i+1).padStart(2,'0');
  console.log(`[RUNNING] render ${i+1}/${rows.length}, source ${row.requested_time_s.toFixed(1)}s`);
  await run('/usr/bin/sips',['-s','format','png',join(out,`pressure-model-${id}.svg`),'--out',join(out,`pressure-model-${id}.png`)]);
  await run('magick',[
   '(',row.right_image,'-resize','720x540','-background','#151b22','-gravity','center','-extent','720x850',
   '-font',font,'-fill','white','-pointsize','24','-gravity','NorthWest','-annotate','+20+25',`RAW right | ${row.requested_time_s.toFixed(1)}s | frame ${row.right_source_frame_index}`,
   '-pointsize','19','-annotate','+20+63','0.5s samples; NOT source-frame-rate inspection',')',
   '(',join(oldDir,`pressure-model-${id}.png`),'-font',font,'-fill','#ecf6f6','-pointsize','22','-gravity','SouthWest','-annotate','+24+36','V2: previous fixed sites',')',
   '(',join(out,`pressure-model-${id}.png`),'-font',font,'-fill','#ecf6f6','-pointsize','17','-gravity','SouthWest','-annotate','+24+48',`Regions: ${row.active_regions.join(', ')||row.state}`,
   '-pointsize','15','-annotate','+24+22','Unlit does not prove zero force when contact is uncertain',')',
   '+append',join(out,`review-comparison-${String(i+1).padStart(3,'0')}.png`)]);
  done++;
 }
}));
console.log(`[RUNNING] encode ${done} comparison images into review video`);
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','2','-i',join(out,'review-comparison-%03d.png'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',join(out,'pressure-170529-contact-patches-v3.mp4')],{maxBuffer:4e6});
writeFileSync(join(out,'REVIEW.md'),`# 170529 contact patches V3\n\nReview: pressure-170529-contact-patches-v3.mp4\n\nLeft: right-eye raw source image. Middle: V2 fixed-site estimate. Right: V3 contact-footprint estimate.\n\n221 samples at 0.5 s spacing, 0–110 s; not all 2919 source frames. 33 targeted stereo rechecks (24.5, 38.5, 46–50, 60–70, 95.5 s); other samples inspected in chronological right-eye sheets. Events between samples remain unresolved.\n\nPatch locations and radii are visual hypotheses on the palm-facing Pressure surface, not measured forces or reconstructed contact boundaries. Equal display amplitudes avoid inventing force magnitudes. Finger sides and palm-side/heel regions can move independently; the current model does not represent dorsal contact. Unknown samples are dark and labelled uncertain, not certified no contact. Contact with the table is outside the clothing-contact scope. No interpolation bridges releases.\n\nObservations and taxels include source frame IDs, requested and actual timestamps, evidence notes, inferred/unknown regions, and per-patch geometry. The existing app recording has NOT been overwritten.\n`);
console.log('\x1b[32m[COMPLETE] All V3 comparisons rendered and encoded; app data unchanged.\x1b[0m');
