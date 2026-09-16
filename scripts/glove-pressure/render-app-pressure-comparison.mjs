import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
const run=promisify(execFile);
const [v3,v2,episode]=process.argv.slice(2);
if(!v3||!v2||!episode)throw Error('Usage: node render-app-pressure-comparison.mjs v3-dir v2-dir app-episode-dir');
const out=join(v3,'with_app_current');mkdirSync(out,{recursive:true});
const source=join(episode,'right-hand-pressure-samples.jsonl');
const manifest=join(episode,'right-hand-pressure.json');
const rows=readFileSync(join(v3,'contact-patches-taxels.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const original=readFileSync(source,'utf8').trim().split('\n').map(JSON.parse);
const deltas=rows.map(r=>Math.min(...original.map(b=>Math.abs(b.tracking_time_ns-r.time_ns)))/1e6);
if(Math.max(...deltas)>25)throw Error('App/sample timeline mismatch');
console.log('[RUNNING] Render actual app sample matrices with manifest display normalization');
await run(process.execPath,[resolve('scripts/glove-pressure/render-vision-pressure-pilot.mjs'),join(v3,'contact-patches-taxels.jsonl'),out,source,manifest],{maxBuffer:4e6});
let next=0;
await Promise.all(Array.from({length:3},async()=>{
 while(next<rows.length){
  const i=next++,id=String(i+1).padStart(2,'0'),seq=String(i+1).padStart(3,'0');
  console.log(`[RUNNING] Compose app comparison ${i+1}/${rows.length} @ ${rows[i].requested_time_s}s`);
  const app=join(out,`pressure-original-${id}.png`);
  await run('/usr/bin/sips',['-s','format','png',join(out,`pressure-original-${id}.svg`),'--out',app]);
  await run('magick',[
   '(', '(',join(v3,`review-comparison-${seq}.png`),'-crop','720x850+0+0','+repage',')',app,'+append',')',
   '(',join(v2,`pressure-model-${id}.png`),join(v3,`pressure-model-${id}.png`),'+append',')',
   '-append',join(out,`comparison-${seq}.png`)]);
 }
}));
console.log('[RUNNING] Encode 2x2 video: raw / app current / V2 / V3');
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','2','-i',join(out,'comparison-%03d.png'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',join(out,'170529-raw-app-v2-v3.mp4')],{maxBuffer:4e6});
writeFileSync(join(out,'provenance.json'),JSON.stringify({app_samples:resolve(source),app_samples_sha256:createHash('sha256').update(readFileSync(source)).digest('hex'),app_manifest:resolve(manifest),max_alignment_error_ms:Math.max(...deltas),samples:rows.length,layout:'top-left raw; top-right app current; bottom-left V2; bottom-right V3',note:'Re-rendered app data with app display normalization; not a UI screen recording. V2/V3 retain experiment color scale. 0.5s sampled comparison, no intervening contact claims. App untouched.'},null,2));
console.log('\x1b[32m[COMPLETE] 170529-raw-app-v2-v3.mp4\x1b[0m');
