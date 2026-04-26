import type { Express, Request, Response } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./auth";
import { db } from "../db";
import { users, magicTokens, userDevices, type User } from "@shared/models/auth";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { sendMagicLinkEmail, sendEmailChangeConfirmation } from "../gmail";

const DEVICE_COOKIE_NAME = "align_device";
const DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function setDeviceCookie(res: Response, token: string) {
  res.cookie(DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEVICE_TTL_MS,
    path: "/",
  });
}
function sanitizeUser(user: User) {
  const { password, pendingEmail, pendingEmailToken, pendingEmailExpiresAt, ...safe } = user;
  return safe;
}

async function getAuthUserId(req: any): Promise<string | null> {
  if (req.session?.magicUserId) return req.session.magicUserId;
  return null;
}

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", async (req: any, res) => {
    if (req.session?.magicUserId) {
      try {
        const [user] = await db.select().from(users).where(eq(users.id, req.session.magicUserId));
        if (user) return res.json(sanitizeUser(user));
      } catch {}
    }

    return res.status(401).json({ message: "Unauthorized" });
  });

  app.get("/api/auth/trusted-device", async (req: any, res) => {
    const deviceToken = req.cookies?.[DEVICE_COOKIE_NAME];
    if (!deviceToken || typeof deviceToken !== "string") {
      return res.status(404).json({ trusted: false });
    }
    try {
      const tokenHash = hashDeviceToken(deviceToken);
      const [device] = await db.select().from(userDevices).where(
        and(
          eq(userDevices.tokenHash, tokenHash),
          gt(userDevices.expiresAt, new Date())
        )
      );
      if (!device) return res.status(404).json({ trusted: false });

      const [user] = await db.select().from(users).where(eq(users.id, device.userId));
      if (!user || !user.email) return res.status(404).json({ trusted: false });

      return res.json({
        trusted: true,
        email: user.email,
        firstName: user.firstName ?? null,
      });
    } catch (err) {
      console.error("Trusted device check failed:", err);
      return res.status(404).json({ trusted: false });
    }
  });

  app.post("/api/auth/magic-link", async (req: any, res: Response) => {
    try {
      const { email, firstName, lastName, returnTo, rememberDevice } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      const isNewUser = !existingUser;

      if (existingUser) {
        const deviceToken = req.cookies?.[DEVICE_COOKIE_NAME];
        if (deviceToken && typeof deviceToken === "string") {
          const tokenHash = hashDeviceToken(deviceToken);
          const [device] = await db.select().from(userDevices).where(
            and(
              eq(userDevices.userId, existingUser.id),
              eq(userDevices.tokenHash, tokenHash),
              gt(userDevices.expiresAt, new Date())
            )
          );
          if (device) {
            (req.session as any).magicUserId = existingUser.id;
            await db.update(userDevices)
              .set({ lastUsedAt: new Date() })
              .where(eq(userDevices.id, device.id));
            return new Promise<void>((resolve) => {
              req.session.save((err: any) => {
                if (err) console.error("Session save error:", err);
                res.json({ signedIn: true });
                resolve();
              });
            });
          }
        }
      }

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
      let magicUrl = `${baseUrl}/api/auth/magic-verify?token=${token}`;
      if (returnTo) magicUrl += `&returnTo=${encodeURIComponent(returnTo)}`;
      if (isNewUser && firstName) magicUrl += `&firstName=${encodeURIComponent(firstName.trim())}`;
      if (isNewUser && lastName) magicUrl += `&lastName=${encodeURIComponent(lastName.trim())}`;
      if (rememberDevice) magicUrl += `&remember=1`;

      await sendMagicLinkEmail(normalizedEmail, magicUrl);

      res.json({ sent: true, isNewUser });
    } catch (error: any) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send sign-in link" });
    }
  });

  app.get("/api/auth/magic-verify", async (req: Request, res: Response) => {
    try {
      const { token, returnTo, firstName, lastName, remember } = req.query;
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
        const newUserData: any = {
          email: magicToken.email,
          termsAcceptedAt: new Date(),
          termsVersion: "2026-03-27",
        };
        if (typeof firstName === "string" && firstName.trim()) newUserData.firstName = firstName.trim();
        if (typeof lastName === "string" && lastName.trim()) newUserData.lastName = lastName.trim();
        const [newUser] = await db
          .insert(users)
          .values(newUserData)
          .returning();
        user = newUser;
      } else if (!user.termsAcceptedAt) {
        // Existing user who hasn't accepted terms yet — mark acceptance on login
        await db.update(users).set({ termsAcceptedAt: new Date(), termsVersion: "2026-03-27" }).where(eq(users.id, user.id));
      }

      (req.session as any).magicUserId = user.id;

      if (remember === "1" && user) {
        try {
          const deviceToken = randomBytes(32).toString("hex");
          await db.insert(userDevices).values({
            userId: user.id,
            tokenHash: hashDeviceToken(deviceToken),
            expiresAt: new Date(Date.now() + DEVICE_TTL_MS),
            userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 255) : null,
          });
          setDeviceCookie(res, deviceToken);
        } catch (err) {
          console.error("Device token creation failed (non-fatal):", err);
        }
      }

      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        const destination = (typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")) ? returnTo : "/";
        res.redirect(destination);
      });
    } catch (error: any) {
      console.error("Magic verify error:", error);
      res.redirect("/?auth=error");
    }
  });

  // No longer creates user — just acknowledges the name for the magic-link call that follows
  app.post("/api/auth/magic-signup", async (req: Request, res: Response) => {
    try {
      const { email, firstName } = req.body;
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      res.json({ ok: true });
    } catch (error: any) {
      console.error("Magic signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.patch("/api/auth/profile", async (req: any, res: Response) => {
    try {
      const userId = await getAuthUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { firstName, lastName } = req.body;
      if (typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }

      const [updated] = await db.update(users).set({
        firstName: firstName.trim(),
        lastName: typeof lastName === "string" ? lastName.trim() || null : null,
        updatedAt: new Date(),
      }).where(eq(users.id, userId)).returning();

      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(sanitizeUser(updated));
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/auth/request-email-change", async (req: any, res: Response) => {
    try {
      const userId = await getAuthUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { newEmail } = req.body;
      if (!newEmail || typeof newEmail !== "string") return res.status(400).json({ message: "New email is required" });

      const normalizedNewEmail = newEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedNewEmail)) return res.status(400).json({ message: "Invalid email format" });

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.email === normalizedNewEmail) return res.status(400).json({ message: "That is already your email" });

      const [existing] = await db.select().from(users).where(eq(users.email, normalizedNewEmail));
      if (existing) return res.status(400).json({ message: "Email already in use" });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await db.update(users).set({
        pendingEmail: normalizedNewEmail,
        pendingEmailToken: token,
        pendingEmailExpiresAt: expiresAt,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const confirmUrl = `${baseUrl}/api/auth/confirm-email-change?token=${token}`;

      await sendEmailChangeConfirmation(user.email!, confirmUrl, normalizedNewEmail);

      res.json({ sent: true });
    } catch (error: any) {
      console.error("Request email change error:", error);
      res.status(500).json({ message: "Failed to request email change" });
    }
  });

  app.get("/api/auth/confirm-email-change", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/portal?emailChange=invalid");
      }

      const [user] = await db.select().from(users).where(
        and(
          eq(users.pendingEmailToken, token),
          gt(users.pendingEmailExpiresAt, new Date())
        )
      );

      if (!user || !user.pendingEmail) {
        return res.redirect("/portal?emailChange=expired");
      }

      res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm Email Change</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#faf9f7}
      .card{background:#fff;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
      h1{font-size:20px;font-weight:600;color:#1a1a1a;margin:0 0 8px;font-family:Georgia,serif}
      p{font-size:14px;color:#6b6560;margin:0 0 24px;line-height:1.5}
      .email{font-weight:600;color:#1a1a1a}
      button{background:#1a1a1a;color:#fff;border:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:500;cursor:pointer}
      button:hover{background:#333}
      .cancel{background:none;color:#6b6560;font-size:13px;margin-top:12px;padding:8px}
      .cancel:hover{color:#1a1a1a;background:none}</style></head>
      <body><div class="card"><h1>Confirm Email Change</h1>
      <p>Change your email to:<br><span class="email">${(user.pendingEmail || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}</span></p>
      <form method="POST" action="/api/auth/confirm-email-change"><input type="hidden" name="token" value="${token}">
      <button type="submit">Confirm Change</button></form>
      <a href="/portal"><button type="button" class="cancel">Cancel</button></a></div></body></html>`);
    } catch (error: any) {
      console.error("Confirm email change error:", error);
      res.redirect("/portal?emailChange=error");
    }
  });

  app.post("/api/auth/confirm-email-change", async (req: Request, res: Response) => {
    try {
      const token = req.body?.token;
      if (!token || typeof token !== "string") {
        return res.redirect("/portal?emailChange=invalid");
      }

      const [user] = await db.select().from(users).where(
        and(
          eq(users.pendingEmailToken, token),
          gt(users.pendingEmailExpiresAt, new Date())
        )
      );

      if (!user || !user.pendingEmail) {
        return res.redirect("/portal?emailChange=expired");
      }

      const [existingCheck] = await db.select().from(users).where(eq(users.email, user.pendingEmail));
      if (existingCheck && existingCheck.id !== user.id) {
        return res.redirect("/portal?emailChange=taken");
      }

      await db.update(users).set({
        email: user.pendingEmail,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      res.redirect("/portal?emailChange=success");
    } catch (error: any) {
      console.error("Confirm email change error:", error);
      res.redirect("/portal?emailChange=error");
    }
  });

  app.patch("/api/auth/default-tab", async (req: any, res: Response) => {
    try {
      const userId = await getAuthUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { tab } = req.body;
      const validTabs = ["shoots", "edits", "messages", "spaces", "my-spaces", "past-spaces", null];
      if (!validTabs.includes(tab)) {
        return res.status(400).json({ message: "Invalid tab" });
      }

      const [updated] = await db.update(users).set({
        defaultPortalTab: tab || null,
        updatedAt: new Date(),
      }).where(eq(users.id, userId)).returning();

      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(sanitizeUser(updated));
    } catch (error: any) {
      console.error("Update default tab error:", error);
      res.status(500).json({ message: "Failed to update default tab" });
    }
  });

  app.patch("/api/auth/notification-preferences", async (req: any, res: Response) => {
    try {
      const userId = await getAuthUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { pushMessages, pushBookings, emailMessages, emailBookings } = req.body;
      const prefs = {
        pushMessages: pushMessages !== false,
        pushBookings: pushBookings !== false,
        emailMessages: emailMessages !== false,
        emailBookings: emailBookings !== false,
      };

      const [updated] = await db.update(users).set({
        notificationPreferences: prefs,
        updatedAt: new Date(),
      }).where(eq(users.id, userId)).returning();

      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(sanitizeUser(updated));
    } catch (error: any) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session?.destroy?.((err: any) => {
      if (err) console.error("Logout error:", err);
      res.json({ ok: true });
    });
  });
}
