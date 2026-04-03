import type {
  AnalysisDetail,
  AnalyzeDocumentRequest,
  AnalyzeDocumentResponse,
  AskQuestionRequest,
  AuthSession,
  ChatMessage,
  LanguageCode,
  SignInRequest,
  UserProfile,
} from "../contracts";
import type { FrontendDataAdapter } from "./adapter";

const WAIT_MS = {
  short: 250,
  medium: 550,
  long: 1100,
} as const;

const makeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const nowIso = (): string => new Date().toISOString();

const seedAnalyses = (): AnalysisDetail[] => [
  {
    id: "analysis-001",
    title: "Apartment Lease Draft",
    riskLevel: "medium",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    documentType: "rental",
    wordCount: 1834,
    processingTimeMs: 1720,
    summary:
      "The lease is mostly standard but includes an aggressive early termination clause and an auto-renewal requirement without a clear reminder window.",
    keyTerms: ["security deposit", "auto renewal", "maintenance", "termination fee"],
    clauses: [
      {
        id: "clause-101",
        title: "Early Termination Penalty",
        severity: "high",
        plainExplanation:
          "Ending the lease before term requires paying two months of rent, even if a replacement tenant is found.",
      },
      {
        id: "clause-102",
        title: "Repair Responsibility",
        severity: "medium",
        plainExplanation:
          "Minor internal repairs are assigned to tenant without a monthly cap.",
      },
    ],
    recommendations: [
      "Negotiate a capped early termination fee.",
      "Ask for written notice 30 days before auto-renewal.",
      "Clarify landlord responsibility for non-cosmetic repairs.",
    ],
  },
  {
    id: "analysis-002",
    title: "Service Vendor Agreement",
    riskLevel: "low",
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    documentType: "terms",
    wordCount: 1140,
    processingTimeMs: 1395,
    summary:
      "This contract is balanced with standard payment terms, basic confidentiality language, and acceptable dispute handling.",
    keyTerms: ["invoice cycle", "confidentiality", "termination notice"],
    clauses: [
      {
        id: "clause-201",
        title: "Payment Window",
        severity: "low",
        plainExplanation:
          "Invoice payments are due in 15 days with no hidden late fee multiplier.",
      },
    ],
    recommendations: ["Keep monthly deliverable acceptance criteria in writing."],
  },
];

const messageByLanguage: Record<LanguageCode, string> = {
  en: "Based on the uploaded document, this point should be reviewed before signature.",
  hi: "Document ke anusaar, signature se pehle is bindu ko review karna chahiye.",
  gu: "Document anusar, sign karta pehla aa muddo review karvo joie.",
  mr: "Document nusar, sign karanyapurvi ha mudda tapasun paha.",
  ta: "Aavanam adippadayil, kaiyoppiduvatharku mun indha karuthai parunga.",
  bn: "Nothi onujayi, sign korar age ei bisoyti review korun.",
};

type MockStore = {
  session: AuthSession | null;
  analyses: AnalysisDetail[];
  chatByAnalysis: Record<string, ChatMessage[]>;
};

const store: MockStore = {
  session: null,
  analyses: seedAnalyses(),
  chatByAnalysis: {},
};

const toSummary = (detail: AnalysisDetail) => ({
  id: detail.id,
  title: detail.title,
  riskLevel: detail.riskLevel,
  createdAt: detail.createdAt,
  documentType: detail.documentType,
  wordCount: detail.wordCount,
  processingTimeMs: detail.processingTimeMs,
});

const buildSession = (request: SignInRequest): AuthSession => ({
  user: {
    id: makeId(),
    username: request.username,
    displayName: request.username,
    preferredLanguage: "en",
  },
  issuedAt: nowIso(),
});

const summarize = (request: AnalyzeDocumentRequest): AnalysisDetail => {
  const title = request.fileName || "Pasted Legal Draft";
  const requestText = request.rawText || "";
  const estimatedWords = requestText.trim().length > 0 ? requestText.trim().split(/\s+/).length : 760;

  const riskLevel = estimatedWords > 1400 ? "high" : estimatedWords > 900 ? "medium" : "low";

  return {
    id: makeId(),
    title,
    riskLevel,
    createdAt: nowIso(),
    documentType: request.documentType,
    wordCount: estimatedWords,
    processingTimeMs: 980 + Math.floor(Math.random() * 840),
    summary:
      "Mock analysis generated from the API contract layer. UI can now be developed safely before backend wiring.",
    keyTerms: ["liability", "termination", "governing law", "indemnity"],
    clauses: [
      {
        id: makeId(),
        title: "Liability Cap",
        severity: "medium",
        plainExplanation:
          "The agreement caps damages to one month of contract value, which may be too low for high-risk services.",
      },
      {
        id: makeId(),
        title: "Automatic Renewal",
        severity: "high",
        plainExplanation:
          "Renewal triggers unless cancelled before a short notice window.",
      },
    ],
    recommendations: [
      "Add explicit cancellation reminder period.",
      "Clarify indemnity scope for third-party claims.",
      "Confirm liability cap matches business risk.",
    ],
  };
};

export const createMockAdapter = (): FrontendDataAdapter => ({
  mode: "mock",
  auth: {
    async signIn(request) {
      await pause(WAIT_MS.medium);
      if (!request.username.trim() || !request.password.trim()) {
        throw new Error("Username and password are required.");
      }
      store.session = buildSession(request);
      return store.session;
    },
    async signOut() {
      await pause(WAIT_MS.short);
      store.session = null;
    },
    async getSession() {
      await pause(WAIT_MS.short);
      return store.session;
    },
  },
  analysis: {
    async listHistory() {
      await pause(WAIT_MS.short);
      return [...store.analyses]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((item) => toSummary(item));
    },
    async getAnalysisDetail(analysisId) {
      await pause(WAIT_MS.short);
      return store.analyses.find((item) => item.id === analysisId) || null;
    },
    async uploadAndAnalyze(request): Promise<AnalyzeDocumentResponse> {
      await pause(WAIT_MS.long);
      const detail = summarize(request);
      store.analyses = [detail, ...store.analyses];
      store.chatByAnalysis[detail.id] = [];
      return { analysis: detail };
    },
    async askQuestion(request: AskQuestionRequest) {
      await pause(WAIT_MS.medium);
      const answer = `${messageByLanguage[request.language]}\n\nQuestion: ${request.question}`;
      const chatMessage: ChatMessage = {
        id: makeId(),
        analysisId: request.analysisId,
        question: request.question,
        answer,
        createdAt: nowIso(),
      };
      const existing = store.chatByAnalysis[request.analysisId] || [];
      store.chatByAnalysis[request.analysisId] = [chatMessage, ...existing];
      return chatMessage;
    },
    async listMessages(analysisId) {
      await pause(WAIT_MS.short);
      return [...(store.chatByAnalysis[analysisId] || [])].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
    },
  },
  profile: {
    async updatePreferredLanguage(language: LanguageCode): Promise<UserProfile | null> {
      await pause(WAIT_MS.short);
      if (!store.session) {
        return null;
      }
      store.session = {
        ...store.session,
        user: {
          ...store.session.user,
          preferredLanguage: language,
        },
      };
      return store.session.user;
    },
  },
});
