import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import { setupVite, log } from "./vite.js";

const app = express();

function normalizeOrigin(value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
].map((origin) => normalizeOrigin(origin) as string);

const envAllowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()),
]
  .map((origin) => normalizeOrigin(origin))
  .filter((origin): origin is string => !!origin);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

// CORS configuration for browser clients (frontend runs on a separate domain).
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin as string | undefined;
  const normalizedOrigin = normalizeOrigin(requestOrigin);
  const isLocalhost = !!normalizedOrigin && normalizedOrigin.startsWith("http://localhost");
  const isAllowedOrigin = !!normalizedOrigin && (allowedOrigins.includes(normalizedOrigin) || (!process.env.VERCEL && isLocalhost));

  if (requestOrigin && isAllowedOrigin) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Accept-Language",
    );
  } else if (requestOrigin) {
    console.log(`[CORS] Blocked origin: ${requestOrigin}`);
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize app for traditional server mode
export async function createApp() {
  await setupAuth(app);
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('ERROR DETAILS:');
    console.error('Status:', status);
    console.error('Message:', message);
    console.error('Stack:', err.stack);
    console.error('Full error:', err);

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  await setupVite(app, server);

  return { app, server };
}

// Traditional server mode
if (!process.env.VERCEL) {
  (async () => {
    const { initializeStorage } = await import('./storage.js');
    try {
      await initializeStorage();
    } catch (err) {
      console.error('[SERVER] Storage initialization failed:', err);
      console.error('Make sure DATABASE_URL is set in your .env file');
    }
    
    const { server } = await createApp();
    // Default to port 5000 for local development.
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  })().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
}
