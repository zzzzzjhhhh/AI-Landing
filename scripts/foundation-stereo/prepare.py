"""Extract only recorded stereo pairs and rectify using the original camera geometry."""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np
from scipy.spatial.transform import Rotation


def sha(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def prepare(source: Path, output: Path, width=960):
    output.mkdir(parents=True, exist_ok=True)
    sync = json.loads((source / 'sync_manifest.json').read_text())
    rows = [{k: int(v) for k, v in r.items()} for r in csv.DictReader((source / 'stereo_pairs.csv').open())]
    assert [r['pair_index'] for r in rows] == list(range(len(rows)))
    ts = np.array([r['t_sync_us'] for r in rows], dtype=np.int64)
    assert ts[0] == 0 and np.all(np.diff(ts) > 0) and ts[-1] < sync['duration_us']
    cams = [json.loads((source / f'{s}_camera_characteristics.json').read_text()) for s in ('left', 'right')]
    assert all(c['video_transform'] == 'flip_vertical' for c in cams)
    assert cams[0]['width'] == cams[1]['width'] and cams[0]['height'] == cams[1]['height']
    scale = width / cams[0]['width']
    height = round(cams[0]['height'] * scale)
    K = []
    for c in cams:
        fx, fy = c['intrinsics']['focal_length']
        cx, cy = c['intrinsics']['principal_point']
        # MP4 rows have already been flipped. Apply the same transform to the principal point.
        cy = c['height'] - 1 - cy
        # OpenCV resize maps pixel centers, rather than pixel corners.
        K.append(np.array([[fx*scale, 0, (cx+.5)*scale-.5], [0, fy*scale, (cy+.5)*scale-.5], [0, 0, 1.]]))
    rotations = [Rotation.from_quat(c['extrinsics']['rotation_xyzw']).as_matrix() for c in cams]
    D = np.diag([1., 1., -1.])  # PICO Right/Up/Back -> encoded MP4 Right/Down/Forward.
    R = D @ rotations[1].T @ rotations[0] @ D
    T = D @ rotations[1].T @ (np.array(cams[0]['extrinsics']['position']) - cams[1]['extrinsics']['position'])
    assert T[0] < 0, 'Left/right camera order must produce positive disparity'
    # The source contains no distortion coefficients. Do not invent a lens fit.
    distortion = np.zeros(5)
    R1, R2, P1, P2, Q, roi1, roi2 = cv2.stereoRectify(K[0], distortion, K[1], distortion,
        (width, height), R, T.reshape(3, 1), flags=cv2.CALIB_ZERO_DISPARITY, alpha=0)
    maps = [cv2.initUndistortRectifyMap(k, distortion, r, p, (width, height), cv2.CV_32FC1)
            for k, r, p in zip(K, (R1, R2), (P1, P2))]
    for side, remap in zip(('left', 'right'), maps):
        folder = output / side
        folder.mkdir(exist_ok=True)
        source_rows = list(csv.DictReader((source / f'{side}_camera_timestamps.csv').open()))
        needed = {}
        for row in rows:
            index = row[f'{side}_frame_index']
            assert int(source_rows[index]['source_frame_index']) == row[f'{side}_source_frame_index']
            assert abs(int(source_rows[index]['t_sync_us']) - row['t_sync_us']) <= 1
            assert abs(row['left_capture_time_ns'] - row['right_capture_time_ns']) <= 1_000_000
            needed[index] = row['pair_index']
        cap = cv2.VideoCapture(str(source / f'{side}_camera.mp4'))
        count = saved = 0
        while True:
            ok, image = cap.read()
            if not ok:
                break
            if count in needed:
                image = cv2.resize(image, (width, height), interpolation=cv2.INTER_AREA)
                image = cv2.remap(image, *remap, interpolation=cv2.INTER_LINEAR)
                assert cv2.imwrite(str(folder / f'{needed[count]:04d}.png'), image)
                saved += 1
            count += 1
        cap.release()
        assert count == len(source_rows) and saved == len(rows)
    names = ['sync_manifest.json', 'stereo_pairs.csv'] + [f'{s}_camera{suffix}' for s in ('left', 'right')
            for suffix in ('.mp4', '_characteristics.json', '_timestamps.csv')]
    manifest = {'episode_id': sync['episode'], 'duration_us': sync['duration_us'],
        'capture_start_ns': int(sync['timeline_origin']['unix_time_us'])*1000,
        'width': width, 'height': height, 'frame_count': len(rows), 'pairs': rows,
        'source_sha256': {n: sha(source/n) for n in names},
        'geometry': {'source': 'original_camera_characteristics', 'baseline_m': float(np.linalg.norm(T)),
            'K_left': K[0].tolist(), 'K_right': K[1].tolist(), 'R': R.tolist(), 'T_m': T.tolist(),
            'R1': R1.tolist(), 'R2': R2.tolist(), 'P1': P1.tolist(), 'P2': P2.tolist(), 'Q': Q.tolist(),
            'depth_formula': 'depth_m = P1[0,0] * baseline_m / disparity_px',
            'distortion': 'Coefficients unavailable; zero assumed. Source pairs are near-rectified in image checks.',
            'scale_note': 'Estimated depth using recorded optical intrinsics; no metric ground-truth validation.'},
        'timeline_policy': 'One inference per recorded stereo pair. Hold until next pair; no interpolated depth or retimed frames.'}
    (output / 'input.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps({k: manifest[k] for k in ('episode_id', 'frame_count', 'width', 'height', 'duration_us')}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--width', type=int, default=960)
    args = parser.parse_args()
    prepare(args.source, args.output, args.width)
