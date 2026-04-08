"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/Oceanveo_Icon_white_footer@3x_1772681185827.png";

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrollProgress(Math.min(window.scrollY / 72, 1));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navProgress = mobileMenuOpen ? 1 : scrollProgress;
  const headerPadding = 18 - navProgress * 6;
  const videoPortalHref = "/portal/videos";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow,padding] duration-300"
      style={{
        paddingTop: `${headerPadding}px`,
        paddingBottom: `${headerPadding}px`,
        backgroundColor: `rgba(2, 10, 24, ${0.72 * navProgress})`,
        borderBottom: `1px solid rgba(255, 255, 255, ${0.05 * navProgress})`,
        backdropFilter: `blur(${12 * navProgress}px)`,
        WebkitBackdropFilter: `blur(${12 * navProgress}px)`,
        boxShadow: `0 18px 40px rgba(0, 0, 0, ${0.12 * navProgress})`,
      }}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="block">
          <Image
            src={logoImg}
            alt="Oceanveo"
            priority
            className="h-[40px] w-auto cursor-pointer select-none sm:h-[46px] md:h-[54px]"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/data-engine" className="text-white/70 hover:text-white transition-colors text-sm font-medium tracking-wide" data-testid="link-data-engine">
            Data Engine
          </Link>
          <Link
            href={videoPortalHref}
            prefetch={false}
            className="text-white/70 hover:text-white transition-colors text-sm font-medium tracking-wide"
          >
            Video Data
          </Link>
          {isLoaded && !isSignedIn ? (
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/20 px-6 text-white transition-all hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          ) : null}
          {isLoaded && isSignedIn ? (
            <div className="flex items-center gap-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "h-10 w-10 ring-1 ring-white/15 ring-offset-0",
                  },
                }}
              />
            </div>
          ) : null}
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-white/20 px-6 text-white transition-all hover:border-white/40 hover:bg-white/10 hover:text-white"
            data-testid="button-book-call"
          >
            <Link href="/book">
              Connect
            </Link>
          </Button>
        </nav>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full flex flex-col gap-4 border-b border-white/5 bg-navy-950/95 px-5 pb-6 pt-5 backdrop-blur-xl animate-in slide-in-from-top-2 md:hidden">
          <Link
            href="/data-engine"
            className="rounded-xl border border-white/10 px-4 py-3 text-center text-base font-medium text-white/70 transition-colors hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Data Engine
          </Link>
          <Link
            href={videoPortalHref}
            prefetch={false}
            className="rounded-xl border border-white/10 px-4 py-3 text-center text-base font-medium text-white/70 transition-colors hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Video Data
          </Link>
          {isLoaded && !isSignedIn ? (
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl border-white/20 text-white hover:border-white/40 hover:bg-white/10"
            >
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            </Button>
          ) : null}
          {isLoaded && isSignedIn ? (
            <div className="flex items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "h-11 w-11 ring-1 ring-white/15 ring-offset-0",
                  },
                }}
              />
            </div>
          ) : null}
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl border-white/20 text-white hover:border-white/40 hover:bg-white/10"
          >
            <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
              Connect
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
