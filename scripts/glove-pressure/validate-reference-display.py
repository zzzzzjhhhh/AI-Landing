"""Golden-file check against the actual 165650 Pressure asset used by the App."""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
from rerun.experimental import RrdReader

p=argparse.ArgumentParser()
p.add_argument('--reference-rrd',type=Path,required=True)
p.add_argument('--first',type=Path,required=True)
p.add_argument('--second',type=Path,required=True)
p.add_argument('--new-rrd',type=Path,required=True)
p.add_argument('--report',type=Path,required=True)
a=p.parse_args()
entity='/demo/glove_pressure/right'
reference={}
for chunk in RrdReader(a.reference_rrd).store().stream().to_chunks():
 if str(chunk.entity_path)!=entity+'/pressure':continue
 batch=chunk.to_record_batch()
 if 'Points3D:positions' not in batch.schema.names:continue
 for t,points,colors in zip(batch['tracking_time'].cast('int64').to_pylist(),batch['Points3D:positions'].to_pylist(),batch['Points3D:colors'].to_pylist()):
  reference[t]=(points,colors)
process=subprocess.Popen(['node',str(Path(__file__).with_name('reference-display-golden.mjs')),str(a.first),str(a.second)],stdout=subprocess.PIPE,text=True)
count=active=0
try:
 for line in process.stdout:
  row=json.loads(line)
  expected_points,expected_colors=reference.get(row['time_ns'],([],[]))
  assert np.array_equal(np.asarray(row['positions'],dtype=np.float32).reshape(-1,3),np.asarray(expected_points,dtype=np.float32).reshape(-1,3)),f"Position mismatch at {row['time_ns']}"
  packed=[(r<<24)|(g<<16)|(b<<8)|alpha for r,g,b,alpha in row['colors']]
  assert packed==expected_colors,f"Palette mismatch at {row['time_ns']}"
  count+=1
  active+=bool(packed)
 assert process.wait()==0 and count==86 and active>0
finally:
 if process.poll() is None:process.kill();process.wait()
clears=[]
for chunk in RrdReader(a.new_rrd).store().stream().to_chunks():
 path=str(chunk.entity_path)
 assert not path.startswith(entity+'/mesh'), 'New display must not replace the base model or material'
 assert path!=entity+'/legend', 'Preserve the original App legend'
 if path==entity+'/pressure':
  batch=chunk.to_record_batch()
  if 'Clear:is_recursive' in batch.schema.names:clears.extend(batch['tracking_time'].cast('int64').to_pylist())
assert len(set(clears))==2920
report={'reference':'actual 165650 visual-pressure-override.rrd','anchors_checked':count,'active_anchors':active,'positions_float32_exact_match':True,'colors_exact_match':True,'170529_mesh_and_legend_overrides':0,'170529_source_clock_clears':len(clears)}
a.report.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
