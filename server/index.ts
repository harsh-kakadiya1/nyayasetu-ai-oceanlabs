import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import { setupVite, log } from "./vite.js";

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

const envAllowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()),
]
  .filter(Boolean) as string[];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

// CORS configuration for browser clients (frontend runs on a separate domain).
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const isLocalhost = !!origin && origin.startsWith("http://localhost");
  const isAllowedOrigin = !!origin && (allowedOrigins.includes(origin) || (!process.env.VERCEL && isLocalhost));

  if (origin && isAllowedOrigin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Accept-Language",
    );
  } else if (origin) {
    console.log(`[CORS] Blocked origin: ${origin}`);
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
