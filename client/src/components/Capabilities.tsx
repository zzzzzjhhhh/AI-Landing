import { motion } from "framer-motion";
import { Eye, MessageSquareText, ShieldCheck, Cog, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import qualityImage from "@assets/ChatGPT_Image_Mar_2,_2026,_09_20_13_PM_1772515231076.png";
import quantityImage from "@assets/ChatGPT_Image_Mar_2,_2026,_09_19_56_PM_1772515240642.png";
import diversityImage from "@assets/ChatGPT_Image_Mar_2,_2026,_09_21_13_PM_1772515277539.png";

const capabilities = [
  {
    icon: Eye,
    title: "Quality",
    description: "Quality determines whether data sharpens a model or distorts it. Rigorous validation, tight ontologies, and expert oversight ensure every annotation strengthens signal rather than introducing noise.",
    image: qualityImage
  },
  {
    icon: Cog,
    title: "Quantity",
    description: "Quantity is the force multiplier of intelligence. High-volume, precisely structured human data enables models to generalize beyond edge cases and converge toward real-world reliability at scale.",
    image: quantityImage
  },
  {
    icon: ShieldCheck,
    title: "Diversity",
    description: "Diversity prevents brittleness. Broad coverage across environments, demographics, edge cases, and behaviors produces models that remain stable under real-world variation instead of collapsing outside narrow distributions.",
    image: diversityImage
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
    <section id="capabilities" className="py-20 lg:py-24 bg-navy-950 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Visual Abstract Strip - Removed per user request or for cleaner look */}
        {/* Title and Description - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h3 className="text-4xl md:text-5xl font-display text-white mb-6">
            Engineered for Autonomy.
          </h3>
          <p className="text-lg leading-relaxed" style={{ color: '#8bdaef' }}>
            Oceanveo is partnering with startups, institutions, & industry leaders alike to hasten the world's transition toward autonomy. We provide massive scale, human-collected & annotated datasets suited to your engineering needs.
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
                <h3 className="font-display text-white mb-3 text-[28px]">{cap.title}</h3>
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
