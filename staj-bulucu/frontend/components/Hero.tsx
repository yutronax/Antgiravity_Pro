"use client";

import Image from "next/image";
import { useState } from "react";

interface HeroProps {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

export default function Hero({ onSearch, isLoading }: HeroProps) {
  const [keyword, setKeyword] = useState("");

  const handleSearch = () => {
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  return (
    <section className="relative pt-10 pb-20 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full glass border-white/5 text-[10px] font-bold tracking-widest uppercase text-primary mb-6 animate-pulse">
              Yapay Zeka Destekli Staj Platformu
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8">
              Geleceğini <br />
              <span className="gradient-text">Bugün İnşa Et</span>
            </h1>
            <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto lg:mx-0">
              LinkedIn, Indeed ve Kariyer.net gibi dev platformlardaki binlerce staj ilanını 
              tek bir çatı altında, yapay zeka analizi ile keşfedin.
            </p>

            {/* Smart Search Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row gap-2 max-w-2xl mx-auto lg:mx-0 group focus-within:ring-2 focus-within:ring-primary/40 transition-all">
              <div className="flex-1 flex items-center px-4 gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Yazılım Geliştirme, Tasarım, Pazarlama..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-3 text-white placeholder:text-white/30"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-primary text-bg-dark px-8 py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Aranıyor..." : "Fırsatları Bul"}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 opacity-60">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">1,240+</span>
                <span className="text-[10px] uppercase tracking-wider">Aktif İlan</span>
              </div>
              <div className="w-[1px] h-10 bg-white/10 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">450+</span>
                <span className="text-[10px] uppercase tracking-wider">Lider Şirket</span>
              </div>
              <div className="w-[1px] h-10 bg-white/10 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">24/7</span>
                <span className="text-[10px] uppercase tracking-wider">Canlı Tarama</span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="flex-1 relative group w-full max-w-lg lg:max-w-none">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
             <div className="relative glass p-4 rounded-[40px] border-white/10 rotate-2 group-hover:rotate-0 transition-transform duration-700">
                <Image 
                  src="/hero-img.png" 
                  alt="Future of Internships" 
                  width={600} 
                  height={600} 
                  className="rounded-[32px] shadow-2xl"
                  priority
                />
             </div>
             
             {/* Floating UI Elements */}
             <div className="absolute -top-6 -right-6 glass-card px-6 py-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold">Yeni İlan: Trendyol</span>
                </div>
             </div>
             <div className="absolute -bottom-10 -left-6 glass-card px-6 py-4 animate-float [animation-delay:2s]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] opacity-40 uppercase">Analiz</div>
                    <span className="text-xs font-bold">Yapay Zeka Onaylı</span>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
