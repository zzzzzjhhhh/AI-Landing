import {regions} from './processor.mjs';
import {surfaceAddress} from './surface-contact-field.mjs';
import {surfaceState} from './digit-contact-audit.mjs';

const clamp=x=>Math.max(0,Math.min(1,x));

// Nearest anatomical atlas address outside its old rectangle. It is used only
// to protect n/u semantics, never to crop the displayed point cloud.
export function anatomicalAddress(sample){
  const direct=surfaceAddress(sample.position,sample.normal);
  if(direct)return direct;
  let best=null;
  for(const r of regions){
    const rx=r.rotation[0]*Math.PI/180,ry=r.rotation[1]*Math.PI/180;
    const [x,y,z]=sample.position.map((v,i)=>v-r.position[i]);
    const ryLocal=Math.cos(rx)*y+Math.sin(rx)*z,rz=-Math.sin(rx)*y+Math.cos(rx)*z;
    const lx=Math.cos(ry)*x-Math.sin(ry)*rz,lz=Math.sin(ry)*x+Math.cos(ry)*rz;
    const u=lx/r.size[0]+.5,v=.5-lz/r.size[1];
    const d=((u-clamp(u))*r.size[0])**2+((v-clamp(v))*r.size[1])**2+.1*ryLocal**2;
    if(!best||d<best.distance)best={region:r.name,u:clamp(u),v:clamp(v),distance:d};
  }
  return best;
}

function trianglesOf(meshes){
  return meshes.flatMap(mesh=>Array.from({length:mesh.indices.length/3},(_,t)=>{
    const p=mesh.indices.slice(t*3,t*3+3).map(i=>mesh.positions.slice(i*3,i*3+3));
    const [a,b,c]=p,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    return {p,den,x0:Math.min(...p.map(v=>v[0])),x1:Math.max(...p.map(v=>v[0])),y0:Math.min(...p.map(v=>v[1])),y1:Math.max(...p.map(v=>v[1]))};
  }).filter(t=>Math.abs(t.den)>1e-10));
}
function frontHeight(triangles,x,y){
  let height=-Infinity;
  for(const {p,den,x0,x1,y0,y1} of triangles){
    if(x<x0||x>x1||y<y0||y>y1)continue;
    const [a,b,c]=p,w0=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den;
    const w1=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w2=1-w0-w1;
    if(Math.min(w0,w1,w2)>=-1e-8)height=Math.max(height,w0*a[2]+w1*b[2]+w2*c[2]);
  }
  return height;
}

export function surfaceNeighbors(samples,meshes,pitch=.065){
  const graph=samples.map(()=>[]),triangles=trianglesOf(meshes);
  for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
    const a=samples[i],b=samples[j],delta=a.position.map((v,k)=>v-b.position[k]);
    if(Math.hypot(delta[0],delta[1])>pitch*1.05||Math.hypot(...delta)>pitch*1.8)continue;
    if(a.normal.reduce((s,v,k)=>s+v*b.normal[k],0)<.5)continue;
    // Reject even small finger gaps: the edge must stay on a real surface.
    if(![.25,.5,.75].every(t=>{
      const p=a.position.map((v,k)=>v+(b.position[k]-v)*t);
      return Math.abs(frontHeight(triangles,p[0],p[1])-p[2])<pitch;
    }))continue;
    graph[i].push(j);graph[j].push(i);
  }
  return graph;
}

export function diffuseContact(values,allowed,graph,passes=5){
  let current=Float64Array.from(values,(v,i)=>allowed[i]?v:0);
  for(let pass=0;pass<passes;pass++){
    current=Float64Array.from(current,(value,i)=>{
      if(!allowed[i])return 0;
      // Zero-valued forbidden neighbors softly drain the edge, rather than
      // making a hard bright boundary; they never receive contact themselves.
      let sum=2*value;
      for(const j of graph[i])sum+=current[j];
      return sum/(2+graph[i].length);
    });
  }
  // Fade inward before an anatomical n/u barrier, so preserving a label
  // does not reintroduce a bright straight-cut edge at a segment boundary.
  const distance=allowed.map(ok=>ok?Infinity:0),queue=[];
  distance.forEach((d,i)=>{if(d===0)queue.push(i);});
  for(let at=0;at<queue.length;at++){
    const i=queue[at];
    if(distance[i]>=3)continue;
    for(const j of graph[i])if(distance[j]>distance[i]+1){distance[j]=distance[i]+1;queue.push(j);}
  }
  return Float64Array.from(current,(value,i)=>{
    const t=clamp((distance[i]-.5)/2);
    return value*t*t*(3-2*t);
  });
}

export function createNaturalContactFilter(samples,meshes){
  const graph=surfaceNeighbors(samples,meshes),addresses=samples.map(anatomicalAddress);
  return (values,context)=>{
    if(!context)throw Error('Natural contact colors require audit context');
    const {a,b,time_ns}=context;
    const allowed=addresses.map(address=>{
      const state=s=>surfaceState(s,address.region,address.u,address.v).state;
      if(time_ns>=b.time_ns)return b.state==='contact'&&state(b)==='c';
      if(a.state!=='contact')return false;
      // Match the existing contact-only interpolation between audit anchors.
      return state(a)==='c'||(time_ns>a.time_ns&&b.state==='contact'&&state(b)==='c');
    });
    return diffuseContact(values,allowed,graph);
  };
}
