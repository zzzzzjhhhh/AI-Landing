"use client";

import { motion, useInView, useScroll, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
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

const SCROLL_PARAGRAPHS = [
  "The next leap in AI won't happen in data centers. It will happen in warehouses, kitchens, hospitals, and factories — wherever machines must perceive, decide, and act in physical space.",
  "That makes training embodied AI the decade's defining bottleneck. Unlike language or vision models, robots and humanoids must learn from the full complexity of real human experience.",
  "That data doesn't exist at scale yet. That's what Oceanveo is building.",
];

function ScrollTextSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      if (v < 0.38) setActiveIndex(0);
      else if (v < 0.72) setActiveIndex(1);
      else setActiveIndex(2);
    });
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} style={{ height: "140vh" }}>
      <div className="sticky top-0 flex flex-col items-center justify-center text-center px-6 py-28">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-[#8bdaef] mb-10">
          Real-world intelligence starts with<br />real-world data.
        </h2>
        <div className="max-w-2xl mx-auto min-h-[120px] flex items-start justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-[22px] font-normal text-[#ffffffdb] leading-relaxed"
            >
              {SCROLL_PARAGRAPHS[activeIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const INTRO_PARAGRAPHS = [
  "Oceanveo transforms human perception, movement, and decision-making in physical environments into structured training data for robots, humanoids, and autonomous systems.",
  "Built not for screens, but for AI that has to operate in the real world.",
];

function ScrollIntroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [titlePhase, setTitlePhase] = useState<"first" | "second">("first");
  const [paraIndex, setParaIndex] = useState(0); // 0 = none, 1 = para1, 2 = para2

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      if (v < 0.25) {
        setTitlePhase("first");
        setParaIndex(0);
      } else if (v < 0.5) {
        // Title 2 visible, NO paragraph yet
        setTitlePhase("second");
        setParaIndex(0);
      } else if (v < 0.75) {
        setTitlePhase("second");
        setParaIndex(1);
      } else {
        setTitlePhase("second");
        setParaIndex(2);
      }
    });
  }, [scrollYProgress]);

  const lines = {
    first: ["The world's robots learn", "by watching humans."],
    second: ["Real-world intelligence infrastructure for embodied AI"],
  };

  return (
    <div ref={containerRef} style={{ height: "250vh" }}>
      <div className="sticky top-0 py-28">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16 text-center">
          <AnimatePresence mode="wait">
            <motion.h2
              key={titlePhase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-gradient mb-10"
            >
              {lines[titlePhase].map((line, i) => (
                <span key={i}>
                  {line}
                  {i < lines[titlePhase].length - 1 && <br />}
                </span>
              ))}
            </motion.h2>
          </AnimatePresence>
          <div className="max-w-2xl mx-auto min-h-[80px]">
            <AnimatePresence mode="wait">
              {paraIndex > 0 && (
                <motion.p
                  key={paraIndex}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="text-white/60 font-light text-[16px] leading-relaxed text-center"
                >
                  {INTRO_PARAGRAPHS[paraIndex - 1]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Capabilities() {
  return (
    <>
      {/* INTRO — OCEANVEO PITCH */}
      <section className="bg-navy-950">
        <ScrollIntroSection />
      </section>

      {/* VIDEO SECTION — INTRO */}
      <section className="bg-navy-950 pb-24 lg:pb-32">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeIn>
            <div className="rounded-2xl overflow-hidden w-full relative" style={{ paddingBottom: "56.25%" }}>
              <video
                src="/videos/intro_bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Top-left overlay — Behavioural Signals */}
              <div className="absolute top-0 left-0 mt-6 ml-8 z-20 max-w-[220px]">
                <p className="text-white text-[9px] uppercase tracking-[0.2em] font-semibold mb-2">Behavioural Signals</p>
                <div className="mb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.6)" }} />
                <div className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                  <p className="text-white text-[11px] font-light">Grip force variance</p>
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                  <p className="text-white text-[11px] font-light">Gaze trajectory</p>
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                  <p className="text-white text-[11px] font-light">Hesitation index</p>
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                  <p className="text-white text-[11px] font-light">Recovery pattern</p>
                </div>
              </div>
              {/* Bottom-left caption */}
              <div className="absolute bottom-0 left-0 mb-6 ml-8 z-20">
                <p className="text-white/50 text-[10px] font-light tracking-wide">Embodied inference · Structured for VLA</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SCROLL TEXT SECTION — AFTER VIDEO */}
      <section className="bg-navy-950">
        <ScrollTextSection />
      </section>

      {/* MICRO MOVES VIDEO SECTION — two-column layout */}
      <section className="pb-24 lg:pb-32 overflow-hidden pt-[200px]" style={{background: "linear-gradient(180deg, #060c14 0%, #07121e 20%, rgba(139,218,239,0.07) 50%, #07121e 80%, #060c14 100%)"}}>
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-16 lg:gap-24 px-6 md:px-12 lg:px-16">

            {/* Left: text */}
            <FadeIn>
              <div className="flex flex-col justify-start pt-0">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-white mb-6">
                  We translate human perception into structured intelligence.
                </h2>
                <p className="font-normal text-[#ffffffdb] text-[18px] pl-[0px] pr-[0px] pt-[0px] pb-[0px] ml-[0px] mr-[0px]">
                  Oceanveo deploys human annotators across diverse real-world environments — capturing actions, interactions, and edge cases that no synthetic dataset can replicate. Every drawer opened. Every object grasped. Every hesitation, adjustment, and recovery.
                </p>
              </div>
            </FadeIn>

            {/* Right: 1:1 square video, flush to right edge */}
            <FadeIn delay={0.1}>
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <video
                  src="/videos/hand_grip_square.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                />
                {/* Top-left overlay — Fine Motor Skills */}
                <div className="absolute top-0 left-0 p-6 md:p-8 z-20 max-w-[280px]">
                  <div className="border-b border-white/20 mb-4" />
                  <h3 className="text-white text-xl font-display font-medium mb-4">Human Fine Motor Skills</h3>
                  <div className="border-b border-white/20 mb-4" />
                  <p className="text-white/50 text-sm font-light leading-relaxed">
                    Precise hand and finger movements captured at scale — the dexterous actions robots must learn to replicate.
                  </p>
                </div>
                {/* Bottom-left caption */}
                <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20">
                  <p className="text-white/30 text-xs font-light">Dexterous manipulation · VLA-ready labels</p>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* IMAGE GRID SECTION */}
      <section className="py-24 lg:py-32 mt-[0px] mb-[0px] pt-[158px] pb-[158px]" style={{background: "linear-gradient(180deg, #060c14 0%, #07121e 20%, rgba(139,218,239,0.07) 50%, #07121e 80%, #060c14 100%)"}}>
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="text-[#8bdaef] text-xs uppercase tracking-[0.2em] font-medium text-center mb-6">How It Works</p>
            <p className="md:text-lg text-[#ffffffdb] font-medium text-[22px] text-center max-w-4xl mx-auto mb-16 leading-relaxed pl-[150px] pr-[150px]">
              We don't just label data. We engineer it — designing scenarios, defining behavioral taxonomies, and structuring the signals AI systems need to learn how humans actually move, see, and solve problems in physical space.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-3">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img src="/images/finger_1.png" alt="Finger precision" className="w-full h-full object-cover" />
                </div>
                <p className="text-white/50 text-xs font-light text-left mt-[10px] mb-[10px]">Index approach · contact initiation</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img src="/images/finger_2.png" alt="Finger contact" className="w-full h-full object-cover" />
                </div>
                <p className="text-white/50 text-xs font-light text-left mt-[10px] mb-[10px]">Fingertip pressure · surface contact</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img src="/images/hands_3.png" alt="Hand motion" className="w-full h-full object-cover" />
                </div>
                <p className="text-white/50 text-xs font-light text-left mt-[10px] mb-[10px]">Dual-hand coordination · reach phase</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img src="/images/grip_4.png" alt="Grip study" className="w-full h-full object-cover" />
                </div>
                <p className="text-white/50 text-xs font-light text-left mt-[10px] mb-[10px]">Multi-finger grip · object stabilisation</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h2
              className="font-display font-medium tracking-tight mt-16 text-center text-[28px] mx-[180px] text-[#8bdaef]"
            >
              The result is training data that makes robots more capable, more reliable, and more ready for the world they will operate in.
            </h2>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 3 — WHY OCEANVEO */}
      <section className="py-24 lg:py-32" style={{background: "linear-gradient(135deg, #080e1c 0%, #050a12 40%, #04060a 100%)"}}>
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              Our Difference
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-16 max-w-4xl leading-tight">
              Most data annotation is built for language.
              <br />
              We're built for the physical world.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                stat: "10",
                suffix: "M+",
                title: "Built for Physical Intelligence",
                description: "Our collection protocols, behavioral taxonomy, and quality systems are designed specifically for robotics, humanoids, and embodied AI — not adapted from language workflows or generic image labeling.",
              },
              {
                stat: "99",
                suffix: ".7%",
                title: "Human Nuance, Structured for Machines",
                description: "Our teams are trained to capture the spatial, contextual, and behavioral signals that determine whether a robot succeeds or fails in the real world.",
              },
              {
                stat: "500",
                suffix: "+",
                title: "Scenario Depth Over Dataset Scale",
                description: "We focus on the situations that matter most: diverse environments, rare interactions, and failure-prone edge cases where physical AI systems actually break.",
              },
            ].map((pillar, i) => (
              <FadeIn key={pillar.title} delay={i * 0.1}>
                <div
                  className="group relative flex flex-col justify-between bg-[#111318] border border-white/[0.08] rounded-2xl p-8 overflow-hidden h-[360px] hover:border-[#8bdaef]/30 transition-all duration-500"
                  data-testid={`card-pillar-${i}`}
                >
                  {/* Gradient hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{background: "linear-gradient(135deg, rgba(139,218,239,0.13) 0%, rgba(79,163,188,0.07) 50%, rgba(255,255,255,0.03) 100%)"}}
                  />
                  <div className="flex items-start justify-end relative z-10">
                    <span
                      className="text-[130px] font-extralight leading-none select-none tracking-tighter"
                      style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.25}}
                    >
                      {pillar.stat}
                    </span>
                    <span
                      className="text-[40px] font-extralight leading-none select-none mt-4 ml-1"
                      style={{background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.25}}
                    >
                      {pillar.suffix}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-white text-base font-display font-medium mb-3 leading-snug group-hover:text-[#8bdaef] transition-colors duration-500">{pillar.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed font-light group-hover:text-white/60 transition-colors duration-500">{pillar.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
