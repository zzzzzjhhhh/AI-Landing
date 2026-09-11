# Right-hand pressure and pose-derived flexion

`/sample-data` merges a supplementary RRD into the original PICO recording using
matching application and recording IDs. The reference dashboard places native
Rerun movement and pressure views side by side at top left, with task details
and a state timeline below. At top right, Depth plus five camera views form a
3×2 grid; Gaussian Splat and motion plots occupy the bottom right. Depth and
Gaussian Splat start as explicitly labeled placeholders. The `153529` Depth panel
now uses a synchronized FoundationStereo estimate; Gaussian Splat remains a placeholder.
See [the depth pipeline](../foundation-stereo/README.md) for generation and validation.
Camera bounds are preserved.

`dashboard_layout.py` writes an additive `replay-dashboard.rrd` plus its `.rbl`
and a `dashboard` entry in the supplementary manifest. It never rewrites video,
pose, pressure, flexion, or their CSVs. Five-camera head height copies the raw
head-position Y component in meters, preserving every `t_sync_us` and the capture
clock (1,199 samples for 153529 / 3,707 for 150529). This is tracking-space height,
not IMU data. The original stereo episode references its existing
`world/head_height` series and has a single Depth + two-camera row.

153529 and 20260911_155825 replace Head height with stacked **IMU accel** and
**IMU gyro** plots without XYZ legends. Red/green/blue still encode X/Y/Z;
estimated-data provenance and m/s² / rad/s units remain in the metadata and CSV.
The original head-height samples remain in the recording. 161737 also has
stacked IMU plots, while the two older episodes retain Head height.

### Pose-derived virtual IMU

`head_imu.py` derives six channels from the original 1,199 head positions and
xyzw quaternions at their unchanged `t_sync_us` timestamps (~71 Hz median).
It converts both world and head bases using the same right-handed convention
as the replay: +X right, +Y up, +Z back (`S = diag(1,1,-1)`, `p'=Sp`, `R'=SRS`).
The simulated sensor is at the tracked head origin; its true physical mounting
offset is unavailable. The tracking world is assumed gravity-aligned.

- **Accel** is ideal accelerometer specific force: `R.T @ (p'' - g)`, with
  `g = [0, -9.80665, 0]` m/s². A stationary upright head reports +9.80665 on Y.
- **Gyro** is body angular velocity in rad/s, from the first derivative of
  `log(R(t_i).T @ R(t))` at each source instant. Relative rotations avoid Euler
  wrapping and are invariant to quaternion sign flips.
- Derivatives use a local cubic least-squares fit over a 0.24 s window of actual
  irregular source times. Interior windows are centered; 18 boundary samples
  use shifted windows and are tagged `edge_fit`. No output is extrapolated.
  Gaps >100 ms, position jumps >15 cm or orientation jumps >30° split the fit.
  These thresholds are a guard for tracking resets, not a sensor validity flag.
- No random noise, sensor bias or drift is added. Fused pose cannot recover
  high-frequency hardware IMU readings. CSVs, metadata and recording provenance
  identify the result as **ESTIMATED**; the plot titles and legends are minimal.

The conventions for specific force and body angular velocity follow
[ROS REP 145](https://raw.githubusercontent.com/ros-infrastructure/rep/master/rep-0145.rst);
rotation-vector operations use [SciPy Rotation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.transform.Rotation.as_rotvec.html).

```sh
python scripts/glove-pressure/dashboard_layout.py \
  --output-dir public/rerun/episodes/20260910_153529 \
  --raw-pose /path/to/20260910_153529/task_clip --head-imu
python -m unittest discover -s scripts/glove-pressure -p 'test_*.py'
```

This emits `head-imu-estimates.csv` (six SI channels, both clocks, source pose
index and quality) and `head-imu-estimates.json` (method, assumptions, source
hashes and statistics), then includes those channels in the additive dashboard.
Subsequent dashboard builds preserve enabled IMU generation. The dashboard
verifier compares all 7,194 scalar values against both the CSV and a fresh
derivation from the original pose, and checks synchronization with the videos.

153529, 161737 and 20260911_155825 task text and stages reuse the reviewed
video-contact annotations; the two older episodes mark them unavailable. The main stage
track is visible in the Task timeline, while the Current action document follows
the finer contact phases. These are video annotations, not new ground truth.
The web integration fetches hand data and dashboard data, then sends the dashboard
blueprint last. The prior hand-only blueprint remains a fallback for older assets.

- **Pressure** in 153529, 161737 and 20260911_155825 uses reviewed video contact phases
  and original finger bends, at the right-camera timestamps. It is relative
  intensity (0–100), not measured force or pressure. See the workflow below.
- **Pressure · DEMO** in the two older episodes remains synthetic at 10 Hz.
- **Flexion · POSE** is inferred from the episode's original right-hand 3D joints.
  It uses the exact nearest pose sample and timeline instant used by each frame
  of the **right camera's** existing keypoint overlay. Between video frames it
  holds with the video. No smoothing, interpolation, or synthetic grip cycle is
  applied. Invalid or degenerate tracking clears the mesh; it never freezes the
  last valid hand indefinitely.

The two camera streams have independent recorded timestamps. One flexion panel
uses the right camera as its reference; it cannot match both camera sampling
instants simultaneously. Existing calibration/tracker latency limitations remain.

## Pose inference and retargeting

`pose_source.py` reads `pose_schema.json` and `pose_samples.bin`. Before exporting,
it checks **all** right-hand samples against the base RRD and reprojects each
right-camera frame's selected source sample, using the original head-pose sidecar
and the base's effective calibration. The resulting visible 2D points must match
the existing overlay. Different raw episodes or inconsistent overlays fail the
build. Missing joints are never interpreted as zero-position observations.

`pose-retargeting.mjs` converts segment directions into a palm frame: X toward
the index side, Y from wrist to middle MCP, Z their cross product. World hand
translation and rotation are removed so the flexion view has a stable palm.
Three segments per finger drive the WebHand model, including all three thumb
bones. `right-hand-rig.mjs` applies parent-first quaternion swings to match those
segment directions, retaining the original mesh's bone lengths and rest axial
twist. Positions alone do not identify twist. This is a pose-derived model,
not measured glove sensor angles or an exact reconstruction of hand dimensions.

`samplePose(joints)` returns skinned positions/normals, local bone Euler angles,
source geometric bend angles and realized segment directions. `sample(angles)`
replays the exported local `_x_deg`, `_y_deg`, `_z_deg` columns. Each `_bend_deg`
is the unsigned angle between consecutive 3D source segments (0 = straight);
the MCP/CMC value includes out-of-plane spread and is not an isolated anatomical
hinge measurement. Per-segment direction error is checked before publication.

`public/rerun/right-hand-flexion.csv` includes video timeline/capture timestamps,
source sample indices/timestamps, validity, source bends and model bone rotations.
Invalid rows have empty angle fields. The manifest records source hashes, frame
counts, nearest-pose distances and overlay/direction agreement. These agreement
metrics validate retargeting and source selection, not the physical accuracy of
the original PICO tracker.

## Extracted assets and pressure

- `vendor/Hand_R2.glb`: original right-hand skinned mesh.
- `vendor/data-handler.cjs`: extracted Emscripten loader, wrapped for Node.
- `vendor/DataHandler.wasm` / `.data`: original pressure processing/color tables.
- `processor.mjs`: standalone 23 × 20 right-glove matrix to point positions/RGBA;
  calls original `fetchRoiData` / `handleThreeD`, reproduces six region transforms,
  elevation, threshold and edge fade, and releases WASM allocations each frame.
- `export-demo.mjs`: synthetic pressure source. The pressure mesh stays open.
- `export-pose.mjs`: recorded-keypoint retargeting and mesh baking.
- `vendor/provenance.json`: original distribution asset hashes. This is extracted
  distribution code, not the original application's source project.

WASM pressure processing and Three.js 0.183.0 skinning run **offline** during RRD
creation. The page keeps the existing Rerun renderer. It does not load WebHand's
Vue application, serial monitor, another Three.js renderer or `HandHandler.wasm`.
No WASM angle-solving algorithm is used for the pose-derived flexion.
Pressure samples every other processed point at 0.35 height scale. Round Rerun
points differ from the original Three.js point sprites. Units are arbitrary 0–255.

## Rebuild and verify

Install project dependencies and `scripts/requirements-rerun.txt` (SDK 0.33.0).
Use the same base episode served by `app/api/rerun-demo/recording.rrd/route.ts`
and its original pose/camera sidecars. Source files are read only.

```sh
npm ci
python scripts/glove-pressure/build-recording.py \
  --base-rrd /path/to/base.rrd \
  --raw-pose /path/to/original/episode
node --test scripts/glove-pressure/*.test.mjs
python -m unittest discover -s scripts/glove-pressure -p 'test_*.py'
python scripts/glove-pressure/verify-recording.py
rerun rrd verify public/rerun/right-hand-pressure.rrd public/rerun/right-hand-pressure.rbl
npm run check
```

Python can run via `uv run --with rerun-sdk==0.33.0 --with numpy python`.
Use `--output-dir /path/to/staging` to generate and verify before replacing the
public assets. Rebuild the RRD, blueprint, manifest and CSV together whenever
the source episode changes. File sinks are finalized before computing hashes.
The web integration preserves video playback if supplementary loading fails.

The hand builder automatically regenerates the dashboard. To change layout only:

```sh
python scripts/glove-pressure/dashboard_layout.py \
  --output-dir public/rerun/episodes/20260910_153529 \
  --raw-pose /path/to/20260910_153529/task_clip
python scripts/glove-pressure/verify-recording.py \
  --output-dir public/rerun/episodes/20260910_153529 \
  --raw-pose /path/to/20260910_153529/task_clip
```

Include both `replay-dashboard.rrd` and `replay-dashboard.rbl` with the updated
manifest when copying a staged package. Omitting `--raw-pose` is supported for
the original stereo dashboard, which already has head height in its base RRD.

To repeat extraction: `node scripts/glove-pressure/extract-webhand.mjs /path/to/WebHand-package`.
Real pressure requires timestamped 460-byte matrices and explicit clock alignment;
hand pose alone cannot supply measured pressure.

## Video- and pose-conditioned pressure simulation

`episodes/20260910_153529-pressure-estimates.json` records visually reviewed
right-camera observations, the source video/pose/clock hashes, contact regions,
and an explicit relative contact envelope. In this clip the right hand steadies a
cup by its handle while the left hand pours, lifts/carries it, places it inside a
microwave, and releases it. The thumb, index and middle fingers receive most of
the assumed contact, with little palm load. Contact timing is approximate,
especially during occluded release (~0.2 s); individual hidden contacts, cup
mass, friction, forces and physical pressure are not recovered from video.

`pressure-inference.mjs` interpolates the annotated contact strength using
smoothstep. Each finger's original distal joint bends modulate its amplitude
by `0.65 + 0.35 * curl`; the contact envelope gates the entire result. Thus a
curled finger without contact creates no pressure. Region pads are Gaussian
distributions in the original 23×20 glove layout, quantized to 0–255. The atlas
reports relative peak intensity per region on a 0–100 scale. No periodic pulse
or random noise is used. The open-hand atlas stays fixed so regions remain
comparable; the separate flexion panel retains the original pose.

Missing/degenerate native tracking uses a declared neutral curl prior of 0.55
with the video's contact envelope; its source remains recorded in metadata/CSV.
It never changes the pose or fills gaps in the flexion panel. Valid raw poses
have source `video_contact_and_recorded_pose`. `export-pressure-estimate.mjs` emits all 446 right
camera frames (377 pose-conditioned, 69 video-only), plus one endpoint hold.
Release clears every taxel and sends an empty cloud so an old contact cannot
remain visible. Region scalar tracks, current phase, relative peak and a color
legend are logged alongside the cloud. The displayed title is `Pressure`, with
no ESTIMATED or VIDEO + POSE / VIDEO ONLY badges. Simulation and evidence
provenance are preserved in the recording metadata and exported samples.

```sh
python scripts/glove-pressure/build-recording.py \
  --base-rrd public/rerun/episodes/20260910_153529/recording.rrd \
  --raw-pose /path/to/20260910_153529/task_clip \
  --output-dir /tmp/153529-pressure-estimated-package \
  --asset-prefix /rerun/episodes/20260910_153529 \
  --pressure-profile scripts/glove-pressure/episodes/20260910_153529-pressure-estimates.json
python scripts/glove-pressure/verify-recording.py --output-dir /tmp/153529-pressure-estimated-package
```

The source hashes, episode and duration must match before generation. The
supplementary manifest embeds the full estimation profile and hashes the
exported `right-hand-pressure.csv` (six regional peaks, phase, evidence,
source pose index and both clocks) and `right-hand-pressure-samples.jsonl`
(full 460-cell matrices and inference inputs). The fixed color scale maps
0 to no contact and 100 to the top of the relative range; it is not calibrated
in newtons or kPa. The original base recording and flexion CSV remain unchanged.

## Aligned five-camera clips and video fallback

The original stereo workflow above uses native pose only. The five-camera episodes
also supports a 1,508-byte aligned pose schema with appended `t_sync_us`. When
explicitly supplied with `--video-estimates`, missing native tracking can use
coarse, annotated visual keyframes with interpolation. It is labeled VIDEO
ESTIMATE, and is not an automatic keypoint-reconstruction result. Native tracking
always takes precedence and sources are separated in the angle CSV. See
`../five-camera-conversion.md` for the complete workflow, provenance and limits.

`20260910_153529` uses only original tracking: 377 of 446 right-camera frames are
valid. Its PICO video overlays and flexion are checked against the same source
samples and exposure times. The three external views lack spatial calibration.
`20260910_150529` uses the explicitly annotated video fallback for missing tracking.
