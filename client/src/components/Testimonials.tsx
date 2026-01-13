import { motion } from "framer-motion";

const testimonials = [
  {
    company: "Anthropic",
    quote: "Oceanveo's expert annotators helped us achieve unprecedented accuracy in our RLHF training pipeline.",
    author: "ML Research Lead",
    height: "h-80",
    offset: "mt-16",
  },
  {
    company: "Scale AI",
    quote: "The quality and speed of delivery exceeded our expectations. A true partner in data excellence.",
    author: "VP of Operations",
    height: "h-96",
    offset: "mt-8",
  },
  {
    company: "OpenAI",
    quote: "When we needed domain experts for complex reasoning tasks, Oceanveo delivered world-class results.",
    author: "Training Data Manager",
    height: "h-[28rem]",
    offset: "mt-0",
  },
  {
    company: "Cohere",
    quote: "Their multimodal annotation capabilities are second to none. Highly recommend for any AI team.",
    author: "Head of Data",
    height: "h-96",
    offset: "mt-12",
  },
  {
    company: "Stability AI",
    quote: "Fast turnaround, rigorous QA, and genuine expertise. Exactly what we needed.",
    author: "Director of Engineering",
    height: "h-80",
    offset: "mt-20",
  },
];

export function Testimonials() {
  return (
    <section className="py-32 lg:py-40 bg-gradient-to-b from-navy-900 to-slate-900">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Trusted by <span className="text-blue-400">industry leaders</span>
          </h2>
          <p className="text-lg text-steel-400 max-w-2xl mx-auto">
            See what top AI companies say about working with Oceanveo
          </p>
        </motion.div>

        {/* Desktop Layout - 5 staggered cards */}
        <div className="hidden lg:flex justify-center items-start gap-6 w-full max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex-1 ${testimonial.offset}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className={`
                  ${testimonial.height}
                  rounded-2xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/30
                  p-6
                  flex flex-col justify-between
                  hover:border-blue-400/40
                  hover:bg-slate-700/50
                  transition-all duration-300
                `}
              >
                <p className="text-white text-base leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-steel-500 text-sm mt-4">
                  — {testimonial.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tablet Layout - 3 + 2 grid */}
        <div className="hidden md:grid lg:hidden grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className="
                  h-64
                  rounded-2xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/30
                  p-5
                  flex flex-col justify-between
                "
              >
                <p className="text-white text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-steel-500 text-xs mt-3">
                  — {testimonial.author}
                </p>
              </div>
            </motion.div>
          ))}
          {testimonials.slice(3).map((testimonial, index) => (
            <motion.div
              key={index + 3}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
              className="col-span-1 first:col-start-1 last:col-start-2"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className="
                  h-64
                  rounded-2xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/30
                  p-5
                  flex flex-col justify-between
                "
              >
                <p className="text-white text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-steel-500 text-xs mt-3">
                  — {testimonial.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Layout - Vertical stack */}
        <div className="md:hidden flex flex-col gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className="
                  rounded-2xl
                  bg-slate-800/50
                  backdrop-blur-sm
                  border border-slate-600/30
                  p-5
                  flex flex-col
                "
              >
                <p className="text-white text-base leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-steel-500 text-sm mt-4">
                  — {testimonial.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
