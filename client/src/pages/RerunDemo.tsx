"use client";

import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RerunDemoViewer } from "@/components/RerunDemoViewer";
import { sampleEpisodes } from "@/lib/sample-episodes";

const visibleEpisodes = sampleEpisodes.filter((episode) =>
  ["20260911_170529", "20260911_165650", "20260911_155825", "20260910_153529"].includes(episode.id),
);

export default function RerunDemo() {
  const [episodeId, setEpisodeId] = useState("20260911_170529");
  const episode = visibleEpisodes.find((item) => item.id === episodeId)!;
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />

      <main className="px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <section className="mx-auto w-full max-w-[1540px]">
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Sample episode">
            {visibleEpisodes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === episodeId}
                onClick={() => setEpisodeId(item.id)}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 ${
                  item.id === episodeId
                    ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-100"
                    : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="h-[min(88vh,1000px)] min-h-[640px] overflow-hidden rounded-md border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:min-h-[760px]">
            <RerunDemoViewer key={episode.id} episode={episode} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
