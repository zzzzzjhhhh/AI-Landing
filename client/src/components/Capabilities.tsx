"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
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

function ScrollTextSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);
  const [showP3, setShowP3] = useState(false);

  useEffect(() => {
    if (isInView) {
      const t1 = setTimeout(() => setShowP1(true), 600);
      const t2 = setTimeout(() => setShowP2(true), 1400);
      const t3 = setTimeout(() => setShowP3(true), 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [isInView]);

  return (
    <div ref={ref} className="max-w-4xl mx-auto text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-[#8bdaef] mb-10"
      >
        Real-world intelligence starts with<br />real-world data.
      </motion.h2>
      <div className="ml-[74px] mr-[74px] pl-[110px] pr-[110px] space-y-6">
        <AnimatePresence>
          {showP1 && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="md:text-lg text-[22px] font-normal text-[#ffffffdb]"
            >
              The next leap in AI won't happen in data centers. It will happen in warehouses, kitchens, hospitals, and factories — wherever machines must perceive, decide, and act in physical space.
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showP2 && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="md:text-lg text-[22px] font-normal text-[#ffffffdb]"
            >
              That makes training embodied AI the decade's defining bottleneck. Unlike language or vision models, robots and humanoids must learn from the full complexity of real human experience.
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showP3 && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="md:text-lg text-[22px] font-normal text-[#ffffffdb]"
            >
              That data doesn't exist at scale yet. That's what Oceanveo is building.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScrollIntroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [phase, setPhase] = useState<"first" | "second">("first");
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    if (isInView) {
      const t1 = setTimeout(() => setPhase("second"), 1800);
      const t2 = setTimeout(() => setShowSubtitle(true), 2600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isInView]);

  const lines = {
    first: ["The world's robots learn", "by watching humans."],
    second: ["Real-world intelligence infrastructure for embodied AI"],
  };

  return (
    <div ref={ref} className="max-w-4xl mx-auto text-center">
      <div className="min-h-[120px] md:min-h-[140px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.h2
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-[#8bdaef]"
          >
            {lines[phase].map((line, i) => (
              <span key={i}>
                {line}
                {i < lines[phase].length - 1 && <br />}
              </span>
            ))}
          </motion.h2>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showSubtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-white/60 md:text-lg font-light max-w-3xl mx-auto text-[22px] ml-[74px] mr-[74px] mt-[0px] mb-[0px] pt-[0px] pb-[0px] pl-[110px] pr-[110px]"
          >
            Oceanveo transforms human perception, movement, and decision-making in physical environments into structured training data for robots, humanoids, and autonomous systems.
            <br /><br />
            Built not for screens, but for AI that has to operate in the real world.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Capabilities() {
  return (
    <>
      {/* INTRO — OCEANVEO PITCH */}
      <section className="py-24 lg:py-32 bg-navy-950 pt-[168px] pb-[168px]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <ScrollIntroSection />
        </div>
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
      <section className="bg-navy-950 pt-[100px] pb-[100px]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <ScrollTextSection />
        </div>
      </section>

      {/* MICRO MOVES VIDEO SECTION — two-column layout */}
      <section className="bg-navy-950 pb-24 lg:pb-32 overflow-hidden pt-[200px]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-16 lg:gap-24 px-6 md:px-12 lg:px-16">

            {/* Left: text */}
            <FadeIn>
              <div className="flex flex-col justify-start pt-0">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-tight text-[#8bdaef] mb-6">
                  We translate human perception into structured intelligence.
                </h2>
                <div className="mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.25)" }} />
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
                <div className="absolute top-0 left-0 mt-6 ml-8 z-20 max-w-[220px]">
                  <p className="text-white text-[9px] uppercase tracking-[0.2em] font-semibold mb-2">Human Fine Motor Skills</p>
                  <div className="mb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.6)" }} />
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <p className="text-white text-[11px] font-light">Finger pressure mapping</p>
                  </div>
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <p className="text-white text-[11px] font-light">Wrist rotation angle</p>
                  </div>
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <p className="text-white text-[11px] font-light">Grasp force variance</p>
                  </div>
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    <p className="text-white text-[11px] font-light">Contact timing</p>
                  </div>
                </div>
                {/* Bottom-left caption */}
                <div className="absolute bottom-0 left-0 mb-6 ml-8 z-20">
                  <p className="text-white/50 text-[10px] font-light tracking-wide">Dexterous manipulation · VLA-ready labels</p>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* IMAGE GRID SECTION */}
      <section className="bg-navy-950 py-24 lg:py-32">
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
            <h2 className="sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-white mt-16 text-left mr-[300px] text-[38px]">
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
                  className="relative flex flex-col justify-between bg-[#111318] border border-white/[0.08] rounded-2xl p-8 overflow-hidden h-[360px] hover:border-white/[0.15] transition-all duration-500"
                  data-testid={`card-pillar-${i}`}
                >
                  <div className="flex items-start justify-end">
                    <span className="text-[130px] font-extralight leading-none text-white/[0.12] select-none tracking-tighter">
                      {pillar.stat}
                    </span>
                    <span className="text-[40px] font-extralight leading-none text-white/[0.12] select-none mt-4 ml-1">
                      {pillar.suffix}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white text-base font-display font-medium mb-3 leading-snug">{pillar.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed font-light">{pillar.description}</p>
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
