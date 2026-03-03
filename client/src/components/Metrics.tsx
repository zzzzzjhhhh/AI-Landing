import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import waveImage from "@assets/generated_images/generated_image.png";

function Counter({ from, to, suffix = "" }: { from: number; to: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <span ref={ref} className="text-5xl md:text-6xl lg:text-7xl font-display text-white font-normal tracking-tighter">
      {isInView ? (
        <CountUp from={from} to={to} duration={2} />
      ) : from}
      <span className="text-[#8bdaef]">{suffix}</span>
    </span>
  );
}

function CountUp({ from, to, duration }: { from: number; to: number; duration: number }) {
  return <>{to}</>; 
}

export function Metrics() {
  return (
    <section id="metrics" className="py-24 lg:py-32 bg-gradient-to-b from-navy-900 to-navy-950 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8 text-center mb-20">
          <div>
            <div className="mb-2">
              <Counter from={0} to={10} suffix="M+" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">Labels Delivered</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={99} suffix=".7%" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">QA Pass Rate</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={500} suffix="+" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">Domain Experts</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={40} suffix="%" />
            </div>
            <p className="font-medium uppercase tracking-widest text-xs text-[#8bdaef]">Faster Turnaround</p>
          </div>
        </div>

      </div>
      {/* Full-screen narrow image - outside container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full h-64 md:h-80 lg:h-96 overflow-hidden relative"
      >
        <img 
          src={waveImage} 
          alt="Ocean wave"
          className="w-full h-full object-cover"
        />
      </motion.div>
      {/* Centered text content */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white mb-6 font-medium">
            Move your model forward — faster.
          </h2>
          <p className="text-lg md:text-xl text-steel-400 mb-10 leading-relaxed">
            Stop bottlenecking your AI roadmap with slow or low quality data vendors. Partner with Oceanveo for scalable, expert-grade annotation.
          </p>
          <Link href="/book">
            <Button size="lg" className="rounded-xl px-12 h-14 text-lg font-medium bg-white text-navy-900 hover:bg-sky-50 hover:scale-105 transition-all shadow-xl shadow-blue-900/20">
              Start your project
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
