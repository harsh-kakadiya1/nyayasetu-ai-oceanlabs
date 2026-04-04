import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedHeading } from "@/components/ui/animated-heading";

interface HeroSectionProps {
  ctaText: string;
  subCtaText: string;
  badgeText: string;
  onCtaClick: () => void;
}

export default function HeroSection({
  ctaText,
  subCtaText,
  badgeText,
  onCtaClick,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-14 sm:px-6 sm:pt-16 lg:px-10 lg:pt-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#bdf2e0]/20 rounded-full blur-3xl animate-float-up" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#f6b26b]/15 rounded-full blur-3xl animate-float-up" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="stagger-fade text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1f383c]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2b4f55] transition-colors duration-300 hover:bg-white/90">
            <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            {badgeText}
          </div>
          <AnimatedHeading />
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
      </div>
    </section>
  );
}