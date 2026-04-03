import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage.js";
import bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

const MemoryStoreSession = MemoryStore(session);
const PgSessionStore = connectPgSimple(session);

let cachedSessionStore: session.Store | null = null;
let cachedSessionPool: pg.Pool | null = null;

function getSessionStore(): session.Store {
  if (cachedSessionStore) {
    return cachedSessionStore;
  }

  if (process.env.DATABASE_URL) {
    cachedSessionPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });

    const pgSessionStore = new PgSessionStore({
      pool: cachedSessionPool,
      tableName: "session",
      createTableIfMissing: true,
    });
    cachedSessionStore = pgSessionStore;

    console.log("[AUTH] Session store: PostgreSQL");
    return pgSessionStore;
  }

  const memorySessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
  cachedSessionStore = memorySessionStore;
  console.warn("[AUTH] Session store: MemoryStore (non-persistent)");
  return memorySessionStore;
}

export function setupAuth(app: any) {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite: session.CookieOptions["sameSite"] = isProduction ? "none" : "lax";

  // Required when secure cookies are set behind Vercel's proxy.
  app.set("trust proxy", 1);

  // Session configuration
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'nyayasetu-secret-key',
    resave: false,
    saveUninitialized: false,
    store: getSessionStore(),
    cookie: {
      secure: isProduction,
      httpOnly: true, // Prevent client-side JS from accessing the cookie
      sameSite,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  console.log('[AUTH] Session configuration:');
  console.log(`  - Secure: ${sessionConfig.cookie!.secure}`);
  console.log(`  - HttpOnly: ${sessionConfig.cookie!.httpOnly}`);
  console.log(`  - SameSite: ${sessionConfig.cookie!.sameSite}`);
  console.log("  - Domain: host-only");
  console.log(`  - MaxAge: ${sessionConfig.cookie!.maxAge}ms`);

  // Session middleware
  app.use(session(sessionConfig));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log(`[AUTH] Strategy: attempting to authenticate ${username}`);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[AUTH] Strategy: user not found - ${username}`);
        return done(null, false, { message: 'Incorrect username.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log(`[AUTH] Strategy: password mismatch for ${username}`);
        return done(null, false, { message: 'Incorrect password.' });
      }

      console.log(`[AUTH] Strategy: user authenticated - ${username} (${user.id})`);
      return done(null, user);
    } catch (error) {
      console.error(`[AUTH] Strategy error:`, error);
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    console.log(`[AUTH] Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log(`[AUTH] Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`[AUTH] Deserialization failed: user not found - ${id}`);
        return done(null, false);
      }
      console.log(`[AUTH] Deserialized user: ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error(`[AUTH] Deserialization error:`, error);
      done(error);
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  console.log(`[AUTH] requireAuth check for ${req.path}`);
  console.log(`  - isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`  - user: ${req.user ? req.user.username : 'none'}`);
  console.log(`  - sessionID: ${req.sessionID || 'none'}`);
  
  if (req.isAuthenticated()) {
    console.log(`[AUTH] ✓ Authentication OK for user: ${req.user.username}`);
    return next();
  }
  console.log(`[AUTH] ✗ Authentication FAILED - returning 401`);
  res.status(401).json({ error: 'Authentication required' });
}