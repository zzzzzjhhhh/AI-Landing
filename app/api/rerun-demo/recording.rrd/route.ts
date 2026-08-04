const RERUN_BLOB_URL =
  "https://gokkyjese0fmbgo6.private.blob.vercel-storage.com/rerun/examples/pico-8046-stereo-4446591c.rrd";

const REQUEST_HEADERS = ["if-modified-since", "if-none-match", "range"] as const;
const RESPONSE_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
] as const;

async function proxyRecording(request: Request, method: "GET" | "HEAD") {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response("Rerun demo storage is not configured.", { status: 503 });
  }

  const requestHeaders = new Headers({
    Authorization: `Bearer ${token}`,
  });

  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  const upstream = await fetch(RERUN_BLOB_URL, {
    method,
    headers: requestHeaders,
    cache: "no-store",
  });

  const responseHeaders = new Headers({
    "Cache-Control": "public, max-age=3600, must-revalidate",
    "Content-Disposition": 'inline; filename="pico-8046-stereo-demo.rrd"',
    "X-Content-Type-Options": "nosniff",
  });

  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return proxyRecording(request, "GET");
}

export function HEAD(request: Request) {
  return proxyRecording(request, "HEAD");
}
