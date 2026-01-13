import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || mobileMenuOpen ? "glass-nav py-4" : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/">
          <span className="font-display font-bold text-2xl tracking-tighter text-white cursor-pointer select-none">
            OceanVO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#capabilities" className="text-sm font-medium text-sky-200 hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="/#workflow" className="text-sm font-medium text-sky-200 hover:text-white transition-colors">
            Workflow
          </a>
          <Link href="/book">
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all rounded-full px-6"
            >
              Book a call
            </Button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-navy-900 border-b border-white/10 p-6 flex flex-col gap-6 animate-in slide-in-from-top-2">
          <a 
            href="/#capabilities" 
            className="text-lg font-medium text-sky-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Capabilities
          </a>
          <a 
            href="/#workflow" 
            className="text-lg font-medium text-sky-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Workflow
          </a>
          <Link href="/book">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Book a call
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
