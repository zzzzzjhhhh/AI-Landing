# 170529 surface-contact display

The old `processor.mjs` computes `elevation = pressure / 255 * height`
and uses that value in both local Y and lateral spread. Calling it with
`height: 0.7` is a height field, not just a heatmap. The digit adapter also
made one Gaussian per semantic segment, creating repeated raised islands.

The `--digit-v4 --surface` override keeps the original `Hand_R2.glb` baked
positions, normals, triangles, open pose, panel and camera. It only animates
`Mesh3D.vertex_colors`; original point overlays are cleared on every source
timestamp. It uses the WebHand library palette, with a white albedo multiplier
so the existing base color and heat colors are not tinted twice.

The 22 audited labels are unchanged. Adjacent contact zones are unioned before
an inward boundary-distance taper is applied. There is no joint-centered
peak. No-contact and unknown samples are excluded before sampling, and the
existing 120 ms transition preserves known release anchors. Unknown sites
remain in the RRD metadata and are not interpreted as zero measured force.

This is a schematic contact visualization, not measured pressure or a newly
verified contact boundary. The existing 0.5 s observations remain the only
visual evidence. Mesh interpolation limits how sharply sub-finger boundaries
can be shown. Other episodes, movement, tracking and source video are unchanged.

Validation: Node tests check merged regions, exclusion masks, temporal release
and immutable geometry. `validate-surface-contact-override.py` reconstructs
the local baseline RRD temporarily and checks the delivered override against
its actual mesh, all source timestamps, and every old-overlay clear.

Rollback: restore the `visual-pressure-v4-smooth.json` import in
`client/src/lib/sample-episodes.ts`. Older output files remain intact.
