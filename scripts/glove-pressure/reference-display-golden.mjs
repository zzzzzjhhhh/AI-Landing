// Re-render original 165650 anchor taxels for comparison with the shipped RRD.
import {readFileSync} from 'node:fs';
import {once} from 'node:events';
import {createReferencePressureDisplay} from './reference-pressure-display.mjs';
const render=await createReferencePressureDisplay();
for(const path of process.argv.slice(2))for(const line of readFileSync(path,'utf8').trim().split('\n')){
 const sample=JSON.parse(line);
 const data=Uint8Array.from(['supporting','touching'].includes(sample.contact_state)?sample.data:sample.data.map(()=>0));
 if(!process.stdout.write(JSON.stringify({time_ns:sample.time_ns,...render(data)})+'\n'))await once(process.stdout,'drain');
}
