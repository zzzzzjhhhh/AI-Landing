import {surfaceState} from './digit-contact-audit.mjs';
import {regions,createPressureProcessor} from './processor.mjs';
import {contactOpacity} from './digit-display-smoothing.mjs';

export const BASE_COLOR=[78,94,112,255];
const N=64;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};

/** A union of touching zones, not a Gaussian mound centered on every joint.
 * Distance is measured only from the outside of that union. Adjacent c/c
 * regions therefore have no artificial seam or separate intensity peak.
 */
export function contactField(sample,region) {
  const distance=new Float32Array(N*N);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) {
    const state=surfaceState(sample,region,(x+.5)/N,(y+.5)/N).state;
    distance[y*N+x]=state==='c'?Math.min(x+1,y+1,N-x,N-y):0;
  }
  const relax=(x,y,dx,dy,cost)=>{
    const a=x+dx,b=y+dy;
    if(a>=0&&a<N&&b>=0&&b<N)distance[y*N+x]=Math.min(distance[y*N+x],distance[b*N+a]+cost);
  };
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    relax(x,y,-1,0,1);relax(x,y,0,-1,1);relax(x,y,-1,-1,Math.SQRT2);relax(x,y,1,-1,Math.SQRT2);
  }
  for(let y=N-1;y>=0;y--) for(let x=N-1;x>=0;x--){
    relax(x,y,1,0,1);relax(x,y,0,1,1);relax(x,y,1,1,Math.SQRT2);relax(x,y,-1,1,Math.SQRT2);
  }
  return {sample,region,values:Float32Array.from(distance,d=>ease(Math.max(0,d-.5)/(N*.10)))};
}

export function sampleField(field,u,v) {
  if(u<0||u>1||v<0||v>1) return 0;
  // Do not blur into a known released or uncertain neighbor.
  if(surfaceState(field.sample,field.region,u,v).state!=='c')return 0;
  const x=clamp(u)* (N-1),y=clamp(v)*(N-1),x0=Math.floor(x),y0=Math.floor(y);
  const x1=Math.min(N-1,x0+1),y1=Math.min(N-1,y0+1),fx=x-x0,fy=y-y0;
  return (field.values[y0*N+x0]*(1-fx)+field.values[y0*N+x1]*fx)*(1-fy)
    +(field.values[y1*N+x0]*(1-fx)+field.values[y1*N+x1]*fx)*fy;
}

// Invert the existing WebHand ROI transform. Used for color lookup only;
// this never moves a vertex to the ROI plane or displaces it by pressure.
export function surfaceAddress(position,normal) {
  if(normal[2]<=0)return null; // palmar surface, never color the back of the hand
  let best=null;
  for(const r of regions){
    const rx=r.rotation[0]*Math.PI/180,ry=r.rotation[1]*Math.PI/180;
    const [x,y,z]=position.map((p,i)=>p-r.position[i]);
    const localY=Math.cos(rx)*y+Math.sin(rx)*z;
    const rotatedZ=-Math.sin(rx)*y+Math.cos(rx)*z;
    const localX=Math.cos(ry)*x-Math.sin(ry)*rotatedZ;
    const localZ=Math.sin(ry)*x+Math.cos(ry)*rotatedZ;
    const u=localX/r.size[0]+.5,v=.5-localZ/r.size[1];
    if(u<0||u>1||v<0||v>1)continue;
    if(!best||Math.abs(localY)<best.distance)best={region:r.name,u,v,distance:Math.abs(localY)};
  }
  return best;
}

export async function createSurfaceContactRenderer(meshes) {
  // Reuse the original library's palette, not a newly invented color ramp.
  const processor=await createPressureProcessor(),palette=[BASE_COLOR];
  for(let value=1;value<=189;value++){
    const result=processor(new Uint8Array(460).fill(value),{min:0,max:189,height:0,stride:20,threshold:0});
    palette.push(result.colors[0]??BASE_COLOR);
  }
  const addresses=meshes.map(m=>Array.from({length:m.positions.length/3},(_,i)=>
    surfaceAddress(m.positions.slice(i*3,i*3+3),m.normals.slice(i*3,i*3+3))));
  const cache=new WeakMap();
  const fields=s=>{
    if(!cache.has(s))cache.set(s,Object.fromEntries(regions.map(r=>[r.name,contactField(s,r.name)])));
    return cache.get(s);
  };
  return (a,b,time)=>{
    const left=fields(a),right=fields(b),span=b.time_ns-a.time_ns;
    const blend=span>0?ease((time-a.time_ns)/span):0;
    return addresses.map(part=>part.map(address=>{
      if(!address)return BASE_COLOR.slice();
      const {region,u,v}=address;
      const sa=surfaceState(a,region,u,v).state,sb=surfaceState(b,region,u,v).state;
      const va=sampleField(left[region],u,v),vb=sampleField(right[region],u,v);
      let strength;
      if(sa==='c'&&sb==='c')strength=va+(vb-va)*blend;
      else strength=(sa==='c'?va:vb)*contactOpacity(sa,sb,time,a.time_ns,b.time_ns);
      const color=palette[Math.round(clamp(strength)*189)];
      const opacity=ease(strength/.22);
      return [...BASE_COLOR.slice(0,3).map((base,i)=>Math.round(base+(color[i]-base)*opacity)),255];
    }));
  };
}
