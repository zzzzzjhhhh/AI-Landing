import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative">
      {/* Wave gradient transition */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden -translate-y-full">
        <svg 
          viewBox="0 0 1440 120" 
          className="absolute bottom-0 w-full h-auto"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="footerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1628" stopOpacity="0" />
              <stop offset="100%" stopColor="#0f2847" />
            </linearGradient>
          </defs>
          <path 
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,70 L1440,120 L0,120 Z"
            fill="url(#footerGradient)"
          />
        </svg>
      </div>
      {/* Footer content with gradient background */}
      <div className="bg-navy-950 pt-24 pb-12">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
              <Link href="/">
                <span className="font-display font-bold text-2xl tracking-tighter text-white cursor-pointer mb-4 block">
                  Oceanveo
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-[#8bdaef]">
                Sunnyvale, CA | Data for Physical Intelligence.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 md:gap-24">
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Product</h4>
                <a href="/#capabilities" className="text-sm transition-colors" style={{ color: '#8bdaef' }}>Capabilities</a>
                <a href="/#workflow" className="text-sm transition-colors" style={{ color: '#8bdaef' }}>Workflow</a>
                <a href="/#metrics" className="text-sm transition-colors" style={{ color: '#8bdaef' }}>Results</a>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Company</h4>
                <Link href="/book" className="text-sm transition-colors" style={{ color: '#8bdaef' }}>Contact</Link>
                <span className="text-sm cursor-not-allowed opacity-50" style={{ color: '#8bdaef' }}>Careers</span>
                <span className="text-sm cursor-not-allowed opacity-50" style={{ color: '#8bdaef' }}>Privacy</span>
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
