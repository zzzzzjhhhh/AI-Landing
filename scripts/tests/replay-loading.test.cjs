const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('client/src/lib/glove-pressure-recording.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('require', 'module', 'exports', compiled)(() => ({}), mod, mod.exports);
const { attachGlovePressure } = mod.exports;
const asset = path => ({ path, sha256: '123456789012' });
const recording = { recording_id: 'episode', data: asset('/hands'), blueprint: asset('/fallback'), dashboard: { data: asset('/dashboard'), blueprint: asset('/layout') }, data_parts: [asset('/part0'), asset('/part1')] };
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const sent = [], pending = new Map(), callbacks = [];
  const originalFetch = global.fetch;
  global.fetch = url => new Promise(resolve => pending.set(url.split('?')[0], bytes => resolve({ ok: true, arrayBuffer: async () => Uint8Array.from(bytes).buffer })));
  const viewer = { ready: true, set_active_timeline() {}, set_current_time() {}, set_playing() {}, open_channel(name) { return { send_rrd(bytes) { sent.push([name, [...bytes]]); }, close() {} }; } };
  return { sent, pending, callbacks, viewer, restore: () => { global.fetch = originalFetch; } };
}
test('layout and dashboard become visible while hand parts are delayed; parts retain order', async () => {
  const f = fixture();
  try {
    const work = attachGlovePressure(f.viewer, new AbortController().signal, recording, { onLayoutReady: () => f.callbacks.push('layout'), onHandsReady: () => f.callbacks.push('hands') });
    f.pending.get('/layout')([1]); f.pending.get('/dashboard')([2]);
    await tick();
    assert.deepEqual(f.callbacks, ['layout']);
    assert.equal(f.sent.length, 2);
    f.pending.get('/part1')([5, 6]); await tick();
    assert.equal(f.sent.length, 2);
    f.pending.get('/part0')([3, 4]); await work;
    assert.deepEqual(f.sent[2][1], [3, 4, 5, 6]);
    assert.deepEqual(f.callbacks, ['layout', 'hands']);
  } finally { f.restore(); }
});
test('cancelled episode cannot send late data or update loading state', async () => {
  const f = fixture(), controller = new AbortController();
  try {
    const work = attachGlovePressure(f.viewer, controller.signal, recording, { onLayoutReady: () => f.callbacks.push('layout'), onHandsReady: () => f.callbacks.push('hands') });
    controller.abort();
    for (const resolve of f.pending.values()) resolve([1]);
    await work;
    assert.deepEqual(f.sent, []); assert.deepEqual(f.callbacks, []);
  } finally { f.restore(); }
});

test('waits for base endpoint and render turns before applying supplemental layout', async () => {
  const f = fixture(), originalRaf = global.requestAnimationFrame;
  const frames = [];
  global.requestAnimationFrame = callback => frames.push(callback);
  let max = 0;
  f.viewer.get_time_range = () => ({ min: 0, max });
  try {
    const work = attachGlovePressure(f.viewer, new AbortController().signal, { ...recording, duration_ns: 100 });
    f.pending.get('/layout')([1]); f.pending.get('/dashboard')([2]);
    await tick(); assert.equal(f.sent.length, 0);
    max = 100;
    for (let i = 0; i < 3; i++) { frames.shift()(); await tick(); }
    assert.equal(f.sent.length, 2);
    f.pending.get('/part0')([3]); f.pending.get('/part1')([4]); await work;
    assert.deepEqual(f.sent.at(-1), ['Episode layout', [1]]);
  } finally { f.restore(); global.requestAnimationFrame = originalRaf; }
});

test('Gaussian parts use the upgraded blueprint and retain byte order', async () => {
  const f = fixture();
  const withGaussian = {
    ...recording,
    gaussian_splat: {
      data: asset('/gaussian-complete'),
      data_parts: [asset('/gaussian-part0'), asset('/gaussian-part1')],
      blueprint: asset('/gaussian-layout'),
    },
  };
  try {
    const work = attachGlovePressure(f.viewer, new AbortController().signal, withGaussian, {
      onLayoutReady: () => f.callbacks.push('layout'),
      onHandsReady: () => f.callbacks.push('hands'),
      onGaussianSplatReady: () => f.callbacks.push('gaussian'),
    });
    assert.equal(f.pending.has('/layout'), false);
    f.pending.get('/gaussian-layout')([1]);
    f.pending.get('/dashboard')([2]);
    await tick();
    f.pending.get('/gaussian-part1')([8, 9]);
    f.pending.get('/gaussian-part0')([6, 7]);
    f.pending.get('/part0')([3]);
    f.pending.get('/part1')([4]);
    await work;
    assert.deepEqual(f.sent.find(([name]) => name === 'Dynamic hand Gaussian splats'), [
      'Dynamic hand Gaussian splats', [6, 7, 8, 9],
    ]);
    assert.equal(f.sent.filter(([name, bytes]) => name === 'Episode layout' && bytes[0] === 1).length >= 1, true);
    assert.deepEqual(new Set(f.callbacks), new Set(['layout', 'hands', 'gaussian']));
  } finally { f.restore(); }
});
