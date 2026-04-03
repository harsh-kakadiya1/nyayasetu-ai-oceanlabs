import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Star,
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HeroSection from "@/components/hero-section";
import StatsCounter from "@/components/stats-counter";

export default function Landing() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const quickStats = [
    { label: t("landing.quickStats.documentsChecked"), value: "12K+", icon: FileText },
    { label: t("landing.quickStats.averageResponse"), value: "3.5s", icon: Clock3 },
    { label: t("landing.quickStats.riskCuesFlagged"), value: "94%", icon: TriangleAlert },
  ];

  const workflow = [
    {
      title: t("landing.workflow.step1.title"),
      detail: t("landing.workflow.step1.detail"),
    },
    {
      title: t("landing.workflow.step2.title"),
      detail: t("landing.workflow.step2.detail"),
    },
    {
      title: t("landing.workflow.step3.title"),
      detail: t("landing.workflow.step3.detail"),
    },
  ];

  const featureBlocks = [
    {
      title: t("landing.features.card1.title"),
      text: t("landing.features.card1.text"),
      icon: ScanSearch,
    },
    {
      title: t("landing.features.card2.title"),
      text: t("landing.features.card2.text"),
      icon: AlertTriangle,
    },
    {
      title: t("landing.features.card3.title"),
      text: t("landing.features.card3.text"),
      icon: ShieldCheck,
    },
  ];

  const pricingPlans = [
    {
      name: t("landing.pricing.plans.starter.name"),
      description: t("landing.pricing.plans.starter.description"),
      price: t("landing.pricing.plans.starter.price"),
      period: t("landing.pricing.plans.starter.period"),
      features: [
        t("landing.pricing.plans.starter.features.0"),
        t("landing.pricing.plans.starter.features.1"),
        t("landing.pricing.plans.starter.features.2"),
        t("landing.pricing.plans.starter.features.3"),
      ],
      cta: t("landing.pricing.plans.starter.cta"),
      highlighted: false,
    },
    {
      name: t("landing.pricing.plans.professional.name"),
      description: t("landing.pricing.plans.professional.description"),
      price: t("landing.pricing.plans.professional.price"),
      period: t("landing.pricing.plans.professional.period"),
      features: [
        t("landing.pricing.plans.professional.features.0"),
        t("landing.pricing.plans.professional.features.1"),
        t("landing.pricing.plans.professional.features.2"),
        t("landing.pricing.plans.professional.features.3"),
        t("landing.pricing.plans.professional.features.4"),
        t("landing.pricing.plans.professional.features.5"),
      ],
      cta: t("landing.pricing.plans.professional.cta"),
      highlighted: true,
    },
    {
      name: t("landing.pricing.plans.enterprise.name"),
      description: t("landing.pricing.plans.enterprise.description"),
      price: t("landing.pricing.plans.enterprise.price"),
      period: t("landing.pricing.plans.enterprise.period"),
      features: [
        t("landing.pricing.plans.enterprise.features.0"),
        t("landing.pricing.plans.enterprise.features.1"),
        t("landing.pricing.plans.enterprise.features.2"),
        t("landing.pricing.plans.enterprise.features.3"),
        t("landing.pricing.plans.enterprise.features.4"),
        t("landing.pricing.plans.enterprise.features.5"),
      ],
      cta: t("landing.pricing.plans.enterprise.cta"),
      highlighted: false,
    },
  ];


  const faqs = [
    {
      question: t("landing.faqs.items.0.question"),
      answer: t("landing.faqs.items.0.answer")
    },
    {
      question: t("landing.faqs.items.1.question"),
      answer: t("landing.faqs.items.1.answer")
    },
    {
      question: t("landing.faqs.items.2.question"),
      answer: t("landing.faqs.items.2.answer")
    },
    {
      question: t("landing.faqs.items.3.question"),
      answer: t("landing.faqs.items.3.answer")
    },
    {
      question: t("landing.faqs.items.4.question"),
      answer: t("landing.faqs.items.4.answer")
    }
  ];

  const handleGetStarted = () => {
    setShowDisclaimer(true);
  };

  const handleCloseDisclaimer = () => {
    setShowDisclaimer(false);
    setLocation("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f8f5f0] via-[#f3ede5] to-[#eef7f4]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle_at_20%_10%,rgba(31,86,95,0.08),transparent_40%),radial-gradient(circle_at_85%_90%,rgba(189,242,224,0.06),transparent_35%)]" />

      <main className="relative z-10 pb-16">
        <HeroSection
          title={t("landing.hero.title")}
          highlight={t("landing.hero.highlight")}
          description={t("landing.hero.description")}
          ctaText={t("landing.hero.cta")}
          subCtaText={t("landing.hero.subCta")}
          badgeText={t("landing.hero.badge")}
          onCtaClick={handleGetStarted}
        />

        <StatsCounter stats={quickStats} />

        <div className="mt-12 px-4 sm:mt-16 sm:px-6 lg:px-10">
        <section className="mx-auto mb-16 max-w-6xl rounded-2xl border border-[#1f565f]/12 bg-white/80 p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(31,86,95,0.06)] sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547b82]">{t("landing.workflow.label")}</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[#1f383c] sm:text-3xl">{t("landing.workflow.title")}</h2>
            </div>
            <Button
              onClick={handleGetStarted}
              variant="ghost"
              className="rounded-full border border-[#29545b]/25 px-5 text-[#20474e] hover:bg-[#e8f4f1]"
            >
              {t("landing.workflow.cta")}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="stagger-fade rounded-2xl border border-[#234a51]/15 bg-[#f7fffc] p-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-display text-sm uppercase tracking-[0.14em] text-[#4a7379]">{t("landing.workflow.stepLabel", { number: index + 1 })}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#204349]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#577a81]">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>
        </div>

        <div className="px-4 sm:px-6 lg:px-10">
        <section className="mx-auto mb-16 max-w-6xl">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">{t("landing.features.label")}</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#1f383c] sm:text-3xl">{t("landing.features.title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featureBlocks.map(({ title, text, icon: Icon }, index) => (
              <article
                key={title}
                className="stagger-fade group rounded-2xl border border-[#1f565f]/10 bg-white/95 p-6 shadow-[0_4px_16px_rgba(31,86,95,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(31,86,95,0.12)] hover:-translate-y-1"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-[#e8f7f2] to-[#d0f4ea] p-3 text-[#1f565f] transition-all duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1f3c41]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#567a80]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto mb-16 max-w-6xl scroll-mt-24">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">{t("landing.pricing.label")}</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#1f383c] sm:text-4xl">{t("landing.pricing.title")}</h2>
            <p className="mt-3 text-base text-[#567a80]">{t("landing.pricing.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`stagger-fade rounded-2xl border p-6 transition-all duration-300 flex flex-col ${
                  plan.highlighted
                    ? "border-[#1f565f] bg-gradient-to-br from-[#1f565f] to-[#173f46] text-white shadow-[0_16px_40px_rgba(31,86,95,0.2)] md:scale-[1.02]"
                    : "border-[#1f565f]/10 bg-white/95 shadow-[0_4px_16px_rgba(31,86,95,0.06)] hover:shadow-[0_12px_32px_rgba(31,86,95,0.12)] hover:-translate-y-1"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className={`font-display text-2xl font-semibold ${plan.highlighted ? "text-white" : "text-[#1f3c41]"}`}>{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-[#d0f4ea]" : "text-[#567a80]"}`}>{plan.description}</p>
                <div className="mt-6 mb-6">
                  <span className={`font-display text-4xl font-bold ${plan.highlighted ? "text-white" : "text-[#1f3c41]"}`}>
                    {plan.price}
                  </span>
                  <span className={`ml-2 ${plan.highlighted ? "text-[#d0f4ea]" : "text-[#567a80]"}`}>{plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-[#bdf2e0]" : "text-[#1f565f]"}`} />
                      <span className={`text-sm ${plan.highlighted ? "text-[#ecfffa]" : "text-[#567a80]"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleGetStarted}
                  className={`w-full min-w-[180px] rounded-full font-semibold transition-all duration-300 mt-auto ${
                    plan.highlighted
                      ? "bg-[#f6b26b] text-[#492309] hover:bg-[#f3a453]"
                      : "bg-[#1f565f] text-white hover:bg-[#173f46]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </section>


        <section id="faqs" className="mx-auto mb-16 max-w-6xl scroll-mt-24">
          <div className="mb-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">{t("landing.faqs.label")}</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#1f383c] sm:text-3xl">{t("landing.faqs.title")}</h2>
          </div>
          <div className="rounded-2xl border border-[#1f565f]/12 bg-white/80 p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(31,86,95,0.06)] sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-[#1f565f]/10">
                  <AccordionTrigger className="text-left text-base font-medium text-[#1f3c41] hover:no-underline hover:text-[#1f565f] transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-[#567a80]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-6xl rounded-2xl border border-[#1f565f]/15 bg-gradient-to-r from-[#1f565f] to-[#1a4a53] p-7 text-white sm:p-10 shadow-[0_12px_32px_rgba(31,86,95,0.15)]">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("landing.cta.title")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d0f4ea] sm:text-base">
                {t("home.security.subtitle")}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-[#bde5de]">
                <CheckCircle2 className="h-4 w-4" />
                {t("landing.cta.subpoint")}
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="h-12 rounded-full bg-[#f6b26b] px-8 text-sm font-semibold text-[#492309] hover:bg-[#f3a453] shadow-[0_8px_16px_rgba(246,178,107,0.3)] transition-all duration-300"
            >
              {t("navigation.getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
        </div>
      </main>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102126]/55 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#2f5960]/20 bg-white p-6 shadow-[0_20px_40px_rgba(16,33,38,0.25)] sm:p-8">
            <button
              className="absolute right-4 top-4 text-2xl font-light text-[#6d8b90] transition-colors hover:text-[#2b4f55]"
              onClick={handleCloseDisclaimer}
              aria-label={t("common.close")}
            >
              x
            </button>
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-full bg-[#ffe8d1] p-2">
                <AlertTriangle className="h-5 w-5 text-[#a24e2f]" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[#23484e]">{t("home.disclaimer.title")}</h3>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-[#4c7076] sm:text-base">
              <p>
                <strong className="text-[#23484e]">{t("home.disclaimer.important")}</strong>{" "}
                {t("home.disclaimer.informational")}
              </p>
              <p>{t("home.disclaimer.notRely")}</p>
              <p>{t("home.disclaimer.consultAdvocate")}</p>
            </div>
            <Button
              className="mt-6 h-11 w-full rounded-full bg-[#1f565f] text-sm font-semibold text-white hover:bg-[#183f46]"
              onClick={handleCloseDisclaimer}
            >
              {t("home.disclaimer.button")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-16 border-t border-[#1f565f]/10 bg-white/60 backdrop-blur-sm px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center text-sm text-[#5f8187]">
            <p>{t("home.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
