"use client";

import Hero from "@/components/Hero";
import InternshipList from "@/components/InternshipList";
import { useState } from "react";

export default function Home() {
  const [internships, setInternships] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (keyword: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`http://localhost:8001/internships?keyword=${encodeURIComponent(keyword)}`);
      if (response.ok) {
        const data = await response.json();
        setInternships(data);
      } else {
        console.error("API Hatası:", response.statusText);
      }
    } catch (error) {
      console.error("Bağlantı Hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-20">
      <Hero onSearch={handleSearch} isLoading={isLoading} />
      
      {/* Arama Sonuçları Bölümü */}
      <InternshipList items={internships} isLoading={isLoading} />

      {hasSearched && internships.length === 0 && !isLoading && (
        <div className="container-custom text-center py-20 glass-card mx-auto max-w-2xl">
          <p className="text-xl text-white/60">Üzgünüz, aradığınız kriterlere uygun ilan bulamadık.</p>
          <p className="text-sm text-white/30 mt-2">Farklı anahtar kelimelerle tekrar deneyebilirsiniz.</p>
        </div>
      )}

      {/* Popüler Kategoriler Bölümü */}
      <section className="container-custom pb-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">Popüler Kategoriler</h2>
            <p className="text-white/40 max-w-md">En çok talep gören teknoloji yığınları ve staj alanları.</p>
          </div>
          <button className="text-primary text-sm font-bold hover:underline">Tümünü Gör →</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Frontend", count: "450+ İlan", icon: "⚛️" },
            { title: "Backend", count: "320+ İlan", icon: "⚙️" },
            { title: "Mobil", count: "180+ İlan", icon: "📱" },
            { title: "Veri Bilimi", count: "120+ İlan", icon: "📊" }
          ].map((cat, i) => (
            <div key={i} className="glass-card p-8 hover-lift cursor-pointer group">
              <div className="text-4xl mb-6 group-hover:scale-125 transition-transform duration-500">{cat.icon}</div>
              <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
              <p className="text-xs text-white/40">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-custom pb-32">
        <div className="glass-card p-12 md:p-20 text-center relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px]" />
          <h2 className="text-4xl md:text-5xl font-black mb-6">Kariyerine Dev Bir Adım At</h2>
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Hemen üye ol, yeni ilanlardan anında haberdar ol ve yapay zeka ile özelleştirilmiş 
            staj önerileri al.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-bg-dark px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all">Ücretsiz Başla</button>
            <button className="glass px-10 py-4 rounded-2xl font-bold hover:bg-white/5 transition-all">Daha Fazla Bilgi</button>
          </div>
        </div>
      </section>
    </div>
  );
}
