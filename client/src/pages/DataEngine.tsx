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

export default function DataEngine() {
  return (
    <div className="bg-navy-950 min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />


      {/* SECTION 1 — THE PIPELINE */}
      <section id="how-it-works" className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-16 max-w-3xl">
              From the physical world to a model-ready dataset — with nothing lost in translation.
            </h2>
          </FadeInSection>

          <div className="space-y-16">
            {[
              {
                step: "01",
                title: "Capture",
                label: "Real World. Real People. Real Scenarios.",
                body: "We deploy trained annotators into the environments that matter — homes, workshops, industrial settings, and beyond. Every collection session is designed around the specific use cases, object categories, and interaction types our clients need their AI to understand.",
                detail: "This isn't screen recording. It's embodied data collection — first-person, multi-angle, environment-rich.",
              },
              {
                step: "02",
                title: "Annotate",
                label: "Nothing Goes Unnamed.",
                body: "Every object, surface, action, and spatial relationship is labelled with precision. Our annotation protocols are purpose-built for robotics — capturing not just what is in a scene, but how things relate, how they move, and how a human navigates them.",
                detail: "We go beyond bounding boxes. We deliver structured intelligence.",
              },
              {
                step: "03",
                title: "Validate",
                label: "Quality That Compounds.",
                body: "Every dataset undergoes rigorous multi-pass quality review before delivery. We track consistency across annotators, environments, and edge cases — because a single systematic error in training data becomes a systematic failure in the field.",
              },
              {
                step: "04",
                title: "Deliver",
                label: "Ready to Train On.",
                body: "Datasets are delivered in model-ready formats, structured to client specification. Clean, consistent, documented — built to accelerate training cycles, not complicate them.",
              },
            ].map((item, i) => (
              <FadeInSection key={item.step} delay={i * 0.1}>
                <div className="group grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6 md:gap-12 border-t border-white/[0.06] pt-10" data-testid={`card-step-${item.step}`}>
                  <div>
                    <span className="text-[#8bdaef]/40 text-sm font-mono tracking-wider">{item.step}</span>
                    <h3 className="text-white text-2xl font-display font-medium mt-2">{item.title}</h3>
                  </div>
                  <div>
                    <p className="text-[#8bdaef] text-sm font-medium mb-3">{item.label}</p>
                    <p className="text-white/60 text-base leading-relaxed font-light mb-3">{item.body}</p>
                    {item.detail && (
                      <p className="text-white/40 text-sm leading-relaxed font-light italic">{item.detail}</p>
                    )}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — WHAT WE ANNOTATE */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900/50 to-navy-950" />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <FadeInSection>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 rounded-full bg-[#8bdaef]" />
                  <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium">
                    Dataset Capabilities
                  </p>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight leading-tight">
                  Rich data for the full complexity of physical space.
                </h2>
              </FadeInSection>
            </div>

            <div>
              <FadeInSection>
                <p className="text-white/60 text-base md:text-lg leading-relaxed font-light mb-10">
                  Our datasets cover the full spectrum of physical interaction — from object-level perception to complex multi-step human behavior in diverse environments.
                </p>
              </FadeInSection>

              <div className="space-y-6">
                {[
                  {
                    title: "Object Recognition & Spatial Mapping",
                    description: "3D object identification, size, position, surface properties, and physical relationships within a scene.",
                  },
                  {
                    title: "Manipulation & Grasping",
                    description: "How humans pick up, move, and place objects; hand positioning, grip type, force signals.",
                  },
                  {
                    title: "Environment Diversity",
                    description: "Kitchens, workshops, warehouses, public spaces, and custom environments on request.",
                  },
                  {
                    title: "Edge Cases & Failure Modes",
                    description: "Cluttered scenes, poor lighting, ambiguous objects, interruptions and recovery actions.",
                  },
                  {
                    title: "Human-Robot Comparative Sequences",
                    description: "Parallel recordings of humans and robots performing the same tasks, for alignment and fine-tuning.",
                  },
                ].map((cap, i) => (
                  <FadeInSection key={cap.title} delay={i * 0.08}>
                    <div
                      className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500"
                      data-testid={`card-capability-${i}`}
                    >
                      <div className="flex flex-col sm:flex-row gap-5">
                        <div className="w-full sm:w-[220px] h-[160px] rounded-xl bg-navy-900/80 flex-shrink-0 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-[#0d1b2a] to-[#1a2d42] flex items-center justify-center">
                            <span className="text-[#8bdaef]/30 text-4xl font-mono font-bold">{String(i + 1).padStart(2, "0")}</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center py-1">
                          <h3 className="text-white text-lg font-display font-medium mb-2">
                            {cap.title}
                          </h3>
                          <p className="text-white/45 text-sm leading-relaxed font-light">
                            {cap.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO SHOWCASE */}
      <section className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight leading-[1.1] bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text text-transparent mb-6">
              Human-Robot Comparative Sequences
            </h2>
            <p className="text-white/60 text-base md:text-lg leading-relaxed font-light max-w-3xl mb-16">
              Parallel recordings of humans and robots performing the same tasks, for alignment and fine-tuning.
            </p>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeInSection>
              <div className="relative aspect-square rounded-2xl overflow-hidden" data-testid="video-pov-1">
                <video
                  src="/videos/hero_pov1.mp4"
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
                  src="/videos/hero_pov2.mp4"
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
        </div>
      </section>

      {/* SECTION 3 — WHY IT MATTERS */}
      <section className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              For AI & Robotics Teams
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-10 max-w-4xl leading-tight">
              The difference between a robot that works in a lab and one that works in the world is the data it trained on.
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <div className="max-w-3xl space-y-6">
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                Synthetic data gets you started. Simulation gets you close. But the gap between a controlled test environment and real-world deployment is filled with exactly the kinds of moments we capture — unexpected angles, unfamiliar objects, variations in human behavior, and situations that weren't in the spec.
              </p>
              <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium">
                Oceanveo datasets are built to close that gap.
              </p>
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                Whether you're training a manipulation policy, fine-tuning a perception model, or benchmarking generalization across environments — our data gives your system the grounding it needs.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="mt-12">
              <Link href="/book">
                <Button
                  size="lg"
                  className="rounded-xl px-8 h-14 text-base font-medium bg-white text-navy-900 hover:bg-sky-100 hover:scale-105 transition-all duration-300"
                  data-testid="button-contact-data"
                >
                  Get in Touch to Discuss Your Data Needs
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* SECTION 4 — EARLY ACCESS */}
      <section className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 md:p-20 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8bdaef]/[0.03] via-transparent to-[#8bdaef]/[0.03]" />
              <div className="relative z-10">
                <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
                  Coming Soon
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-6 leading-tight">
                  More to see. More to show.
                </h2>
                <p className="text-white/50 text-base md:text-lg max-w-[600px] mx-auto font-light mb-10">
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
