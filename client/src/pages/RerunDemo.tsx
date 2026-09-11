"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RerunDemoViewer } from "@/components/RerunDemoViewer";
import { sampleEpisodes } from "@/lib/sample-episodes";

export default function RerunDemo() {
  const episode = sampleEpisodes.find((item) => item.id === "20260910_153529")!;
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />

      <main className="px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <section className="mx-auto w-full max-w-[1540px]">
          <div className="mb-6">
            <span className="inline-block rounded-md border border-cyan-200/50 bg-cyan-200/10 px-3 py-2 text-xs font-medium text-cyan-100">
              {episode.label}
            </span>
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
