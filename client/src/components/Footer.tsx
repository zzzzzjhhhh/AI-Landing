import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative">
      {/* Wave SVG at the top of footer */}
      <div className="w-full overflow-hidden leading-none">
        <svg 
          viewBox="0 0 1440 100" 
          className="w-full h-20 md:h-24"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="40%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#0f2847" />
            </linearGradient>
          </defs>
          <path 
            d="M0,0 L0,40 Q200,70 400,50 Q600,30 800,55 Q1000,80 1200,45 Q1350,25 1440,55 L1440,100 L0,100 Z"
            fill="url(#waveGradient)"
          />
        </svg>
      </div>
      
      {/* Footer content */}
      <div className="bg-gradient-to-b from-[#0f2847] to-navy-950 pt-12 pb-12">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
              <Link href="/">
                <span className="font-display font-bold text-2xl tracking-tighter text-white cursor-pointer mb-4 block">
                  Oceanveo
                </span>
              </Link>
              <p className="text-steel-500 text-sm leading-relaxed">
                High-quality AI data pipelines powered by expert human intelligence and automated validation.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 md:gap-24">
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Product</h4>
                <a href="/#capabilities" className="text-sm text-steel-500 hover:text-white transition-colors">Capabilities</a>
                <a href="/#workflow" className="text-sm text-steel-500 hover:text-white transition-colors">Workflow</a>
                <a href="/#metrics" className="text-sm text-steel-500 hover:text-white transition-colors">Results</a>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Company</h4>
                <Link href="/book" className="text-sm text-steel-500 hover:text-white transition-colors">Contact</Link>
                <span className="text-sm text-steel-500 cursor-not-allowed opacity-50">Careers</span>
                <span className="text-sm text-steel-500 cursor-not-allowed opacity-50">Privacy</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-blue-400/80">
              © {new Date().getFullYear()} Oceanveo Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
