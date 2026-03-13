"use client";

import Image from "next/image";
import Link from "next/link";
import iconLogo from "@assets/Oceanveo_Icon_white_footer@3x_1772681185827.png";

export function Footer() {
  return (
    <footer className="relative">
      <div className="bg-navy-950 pt-24 pb-12">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
              <Link href="/" className="mb-4 block">
                <Image
                  src={iconLogo}
                  alt="Oceanveo"
                  className="h-[56px] w-auto cursor-pointer md:h-[70px]"
                />
              </Link>
              <p className="text-white text-sm leading-relaxed mb-2">
                Turning human experience into machine intelligence.
              </p>
              <p className="text-white text-sm leading-relaxed">
                Sunnyvale, CA | Data for Physical Intelligence.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 md:gap-24">
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Product</h4>
                <a href="/#capabilities" className="text-sm transition-colors" style={{ color: '#8bdaef' }}>Capabilities</a>
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
