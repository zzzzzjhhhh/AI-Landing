"""Encode a VFR depth video and 16-bit depth archive without changing the episode clock."""
from __future__ import annotations
import argparse
import csv
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import zipfile
import av
import cv2
import numpy as np


def sha(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def encode_video(video: Path, colors, starts: list[int], duration_us: int, width: int, height: int):
    """Encode full-size clean depth frames; never paint labels into the video."""
    assert starts and starts[0] == 0 and all(b > a for a, b in zip(starts, starts[1:]))
    assert starts[-1] < duration_us
    durations = dict(zip(starts, np.diff(starts+[duration_us]).tolist()))
    container = av.open(str(video), 'w', options={'movflags': '+faststart', 'video_track_timescale': '1000000'})
    stream = container.add_stream('libx264', rate=30)
    stream.width, stream.height, stream.pix_fmt = width, height, 'yuv420p'
    stream.time_base = stream.codec_context.time_base = Fraction(1, 1_000_000)
    stream.codec_context.max_b_frames = 0
    stream.options = {'crf': '18', 'preset': 'fast', 'bf': '0', 'g': '30'}
    def mux(packets):
        for packet in packets:
            time_us = round(packet.pts * packet.time_base * 1_000_000)
            assert time_us in durations
            packet.duration = round(Fraction(durations[time_us], 1_000_000)/packet.time_base)
            container.mux(packet)
    for time_us, color in zip(starts, colors, strict=True):
        assert color.shape == (height, width, 3)
        frame = av.VideoFrame.from_ndarray(color, format='bgr24')
        frame.pts, frame.time_base = time_us, Fraction(1,1_000_000)
        mux(stream.encode(frame))
    mux(stream.encode())
    container.close()
    check = av.open(str(video))
    decoded = [round(frame.pts*frame.time_base*1_000_000) for frame in check.decode(video=0)]
    check.close()
    assert decoded == starts, 'Video encoding changed stereo pair timestamps'
    check = av.open(str(video))
    packets = [(round(p.pts*p.time_base*1_000_000),round(p.duration*p.time_base*1_000_000)) for p in check.demux(video=0) if p.pts is not None]
    check.close()
    assert packets == [(t,durations[t]) for t in starts], 'Video frame durations changed'


def package(input_dir: Path, inference: Path, output: Path):
    source = json.loads((input_dir/'input.json').read_text())
    model = json.loads((inference/'inference.json').read_text())
    assert model['input_manifest_sha256'] == sha(input_dir/'input.json')
    output.mkdir(parents=True, exist_ok=True)
    rows = source['pairs']
    starts = [r['t_sync_us'] for r in rows]
    durations = dict(zip(starts, np.diff(starts+[source['duration_us']]).tolist()))
    video = output/'foundation-stereo-depth.mp4'
    stats = []
    def colors():
        for row in rows:
            stem = f"{row['pair_index']:04d}"
            record = json.loads((inference/f'{stem}.json').read_text())
            assert record['t_sync_us'] == row['t_sync_us']
            assert sha(inference/f'{stem}-depth.png') == record['depth_sha256']
            assert sha(inference/f'{stem}.npz') == record['npz_sha256']
            assert sha(inference/f'{stem}-color.png') == record['color_sha256']
            stats.append(record)
            yield cv2.imread(str(inference/f'{stem}-color.png'))
    encode_video(video, colors(), starts, source['duration_us'], source['width'], source['height'])
    csv_path = output/'foundation-stereo-depth-timestamps.csv'
    with csv_path.open('w') as f:
        writer=csv.DictWriter(f,fieldnames=['frame_index','pair_index','t_sync_us','frame_duration_us','left_frame_index','right_frame_index'])
        writer.writeheader()
        for i,r in enumerate(rows):
            writer.writerow({'frame_index':i,'pair_index':r['pair_index'],'t_sync_us':r['t_sync_us'],
                'frame_duration_us':durations[r['t_sync_us']],'left_frame_index':r['left_frame_index'],'right_frame_index':r['right_frame_index']})
    archive = output/'foundation-stereo-depth-mm.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as z:
        z.write(csv_path,csv_path.name)
        z.writestr('geometry.json',json.dumps(source['geometry'],indent=2))
        z.writestr('README.txt','Estimated stereo depth. 16-bit PNG, millimeters; zero = invalid.\nOriginal pair timestamps; hold each frame until next sample.\nMetric scale uses recorded intrinsics and baseline, without ground-truth validation.\n')
        for row in rows:
            name=f"{row['pair_index']:04d}-depth.png"
            z.write(inference/name,f'depth/{name}')
    manifest = {k:source[k] for k in ('episode_id','duration_us','capture_start_ns','width','height','frame_count','source_sha256','geometry','timeline_policy')}
    manifest.update({'version':1,'source':'foundation_stereo','model':model,
        'video_rendering': {'source': 'inference_color_png', 'overlays': False, 'full_frame': True},
        'quality':{'valid_fraction_min_median': [min(s['valid_fraction'] for s in stats),float(np.median([s['valid_fraction'] for s in stats]))],
            'inference_seconds_total':sum(s['inference_seconds'] for s in stats),
            'maximum_pair_gap_ms':max(durations.values())/1000,
            'limitations':'No depth ground truth; glass, reflections, occlusions and dark surfaces can be unreliable.'}})
    prefix=f"/rerun/episodes/{source['episode_id']}"
    for key,path in [('video',video),('timestamps',csv_path),('depth_archive',archive)]:
        manifest[key]={'path':f'{prefix}/{path.name}','sha256':sha(path),'bytes':path.stat().st_size}
    (output/'foundation-stereo-depth.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (output/'foundation-stereo-frame-statistics.json').write_text(json.dumps(stats,indent=2)+'\n')
    print(json.dumps(manifest,indent=2))


def rebuild_video_from_archive(output: Path):
    """Use saved millimeter depth maps to remove a baked-in footer without a GPU."""
    manifest_path = output/'foundation-stereo-depth.json'
    manifest = json.loads(manifest_path.read_text())
    for name in ('depth_archive', 'timestamps'):
        assert sha(output/Path(manifest[name]['path']).name) == manifest[name]['sha256']
    rows = list(csv.DictReader((output/Path(manifest['timestamps']['path']).name).open()))
    assert len(rows) == manifest['frame_count']
    starts = [int(row['t_sync_us']) for row in rows]
    assert [int(row['frame_duration_us']) for row in rows] == np.diff(starts+[manifest['duration_us']]).tolist()
    stats = {row['pair_index']: row for row in json.loads((output/'foundation-stereo-frame-statistics.json').read_text())}
    near, far = manifest['model']['color_scale_m']
    assert manifest['model']['depth_png_unit_m'] == 0.001
    archive = output/Path(manifest['depth_archive']['path']).name
    def colors():
        with zipfile.ZipFile(archive) as z:
            for row in rows:
                index = int(row['pair_index'])
                data = z.read(f'depth/{index:04d}-depth.png')
                assert hashlib.sha256(data).hexdigest() == stats[index]['depth_sha256']
                assert stats[index]['t_sync_us'] == int(row['t_sync_us'])
                depth_mm = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)
                assert depth_mm.dtype == np.uint16 and depth_mm.shape == (manifest['height'], manifest['width'])
                depth = depth_mm.astype(np.float32) * 0.001
                intensity = np.rint((1-np.clip((depth-near)/(far-near),0,1))*255).astype(np.uint8)
                color = cv2.applyColorMap(intensity, cv2.COLORMAP_TURBO)
                color[depth_mm == 0] = 0
                yield color
    video = output/Path(manifest['video']['path']).name
    temporary = output/'foundation-stereo-depth.clean.tmp.mp4'
    encode_video(temporary, colors(), starts, manifest['duration_us'], manifest['width'], manifest['height'])
    temporary.replace(video)
    manifest['video'].update(sha256=sha(video), bytes=video.stat().st_size)
    manifest['video_rendering'] = {'source': 'archived_16bit_depth_png', 'source_sha256': manifest['depth_archive']['sha256'],
                                   'depth_quantization_m': 0.001, 'overlays': False, 'full_frame': True}
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(f"Rebuilt {len(rows)} clean {manifest['width']}x{manifest['height']} depth frames with unchanged timestamps and durations.")


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input',type=Path)
    p.add_argument('--inference',type=Path)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--from-depth-archive',action='store_true',help='Rebuild just the clean video from an existing depth package')
    a=p.parse_args()
    if a.from_depth_archive:
        if a.input or a.inference:
            p.error('--from-depth-archive uses only --output')
        rebuild_video_from_archive(a.output)
    elif a.input and a.inference:
        package(a.input,a.inference,a.output)
    else:
        p.error('Supply --input and --inference, or --from-depth-archive')
