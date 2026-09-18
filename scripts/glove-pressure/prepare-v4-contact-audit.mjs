import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),[source,out]=process.argv.slice(2);
const rows=readFileSync(source,'utf8').trim().split('\n').map(JSON.parse);
mkdirSync(out,{recursive:true});
const font='/System/Library/Fonts/Supplemental/Arial.ttf';
// Context views retain the whole scene. The enlargement is auxiliary and
// must never be used to classify an off-crop hand as absent.
const high=t=>(t>=4.5&&t<=13)||(t>=28&&t<=32.5)||(t>=44.5&&t<=57)||(t>=71&&t<=76)||(t>=87&&t<=94);
for(let start=0;start<rows.length;start+=3){
 const args=[];
 for(let i=start;i<Math.min(start+3,rows.length);i++){
  const r=rows[i],t=r.requested_time_s,y=high(t)?80:360;
  args.push('(',
   '(',r.left_image,'-resize','480x360','-background','#151b22','-gravity','center','-extent','480x480',')',
   '(',r.right_image,'-resize','480x360','-background','#151b22','-gravity','center','-extent','480x480',')',
   '(',r.right_image,'-gravity','NorthWest','-crop',`600x600+580+${y}`,'+repage','-resize','480x480','-extent','480x480',')',
   '+append','-font',font,'-pointsize','24','-fill','white','-background','#151b22','-gravity','NorthWest','-splice','0x38','-annotate','+8+4',`${t.toFixed(1)}s | stereo L / R / R enlargement | source frame ${r.right_source_frame_index}`,')');
 }
 args.push('-append',join(out,`audit-${String(Math.floor(start/3)).padStart(3,'0')}.jpg`));
 await run('magick',args);
 if(start%30===0)console.log(`[RUNNING] evidence sheets ${start}/${rows.length}`);
}
writeFileSync(join(out,'input-samples.json'),JSON.stringify(rows.map(r=>({time:r.requested_time_s,left_image:r.left_image,right_image:r.right_image,source_time_ns:r.time_ns})),null,2));
console.log('[COMPLETE] 74 chronological stereo audit sheets');
