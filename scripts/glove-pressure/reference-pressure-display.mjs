import {createPressureProcessor,regions} from './processor.mjs';

// Extracted unchanged from export-visual-pressure-override.mjs (165650).
export const REFERENCE_DISPLAY=Object.freeze({min:0,max:189,height:.7,stride:2});
export async function createReferencePressureDisplay(){
  const processor=await createPressureProcessor();
  return data=>{
    const rendered=processor(data,REFERENCE_DISPLAY);
    const levels=Object.fromEntries(regions.map(region=>{
      let peak=0;
      for(let row=0;row<region.height;row++) for(let col=0;col<region.width;col++)
        peak=Math.max(peak,data[(row+region.y)*20+col+region.x]);
      return [region.name,Math.round(peak/255*1000)/10];
    }));
    return {...rendered,levels,peak_relative_0_100:Math.round(Math.max(...data)/255*1000)/10};
  };
}
