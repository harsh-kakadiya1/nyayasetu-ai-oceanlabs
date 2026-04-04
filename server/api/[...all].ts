import { createApp } from "../index.js";
import { ensureInitialized } from "../storage.js";

let cachedAppPromise: ReturnType<typeof createApp> | null = null;
let startupError: Error | null = null;

export default async function handler(req: any, res: any) {
  try {
    // Ensure storage is initialized before processing requests
    await ensureInitialized();

    if (!cachedAppPromise) {
      cachedAppPromise = createApp();
    }

    const { app } = await cachedAppPromise;

    // Express apps are request handlers and can be invoked directly.
    return app(req, res);
  } catch (error: any) {
    startupError = error;
    console.error('[HANDLER] Startup error:', error);
    
    // Return error response with diagnostics
    res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to initialize backend',
      code: 'STARTUP_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
}
