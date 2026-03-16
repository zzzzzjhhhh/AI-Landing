"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero_bg.jpg"
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950/80" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-navy-950 to-transparent" />
      </div>
      <div className="container relative z-10 mx-auto max-w-6xl px-5 text-center sm:px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1
            className="mx-auto mb-6 max-w-4xl text-[clamp(2.75rem,10vw,4.5rem)] font-display font-medium leading-[1.02] tracking-tight text-white sm:mb-8"
            style={{ textShadow: "0 0 40px rgba(139,218,239,0.35), 0 2px 20px rgba(0,0,0,0.6)" }}
          >
            Turning perception into vision.
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-xl bg-white px-8 text-base font-medium text-navy-900 transition-all duration-300 hover:scale-105 hover:bg-sky-100 sm:w-auto"
            >
              <Link href="/book" data-testid="link-get-in-touch">
                Get in touch
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
