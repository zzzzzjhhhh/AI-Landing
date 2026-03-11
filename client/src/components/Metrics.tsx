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
              <h2 className="text-white font-display font-medium tracking-tight text-3xl sm:text-4xl md:text-5xl leading-tight mb-8">
                We are building the ocean<br />that the next generation of machines will learn from.
              </h2>
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl bg-white px-12 text-lg font-medium text-navy-900 shadow-2xl shadow-black/50 transition-all hover:scale-105 hover:bg-sky-50"
              >
                <Link href="/book" data-testid="link-data-engine-cta">
                  Get in touch
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
