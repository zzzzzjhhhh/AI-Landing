import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const nodes = [
  { id: "step1", title: "Define the task", type: "pill" },
  { id: "step2", title: "Deploy experts", type: "pill" },
  { id: "step3", title: "Label & review", type: "pill" },
  { id: "step4", title: "AI-assisted QA", type: "pill" },
  { id: "step5", title: "Ship datasets", type: "pill" },
];

export function Workflow() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section id="workflow" className="py-24 lg:py-32 bg-navy-950 border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Title Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              Built for speed.<br />
              <span className="text-white/40">Designed for quality.</span>
            </h2>
            <p className="text-lg md:text-xl text-steel-400 max-w-xl leading-relaxed font-light">
              Oceanveo builds expert-powered annotation and evaluation pipelines — combining human judgment with AI-assisted quality control to move models forward, faster.
            </p>
          </motion.div>

          {/* Right Column: Vertical Flowchart */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Fake UI Background Panel */}
            <div className="absolute -inset-4 md:-inset-8 bg-navy-900/40 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden pointer-events-none">
               <div className="absolute inset-0 opacity-20">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent top-1/4 absolute" />
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent top-2/4 absolute" />
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent top-3/4 absolute" />
                  <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent left-1/4 absolute" />
               </div>
            </div>

            <div className="relative w-[240px] flex flex-col items-center gap-12 py-8">
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <defs>
                  <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {nodes.map((_, i) => i < nodes.length - 1 && (
                  <motion.line
                    key={i}
                    x1="120"
                    y1={44 + i * (44 + 48)} // Approx center of nodes
                    x2="120"
                    y2={44 + (i + 1) * (44 + 48)}
                    stroke="url(#neon-gradient)"
                    strokeWidth="1.5"
                    filter="url(#neon-glow)"
                    initial={{ scaleY: 0, opacity: 0 }}
                    whileInView={{ scaleY: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    style={{ originY: 0 }}
                  />
                ))}
              </svg>

              {nodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative z-10 w-full"
                >
                  <div 
                    className="
                      w-full h-11
                      rounded-lg
                      bg-navy-950/80
                      backdrop-blur-md
                      border border-cyan-400/30
                      flex items-center justify-center
                      px-6
                      shadow-[0_0_15px_rgba(34,211,238,0.1)]
                      group
                      hover:border-cyan-400/60
                      hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]
                      transition-all duration-300
                    "
                  >
                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors tracking-wide">
                      {node.title}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
