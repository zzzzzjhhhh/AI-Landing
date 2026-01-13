import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import bgMain from "@assets/bg_main_1768281613638.jpg";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pb-32">
      {/* Background image - moved below header */}
      <div className="absolute inset-0 z-0 pt-24">
        <div className="relative w-full h-full">
          <img 
            src={bgMain} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-navy-950" />
        </div>
      </div>
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10 text-center max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 mb-12 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Accepting New Partners</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display leading-[1.1] mb-10 text-white font-medium tracking-tight">
            High-quality AI data.<br />
            <span className="text-gradient">Delivered fast.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-steel-500 max-w-2xl mx-auto mb-14 font-light leading-relaxed">
            Oceanveo builds expert-powered annotation and evaluation pipelines — combining human judgment with AI-assisted quality control to move models forward, faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/book">
              <Button size="lg" className="rounded-xl px-8 h-14 text-base font-medium bg-white text-navy-900 hover:bg-sky-100 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                Book a call
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            
            <a href="#capabilities">
              <Button variant="outline" size="lg" className="rounded-xl px-8 h-14 text-base font-medium border-white/20 text-white hover:bg-white/5 w-full sm:w-auto">
                See how it works
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-steel-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, duration: 2, repeat: Infinity }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-steel-500 to-transparent" />
      </motion.div>
    </section>
  );
}
