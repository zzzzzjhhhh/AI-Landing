import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-white/5 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
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
          <p className="text-xs text-steel-500">
            © {new Date().getFullYear()} Oceanveo Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
