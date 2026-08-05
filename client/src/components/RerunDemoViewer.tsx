"use client";

import { useEffect, useRef, useState } from "react";
import type { WebViewer } from "@rerun-io/web-viewer";

export function RerunDemoViewer() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let viewer: WebViewer | null = null;

    async function mountViewer() {
      const host = hostRef.current;
      if (!host) return;

      const rerun = await import("@rerun-io/web-viewer");
      if (cancelled) return;

      viewer = new rerun.WebViewer();
      viewer.on("recording_open", () => {
        viewer?.override_panel_state("top", "hidden");
        viewer?.override_panel_state("blueprint", "hidden");
        viewer?.override_panel_state("selection", "hidden");
        if (!cancelled) setReady(true);
      });

      await viewer.start(
        new URL("/api/rerun-demo/recording.rrd?v=06fc8260", window.location.origin).toString(),
        host,
        {
          height: "100%",
          hide_welcome_screen: true,
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
      viewer?.stop();
    };
  }, []);

  return (
    <div className="relative h-full min-h-0 bg-[#090b10]">
      <div
        ref={hostRef}
        className="absolute inset-0 overflow-hidden [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full"
      />

      {!ready && !error ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#090b10]">
          <div className="flex items-center gap-3 text-sm text-white/65">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
            Loading episode 20260803_133948
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
