/** The Gaussian taxel kernel used by the original 165650 visual map.
 * Kept shared so adapters change data, not the rendering method.
 */
export function paintPressureRegion(data,region,{centerU,centerV,widthU,widthV,amplitude}) {
  let maximum=0;
  for(let row=0;row<region.height;row++) for(let col=0;col<region.width;col++) {
    const u=(col+.5)/region.width,v=(row+.5)/region.height;
    const distance=((u-centerU)/widthU)**2+((v-centerV)/widthV)**2;
    const value=Math.round(255*amplitude*Math.exp(-distance));
    const at=(row+region.y)*20+col+region.x;
    data[at]=Math.max(data[at],value);
    maximum=Math.max(maximum,value);
  }
  return maximum;
}
