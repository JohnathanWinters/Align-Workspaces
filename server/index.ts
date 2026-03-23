import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { doubleCsrf } from "csrf-csrf";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes } from "./auth";
import { seedPortfolioIfEmpty } from "./seed-portfolio";
import { fixPortfolioImageExtensions } from "./migrations";
import { seedSpacesIfEmpty } from "./seed-spaces";
import { seedTestClient } from "./seed-test-client";
import { seedTeamMembersIfEmpty } from "./seed-team-members";
import { seedFeaturedProfessionals } from "./seed-featured";
import { startPayoutProcessing } from "./payouts";
import { WebhookHandlers } from "./webhookHandlers";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// --- CSRF Protection ---

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.SESSION_SECRET || "csrf-dev-secret",
  cookieName: "__csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  getCsrfTokenFromRequest: (req: any) => req.headers["x-csrf-token"],
} as any);

app.get("/api/csrf-token", (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ token });
});

app.use((req, res, next) => {
  // Skip CSRF for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  // Skip CSRF for Stripe webhook (uses its own signature verification)
  if (req.path === "/api/stripe/webhook") return next();
  // Skip CSRF for analytics tracking
  if (req.path === "/api/track") return next();
  // Skip CSRF for push subscriptions
  if (req.path.startsWith("/api/push/")) return next();
  // Skip CSRF for login/auth endpoints (session-based auth with sameSite cookies)
  if (req.path === "/api/admin/login" || req.path === "/api/employee/login") return next();
  if (req.path.startsWith("/api/auth/")) return next();
  // Skip CSRF for admin API calls (use Bearer token auth)
  if (req.headers.authorization?.startsWith("Bearer ")) return next();

  doubleCsrfProtection(req, res, next);
});

// --- Rate Limiters ---

// Strict limiter: 5 requests per 15 minutes for auth endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

// Moderate limiter: 30 requests per 15 minutes for public POST endpoints
const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP. Please try again after 15 minutes." },
});

// General API limiter: 100 requests per minute for all /api/ routes
const apiGeneralLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many API requests from this IP. Please slow down and try again shortly." },
});

// Apply strict limiter to auth endpoints
app.use("/api/admin/login", strictLimiter);
app.use("/api/employee/login", strictLimiter);
app.use("/api/auth/magic-link", strictLimiter);
app.use("/api/auth/magic-signup", strictLimiter);

// Apply moderate limiter to public POST endpoints
app.use("/api/leads", moderateLimiter);
app.use("/api/collaborate", moderateLimiter);
app.use("/api/nominations", moderateLimiter);
app.use("/api/newsletter/subscribe", moderateLimiter);
app.use("/api/help-request", moderateLimiter);
app.use("/api/track", moderateLimiter);

// Apply general limiter to all /api/ routes as a baseline
app.use("/api/", apiGeneralLimiter);

const DOMAIN_REDIRECTS: Record<string, string> = {
  "alignportraits.com": "https://alignworkspaces.com/portfolio",
  "www.alignportraits.com": "https://alignworkspaces.com/portfolio",
  "buildmyphoto.com": "https://alignworkspaces.com/portrait-builder",
  "www.buildmyphoto.com": "https://alignworkspaces.com/portrait-builder",
  "alignvisuals.com": "https://alignworkspaces.com/portrait-builder",
  "www.alignvisuals.com": "https://alignworkspaces.com/portrait-builder",
};

app.use((req, res, next) => {
  const host = (req.hostname || req.headers.host || "").split(":")[0].toLowerCase();
  const target = DOMAIN_REDIRECTS[host];
  if (target) {
    return res.redirect(301, target);
  }
  next();
});

const PATH_REDIRECTS: Record<string, string> = {
  "/browse": "/workspaces",
  "/portraits/builder": "/portrait-builder",
  "/portraits": "/portrait-builder",
  "/about": "/our-vision",
};

app.use((req, res, next) => {
  const newPath = PATH_REDIRECTS[req.path];
  if (newPath) {
    const qs = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
    return res.redirect(301, newPath + qs);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Stripe webhook — uses rawBody captured by express.json verify callback
app.post("/api/stripe/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const rawBody = req.rawBody;

  if (!signature) {
    console.error("Webhook: missing stripe-signature header");
    return res.status(400).json({ message: "Missing signature" });
  }
  if (!rawBody) {
    console.error("Webhook: missing rawBody — express.json verify may not be capturing it");
    return res.status(400).json({ message: "Missing body" });
  }

  // Ensure rawBody is a Buffer
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody as any);

  try {
    await WebhookHandlers.processWebhook(payload, signature as string);
    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

(async () => {
  await setupAuth(app);
  registerAuthRoutes(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      Promise.all([
        seedPortfolioIfEmpty().catch(err => console.warn('Portfolio seed error (non-fatal):', err.message)),
        seedSpacesIfEmpty().catch(err => console.warn('Spaces seed error (non-fatal):', err.message)),
        seedTestClient().catch(err => console.warn('Test client seed error (non-fatal):', err.message)),
        seedTeamMembersIfEmpty().catch(err => console.warn('Team members seed error (non-fatal):', err.message)),
        seedFeaturedProfessionals().catch(err => console.warn('Featured professionals seed error (non-fatal):', err.message)),
        fixPortfolioImageExtensions().catch(err => console.warn('Migration error (non-fatal):', err.message)),
      ]).then(() => {
        log('Background initialization complete');
      });

      // Start automatic payout processing (runs every hour)
      startPayoutProcessing();
    },
  );
})();
