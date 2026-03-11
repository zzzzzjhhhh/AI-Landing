"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import waveImage from "@assets/generated_images/generated_image.png";

function Counter({ from, to, suffix = "" }: { from: number; to: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <span ref={ref} className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-white font-normal tracking-tighter">
      {isInView ? (
        <CountUp from={from} to={to} duration={2} />
      ) : from}
      <span className="text-[#8bdaef]">{suffix}</span>
    </span>
  );
}

function CountUp({ from, to, duration }: { from: number; to: number; duration: number }) {
  return <>{to}</>; 
}

export function Metrics() {
  return (
    <section id="metrics" className="pt-24 lg:pt-32 bg-navy-900 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8 text-center mb-20">
          <div>
            <div className="mb-2">
              <Counter from={0} to={10} suffix="M+" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">Labels Delivered</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={99} suffix=".7%" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">QA Pass Rate</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={500} suffix="+" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">Domain Experts</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={40} suffix="%" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">Faster Turnaround</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden relative"
        >
          <Image
            src={waveImage}
            alt="Ocean wave"
            fill
            sizes="100vw"
            className="object-cover brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-transparent to-navy-950" />
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-white mb-6 font-medium tracking-tight">
                Move your model forward — faster.
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed font-light">
                Stop bottlenecking your AI roadmap with slow or low quality data vendors. Partner with Oceanveo for scalable, expert-grade annotation.
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl bg-white px-12 text-lg font-medium text-navy-900 shadow-2xl shadow-black/50 transition-all hover:scale-105 hover:bg-sky-50"
              >
                <Link href="/book">
                  Connect with us
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <div className="mt-10 text-center">
                <p className="text-white/60 text-base font-medium mb-2">Not ready to sign up?</p>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                  Explore our{" "}
                  <Link href="/data-engine" className="text-[#8bdaef] hover:text-white transition-colors underline underline-offset-2">
                    Data Engine
                  </Link>{" "}
                  to understand what we build and how we build it — or reach us directly at{" "}
                  <a href="mailto:hello@oceanveo.ai" className="text-[#8bdaef] hover:text-white transition-colors underline underline-offset-2">
                    hello@oceanveo.ai
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
