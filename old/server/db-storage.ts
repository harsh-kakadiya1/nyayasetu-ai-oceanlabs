import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { type User, type InsertUser, type Document, type InsertDocument, type Analysis, type InsertAnalysis, type ChatMessage, type InsertChatMessage, users, documents, analyses, chatMessages } from "../shared/schema.js";

let db: any = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required for database storage");
    }
    
    console.log('[DB] Initializing database connection...');
    const dbUrl = process.env.DATABASE_URL;
    // Mask password in logs for security
    const maskedUrl = dbUrl.replace(/:[^:/@]+@/, ':****@');
    console.log(`[DB] Connection string: ${maskedUrl}`);
    
    try {
      const pool = new pg.Pool({
        connectionString: dbUrl,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
        idleTimeoutMillis: 30000,
        max: 20,
      });

      // Test connection
      pool.on('connect', () => {
        console.log('[DB] ✓ Connection pool created successfully');
      });

      pool.on('error', (err) => {
        console.error('[DB] ✗ Connection pool error:', err);
      });

      db = drizzle(pool);
      console.log('[DB] ✓ Drizzle ORM initialized');
    } catch (err) {
      console.error('[DB] ✗ Failed to initialize database:', err);
      throw err;
    }
  }
  return db;
}

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

export class DbStorage implements IStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log(`[DB] Creating user: ${insertUser.username}`);
      const result = await getDb().insert(users).values(insertUser).returning();
      if (result && result[0]) {
        console.log(`[DB] ✓ User created in database: ${result[0].id}`);
        return result[0];
      }
      throw new Error('No result returned from database');
    } catch (err) {
      console.error(`[DB] ✗ Failed to create user:`, (err as any).message);
      throw err;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`[DB] Querying user by username: ${username}`);
      const result = await getDb().select().from(users).where(eq(users.username, username));
      if (result && result[0]) {
        console.log(`[DB] ✓ User found: ${result[0].id}`);
        return result[0];
      }
      console.log(`[DB] ℹ User not found: ${username}`);
      return undefined;
    } catch (err) {
      console.error(`[DB] ✗ Failed to query user by username:`, (err as any).message);
      throw err;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await getDb().select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (err) {
      console.error(`[DB] ✗ Failed to get user:`, (err as any).message);
      throw err;
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await getDb().insert(documents).values(insertDocument).returning();
    return result[0];
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await getDb().select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await getDb().select().from(documents).where(eq(documents.userId, userId));
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const result = await getDb().insert(analyses).values(insertAnalysis).returning();
    return result[0];
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const result = await getDb().select().from(analyses).where(eq(analyses.id, id));
    return result[0];
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    return await getDb().select().from(analyses).where(eq(analyses.userId, userId)).orderBy(analyses.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const result = await getDb().insert(chatMessages).values(insertMessage).returning();
    return result[0];
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    return await getDb().select().from(chatMessages).where(eq(chatMessages.analysisId, analysisId)).orderBy(chatMessages.createdAt);
  }
}