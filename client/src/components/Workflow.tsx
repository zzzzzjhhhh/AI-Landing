import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const nodes = [
  { 
    step: "1", 
    title: "Define Task", 
    desc: "Consultation on labeling guidelines"
  },
  { 
    step: "2", 
    title: "Deploy Experts", 
    desc: "Curated teams for your domain"
  },
  { 
    step: "3", 
    title: "Label & Review", 
    desc: "High-throughput annotation"
  },
  { 
    step: "4", 
    title: "AI Quality Check", 
    desc: "Automated anomaly detection"
  },
  { 
    step: "5", 
    title: "Ship Dataset", 
    desc: "API delivery in your format"
  },
];

export function Workflow() {
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
      const scrollAmount = scrollRef.current.clientWidth * 0.6;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section id="workflow" className="py-32 lg:py-40 bg-black border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Built for speed. <span className="text-steel-500">Designed for quality.</span>
          </h2>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex justify-end gap-2 mb-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            data-testid="button-workflow-scroll-left"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            data-testid="button-workflow-scroll-right"
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
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex-shrink-0 w-[300px] md:w-[350px] snap-start"
            >
              {/* Glass container with glow border */}
              <div 
                className="
                  aspect-square
                  rounded-2xl
                  p-8
                  flex flex-col justify-center
                  transition-all duration-300
                  relative
                  overflow-hidden
                "
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                  }}
                />
                
                <div className="relative z-10">
                  {/* Number + Title on same line */}
                  <div className="mb-4">
                    <span className="text-2xl font-display font-bold text-blue-400">{node.step}. </span>
                    <span className="text-2xl font-display font-bold text-white">{node.title}</span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-base text-steel-400 leading-relaxed">
                    {node.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
