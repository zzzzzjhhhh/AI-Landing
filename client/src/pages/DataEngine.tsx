"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DeferredVideo } from "@/components/DeferredVideo";
import {
  motion,
  useInView,
  useScroll,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  useRef,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const engineVideos = Array.from({ length: 35 }, (_, i) => ({
  video: `/videos/data-engine-optimized/engine/${i + 1}.mp4`,
  poster: `/images/data-engine/engine/${i + 1}.jpg`,
}));

type ViewportVideoProps = Omit<ComponentPropsWithoutRef<"video">, "src"> & {
  src: string;
  priority?: boolean;
  observeMargin?: NonNullable<Parameters<typeof useInView>[1]>["margin"];
};

function ViewportVideo({
  src,
  priority = false,
  observeMargin = "160px",
  autoPlay = true,
  preload,
  ...props
}: ViewportVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { margin: observeMargin });
  const [canLoad, setCanLoad] = useState(priority);

  useEffect(() => {
    if (isInView) {
      setCanLoad(true);
    }
  }, [isInView]);

  const shouldAutoplay = Boolean(autoPlay && !prefersReducedMotion);
  const effectivePreload = preload ?? (priority ? "metadata" : "none");

  useEffect(() => {
    const video = ref.current;
    if (!video || !shouldAutoplay || !canLoad) {
      return;
    }

    if (isInView) {
      video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [canLoad, isInView, shouldAutoplay]);

  return (
    <video
      ref={ref}
      src={canLoad ? src : undefined}
      autoPlay={shouldAutoplay}
      playsInline={props.playsInline ?? true}
      preload={effectivePreload}
      {...props}
    />
  );
}

function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.7, ease: "easeOut", delay }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 35 unique videos — distributed with no repeats (phase3 uses all 35, last slot wraps to 0)
const phase1Columns = [
  { videoIndices: [0,  1,  2,  3],  speed: 18 },
  { videoIndices: [4,  5,  6,  7],  speed: 20 },
  { videoIndices: [8,  9, 10, 11],  speed: 16 },
  { videoIndices: [12, 13, 14, 15], speed: 19 },
];

const phase2Columns = [
  { videoIndices: [0,  1,  2,  3],  speed: 18 },
  { videoIndices: [4,  5,  6,  7],  speed: 20 },
  { videoIndices: [8,  9, 10, 11],  speed: 16 },
  { videoIndices: [12, 13, 14, 15], speed: 19 },
  { videoIndices: [16, 17, 18, 19], speed: 17 },
  { videoIndices: [20, 21, 22, 23], speed: 21 },
  { videoIndices: [24, 25, 26, 27], speed: 15 },
  { videoIndices: [28, 29, 30, 31], speed: 18 },
];

const phase3Columns = [
  { videoIndices: [0,  1,  2],  speed: 18 },
  { videoIndices: [3,  4,  5],  speed: 20 },
  { videoIndices: [6,  7,  8],  speed: 16 },
  { videoIndices: [9, 10, 11],  speed: 19 },
  { videoIndices: [12, 13, 14], speed: 17 },
  { videoIndices: [15, 16, 17], speed: 21 },
  { videoIndices: [18, 19, 20], speed: 15 },
  { videoIndices: [21, 22, 23], speed: 18 },
  { videoIndices: [24, 25, 26], speed: 20 },
  { videoIndices: [27, 28, 29], speed: 16 },
  { videoIndices: [30, 31, 32], speed: 19 },
  { videoIndices: [33, 34, 0],  speed: 17 }, // 35 videos total; last slot reuses 0
];

function ScrollVideoColumn({
  videoIndices,
  speed,
  colWidth,
  gap,
  animate,
  allowPriorityLoad,
}: {
  videoIndices: number[];
  speed: number;
  colWidth: number;
  gap: number;
  animate: boolean;
  allowPriorityLoad: boolean;
}) {
  const loopCopies = animate ? [0, 1] : [0];

  return (
    <div className="flex-shrink-0 overflow-hidden h-full" style={{ width: colWidth }}>
      <div
        className="marquee-track-vertical flex flex-col"
        style={{
          animationDuration: animate ? `${speed}s` : undefined,
          animationPlayState: animate ? "running" : "paused",
          gap,
        }}
      >
        {loopCopies.map((setIdx) => (
          <div key={setIdx} className="flex flex-col flex-shrink-0" style={{ gap }}>
            {videoIndices.map((videoIndex, tileIndex) => (
              <div
                key={`${setIdx}-${tileIndex}`}
                className="relative flex-shrink-0 overflow-hidden rounded-lg"
              >
                {setIdx === 0 && tileIndex === 0 && allowPriorityLoad ? (
                  <ViewportVideo
                    src={engineVideos[videoIndex].video}
                    autoPlay
                    loop
                    muted
                    preload="metadata"
                    className="w-full h-auto object-contain"
                    priority
                    observeMargin="40px"
                  />
                ) : (
                  <DeferredVideo
                    src={engineVideos[videoIndex].video}
                    poster={engineVideos[videoIndex].poster}
                    alt=""
                    aria-hidden="true"
                    autoPlay
                    loop
                    muted
                    preload="none"
                    className="w-full aspect-square"
                    videoClassName="object-contain"
                    imageClassName="object-cover"
                    imageSizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 200px"
                    rootMargin="0px"
                  />
                )}
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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let frame: number | null = null;

    const updatePhase = () => {
      frame = null;
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrolled = -rect.top;
      const viewportHeight = window.innerHeight;
      const progress = scrolled / (sectionHeight - viewportHeight);
      const nextPhase = progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2;
      setScrollPhase((prev) => (prev === nextPhase ? prev : nextPhase));
    };

    const handleScroll = () => {
      if (frame !== null) {
        return;
      }

      frame = window.requestAnimationFrame(updatePhase);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const activeColumns = scrollPhase === 0 ? phase1Columns : scrollPhase === 1 ? phase2Columns : phase3Columns;
  const colWidth = scrollPhase === 0 ? 160 : scrollPhase === 1 ? 108 : 72;
  const colGap = scrollPhase === 0 ? 32 : scrollPhase === 1 ? 20 : 10;
  const videoGap = scrollPhase === 0 ? 120 : scrollPhase === 1 ? 64 : 28;
  const titleOpacity = scrollPhase === 0 ? 1 : 0;

  return (
    <section
      ref={sectionRef}
      className="relative h-[220svh] md:h-[300vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 40%, #0d1b2a 0%, #09111d 40%, #060d15 100%)" }}>
        <div
          className="absolute inset-0 z-0 flex flex-row items-center justify-center px-3 transition-all duration-700 ease-out md:px-6"
          style={{ gap: colGap }}
        >
          {activeColumns.map((column, index) => {
            const visibilityClass =
              index < 2
                ? "block"
                : index < 4
                  ? "hidden sm:block"
                  : index < 6
                    ? "hidden lg:block"
                    : "hidden xl:block";

            return (
              <div key={`${scrollPhase}-${index}`} className={visibilityClass}>
                <ScrollVideoColumn
                  videoIndices={column.videoIndices}
                  speed={column.speed}
                  colWidth={colWidth}
                  gap={videoGap}
                  animate={!prefersReducedMotion}
                  allowPriorityLoad={index === 0}
                />
              </div>
            );
          })}
        </div>

        <div
          className="relative z-10 flex flex-col items-center justify-center h-full transition-opacity duration-500"
          style={{ opacity: titleOpacity }}
        >
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
            className="mx-auto max-w-4xl bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text px-6 text-center text-[clamp(3.5rem,18vw,8rem)] font-display font-medium tracking-tight text-transparent md:px-24"
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
    <section className="bg-navy-950 py-20 md:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 items-start gap-10 md:gap-16 lg:grid-cols-[5fr_7fr] lg:gap-24">

          {/* LEFT — sticky heading */}
          <div className="lg:sticky lg:top-28">
            <FadeInSection>
              <p className="text-[#8bdaef] text-xs uppercase tracking-[0.2em] font-medium mb-5">
                Infrastructure Stack
              </p>
              <h2 className="mb-6 text-[clamp(2rem,6vw,2.75rem)] font-display font-medium leading-tight tracking-tight text-white">
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
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111318] p-6 transition-all duration-500 hover:border-[#8bdaef]/30 md:p-8"
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
                      className="text-[72px] font-extralight leading-none tracking-tighter transition-all duration-500 md:text-[90px]"
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
    <section id="how-it-works" className="bg-navy-950 py-20 md:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="mb-12 text-center">
          <p className="my-5 text-[clamp(2rem,6vw,3rem)] font-display font-medium tracking-tight text-[#8bdaef]">How it works</p>
        </div>

        {/* Video — full width at top */}
        <div className="mb-12 w-full overflow-hidden rounded-2xl border border-white/[0.08] md:mb-16" style={{ maxHeight: "60vh" }}>
          <DeferredVideo
            src="/videos/data-engine-optimized/apple_video.mp4"
            poster="/images/data-engine/apple_video.jpg"
            alt="Demonstration of the data-engine capture workflow"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            className="h-[36vh] w-full sm:h-[42vh] md:h-[60vh]"
            videoClassName="object-cover"
            imageClassName="object-cover"
            imageSizes="(max-width: 1280px) 100vw, 1280px"
            rootMargin="240px"
            style={{maxHeight: "60vh"}}
          />
        </div>

        {/* Steps below: left col = 01+02, right col = 03+04 */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-0">
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
                  <p className="text-white/45 text-sm leading-relaxed font-light md:pr-12">{step.body}</p>
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
                  <p className="text-white/45 text-sm leading-relaxed font-light md:pr-12">{step.body}</p>
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
    image: "/images/food.jpg",
  },
  {
    label: "Manipulation & grasping",
    description: "How humans pick up, move, and place objects; hand positioning, grip type, force signals.",
    image: "/images/mouse_hand.jpg",
  },
  {
    label: "Environment diversity",
    description: "Kitchens, workshops, warehouses, public spaces, and custom environments on request.",
    image: "/images/warehouse.jpg",
  },
  {
    label: "Edge cases & failure modes",
    description: "Cluttered scenes, poor lighting, ambiguous objects, interruptions and recovery actions.",
    image: "/images/hospital.jpg",
  },
];


function StatementSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<1 | 2>(1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setPhase(v < 0.5 ? 1 : 2);
    });
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="h-[130svh] bg-navy-950 md:h-[180vh]">
      <div className="sticky top-0 flex h-[100svh] items-center">
        <div className="mx-auto w-full max-w-[1280px] px-5 text-center sm:px-6 md:px-12 lg:px-16">
          <AnimatePresence mode="wait">
            {phase === 1 ? (
              <motion.p
                key="para"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto max-w-2xl text-base font-normal leading-relaxed text-[#ffffffdb] sm:text-lg"
              >
                Synthetic data and simulation are useful, but they cannot fully capture the variability, unpredictability, and physical nuance of real-world environments. Oceanveo is built to close that gap.
              </motion.p>
            ) : (
              <motion.h2
                key="title"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto max-w-4xl text-[clamp(2rem,7vw,3.5rem)] text-center font-display font-medium leading-tight tracking-tight"
                style={{ background: "linear-gradient(to right, #ffffff, #8bdaef, #4fa3bc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", paddingBottom: "0.12em" }}
              >
                Oceanveo data sets are built to close that gap.
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CapabilitiesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const GAP = 24;
  const VISIBLE = 3;
  const maxIndex = capabilities.length - VISIBLE;

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        const w = (trackRef.current.offsetWidth - GAP * (VISIBLE - 1)) / VISIBLE;
        setCardWidth(w);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(maxIndex, i + 1));
  const offset = activeIndex * (cardWidth + GAP);

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

        {/* Carousel wrapper */}
        <div className="relative max-w-[820px] mx-auto">
          {/* Prev button */}
          <button
            onClick={prev}
            disabled={activeIndex === 0}
            data-testid="button-carousel-prev"
            className="absolute left-[-56px] top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.10] flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          {/* Track */}
          <div className="overflow-hidden" ref={trackRef}>
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ gap: `${GAP}px`, transform: `translateX(-${offset}px)` }}
            >
              {capabilities.map((cap, i) => (
                <div
                  key={cap.label}
                  className="flex-shrink-0"
                  style={{ width: cardWidth > 0 ? `${cardWidth}px` : "33.333%" }}
                  data-testid={`card-capability-${i}`}
                >
                  <div className="w-full aspect-square rounded-2xl border border-white/[0.08] mb-5 overflow-hidden">
                    <img src={cap.image} alt={cap.label} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-[#8bdaef] text-base md:text-lg font-display font-medium mb-2">
                    {cap.label}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed font-light">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={next}
            disabled={activeIndex === maxIndex}
            data-testid="button-carousel-next"
            className="absolute right-[-56px] top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.10] flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              data-testid={`button-carousel-dot-${i}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? "bg-[#8bdaef] w-4" : "bg-white/20 w-1.5"}`}
            />
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
      <section className="bg-navy-950 py-16 text-center md:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <p className="mx-auto max-w-3xl text-base font-normal leading-relaxed text-[#ffffffdb] sm:text-lg">
              Oceanveo's Data Engine is the system behind how we collect, structure, validate, and deliver robotics training data. It is designed for physical environments, real human interaction, and the edge cases that determine whether AI systems hold up outside controlled conditions.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* INFRASTRUCTURE STACK SECTION */}
      <InfrastructureStack />

      {/* SECTION 1 — THE PIPELINE (scroll-driven sticky) */}
      <ProcessSteps />

      {/* VIDEO SHOWCASE */}
      <section className="relative py-20 md:py-28 lg:py-36">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
          <FadeInSection>
            <h2 className="mb-6 bg-gradient-to-r from-white via-[#8bdaef] to-white bg-clip-text text-[clamp(2rem,7vw,3.5rem)] font-display font-medium leading-[1.1] tracking-tight text-transparent">
              For AI & Robotics Teams
            </h2>
            <p className="mb-12 max-w-3xl text-base font-light leading-relaxed text-white/60 md:mb-16 md:text-lg">
              The gap between a system that performs in testing and one that performs in the real world is usually not the model alone — it is the training data behind it.
            </p>
          </FadeInSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeInSection>
              <div className="relative aspect-square rounded-2xl overflow-hidden" data-testid="video-pov-1">
                <DeferredVideo
                  src="/videos/data-engine-optimized/human_hands_cup.mp4"
                  poster="/images/data-engine/human_hands_cup.jpg"
                  alt="Human first-person hand interaction with a cup"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="none"
                  className="w-full h-full"
                  videoClassName="object-cover"
                  imageClassName="object-cover"
                  imageSizes="(max-width: 768px) 100vw, 50vw"
                  rootMargin="220px"
                />
                <div className="absolute left-0 top-0 z-10 max-w-[220px] p-4 sm:max-w-[260px] sm:p-6 md:max-w-[280px] md:p-8">
                  <div className="border-b border-white/20 mb-4" />
                  <h3 className="mb-4 text-lg font-display font-medium text-white sm:text-xl">Human</h3>
                  <div className="border-b border-white/20 mb-4" />
                  <p className="text-xs font-light leading-relaxed text-white/50 sm:text-sm">
                    Real human actions captured in natural environments — the raw foundation every model learns from.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 z-10 p-4 sm:p-6 md:p-8">
                  <p className="text-white/30 text-xs font-light">First-person capture · Controlled environment</p>
                </div>
              </div>
            </FadeInSection>
            <FadeInSection delay={0.15}>
              <div className="relative aspect-square rounded-2xl overflow-hidden" data-testid="video-pov-2">
                <DeferredVideo
                  src="/videos/data-engine-optimized/robot_hands_cup.mp4"
                  poster="/images/data-engine/robot_hands_cup.jpg"
                  alt="Robotic hand interaction with a cup"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="none"
                  className="w-full h-full"
                  videoClassName="object-cover"
                  imageClassName="object-cover"
                  imageSizes="(max-width: 768px) 100vw, 50vw"
                  rootMargin="220px"
                />
                <div className="absolute left-0 top-0 z-10 max-w-[220px] p-4 sm:max-w-[260px] sm:p-6 md:max-w-[280px] md:p-8">
                  <div className="border-b border-white/20 mb-4" />
                  <h3 className="mb-4 text-lg font-display font-medium text-white sm:text-xl">AI Intelligence</h3>
                  <div className="border-b border-white/20 mb-4" />
                  <p className="text-xs font-light leading-relaxed text-white/50 sm:text-sm">
                    Structured perception and spatial reasoning — trained on the richness of real-world experience.
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 z-10 p-4 sm:p-6 md:p-8">
                  <p className="text-white/30 text-xs font-light">Robotic replication · Aligned behavior</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* SECTION 2 — WHAT WE CAPTURE (hidden) */}
      {/* <CapabilitiesSection /> */}

      {/* STATEMENT SECTION — after the two videos */}
      <StatementSection />

      {/* SECTION 4 — EARLY ACCESS */}
      <section className="relative overflow-hidden py-24 md:py-44 lg:py-56">
        <img
          src="/images/fishtank_bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
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
