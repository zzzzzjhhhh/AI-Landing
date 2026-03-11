"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import waveImage from "@assets/generated_images/generated_image.png";

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

export function Metrics() {
  return (
    <section id="metrics" className="bg-navy-950 overflow-hidden">
      {/* SECTION 4 — THE SCALE OF THE OPPORTUNITY */}
      <div className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-16">
          <FadeIn>
            <p className="text-[#8bdaef] text-sm uppercase tracking-[0.2em] font-medium mb-4">
              The Market
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-white font-medium tracking-tight mb-10 max-w-3xl leading-tight">
              Physical AI is the next trillion-dollar frontier.
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="max-w-3xl space-y-6">
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                The global robotics market is projected to exceed $260 billion by 2030. Humanoid robots alone are drawing billions in investment from the world's most ambitious technology companies. Behind every one of these systems is a hunger for training data that nobody has yet satisfied at scale.
              </p>
              <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                Oceanveo is positioning now — at the base of this curve — to become the essential data infrastructure for physical AI.
              </p>
              <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium">
                We are building the ocean that the next generation of machines will learn from.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* WAVE CTA */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden relative"
        >
          <Image
            src="/images/human-robot2.jpg"
            alt="Human and robot connection"
            fill
            sizes="100vw"
            className="object-cover brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-transparent to-navy-950" />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center max-w-3xl mx-auto drop-shadow-2xl"
            >
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl bg-white px-12 text-lg font-medium text-navy-900 shadow-2xl shadow-black/50 transition-all hover:scale-105 hover:bg-sky-50"
              >
                <Link href="/data-engine" data-testid="link-data-engine-cta">
                  See How Our Data Engine Works
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
