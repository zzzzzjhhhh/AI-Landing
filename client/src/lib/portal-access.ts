export const protectedPortalRoutePatterns = ["/portal(.*)"] as const;

export const portalVideosPath = "/portal/videos";

const protectedPortalPathRegex = /^\/portal(?:\/.*)?$/;

export function isProtectedPortalPath(pathname: string) {
  return protectedPortalPathRegex.test(pathname);
}
