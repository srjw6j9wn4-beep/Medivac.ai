// ERSA — En Route Supplement Australia
// Aerodromes relevant to RFDS South East Section operations
// NSW · QLD · SA · VIC · ACT
// Types: AD = Certified Aerodrome, ALA = Air Landing Area, HLS = Helipad/Landing Site

export interface ERSAAerodrome {
  icao: string;
  name: string;
  state: string;
  type: "AD" | "ALA" | "HLS";
  /** Special operational notes shown as warnings in the booking form */
  warning?: string;
}

export const ERSA_AERODROMES: ERSAAerodrome[] = [
  // ── NSW ─────────────────────────────────────────────────────────────────────
  { icao: "YSBK", name: "Bankstown", state: "NSW", type: "AD" },
  { icao: "YSDU", name: "Dubbo", state: "NSW", type: "AD" },
  { icao: "YBHI", name: "Broken Hill", state: "NSW", type: "AD" },
  { icao: "YSSY", name: "Sydney (Kingsford Smith)", state: "NSW", type: "AD" },
  { icao: "YMAY", name: "Albury", state: "NSW", type: "AD" },
  { icao: "YARM", name: "Armidale", state: "NSW", type: "AD" },
  { icao: "YBNA", name: "Ballina Byron Gateway", state: "NSW", type: "AD" },
  { icao: "YBRN", name: "Balranald", state: "NSW", type: "AD" },
  { icao: "YBTH", name: "Bathurst", state: "NSW", type: "AD" },
  { icao: "YBKE", name: "Bourke", state: "NSW", type: "AD" },
  { icao: "YBRW", name: "Brewarrina", state: "NSW", type: "AD" },
  { icao: "YCBA", name: "Cobar", state: "NSW", type: "AD" },
  { icao: "YCFS", name: "Coffs Harbour", state: "NSW", type: "AD" },
  { icao: "YCBR", name: "Collarenebri", state: "NSW", type: "AD" },
  { icao: "YCDO", name: "Condobolin", state: "NSW", type: "AD" },
  { icao: "YCAH", name: "Coolah", state: "NSW", type: "ALA" },
  { icao: "YCOM", name: "Cooma–Snowy Mountains", state: "NSW", type: "AD" },
  { icao: "YCBB", name: "Coonabarabran", state: "NSW", type: "AD" },
  { icao: "YCNM", name: "Coonamble", state: "NSW", type: "AD" },
  { icao: "YCTM", name: "Cootamundra", state: "NSW", type: "AD" },
  { icao: "YCWR", name: "Cowra", state: "NSW", type: "AD" },
  { icao: "YDLQ", name: "Deniliquin", state: "NSW", type: "AD" },
  { icao: "YFBS", name: "Forbes", state: "NSW", type: "AD" },
  { icao: "YGTH", name: "Griffith", state: "NSW", type: "AD" },
  { icao: "YIVL", name: "Inverell", state: "NSW", type: "AD" },
  { icao: "YLRD", name: "Lightning Ridge", state: "NSW", type: "AD" },
  { icao: "YLIS", name: "Lismore", state: "NSW", type: "AD" },
  { icao: "YMOR", name: "Moree", state: "NSW", type: "AD" },
  { icao: "YMRU", name: "Meru / Mungindi", state: "NSW", type: "ALA" },
  { icao: "YNBR", name: "Narrabri", state: "NSW", type: "AD" },
  { icao: "YNAR", name: "Narrandera", state: "NSW", type: "AD" },
  { icao: "YNRM", name: "Narromine", state: "NSW", type: "AD" },
  { icao: "YWLM", name: "Newcastle (Williamtown)", state: "NSW", type: "AD" },
  { icao: "YNYN", name: "Nyngan", state: "NSW", type: "AD" },
  { icao: "YORG", name: "Orange", state: "NSW", type: "AD" },
  { icao: "YPKS", name: "Parkes", state: "NSW", type: "AD" },
  { icao: "YPMQ", name: "Port Macquarie", state: "NSW", type: "AD" },
  { icao: "YSCO", name: "Scone", state: "NSW", type: "AD" },
  { icao: "YSTW", name: "Tamworth", state: "NSW", type: "AD" },
  { icao: "YTRE", name: "Taree", state: "NSW", type: "AD" },
  { icao: "YTIB", name: "Tibooburra", state: "NSW", type: "AD" },
  { icao: "YWBR", name: "Walgett", state: "NSW", type: "AD" },
  { icao: "YWAG", name: "Wanaaring", state: "NSW", type: "ALA",
    warning: "⚠️ APRON RESTRICTION — Only ONE aircraft may be scheduled at Wanaaring at a time due to limited apron space. Please confirm no other aircraft is booked before proceeding." },
  { icao: "YWTO", name: "Wentworth", state: "NSW", type: "AD" },
  { icao: "YWOL", name: "Shellharbour (Wollongong)", state: "NSW", type: "AD" },
  { icao: "YWYB", name: "Wyalong", state: "NSW", type: "ALA" },
  { icao: "YYWG", name: "Wagga Wagga", state: "NSW", type: "AD" },
  { icao: "YCNK", name: "Cessnock", state: "NSW", type: "AD" },
  { icao: "YWGT", name: "Wangaratta", state: "NSW", type: "AD" },
  { icao: "YLKC", name: "Lake Cargelligo", state: "NSW", type: "ALA" },
  { icao: "YMND", name: "Mildura", state: "NSW", type: "AD" },
  { icao: "YMEN", name: "Menindee", state: "NSW", type: "ALA" },
  { icao: "YMUT", name: "Muttama", state: "NSW", type: "ALA" },
  { icao: "YWHG", name: "White Cliffs", state: "NSW", type: "ALA" },
  { icao: "YWTL", name: "Wilcannia", state: "NSW", type: "AD" },

  // ── QLD (RFDS SE boundary routes) ───────────────────────────────────────────
  { icao: "YBCG", name: "Gold Coast", state: "QLD", type: "AD" },
  { icao: "YBBN", name: "Brisbane", state: "QLD", type: "AD" },
  { icao: "YBSU", name: "Sunshine Coast", state: "QLD", type: "AD" },
  { icao: "YLHR", name: "Longreach", state: "QLD", type: "AD" },
  { icao: "YBCV", name: "Charleville", state: "QLD", type: "AD" },
  { icao: "YBTL", name: "Townsville", state: "QLD", type: "AD" },
  { icao: "YCNF", name: "Cunnamulla", state: "QLD", type: "AD" },
  { icao: "YSGE", name: "St George", state: "QLD", type: "AD" },
  { icao: "YBWN", name: "Bourke (Bourke)", state: "QLD", type: "ALA" },
  { icao: "YBRK", name: "Rockhampton", state: "QLD", type: "AD" },
  { icao: "YBMA", name: "Mount Isa", state: "QLD", type: "AD" },

  // ── SA ───────────────────────────────────────────────────────────────────────
  { icao: "YPAD", name: "Adelaide", state: "SA", type: "AD" },
  { icao: "YPAG", name: "Port Augusta", state: "SA", type: "AD" },
  { icao: "YPPH", name: "Perth", state: "WA", type: "AD" },
  { icao: "YMTG", name: "Mount Gambier", state: "SA", type: "AD" },
  { icao: "YRMD", name: "Renmark", state: "SA", type: "AD" },
  { icao: "YPED", name: "Edinburgh (RAAF)", state: "SA", type: "AD" },
  { icao: "YCBP", name: "Coober Pedy", state: "SA", type: "AD" },
  { icao: "YOOD", name: "Oodnadatta", state: "SA", type: "AD" },
  { icao: "YBRR", name: "Bordertown", state: "SA", type: "ALA" },
  { icao: "YMBT", name: "Moomba", state: "SA", type: "AD" },

  // ── VIC ──────────────────────────────────────────────────────────────────────
  { icao: "YMML", name: "Melbourne (Tullamarine)", state: "VIC", type: "AD" },
  { icao: "YMEN", name: "Melbourne (Essendon)", state: "VIC", type: "AD" },
  { icao: "YMAV", name: "Avalon", state: "VIC", type: "AD" },
  { icao: "YSWG", name: "Swan Hill", state: "VIC", type: "AD" },
  { icao: "YECH", name: "Echuca", state: "VIC", type: "AD" },
  { icao: "YHMB", name: "Horsham", state: "VIC", type: "AD" },
  { icao: "YBNS", name: "Bairnsdale", state: "VIC", type: "AD" },
  { icao: "YMOR", name: "Mildura", state: "VIC", type: "AD" },

  // ── ACT ──────────────────────────────────────────────────────────────────────
  { icao: "YSCB", name: "Canberra", state: "ACT", type: "AD" },

  // ── Lord Howe Island (Special Mission) ──────────────────────────────────────
  { icao: "YLHI", name: "Lord Howe Island", state: "NSW", type: "AD",
    warning: "⚠️ OVER-WATER OPERATION — Lord Howe Island requires life raft, 2× EPIRBs, immersion suits, and SARTIME lodgement. Ensure all special equipment is confirmed before dispatch." },
];

// RFDS South East Section primary departure bases (RAHS / Dental)
export const RAHS_DENTAL_BASES: ERSAAerodrome[] = ERSA_AERODROMES.filter(a =>
  ["YSBK", "YSDU", "YBHI"].includes(a.icao)
);

// Lookup by ICAO
export function getAerodrome(icao: string): ERSAAerodrome | undefined {
  return ERSA_AERODROMES.find(a => a.icao === icao);
}

// Format for display in dropdowns
export function formatAerodrome(a: ERSAAerodrome): string {
  return `${a.icao} — ${a.name} (${a.state})`;
}

// Grouped by state for optgroup rendering
export function groupByState(): Record<string, ERSAAerodrome[]> {
  return ERSA_AERODROMES.reduce((acc, a) => {
    if (!acc[a.state]) acc[a.state] = [];
    acc[a.state].push(a);
    return acc;
  }, {} as Record<string, ERSAAerodrome[]>);
}
