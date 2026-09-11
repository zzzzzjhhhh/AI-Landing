import type { WebViewer } from "@rerun-io/web-viewer";
import manifest from "../../../public/rerun/right-hand-pressure.json";

export const glovePressureRecording = manifest;
type RecordingAsset = { path: string; sha256: string };
export type HandRecording = Pick<typeof manifest, "application_id" | "recording_id" | "data" | "blueprint" | "pressure_source"> & {
  dashboard?: { data: RecordingAsset; blueprint: RecordingAsset };
};

/** Feed labeled pressure estimates/demos and pose-derived flexion into Rerun. */
export async function attachGlovePressure(viewer: WebViewer, signal: AbortSignal, recording: HandRecording = manifest) {
  const assets = recording.dashboard
    ? [recording.data, recording.dashboard.data, recording.dashboard.blueprint]
    : [recording.data, recording.blueprint];
  const bytes = await Promise.all(
    assets.map(async (asset) => {
      const response = await fetch(`${asset.path}?v=${asset.sha256.slice(0, 12)}`, { signal });
      if (!response.ok) throw new Error(`Unable to load the right-hand views (${response.status}).`);
      return new Uint8Array(await response.arrayBuffer());
    }),
  );
  if (signal.aborted || !viewer.ready) return;

  const pressureLabel = recording.pressure_source === "video_pose_estimate" ? "ESTIMATED" : "DEMO";
  const channel = viewer.open_channel(`Right hand pressure · ${pressureLabel} / flexion · POSE`);
  try {
    // Matching application/recording IDs merge these entities into the original episode.
    // Send the explicit layout last so the viewer shows both native 3D panels.
    for (const data of bytes) channel.send_rrd(data);
  } finally {
    channel.close();
  }
  viewer.set_active_timeline(recording.recording_id, "tracking_time");
}
