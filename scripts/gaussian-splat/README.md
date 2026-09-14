# Accepted hand cloud → dynamic Gaussian splats

`build-hand-splats.py` extends the existing 4dgs conversion route for the three
accepted V8/V11 hand clouds. It keeps one anisotropic Gaussian per MANO face,
physical left/right identity, original `t_sync_us`, time-fused accepted RGB,
per-frame deformation, surface-normal rotation, observed support and tracking
confidence. The browser recording is additive and uses the same application and
recording ids as the base episode.

This is a fixed-topology point-cloud-to-Gaussian conversion. It is not a new
photometrically trained 4DGS reconstruction, and the metadata says so explicitly.
The rejected V14/V15/V16 tracking pilots must not be used as inputs.

Example:

```sh
python scripts/gaussian-splat/build-hand-splats.py \
  --cloud-dir /path/to/accepted/cloud \
  --output-dir /path/to/immutable/output \
  --episode-id 20260911_165650 \
  --application-id five_camera_task_clip_v1 \
  --recording-id five_camera_20260911_165650_c765664092fd \
  --source-revision V8 \
  --episode-manifest public/rerun/episodes/20260911_165650/right-hand-pressure.json
```

The script emits an RRD, JSON provenance, optional ≤60 MiB web parts and a
blueprint which preserves the established dashboard and upgrades only the
Gaussian Splat tile from a 2D placeholder to an interactive 3D view.
