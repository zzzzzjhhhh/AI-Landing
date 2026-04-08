import assert from "node:assert/strict";
import test from "node:test";
import {
  isProtectedPortalPath,
  protectedPortalRoutePatterns,
} from "./portal-access";

test("portal paths are protected while auth pages remain public", () => {
  assert.deepEqual(protectedPortalRoutePatterns, ["/portal(.*)"]);
  assert.equal(isProtectedPortalPath("/portal/videos"), true);
  assert.equal(isProtectedPortalPath("/portal/videos/demo-001"), true);
  assert.equal(isProtectedPortalPath("/sign-in"), false);
  assert.equal(isProtectedPortalPath("/"), false);
});
