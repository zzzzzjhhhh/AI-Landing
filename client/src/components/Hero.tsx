"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero_bg.jpg"
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950/80" />
      </div>
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10 text-center max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="sm:text-[48px] md:text-[70px] font-display mb-10 text-white font-medium tracking-tight text-[41px]">
            Translate human perception into<br />
            <span className="text-gradient">structured intelligence.</span>
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
