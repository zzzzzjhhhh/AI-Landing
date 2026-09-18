# 170529 display: shared reference chain with optional uniform glove taxels

The active App asset is `visual-pressure-v4-glove.rrd`. It uses ONE hexagonal
lattice across the entire palm and fingers, projected onto the frontmost
triangles of the unchanged hand mesh. The real rig wrist landmark is the
lower boundary. There are no region-generated point grids, ROI rectangle
clips, or per-finger lattice restarts. The 1168 points remain fixed; colors
still come from the original WebHand palette and existing contact data.
The old region atlas is used only for color lookup, not point placement.
Build this version with `--digit-v4 --reference-display --continuous-glove`.

The previous `visual-pressure-v4-uniform.rrd` preserves the rejected six-grid
layout for rollback. The previous
`visual-pressure-v4-reference.rrd` preserves the unmodified reference layout;
`visual-pressure-v4-surface.rrd` is retained for rollback only, not loaded.

The older uniform option remains a colored-point overlay on the original gray
model. It uses approximately equal physical pitch (0.065 model units) across
the six ROI sizes instead of equal raster counts. All 721 sites stay at
fixed coordinates: a 0.025 model-unit offset replaces pressure-dependent
height/spread for this option only. Neutral inactive points use low opacity;
contact affects the original library color and brightness. These are display
sites, not real calibrated glove sensors. The taxel input, contact judgments,
levels and temporal interpolation are unchanged. The other two episodes do
not enable this option and their output is unchanged.

Both the 165650 exporter and the 170529 reference exporter call
`createReferencePressureDisplay`. This is the original 165650 processing:
WebHand WASM, min 0, max 189, height 0.7, stride 2, point radius 0.023,
and the existing temporal `interpolateContact` implementation by default. It retains
the base gray hand, material, camera, layout and legend. The underlying
point height effect is unchanged when the uniform option is off; this is not a flat
vertex-color replacement.

Only the 170529 input adapter differs: the approved 22 categorical contact
sites are converted to 23x20 taxels using the shared original Gaussian
kernel. Adjacent touching finger segments form one lobe, not one peak per
joint. Explicit no-contact and unknown subregions stay empty at audit
anchors. Intermediates are display interpolation, not new observations.
The fixed adapter gain is a display choice, not measured force. Palm and
finger contact footprints remain schematic rather than geometrically
measured boundaries.

`validate-reference-display.py` checks all 86 original 165650 anchors
against the actual shipped RRD: point coordinates (float32) and packed
colors match exactly. It also checks that the new 170529 RRD writes no
mesh/material or legend replacements and clears the old pressure layer
at all 2920 source-clock frames. Other episodes' served assets are unchanged.

Build with `build-contact-patches-override.py --digit-v4 --reference-display`
plus `--uniform-taxels` and the existing V4 sample JSONL plus 170529 episode directory.
`validate-uniform-taxels.py --asset visual-pressure-v4-glove.rrd` verifies identical point coordinates over all
2920 source timestamps. Roll back
by restoring the previous manifest import in `sample-episodes.ts`; do not
delete older outputs or modify source videos/tracking.
