import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCard {
  title: string;
  text: string;
  icon: LucideIcon;
}

interface FeatureCardsProps {
  features: FeatureCard[];
  label: string;
  title: string;
}

export default function FeatureCards({ features, label, title }: FeatureCardsProps) {
  return (
    <section className="mx-auto mb-16 max-w-6xl px-4 sm:px-6 lg:px-10">
      <div className="mb-10">
        <div className="inline-block mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86] bg-[#e8f7f2] px-3 py-1 rounded-full">
            {label}
          </p>
        </div>
        <h2 className="font-display text-3xl font-semibold text-[#1f383c] sm:text-4xl">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map(({ title: featureTitle, text, icon: Icon }, index) => (
          <article
            key={featureTitle}
            className={`stagger-fade group rounded-3xl border border-[#1c434a]/12 bg-white p-6 shadow-[0_12px_24px_rgba(26,55,61,0.08)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(26,55,61,0.15)] hover:-translate-y-2 overflow-hidden relative`}
            style={{ animationDelay: `${index * 120}ms` }}
          >
            {/* Animated gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#e8f7f2]/0 to-[#1f565f]/0 group-hover:from-[#e8f7f2]/20 group-hover:to-[#1f565f]/5 transition-all duration-300 pointer-events-none" />
            
            <div className="relative">
              <div className="mb-4 inline-flex rounded-xl bg-[#e8f7f2] p-3 text-[#1f555d] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[#1f3c41] group-hover:text-[#1f565f] transition-colors">{featureTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#567a80]">{text}</p>
              
              {/* Animated underline on hover */}
              <div className="mt-4 h-1 w-8 bg-[#1f565f] rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
