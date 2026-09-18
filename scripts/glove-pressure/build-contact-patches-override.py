"""Reversible 170529 V3 Pressure overlay, source-clock sample hold; no interpolation."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np
import rerun as rr

p=argparse.ArgumentParser()
p.add_argument('--samples',type=Path,required=True)
p.add_argument('--episode-dir',type=Path,required=True)
p.add_argument('--smooth',action='store_true')
p.add_argument('--digit-v4',action='store_true')
a=p.parse_args()
root=a.episode_dir
original=json.loads((root/'right-hand-pressure.json').read_text())
episode=json.loads((root/'manifest.json').read_text())
assert episode['episode_id']=='20260911_170529'
assert original['recording_id']==episode['recording_id']
entity='demo/glove_pressure/right'
stem='visual-pressure-v3-smooth' if a.smooth else 'visual-pressure-v3'
if a.digit_v4: stem='visual-pressure-v4-smooth'
output=root/(stem+'.rrd')
display='Contact-only smoothstep interpolation; 120ms pre-release fade; unknown/released stays empty' if a.smooth else 'source-clock previous-sample hold, no interpolation'
if a.digit_v4: display='Original WebHand heatmap renderer, same as 165650; 22 semantic zones; 120ms contact fade; unknown retained in metadata, not painted as contact'
recording=rr.RecordingStream(original['application_id'],recording_id=original['recording_id'],send_properties=False)
recording.save(output)
recording.log(entity+'/legend',rr.Points3D([[-.45,2.9,.9]],radii=0,colors=[180,213,222,255],labels=['V4 contact estimate | original hand heatmap | NOT force' if a.digit_v4 else 'V3 contact footprint | color is NOT force'],show_labels=True),static=True)
recording.log(entity+'/provenance',rr.TextDocument('V3 visual clothing contact, NOT measured force. 221 samples at 0.5s spacing. Hidden footprint geometry is inferred; unknown is not zero-force evidence. Original data and tracking unchanged. Display: '+display),static=True)
if a.digit_v4:
 recording.log(entity+'/provenance',rr.TextDocument('V4: 221 stereo visual audits; 15 finger zones and 7 palm zones. Original App hand and heatmap, not audit dots. Unpainted areas may be unknown or no-contact; see unknown_sites. Not measured force. '+display),static=True)
process=subprocess.Popen(['node',str(Path(__file__).with_name('export-digit-contact-override.mjs' if a.digit_v4 else 'export-contact-patches-override.mjs')),str(a.samples),str(root/'right-hand-pressure-samples.jsonl')]+(['--smooth'] if a.smooth else []),stdout=subprocess.PIPE,text=True)
count=0
last=-1
try:
 for line in process.stdout:
  row=json.loads(line)
  t=row['time_ns']
  assert row['frame_index']==count and last<t<=original['duration_ns']
  recording.set_time('tracking_time',duration=np.timedelta64(t,'ns'))
  recording.set_time('capture_time',timestamp=np.datetime64(original['capture_start_ns']+t,'ns'))
  recording.log(entity+'/pressure',rr.Clear(recursive=False))
  if a.digit_v4:
   recording.log(entity+'/unknown_sites',rr.TextDocument(json.dumps(row['unknown_sites'])))
  if row['positions']:
   recording.log(entity+'/pressure',rr.Points3D(np.array(row['positions'],dtype=np.float32),colors=np.array(row['colors'],dtype=np.uint8),radii=.023))
  recording.log(entity+'/status',rr.Points3D([[-.45,-2.65,.9]],radii=0,colors=[180,213,222,255],labels=[f"{'V4' if a.digit_v4 else 'V3'} {row['state']} | 0.5s visual estimate, not force"],show_labels=True))
  for name,value in row['levels'].items():
   recording.log(entity+'/relative/'+name,rr.Scalars(float('nan') if value is None and row['state']!='no_contact' else value or 0))
  count+=1
  last=t
  if count%500==0:print(f'[RUNNING] {stem} overlay {count}/2920',flush=True)
 assert process.wait()==0
 assert count==2920 and last==original['duration_ns']
finally:
 if process.poll() is None:process.kill();process.wait()
 recording.flush()
 recording.disconnect()
def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
metadata={'episode_id':episode['episode_id'],'recording_id':original['recording_id'],'source':'visual_contact_patches_v3','measured':False,'sample_count':221,'override_frames':count,'display':'source-clock previous-sample hold, no interpolation','display_max':189,'source_sha256':sha(a.samples),'clock_sha256':sha(root/'right-hand-pressure-samples.jsonl'),'data':{'path':'/rerun/episodes/20260911_170529/visual-pressure-v3.rrd','sha256':sha(output),'bytes':output.stat().st_size},'rollback':'Remove clothingPressureV3 import and pressure_override from clothing episode; original files remain unchanged.'}
metadata['display']=display
if a.digit_v4:
 metadata.update(source='visual_digit_contact_v4',display_max=189,renderer='shared_WebHand_processor',rollback='Restore clothingPressureV3 import and override; original V3 files remain unchanged.')
metadata['data']['path']=f'/rerun/episodes/20260911_170529/{stem}.rrd'
(root/(stem+'.json')).write_text(json.dumps(metadata,indent=2)+'\n')
print(f'\033[32m[COMPLETE] {stem} Pressure overlay, 2920 source-clock frames\033[0m')
