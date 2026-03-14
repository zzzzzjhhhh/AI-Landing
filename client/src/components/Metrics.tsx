"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

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
          className="relative h-[360px] w-full overflow-hidden sm:h-[460px] md:h-[600px] lg:h-[700px]"
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
          <div className="container mx-auto px-5 sm:px-6 md:px-12 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center max-w-3xl mx-auto drop-shadow-2xl"
            >
              <h2 className="mx-auto mb-6 max-w-3xl text-[clamp(2rem,7vw,3.5rem)] font-display font-medium leading-tight tracking-tight text-white sm:mb-8">
                Built for AI that has to operate in the real world.
              </h2>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-white px-8 text-base font-medium text-navy-900 shadow-2xl shadow-black/50 transition-all hover:scale-105 hover:bg-sky-50 sm:h-14 sm:px-12 sm:text-lg"
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
