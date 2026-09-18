import {toTaxels} from './digit-contact-audit.mjs';
import {contactOpacity} from './digit-display-smoothing.mjs';

// Adapt the reviewed categories to the app's existing 23x20 WebHand input.
// This is display intensity, not a newly estimated force measurement.
export function appPressureData(a,b,time) {
  const left=toTaxels(a),right=toTaxels(b);
  return Uint8Array.from(left.data.map((value,i)=>{
    const state=(map,j)=>map.unknown_mask[j]?'u':map.data[j]?'c':'n';
    return Math.round(120*contactOpacity(state(left,i),state(right,i),time,a.time_ns,b.time_ns));
  }));
}
