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
              The next leap in AI is happening in the real world — in warehouses, kitchens, hospitals, and factories — where machines must perceive, decide, and act.
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
    second: ["We make that possible."],
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
            Oceanveo builds the richest real-world datasets on the planet — human-collected, precisely annotated, engineered for the physical AI systems that will reshape how the world works.
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

      {/* SECTION 1 — THE PROBLEM */}
      <section className="py-24 lg:py-32 bg-navy-950">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              Why It Matters
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-10 max-w-3xl leading-tight">
              AI that moves through the world needs data from the world.
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="max-w-3xl space-y-6">
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                The next leap in artificial intelligence isn't happening inside a data center. It's happening in warehouses, kitchens, hospitals, and factories — anywhere a machine needs to perceive, decide, and act in physical space.
              </p>
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                Training these systems is the defining bottleneck of the decade. Language models learned from text. Vision models learned from images. But embodied AI — robotics, humanoids, physical automation — has to learn from something far more complex: the full texture of human experience in the real world.
              </p>
              <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium">
                That data doesn't exist at scale yet.
              </p>
              <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium">
                That's what Oceanveo is building.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 2 — WHAT WE DO */}
      <section className="py-24 lg:py-32 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900/30 to-navy-950 pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16 relative">
          <FadeIn>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              Our Work
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-10 max-w-3xl leading-tight">
              We translate human perception into structured intelligence.
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="max-w-3xl space-y-6">
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                Oceanveo deploys human annotators across diverse real-world environments — capturing actions, interactions, and edge cases that no synthetic dataset can replicate. Every drawer opened. Every object grasped. Every hesitation, adjustment, and recovery.
              </p>
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                We don't just label data. We engineer it — curating scenarios that expose AI systems to the full range of how humans actually move, see, and solve problems in physical space.
              </p>
              <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium">
                The result: training data that makes robots more capable, more reliable, and more ready for the world they'll operate in.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* VIDEO SECTION — THREE MOMENTS */}
      <section className="py-24 lg:py-32 bg-navy-950">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="text-white/60 text-lg md:text-xl text-center mb-16 font-light">
              Watch what we capture.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: "The Source",
                caption: "Everyday human actions — the foundation of every model we train.",
              },
              {
                label: "The Process",
                caption: "Every object named. Every interaction structured. Nothing left unread.",
              },
              {
                label: "The Goal",
                caption: "When robots learn well, they begin to move like us.",
              },
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.1}>
                <div className="group" data-testid={`card-video-${i}`}>
                  <div className="aspect-video bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                    <p className="text-white/20 text-sm font-light">Video placeholder</p>
                  </div>
                  <p className="text-[#8bdaef] text-sm font-medium mb-2">{item.label}</p>
                  <p className="text-white/50 text-sm leading-relaxed font-light">{item.caption}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHY OCEANVEO */}
      <section className="py-24 lg:py-32 bg-navy-950">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Robotics-Specific by Design",
                description: "Our data collection protocols, annotation taxonomy, and quality standards are built exclusively around embodied AI — not repurposed from NLP or image classification pipelines.",
              },
              {
                title: "Human Intelligence at Every Layer",
                description: "Our annotators aren't crowdsourced checkbox-fillers. They're trained to capture nuance — the kinds of spatial, contextual, and behavioral signals that determine whether a robot succeeds or fails in the real world.",
              },
              {
                title: "Depth Over Volume",
                description: "An ocean isn't just wide. It's deep. We go where others won't — diverse environments, rare scenarios, edge cases — because the hardest situations are exactly where AI systems break down.",
              },
            ].map((pillar, i) => (
              <FadeIn key={pillar.title} delay={i * 0.1}>
                <div
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 h-full"
                  data-testid={`card-pillar-${i}`}
                >
                  <h3 className="text-white text-xl font-display font-medium mb-4">{pillar.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed font-light">{pillar.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
