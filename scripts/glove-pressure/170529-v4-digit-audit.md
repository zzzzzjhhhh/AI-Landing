# 170529 per-digit contact audit V4

## What was reviewed

221 stereo samples, requested at 0, 0.5, ..., 110 seconds, from the existing
native-resolution PNG extractions. Every sample was inspected chronologically
with both camera views and adjacent samples. Additional native-resolution crops
were checked at 74.5–77 seconds to disambiguate raised index/little fingers.
This is **not** an inspection of every one of the 2,919 source video frames.

The ledger `170529-v4-digit-audit.txt` was newly authored from visual inspection,
not expanded from action labels or a fixed thumb/index/middle/ring grip template.
The old V3 JSONL supplies source image paths, source frame IDs and timestamps
only, plus the previous map for comparison. Its contact predictions are not
inputs to the V4 map. No tracking predictions or manual keypoint anchors were
used to infer contact.

## Meaning and limits

- Five digits × three descriptive pad zones (distal / middle / proximal), plus
  seven palm areas (thenar, hypothenar, center, radial/ulnar finger-base areas,
  radial/ulnar heel). Three thumb display zones do not imply three thumb phalanges.
- `c`: visually inferred contact; **not physically verified contact or force**.
- `n`: visual evidence of separation / no contact.
- `u`: occluded, motion-blurred, cropped or otherwise unresolved. It is not zero
  pressure. Merely overlapping cloth or table in the image is insufficient.
- Cloth tension, opposed gripping boundaries, consistent cloth/hand movement,
  spread-hand support and visible gaps inform the inference. Hidden exact
  contact footprints remain inherently ambiguous. The evidence note explains
  the sample-level rationale; individual hidden pads are left unknown.
- No force strength, Newtons, exact millimeter-scale footprint, metrically
  calibrated stereo depth, or quantitative accuracy improvement is claimed.
- Between-sample contact changes can happen within 0.5 s and are **not resolved**
  by this audit. The video holds each reviewed image for 0.5 s; it does not
  fabricate intermediate observations or smooth across releases.

## Display / data

V4 uses categorical **green contact / gray no-contact / amber unknown dots** on
the same hand rig and anatomical ROI transforms used by Pressure. All inferred
contacts have the same display magnitude; brightness is not estimated force.
Palm regions and pad ellipses are schematic, not camera-recovered boundaries.
The region owner is resolved before rendering, so contact cannot spread into a
neighboring `n`/`u` pad. Unknown areas appear in the per-pad ledger and in the
hand model. V3 retains its prior colormap for reference, not as ground truth.

`digit-contact-v4.jsonl` has explicit site states plus 460-element `data`,
`known_mask`, and `unknown_mask`. The 60 unused taxels stay zero with mask zero.
The `data` matrix alone is NOT sufficient to distinguish no-contact from
unknown. Any future app integration must carry the masks/semantic states.
Do not silently substitute this file into the current app's numeric-only
pressure stream.

The app and its current recordings are unchanged. This is an independent review
candidate; there is no deployment or server restart in these scripts.

## Reproduce locally

Requires the repository's installed dependencies (`npm ci`), macOS `sips`,
ImageMagick and FFmpeg. Paths containing spaces must be quoted.

```sh
node --test scripts/glove-pressure/digit-contact-audit.test.mjs
node scripts/glove-pressure/prepare-v4-contact-audit.mjs V3-taxels.jsonl OUTPUT_DIR
node scripts/glove-pressure/build-v4-digit-review.mjs V3-taxels.jsonl OUTPUT_DIR
```

Default ledger is the checked-in 170529 file. The builder validates exact
sample coverage and retains the original source timestamps and image IDs.
It writes `review.html`, 221 comparison JPGs, SVG sources, full JSON/JSONL,
`annotations.csv`, `summary.json`, and `comparison-v3-v4.mp4` (2 fps, 110.5 s).
All generated artifacts belong in the task's work-stage folder, not Git.

High-priority checks: 9.5–11.5 s raised index, 24.5–27 s release, 46–51 s rapid
regrips, 62–70 s cloth/table/hover ambiguity, 75 s raised index AND little,
79.5–83 s broad flat contact including little, 90/93.5–94 s raised outer fingers.

Passing tests establish structural coverage/masking, not visual correctness.
Human review or instrumented force/contact data is still needed to validate
accuracy; ambiguous samples should not be automatically accepted as ground truth.
