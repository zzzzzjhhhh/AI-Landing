import {surfaceState} from './digit-contact-audit.mjs';
import {regions} from './processor.mjs';
import {contactOpacity} from './digit-display-smoothing.mjs';

// Adapt the reviewed categories to the app's existing 23x20 WebHand input.
// This is display intensity, not a newly estimated force measurement.
export function appPressureData(a,b,time) {
  const data=new Uint8Array(460);
  for(const r of regions) for(let y=0;y<r.height;y++) for(let x=0;x<r.width;x++) {
    const u=(x+.5)/r.width,v=(y+.5)/r.height;
    const left=surfaceState(a,r.name,u,v),right=surfaceState(b,r.name,u,v);
    // Same tapered footprint kernel as the existing contact-patch display.
    // Ownership is still categorical: never light a neighboring n/u zone.
    if(left.distance>=1.15) continue;
    const opacity=contactOpacity(left.state,right.state,time,a.time_ns,b.time_ns);
    data[(r.y+y)*20+r.x+x]=Math.round(189*Math.exp(-1.6*left.distance)*opacity);
  }
  return data;
}
