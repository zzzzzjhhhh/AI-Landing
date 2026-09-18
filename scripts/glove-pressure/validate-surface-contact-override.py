"""Read the delivered RRD back: unchanged geometry, colors only, exact clock."""
import argparse
import json
import shutil
import tempfile
from pathlib import Path

from rerun.experimental import RrdReader

p = argparse.ArgumentParser()
p.add_argument('--episode-dir', type=Path, required=True)
p.add_argument('--report', type=Path, required=True)
a = p.parse_args()
root = a.episode_dir
meta = json.loads((root / 'right-hand-pressure.json').read_text())
clock = [json.loads(line)['tracking_time_ns'] for line in (root / 'right-hand-pressure-samples.jsonl').read_text().splitlines()]
entity = '/demo/glove_pressure/right'

def meshes(path):
    result = {}
    for chunk in RrdReader(path).store().stream().to_chunks():
        if chunk.is_static and str(chunk.entity_path).startswith(entity + '/mesh/'):
            batch = chunk.to_record_batch()
            for name in ['Mesh3D:vertex_positions', 'Mesh3D:vertex_normals', 'Mesh3D:triangle_indices']:
                if name in batch.schema.names:
                    result[(str(chunk.entity_path), name)] = batch[name][0].as_py()
    return result

with tempfile.TemporaryDirectory(prefix='pressure-surface-validation-') as directory:
    baseline = Path(directory) / 'base.rrd'
    # Local multipart RRD reconstruction only, never modifies the source parts.
    with baseline.open('wb') as output:
        for part in meta['data_parts']:
            with (root / Path(part['path']).name).open('rb') as source:
                shutil.copyfileobj(source, output)
    original = meshes(baseline)
overlay = root / 'visual-pressure-v4-surface.rrd'
assert original and original == meshes(overlay), 'Original mesh geometry or normals changed'
colors, clears = {}, []
for chunk in RrdReader(overlay).store().stream().to_chunks():
    path = str(chunk.entity_path)
    batch = chunk.to_record_batch()
    names = batch.schema.names
    if chunk.is_static:
        continue
    times = batch['tracking_time'].cast('int64').to_pylist()
    captures = batch['capture_time'].cast('int64').to_pylist()
    assert captures == [meta['capture_start_ns'] + t for t in times]
    if path.startswith(entity + '/mesh/'):
        assert 'Mesh3D:vertex_colors' in names
        assert not any(n in names for n in ['Mesh3D:vertex_positions', 'Mesh3D:vertex_normals', 'Mesh3D:triangle_indices'])
        entries = colors.setdefault(path, [])
        expected = len(original[(path, 'Mesh3D:vertex_positions')])
        for t, values in zip(times, batch['Mesh3D:vertex_colors'].to_pylist()):
            assert len(values) == expected
            entries.append(t)
    if path == entity + '/pressure':
        assert 'Clear:is_recursive' in names and 'Points3D:positions' not in names
        clears.extend(times)
assert sorted(clears) == clock
assert colors and all(sorted(times) == clock for times in colors.values())
report = {'geometry_identical_to_original_rrd': True, 'dynamic_geometry_rows': 0,
          'pressure_points_rows': 0, 'old_pressure_cleared_at_all_frames': True,
          'clock_frames': len(clock), 'clock_end_ns': clock[-1], 'mesh_parts': len(colors),
          'vertices': sum(len(v) for (path, name), v in original.items() if name == 'Mesh3D:vertex_positions')}
a.report.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
