import { motion } from "framer-motion";
import { Eye, MessageSquareText, ShieldCheck, Cog, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import annotationImage from "@assets/Screenshot_2026-01-15_at_15.29.02_1768463823698.png";
import llmImage from "@assets/Screenshot_2026-01-13_at_14.33.50_1768286034432.png";

const capabilities = [
  {
    icon: Eye,
    title: "Image & Video Annotation",
    description: "Pixel-perfect segmentation, bounding boxes, and keypoint annotation for computer vision models that need to see the world clearly.",
    image: annotationImage
  },
  {
    icon: MessageSquareText,
    title: "LLM & Multimodal Eval",
    description: "RLHF ranking, fact-checking, and creative writing evaluation by domain experts to align large language models with human intent.",
    image: llmImage
  },
  {
    icon: ShieldCheck,
    title: "Safety & Policy Labeling",
    description: "Rigorous adversarial testing and red-teaming to identify bias, toxicity, and safety failures before deployment.",
    image: null
  },
  {
    icon: Cog,
    title: "Custom Pipelines",
    description: "Tailored workflows for niche domains like medical imaging, legal contract review, or financial data extraction.",
    image: null
  }
];

export function Capabilities() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section id="capabilities" className="py-32 lg:py-40 bg-navy-950 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Visual Abstract Strip - Full Width at Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full h-40 rounded-xl overflow-hidden relative border border-white/10 mb-20"
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
          <h2 className="text-sky-300 mb-4 uppercase tracking-[0.3em] text-xs font-bold">
            Designed for quality.
          </h2>
          <h3 className="text-4xl md:text-5xl font-display text-white mb-6">
            Human intelligence,<br />at machine speed.
          </h3>
          <p className="text-lg text-steel-500 leading-relaxed">
            Training modern AI systems requires more than raw labels. Oceanveo combines expert annotators with AI-assisted review to deliver datasets you can trust.
          </p>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex justify-end gap-2 mb-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Horizontal Slider */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {capabilities.map((cap, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex-shrink-0 w-[320px] md:w-[380px] snap-start"
            >
              {/* Square card */}
              <div className="aspect-square bg-gradient-to-br from-slate-800/80 to-navy-900/80 border border-slate-700/50 rounded-3xl relative overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                {/* Subtle glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Image fills entire card, or icon in corner */}
                {cap.image ? (
                  <img 
                    src={cap.image} 
                    alt={cap.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative z-10 p-8 md:p-10">
                    <div className="w-14 h-14 rounded-xl bg-navy-800/80 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors border border-white/5">
                      <cap.icon className="w-7 h-7 text-sky-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Text content BELOW the square */}
              <div className="pt-6 px-2">
                <h3 className="text-2xl font-display text-white mb-3">{cap.title}</h3>
                <p className="text-steel-400 text-base leading-relaxed group-hover:text-sky-100/70 transition-colors">
                  {cap.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
