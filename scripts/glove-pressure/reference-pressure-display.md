# Active 170529 display: reuse the 165650 chain

The active App asset is `visual-pressure-v4-reference.rrd`. The previous
`visual-pressure-v4-surface.rrd` is retained for rollback only, not loaded.

Both the 165650 exporter and the 170529 reference exporter now call
`createReferencePressureDisplay`. This is the original 165650 processing:
WebHand WASM, min 0, max 189, height 0.7, stride 2, point radius 0.023,
and the existing temporal `interpolateContact` implementation. It retains
the base gray hand, material, camera, layout and legend. The underlying
point height effect is intentionally unchanged; this is not a flat
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
and the existing V4 sample JSONL plus 170529 episode directory. Roll back
by restoring the previous manifest import in `sample-episodes.ts`; do not
delete older outputs or modify source videos/tracking.
