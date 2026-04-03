import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage.js";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

const PgSessionStore = connectPgSimple(session);

let cachedSessionStore: session.Store | null = null;
let cachedSessionPool: pg.Pool | null = null;

async function getSessionStore(): Promise<session.Store> {
  if (cachedSessionStore) {
    return cachedSessionStore;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Supabase session store is mandatory.");
  }

  const sessionPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await sessionPool.query("SELECT 1");
  cachedSessionPool = sessionPool;

  const pgSessionStore = new PgSessionStore({
    pool: cachedSessionPool,
    tableName: "session",
    createTableIfMissing: true,
  });

  cachedSessionStore = pgSessionStore;
  console.log("[AUTH] Session store: PostgreSQL (Supabase only mode)");
  return pgSessionStore;
}

export async function setupAuth(app: any) {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite: session.CookieOptions["sameSite"] = isProduction ? "none" : "lax";

  app.set("trust proxy", 1);

  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "nyayasetu-secret-key",
    resave: false,
    saveUninitialized: false,
    store: await getSessionStore(),
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite,
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  app.use(session(sessionConfig));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
}
