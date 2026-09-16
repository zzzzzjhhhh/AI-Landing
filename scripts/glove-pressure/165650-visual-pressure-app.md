# 165650 visual Pressure app overlay

The sample app sends `visual-pressure-override.rrd` after the existing hand recording, on the same Rerun recording ID and right-Pressure entity. The original `right-hand-pressure.rrd`, CSV, flexion, pose and video are unchanged. The overlay's metadata is `public/rerun/episodes/20260911_165650/visual-pressure-override.json`.

It comes from 86 reviewed stereo samples at 0.5-second intervals. Original right-camera exposures between contact samples use display interpolation. Release fades during the preceding 120 ms; no-contact, approach, and uncertain samples remain empty. These are not individually recognized or measured forces. No per-finger force calibration is available. The reviewed sample files are under `hand key point tracking/work_stage/pressure_vision_165650_{0to20,20to42}_batch/`.

To rebuild, run `build-visual-pressure-override.py` with the original hand and episode manifests, original right-camera timestamp CSV, and the two validated-taxel JSONL files. It verifies the camera-clock SHA-256 before writing. The app imports only the generated JSON and RRD; original review frames are not served by the app.

Rollback: revert the commit introducing the overlay, or remove `pressure_override: waterPressureOverride.data` from the 165650 entry in `client/src/lib/sample-episodes.ts`. The original Pressure asset is still present with SHA-256 `935d596f74689c547383be156414555888de0e74091a0b6560df2b824c78e5a3`.
