import { motion } from "framer-motion";

const steps = [
  { step: "01", title: "Define Task", desc: "Consultation on labeling guidelines", size: "small" },
  { step: "02", title: "Deploy Experts", desc: "Curated teams for your domain", size: "medium" },
  { step: "03", title: "Label & Review", desc: "High-throughput annotation", size: "large" },
  { step: "04", title: "AI Quality Check", desc: "Automated anomaly detection", size: "medium" },
  { step: "05", title: "Ship Dataset", desc: "API delivery in your format", size: "small" },
];

const sizeClasses: Record<string, string> = {
  small: "w-32 h-28",
  medium: "w-36 h-32",
  large: "w-40 h-36",
};

export function Workflow() {
  return (
    <section id="workflow" className="py-32 lg:py-40 bg-black border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
          {/* SVG Curved Lines - Desktop */}
          <svg 
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" 
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Curved connecting lines */}
            <motion.path
              d="M 12% 50% Q 18% 30%, 26% 50%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
            />
            <motion.path
              d="M 30% 50% Q 38% 70%, 45% 50%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
            />
            <motion.path
              d="M 55% 50% Q 62% 30%, 70% 50%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6 }}
            />
            <motion.path
              d="M 74% 50% Q 82% 70%, 88% 50%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </svg>

          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative z-10 flex flex-col items-center"
            >
              {/* Node Box */}
              <div 
                className={`
                  ${sizeClasses[item.size]}
                  rounded-2xl 
                  bg-blue-500/10 
                  backdrop-blur-sm
                  border border-blue-500/30
                  flex flex-col items-center justify-center
                  shadow-lg shadow-blue-900/20
                  hover:border-blue-400/50 
                  hover:bg-blue-500/15
                  hover:shadow-blue-500/20
                  transition-all duration-300
                  group
                  mx-4 md:mx-6
                `}
              >
                <span className="text-3xl md:text-4xl font-display font-bold text-blue-400/60 group-hover:text-blue-300 transition-colors">
                  {item.step}
                </span>
                <span className="text-sm font-medium text-white mt-1 px-2 text-center">
                  {item.title}
                </span>
              </div>
              
              {/* Description below box */}
              <p className="text-sm text-steel-500 max-w-[140px] mx-auto mt-4 text-center">
                {item.desc}
              </p>

              {/* Mobile Connector */}
              {index !== steps.length - 1 && (
                <svg className="md:hidden w-2 h-12 my-2" viewBox="0 0 8 48">
                  <path
                    d="M 4 0 Q 8 24, 4 48"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    fill="none"
                  />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
