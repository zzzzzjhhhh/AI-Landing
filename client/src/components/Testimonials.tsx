import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const testimonials = [
  {
    company: "Anthropic",
    quote: "Oceanveo's expert annotators helped us achieve unprecedented accuracy in our RLHF training pipeline.",
    author: "ML Research Lead",
  },
  {
    company: "Scale AI",
    quote: "The quality and speed of delivery exceeded our expectations. A true partner in data excellence.",
    author: "VP of Operations",
  },
  {
    company: "OpenAI",
    quote: "When we needed domain experts for complex reasoning tasks, Oceanveo delivered world-class results.",
    author: "Training Data Manager",
  },
  {
    company: "Cohere",
    quote: "Their multimodal annotation capabilities are second to none. Highly recommend for any AI team.",
    author: "Head of Data",
  },
  {
    company: "Stability AI",
    quote: "Fast turnaround, rigorous QA, and genuine expertise. Exactly what we needed.",
    author: "Director of Engineering",
  },
];

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="py-32 lg:py-40 bg-gradient-to-b from-navy-900 to-slate-900">
      <div className="text-center mb-16 lg:mb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Trusted by <span className="text-blue-400">industry leaders</span>
          </h2>
          <p className="text-lg text-steel-400 max-w-2xl mx-auto">
            See what top AI companies say about working with Oceanveo
          </p>
        </motion.div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {testimonials.map((testimonial, index) => (
            <CarouselItem
              key={index}
              className="pl-4 basis-[85%] sm:basis-[45%] lg:basis-[30%] xl:basis-[22%]"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
                style={{ 
                  marginTop: index % 2 === 0 ? '0px' : '40px',
                }}
              >
                <div className="mb-3 flex items-center gap-2 px-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-sm font-medium text-steel-300">{testimonial.company}</span>
                </div>
                <div 
                  className="
                    bg-white
                    rounded-xl
                    p-6 lg:p-8
                    h-72 lg:h-80
                    flex flex-col justify-between
                  "
                >
                  <p className="text-slate-900 text-base lg:text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <p className="text-blue-500 text-sm mt-4">
                    — {testimonial.author}
                  </p>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-12">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-300
              ${current === index 
                ? 'bg-white w-8' 
                : 'bg-white/30 hover:bg-white/50'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
            data-testid={`dot-testimonial-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
