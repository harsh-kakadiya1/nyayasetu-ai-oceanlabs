import { type User, type InsertUser, type Document, type InsertDocument, type Analysis, type InsertAnalysis, type ChatMessage, type InsertChatMessage } from "./schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUsername(userId: string, username: string): Promise<User | undefined>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;
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
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUsername(userId: string, username: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const usernameTaken = Array.from(this.users.values()).some(
      (existing) => existing.username === username && existing.id !== userId,
    );

    if (usernameTaken) {
      throw new Error("Username already exists");
    }

    const updatedUser: User = { ...user, username };
    this.users.set(userId, updatedUser);
    return updatedUser;
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

let storage: IStorage;

async function initializeStorage() {
  if (!useDatabase) {
    throw new Error("DATABASE_URL is required. Supabase connection is mandatory.");
  }

  const { DbStorage } = await import('./db-storage.js');
  const dbStorage = new DbStorage();
  const ready = await dbStorage.isReady();

  if (!ready) {
    throw new Error("Supabase database connection failed. Check DATABASE_URL and network/DNS access.");
  }

  storage = dbStorage;
  console.log('===========================================================');
  console.log('STORAGE: Using PostgreSQL database');
  console.log('DATABASE: Connected (Supabase only mode)');
  console.log('===========================================================');
}

await initializeStorage();

export { storage };