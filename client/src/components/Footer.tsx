import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative">
      {/* Subtle wave gradient transition */}
      <div className="w-full overflow-hidden leading-none">
        <svg 
          viewBox="0 0 1440 60" 
          className="w-full h-16"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="subtleWave" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#102a4c" />
            </linearGradient>
          </defs>
          <path 
            d="M0,0 L0,25 Q360,45 720,30 Q1080,15 1440,35 L1440,60 L0,60 Z"
            fill="url(#subtleWave)"
          />
        </svg>
      </div>
      
      {/* Footer content with matching gradient */}
      <div className="bg-gradient-to-b from-[#102a4c] to-navy-950 pt-16 pb-12">
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
