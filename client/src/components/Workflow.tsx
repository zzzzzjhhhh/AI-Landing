import { motion } from "framer-motion";

const nodes = [
  { 
    step: "1", 
    title: "Define Task", 
    desc: "Consultation on labeling guidelines",
  },
  { 
    step: "2", 
    title: "Deploy Experts", 
    desc: "Curated teams for your domain",
  },
  { 
    step: "3", 
    title: "Label & Review", 
    desc: "High-throughput annotation",
  },
  { 
    step: "4", 
    title: "AI Quality Check", 
    desc: "Automated anomaly detection",
  },
  { 
    step: "5", 
    title: "Ship Dataset", 
    desc: "API delivery in your format",
  },
];

const verticalOffsets = [40, 0, 60, 10, 50];

export function Workflow() {
  return (
    <section id="workflow" className="py-32 lg:py-40 bg-black border-y border-white/5">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 lg:mb-24"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        {/* Desktop Layout - Fluid responsive grid */}
        <div className="hidden lg:block w-full max-w-[90rem] mx-auto px-4">
          <div className="flex justify-between items-start relative">
            {/* SVG Connectors - positioned behind nodes */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              preserveAspectRatio="none"
            >
              {nodes.slice(0, -1).map((_, i) => {
                const x1 = (i * 25) + 12.5;
                const x2 = ((i + 1) * 25) + 7.5;
                const y1 = verticalOffsets[i] + 80;
                const y2 = verticalOffsets[i + 1] + 80;
                const midX = (x1 + x2) / 2;
                
                return (
                  <motion.path
                    key={i}
                    d={`M ${x1}% ${y1} C ${midX}% ${y1}, ${midX}% ${y2}, ${x2}% ${y2}`}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    strokeOpacity="0.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                  />
                );
              })}
            </svg>

            {/* Node Cards */}
            {nodes.map((node, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative z-10 flex-1"
                style={{ 
                  marginTop: `${verticalOffsets[index]}px`,
                  maxWidth: 'clamp(10rem, 18vw, 14rem)',
                }}
              >
                <div 
                  className="
                    w-full
                    aspect-[4/5]
                    rounded-2xl
                    bg-slate-900/60
                    backdrop-blur-md
                    border border-slate-500/30
                    p-4 lg:p-6
                    flex flex-col justify-center
                    hover:border-blue-400/50
                    hover:bg-slate-800/70
                    transition-all duration-300
                    shadow-lg shadow-blue-900/10
                  "
                >
                  <span className="text-2xl lg:text-3xl xl:text-4xl font-display font-bold text-blue-400 mb-2">
                    {node.step}.
                  </span>
                  <span className="text-base lg:text-lg xl:text-xl font-display font-bold text-white mb-2 leading-tight">
                    {node.title}
                  </span>
                  <p className="text-xs lg:text-sm text-steel-400 leading-relaxed">
                    {node.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden flex-wrap justify-center gap-4">
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{ marginTop: index % 2 === 0 ? 0 : 30 }}
            >
              <div 
                className="
                  w-40 h-44
                  rounded-2xl
                  bg-slate-900/60
                  backdrop-blur-md
                  border border-slate-500/30
                  p-5
                  flex flex-col justify-center
                "
              >
                <span className="text-2xl font-display font-bold text-blue-400 mb-1">
                  {node.step}.
                </span>
                <span className="text-lg font-display font-bold text-white mb-2">
                  {node.title}
                </span>
                <p className="text-xs text-steel-400 leading-relaxed">
                  {node.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center gap-6">
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-full max-w-xs"
            >
              <div 
                className="
                  w-full
                  rounded-2xl
                  bg-slate-900/60
                  backdrop-blur-md
                  border border-slate-500/30
                  p-6
                  flex flex-col
                "
              >
                <span className="text-2xl font-display font-bold text-blue-400 mb-1">
                  {node.step}.
                </span>
                <span className="text-xl font-display font-bold text-white mb-2">
                  {node.title}
                </span>
                <p className="text-sm text-steel-400 leading-relaxed">
                  {node.desc}
                </p>
              </div>
              
              {index !== nodes.length - 1 && (
                <svg className="w-2 h-10 mt-2 mx-auto" viewBox="0 0 8 40">
                  <path d="M 4 0 Q 8 20, 4 40" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" fill="none" />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
