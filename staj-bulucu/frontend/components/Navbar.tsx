"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-4" : "py-6"}`}>
      <div className="container-custom">
        <div className={`glass py-3 px-8 rounded-full flex items-center justify-between border-white/10 ${isScrolled ? "bg-white/10 blur-[12px]" : "bg-white/5"}`}>
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            <span className="gradient-text">STAJ</span>
            <span className="text-white ml-2 opacity-80">BULUCU</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors hover-lift">Keşfet</Link>
            <Link href="/save" className="text-sm font-medium hover:text-primary transition-colors hover-lift">Kaydedilenler</Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors hover-lift">Hakkında</Link>
            <div className="h-4 w-[1px] bg-white/20"></div>
            <button className="bg-primary text-bg-dark px-5 py-2 rounded-full text-xs font-bold hover:brightness-110 transition-all active:scale-95 animate-glow">
              Üye Ol
            </button>
          </div>
          
          <button className="md:hidden text-white opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
