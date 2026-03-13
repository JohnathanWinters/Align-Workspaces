import type { Express, Request, Response } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { db } from "../../db";
import { users, magicTokens } from "@shared/models/auth";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "../../gmail";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", async (req: any, res) => {
    if (req.session?.magicUserId) {
      try {
        const [user] = await db.select().from(users).where(eq(users.id, req.session.magicUserId));
        if (user) return res.json(user);
      } catch {}
    }

    if (req.isAuthenticated?.() && req.user?.claims?.sub) {
      try {
        const user = await authStorage.getUser(req.user.claims.sub);
        if (user) return res.json(user);
      } catch {}
    }

    return res.status(401).json({ message: "Unauthorized" });
  });

  app.post("/api/auth/magic-link", async (req: Request, res: Response) => {
    try {
      const { email, firstName, returnTo } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      const isNewUser = !existingUser;

      if (isNewUser && (!firstName || typeof firstName !== "string" || !firstName.trim())) {
        return res.json({ needsName: true });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(magicTokens).values({
        email: normalizedEmail,
        token,
        expiresAt,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const magicUrl = `${baseUrl}/api/auth/magic-verify?token=${token}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`;

      await sendMagicLinkEmail(normalizedEmail, magicUrl);

      res.json({ sent: true, isNewUser });
    } catch (error: any) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send sign-in link" });
    }
  });

  app.get("/api/auth/magic-verify", async (req: Request, res: Response) => {
    try {
      const { token, returnTo } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/?auth=invalid");
      }

      const [magicToken] = await db
        .select()
        .from(magicTokens)
        .where(
          and(
            eq(magicTokens.token, token),
            eq(magicTokens.used, false),
            gt(magicTokens.expiresAt, new Date())
          )
        );

      if (!magicToken) {
        return res.redirect("/?auth=expired");
      }

      await db.update(magicTokens).set({ used: true }).where(eq(magicTokens.id, magicToken.id));

      let [user] = await db.select().from(users).where(eq(users.email, magicToken.email));

      if (!user) {
        const [newUser] = await db
          .insert(users)
          .values({ email: magicToken.email })
          .returning();
        user = newUser;
      }

      (req.session as any).magicUserId = user.id;

      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        const destination = (typeof returnTo === "string" && returnTo.startsWith("/")) ? returnTo : "/browse";
        res.redirect(destination);
      });
    } catch (error: any) {
      console.error("Magic verify error:", error);
      res.redirect("/?auth=error");
    }
  });

  app.post("/api/auth/magic-signup", async (req: Request, res: Response) => {
    try {
      const { email, firstName } = req.body;
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and name are required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      if (!existing) {
        await db.insert(users).values({
          email: normalizedEmail,
          firstName: firstName.trim(),
        });
      } else {
        if (!existing.firstName) {
          await db.update(users).set({ firstName: firstName.trim() }).where(eq(users.id, existing.id));
        }
      }

      res.json({ ok: true });
    } catch (error: any) {
      console.error("Magic signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session?.destroy?.((err: any) => {
      if (err) console.error("Logout error:", err);
      res.json({ ok: true });
    });
  });
}
