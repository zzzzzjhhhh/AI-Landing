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
p.add_argument('--surface',action='store_true',help='Color the unchanged original hand mesh; no extruded pressure points')
p.add_argument('--reference-display',action='store_true',help='Use the exact 165650 taxel display chain; leave original mesh and legend intact')
p.add_argument('--uniform-taxels',action='store_true',help='Equal-pitch stable glove points in the reference point renderer')
p.add_argument('--continuous-glove',action='store_true',help='One hand-silhouette lattice projected onto the original mesh, without ROI rectangles')
p.add_argument('--natural-contact',action='store_true',help='Smooth colors on the hand surface with explicit non-contact barriers')
p.add_argument('--hide-inactive',action='store_true',help='Remove inactive dark dots; retain contact-only opacity')
a=p.parse_args()
if a.surface and not a.digit_v4: p.error('--surface requires --digit-v4')
if a.reference_display and (not a.digit_v4 or a.surface): p.error('--reference-display requires --digit-v4 without --surface')
if a.uniform_taxels and not a.reference_display: p.error('--uniform-taxels requires --reference-display')
if a.continuous_glove and (not a.reference_display or a.uniform_taxels): p.error('--continuous-glove requires --reference-display without --uniform-taxels')
if a.natural_contact and not a.continuous_glove: p.error('--natural-contact requires --continuous-glove')
if a.hide_inactive and not a.natural_contact: p.error('--hide-inactive requires --natural-contact')
root=a.episode_dir
original=json.loads((root/'right-hand-pressure.json').read_text())
episode=json.loads((root/'manifest.json').read_text())
assert episode['episode_id']=='20260911_170529'
assert original['recording_id']==episode['recording_id']
entity='demo/glove_pressure/right'
stem='visual-pressure-v3-smooth' if a.smooth else 'visual-pressure-v3'
if a.digit_v4: stem='visual-pressure-v4-smooth'
if a.surface: stem='visual-pressure-v4-surface'
if a.reference_display: stem='visual-pressure-v4-reference'
if a.uniform_taxels: stem='visual-pressure-v4-uniform'
if a.continuous_glove: stem='visual-pressure-v4-glove'
if a.natural_contact: stem='visual-pressure-v4-glove-natural-v2'
if a.hide_inactive: stem='visual-pressure-v4-glove-clean'
output=root/(stem+'.rrd')
display='Contact-only smoothstep interpolation; 120ms pre-release fade; unknown/released stays empty' if a.smooth else 'source-clock previous-sample hold, no interpolation'
if a.digit_v4: display='Original WebHand heatmap renderer, same as 165650; 22 semantic zones; 120ms contact fade; unknown retained in metadata, not painted as contact'
if a.surface: display='Original hand mesh with time-varying vertex colors from the WebHand palette; zero geometric displacement; adjacent contact zones merged into a continuous field; 120ms contact fade'
if a.reference_display: display='Shared 165650 WebHand point renderer and temporal interpolation; original mesh, material, legend, camera and layout unchanged; connected contact spans use shared Gaussian taxel kernel'
if a.uniform_taxels: display+='; equal-pitch fixed-position taxels with neutral inactive points; color/opacity vary, no pressure-driven displacement'
if a.continuous_glove: display='One global hexagonal point lattice projected onto the original palmar mesh; no ROI point grids or rectangle clipping; original palette, contact data and temporal interpolation preserved'
if a.natural_contact: display+='; full-surface anatomical lookup including finger-palm transitions; five local surface diffusion passes, no cross-gap edges, explicit no-contact/unknown barriers at audit anchors'
if a.hide_inactive: display+='; inactive geometry omitted entirely, no dark base dots; active alpha fixed at 255 because Rerun uses alpha as brightness; unchanged RGB-only edge blending avoids black borders'
recording=rr.RecordingStream(original['application_id'],recording_id=original['recording_id'],send_properties=False)
recording.save(output)
if a.reference_display:
 pass # Keep the baseline legend, just as the 165650 override does.
elif a.digit_v4:
 recording.log(entity+'/legend',rr.Points3D([[x,2.9,.9] for x in (-1.15,-.8,-.45,-.1,.25)],radii=.065,colors=[[78,94,112],[76,132,173],[132,197,192],[251,234,132],[237,81,63]],labels=['Contact','','display','','only'] if a.surface else ['0','','37','','74'],show_labels=True),static=True)
else:
 recording.log(entity+'/legend',rr.Points3D([[-.45,2.9,.9]],radii=0,colors=[180,213,222,255],labels=['V3 contact footprint | color is NOT force'],show_labels=True),static=True)
recording.log(entity+'/provenance',rr.TextDocument('V3 visual clothing contact, NOT measured force. 221 samples at 0.5s spacing. Hidden footprint geometry is inferred; unknown is not zero-force evidence. Original data and tracking unchanged. Display: '+display),static=True)
if a.digit_v4:
 recording.log(entity+'/provenance',rr.TextDocument('V4: 221 stereo visual audits; 15 finger zones and 7 palm zones. Original App hand and heatmap, not audit dots. Unpainted areas may be unknown or no-contact; see unknown_sites. Not measured force. '+display),static=True)
exporter='export-surface-contact-override.mjs' if a.surface else 'export-digit-contact-override.mjs' if a.digit_v4 else 'export-contact-patches-override.mjs'
if a.reference_display: exporter='export-reference-digit-override.mjs'
process=subprocess.Popen(['node',str(Path(__file__).with_name(exporter)),str(a.samples),str(root/'right-hand-pressure-samples.jsonl')]+(['--smooth'] if a.smooth else [])+(['--uniform-taxels'] if a.uniform_taxels else [])+(['--continuous-glove'] if a.continuous_glove else [])+(['--natural-contact'] if a.natural_contact else [])+(['--hide-inactive'] if a.hide_inactive else []),stdout=subprocess.PIPE,text=True)
count=0
last=-1
try:
 for line in process.stdout:
  row=json.loads(line)
  if row.get('type')=='model':
   assert a.surface and count==0
   for i,mesh in enumerate(row['meshes']):
    recording.log(entity+f'/mesh/{i}',rr.Mesh3D(vertex_positions=np.asarray(mesh['positions'],dtype=np.float32).reshape(-1,3),triangle_indices=np.asarray(mesh['indices'],dtype=np.uint32).reshape(-1,3),vertex_normals=np.asarray(mesh['normals'],dtype=np.float32).reshape(-1,3),albedo_factor=[255,255,255,255]),static=True)
   continue
  t=row['time_ns']
  assert row['frame_index']==count and last<t<=original['duration_ns']
  recording.set_time('tracking_time',duration=np.timedelta64(t,'ns'))
  recording.set_time('capture_time',timestamp=np.datetime64(original['capture_start_ns']+t,'ns'))
  recording.log(entity+'/pressure',rr.Clear(recursive=False))
  if a.digit_v4:
   recording.log(entity+'/unknown_sites',rr.TextDocument(json.dumps(row['unknown_sites'])))
  if a.surface:
   for i,colors in enumerate(row['vertex_colors']):
    recording.log(entity+f'/mesh/{i}',rr.Mesh3D.from_fields(vertex_colors=np.asarray(colors,dtype=np.uint8)))
  if row['positions']:
   recording.log(entity+'/pressure',rr.Points3D(np.array(row['positions'],dtype=np.float32),colors=np.array(row['colors'],dtype=np.uint8),radii=.018 if a.continuous_glove else .023))
  status=f"VISUAL {row['state']} · {max(row['levels'].values(),default=0):.0f}/100" if a.digit_v4 else f"V3 {row['state']} | 0.5s visual estimate, not force"
  if a.surface: status=f"VISUAL {row['state']} · contact only"
  recording.log(entity+'/status',rr.Points3D([[-.45,-2.65,.9]],radii=0,colors=[180,213,222,255],labels=[status],show_labels=True))
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
if a.surface:
 metadata.update(renderer='original_hand_mesh_vertex_colors',geometry_displacement=0,color_semantics='contact display only, not pressure magnitude',rollback='Restore visual-pressure-v4-smooth.json import; previous point overlay is unchanged.')
if a.reference_display:
 metadata.update(renderer='reference-pressure-display.mjs (shared with 165650)',display_parameters={'min':0,'max':189,'height':0.7,'stride':2,'point_radius':0.023},contact_adapter='digit-reference-adapter.mjs; connected spans, not per-joint peaks',measured=False,rollback='Restore visual-pressure-v4-surface.json import; previous outputs remain unchanged.')
if a.uniform_taxels:
 metadata.update(renderer='shared WebHand point renderer, opt-in uniform taxel sampling',display_parameters={'min':0,'max':189,'point_spacing':0.065,'fixed_elevation':0.025,'pressure_displacement':0,'inactive_alpha':85,'point_radius':0.023},rollback='Restore visual-pressure-v4-reference.json import; previous outputs remain unchanged.')
if a.continuous_glove:
 metadata.update(renderer='continuous-glove-display.mjs; single hand-silhouette hex lattice',display_parameters={'min':0,'max':189,'projected_point_spacing':0.065,'surface_offset':0.012,'pressure_displacement':0,'inactive_alpha':100,'point_radius':0.018},rollback='Restore visual-pressure-v4-uniform.json import; previous outputs remain unchanged.')
if a.natural_contact:
 metadata.update(color_filter='natural-contact-color.mjs; complete anatomical source mapping plus 5 constrained surface diffusion passes',source_lookup='all 1168 surface points mapped; identical anatomical ownership for color source and n/u guard',rollback='Restore visual-pressure-v4-glove-natural.json import; previous outputs remain unchanged.')
if a.hide_inactive:
 metadata['display_parameters']['inactive_alpha']=0
 metadata['display_parameters']['inactive_geometry']='omitted; each retained point stays at its original surface coordinate'
 metadata['display_parameters']['active_alpha']=255
 metadata['rollback']='Restore visual-pressure-v4-glove-natural-v2.json import; previous outputs remain unchanged.'
metadata['data']['path']=f'/rerun/episodes/20260911_170529/{stem}.rrd'
(root/(stem+'.json')).write_text(json.dumps(metadata,indent=2)+'\n')
print(f'\033[32m[COMPLETE] {stem} Pressure overlay, 2920 source-clock frames\033[0m')
