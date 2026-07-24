import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ── Admin credentials ─────────────────────────────────────────────────────────
const ADMINS: { email: string; hash: string }[] = [];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'medivac_salt_2026').digest('hex');
}

function addAdmin(email: string, password: string) {
  ADMINS.push({ email: email.trim().toLowerCase(), hash: hashPassword(password) });
}

addAdmin('andy@awlabs.com.au', 'Andy@awl2026');

// ── Session type extension ────────────────────────────────────────────────────
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    email: string;
    loginTime: string;
  }
}

// ── Auth middleware ───────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ── Login handler ─────────────────────────────────────────────────────────────
export function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const admin = ADMINS.find(a => a.email === email.trim().toLowerCase());
  const hash  = hashPassword(password);

  if (!admin || hash !== admin.hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.authenticated = true;
  req.session.email         = email.trim().toLowerCase();
  req.session.loginTime     = new Date().toISOString();

  res.json({ success: true, email: req.session.email, loginTime: req.session.loginTime });
}

// ── Logout handler ────────────────────────────────────────────────────────────
export function logoutHandler(req: Request, res: Response) {
  req.session.destroy(() => res.json({ success: true }));
}

// ── Session check ─────────────────────────────────────────────────────────────
export function sessionCheckHandler(req: Request, res: Response) {
  if (req.session?.authenticated) {
    res.json({ authenticated: true, email: req.session.email, loginTime: req.session.loginTime });
  } else {
    res.json({ authenticated: false });
  }
}
