import { motion } from "framer-motion";

const nodes = [
  { id: "step1", title: "Define the task" },
  { id: "step2", title: "Deploy experts" },
  { id: "step3", title: "Label & review" },
  { id: "step4", title: "Ship datasets" },
];

export function Workflow() {
  return (
    <section id="workflow" className="py-24 lg:py-32 bg-navy-950 border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <h2 className="md:text-5xl lg:text-7xl font-display text-white mb-8 tracking-tight font-medium text-[48px]">
              Built for speed.<br />
              <span style={{ color: '#8bdaef' }}>Designed for quality.</span>
            </h2>
            <p className="text-lg md:text-xl text-steel-400 max-w-xl leading-relaxed font-light">
              Define the task, deploy experts, label at throughput, and ship datasets
              with AI-assisted QA baked in.
            </p>
          </motion.div>

          {/* Right Column: Centered Floating Flowchart */}
          <div className="relative flex justify-center min-h-[500px]">
            {/* SVG Connectors Layer - Centered */}
            <svg 
              className="absolute left-1/2 -translate-x-1/2 w-[300px] h-full pointer-events-none" 
              viewBox="0 0 300 500" 
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
                
                <linearGradient id="path-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Curved S-path centered at x=150 */}
              <motion.path
                d="M150 0 C50 100, 250 150, 150 250 C50 350, 250 400, 150 500"
                stroke="url(#path-gradient)"
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
            <div className="absolute left-1/2 -translate-x-1/2 w-[300px] h-full">
              {/* STEP 01 */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ left: "150px", top: "0px" }}
                className="absolute flex items-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] -translate-x-1/2" />
                <div className="ml-4 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-tighter">01</span>
                  <span className="text-sm font-medium text-white/90 tracking-wide">Define the task</span>
                </div>
              </motion.div>

              {/* STEP 02: Dot to the RIGHT of line, label to the RIGHT of dot */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ left: "109px", top: "140px" }} // x=109 is approx 24px right of line (line at ~85)
                className="absolute flex items-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] -translate-x-1/2" />
                <div className="ml-4 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-tighter">02</span>
                  <span className="text-sm font-medium text-white/90 tracking-wide">Deploy experts</span>
                </div>
              </motion.div>

              {/* STEP 03: Dot directly ON line, label right */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ left: "215px", top: "280px" }}
                className="absolute flex items-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] -translate-x-1/2" />
                <div className="ml-4 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-tighter">03</span>
                  <span className="text-sm font-medium text-white/90 tracking-wide">Label & review</span>
                </div>
              </motion.div>

              {/* STEP 04: Dot directly ON line, label right */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ left: "155px", top: "420px" }}
                className="absolute flex items-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] -translate-x-1/2" />
                <div className="ml-4 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-tighter">04</span>
                  <span className="text-sm font-medium text-white/90 tracking-wide">Ship datasets</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
