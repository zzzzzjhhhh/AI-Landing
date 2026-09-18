import {regions} from './processor.mjs';
import {surfaceState,palmZones} from './digit-contact-audit.mjs';
import {paintPressureRegion} from './pressure-region-kernel.mjs';

// Adapt categories to the existing reference input. A connected contact span
// makes ONE lobe, not an independent peak at each anatomical joint.
export function digitReferenceTaxels(sample){
  const data=new Uint8Array(460);
  for(const region of regions){
    const shapes=[];
    if(region.name==='palm'){
      const touching=palmZones.filter(p=>sample.palm[p.name]==='c');
      if(touching.length)shapes.push({
        centerU:touching.reduce((s,p)=>s+p.u,0)/touching.length,
        centerV:touching.reduce((s,p)=>s+p.v,0)/touching.length,
        widthU:.34,widthV:.32,
      });
    }else{
      const segments=[['proximal',0,.35],['middle',.35,.7],['distal',.7,1]];
      for(let i=0;i<segments.length;i++){
        if(sample.digits[region.name][segments[i][0]]!=='c')continue;
        const begin=segments[i][1];
        while(i+1<segments.length&&sample.digits[region.name][segments[i+1][0]]==='c')i++;
        const end=segments[i][2];
        shapes.push({centerU:.5,centerV:(begin+end)/2,widthU:.38,widthV:Math.max(.20,(end-begin)*.48)});
      }
    }
    // Display gain only; the categorical audit contains no measured force.
    for(const shape of shapes)paintPressureRegion(data,region,{...shape,amplitude:2/3});
    // Preserve explicit n/u subregions; do not invent contacts while adapting.
    for(let y=0;y<region.height;y++)for(let x=0;x<region.width;x++){
      if(surfaceState(sample,region.name,(x+.5)/region.width,(y+.5)/region.height).state!=='c')
        data[(region.y+y)*20+region.x+x]=0;
    }
  }
  return data;
}
