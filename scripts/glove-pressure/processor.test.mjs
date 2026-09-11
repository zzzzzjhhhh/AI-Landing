import test from "node:test";
import assert from "node:assert/strict";
import { createPressureProcessor } from "./processor.mjs";
import { simulatedPressure } from "./export-demo.mjs";

const processFrame = await createPressureProcessor();

test("real WASM produces no visible pressure for an unloaded glove", () => {
  assert.deepEqual(processFrame(new Uint8Array(460)), { positions: [], colors: [] });
});

test("rejects malformed frames before crossing the WASM boundary", () => {
  assert.throws(() => processFrame(new Uint8Array(459)), /460/);
  assert.throws(() => processFrame(Array(460).fill(0)), /Uint8Array/);
  assert.throws(() => processFrame(new Uint8Array(460), { stride: 0 }), /options/);
});

test("WASM output is finite, colored and repeatable as pressure changes", () => {
  const first = processFrame(simulatedPressure(0), { stride: 2 });
  const later = processFrame(simulatedPressure(2), { stride: 2 });
  assert.ok(first.positions.length > 100);
  assert.equal(first.positions.length, first.colors.length);
  assert.ok(first.positions.flat().every(Number.isFinite));
  assert.ok(first.colors.flat().every((value) => Number.isInteger(value) && value >= 0 && value <= 255));
  assert.notDeepEqual(first, later);
  assert.deepEqual(processFrame(simulatedPressure(0), { stride: 2 }), first);
});

test("the visibility threshold removes all pressure below it", () => {
  assert.equal(processFrame(new Uint8Array(460).fill(100), { threshold: 256 }).positions.length, 0);
});
