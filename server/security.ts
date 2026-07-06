/**
 * Security middleware for Medivac.ai
 * - Helmet: HTTP security headers
 * - Rate limiting: per-IP throttling on all API routes
 * - CORS: restrict origins to known app domains
 * - API key guard: all /api/* routes require X-App-Key header
 */

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

// ── Helmet: HTTP security headers ─────────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // Vite bundles need this
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "blob:", "https:"],
      mediaSrc:    ["'self'", "blob:", "https:"],
      connectSrc:  ["'self'", "https:", "wss:"],
      fontSrc:     ["'self'", "data:", "https://api.fontshare.com"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,  // needed for video/media to load
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ── Rate limiting: 150 req / 15 min per IP on all /api routes ─────────────────
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 150,                    // requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later." },
  skip: (req) => req.path === "/api/health",  // health check exempt
});

// ── Strict rate limit for auth-sensitive endpoints ────────────────────────────
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests on this endpoint." },
});

// ── CORS: allow only known app origins ───────────────────────────────────────
const ALLOWED_ORIGINS = [
  // pplx.app published sites
  "https://medivac-ai.pplx.app",
  "https://medivac-ai-demo.pplx.app",
  // Railway production
  "https://medivacai-production.up.railway.app",
  // pplx.app preview proxy (computer.a)
  /^https:\/\/sites\.pplx\.app/,
  /^https:\/\/www\.perplexity\.ai/,
];

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin || "";
  const allowed = ALLOWED_ORIGINS.some((o) =>
    typeof o === "string" ? o === origin : o.test(origin)
  );

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-App-Key");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}

// ── API key guard: blocks bots / scrapers from /api/* routes ─────────────────
// The key is baked into the frontend bundle at build time via VITE_APP_KEY env var.
// Bots hitting the API directly won't have it.
const APP_KEY = process.env.APP_KEY || "";

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  // Skip OPTIONS preflight and health check
  // Note: when mounted as app.use("/api", apiKeyGuard), req.path is the suffix
  // e.g. /api/health → req.path === "/health"
  if (req.method === "OPTIONS" || req.path === "/health" || req.originalUrl === "/api/health") {
    return next();
  }

  // Skip if no APP_KEY is configured (dev environment safety net)
  if (!APP_KEY) {
    return next();
  }

  const sentKey = req.headers["x-app-key"] as string | undefined;

  if (!sentKey || sentKey !== APP_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
