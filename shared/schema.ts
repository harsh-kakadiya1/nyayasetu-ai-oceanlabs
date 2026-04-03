import { z } from "zod";

// User types
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: string };

// Document types
export const insertDocumentSchema = z.object({
  userId: z.string().nullable().optional(),
  filename: z.string().nullable().optional(),
  content: z.string(),
  documentType: z.string().nullable().optional(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = InsertDocument & {
  id: string;
  uploadedAt: Date;
};

// Analysis types
export const insertAnalysisSchema = z.object({
  userId: z.string(),
  documentId: z.string(),
  summary: z.string(),
  riskLevel: z.string(),
  keyTerms: z.any().nullable().optional(),
  riskItems: z.any().nullable().optional(),
  clauses: z.any().nullable().optional(),
  recommendations: z.any().nullable().optional(),
  wordCount: z.number().nullable().optional(),
  processingTime: z.string().nullable().optional(),
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = InsertAnalysis & {
  id: string;
  createdAt?: Date;
};

// Chat Message types
export const insertChatMessageSchema = z.object({
  userId: z.string(),
  analysisId: z.string(),
  question: z.string(),
  answer: z.string(),
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = InsertChatMessage & {
  id: string;
  createdAt?: Date;
};
