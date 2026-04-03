import React, { useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  suffix?: string;
}

interface StatsCounterProps {
  stats: Stat[];
}

export default function StatsCounter({ stats }: StatsCounterProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="mx-auto mb-14 max-w-6xl px-4 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, suffix }, index) => (
          <article
            key={label}
            className={`stagger-fade rounded-2xl border border-[#1f383c]/10 bg-white/80 p-5 shadow-[0_8px_18px_rgba(31,56,60,0.1)] transition-all duration-500 hover:shadow-[0_12px_28px_rgba(31,56,60,0.15)] hover:-translate-y-1 ${
              isVisible ? "animate-slide-in-up" : ""
            }`}
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <Icon className="mb-3 h-5 w-5 text-[#235962] animate-float-up" style={{ animationDelay: `${index * 150}ms` }} />
            <p className="font-display text-3xl font-semibold text-[#1f383c]">
              {value}
              {suffix && <span>{suffix}</span>}
            </p>
            <p className="mt-1 text-sm text-[#4d7076]">{label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
