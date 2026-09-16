"""Add a display-only Rerun patch for gaps cleared in the old Movement panel."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import rerun as rr


def sha256(path: Path) -> str:
    checksum = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            checksum.update(chunk)
    return checksum.hexdigest()


def build(episode: str, manifest_path: Path, frames_path: Path, output: Path):
    manifest = json.loads(manifest_path.read_text())
    assert manifest['episode_id'] == episode
    output.mkdir(parents=True, exist_ok=True)
    path = output / 'movement-hold.rrd'
    recording = rr.RecordingStream(manifest['application_id'], recording_id=manifest['recording_id'], send_properties=False)
    recording.save(path)
    count = 0
    frozen = 0
    previous = -1
    try:
        with frames_path.open() as handle:
            for line in handle:
                item = json.loads(line)
                instant = int(item['time_ns'])
                assert item['held'] and 0 <= instant <= manifest['duration_us'] * 1000 and instant > previous
                previous = instant
                recording.set_time('tracking_time', duration=np.timedelta64(instant, 'ns'))
                recording.log('derived/hand_flexion/right/status', rr.Clear(recursive=True))
                if item['valid']:
                    frozen += 1
                    for index, mesh in enumerate(item['meshes']):
                        recording.log(f'derived/hand_flexion/right/mesh/{index}', rr.Mesh3D.from_fields(
                            vertex_positions=np.asarray(mesh['positions'], dtype=np.float32).reshape(-1, 3),
                            vertex_normals=np.asarray(mesh['normals'], dtype=np.float32).reshape(-1, 3),
                        ))
                else:
                    assert not item['meshes'], 'No pose to freeze before the first valid frame'
                count += 1
    finally:
        recording.flush()
        recording.disconnect()
    metadata = {
        'episode_id': episode,
        'source': 'display_hold_previous_valid_movement_pose',
        'held_frame_count': count,
        'frozen_pose_frames': frozen,
        'leading_blank_frames': count - frozen,
        'data': {'path': f'/rerun/episodes/{episode}/movement-hold.rrd', 'sha256': sha256(path), 'bytes': path.stat().st_size},
        'native_pose_unchanged': True,
    }
    (output / 'movement-hold.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'ALL COMPLETED {episode}: held={count} frozen={frozen} bytes={path.stat().st_size}', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--episode', required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--frames', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    build(args.episode, args.manifest, args.frames, args.output)
