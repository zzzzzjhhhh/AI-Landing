import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const nodes = [
  { 
    id: "step1",
    step: "1.",
    title: "Define Task", 
    desc: "Consultation on labeling guidelines",
    x: 50,
    y: 150,
    width: 200,
    height: 140,
    type: "step"
  },
  { 
    id: "step2",
    step: "2.",
    title: "Deploy Experts", 
    desc: "Curated teams for your domain",
    x: 320,
    y: 30,
    width: 200,
    height: 140,
    type: "step"
  },
  { 
    id: "step3",
    step: "3.",
    title: "Label & Review", 
    desc: "High-throughput annotation",
    x: 320,
    y: 270,
    width: 200,
    height: 140,
    type: "step"
  },
  { 
    id: "step4",
    step: "4.",
    title: "AI Quality Check", 
    desc: "Automated anomaly detection",
    x: 590,
    y: 150,
    width: 200,
    height: 140,
    type: "step"
  },
  { 
    id: "step5",
    step: "5.",
    title: "Ship Dataset", 
    desc: "API delivery in your format",
    x: 860,
    y: 150,
    width: 200,
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

const GRAPH_WIDTH = 1110;
const GRAPH_HEIGHT = 440;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = Math.min(1, containerWidth / GRAPH_WIDTH);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <section id="workflow" className="py-24 lg:py-32 bg-navy-950 border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        {/* Desktop Layout - Node Graph */}
        <div 
          ref={containerRef}
          className="hidden lg:flex justify-center w-full min-h-[440px]"
        >
          <div 
            className="relative"
            style={{ 
              width: GRAPH_WIDTH, 
              height: GRAPH_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'center top'
            }}
          >
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {connections.map((conn, i) => {
                const fromNode = nodes.find(n => n.id === conn.from)!;
                const toNode = nodes.find(n => n.id === conn.to)!;
                return (
                  <motion.path
                    key={i}
                    d={getBezierPath(fromNode, toNode)}
                    stroke="url(#gradient-line)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                </linearGradient>
              </defs>
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
                  top: node.y, 
                  width: node.width, 
                  height: node.height 
                }}
              >
                <div 
                  className="
                    w-full h-full
                    rounded-2xl
                    bg-slate-900/40
                    backdrop-blur-md
                    border border-slate-500/20
                    p-6
                    flex flex-col justify-center
                    hover:border-blue-400/30
                    hover:bg-slate-800/50
                    transition-all duration-300
                    shadow-lg shadow-blue-900/5
                    group
                  "
                >
                  <span className="text-2xl font-display font-bold text-blue-400 mb-1 group-hover:text-blue-300 transition-colors">
                    {node.step}
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
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden flex flex-col items-center gap-6">
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center w-full max-w-xs"
            >
              <div 
                className="
                  w-full
                  rounded-2xl
                  bg-slate-900/40
                  backdrop-blur-md
                  border border-slate-500/20
                  p-6
                  flex flex-col
                  text-left
                "
              >
                <span className="text-xl font-display font-bold text-blue-400 mb-1">
                  {node.step}
                </span>
                <span className="text-lg font-display font-bold text-white mb-2">
                  {node.title}
                </span>
                <p className="text-sm text-steel-400 leading-relaxed">
                  {node.desc}
                </p>
              </div>
              
              {index !== nodes.length - 1 && (
                <svg className="w-2 h-10 mt-2" viewBox="0 0 8 40">
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
