import { createApp } from "../index.js";
import { ensureInitialized } from "../storage.js";

let cachedAppPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  try {
    // Ensure storage is initialized on first request
    if (!cachedAppPromise) {
      try {
        await ensureInitialized();
      } catch (initError: any) {
        console.error('[HANDLER] Storage initialization failed:', initError);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: initError?.message || 'Storage initialization failed',
          code: 'STORAGE_INIT_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
      
      cachedAppPromise = createApp().catch((appError: any) => {
        console.error('[HANDLER] App creation failed:', appError);
        throw appError;
      });
    }

    const { app } = await cachedAppPromise;

    // Express apps are request handlers and can be invoked directly.
    return app(req, res);
  } catch (error: any) {
    console.error('[HANDLER] Request error:', error);
    
    // Return error response with diagnostics
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to process request',
      code: 'REQUEST_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
}
