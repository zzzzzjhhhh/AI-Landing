import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const nodes = [
  { 
    id: "start",
    title: "Start", 
    x: 100,
    y: 150,
    width: 120,
    height: 80,
    type: "start"
  },
  { 
    id: "condition",
    title: "Condition", 
    x: 400,
    y: 50,
    width: 160,
    height: 80,
    type: "condition"
  },
  { 
    id: "action1",
    title: "Action", 
    x: 400,
    y: 150,
    width: 160,
    height: 80,
    type: "action"
  },
  { 
    id: "action2",
    title: "Action", 
    x: 400,
    y: 250,
    width: 160,
    height: 80,
    type: "action"
  },
  { 
    id: "end",
    title: "Ship Dataset", 
    x: 750,
    y: 150,
    width: 160,
    height: 80,
    type: "end"
  },
];

const connections = [
  { from: "start", to: "condition" },
  { from: "start", to: "action1" },
  { from: "start", to: "action2" },
  { from: "condition", to: "end" },
  { from: "action1", to: "end" },
  { from: "action2", to: "end" },
];

const GRAPH_WIDTH = 1000;
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
            Your workflows, <br className="md:hidden" />
            <span className="text-steel-500">always in motion.</span>
          </h2>
          <p className="text-lg text-steel-400 max-w-2xl mx-auto leading-relaxed">
            Build multi-step automations that flex with your team's real-time decisions — not against them.
          </p>
        </motion.div>

        {/* Desktop Layout - Node Graph */}
        <div 
          ref={containerRef}
          className="hidden lg:flex justify-center w-full min-h-[400px]"
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
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
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
                  className={`
                    w-full h-full
                    rounded-xl
                    ${node.type === 'condition' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/40 border-slate-500/20'}
                    backdrop-blur-md
                    border
                    flex items-center justify-center gap-3
                    px-4
                    hover:border-blue-400/50
                    hover:bg-slate-800/60
                    transition-all duration-300
                    group
                  `}
                >
                  {node.type === 'condition' && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  )}
                  <span className="text-lg font-display font-medium text-white group-hover:text-blue-200 transition-colors">
                    {node.title}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet Fallback */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
          {nodes.filter(n => n.type !== 'start' && n.type !== 'end').map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`
                p-6 rounded-xl border
                ${node.type === 'condition' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/40 border-slate-500/20'}
                text-left
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                {node.type === 'condition' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                <span className="text-white font-medium">{node.title}</span>
              </div>
              <p className="text-sm text-steel-500">
                {node.type === 'condition' ? 'Automated logic based decisions.' : 'Scalable human-in-the-loop task.'}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
