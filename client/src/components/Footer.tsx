"use client";

import Image from "next/image";
import Link from "next/link";
import iconLogo from "@assets/Oceanveo_Icon_white_footer@3x_1772681185827.png";

export function Footer() {
  return (
    <footer className="relative">
      <div className="bg-navy-950 pb-10 pt-16 md:pb-12 md:pt-24">
        <div className="container mx-auto px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="mb-14 flex flex-col items-center justify-between gap-10 text-center md:mb-16 md:flex-row md:items-start md:text-left">
            <div className="max-w-sm">
              <Link href="/" className="mb-4 block">
                <Image
                  src={iconLogo}
                  alt="Oceanveo"
                  className="mx-auto h-[48px] w-auto cursor-pointer md:mx-0 md:h-[70px]"
                />
              </Link>
              <p className="mb-2 text-sm leading-relaxed text-white">
                Turning perception into vision.
              </p>
              <p className="text-sm leading-relaxed text-white">
                Sunnyvale, CA | Data for Physical Intelligence.
              </p>
            </div>

            <div className="flex w-full max-w-md flex-col justify-between gap-10 sm:flex-row md:w-auto md:gap-24">
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Product</h4>
                <a href="/#capabilities" className="text-sm transition-colors" style={{ color: "#8bdaef" }}>
                  Capabilities
                </a>
                <a href="/#metrics" className="text-sm transition-colors" style={{ color: "#8bdaef" }}>
                  Results
                </a>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-white">Company</h4>
                <Link href="/book" className="text-sm transition-colors" style={{ color: "#8bdaef" }}>
                  Contact
                </Link>
                <span className="cursor-not-allowed text-sm opacity-50" style={{ color: "#8bdaef" }}>
                  Careers
                </span>
                <span className="cursor-not-allowed text-sm opacity-50" style={{ color: "#8bdaef" }}>
                  Privacy
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-center md:flex-row md:text-left">
            <p className="text-xs text-blue-400/80">
              (c) {new Date().getFullYear()} Oceanveo Inc. All rights reserved.
            </p>
            <div className="flex gap-6" />
          </div>
        </div>
      </div>
    </footer>
  );
}
