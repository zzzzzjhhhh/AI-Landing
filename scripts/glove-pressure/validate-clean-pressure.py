"""Verify clean contact points preserve source geometry/colors and shared model."""
import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from rerun.experimental import RrdReader

p=argparse.ArgumentParser()
p.add_argument('--episodes-root',type=Path,required=True)
p.add_argument('--report',type=Path,required=True)
a=p.parse_args()
entity='/demo/glove_pressure/right'

def read_points(path):
    frames={}
    clears=[]
    for chunk in RrdReader(path).store().stream().to_chunks():
        assert not str(chunk.entity_path).startswith(entity+'/mesh')
        if str(chunk.entity_path)!=entity+'/pressure':continue
        batch=chunk.to_record_batch()
        times=batch['tracking_time'].cast('int64').to_pylist()
        if 'Clear:is_recursive' in batch.schema.names:clears.extend(times)
        if 'Points3D:positions' in batch.schema.names:
            for t,points,colors in zip(times,batch['Points3D:positions'].to_pylist(),batch['Points3D:colors'].to_pylist()):
                frames[t]={tuple(p):c for p,c in zip(points,colors)}
    return frames,clears

root=a.episodes_root/'20260911_170529'
old,_=read_points(root/'visual-pressure-v4-glove-natural-v2.rrd')
clean,clears=read_points(root/'visual-pressure-v4-glove-clean.rrd')
clock=[json.loads(line)['tracking_time_ns'] for line in (root/'right-hand-pressure-samples.jsonl').read_text().splitlines()]
assert sorted(clears)==clock
assert set(clean).issubset(old)
for t in clock:
    for pos,color in clean.get(t,{}).items():
        assert pos in old[t], 'Contact point moved'
        assert color&255==255, 'Non-opaque alpha causes a dark border in Rerun'
    if all(c&255==100 for c in old[t].values()):assert not clean.get(t)
models={}
with tempfile.TemporaryDirectory(prefix='pressure-model-check-') as temporary:
    for episode in ['20260911_165650','20260911_155825','20260911_170529']:
        d=a.episodes_root/episode
        meta=json.loads((d/'right-hand-pressure.json').read_text())
        source=d/'right-hand-pressure.rrd'
        if meta.get('data_parts'):
            source=Path(temporary)/(episode+'.rrd')
            with source.open('wb') as output:
                for part in meta['data_parts']:
                    with (d/Path(part['path']).name).open('rb') as stream:shutil.copyfileobj(stream,output)
        model={}
        for chunk in RrdReader(source).store().stream().to_chunks():
            if chunk.is_static and str(chunk.entity_path).startswith(entity+'/mesh/'):
                batch=chunk.to_record_batch()
                for name in batch.schema.names:
                    if name.startswith('Mesh3D:'):
                        model[str(chunk.entity_path)+'/'+name]=batch[name][0].as_py()
        assert model
        models[episode]=model
assert models['20260911_170529']==models['20260911_165650']==models['20260911_155825']
scale=json.loads(Path(__file__).with_name('clean-display-scale.json').read_text())
legend=[]
for chunk in RrdReader(root/'visual-pressure-v4-glove-clean.rrd').store().stream().to_chunks():
    if str(chunk.entity_path)==entity+'/legend':legend=chunk.to_record_batch()['Points3D:labels'][0].as_py()
assert legend==scale['labels']
report={'clock_frames':len(clock),'cleared_at_every_frame':True,'active_frames':len(clean),'inactive_frames_without_point_geometry':len(clock)-len(clean),'contact_positions_unchanged':True,'shared_legend_verified':True,'active_alpha_always_255_no_dark_border':True,'shared_model_geometry_normals_topology_material_identical':True,'model_episodes':list(models),'model_sha256':hashlib.sha256(json.dumps(models['20260911_170529'],sort_keys=True).encode()).hexdigest()}
a.report.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
