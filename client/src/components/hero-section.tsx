import { ArrowRight, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title: string;
  highlight: string;
  description: string;
  ctaText: string;
  subCtaText: string;
  badgeText: string;
  onCtaClick: () => void;
}

export default function HeroSection({
  title,
  highlight,
  description,
  ctaText,
  subCtaText,
  badgeText,
  onCtaClick,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-8 sm:px-6 lg:px-10 lg:pt-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#bdf2e0]/20 rounded-full blur-3xl animate-float-up" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#f6b26b]/15 rounded-full blur-3xl animate-float-up" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-10">
        <div className="stagger-fade">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1f383c]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2b4f55] hover:bg-white/90 transition-colors duration-300">
            <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            {badgeText}
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-[#1b3338] sm:text-5xl lg:text-6xl">
            {title}
            <span className="mt-2 block text-[#a24e2f]">{highlight}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#355a60] sm:text-lg">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              onClick={onCtaClick}
              className="group h-12 rounded-full bg-[#1f565f] px-7 text-sm font-semibold text-[#f3fffb] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173f46] hover:shadow-[0_10px_20px_rgba(23,63,70,0.28)]"
            >
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
            <span className="text-sm font-medium text-[#486b71]">
              {subCtaText}
            </span>
          </div>
        </div>

        <div className="stagger-fade rounded-3xl border border-[#1f4f57]/20 bg-[#1e4c54] p-5 text-[#ecfffa] shadow-[0_18px_40px_rgba(20,52,58,0.3)] sm:p-6 backdrop-blur-sm">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative mb-4 flex items-center justify-between">
            <p className="font-display text-lg">Why teams trust this</p>
            <Lock className="h-5 w-5 text-[#bdf2e0]" />
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm hover:bg-white/15 transition-colors duration-300">
              <p className="text-sm text-[#d6f8ef]">Privacy-first processing, built for sensitive legal language.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm hover:bg-white/15 transition-colors duration-300">
              <p className="text-sm text-[#d6f8ef]">Structured highlights for obligations, penalties, and hidden clauses.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm hover:bg-white/15 transition-colors duration-300">
              <p className="text-sm text-[#d6f8ef]">Useful for citizens, founders, and legal professionals alike.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
