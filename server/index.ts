import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import session from 'express-session';
import { loginHandler, logoutHandler, sessionCheckHandler } from './auth';
import { registerRoutes } from "./routes";
import { seedDefaultRates } from "./storage";
import { serveStatic } from "./static";
import { createServer } from "node:http";
import { helmetMiddleware, apiRateLimiter, corsMiddleware, apiKeyGuard } from "./security";
import { threatDetection, getThreatLog, getThreatStats } from "./threat-detection";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ── Security middleware (applied before all routes) ──────────────────────────
app.set("trust proxy", 1);          // trust Railway / pplx proxy for real IPs
app.use(helmetMiddleware);           // HTTP security headers
app.use(corsMiddleware);             // CORS whitelist
app.use("/api", apiRateLimiter);    // rate limit all /api/* routes
app.use("/api", apiKeyGuard);       // API key guard — blocks bots/scrapers
app.use("/api", threatDetection);   // threat detection — payload, file, anomaly, IP

// ── Security monitor API ──────────────────────────────────────────────────────
app.get("/api/security/threats", (_req, res) => {
  res.json(getThreatLog());
});
app.get("/api/security/stats", (_req, res) => {
  res.json(getThreatStats());
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// ── Session middleware ─────────────────────────────────────────────────────────
app.use(session({
  name: '__Host-medivac-sid',
  secret: 'medivac_session_secret_2026_secure',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: 'lax',
    path: '/',
  },
}));

// ── Auth routes (public — no auth required) ───────────────────────────────────
app.post('/api/auth/login',   loginHandler);
app.post('/api/auth/logout',  logoutHandler);
app.get('/api/auth/session',  sessionCheckHandler);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

(async () => {
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      // Seed default rates AFTER the server is listening. This is a Supabase
      // network round-trip; running it before listen() means a slow or failed
      // DB call on cold start prevents the process from binding, the /api/health
      // check fails, and the platform returns 503 for the ENTIRE API (including
      // NEPT create-task). Keep it in the background and never let it crash boot.
      seedDefaultRates().catch((err) =>
        console.error("[boot] seedDefaultRates failed (non-fatal):", err),
      );
    },
  );
})().catch((err) => {
  console.error("[boot] fatal startup error:", err);
  process.exit(1);
});
