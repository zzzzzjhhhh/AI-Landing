// Offline review of the EXACT App pressure samples/mesh, not a UI recording.
// Source pixels are decoded at native resolution; every frame has its own PTS.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {loadRightHandRig} from './right-hand-rig.mjs';
import {createContinuousGloveDisplay} from './continuous-glove-display.mjs';
import {digitReferenceTaxels} from './digit-reference-adapter.mjs';
import {interpolateContact} from './contact-display-smoothing.mjs';

const [samplePath,episodeDir,videoPath,timestampsPath,outputDir]=process.argv.slice(2);
const resume=process.argv.includes('--resume');
if(!outputDir)throw Error('Usage: node render-clean-pressure-review.mjs samples.jsonl episode-dir source.mp4 timestamps.csv output-dir');
const out=resolve(outputDir),framesDir=join(out,'frames');mkdirSync(framesDir,{recursive:true});
const read=p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse);
const samples=read(samplePath),clock=read(join(episodeDir,'right-hand-pressure-samples.jsonl'));
const csv=readFileSync(timestampsPath,'utf8').trim().split(/\r?\n/),headers=csv.shift().split(',');
const timestamps=csv.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[headers[i],Number(v)])));
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_streams','-show_frames','-show_entries','stream=width,height,nb_frames,duration:frame=best_effort_timestamp_time','-of','json',videoPath],{maxBuffer:8e6}));
const {width,height,nb_frames}=probe.streams[0];
if(timestamps.length!==Number(nb_frames)||clock.length!==timestamps.length+1)throw Error('Source/clock frame count mismatch');
for(let i=0;i<timestamps.length;i++){
 if(timestamps[i].frame_index!==i||timestamps[i].t_sync_us*1000!==clock[i].tracking_time_ns||Math.abs(Number(probe.frames[i].best_effort_timestamp_time)*1e6-timestamps[i].t_sync_us)>2)throw Error(`PTS mismatch at ${i}`);
}
for(const s of samples)s.data=Array.from(digitReferenceTaxels(s));
const display=await createContinuousGloveDisplay({naturalContact:true,hideInactive:true});
const rig=await loadRightHandRig();
const meshes=rig.sample().map((m,i)=>({...m,...rig.topology[i]}));rig.dispose();
const panel=720,header=64,footer=48,W=width+panel,H=height+header+footer;
const scale=Math.min(panel/3.3,height/5.25),px=x=>panel/2+(x+.45)*scale,py=y=>height/2+(.05-y)*scale;
const svg=(w,h,body)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
// Smooth vertex-normal shading on the original triangles (no SVG edge seams).
const skin=Buffer.alloc(panel*height*3),depth=new Float64Array(panel*height).fill(-Infinity);
for(let i=0;i<skin.length;i+=3){skin[i]=16;skin[i+1]=24;skin[i+2]=32;}
for(const m of meshes)for(let i=0;i<m.indices.length;i+=3){
 const ids=m.indices.slice(i,i+3),p=ids.map(j=>m.positions.slice(j*3,j*3+3));
 const q=p.map(v=>[px(v[0]),py(v[1])]),[a,b,c]=q;
 const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-9)continue;
 for(let y=Math.max(0,Math.floor(Math.min(...q.map(v=>v[1]))));y<=Math.min(height-1,Math.ceil(Math.max(...q.map(v=>v[1]))));y++)
 for(let x=Math.max(0,Math.floor(Math.min(...q.map(v=>v[0]))));x<=Math.min(panel-1,Math.ceil(Math.max(...q.map(v=>v[0]))));x++){
  const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/d;
  const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/d,w=1-u-v;if(Math.min(u,v,w)<0)continue;
  const weights=[u,v,w],z=weights.reduce((s,k,j)=>s+k*p[j][2],0),at=y*panel+x;if(z<=depth[at])continue;
  depth[at]=z;
  const normal=[0,1,2].map(axis=>weights.reduce((s,k,j)=>s+k*m.normals[ids[j]*3+axis],0));
  const light=.65+.35*Math.max(0,normal[2]/Math.hypot(...normal));
  [78,94,112].forEach((c,j)=>skin[at*3+j]=Math.round(c*light));
 }
}
const background=await sharp({create:{width:W,height:H,channels:3,background:'#101820'}}).raw().toBuffer();
const top=await sharp(svg(W,header,`<g fill="#eef3f6" font-family="sans-serif" font-size="24"><text x="20" y="38">170529 | Original right camera (${width} x ${height})</text><text x="${width+22}" y="38">Pressure | same App data, no dark dots</text></g>`)).png().toBuffer();
let stderr='';
const decoder=resume?null:spawn('ffmpeg',['-v','error','-i',videoPath,'-map','0:v:0','-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{stdio:['ignore','pipe','pipe']});
decoder?.stderr.on('data',b=>stderr+=b);
const decoded=decoder?once(decoder,'close'):null;
const frameBytes=width*height*3;let buffer=Buffer.alloc(0),frame=0,index=0;
const map=[];
const pending=new Set();
if(resume){
 map.push(...JSON.parse(readFileSync(join(out,'frame-map.json'))));frame=map.length;
 if(frame!==timestamps.length||map.some((r,i)=>r.frame_index!==i||r.time_ns!==clock[i].tracking_time_ns))throw Error('Invalid saved frame map');
 console.log(`[RUNNING] Resume encoding ${frame} existing source-aligned PNG frames`);
}else try{
 for await(const chunk of decoder.stdout){
  buffer=Buffer.concat([buffer,chunk]);
  while(buffer.length>=frameBytes){
   const pixels=buffer.subarray(0,frameBytes);buffer=buffer.subarray(frameBytes);
   if(frame>=timestamps.length)throw Error('Extra decoded frame');
   const time_ns=clock[frame].tracking_time_ns;
   while(index+1<samples.length&&samples[index+1].time_ns<=time_ns)index++;
   const a=samples[index],b=samples[Math.min(index+1,samples.length-1)];
   const result=display(Uint8Array.from(interpolateContact(a,b,time_ns)),{a,b,time_ns});
   const dots=result.colors.map((c,i)=>c[3]?`<circle cx="${px(result.positions[i][0])}" cy="${py(result.positions[i][1])}" r="${.018*scale}" fill="rgb(${c.slice(0,3)})" fill-opacity="${c[3]/255}"/>`:'').join('');
   const label=svg(W,footer,`<g fill="#d0dfe6" font-family="sans-serif" font-size="21"><text x="20" y="29">Frame ${frame} / ${timestamps.length-1} (0-based) | t=${(time_ns/1e9).toFixed(6)} s</text><text x="${width+15}" y="29">Visual contact estimate, NOT measured force</text></g>`);
   const name=`frame-${String(frame).padStart(5,'0')}.png`;
   const job=(async()=>{
    const hand=await sharp(skin,{raw:{width:panel,height,channels:3}}).composite([{input:svg(panel,height,dots)}]).removeAlpha().raw().toBuffer();
    await sharp(background,{raw:{width:W,height:H,channels:3}}).composite([{input:top,left:0,top:0},{input:pixels,raw:{width,height,channels:3},left:0,top:header},{input:hand,raw:{width:panel,height,channels:3},left:width,top:header},{input:label,left:0,top:header+height}]).png({compressionLevel:1}).toFile(join(framesDir,name));
   })();
   pending.add(job);job.then(()=>pending.delete(job),()=>{});
   if(pending.size>=4)await Promise.race(pending);
   map.push({frame_index:frame,time_ns,file:`frames/${name}`,source_sample_id:a.sample_id});
   if(frame%100===0)console.log(`[RUNNING] Render frame ${frame+1}/${timestamps.length}, source t=${(time_ns/1e9).toFixed(3)}s`);
   frame++;
  }
 }
 const [code]=await decoded;await Promise.all(pending);if(code!==0||buffer.length||frame!==timestamps.length)throw Error(`Decode incomplete: ${frame}, ${stderr}`);
}finally{if(decoder.exitCode===null)decoder.kill();}
const duration=clock.at(-1).tracking_time_ns/1e9;
writeFileSync(join(out,'frame-map.json'),JSON.stringify(map));
writeFileSync(join(out,'frames.ffconcat'),'ffconcat version 1.0\n'+map.map((m,i)=>`file '${m.file}'\noption framerate 1000000\nduration ${((clock[i+1].tracking_time_ns-m.time_ns)/1e9).toFixed(9)}\n`).join('')+`file '${map.at(-1).file}'\noption framerate 1000000\n`);
console.log('[RUNNING] Encode full-frame VFR comparison (native camera pixels, exact source timestamps)');
const video=join(out,'170529-pressure-clean-comparison.mp4');
execFileSync('ffmpeg',['-hide_banner','-loglevel','warning','-y','-safe','0','-i',join(out,'frames.ffconcat'),'-fps_mode','passthrough','-enc_time_base','1:1000000','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-video_track_timescale','1000000','-movflags','+faststart',video],{stdio:'inherit'});
const encoded=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',video],{maxBuffer:8e6}));
if(encoded.frames.length!==map.length+1)throw Error('Review frame count mismatch');
const maxError=Math.max(...encoded.frames.map((f,i)=>Math.abs(Number(f.best_effort_timestamp_time)-(i<map.length?map[i].time_ns/1e9:duration))));
if(maxError>2e-6)throw Error(`Review PTS error ${maxError}`);
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
writeFileSync(join(out,'provenance.json'),JSON.stringify({source_video:resolve(videoPath),source_sha256:sha(videoPath),samples:resolve(samplePath),samples_sha256:sha(samplePath),app_asset:JSON.parse(readFileSync(join(episodeDir,'visual-pressure-v4-glove-clean.json'))).data,frames:frame,duration_seconds:duration,max_alignment_error_seconds:maxError,native_video_dimensions:[width,height],output_dimensions:[W,H],review:'Offline rendering of exact App hand mesh, positions, RGBA and contact interpolation. Fixed frontal camera and simplified lighting; NOT a UI screen recording. Every source frame retained; PNG frames lossless. Contact labels remain 0.5-second visual estimates, not per-frame measured pressure.'},null,2));
writeFileSync(join(out,'review.html'),`<!doctype html><meta charset="utf-8"><title>170529 Pressure frame review</title><style>body{background:#101820;color:#fff;font:18px sans-serif;margin:16px}img{width:100%;display:block}button,input{font-size:18px;margin:8px}input[type=range]{width:55%}</style><h2>170529 · 原视频 / Pressure（去黑点）</h2><p>← → 逐帧；PNG 无损。右侧复用 App 数据和模型离线渲染，光照与 App 略有区别。颜色为视觉接触估计，不是实测压力。</p><button id="prev">上一帧</button><button id="next">下一帧</button><input id="slider" type="range" min="0" max="${map.length-1}" value="0"><input id="num" type="number" min="0" max="${map.length-1}" value="0"><span id="label"></span><img id="frame"><script>const rows=${JSON.stringify(map.map(r=>({t:r.time_ns/1e9,file:r.file})))};let i=0;const slider=document.getElementById('slider'),num=document.getElementById('num');function show(n){i=Math.max(0,Math.min(rows.length-1,Number(n)||0));slider.value=num.value=i;document.getElementById('frame').src=rows[i].file;document.getElementById('label').textContent=rows[i].t.toFixed(6)+' s'}document.getElementById('prev').onclick=()=>show(i-1);document.getElementById('next').onclick=()=>show(i+1);slider.oninput=()=>show(slider.value);num.onchange=()=>show(num.value);document.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(i+(e.key==='ArrowLeft'?-1:1))}};show(0);</script>`);
console.log(`\x1b[32m[COMPLETE] ${frame} frames; alignment error ${maxError}s; ${video}\x1b[0m`);
