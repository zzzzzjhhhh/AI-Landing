# PICO sample recording conversion

Install `scripts/requirements-rerun.txt` in a Python environment. FFmpeg and
ffprobe must be available on PATH.

```sh
python scripts/convert-pico-raw-to-rerun.py \
  --raw-clip /path/to/raw/episode \
  --output /path/to/new-output/replay.rrd \
  --recording-id pico-example-frame-synced \
  --compact-video
python -m unittest discover -s scripts -p 'test_convert_pico_raw_to_rerun.py'
rerun rrd verify /path/to/new-output/replay.rrd
```

Use a new output location for every conversion. Compact video selects at most
one original frame in each 50 ms bucket, retains its presentation timestamp,
and encodes H.264 at 960 pixels wide, CRF 28. It does not synthesize frames or
move them onto a constant-rate time grid. Original source files are unchanged.

Each camera requires its original `*_camera_timestamps.csv`. Video frame PTS
is matched to `presentation_time_us` within 1 ms of container rounding. That
row supplies the camera's `t_unix_ms` on both Rerun timelines. `--video-root`
can use existing videos only if their timestamps still identify original
frames; old constant-20-fps derivatives must be regenerated.

The 2D overlay is emitted at exactly the same timeline instant as each video
frame. Its hand pose is linearly interpolated between the two bracketing binary
pose samples around each exposure instant (plus an optional constant latency
offset), and the head pose comes from the corresponding `camera_pose_tracking.jsonl`
row, falling back to the binary head pose when the frame sidecar is absent. A
joint is valid only when both bracketing samples report it valid, and an exact
sample hit still uses just that sample. Missing, out-of-range, or more than
50 ms distant pose samples clear the overlay; the overlay never extrapolates.
(The five-camera episode pipeline additionally bridges tracking dropouts of up
to 500 ms between tracked frames by image-space interpolation; this path does
not.) Full-rate 3D pose/scalar channels are retained independently. Video and
overlay hold together between video frames.

Both camera views use fixed visual bounds from the encoded video's dimensions,
so out-of-frame tracking cannot change their zoom. The 2D overlay omits joints
outside the image and intersects bone segments with its pixel rectangle; it
does not clamp off-screen joints onto the edge. Empty visible geometry is logged
to replace the previous frame. The raw projections and full 3D tracking remain
unchanged. This display clipping is not a calibration or tracking correction.

The optional glove-pressure blueprint must use the same camera dimensions when
replacing the base layout. Regenerate its assets against the new base RRD too.

`summary.json` reports the first-frame offsets, source PTS matching error,
nearest-pose timestamp distances, and missing-pose counts separately per camera.
These are timestamp checks, not pixel reprojection errors or tracking accuracy.

## Spatial correction for the current sample

The `dd2ce463530545a480991ab3a5062a40/20260803_133948` sample uses an explicit
camera-relative extrinsics basis correction. Regenerate it with:

```sh
python scripts/convert-pico-raw-to-rerun.py \
  --raw-clip /path/to/raw/20260803_133948 \
  --output /path/to/new-output/replay.rrd \
  --recording-id pico-dd2ce463-spatial-v1 \
  --camera-extrinsics-convention reflect-z \
  --compact-video
```

The correction changes `t` to `S t` and `R` to `S R S`, with
`S = diag(1, 1, -1)`. For an XYZW quaternion this negates X and Y; translation
Z is also negated. Apply it once, before composing camera extrinsics with the
head pose. Both the 2D projections and 3D camera transforms use it. It does not
move the skeleton by a fixed pixel offset, fit the focal length, or modify the
original hand/head tracking data, videos, or calibration sidecars.

`--camera-extrinsics-convention` defaults to `recorded` for other data. Do not
automatically select `reflect-z` based on PICO device type or `Xr` field names:
the locally available SDK already includes a coordinate conversion, while
this episode has no SDK revision/convention marker. The additional correction
is supported by this episode's reprojection measurements, not proven SDK
provenance or a universal calibration rule.

Validation on 2026-09-09 used exact source video frames and independent
MediaPipe Hand Landmarker image detections at 960 x 720. The detector was only
an evaluation reference, never a replacement for the recorded skeleton.

| Set | Frames | Matched hands | Median before/after | P95 before/after |
| --- | ---: | ---: | ---: | ---: |
| Exploratory | 58 | 85 | 60.7 / 26.5 px | 150.6 / 61.5 px |
| Held out | 28 | 44 | 63.3 / 28.9 px | 150.6 / 64.1 px |

Both cameras and both hands improved in each set. Hand assignment was unchanged
whether using original or corrected wrist projections. Occluded hands without
a detection are excluded. These are distances to a detector, not ground-truth
calibration accuracy; remaining finger/pose mismatch is not considered solved.

The original and effective extrinsics plus the selected convention are retained
in `summary.json` and the RRD's static `recording/camera_calibration` entity.
Use a new immutable Blob pathname and viewer URL version after regeneration.

## Remaining calibration limits

The capture app anchors each camera's sensor clock to Unix time at its first
acquisition. Left and right cameras have separate anchors, and the binary pose
clock starts separately. CSV matching therefore cannot recover unrecorded
exposure-to-acquisition latency, tracker prediction/latency, or perfectly align
the hardware clocks. This episode's first sensor timestamps differ by 1 ns,
while the recorded Unix timestamps differ by 19 ms.

The converter retains the recorded camera intrinsics and vertical image
transform. The recording does not retain distortion coefficients, so the
projection is pinhole unless an episode-specific profile supplies
Brown–Conrady coefficients (`distortion`: k1, k2, p1, p2, k3 in normalized
image coordinates, fitted externally and stored in an intrinsics profile v2
for five-camera episodes, or passed by regenerating with a modified
characteristics sidecar). `--pose-latency-us` shifts when the pose stream is
sampled relative to each exposure: a positive offset samples the pose stream
later, compensating a pose timestamp that leads the tracked world state. The
offset is a constant display-time correction estimated externally (for example
with `evaluate-five-camera-projection.py --latency-sweep`); it does not modify
recorded data. Residual error may still include tracking/prediction error,
calibration, unmeasured per-frame latency variation, and reference-detector
error. Precise validation still requires synchronized calibration targets or
manually verified 2D landmarks, not just visual fit.

Rerun supports separate video timestamps and timeline timestamps:
<https://rerun.io/docs/reference/types/archetypes/video_frame_reference>.
