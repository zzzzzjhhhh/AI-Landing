import {surfaceState} from './digit-contact-audit.mjs';
import {regions} from './processor.mjs';

const ease = x => { x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); };
// Display-only 120ms transitions. Unknown is never a contact endpoint.
// All audited timestamps retain their exact categorical state.
export function contactOpacity(a, b, time, start, end) {
  if (end <= start || time <= start) return Number(a === 'c');
  if (time >= end) return Number(b === 'c');
  if (a === b) return Number(a === 'c');
  const remaining = end-time, window = Math.min(120e6, end-start);
  if (a === 'c') return ease(remaining/window);
  if (a === 'n' && b === 'c') return 1-ease(remaining/window);
  return 0;
}

export function renderContact(a,b,time) {
  const positions=[], colors=[];
  for (const r of regions) for (let y=0;y<25;y++) for(let x=0;x<16;x++) {
    const u=(x+.5)/16,v=(y+.5)/25;
    const s=surfaceState(a,r.name,u,v), next=surfaceState(b,r.name,u,v);
    const opacity=s.distance<1.15 ? contactOpacity(s.state,next.state,time,a.time_ns,b.time_ns) : 0;
    const unknown=s.state==='u' && x%2===0 && y%2===0;
    if(opacity<.01 && !unknown) continue;
    const rx=r.rotation[0]*Math.PI/180, ry=r.rotation[1]*Math.PI/180;
    const lx=(u-.5)*r.size[0],lz=(.5-v)*r.size[1],ly=.08;
    const px=Math.cos(ry)*lx+Math.sin(ry)*lz,pz=-Math.sin(ry)*lx+Math.cos(ry)*lz;
    positions.push([px+r.position[0],Math.cos(rx)*ly-Math.sin(rx)*pz+r.position[1],Math.sin(rx)*ly+Math.cos(rx)*pz+r.position[2]]);
    colors.push(opacity>=.01?[69,233,173,Math.round(242*opacity)]:[255,195,107,204]);
  }
  return {positions,colors};
}
