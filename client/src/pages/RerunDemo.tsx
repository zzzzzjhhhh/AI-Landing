"use client";

import { Activity, Camera, Hand } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RerunDemoViewer } from "@/components/RerunDemoViewer";

const episodeFacts = [
  { icon: Camera, label: "Left + right RGB" },
  { icon: Hand, label: "Hand pose" },
  { icon: Activity, label: "1m 30.5s" },
];

export default function RerunDemo() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />

      <main className="px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <section className="mx-auto w-full max-w-[1540px]">
          <div className="mb-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-cyan-200/70">
                Episode 20260803_133948
              </p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Stereo PICO replay
              </h1>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 border-l border-cyan-200/20 pl-4">
              {episodeFacts.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-sm text-white/70">
                  <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-[min(74vh,820px)] min-h-[560px] overflow-hidden rounded-md border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:min-h-[640px]">
            <RerunDemoViewer />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
