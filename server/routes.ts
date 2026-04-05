import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertDocumentSchema, insertAnalysisSchema, insertChatMessageSchema } from "./schema.js";
import { analyzeDocument, answerQuestion, validateLegalDocument } from "./services/groq.js";
import { parseTextContent, parseUploadedDocument } from "./services/documentParser.js";
import { EncryptionService } from "./services/encryption.js";
import { getSupabaseStorageService, isSupabaseConfigured } from "./services/supabase.js";
import { DocumentRetrievalService } from "./services/documentRetrieval.js";
import multer from "multer";
import path from "path";
import passport from "passport";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { requireAuth } from "./auth.js";
import { normalizeEmailIdentifier } from "./emailUtils.js";

const ADMIN_USERNAME = normalizeEmailIdentifier(process.env.ADMIN_USERNAME || "admin@nyayasetu.ai");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";

const PLAN_TOKEN_DEFAULTS: Record<"starter" | "professional" | "enterprise", number> = {
  starter: 3,
  professional: 50,
  enterprise: 200,
};

function userIsAdmin(user: any): boolean {
  if (!user) {
    return false;
  }
  return user.role === "admin" || normalizeEmailIdentifier(String(user.username || "")) === ADMIN_USERNAME;
}

function getPublicFrontendBaseUrl(req: any): string {
  const configuredFrontendUrl = process.env.FRONTEND_URL?.trim();
  if (configuredFrontendUrl) {
    return configuredFrontendUrl.replace(/\/+$/, "");
  }

  const requestOrigin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  if (requestOrigin) {
    return requestOrigin.replace(/\/+$/, "");
  }

  const host = typeof req.headers.host === "string" ? req.headers.host.trim() : "";
  if (!host) {
    return "";
  }

  const forwardedProto = typeof req.headers["x-forwarded-proto"] === "string"
    ? req.headers["x-forwarded-proto"].split(",")[0]
    : undefined;
  const protocol = forwardedProto || req.protocol || "https";

  return `${protocol}://${host}`.replace(/\/+$/, "");
}

async function ensureAdminAccount() {
  const existingAdmin = await storage.getUserByUsername(ADMIN_USERNAME);

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await storage.createUser({
    username: ADMIN_USERNAME,
    password: hashedPassword,
    role: "admin",
    plan: "enterprise",
    tokens: 10000,
  });

  console.log(`[ADMIN] Admin user auto-created: ${ADMIN_USERNAME}`);
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!userIsAdmin(req.user)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
}

// Configure multer for file uploads (memory storage - no files saved to disk)
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: {
    fileSize:  15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('[ROUTES] Registering API routes...');
  await ensureAdminAccount();
  
  // Health check - no auth required
  app.get("/api/health", (req, res) => {
    console.log('[HEALTH] Health check called');
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.post(["/api/auth/register", "/api/auth-register"], async (req, res) => {
    try {
      const username = normalizeEmailIdentifier(String(req.body?.username || ""));
      const password = String(req.body?.password || "");

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      if (username === ADMIN_USERNAME) {
        return res.status(403).json({ error: "This username is reserved" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });

      res.json({
        id: user.id,
        username: user.username,
        tokens: user.tokens,
        plan: user.plan,
        role: user.role,
        isAdmin: userIsAdmin(user),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post(["/api/auth/login", "/api/auth-login"], (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login error" });
      }

      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }

      req.login(user, (loginErr: any) => {
        if (loginErr) {
          return res.status(500).json({ error: "Failed to establish session" });
        }

        res.json({
          id: user.id,
          username: user.username,
          tokens: user.tokens,
          plan: user.plan,
          role: user.role,
          isAdmin: userIsAdmin(user),
        });
      });
    })(req, res, next);
  });

  app.post(["/api/auth/logout", "/api/auth-logout"], (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get(["/api/auth/me", "/api/auth-me"], (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({
        id: req.user!.id,
        username: req.user!.username,
        tokens: req.user!.tokens,
        plan: req.user!.plan,
        role: req.user!.role,
        isAdmin: userIsAdmin(req.user),
      });
    }

    return res.status(401).json({ error: "Not authenticated" });
  });

  app.patch(["/api/auth/profile", "/api/auth-profile"], requireAuth, async (req, res) => {
    try {
      const username = normalizeEmailIdentifier(String(req.body?.username || ""));

      if (!username || username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      const updatedUser = await storage.updateUsername(req.user!.id, username);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        tokens: updatedUser.tokens,
        plan: updatedUser.plan,
        role: updatedUser.role,
        isAdmin: userIsAdmin(updatedUser),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      if (message.includes("already exists")) {
        return res.status(409).json({ error: message });
      }
      res.status(500).json({ error: message });
    }
  });

  // Google OAuth Routes
  app.get("/api/auth/google", (req, res, next) => {
    const rawIntent = String(req.query.intent || "login").toLowerCase();
    const intent = rawIntent === "signup" ? "signup" : "login";
    passport.authenticate("google", { scope: ["profile", "email"], state: intent })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        console.error("[AUTH] Google auth error:", err);
        return res.redirect(`/?error=auth_failed`);
      }

      if (!user) {
        console.warn("[AUTH] Google auth failed:", info?.message);
        return res.redirect(`/?error=auth_failed`);
      }

      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error("[AUTH] Google login session error:", loginErr);
          return res.redirect(`/?error=session_failed`);
        }

        // Redirect to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const intent = String(req.query.state || "login").toLowerCase() === "signup" ? "signup" : "login";
        const oauthStatus = (user as any)?.__oauthAccountStatus || "existing";
        const oauthNotice = intent === "signup" && oauthStatus === "existing"
          ? "existing-account"
          : oauthStatus === "created"
            ? "account-created"
            : "signed-in";

        const redirectPath = userIsAdmin(user) ? "admin" : "dashboard";
        res.redirect(`${frontendUrl}/${redirectPath}?auth=success&oauth=${oauthNotice}`);
      });
    })(req, res, next);
  });
  
  // Health check endpoint
  app.get("/", (req, res) => {
    res.json({ 
      message: "NyayaSetu API Server is running!", 
      status: "healthy",
      timestamp: new Date().toISOString(),
      endpoints: [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "GET /api/auth/google",
        "GET /api/auth/google/callback",
        "POST /api/auth/logout",
        "GET /api/auth/me",
        "GET /api/admin/users",
        "PATCH /api/admin/users/:userId",
        "POST /api/documents/upload",
        "POST /api/documents/analyze-text", 
        "GET /api/analysis/:id/messages",
        "POST /api/analysis/:id/chat",
        "POST /api/analysis/:id/share",
        "GET /api/public/analysis/:shareToken",
        "GET /api/history"
      ]
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Upload and analyze document via file
  app.post(["/api/documents/upload", "/api/documents-upload"], requireAuth, upload.single('document'), async (req, res) => {
    let tokenConsumed = false;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const remainingTokens = await storage.consumeUserToken(req.user!.id);
      if (remainingTokens === null) {
        return res.status(402).json({
          error: "No tokens remaining. Please subscribe to continue analysis.",
          code: "TOKENS_EXHAUSTED",
          tokens: 0,
        });
      }
      tokenConsumed = true;

      const { documentType, summaryLength, language } = req.body;
      const preferredLanguage = language || req.headers['accept-language'] || 'en';
      
      // Parse the uploaded document
      const parsedDoc = await parseUploadedDocument(req.file);
      
      // Encrypt the document content
      const { encrypted: encryptedContent, metadata: encryptionMetadata } = EncryptionService.encryptDocument(parsedDoc.content);
      
      // Generate unique document ID before creating document record
      const documentId = crypto.randomUUID();
      
      // Upload encrypted document to Supabase (if configured)
      let encryptedStoragePath: string | null = null;
      if (isSupabaseConfigured()) {
        try {
          const supabaseService = getSupabaseStorageService();
          await supabaseService.ensureBucketExists();
          
          // Create a unique filename for storage
          const storageFilename = `${Date.now()}_${req.file.originalname}`;
          encryptedStoragePath = await supabaseService.uploadEncryptedDocument(
            req.user!.id,
            documentId,
            encryptedContent,
            storageFilename,
          );
          if (encryptedStoragePath) {
            console.log(`[SUPABASE] Document uploaded: ${encryptedStoragePath}`);
          }
        } catch (supabaseError) {
          console.error("[SUPABASE] Upload failed:", supabaseError);
          // Continue with database storage but log the error
          // The document analysis will still work with the database-stored content
        }
      } else {
        console.log('[DOCUMENTS] Supabase not configured, storing encrypted document in database only');
      }

      // Create document record with encrypted metadata
      const documentData = insertDocumentSchema.parse({
        userId: req.user!.id,
        filename: req.file.originalname,
        content: parsedDoc.content, // Keep original for analysis, encryption is separate
        documentType: documentType || "auto-detect",
        encryptedStoragePath: encryptedStoragePath || null,
        isEncrypted: true,
      });

      const document = await storage.createDocument(documentData);

      // Validate if document is a legal document before analysis
      console.log('[VALIDATION] Validating document as legal document...');
      const validation = await validateLegalDocument(parsedDoc.content);
      
      if (!validation.isLegal) {
        console.warn('[VALIDATION] Document failed legal validation:', validation.reason);
        // Delete the created document since validation failed
        await storage.deleteDocument(document.id);
        // Refund token since analysis won't proceed
        await storage.addUserTokens(req.user!.id, 1);
        
        return res.status(400).json({ 
          error: "Invalid document",
          message: "This document is not recognized as a legal document. Only legal documents (contracts, agreements, etc.) can be analyzed.",
          details: validation.reason,
          code: "NOT_A_LEGAL_DOCUMENT"
        });
      }

      console.log('[VALIDATION] Document validated as legal document:', {
        documentType: validation.documentType,
        reason: validation.reason
      });

      // Analyze document with Groq
      const startTime = Date.now();
      const analysis = await analyzeDocument(
        parsedDoc.content,
        validation.documentType || documentType,
        preferredLanguage as string,
        summaryLength,
      );
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)} seconds`;

      // Create analysis record
      const analysisData = insertAnalysisSchema.parse({
        userId: req.user!.id,
        documentId: document.id,
        summary: analysis.summary.summary,
        riskLevel: analysis.riskLevel,
        keyTerms: analysis.summary.keyTerms,
        riskItems: analysis.riskItems,
        clauses: analysis.clauses,
        recommendations: analysis.recommendations,
        wordCount: analysis.wordCount,
        processingTime,
      });

      const savedAnalysis = await storage.createAnalysis(analysisData);

      res.json({
        document: {
          ...document,
          isEncrypted: true,
          encryptedStoragePath: encryptedStoragePath || undefined,
        },
        analysis: {
          ...savedAnalysis,
          summary: analysis.summary,
          riskItems: analysis.riskItems,
          clauses: analysis.clauses,
          recommendations: analysis.recommendations,
        },
        remainingTokens,
      });
    } catch (error) {
      if (tokenConsumed) {
        await storage.addUserTokens(req.user!.id, 1);
      }
      console.error("Document upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process document" 
      });
    }
  });

  // Analyze document via text input
  app.post(["/api/documents/analyze-text", "/api/documents-analyze-text"], requireAuth, async (req, res) => {
    let tokenConsumed = false;
    try {
      const { content, documentType, summaryLength, language } = req.body;
      const preferredLanguage = language || req.headers['accept-language'] || 'en';

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Document content is required" });
      }

      const remainingTokens = await storage.consumeUserToken(req.user!.id);
      if (remainingTokens === null) {
        return res.status(402).json({
          error: "No tokens remaining. Please subscribe to continue analysis.",
          code: "TOKENS_EXHAUSTED",
          tokens: 0,
        });
      }
      tokenConsumed = true;

      // Parse text content
      const parsedDoc = parseTextContent(content);

      // Create document record
      const documentData = insertDocumentSchema.parse({
        userId: req.user!.id,
        filename: null,
        content: parsedDoc.content,
        documentType: documentType || "auto-detect",
      });

      const document = await storage.createDocument(documentData);

      // Validate if document is a legal document before analysis
      console.log('[VALIDATION] Validating text document as legal document...');
      const validation = await validateLegalDocument(parsedDoc.content);
      
      if (!validation.isLegal) {
        console.warn('[VALIDATION] Text document failed legal validation:', validation.reason);
        // Delete the created document since validation failed
        await storage.deleteDocument(document.id);
        // Refund token since analysis won't proceed
        await storage.addUserTokens(req.user!.id, 1);
        
        return res.status(400).json({ 
          error: "Invalid document",
          message: "This document is not recognized as a legal document. Only legal documents (contracts, agreements, etc.) can be analyzed.",
          details: validation.reason,
          code: "NOT_A_LEGAL_DOCUMENT"
        });
      }

      console.log('[VALIDATION] Text document validated as legal document:', {
        documentType: validation.documentType,
        reason: validation.reason
      });

      // Analyze document with Groq
      const startTime = Date.now();
      const analysis = await analyzeDocument(
        parsedDoc.content,
        validation.documentType || documentType,
        preferredLanguage as string,
        summaryLength,
      );
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)} seconds`;

      // Create analysis record
      const analysisData = insertAnalysisSchema.parse({
        userId: req.user!.id,
        documentId: document.id,
        summary: analysis.summary.summary,
        riskLevel: analysis.riskLevel,
        keyTerms: analysis.summary.keyTerms,
        riskItems: analysis.riskItems,
        clauses: analysis.clauses,
        recommendations: analysis.recommendations,
        wordCount: analysis.wordCount,
        processingTime,
      });

      const savedAnalysis = await storage.createAnalysis(analysisData);

      res.json({
        document,
        analysis: {
          ...savedAnalysis,
          summary: analysis.summary,
          riskItems: analysis.riskItems,
          clauses: analysis.clauses,
          recommendations: analysis.recommendations,
        },
        remainingTokens,
      });
    } catch (error) {
      if (tokenConsumed) {
        await storage.addUserTokens(req.user!.id, 1);
      }
      console.error("Text analysis error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to analyze document" 
      });
    }
  });

  // Get analysis by ID
  app.get(["/api/analysis/:id", "/api/analysis"], requireAuth, async (req, res) => {
    try {
      const idFromParams = req.params.id;
      const idFromQuery = typeof req.query.analysisId === "string" ? req.query.analysisId : undefined;
      const id = idFromParams || idFromQuery;

      if (!id) {
        return res.status(400).json({ error: "analysisId is required" });
      }

      const analysis = await storage.getAnalysis(id);

      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ error: "Failed to retrieve analysis" });
    }
  });

  // Create/retrieve a public share link for an analysis
  app.post(["/api/analysis/:id/share", "/api/analysis-share"], requireAuth, async (req, res) => {
    try {
      const idFromParams = req.params.id;
      const idFromQuery = typeof req.query.analysisId === "string" ? req.query.analysisId : undefined;
      const id = idFromParams || idFromQuery;

      if (!id) {
        return res.status(400).json({ error: "analysisId is required" });
      }

      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const sharedAnalysis = await storage.setAnalysisPublicShare(req.user!.id, id);
      if (!sharedAnalysis || !sharedAnalysis.shareToken) {
        return res.status(500).json({ error: "Failed to create share link" });
      }

      const sharePath = `/shared/${encodeURIComponent(sharedAnalysis.shareToken)}`;
      const baseUrl = getPublicFrontendBaseUrl(req);
      const shareUrl = baseUrl ? `${baseUrl}${sharePath}` : sharePath;

      return res.json({
        analysisId: sharedAnalysis.id,
        isPublic: sharedAnalysis.isPublic,
        shareToken: sharedAnalysis.shareToken,
        sharePath,
        shareUrl,
      });
    } catch (error) {
      console.error("Share analysis error:", error);
      return res.status(500).json({ error: "Failed to create share link" });
    }
  });

  // Get publicly shared analysis by share token (no auth required)
  app.get(["/api/public/analysis/:shareToken", "/api/public-analysis"], async (req, res) => {
    try {
      const tokenFromParams = req.params.shareToken;
      const tokenFromQuery = typeof req.query.shareToken === "string" ? req.query.shareToken : undefined;
      const shareToken = tokenFromParams || tokenFromQuery;

      if (!shareToken) {
        return res.status(400).json({ error: "shareToken is required" });
      }

      const publicRecord = await storage.getPublicAnalysisByShareToken(shareToken);
      if (!publicRecord) {
        return res.status(404).json({ error: "Shared analysis not found" });
      }

      const { analysis, document } = publicRecord;
      return res.json({
        document: {
          id: document.id,
          filename: document.filename,
          documentType: document.documentType,
        },
        analysis: {
          id: analysis.id,
          documentId: analysis.documentId,
          summary: analysis.summary,
          riskLevel: analysis.riskLevel,
          keyTerms: analysis.keyTerms,
          riskItems: analysis.riskItems,
          clauses: analysis.clauses,
          recommendations: analysis.recommendations,
          wordCount: analysis.wordCount,
          processingTime: analysis.processingTime,
          createdAt: analysis.createdAt,
          sharedAt: analysis.shareCreatedAt,
        },
      });
    } catch (error) {
      console.error("Get public shared analysis error:", error);
      return res.status(500).json({ error: "Failed to retrieve shared analysis" });
    }
  });

  // Get chat messages for an analysis
  app.get(["/api/analysis/:id/messages", "/api/analysis-messages"], requireAuth, async (req, res) => {
    try {
      const idFromParams = req.params.id;
      const idFromQuery = typeof req.query.analysisId === "string" ? req.query.analysisId : undefined;
      const id = idFromParams || idFromQuery;

      if (!id) {
        return res.status(400).json({ error: "analysisId is required" });
      }

      console.log(`[MESSAGES] GET request for analysis: ${id}`);
      console.log(`[MESSAGES] User: ${req.user?.id}`);
      console.log(`[MESSAGES] Looking up analysis in storage...`);
      const analysis = await storage.getAnalysis(id);

      if (!analysis) {
        console.error(`[MESSAGES] Analysis NOT FOUND: ${id}`);
        return res.status(404).json({ error: "Analysis not found", analysisId: id });
      }
      console.log(`[MESSAGES] Found analysis: ${id}`);

      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getChatMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  // Ask question about document
  app.post(["/api/analysis/:id/question", "/api/analysis-question"], requireAuth, async (req, res) => {
    try {
      const idFromParams = req.params.id;
      const idFromQuery = typeof req.query.analysisId === "string" ? req.query.analysisId : undefined;
      const id = idFromParams || idFromQuery;
      const { question, language } = req.body;
      const preferredLanguage = language || req.headers['accept-language'] || 'en';

      if (!id) {
        return res.status(400).json({ error: "analysisId is required" });
      }

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const document = await storage.getDocument(analysis.documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Get previous chat messages for context
      const previousMessages = await storage.getChatMessages(id);
      const context = previousMessages.map(msg => `Q: ${msg.question}\nA: ${msg.answer}`).join('\n\n');

      // Get answer from Groq
      const answer = await answerQuestion(document.content, question, context, preferredLanguage);

      // Save the Q&A
      const messageData = insertChatMessageSchema.parse({
        userId: req.user!.id,
        analysisId: id,
        question,
        answer,
      });

      const savedMessage = await storage.createChatMessage(messageData);

      res.json(savedMessage);
    } catch (error) {
      console.error("Q&A error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to answer question" 
      });
    }
  });

  // Get user analysis history
  app.get("/api/history", requireAuth, async (req, res) => {
    try {
      console.log(`[HISTORY] Fetching history for user: ${req.user?.id}`);
      const analyses = await storage.getUserAnalyses(req.user!.id);
      console.log(`[HISTORY] Found ${analyses?.length || 0} analyses for user ${req.user?.id}`);
      res.json(analyses || []);
    } catch (error) {
      console.error("[HISTORY] Get history error:", error);
      res.status(500).json({ error: "Failed to retrieve history" });
    }
  });

  app.delete("/api/history", requireAuth, async (req, res) => {
    try {
      const removedCount = await storage.clearUserHistory(req.user!.id);
      res.json({ success: true, removedCount });
    } catch (error) {
      console.error("[HISTORY] Clear history error:", error);
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  app.delete("/api/history/:analysisId", requireAuth, async (req, res) => {
    try {
      const { analysisId } = req.params;
      const analysis = await storage.getAnalysis(analysisId);

      if (!analysis) {
        return res.status(404).json({ error: "History item not found" });
      }

      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const deleted = await storage.deleteUserAnalysis(req.user!.id, analysisId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete history item" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[HISTORY] Delete item error:", error);
      res.status(500).json({ error: "Failed to delete history item" });
    }
  });

  // Get encrypted document metadata
  app.get(["/api/documents/:documentId", "/api/documents-get"], requireAuth, async (req, res) => {
    try {
      const { documentId } = req.params;
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Verify user owns this document
      if (document.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({
        id: document.id,
        filename: document.filename,
        isEncrypted: document.isEncrypted,
        encryptedStoragePath: document.encryptedStoragePath,
        uploadedAt: document.uploadedAt,
        documentType: document.documentType,
      });
    } catch (error) {
      console.error("[DOCUMENTS] Get document error:", error);
      res.status(500).json({ error: "Failed to retrieve document metadata" });
    }
  });

  // Retrieve and decrypt document content
  app.get(["/api/documents/:documentId/download", "/api/documents-download"], requireAuth, async (req, res) => {
    try {
      const { documentId } = req.params;
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Verify user owns this document
      if (document.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!document.isEncrypted || !document.encryptedStoragePath) {
        return res.status(400).json({ error: "Document is not encrypted or storage path not available" });
      }

      // Retrieve and decrypt document
      try {
        const decryptedContent = await DocumentRetrievalService.getDecryptedDocument(
          document.encryptedStoragePath,
        );

        res.json({
          id: document.id,
          filename: document.filename,
          content: decryptedContent,
          uploadedAt: document.uploadedAt,
        });
      } catch (decryptError) {
        console.error("[DOCUMENTS] Decryption error:", decryptError);
        res.status(500).json({ error: "Failed to decrypt document" });
      }
    } catch (error) {
      console.error("[DOCUMENTS] Download error:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // List user's encrypted documents
  app.get(["/api/documents", "/api/documents-list"], requireAuth, async (req, res) => {
    try {
      const documents = await storage.getUserDocuments(req.user!.id);

      const documentList = documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        isEncrypted: doc.isEncrypted,
        encryptedStoragePath: doc.encryptedStoragePath,
        uploadedAt: doc.uploadedAt,
        documentType: doc.documentType,
      }));

      res.json(documentList);
    } catch (error) {
      console.error("[DOCUMENTS] List error:", error);
      res.status(500).json({ error: "Failed to list documents" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      const payload = users.map((user) => ({
        id: user.id,
        username: user.username,
        tokens: user.tokens,
        plan: user.plan,
        role: user.role ?? "user",
        isAdmin: userIsAdmin(user),
      }));

      res.json(payload);
    } catch (error) {
      console.error("[ADMIN] Failed to get users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestedPlan = req.body?.plan ? String(req.body.plan).toLowerCase() : undefined;
      const requestedTokens = req.body?.tokens;
      const hasPlan = typeof requestedPlan === "string";
      const hasTokens = requestedTokens !== undefined;

      if (!hasPlan && !hasTokens) {
        return res.status(400).json({ error: "Provide at least one field: plan or tokens" });
      }

      let plan: "starter" | "professional" | "enterprise" | undefined;
      if (hasPlan) {
        if (!["starter", "professional", "enterprise"].includes(requestedPlan!)) {
          return res.status(400).json({ error: "Invalid plan" });
        }
        plan = requestedPlan as "starter" | "professional" | "enterprise";
      }

      let tokens: number | undefined;
      if (hasTokens) {
        const parsed = Number(requestedTokens);
        if (!Number.isInteger(parsed) || parsed < 0) {
          return res.status(400).json({ error: "tokens must be a non-negative integer" });
        }
        tokens = parsed;
      }

      const finalTokens = tokens ?? (plan ? PLAN_TOKEN_DEFAULTS[plan] : undefined);

      const updated = await storage.adminUpdateUser(userId, { plan, tokens: finalTokens });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        id: updated.id,
        username: updated.username,
        tokens: updated.tokens,
        plan: updated.plan,
        role: updated.role,
        isAdmin: userIsAdmin(updated),
      });
    } catch (error) {
      console.error("[ADMIN] Failed to update user:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/subscription/activate", requireAuth, async (req, res) => {
    try {
      const requestedPlan = String(req.body?.plan || "").toLowerCase();
      const allowedPlans = ["starter", "professional", "enterprise"] as const;

      if (!allowedPlans.includes(requestedPlan as any)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const plan = requestedPlan as (typeof allowedPlans)[number];

      const updated = await storage.updateUserPlan(req.user!.id, plan, PLAN_TOKEN_DEFAULTS[plan]);

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        success: true,
        user: {
          id: updated.id,
          username: updated.username,
          tokens: updated.tokens,
          plan: updated.plan,
          role: updated.role,
          isAdmin: userIsAdmin(updated),
        },
      });
    } catch (error) {
      console.error("[SUBSCRIPTION] Activate plan error:", error);
      return res.status(500).json({ error: "Failed to activate plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
