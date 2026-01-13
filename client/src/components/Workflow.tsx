import { motion } from "framer-motion";

const nodes = [
  { 
    step: "01", 
    title: "Define Task", 
    desc: "Consultation on labeling guidelines",
    x: 0,
    y: 60,
    width: 140,
    height: 110
  },
  { 
    step: "02", 
    title: "Deploy Experts", 
    desc: "Curated teams for your domain",
    x: 180,
    y: 20,
    width: 150,
    height: 120
  },
  { 
    step: "03", 
    title: "Label & Review", 
    desc: "High-throughput annotation",
    x: 380,
    y: 80,
    width: 160,
    height: 130
  },
  { 
    step: "04", 
    title: "AI Quality Check", 
    desc: "Automated anomaly detection",
    x: 590,
    y: 10,
    width: 150,
    height: 120
  },
  { 
    step: "05", 
    title: "Ship Dataset", 
    desc: "API delivery in your format",
    x: 790,
    y: 70,
    width: 140,
    height: 110
  },
];

function getBezierPath(from: typeof nodes[0], to: typeof nodes[0]) {
  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  
  const midX = (startX + endX) / 2;
  const cp1X = startX + (endX - startX) * 0.4;
  const cp2X = startX + (endX - startX) * 0.6;
  
  return `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;
}

export function Workflow() {
  return (
    <section id="workflow" className="py-32 lg:py-40 bg-black border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        {/* Desktop Layout - Node Graph */}
        <div className="hidden lg:block relative mx-auto" style={{ width: 930, height: 320 }}>
          {/* SVG Bezier Connectors */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            {nodes.slice(0, -1).map((node, i) => (
              <motion.path
                key={i}
                d={getBezierPath(node, nodes[i + 1])}
                stroke="#475569"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
              />
            ))}
          </svg>

          {/* Node Boxes */}
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="absolute"
              style={{ 
                left: node.x, 
                top: node.y, 
                width: node.width, 
                height: node.height 
              }}
            >
              <div 
                className="
                  w-full h-full
                  rounded-xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/40
                  flex flex-col items-center justify-center
                  hover:border-blue-500/50
                  hover:bg-slate-700/50
                  transition-all duration-300
                "
              >
                <span className="text-3xl font-display font-bold text-blue-400/80">
                  {node.step}
                </span>
                <span className="text-sm font-medium text-white mt-2 px-2 text-center leading-tight">
                  {node.title}
                </span>
              </div>
              
              {/* Description below node */}
              <p className="text-xs text-steel-500 text-center mt-3 leading-relaxed px-1">
                {node.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden flex-wrap justify-center gap-6">
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center"
              style={{ marginTop: index % 2 === 0 ? 0 : 30 }}
            >
              <div 
                className="
                  w-36 h-28
                  rounded-xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/40
                  flex flex-col items-center justify-center
                "
              >
                <span className="text-3xl font-display font-bold text-blue-400/80">
                  {node.step}
                </span>
                <span className="text-sm font-medium text-white mt-1">
                  {node.title}
                </span>
              </div>
              <p className="text-xs text-steel-500 max-w-[130px] mt-3 text-center">
                {node.desc}
              </p>
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
              className="flex flex-col items-center"
            >
              <div 
                className="
                  w-40 h-32
                  rounded-xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/40
                  flex flex-col items-center justify-center
                "
              >
                <span className="text-4xl font-display font-bold text-blue-400/80">
                  {node.step}
                </span>
                <span className="text-base font-medium text-white mt-2">
                  {node.title}
                </span>
              </div>
              <p className="text-sm text-steel-500 max-w-[160px] mt-3 text-center">
                {node.desc}
              </p>
              
              {index !== nodes.length - 1 && (
                <svg className="w-2 h-10 mt-2" viewBox="0 0 8 40">
                  <path d="M 4 0 Q 8 20, 4 40" stroke="#475569" strokeWidth="2" fill="none" />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
