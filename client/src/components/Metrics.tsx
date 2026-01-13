import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function Counter({ from, to, suffix = "" }: { from: number; to: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <span ref={ref} className="text-5xl md:text-6xl font-display font-bold text-white">
      {isInView ? (
        <CountUp from={from} to={to} duration={2} />
      ) : from}
      <span className="text-blue-500">{suffix}</span>
    </span>
  );
}

// Simple CountUp implementation without external deps if needed, 
// but sticking to standard React patterns
function CountUp({ from, to, duration }: { from: number; to: number; duration: number }) {
  // Simple render for now, fully animating this would require a custom hook or 'framer-motion'
  // using animate() helper which is cleaner than intervals.
  return <>{to}</>; 
}

export function Metrics() {
  return (
    <section id="metrics" className="py-24 bg-gradient-to-b from-navy-900 to-navy-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center mb-20">
          <div>
            <div className="mb-2">
              <Counter from={0} to={10} suffix="M+" />
            </div>
            <p className="text-steel-500 font-medium uppercase tracking-widest text-xs">Labels Delivered</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={99} suffix=".7%" />
            </div>
            <p className="text-steel-500 font-medium uppercase tracking-widest text-xs">QA Pass Rate</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={500} suffix="+" />
            </div>
            <p className="text-steel-500 font-medium uppercase tracking-widest text-xs">Domain Experts</p>
          </div>
          <div>
            <div className="mb-2">
              <Counter from={0} to={40} suffix="%" />
            </div>
            <p className="text-steel-500 font-medium uppercase tracking-widest text-xs">Faster Turnaround</p>
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
              Move your model forward — faster.
            </h2>
            <p className="text-lg text-sky-200 mb-10">
              Stop bottling up your AI roadmap with slow data pipelines. Partner with Oceanveo for scalable, expert-grade annotation.
            </p>
            <Link href="/book">
              <Button size="lg" className="rounded-full px-10 h-14 text-lg font-medium bg-white text-navy-900 hover:bg-sky-50 hover:scale-105 transition-all shadow-xl shadow-blue-900/20">
                Start your project
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
