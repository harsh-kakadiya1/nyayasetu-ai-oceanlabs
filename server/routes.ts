import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertDocumentSchema, insertAnalysisSchema, insertChatMessageSchema } from "./schema.js";
import { analyzeDocument, answerQuestion } from "./services/groq.js";
import { parseTextContent, parseUploadedDocument } from "./services/documentParser.js";
import multer from "multer";
import path from "path";
import passport from "passport";
import bcrypt from "bcrypt";
import { requireAuth } from "./auth.js";

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
  
  // Health check - no auth required
  app.get("/api/health", (req, res) => {
    console.log('[HEALTH] Health check called');
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.post(["/api/auth/register", "/api/auth-register"], async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });

      res.json({ id: user.id, username: user.username });
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

        res.json({ id: user.id, username: user.username });
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
      return res.json({ id: req.user.id, username: req.user.username });
    }

    return res.status(401).json({ error: "Not authenticated" });
  });

  // Google OAuth Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

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
        res.redirect(`${frontendUrl}/dashboard?auth=success`);
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
        "POST /api/documents/upload",
        "POST /api/documents/analyze-text", 
        "GET /api/analysis/:id/messages",
        "POST /api/analysis/:id/chat",
        "GET /api/history"
      ]
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Upload and analyze document via file
  app.post(["/api/documents/upload", "/api/documents-upload"], requireAuth, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { documentType, summaryLength, language } = req.body;
      const preferredLanguage = language || req.headers['accept-language'] || 'en';
      
      // Parse the uploaded document
      const parsedDoc = await parseUploadedDocument(req.file);
      
      // Create document record
      const documentData = insertDocumentSchema.parse({
        userId: req.user.id,
        filename: req.file.originalname,
        content: parsedDoc.content,
        documentType: documentType || "auto-detect",
      });

      const document = await storage.createDocument(documentData);

      // Analyze document with Groq
      const startTime = Date.now();
      const analysis = await analyzeDocument(parsedDoc.content, documentType, preferredLanguage as string);
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)} seconds`;

      // Create analysis record
      const analysisData = insertAnalysisSchema.parse({
        userId: req.user.id,
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
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process document" 
      });
    }
  });

  // Analyze document via text input
  app.post(["/api/documents/analyze-text", "/api/documents-analyze-text"], requireAuth, async (req, res) => {
    try {
      const { content, documentType, summaryLength, language } = req.body;
      const preferredLanguage = language || req.headers['accept-language'] || 'en';

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Document content is required" });
      }

      // Parse text content
      const parsedDoc = parseTextContent(content);

      // Create document record
      const documentData = insertDocumentSchema.parse({
        userId: req.user.id,
        filename: null,
        content: parsedDoc.content,
        documentType: documentType || "auto-detect",
      });

      const document = await storage.createDocument(documentData);

      // Analyze document with Groq
      const startTime = Date.now();
      const analysis = await analyzeDocument(parsedDoc.content, documentType, preferredLanguage as string);
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)} seconds`;

      // Create analysis record
      const analysisData = insertAnalysisSchema.parse({
        userId: req.user.id,
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
      });
    } catch (error) {
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

      if (analysis.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ error: "Failed to retrieve analysis" });
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

      if (analysis.userId !== req.user.id) {
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

      if (analysis.userId !== req.user.id) {
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
        userId: req.user.id,
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
      const analyses = await storage.getUserAnalyses(req.user.id);
      console.log(`[HISTORY] Found ${analyses?.length || 0} analyses for user ${req.user?.id}`);
      res.json(analyses || []);
    } catch (error) {
      console.error("[HISTORY] Get history error:", error);
      res.status(500).json({ error: "Failed to retrieve history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
