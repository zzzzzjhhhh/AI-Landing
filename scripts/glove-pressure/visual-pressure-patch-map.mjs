import { regions } from './processor.mjs';

// Coordinates are local to a palm/finger ROI. v=0 is the finger root;
// v=1 is the tip. Palm u=1 is the thumb side. These are visual footprints,
// not calibrated pressure or a geometrically measured contact boundary.
export function contactPatchesToTaxels(observation) {
  const { patches, state } = observation;
  if (!Array.isArray(patches) || !['contact', 'no_contact', 'uncertain'].includes(state)) throw Error('Invalid contact observation');
  if (state !== 'contact' && patches.length) throw Error('Non-contact/uncertain frames cannot carry pressure patches');
  const data = new Uint8Array(460);
  const levels = Object.fromEntries(regions.map(r => [r.name, null]));
  for (const p of patches) {
    const region = regions.find(r => r.name === p.region);
    if (!region || [p.u,p.v,p.ru,p.rv,p.angle,p.load,p.confidence].some(n => !Number.isFinite(n)) ||
        p.u < 0 || p.u > 1 || p.v < 0 || p.v > 1 || p.ru <= 0 || p.rv <= 0 || p.ru > 1 || p.rv > 1 ||
        p.load <= 0 || p.load > 1 || p.confidence < .5 || p.confidence > 1) throw Error('Invalid contact patch');
    const theta = p.angle * Math.PI / 180, c = Math.cos(theta), s = Math.sin(theta);
    for(let row=0;row<region.height;row++) for(let col=0;col<region.width;col++) {
      const du=(col+.5)/region.width-p.u, dv=(row+.5)/region.height-p.v;
      const x=c*du+s*dv, y=-s*du+c*dv;
      const d=(x/p.ru)**2+(y/p.rv)**2;
      // Finite footprint prevents low Gaussian tails from lighting areas
      // that were never annotated as touching the cloth.
      const value=d>=2.25?0:Math.round(255*p.load*Math.exp(-1.6*d));
      const at=(row+region.y)*20+col+region.x;
      data[at]=Math.max(data[at],value);
    }
  }
  for(const r of regions) {
    let max=0;
    for(let y=r.y;y<r.y+r.height;y++) for(let x=r.x;x<r.x+r.width;x++) max=Math.max(max,data[y*20+x]);
    if(max) levels[r.name]=Math.round(max/255*1000)/10;
  }
  return {data:Array.from(data),levels};
}
