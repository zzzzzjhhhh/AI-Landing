"""Diagnostic: identical video frames and poses; change only the extrinsics basis."""
import argparse, sys, json, csv, hashlib
from pathlib import Path
import cv2
import numpy as np
import mediapipe as mp
from PIL import Image, ImageDraw
from scipy.optimize import linear_sum_assignment
sys.path.insert(0, str(Path(__file__).parent / 'glove-pressure'))
from pose_source import read_pose_samples, aligned_camera_calibration, converter
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--video-root',type=Path,required=True,help='Verified 960 x 720 VFR PICO previews from convert-five-camera-clip.py')
parser.add_argument('--model',type=Path,required=True,help='Local MediaPipe Hand Landmarker task asset')
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--sampling', choices=['original', 'dense', 'confirmation'], default='original')
parser.add_argument('--sample-step', type=float, default=.4, help='Seconds between dense samples in each independent split')
args=parser.parse_args()
source=args.source
root=args.output;root.mkdir(parents=True,exist_ok=True)
samples,names=read_pose_samples(source)
duration = json.loads((source/'sync_manifest.json').read_text())['duration_seconds']
step = args.sample_step
if step < .4:
 parser.error('--sample-step must be at least 0.4 s to keep exposure splits distinct')
plans = {
 'original': [('exploratory', np.arange(1,duration,2)), ('held_out', np.arange(0.5,duration-.02,1))],
 'dense': [('exploratory', np.arange(step/2,duration-.02,step)), ('held_out', np.arange(step,duration-.02,step))],
 'confirmation': [('exploratory', np.arange(step/4,duration-.02,step)), ('held_out', np.arange(3*step/4,duration-.02,step))],
}
plan = plans[args.sampling]
mapping=[0,2,3,4,5,7,8,9,10,12,13,14,15,17,18,19,20,22,23,24,25]
options=mp.tasks.vision.HandLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(args.model),delegate=mp.tasks.BaseOptions.Delegate.CPU),num_hands=2,min_hand_detection_confidence=.6,min_hand_presence_confidence=.6)
records=[]
with mp.tasks.vision.HandLandmarker.create_from_options(options) as detector:
 for cam in ['left_camera','right_camera']:
  rows=list(csv.DictReader((source/f'{cam}_timestamps.csv').open()))
  poses={r['frame_index']:r for r in converter.read_jsonl(source/'camera_pose_tracking.jsonl') if r['side']==cam.split('_')[0]}
  calibration=aligned_camera_calibration(source,cam,960,720)
  cap=cv2.VideoCapture(str(args.video_root/f'{cam}.mp4'))
  needed={min(range(len(rows)),key=lambda i:abs(int(rows[i]['t_sync_us'])/1e6-t)) for _,targets in plan for t in targets}
  # Random frame seeks in VFR files may land on a different exposure; decode sequentially.
  decoded={}
  for decode_index in range(len(rows)):
   ok,frame=cap.read();assert ok and frame.shape[:2]==(720,960)
   if decode_index in needed:decoded[decode_index]=frame
  for set_name,targets in plan:
   for t in targets:
    fi=min(range(len(rows)),key=lambda i:abs(int(rows[i]['t_sync_us'])/1e6-t))
    instant=int(rows[fi]['t_sync_us']);si=int(converter.nearest_indices(samples['t_sync_us'],np.array([instant]))[0]);s=samples[si]
    head_row=poses[fi]['head'];head=np.asarray([*head_row['position'],*head_row['rotation_xyzw']])
    frame=decoded[fi]
    rgb=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
    image_path=root/f'{cam}-{fi:03d}.jpg';Image.fromarray(rgb).save(image_path)
    record={'camera':cam,'set':set_name,'time_s':instant/1e6,'frame_index':fi,'pose_sample_index':si,'image':str(image_path),'hands':{}}
    for hand in ['left','right']:
     mask=int(s[f'{hand}_joint_valid_mask']);projections={}
     for convention in ['recorded','reflect-z']:
      c={**calibration,'extrinsics':converter.convert_camera_extrinsics(calibration['extrinsics'],convention)}
      projections[convention]=converter.project_hand_to_video(s[f'{hand}_joints_xyz_xyzw'][:,:3],mask,head,c)
     record['hands'][hand]={'projections':projections}
    # Reference detections are used only for the audit, never as replacement pose.
    result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb))
    detections=[np.array([[p.x*960,p.y*720] for p in hand]) for hand in result.hand_landmarks]
    record['detections']=[{'xy':xy.tolist(),'handedness':h[0].category_name,'score':float(h[0].score)} for xy,h in zip(detections,result.handedness)]
    assignments=[]
    for convention in ['recorded','reflect-z']:
     wrists=[np.asarray(record['hands'][hand]['projections'][convention].get(0,[9999,9999])) for hand in ['left','right']]
     costs=np.array([[np.linalg.norm(xy[0]-wrist) for wrist in wrists] for xy in detections]).reshape(-1,2)
     pairs=linear_sum_assignment(costs) if len(detections) else ([],[])
     assignments.append({int(b):int(a) for a,b in zip(*pairs) if costs[a,b]<200})
    for hi,di in assignments[0].items():
     if assignments[1].get(hi)!=di: continue
     hand=record['hands'][['left','right'][hi]];hand['detection_index']=di
     hand['errors']={convention:[float(np.linalg.norm(np.asarray(p[j])-detections[di][i])) for i,j in enumerate(mapping) if j in p] for convention,p in hand['projections'].items()}
    records.append(record)
  cap.release()
report={}
for set_name in ['exploratory','held_out']:
 report[set_name]={}
 for cam in ['left_camera','right_camera','both']:
  for side in ['left','right','both']:
   hands=[h for r in records if r['set']==set_name and (cam=='both' or cam==r['camera']) for name,h in r['hands'].items() if (side=='both' or side==name) and h.get('errors') and h['errors']['recorded']]
   errors={c:[e for h in hands for e in h['errors'][c]] for c in ['recorded','reflect-z']}
   report[set_name][cam+'/'+side]={'matched_hands':len(hands),**{c:{'n':len(e),'median_px':float(np.median(e)),'p95_px':float(np.percentile(e,95))} for c,e in errors.items() if e}}
(root/'measurements.json').write_text(json.dumps({'episode':json.loads((source/'sync_manifest.json').read_text())['episode'],'reference':'MediaPipe image detections, evaluation only, not ground truth; same assignment under both variants','report':report,'records':records},indent=2))
print(json.dumps(report,indent=2),flush=True)
selected=[min([r for r in records if r['camera']=='right_camera'], key=lambda r:abs(r['time_s']-t)) for t in [1,7,13]]
board=Image.new('RGB',(1280,510*len(selected)),'#11151b')
for row,r in enumerate(selected):
 for col,convention in enumerate(['recorded','reflect-z']):
  im=Image.open(r['image']);draw=ImageDraw.Draw(im)
  for hand,color in [('left','#2dd4bf'),('right','#f472b6')]:
   p=r['hands'][hand]['projections'][convention]
   for bone in converter.projected_bone_strips(p,names,960,720):draw.line([tuple(x) for x in bone],fill=color,width=3)
   for x,y in p.values():draw.ellipse((x-3,y-3,x+3,y+3),fill=color)
  board.paste(im.resize((640,480)),(640*col,510*row+30));ImageDraw.Draw(board).text((640*col+10,510*row+10),f"{r['time_s']:.3f}s | {'Before' if col==0 else 'After: reflect-z'}",fill='white')
board.save(root/'comparison.jpg')
