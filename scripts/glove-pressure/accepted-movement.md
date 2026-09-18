# 165650 Movement v1 (2026-09-18)

Only Movement changes. Original WebHand GLB, topology, color, fixed-palm
orientation, camera and dashboard remain unchanged. Pressure and stereo overlays
are untouched. This is a review candidate, not an accuracy-certified replacement.

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

On `/sample-data`, select 165650, then `Tracking 修正版 v1` or
`原版 PICO · 回退`. Switching recreates the viewer from the original assets,
so old and new Movement do not accumulate; playback restarts at zero.
No original asset was overwritten. Permanent rollback: remove
`movement_override: waterMovementAccepted.data` from this episode's `hands`.

## Rebuild

Source directory needs `right_fit.npz`, `tracking-manifest.json`, and
`tracking-sources.json`. Local source files and intermediates live under
`hand key point tracking/work_stage/movement_165650_tracking_v1/`.

```sh
/tmp/ai-landing-rerun-venv/bin/python scripts/glove-pressure/build-accepted-movement.py \
  --source '../hand key point tracking/work_stage/movement_165650_tracking_v1/source' \
  --output public/rerun/episodes/20260911_165650
```

The command reports the current export stage and a green `[COMPLETE]` line.
