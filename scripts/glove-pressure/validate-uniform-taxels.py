"""Verify delivered uniform lattice positions stay identical across the video."""
import argparse
import json
from pathlib import Path
import numpy as np
from rerun.experimental import RrdReader

p=argparse.ArgumentParser()
p.add_argument('--episode-dir',type=Path,required=True)
p.add_argument('--report',type=Path,required=True)
a=p.parse_args()
root=a.episode_dir
clock=[json.loads(line)['tracking_time_ns'] for line in (root/'right-hand-pressure-samples.jsonl').read_text().splitlines()]
entity='/demo/glove_pressure/right'
fixed=None
times=[]
color_patterns=set()
for chunk in RrdReader(root/'visual-pressure-v4-uniform.rrd').store().stream().to_chunks():
 path=str(chunk.entity_path)
 assert not path.startswith(entity+'/mesh') and path!=entity+'/legend'
 if path!=entity+'/pressure':continue
 batch=chunk.to_record_batch()
 if 'Points3D:positions' not in batch.schema.names:continue
 for time,points,colors in zip(batch['tracking_time'].cast('int64').to_pylist(),batch['Points3D:positions'].to_pylist(),batch['Points3D:colors'].to_pylist()):
  vertices=np.asarray(points,dtype=np.float32)
  if fixed is None:fixed=vertices
  assert np.array_equal(fixed,vertices),'Taxel positions moved with pressure'
  assert len(colors)==len(fixed)
  times.append(time)
  color_patterns.add(tuple(colors))
assert sorted(times)==clock and len(color_patterns)>1
report={'source_clock_frames':len(times),'fixed_taxel_count':len(fixed),'positions_identical_at_all_frames':True,'distinct_color_patterns':len(color_patterns),'mesh_material_and_legend_unchanged':True}
a.report.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
