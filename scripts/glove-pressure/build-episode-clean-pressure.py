"""Align 165650 / 155825 display with 170529 without changing source contacts."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
import numpy as np
import rerun as rr
from rerun.experimental import RrdReader

p=argparse.ArgumentParser()
p.add_argument('--episode-dir',type=Path,required=True)
p.add_argument('--first',type=Path)
p.add_argument('--second',type=Path)
p.add_argument('--report',type=Path,required=True)
a=p.parse_args()
root=a.episode_dir
episode=json.loads((root/'manifest.json').read_text())
original=json.loads((root/'right-hand-pressure.json').read_text())
assert original['recording_id']==episode['recording_id']
assert episode['episode_id'] in ['20260911_165650','20260911_155825']
clock=[json.loads(s)['tracking_time_ns'] for s in (root/'right-hand-pressure-samples.jsonl').read_text().splitlines()]
stem='pressure-continuous-clean'
output=root/(stem+'.rrd')
entity='demo/glove_pressure/right'
command=['node',str(Path(__file__).with_name('export-episode-clean-pressure.mjs')),str(root)]
if a.first or a.second:
 if not(a.first and a.second):p.error('Provide both review halves')
 command.extend([str(a.first),str(a.second)])
recording=rr.RecordingStream(original['application_id'],recording_id=original['recording_id'],send_properties=False)
recording.save(output)
scale=json.loads(Path(__file__).with_name('clean-display-scale.json').read_text())
recording.log(entity+'/legend',rr.Points3D([[x,2.9,.9] for x in (-1.15,-.8,-.45,-.1,.25)],radii=.065,colors=scale['colors'],labels=scale['labels'],show_labels=True),static=True)
description=('Same original hand mesh and 170529 continuous surface lattice, palette, radius and no-black-border rendering. '
 'Two light surface-neighbor averaging passes (self weight 4) confined to positive source support; no second edge feather; no crossing finger gaps; '
 'shared 0/22/44 color scale (no episode-specific gain), with unchanged support and numeric levels; '
 'no added temporal filtering, no changed source contact matrices; visual estimates, NOT measured force.')
recording.log(entity+'/provenance',rr.TextDocument(description),static=True)
process=subprocess.Popen(command,stdout=subprocess.PIPE,text=True)
count=active=0
matrix_hash=hashlib.sha256()
expected={}
try:
 for line in process.stdout:
  row=json.loads(line);t=row['time_ns']
  assert row['frame_index']==count and t==clock[count]
  matrix_hash.update(row['matrix_sha256'].encode())
  recording.set_time('tracking_time',duration=np.timedelta64(t,'ns'))
  recording.set_time('capture_time',timestamp=np.datetime64(original['capture_start_ns']+t,'ns'))
  recording.log(entity+'/pressure',rr.Clear(recursive=False))
  assert row['source_active'] or not row['positions']
  assert all(c[3]==255 for c in row['colors'])
  if row['positions']:
   recording.log(entity+'/pressure',rr.Points3D(np.asarray(row['positions'],dtype=np.float32),colors=np.asarray(row['colors'],dtype=np.uint8),radii=.018))
   active+=1
  expected[t]=len(row['positions'])
  recording.log(entity+'/status',rr.Points3D([[-.45,-2.65,.9]],radii=0,colors=[180,213,222,255],labels=[f"ESTIMATED {row['state']} · {row['peak_relative_0_100']:.0f}/100"],show_labels=True))
  for name,value in row['levels'].items():recording.log(entity+'/relative/'+name,rr.Scalars(value))
  count+=1
  if count%400==0:print(f'[RUNNING] {episode["episode_id"]}: {count}/{len(clock)} source-clock frames',flush=True)
 assert process.wait()==0 and count==len(clock)
finally:
 if process.poll() is None:process.kill();process.wait()
 recording.flush();recording.disconnect()

# Verify actual delivered asset, not just the JSON generation stream.
clears=[];observed={}
for chunk in RrdReader(output).store().stream().to_chunks():
 path=str(chunk.entity_path)
 assert not path.startswith('/'+entity+'/mesh')
 if path=='/'+entity+'/legend':
  assert chunk.to_record_batch()['Points3D:labels'][0].as_py()==scale['labels']
 if path!='/'+entity+'/pressure':continue
 b=chunk.to_record_batch();times=b['tracking_time'].cast('int64').to_pylist()
 assert b['capture_time'].cast('int64').to_pylist()==[original['capture_start_ns']+t for t in times]
 if 'Clear:is_recursive' in b.schema.names:clears.extend(times)
 if 'Points3D:positions' in b.schema.names:
  for t,points,colors in zip(times,b['Points3D:positions'].to_pylist(),b['Points3D:colors'].to_pylist()):
   assert all(c&255==255 for c in colors)
   observed[t]=len(points)
assert sorted(clears)==clock
assert all(observed.get(t,0)==n for t,n in expected.items())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
sources={'source_clock_and_matrices':sha(root/'right-hand-pressure-samples.jsonl')}
if a.first:sources.update(first_review=sha(a.first),second_review=sha(a.second))
meta={'episode_id':episode['episode_id'],'recording_id':original['recording_id'],'measured':False,'display':description,'source_files':sources,'frame_count':count,'active_frames':active,'input_matrix_sequence_sha256':matrix_hash.hexdigest(),'display_parameters':{'pitch':.065,'surface_offset':.012,'radius':.018,'max':189,'color_gain':1.2,'active_alpha':255,'inactive_geometry':'omitted','diffusion_passes':2,'self_weight':4,'guard':'positive source support, no inferred semantic labels'},'data':{'path':f'/rerun/episodes/{episode["episode_id"]}/{stem}.rrd','sha256':sha(output),'bytes':output.stat().st_size},'rollback':'165650: restore visual-pressure-override.json import. 155825: remove pressure_override. Original files retained.'}
meta['display_parameters'].update(max=scale['max_raw'],max_relative=scale['max_relative'],color_gain=scale['color_gain'],legend_labels=scale['labels'])
(root/(stem+'.json')).write_text(json.dumps(meta,indent=2)+'\n')
a.report.parent.mkdir(parents=True,exist_ok=True)
a.report.write_text(json.dumps({**meta,'verification':{'exact_clock':True,'no_mesh_changes':True,'shared_legend_verified':True,'active_alpha_255':True,'no_contact_frames_remain_empty':True,'all_delivered_point_counts_match':True}},indent=2)+'\n')
print(f'\033[32m[COMPLETE] {episode["episode_id"]}: {count} frames, {active} active; RRD verified\033[0m',flush=True)
