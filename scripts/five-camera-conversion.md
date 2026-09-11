# Five-camera sample episodes

The sample-data page currently displays only `20260910_153529`, with five video
views, recorded hand keypoints, right-hand flexion, estimated pressure, depth
and IMU. All four episode entries and their data packages remain preserved;
161737, 150529 and the original stereo episode are hidden from the page only.
Source files are read only.

## 161737: clothing folding

The 67.963329 s task clip uses all five independently timestamped source videos:
1,825 left-PICO and each external-camera frames, plus 1,830 right-PICO frames.
All original PTS and display intervals are preserved. The base recording is
`five_camera_20260910_161737_23322cf22490`, with original 3D pose and projected
keypoints in both PICO views. External views have no invented keypoint overlays.

Of 4,873 source poses, 2,673 have complete right-hand tracking. Sampling on the
right-video clock yields 997 valid flexion frames and 833 explicitly cleared
frames. There is no video-generated pose fallback. The six IMU channels use all
4,873 head poses (29,238 scalar values) with the same estimator as 153529.

`glove-pressure/episodes/20260910_161737-pressure-estimates.json` describes the
reviewed clap, gray garment, green top, tan garment, green trousers and patterned
shorts sequence. It supplies the task/object text, seven stages, and relative
contact envelopes. Pressure is a labeled heuristic simulation modulated by
recorded finger bends; missing tracking uses VIDEO ONLY. It does not recover
measured pressure. Video review sampled most of the task at two-second intervals;
short contact ramps are illustrative. Task text is logged at its own boundaries,
even if a boundary does not coincide with a pressure keyframe.

A fresh full-clip calibration audit uses 1.2 s spacing per split, with separate
training, validation and confirmation exposures. The left-camera candidate
increased validation P95 (83.64 to 88.74 px), so the original left calibration is
retained. Only the right-camera fit is applied: validation median 37.50 to 31.93
px, P95 90.96 to 89.11 px; confirmation median 34.79 to 29.82 px, P95 82.09 to
78.93 px. These are detector-reference distances, mostly on the bare left hand,
not ground-truth accuracy. Raw hand/head poses, timestamps and extrinsics do not
change. The profile and rejected candidate metrics are retained under `episodes/`.

Use the existing conversion commands with the 161737 source and asset paths,
`20260910_161737-intrinsics.json`, and `20260910_161737-pressure-estimates.json`.
The audit uses `--sample-step 1.2`; the fit uses `--allow-partial` to retain any
camera that fails either independent set. Finish with:

```sh
python scripts/glove-pressure/dashboard_layout.py \
  --output-dir /path/to/161737/package \
  --raw-pose /path/to/20260910_161737/task_clip --head-imu
```

This episode has no generated depth. Its shared timeline, two right-hand panels,
task text/timeline, five cameras and stacked Accel/Gyro plots match the 153529
layout. The page keeps the enlarged viewer and omits the extra descriptions and
download links above/below it.

## 153529: recorded pose and video keypoints

The task clip lasts 16.720818 s. Left PICO and the three external cameras each
retain 440 frames; right PICO retains its own 446 exposures. Of 1,199 original
pose samples, 1,018 have a valid right hand. Sampling at the right-camera times
gives 377 valid frames and 69 missing frames. This episode uses no video-derived
pose or flexion replacement. Its pressure simulation separately uses visually
annotated contact phases, labeled ESTIMATED / relative 0–100; missing pose uses
VIDEO ONLY pressure while flexion remains unavailable.

Both PICO views show left-hand (teal) and right-hand (pink) points and bones.
`project_synced_frames` joins each view's own `t_sync_us` with the nearest pose
(maximum 50 ms), uses that exposure's recorded head pose, recorded camera
extrinsics and the selected fixed intrinsics, and respects the encoded vertical flip.
Points behind the camera are removed, bones are clipped to image bounds, and
empty tracking frames explicitly clear both. The three external videos have no
spatial calibration, so they have no projected skeletons.

The flexion builder verifies that its original right-hand samples reproduce the
RRD keypoints on all 446 right-camera frames. Reprojection equality here checks
data consistency, not accuracy against manually annotated image landmarks.
Visual review at 1, 7 and 13 seconds checked the recorded calibration against
grasping and moving hands. Source tracking can still have sensor error.

### Fixed per-camera calibration refinement

The user requires original pose and calibration changes only. The current
153529 package uses `glove-pressure/episodes/20260910_153529-intrinsics.json`:
one fixed focal length pair and principal point per PICO camera, applied for
the entire recording. This is an empirical calibration estimate from original
pose and independent image references, not a calibration-board measurement.
The page identifies it as estimated. Extrinsics, hand/head samples, timestamps,
video assets and flexion angles are unchanged. No image-detected joints are
substituted into the replay.

The sparse initial audit rejected `reflect-z`, a shared intrinsics fit and clock
shifts. Full inversion of the camera extrinsics also made alignment worse.
The successful refinement uses a denser 166-frame audit and fits the cameras
separately: 84 training exposures (55 matched hand observations) and 82 separate
validation exposures (48 observations). Four parameters per camera are fitted
with soft-L1 residuals. A further 166 disjoint exposures provide 107 matched
observations for confirmation; those frames are never used for fitting.

At 960 x 720, reference distances improve as follows:

| Set | Median before / after | P95 before / after |
| --- | ---: | ---: |
| Validation | 30.76 / 23.19 px | 83.40 / 69.32 px |
| Confirmation | 32.75 / 23.90 px | 75.00 / 65.28 px |

Both cameras improve in both sets. References are mostly the bare left hand.
Only one right-glove observation in each set is detected reliably, near the end
when the hand opens; these were visually reviewed. They improve too, but do not
establish accuracy for gripping/occluded fingers. Residual tracking/projection
mismatch remains. Detector distances and pose-to-RRD equality are not ground-truth
calibration accuracy.

The profile stores exact source hashes, frame splits, fitted intrinsics, audit
hashes and per-camera/per-hand metrics. Loading it against changed video, pose,
timestamp or calibration files fails. Its hash is part of the recording ID and
both base/supplement metadata. `/recording/hand_projection` retains original and
effective calibration. The vertical flip is handled in camera coordinates:
an image-space y shift changes the native principal point with the opposite sign.

Reproduce with MediaPipe, OpenCV, SciPy and Pillow plus conversion dependencies:

```sh
python scripts/evaluate-five-camera-projection.py \
  --source /path/to/20260910_153529/task_clip \
  --video-root /path/to/transcoded-videos --model /path/to/hand_landmarker.task \
  --sampling dense --output /path/to/audit
python scripts/evaluate-five-camera-projection.py \
  --source /path/to/20260910_153529/task_clip \
  --video-root /path/to/transcoded-videos --model /path/to/hand_landmarker.task \
  --sampling confirmation --output /path/to/confirmation
python scripts/fit-five-camera-intrinsics.py \
  --source /path/to/20260910_153529/task_clip \
  --audit /path/to/audit/measurements.json \
  --confirmation /path/to/confirmation/measurements.json \
  --output /path/to/intrinsics.json
python scripts/convert-five-camera-clip.py \
  --source /path/to/20260910_153529/task_clip \
  --output /path/to/package --work /path/to/transcoded-videos \
  --intrinsics-profile scripts/glove-pressure/episodes/20260910_153529-intrinsics.json
```

Then build the hand supplement with the pressure contact profile (and **without
`--video-estimates`**, which would replace missing flexion):

```sh
python scripts/glove-pressure/build-recording.py \
  --base-rrd /path/to/package/recording.rrd \
  --raw-pose /path/to/20260910_153529/task_clip \
  --output-dir /path/to/package \
  --asset-prefix /rerun/episodes/20260910_153529 \
  --pressure-profile scripts/glove-pressure/episodes/20260910_153529-pressure-estimates.json
python scripts/glove-pressure/verify-recording.py --output-dir /path/to/package
```

Copy the base RRD/manifest and the supplementary RRD, blueprint, manifest,
flexion CSV, pressure CSV, pressure-sample JSONL, and `replay-dashboard.rrd` / `.rbl` together into
`public/rerun/episodes/20260910_153529/`. The pressure panel shows contact phase,
relative peak, evidence label and a fixed color scale. This heuristic simulation
has no force/kPa calibration; the full assumptions and source hashes are stored
in its manifest. See `glove-pressure/README.md`. Other episodes retain their data.

## 150529: timing and video

The new clip uses its explicit microsecond `t_sync_us` clock, starts at zero and
lasts 51.602520 s. Left PICO, left side, right side and back each retain 1,403 real
frames. Right PICO retains its independent 1,401-frame sequence. Never copy left
frame indices onto the right stream or use the original Unix camera columns to
replace the aligned clock. The source estimates external-camera synchronization
accuracy at approximately 0.1 s; this is not hardware synchronization.

The converter creates 960-pixel-wide H.264 / SDR BT.709 previews. It preserves
**every** source PTS and packet duration, including the final display interval,
and verifies all of them against the corresponding CSV. HEVC/HLG inputs are
converted with FFmpeg's perceptual color mapping. The Rerun replay is silent;
source audio remains in the unchanged input files. Five distinct AssetVideo and
VideoFrameReference entities share `tracking_time` and `capture_time`. Views have
fixed image bounds and keep the entire camera image visible.

## 150529: hand sources and limits

The binary schema is 1,508 bytes per sample: original 1,500-byte PICO payload plus
an int64 `t_sync_us`. All 3,707 right-hand samples are retained in the base RRD.
Only 107 source samples have valid tracking, near 46.3–47.7 s. Nearest sampling on
the right-camera timeline gives 39 valid native video-frame poses.

The user requested video estimates for missing tracking. The standard MediaPipe
hand model was evaluated on this dark glove, including crops, contrast changes
and other cameras. It missed the glove and sometimes mislabeled the bare left
hand. Those unreliable detections are **not used**.

The fallback instead uses explicitly **coarse visual keyframe estimates** from
inspected right-camera frames. Annotations are stored in
`glove-pressure/episodes/20260910_150529-video-estimates.json`, including observed
grasp/release actions, source-video hash, approximate hinge-angle profiles and
visibility gaps. The builder linearly interpolates nearby visible keyframes.
These are approximate visual judgments, not automated 21-point detections,
measured sensor angles or calibrated 3D reconstruction. The panel and page label
this distinction; downstream code must preserve it.

Native pose always takes precedence. The final 1,401-frame flexion sequence has
39 native poses, 1,227 visual estimates and 135 unavailable frames. Missing
intervals clear the mesh and show “Tracking unavailable.” The CSV's `pose_source`
column identifies the source; estimated rows have no native pose index, measured
bend or source-direction error. Native direction agreement metrics apply only
to the 39 native frames. Pressure is independent mock input labeled DEMO.

## Reproduce

Use the installed Node dependencies, FFmpeg with perceptual scale color mapping,
and `rerun-sdk==0.33.0` / numpy. Generate into a staging directory first:

```sh
python scripts/convert-five-camera-clip.py \
  --source /path/to/20260910_150529/task_clip \
  --output /path/to/package \
  --work /path/to/transcoded-videos
python scripts/glove-pressure/build-recording.py \
  --base-rrd /path/to/package/recording.rrd \
  --raw-pose /path/to/20260910_150529/task_clip \
  --output-dir /path/to/package \
  --asset-prefix /rerun/episodes/20260910_150529 \
  --video-estimates scripts/glove-pressure/episodes/20260910_150529-video-estimates.json
python scripts/verify-five-camera-clip.py \
  --source /path/to/20260910_150529/task_clip --output /path/to/package
python scripts/glove-pressure/verify-recording.py --output-dir /path/to/package
rerun rrd verify /path/to/package/recording.rrd \
  /path/to/package/right-hand-pressure.rrd /path/to/package/right-hand-pressure.rbl
python -m unittest discover -s scripts -p 'test_five_camera_clip.py'
python -m unittest discover -s scripts/glove-pressure -p 'test_*.py'
node --test scripts/glove-pressure/*.test.mjs
npm run check
```

Publish the six original package files plus `replay-dashboard.rrd` and
`replay-dashboard.rbl` together under
`public/rerun/episodes/20260910_150529/`. Transcoded intermediate MP4 files are not
needed in public because their video assets are embedded in the RRD. Inputs are
read only. The page uses versioned hashes and remounts/cleans up Rerun when the
episode changes, so supplementary hand data cannot leak into another episode.
