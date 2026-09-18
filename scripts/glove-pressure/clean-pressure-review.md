# Contact-only display and native-frame review

170529 uses the same original Pressure mesh as 165650 and 155825. The validator
compares actual RRD vertex positions, normals, topology and material, not just
model filenames. No contact labels, taxel values, point coordinates or RGB
colors are changed by this display option.

Use `--digit-v4 --reference-display --continuous-glove --natural-contact
--hide-inactive` with `build-contact-patches-override.py` to generate
`visual-pressure-v4-glove-clean.{json,rrd}`. Inactive geometry is omitted and
active point alpha is 255. This matters because the default Rerun Points3D
renderer treats alpha as brightness, not transparency: fading alpha produced
black points and black contact borders. RGB already blends toward the original
hand material, so it must not be darkened again using alpha.

Validate with `validate-clean-pressure.py --episodes-root public/rerun/episodes
--report <report.json>`. Roll back by restoring the
`visual-pressure-v4-glove-natural-v2.json` import in `sample-episodes.ts`.
Previous assets and both other episodes remain unchanged.

`render-clean-pressure-review.mjs` takes five arguments:

1. V4 audit JSONL
2. App episode directory
3. Original right-camera MP4
4. Right-camera timestamps CSV
5. Output folder

It checks every decoded source PTS against the CSV and App clock, then renders
lossless comparison PNGs with native source pixels, the shared original hand
mesh, and exactly the current clean display function. The review is an offline
fixed frontal view with simplified smooth lighting, **not a UI recording**.
The underlying visual audit remains sampled at 0.5 seconds; intermediate
contact displays are interpolated, not new force measurements.

Outputs include a VFR MP4, `review.html` (arrow-key PNG stepping), frame map and
provenance. The MP4 retains all 2919 source frames plus one duplicate endpoint
hold at the source clip end. It verifies every encoded timestamp before logging
green `[COMPLETE]`. `--resume` resumes encoding only from a complete validated
frame map; do not use it after changing the display or source data.

Keep rendered media outside Git in the project's `work_stage` folder. The App
only imports the small RRD overlay. Rendering never stops the App server.
