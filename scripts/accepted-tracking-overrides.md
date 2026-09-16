# 20260911 accepted hand tracking in sample-data stereo views

The three sample episodes use `tracking-override.rrd` in each episode's
`public/rerun/episodes/<id>/` directory. The viewer first opens its existing
`recording.rrd`, then sends the small override on the same Rerun recording
before applying the dashboard blueprint. The override writes the same
`camera/<eye>/hand_pose/<hand>/{joints,bones}` paths at each camera exposure.
Video assets, side/back cameras, depth, pressure, and IMU are unchanged.

| Episode | Left camera 2D | Right camera 2D |
| --- | --- | --- |
| 20260911_155825 | accepted V10 | accepted V10 |
| 20260911_165650 | provisional V5 | provisional V4 |
| 20260911_170529 | provisional ACE raw | provisional ACE raw |

The VM builder is
`/Users/yujie/Downloads/OV/hand key point tracking/gcp_pipelines/pico_gap_diffusion/build_app_tracking_overrides.py`.
It validates original frame indices and per-eye timestamps, converts 1280×960
pixel coordinates (or ACE normalized coordinates) to the app's 960×720
video canvas, logs only visible points and connected bones, and emits a
SHA-256/source record in `tracking-override.json`.

The app's Movement/flexion and pressure panels still come from the original
recorded 3D pose. The accepted edits are 2D per-camera observations; a
consistent stereo/MANO 3D fit is required before those panels can be updated.
Do not present the old 3D hand as the accepted 2D track.

## Movement gap display (2026-09-16)

The original Movement 3D pose is unchanged. A supplemental
`movement-hold.rrd` is sent after the base recording for episodes with missing
Movement playback frames. It clears the old `Tracking unavailable` label and
holds the last valid mesh until a valid pose resumes. This is a display hold,
not a reconstructed off-camera pose or a modification to pressure/2D tracking.

- 170529: 65 held playback frames, including 17.4–19.433 s and the tail.
- 165650: only the first 3 playback frames are missing; there is no previous
  pose to hold, so the hand remains blank until the first valid pose.
- 155825: no missing Movement playback frames, so no supplemental file.

`scripts/glove-pressure/export-movement-hold.mjs` generates held frames from
the existing flexion CSV and `build-movement-hold.py` packages the Rerun
supplement. `movement-playback.mjs` keeps its original default behavior unless
`holdMissing: true` is passed. The local player was visually checked at the
170529 gap and after recovery; the production build passes.

Validation on 2026-09-16: Rerun 0.33 verified all three override files,
local SHA-256 and byte counts match their JSON metadata, TypeScript check and
Next production build pass. Local sample-data playback loaded all three
episodes with stereo hand overlays and no error banner.
