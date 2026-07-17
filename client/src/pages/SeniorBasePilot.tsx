import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Plane, Users, Calendar, Clock, AlertTriangle, CheckCircle2,
  Wrench, ChevronRight, ChevronLeft, ArrowUpRight, ReceiptText,
  ClipboardList, Timer, CalendarCheck, Wifi, WifiOff, MapPin,
  Shield, FileText, Coins, Send, Plus, X, CloudSun, CloudRain,
  Cloud, Sun, Wind, Thermometer, Zap, Activity, Inbox, User,
  RefreshCw, Lock, Building, Phone, Bell, BookOpen, ChevronDown,
  FolderOpen, Edit3, ExternalLink
} from "lucide-react";
import type { UserRole } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeatherDay { date: string; code: number; high: number; low: number; }
interface WeatherCurrent { temp: number; feels: number; wind: number; windDir: number; humidity: number; code: number; }
interface WeatherData { current: WeatherCurrent; daily: WeatherDay[]; locationName: string; }

// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD = "bg-[#1C1B19] border border-[#393836] rounded-xl";
const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };
// Essendon is managed under Bankstown — same Base Manager
const BASES = ["Dubbo", "Broken Hill", "Bankstown", "Launceston"] as const;
type Base = typeof BASES[number];

const BASE_META: Record<Base, { icao: string; lat: number; lon: number; tz: string; code: string; subBases?: string[] }> = {
  "Dubbo":        { icao: "YSDU", lat: -32.2169, lon: 148.5740, tz: "Australia/Sydney",    code: "DU"  },
  "Broken Hill":  { icao: "YBHI", lat: -31.9920, lon: 141.4722, tz: "Australia/Sydney",    code: "BHI" },
  "Bankstown":    { icao: "YSBK", lat: -33.9244, lon: 150.9883, tz: "Australia/Sydney",    code: "BK",  subBases: ["Essendon (YMEN)"] },
  "Launceston":   { icao: "YMLT", lat: -41.5450, lon: 147.2140, tz: "Australia/Hobart",    code: "TAS" },
};

// ─── Roster data (from Roster.tsx) ──────────────────────────────────────────
type DayCode = 'ON' | 'OFF' | 'P' | 'LEAVE' | 'FERRY' | 'SIM' | 'OPS';
interface CrewMember {
  id: string; name: string; role: string; base: Base; dutyStatus: string;
  currency: boolean; qualifications: string[]; week: DayCode[]; notes?: string;
}

const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0

const ALL_PILOTS: CrewMember[] = [
  { id: 'P1', name: 'Capt. Sarah Mitchell', role: 'Captain / PIC', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200','B350','IFR','NVG'],    week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P2', name: 'Capt. James Clarke',   role: 'Captain / PIC', base: 'Dubbo',       dutyStatus: 'On Call',  currency: false, qualifications: ['B200','B350','IFR'],          week: ['OFF','OFF','ON','ON','ON','ON','OFF'], notes: 'Currency lapsed — renewal 10 Jun' },
  { id: 'P3', name: 'F/O Emma Watkins',     role: 'First Officer',  base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200','IFR'],                week: ['ON','ON','OFF','OFF','OFF','ON','ON'] },
  { id: 'P4', name: 'Capt. Liam Nguyen',    role: 'Captain / PIC', base: 'Dubbo',       dutyStatus: 'Off Duty', currency: true,  qualifications: ['B200','B350','IFR','NVG'],   week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
  { id: 'P5', name: 'F/O Rachel Torres',    role: 'First Officer',  base: 'Broken Hill', dutyStatus: 'P Day',    currency: true,  qualifications: ['B200','IFR'],                week: ['P','P','ON','ON','ON','ON','OFF'] },
  { id: 'P6', name: 'Capt. David Walsh',    role: 'Captain / PIC', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200','B350','IFR','Ferry'],  week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P7', name: 'Capt. Brooke Henson',  role: 'Captain / PIC', base: 'Launceston',  dutyStatus: 'On Duty',  currency: true,  qualifications: ['B350','IFR','TAS Amb'],      week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P8', name: 'F/O Daniel Frost',     role: 'First Officer',  base: 'Launceston',  dutyStatus: 'On Call',  currency: true,  qualifications: ['B350','IFR'],                week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'P9', name: 'Capt. M. O\'Brien',    role: 'Captain / PIC', base: 'Bankstown',   dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200','B350','IFR'],         week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P10',name: 'F/O B. Kwan',          role: 'First Officer',  base: 'Bankstown',   dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200','IFR'],                week: ['ON','ON','ON','ON','OFF','OFF','OFF'], notes: 'Stationed: Essendon (YMEN)' },
];

const ALL_OPS: CrewMember[] = [
  { id: 'O1', name: 'Fiona Gallagher',  role: 'Base Manager',       base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['OPS','CASA','ISO'],           week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O2', name: 'Robert Chen',      role: 'Operations Manager',  base: 'Dubbo',       dutyStatus: 'Touring',  currency: true, qualifications: ['OPS','FRMS','Dispatch'],      week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O3', name: 'Angela Morris',    role: 'Base Manager',        base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true, qualifications: ['OPS','CASA'],                 week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O4', name: 'Sarah Blackwell',  role: 'Base Manager',        base: 'Launceston',  dutyStatus: 'On Duty',  currency: true, qualifications: ['OPS','CASA','TAS Amb'],       week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O5', name: 'Dispatcher L. Yau',role: 'Flight Dispatcher',   base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['Dispatch','FRMS'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'O6', name: 'Dispatcher P. Singh',role:'Flight Dispatcher',  base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true, qualifications: ['Dispatch'],                   week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'O7', name: 'Dispatcher R. Evans',role:'Flight Dispatcher',  base: 'Bankstown',   dutyStatus: 'On Duty',  currency: true, qualifications: ['Dispatch','FRMS'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'O8', name: 'T. Stafford',      role: 'Dispatcher (On-Call)',base: 'Bankstown',   dutyStatus: 'On Call',  currency: true, qualifications: ['Dispatch'],                   week: ['OFF','OFF','ON','ON','ON','ON','OFF'], notes: 'Based: Essendon (YMEN)' },
];

const ALL_ENGINEERS: CrewMember[] = [
  { id: 'E1', name: 'Craig Holloway',   role: 'LAME — On Call', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['B200','B350','LAME','Avionics'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'E2', name: 'Darren Stubbs',    role: 'LAME',           base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['B200','B350','LAME'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'E3', name: 'Mia Kowalski',     role: 'LAME — On Call', base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true, qualifications: ['B200','LAME'],                   week: ['ON','ON','OFF','OFF','OFF','ON','ON'] },
  { id: 'E4', name: 'Paul Tran',        role: 'Maint. Controller',base:'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['Veryon','MEL','Planning'],       week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'E5', name: 'B. Martinez',      role: 'LAME — On Call', base: 'Bankstown',   dutyStatus: 'On Call',  currency: true, qualifications: ['B200','LAME'],                   week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'E6', name: 'J. Fitzgerald',    role: 'LAME — On Call', base: 'Bankstown',   dutyStatus: 'On Call',  currency: true, qualifications: ['B200','B350','LAME'],            week: ['OFF','OFF','OFF','ON','ON','ON','ON'], notes: 'Based: Essendon (YMEN)' },
  { id: 'E7', name: 'T. Gibson',        role: 'LAME — On Call', base: 'Launceston',  dutyStatus: 'On Duty',  currency: true, qualifications: ['B350','LAME'],                   week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
];

// ─── Mission data ─────────────────────────────────────────────────────────────
const MISSIONS_BY_BASE: Record<Base, { callsign: string; type: string; from: string; to: string; aircraft: string; status: string; etd: string; pilot: string }[]> = {
  "Dubbo":        [
    { callsign: "RFD208", type: "Ambulance", from: "YWLG", to: "YSSY", aircraft: "VH-XYJ", status: "Airborne", etd: "05:42", pilot: "Capt. Walsh" },
    { callsign: "RFD214", type: "Clinic Air",from: "YSDU", to: "YWCA", aircraft: "VH-MVW", status: "Active",   etd: "09:15", pilot: "Capt. Mitchell" },
  ],
  "Broken Hill":  [
    { callsign: "RFD221", type: "Ambulance", from: "YBHI", to: "YSSY", aircraft: "VH-XYR", status: "Active",   etd: "06:30", pilot: "Capt. Nguyen" },
  ],
  "Bankstown":    [
    { callsign: "RFD231", type: "NEPT",      from: "YSBK", to: "YMLT", aircraft: "VH-LTQ", status: "Pending",  etd: "11:00", pilot: "Capt. O'Brien" },
  ],
  "Launceston":   [
    { callsign: "RFD241", type: "Ambulance", from: "YMLT", to: "YMML", aircraft: "VH-MQK", status: "Complete",  etd: "07:00", pilot: "Capt. Henson" },
  ],
};

// ─── Leave applications ───────────────────────────────────────────────────────
const LEAVE_DATA = [
  { id: "L001", name: "F/O Rachel Torres",   type: "Annual Leave",    from: "28 Jul", to: "08 Aug", days: 10, status: "Pending",  base: "Broken Hill",  applied: "10 Jul 2026" },
  { id: "L002", name: "Capt. David Walsh",   type: "Personal Leave",  from: "21 Jul", to: "22 Jul", days: 2,  status: "Approved", base: "Dubbo",         applied: "08 Jul 2026" },
  { id: "L003", name: "Capt. James Clarke",  type: "Medical Leave",   from: "16 Jul", to: "23 Jul", days: 6,  status: "Approved", base: "Dubbo",         applied: "15 Jul 2026" },
  { id: "L004", name: "F/O Daniel Frost",    type: "Annual Leave",    from: "04 Aug", to: "18 Aug", days: 11, status: "Pending",  base: "Launceston",   applied: "09 Jul 2026" },
  { id: "L005", name: "Capt. M. O'Brien",    type: "Annual Leave",    from: "01 Sep", to: "12 Sep", days: 10, status: "Pending",  base: "Bankstown",    applied: "11 Jul 2026" },
];

// ─── Expense claims ───────────────────────────────────────────────────────────
const EXPENSE_DATA = [
  { id: "EX-2026-0041", desc: "YWLG overnight — accommodation",  amount: 180.00, date: "14 Jul",  category: "Accommodation", status: "Submitted" },
  { id: "EX-2026-0038", desc: "Fuel — ground vehicle",            amount: 62.40,  date: "11 Jul",  category: "Vehicle",       status: "Approved"  },
  { id: "EX-2026-0035", desc: "YWCA overnight — accommodation",   amount: 160.00, date: "07 Jul",  category: "Accommodation", status: "Approved"  },
  { id: "EX-2026-0031", desc: "Crew catering — late return",       amount: 95.80,  date: "02 Jul",  category: "Catering",      status: "Approved"  },
];

// ─── Timesheet data ────────────────────────────────────────────────────────────
const MY_TIMESHEET = {
  period: "07–20 Jul 2026",
  ordinary: 76.0, overtime: 4.5, allowances: 320,
  status: "Submitted",
  entries: [
    { date: "Mon 07", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "" },
    { date: "Tue 08", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "RFD208 YWLG–YSSY" },
    { date: "Wed 09", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "" },
    { date: "Thu 10", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "" },
    { date: "Fri 11", type: "OFF", duty: "—", hrs: 0, notes: "" },
    { date: "Sat 12", type: "OFF", duty: "—", hrs: 0, notes: "" },
    { date: "Sun 13", type: "OFF", duty: "—", hrs: 0, notes: "" },
    { date: "Mon 14", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "YWCA clinic run" },
    { date: "Tue 15", type: "ON", duty: "05:30–18:30", hrs: 13, notes: "Delayed return — OT" },
    { date: "Wed 16", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "" },
    { date: "Thu 17", type: "ON", duty: "05:30–17:30", hrs: 12, notes: "" },
    { date: "Fri 18", type: "OFF", duty: "—", hrs: 0, notes: "" },
    { date: "Sat 19", type: "OFF", duty: "—", hrs: 0, notes: "" },
    { date: "Sun 20", type: "OFF", duty: "—", hrs: 0, notes: "" },
  ]
};

// ─── Notice to Crews data ───────────────────────────────────────────────────────
interface Notice {
  id: string; base: Base | "All"; priority: "High" | "Normal" | "Info";
  title: string; body: string; author: string; date: string; expiry?: string;
}
const NOTICES_DATA: Notice[] = [
  { id: "N001", base: "All",        priority: "High",   title: "Fire Season — Airspace Restrictions",  body: "NOTAM issued for all bases: additional pre-flight checks required for smoke visibility. Refer to Met briefing before any departure into known smoke-affected areas. Contact ATC for current restrictions.",  author: "Chief Pilot", date: "15 Jul 2026", expiry: "31 Aug 2026" },
  { id: "N002", base: "Dubbo",      priority: "Normal", title: "Hangar 2 Construction — Ramp Caution",   body: "Construction works in progress adjacent to Hangar 2. Wingtip clearance reduced. Tow only when marshallers are present. Night operations — portable lighting in use.",                                         author: "Fiona Gallagher", date: "14 Jul 2026" },
  { id: "N003", base: "Bankstown",  priority: "High",   title: "Fuel Uplift Delays — Avjet Service",    body: "Avjet advising 45-minute minimum lead time for fuel requests at YSBK this week. Plan accordingly for early departures. Contact ops to pre-book fuel slots. Essendon (YMEN) — no delays reported.",        author: "R. Evans", date: "16 Jul 2026" },
  { id: "N004", base: "Broken Hill",priority: "Normal", title: "ILS Maintenance — Approach Restrictions",body: "YBHI ILS out of service until 24 Jul. VOR/DME and NDB approaches available. Circling approved. Advise all crews planning approaches at BHI. Check NOTAMs before departure.",                               author: "Angela Morris", date: "13 Jul 2026", expiry: "24 Jul 2026" },
  { id: "N005", base: "All",        priority: "Info",   title: "New Uniform Rollout — Return Old Kit",   body: "New uniforms are being distributed this fortnight. All crew please return old epaulettes and ID tabs to your Base Manager by 31 Jul. New name badges will be issued at the same time.",                    author: "HR Operations", date: "10 Jul 2026" },
  { id: "N006", base: "Launceston", priority: "Info",   title: "ATIS Frequency Change — YMLT",          body: "Launceston ATIS now on 134.200 MHz (previously 127.750). Confirm charts are updated. D-ATIS via VHF is operational.",                                                                                        author: "Sarah Blackwell", date: "12 Jul 2026" },
];

// ─── Local Operating Procedures (LOPs) data ──────────────────────────────────
interface LOP {
  id: string; base: Base | "All"; category: string; title: string;
  version: string; effective: string; owner: string; status: "Current" | "Under Review" | "Superseded";
  description: string;
}
const LOPS_DATA: LOP[] = [
  { id: "LOP-OPS-001", base: "All",       category: "Flight Operations", title: "Fuel Policy — Minimum Requirements",         version: "v3.2", effective: "01 Mar 2026", owner: "Chief Pilot",       status: "Current",       description: "Minimum fuel quantities, reserves, and diversion fuel for all aircraft types" },
  { id: "LOP-OPS-002", base: "All",       category: "Flight Operations", title: "Night Operations Procedures",                version: "v2.1", effective: "15 Jan 2026", owner: "Chief Pilot",       status: "Current",       description: "Night VMC and IFR operations, crew briefings, lighting requirements" },
  { id: "LOP-OPS-003", base: "Dubbo",     category: "Ground Ops",        title: "Dubbo Ramp — Pushback and Towing",           version: "v1.4", effective: "10 Jun 2026", owner: "Fiona Gallagher",  status: "Current",       description: "Marshalling signals, tow limits, and ramp safety at YSDU" },
  { id: "LOP-OPS-004", base: "All",       category: "Maintenance",       title: "Tech Log Completion — Manual Fallback",       version: "v2.0", effective: "01 May 2026", owner: "Maint. Control",   status: "Current",       description: "Procedure for paper tech log use when electronic system is unavailable" },
  { id: "LOP-OPS-005", base: "Bankstown", category: "Ground Ops",        title: "Bankstown / Essendon Ramp Authority",        version: "v1.1", effective: "20 Apr 2026", owner: "R. Evans",         status: "Current",       description: "Shared ramp authority and marshalling procedures for YSBK and YMEN operations" },
  { id: "LOP-OPS-006", base: "All",       category: "Medical",           title: "In-Flight Medical Emergency — Crew Response", version: "v4.0", effective: "01 Jul 2026", owner: "Medical Director", status: "Current",       description: "Decision tree for crew when a patient deteriorates in flight" },
  { id: "LOP-OPS-007", base: "Launceston",category: "Flight Operations", title: "TAS Ambulance Protocol — Coordination",      version: "v2.3", effective: "01 Feb 2026", owner: "Sarah Blackwell",  status: "Current",       description: "Coordination with TAS Ambulance for patient handover at YMLT" },
  { id: "LOP-OPS-008", base: "All",       category: "Safety",            title: "Bird Strike Reporting Procedure",             version: "v1.0", effective: "01 Oct 2025", owner: "Safety Officer",   status: "Under Review",  description: "Mandatory reporting, inspection steps, and ATSB notification process" },
];

// ─── FDP pilot duty state ─────────────────────────────────────────────────────
interface FDPPilot {
  id: string; name: string; aircraft: string; base: Base;
  startTime: string; // HH:MM local
  maxFDP: number;    // hours (base limit)
  extended: boolean;
  extensionMins: number; // minutes added by extension
  extensionLog: { ts: string; by: string; reason: string }[];
}
const INITIAL_FDP: FDPPilot[] = [
  { id: 'P1',  name: 'Capt. Sarah Mitchell', aircraft: 'VH-MVW', base: 'Dubbo',     startTime: '05:30', maxFDP: 12, extended: false, extensionMins: 0, extensionLog: [] },
  { id: 'P6',  name: 'Capt. David Walsh',    aircraft: 'VH-XYJ', base: 'Dubbo',     startTime: '05:30', maxFDP: 12, extended: false, extensionMins: 0, extensionLog: [] },
  { id: 'P9',  name: "Capt. M. O'Brien",    aircraft: 'VH-LTQ', base: 'Bankstown', startTime: '06:00', maxFDP: 12, extended: false, extensionMins: 0, extensionLog: [] },
  { id: 'P10', name: 'F/O B. Kwan',          aircraft: 'VH-LTQ', base: 'Bankstown', startTime: '06:00', maxFDP: 12, extended: false, extensionMins: 0, extensionLog: [] },
  { id: 'P7',  name: 'Capt. Brooke Henson',  aircraft: 'VH-MQK', base: 'Launceston',startTime: '06:30', maxFDP: 12, extended: false, extensionMins: 0, extensionLog: [] },
];

// ─── Helper components ────────────────────────────────────────────────────────
function DayCodeBadge({ code, today }: { code: DayCode; today?: boolean }) {
  const styles: Record<DayCode, string> = {
    ON:    "bg-green-500/20 text-green-400 border-green-500/30",
    OFF:   "bg-[#393836]/40 text-[#5A5957] border-[#393836]",
    P:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
    LEAVE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    FERRY: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    SIM:   "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    OPS:   "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  };
  return (
    <span className={`inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 rounded border text-[10px] font-bold ${styles[code]} ${today ? "ring-1 ring-white/20" : ""}`}>
      {code}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const m: Record<string, string> = {
    "On Duty":  "bg-green-400", "On Call": "bg-amber-400",
    "Off Duty": "bg-[#5A5957]", "P Day":  "bg-blue-400",
    "Leave":    "bg-amber-400/60", "Touring":"bg-violet-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${m[status] ?? "bg-[#5A5957]"}`} />;
}

function MissionStatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    Airborne: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    Active:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Pending:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Complete: "bg-green-500/15 text-green-400 border-green-500/30",
    Cancelled:"bg-red-500/15 text-red-400 border-red-500/30",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m[status] ?? "bg-[#393836]/40 text-[#797876] border-[#393836]"}`}>{status}</span>;
}

function LeaveStatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    Pending:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Approved: "bg-green-500/15 text-green-400 border-green-500/30",
    Declined: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m[status] ?? "bg-[#393836]/40 text-[#797876] border-[#393836]"}`}>{status}</span>;
}

function ExpenseStatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    Submitted: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Approved:  "bg-green-500/15 text-green-400 border-green-500/30",
    Rejected:  "bg-red-500/15 text-red-400 border-red-500/30",
    Draft:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m[status] ?? "bg-[#393836]/40 text-[#797876] border-[#393836]"}`}>{status}</span>;
}

// ─── Weather mini component ────────────────────────────────────────────────────
const WX_ICONS: Record<number, React.ReactNode> = {};
function wxIcon(code: number) {
  if (code <= 1)  return <Sun size={13} className="text-yellow-400" />;
  if (code <= 3)  return <Cloud size={13} className="text-[#797876]" />;
  if (code <= 67) return <CloudRain size={13} className="text-blue-400" />;
  if (code <= 77) return <CloudSun size={13} className="text-[#797876]" />;
  return <Zap size={13} className="text-amber-400" />;
}

function WeatherStrip({ base }: { base: Base }) {
  const [wx, setWx] = useState<{ current?: WeatherCurrent; daily?: WeatherDay[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const meta = BASE_META[base];

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${meta.lat}&longitude=${meta.lon}` +
      `&current=temperature_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=${encodeURIComponent(meta.tz)}&forecast_days=7`;
    fetch(url).then(r => r.json()).then(d => {
      setWx({
        current: { temp: d.current.temperature_2m, feels: d.current.temperature_2m, wind: d.current.wind_speed_10m, windDir: 0, humidity: 0, code: d.current.weather_code },
        daily: d.daily.time.map((_: any, i: number) => ({
          date: d.daily.time[i], code: d.daily.weather_code[i],
          high: d.daily.temperature_2m_max[i], low: d.daily.temperature_2m_min[i],
        }))
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [base]);

  const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  if (loading) return <div className="text-[10px] text-[#5A5957] animate-pulse">Loading wx…</div>;
  if (!wx?.daily) return <div className="text-[10px] text-[#5A5957]">Wx unavailable</div>;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Current */}
      {wx.current && (
        <div className="flex items-center gap-1.5 pr-3 border-r border-[#393836]">
          {wxIcon(wx.current.code)}
          <span className="text-sm font-bold text-[#CDCCCA]">{Math.round(wx.current.temp)}°</span>
          <span className="text-[10px] text-[#797876]">{Math.round(wx.current.wind)} kt</span>
        </div>
      )}
      {/* 7-day strip */}
      {wx.daily.map((day, i) => {
        const d = new Date(day.date + "T12:00:00");
        const label = i === 0 ? "Now" : DAY[d.getDay()];
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 min-w-[32px]">
            <span className="text-[9px] text-[#5A5957] uppercase">{label}</span>
            {wxIcon(day.code)}
            <span className="text-[9px] text-[#CDCCCA] font-medium">{Math.round(day.high)}°</span>
            <span className="text-[9px] text-[#5A5957]">{Math.round(day.low)}°</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shift roster panel ────────────────────────────────────────────────────────
function ShiftRosterPanel({ base }: { base: Base }) {
  const pilots = ALL_PILOTS.filter(p => p.base === base);
  const weekDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const onToday = pilots.filter(p => p.week[TODAY_IDX] === 'ON');
  const onCall  = pilots.filter(p => p.week[TODAY_IDX] === 'P' || (p.dutyStatus === 'On Call'));

  return (
    <div className="space-y-3">
      {/* Today summary */}
      <div className="flex gap-2 flex-wrap">
        {pilots.filter(p => p.week[TODAY_IDX] !== 'OFF').map(p => (
          <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            p.week[TODAY_IDX] === 'ON' ? "bg-green-500/8 border-green-500/20" :
            p.week[TODAY_IDX] === 'P'  ? "bg-blue-500/8 border-blue-500/20" :
            p.week[TODAY_IDX] === 'LEAVE' ? "bg-amber-500/8 border-amber-500/20" :
            "bg-[#393836]/30 border-[#393836]"
          }`}>
            <StatusDot status={p.dutyStatus} />
            <div>
              <div className="text-xs font-semibold text-[#CDCCCA]">{p.name}</div>
              <div className="text-[10px] text-[#797876]">{p.role}</div>
              {!p.currency && <div className="text-[9px] text-amber-400">⚠ Currency lapsed</div>}
            </div>
            <DayCodeBadge code={p.week[TODAY_IDX]} today />
          </div>
        ))}
        {pilots.filter(p => p.week[TODAY_IDX] !== 'OFF').length === 0 && (
          <div className="text-xs text-[#5A5957] italic">No pilots rostered today</div>
        )}
      </div>

      {/* 7-day table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-[10px] text-[#5A5957] font-normal pb-2 pr-3 whitespace-nowrap">Pilot</th>
              {weekDays.map((d, i) => (
                <th key={d} className={`text-center text-[10px] pb-2 px-1.5 whitespace-nowrap ${i === TODAY_IDX ? "text-[#4F98A3] font-bold" : "text-[#5A5957] font-normal"}`}>
                  {d}{i === TODAY_IDX ? " ●" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#393836]/50">
            {pilots.map(p => (
              <tr key={p.id}>
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  <div className="text-xs text-[#CDCCCA] font-medium">{p.name}</div>
                  <div className="text-[9px] text-[#797876]">{p.role}</div>
                </td>
                {p.week.map((code, i) => (
                  <td key={i} className="text-center py-1.5 px-1">
                    <DayCodeBadge code={code} today={i === TODAY_IDX} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── New expense claim form ────────────────────────────────────────────────────
function NewExpenseForm({ onClose, onAdd }: { onClose: () => void; onAdd: (e: any) => void }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Accommodation");
  const [receipt, setReceipt] = useState(false);
  const cats = ["Accommodation","Vehicle","Catering","Equipment","Airfield Fees","Other"];
  const today = new Date().toLocaleDateString('en-AU', { day:'2-digit', month:'short' });

  const submit = () => {
    if (!desc || !amount) return;
    onAdd({ id: `EX-2026-${Date.now()}`, desc, amount: parseFloat(amount), date: today, category, status: "Draft" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1C1B19] border border-[#393836] rounded-2xl p-5 shadow-2xl space-y-4 mx-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>New Expense Claim</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876]"><X size={14} /></button>
        </div>
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none">
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Description *</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. YWLG overnight — accommodation"
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
        </div>
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Amount (AUD excl. GST) *</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
        </div>
        <label className="flex items-center gap-2 text-xs text-[#797876] cursor-pointer">
          <input type="checkbox" checked={receipt} onChange={e => setReceipt(e.target.checked)} className="accent-[#4F98A3]" />
          Receipt attached
        </label>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#393836] text-xs text-[#797876]">Cancel</button>
          <button onClick={submit} disabled={!desc || !amount}
            className="flex-1 py-2.5 rounded-xl bg-[#01696F] text-white text-xs font-semibold hover:bg-[#0C4E54] disabled:opacity-40 transition-colors">
            Submit Claim
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Leave application form ────────────────────────────────────────────────────
function NewLeaveForm({ onClose, onAdd }: { onClose: () => void; onAdd: (l: any) => void }) {
  const [type, setType] = useState("Annual Leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const leaveTypes = ["Annual Leave","Personal Leave","Medical Leave","Long Service Leave","TOIL","Study Leave"];

  const submit = () => {
    if (!from || !to) return;
    const days = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
    onAdd({ id: `L${Date.now()}`, name: "You", type, from: new Date(from).toLocaleDateString('en-AU',{day:'2-digit',month:'short'}), to: new Date(to).toLocaleDateString('en-AU',{day:'2-digit',month:'short'}), days, status: "Pending", base: "—", applied: new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'}) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1C1B19] border border-[#393836] rounded-2xl p-5 shadow-2xl space-y-4 mx-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Leave Application</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876]"><X size={14} /></button>
        </div>
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Leave Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none">
            {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">From *</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50" />
          </div>
          <div>
            <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">To *</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Reason / Notes</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50 resize-none"
            placeholder="Optional — e.g. pre-planned family holiday" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#393836] text-xs text-[#797876]">Cancel</button>
          <button onClick={submit} disabled={!from || !to}
            className="flex-1 py-2.5 rounded-xl bg-[#4F98A3] text-white text-xs font-semibold hover:bg-[#227F8B] disabled:opacity-40 transition-colors">
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SeniorBasePilot({ role }: { role: UserRole }) {
  const [, navigate] = useLocation();
  const [selectedBase, setSelectedBase] = useState<Base>("Dubbo");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expenses, setExpenses] = useState(EXPENSE_DATA);
  const [leaves, setLeaves] = useState(LEAVE_DATA);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // FDP state
  const [fdpPilots, setFdpPilots] = useState<FDPPilot[]>(INITIAL_FDP);
  const [fdpExtModal, setFdpExtModal] = useState<{ pilotId: string; reason: string } | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Notices state
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  // LOPs state
  const [lopCategory, setLopCategory] = useState<string>("All");

  const basePilots    = ALL_PILOTS.filter(p => p.base === selectedBase);
  const baseOps       = ALL_OPS.filter(p => p.base === selectedBase);
  const baseEngineers = ALL_ENGINEERS.filter(e => e.base === selectedBase);
  const baseMissions  = MISSIONS_BY_BASE[selectedBase] ?? [];
  const activeM       = baseMissions.filter(m => m.status === "Airborne" || m.status === "Active");
  const pendingLeaves = leaves.filter(l => l.status === "Pending");
  const onCallEng     = baseEngineers.find(e => e.role.includes("On Call"));
  const meta          = BASE_META[selectedBase];

  const TABS = [
    { id: "overview", label: "Overview",         icon: <Activity size={12} /> },
    { id: "roster",   label: "Shift Roster",      icon: <Calendar size={12} /> },
    { id: "fdp",      label: "FDP / Duty",        icon: <Timer size={12} /> },
    { id: "notices",  label: "Notices to Crews",  icon: <Bell size={12} /> },
    { id: "lops",     label: "LOPs Portal",       icon: <BookOpen size={12} /> },
    { id: "finance",  label: "Finance Portal",    icon: <Coins size={12} /> },
    { id: "leave",    label: "Leave",             icon: <CalendarCheck size={12} /> },
  ] as const;


  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Plane size={18} className="text-[#4F98A3]" />
            <h1 className="text-xl font-bold text-[#CDCCCA]" style={HF}>Senior Base Pilot Portal</h1>
          </div>
          <p className="text-sm text-[#797876] mt-0.5">
            Shift coverage · Missions · Engineering · Finance · Leave
          </p>
        </div>
        {/* Base selector */}
        <div className="flex gap-1.5 flex-wrap">
          {BASES.map(b => (
            <button key={b} onClick={() => setSelectedBase(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                b === selectedBase
                  ? "bg-[#4F98A3]/20 border-[#4F98A3]/40 text-[#4F98A3]"
                  : "bg-[#1C1B19] border-[#393836] text-[#797876] hover:text-[#CDCCCA] hover:border-[#4F98A3]/30"
              }`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* ── Weather strip ── */}
      <div className={`${CARD} px-4 py-3`}>
        <div className="flex items-center gap-2 mb-2">
          <CloudSun size={13} className="text-[#4F98A3]" />
          <span className="text-[10px] text-[#5A5957] uppercase tracking-wider font-semibold">
            {selectedBase} ({meta.icao}) · 7-Day Weather
          </span>
        </div>
        <WeatherStrip base={selectedBase} />
      </div>

      {/* ── Sub-base note (Bankstown only) ── */}
      {meta.subBases && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#4F98A3]/8 border border-[#4F98A3]/20 rounded-lg">
          <MapPin size={11} className="text-[#4F98A3] shrink-0" />
          <span className="text-[11px] text-[#797876]">
            <span className="text-[#CDCCCA] font-semibold">Bankstown</span> view includes reporting from: {meta.subBases.join(", ")}
            {" "}— same Base Manager, shared crew.
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 bg-[#1C1B19] border border-[#393836] rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === t.id ? "bg-[#393836] text-[#CDCCCA]" : "text-[#5A5957] hover:text-[#797876]"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-5">

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pilots On Duty",    val: basePilots.filter(p => p.week[TODAY_IDX] === 'ON').length,        color: "text-green-400", bg: "bg-green-500/8"   },
              { label: "Active Missions",   val: activeM.length,                                                    color: "text-[#4F98A3]", bg: "bg-[#4F98A3]/8"   },
              { label: "Pending Leave",     val: pendingLeaves.filter(l => ALL_PILOTS.some(p => p.name === l.name)).length, color: "text-amber-400", bg: "bg-amber-500/8"  },
              { label: "Engineer On Call",  val: onCallEng ? 1 : 0,                                                 color: "text-violet-400",bg: "bg-violet-500/8"  },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border border-[#393836] rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold ${s.color}`} style={HF}>{s.val}</div>
                <div className="text-[10px] text-[#5A5957] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Today's Pilot Coverage */}
            <div className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plane size={13} className="text-[#4F98A3]" />
                  <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>Today's Pilot Coverage</span>
                </div>
                <button onClick={() => setActiveTab("roster")} className="text-[10px] text-[#4F98A3] hover:underline flex items-center gap-0.5">
                  7-day view <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-1.5">
                {basePilots.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#171614]">
                    <div className="flex items-center gap-2">
                      <StatusDot status={p.dutyStatus} />
                      <div>
                        <div className="text-xs text-[#CDCCCA] font-medium">{p.name}</div>
                        <div className="text-[10px] text-[#797876]">{p.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!p.currency && <AlertTriangle size={11} className="text-amber-400" />}
                      <DayCodeBadge code={p.week[TODAY_IDX]} today />
                    </div>
                  </div>
                ))}
                {basePilots.length === 0 && <p className="text-xs text-[#5A5957] italic">No pilots at this base</p>}
              </div>
            </div>

            {/* Current Missions */}
            <div className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-[#4F98A3]" />
                  <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>Current Missions — {selectedBase}</span>
                </div>
                <button onClick={() => navigate("/missions")} className="text-[10px] text-[#4F98A3] hover:underline flex items-center gap-0.5">
                  Mission Board <ArrowUpRight size={10} />
                </button>
              </div>
              {baseMissions.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 size={22} className="text-green-400/40 mx-auto mb-1.5" />
                  <p className="text-xs text-[#5A5957]">No active missions at this base</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {baseMissions.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#171614]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#CDCCCA] font-mono">{m.callsign}</span>
                          <MissionStatusBadge status={m.status} />
                        </div>
                        <div className="text-[10px] text-[#797876] mt-0.5">{m.from} → {m.to} · {m.aircraft} · {m.pilot}</div>
                      </div>
                      <div className="text-[10px] text-[#5A5957]">ETD {m.etd}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ops on today */}
            <div className={`${CARD} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={13} className="text-[#4F98A3]" />
                <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>Ops Staff — Today</span>
              </div>
              <div className="space-y-1.5">
                {baseOps.filter(o => o.week[TODAY_IDX] === 'ON' || o.dutyStatus === 'Touring').map(o => (
                  <div key={o.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[#171614]">
                    <StatusDot status={o.dutyStatus} />
                    <div>
                      <div className="text-xs text-[#CDCCCA] font-medium">{o.name}</div>
                      <div className="text-[10px] text-[#797876]">{o.role}</div>
                    </div>
                  </div>
                ))}
                {baseOps.filter(o => o.week[TODAY_IDX] !== 'OFF').length === 0 &&
                  <p className="text-xs text-[#5A5957] italic">No ops staff on duty today</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-[#393836]">
                <div className="flex items-center gap-2">
                  <Wrench size={13} className="text-violet-400" />
                  <span className="text-xs font-semibold text-[#CDCCCA]">Engineer On Call</span>
                </div>
                {onCallEng ? (
                  <div className="flex items-center gap-2 mt-2 py-1.5 px-2.5 rounded-lg bg-violet-500/8 border border-violet-500/20">
                    <StatusDot status={onCallEng.dutyStatus} />
                    <div>
                      <div className="text-xs text-[#CDCCCA] font-medium">{onCallEng.name}</div>
                      <div className="text-[10px] text-[#797876]">{onCallEng.qualifications.join(", ")}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400 mt-2 italic">⚠ No on-call engineer identified — check Engineering page</p>
                )}
              </div>
            </div>

            {/* Leave summary */}
            <div className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={13} className="text-[#4F98A3]" />
                  <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>Pending Leave — All Pilots</span>
                </div>
                <button onClick={() => setActiveTab("leave")} className="text-[10px] text-[#4F98A3] hover:underline flex items-center gap-0.5">
                  All leave <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-1.5">
                {pendingLeaves.filter(l => ALL_PILOTS.some(p => p.name === l.name)).slice(0,4).map(l => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <div>
                      <div className="text-xs text-[#CDCCCA] font-medium">{l.name}</div>
                      <div className="text-[10px] text-[#797876]">{l.type} · {l.from}–{l.to} ({l.days}d)</div>
                    </div>
                    <LeaveStatusBadge status={l.status} />
                  </div>
                ))}
                {pendingLeaves.filter(l => ALL_PILOTS.some(p => p.name === l.name)).length === 0 &&
                  <p className="text-xs text-[#5A5957] italic">No pending leave applications</p>}
              </div>
            </div>
          </div>

          {/* Quick links to related pages */}
          <div className={`${CARD} p-4`}>
            <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-3">Quick Links to Existing Pages</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Crew Roster",      icon: <Calendar size={12} />,     path: "/roster",          desc: "Full 7-day roster all roles" },
                { label: "Duty & FRMS",      icon: <Timer size={12} />,        path: "/frms",            desc: "Hours, rest, fatigue scores" },
                { label: "Mission Board",    icon: <Activity size={12} />,     path: "/missions",        desc: "All active missions" },
                { label: "Check & Training", icon: <Shield size={12} />,       path: "/check-training",  desc: "Currency, endorsements, sims" },
                { label: "Engineering",      icon: <Wrench size={12} />,       path: "/engineering",     desc: "Fleet defects, MELs, WOs" },
                { label: "Payroll & Leave",  icon: <Coins size={12} />,        path: "/payroll-leave",   desc: "Full payroll & leave management" },
                { label: "The 8:45",         icon: <CloudSun size={12} />,     path: "/morning-brief",   desc: "Morning brief all bases" },
                { label: "Dispatch & Intake",icon: <ClipboardList size={12} />,path: "/dispatch",        desc: "Mission creation & dispatch" },
                { label: "Ops Tasks",        icon: <FileText size={12} />,     path: "/ops-tasks",       desc: "Submit crew requests to ops" },
              ].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#171614] border border-[#393836] hover:border-[#4F98A3]/30 transition-all text-left group">
                  <span className="text-[#4F98A3] mt-0.5 shrink-0">{link.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-[#CDCCCA] group-hover:text-white transition-colors">{link.label}</div>
                    <div className="text-[10px] text-[#5A5957] mt-0.5">{link.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ROSTER TAB ═══════════════ */}
      {activeTab === "roster" && (
        <div className={`${CARD} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#4F98A3]" />
                <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Pilot Shift Roster — {selectedBase}</h2>
              </div>
              <p className="text-[11px] text-[#5A5957] mt-0.5">Current week · Today highlighted · Links to full Crew Roster</p>
            </div>
            <button onClick={() => navigate("/roster")} className="flex items-center gap-1 text-xs text-[#4F98A3] hover:underline">
              Full roster <ArrowUpRight size={11} />
            </button>
          </div>
          <ShiftRosterPanel base={selectedBase} />

          {/* Ops & Engineering at-a-glance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#393836]">
            <div>
              <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-2">Ops Staff Today</div>
              {baseOps.filter(o => o.week[TODAY_IDX] === 'ON').map(o => (
                <div key={o.id} className="flex items-center gap-2 py-1">
                  <StatusDot status={o.dutyStatus} />
                  <span className="text-xs text-[#CDCCCA]">{o.name}</span>
                  <span className="text-[10px] text-[#797876]">· {o.role}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-2">Engineering On Call</div>
              {baseEngineers.map(e => (
                <div key={e.id} className="flex items-center gap-2 py-1">
                  <StatusDot status={e.dutyStatus} />
                  <span className="text-xs text-[#CDCCCA]">{e.name}</span>
                  <span className="text-[10px] text-[#797876]">· {e.role}</span>
                </div>
              ))}
              {baseEngineers.length === 0 && <p className="text-xs text-[#5A5957] italic">No engineer data for this base</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ FDP / DUTY TAB ═══════════════ */}
      {activeTab === "fdp" && (() => {
        const nowMins = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
        const baseFdp = fdpPilots.filter(p => p.base === selectedBase);
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-[#4F98A3]" />
                  <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>FDP Countdown — {selectedBase} Pilots On Duty</h2>
                </div>
                <p className="text-[11px] text-[#5A5957] mt-0.5">CAO 48.1 limits · RFDS EBA Cl 18 · Extensions require Ops or CP approval · All times AEST</p>
              </div>
              <button onClick={() => navigate("/frms")} className="flex items-center gap-1 text-xs text-[#4F98A3] hover:underline shrink-0">
                Duty &amp; FRMS <ArrowUpRight size={11} />
              </button>
            </div>

            {baseFdp.length === 0 && (
              <div className="text-center py-12">
                <Plane size={28} className="text-[#393836] mx-auto mb-3" />
                <p className="text-xs text-[#5A5957]">No pilots on duty at {selectedBase} today</p>
              </div>
            )}

            {baseFdp.map(pilot => {
              const [sh, sm] = pilot.startTime.split(":").map(Number);
              const startMins = sh * 60 + sm;
              const maxMins = (pilot.maxFDP * 60) + pilot.extensionMins;
              const elapsedMins = Math.max(0, nowMins - startMins);
              const remainMins = Math.max(0, maxMins - elapsedMins);
              const pct = Math.min(100, (elapsedMins / maxMins) * 100);
              const remainH = Math.floor(remainMins / 60);
              const remainM = remainMins % 60;
              const dueHH = Math.floor((startMins + maxMins) / 60) % 24;
              const dueMM = (startMins + maxMins) % 60;
              const dueStr = `${String(dueHH).padStart(2,'0')}:${String(dueMM).padStart(2,'0')}`;
              const isWarning3h = remainMins <= 180 && remainMins > 120;
              const isWarning2h = remainMins <= 120 && remainMins > 60;
              const isCritical = remainMins <= 60 && remainMins > 0;
              const isExpired = remainMins === 0;
              // Max CAO 48.1 extension = 2 hrs (s.48.1.12) when approved by Company
              const canExtend = !pilot.extended && !isExpired && remainMins < 120 && (role === "admin" || role === "senior_management" || role === "dispatcher");
              return (
                <div key={pilot.id} className={`${CARD} p-4`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plane size={13} className="text-[#4F98A3]" />
                        <span className="text-sm font-bold text-[#CDCCCA]" style={HF}>{pilot.name}</span>
                        <span className="text-[10px] font-mono text-[#797876]">{pilot.aircraft}</span>
                        {pilot.extended && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">EXTENDED +{pilot.extensionMins}m</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#5A5957] mt-0.5">FDP start: {pilot.startTime} · Max: {pilot.maxFDP}h{pilot.extensionMins > 0 ? ` + ${pilot.extensionMins}m ext` : ""} · Due off: {dueStr}</div>
                    </div>
                    <div className={`text-right shrink-0 ${isExpired ? "text-red-400" : isCritical ? "text-red-400" : isWarning2h ? "text-amber-400" : isWarning3h ? "text-yellow-400" : "text-green-400"}`}>
                      <div className="text-xl font-bold font-mono" style={HF}>
                        {isExpired ? "EXPIRED" : `${remainH}h ${String(remainM).padStart(2,'0')}m`}
                      </div>
                      <div className="text-[10px] opacity-70">remaining</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-[#171614] rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${isExpired ? "bg-red-500" : isCritical ? "bg-red-500" : isWarning2h ? "bg-amber-500" : isWarning3h ? "bg-yellow-500" : "bg-[#4F98A3]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Warning milestone markers */}
                  <div className="flex justify-between text-[9px] text-[#5A5957] mb-3 px-0.5">
                    <span>Start</span>
                    <span className={isWarning3h || isWarning2h || isCritical || isExpired ? "text-yellow-500 font-semibold" : ""}>3hr warn</span>
                    <span className={isWarning2h || isCritical || isExpired ? "text-amber-500 font-semibold" : ""}>2hr warn</span>
                    <span className={isCritical || isExpired ? "text-red-400 font-semibold" : ""}>1hr warn</span>
                    <span className={isExpired ? "text-red-400 font-semibold" : ""}>FDP end</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpired && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold"><AlertTriangle size={11} />FDP LIMIT REACHED — crew must be rested</span>
                      )}
                      {isCritical && !isExpired && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold"><AlertTriangle size={11} />1 HOUR WARNING — begin mission wind-down</span>
                      )}
                      {isWarning2h && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold"><AlertTriangle size={11} />2 HOUR WARNING — no new long missions</span>
                      )}
                      {isWarning3h && (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-400"><AlertTriangle size={11} />3 HOUR WARNING — plan for handover</span>
                      )}
                    </div>

                    {/* Extension button — only for ops/admin when within 2h of limit */}
                    {canExtend && (
                      <button
                        onClick={() => setFdpExtModal({ pilotId: pilot.id, reason: "" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                      >
                        <Clock size={11} /> Apply Extension (CAO 48.1.12)
                      </button>
                    )}
                  </div>

                  {/* Extension audit log */}
                  {pilot.extensionLog.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#393836] space-y-1">
                      <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-1">Extension Audit Log</div>
                      {pilot.extensionLog.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px]">
                          <span className="font-mono text-[#797876] shrink-0">{e.ts}</span>
                          <span className="text-[#CDCCCA]">Approved by <span className="font-semibold">{e.by}</span> — {e.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Extension modal */}
            {fdpExtModal && (() => {
              const target = fdpPilots.find(p => p.id === fdpExtModal.pilotId);
              if (!target) return null;
              const ts = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setFdpExtModal(null)}>
                  <div className={`${CARD} p-5 w-full max-w-md`} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={15} className="text-amber-400" />
                      <h3 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Apply FDP Extension — CAO 48.1.12</h3>
                    </div>
                    <div className="text-[11px] text-[#797876] mb-4 bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
                      <strong className="text-amber-400">RFDS EBA Cl 18 / CAO 48.1.12:</strong> Maximum extension is 2 hours (120 min) beyond the base FDP limit. Extension must be approved by the Company (Ops or Chief Pilot) and logged with reason and timestamp. Cannot be applied after FDP has expired.
                    </div>
                    <div className="mb-3">
                      <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Pilot</label>
                      <div className="text-sm font-semibold text-[#CDCCCA]">{target.name} · {target.aircraft}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Extension Amount</label>
                      <select
                        className="w-full text-xs bg-[#171614] border border-[#393836] rounded-lg px-3 py-2 text-[#CDCCCA] focus:outline-none"
                        value={60}
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes (1 hour)</option>
                        <option value={90}>90 minutes (1.5 hours)</option>
                        <option value={120}>120 minutes (2 hours — maximum)</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Reason for Extension *</label>
                      <textarea
                        value={fdpExtModal.reason}
                        onChange={e => setFdpExtModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                        placeholder="State operational reason (e.g. delayed return due to weather divert, patient stabilisation required)"
                        className="w-full text-xs bg-[#171614] border border-[#393836] rounded-lg px-3 py-2 text-[#CDCCCA] placeholder-[#5A5957] focus:outline-none min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFdpExtModal(null)}
                        className="flex-1 px-4 py-2 rounded-lg border border-[#393836] text-[#797876] text-xs font-semibold hover:text-[#CDCCCA] transition-colors"
                      >Cancel</button>
                      <button
                        disabled={!fdpExtModal.reason.trim()}
                        onClick={() => {
                          const extMins = 60;
                          setFdpPilots(prev => prev.map(p => p.id === fdpExtModal.pilotId ? {
                            ...p,
                            extended: true,
                            extensionMins: p.extensionMins + extMins,
                            extensionLog: [...p.extensionLog, {
                              ts: `${ts} AEST`,
                              by: role === "admin" ? "System Administrator" : role === "dispatcher" ? "Dispatcher" : "Operations",
                              reason: fdpExtModal.reason.trim(),
                            }]
                          } : p));
                          setFdpExtModal(null);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/30 transition-colors"
                      >Approve &amp; Log Extension</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Compliance note */}
            <div className="flex items-start gap-2 px-4 py-3 bg-[#1C1B19] border border-[#393836] rounded-xl">
              <Shield size={12} className="text-[#4F98A3] mt-0.5 shrink-0" />
              <div className="text-[10px] text-[#5A5957]">
                All extension approvals are time-stamped and stored in the audit log above. Records are retained for CASA audit purposes (CAO 48.1 / RFDS EBA Cl 18). Ops must notify the Chief Pilot when an extension is applied.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ NOTICES TO CREWS TAB ═══════════════ */}
      {activeTab === "notices" && (() => {
        const baseNotices = NOTICES_DATA.filter(n => n.base === selectedBase || n.base === "All");
        const priorityOrder = { "High": 0, "Normal": 1, "Info": 2 };
        const sorted = [...baseNotices].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-[#4F98A3]" />
                  <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Notices to Crews — {selectedBase}</h2>
                </div>
                <p className="text-[11px] text-[#5A5957] mt-0.5">Local notices for crews temporarily covering or visiting this base · All-bases notices always shown</p>
              </div>
              <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-[#393836]/60 text-[#797876] border border-[#393836]">
                {sorted.length} notice{sorted.length !== 1 ? "s" : ""}
              </span>
            </div>

            {sorted.map(n => {
              const isExpanded = expandedNotice === n.id;
              const pStyle: Record<string, string> = {
                High:   "bg-red-500/10 border-red-500/30 text-red-400",
                Normal: "bg-amber-500/10 border-amber-500/30 text-amber-400",
                Info:   "bg-[#4F98A3]/10 border-[#4F98A3]/30 text-[#4F98A3]",
              };
              const pDot: Record<string, string> = {
                High: "bg-red-400", Normal: "bg-amber-400", Info: "bg-[#4F98A3]",
              };
              return (
                <div key={n.id} className={`${CARD} overflow-hidden`}>
                  <button
                    className="w-full text-left p-4 flex items-start gap-3"
                    onClick={() => setExpandedNotice(isExpanded ? null : n.id)}
                  >
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${pDot[n.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${pStyle[n.priority]}`}>{n.priority.toUpperCase()}</span>
                        {n.base !== "All" && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#393836]/60 text-[#797876] border border-[#393836]">{n.base}</span>
                        )}
                        {n.base === "All" && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">All Bases</span>
                        )}
                        <span className="text-[10px] text-[#797876]">{n.date}</span>
                        {n.expiry && <span className="text-[9px] text-red-400/70">Expires {n.expiry}</span>}
                      </div>
                      <div className="text-xs font-semibold text-[#CDCCCA] mt-1" style={HF}>{n.title}</div>
                      {!isExpanded && (
                        <div className="text-[10px] text-[#5A5957] mt-0.5 truncate">{n.body}</div>
                      )}
                    </div>
                    <ChevronDown size={13} className={`text-[#5A5957] shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-[#171614] rounded-lg p-3">
                        <p className="text-xs text-[#CDCCCA] leading-relaxed">{n.body}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <User size={10} className="text-[#5A5957]" />
                        <span className="text-[10px] text-[#5A5957]">Issued by <span className="text-[#797876]">{n.author}</span> on {n.date}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sorted.length === 0 && (
              <div className="text-center py-12">
                <Bell size={26} className="text-[#393836] mx-auto mb-3" />
                <p className="text-xs text-[#5A5957]">No notices for {selectedBase}</p>
              </div>
            )}

            <div className="flex items-start gap-2 px-4 py-3 bg-[#1C1B19] border border-[#393836] rounded-xl">
              <Shield size={12} className="text-[#4F98A3] mt-0.5 shrink-0" />
              <div className="text-[10px] text-[#5A5957]">
                Notices are issued by Base Managers and the Chief Pilot. For urgent operational matters contact your Base Manager directly. High-priority notices must be read and acknowledged before flight.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ LOPs PORTAL TAB ═══════════════ */}
      {activeTab === "lops" && (() => {
        const baseLops = LOPS_DATA.filter(l => l.base === selectedBase || l.base === "All");
        const categories = ["All", ...Array.from(new Set(baseLops.map(l => l.category)))];
        const filtered = lopCategory === "All" ? baseLops : baseLops.filter(l => l.category === lopCategory);
        const statusStyle: Record<string, string> = {
          "Current":      "bg-green-500/15 text-green-400 border-green-500/30",
          "Under Review": "bg-amber-500/15 text-amber-400 border-amber-500/30",
          "Superseded":   "bg-red-500/15 text-red-400 border-red-500/30",
        };
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[#4F98A3]" />
                  <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Local Operating Procedures — {selectedBase}</h2>
                </div>
                <p className="text-[11px] text-[#5A5957] mt-0.5">LOPs applicable to this base · All-bases LOPs always shown · Full documents to be uploaded by Base Manager</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setLopCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                      lopCategory === cat
                        ? "bg-[#4F98A3]/20 border-[#4F98A3]/40 text-[#4F98A3]"
                        : "bg-[#1C1B19] border-[#393836] text-[#797876] hover:text-[#CDCCCA]"
                    }`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filtered.map(lop => (
                <div key={lop.id} className={`${CARD} p-4 flex items-start gap-4`}>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#171614] border border-[#393836] shrink-0">
                    <FolderOpen size={16} className="text-[#4F98A3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[9px] font-mono text-[#5A5957]">{lop.id}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${statusStyle[lop.status]}`}>{lop.status}</span>
                      {lop.base !== "All" && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#393836]/60 text-[#797876] border border-[#393836]">{lop.base}</span>
                      )}
                      {lop.base === "All" && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">All Bases</span>
                      )}
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#393836]/40 text-[#797876] border border-[#393836]">{lop.category}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#CDCCCA]" style={HF}>{lop.title}</div>
                    <div className="text-[10px] text-[#797876] mt-0.5">{lop.description}</div>
                    <div className="text-[9px] text-[#5A5957] mt-1">{lop.version} · Effective {lop.effective} · Owner: {lop.owner}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button className="flex items-center gap-1 text-[10px] text-[#4F98A3] hover:underline">
                      <ExternalLink size={10} /> Open
                    </button>
                    <button className="flex items-center gap-1 text-[10px] text-[#797876] hover:text-[#CDCCCA]">
                      <Edit3 size={10} /> Edit
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <BookOpen size={24} className="text-[#393836] mx-auto mb-2" />
                  <p className="text-xs text-[#5A5957]">No LOPs in this category for {selectedBase}</p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 px-4 py-3 bg-[#1C1B19] border border-[#393836] rounded-xl">
              <Lock size={12} className="text-[#4F98A3] mt-0.5 shrink-0" />
              <div className="text-[10px] text-[#5A5957]">
                LOPs are controlled documents. Full PDF versions will be linked by the Base Manager. To add, update, or supersede a procedure contact your Base Manager or the Chief Pilot. All changes require a version increment and review date.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ FINANCE TAB ═══════════════ */}
      {activeTab === "finance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-[#4F98A3]" />
                <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Finance & Account Reconciliation</h2>
              </div>
              <p className="text-[11px] text-[#5A5957] mt-0.5">Expense claims · Timesheet · Displayed roster — for your review</p>
            </div>
            <button onClick={() => navigate("/payroll-leave")} className="text-xs text-[#4F98A3] hover:underline flex items-center gap-1">
              Full payroll portal <ArrowUpRight size={11} />
            </button>
          </div>

          {/* Timesheet summary */}
          <div className={`${CARD} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer size={13} className="text-[#4F98A3]" />
                <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>My Timesheet — {MY_TIMESHEET.period}</span>
              </div>
              <ExpenseStatusBadge status={MY_TIMESHEET.status} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Ordinary Hours", val: `${MY_TIMESHEET.ordinary} hrs` },
                { label: "Overtime",       val: `${MY_TIMESHEET.overtime} hrs` },
                { label: "Allowances",     val: `$${MY_TIMESHEET.allowances}` },
              ].map(s => (
                <div key={s.label} className="bg-[#171614] rounded-lg px-3 py-2.5 text-center">
                  <div className="text-sm font-bold text-[#CDCCCA]" style={HF}>{s.val}</div>
                  <div className="text-[10px] text-[#5A5957] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-[#5A5957] uppercase tracking-wider">
                    <th className="text-left pb-2 font-normal">Date</th>
                    <th className="text-center pb-2 font-normal">Status</th>
                    <th className="text-center pb-2 font-normal">Duty Period</th>
                    <th className="text-right pb-2 font-normal">Hrs</th>
                    <th className="text-left pb-2 pl-3 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393836]/40">
                  {MY_TIMESHEET.entries.map(e => (
                    <tr key={e.date} className={e.type === 'OFF' ? 'opacity-40' : ''}>
                      <td className="py-1.5 text-[#797876]">{e.date}</td>
                      <td className="text-center py-1.5"><DayCodeBadge code={e.type as DayCode} today={e.date.includes("16")} /></td>
                      <td className="text-center py-1.5 text-[#CDCCCA] font-mono text-[10px]">{e.duty}</td>
                      <td className="text-right py-1.5 text-[#CDCCCA] font-medium">{e.hrs > 0 ? `${e.hrs}h` : "—"}</td>
                      <td className="text-left py-1.5 pl-3 text-[#797876] text-[10px]">{e.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense claims */}
          <div className={`${CARD} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ReceiptText size={13} className="text-[#4F98A3]" />
                <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>Expense Claims</span>
              </div>
              <button onClick={() => setShowExpenseForm(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#01696F]/15 border border-[#01696F]/30 text-[#4F98A3] text-xs font-semibold hover:bg-[#01696F]/25 transition-colors">
                <Plus size={11} /> New Claim
              </button>
            </div>
            <div className="space-y-1.5">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#171614]">
                  <div>
                    <div className="text-xs text-[#CDCCCA] font-medium">{e.desc}</div>
                    <div className="text-[10px] text-[#797876]">{e.id} · {e.category} · {e.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#CDCCCA]" style={HF}>${e.amount.toFixed(2)}</span>
                    <ExpenseStatusBadge status={e.status} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#393836] flex justify-between items-center">
              <span className="text-xs text-[#5A5957]">All prices AUD excl. GST</span>
              <span className="text-sm font-bold text-[#CDCCCA]" style={HF}>
                Total: ${expenses.reduce((a, e) => a + e.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Displayed roster */}
          <div className={`${CARD} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={13} className="text-[#4F98A3]" />
                <span className="text-xs font-semibold text-[#CDCCCA]" style={HF}>Displayed Roster — {selectedBase} Pilots</span>
              </div>
              <button onClick={() => navigate("/roster")} className="text-[10px] text-[#4F98A3] hover:underline flex items-center gap-0.5">
                Full roster <ArrowUpRight size={10} />
              </button>
            </div>
            <ShiftRosterPanel base={selectedBase} />
          </div>
        </div>
      )}

      {/* ═══════════════ LEAVE TAB ═══════════════ */}
      {activeTab === "leave" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck size={14} className="text-[#4F98A3]" />
                <h2 className="text-sm font-bold text-[#CDCCCA]" style={HF}>Leave Applications</h2>
              </div>
              <p className="text-[11px] text-[#5A5957] mt-0.5">Submit and track leave — approved leave flows to the Crew Roster</p>
            </div>
            <button onClick={() => setShowLeaveForm(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#4F98A3]/15 border border-[#4F98A3]/30 text-[#4F98A3] text-xs font-semibold hover:bg-[#4F98A3]/25 transition-colors">
              <Plus size={13} /> Apply for Leave
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pending",  val: leaves.filter(l=>l.status==="Pending").length,  cls: "text-amber-400", bg: "bg-amber-500/8" },
              { label: "Approved", val: leaves.filter(l=>l.status==="Approved").length, cls: "text-green-400", bg: "bg-green-500/8" },
              { label: "Declined", val: leaves.filter(l=>l.status==="Declined").length, cls: "text-red-400",   bg: "bg-red-500/8"   },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border border-[#393836] rounded-xl p-3 text-center`}>
                <div className={`text-xl font-bold ${s.cls}`} style={HF}>{s.val}</div>
                <div className="text-[10px] text-[#5A5957] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Leave list */}
          <div className={`${CARD} p-4 space-y-2`}>
            {leaves.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#171614] border border-[#393836]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#CDCCCA]">{l.name}</span>
                    <span className="text-[10px] text-[#797876]">· {l.base}</span>
                  </div>
                  <div className="text-[10px] text-[#797876] mt-0.5">
                    {l.type} · {l.from}–{l.to} · {l.days} day{l.days !== 1 ? "s" : ""}
                  </div>
                  <div className="text-[9px] text-[#5A5957] mt-0.5">Applied {l.applied}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <LeaveStatusBadge status={l.status} />
                  {l.status === "Pending" && (
                    <span className="text-[9px] text-[#5A5957]">Awaiting ops approval</span>
                  )}
                </div>
              </div>
            ))}
            {leaves.length === 0 && (
              <div className="text-center py-10">
                <Inbox size={24} className="text-[#393836] mx-auto mb-2" />
                <p className="text-xs text-[#5A5957]">No leave applications</p>
              </div>
            )}
          </div>

          {/* Portal note */}
          <div className="flex items-start gap-2 px-4 py-3 bg-[#4F98A3]/8 border border-[#4F98A3]/20 rounded-xl">
            <CheckCircle2 size={13} className="text-[#4F98A3] mt-0.5 shrink-0" />
            <div className="text-[11px] text-[#797876]">
              Approved leave is reflected in the{" "}
              <button onClick={() => navigate("/roster")} className="text-[#4F98A3] hover:underline">Crew Roster</button>
              {" "}and{" "}
              <button onClick={() => navigate("/payroll-leave")} className="text-[#4F98A3] hover:underline">Payroll & Leave portal</button>.
              Contact your Base Manager or HR to update an approved application.
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showExpenseForm && (
        <NewExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onAdd={e => setExpenses(prev => [e, ...prev])}
        />
      )}
      {showLeaveForm && (
        <NewLeaveForm
          onClose={() => setShowLeaveForm(false)}
          onAdd={l => setLeaves(prev => [l, ...prev])}
        />
      )}
    </div>
  );
}
