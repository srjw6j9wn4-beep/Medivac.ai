import { useState, useEffect } from "react";
import { type UserRole } from "@/lib/data";
import {
  Clock, AlertTriangle, CheckCircle, Plane, Wrench, Moon,
  ChevronRight, Info, RefreshCw, Shield, Users, Zap
} from "lucide-react";

interface Props { role: UserRole; }

// ── CASA CAO 48.1 / EBA 2025 rest rules ───────────────────────────────────────
// Min rest after an FDP:
//   FDP ≤ 10h  → 10h rest (multi-crew EBA 2025 Cl 18.5)
//   FDP > 10h  → 12h rest (EBA 2025 Cl 18.5)
//   Single pilot → 8h rest (CAO 48.1)
// Extended rest if significant disruption (e.g. duty > 14h): 12h mandatory

function minRestHours(fdpHours: number, multiCrew: boolean): number {
  if (!multiCrew) return 8;
  return fdpHours > 10 ? 12 : 10;
}

function restLabel(fdpHours: number, multiCrew: boolean): string {
  if (!multiCrew) return "8 hrs — CAO 48.1 single-pilot";
  if (fdpHours > 10) return "12 hrs — EBA Cl 18.5 (FDP >10h)";
  return "10 hrs — EBA Cl 18.5 (FDP ≤10h)";
}

// ── Curfew database ──────────────────────────────────────────────────────────
interface CurfewRule {
  label: string;
  start: number;    // 24h hour curfew begins
  end: number;      // 24h hour curfew ends (ops resume)
  statutory: boolean;
  medicExempt: boolean;
}
const CURFEWS: Record<string, CurfewRule> = {
  YSSY: { label: "Sydney Kingsford Smith",  start: 23, end: 6,  statutory: true,  medicExempt: true  },
  YPPH: { label: "Perth International",     start: 22, end: 6,  statutory: true,  medicExempt: true  },
  YMEN: { label: "Essendon Airport",        start: 21, end: 7,  statutory: true,  medicExempt: true  },
  YSCB: { label: "Canberra Airport",        start: 23, end: 6,  statutory: false, medicExempt: true  },
  YBCG: { label: "Gold Coast Airport",      start: 23, end: 6,  statutory: false, medicExempt: true  },
  YBBN: { label: "Brisbane Airport",        start: 23, end: 6,  statutory: false, medicExempt: true  },
};

function parseHHMM(hhmm: string): number { // returns total minutes from midnight
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function addMins(hhmm: string, mins: number): string {
  const total = ((parseHHMM(hhmm) + mins) % (24 * 60) + 24 * 60) % (24 * 60);
  const hh = Math.floor(total / 60), mm = total % 60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}
function diffMins(from: string, to: string): number {
  const d = parseHHMM(to) - parseHHMM(from);
  return d < 0 ? d + 24 * 60 : d;
}
function isInCurfew(hhmm: string, rule: CurfewRule): boolean {
  const m = parseHHMM(hhmm);
  const s = rule.start * 60, e = rule.end * 60;
  return s > e ? (m >= s || m < e) : (m >= s && m < e);
}

// ── Trigger types ─────────────────────────────────────────────────────────────
type TriggerType = "aog" | "fdp_exceeded" | "unplanned_overnight" | "weather_divert";

interface TriggerOption {
  value: TriggerType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}
const TRIGGERS: TriggerOption[] = [
  {
    value: "aog",
    label: "Aircraft AOG",
    icon: <Wrench size={16} />,
    description: "Aircraft unserviceable — crew grounded at off-base location",
    color: "text-red-400 bg-red-500/10 border-red-400/30",
  },
  {
    value: "fdp_exceeded",
    label: "FDP Limit Reached",
    icon: <Clock size={16} />,
    description: "Flight Duty Period at or near CASA/EBA maximum — crew must rest before next sector",
    color: "text-orange-400 bg-orange-500/10 border-orange-400/30",
  },
  {
    value: "unplanned_overnight",
    label: "Unplanned Overnight",
    icon: <Moon size={16} />,
    description: "Crew directed to overnight by Dispatcher — mission continuation next day",
    color: "text-blue-400 bg-blue-500/10 border-blue-400/30",
  },
  {
    value: "weather_divert",
    label: "Weather Diversion",
    icon: <Zap size={16} />,
    description: "Diverted to alternate — unable to return to base, overnight required",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-400/30",
  },
];

const CREW_LIST = [
  "Capt. R. Hughes", "Capt. T. Barnes", "Capt. M. Clarke",
  "Capt. S. Nguyen", "Capt. L. Grant",
  "S. Mitchell RN", "J. O'Brien RN", "C. Andrews RN",
  "P. Wallace RN", "B. Foster RN",
  "Dr. K. Patel", "Dr. A. Sharma",
];

const BASES = [
  "YSDU (Dubbo)", "YBHI (Broken Hill)", "YBTL (Townsville)",
  "YMEN (Essendon)", "YPAD (Adelaide)", "YSCB (Canberra)",
  "YPPH (Perth)", "YSSY (Sydney)", "YBBN (Brisbane)",
  "YBCG (Gold Coast)", "YCNK (Coonabarabran)", "YWLG (Walgett)",
  "YWCA (Wilcannia)", "YBKE (Bourke)", "YCBA (Cobar)",
];

function getICAO(loc: string) { return loc.split(" ")[0]; }

interface CrewMember {
  id: string;
  name: string;
  role: "pilot" | "nurse" | "doctor" | "paramedic";
  isFirstOfficer: boolean;
}

interface RestEvent {
  id: string;
  trigger: TriggerType;
  aircraft: string;
  currentLocation: string;
  arrivalTime: string;
  fdpHours: number;
  crew: CrewMember[];
  notes: string;
  isMedivac: boolean;
  createdAt: string; // HH:MM
  createdBy: string;
  acknowledged: boolean;
}

// ── Colour helpers ────────────────────────────────────────────────────────────
const TEAL = "#01696F";

function StatusBadge({ level }: { level: "clear" | "warn" | "block" | "exempt" }) {
  const map = {
    clear:  "bg-green-500/15 border-green-400/30 text-green-300",
    warn:   "bg-yellow-500/15 border-yellow-400/30 text-yellow-300",
    block:  "bg-red-500/15 border-red-400/30 text-red-300",
    exempt: "bg-amber-500/15 border-amber-400/30 text-amber-300",
  };
  const labels = { clear: "Departure Clear", warn: "Curfew — Exempt", block: "Curfew Blocked", exempt: "Medivac Exempt" };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${map[level]}`}>
      {labels[level]}
    </span>
  );
}

function RestCard({ event, onAck }: { event: RestEvent; onAck: (id: string) => void }) {
  const trigger = TRIGGERS.find(t => t.value === event.trigger)!;
  const icao = getICAO(event.currentLocation);
  const curfewRule = CURFEWS[icao];

  // Determine crew type
  const hasFO  = event.crew.some(c => c.isFirstOfficer);
  const multi  = hasFO || event.crew.some(c => c.role !== "pilot");
  const minRest = minRestHours(event.fdpHours, multi);
  const restMins = minRest * 60;
  const earliestDep = addMins(event.arrivalTime, restMins);

  const curfewActive = curfewRule ? isInCurfew(earliestDep, curfewRule) : false;
  const exemptApplies = curfewActive && event.isMedivac && curfewRule?.medicExempt;
  const blocked = curfewActive && !exemptApplies;

  let actualDep = earliestDep;
  let blockedNote: string | null = null;
  if (blocked && curfewRule) {
    const curfewEndStr = `${String(curfewRule.end).padStart(2,"0")}:00`;
    if (diffMins(earliestDep, curfewEndStr) < 12 * 60) {
      actualDep = curfewEndStr;
      blockedNote = `Curfew lifts at ${curfewEndStr} — departure advances to curfew end`;
    } else {
      // crosses midnight: curfew end is next day
      actualDep = curfewEndStr;
      blockedNote = `Curfew lifts at ${curfewEndStr} (next day)`;
    }
  }

  const totalWait = diffMins(event.arrivalTime, actualDep);
  const wh = Math.floor(totalWait / 60), wm = totalWait % 60;

  const statusLevel: "clear" | "warn" | "block" | "exempt" =
    !curfewActive ? "clear" : exemptApplies ? "exempt" : "block";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all ${event.acknowledged ? "opacity-60" : ""}`}>
      {/* Header bar */}
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-card-border/50 ${trigger.color}`}>
        <div className="flex-shrink-0">{trigger.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate">{trigger.label}</div>
          <div className="text-[10px] opacity-75">{event.aircraft} · {event.currentLocation} · logged {event.createdAt} by {event.createdBy}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge level={statusLevel} />
          {event.acknowledged && (
            <span className="text-[9px] text-green-400 font-semibold flex items-center gap-0.5">
              <CheckCircle size={10} /> ACK
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Rest timeline — 3-column */}
        <div className="grid grid-cols-3 gap-3 bg-background/50 rounded-lg p-3 border border-card-border/50">
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Arrived</div>
            <div className="text-lg font-bold font-mono">{event.arrivalTime}</div>
            <div className="text-[9px] text-muted-foreground">rest period begins</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-[9px] text-blue-400 font-semibold mb-1">{minRest}h min rest</div>
            <div className="w-full h-0.5 bg-blue-400/30 rounded-full" />
            <div className="text-[9px] text-muted-foreground mt-1 text-center leading-tight">{restLabel(event.fdpHours, multi)}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Rest Complete</div>
            <div className="text-lg font-bold font-mono text-blue-300">{earliestDep}</div>
            <div className="text-[9px] text-muted-foreground">earliest legal dep</div>
          </div>
        </div>

        {/* Curfew advisory */}
        {curfewRule ? (
          <div className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[11px] ${
            blocked ? "bg-red-500/8 border border-red-400/25 text-red-300"
            : exemptApplies ? "bg-amber-500/8 border border-amber-400/25 text-amber-300"
            : "bg-green-500/8 border border-green-400/25 text-green-300"
          }`}>
            <span className="text-base leading-none mt-0.5 flex-shrink-0">
              {blocked ? "🔴" : exemptApplies ? "🟡" : "🟢"}
            </span>
            <div>
              {!curfewActive && (
                <span><strong>{icao}</strong> {curfewRule.label} — no curfew conflict at {earliestDep}. Departure clear.</span>
              )}
              {curfewActive && exemptApplies && (
                <span><strong>{icao}</strong> curfew {String(curfewRule.start).padStart(2,"0")}:00–{String(curfewRule.end).padStart(2,"0")}:00 applies at rest-complete time. <strong>Medivac/aeromedical exemption applies</strong> — departure at {earliestDep} is permitted.</span>
              )}
              {blocked && (
                <span><strong>{icao}</strong> curfew {String(curfewRule.start).padStart(2,"0")}:00–{String(curfewRule.end).padStart(2,"0")}:00. Rest-complete time {earliestDep} falls inside curfew window. {blockedNote}.</span>
              )}
              {!curfewRule.statutory && (
                <span className="block text-[9px] opacity-60 mt-0.5">Voluntary noise abatement — not a statutory curfew. Confirm with aerodrome operator.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/8 border border-green-400/20 text-[11px] text-green-300">
            <span>🟢</span>
            <span><strong>{icao}</strong> — No published curfew restrictions. Departure from {earliestDep} permitted.</span>
          </div>
        )}

        {/* Actual earliest departure — the hero number */}
        <div className="flex items-center justify-between bg-background rounded-lg border border-card-border px-4 py-3">
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Earliest Permitted Departure</div>
            <div className="text-2xl font-extrabold font-mono" style={{ color: TEAL }}>{actualDep}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {wh > 0 ? `${wh}h ${wm}m` : `${wm}m`} from arrival · {restLabel(event.fdpHours, multi)}
              {blocked && <span className="text-red-400 ml-2">· +curfew delay applied</span>}
              {exemptApplies && <span className="text-amber-400 ml-2">· Medivac exempt</span>}
            </div>
          </div>
          {event.isMedivac && (
            <div className="px-2.5 py-1.5 rounded-lg bg-[#01696F]/15 border border-[#01696F]/30 text-[9px] font-bold text-center" style={{ color: TEAL }}>
              MEDIVAC<br/>MISSION
            </div>
          )}
        </div>

        {/* Crew on rest */}
        <div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Crew on Rest</div>
          <div className="flex flex-wrap gap-1.5">
            {event.crew.map(c => (
              <div key={c.id} className="flex items-center gap-1 bg-background border border-card-border rounded-md px-2 py-1 text-[10px]">
                <Users size={9} className="text-muted-foreground" />
                <span>{c.name}</span>
                <span className="text-muted-foreground ml-0.5">
                  {c.role === "pilot" ? (c.isFirstOfficer ? "F/O" : "Capt") : c.role === "nurse" ? "RN" : c.role === "doctor" ? "Dr" : "Para"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes + FDP hours */}
        <div className="flex items-start gap-3 text-[10px] text-muted-foreground border-t border-card-border/50 pt-2.5">
          <span>FDP recorded: <strong className="text-foreground">{event.fdpHours.toFixed(1)} hrs</strong></span>
          {event.notes && <span className="flex-1 italic">"{event.notes}"</span>}
        </div>

        {/* Acknowledge button */}
        {!event.acknowledged && (
          <button
            onClick={() => onAck(event.id)}
            className="w-full text-xs font-semibold py-2 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={12} /> Acknowledge & Log Rest Period
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RestCalculatorOps({ role }: Props) {
  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  // ── Form state ───────────────────────────────────────────────────────────────
  const [trigger, setTrigger]           = useState<TriggerType>("aog");
  const [aircraft, setAircraft]         = useState("VH-MVX");
  const [location, setLocation]         = useState("YSSY (Sydney)");
  const [arrivalTime, setArrivalTime]   = useState(nowHHMM);
  const [fdpHours, setFdpHours]         = useState(9.5);
  const [isMedivac, setIsMedivac]       = useState(true);
  const [notes, setNotes]               = useState("");
  const [crewNames, setCrewNames]       = useState<string[]>(["Capt. R. Hughes", "S. Mitchell RN"]);
  const [isFirstOfficer, setIsFirstOfficer] = useState<Record<string, boolean>>({});
  const [events, setEvents]             = useState<RestEvent[]>([]);
  const [createdBy, setCreatedBy]       = useState<string>(
    role === "dispatcher" ? "Dispatcher" : role === "pilot" ? "Pilot (self-report)" : "Operations"
  );

  // ── Auto-detect overnight triggers from DutyFRMS ─────────────────────────────
  // In a live integration this would come from the backend. Here we simulate
  // automatic "FDP exceeded" events surfacing from the FRMS data.
  const [autoAlerts] = useState([
    {
      id: "auto-1",
      crew: "Capt. R. Hughes",
      aircraft: "VH-MVX",
      location: "YSSY (Sydney)",
      fdpHours: 13.2,
      arrivalTime: "21:45",
      trigger: "fdp_exceeded" as TriggerType,
      source: "DutyFRMS auto-detect",
    },
  ]);

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const visibleAlerts = autoAlerts.filter(a => !dismissedAlerts.includes(a.id));

  function importAlert(alert: typeof autoAlerts[0]) {
    setTrigger(alert.trigger);
    setAircraft(alert.aircraft);
    setLocation(alert.location);
    setArrivalTime(alert.arrivalTime);
    setFdpHours(alert.fdpHours);
    setCrewNames([alert.crew]);
    setDismissedAlerts(d => [...d, alert.id]);
  }

  // ── Add crew ──────────────────────────────────────────────────────────────────
  function addCrew(name: string) {
    if (name && !crewNames.includes(name)) setCrewNames(prev => [...prev, name]);
  }
  function removeCrew(name: string) {
    setCrewNames(prev => prev.filter(n => n !== name));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleCreate() {
    if (!arrivalTime || crewNames.length === 0) return;
    const crew: CrewMember[] = crewNames.map((name, i) => {
      const lname = name.toLowerCase();
      const role: CrewMember["role"] = lname.includes("capt") ? "pilot"
        : lname.includes("rn") || lname.includes("nurse") ? "nurse"
        : lname.includes("dr") || lname.includes("doctor") ? "doctor"
        : "paramedic";
      return { id: `c${i}`, name, role, isFirstOfficer: isFirstOfficer[name] ?? false };
    });
    const ev: RestEvent = {
      id: `evt-${Date.now()}`,
      trigger, aircraft, currentLocation: location,
      arrivalTime, fdpHours, crew, notes, isMedivac,
      createdAt: nowHHMM, createdBy, acknowledged: false,
    };
    setEvents(prev => [ev, ...prev]);
    setNotes("");
  }

  function handleAck(id: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, acknowledged: true } : e));
  }

  const canSubmit = arrivalTime.includes(":") && crewNames.length > 0 && fdpHours > 0;

  // ── FDP quick-calc ────────────────────────────────────────────────────────────
  const [dutyStart, setDutyStart] = useState("08:00");
  const calcFdp = () => {
    const mins = diffMins(dutyStart, arrivalTime);
    const hrs = parseFloat(((mins + 30) / 60).toFixed(1)); // +30 min pre-flight
    if (hrs > 0) setFdpHours(hrs);
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Crew Rest Calculator
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unplanned overnights · AOG groundings · FDP-exceeded events · CASA CAO 48.1 / EBA 2025
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-card-border text-[10px] text-muted-foreground">
          <Shield size={11} style={{ color: TEAL }} />
          <span>CAO 48.1 · EBA Cl 18.5</span>
        </div>
      </div>

      {/* ── Auto-detected alerts from FRMS ─────────────────────────────────── */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-2">
          {visibleAlerts.map(alert => (
            <div key={alert.id}
              className="flex items-center gap-3 bg-orange-500/8 border border-orange-400/25 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-orange-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-orange-300">Auto-detected — FDP Limit Reached</div>
                <div className="text-[11px] text-muted-foreground">
                  {alert.crew} · {alert.aircraft} · arrived {alert.location} at {alert.arrivalTime} ·
                  FDP recorded {alert.fdpHours.toFixed(1)} hrs · <span className="opacity-60">{alert.source}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => importAlert(alert)}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white flex items-center gap-1"
                  style={{ backgroundColor: TEAL }}
                >
                  <ChevronRight size={11} /> Import &amp; Calculate
                </button>
                <button
                  onClick={() => setDismissedAlerts(d => [...d, alert.id])}
                  className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg border border-card-border"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">

        {/* ── LEFT — Entry form ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Log Unplanned Overnight</div>

            {/* Trigger type */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Reason for Overnight</label>
              <div className="grid grid-cols-2 gap-2">
                {TRIGGERS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTrigger(t.value)}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      trigger === t.value
                        ? `${t.color} font-semibold`
                        : "border-card-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{t.icon}</div>
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">{t.label}</div>
                      <div className="text-[9px] opacity-70 mt-0.5 leading-tight">{t.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aircraft */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Aircraft</label>
                <input
                  value={aircraft}
                  onChange={e => setAircraft(e.target.value)}
                  className="w-full text-sm bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none font-mono"
                  placeholder="VH-XXX"
                  data-testid="input-aircraft"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Logged By</label>
                <input
                  value={createdBy}
                  onChange={e => setCreatedBy(e.target.value)}
                  className="w-full text-sm bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none"
                  data-testid="input-logged-by"
                />
              </div>
            </div>

            {/* Current location */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Current Location (overnight airport)</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-sm bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none"
                data-testid="select-location"
              >
                {BASES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Arrival time */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Local Arrival Time at Overnight Airport</label>
              <input
                type="time"
                value={arrivalTime}
                onChange={e => setArrivalTime(e.target.value)}
                className="w-full text-sm bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none font-mono"
                data-testid="input-arrival-time"
              />
            </div>

            {/* FDP hours with quick-calc */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">FDP Hours Completed Today</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={fdpHours}
                  onChange={e => setFdpHours(parseFloat(e.target.value) || 0)}
                  className="flex-1 text-sm bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none font-mono"
                  data-testid="input-fdp-hours"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={dutyStart}
                    onChange={e => setDutyStart(e.target.value)}
                    className="text-xs bg-background border border-card-border rounded-lg px-2 py-1.5 focus:outline-none font-mono w-24"
                    title="Duty start time — used to auto-calculate FDP"
                  />
                  <button
                    onClick={calcFdp}
                    title="Calculate FDP from duty start to arrival time"
                    className="text-[10px] px-2 py-1.5 rounded-lg border border-card-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Calc
                  </button>
                </div>
              </div>
              <div className="text-[9px] text-muted-foreground mt-1">
                Or enter duty start → press Calc to auto-fill from arrival time
              </div>
            </div>

            {/* Mission type */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-medivac"
                checked={isMedivac}
                onChange={e => setIsMedivac(e.target.checked)}
                className="rounded"
                data-testid="checkbox-medivac"
              />
              <label htmlFor="is-medivac" className="text-xs cursor-pointer select-none">
                Aeromedical / Medivac mission — curfew exemptions apply
              </label>
            </div>

            {/* Crew */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Crew on Rest</label>
              <div className="space-y-1.5 mb-2">
                {crewNames.map(name => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-background border border-card-border rounded-md px-2.5 py-1.5 flex items-center gap-2">
                      <Users size={10} className="text-muted-foreground" />
                      {name}
                    </div>
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFirstOfficer[name] ?? false}
                        onChange={e => setIsFirstOfficer(prev => ({ ...prev, [name]: e.target.checked }))}
                        className="rounded"
                      />
                      F/O
                    </label>
                    <button onClick={() => removeCrew(name)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <span className="text-[10px]">✕</span>
                    </button>
                  </div>
                ))}
              </div>
              <select
                onChange={e => { addCrew(e.target.value); e.target.value = ""; }}
                defaultValue=""
                className="w-full text-xs bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none"
                data-testid="select-add-crew"
              >
                <option value="">+ Add crew member…</option>
                {CREW_LIST.filter(c => !crewNames.includes(c)).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. AOG — defect raised on VH-MVX prop governor. Engineering en route. ETA fix 0800."
                className="w-full text-xs bg-background border border-card-border rounded-lg px-3 py-1.5 focus:outline-none resize-none"
                data-testid="input-notes"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={!canSubmit}
              className="w-full text-sm font-bold py-2.5 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: TEAL }}
              data-testid="button-calculate-rest"
            >
              Calculate Rest & Departure Window
            </button>
          </div>

          {/* Reference card */}
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info size={11} /> Rest Rules Reference
            </div>
            {[
              { rule: "Multi-crew FDP ≤ 10h", rest: "10 hrs min rest", ref: "EBA 2025 Cl 18.5" },
              { rule: "Multi-crew FDP > 10h", rest: "12 hrs min rest", ref: "EBA 2025 Cl 18.5" },
              { rule: "Single-pilot", rest: "8 hrs min rest", ref: "CAO 48.1" },
              { rule: "Extended disruption", rest: "12 hrs recommended", ref: "CASA guidance" },
              { rule: "YSSY curfew", rest: "2300–0600 local", ref: "Airports Act 1996" },
              { rule: "YPPH curfew", rest: "2200–0600 local", ref: "Airports (Noise) Act" },
              { rule: "YMEN curfew", rest: "2100–0700 local", ref: "Essendon ERSA" },
              { rule: "Medivac exemption", rest: "All curfews — aeromedical ops exempt", ref: "ERSA / AIP" },
            ].map(r => (
              <div key={r.rule} className="flex items-start justify-between text-[10px] gap-2">
                <span className="text-foreground/80">{r.rule}</span>
                <div className="text-right flex-shrink-0">
                  <div className="text-foreground font-semibold">{r.rest}</div>
                  <div className="text-muted-foreground">{r.ref}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — Active rest events ────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Rest Periods
              {events.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-[#01696F]/20 text-[#4F98A3] text-[9px]">
                  {events.filter(e => !e.acknowledged).length} active
                </span>
              )}
            </div>
          </div>

          {events.length === 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-10 text-center">
              <Moon size={28} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm text-muted-foreground">No active rest events logged.</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Complete the form to calculate a crew rest & departure window.
              </p>
            </div>
          )}

          {events.map(ev => (
            <RestCard key={ev.id} event={ev} onAck={handleAck} />
          ))}
        </div>
      </div>
    </div>
  );
}
