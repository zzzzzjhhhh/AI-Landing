"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import bgMain from "@assets/bg_contact.jpg";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContactSubmissionError, useContactForm } from "@/hooks/use-contact";
import { api, type CreateContactInput } from "@shared/routes";

const caseStudyVideos = [
  {
    id: 1,
    title: "Autonomous Navigation",
    description: "Real-world trajectory data for self-driving systems",
    videoUrl: "/videos/1.mp4",
  },
  {
    id: 2,
    title: "Robotic Manipulation",
    description: "Expert-annotated grasping and assembly sequences",
    videoUrl: "/videos/2.mp4",
  },
  {
    id: 3,
    title: "Warehouse Automation",
    description: "Large-scale pick-and-place dataset pipelines",
    videoUrl: "/videos/3.mp4",
  },
  {
    id: 4,
    title: "Drone Intelligence",
    description: "Aerial perception and obstacle avoidance data",
    videoUrl: "/videos/4.mp4",
  },
  {
    id: 5,
    title: "Human-Robot Interaction",
    description: "Behavioral datasets for collaborative robotics",
    videoUrl: "/videos/5.mp4",
  },
];

function VideoCard({ video }: { video: typeof caseStudyVideos[0] }) {
  return (
    <div className="group" data-testid={`card-video-${video.id}`}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-navy-900 shadow-lg shadow-black/30">
        <video
          src={video.videoUrl}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          className="block h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

function CaseStudyCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDragging = useRef(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector("[data-card]")?.clientWidth || 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -cardWidth - 24 : cardWidth + 24,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 400);
    }
  }, [checkScroll]);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = false;
    const startX = e.pageX;
    const scrollLeft = el.scrollLeft;
    el.style.scrollSnapType = "none";
    const onMove = (ev: MouseEvent) => {
      const dx = ev.pageX - startX;
      if (Math.abs(dx) > 5) isDragging.current = true;
      el.scrollLeft = scrollLeft - dx;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      el.style.scrollSnapType = "x mandatory";
      setTimeout(checkScroll, 100);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [checkScroll]);

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-6">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 h-10 w-10"
          data-testid="button-carousel-prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 h-10 w-10"
          data-testid="button-carousel-next"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        className="flex overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none carousel-scroll"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollSnapType: "x mandatory", scrollBehavior: "smooth", gap: "16px" }}
      >
        {caseStudyVideos.map((video) => (
          <div
            key={video.id}
            data-card
            className="flex-shrink-0 snap-center md:snap-start carousel-card"
          >
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      <style>{`
        .carousel-card {
          width: 75vw;
        }
        @media (min-width: 768px) {
          .carousel-card {
            width: calc((100% - 32px) / 3);
          }
          .carousel-scroll {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default function BookCall() {
  const contactMutation = useContactForm();
  const shellSectionRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const shellAnimationFrame = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"form" | "confirmation" | "caseStudies">("form");
  const [shellMinHeight, setShellMinHeight] = useState<number | null>(null);

  const form = useForm<CreateContactInput>({
    resolver: zodResolver(api.contact.submit.input),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: CreateContactInput) => {
    form.clearErrors("root");

    contactMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        setPhase("confirmation");
        if (revealTimeoutRef.current !== null) {
          window.clearTimeout(revealTimeoutRef.current);
        }
        revealTimeoutRef.current = window.setTimeout(() => {
          setPhase("caseStudies");
        }, 2000);
      },
      onError: (error) => {
        if (error instanceof ContactSubmissionError && error.field) {
          form.setError(
            error.field,
            { type: "server", message: error.message },
            { shouldFocus: true },
          );
          return;
        }

        form.setError("root", {
          type: "server",
          message: error.message || "Something went wrong. Please try again.",
        });
      },
    });
  };

  useEffect(() => {
    if (phase !== "form") {
      return;
    }

    const node = shellRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      if (shellAnimationFrame.current !== null) {
        cancelAnimationFrame(shellAnimationFrame.current);
      }

      shellAnimationFrame.current = requestAnimationFrame(() => {
        setShellMinHeight(node.getBoundingClientRect().height);
      });
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (shellAnimationFrame.current !== null) {
        cancelAnimationFrame(shellAnimationFrame.current);
        shellAnimationFrame.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "confirmation") {
      return;
    }

    const node = shellSectionRef.current;
    if (!node) {
      return;
    }

    const scrollToConfirmation = () => {
      const top = Math.max(0, node.getBoundingClientRect().top + window.scrollY - 24);
      window.scrollTo({
        top,
        behavior: "smooth",
      });
    };

    const frame = window.requestAnimationFrame(scrollToConfirmation);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-navy-950 min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={bgMain}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-navy-950/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-950" />
      </div>

      <Navbar />

      <main className="flex-grow relative z-10">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 md:px-12 lg:px-16">
          <AnimatePresence initial={false} mode="wait">
            {phase === "caseStudies" ? (
              <motion.section
                key="case-studies"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="pb-24 pt-24 md:pb-[160px] md:pt-32"
              >
                <div className="mb-12 mt-6 md:mb-14 md:mt-8">
                  <h2 className="mb-5 text-left font-display text-[clamp(2.25rem,9vw,4.5rem)] font-medium tracking-tight text-white" data-testid="text-case-studies-heading">
                    Case Studies
                  </h2>
                  <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-[700px] font-light text-left">
                    See how we mirror human to humanoid.
                  </p>
                  <div className="border-b border-white/20 mt-8" />
                </div>

                <CaseStudyCarousel />
              </motion.section>
            ) : (
              <section
                ref={shellSectionRef}
                className="pb-20 pt-32 md:pb-24 md:pt-44"
                style={shellMinHeight ? { minHeight: `${shellMinHeight}px` } : undefined}
              >
                <AnimatePresence initial={false} mode="wait">
                  {phase === "form" ? (
                    <motion.div
                      key="form"
                      ref={shellRef}
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="flex flex-col items-center"
                    >
                      <div className="mb-12 w-full max-w-2xl text-center md:mb-16">
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6 }}
                          className="mb-6 text-[clamp(2.75rem,12vw,5.625rem)] font-display font-medium leading-[1.05] tracking-tight text-white"
                        >
                          Let's talk data.
                        </motion.h1>
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="text-base font-light leading-relaxed text-steel-400 md:text-xl"
                        >
                          Whether you're building robots, training foundation models, or exploring what physical AI data could unlock for your system — we want to hear from you.
                        </motion.p>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full max-w-xl"
                      >
                        <Form {...form}>
                          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-steel-400 text-sm font-medium">First Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Jane" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-first-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-steel-400 text-sm font-medium">Last Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Doe" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-last-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-steel-400 text-sm font-medium">Work Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="jane@company.com" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-steel-400 text-sm font-medium">Company</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Acme AI" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-company" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-steel-400 text-sm font-medium">Phone (Optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ""} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-steel-400 text-sm font-medium">What are you building?</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Tell us about your project requirements..."
                                      className="bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 min-h-[120px] focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all resize-none rounded-none px-0 py-4"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="input-message"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {form.formState.errors.root?.message ? (
                              <p role="alert" className="text-sm text-[#f6b2b2]">
                                {form.formState.errors.root.message}
                              </p>
                            ) : null}

                            <div className="flex justify-start">
                              <Button
                                type="submit"
                                disabled={contactMutation.isPending}
                                className="group mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-medium text-navy-900 shadow-xl shadow-blue-900/20 transition-all duration-300 hover:scale-105 hover:bg-sky-100 active:scale-[0.98] sm:w-auto sm:text-lg"
                                data-testid="button-submit"
                              >
                                {contactMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Request Access</span>
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                            <p className="text-white text-xs text-left mt-4 font-light">
                              We send early access video examples and dataset previews to qualified teams.
                            </p>
                          </form>
                        </Form>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="flex h-full min-h-full items-center justify-center"
                    >
                      <div className="mx-auto w-full max-w-3xl px-6 text-center">
                        <h1
                          className="text-[28px] sm:text-[36px] md:text-[48px] font-display font-medium text-white tracking-tight leading-[1.2]"
                          data-testid="text-confirmation-heading"
                        >
                          We received your request.
                          <br />
                          <span style={{ color: "#8bdaef" }}>Our team will contact you soon.</span>
                        </h1>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
