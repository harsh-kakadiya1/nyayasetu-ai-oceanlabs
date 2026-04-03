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
      name: "Starter",
      description: "For individuals exploring legal document analysis",
      price: "Free",
      period: "Forever free",
      features: [
        "Up to 5 documents per month",
        "Basic analysis & risk detection",
        "Standard response time",
        "No credit card required",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      description: "For professionals and small teams",
      price: "$29",
      period: "per month",
      features: [
        "Unlimited documents",
        "Advanced AI analysis",
        "Priority support",
        "Analysis history (6 months)",
        "Custom risk thresholds",
        "Batch processing",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      description: "For organizations with advanced needs",
      price: "Custom",
      period: "contact us",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "API access",
        "Advanced security & compliance",
        "Custom integrations",
        "SLA guarantees",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const integrations = [
    { name: "Google Drive", icon: "🔗" },
    { name: "Slack", icon: "💬" },
    { name: "Microsoft Teams", icon: "👥" },
    { name: "Notion", icon: "📝" },
    { name: "Zapier", icon: "⚡" },
    { name: "REST API", icon: "🔌" },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Legal Consultant",
      text: "Nyayasetu AI has transformed how I review contracts. It saves me hours every week.",
      rating: 5,
    },
    {
      name: "Rajesh Kumar",
      role: "Corporate Lawyer",
      text: "The accuracy of risk detection is impressive. A must-have tool for modern legal practice.",
      rating: 5,
    },
    {
      name: "Neha Patel",
      role: "Startup Founder",
      text: "As a non-lawyer, this tool gives me confidence reviewing agreements. Highly recommended!",
      rating: 5,
    },
  ];

  const securityFeatures = [
    { label: "Bank-Level Encryption", icon: Lock },
    { label: "ISO 27001 Certified", icon: Shield },
    { label: "GDPR Compliant", icon: Zap },
    { label: "Zero-Knowledge Architecture", icon: Globe },
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(189,242,224,0.5),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(255,224,178,0.55),transparent_32%),linear-gradient(180deg,#faf7f0_0%,#f3ece0_45%,#eef5f2_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(rgba(29,59,64,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(29,59,64,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />

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

        <div className="px-4 sm:px-6 lg:px-10">
        <section className="mx-auto mb-16 max-w-6xl rounded-3xl border border-[#1b3f45]/15 bg-white/75 p-6 backdrop-blur-sm sm:p-8 lg:p-10">
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featureBlocks.map(({ title, text, icon: Icon }, index) => (
              <article
                key={title}
                className="stagger-fade group rounded-3xl border border-[#1c434a]/12 bg-white p-6 shadow-[0_12px_24px_rgba(26,55,61,0.08)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(26,55,61,0.15)] hover:-translate-y-1"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-[#e8f7f2] p-3 text-[#1f555d] transition-all duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#1f3c41]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#567a80]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">Pricing</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#1f383c] sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-base text-[#567a80]">Choose the plan that fits your needs</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`stagger-fade rounded-3xl border p-7 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-[#1f565f] bg-[#1f565f] text-white shadow-[0_20px_40px_rgba(31,86,95,0.25)] md:scale-105"
                    : "border-[#1c434a]/12 bg-white shadow-[0_12px_24px_rgba(26,55,61,0.08)] hover:shadow-[0_20px_40px_rgba(26,55,61,0.15)] hover:-translate-y-1"
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
                  className={`w-full rounded-full font-semibold transition-all duration-300 ${
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

        <section className="mx-auto mb-16 max-w-6xl rounded-3xl border border-[#1c434a]/15 bg-gradient-to-br from-[#f9f5eb]/50 to-white p-10">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">Integrations</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#1f383c]">Works with tools you love</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="stagger-fade group flex flex-col items-center justify-center rounded-2xl border border-[#1c434a]/12 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <span className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">{integration.icon}</span>
                <span className="text-center text-sm font-medium text-[#567a80]">{integration.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">Testimonials</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#1f383c]">Trusted by legal professionals</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="stagger-fade rounded-2xl border border-[#1c434a]/12 bg-white p-6 shadow-[0_12px_24px_rgba(26,55,61,0.08)]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#f6b26b] text-[#f6b26b]" />
                    ))}
                </div>
                <p className="text-sm leading-relaxed text-[#567a80] mb-4">"{testimonial.text}"</p>
                <div className="flex items-center gap-3 border-t border-[#1c434a]/10 pt-4">
                  <div className="h-10 w-10 rounded-full bg-[#e8f7f2]" />
                  <div>
                    <p className="font-semibold text-[#1f3c41]">{testimonial.name}</p>
                    <p className="text-xs text-[#567a80]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-6xl rounded-3xl border border-[#1c434a]/15 bg-white p-10">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">Security & Compliance</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#1f383c]">Enterprise-grade security</h2>
            <p className="mt-3 text-base text-[#567a80]">Your data is protected with the highest standards</p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {securityFeatures.map(({ label, icon: Icon }, index) => (
              <div
                key={label}
                className="stagger-fade flex flex-col items-center text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="rounded-full bg-[#e8f7f2] p-4 mb-4">
                  <Icon className="h-6 w-6 text-[#1f565f]" />
                </div>
                <p className="font-semibold text-[#1f3c41]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-6xl">
          <div className="mb-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">FAQs</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#1f383c] sm:text-3xl">Frequently asked questions</h2>
          </div>
          <div className="rounded-3xl border border-[#1b3f45]/15 bg-white/75 p-6 backdrop-blur-sm sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-[#1c434a]/10">
                  <AccordionTrigger className="text-left text-base font-medium text-[#1f3c41] hover:no-underline">
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

        <section className="mx-auto max-w-6xl rounded-3xl border border-[#1f444b]/20 bg-[#1f444b] p-7 text-[#ecfffa] sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("landing.cta.title")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d0f4ea] sm:text-base">
                {t("home.security.subtitle")}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-[#b6e8da]">
                <CheckCircle2 className="h-4 w-4" />
                {t("landing.cta.subpoint")}
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="h-12 rounded-full bg-[#f6b26b] px-8 text-sm font-semibold text-[#492309] hover:bg-[#f3a453]"
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

      <footer className="relative z-10 mt-16 border-t border-[#2a4d54]/20 bg-white/70 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center text-sm text-[#4d7076]">
            <p>{t("home.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
