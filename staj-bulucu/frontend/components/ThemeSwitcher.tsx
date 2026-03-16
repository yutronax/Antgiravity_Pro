"use client";

import { useState, useEffect } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("oceanic");

  const themes = [
    { id: "oceanic", name: "Oceanic", color: "hsl(184, 100%, 50%)" },
    { id: "cyber", name: "Cyber", color: "hsl(292, 91%, 78%)" }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <div className="glass p-2 rounded-full flex gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === t.id ? "bg-white/20 scale-110 shadow-lg" : "hover:bg-white/10"}`}
            title={t.name}
          >
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}` }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
