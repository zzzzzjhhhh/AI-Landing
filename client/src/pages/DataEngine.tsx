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

const infrastructureItems = [
  {
    name: "World Engine",
    description: "Real-world data collection across homes, workshops, industrial settings, and other physical environments where embodied AI must operate.",
  },
  {
    name: "Scenario Engine",
    description: "Design of task flows, edge cases, object interactions, and environmental conditions tailored to each client's use case.",
  },
  {
    name: "Behavior Engine",
    description: "Structured annotation of movement, manipulation, intent, recovery, spatial context, and human-environment interaction.",
  },
  {
    name: "Validation Engine",
    description: "Multi-pass review systems for consistency, spatial accuracy, annotation quality, and edge-case reliability across datasets.",
  },
  {
    name: "Training Intelligence",
    description: "Model-ready outputs delivered to specification, with the structure and documentation needed for robotics training and evaluation.",
  },
];

function InfrastructureStack() {
  return (
    <section className="bg-navy-950 py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-16 lg:gap-24 items-start">

          {/* LEFT — sticky heading */}
          <div className="lg:sticky lg:top-28">
            <FadeInSection>
              <p className="text-[#8bdaef] text-xs uppercase tracking-[0.2em] font-medium mb-5">
                Infrastructure Stack
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-white leading-tight mb-6">
                Five engines.<br />One system.
              </h2>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Each layer of the stack handles a distinct phase of the data pipeline — from collection to delivery.
              </p>
            </FadeInSection>
          </div>

          {/* RIGHT — stacked cards matching home page card style */}
          <div className="flex flex-col gap-4">
            {infrastructureItems.map((item, i) => (
              <FadeInSection key={item.name} delay={i * 0.07}>
                <div
                  className="group relative bg-[#111318] border border-white/[0.08] rounded-2xl p-8 overflow-hidden transition-all duration-500 hover:border-[#8bdaef]/30"
                  data-testid={`card-infra-${i}`}
                >
                  {/* Gradient hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{background: "linear-gradient(135deg, rgba(139,218,239,0.13) 0%, rgba(79,163,188,0.07) 50%, rgba(255,255,255,0.03) 100%)"}}
                  />
                  {/* Watermark number — top right, same gradient + opacity as home cards */}
                  <div className="absolute top-3 right-5 select-none pointer-events-none">
                    <span
                      className="text-[90px] font-extralight leading-none tracking-tighter transition-all duration-500"
                      style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.18}}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {/* Content */}
                  <h3 className="text-white text-base font-display font-medium mb-3 leading-snug relative z-10 group-hover:text-[#8bdaef] transition-colors duration-500">
                    {item.name}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed font-light max-w-sm relative z-10 group-hover:text-white/60 transition-colors duration-500">
                    {item.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function ProcessSteps() {
  const leftSteps = processSteps.slice(0, 2);  // 01 Capture, 02 Structure
  const rightSteps = processSteps.slice(2, 4); // 03 Validate, 04 Deliver

  return (
    <section id="how-it-works" className="bg-navy-950 py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="mb-12 text-center">
          <p className="text-[#8bdaef] text-4xl md:text-5xl font-display font-medium tracking-tight mt-[20px] mb-[20px]">How it works</p>
        </div>

        {/* Video — full width at top */}
        <div className="w-full rounded-2xl overflow-hidden border border-white/[0.08] mb-16" style={{maxHeight: "60vh"}}>
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

        {/* Steps below: left col = 01+02, right col = 03+04 */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-0">
          {/* Left column */}
          <div className="flex flex-col gap-10">
            {leftSteps.map((step, i) => (
              <FadeInSection key={step.step} delay={i * 0.08}>
                <div data-testid={`process-step-${step.step}`}>
                  <span
                    className="text-[32px] font-extralight leading-none tracking-tighter block mb-3"
                    style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.4}}
                  >
                    {step.step}
                  </span>
                  <div className="w-full h-px bg-white/20 mb-3" />
                  <h3 className="text-white text-lg font-display font-medium tracking-tight mb-2">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed font-light mr-[60px]">{step.body}</p>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-10">
            {rightSteps.map((step, i) => (
              <FadeInSection key={step.step} delay={i * 0.08}>
                <div data-testid={`process-step-${step.step}`}>
                  <span
                    className="text-[32px] font-extralight leading-none tracking-tighter block mb-3"
                    style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.4}}
                  >
                    {step.step}
                  </span>
                  <div className="w-full h-px bg-white/20 mb-3" />
                  <h3 className="text-white text-lg font-display font-medium tracking-tight mb-2">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed font-light mr-[60px]">{step.body}</p>
                </div>
              </FadeInSection>
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
    video: "/videos/environment.mp4",
  },
  {
    label: "Edge cases & failure modes",
    description: "Cluttered scenes, poor lighting, ambiguous objects, interruptions and recovery actions.",
    video: "/videos/edge_cases.mp4",
  },
];


function StatementSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });
  const title = "Oceanveo data sets are built to close that gap.";
  const words = title.split(" ");

  return (
    <section className="bg-navy-950 py-24 lg:py-36 pt-[20px] pb-[20px]">
      <div className="max-w-[860px] mx-auto px-6 md:px-12 text-center ml-[224px] mr-[224px]">
        <FadeInSection className="ml-[200px] mr-[200px] mt-[20px] mb-[20px]">
          <p className="text-white/50 text-base md:text-lg leading-relaxed font-light mb-14 max-w-2xl mx-auto">
            Synthetic data and simulation are useful, but they cannot fully capture the variability, unpredictability, and physical nuance of real-world environments. Oceanveo is built to close that gap.
          </p>
        </FadeInSection>
        <div ref={ref} className="flex flex-wrap justify-center gap-x-[0.35em] gap-y-1">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-white inline-block"
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

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
            <p className="font-normal text-[#ffffffdb] text-[18px] leading-relaxed max-w-3xl mx-auto ml-[180px] mr-[180px]">
              Oceanveo's Data Engine is the system behind how we collect, structure, validate, and deliver robotics training data. It is designed for physical environments, real human interaction, and the edge cases that determine whether AI systems hold up outside controlled conditions.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* INFRASTRUCTURE STACK SECTION */}
      <InfrastructureStack />

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
        </div>
      </section>

      {/* STATEMENT SECTION — after the two videos */}
      <StatementSection />

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
