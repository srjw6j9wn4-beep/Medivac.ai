/**
 * NOTAM fetcher + classifier for Medivac.ai
 * Source: ICAO SWIM / public NOTAM feed via a fallback chain:
 *   1. ICAO Realtime NOTAM API (api_key = free public demo key)
 *   2. Autorouter.aero public API (no key, covers ICAO globally)
 *   3. Cached data from DB (max 2 h stale)
 *   4. Empty array (graceful degradation — never breaks the UI)
 *
 * Severity classification focuses on:
 *   - Runway / lighting outages           → CRITICAL
 *   - Temporary restricted airspace       → CRITICAL
 *   - Grass / unimproved runway condition → CRITICAL
 *   - Fuel unavailable                    → HIGH
 *   - Navigation aid unserviceable        → HIGH
 *   - Works in progress on manoeuvring area → MEDIUM
 *   - Bird/wildlife activity              → MEDIUM
 *   - General advisory                    → LOW
 */

import { storage } from './storage';

export interface ParsedNotam {
  id: string;
  icao: string;
  raw: string;
  subject: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  startDate: string;
  endDate: string;
  permanent: boolean;
  isNew: boolean;          // fetched within last 30 min
  flagged: boolean;        // matched a critical keyword pattern
  plain: string;           // human-readable decoded summary
}

// VAPID keys — generated once, baked in
export const VAPID_PUBLIC_KEY  = 'BDqGV-g06QPVPAcs50CEBwCdyxmSs88dD_7NMB1FPtr26yjZCPy6lSDl9grzgUbt0ddNvP32p5Ha0EWH1YraarI';
export const VAPID_PRIVATE_KEY = 'PVf4D6CDfI-1oJ_R5Ifh4B2TvDMsiJ6HARfkDe8cdA4';
export const VAPID_EMAIL       = 'mailto:ops@medivac.ai';

// Cache TTL: 20 minutes for live fetch, accept up to 2 h stale
const CACHE_TTL_MS   = 20 * 60 * 1000;
const STALE_LIMIT_MS = 2  * 60 * 60 * 1000;

// ─── Severity classifier ─────────────────────────────────────────────────────

const CRITICAL_PATTERNS = [
  /RWY\s*\w+\s*(CLSD|CLOSED)/i,
  /RUNWAY\s+(CLOSED|CLSD|UNSERVICEABLE|U\/S)/i,
  /APCH\s+LGT\s*(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /TWY\s*\w+\s*(CLSD|CLOSED)/i,
  /AERODROME\s+(CLOSED|CLSD)/i,
  /AD\s+(CLOSED|CLSD)/i,
  /RESTRICTED\s+AREA\s+ACTIVATED/i,
  /\bTRA\b.*ACTIVE/i,
  /TEMPO\s+RESTRICTED/i,
  /DANGER\s+AREA\s+ACTIVE/i,
  /GRASS\s+RWY.*(WET|SOFT|BOGGY|UNSERVICEABLE|RESTRICT)/i,
  /STRIP\s+(WET|SOFT|BOGGY|UNSERVICEABLE|CLOSED)/i,
  /UNSEALED.*(WET|SOFT|BOGGY)/i,
  /LGT\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /PAPI\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /VASIS?\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /ALS\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /LIGHTING\s+(UNSERVICEABLE|INOP|OTS|FAILED)/i,
  /ILS\s+(U\/S|UNSERVICEABLE|INOP)/i,
];

const HIGH_PATTERNS = [
  /FUEL\s+(UNAVAILABLE|NOT AVAILABLE|NIL|UNSERVICEABLE)/i,
  /AVGAS?\s+(UNAVAILABLE|NOT AVAILABLE|NIL)/i,
  /JET\s*A1?\s+(UNAVAILABLE|NOT AVAILABLE|NIL)/i,
  /NDB\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /VOR\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /DME\s+(U\/S|UNSERVICEABLE|INOP|OTS)/i,
  /WINDSOCK\s+(U\/S|ABSENT|MISSING)/i,
  /CTAF\s+(CHANGED|FREQ\s+CHANGE)/i,
  /APRON\s+(CLSD|CLOSED|RESTRICTED|UNSERVICEABLE)/i,
  /TAXIWAY\s+(UNSERVICEABLE|FAILED)/i,
];

const MEDIUM_PATTERNS = [
  /WIP\s+(ON|IN)/i,
  /WORKS\s+IN\s+PROGRESS/i,
  /BIRD\s+(HAZARD|ACTIVITY|STRIKE)/i,
  /WILDLIFE/i,
  /CRANE\s+(ERECTED|OPERATING)/i,
  /OBST\s+(ERECTED|PLACED)/i,
  /OBSTACLE\s+(ERECTED|PLACED)/i,
  /TWY\s+\w+\s+(RESTRICTED|REDUCED)/i,
];

function classifySeverity(text: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (CRITICAL_PATTERNS.some(p => p.test(text))) return 'CRITICAL';
  if (HIGH_PATTERNS.some(p => p.test(text)))    return 'HIGH';
  if (MEDIUM_PATTERNS.some(p => p.test(text)))  return 'MEDIUM';
  return 'LOW';
}

function plainEnglish(raw: string): string {
  // Strip ICAO NOTAM header junk and return cleaned body
  return raw
    .replace(/^[A-Z]\d+\/\d+\s+NOTAM[NRC]?\s*/i, '')
    .replace(/\bQ\).+?(?=\w\))/s, '')
    .replace(/[A-Z]\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

function parseIcaoNotam(raw: string, icao: string, fetchedAt: string): ParsedNotam {
  const idMatch  = raw.match(/^([A-Z]\d+\/\d+)/);
  const startMatch = raw.match(/B\)\s*(\d{10})/);
  const endMatch   = raw.match(/C\)\s*(\d{10}|PERM)/);

  const id       = idMatch?.[1] ?? `NOTAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const startStr = startMatch?.[1] ?? '';
  const endStr   = endMatch?.[1] ?? '';
  const permanent = endStr === 'PERM';

  const startDate = startStr.length === 10
    ? `20${startStr.slice(0,2)}-${startStr.slice(2,4)}-${startStr.slice(4,6)}T${startStr.slice(6,8)}:${startStr.slice(8,10)}Z`
    : new Date().toISOString();

  const endDate = permanent ? 'PERM' :
    endStr.length === 10
      ? `20${endStr.slice(0,2)}-${endStr.slice(2,4)}-${endStr.slice(4,6)}T${endStr.slice(6,8)}:${endStr.slice(8,10)}Z`
      : '';

  const severity = classifySeverity(raw);
  const ageMs = Date.now() - new Date(fetchedAt).getTime();

  return {
    id, icao, raw, severity,
    startDate, endDate, permanent,
    subject: plainEnglish(raw).slice(0, 80),
    plain: plainEnglish(raw),
    isNew: ageMs < 30 * 60 * 1000,
    flagged: severity === 'CRITICAL' || severity === 'HIGH',
  };
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchFromIcao(icao: string): Promise<string[] | null> {
  try {
    const url = `https://applications.icao.int/dataservices/api/v1/notams?api_key=web_b6571b2a5abd31b8b24d1bd74bbf3c13&format=json&ICAOCode=${icao}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map((n: any) => n.notamTranslation ?? n.notamText ?? JSON.stringify(n));
  } catch {
    return null;
  }
}

async function fetchFromAutorouter(icao: string): Promise<string[] | null> {
  try {
    const url = `https://api.autorouter.aero/v1.0/notam?itemas=${encodeURIComponent(JSON.stringify([icao]))}&offset=0&limit=20`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!Array.isArray(data?.notams)) return null;
    return data.notams.map((n: any) => n.notam ?? n.text ?? JSON.stringify(n));
  } catch {
    return null;
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function getNotamsForAirport(icao: string): Promise<{
  notams: ParsedNotam[];
  source: 'live' | 'cached' | 'empty';
  fetchedAt: string;
  cacheAgeMin: number;
}> {
  const upper = icao.toUpperCase();
  const now   = new Date().toISOString();

  // Check cache freshness
  const cached = storage.getCachedNotams(upper);
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetchedAt).getTime();
    if (ageMs < CACHE_TTL_MS) {
      // Cache is fresh — return immediately
      return {
        notams: cached.notams.map((r: string) => parseIcaoNotam(r, upper, cached.fetchedAt)),
        source: 'cached',
        fetchedAt: cached.fetchedAt,
        cacheAgeMin: Math.floor(ageMs / 60000),
      };
    }
  }

  // Try live fetch — ICAO first, autorouter fallback
  let rawNotams = await fetchFromIcao(upper);
  if (!rawNotams) rawNotams = await fetchFromAutorouter(upper);

  if (rawNotams && rawNotams.length >= 0) {
    storage.saveNotamCache(upper, rawNotams);
    return {
      notams: rawNotams.map(r => parseIcaoNotam(r, upper, now)),
      source: 'live',
      fetchedAt: now,
      cacheAgeMin: 0,
    };
  }

  // Fallback to stale cache if within stale limit
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetchedAt).getTime();
    if (ageMs < STALE_LIMIT_MS) {
      return {
        notams: cached.notams.map((r: string) => parseIcaoNotam(r, upper, cached.fetchedAt)),
        source: 'cached',
        fetchedAt: cached.fetchedAt,
        cacheAgeMin: Math.floor(ageMs / 60000),
      };
    }
  }

  // Graceful degradation — return empty
  return { notams: [], source: 'empty', fetchedAt: now, cacheAgeMin: 0 };
}

export async function getNotamsForAirports(icaos: string[]): Promise<ParsedNotam[]> {
  const results = await Promise.all(icaos.map(icao => getNotamsForAirport(icao)));
  return results.flatMap(r => r.notams);
}
