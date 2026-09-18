import type { WebViewer } from "@rerun-io/web-viewer";
import manifest from "../../../public/rerun/right-hand-pressure.json";

export const glovePressureRecording = manifest;
type RecordingAsset = { path: string; sha256: string };
type GaussianSplatRecording = {
  data: RecordingAsset;
  data_parts?: RecordingAsset[];
  blueprint?: RecordingAsset;
  representation?: string;
  source_revision?: string;
};
export type HandRecording = Pick<typeof manifest, "application_id" | "recording_id" | "data" | "blueprint" | "pressure_source"> & {
  duration_ns?: number;
  data_parts?: RecordingAsset[];
  dashboard?: { data: RecordingAsset; blueprint: RecordingAsset };
  gaussian_splat?: GaussianSplatRecording;
  tracking_override?: RecordingAsset;
  movement_hold_override?: RecordingAsset;
  movement_override?: RecordingAsset;
  movement_override_parts?: RecordingAsset[];
  pressure_override?: RecordingAsset;
};

type LoadingCallbacks = {
  onLayoutReady?: () => void;
  onHandsReady?: () => void;
  onGaussianSplatReady?: () => void;
};

/** Load the layout and dashboard independently of the larger hand recording. */
export async function attachGlovePressure(
  viewer: WebViewer,
  signal: AbortSignal,
  recording: HandRecording = manifest,
  callbacks: LoadingCallbacks = {},
  inputChannel?: ReturnType<WebViewer["open_channel"]>,
) {
  const active = () => !signal.aborted && viewer.ready;
  const read = async (asset: RecordingAsset) => {
    const response = await fetch(`${asset.path}?v=${asset.sha256.slice(0, 12)}`, { signal });
    if (!response.ok) throw new Error(`Unable to load the right-hand views (${response.status}).`);
    return response.arrayBuffer();
  };
  const assets = (data: RecordingAsset, parts?: RecordingAsset[]) => parts?.length ? parts : [data];
  const send = (name: string, bytes: Uint8Array) => {
    if (!active()) return;
    const channel = inputChannel ?? viewer.open_channel(name);
    try {
      channel.send_rrd(bytes);
    } finally {
      if (!inputChannel) channel.close();
    }
  };

  // Start all downloads together, but never gate the layout or IMU on hand data.
  const layout = (async () => {
    const [blueprint, dashboard, trackingOverride] = await Promise.all([
      read(recording.gaussian_splat?.blueprint ?? recording.dashboard?.blueprint ?? recording.blueprint),
      recording.dashboard ? read(recording.dashboard.data) : Promise.resolve(null),
      recording.tracking_override ? read(recording.tracking_override) : Promise.resolve(null),
    ]);
    // recording_open fires before the base stream's final embedded blueprint
    // is decoded. Wait for its endpoint and the viewer's next render turn.
    if (recording.duration_ns !== undefined) {
      while (active() && (viewer.get_time_range(recording.recording_id, "tracking_time")?.max ?? -1) < recording.duration_ns) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      if (active()) await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    if (!active()) return;
    if (trackingOverride) send("Reviewed stereo hand tracking", new Uint8Array(trackingOverride));
    if (dashboard) send("Episode dashboard", new Uint8Array(dashboard));
    viewer.set_active_timeline(recording.recording_id, "tracking_time");
    viewer.set_current_time(recording.recording_id, "tracking_time", 0);
    viewer.set_playing(recording.recording_id, true);
    send("Episode layout", new Uint8Array(blueprint));
    callbacks.onLayoutReady?.();
    return blueprint;
  })();
  const hands = (async () => {
    const [buffers, movementHold, pressureOverride, movementOverride] = await Promise.all([
      Promise.all(assets(recording.data, recording.data_parts).map(read)),
      recording.movement_hold_override ? read(recording.movement_hold_override) : Promise.resolve(null),
      recording.pressure_override ? read(recording.pressure_override) : Promise.resolve(null),
      recording.movement_override
        ? Promise.all(assets(recording.movement_override, recording.movement_override_parts).map(read))
          .then(parts => parts.length === 1 ? parts[0] : new Blob(parts).arrayBuffer())
        : Promise.resolve(null),
    ]);
    if (!active()) return;
    const bytes = buffers.length === 1 ? buffers[0] : await new Blob(buffers).arrayBuffer();
    if (!active()) return;
    const blueprint = await layout;
    if (!active()) return;
    send("Right hand pressure and movement", new Uint8Array(bytes));
    if (pressureOverride) send("Reviewed visual Pressure", new Uint8Array(pressureOverride));
    if (movementHold) send("Hold last tracked Movement pose", new Uint8Array(movementHold));
    if (movementOverride) send("Accepted tracking Movement", new Uint8Array(movementOverride));
    // A newly opened data store may reactivate its default blueprint.
    if (blueprint) send("Episode layout", new Uint8Array(blueprint));
    callbacks.onHandsReady?.();
  })();
  const gaussianSplat = (async () => {
    if (!recording.gaussian_splat) return;
    const buffers = await Promise.all(assets(
      recording.gaussian_splat.data,
      recording.gaussian_splat.data_parts,
    ).map(read));
    if (!active()) return;
    const bytes = buffers.length === 1 ? buffers[0] : await new Blob(buffers).arrayBuffer();
    if (!active()) return;
    await layout;
    if (!active()) return;
    send("Dynamic hand Gaussian splats", new Uint8Array(bytes));
    callbacks.onGaussianSplatReady?.();
  })();
  await Promise.all([layout, hands, gaussianSplat]);
}
