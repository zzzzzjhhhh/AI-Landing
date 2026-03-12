"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const engineVideos = [
  "/videos/engine/1.mp4",
  "/videos/engine/2.mp4",
  "/videos/engine/3.mp4",
  "/videos/engine/4.mp4",
  "/videos/engine/5.mp4",
  "/videos/engine/6.mp4",
  "/videos/engine/7.mp4",
  "/videos/engine/8.mp4",
  "/videos/engine/seq0.mp4",
  "/videos/engine/seq1.mp4",
  "/videos/engine/seq2.mp4",
  "/videos/engine/seq3.mp4",
  "/videos/engine/seq4.mp4",
];



function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const phase1Columns = [
  { videoIndices: [0, 8, 3, 10], speed: 18 },
  { videoIndices: [9, 2, 6, 11], speed: 20 },
  { videoIndices: [4, 12, 1, 7], speed: 16 },
  { videoIndices: [10, 5, 8, 3], speed: 19 },
];

const phase2Columns = [
  { videoIndices: [0, 8, 3, 10], speed: 18 },
  { videoIndices: [9, 2, 6, 11], speed: 20 },
  { videoIndices: [4, 12, 1, 7], speed: 16 },
  { videoIndices: [10, 5, 8, 3], speed: 19 },
  { videoIndices: [1, 11, 5, 9], speed: 17 },
  { videoIndices: [6, 0, 12, 4], speed: 21 },
  { videoIndices: [3, 7, 10, 2], speed: 15 },
  { videoIndices: [8, 4, 0, 11], speed: 18 },
];

const phase3Columns = [
  { videoIndices: [0, 8, 3], speed: 18 },
  { videoIndices: [9, 2, 6], speed: 20 },
  { videoIndices: [4, 12, 1], speed: 16 },
  { videoIndices: [10, 5, 8], speed: 19 },
  { videoIndices: [1, 11, 5], speed: 17 },
  { videoIndices: [6, 0, 12], speed: 21 },
  { videoIndices: [3, 7, 10], speed: 15 },
  { videoIndices: [8, 4, 0], speed: 18 },
  { videoIndices: [2, 9, 7], speed: 20 },
  { videoIndices: [11, 3, 5], speed: 16 },
  { videoIndices: [7, 1, 9], speed: 19 },
  { videoIndices: [12, 6, 2], speed: 17 },
];

function ScrollVideoColumn({ videoIndices, speed, colWidth, gap }: { videoIndices: number[]; speed: number; colWidth: number; gap: number }) {
  return (
    <div className="flex-shrink-0 overflow-hidden h-full" style={{ width: colWidth }}>
      <div
        className="marquee-track-vertical flex flex-col"
        style={{
          animationDuration: `${speed}s`,
          gap: gap,
        }}
      >
        {[0, 1].map((setIdx) => (
          <div key={setIdx} className="flex flex-col flex-shrink-0" style={{ gap: gap }}>
            {videoIndices.map((vi, i) => (
              <div key={`${setIdx}-${i}`} className="flex-shrink-0 overflow-hidden rounded-lg">
                <video
                  src={engineVideos[vi]}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollPhase, setScrollPhase] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrolled = -rect.top;
      const viewportHeight = window.innerHeight;
      const progress = scrolled / (sectionHeight - viewportHeight);

      if (progress < 0.33) {
        setScrollPhase(0);
      } else if (progress < 0.66) {
        setScrollPhase(1);
      } else {
        setScrollPhase(2);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeColumns = scrollPhase === 0 ? phase1Columns : scrollPhase === 1 ? phase2Columns : phase3Columns;
  const colWidth = scrollPhase === 0 ? 200 : scrollPhase === 1 ? 120 : 80;
  const colGap = scrollPhase === 0 ? 80 : scrollPhase === 1 ? 24 : 12;
  const videoGap = scrollPhase === 0 ? 300 : scrollPhase === 1 ? 100 : 40;
  const titleOpacity = scrollPhase === 0 ? 1 : 0;

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 40%, #0d1b2a 0%, #09111d 40%, #060d15 100%)" }}>
        <div
          className="absolute inset-0 z-0 flex flex-row items-center justify-center transition-all duration-700 ease-out"
          style={{ gap: colGap, padding: "0 24px" }}
        >
          {activeColumns.map((col, i) => (
            <ScrollVideoColumn
              key={`${scrollPhase}-${i}`}
              videoIndices={col.videoIndices}
              speed={col.speed}
              colWidth={colWidth}
              gap={videoGap}
            />
          ))}
        </div>

        <div
          className="relative z-10 flex flex-col items-center justify-center h-full transition-opacity duration-500"
          style={{ opacity: titleOpacity }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="sm:text-[48px] md:text-[72px] font-display font-medium tracking-tight bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text text-transparent max-w-4xl text-center mx-auto px-12 md:px-24 text-[130px]"
            data-testid="text-engine-heading"
          >
            Data Engine
          </motion.h1>
        </div>
      </div>
    </section>
  );
}


const processSteps = [
  {
    step: "01",
    title: "Capture",
    body: "We deploy trained annotators into the environments that matter most to the model. Each session is planned around the objects, actions, and interaction types a client needs their system to learn.",
  },
  {
    step: "02",
    title: "Structure",
    body: "We map objects, surfaces, actions, and spatial relationships using protocols built specifically for robotics. The goal is not just scene labeling, but usable structure for physical-world learning.",
  },
  {
    step: "03",
    title: "Validate",
    body: "Each dataset goes through multi-pass review to check consistency across annotators, environments, and failure-prone cases. Because repeated annotation errors become repeated system failures.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "Outputs are delivered in model-ready formats, aligned to client specifications and training requirements. Clean, documented, and ready to integrate into the pipeline.",
  },
];

function StepContent({ step }: { step: typeof processSteps[0] }) {
  return (
    <div>
      <span
        className="text-[32px] font-extralight leading-none tracking-tighter block mb-3"
        style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.4}}
      >
        {step.step}
      </span>
      <div className="w-8 h-px bg-white/20 mb-4" />
      <h3 className="text-white text-lg font-display font-medium tracking-tight mb-2">{step.title}</h3>
      <p className="text-white/45 text-sm leading-relaxed font-light">{step.body}</p>
    </div>
  );
}

/* Dashed vertical line rendered via repeating SVG pattern */
function DashedLine({ height = 64 }: { height?: number }) {
  return (
    <svg width="1" height={height} viewBox={`0 0 1 ${height}`} className="mx-auto block">
      <line x1="0.5" y1="0" x2="0.5" y2={height} stroke="rgba(139,218,239,0.35)" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}

function ProcessSteps() {
  return (
    <section id="how-it-works" className="bg-navy-950 py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="mb-10 text-left">
          <p className="text-[#8bdaef] text-xs uppercase tracking-[0.2em] font-medium">How it works</p>
        </div>

        {/* Top steps: 01 and 02 — dashed line departs FROM the divider bar */}
        <div className="grid grid-cols-2 gap-16">
          {processSteps.slice(0, 2).map((step, i) => (
            <FadeInSection key={step.step} delay={i * 0.1}>
              <div data-testid={`process-step-${step.step}`} className="flex flex-col">
                <span
                  className="text-[32px] font-extralight leading-none tracking-tighter block mb-3"
                  style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.4}}
                >
                  {step.step}
                </span>
                <h3 className="text-white text-lg font-display font-medium tracking-tight mb-2">{step.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed font-light mb-6 mr-[80px]">{step.body}</p>
                {/* Divider bar connects directly into dashed line */}
                <div className="flex items-center gap-0 mb-0">
                  <div className="w-8 h-px bg-white/30" />
                </div>
                <div className="flex justify-start">
                  <DashedLine height={52} />
                </div>
                {/* Node circle sitting on video top border */}
                <div className="flex justify-start -mb-[6px]">
                  <div className="w-3 h-3 rounded-full border border-white/40 bg-navy-950" />
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* Video */}
        <div className="w-full rounded-2xl overflow-hidden border border-white/[0.1]" style={{maxHeight: "60vh"}}>
          <video
            src="/videos/apple_video.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full object-cover"
            style={{maxHeight: "60vh"}}
          />
        </div>

        {/* Bottom steps: 03 and 04 — node on video border → dashed line → divider bar → content */}
        <div className="grid grid-cols-2 gap-16">
          {processSteps.slice(2, 4).map((step, i) => (
            <FadeInSection key={step.step} delay={i * 0.1}>
              <div data-testid={`process-step-${step.step}`} className="flex flex-col">
                {/* Node circle sitting on video bottom border */}
                <div className="flex justify-start -mt-[6px]">
                  <div className="w-3 h-3 rounded-full border border-white/40 bg-navy-950" />
                </div>
                {/* Dashed line going down to content */}
                <div className="flex justify-start">
                  <DashedLine height={52} />
                </div>
                {/* Divider bar — terminus of dashed line, same left alignment */}
                <div className="flex items-center mb-3">
                  <div className="w-8 h-px bg-white/30" />
                </div>
                <span
                  className="text-[32px] font-extralight leading-none tracking-tighter block mb-3"
                  style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.4}}
                >
                  {step.step}
                </span>
                <h3 className="text-white text-lg font-display font-medium tracking-tight mb-2">{step.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed font-light">{step.body}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

const capabilities = [
  {
    label: "Object recognition & spatial mapping",
    description: "3D object identification, size, position, surface properties, and physical relationships within a scene.",
    video: "/videos/spoon.mp4",
  },
  {
    label: "Manipulation & grasping",
    description: "How humans pick up, move, and place objects; hand positioning, grip type, force signals.",
    video: "/videos/grasping.mp4",
  },
  {
    label: "Environment diversity",
    description: "Kitchens, workshops, warehouses, public spaces, and custom environments on request.",
    video: "/videos/environment.mp4",
  },
  {
    label: "Edge cases & failure modes",
    description: "Cluttered scenes, poor lighting, ambiguous objects, interruptions and recovery actions.",
    video: "/videos/edge_cases.mp4",
  },
];


function CapabilitiesSection() {
  return (
    <section className="relative py-28 md:py-36 bg-navy-950">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
        <FadeInSection>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-white font-medium tracking-tight leading-tight text-center max-w-4xl mx-auto mb-6">
            Rich data for the full complexity of physical space.
          </h2>
          <p className="text-white/50 text-center text-lg md:text-xl font-light mb-16">
            Watch what we capture.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {capabilities.map((cap, i) => (
            <FadeInSection key={cap.label}>
              <div data-testid={`card-capability-${i}`}>
                <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-[#0d1b2a] to-[#1a2d42] border border-white/[0.08] flex items-center justify-center mb-5 overflow-hidden">
                  {cap.video ? (
                    <video src={cap.video} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/20 text-sm font-light">Video placeholder</span>
                  )}
                </div>
                <h3 className="text-[#8bdaef] text-base md:text-lg font-display font-medium mb-2">
                  {cap.label}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed font-light">
                  {cap.description}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>

      </div>
    </section>
  );
}

export default function DataEngine() {
  return (
    <div className="bg-navy-950 min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />


      {/* INTRO TEXT SECTION */}
      <section className="bg-navy-950 pt-[100px] pb-[100px] text-center">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-[#8bdaef] mb-6 max-w-4xl">
              Built to generate training data for the complexity of physical space
            </h2>
            <div className="mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.25)", maxWidth: "100%" }} />
            <p className="font-normal text-[#ffffffdb] text-[18px] leading-relaxed max-w-3xl">
              Oceanveo's Data Engine is the system behind how we collect, structure, validate, and deliver robotics training data. It is designed for physical environments, real human interaction, and the edge cases that determine whether AI systems hold up outside controlled conditions.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* SECTION 1 — THE PIPELINE (scroll-driven sticky) */}
      <ProcessSteps />

      {/* SECTION 2 — WHAT WE ANNOTATE (scroll-driven) */}
      <CapabilitiesSection />

      {/* VIDEO SHOWCASE */}
      <section className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-[1.1] bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text text-transparent mb-6">
              For AI & Robotics Teams
            </h2>
            <p className="text-white/60 text-base md:text-lg leading-relaxed font-light max-w-3xl mb-16">
              The gap between a system that performs in testing and one that performs in the real world is usually not the model alone — it is the training data behind it.
              <br /><br />
              Synthetic data and simulation are useful, but they cannot fully capture the variability, unpredictability, and physical nuance of real-world environments. Oceanveo is built to close that gap.
            </p>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeInSection>
              <div className="relative aspect-square rounded-2xl overflow-hidden" data-testid="video-pov-1">
                <video
                  src="/videos/human_hands_cup.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onEnded={(e) => { e.currentTarget.currentTime = 0; e.currentTarget.play(); }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 p-6 md:p-8 z-10 max-w-[280px]">
                  <div className="border-b border-white/20 mb-4" />
                  <h3 className="text-white text-xl font-display font-medium mb-4">Human</h3>
                  <div className="border-b border-white/20 mb-4" />
                  <p className="text-white/50 text-sm font-light leading-relaxed">
                    Real human actions captured in natural environments — the raw foundation every model learns from.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 p-6 md:p-8 z-10">
                  <p className="text-white/30 text-xs font-light">First-person capture · Controlled environment</p>
                </div>
              </div>
            </FadeInSection>
            <FadeInSection delay={0.15}>
              <div className="relative aspect-square rounded-2xl overflow-hidden" data-testid="video-pov-2">
                <video
                  src="/videos/robot_hands_cup.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onEnded={(e) => { e.currentTarget.currentTime = 0; e.currentTarget.play(); }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 p-6 md:p-8 z-10 max-w-[280px]">
                  <div className="border-b border-white/20 mb-4" />
                  <h3 className="text-white text-xl font-display font-medium mb-4">AI Intelligence</h3>
                  <div className="border-b border-white/20 mb-4" />
                  <p className="text-white/50 text-sm font-light leading-relaxed">
                    Structured perception and spatial reasoning — trained on the richness of real-world experience.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 p-6 md:p-8 z-10">
                  <p className="text-white/30 text-xs font-light">Robotic replication · Aligned behavior</p>
                </div>
              </div>
            </FadeInSection>
          </div>
          <FadeInSection>
            <p className="text-white text-2xl md:text-3xl lg:text-4xl font-display font-medium tracking-tight text-center mt-16 max-w-3xl mx-auto">
              Oceanveo datasets are built to close that gap.
            </p>
            <div className="flex justify-center mt-10">
              <Link href="/book">
                <Button className="rounded-xl px-8 py-6 text-base font-medium bg-white !text-[#09111d] hover:bg-white/90 transition-colors" data-testid="btn-get-in-touch">
                  Get in touch
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>


      {/* SECTION 4 — EARLY ACCESS */}
      <section className="relative py-44 md:py-56 overflow-hidden">
        <video
          src="/videos/hero_bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleY(-1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-transparent to-navy-950" />
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          <FadeInSection>
            <div className="text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-6 leading-tight">
                  More to see. More to show.
                </h2>
                <p className="text-white text-base md:text-lg max-w-[600px] mx-auto font-light mb-10">
                  We're releasing extended video examples, annotation previews, and dataset documentation to qualified partners. Leave your contact details and we'll be in touch.
                </p>
                <Link href="/book">
                  <Button
                    size="lg"
                    className="rounded-xl px-8 h-14 text-base font-medium bg-white text-navy-900 hover:bg-sky-100 hover:scale-105 transition-all duration-300"
                    data-testid="button-early-access"
                  >
                    Join the Early Access List
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
      <Footer />
      <style>{`
        @keyframes marquee-scroll-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .marquee-track-vertical {
          animation-name: marquee-scroll-vertical;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
