import assert from "node:assert/strict";
import test from "node:test";
import { videoCollections } from "./video-portal-data";

test("video portal collections expose presentable demo metadata", () => {
  assert.equal(videoCollections.length, 1);
  assert.equal(videoCollections[0]?.title, "Egocentric Demo");
  assert.equal(videoCollections[0]?.items.length, 41);

  for (const collection of videoCollections) {
    assert.ok(collection.title.length > 0);
    assert.ok(collection.items.length > 0);

    for (const item of collection.items) {
      assert.ok(item.id.length > 0);
      assert.ok(item.title.length > 0);
      assert.match(item.videoUrl, /^\/videos\/egocentric-demo\//);
    }
  }
});
