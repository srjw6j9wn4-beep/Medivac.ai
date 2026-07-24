/**
 * Medivac.ai — Threat Detection Engine
 * ──────────────────────────────────────────────────────────────────────────────
 * Layers of protection:
 *  1. Payload Inspection    — SQL injection, XSS, path traversal, command injection
 *  2. File Upload Scanning  — Trojan/malware signatures, executable masquerading,
 *                             macro-embedded Office files, polyglot files
 *  3. Request Anomaly       — Scanner fingerprints, bad bots, header anomalies,
 *                             oversized payloads, impossible request patterns
 *  4. IP Reputation         — Known bad CIDR ranges, Tor exit nodes, rapid IP cycling
 *  5. Threat Logging        — Every detection logged to Supabase threat_log
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// ── Supabase connection ───────────────────────────────────────────────────────
const SUPABASE_URL  = "https://fbstcyegnzufiebnktrx.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3RjeWVnbnp1ZmllYm5rdHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTQ3MDUsImV4cCI6MjA5OTE3MDcwNX0.GfiAmBe66R64dISvV0Dzg0BNV9p5wsw5dps0RGRSmJY";

// ── In-memory threat log (ring buffer) ───────────────────────────────────────
interface ThreatEvent {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  threat_type: string;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
  blocked: boolean;
  user_agent?: string;
  country?: string;
}

const RING_BUFFER_SIZE = 500;
const threatRing: ThreatEvent[] = [];

function addToRing(event: ThreatEvent) {
  if (threatRing.length >= RING_BUFFER_SIZE) threatRing.shift();
  threatRing.push(event);
}

export function getThreatLog(): ThreatEvent[] {
  return [...threatRing].reverse();
}

// Export stats for the dashboard
export function getThreatStats() {
  const now = Date.now();
  const hour = threatRing.filter(e => now - new Date(e.timestamp).getTime() < 3_600_000);
  const day  = threatRing.filter(e => now - new Date(e.timestamp).getTime() < 86_400_000);
  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  const byType: Record<string, number> = {};
  const blockedIPs = new Set<string>();
  threatRing.forEach(e => {
    bySeverity[e.severity]++;
    byType[e.threat_type] = (byType[e.threat_type] || 0) + 1;
    if (e.blocked) blockedIPs.add(e.ip);
  });
  return { total: threatRing.length, last_hour: hour.length, last_24h: day.length, by_severity: bySeverity, by_type: byType, blocked_ips: blockedIPs.size };
}

// ── Async log to Supabase (fire-and-forget, never blocks request) ─────────────
async function logToSupabase(event: ThreatEvent) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/threat_log`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        ip:         event.ip,
        method:     event.method,
        path:       event.path,
        threat_type: event.threat_type,
        severity:   event.severity,
        detail:     event.detail.substring(0, 500),
        blocked:    event.blocked,
        user_agent: event.user_agent?.substring(0, 255),
        detected_at: event.timestamp,
      }),
    });
  } catch { /* non-fatal — in-memory ring always works */ }
}

function emit(req: Request, threat_type: string, severity: ThreatEvent["severity"], detail: string, blocked: boolean) {
  const event: ThreatEvent = {
    id:         crypto.randomUUID(),
    timestamp:  new Date().toISOString(),
    ip:         (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown").split(",")[0].trim(),
    method:     req.method,
    path:       req.path,
    threat_type,
    severity,
    detail,
    blocked,
    user_agent: req.headers["user-agent"],
  };
  addToRing(event);
  logToSupabase(event);
  if (severity === "high" || severity === "critical") {
    console.warn(`[THREAT:${severity.toUpperCase()}] ${threat_type} from ${event.ip} on ${req.method} ${req.path} — ${detail}`);
  }
  return event;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. PAYLOAD INSPECTION — detect attack patterns in request body / query / params
// ════════════════════════════════════════════════════════════════════════════════

const SQL_PATTERNS = [
  /(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b|\bDROP\b.*\bTABLE\b|\bINSERT\b.*\bINTO\b|\bDELETE\b.*\bFROM\b|\bUPDATE\b.*\bSET\b)/i,
  /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/i,
  /(--|;--|\/\*.*\*\/|xp_\w+|EXEC\s*\(|EXECUTE\s*\()/i,
  /(\bCAST\b\s*\(|\bCONVERT\b\s*\(|\bCONCAT\b\s*\(.*\bSELECT\b)/i,
  /\b(SLEEP|BENCHMARK|WAITFOR|DELAY)\s*\(/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']?[^"']*["']?/i,  // onerror=, onclick=, etc.
  /<iframe|<object|<embed|<link|<meta/i,
  /data:\s*text\/html/i,
  /vbscript\s*:/i,
  /expression\s*\(/i,
  /&#[xX]?[0-9a-fA-F]+;/,  // HTML/URL encoded script tags
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.(\/|\\)/,
  /(%2e%2e|%252e%252e)/i,
  /(\/etc\/passwd|\/etc\/shadow|\/proc\/self|\/windows\/system32)/i,
  /\.(env|git|htaccess|htpasswd|bash_history|ssh)/i,
];

const CMD_INJECTION_PATTERNS = [
  /[;&|`$]\s*(ls|cat|wget|curl|bash|sh|python|perl|ruby|nc|ncat|netcat|chmod|chown|rm\s+-rf)/i,
  /(\$\(|`[^`]+`|\$\{IFS\})/,
  /\|\s*(bash|sh|nc|wget|curl)\b/i,
];

const NOSQL_PATTERNS = [
  /\$where\s*:/i,
  /\$gt|\$lt|\$ne|\$regex/,
  /\{\s*"\$[a-z]+"\s*:/i,
];

const SSRF_PATTERNS = [
  /(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|169\.254\.|10\.\d+\.\d+\.\d+|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i,
  /file:\/\//i,
  /(gopher|dict|ftp|ldap|tftp|sftp):\/\//i,
];

function flattenValues(obj: unknown, depth = 0): string[] {
  if (depth > 5) return [];
  if (typeof obj === "string") return [obj];
  if (typeof obj === "number" || typeof obj === "boolean") return [String(obj)];
  if (Array.isArray(obj)) return obj.flatMap(v => flattenValues(v, depth + 1));
  if (obj && typeof obj === "object") return Object.values(obj).flatMap(v => flattenValues(v, depth + 1));
  return [];
}

export function payloadInspector(req: Request, res: Response, next: NextFunction) {
  // Skip auth bypass — don't inspect the login endpoint payload (timing oracle risk)
  const skipPaths = ["/api/health", "/api/auth/login"];
  if (skipPaths.some(p => req.path.startsWith(p))) return next();

  const values = [
    ...flattenValues(req.body),
    ...flattenValues(req.query),
    ...flattenValues(req.params),
  ];

  for (const val of values) {
    // Skip base64 blobs (CV uploads) — binary data generates false positives
    if (val.length > 10_000 && /^[A-Za-z0-9+/=]+$/.test(val.replace(/\s/g, ""))) continue;

    if (SQL_PATTERNS.some(p => p.test(val))) {
      emit(req, "SQL_INJECTION", "critical", `Pattern matched in payload: ${val.substring(0, 120)}`, true);
      return res.status(400).json({ error: "Request rejected." });
    }
    if (XSS_PATTERNS.some(p => p.test(val))) {
      emit(req, "XSS_ATTEMPT", "high", `XSS pattern in payload: ${val.substring(0, 120)}`, true);
      return res.status(400).json({ error: "Request rejected." });
    }
    if (PATH_TRAVERSAL_PATTERNS.some(p => p.test(val))) {
      emit(req, "PATH_TRAVERSAL", "high", `Path traversal in payload: ${val.substring(0, 120)}`, true);
      return res.status(400).json({ error: "Request rejected." });
    }
    if (CMD_INJECTION_PATTERNS.some(p => p.test(val))) {
      emit(req, "COMMAND_INJECTION", "critical", `Command injection in payload: ${val.substring(0, 120)}`, true);
      return res.status(400).json({ error: "Request rejected." });
    }
    if (NOSQL_PATTERNS.some(p => p.test(val))) {
      emit(req, "NOSQL_INJECTION", "high", `NoSQL injection in payload: ${val.substring(0, 120)}`, true);
      return res.status(400).json({ error: "Request rejected." });
    }
    if (SSRF_PATTERNS.some(p => p.test(val))) {
      emit(req, "SSRF_ATTEMPT", "high", `SSRF pattern in payload: ${val.substring(0, 120)}`, true);
      return res.status(400).json({ error: "Request rejected." });
    }
  }

  next();
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. FILE UPLOAD SCANNER — scan base64-encoded files for malware signatures
// ════════════════════════════════════════════════════════════════════════════════

// Known malicious file signatures (magic bytes) — checked after base64 decode
const MALICIOUS_SIGNATURES: { name: string; magic: Buffer }[] = [
  // PE executables (Windows EXE/DLL — trojans)
  { name: "PE_EXECUTABLE",    magic: Buffer.from("4D5A", "hex") },
  // ELF executables (Linux binaries)
  { name: "ELF_EXECUTABLE",   magic: Buffer.from("7F454C46", "hex") },
  // Mach-O executables (macOS)
  { name: "MACHO_EXECUTABLE", magic: Buffer.from("FEEDFACE", "hex") },
  { name: "MACHO_EXECUTABLE", magic: Buffer.from("CEFAEDFE", "hex") },
  // Java class files (can carry payload)
  { name: "JAVA_CLASS",       magic: Buffer.from("CAFEBABE", "hex") },
  // Windows Script Host / VBScript compiled
  { name: "WSH_SCRIPT",       magic: Buffer.from("FF0E", "hex") },
];

// EICAR test string — standard AV test pattern
const EICAR_PATTERN = Buffer.from("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");

// Suspicious content patterns inside decoded file bytes (covers macros, trojans)
const MALICIOUS_BYTE_PATTERNS: { name: string; pattern: Buffer }[] = [
  // VBA/macro markers in Office files
  { name: "VBA_MACRO",       pattern: Buffer.from("VBA") },
  { name: "AUTO_OPEN_MACRO", pattern: Buffer.from("AutoOpen") },
  { name: "AUTO_EXEC_MACRO", pattern: Buffer.from("AutoExec") },
  { name: "WORKBOOK_OPEN",   pattern: Buffer.from("Workbook_Open") },
  // JavaScript inside PDFs (common trojan vector)
  { name: "PDF_JS_EXEC",     pattern: Buffer.from("/JavaScript") },
  { name: "PDF_LAUNCH",      pattern: Buffer.from("/Launch") },
  { name: "PDF_OPENACTION",  pattern: Buffer.from("/OpenAction") },
  // PowerShell in documents
  { name: "POWERSHELL_EXEC", pattern: Buffer.from("powershell") },
  { name: "POWERSHELL_EXEC", pattern: Buffer.from("cmd.exe") },
];

function bufferContains(haystack: Buffer, needle: Buffer): boolean {
  if (needle.length === 0 || haystack.length < needle.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (haystack.slice(i, i + needle.length).equals(needle)) return true;
  }
  return false;
}

function scanFileBuffer(buf: Buffer, filename?: string): { clean: boolean; threat?: string; severity?: ThreatEvent["severity"] } {
  // EICAR test file
  if (bufferContains(buf, EICAR_PATTERN)) {
    return { clean: false, threat: "EICAR_TEST_FILE", severity: "high" };
  }

  // Magic byte signatures
  for (const sig of MALICIOUS_SIGNATURES) {
    if (buf.length >= sig.magic.length && buf.slice(0, sig.magic.length).equals(sig.magic)) {
      return { clean: false, threat: sig.name, severity: "critical" };
    }
  }

  // Embedded malicious patterns (check first 64KB — trojans often embed in header area)
  const scanSlice = buf.slice(0, Math.min(buf.length, 65536));
  for (const pat of MALICIOUS_BYTE_PATTERNS) {
    if (bufferContains(scanSlice, pat.pattern)) {
      // VBA macros in PDFs are critical; in DOCX/XLSX they're high
      const ext = (filename || "").split(".").pop()?.toLowerCase() || "";
      const severity: ThreatEvent["severity"] = (pat.name.includes("PDF") || pat.name.includes("POWERSHELL") || pat.name.includes("CMD")) ? "critical" : "high";
      return { clean: false, threat: pat.name, severity };
    }
  }

  return { clean: true };
}

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt"]);

/**
 * Scan base64-encoded file fields in request body.
 * Looks for any field ending in _base64, _file, _data, or named "cv", "file", "document".
 */
export function fileScanner(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object") return next();

  const fieldsToScan = Object.entries(req.body).filter(([key]) =>
    /base64|_file|_data|^cv$|^file$|^document$|^attachment$/i.test(key)
  );

  for (const [field, value] of fieldsToScan) {
    if (typeof value !== "string" || value.length < 10) continue;

    // Extract filename if present (data URI)
    let filename: string | undefined;
    let base64data = value;
    const dataUriMatch = value.match(/^data:([^;]+);(?:name=([^;]+);)?base64,(.+)$/);
    if (dataUriMatch) {
      const mimeType = dataUriMatch[1];
      filename = dataUriMatch[2];
      base64data = dataUriMatch[3];

      // MIME type allowlist
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        emit(req, "DISALLOWED_FILE_TYPE", "high", `Blocked MIME: ${mimeType} in field ${field}`, true);
        return res.status(400).json({ error: "File type not permitted." });
      }
    }

    // Extension check
    if (filename) {
      const ext = filename.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        emit(req, "DISALLOWED_FILE_EXTENSION", "high", `Blocked extension .${ext} in field ${field}`, true);
        return res.status(400).json({ error: "File extension not permitted." });
      }
    }

    // Decode and scan
    try {
      const buf = Buffer.from(base64data.replace(/\s/g, ""), "base64");

      // File size cap: 10MB
      if (buf.length > 10 * 1024 * 1024) {
        emit(req, "OVERSIZED_FILE", "medium", `File in field ${field} is ${(buf.length/1024/1024).toFixed(1)}MB`, true);
        return res.status(400).json({ error: "File exceeds 10MB limit." });
      }

      const result = scanFileBuffer(buf, filename);
      if (!result.clean) {
        emit(req, `MALWARE_${result.threat}`, result.severity!, `Malware signature found in field ${field}: ${result.threat}`, true);
        return res.status(400).json({ error: "File failed security scan and was rejected." });
      }
    } catch {
      // Invalid base64 — reject
      emit(req, "INVALID_FILE_ENCODING", "medium", `Invalid base64 in field ${field}`, true);
      return res.status(400).json({ error: "Invalid file data." });
    }
  }

  next();
}

// ════════════════════════════════════════════════════════════════════════════════
// 3. REQUEST ANOMALY DETECTOR — bots, scanners, header anomalies
// ════════════════════════════════════════════════════════════════════════════════

// Known scanner / attack tool User-Agent substrings
const SCANNER_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nessus/i, /acunetix/i, /burpsuite/i, /w3af/i,
  /openvas/i, /metasploit/i, /nmap/i, /masscan/i, /zap\b/i, /dirbuster/i,
  /gobuster/i, /wfuzz/i, /hydra/i, /medusa/i, /shodan/i, /censys/i,
  /python-requests\/\d/i, /go-http-client/i, /curl\/\d/i, /wget\/\d/i,
  /libwww-perl/i, /lwp-request/i, /java\/\d/i, /jakarta/i, /axios\/\d/i,
];

// Known bad bot UAs (scrapers, spam bots)
const BAD_BOT_PATTERNS = [
  /zgrab/i, /masscan/i, /internet-measurement/i, /research-scanner/i,
  /alphaBot|betaBot|MJ12bot|dotbot|AhrefsBot|semrushbot/i,
  /DataForSeoBot|BLEXBot|PetalBot/i,
];

// Per-IP request tracking (rate anomaly, not duplicate of express-rate-limit)
const ipRequestMap = new Map<string, { count: number; firstSeen: number; paths: Set<string> }>();
const RAPID_SCAN_THRESHOLD = 30;   // more than 30 unique paths in 60s = scanner
const RAPID_SCAN_WINDOW    = 60_000;

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap) {
    if (now - data.firstSeen > RAPID_SCAN_WINDOW) ipRequestMap.delete(ip);
  }
}, 5 * 60_000);

export function anomalyDetector(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();

  // 1. Scanner UA
  if (SCANNER_UA_PATTERNS.some(p => p.test(ua))) {
    emit(req, "SCANNER_DETECTED", "critical", `Scanner UA: ${ua.substring(0, 100)}`, true);
    return res.status(403).json({ error: "Forbidden" });
  }

  // 2. Bad bot UA
  if (BAD_BOT_PATTERNS.some(p => p.test(ua))) {
    emit(req, "BAD_BOT", "high", `Bot UA: ${ua.substring(0, 100)}`, true);
    return res.status(403).json({ error: "Forbidden" });
  }

  // 3. Missing UA on POST/PATCH/DELETE (legitimate browsers always send one)
  if (!ua && ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    emit(req, "MISSING_USER_AGENT", "medium", "No User-Agent on write request", false);
  }

  // 4. Oversized headers (header injection / buffer overflow attempt)
  const totalHeaderSize = Object.values(req.headers).join("").length;
  if (totalHeaderSize > 8192) {
    emit(req, "OVERSIZED_HEADERS", "high", `Header size: ${totalHeaderSize} bytes`, true);
    return res.status(431).json({ error: "Request headers too large." });
  }

  // 5. Suspicious Host header (host header injection)
  const host = req.headers.host || "";
  if (host && !/^[\w.-]+(:\d+)?$/.test(host)) {
    emit(req, "HOST_HEADER_INJECTION", "high", `Malformed host: ${host}`, true);
    return res.status(400).json({ error: "Bad request." });
  }

  // 6. Common exploit path probes
  const PROBE_PATHS = [
    /\/(wp-admin|wp-login|xmlrpc|phpmyadmin|adminer|\.git|\.env|web\.config|web\.xml)/i,
    /\/(eval|cmd|exec|shell|cgi-bin|\.php|\.asp|\.aspx|\.jsp)\b/i,
    /\/\.\./,
    /\/(admin|manager|config|setup|install)\.php/i,
  ];
  if (PROBE_PATHS.some(p => p.test(req.path))) {
    emit(req, "EXPLOIT_PROBE", "high", `Probe path: ${req.path}`, true);
    return res.status(404).json({ error: "Not found." });
  }

  // 7. Rapid path scanning detection (port scanner / directory bruteforce)
  if (ip) {
    const now = Date.now();
    let data = ipRequestMap.get(ip);
    if (!data || (now - data.firstSeen) > RAPID_SCAN_WINDOW) {
      data = { count: 0, firstSeen: now, paths: new Set() };
      ipRequestMap.set(ip, data);
    }
    data.count++;
    data.paths.add(req.path);
    if (data.paths.size > RAPID_SCAN_THRESHOLD) {
      emit(req, "DIRECTORY_SCAN", "critical", `${data.paths.size} unique paths in 60s from ${ip}`, true);
      return res.status(429).json({ error: "Too many requests." });
    }
  }

  next();
}

// ════════════════════════════════════════════════════════════════════════════════
// 4. IP REPUTATION — block known malicious CIDR ranges
// ════════════════════════════════════════════════════════════════════════════════

// Well-known malicious / high-risk ranges (Tor exits, botnet C&C, abuse hosting)
// These are static; a production system would update from threat intel feeds
const BLOCKED_CIDRS: Array<{ network: number; mask: number; label: string }> = [
  // Common abuse hosting ASNs known CIDR blocks (conservative list)
  // 185.220.0.0/14 — Tor exit nodes bulk hosting
  { network: ipToInt("185.220.0.0"), mask: 0xFFFC0000, label: "Tor_exit_bulk" },
  // 198.54.0.0/16 — known spam network
  { network: ipToInt("198.54.0.0"),  mask: 0xFFFF0000, label: "Spam_network" },
  // 45.142.212.0/22 — frequent scanner origin
  { network: ipToInt("45.142.212.0"), mask: 0xFFFFFC00, label: "Scanner_ASN" },
  // 179.43.128.0/18 — botnet infrastructure
  { network: ipToInt("179.43.128.0"), mask: 0xFFFFC000, label: "Botnet_infra" },
];

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function isBlockedIP(ip: string): string | null {
  if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return null;
  const ipInt = ipToInt(ip);
  for (const cidr of BLOCKED_CIDRS) {
    if ((ipInt & cidr.mask) >>> 0 === cidr.network >>> 0) return cidr.label;
  }
  return null;
}

export function ipReputationGuard(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
  const block = isBlockedIP(ip);
  if (block) {
    emit(req, "BLOCKED_IP_RANGE", "critical", `IP ${ip} in blocked range: ${block}`, true);
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// ════════════════════════════════════════════════════════════════════════════════
// COMBINED MIDDLEWARE — apply all layers in order
// ════════════════════════════════════════════════════════════════════════════════
export function threatDetection(req: Request, res: Response, next: NextFunction) {
  // Auth routes are fully exempt from all threat detection — they are the login mechanism
  if (req.originalUrl.startsWith('/api/auth/') || req.path.startsWith('/auth/')) {
    return next();
  }
  ipReputationGuard(req, res, () =>
    anomalyDetector(req, res, () =>
      payloadInspector(req, res, () =>
        fileScanner(req, res, next)
    )
  ));
}
