"use client";

import { useEffect, useRef, useState } from "react";
import type { WebViewer } from "@rerun-io/web-viewer";
import { attachGlovePressure } from "@/lib/glove-pressure-recording";
import type { SampleEpisode } from "@/lib/sample-episodes";

export function RerunDemoViewer({ episode }: { episode: SampleEpisode }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pressureError, setPressureError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // All Rerun panels share one canvas. Capture wheel input before the viewer
    // pans/zooms it, while leaving the browser's normal page scrolling intact.
    const keepWheelForPage = (event: WheelEvent) => event.stopPropagation();
    host.addEventListener("wheel", keepWheelForPage, { capture: true, passive: true });

    let cancelled = false;
    let viewer: WebViewer | null = null;
    let pressureStarted = false;
    const controller = new AbortController();

    async function mountViewer() {
      const rerun = await import("@rerun-io/web-viewer");
      if (cancelled) return;

      viewer = new rerun.WebViewer();
      viewer.on("recording_open", (event) => {
        viewer?.override_panel_state("top", "hidden");
        viewer?.override_panel_state("blueprint", "hidden");
        viewer?.override_panel_state("selection", "hidden");
        if (!cancelled) setReady(true);
        if (cancelled || pressureStarted || !viewer) return;
        pressureStarted = true;
        if (event.recording_id !== episode.hands.recording_id || event.application_id !== episode.hands.application_id) {
          setPressureError("The right-hand views need to be regenerated for this episode.");
          return;
        }
        attachGlovePressure(viewer, controller.signal, episode.hands).catch((cause) => {
          if (!cancelled) setPressureError(cause instanceof Error ? cause.message : "Unable to load the right-hand views.");
        });
      });

      await viewer.start(
        new URL(episode.recordingUrl, window.location.origin).toString(),
        host,
        {
          height: "100%",
          hide_welcome_screen: true,
          render_backend: "webgl",
          theme: "dark",
          width: "100%",
        },
        { follow_if_http: false },
      );

      viewer.override_panel_state("top", "hidden");
      viewer.override_panel_state("blueprint", "hidden");
      viewer.override_panel_state("selection", "hidden");

    }

    mountViewer().catch((cause) => {
      if (cancelled) return;
      setError(cause instanceof Error ? cause.message : "Unable to load the Rerun recording.");
    });

    return () => {
      cancelled = true;
      host.removeEventListener("wheel", keepWheelForPage, true);
      controller.abort();
      viewer?.stop();
    };
  }, [episode]);

  return (
    <div className="relative h-full min-h-0 bg-[#090b10]">
      <div
        ref={hostRef}
        className="!absolute inset-0 overflow-hidden [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full"
      />

      {pressureError && !error ? (
        <div role="status" className="absolute left-3 right-3 top-3 rounded border border-amber-300/20 bg-[#17150e]/95 px-4 py-2 text-sm text-amber-100">
          {pressureError} Video replay is still available.
        </div>
      ) : null}

      {!ready && !error ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#090b10]">
          <div className="flex items-center gap-3 text-sm text-white/65">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
            Loading episode {episode.id}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-[#090b10] p-6 text-center">
          <p className="max-w-md text-sm leading-6 text-red-200">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
