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
    <section id="workflow" className="py-24 bg-black border-y border-white/5">
      <div className="container mx-auto px-4 md:px-6 text-center">
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

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-900 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-2xl bg-navy-900 border border-blue-500/20 flex items-center justify-center mb-6 shadow-lg shadow-black/50 group hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1">
                  <span className="text-3xl font-display font-bold text-blue-500/40 group-hover:text-blue-400 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-steel-500 max-w-[160px] mx-auto">
                  {item.desc}
                </p>
                
                {/* Mobile Connector */}
                {index !== steps.length - 1 && (
                  <div className="md:hidden w-[1px] h-8 bg-blue-900 my-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
