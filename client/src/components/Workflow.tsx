import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const nodes = [
  { 
    step: "1", 
    title: "Define Task", 
    desc: "Consultation on labeling guidelines",
    x: 0,
    y: 80,
    width: 180,
    height: 160
  },
  { 
    step: "2", 
    title: "Deploy Experts", 
    desc: "Curated teams for your domain",
    x: 220,
    y: 10,
    width: 190,
    height: 170
  },
  { 
    step: "3", 
    title: "Label & Review", 
    desc: "High-throughput annotation",
    x: 460,
    y: 100,
    width: 200,
    height: 180
  },
  { 
    step: "4", 
    title: "AI Quality Check", 
    desc: "Automated anomaly detection",
    x: 710,
    y: 0,
    width: 190,
    height: 170
  },
  { 
    step: "5", 
    title: "Ship Dataset", 
    desc: "API delivery in your format",
    x: 950,
    y: 90,
    width: 180,
    height: 160
  },
];

const GRAPH_WIDTH = 1130;
const GRAPH_HEIGHT = 320;

function getBezierPath(from: typeof nodes[0], to: typeof nodes[0]) {
  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  
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
    <section id="workflow" className="py-32 lg:py-40 bg-navy-950 border-y border-white/5 overflow-hidden relative">
      {/* Smooth gradient background matching Hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-display text-white mb-4 font-medium">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        {/* Desktop Layout - Node Graph with responsive scaling */}
        <div 
          ref={containerRef}
          className="hidden lg:flex justify-center w-full"
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
            {/* SVG Bezier Connectors */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {nodes.slice(0, -1).map((node, i) => (
                <motion.path
                  key={i}
                  d={getBezierPath(node, nodes[i + 1])}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  strokeOpacity="0.4"
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
                  "
                >
                  <span className="text-3xl font-display font-bold text-blue-400 mb-2">
                    {node.step}.
                  </span>
                  <span className="text-xl font-display font-bold text-white mb-2">
                    {node.title}
                  </span>
                  <p className="text-sm text-steel-400 leading-relaxed">
                    {node.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scaled height container for proper layout flow */}
        <div 
          className="hidden lg:block" 
          style={{ height: GRAPH_HEIGHT * scale }}
        />

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
                  w-44 h-40
                  rounded-2xl
                  bg-slate-900/40
                  backdrop-blur-md
                  border border-slate-500/20
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
