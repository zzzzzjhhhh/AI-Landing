import test from 'node:test';
import assert from 'node:assert/strict';
import { namedHand21 } from './accepted-movement.mjs';
import { fingerChains } from './pose-retargeting.mjs';

test('hand21 preserves all five independent four-joint finger chains', () => {
  const p = Array.from({ length: 21 }, (_, i) => [i, i + 1, i + 2]);
  const named = namedHand21(p);
  assert.deepEqual(named.Wrist, p[0]);
  Object.values(fingerChains).forEach((chain, f) => {
    for (let k = 1; k <= 4; k++) assert.deepEqual(named[chain[k]], p[f * 4 + k]);
  });
  assert.deepEqual(named.IndexMetacarpal, [2.5, 3.5, 4.5]);
  assert.throws(() => namedHand21(p.slice(1)));
  assert.throws(() => namedHand21(p.map((v, i) => i === 4 ? [NaN, 0, 0] : v)));
});
