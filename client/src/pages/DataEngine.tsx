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
            className="text-[36px] sm:text-[48px] md:text-[72px] font-display font-medium tracking-tight leading-[1.1] bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text text-transparent max-w-4xl text-center mx-auto px-12 md:px-24"
            data-testid="text-engine-heading"
          >
            Where human experience becomes training data.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-white text-base md:text-lg font-light text-center max-w-2xl mx-auto mt-8 px-6 drop-shadow-lg"
          >
            Our Data Engine is an end-to-end pipeline for collecting, structuring, and delivering high-fidelity real-world datasets built for robotics and physical AI.
          </motion.p>
        </div>
      </div>
    </section>
  );
}


const processSteps = [
  {
    step: "01",
    title: "Capture",
    body: "We deploy trained annotators into the environments that matter — homes, workshops, industrial settings, and beyond. Every collection session is designed around the specific use cases, object categories, and interaction types our clients need their AI to understand.",
  },
  {
    step: "02",
    title: "Annotate",
    body: "Every object, surface, action, and spatial relationship is labelled with precision. Our annotation protocols are purpose-built for robotics — capturing not just what is in a scene, but how things relate, how they move, and how a human navigates them.",
  },
  {
    step: "03",
    title: "Validate",
    body: "Every dataset undergoes rigorous multi-pass quality review before delivery. We track consistency across annotators, environments, and edge cases — because a single systematic error in training data becomes a systematic failure in the field.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "Datasets are delivered in model-ready formats, structured to client specification. Clean, consistent, documented — built to accelerate training cycles, not complicate them.",
  },
];

function ProcessSteps() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrolled = -rect.top;
      const slideHeight = sectionHeight / processSteps.length;
      const index = Math.min(
        processSteps.length - 1,
        Math.max(0, Math.floor(scrolled / slideHeight))
      );
      setActiveIndex(index);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative"
      style={{ height: `${processSteps.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-navy-950 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-6 md:px-12 flex flex-col items-center">
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden mb-12 bg-gradient-to-br from-[#0d1b2a] to-[#1a2d42]">
            <video
              src="/videos/drawer.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative w-full text-center min-h-[180px] flex items-start justify-center">
            {processSteps.map((step, i) => (
              <div
                key={step.step}
                className="absolute inset-0 flex flex-col items-center transition-all duration-700 ease-out"
                style={{
                  opacity: activeIndex === i ? 1 : 0,
                  transform: activeIndex === i
                    ? "translateY(0)"
                    : activeIndex > i
                      ? "translateY(-30px)"
                      : "translateY(30px)",
                }}
                data-testid={`process-step-${step.step}`}
              >
                <span className="text-[#8bdaef]/40 text-xs uppercase tracking-[0.3em] font-mono mb-4">
                  Step {step.step}
                </span>
                <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-display font-medium tracking-tight mb-5">
                  {step.title}
                </h3>
                <p className="text-white/50 text-base md:text-lg leading-relaxed font-light max-w-2xl">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-16">
            {processSteps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: activeIndex === i ? 32 : 12,
                  backgroundColor: activeIndex === i ? "#8bdaef" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
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
  },
  {
    label: "Edge cases & failure modes",
    description: "Cluttered scenes, poor lighting, ambiguous objects, interruptions and recovery actions.",
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


      {/* TRANSITION HEADING */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-medium tracking-tight leading-tight text-center max-w-4xl mx-auto bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text text-transparent">
              From the physical world to a model-ready dataset — with nothing lost in translation.
            </h2>
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
              The difference between a robot that works in the lab and one that works in the real world is the data behind it. Synthetic data and simulation help — but real-world performance depends on edge cases, human unpredictability, and environments no spec can fully capture.
            </p>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeInSection>
              <div className="relative aspect-square rounded-2xl overflow-hidden" data-testid="video-pov-1">
                <video
                  src="/videos/human_pov.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
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
                  src="/videos/ai_pov.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
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
