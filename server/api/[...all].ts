import { createApp } from "../index.js";
import { createServer } from "http";

let cachedAppPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  if (!cachedAppPromise) {
    cachedAppPromise = createApp();
  }

  const { app } = await cachedAppPromise;
  
  // Invoke Express through HTTP server interface
  return new Promise<void>((resolve) => {
    const server = createServer(app);
    server.emit("request", req, res);
    
    res.on("finish", () => {
      resolve();
    });
    
    res.on("close", () => {
      resolve();
    });
    
    setTimeout(() => resolve(), 30000); // 30s timeout fallback
  });
}
