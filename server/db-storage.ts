import pg from "pg";
import { randomUUID } from "crypto";
import {
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  type Analysis,
  type InsertAnalysis,
  type ChatMessage,
  type InsertChatMessage,
} from "./schema.js";

let pool: pg.Pool | null = null;
let setupPromise: Promise<void> | null = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "5000", 10),
      idleTimeoutMillis: 30000,
      max: 20,
    });
  }

  return pool;
}

async function ensureTables() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const db = getPool();

      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          tokens INTEGER NOT NULL DEFAULT 3
        )
      `);

      await db.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS tokens INTEGER NOT NULL DEFAULT 3
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          filename TEXT,
          content TEXT NOT NULL,
          document_type TEXT,
          uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS analyses (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          document_id TEXT NOT NULL,
          summary TEXT NOT NULL,
          risk_level TEXT NOT NULL,
          key_terms JSONB,
          risk_items JSONB,
          clauses JSONB,
          recommendations JSONB,
          word_count INTEGER,
          processing_time TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          analysis_id TEXT NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    })();
  }

  await setupPromise;
}

export class DbStorage {
  async isReady(): Promise<boolean> {
    try {
      await ensureTables();
      await getPool().query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await ensureTables();
    const id = randomUUID();
    const result = await getPool().query<User>(
      `INSERT INTO users (id, username, password, tokens) VALUES ($1, $2, $3, $4) RETURNING id, username, password, tokens`,
      [id, insertUser.username, insertUser.password, insertUser.tokens ?? 3],
    );
    return result.rows[0];
  }

  async updateUsername(userId: string, username: string): Promise<User | undefined> {
    await ensureTables();
    try {
      const result = await getPool().query<User>(
        `
        UPDATE users
        SET username = $2
        WHERE id = $1
        RETURNING id, username, password, tokens
        `,
        [userId, username],
      );
      return result.rows[0];
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new Error("Username already exists");
      }
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await ensureTables();
    const result = await getPool().query<User>(
      `SELECT id, username, password, tokens FROM users WHERE username = $1 LIMIT 1`,
      [username],
    );
    return result.rows[0];
  }

  async getUser(id: string): Promise<User | undefined> {
    await ensureTables();
    const result = await getPool().query<User>(
      `SELECT id, username, password, tokens FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0];
  }

  async consumeUserToken(userId: string): Promise<number | null> {
    await ensureTables();
    const result = await getPool().query<{ tokens: number }>(
      `
      UPDATE users
      SET tokens = tokens - 1
      WHERE id = $1 AND tokens > 0
      RETURNING tokens
      `,
      [userId],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0].tokens;
  }

  async addUserTokens(userId: string, amount: number): Promise<number | null> {
    await ensureTables();
    const result = await getPool().query<{ tokens: number }>(
      `
      UPDATE users
      SET tokens = GREATEST(0, tokens + $2)
      WHERE id = $1
      RETURNING tokens
      `,
      [userId, amount],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0].tokens;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    await ensureTables();
    const id = randomUUID();
    const result = await getPool().query<Document>(
      `
      INSERT INTO documents (id, user_id, filename, content, document_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id as "userId", filename, content, document_type as "documentType", uploaded_at as "uploadedAt"
      `,
      [id, insertDocument.userId ?? null, insertDocument.filename ?? null, insertDocument.content, insertDocument.documentType ?? null],
    );
    return result.rows[0];
  }

  async getDocument(id: string): Promise<Document | undefined> {
    await ensureTables();
    const result = await getPool().query<Document>(
      `
      SELECT id, user_id as "userId", filename, content, document_type as "documentType", uploaded_at as "uploadedAt"
      FROM documents
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );
    return result.rows[0];
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    await ensureTables();
    const result = await getPool().query<Document>(
      `
      SELECT id, user_id as "userId", filename, content, document_type as "documentType", uploaded_at as "uploadedAt"
      FROM documents
      WHERE user_id = $1
      ORDER BY uploaded_at DESC
      `,
      [userId],
    );
    return result.rows;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    await ensureTables();
    const id = randomUUID();
    const result = await getPool().query<Analysis>(
      `
      INSERT INTO analyses (
        id, user_id, document_id, summary, risk_level, key_terms, risk_items, clauses, recommendations, word_count, processing_time
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11)
      RETURNING
        id,
        user_id as "userId",
        document_id as "documentId",
        summary,
        risk_level as "riskLevel",
        key_terms as "keyTerms",
        risk_items as "riskItems",
        clauses,
        recommendations,
        word_count as "wordCount",
        processing_time as "processingTime",
        created_at as "createdAt"
      `,
      [
        id,
        insertAnalysis.userId,
        insertAnalysis.documentId,
        insertAnalysis.summary,
        insertAnalysis.riskLevel,
        JSON.stringify(insertAnalysis.keyTerms ?? null),
        JSON.stringify(insertAnalysis.riskItems ?? null),
        JSON.stringify(insertAnalysis.clauses ?? null),
        JSON.stringify(insertAnalysis.recommendations ?? null),
        insertAnalysis.wordCount ?? null,
        insertAnalysis.processingTime ?? null,
      ],
    );
    return result.rows[0];
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    await ensureTables();
    const result = await getPool().query<Analysis>(
      `
      SELECT
        id,
        user_id as "userId",
        document_id as "documentId",
        summary,
        risk_level as "riskLevel",
        key_terms as "keyTerms",
        risk_items as "riskItems",
        clauses,
        recommendations,
        word_count as "wordCount",
        processing_time as "processingTime",
        created_at as "createdAt"
      FROM analyses
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );
    return result.rows[0];
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    await ensureTables();
    const result = await getPool().query<Analysis>(
      `
      SELECT
        id,
        user_id as "userId",
        document_id as "documentId",
        summary,
        risk_level as "riskLevel",
        key_terms as "keyTerms",
        risk_items as "riskItems",
        clauses,
        recommendations,
        word_count as "wordCount",
        processing_time as "processingTime",
        created_at as "createdAt"
      FROM analyses
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows;
  }

  async clearUserHistory(userId: string): Promise<number> {
    await ensureTables();

    await getPool().query(
      `DELETE FROM chat_messages WHERE user_id = $1`,
      [userId],
    );

    const result = await getPool().query(
      `DELETE FROM analyses WHERE user_id = $1`,
      [userId],
    );

    return result.rowCount || 0;
  }

  async deleteUserAnalysis(userId: string, analysisId: string): Promise<boolean> {
    await ensureTables();

    await getPool().query(
      `DELETE FROM chat_messages WHERE analysis_id = $1`,
      [analysisId],
    );

    const result = await getPool().query(
      `DELETE FROM analyses WHERE id = $1 AND user_id = $2`,
      [analysisId, userId],
    );

    return (result.rowCount || 0) > 0;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    await ensureTables();
    const id = randomUUID();
    const result = await getPool().query<ChatMessage>(
      `
      INSERT INTO chat_messages (id, user_id, analysis_id, question, answer)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id as "userId", analysis_id as "analysisId", question, answer, created_at as "createdAt"
      `,
      [id, insertMessage.userId, insertMessage.analysisId, insertMessage.question, insertMessage.answer],
    );
    return result.rows[0];
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    await ensureTables();
    const result = await getPool().query<ChatMessage>(
      `
      SELECT id, user_id as "userId", analysis_id as "analysisId", question, answer, created_at as "createdAt"
      FROM chat_messages
      WHERE analysis_id = $1
      ORDER BY created_at ASC
      `,
      [analysisId],
    );
    return result.rows;
  }
}
