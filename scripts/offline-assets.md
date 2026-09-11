# Offline assets and repository cleanup

The web app serves prepared recordings; it never executes the Python generation
pipeline or reads depth PNG archives at runtime.

Removed from the current repository tree:

- `scripts/foundation-stereo/package.py`
- `scripts/glove-pressure/dashboard_layout.py`
- `20260910_153529/foundation-stereo-depth-mm.zip` (48,155,240 bytes)
- `20260911_155825/foundation-stereo-depth-mm.zip` (93,223,779 bytes)

Verified local copies of the complete scripts tree and offline metadata/exports
were retained outside the repository before removal. Use an external workspace
containing the scripts and full depth packages for future generation:

```sh
export OFFLINE_SCRIPTS=/path/to/offline/scripts
python "$OFFLINE_SCRIPTS/foundation-stereo/package.py" --help
python "$OFFLINE_SCRIPTS/glove-pressure/dashboard_layout.py" --help
```

The retained hand builder accepts `--dashboard-script` pointing to that external
script and checks it before generating assets. `verify-recording.py` verifies
hand data and dashboard file hashes by default; pass `--dashboard-script` with a
complete offline package for the original full dashboard/depth validation.
Only publish playback assets and required metadata. Public depth metadata retains
archive hashes as provenance but no longer advertises an archive download URL.

## Other candidates found — retained for review

| Files | Approximate size | Purpose / reason retained |
| --- | ---: | --- |
| Remaining offline scripts, tests and profiles | 2.68 MiB total | Conversion, calibration, frame review, pressure, movement and IMU generation; not called by Next.js scripts |
| `scripts/glove-pressure/vendor/` | 2.25 MiB (included above) | Offline WASM processor and hand model, not fetched by the web player |
| 13 CSV exports under `public/rerun/` | 8.02 MiB | Includes depth timing and native numeric exports; keep pending a dependency audit |
| 3 pressure sample JSONL files | 5.65 MiB | Offline pressure matrices and provenance; no browser consumer found |
| `attached_assets/` | 1000.81 MiB | Original design/media assets, some may be referenced; requires a separate usage audit |
| `client/public/` | 177.92 MiB | Contains apparent copies of top-level `public/` media; requires a separate usage audit |
| Rerun `.rrd` / `.rbl` files | Required runtime assets | Required playback data or preserved older episodes; do not remove based on size alone |

No other episode data or candidate files were removed. Removing tracked files
from the current tree does not erase earlier Git commits or shrink existing
clones; no history rewrite was performed.

The 165650 and 170529 episodes publish playback files and metadata only. Their
review frames, generation profiles and numeric exports remain in the external
offline workspace. The 170529 hand recording is distributed as ordered byte
parts below 100 MiB and reconstructed by the player without changing its data.
