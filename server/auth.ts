import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage.js";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { normalizeEmailIdentifier } from "./emailUtils.js";

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
      const user = await storage.getUserByUsername(normalizeEmailIdentifier(username));
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

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = normalizeEmailIdentifier(profile.emails?.[0]?.value || "");
        if (!email) {
          return done(null, false, { message: "No email from Google profile" });
        }

        // Check if user exists by email
        let user = await storage.getUserByUsername(email);
        let accountStatus: "existing" | "created" = "existing";
        
        if (!user) {
          // Create new user with a random password (Google auth doesn't need it)
          const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
          try {
            user = await storage.createUser({
              username: email,
              password: randomPassword,
            });
            accountStatus = "created";
          } catch (error) {
            // If another request created the account first, reuse it instead of duplicating.
            user = await storage.getUserByUsername(email);
            if (!user) {
              throw error;
            }
            accountStatus = "existing";
          }
          console.log(`[AUTH] New Google user created: ${email}`);
        }

        (user as any).__oauthAccountStatus = accountStatus;

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }));
  }

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
