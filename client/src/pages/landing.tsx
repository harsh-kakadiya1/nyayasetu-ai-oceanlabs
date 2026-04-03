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

  const faqs = [
    {
      question: "What documents can I upload?",
      answer: "You can upload PDF, DOCX, or TXT files. The system is optimized for legal contracts, agreements, and other structured legal documents."
    },
    {
      question: "Is my data private and secure?",
      answer: "Yes. We use privacy-first processing and your documents are handled securely. Data is not stored permanently and processing happens in a secure environment."
    },
    {
      question: "Can Nyayasetu AI replace my lawyer?",
      answer: "No. Nyayasetu AI provides informational analysis to help you understand contracts better, but it does not replace professional legal advice. Always consult a qualified advocate for important legal decisions."
    },
    {
      question: "How long does the analysis take?",
      answer: "Most documents are analyzed within seconds. Complex contracts may take up to a minute. The average response time is around 35 seconds."
    },
    {
      question: "Do I need to create an account?",
      answer: "No account is needed for your first scan. You can try the analysis immediately. For continued use and to save your history, you may want to sign up."
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Animated background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-1/2 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-10" />
      </div>

      <main className="relative z-10 px-4 pb-20 sm:px-6 lg:px-10">
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 pb-16 pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-16 lg:pt-24">
          <div className="stagger-fade">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing.hero.badge")}
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t("landing.hero.title")}
              <span className="mt-3 block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {t("landing.hero.highlight")}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
              {t("landing.hero.description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="group h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-8 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
              >
                {t("landing.hero.cta")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <span className="text-sm font-medium text-gray-400">
                {t("landing.hero.subCta")}
              </span>
            </div>
          </div>

          <div className="stagger-fade rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-white">{t("landing.trust.title")}</p>
              <Lock className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-gray-300">{t("landing.trust.point1")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-gray-300">{t("landing.trust.point2")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-gray-300">{t("landing.trust.point3")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-20 max-w-6xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickStats.map(({ label, value, icon: Icon }, index) => (
              <article
                key={label}
                className="stagger-fade rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm hover:border-white/20 transition-all"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Icon className="mb-4 h-5 w-5 text-cyan-400" />
                <p className="font-display text-3xl font-bold text-white">{value}</p>
                <p className="mt-2 text-sm text-gray-400">{label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-20 max-w-6xl rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm lg:p-12">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">{t("landing.workflow.label")}</p>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">{t("landing.workflow.title")}</h2>
            </div>
            <Button
              onClick={handleGetStarted}
              variant="ghost"
              className="rounded-full border border-blue-500/30 px-5 text-blue-300 hover:bg-blue-500/10"
            >
              {t("landing.workflow.cta")}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="stagger-fade rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">{t("landing.workflow.stepLabel", { number: index + 1 })}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-20 max-w-6xl">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">{t("landing.features.label")}</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">{t("landing.features.title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureBlocks.map(({ title, text, icon: Icon }, index) => (
              <article
                key={title}
                className="stagger-fade group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 hover:border-white/20 transition-all"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-5 inline-flex rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 text-cyan-400 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-20 max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">FAQs</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 backdrop-blur-sm sm:p-10">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-base font-medium text-white hover:no-underline hover:text-blue-400 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-gray-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-6xl rounded-xl border border-white/10 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 p-8 sm:p-12 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t("landing.cta.title")}</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
                {t("home.security.subtitle")}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                {t("landing.cta.subpoint")}
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-8 text-sm font-semibold text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              {t("navigation.getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-xl border border-white/10 bg-gray-950 p-6 shadow-2xl sm:p-8">
            <button
              className="absolute right-4 top-4 text-2xl font-light text-gray-400 transition-colors hover:text-white"
              onClick={handleCloseDisclaimer}
              aria-label={t("common.close")}
            >
              ×
            </button>
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-full bg-blue-500/20 p-2">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white">{t("home.disclaimer.title")}</h3>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-gray-300 sm:text-base">
              <p>
                <strong className="text-white">{t("home.disclaimer.important")}</strong>{" "}
                {t("home.disclaimer.informational")}
              </p>
              <p>{t("home.disclaimer.notRely")}</p>
              <p>{t("home.disclaimer.consultAdvocate")}</p>
            </div>
            <Button
              className="mt-6 h-11 w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-semibold text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              onClick={handleCloseDisclaimer}
            >
              {t("home.disclaimer.button")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-20 border-t border-white/10 bg-black/40 px-4 py-8 sm:px-6 lg:px-10 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <div className="text-center text-sm text-gray-400">
            <p>{t("home.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
