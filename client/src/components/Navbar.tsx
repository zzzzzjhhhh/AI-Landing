import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/Oceanveo_logo_white@3x_1772679900635.png";

export function Logo() {
  return (
    <div className="flex items-center gap-2 group cursor-pointer select-none">
      <div className="relative w-8 h-8">
        {/* The "O" element */}
        <div className="absolute inset-0 rounded-full border-[2.5px] border-white/20 group-hover:border-[#8bdaef]/40 transition-colors duration-500" />
        
        {/* The Gradient "V" element integrated with "O" */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="absolute inset-0 w-full h-full drop-shadow-[0_0_8px_rgba(139,218,239,0.5)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#8bdaef" />
              <stop offset="100%" stopColor="#4fa3bc" />
            </linearGradient>
          </defs>
          <path 
            d="M7 10L12 15L17 10" 
            stroke="url(#logo-grad)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="group-hover:translate-y-0.5 transition-transform duration-500"
          />
        </svg>
      </div>
      <span className="font-display font-bold text-2xl tracking-tighter text-white">
        Oceanveo
      </span>
    </div>
  );
}

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
          <img src={logoImg} alt="Oceanveo" className="h-[34px] md:h-[40px] w-auto cursor-pointer select-none" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/book">
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all rounded-xl px-6"
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-navy-950/95 backdrop-blur-xl border-b border-white/5 p-6 flex flex-col gap-6 animate-in slide-in-from-top-2">
          <Link href="/book">
            <Button 
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-xl h-12"
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
