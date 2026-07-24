import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    email: string;
    loginTime: string;
  }
}

const ADMIN_EMAIL    = 'andy@awlabs.com.au';
const ADMIN_PASSWORD = 'Andy@awl2026';

// In-memory token store — survives as long as the server process is running
const validTokens = new Map<string, { email: string; created: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Clean up tokens older than 8 hours
function cleanTokens() {
  const cutoff = Date.now() - 8 * 60 * 60 * 1000;
  for (const [token, data] of validTokens.entries()) {
    if (data.created < cutoff) validTokens.delete(token);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check Authorization header first
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (validTokens.has(token)) return next();
  }
  // Also check session as fallback
  if (req.session?.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

export function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const emailOk    = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passwordOk = password === ADMIN_PASSWORD;

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  cleanTokens();
  const token = generateToken();
  validTokens.set(token, { email: ADMIN_EMAIL, created: Date.now() });

  // Also set session as backup
  req.session.authenticated = true;
  req.session.email = ADMIN_EMAIL;

  res.json({ success: true, email: ADMIN_EMAIL, token });
}

export function logoutHandler(req: Request, res: Response) {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    validTokens.delete(authHeader.slice(7));
  }
  req.session.destroy(() => {});
  res.json({ success: true });
}

export function sessionCheckHandler(req: Request, res: Response) {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const data = validTokens.get(token);
    if (data) return res.json({ authenticated: true, email: data.email });
  }
  if (req.session?.authenticated) {
    return res.json({ authenticated: true, email: req.session.email });
  }
  res.json({ authenticated: false });
}
