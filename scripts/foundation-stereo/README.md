# FoundationStereo depth for the five-camera replay

This pipeline processes the **recorded PICO stereo pairs** in `task_clip`, then adds a synchronized, estimated depth video to the existing replay dashboard. The other camera videos, hand pose, flexion, pressure, and head-height data are preserved.

## Model and runtime

- Official source: <https://github.com/NVlabs/FoundationStereo>, commit `6e8806816b533e4d13ddbb95ffa907b797060a62`.
- FoundationStereo ViT-small, configuration `11-33-40`, 32 refinement iterations, CUDA mixed precision, 960 × 720 input.
- The original Google Drive weights were quota-limited during setup. The public mirror used is <https://huggingface.co/shriarul5273/FoundationStereo_models/tree/164d8d262e98d2d1f8c57af1ddab9e8e3127bf39/pretrained_models/11-33-40>.
- Original checkpoint SHA256: `8d7850b9dc68d1366722a02a39745704b1db41471211be6abd93ef463727e6be`. The same digest was listed by a second public mirror. This is a mirror integrity check, not an independently published checksum from NVIDIA.
- `export_weights.py` loads with PyTorch's restricted unpickler, removes optimizer data, and exports all 1,192 model tensors to safetensors. It compares every restored tensor, dtype and value. There is **no quantization or numerical change**.
- Safetensors SHA256: `7471dd62544650feb6cef9d04547120247c4ff817f1e43d75286ca4f00dd716a`.
- Model initialization skips the redundant EdgeNeXt initial-weight download. Loading the complete FoundationStereo state dict is strict: every model parameter must be supplied by the checkpoint.

The GPU task directory is `/root/foundation-stereo-work`, with an isolated Python environment at `env/`. No credentials are stored in this repository.

`gpu-environment.txt` records the installed package versions. The upstream model also loads the DINOv2 architecture through Torch Hub; `dinov2-source.json` records the actual cached Python-source snapshot used in this run. All DINO weights are supplied by the stereo checkpoint.

## Source geometry and timing

`20260911_155825` uses the same ViT-small checkpoint and 32 iterations on the
replacement RTX 3090 (24 GB), with PyTorch 2.4.1+cu121. The existing runtime was
reused after verifying all 156 FoundationStereo Python files, all 157 cached
DINOv2 Python files, and the safetensors digest against the earlier run.
All 738 recorded pairs are processed over 56.442730 seconds, at 960 × 720.
The largest native pair interval is 280.014 ms. Nine rectified-pair checks
found median vertical residuals of 0.37–0.89 px, with positive disparity for
all accepted matches; see `20260911_155825-epipolar-check.json`.
The dedicated VM job directory is `/root/foundation-stereo-work/20260911_155825`.
Its depth archive uses lossless ZIP DEFLATE compression (93,223,779 bytes)
to fit the repository's single-file upload limit. Every archived PNG and sidecar
is byte-identical to the uncompressed ZIP entries; video and numeric depth values
are unchanged. New packages use the same archive compression by default.

`prepare.py` checks frame indices against both source timestamp tables and extracts frames by sequential video decoding. It only uses rows of `stereo_pairs.csv`; independently captured frames are not paired merely by their frame number.

For `20260910_153529`, there are 214 pairs over 16.720818 seconds. Source left/right capture timestamps differ by one nanosecond in these rows. The native pair intervals are variable, up to about 240 ms. Each depth frame holds until the next actual pair; there is no synthesized intermediate depth and no time stretching.

The baseline is about 0.0638834 m. Rectification uses the original camera characteristics, the recorded image orientation, and OpenCV pixel-center scaling. It does **not** use the empirically fitted hand-overlay intrinsics. The source extrinsics yield essentially identical camera rotations and a horizontal baseline. Nine image-pair checks found horizontal correspondences consistent with near-rectified inputs.

No lens distortion coefficients were supplied, so zero distortion is assumed and documented. Depth is estimated as `rectified_fx * baseline_m / disparity_px`. There is no metric depth ground truth for validating absolute scale. Glass, reflective surfaces, occlusions, and dark regions may be unreliable.

## Running

Install the inference dependencies from `requirements.txt` into an isolated Linux CUDA environment. The local preparation and dashboard steps can use the existing PICO conversion environment.

```sh
python scripts/foundation-stereo/prepare.py \
  --source /path/to/20260910_153529/task_clip \
  --output /path/to/input

python scripts/foundation-stereo/export_weights.py \
  --input /path/to/11-33-40/model_best_bp2.pth \
  --sha256 8d7850b9dc68d1366722a02a39745704b1db41471211be6abd93ef463727e6be \
  --output /path/to/11-33-40/model.safetensors

python scripts/foundation-stereo/infer.py \
  --repo /path/to/FoundationStereo \
  --checkpoint /path/to/11-33-40/model.safetensors \
  --checkpoint-sha256 7471dd62544650feb6cef9d04547120247c4ff817f1e43d75286ca4f00dd716a \
  --source-checkpoint-sha256 8d7850b9dc68d1366722a02a39745704b1db41471211be6abd93ef463727e6be \
  --checkpoint-source https://huggingface.co/shriarul5273/FoundationStereo_models \
  --source-commit 6e8806816b533e4d13ddbb95ffa907b797060a62 \
  --input /path/to/input --output /path/to/inference

python scripts/foundation-stereo/package.py \
  --input /path/to/input --inference /path/to/inference \
  --output /path/to/depth-package
```

Keep the official `cfg.yaml` next to the weights. For a quick inference check, add `--pairs 0 100 180 213`; the full run can reuse completed frames with the same input, model and inference settings.

Copy the generated depth package into the episode's existing public directory. Then rebuild **only** its additive dashboard:

```sh
python scripts/glove-pressure/dashboard_layout.py \
  --output-dir public/rerun/episodes/20260910_153529 \
  --raw-pose /path/to/20260910_153529/task_clip
```

`build_dashboard` automatically detects `foundation-stereo-depth.json`, validates its episode/source hashes, and incorporates the video on the original tracking and capture timelines. Keep the depth package files in that output directory on later rebuilds. Episodes without a depth package retain the placeholder. Gaussian Splat remains a placeholder.

## Outputs

- `foundation-stereo-depth.mp4`: browser-compatible H.264, original variable timestamps, fixed TURBO color scale from 0.2 m (near/red) to 3.0 m (far/blue), black invalid pixels. Full-size depth imagery with no baked-in text, timestamp, legend or footer. The Rerun panel title is `Depth`; estimated-data provenance remains in the metadata.
- `foundation-stereo-depth-timestamps.csv`: original stereo pair indices, timestamps and display durations.
- `foundation-stereo-depth-mm.zip`: 16-bit depth PNGs in millimeters; zero is invalid. No footer is painted into these depth arrays.
- `foundation-stereo-depth.json`: source hashes, geometry assumptions, model provenance, timing policy and output hashes.
- `foundation-stereo-frame-statistics.json`: per-frame validity, depth distribution and inference time.
- The GPU inference directory also retains float32 disparity/depth arrays and masks in per-frame NPZ files.

Packaging validates every encoded frame timestamp and duration after decoding the MP4, including the final hold interval. Dashboard verification checks recording identity, frame reference timestamps, source geometry/video hashes and the unchanged raw head-height samples.

To regenerate the clean video locally from the saved 16-bit depth maps:

```sh
python scripts/foundation-stereo/package.py \
  --output public/rerun/episodes/20260910_153529 --from-depth-archive
```

This restores the full 960×720 frame under the old footer, using the same fixed
color mapping and existing millimeter-quantized depth maps. It verifies the
archive and each depth image hash and preserves all frame times and durations.
No inference or GPU is needed; the depth archive and original camera data are
unchanged. `video_rendering` records the PNG source and quantization. Rebuild the
additive dashboard afterward to replace its embedded AssetVideo.
