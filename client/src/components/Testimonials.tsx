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
      <div className="px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24 px-6"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Trusted by <span className="text-blue-400">industry leaders</span>
          </h2>
          <p className="text-lg text-steel-400 max-w-2xl mx-auto">
            See what top AI companies say about working with Oceanveo
          </p>
        </motion.div>

        {/* Desktop Layout - 5 staggered cards full width */}
        <div className="hidden lg:flex justify-between items-start gap-0 w-full">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex-1 ${testimonial.offset}`}
            >
              <div className="mb-3 flex items-center gap-2 px-4">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className={`
                  ${testimonial.height}
                  bg-white
                  p-6
                  flex flex-col justify-between
                  hover:bg-gray-50
                  transition-all duration-300
                `}
              >
                <p className="text-slate-900 text-base leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-blue-500 text-sm mt-4">
                  — {testimonial.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tablet Layout - 5 cards in a row */}
        <div className="hidden md:flex lg:hidden gap-0 w-full">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex-1"
              style={{ marginTop: index % 2 === 0 ? 0 : 30 }}
            >
              <div className="mb-3 flex items-center gap-2 px-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className="
                  h-56
                  bg-white
                  p-4
                  flex flex-col justify-between
                "
              >
                <p className="text-slate-900 text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-blue-500 text-xs mt-3">
                  — {testimonial.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Layout - Horizontal scroll */}
        <div className="md:hidden flex gap-0 w-full overflow-x-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex-shrink-0 w-48"
              style={{ marginTop: index % 2 === 0 ? 0 : 20 }}
            >
              <div className="mb-3 flex items-center gap-2 px-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-steel-300">{testimonial.company}</span>
              </div>
              <div 
                className="
                  h-52
                  bg-white
                  p-4
                  flex flex-col justify-between
                "
              >
                <p className="text-slate-900 text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-blue-500 text-xs mt-3">
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
