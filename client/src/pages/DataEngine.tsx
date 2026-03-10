import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Cpu, Layers, Zap, Database, Target, GitBranch } from "lucide-react";

const engineVideos = [
  "/videos/engine/1.mp4",
  "/videos/engine/2.mp4",
  "/videos/engine/3.mp4",
  "/videos/engine/4.mp4",
  "/videos/engine/5.mp4",
  "/videos/engine/6.mp4",
  "/videos/engine/7.mp4",
  "/videos/engine/8.mp4",
];

function MarqueeColumn({ speed, videoIndices }: { speed: number; videoIndices: number[] }) {
  return (
    <div className="marquee-col overflow-hidden h-full flex-shrink-0 video-col-width">
      <div
        className="marquee-track-vertical flex flex-col"
        style={{ animationDuration: `${speed}s` }}
      >
        {[0, 1].map((setIdx) => (
          <div key={setIdx} className="flex flex-col flex-shrink-0 video-vertical-gap">
            {videoIndices.map((vi, i) => (
              <div
                key={`${setIdx}-${i}`}
                className="flex-shrink-0 overflow-hidden"
              >
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

const workflowSteps = [
  {
    step: "01",
    title: "Data Input",
    description: "Raw video, sensor, and trajectory data streams are ingested from diverse real-world collection pipelines.",
  },
  {
    step: "02",
    title: "Processing",
    description: "Automated pipelines clean, normalize, and deduplicate incoming data at scale with minimal latency.",
  },
  {
    step: "03",
    title: "Analysis",
    description: "Advanced algorithms identify patterns, anomalies, and key features within the processed datasets.",
  },
  {
    step: "04",
    title: "Structuring",
    description: "Data is organized into labeled, categorized formats optimized for model training and evaluation.",
  },
  {
    step: "05",
    title: "Quality Assurance",
    description: "Expert reviewers validate annotations and outputs against rigorous quality benchmarks.",
  },
  {
    step: "06",
    title: "Actionable Output",
    description: "Structured, VLA-ready datasets are delivered for direct integration into autonomy and robotics workflows.",
  },
];

const capabilities = [
  {
    icon: Cpu,
    title: "Intelligent Data Parsing",
    description: "Automatically decompose complex multi-modal inputs into structured, usable components.",
  },
  {
    icon: Layers,
    title: "Automated Classification",
    description: "Categorize and label data at scale using hybrid human-AI classification systems.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Stream and process data with sub-second latency for time-critical applications.",
  },
  {
    icon: Database,
    title: "Scalable Infrastructure",
    description: "Built to handle millions of data points without compromising speed or accuracy.",
  },
  {
    icon: Target,
    title: "High Precision Output",
    description: "99.7% quality assurance across all annotations and structured outputs.",
  },
  {
    icon: GitBranch,
    title: "Workflow Integration",
    description: "Seamlessly connect to existing ML pipelines, model training loops, and evaluation systems.",
  },
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

export default function DataEngine() {
  return (
    <div className="bg-navy-950 min-h-screen flex flex-col">
      <Navbar />

      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 flex flex-row items-center justify-center video-columns-container">
          <MarqueeColumn speed={30} videoIndices={[0, 1, 5, 6]} />
          <MarqueeColumn speed={34} videoIndices={[2, 3, 7, 4]} />
          <MarqueeColumn speed={28} videoIndices={[4, 5, 0, 1]} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-transparent to-navy-950 z-[1]" />

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[36px] sm:text-[48px] md:text-[70px] font-display font-medium text-white tracking-tight leading-[1.1]"
            data-testid="text-engine-heading"
          >
            Data Engine
          </motion.h1>
        </div>
      </section>

      <section id="how-it-works" className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              Workflow
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-6">
              How It Works
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-[600px] font-light mb-16">
              From raw data collection to model-ready output, every step is engineered for precision and scale.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, i) => (
              <FadeInSection key={step.step} delay={i * 0.08}>
                <div
                  className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 h-full"
                  data-testid={`card-step-${step.step}`}
                >
                  <span className="text-[#8bdaef]/40 text-sm font-mono tracking-wider mb-4 block">
                    {step.step}
                  </span>
                  <h3 className="text-white text-xl font-display font-medium mb-3">
                    {step.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed font-light">
                    {step.description}
                  </p>
                  <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#8bdaef]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900/50 to-navy-950" />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          <FadeInSection>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-6">
              System Logic
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-[600px] font-light mb-16">
              An intelligent, layered system designed to handle the full data lifecycle from collection to deployment.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8bdaef]/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8bdaef]/30 to-transparent" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {[
                  { label: "Collection Layer", items: ["Sensor Streams", "Video Pipelines", "Edge Devices", "Human Operators"] },
                  { label: "Processing Layer", items: ["Deduplication", "Normalization", "Feature Extraction", "Quality Scoring"] },
                  { label: "Output Layer", items: ["Structured Datasets", "VLA Trajectories", "Model-Ready Bundles", "API Delivery"] },
                ].map((layer, i) => (
                  <div key={layer.label}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-2 h-2 rounded-full bg-[#8bdaef]/60" />
                      <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                        {layer.label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {layer.items.map((item) => (
                        <div
                          key={item}
                          className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-3.5 text-white/60 text-sm font-light hover:bg-white/[0.06] hover:text-white/80 transition-all duration-300"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    {i < 2 && (
                      <div className="hidden md:flex items-center justify-end mt-6">
                        <ArrowRight className="w-4 h-4 text-[#8bdaef]/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-6">
              Key Capabilities
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-[600px] font-light mb-16">
              Purpose-built features that power the Data Engine from end to end.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <FadeInSection key={cap.title} delay={i * 0.08}>
                <div
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 h-full"
                  data-testid={`card-capability-${i}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#8bdaef]/10 flex items-center justify-center mb-5 group-hover:bg-[#8bdaef]/20 transition-colors duration-500">
                    <cap.icon className="w-5 h-5 text-[#8bdaef]/70" />
                  </div>
                  <h3 className="text-white text-lg font-display font-medium mb-3">
                    {cap.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed font-light">
                    {cap.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28 md:py-36">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 md:p-20 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8bdaef]/[0.03] via-transparent to-[#8bdaef]/[0.03]" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-6 leading-tight">
                  Built to transform complexity<br />into clarity.
                </h2>
                <p className="text-white/50 text-base md:text-lg max-w-[500px] mx-auto font-light mb-10">
                  Ready to see how Oceanveo can power your data pipeline?
                </p>
                <Link href="/book">
                  <Button
                    size="lg"
                    className="rounded-xl px-8 h-14 text-base font-medium bg-white text-navy-900 hover:bg-sky-100 hover:scale-105 transition-all duration-300"
                    data-testid="button-contact"
                  >
                    Contact Us
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
        .video-col-width {
          width: 200px;
        }
        .video-columns-container {
          gap: 300px;
          opacity: 0.4;
        }
        .video-vertical-gap {
          gap: 300px;
          padding-bottom: 300px;
        }
        @media (max-width: 1200px) {
          .video-col-width {
            width: 150px;
          }
          .video-columns-container {
            gap: 220px;
          }
          .video-vertical-gap {
            gap: 220px;
            padding-bottom: 220px;
          }
        }
        @media (max-width: 768px) {
          .video-col-width {
            width: 100px;
          }
          .video-columns-container {
            gap: 150px;
          }
          .video-vertical-gap {
            gap: 150px;
            padding-bottom: 150px;
          }
        }
      `}</style>
    </div>
  );
}
