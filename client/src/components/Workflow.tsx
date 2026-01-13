import { motion } from "framer-motion";

const nodes = [
  { id: "step1", title: "Define the task", x: 0, y: 0 },
  { id: "step2", title: "Deploy experts", x: 25, y: 40 },
  { id: "step3", title: "Label & review", x: 50, y: 0 },
  { id: "step4", title: "AI-assisted QA", x: 75, y: 40 },
  { id: "step5", title: "Deliver datasets", x: 100, y: 0 },
];

export function Workflow() {
  return (
    <section id="workflow" className="py-24 lg:py-32 bg-navy-950 border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 text-left"
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              Built for speed.<br />
              <span className="text-white/40">Designed for quality.</span>
            </h2>
            <p className="text-lg md:text-xl text-steel-400 max-w-xl leading-relaxed font-light">
              Define the task, deploy experts, label at throughput, and ship datasets
              with AI-assisted QA baked in.
            </p>
          </motion.div>

          {/* Right Column: Horizontal Wave Diagram */}
          <div className="lg:col-span-2 relative min-h-[300px] flex items-center">
            <div className="w-full overflow-x-auto pb-12 hide-scrollbar">
              <div className="min-w-[800px] relative h-[200px] mx-auto">
                {/* SVG Connectors Layer */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  viewBox="0 0 800 200" 
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter id="neon-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3.5" result="blur"/>
                      <feColorMatrix
                        in="blur"
                        type="matrix"
                        values="
                          0 0 0 0 0
                          0 0 0 0 0.8
                          0 0 0 0 1
                          0 0 0 1 0"
                        result="blueGlow"
                      />
                      <feMerge>
                        <feMergeNode in="blueGlow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    
                    <linearGradient id="path-gradient-h" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Wave Path */}
                  <motion.path
                    d="M 50 100 C 150 20, 250 180, 350 100 C 450 20, 550 180, 650 100 C 750 20, 750 20, 750 100"
                    stroke="url(#path-gradient-h)"
                    strokeWidth="2.5"
                    fill="none"
                    filter="url(#neon-glow-cyan)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </svg>

                {/* Floating Markers and Text Layer */}
                <div className="absolute inset-0">
                  {nodes.map((node, i) => {
                    const x = 50 + i * 150;
                    // Match the Y-coords of the path wave: 100 is center, curves to 20 and 180
                    const y = i % 2 === 0 ? 100 : 100; // Simplified for labels, but path wave varies
                    // Actual node Y based on wave peaks
                    const nodeY = i % 2 === 0 ? 100 : 100; 
                    // Let's manually adjust to match visual peaks of the path
                    const manualY = [100, 70, 100, 130, 100];
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        style={{ left: `${x}px`, top: `${manualY[i]}px` }}
                        className="absolute flex flex-col items-center"
                      >
                        {/* Glowing circular dot */}
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] -translate-y-1/2" />
                        
                        {/* Label and Step Number */}
                        <div className={`absolute whitespace-nowrap flex flex-col items-center ${i % 2 === 0 ? 'bottom-6' : 'top-6'}`}>
                          <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-tighter">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-medium text-white/90 tracking-wide text-center">
                            {node.title}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
