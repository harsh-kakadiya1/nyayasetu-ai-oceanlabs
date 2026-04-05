import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AnalysisResults from "@/components/analysis-results";
import API_ENDPOINTS from "@/lib/api";

type RiskLevel = "high" | "medium" | "low";

type SharedAnalysisResponse = {
  document: {
    id: string;
    filename?: string | null;
    documentType?: string | null;
  };
  analysis: {
    id: string;
    summary: string;
    riskLevel: string;
    keyTerms: unknown;
    riskItems: unknown;
    clauses: unknown;
    recommendations: unknown;
    wordCount: number | null;
    processingTime: string | null;
    createdAt?: string;
    sharedAt?: string;
  };
};

type AnalysisData = {
  document: {
    id: string;
    filename?: string;
    content: string;
    documentType?: string;
  };
  analysis: {
    id: string;
    summary: string;
    riskLevel: RiskLevel;
    keyTerms: unknown;
    riskItems: any[];
    clauses: any[];
    recommendations: any[];
    wordCount: number;
    processingTime: string;
  };
};

type SharedAnalysisPageProps = {
  params: {
    shareToken: string;
  };
};

function normalizeRiskLevel(level: string): RiskLevel {
  if (level === "high" || level === "low") {
    return level;
  }
  return "medium";
}

export default function SharedAnalysisPage({ params }: SharedAnalysisPageProps) {
  const { t } = useTranslation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadSharedAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ENDPOINTS.analysis.getPublic(params.shareToken));
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({ error: "Shared analysis not found" }));
          throw new Error(errorPayload.error || "Shared analysis not found");
        }

        const payload = await response.json() as SharedAnalysisResponse;

        if (isCancelled) {
          return;
        }

        setAnalysisData({
          document: {
            id: payload.document.id,
            filename: payload.document.filename || undefined,
            content: "",
            documentType: payload.document.documentType || undefined,
          },
          analysis: {
            id: payload.analysis.id,
            summary: payload.analysis.summary,
            riskLevel: normalizeRiskLevel(payload.analysis.riskLevel),
            keyTerms: payload.analysis.keyTerms,
            riskItems: Array.isArray(payload.analysis.riskItems) ? payload.analysis.riskItems : [],
            clauses: Array.isArray(payload.analysis.clauses) ? payload.analysis.clauses : [],
            recommendations: Array.isArray(payload.analysis.recommendations) ? payload.analysis.recommendations : [],
            wordCount: payload.analysis.wordCount ?? 0,
            processingTime: payload.analysis.processingTime || "N/A",
          },
        });
      } catch (loadError) {
        if (!isCancelled) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load shared analysis";
          setError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSharedAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [params.shareToken]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#2d575e]/15 bg-white/75 p-8 text-center">
          <p className="text-sm text-[#6b8a90]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#1d3b40]">
            {t("common.error")}
          </h1>
          <p className="mt-2 text-sm text-[#7e3a34]">{error || "Shared analysis not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 rounded-2xl border border-[#2d575e]/15 bg-white/75 px-4 py-3">
        <h1 className="font-display text-xl font-semibold text-[#1d3b40]">Shared Analysis</h1>
        <p className="mt-1 text-sm text-[#6b8a90]">
          Public read-only view
        </p>
      </div>
      <AnalysisResults analysisData={analysisData} showChat={false} allowShare={false} />
    </div>
  );
}
