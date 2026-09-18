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

## Other episodes

`build-episode-clean-pressure.py --episode-dir <episode> --report <report.json>`
builds `pressure-continuous-clean.{json,rrd}` for 155825 or 165650. For 165650,
also supply `--first` and `--second` with its existing 41/45-row reviewed taxel
files; their hashes must match the prior App override. Its existing contact-only
interpolation is reused exactly. 155825 retains its native per-frame matrices.

Both use the same renderer, mesh, palette, pitch, surface offset, radius and
opaque active points as 170529. They do not have V4 semantic labels, so the
two-pass weighted surface averaging uses positive matrix support as a barrier instead
of inventing finger contact classifications. Zero-valued locations stay zero;
edges do not bridge finger gaps. Narrow matrix footprints are not edge-feathered
a second time, which would erase small fingertip contacts. No extra temporal filter is applied, so no
contact is carried across releases. This is display unification, not improved
contact detection or pressure measurement. The builder verifies the delivered
RRD timestamps, frame coverage, alpha, clears and lack of mesh/legend changes.

165650 and 155825 use a user-requested 1.2x display color gain. This changes RGB
only; the point visibility mask and numeric contact levels use unamplified data.
170529 retains its original 1.0x color display.
