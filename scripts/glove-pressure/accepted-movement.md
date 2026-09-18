# 165650 Movement v1 (2026-09-18)

Only Movement changes. Original WebHand GLB, topology, color, fixed-palm
orientation, camera and dashboard remain unchanged. Pressure and stereo overlays
are untouched. The app loads this version for 165650 by default; it is still a
model estimate that can be revised after visual review.

## Source and method

Existing `20260916_accepted_tracking_cloud_batch_v1/165650/05_mano_smooth/1_fit.npz`
provides 526 right-hand MANO joint samples (0–42.902047 s), fitted from accepted
left V5/right V4 tracking. Source hashes are in `movement-accepted-v1.json`.
These are model estimates, including hidden joints, not new measurements.
The maximum source gap is 0.360019 s; interpolation cannot recover unseen motion.

Map hand21 to the original rig names, retaining every finger's MCP/PIP/DIP/tip
chain. Drive the same 15 local bone rotations with the existing retargeter.
Use symmetric 120 ms-radius quaternion averaging, then shortest-path interpolation
at the original 30 fps timestamps (1,291 samples including the endpoint).
The last source pose holds for the final 80 ms. World translation/orientation
are intentionally discarded, matching the original fixed-palm Movement display.

The patch updates only Movement vertex positions/normals and clears its status.
It is loaded after the original hand recording and missing-pose hold patch.
It uses both original tracking_time and capture_time clocks.

## Validation

- TypeScript check; 61 hand/pressure tests pass.
- Finite joints and vertices, monotonic timestamps, complete duration verified.
- Actual input, same 30 fps output before/after extra smoothing:
  median per-bone frame step 0.506° → 0.456°;
  p95 2.861° → 2.685°; maximum 45.335° → 21.481°.
  These measure motion reduction, **not accuracy**. Significant motion changes
  remain and should be reviewed against video.
- Browser displays the original aqua Movement model and unchanged Pressure.

## Review / rollback

On `/sample-data`, select 165650. The revised Movement loads automatically.
No original asset was overwritten. To roll back, remove
`movement_override: waterMovementAccepted.data` from this episode's `hands`.

## Rebuild

Source directory needs `right_fit.npz`, `tracking-manifest.json`, and
`tracking-sources.json`. Local source files and intermediates live under
`hand key point tracking/work_stage/movement_165650_tracking_v1/`.

```sh
/tmp/ai-landing-rerun-venv/bin/python scripts/glove-pressure/build-accepted-movement.py \
  --episode 20260911_165650 \
  --source '../hand key point tracking/work_stage/movement_165650_tracking_v1/source' \
  --output public/rerun/episodes/20260911_165650
```

The command reports the current export stage and a green `[COMPLETE]` line.

The same builder produced the two additional app Movement views:

| Scene | Tracking fitted in stereo | Fit samples | App frames | Fit time range |
| --- | --- | ---: | ---: | --- |
| 155825 | left/right V10 | 738 | 1,695 | 0–56.402730 s |
| 170529 | left/right ACE raw | 1,419 | 3,302 | 0–109.965299 s |

The fit sources match each scene's current `tracking-override.json` SHA-256
entries; the builder enforces this before writing. The generated `.rrd` files
were verified with `rerun rrd verify`. As with 165650, inspect the entire
movement against video before judging alignment and finger quality. The source
fit is a prediction over 3D joints, and the long 170529 sequence may still
contain errors in the original ACE tracking or MANO fit.

The 170529 recording exceeds GitHub's single-file limit, so the builder stores
its full `.rrd` offline in `work_stage/movement_170529_tracking_v1/` and publishes
three ordered `data_parts` under the app episode directory. The app joins these
byte-for-byte before loading the recording. The part hashes and full SHA-256
are recorded in the scene's `movement-accepted-v1.json`.
