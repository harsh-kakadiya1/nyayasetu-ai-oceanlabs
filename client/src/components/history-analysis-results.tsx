import AnalysisResults from "./analysis-results";

interface Analysis {
  id: string;
  documentId: string;
  summary: string;
  riskLevel: "high" | "medium" | "low";
  keyTerms: any;
  riskItems: any[];
  clauses: any[];
  recommendations: any[];
  wordCount: number;
  processingTime: string;
  createdAt: string;
}

interface HistoryAnalysisResultsProps {
  analysis: Analysis;
}

export default function HistoryAnalysisResults({ analysis }: HistoryAnalysisResultsProps) {
  // Convert history analysis data to the format expected by AnalysisResults
  const analysisData = {
    document: {
      id: analysis.documentId,
      filename: `Document ${analysis.documentId}`, // History items don't have filenames
      content: "", // Not available in history
      documentType: undefined,
    },
    analysis: {
      id: analysis.id,
      summary: analysis.summary,
      riskLevel: analysis.riskLevel,
      keyTerms: analysis.keyTerms,
      riskItems: analysis.riskItems,
      clauses: analysis.clauses,
      recommendations: analysis.recommendations,
      wordCount: analysis.wordCount,
      processingTime: analysis.processingTime,
    },
  };

  return <AnalysisResults analysisData={analysisData} />;
}
