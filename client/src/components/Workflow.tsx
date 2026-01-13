import { motion } from "framer-motion";

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

          {/* Right Column: Flowchart Panel */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[520px] aspect-[520/720] bg-navy-900/40 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
              {/* Faint Grid */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="h-px w-full bg-white/20 top-[14.2%] absolute" />
                <div className="h-px w-full bg-white/20 top-[28.5%] absolute" />
                <div className="h-px w-full bg-white/20 top-[42.8%] absolute" />
                <div className="h-px w-full bg-white/20 top-[57.1%] absolute" />
                <div className="h-px w-full bg-white/20 top-[71.4%] absolute" />
                <div className="h-px w-full bg-white/20 top-[85.7%] absolute" />
                <div className="w-px h-full bg-white/20 left-1/2 absolute" />
              </div>

              {/* SVG Connectors Layer */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                viewBox="0 0 520 720" 
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

                {/* Curved S-path connecting the nodes */}
                <motion.path
                  d="M260 105 C160 150, 160 210, 260 255 C360 300, 360 360, 260 405 C160 450, 160 510, 260 555 C360 600, 360 660, 260 705"
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

              {/* HTML Nodes Layer */}
              <div className="absolute inset-0">
                {[
                  { title: "Start", y: "60px" },
                  { title: "Define the task", y: "170px" },
                  { title: "Deploy experts", y: "280px" },
                  { title: "Label & review", y: "390px" },
                  { title: "AI-assisted QA", y: "500px" },
                  { title: "Ship datasets", y: "610px" }
                ].map((node, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    style={{ top: node.y }}
                    className="absolute left-1/2 -translate-x-1/2 w-48 h-12"
                  >
                    <div 
                      className="
                        w-full h-full
                        rounded-lg
                        bg-navy-950/90
                        backdrop-blur-md
                        border border-cyan-400/30
                        flex items-center justify-center
                        px-4
                        text-sm font-medium text-white/90
                        shadow-[inset_0_0_10px_rgba(34,211,238,0.05),0_0_15px_rgba(34,211,238,0.1)]
                        hover:border-cyan-400/60
                        hover:shadow-[inset_0_0_15px_rgba(34,211,238,0.1),0_0_20px_rgba(34,211,238,0.2)]
                        transition-all duration-300
                        tracking-wide
                      "
                    >
                      {node.title}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
