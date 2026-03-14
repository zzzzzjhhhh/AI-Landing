"use client";

import { AnimatePresence, motion, useInView, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
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
  "The next frontier of AI will emerge beyond data centers, in warehouses, homes, hospitals, and factories — where automation reshapes productivity and everyday life.",
  "That makes training embodied AI the decade's defining bottleneck. Unlike language or vision models, robots and humanoids must learn from the full complexity of real human experience.",
  "That data does not exist at scale yet. That is what Oceanveo is building.",
];

function ScrollTextSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (value) => {
      if (value < 0.38) setActiveIndex(0);
      else if (value < 0.72) setActiveIndex(1);
      else setActiveIndex(2);
    });
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="h-[120svh] md:h-[140vh]">
      <div className="sticky top-0 flex flex-col items-center justify-center px-5 py-20 text-center sm:px-6 md:py-28">
        <h2 className="mb-8 text-[clamp(2rem,7vw,3.5rem)] font-display font-medium leading-tight tracking-tight text-[#8bdaef] md:mb-10">
          Real-world intelligence starts with
          <br />
          real-world data.
        </h2>
        <div className="mx-auto flex min-h-[160px] max-w-2xl items-start justify-center md:min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-base font-normal leading-relaxed text-[#ffffffdb] sm:text-lg md:text-[22px]"
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
  "Oceanveo transforms human perception, motion, and decision-making into structured training data for robotics, humanoids, and autonomous systems.",
  "Engineered for autonomy.",
  "Engineered for autonomy.",
];

function ScrollIntroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [titlePhase, setTitlePhase] = useState<"first" | "second" | "third">("first");
  const [paragraphIndex, setParagraphIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (value) => {
      if (value < 0.17) {
        setTitlePhase("first");
        setParagraphIndex(0);
      } else if (value < 0.33) {
        setTitlePhase("second");
        setParagraphIndex(0);
      } else if (value < 0.5) {
        setTitlePhase("third");
        setParagraphIndex(0);
      } else if (value < 0.67) {
        setTitlePhase("third");
        setParagraphIndex(1);
      } else if (value < 0.83) {
        setTitlePhase("third");
        setParagraphIndex(2);
      } else {
        setTitlePhase("third");
        setParagraphIndex(3);
      }
    });
  }, [scrollYProgress]);

  const lines = {
    first: ["Physical intelligence is acquired by observing human behavior"],
    second: ["Physical intelligence is acquired", "by observing human behavior."],
    third: ["Real-world intelligence infrastructure for embodied AI"],
  };

  return (
    <div ref={containerRef} className="h-[250svh] md:h-[350vh]">
      <div className="sticky top-0 py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-5 text-center sm:px-6 md:px-12 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.h2
              key={titlePhase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="mb-8 text-[clamp(2rem,7vw,3.5rem)] font-display font-medium leading-tight tracking-tight text-gradient md:mb-10"
            >
              {lines[titlePhase].map((line, index) => (
                <span key={index}>
                  {line}
                  {index < lines[titlePhase].length - 1 && <br />}
                </span>
              ))}
            </motion.h2>
          </AnimatePresence>

          <div className="mx-auto min-h-[96px] max-w-2xl">
            <AnimatePresence mode="wait">
              {paragraphIndex > 0 && (
                <motion.p
                  key={paragraphIndex}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="text-center text-sm font-light leading-relaxed text-white/60 sm:text-base"
                >
                  {INTRO_PARAGRAPHS[paragraphIndex - 1]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const pillars = [
  {
    stat: "10",
    suffix: "M+",
    title: "Built for Physical Intelligence",
    description:
      "Our collection protocols, behavioral taxonomy, and quality systems are designed specifically for robotics, humanoids, and embodied AI, not adapted from language workflows or generic image labeling.",
  },
  {
    stat: "99",
    suffix: ".7%",
    title: "Human Nuance, Structured for Machines",
    description:
      "Our teams are trained to capture the spatial, contextual, and behavioral signals that determine whether a robot succeeds or fails in the real world.",
  },
  {
    stat: "500",
    suffix: "+",
    title: "Scenario Depth Over Dataset Scale",
    description:
      "We focus on the situations that matter most: diverse environments, rare interactions, and failure-prone edge cases where physical AI systems actually break.",
  },
];

export function Capabilities() {
  return (
    <>
      <section id="capabilities" className="bg-navy-950">
        <ScrollIntroSection />
      </section>

      <section className="bg-navy-950 pb-20 md:pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
          <FadeIn>
            <div className="relative w-full overflow-hidden rounded-2xl pb-[56.25%]">
              <video
                src="/videos/intro_bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute left-0 top-0 z-20 max-w-[220px] p-4 sm:max-w-[260px] sm:p-6 md:max-w-[280px] md:p-8">
                <div className="mb-4 border-b border-white/20" />
                <h3 className="mb-4 text-lg font-display font-medium text-white sm:text-xl">
                  Behavioral Signal Capture
                </h3>
                <div className="mb-4 border-b border-white/20" />
                <p className="text-xs font-light leading-relaxed text-white/50 sm:text-sm">
                  Attention, Intention, Action & Reaction — the operational patterns of human behavior encoded for embodied system training.
                </p>
              </div>

              <div className="absolute bottom-0 left-0 z-20 p-4 sm:p-6 md:p-8">
                <img src="/images/oceanveo-logo-white.png" alt="Oceanveo" className="h-5 w-auto opacity-40" />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-navy-950">
        <ScrollTextSection />
      </section>

      <section
        className="overflow-hidden pb-20 pt-20 md:pb-24 md:pt-32 lg:pb-32 lg:pt-40"
        style={{
          background:
            "linear-gradient(180deg, #060c14 0%, #07121e 20%, rgba(139,218,239,0.07) 50%, #07121e 80%, #060c14 100%)",
        }}
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 items-start gap-10 px-5 sm:px-6 md:grid-cols-2 md:gap-16 md:px-12 lg:gap-24 lg:px-16">
            <FadeIn>
              <div className="flex flex-col justify-start">
                <h2 className="mb-5 text-[clamp(2rem,7vw,3.5rem)] font-display font-medium leading-tight tracking-tight text-white sm:mb-6">
                  Turning perception into vision.
                </h2>
                <p className="text-base font-normal leading-relaxed text-[#ffffffdb] sm:text-lg">
                  Oceanveo deploys human annotators across diverse real-world environments, capturing actions, interactions, and edge cases that no synthetic dataset can replicate. Every drawer opened. Every object grasped. Every hesitation, adjustment, and recovery.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <video
                  src="/videos/hand_grip_square.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover"
                />

                <div className="absolute left-0 top-0 z-20 max-w-[220px] p-4 sm:max-w-[260px] sm:p-6 md:max-w-[280px] md:p-8">
                  <div className="mb-4 border-b border-white/20" />
                  <h3 className="mb-4 text-lg font-display font-medium text-white sm:text-xl">
                    Human Fine Motor Skills
                  </h3>
                  <div className="mb-4 border-b border-white/20" />
                  <p className="text-xs font-light leading-relaxed text-white/50 sm:text-sm">
                    Precise hand and finger movements captured at scale, the dexterous actions robots must learn to replicate.
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 z-20 p-4 sm:p-6 md:p-8">
                  <p className="text-xs font-light text-white/30">
                    Dexterous manipulation / VLA-ready labels
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section
        className="py-20 md:py-24 lg:py-32"
        style={{
          background:
            "linear-gradient(180deg, #060c14 0%, #07121e 20%, rgba(139,218,239,0.07) 50%, #07121e 80%, #060c14 100%)",
        }}
      >
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-[#8bdaef]">
              How It Works
            </p>
            <p className="mx-auto mb-12 max-w-3xl text-center text-base font-medium leading-relaxed text-[#ffffffdb] sm:text-lg md:mb-16 md:text-xl">
              We do not just label data. We engineer it, designing scenarios, defining behavioral taxonomies, and structuring the signals AI systems need to learn how humans actually move, see, and solve problems in physical space.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-3">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img src="/images/finger_1.png" alt="Finger precision" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-left text-[11px] font-light text-white/50 sm:text-xs">
                  Index approach / contact initiation
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img src="/images/finger_2.png" alt="Finger contact" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-left text-[11px] font-light text-white/50 sm:text-xs">
                  Fingertip pressure / surface contact
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img src="/images/hands_3.png" alt="Hand motion" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-left text-[11px] font-light text-white/50 sm:text-xs">
                  Dual-hand coordination / reach phase
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img src="/images/grip_4.png" alt="Grip study" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-left text-[11px] font-light text-white/50 sm:text-xs">
                  Multi-finger grip / object stabilisation
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="mx-auto mt-12 max-w-4xl text-center font-display text-[clamp(1.75rem,6vw,2.5rem)] font-medium tracking-tight text-[#8bdaef] md:mt-16">
              The result is training data that makes robots more capable, more reliable, and more ready for the world they will operate in.
            </h2>
          </FadeIn>
        </div>
      </section>

      <section
        className="py-20 md:py-24 lg:py-32"
        style={{
          background:
            "linear-gradient(135deg, #080e1c 0%, #050a12 40%, #04060a 100%)",
        }}
      >
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[#8bdaef]">
              Our Difference
            </p>
            <h2 className="mb-12 max-w-4xl text-[clamp(2rem,7vw,3.5rem)] font-display font-medium leading-tight tracking-tight text-white md:mb-16">
              Most data annotation is built for language.
              <br />
              We are built for the physical world.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <FadeIn key={pillar.title} delay={index * 0.1}>
                <div
                  className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111318] p-6 transition-all duration-500 hover:border-[#8bdaef]/30 md:h-[360px] md:p-8"
                  data-testid={`card-pillar-${index}`}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139,218,239,0.13) 0%, rgba(79,163,188,0.07) 50%, rgba(255,255,255,0.03) 100%)",
                    }}
                  />

                  <div className="relative z-10 flex items-start justify-end">
                    <span
                      className="select-none text-[92px] font-extralight leading-none tracking-tighter sm:text-[110px] md:text-[130px]"
                      style={{
                        background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        opacity: 0.25,
                      }}
                    >
                      {pillar.stat}
                    </span>
                    <span
                      className="ml-1 mt-4 select-none text-[32px] font-extralight leading-none sm:text-[36px] md:text-[40px]"
                      style={{
                        background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        opacity: 0.25,
                      }}
                    >
                      {pillar.suffix}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <h3 className="mb-3 text-base font-display font-medium leading-snug text-white transition-colors duration-500 group-hover:text-[#8bdaef]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm font-light leading-relaxed text-white/40 transition-colors duration-500 group-hover:text-white/60">
                      {pillar.description}
                    </p>
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
