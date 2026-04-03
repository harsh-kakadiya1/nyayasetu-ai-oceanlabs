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

type HttpClient = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, payload: unknown): Promise<T>;
};

const createHttpClient = (baseUrl: string): HttpClient => {
  const normalized = baseUrl.replace(/\/$/, "");

  const request = async <T>(path: string, options: RequestInit): Promise<T> => {
    const response = await fetch(`${normalized}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  };

  return {
    get: (path) => request(path, { method: "GET" }),
    post: (path, payload) => request(path, { method: "POST", body: JSON.stringify(payload) }),
  };
};

export const createHttpAdapter = (baseUrl: string): FrontendDataAdapter => {
  const http = createHttpClient(baseUrl);

  return {
    mode: "http",
    auth: {
      signIn(request: SignInRequest): Promise<AuthSession> {
        return http.post<AuthSession>("/api/auth-login", request);
      },
      signOut(): Promise<void> {
        return http.post<void>("/api/auth-logout", {});
      },
      async getSession(): Promise<AuthSession | null> {
        try {
          return await http.get<AuthSession>("/api/auth-me");
        } catch {
          return null;
        }
      },
    },
    analysis: {
      listHistory() {
        return http.get<AnalysisDetail[]>("/api/history").then((rows) =>
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            riskLevel: row.riskLevel,
            createdAt: row.createdAt,
            documentType: row.documentType,
            wordCount: row.wordCount,
            processingTimeMs: row.processingTimeMs,
          })),
        );
      },
      getAnalysisDetail(analysisId: string): Promise<AnalysisDetail | null> {
        return http.get<AnalysisDetail>(`/api/analysis?analysisId=${encodeURIComponent(analysisId)}`);
      },
      uploadAndAnalyze(request: AnalyzeDocumentRequest): Promise<AnalyzeDocumentResponse> {
        return http.post<AnalyzeDocumentResponse>("/api/documents-analyze-text", request);
      },
      askQuestion(request: AskQuestionRequest): Promise<ChatMessage> {
        return http.post<ChatMessage>(
          `/api/analysis-question?analysisId=${encodeURIComponent(request.analysisId)}`,
          request,
        );
      },
      listMessages(analysisId: string): Promise<ChatMessage[]> {
        return http.get<ChatMessage[]>(
          `/api/analysis-messages?analysisId=${encodeURIComponent(analysisId)}`,
        );
      },
    },
    profile: {
      async updatePreferredLanguage(language: LanguageCode): Promise<UserProfile | null> {
        const session = await http.get<AuthSession>("/api/auth-me");
        if (!session?.user) {
          return null;
        }
        return {
          ...session.user,
          preferredLanguage: language,
        };
      },
    },
  };
};
