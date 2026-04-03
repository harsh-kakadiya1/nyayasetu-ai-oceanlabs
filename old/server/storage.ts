import { type User, type InsertUser, type Document, type InsertDocument, type Analysis, type InsertAnalysis, type ChatMessage, type InsertChatMessage } from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;
  
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

// Use database storage if DATABASE_URL is set and valid, otherwise fall back to in-memory storage
const useDatabase = process.env.DATABASE_URL && 
  process.env.DATABASE_URL !== 'postgresql://user:password@localhost:5432/nyayasetu' &&
  process.env.DATABASE_URL.startsWith('postgresql://');

let storage: IStorage;

async function initializeStorage() {
  if (useDatabase) {
    // Dynamic import to avoid loading database code when not needed
    try {
      const { DbStorage } = await import('./db-storage.js');
      storage = new DbStorage();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✓ STORAGE: Using PostgreSQL database for storage');
      console.log('✓ DATABASE: Connected to Supabase');
      console.log('✓ DATA PERSISTENCE: Enabled - All data will be saved to database');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (err) {
      console.warn('⚠ Failed to load database storage, falling back to memory storage:', (err as Error).message);
      storage = new MemStorage();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠ STORAGE: Using IN-MEMORY storage - data will be lost on server restart!');
      console.log('⚠ DATABASE: Connection failed!');
      console.log('⚠ ERROR:', (err as Error).message);
      console.log('═══════════════════════════════════════════════════════════');
    }
  } else {
    storage = new MemStorage();
    const dbUrl = process.env.DATABASE_URL;
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠ STORAGE: Using IN-MEMORY storage - data will be lost on server restart!');
    console.log('⚠ DATABASE_URL not configured properly');
    if (dbUrl) {
      const maskedUrl = dbUrl.includes('postgresql://') ? 
        dbUrl.replace(/:[^:/@]+@/, ':****@') : 'Invalid format';
      console.log('⚠ Current DATABASE_URL:', maskedUrl);
    } else {
      console.log('⚠ DATABASE_URL is not set');
    }
    console.log('⚠ To enable persistent storage, ensure DATABASE_URL env variable is set correctly');
    console.log('⚠ Format: postgresql://user:password@host:port/database');
    console.log('═══════════════════════════════════════════════════════════');
  }
}

// Initialize storage
await initializeStorage();

export { storage };