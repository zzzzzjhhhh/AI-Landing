import { motion } from "framer-motion";

const nodes = [
  { 
    id: "step1",
    step: "1.",
    title: "Define Task", 
    desc: "Consultation on labeling guidelines",
    x: 100,
    y: 0,
    width: 220,
    height: 140,
    type: "step"
  },
  { 
    id: "step2",
    step: "2.",
    title: "Deploy Experts", 
    desc: "Curated teams for your domain",
    x: 450,
    y: -80,
    width: 220,
    height: 140,
    type: "step"
  },
  { 
    id: "step3",
    step: "3.",
    title: "Label & Review", 
    desc: "High-throughput annotation",
    x: 450,
    y: 80,
    width: 220,
    height: 140,
    type: "step"
  },
  { 
    id: "step4",
    step: "4.",
    title: "AI Quality Check", 
    desc: "Automated anomaly detection",
    x: 800,
    y: 0,
    width: 220,
    height: 140,
    type: "step"
  },
  { 
    id: "step5",
    step: "5.",
    title: "Ship Dataset", 
    desc: "API delivery in your format",
    x: 1150,
    y: 0,
    width: 220,
    height: 140,
    type: "step"
  },
];

const connections = [
  { from: "step1", to: "step2" },
  { from: "step1", to: "step3" },
  { from: "step2", to: "step4" },
  { from: "step3", to: "step4" },
  { from: "step4", to: "step5" },
];

const GRAPH_WIDTH = 1400;
const GRAPH_HEIGHT = 400;

function getBezierPath(fromNode: typeof nodes[0], toNode: typeof nodes[0]) {
  const startX = fromNode.x + fromNode.width;
  const startY = fromNode.y + fromNode.height / 2;
  const endX = toNode.x;
  const endY = toNode.y + toNode.height / 2;
  
  const cp1X = startX + (endX - startX) * 0.4;
  const cp2X = startX + (endX - startX) * 0.6;
  
  return `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;
}

export function Workflow() {
  return (
    <section id="workflow" className="py-32 lg:py-48 bg-navy-950 border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        {/* Desktop Layout - Branched Node Graph */}
        <div className="hidden lg:flex justify-center w-full min-h-[400px]">
          <div 
            className="relative"
            style={{ 
              width: GRAPH_WIDTH, 
              height: GRAPH_HEIGHT,
              transform: `scale(0.85)`,
              transformOrigin: 'center center'
            }}
          >
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {connections.map((conn, i) => {
                const fromNode = nodes.find(n => n.id === conn.from)!;
                const toNode = nodes.find(n => n.id === conn.to)!;
                return (
                  <motion.path
                    key={i}
                    d={getBezierPath(fromNode, toNode)}
                    stroke="url(#glow-gradient)"
                    strokeWidth="4"
                    fill="none"
                    filter="url(#glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                  />
                );
              })}
            </svg>

            {nodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="absolute flex items-center justify-center"
                style={{ 
                  left: node.x, 
                  top: node.y + 100, // Offset for better centering
                  width: node.width, 
                  height: node.height 
                }}
              >
                <div 
                  className="
                    w-full h-full
                    rounded-2xl
                    bg-navy-900/60
                    backdrop-blur-xl
                    border border-white/10
                    p-8
                    flex flex-col justify-center
                    text-left
                    hover:border-blue-400/40
                    hover:bg-navy-800/80
                    transition-all duration-500
                    shadow-2xl shadow-black/40
                    group
                  "
                >
                  <span className="text-3xl font-display font-bold text-blue-400 mb-2 group-hover:text-blue-300 transition-colors">
                    {node.step}
                  </span>
                  <span className="text-xl font-display font-bold text-white mb-2 tracking-tight">
                    {node.title}
                  </span>
                  <p className="text-sm text-steel-400 leading-relaxed font-light">
                    {node.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet Layout - Vertical Stack */}
        <div className="lg:hidden flex flex-col items-center gap-8 max-w-sm mx-auto">
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center w-full"
            >
              <div 
                className="
                  w-full
                  rounded-2xl
                  bg-navy-900/60
                  backdrop-blur-xl
                  border border-white/10
                  p-8
                  flex flex-col
                  text-left
                  shadow-xl
                "
              >
                <span className="text-2xl font-display font-bold text-blue-400 mb-2">
                  {node.step}
                </span>
                <span className="text-xl font-display font-bold text-white mb-2">
                  {node.title}
                </span>
                <p className="text-sm text-steel-400 leading-relaxed">
                  {node.desc}
                </p>
              </div>
              
              {index !== nodes.length - 1 && (
                <div className="w-1 h-12 bg-gradient-to-b from-blue-500/40 to-transparent mt-2" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
