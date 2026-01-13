import { motion } from "framer-motion";

const steps = [
  { step: "01", title: "Define Task", desc: "Consultation on labeling guidelines" },
  { step: "02", title: "Deploy Experts", desc: "Curated teams for your domain" },
  { step: "03", title: "Label & Review", desc: "High-throughput annotation" },
  { step: "04", title: "AI Quality Check", desc: "Automated anomaly detection" },
  { step: "05", title: "Ship Dataset", desc: "API delivery in your format" },
];

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

        {/* Desktop Layout */}
        <div className="hidden md:block relative">
          {/* SVG Curved Connector Lines */}
          <svg 
            className="absolute top-[70px] left-0 w-full h-24 pointer-events-none"
            viewBox="0 0 1000 80"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Line 1->2 */}
            <motion.path
              d="M 130 40 C 160 40, 170 20, 200 20 C 230 20, 240 40, 270 40"
              stroke="#334155"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            {/* Line 2->3 */}
            <motion.path
              d="M 330 40 C 370 40, 390 60, 430 60 C 470 60, 490 40, 530 40"
              stroke="#334155"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            {/* Line 3->4 */}
            <motion.path
              d="M 610 40 C 650 40, 660 20, 700 20 C 740 20, 750 40, 790 40"
              stroke="#334155"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.7 }}
            />
            {/* Line 4->5 */}
            <motion.path
              d="M 850 40 C 890 40, 900 60, 940 60 C 980 60, 990 40, 1000 40"
              stroke="#334155"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.9 }}
            />
          </svg>

          {/* Boxes Row */}
          <div className="flex justify-between items-start max-w-5xl mx-auto">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Node Box */}
                <div 
                  className="
                    w-36 h-28
                    rounded-xl
                    bg-navy-900/80
                    border border-slate-700/50
                    flex flex-col items-center justify-center
                    hover:border-blue-500/40
                    transition-all duration-300
                  "
                >
                  <span className="text-3xl font-display font-bold text-blue-400/70">
                    {item.step}
                  </span>
                  <span className="text-sm font-medium text-white mt-1">
                    {item.title}
                  </span>
                </div>
                
                {/* Description below */}
                <p className="text-sm text-steel-500 max-w-[140px] mt-6 text-center leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center gap-8">
          {steps.map((item, index) => (
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
                  bg-navy-900/80
                  border border-slate-700/50
                  flex flex-col items-center justify-center
                "
              >
                <span className="text-4xl font-display font-bold text-blue-400/70">
                  {item.step}
                </span>
                <span className="text-base font-medium text-white mt-2">
                  {item.title}
                </span>
              </div>
              <p className="text-sm text-steel-500 max-w-[160px] mt-4 text-center">
                {item.desc}
              </p>
              
              {/* Connector */}
              {index !== steps.length - 1 && (
                <div className="w-[2px] h-8 bg-slate-700/50 mt-4" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
