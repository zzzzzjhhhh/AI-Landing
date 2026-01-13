import { motion } from "framer-motion";

const nodes = [
  { id: "step1", title: "Start", y: 0 },
  { id: "step2", title: "Define the task", y: 120 },
  { id: "step3", title: "Deploy experts", y: 240 },
  { id: "step4", title: "Label & review", y: 360 },
  { id: "step5", title: "AI-assisted QA", y: 480 },
  { id: "step6", title: "Ship datasets", y: 600 },
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
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
              Built for speed.<br />
              <span className="text-white/40">Designed for quality.</span>
            </h2>
            <p className="text-lg md:text-xl text-steel-400 max-w-xl leading-relaxed font-light">
              Define the task, deploy experts, label at throughput, and ship datasets
              with AI-assisted QA baked in.
            </p>
          </motion.div>

          {/* Right Column: Centered Floating Flowchart */}
          <div className="relative flex justify-center min-h-[700px]">
            {/* SVG Connectors Layer - Centered */}
            <svg 
              className="absolute left-1/2 -translate-x-1/2 w-[300px] h-full pointer-events-none" 
              viewBox="0 0 300 700" 
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
                d="M150 0 C50 100, 250 200, 150 300 C50 400, 250 500, 150 600"
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
              {nodes.map((node, i) => {
                // Calculate position on the S-curve
                const t = i / (nodes.length - 1);
                // Approx x-coords matching the path "M150 0 C50 100, 250 200, 150 300 C50 400, 250 500, 150 600"
                // This is a simplified positioning to align with the visual curve peaks/center
                const xPositions = [150, 100, 200, 150, 100, 150];
                const x = xPositions[i];
                const y = i * 120;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    className="absolute flex items-center"
                  >
                    {/* Glowing circular dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] -translate-x-1/2" />
                    
                    {/* Label and Step Number */}
                    <div className="ml-4 flex items-center gap-2 whitespace-nowrap">
                      <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-tighter">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium text-white/90 tracking-wide">
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
    </section>
  );
}
