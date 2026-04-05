import { type User, type InsertUser, type Document, type InsertDocument, type Analysis, type InsertAnalysis, type ChatMessage, type InsertChatMessage } from "./schema.js";
import { randomUUID } from "crypto";
import { normalizeEmailIdentifier } from "./emailUtils.js";

export type PublicAnalysisRecord = {
  analysis: Analysis;
  document: {
    id: string;
    filename?: string | null;
    documentType?: string | null;
  };
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  adminUpdateUser(userId: string, updates: { plan?: "starter" | "professional" | "enterprise"; tokens?: number }): Promise<User | undefined>;
  updateUsername(userId: string, username: string): Promise<User | undefined>;
  updateUserPlan(userId: string, plan: "starter" | "professional" | "enterprise", tokens: number): Promise<User | undefined>;
  consumeUserToken(userId: string): Promise<number | null>;
  addUserTokens(userId: string, amount: number): Promise<number | null>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<boolean>;
  
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;
  setAnalysisPublicShare(userId: string, analysisId: string): Promise<Analysis | undefined>;
  getPublicAnalysisByShareToken(shareToken: string): Promise<PublicAnalysisRecord | undefined>;
  clearUserHistory(userId: string): Promise<number>;
  deleteUserAnalysis(userId: string, analysisId: string): Promise<boolean>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(analysisId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private analyses: Map<string, Analysis>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.analyses = new Map();
    this.chatMessages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const normalizedUsername = normalizeEmailIdentifier(username);
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === normalizedUsername,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      username: normalizeEmailIdentifier(insertUser.username),
      id,
      tokens: insertUser.tokens ?? 3,
      plan: insertUser.plan ?? "starter",
      role: insertUser.role ?? "user",
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.username.localeCompare(b.username));
  }

  async adminUpdateUser(
    userId: string,
    updates: { plan?: "starter" | "professional" | "enterprise"; tokens?: number },
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      plan: updates.plan ?? user.plan,
      tokens: updates.tokens ?? user.tokens,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUsername(userId: string, username: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const normalizedUsername = normalizeEmailIdentifier(username);

    const usernameTaken = Array.from(this.users.values()).some(
      (existing) => existing.username.toLowerCase() === normalizedUsername && existing.id !== userId,
    );

    if (usernameTaken) {
      throw new Error("Username already exists");
    }

    const updatedUser: User = { ...user, username: normalizedUsername };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPlan(userId: string, plan: "starter" | "professional" | "enterprise", tokens: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      plan,
      tokens,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async consumeUserToken(userId: string): Promise<number | null> {
    const user = this.users.get(userId);
    if (!user || user.tokens <= 0) {
      return null;
    }

    const remainingTokens = user.tokens - 1;
    this.users.set(userId, { ...user, tokens: remainingTokens });
    return remainingTokens;
  }

  async addUserTokens(userId: string, amount: number): Promise<number | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    const updatedTokens = Math.max(0, user.tokens + amount);
    this.users.set(userId, { ...user, tokens: updatedTokens });
    return updatedTokens;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      content: insertDocument.content,
      documentType: insertDocument.documentType || null,
      userId: insertDocument.userId || null,
      filename: insertDocument.filename || null,
      uploadedAt: new Date(),
      encryptedStoragePath: insertDocument.encryptedStoragePath || null,
      isEncrypted: insertDocument.isEncrypted || false,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.userId === userId,
    );
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = {
      id,
      userId: insertAnalysis.userId,
      documentId: insertAnalysis.documentId,
      summary: insertAnalysis.summary,
      riskLevel: insertAnalysis.riskLevel,
      keyTerms: insertAnalysis.keyTerms || null,
      riskItems: insertAnalysis.riskItems || null,
      clauses: insertAnalysis.clauses || null,
      recommendations: insertAnalysis.recommendations || null,
      wordCount: insertAnalysis.wordCount || null,
      processingTime: insertAnalysis.processingTime || null,
      isPublic: insertAnalysis.isPublic ?? false,
      shareToken: insertAnalysis.shareToken ?? null,
      shareCreatedAt: insertAnalysis.isPublic ? new Date() : null,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter((analysis) => analysis.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async setAnalysisPublicShare(userId: string, analysisId: string): Promise<Analysis | undefined> {
    const existing = this.analyses.get(analysisId);
    if (!existing || existing.userId !== userId) {
      return undefined;
    }

    const shareToken = typeof existing.shareToken === "string" && existing.shareToken.length > 0
      ? existing.shareToken
      : randomUUID().replace(/-/g, "");

    const updated: Analysis = {
      ...existing,
      isPublic: true,
      shareToken,
      shareCreatedAt: existing.shareCreatedAt ?? new Date(),
    };

    this.analyses.set(analysisId, updated);
    return updated;
  }

  async getPublicAnalysisByShareToken(shareToken: string): Promise<PublicAnalysisRecord | undefined> {
    const match = Array.from(this.analyses.values()).find(
      (analysis) => analysis.isPublic && analysis.shareToken === shareToken,
    );

    if (!match) {
      return undefined;
    }

    const document = this.documents.get(match.documentId);
    if (!document) {
      return undefined;
    }

    return {
      analysis: match,
      document: {
        id: document.id,
        filename: document.filename ?? null,
        documentType: document.documentType ?? null,
      },
    };
  }

  async clearUserHistory(userId: string): Promise<number> {
    const analysisIds = Array.from(this.analyses.values())
      .filter((analysis) => analysis.userId === userId)
      .map((analysis) => analysis.id);

    for (const id of analysisIds) {
      this.analyses.delete(id);
    }

    for (const [messageId, message] of this.chatMessages.entries()) {
      if (message.userId === userId || analysisIds.includes(message.analysisId)) {
        this.chatMessages.delete(messageId);
      }
    }

    return analysisIds.length;
  }

  async deleteUserAnalysis(userId: string, analysisId: string): Promise<boolean> {
    const analysis = this.analyses.get(analysisId);
    if (!analysis || analysis.userId !== userId) {
      return false;
    }

    this.analyses.delete(analysisId);

    for (const [messageId, message] of this.chatMessages.entries()) {
      if (message.analysisId === analysisId) {
        this.chatMessages.delete(messageId);
      }
    }

    return true;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.analysisId === analysisId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
}

const useDatabase = process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== 'postgresql://user:password@localhost:5432/nyayasetu' &&
  process.env.DATABASE_URL.startsWith('postgresql://');

// Initialize storage with in-memory storage as a fallback
// This will be replaced with DbStorage once initialized
let storage: IStorage = new MemStorage();

// Removed - functionality moved to ensureInitialized()

// Lazy initialization - will be initialized on first use
let initialized = false;
let initError: Error | null = null;

async function ensureInitialized() {
  if (initialized) return;
  if (initError) throw initError;
  
  try {
    if (!useDatabase) {
      console.log('[STORAGE] DATABASE_URL not configured, using in-memory storage');
      initialized = true;
      return;
    }
    
    const { DbStorage } = await import('./db-storage.js');
    const dbStorage = new DbStorage();
    const ready = await dbStorage.isReady();
    
    if (!ready) {
      throw new Error('Supabase database connection failed. Check DATABASE_URL and network/DNS access.');
    }
    
    storage = dbStorage;
    initialized = true;
    
    console.log('===========================================================');
    console.log('STORAGE: Using PostgreSQL database');
    console.log('DATABASE: Connected (Supabase only mode)');
    console.log('===========================================================');
  } catch (error) {
    initError = error as Error;
    throw initError;
  }
}

// Simplified initializeStorage (kept for backward compatibility)
async function initializeStorage() {
  await ensureInitialized();
}

export { storage, ensureInitialized, initializeStorage };