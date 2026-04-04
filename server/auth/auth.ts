import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 1 month
  const sessionOpts: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET must be set in production"); })() : "local-dev-secret"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  };

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionOpts.store = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  return session(sessionOpts);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (req.session?.magicUserId) {
    try {
      const [dbUser] = await db.select().from(users).where(eq(users.id, req.session.magicUserId));
      if (dbUser) {
        req.user = {
          claims: {
            sub: dbUser.id,
            email: dbUser.email,
            first_name: dbUser.firstName || dbUser.email?.split("@")[0] || "Guest",
          },
        };
        return next();
      }
    } catch {}
  }

  return res.status(401).json({ message: "Unauthorized" });
};
