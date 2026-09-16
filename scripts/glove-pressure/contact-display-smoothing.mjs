// Display interpolation only: no new contact classifications or measured force.
export function interpolateContact(a,b,timeNs){
 const span=b.time_ns-a.time_ns;
 const t=span>0?Math.max(0,Math.min(1,(timeNs-a.time_ns)/span)):0;
 if(t===1)return b.data.slice();
 if(a.state!=='contact')return a.data.map(()=>0);
 if(b.state==='contact'){
  const w=t*t*(3-2*t);
  return a.data.map((v,i)=>Math.round(v+(b.data[i]-v)*w));
 }
 // Fade only BEFORE a known release; never carry pressure beyond it.
 const remaining=b.time_ns-timeNs;
 const x=span>0?Math.max(0,Math.min(1,remaining/120e6)):1;
 const w=x*x*(3-2*x);
 return a.data.map(v=>Math.round(v*w));
}
