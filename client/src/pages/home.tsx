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
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

const quickStats = [
  { label: "Documents checked", value: "12K+", icon: FileText },
  { label: "Average response", value: "35s", icon: Clock3 },
  { label: "Risk cues flagged", value: "94%", icon: TriangleAlert },
];

const workflow = [
  {
    title: "Drop your file",
    detail: "Upload PDF, DOCX, or TXT and choose your summary depth.",
  },
  {
    title: "AI scans structure",
    detail: "Clauses, obligations, penalties, and exceptions are mapped in context.",
  },
  {
    title: "Act with confidence",
    detail: "Read clear recommendations before signing or negotiating.",
  },
];

const featureBlocks = [
  {
    title: "Clause intelligence",
    text: "Turns dense legal sections into plain-language summaries without losing key meaning.",
    icon: ScanSearch,
  },
  {
    title: "Risk heat map",
    text: "Highlights high-risk wording and surfaces what you should challenge first.",
    icon: AlertTriangle,
  },
  {
    title: "Advice-ready outputs",
    text: "Share concise reports with your advocate and speed up legal consultations.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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

      <main className="relative z-10 px-4 pb-16 sm:px-6 lg:px-10">
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 pb-12 pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-10 lg:pt-10">
          <div className="stagger-fade">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1f383c]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2b4f55]">
              <Sparkles className="h-3.5 w-3.5" />
              Legal reading, reimagined
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-[#1b3338] sm:text-5xl lg:text-6xl">
              Understand contracts
              <span className="mt-2 block text-[#a24e2f]">before they understand you.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#355a60] sm:text-lg">
              Nyayasetu AI turns legal complexity into clear action points. Upload any agreement,
              detect hidden risk, and prepare better questions before you sign.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleGetStarted}
                className="group h-12 rounded-full bg-[#1f565f] px-7 text-sm font-semibold text-[#f3fffb] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173f46] hover:shadow-[0_10px_20px_rgba(23,63,70,0.28)]"
              >
                Start free analysis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
              <span className="text-sm font-medium text-[#486b71]">No account needed for first scan</span>
            </div>
          </div>

          <div className="stagger-fade rounded-3xl border border-[#1f4f57]/20 bg-[#1e4c54] p-5 text-[#ecfffa] shadow-[0_18px_40px_rgba(20,52,58,0.3)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg">Why teams trust this</p>
              <Lock className="h-5 w-5 text-[#bdf2e0]" />
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-[#d6f8ef]">Privacy-first processing, built for sensitive legal language.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-[#d6f8ef]">Structured highlights for obligations, penalties, and hidden clauses.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-[#d6f8ef]">Useful for citizens, founders, and legal professionals alike.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-14 max-w-6xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickStats.map(({ label, value, icon: Icon }, index) => (
              <article
                key={label}
                className="stagger-fade rounded-2xl border border-[#1f383c]/10 bg-white/80 p-5 shadow-[0_8px_18px_rgba(31,56,60,0.1)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Icon className="mb-3 h-5 w-5 text-[#235962]" />
                <p className="font-display text-3xl font-semibold text-[#1f383c]">{value}</p>
                <p className="mt-1 text-sm text-[#4d7076]">{label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-6xl rounded-3xl border border-[#1b3f45]/15 bg-white/75 p-6 backdrop-blur-sm sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547b82]">Workflow</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[#1f383c] sm:text-3xl">A clear path from upload to action</h2>
            </div>
            <Button
              onClick={handleGetStarted}
              variant="ghost"
              className="rounded-full border border-[#29545b]/25 px-5 text-[#20474e] hover:bg-[#e8f4f1]"
            >
              Try it now
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="stagger-fade rounded-2xl border border-[#234a51]/15 bg-[#f7fffc] p-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-display text-sm uppercase tracking-[0.14em] text-[#4a7379]">Step {index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#204349]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#577a81]">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-6xl">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#577f86]">Capabilities</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#1f383c] sm:text-3xl">Designed for real legal decisions</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featureBlocks.map(({ title, text, icon: Icon }, index) => (
              <article
                key={title}
                className="stagger-fade rounded-3xl border border-[#1c434a]/12 bg-white p-6 shadow-[0_12px_24px_rgba(26,55,61,0.08)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-[#e8f7f2] p-3 text-[#1f555d]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#1f3c41]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#567a80]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl rounded-3xl border border-[#1f444b]/20 bg-[#1f444b] p-7 text-[#ecfffa] sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Read legal language like a professional.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d0f4ea] sm:text-base">
                {t("home.security.subtitle")}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-[#b6e8da]">
                <CheckCircle2 className="h-4 w-4" />
                Data stays private and processing remains secure.
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="h-12 rounded-full bg-[#f6b26b] px-8 text-sm font-semibold text-[#492309] hover:bg-[#f3a453]"
            >
              Continue to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102126]/55 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#2f5960]/20 bg-white p-6 shadow-[0_20px_40px_rgba(16,33,38,0.25)] sm:p-8">
            <button
              className="absolute right-4 top-4 text-2xl font-light text-[#6d8b90] transition-colors hover:text-[#2b4f55]"
              onClick={handleCloseDisclaimer}
              aria-label="Close disclaimer"
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-xl font-semibold text-[#1f3d42]">nyayasetu.ai</p>
              <p className="mt-2 text-sm text-[#5b7d83]">AI-powered legal clarity for citizens, founders, and teams.</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4f747a]">Core strengths</p>
              <ul className="mt-3 space-y-2 text-sm text-[#5b7d83]">
                <li>Contextual summaries</li>
                <li>Actionable risk calls</li>
                <li>Clause-level explanation</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4f747a]">Trust layer</p>
              <ul className="mt-3 space-y-2 text-sm text-[#5b7d83]">
                <li>Privacy-first architecture</li>
                <li>Secure processing pipeline</li>
                <li>No hidden legal assumptions</li>
              </ul>
            </div>
          </div>
          <Separator className="my-6 bg-[#2c5259]/15" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6f9196] sm:text-sm">
            <p>{t("home.footer.copyright")}</p>
            <p className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t("home.footer.securePrivate")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
