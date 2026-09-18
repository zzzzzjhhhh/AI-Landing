/** Offline, sampled visual review. Never modifies app recordings or starts/stops the app. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createPressureProcessor, regions } from './processor.mjs';
import { loadRightHandRig } from './right-hand-rig.mjs';
import { digits, segments, palmZones, parseAudit, validateTimeline, surfaceState, siteSummary, toTaxels } from './digit-contact-audit.mjs';

const [sourcePath, outputDir] = process.argv.slice(2);
if (!sourcePath || !outputDir) throw Error('Usage: node build-v4-digit-review.mjs V3-taxels.jsonl output-dir');
const source = readFileSync(sourcePath, 'utf8').trim().split('\n').map(JSON.parse);
const audits = parseAudit(readFileSync(new URL('./170529-v4-digit-audit.txt', import.meta.url), 'utf8'));
validateTimeline(audits, source);
mkdirSync(outputDir, { recursive: true });
mkdirSync(join(outputDir, 'svg'), { recursive: true });
const run = promisify(execFile), rig = await loadRightHandRig(), processor = await createPressureProcessor();
const mesh = rig.sample()[0], triangles = rig.topology[0].indices;
const px = x => (x + 2.2) / 3.5 * 720, py = y => (3.25 - y) / 5.6 * 850;
const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const text = (x, y, value, size=22, fill='#dbe5ec') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="Arial,sans-serif">${xml(value)}</text>`;
function wrap(value, width) {
  const lines=[''];
  for(const word of value.split(/\s+/)) {
    if(lines.at(-1).length + word.length > width) lines.push(word);
    else lines[lines.length-1] += `${lines.at(-1) ? ' ' : ''}${word}`;
  }
  return lines;
}
const faces=[];
for(let n=0;n<triangles.length;n+=3) {
  const indices=triangles.slice(n,n+3), p=mesh.positions;
  const shade=Math.round(97+30*Math.max(0,indices.reduce((s,i)=>s+mesh.normals[i*3+2],0)/3));
  faces.push({z:indices.reduce((s,i)=>s+p[i*3+2],0)/3,
    svg:`<polygon points="${Array.from(indices,i=>`${px(p[i*3]).toFixed(1)},${py(p[i*3+1]).toFixed(1)}`).join(' ')}" fill="rgb(${shade},${shade+11},${shade+20})"/>`});
}
faces.sort((a,b)=>a.z-b.z);
const skin=faces.map(f=>f.svg).join('');
const circle=(position,r,color,opacity=1)=>`<circle cx="${px(position[0]).toFixed(1)}" cy="${py(position[1]).toFixed(1)}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
function oldModel(row) {
  const pressure=processor(Uint8Array.from(row.data),{min:0,max:189,height:.7,stride:2});
  return skin+pressure.positions.map((p,i)=>circle(p,2.4,`rgb(${pressure.colors[i].slice(0,3).join(',')})`,pressure.colors[i][3]/255)).join('');
}
function newModel(row) {
  const dots=[];
  for(const r of regions) {
    const [rx,ry]=r.rotation.map(d=>d*Math.PI/180);
    for(let y=0;y<50;y++) for(let x=0;x<32;x++) {
      const u=(x+.5)/32,v=(y+.5)/50,s=surfaceState(row,r.name,u,v);
      if(!s.footprint && !(s.state==='u' && x%3===0 && y%3===0)) continue;
      // Same rig, ROI sizes/rotations as Pressure; categorical fixed-height
      // contact display. No WASM interpolation may bleed into an n/u segment.
      const localX=(u-.5)*r.size[0],localZ=(.5-v)*r.size[1],localY=.08;
      const rotatedX=Math.cos(ry)*localX+Math.sin(ry)*localZ;
      const rotatedZ=-Math.sin(ry)*localX+Math.cos(ry)*localZ;
      const p=[rotatedX+r.position[0],Math.cos(rx)*localY-Math.sin(rx)*rotatedZ+r.position[1],Math.sin(rx)*localY+Math.cos(rx)*rotatedZ+r.position[2]];
      dots.push(circle(p,s.footprint?1.8:1.7,s.footprint?'#45e9ad':'#ffc36b',s.footprint?.95:.8));
    }
  }
  return skin+dots.join('');
}
const pngName=i=>`review-${String(i).padStart(3,'0')}.jpg`;
const paint={c:'#45e9ad',n:'#7b8997',u:'#ffc36b'};
function ledger(row) {
  let svg=text(1295,835,'Finger pads: distal / middle / proximal',22);
  digits.forEach((d,i)=>{
    const y=875+i*36;
    svg+=text(1295,y,d,22);
    segments.forEach((s,j)=>{const c=row.digits[d][s];svg+=`<rect x="${1430+j*100}" y="${y-24}" width="88" height="31" rx="5" fill="${paint[c]}" fill-opacity=".18"/>`+text(1460+j*100,y,c.toUpperCase(),23,paint[c]);});
  });
  svg+=text(1295,1070,'Palm zones',22);
  const labels={thenar:'Thumb mound',hypothenar:'Little mound',center:'Center',distal_radial:'Upper thumb side',distal_ulnar:'Upper little side',heel_radial:'Thumb-side heel',heel_ulnar:'Little-side heel'};
  palmZones.forEach((p,i)=>{const x=1295+(i%2)*305,y=1100+Math.floor(i/2)*28,c=row.palm[p.name];svg+=text(x,y,`${labels[p.name]}: ${c.toUpperCase()}`,19,paint[c]);});
  return svg;
}
function jpegData(path) {
  if(!existsSync(path)) throw Error(`Missing input ${path}`);
  return execFileSync('magick',[path,'-resize','640x480','-quality','94','jpeg:-'],{maxBuffer:5e6}).toString('base64');
}
const rows=audits.map((a,i)=>{
  const s=source[i],summary=siteSummary(a);
  return {schema_version:'visual-digit-contact-v4',sample_id:`170529-v4-${String(i).padStart(3,'0')}`,
    ...a,time_ns:s.time_ns,time_s:s.time_ns/1e9,left_source_frame_index:s.left_source_frame_index,right_source_frame_index:s.right_source_frame_index,
    left_image:s.left_image,right_image:s.right_image,inspection:'stereo_full_context_and_temporal_neighbors',
    source:'codex_visual_sample_audit',hand:'right_glove',measured:false,force_newtons:null,
    confidence_policy:'All c are visual inferences, not verified physical measurements. Hidden/ambiguous pads remain u.',
    spatial_policy:'22 schematic anatomical areas, not recovered millimeter-scale contact boundaries.',
    temporal_policy:'Only 0.5s samples visually reviewed; no assertion about unsampled contact transitions.',
    state:summary.inferred_contact.length?'contact':summary.unknown.length?'uncertain':'no_contact',
    ...summary,...toTaxels(a)};
});
writeFileSync(join(outputDir,'digit-contact-v4.jsonl'),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
writeFileSync(join(outputDir,'digit-contact-v4.json'),JSON.stringify({schema_version:'visual-digit-contact-v4',episode:'20260911_170529',sample_interval_s:.5,app_modified:false,observations:rows},null,2));
const totals={samples:rows.length,per_site:{},frames: {contact:0,no_contact:0,uncertain:0}};
for(const r of rows){totals.frames[r.state]++;for(const state of ['inferred_contact','no_contact','unknown'])for(const site of r[state]) {totals.per_site[site]??={inferred_contact:0,no_contact:0,unknown:0};totals.per_site[site][state]++;}}
writeFileSync(join(outputDir,'summary.json'),JSON.stringify(totals,null,2));
writeFileSync(join(outputDir,'annotations.csv'),'time_s,source_time_s,source_frame,thumb_DMP,index_DMP,middle_DMP,ring_DMP,little_DMP,palm_zones,evidence\n'+rows.map(r=>[r.requested_time_s,r.time_s,r.right_source_frame_index,...digits.map(d=>segments.map(s=>r.digits[d][s]).join('')),palmZones.map(p=>r.palm[p.name]).join(''),`"${r.evidence.replaceAll('"','""')}"`].join(',')).join('\n')+'\n');

try {
  let next=0;
  async function worker(){
    while(next<rows.length){
      const i=next++,r=rows[i],summary=siteSummary(r);
      const right=jpegData(r.right_image),left=jpegData(r.left_image);
      let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200"><rect width="1920" height="1200" fill="#101720"/>`;
      svg+=text(18,34,`170529 | ${r.requested_time_s.toFixed(1)}s requested | source ${r.time_s.toFixed(3)}s / frame ${r.right_source_frame_index}`,27);
      svg+=text(18,65,'Stereo evidence - full frames; sampled every 0.5 seconds',19,'#a8bacb');
      svg+=text(18,96,'RIGHT camera',21)+`<image x="0" y="110" width="640" height="480" href="data:image/jpeg;base64,${right}"/>`;
      svg+=text(18,630,'LEFT camera (contact / hover cross-check)',21)+`<image x="0" y="645" width="640" height="480" href="data:image/jpeg;base64,${left}"/>`;
      svg+=text(665,80,'V3 - previous sampled contact map',24)+text(1295,80,'V4 - per-pad contact audit',24,'#45e9ad');
      svg+=`<g transform="translate(640,80) scale(.87)">${oldModel(source[i])}</g><g transform="translate(1270,80) scale(.87)">${newModel(r)}</g>`;
      svg+=text(665,835,'V4 legend (categorical, NOT force)',24);
      svg+=text(665,875,'C / green: visually inferred contact',22,paint.c)+text(665,912,'N / gray: visibly no contact',22,paint.n)+text(665,949,'U / amber dots: cannot determine',22,paint.u);
      svg+=text(665,990,`${summary.inferred_contact.length} contact areas / ${summary.unknown.length} unknown`,22);
      wrap(r.evidence,48).forEach((line,j)=>{svg+=text(665,1035+j*27,line,20);});
      svg+=text(18,1168,'Pressure magnitude and exact hidden footprints cannot be measured from these images.',21,'#ffc36b');
      svg+=ledger(r)+'</svg>';
      const svgPath=join(outputDir,'svg',`review-${String(i).padStart(3,'0')}.svg`);
      writeFileSync(svgPath,svg);
      await run('sips',['-s','format','jpeg',svgPath,'--out',join(outputDir,pngName(i))],{maxBuffer:1e6});
      if(i%20===0)console.log(`[RUNNING] V4 comparison image ${i+1}/${rows.length}: ${r.requested_time_s.toFixed(1)}s`);
    }
  }
  await Promise.all([worker(),worker()]);
}finally{rig.dispose();}

const html=`<!doctype html><meta charset="utf-8"><title>170529 接触复核 V4</title><style>body{background:#101720;color:#dfebf5;font:16px system-ui;margin:24px}button,input{font:inherit;margin:4px;padding:8px}img{width:100%;height:auto}main{max-width:1920px;margin:auto}input[type=range]{width:65%}.legend{color:#ffc36b}a{color:#45e9ad}</style><main><h1>170529 · 逐指 / 掌面接触复核 V4</h1><p>全部221组采样，0–110秒，每0.5秒一组。右手黑/灰手套；左右眼与相邻采样交叉核对。App当前版本未改。</p><p class="legend">绿色 C＝视觉推测接触；灰色 N＝判断未接触；黄色点 U＝被遮挡或证据不足。U不是零压力。模型上的区域是示意位置，不是实测压力或毫米级接触边界。</p><p>每指三个显示区域：远端指腹 / 中段指腹 / 近端。手掌：大鱼际、小鱼际、掌心、两侧指根、两侧掌根。拇指的三个显示区不代表三节指骨。</p><button id="prev">上一张</button><button id="next">下一张</button><input id="seek" type="range" min="0" max="220" value="150" step="1"><b id="stamp"></b><div><button data-frame="150">75秒：食指 / 小指抬起</button><button data-frame="159">79.5秒：全指压平</button><button data-frame="166">83秒：掌面接触</button><button data-frame="97">48.5秒：明确松手</button><a href="comparison-v3-v4.mp4">播放完整采样对照视频</a> · <a href="annotations.csv">逐区标注表</a> · <a href="digit-contact-v4.json">完整JSON</a></div><img id="review" alt="左右眼和V3/V4对照"><script>const seek=document.getElementById('seek'),img=document.getElementById('review'),stamp=document.getElementById('stamp');function update(n){seek.value=Math.max(0,Math.min(220,n));const i=Number(seek.value);img.src='review-'+String(i).padStart(3,'0')+'.jpg';stamp.textContent=(i/2).toFixed(1)+' 秒 · '+(i+1)+'/221';}seek.oninput=()=>update(seek.value);document.getElementById('prev').onclick=()=>update(Number(seek.value)-1);document.getElementById('next').onclick=()=>update(Number(seek.value)+1);document.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>update(b.dataset.frame));document.addEventListener('keydown',e=>{if(e.target===seek)return;if(e.key==='ArrowRight')update(Number(seek.value)+1);if(e.key==='ArrowLeft')update(Number(seek.value)-1);});update(150);</script></main>`;
writeFileSync(join(outputDir,'review.html'),html);
console.log('[RUNNING] Encoding full sampled V3 / V4 review video (2 reviewed images per second)');
await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','2','-i',join(outputDir,'review-%03d.jpg'),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',join(outputDir,'comparison-v3-v4.mp4')],{maxBuffer:2e6});
console.log('\x1b[32m[COMPLETE] All 221 samples + V3/V4 comparison video + per-pad JSON. App unchanged.\x1b[0m');
