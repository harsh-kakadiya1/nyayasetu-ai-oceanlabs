import { createApp } from "../index.js";

let cachedAppPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  if (!cachedAppPromise) {
    cachedAppPromise = createApp();
  }

  const { app } = await cachedAppPromise;

  // Express apps are request handlers and can be invoked directly.
  return app(req, res);
}
