import { motion } from "framer-motion";
import { Eye, MessageSquareText, ShieldCheck, Cog } from "lucide-react";

const capabilities = [
  {
    icon: Eye,
    title: "Image & Video Annotation",
    description: "Pixel-perfect segmentation, bounding boxes, and keypoint annotation for computer vision models that need to see the world clearly."
  },
  {
    icon: MessageSquareText,
    title: "LLM & Multimodal Eval",
    description: "RLHF ranking, fact-checking, and creative writing evaluation by domain experts to align large language models with human intent."
  },
  {
    icon: ShieldCheck,
    title: "Safety & Policy Labeling",
    description: "Rigorous adversarial testing and red-teaming to identify bias, toxicity, and safety failures before deployment."
  },
  {
    icon: Cog,
    title: "Custom Pipelines",
    description: "Tailored workflows for niche domains like medical imaging, legal contract review, or financial data extraction."
  }
];

export function Capabilities() {
  return (
    <section id="capabilities" className="py-24 bg-navy-950 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Visual Abstract Strip - Full Width at Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full h-32 rounded-xl overflow-hidden relative border border-white/10 mb-16"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-navy-900" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-blue-500/30" />
          <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-blue-500/10" />
          <div className="absolute top-3/4 left-0 right-0 h-[1px] bg-blue-500/10" />
          
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 w-1 h-4 bg-sky-300 rounded-full"
              style={{ left: `${20 * i + 10}%` }}
              animate={{ height: [16, 32, 16], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
        </motion.div>

        {/* Title and Description - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display text-white mb-6">
            Human intelligence,<br />at machine speed.
          </h2>
          <p className="text-lg text-steel-500 leading-relaxed">
            Training modern AI systems requires more than raw labels. Oceanveo combines expert annotators with AI-assisted review to deliver datasets you can trust — at the speed your team needs.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 rounded-lg bg-navy-900 border border-white/5 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-navy-800 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                <cap.icon className="w-6 h-6 text-sky-200 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="text-xl font-display text-white mb-2">{cap.title}</h3>
              <p className="text-steel-500 text-sm leading-relaxed group-hover:text-sky-100/70 transition-colors">
                {cap.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
