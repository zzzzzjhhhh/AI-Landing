import {loadRightHandRig} from './right-hand-rig.mjs';
import {readFileSync} from 'node:fs';
import {regions,createPressureProcessor} from './processor.mjs';
import {surfaceAddress} from './surface-contact-field.mjs';
import {createNaturalContactFilter,anatomicalAddress,surfaceNeighbors,diffuseSupportedContact} from './natural-contact-color.mjs';

export const GLOVE_PITCH=.065;
export const SURFACE_OFFSET=.012;
const BASE=[78,94,112],BASE_ALPHA=100;
const sharedScale=JSON.parse(readFileSync(new URL('./clean-display-scale.json',import.meta.url),'utf8'));
export const CLEAN_DISPLAY_SCALE=Object.freeze({displayMax:sharedScale.max_raw,colorGain:sharedScale.color_gain});

/** ONE hexagonal grid across the entire hand silhouette. Regions are never
 * used to generate, clip or restart the lattice. Ray intersections only
 * retain real front-facing hand surface above the rig's wrist landmark.
 */
export function gloveSurfaceSamples(meshes,wristY,pitch=GLOVE_PITCH){
  const triangles=[];
  let minX=Infinity,maxX=-Infinity,maxY=-Infinity;
  meshes.forEach((mesh,part)=>{
    for(let t=0;t<mesh.indices.length;t+=3){
      const ids=mesh.indices.slice(t,t+3);
      const p=ids.map(i=>mesh.positions.slice(i*3,i*3+3));
      const denominator=(p[1][1]-p[2][1])*(p[0][0]-p[2][0])+(p[2][0]-p[1][0])*(p[0][1]-p[2][1]);
      if(Math.abs(denominator)<1e-10)continue;
      const x0=Math.min(...p.map(q=>q[0])),x1=Math.max(...p.map(q=>q[0]));
      const y0=Math.min(...p.map(q=>q[1])),y1=Math.max(...p.map(q=>q[1]));
      minX=Math.min(minX,x0);maxX=Math.max(maxX,x1);maxY=Math.max(maxY,y1);
      triangles.push({part,ids,p,denominator,x0,x1,y0,y1});
    }
  });
  const samples=[],dy=pitch*Math.sqrt(3)/2;
  for(let row=0,y=wristY+dy/2;y<maxY;row++,y=wristY+dy/2+row*dy){
    for(let x=minX+pitch/2+(row%2)*pitch/2;x<maxX;x+=pitch){
      let hit=null;
      for(const tri of triangles){
        if(x<tri.x0||x>tri.x1||y<tri.y0||y>tri.y1)continue;
        const [a,b,c]=tri.p;
        const w0=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/tri.denominator;
        const w1=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/tri.denominator;
        const weights=[w0,w1,1-w0-w1];
        if(weights.some(w=>w < -1e-8))continue;
        const z=weights.reduce((s,w,i)=>s+w*tri.p[i][2],0);
        if(!hit||z>hit.position[2]){
          const normal=[0,1,2].map(axis=>weights.reduce((s,w,i)=>s+w*meshes[tri.part].normals[tri.ids[i]*3+axis],0));
          const len=Math.hypot(...normal);
          hit={position:[x,y,z],normal:normal.map(v=>v/len),part:tri.part,ids:tri.ids,weights};
        }
      }
      if(hit&&hit.normal[2]>.12)samples.push(hit);
    }
  }
  return samples;
}

function taxelAt(data,address){
  if(!address)return 0;
  const r=regions.find(r=>r.name===address.region);
  const x=Math.max(0,Math.min(r.width-1,address.u*r.width-.5));
  const y=Math.max(0,Math.min(r.height-1,address.v*r.height-.5));
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(r.width-1,x0+1),y1=Math.min(r.height-1,y0+1);
  const fx=x-x0,fy=y-y0,at=(u,v)=>data[(r.y+v)*20+r.x+u];
  return (at(x0,y0)*(1-fx)+at(x1,y0)*fx)*(1-fy)+(at(x0,y1)*(1-fx)+at(x1,y1)*fx)*fy;
}

export async function createContinuousGloveDisplay({naturalContact=false,supportedDiffusion=false,completeCoverage=naturalContact||supportedDiffusion,hideInactive=false,colorGain=1,displayMax=189}={}){
  if(!Number.isFinite(displayMax)||displayMax<=0||displayMax>255)throw Error('Invalid display maximum');
  if(!Number.isFinite(colorGain)||colorGain<=0)throw Error('colorGain must be finite and positive');
  if(naturalContact&&supportedDiffusion)throw Error('Choose semantic contact barriers OR source-matrix support barriers');
  const rig=await loadRightHandRig();
  let samples,meshes;
  try{meshes=rig.sample().map((m,i)=>({...m,...rig.topology[i]}));samples=gloveSurfaceSamples(meshes,rig.wristPosition[1]);}
  finally{rig.dispose();}
  const positions=samples.map(s=>[s.position[0],s.position[1],s.position[2]+SURFACE_OFFSET]);
  // EVERY point needs a source address, including palm-to-finger transitions.
  // Previously, 380 points outside the six rectangles started at zero and
  // depended on a few diffusion passes; some could never show contact.
  // Use the SAME full-surface assignment as the n/u guard, so lookup and
  // permission cannot disagree about which anatomical site owns a point.
  const addresses=samples.map(s=>completeCoverage?anatomicalAddress(s):surfaceAddress(s.position,s.normal));
  const filter=naturalContact?createNaturalContactFilter(samples,meshes):null;
  // Older episodes have taxel matrices, not V4 semantic labels. Keep their
  // existing support mask; never fabricate c/n/u labels or diffuse into zeros.
  const graph=supportedDiffusion?surfaceNeighbors(samples,meshes):null;
  const processor=await createPressureProcessor(),palette=[BASE];
  for(let v=1;v<=255;v++){
    const visual=processor(new Uint8Array(460).fill(v),{min:0,max:displayMax,height:0,stride:20,threshold:0});
    palette.push(visual.colors[0]?.slice(0,3)??BASE);
  }
  return (data,context)=>{
    const rawValues=addresses.map(address=>taxelAt(data,address));
    const values=filter?filter(rawValues,context):graph?diffuseSupportedContact(rawValues,graph):rawValues;
    const colors=Array.from(values,value=>{
      const colorValue=value*colorGain;
      const color=palette[Math.max(0,Math.min(255,Math.round(Math.min(displayMax,colorValue))))];
      const t=Math.max(0,Math.min(1,colorValue/24)),blend=t*t*(3-2*t);
      // Visibility stays tied to unamplified data, not the color preference.
      const sourceT=Math.max(0,Math.min(1,value/24)),sourceBlend=sourceT*sourceT*(3-2*sourceT);
      const baseAlpha=hideInactive?0:BASE_ALPHA;
      return [...BASE.map((base,i)=>Math.round(base+(color[i]-base)*blend)),Math.round(baseAlpha+(255-baseAlpha)*sourceBlend)];
    });
    const levels=Object.fromEntries(regions.map(r=>{
      let peak=0;
      for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)peak=Math.max(peak,data[(r.y+y)*20+r.x+x]);
      return [r.name,Math.round(peak/255*1000)/10];
    }));
    // Rerun's default point pass uses alpha as brightness, NOT transparency.
    // Drop inactive geometry and keep active points opaque. RGB already eases
    // into the hand's base color, so low contact must not be darkened twice.
    const visible=hideInactive?colors.flatMap((c,i)=>c[3]>0?[i]:[]):null;
    return {positions:visible?visible.map(i=>positions[i]):positions,colors:visible?visible.map(i=>[...colors[i].slice(0,3),255]):colors,levels,peak_relative_0_100:Math.round(Math.max(...data)/255*1000)/10};
  };
}
