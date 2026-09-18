"""Retarget accepted stereo/MANO joints to the existing Movement rig only."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
import numpy as np
import rerun as rr

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--episode', required=True)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    episode = args.episode
    base = json.loads((repo / f'public/rerun/episodes/{episode}/right-hand-pressure.json').read_text())
    tracking_sources = json.loads((args.source / 'tracking-sources.json').read_text())
    app_tracking = json.loads((repo / f'public/rerun/episodes/{episode}/tracking-override.json').read_text())['hands']
    assert tracking_sources['left']['sha256'] == app_tracking['left_camera']['source_sha256']
    assert tracking_sources['right']['sha256'] == app_tracking['right_camera']['source_sha256']
    timing = json.loads((args.source / 'tracking-manifest.json').read_text())['frames']
    joints = np.load(args.source / 'right_fit.npz')['joints']
    assert joints.shape == (len(timing), 21, 3) and np.isfinite(joints).all()
    times = np.rint(np.array([f['pts'] for f in timing]) * 1e9).astype(np.int64)
    assert times[0] == 0 and np.all(np.diff(times) > 0)
    assert times[-1] <= base['duration_ns'] and base['duration_ns'] - times[-1] < 100_000_000
    args.output.mkdir(parents=True, exist_ok=True)
    input_path = args.source.parent / 'retarget-input.json'
    input_path.write_text(json.dumps({'duration_ns': base['duration_ns'], 'frames': [
        {'time_ns': int(t), 'joints': j.tolist()} for t, j in zip(times, joints)]}))
    path = args.output / 'movement-accepted-v1.rrd'
    recording = rr.RecordingStream(base['application_id'], recording_id=base['recording_id'], send_properties=False)
    recording.save(path)
    print('[RUNNING] Retargeting original WebHand rig; symmetric 120 ms quaternion filtering', flush=True)
    count, previous = 0, -1
    with subprocess.Popen(['node', str(repo / 'scripts/glove-pressure/export-accepted-movement.mjs'), str(input_path)], stdout=subprocess.PIPE, text=True, cwd=repo) as process:
        for line in process.stdout:
            frame = json.loads(line)
            t = frame['time_ns']
            assert previous < t <= base['duration_ns']
            previous = t
            recording.set_time('tracking_time', duration=np.timedelta64(t, 'ns'))
            recording.set_time('capture_time', timestamp=np.datetime64(base['capture_start_ns'] + t, 'ns'))
            recording.log('derived/hand_flexion/right/status', rr.Clear(recursive=True))
            for i, mesh in enumerate(frame['meshes']):
                positions = np.asarray(mesh['positions'], dtype=np.float32).reshape(-1, 3)
                normals = np.asarray(mesh['normals'], dtype=np.float32).reshape(-1, 3)
                assert np.isfinite(positions).all() and np.isfinite(normals).all()
                recording.log(f'derived/hand_flexion/right/mesh/{i}', rr.Mesh3D.from_fields(vertex_positions=positions, vertex_normals=normals))
            count += 1
            if count % 300 == 0:
                print(f'[RUNNING] Exporting Movement {count} frames, t={t / 1e9:.2f}s', flush=True)
        assert process.wait() == 0
    recording.flush()
    recording.disconnect()
    assert previous == base['duration_ns'] and count == int(np.ceil(base['duration_ns'] / 1e9 * 30)) + 1
    full_data = {'path': f'/rerun/episodes/{episode}/{path.name}', 'sha256': sha(path), 'bytes': path.stat().st_size}
    parts = []
    if path.stat().st_size > 90_000_000:
        with path.open('rb') as source:
            index = 0
            while chunk := source.read(70_000_000):
                part = args.output / f'{path.name}.part{index:02d}'
                part.write_bytes(chunk)
                parts.append({'path': f'/rerun/episodes/{episode}/{part.name}', 'sha256': sha(part), 'bytes': len(chunk)})
                index += 1
        offline = args.source.parent / path.name
        shutil.move(path, offline)
        full_data['storage'] = 'Full recording stored offline; reassemble data_parts in order.'
        print(f'[RUNNING] Split {full_data["bytes"]} bytes into {len(parts)} app parts', flush=True)
    metadata = {'episode_id': episode, 'source': 'app_tracking_stereo_MANO_right_retargeted_to_original_WebHand',
        'source_sha256': {name: sha(args.source / name) for name in ['right_fit.npz', 'tracking-manifest.json', 'tracking-sources.json']},
        'source_frames': len(times), 'frame_count': count, 'duration_ns': previous,
        'tracking_versions': {'left': app_tracking['left_camera']['version'], 'right': app_tracking['right_camera']['version']},
        'smoothing_radius_seconds': 0.12, 'source_max_gap_seconds': float(np.diff(times).max() / 1e9),
        'limitations': 'Model-estimated 3D, not ground truth. Original fixed-palm Movement view. No pressure or stereo overlay changes.',
        'data': full_data, 'data_parts': parts}
    (args.output / 'movement-accepted-v1.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'\033[32m[COMPLETE] {count} Movement frames exported\033[0m', flush=True)

if __name__ == '__main__':
    main()
