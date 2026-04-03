export type ApiMode = "mock" | "http";
export type LanguageCode = "en" | "hi" | "gu" | "mr" | "ta" | "bn";
export type RiskLevel = "high" | "medium" | "low";
export type SummaryLength = "brief" | "standard" | "detailed";
export type DocumentType =
  | "auto-detect"
  | "employment"
  | "rental"
  | "nda"
  | "terms"
  | "other";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  preferredLanguage: LanguageCode;
}

export interface AuthSession {
  user: UserProfile;
  issuedAt: string;
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface AnalyzeDocumentRequest {
  sourceType: "file" | "text";
  fileName?: string;
  rawText?: string;
  documentType: DocumentType;
  summaryLength: SummaryLength;
  language: LanguageCode;
}

export interface AnalysisSummary {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  createdAt: string;
  documentType: DocumentType;
  wordCount: number;
  processingTimeMs: number;
}

export interface ClauseInsight {
  id: string;
  title: string;
  severity: RiskLevel;
  plainExplanation: string;
}

export interface AnalysisDetail extends AnalysisSummary {
  summary: string;
  keyTerms: string[];
  clauses: ClauseInsight[];
  recommendations: string[];
}

export interface AnalyzeDocumentResponse {
  analysis: AnalysisDetail;
}

export interface AskQuestionRequest {
  analysisId: string;
  question: string;
  language: LanguageCode;
}

export interface ChatMessage {
  id: string;
  analysisId: string;
  question: string;
  answer: string;
  createdAt: string;
}
