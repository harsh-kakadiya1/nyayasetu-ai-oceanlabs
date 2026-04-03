import type {
  AnalyzeDocumentRequest,
  AnalyzeDocumentResponse,
  ApiMode,
  AskQuestionRequest,
  AuthSession,
  ChatMessage,
  LanguageCode,
  SignInRequest,
  UserProfile,
  AnalysisDetail,
  AnalysisSummary,
} from "../contracts";

export interface FrontendDataAdapter {
  readonly mode: ApiMode;
  auth: {
    signIn(request: SignInRequest): Promise<AuthSession>;
    signOut(): Promise<void>;
    getSession(): Promise<AuthSession | null>;
  };
  analysis: {
    listHistory(): Promise<AnalysisSummary[]>;
    getAnalysisDetail(analysisId: string): Promise<AnalysisDetail | null>;
    uploadAndAnalyze(request: AnalyzeDocumentRequest): Promise<AnalyzeDocumentResponse>;
    askQuestion(request: AskQuestionRequest): Promise<ChatMessage>;
    listMessages(analysisId: string): Promise<ChatMessage[]>;
  };
  profile: {
    updatePreferredLanguage(language: LanguageCode): Promise<UserProfile | null>;
  };
}
