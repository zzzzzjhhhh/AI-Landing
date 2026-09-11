"""Run the official FoundationStereo checkpoint once per recorded stereo pair on CUDA."""
from __future__ import annotations
import argparse
import collections
import codecs
import hashlib
import json
import os
from pathlib import Path
import sys
import time
import typing


def sha(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def main(args):
    import cv2
    import numpy as np
    import torch
    import timm
    import omegaconf
    from omegaconf import OmegaConf
    from omegaconf.base import ContainerMetadata, Metadata
    from omegaconf.nodes import AnyNode
    sys.path.insert(0, str(args.repo.resolve()))
    from core.foundation_stereo import FoundationStereo
    from core.utils.utils import InputPadder
    assert torch.cuda.is_available(), 'This pipeline requires the authorized CUDA GPU'
    assert sha(args.checkpoint) == args.checkpoint_sha256, 'Checkpoint hash mismatch'
    data = json.loads((args.input / 'input.json').read_text())
    cfg = OmegaConf.load(args.checkpoint.parent / 'cfg.yaml')
    cfg.vit_size = cfg.get('vit_size', 'vitl')
    cfg.valid_iters = args.iters
    torch.manual_seed(0)
    np.random.seed(0)
    torch.set_grad_enabled(False)
    # The full stereo checkpoint supplies every encoder weight. Skip the redundant
    # EdgeNeXt initial download, then require an exact complete state-dict match.
    create_model = timm.create_model
    def create_without_download(*a, **kw):
        kw['pretrained'] = False
        return create_model(*a, **kw)
    timm.create_model = create_without_download
    try:
        model = FoundationStereo(cfg)
    finally:
        timm.create_model = create_model
    # The released training checkpoint contains OmegaConf metadata. Keep PyTorch's
    # restricted unpickler and allow only the known metadata container types.
    torch.serialization.add_safe_globals([omegaconf.DictConfig, omegaconf.ListConfig,
        ContainerMetadata, Metadata, AnyNode, typing.Any, dict, list, int,
        collections.defaultdict, np.core.multiarray.scalar, np.dtype, type(np.dtype('float64')), codecs.encode])
    if args.checkpoint.suffix == '.safetensors':
        from safetensors.torch import load_file
        state = load_file(str(args.checkpoint), device='cpu')
    else:
        state = torch.load(args.checkpoint, map_location='cpu', weights_only=True)['model']
    model.load_state_dict(state, strict=True)
    del state
    model.cuda().eval()
    args.output.mkdir(parents=True, exist_ok=True)
    metadata = {'model': 'NVlabs/FoundationStereo', 'model_variant': cfg.vit_size,
        'source_commit': args.source_commit, 'checkpoint_sha256': args.checkpoint_sha256,
        'checkpoint_source': args.checkpoint_source,
        'source_checkpoint_sha256': args.source_checkpoint_sha256 or args.checkpoint_sha256,
        'config_sha256': sha(args.checkpoint.parent/'cfg.yaml'),
        'input_manifest_sha256': sha(args.input/'input.json'), 'valid_iters': args.iters,
        'mixed_precision': True, 'gpu': torch.cuda.get_device_name(0),
        'torch': torch.__version__, 'cuda': torch.version.cuda,
        'input_width': data['width'], 'input_height': data['height'],
        'state_dict_load': 'strict, all parameters supplied by checkpoint',
        'depth_type': 'stereo model estimate, not measured ground truth',
        'invalid_policy': 'Nonfinite/nonpositive disparity, outside right image, or depth outside 0.1–20 m => zero.',
        'color_scale_m': [0.2, 3.0], 'color_map': 'TURBO, red near / blue far; black invalid',
        'depth_png_unit_m': 0.001}
    previous = args.output/'inference.json'
    if previous.exists() and json.loads(previous.read_text()) != metadata:
        raise ValueError('Output contains a different input/model/configuration; use a new output directory')
    previous.write_text(json.dumps(metadata, indent=2)+'\n')
    selected = set(args.pairs) if args.pairs else None
    stats = []
    for row in data['pairs']:
        i = row['pair_index']
        if selected is not None and i not in selected:
            continue
        stem = f'{i:04d}'
        record_path = args.output/f'{stem}.json'
        if record_path.exists() and all((args.output/f'{stem}{suffix}').exists() for suffix in ('-depth.png', '-color.png', '.npz')):
            stats.append(json.loads(record_path.read_text()))
            continue
        images = [cv2.cvtColor(cv2.imread(str(args.input/s/f'{stem}.png')), cv2.COLOR_BGR2RGB) for s in ('left','right')]
        tensors = [torch.from_numpy(im).cuda().float().permute(2,0,1)[None] for im in images]
        padder = InputPadder(tensors[0].shape, divis_by=32, force_square=False)
        left, right = padder.pad(*tensors)
        torch.cuda.synchronize()
        started = time.perf_counter()
        with torch.inference_mode(), torch.cuda.amp.autocast(True):
            disparity = model.forward(left, right, iters=args.iters, test_mode=True)
        disparity = padder.unpad(disparity.float()).cpu().numpy().reshape(data['height'], data['width'])
        elapsed = time.perf_counter()-started
        factor = data['geometry']['P1'][0][0] * data['geometry']['baseline_m']
        depth = factor / np.maximum(disparity, 1e-6)
        x = np.arange(data['width'])[None, :]
        valid = np.isfinite(disparity) & (disparity > 0) & (x-disparity >= 0) & (depth >= .1) & (depth <= 20)
        depth[~valid] = 0
        depth_mm = np.rint(depth*1000).astype(np.uint16)
        color = cv2.applyColorMap(np.rint((1-np.clip((depth-.2)/2.8, 0, 1))*255).astype(np.uint8), cv2.COLORMAP_TURBO)
        color[~valid] = 0
        np.savez_compressed(args.output/f'{stem}.npz', disparity_px=disparity, depth_m=depth.astype(np.float32), valid=valid)
        assert cv2.imwrite(str(args.output/f'{stem}-depth.png'), depth_mm)
        assert cv2.imwrite(str(args.output/f'{stem}-color.png'), color)
        record = {'pair_index': i, 't_sync_us': row['t_sync_us'], 'inference_seconds': elapsed,
            'valid_fraction': float(valid.mean()), 'depth_p05_p50_p95_m': np.percentile(depth[valid], [5,50,95]).tolist(),
            'peak_gpu_memory_bytes': torch.cuda.max_memory_allocated(),
            'depth_sha256': sha(args.output/f'{stem}-depth.png'), 'npz_sha256': sha(args.output/f'{stem}.npz'),
            'color_sha256': sha(args.output/f'{stem}-color.png')}
        record_path.write_text(json.dumps(record)+'\n')
        stats.append(record)
        print(json.dumps(record), flush=True)
    (args.output/'frames.json').write_text(json.dumps(stats, indent=2)+'\n')
    print(f'Finished {len(stats)} stereo pairs', flush=True)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo', type=Path, required=True)
    p.add_argument('--checkpoint', type=Path, required=True)
    p.add_argument('--checkpoint-sha256', required=True)
    p.add_argument('--checkpoint-source', required=True)
    p.add_argument('--source-checkpoint-sha256')
    p.add_argument('--source-commit', required=True)
    p.add_argument('--input', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--iters', type=int, default=32)
    p.add_argument('--pairs', type=int, nargs='*')
    main(p.parse_args())
