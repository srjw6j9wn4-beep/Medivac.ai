import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import { FEATURES } from "@/lib/config";
import TechLogWidget from "@/components/TechLogWidget";
import {
  Clock, Plane, AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Radio, Truck, CloudRain, Calendar, MapPin, Users, Activity,
  AlertCircle, FileText, FileText as FileTextIcon, Clipboard, Wind, RefreshCw,
  Sun, Cloud, CloudDrizzle, CloudSnow, CloudLightning, Droplets,
  Thermometer, Navigation, CloudFog, Edit3, Save, X, ExternalLink,
  LayoutGrid, Table2, Plus, Trash2, Maximize, Minimize, Monitor,
  Mic, MicOff, Square, Copy, ChevronUp, UserPlus, Timer, Briefcase, PanelRight
} from "lucide-react";

interface Props { role: UserRole; }

// ── Weather types & helpers ────────────────────────────────────────────────

interface WeatherCurrent {
  temperature: number; feelsLike: number; windSpeed: number;
  windDir: number; humidity: number; code: number;
}
interface WeatherDay { date: string; code: number; high: number; low: number; }
interface WeatherHour { time: string; code: number; temp: number; windSpeed: number; windDir: number; precip: number; }
interface WeatherData { current: WeatherCurrent; daily: WeatherDay[]; hourly: WeatherHour[]; locationName: string; }

const BASES = [
  { id: "BHI",  name: "Broken Hill", lat: -31.9920, lon: 141.4722, tz: "Australia/Sydney" },
  { id: "DU",   name: "Dubbo",       lat: -32.2169, lon: 148.5740, tz: "Australia/Sydney" },
  { id: "BK",   name: "Bankstown",   lat: -33.9244, lon: 150.9883, tz: "Australia/Sydney" },
  { id: "ESS",  name: "Essendon",    lat: -37.7279, lon: 144.9018, tz: "Australia/Melbourne" },
  { id: "TAS",  name: "Launceston",  lat: -41.5450, lon: 147.2140, tz: "Australia/Hobart" },
];

function wmoLabel(code: number): string {
  if (code === 0)    return "Clear";
  if (code <= 3)     return "Partly Cloudy";
  if (code <= 48)    return "Foggy";
  if (code <= 57)    return "Drizzle";
  if (code <= 67)    return "Rain";
  if (code <= 77)    return "Snow";
  if (code <= 82)    return "Showers";
  if (code <= 86)    return "Snow Showers";
  return "Thunderstorm";
}
function WmoIcon({ code, size = 22, className = "" }: { code: number; size?: number; className?: string }) {
  const p = { size, className };
  if (code === 0)  return <Sun {...p} />;
  if (code <= 3)   return <Cloud {...p} />;
  if (code <= 48)  return <CloudFog {...p} />;
  if (code <= 57)  return <CloudDrizzle {...p} />;
  if (code <= 67)  return <CloudRain {...p} />;
  if (code <= 77)  return <CloudSnow {...p} />;
  if (code <= 82)  return <CloudRain {...p} />;
  if (code <= 86)  return <CloudSnow {...p} />;
  return <CloudLightning {...p} />;
}
function wmoIconColor(code: number): string {
  if (code === 0)  return "text-yellow-400";
  if (code <= 3)   return "text-sky-300";
  if (code <= 48)  return "text-zinc-400";
  if (code <= 67)  return "text-blue-400";
  if (code <= 77)  return "text-sky-200";
  if (code <= 82)  return "text-blue-400";
  if (code <= 86)  return "text-sky-200";
  return "text-amber-400";
}
function windDirLabel(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

const TEAMS_URL = "https://teams.microsoft.com/l/meetup-join/placeholder-update-with-real-link";
const SMARTSHEET_URL = "https://app.smartsheet.com/b/publish?EQBCT=50ddc199d8cc4df98cd9364d0a2e77e9";

// ── Default data ─────────────────────────────────────────────────────────────

type CrewStatus = "green" | "red" | "offline";

interface Service {
  code: string; status: "green" | "amber" | "offline";
  pilot: CrewStatus; doctor: CrewStatus; nurse: CrewStatus; updated: string;
}

const DEFAULT_SERVICES: Service[] = [
  { code: "BHI-AMB-D1",     status: "green",   pilot: "green",   doctor: "green",   nurse: "green",   updated: "08:02" },
  { code: "BHI-AMB-D2",     status: "green",   pilot: "green",   doctor: "green",   nurse: "green",   updated: "08:02" },
  { code: "BHI-AMB-N1",     status: "green",   pilot: "green",   doctor: "green",   nurse: "green",   updated: "08:04" },
  { code: "BHI-CLINIC-AIR", status: "green",   pilot: "green",   doctor: "green",   nurse: "green",   updated: "08:03" },
  { code: "BHI-CLINIC-RD",  status: "offline", pilot: "offline", doctor: "green",   nurse: "green",   updated: "08:03" },
  { code: "DU-AMB-D1",      status: "green",   pilot: "green",   doctor: "green",   nurse: "green",   updated: "08:05" },
  { code: "DU-AMB-N1",      status: "green",   pilot: "green",   doctor: "green",   nurse: "green",   updated: "08:05" },
  { code: "DU-NEPT",        status: "green",   pilot: "green",   doctor: "green",   nurse: "offline", updated: "08:06" },
  { code: "DU-CLINIC-AIR",  status: "green",   pilot: "green",   doctor: "offline", nurse: "offline", updated: "08:06" },
  { code: "DU-CLINIC-RD",   status: "offline", pilot: "offline", doctor: "offline", nurse: "offline", updated: "08:06" },
  { code: "BK-NEPT",        status: "green",   pilot: "green",   doctor: "green",   nurse: "offline", updated: "08:07" },
  { code: "BK-RAHS",        status: "offline", pilot: "offline", doctor: "offline", nurse: "offline", updated: "08:07" },
  { code: "ESS-D1",         status: "green",   pilot: "green",   doctor: "offline", nurse: "offline", updated: "08:08" },
  { code: "ESS-D2",         status: "green",   pilot: "green",   doctor: "offline", nurse: "offline", updated: "08:08" },
  { code: "TAS-D1",         status: "green",   pilot: "green",   doctor: "offline", nurse: "offline", updated: "08:09" },
  { code: "TAS-D2",         status: "green",   pilot: "green",   doctor: "offline", nurse: "offline", updated: "08:09" },
  { code: "TAS-N1",         status: "green",   pilot: "green",   doctor: "offline", nurse: "offline", updated: "08:09" },
];

interface Aircraft {
  rego: string;
  status: "green" | "red";
  location: string;
  mel?: string;
  melRestriction?: string;   // "Nil" | "Restriction — see tech log" | free text
  bisDate?: string;
  aogReason?: string;        // why it's AOG/U/S
  scheduledMaint?: string;   // e.g. "100hr due 28/07 @ YBHI"
}
const DEFAULT_AIRCRAFT: Aircraft[] = [
  { rego: "VH-LTQ", status: "green", location: "Bankstown" },
  { rego: "VH-MQD", status: "green", location: "Launceston" },
  { rego: "VH-MQK", status: "green", location: "Essendon" },
  { rego: "VH-MVW", status: "green", location: "Dubbo", scheduledMaint: "Phase check due 15/08 @ YSDU" },
  { rego: "VH-MVX", status: "green", location: "Broken Hill", mel: "Cabin Alt Controller Exp 18/06" },
  { rego: "VH-MWH", status: "red",   location: "Toowoomba",   bisDate: "24/06/26", aogReason: "Hydraulic system fault — LAME assessment pending" },
  { rego: "VH-MWK", status: "green", location: "Broken Hill", mel: "COM2 Exp 27/07 · Headset squeal" },
  { rego: "VH-NAJ", status: "green", location: "Essendon" },
  { rego: "VH-RFD", status: "green", location: "Launceston",  mel: "MEL active" },
  { rego: "VH-XYJ", status: "green", location: "Dubbo" },
  { rego: "VH-XYO", status: "green", location: "Broken Hill" },
  { rego: "VH-XYR", status: "green", location: "Broken Hill", scheduledMaint: "100hr due 28/07 @ YBHI" },
  { rego: "VH-VPQ", status: "green", location: "Bankstown",   mel: "Window shades INOP Exp 25/08" },
  { rego: "VH-XYU", status: "green", location: "Dubbo",       mel: "VHF Exp 25/06" },
];

interface Notam { location: string; detail: string; active: boolean; today?: boolean; }
const DEFAULT_NOTAMS: Notam[] = [
  { location: "Broken Hill Airport", detail: "Apron Works — Old Apron closed (19/02 – Sept/Oct)", active: false },
  { location: "Flinders Island",     detail: "Runway Lighting Upgrade (27/04 – 22/06/26)", active: true },
  { location: "Dubbo Airport",       detail: "Runway closure 22:00–05:00 (15/06 – 20/06)", active: true, today: true },
];

interface FerryFlight { id: string; rego: string; route: string; date: string; crew: string; confirmed: boolean; reason?: string; }
const DEFAULT_FERRY: FerryFlight[] = [
  { id: "Ferry269", rego: "VH-NAJ", route: "ESS → BHI", date: "Today",  crew: "A Striffler", confirmed: true,  reason: "Maintenance" },
  { id: "Ferry267", rego: "VH-LTQ", route: "BKK → DU",  date: "19/06",  crew: "TBC",          confirmed: false, reason: "Shift Coverage" },
  { id: "Ferry268", rego: "VH-NAJ", route: "BHI → BKK", date: "19/06",  crew: "TBC",          confirmed: false, reason: "Post Maintenance RTB" },
];

interface Clinic { name: string; base: string; type: string; }
const DEFAULT_CLINICS: Clinic[] = [
  { name: "Wilcannia",       base: "BHI", type: "Air Only" },
  { name: "Ivanhoe",         base: "BHI", type: "Air Only" },
  { name: "Menindee",        base: "BHI", type: "Road Only" },
  { name: "Lightning Ridge", base: "DU",  type: "Air Only" },
];

interface Vehicle {
  name: string; rego: string; location: string;
  vehicle: "green" | "amber" | "red";
  driver1: "green" | "offline"; driver2: "green" | "offline"; comment?: string;
}
const DEFAULT_VEHICLES: Vehicle[] = [
  { name: "BHI-NEPT-1", rego: "BBO60R", location: "Broken Hill", vehicle: "green", driver1: "green",   driver2: "green"   },
  { name: "BHI-NEPT-2", rego: "BBO61R", location: "Broken Hill", vehicle: "green", driver1: "green",   driver2: "offline" },
  { name: "DU-NEPT-1",  rego: "CDU22X", location: "Dubbo",        vehicle: "green", driver1: "green",   driver2: "green"   },
  { name: "DU-NEPT-2",  rego: "CDU23X", location: "Dubbo",        vehicle: "amber", driver1: "green",   driver2: "offline", comment: "Service due — booked Thurs" },
  { name: "ESS-NEPT-1", rego: "AES11V", location: "Essendon",     vehicle: "green", driver1: "green",   driver2: "green"   },
  { name: "ESS-NEPT-2", rego: "AES12V", location: "Essendon",     vehicle: "green", driver1: "green",   driver2: "green"   },
  { name: "TAS-NEPT-1", rego: "XK374E", location: "Launceston",   vehicle: "green", driver1: "green",   driver2: "offline" },
  { name: "TAS-NEPT-2", rego: "XK375E", location: "Launceston",   vehicle: "green", driver1: "green",   driver2: "green"   },
  { name: "BKK-NEPT-1", rego: "SBK88R", location: "Bankstown",    vehicle: "green", driver1: "green",   driver2: "green"   },
  { name: "BKK-NEPT-2", rego: "SBK89R", location: "Bankstown",    vehicle: "red",   driver1: "offline", driver2: "offline", comment: "Awaiting registration renewal" },
  { name: "MLD-NEPT-1", rego: "VMD11A", location: "Mildura",       vehicle: "green", driver1: "green",   driver2: "offline" },
  { name: "MLD-NEPT-2", rego: "VMD12A", location: "Mildura",       vehicle: "green", driver1: "green",   driver2: "green"   },
];

interface AgendaItem { num: number; title: string; duration: string; icon: React.ReactNode; }
const AGENDA: AgendaItem[] = [
  { num: 1, title: "OCC Status Review",           duration: "5 min", icon: <Activity size={16} /> },
  { num: 2, title: "Active Missions & Priorities", duration: "5 min", icon: <Radio size={16} /> },
  { num: 3, title: "Aircraft Issues & MELs",       duration: "5 min", icon: <Plane size={16} /> },
  { num: 4, title: "Crewing & Fatigue (FRMS)",     duration: "5 min", icon: <Users size={16} /> },
  { num: 5, title: "Weather & NOTAMs",             duration: "3 min", icon: <Wind size={16} /> },
  { num: 6, title: "Ferry Flights & Special Ops",  duration: "3 min", icon: <MapPin size={16} /> },
  { num: 7, title: "Road Transport Issues",        duration: "3 min", icon: <Truck size={16} /> },
  { num: 8, title: "Actions & Handover",           duration: "4 min", icon: <Clipboard size={16} /> },
];

// ── Executive Meeting types & defaults ─────────────────────────────────────

type AgendaStatus = "Pending" | "In Progress" | "Complete";

interface ExecAgendaItem {
  id: number;
  title: string;
  duration: string;
  presenter: string;
  notes: string;
  aiMinutes: string;
  status: AgendaStatus;
}

const DEFAULT_EXEC_AGENDA: ExecAgendaItem[] = [
  { id: 1,  title: "CEO / GM Report",                duration: "10 min", presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 2,  title: "Financial Performance Review",    duration: "10 min", presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 3,  title: "Clinical Governance Update",      duration: "10 min", presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 4,  title: "Operations & Safety Report",      duration: "10 min", presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 5,  title: "Fleet & Engineering Status",      duration: "5 min",  presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 6,  title: "HR & Workforce Report",           duration: "5 min",  presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 7,  title: "Regulatory & Compliance Update",  duration: "5 min",  presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 8,  title: "Strategic Initiatives",           duration: "10 min", presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 9,  title: "Board / Committee Items",         duration: "5 min",  presenter: "", notes: "", aiMinutes: "", status: "Pending" },
  { id: 10, title: "Actions & Next Steps",            duration: "5 min",  presenter: "", notes: "", aiMinutes: "", status: "Pending" },
];

interface Attendee { id: number; name: string; role: string; }
const DEFAULT_ATTENDEES: Attendee[] = [
  { id: 1, name: "", role: "CEO" },
  { id: 2, name: "", role: "GM" },
  { id: 3, name: "", role: "DON" },
  { id: 4, name: "", role: "CFO" },
];

type MeetingStatus = "Not Started" | "In Progress" | "Complete";

// ── Action Items Tracker types & defaults ─────────────────────────────────

type ActionStatus = "Open" | "In Progress" | "Complete";

interface ActionItem {
  id: number;
  description: string;
  owner: string;
  dueDate: string; // yyyy-mm-dd for <input type="date">
  status: ActionStatus;
}

const DEFAULT_ACTION_ITEMS: ActionItem[] = [];

let actionItemIdCounter = 1000;
function nextActionItemId() { return ++actionItemIdCounter; }

// Very simple heuristic parser — pulls lines that look like action items out of
// AI-generated minutes text (lines under an "Action Items" heading, or lines
// starting with a dash/bullet that mention an owner).
function parseActionItemsFromMinutes(minutesText: string): ActionItem[] {
  const lines = minutesText.split("\n").map(l => l.trim()).filter(Boolean);
  const items: ActionItem[] = [];
  let inActionSection = false;

  for (const line of lines) {
    if (/^#{0,3}\s*action items?/i.test(line)) { inActionSection = true; continue; }
    if (inActionSection && /^#{0,3}\s*(next meeting|key decisions|agenda items|attendees)/i.test(line)) {
      inActionSection = false;
      continue;
    }
    if (!inActionSection) continue;

    const bulletMatch = line.match(/^[-*\u2022]\s*(.+)/) || line.match(/^\d+[.)]\s*(.+)/);
    if (!bulletMatch) continue;
    let text = bulletMatch[1].trim();
    if (!text) continue;

    // Try to pull an owner, e.g. "(Owner: Jane Smith, Due: 2026-07-10)" or "- Jane Smith to do X by 10 July"
    let owner = "";
    let dueDate = "";
    const ownerDueMatch = text.match(/\(?\s*owner:?\s*([^,)]+)(?:,\s*due:?\s*([^)]+))?\)?/i);
    if (ownerDueMatch) {
      owner = ownerDueMatch[1].trim();
      if (ownerDueMatch[2]) dueDate = ownerDueMatch[2].trim();
      text = text.replace(ownerDueMatch[0], "").trim();
    }

    items.push({
      id: nextActionItemId(),
      description: text.replace(/\s{2,}/g, " ").trim(),
      owner,
      dueDate,
      status: "Open",
    });
  }

  return items;
}

// ── Helper components ──────────────────────────────────────────────────────

function StatusDot({ status, size = "sm" }: { status: "green" | "amber" | "red" | "offline"; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  const cls =
    status === "green"  ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" :
    status === "amber"  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" :
    status === "red"    ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]" :
    "bg-zinc-600";
  return <span className={`inline-block ${dim} rounded-full flex-shrink-0 ${cls}`} />;
}

function CrewDot({ role, status }: { role: "P" | "D" | "N"; status: CrewStatus }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className={`text-[10px] font-bold ${
        status === "green" ? "text-green-400" :
        status === "red"   ? "text-red-400" :
                             "text-zinc-500"
      }`}>{role}</span>
      <span className={`w-2.5 h-2.5 rounded-full ${
        status === "green" ? "bg-green-400" :
        status === "red"   ? "bg-red-400" :
                             "bg-zinc-600"
      }`} />
    </span>
  );
}

function SectionHeading({ label, icon, children }: { label: string; icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-cyan-400">{icon}</span>}
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        {label}
      </h2>
      <div className="flex-1 h-px bg-card-border" />
      {children}
    </div>
  );
}

function KpiPill({ label, value, color }: { label: string; value: string | number; color: "green" | "amber" | "red" | "cyan" | "blue" }) {
  const cls = {
    green: "bg-green-500/15 border-green-500/40 text-green-400",
    amber: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    red:   "bg-red-500/15   border-red-500/40   text-red-400",
    cyan:  "bg-cyan-500/15  border-cyan-500/40  text-cyan-400",
    blue:  "bg-blue-500/15  border-blue-500/40  text-blue-400",
  }[color];
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border ${cls} whitespace-nowrap`}>
      <span className="text-xl font-extrabold leading-none tabular-nums"
        style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{value}</span>
      <span className="text-xs font-semibold opacity-85 leading-tight">{label}</span>
    </div>
  );
}

function TeamsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Microsoft Teams">
      <rect width="24" height="24" rx="4" fill="#6264a7" fillOpacity="0.3" />
      <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="800" fill="#a5a6f6" fontFamily="sans-serif">T</text>
    </svg>
  );
}

// Inline editable field — shows plain text normally, input on edit mode
function EditableText({ value, onChange, editMode, placeholder }: {
  value: string; onChange: (v: string) => void; editMode: boolean; placeholder?: string;
}) {
  if (!editMode) return <span>{value || <span className="text-muted-foreground/40 italic">{placeholder}</span>}</span>;
  return (
    <input
      className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-sm text-foreground w-full focus:outline-none focus:border-cyan-400"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// Status cycle button — cycles through statuses on click in edit mode
function StatusCycle({ status, onChange, editMode, options }: {
  status: string; onChange: (v: string) => void; editMode: boolean; options: string[];
}) {
  if (!editMode) return <StatusDot status={status as "green" | "amber" | "red" | "offline"} />;
  const next = () => {
    const idx = options.indexOf(status);
    onChange(options[(idx + 1) % options.length]);
  };
  const colorMap: Record<string, string> = {
    green: "bg-green-500/20 border-green-500/50 text-green-400",
    amber: "bg-amber-500/20 border-amber-500/50 text-amber-400",
    red:   "bg-red-500/20   border-red-500/50   text-red-400",
    offline: "bg-zinc-700   border-zinc-500     text-zinc-400",
  };
  const labelMap: Record<string, string> = {
    green:   "Serviceable",
    red:     "Unserviceable",
    amber:   "Restricted",
    offline: "Offline",
  };
  return (
    <button
      onClick={next}
      className={`text-xs font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${colorMap[status] || "bg-zinc-700 border-zinc-500 text-zinc-400"}`}
      title="Click to cycle status"
    >
      {labelMap[status] ?? status}
    </button>
  );
}

// ── Executive Meeting View ──────────────────────────────────────────────────

interface ExecutiveMeetingViewProps {
  clock: Date;
  fmtDate: (d: Date) => string;
  fmtTime: (d: Date) => string;
  execAgenda: ExecAgendaItem[];
  setExecAgenda: React.Dispatch<React.SetStateAction<ExecAgendaItem[]>>;
  execExpanded: number[];
  toggleExecAgenda: (id: number) => void;
  attendees: Attendee[];
  setAttendees: React.Dispatch<React.SetStateAction<Attendee[]>>;
  execMeetingStatus: MeetingStatus;
  execElapsed: number;
  fmtElapsed: (s: number) => string;
  startExecMeeting: () => void;
  completeExecMeeting: () => void;
  resetExecMeeting: () => void;
  actionItems: ActionItem[];
  setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
  actionFilter: "All" | "Open" | "Complete";
  setActionFilter: React.Dispatch<React.SetStateAction<"All" | "Open" | "Complete">>;
}

function ExecutiveMeetingView({
  clock, fmtDate, fmtTime, execAgenda, setExecAgenda, execExpanded, toggleExecAgenda,
  attendees, setAttendees, execMeetingStatus, execElapsed, fmtElapsed,
  startExecMeeting, completeExecMeeting, resetExecMeeting,
  actionItems, setActionItems, actionFilter, setActionFilter,
}: ExecutiveMeetingViewProps) {

  const openActionsCount = actionItems.filter(a => a.status !== "Complete").length;

  const filteredActions = actionItems.filter(a => {
    if (actionFilter === "All") return true;
    if (actionFilter === "Open") return a.status !== "Complete";
    return a.status === "Complete";
  });

  function addActionItem() {
    setActionItems(prev => [...prev, { id: nextActionItemId(), description: "", owner: "", dueDate: "", status: "Open" }]);
  }
  function removeActionItem(id: number) {
    setActionItems(prev => prev.filter(a => a.id !== id));
  }
  function updateActionItem(id: number, patch: Partial<ActionItem>) {
    setActionItems(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }
  function cycleActionStatus(status: ActionStatus): ActionStatus {
    const order: ActionStatus[] = ["Open", "In Progress", "Complete"];
    return order[(order.indexOf(status) + 1) % order.length];
  }
  function exportActionsAsText() {
    const lines = actionItems.map((a, i) =>
      `${i + 1}. ${a.description || "(no description)"} — Owner: ${a.owner || "TBC"} — Due: ${a.dueDate || "TBC"} — Status: ${a.status}`
    );
    const text = `RFDS SE — Executive Meeting Action Items\n${fmtDate(clock)}\n\n` + lines.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    return text;
  }

  const statusChipCls: Record<ActionStatus, string> = {
    Open: "bg-zinc-700 border-zinc-500 text-zinc-300",
    "In Progress": "bg-amber-500/20 border-amber-500/50 text-amber-400",
    Complete: "bg-green-500/20 border-green-500/50 text-green-400",
  };

  const agendaStatusCls: Record<AgendaStatus, string> = {
    Pending: "bg-zinc-700 border-zinc-500 text-zinc-300",
    "In Progress": "bg-amber-500/20 border-amber-500/50 text-amber-400",
    Complete: "bg-green-500/20 border-green-500/50 text-green-400",
  };

  function cycleAgendaStatus(status: AgendaStatus): AgendaStatus {
    const order: AgendaStatus[] = ["Pending", "In Progress", "Complete"];
    return order[(order.indexOf(status) + 1) % order.length];
  }

  const meetingStatusCls: Record<MeetingStatus, string> = {
    "Not Started": "bg-zinc-700 border-zinc-500 text-zinc-300",
    "In Progress": "bg-amber-500/15 border-amber-500/40 text-amber-400",
    Complete: "bg-green-500/15 border-green-500/40 text-green-400",
  };

  return (
    <>
      {/* ══ EXEC HERO HEADER ══════════════════════════════════════════════════ */}
      <div className="bg-card border border-card-border rounded-2xl p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Briefcase size={26} className="text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Executive Operations Meeting</h1>
              <p className="text-base text-muted-foreground mt-0.5 font-medium">
                RFDS SE Section · {fmtDate(clock)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-5 py-3">
              <Clock size={20} className="text-cyan-400 flex-shrink-0" />
              <span className="text-2xl font-bold text-cyan-400 tabular-nums"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{fmtTime(clock)}</span>
            </div>
            <a href={TEAMS_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
              style={{ backgroundColor: "#6264a7", border: "1px solid #7b7ec7", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <TeamsIcon size={18} />
              Join Executive Meeting
            </a>
          </div>
        </div>

        {/* Meeting status bar */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-card-border">
          <span className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border ${meetingStatusCls[execMeetingStatus]}`}
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <Activity size={14} />
            {execMeetingStatus}
          </span>
          {execMeetingStatus === "In Progress" && (
            <span className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-background/50 border border-card-border text-foreground tabular-nums">
              <Timer size={14} className="text-cyan-400" />
              {fmtElapsed(execElapsed)}
            </span>
          )}
          <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Clipboard size={12} />
            {openActionsCount} open action{openActionsCount === 1 ? "" : "s"}
          </span>
          <div className="flex-1" />
          {execMeetingStatus === "Not Started" && (
            <button onClick={startExecMeeting}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 transition-colors">
              Start Meeting
            </button>
          )}
          {execMeetingStatus === "In Progress" && (
            <button onClick={completeExecMeeting}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 transition-colors">
              Mark Complete
            </button>
          )}
          {execMeetingStatus === "Complete" && (
            <button onClick={resetExecMeeting}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 border border-card-border text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ══ ATTENDEES ═══════════════════════════════════════════════════════ */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <SectionHeading label="Attendees" icon={<Users size={14} />}>
          <button
            onClick={() => setAttendees(prev => [...prev, { id: Date.now(), name: "", role: "" }])}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <UserPlus size={12} /> Add Attendee
          </button>
        </SectionHeading>
        <div className="flex flex-wrap gap-2">
          {attendees.map(a => (
            <div key={a.id} className="flex items-center gap-2 bg-background/50 border border-card-border rounded-xl px-3 py-2">
              <input
                className="bg-transparent text-sm font-semibold text-foreground w-32 focus:outline-none placeholder:text-muted-foreground/40"
                placeholder="Name"
                value={a.name}
                onChange={e => setAttendees(prev => prev.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
              />
              <input
                className="bg-cyan-500/10 border border-cyan-500/20 rounded px-2 py-0.5 text-xs font-semibold text-cyan-400 w-16 focus:outline-none placeholder:text-cyan-400/40"
                placeholder="Role"
                value={a.role}
                onChange={e => setAttendees(prev => prev.map(x => x.id === a.id ? { ...x, role: e.target.value } : x))}
              />
              <button onClick={() => setAttendees(prev => prev.filter(x => x.id !== a.id))}
                className="text-zinc-500 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ══ EXECUTIVE AGENDA ═══════════════════════════════════════════════ */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400"><Calendar size={14} /></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Agenda — Executive Operations Meeting</h2>
            <div className="w-20 h-px bg-card-border" />
          </div>
          <button
            onClick={() => setExecAgenda(prev => [...prev, {
              id: Date.now(), title: "New Agenda Item", duration: "5 min", presenter: "", notes: "", aiMinutes: "", status: "Pending",
            }])}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <Plus size={13} /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {execAgenda.map((item, idx) => {
            const isOpen = execExpanded.includes(item.id);
            return (
              <div key={item.id} className="border border-card-border rounded-xl overflow-hidden">
                <div className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left">
                  <button onClick={() => toggleExecAgenda(item.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <span className="text-sm font-bold text-cyan-400 w-5 flex-shrink-0">{idx + 1}.</span>
                    <input
                      className="flex-1 min-w-0 bg-transparent text-base font-semibold text-foreground focus:outline-none focus:bg-background/40 rounded px-1"
                      style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                      value={item.title}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setExecAgenda(prev => prev.map(x => x.id === item.id ? { ...x, title: e.target.value } : x))}
                    />
                  </button>
                  <input
                    className="bg-background/60 border border-card-border rounded px-2 py-0.5 text-xs w-16 text-center focus:outline-none focus:border-cyan-500/40"
                    value={item.duration}
                    onChange={e => setExecAgenda(prev => prev.map(x => x.id === item.id ? { ...x, duration: e.target.value } : x))}
                  />
                  <button
                    onClick={() => setExecAgenda(prev => prev.map(x => x.id === item.id ? { ...x, status: cycleAgendaStatus(x.status) } : x))}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${agendaStatusCls[item.status]}`}
                    title="Click to cycle status"
                  >
                    {item.status}
                  </button>
                  <button onClick={() => setExecAgenda(prev => prev.filter(x => x.id !== item.id))}
                    className="text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => toggleExecAgenda(item.id)} className="flex-shrink-0">
                    {isOpen ? <ChevronDown size={15} className="text-muted-foreground" /> : <ChevronRight size={15} className="text-muted-foreground" />}
                  </button>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 bg-background/30 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Presenter</label>
                      <input
                        className="w-full bg-background/60 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-500/40"
                        placeholder="Presenter name…"
                        value={item.presenter}
                        onChange={e => setExecAgenda(prev => prev.map(x => x.id === item.id ? { ...x, presenter: e.target.value } : x))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Notes / Talking Points</label>
                      <textarea
                        className="w-full min-h-[80px] bg-background/60 border border-card-border rounded-lg p-3 text-sm text-foreground resize-y placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                        placeholder="Pre-fill talking points before the meeting…"
                        value={item.notes}
                        onChange={e => setExecAgenda(prev => prev.map(x => x.id === item.id ? { ...x, notes: e.target.value } : x))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1 flex items-center gap-1.5">
                        <FileTextIcon size={11} /> AI-Captured Minutes
                      </label>
                      <textarea
                        className="w-full min-h-[70px] bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 text-sm text-foreground resize-y placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyan-500/40"
                        placeholder="Populated automatically from AI meeting minutes, or edit manually…"
                        value={item.aiMinutes}
                        onChange={e => setExecAgenda(prev => prev.map(x => x.id === item.id ? { ...x, aiMinutes: e.target.value } : x))}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ ACTION ITEMS TRACKER ═════════════════════════════════════════════ */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400"><Clipboard size={14} /></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Action Items Tracker</h2>
            <div className="w-12 h-px bg-card-border" />
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 whitespace-nowrap">
              {openActionsCount} open action{openActionsCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-1 bg-background/50 border border-card-border rounded-lg p-0.5">
              {(["All", "Open", "Complete"] as const).map(f => (
                <button key={f} onClick={() => setActionFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    actionFilter === f ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={exportActionsAsText}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-card-border text-muted-foreground hover:text-foreground transition-colors">
              <Copy size={12} /> Export
            </button>
            <button onClick={addActionItem}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
              <Plus size={13} /> Add Action
            </button>
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No action items yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground border-b border-card-border">
                  <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider w-8">#</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider">Action Description</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider w-40">Owner</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider w-40">Due Date</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider w-32">Status</th>
                  <th className="text-center py-2 pl-3 text-xs font-semibold uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filteredActions.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 text-sm text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 pr-3">
                      <input
                        className="w-full bg-background/60 border border-card-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-cyan-500/40"
                        placeholder="Describe the action…"
                        value={a.description}
                        onChange={e => updateActionItem(a.id, { description: e.target.value })}
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        className="w-full bg-background/60 border border-card-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-cyan-500/40"
                        placeholder="Owner…"
                        value={a.owner}
                        onChange={e => updateActionItem(a.id, { owner: e.target.value })}
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        className="w-full bg-background/60 border border-card-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-cyan-500/40"
                        value={a.dueDate}
                        onChange={e => updateActionItem(a.id, { dueDate: e.target.value })}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => updateActionItem(a.id, { status: cycleActionStatus(a.status) })}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${statusChipCls[a.status]}`}
                        title="Click to cycle status"
                      >
                        {a.status}
                      </button>
                    </td>
                    <td className="py-2.5 pl-3 text-center">
                      <button onClick={() => removeActionItem(a.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const CAN_EDIT_ROLES: UserRole[] = ["dispatcher", "senior_management", "admin", "safety"];
const CAN_PRESENT_ROLES: UserRole[] = ["dispatcher", "senior_management", "admin", "safety", "pilot"];

export default function MorningBrief({ role }: Props) {
  const qc = useQueryClient();
  const [clock, setClock]             = useState(() => new Date());
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [expandedAgenda, setExpandedAgenda] = useState<number[]>([]);
  const [agendaNotes, setAgendaNotes] = useState<Record<number, string>>({});
  const [expandedMel, setExpandedMel] = useState<string | null>(null);
  const [baseWeather, setBaseWeather]   = useState<Record<string, WeatherData | null>>({});
  const [baseWeatherLoading, setBaseWeatherLoading] = useState(true);
  const [activeBase, setActiveBase]     = useState("BHI");

  // Tab: "board" = live ops data, "smartsheet" = embedded Smartsheet
  const [activeTab, setActiveTab] = useState<"board" | "smartsheet">("board");

  // Meeting view: "daily" = The 8:45, "executive" = Executive Operations Meeting
  const [meetingView, setMeetingView] = useState<"daily" | "executive">("daily");

  // ── Executive meeting state ──
  const [execAgenda, setExecAgenda] = useState<ExecAgendaItem[]>(DEFAULT_EXEC_AGENDA);
  const [execExpanded, setExecExpanded] = useState<number[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>(DEFAULT_ATTENDEES);
  const [execMeetingStatus, setExecMeetingStatus] = useState<MeetingStatus>("Not Started");
  const [execMeetingStart, setExecMeetingStart] = useState<Date | null>(null);
  const [execElapsed, setExecElapsed] = useState(0);

  // ── AI minutes / recording state (shared by both meeting types) ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [generatedMinutes, setGeneratedMinutes] = useState("");
  const [minutesPanelOpen, setMinutesPanelOpen] = useState(true);
  const [minutesError, setMinutesError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [saveToAgendaId, setSaveToAgendaId] = useState<number | "">("");

  // ── Action Items Tracker state ──
  const [actionItems, setActionItems] = useState<ActionItem[]>(DEFAULT_ACTION_ITEMS);
  const [actionFilter, setActionFilter] = useState<"All" | "Open" | "Complete">("All");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Edit mode
  const [editMode, setEditMode]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState<string | null>(null);

  // Editable data state
  const [services,  setServices]  = useState<Service[]>(DEFAULT_SERVICES);
  const [aircraft,  setAircraft]  = useState<Aircraft[]>(DEFAULT_AIRCRAFT);
  const [notams,    setNotams]    = useState<Notam[]>(DEFAULT_NOTAMS);
  const [ferry,     setFerry]     = useState<FerryFlight[]>(DEFAULT_FERRY);
  const [clinics,   setClinics]   = useState<Clinic[]>(DEFAULT_CLINICS);
  const [vehicles,  setVehicles]  = useState<Vehicle[]>(DEFAULT_VEHICLES);

  const canEdit   = CAN_EDIT_ROLES.includes(role);
  const canPresent = CAN_PRESENT_ROLES.includes(role);

  // Presentation / fullscreen mode
  const [presentMode, setPresentMode] = useState(false);
  const [agendaSidePanel, setAgendaSidePanel] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presentRef = useRef<HTMLDivElement>(null);

  const enterPresentation = useCallback(async () => {
    setPresentMode(true);
    setControlsVisible(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* fullscreen not available — still enter present mode */ }
  }, []);

  const exitPresentation = useCallback(() => {
    setPresentMode(false);
    setControlsVisible(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Listen for Escape / browser fullscreen exit
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setPresentMode(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && presentMode) exitPresentation();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", onKey);
    };
  }, [presentMode, exitPresentation]);

  // Auto-hide controls after 3s of no mouse movement in present mode
  const handlePresentMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  // Today's date key
  const todayKey = new Date().toISOString().slice(0, 10);

  // Load persisted data for today on mount
  const dataKeys = ["services", "aircraft", "notams", "ferry", "clinics", "vehicles"] as const;
  const setters: Record<string, (v: unknown) => void> = {
    services: v => setServices(v as Service[]),
    aircraft: v => setAircraft(v as Aircraft[]),
    notams:   v => setNotams(v as Notam[]),
    ferry:    v => setFerry(v as FerryFlight[]),
    clinics:  v => setClinics(v as Clinic[]),
    vehicles: v => setVehicles(v as Vehicle[]),
  };

  useEffect(() => {
    dataKeys.forEach(async (key) => {
      try {
        const res = await apiRequest("GET", `/api/morning-brief/${todayKey}/${key}`);
        const data = await res.json();
        if (data.found && data.payload) setters[key](data.payload);
      } catch { /* use defaults */ }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  // Save all edited data to DB
  const handleSave = async () => {
    setSaving(true);
    const datasets: [string, unknown][] = [
      ["services", services], ["aircraft", aircraft], ["notams", notams],
      ["ferry", ferry], ["clinics", clinics], ["vehicles", vehicles],
    ];
    try {
      await Promise.all(datasets.map(([key, payload]) =>
        apiRequest("POST", `/api/morning-brief/${todayKey}/${key}`, { payload, updatedBy: role })
      ));
      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(null), 2500);
      setEditMode(false);
    } catch {
      setSaveMsg("Save failed — try again");
    } finally {
      setSaving(false);
    }
  };

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Weather — all 5 bases with hourly + 7-day
  const fetchAllBases = useCallback(() => {
    setBaseWeatherLoading(true);
    Promise.all(BASES.map(base => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${base.lat}&longitude=${base.lon}` +
        `&current=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,relative_humidity_2m,weather_code` +
        `&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability&forecast_hours=24` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(base.tz)}&forecast_days=7`;
      return fetch(url).then(r => r.json()).then(d => {
        const c = d.current;
        const nowH = new Date().getHours();
        const hourly: WeatherHour[] = (d.hourly.time as string[]).map((t: string, i: number) => ({
          time: t.slice(11, 16),
          code: d.hourly.weather_code[i],
          temp: Math.round(d.hourly.temperature_2m[i]),
          windSpeed: Math.round(d.hourly.wind_speed_10m[i]),
          windDir: d.hourly.wind_direction_10m[i],
          precip: d.hourly.precipitation_probability[i],
        })).filter((_: WeatherHour, i: number) => parseInt((d.hourly.time[i] as string).slice(11,13)) >= nowH).slice(0, 24);
        return {
          id: base.id,
          data: {
            locationName: base.name,
            hourly,
            current: {
              temperature: Math.round(c.temperature_2m), feelsLike: Math.round(c.apparent_temperature),
              windSpeed: Math.round(c.wind_speed_10m), windDir: c.wind_direction_10m,
              humidity: c.relative_humidity_2m, code: c.weather_code,
            },
            daily: (d.daily.time as string[]).map((date: string, i: number) => ({
              date, code: d.daily.weather_code[i],
              high: Math.round(d.daily.temperature_2m_max[i]),
              low:  Math.round(d.daily.temperature_2m_min[i]),
            })),
          } as WeatherData,
        };
      }).catch(() => ({ id: base.id, data: null }));
    })).then(results => {
      const map: Record<string, WeatherData | null> = {};
      results.forEach(r => { map[r.id] = r.data; });
      setBaseWeather(map);
      setBaseWeatherLoading(false);
    });
  }, []);

  useEffect(() => { fetchAllBases(); }, [fetchAllBases]);

  const handleRefresh = useCallback(() => {
    setRefreshSpin(true);
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshSpin(false), 700);
  }, []);

  const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function fmtDate(d: Date) { return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; }
  function fmtTime(d: Date) { return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")} AEST`; }
  function fmtRefreshed(d: Date) { return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} AEST`; }

  const onlineServices  = services.filter(s => s.status === "green").length;
  const restrictedSvcs  = services.filter(s => s.status === "amber").length;
  const offlineSvcs     = services.filter(s => s.status === "offline").length;
  const serviceableAc   = aircraft.filter(a => a.status === "green").length;
  const activeMissions  = 3;

  function toggleAgenda(num: number) {
    setExpandedAgenda(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  }

  function toggleExecAgenda(id: number) {
    setExecExpanded(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  }

  function fmtElapsed(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Executive meeting elapsed timer
  useEffect(() => {
    if (execMeetingStatus !== "In Progress" || !execMeetingStart) return;
    const id = setInterval(() => {
      setExecElapsed(Math.floor((Date.now() - execMeetingStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [execMeetingStatus, execMeetingStart]);

  function startExecMeeting() {
    setExecMeetingStatus("In Progress");
    setExecMeetingStart(new Date());
    setExecElapsed(0);
  }
  function completeExecMeeting() {
    setExecMeetingStatus("Complete");
  }
  function resetExecMeeting() {
    setExecMeetingStatus("Not Started");
    setExecMeetingStart(null);
    setExecElapsed(0);
  }

  // ── Recording / Web Speech / MediaRecorder handlers ─────────────────────

  const startRecording = useCallback(async () => {
    setMinutesError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();

      // Web Speech API — live transcription
      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-AU";
        recognition.onresult = (event: any) => {
          let finalText = "";
          let interimText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += transcriptPiece + " ";
            else interimText += transcriptPiece;
          }
          if (finalText) setLiveTranscript(prev => (prev ? prev + " " : "") + finalText.trim());
          setInterimTranscript(interimText);
        };
        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
        };
        recognition.onend = () => {
          // auto-restart while still recording (some browsers stop after silence)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try { recognition.start(); } catch { /* already started */ }
          }
        };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { /* ignore */ }
      }

      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setMinutesError("Microphone access denied or unavailable.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }

    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    setIsTranscribing(true);
    // Transcript is already captured live via Web Speech API — finalize it
    setTimeout(() => {
      setIsTranscribing(false);
      setShowTranscriptPanel(true);
    }, 600);
  }, []);

  const generateMinutes = useCallback(async (meetingType: "daily" | "executive") => {
    const transcript = (liveTranscript + " " + interimTranscript).trim();
    if (!transcript) {
      setMinutesError("No transcript to generate minutes from. Record or paste a transcript first.");
      return;
    }
    setIsGeneratingMinutes(true);
    setMinutesError(null);
    try {
      const res = await apiRequest("POST", "/api/minutes", { transcript, meetingType });
      const data = await res.json();
      setGeneratedMinutes(data.minutes || "");
      setMinutesPanelOpen(true);
    } catch (err) {
      console.error("Minutes generation failed:", err);
      setMinutesError("Failed to generate minutes. Please try again.");
    } finally {
      setIsGeneratingMinutes(false);
    }
  }, [liveTranscript, interimTranscript]);

  const copyMinutes = useCallback(() => {
    if (!generatedMinutes) return;
    navigator.clipboard.writeText(generatedMinutes).then(() => {
      setCopyMsg("Copied ✓");
      setTimeout(() => setCopyMsg(null), 2000);
    }).catch(() => {
      setCopyMsg("Copy failed");
      setTimeout(() => setCopyMsg(null), 2000);
    });
  }, [generatedMinutes]);

  const saveMinutesToAgenda = useCallback(() => {
    if (!generatedMinutes || saveToAgendaId === "") return;
    const id = Number(saveToAgendaId);
    setExecAgenda(prev => prev.map(item =>
      item.id === id ? { ...item, aiMinutes: (item.aiMinutes ? item.aiMinutes + "\n\n" : "") + generatedMinutes } : item
    ));
    setCopyMsg("Saved to agenda ✓");
    setTimeout(() => setCopyMsg(null), 2000);
  }, [generatedMinutes, saveToAgendaId]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* ignore */ } }
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={presentRef}
      onMouseMove={presentMode ? handlePresentMouseMove : undefined}
      className={presentMode
        ? "fixed inset-0 z-[9999] bg-background text-foreground overflow-y-auto"
        : "min-h-screen bg-background text-foreground p-4 lg:p-6 space-y-5"
      }
    >
      {/* ══ PRESENTATION FLOATING CONTROL BAR ═══════════════════════════════ */}
      {presentMode && (
        <div
          className={`sticky top-0 z-[10000] flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md border-b border-white/10 transition-all duration-500 ${
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
          }`}
        >
          {/* Branding */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Monitor size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Presentation Mode</span>
            <span className="text-xs text-white/40">· The 8:45 · RFDS SE Section</span>
          </div>

          {/* Live clock */}
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-1.5 ml-2">
            <Clock size={14} className="text-cyan-400" />
            <span className="text-base font-bold text-cyan-400 tabular-nums"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{fmtTime(clock)}</span>
          </div>

          <div className="flex-1" />

          {/* Teams join */}
          <a href={TEAMS_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm text-white"
            style={{ backgroundColor: "#6264a7", border: "1px solid #7b7ec7" }}>
            <TeamsIcon size={15} />
            Join The 8:45
          </a>

          {/* Agenda side panel toggle */}
          <button
            onClick={() => setAgendaSidePanel(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${agendaSidePanel ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}
            title="Toggle agenda side panel"
          >
            <PanelRight size={13} /> Agenda Panel
          </button>

          {/* Exit */}
          <button
            onClick={exitPresentation}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <Minimize size={14} />
            Exit Presentation
          </button>
        </div>
      )}

      <div className={presentMode ? "flex flex-row h-full overflow-hidden" : "contents"}>
      <div className={presentMode ? (agendaSidePanel ? "flex-1 overflow-y-auto px-4 lg:px-6 pb-8 pt-4 space-y-5" : "px-4 lg:px-8 pb-8 pt-4 space-y-5") : "contents"}>
      {/* ══ MEETING SELECTOR (top-level, above everything) ══════════════════ */}
      {!presentMode && (
        <div className="flex items-center gap-1 bg-card border border-card-border rounded-xl p-1 w-fit mb-5">
          <button
            onClick={() => setMeetingView("daily")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              meetingView === "daily"
                ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            <Radio size={15} />
            The 8:45
          </button>
          <button
            onClick={() => setMeetingView("executive")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              meetingView === "executive"
                ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            <Briefcase size={15} />
            Executive
          </button>
        </div>
      )}

      {meetingView === "daily" && (
      <>
      {/* ══ HERO HEADER ══════════════════════════════════════════════════════ */}
      <div className="bg-card border border-card-border rounded-2xl p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Radio size={26} className="text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>The 8:45</h1>
              <p className="text-base text-muted-foreground mt-0.5 font-medium">
                Daily Operations Brief · {fmtDate(clock)} · RFDS SE Section
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-5 py-3">
              <Clock size={20} className="text-cyan-400 flex-shrink-0" />
              <span className="text-2xl font-bold text-cyan-400 tabular-nums"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{fmtTime(clock)}</span>
            </div>
            <a href={TEAMS_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
              style={{ backgroundColor: "#6264a7", border: "1px solid #7b7ec7", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <TeamsIcon size={18} />
              Join The 8:45
            </a>
            {canPresent && !presentMode && (
              <button
                onClick={enterPresentation}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm border transition-all hover:opacity-90 active:scale-95 whitespace-nowrap bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                title="Enter full-screen presentation mode for screen sharing"
              >
                <Monitor size={18} />
                Present
              </button>
            )}
          </div>
        </div>

        {/* KPI pills + edit controls */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-card-border">
          <KpiPill label="Online Services"         value={onlineServices}                     color="green" />
          <KpiPill label="With Restrictions"       value={restrictedSvcs}                    color="amber" />
          <KpiPill label="Offline"                 value={offlineSvcs}                       color="red"   />
          <KpiPill label="Aircraft Serviceability" value={`${serviceableAc}/${aircraft.length}`} color="cyan" />
          <KpiPill label="Active Missions"         value={activeMissions}                    color="blue"  />
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              Last refreshed <span className="text-foreground font-semibold">{fmtRefreshed(lastRefreshed)}</span>
            </span>
            <button onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-card-border text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
              <RefreshCw size={13} className={`transition-transform duration-500 ${refreshSpin ? "rotate-[360deg]" : ""}`}
                style={{ transition: refreshSpin ? "transform 0.7s linear" : undefined }} />
              Refresh
            </button>

            {/* Edit mode controls (Dispatcher / Ops only) */}
            {canEdit && !editMode && (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors">
                <Edit3 size={13} />
                Edit Board
              </button>
            )}
            {canEdit && editMode && (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50">
                  <Save size={13} />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => { setEditMode(false); setSaveMsg(null); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-card-border text-muted-foreground hover:text-foreground transition-colors">
                  <X size={13} />
                  Cancel
                </button>
              </>
            )}
            {saveMsg && (
              <span className={`text-xs font-semibold ${saveMsg.includes("failed") ? "text-red-400" : "text-green-400"}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Edit3 size={14} className="text-amber-400 flex-shrink-0" />
            <span className="text-sm text-amber-300 font-medium">
              Edit Mode active — click status chips to cycle, update text fields directly. Changes are saved per-day to the database.
            </span>
          </div>
        )}
      </div>

      {/* ══ MULTI-BASE WEATHER ══════════════════════════════════════════════ */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-cyan-400"><Wind size={14} /></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Base Weather</h2>
            <div className="flex-1 h-px bg-card-border" />
            <button onClick={fetchAllBases} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
              <RefreshCw size={11} className={baseWeatherLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* Base selector tabs */}
          <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
            {BASES.map(base => {
              const bw = baseWeather[base.id];
              return (
                <button key={base.id} onClick={() => setActiveBase(base.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                    activeBase === base.id
                      ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                      : "bg-background/50 border-card-border text-muted-foreground hover:text-foreground hover:border-white/10"
                  }`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">{base.name}</span>
                  {bw ? (
                    <div className="flex items-center gap-1">
                      <span className={wmoIconColor(bw.current.code)}><WmoIcon code={bw.current.code} size={14} /></span>
                      <span className="text-sm font-extrabold tabular-nums">{bw.current.temperature}°</span>
                    </div>
                  ) : (
                    <span className="text-xs">{baseWeatherLoading ? "…" : "—"}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {baseWeatherLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-sm">Loading weather for all bases…</span>
            </div>
          )}

          {/* Selected base detail */}
          {!baseWeatherLoading && (() => {
            const bw = baseWeather[activeBase];
            if (!bw) return <div className="text-sm text-muted-foreground py-4 text-center">Weather unavailable</div>;
            return (
              <div className="space-y-4">
                {/* Current conditions */}
                <div className="flex items-center gap-5 bg-background/50 rounded-xl p-4 border border-card-border">
                  <div className={`flex-shrink-0 ${wmoIconColor(bw.current.code)}`}>
                    <WmoIcon code={bw.current.code} size={44} />
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold text-foreground leading-none tabular-nums"
                      style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{bw.current.temperature}°</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{wmoLabel(bw.current.code)}</div>
                  </div>
                  <div className="flex-1" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Thermometer size={13} className="text-orange-400 mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Feels</div>
                      <div className="text-sm font-bold tabular-nums">{bw.current.feelsLike}°</div>
                    </div>
                    <div>
                      <Navigation size={13} className="text-cyan-400 mx-auto mb-1"
                        style={{ transform: `rotate(${bw.current.windDir}deg)` }} />
                      <div className="text-xs text-muted-foreground">Wind</div>
                      <div className="text-sm font-bold tabular-nums">{bw.current.windSpeed} <span className="text-[10px] font-normal">km/h</span></div>
                      <div className="text-[10px] text-muted-foreground">{windDirLabel(bw.current.windDir)}</div>
                    </div>
                    <div>
                      <Droplets size={13} className="text-blue-400 mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Humidity</div>
                      <div className="text-sm font-bold tabular-nums">{bw.current.humidity}%</div>
                    </div>
                  </div>
                </div>

                {/* 24-hour bubble strip */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Next 24 Hours</div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {bw.hourly.map((h, i) => (
                      <div key={i} className={`flex-shrink-0 flex flex-col items-center gap-1.5 rounded-xl px-2.5 py-3 border ${
                        i === 0 ? "bg-cyan-500/10 border-cyan-500/25" : "bg-background/50 border-card-border"
                      }`} style={{ minWidth: 54 }}>
                        <span className={`text-[10px] font-bold ${i === 0 ? "text-cyan-400" : "text-muted-foreground"}`}>
                          {i === 0 ? "Now" : h.time}
                        </span>
                        <div className={wmoIconColor(h.code)}><WmoIcon code={h.code} size={18} /></div>
                        <span className="text-sm font-extrabold tabular-nums text-foreground">{h.temp}°</span>
                        {h.precip > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Droplets size={8} className="text-blue-400" />
                            <span className="text-[9px] text-blue-400 tabular-nums">{h.precip}%</span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5">
                          <Navigation size={8} className="text-muted-foreground"
                            style={{ transform: `rotate(${h.windDir}deg)` }} />
                          <span className="text-[9px] text-muted-foreground tabular-nums">{h.windSpeed}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-day overview */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">7-Day Outlook</div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {bw.daily.map((day, i) => {
                      const date = new Date(day.date + "T12:00:00");
                      const label = i === 0 ? "Today" : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getDay()];
                      return (
                        <div key={day.date} className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 border ${
                          i === 0 ? "bg-cyan-500/10 border-cyan-500/25" : "bg-background/50 border-card-border"
                        }`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            i === 0 ? "text-cyan-400" : "text-muted-foreground"
                          }`}>{label}</span>
                          <div className={wmoIconColor(day.code)}><WmoIcon code={day.code} size={20} /></div>
                          <span className="text-[9px] text-muted-foreground text-center leading-tight">{wmoLabel(day.code)}</span>
                          <span className="text-sm font-extrabold tabular-nums text-foreground">{day.high}°</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{day.low}°</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══ TAB BAR: Ops Board / Smartsheet ═════════════════════════════════ */}
      <div className="flex items-center gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "board"
              ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid size={15} />
          Live Ops Board
        </button>
        <button
          onClick={() => setActiveTab("smartsheet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "smartsheet"
              ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Table2 size={15} />
          Smartsheet Board
        </button>
        {activeTab === "smartsheet" && (
          <a href={SMARTSHEET_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
            title="Open in Smartsheet">
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* ══ SMARTSHEET EMBED ═════════════════════════════════════════════════ */}
      {activeTab === "smartsheet" && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-card-border">
            <div className="flex items-center gap-2">
              <Table2 size={14} className="text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Live Smartsheet Board</span>
            </div>
            <a href={SMARTSHEET_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
              <ExternalLink size={12} />
              Open in Smartsheet
            </a>
          </div>
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <LayoutGrid size={28} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Operations Board</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                This integrated board is designed to replace Smartsheet for day-to-day operations management — one less platform, everything in one place.
              </p>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Full board functionality is coming in the next release. All your task tracking, assignments, and progress reporting will live natively here.
            </p>
          </div>
        </div>
      )}

      {/* ══ MAIN 3-COLUMN GRID (live ops board) ═════════════════════════════ */}
      {activeTab === "board" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Col 1: Service & Crewing ── */}
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <SectionHeading label="Service & Crewing" icon={<Users size={14} />} />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground border-b border-card-border">
                      <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider">Service</th>
                      <th className="text-center px-2 text-xs font-semibold uppercase tracking-wider">Status</th>
                      <th className="text-center px-2 text-xs font-semibold uppercase tracking-wider">P · D · N</th>
                      <th className="text-right pl-2 text-xs font-semibold uppercase tracking-wider">Upd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {services.map((svc, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3">
                          {editMode ? (
                            <input
                              className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-sm font-semibold w-full focus:outline-none focus:border-cyan-400"
                              value={svc.code}
                              onChange={e => setServices(prev => prev.map((s, i) => i === idx ? { ...s, code: e.target.value } : s))}
                            />
                          ) : (
                            <span className={`text-sm font-semibold ${svc.status === "offline" ? "text-zinc-500" : "text-foreground"}`}
                              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{svc.code}</span>
                          )}
                        </td>
                        <td className="text-center px-2">
                          <StatusCycle status={svc.status} editMode={editMode} options={["green","amber","offline"]}
                            onChange={v => {
                              const now = new Date();
                              const hhmm = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
                              setServices(prev => prev.map((s, i) => i === idx ? { ...s, status: v as any, updated: hhmm } : s));
                            }} />
                        </td>
                        <td className="px-2">
                          {editMode ? (
                            <div className="flex items-center justify-center gap-1">
                              {(["pilot","doctor","nurse"] as const).map(crew => (
                                <StatusCycle key={crew} status={svc[crew]} editMode={editMode} options={["green","red","offline"]}
                                  onChange={v => {
                                    const now = new Date();
                                    const hhmm = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
                                    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [crew]: v as CrewStatus, updated: hhmm } : s));
                                  }} />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <CrewDot role="P" status={svc.pilot} />
                              <CrewDot role="D" status={svc.doctor} />
                              <CrewDot role="N" status={svc.nurse} />
                            </div>
                          )}
                        </td>
                        <td className="text-right pl-2 text-xs text-muted-foreground tabular-nums">
                          {editMode ? (
                            <span className="text-[10px] text-muted-foreground italic">auto</span>
                          ) : svc.updated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editMode && (
                <button onClick={() => setServices(prev => [...prev, { code: "NEW-SVC", status: "offline", pilot: "offline", doctor: "offline", nurse: "offline", updated: "—" }])}
                  className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Plus size={12} /> Add service row
                </button>
              )}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-card-border">
                {[["bg-green-400","Online"],["bg-amber-400","Restricted"],["bg-zinc-600","Offline"]].map(([dot,lbl]) => (
                  <span key={lbl} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />{lbl}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Col 2: Aircraft Serviceability ── */}
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <SectionHeading label="Aircraft Serviceability" icon={<Plane size={14} />} />
              <div className="space-y-1.5">
                {aircraft.map((ac, idx) => (
                  <div key={idx}>
                    <div className={`flex items-center gap-2.5 p-3 rounded-xl bg-background/50 ${!editMode ? "cursor-pointer hover:bg-white/[0.04]" : ""} transition-colors`}
                      onClick={() => !editMode && ((ac.mel || ac.bisDate || ac.scheduledMaint) ? setExpandedMel(expandedMel === ac.rego ? null : ac.rego) : undefined)}>
                      <StatusCycle status={ac.status} editMode={editMode} options={["green","red"]}
                        onChange={v => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, status: v as Aircraft["status"] } : a))} />
                      {editMode ? (
                        <input className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-sm font-bold w-24 focus:outline-none"
                          value={ac.rego}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, rego: e.target.value } : a))} />
                      ) : (
                        <span className="text-sm font-bold flex-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{ac.rego}</span>
                      )}
                      {editMode ? (
                        <input className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-xs w-28 focus:outline-none"
                          value={ac.location}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, location: e.target.value } : a))} />
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} />{ac.location}</span>
                      )}
                      {!editMode && ac.mel && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400">MEL</span>}
                      {!editMode && ac.bisDate && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/35 text-red-400">AOG</span>}
                      {!editMode && ac.scheduledMaint && ac.status === "green" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/35 text-blue-400">SCHED</span>
                      )}
                      {!editMode && (ac.mel || ac.bisDate || ac.scheduledMaint) && (
                        <ChevronDown size={13} className={`text-muted-foreground transition-transform ${expandedMel === ac.rego ? "rotate-180" : ""}`} />
                      )}
                      {editMode && (
                        <button onClick={() => setAircraft(prev => prev.filter((_,i) => i !== idx))}
                          className="ml-auto text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      )}
                    </div>
                    {editMode && (
                      <div className="mx-2 mb-1 px-3 py-2 rounded-b-xl bg-background/40 border-x border-b border-card-border space-y-1">
                        <input className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:border-cyan-500/40"
                          placeholder="MEL note (optional)" value={ac.mel || ""}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, mel: e.target.value || undefined } : a))} />
                        <input className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:border-cyan-500/40"
                          placeholder="BIS date (AOG, optional)" value={ac.bisDate || ""}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, bisDate: e.target.value || undefined } : a))} />
                        <input className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:border-cyan-500/40"
                          placeholder="AOG / U/S reason" value={ac.aogReason || ""}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, aogReason: e.target.value || undefined } : a))} />
                        <input className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:border-cyan-500/40"
                          placeholder="Scheduled maintenance (optional)" value={ac.scheduledMaint || ""}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, scheduledMaint: e.target.value || undefined } : a))} />
                        <select className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:border-cyan-500/40"
                          value={ac.melRestriction || ""}
                          onChange={e => setAircraft(prev => prev.map((a, i) => i === idx ? { ...a, melRestriction: e.target.value || undefined } : a))}>
                          <option value="">MEL restriction (optional)</option>
                          <option value="Restrictions Nil">Restrictions Nil</option>
                          <option value="Operational Restriction — see tech log">Operational Restriction — see tech log</option>
                        </select>
                      </div>
                    )}
                    {!editMode && expandedMel === ac.rego && (ac.mel || ac.bisDate || ac.scheduledMaint) && (
                      <div className="mx-2 mb-1.5 px-3 py-2 rounded-b-xl bg-amber-500/5 border-x border-b border-amber-500/20 text-sm">
                        {ac.mel && <p className="text-amber-300"><span className="font-semibold text-amber-400">MEL:</span> {ac.mel}</p>}
                        {ac.bisDate && <p className="text-red-300 mt-0.5"><span className="font-semibold text-red-400">Back in service:</span> {ac.bisDate}</p>}
                        {ac.aogReason && (
                          <p className="text-red-300 mt-1"><span className="font-semibold text-red-400">Reason:</span> {ac.aogReason}</p>
                        )}
                        {ac.scheduledMaint && (
                          <p className="text-blue-300 mt-1"><span className="font-semibold text-blue-400">Scheduled Maint:</span> {ac.scheduledMaint}</p>
                        )}
                        {ac.mel && ac.melRestriction && (
                          <p className={`mt-1 ${ac.melRestriction.startsWith("Operational") ? "text-amber-300" : "text-green-300"}`}>
                            <span className="font-semibold">MEL Restriction:</span>{" "}
                            {ac.melRestriction.startsWith("Operational") ? (
                              <a
                                href={`#/tech-log?search=${encodeURIComponent(ac.rego)}`}
                                onClick={e => { e.stopPropagation(); }}
                                className="underline cursor-pointer hover:text-amber-200 transition-colors"
                                title="View in tech log"
                              >{ac.melRestriction}</a>
                            ) : ac.melRestriction}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editMode && (
                <button onClick={() => setAircraft(prev => [...prev, { rego: "VH-NEW", status: "green", location: "" }])}
                  className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Plus size={12} /> Add aircraft
                </button>
              )}
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-card-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Serviceable ({aircraft.filter(a => a.status === "green").length})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Unserviceable / AOG ({aircraft.filter(a => a.status === "red").length})</span>
              </div>
            </div>

            {/* ── Col 3: NOTAMs + Ferry + Clinics ── */}
            <div className="space-y-5">

              {/* NOTAMs */}
              <div className="bg-card border border-card-border rounded-2xl p-5">
                <SectionHeading label="Weather & Airport NOTAMs" icon={<CloudRain size={14} />} />
                <p className="text-[10px] text-muted-foreground/60 italic mb-1">Manually entered — check AIP/Naips for current NOTAMs</p>
                <div className="space-y-2.5">
                  {notams.map((n, idx) => (
                    <div key={idx} className={`flex gap-3 p-3 rounded-xl border ${
                      n.today  ? "bg-red-500/5 border-red-500/25" :
                      n.active ? "bg-amber-500/5 border-amber-500/20" :
                                 "bg-background/40 border-card-border"
                    }`}>
                      <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${
                        n.today ? "text-red-400" : n.active ? "text-amber-400" : "text-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        {editMode ? (
                          <div className="space-y-1">
                            <input className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-sm font-semibold w-full focus:outline-none"
                              value={n.location}
                              onChange={e => setNotams(prev => prev.map((x, i) => i === idx ? { ...x, location: e.target.value } : x))} />
                            <input className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none"
                              value={n.detail}
                              onChange={e => setNotams(prev => prev.map((x, i) => i === idx ? { ...x, detail: e.target.value } : x))} />
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                                <input type="checkbox" checked={n.active}
                                  onChange={e => setNotams(prev => prev.map((x, i) => i === idx ? { ...x, active: e.target.checked } : x))} />
                                Active
                              </label>
                              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                                <input type="checkbox" checked={!!n.today}
                                  onChange={e => setNotams(prev => prev.map((x, i) => i === idx ? { ...x, today: e.target.checked } : x))} />
                                Today
                              </label>
                              <button onClick={() => setNotams(prev => prev.filter((_,i) => i !== idx))}
                                className="ml-auto text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-foreground">{n.location}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.detail}</p>
                            {n.today  && <span className="text-xs font-bold text-red-400 uppercase tracking-wider">⚠ Active Today</span>}
                            {n.active && !n.today && <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">⚠ Active</span>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {editMode && (
                  <button onClick={() => setNotams(prev => [...prev, { location: "New Airport", detail: "NOTAM detail", active: false }])}
                    className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Plus size={12} /> Add NOTAM
                  </button>
                )}
              </div>

              {/* Ferry Flights */}
              <div className="bg-card border border-card-border rounded-2xl p-5">
                <SectionHeading label="Ferry Flights Today" icon={<Plane size={14} />} />
                <div className="space-y-2">
                  {ferry.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-background/50 overflow-hidden min-w-0">
                      {editMode ? (
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0 items-center">
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs w-20 focus:outline-none" value={f.id}
                            onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, id: e.target.value} : x))} />
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs w-20 focus:outline-none" value={f.rego}
                            onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, rego: e.target.value} : x))} />
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs w-24 focus:outline-none" value={f.route}
                            onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, route: e.target.value} : x))} />
                          <select className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                            value={f.reason || ""}
                            onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, reason: e.target.value||undefined} : x))}>
                            <option value="">Reason</option>
                            <option value="Shift Coverage">Shift Coverage</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Post Maintenance RTB">Post Maintenance RTB</option>
                          </select>
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs w-16 focus:outline-none" value={f.date}
                            onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, date: e.target.value} : x))} />
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs w-28 focus:outline-none" value={f.crew}
                            onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, crew: e.target.value} : x))} />
                          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={f.confirmed}
                              onChange={e => setFerry(prev => prev.map((x,i) => i===idx ? {...x, confirmed: e.target.checked} : x))} />
                            Confirmed
                          </label>
                          <button onClick={() => setFerry(prev => prev.filter((_,i) => i!==idx))}
                            className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-cyan-400 w-16 flex-shrink-0 truncate"
                            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{f.id}</span>
                          <span className="text-sm font-semibold w-14 flex-shrink-0 truncate">{f.rego}</span>
                          <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">{f.route}</span>
                          {f.reason && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground border border-card-border">{f.reason}</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            f.date === "Today" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "text-muted-foreground"
                          }`}>{f.date}</span>
                          <span className="text-xs text-muted-foreground w-24 text-right flex-shrink-0 truncate" title={f.crew}>{f.crew}</span>
                          {f.confirmed
                            ? <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                            : <Clock size={15} className="text-amber-400 flex-shrink-0" />
                          }
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {editMode && (
                  <button onClick={() => setFerry(prev => [...prev, { id: "Ferry000", rego: "VH-XXX", route: "— → —", date: "TBC", crew: "TBC", confirmed: false }])}
                    className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Plus size={12} /> Add ferry flight
                  </button>
                )}
              </div>

              {/* Tech & Journey Log widget — feature flag gated */}
              {FEATURES.TECH_LOG && <TechLogWidget />}

              {/* Clinics */}
              <div className="bg-card border border-card-border rounded-2xl p-5">
                <SectionHeading label="Clinics Today" icon={<Activity size={14} />} />
                <div className="space-y-2">
                  {clinics.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background/50">
                      <StatusDot status="green" />
                      {editMode ? (
                        <>
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-sm font-semibold flex-1 focus:outline-none" value={c.name}
                            onChange={e => setClinics(prev => prev.map((x,i) => i===idx ? {...x, name: e.target.value} : x))} />
                          <select className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                            value={c.base}
                            onChange={e => setClinics(prev => prev.map((x,i) => i===idx ? {...x, base: e.target.value} : x))}>
                            <option value="BHI">BHI — Broken Hill</option>
                            <option value="DU">DU — Dubbo</option>
                            <option value="BK">BK — Bankstown</option>
                            <option value="ESS">ESS — Essendon</option>
                            <option value="TAS">TAS — Launceston</option>
                            <option value="MLD">MLD — Mildura</option>
                          </select>
                          <select className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                            value={c.type}
                            onChange={e => setClinics(prev => prev.map((x,i) => i===idx ? {...x, type: e.target.value} : x))}>
                            <option value="Air Only">Air Only</option>
                            <option value="Road Only">Road Only</option>
                            <option value="Air & Road">Air & Road</option>
                          </select>
                          <button onClick={() => setClinics(prev => prev.filter((_,i) => i!==idx))}
                            className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-semibold flex-1">{c.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">{c.base}</span>
                          <span className="text-xs text-muted-foreground">{c.type}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {editMode && (
                  <button onClick={() => setClinics(prev => [...prev, { name: "New Clinic", base: "DU", type: "Air Only" }])}
                    className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Plus size={12} /> Add clinic
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══ ROAD TRANSPORT (NEPT) ══════════════════════════════════════════ */}
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <SectionHeading label="Road Transport — NEPT Fleet" icon={<Truck size={14} />} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-muted-foreground border-b border-card-border">
                    {["Unit","Rego","Location","Vehicle","D1","D2","Notes",""].map((h, i) => (
                      <th key={i} className={`py-2.5 text-xs font-semibold uppercase tracking-wider ${
                        i < 3 ? "text-left pr-4" : i < 6 ? "text-center px-3" : "text-left pl-3"
                      }`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {vehicles.map((v, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-4">
                        {editMode ? <input className="bg-background/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-sm font-bold w-28 focus:outline-none" value={v.name}
                          onChange={e => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, name: e.target.value} : x))} />
                          : <span className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{v.name}</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {editMode ? <input className="bg-background/80 border border-card-border rounded px-1.5 py-0.5 text-sm w-20 focus:outline-none" value={v.rego}
                          onChange={e => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, rego: e.target.value} : x))} />
                          : <span className="text-sm text-muted-foreground">{v.rego}</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {editMode ? <input className="bg-background/80 border border-card-border rounded px-1.5 py-0.5 text-sm w-28 focus:outline-none" value={v.location}
                          onChange={e => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, location: e.target.value} : x))} />
                          : <span className="text-sm text-muted-foreground">{v.location}</span>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusCycle status={v.vehicle} editMode={editMode} options={["green","amber","red"]}
                          onChange={val => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, vehicle: val as Vehicle["vehicle"]} : x))} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusCycle status={v.driver1} editMode={editMode} options={["green","offline"]}
                          onChange={val => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, driver1: val as "green"|"offline"} : x))} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusCycle status={v.driver2} editMode={editMode} options={["green","offline"]}
                          onChange={val => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, driver2: val as "green"|"offline"} : x))} />
                      </td>
                      <td className="py-3 pl-3">
                        {editMode ? (
                          <input className="bg-background/80 border border-card-border rounded px-2 py-0.5 text-xs w-full focus:outline-none" value={v.comment || ""}
                            placeholder="Notes…"
                            onChange={e => setVehicles(prev => prev.map((x,i) => i===idx ? {...x, comment: e.target.value || undefined} : x))} />
                        ) : v.comment ? (
                          <span className="flex items-center gap-1.5 text-xs text-amber-400">
                            <AlertTriangle size={12} />{v.comment}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pl-2 text-center">
                        {editMode && (
                          <button onClick={() => setVehicles(prev => prev.filter((_,i) => i!==idx))}
                            className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {editMode && (
              <button onClick={() => setVehicles(prev => [...prev, { name: "NEW-NEPT", rego: "", location: "", vehicle: "green", driver1: "offline", driver2: "offline" }])}
                className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                <Plus size={12} /> Add vehicle
              </button>
            )}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-card-border">
              {[["bg-green-400","Online"],["bg-amber-400","Restricted"],["bg-red-400","Unserviceable"]].map(([dot,lbl]) => (
                <span key={lbl} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />{lbl}
                </span>
              ))}
            </div>
          </div>

          {/* ══ MEETING AGENDA ════════════════════════════════════════════════ */}
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400"><Calendar size={14} /></span>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Meeting Agenda — The 8:45</h2>
                <div className="w-20 h-px bg-card-border" />
              </div>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                onClick={() => {
                  const lines = AGENDA.map(a => {
                    const note = agendaNotes[a.num] || "";
                    return `${a.num}. ${a.title} (${a.duration})${note ? "\n   Notes: " + note : ""}`;
                  });
                  const summary = `RFDS SE — The 8:45 Daily Ops Meeting Record\n${fmtDate(clock)}\n\n` + lines.join("\n\n");
                  const blob = new Blob([summary], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url; anchor.download = `The845_Record_${new Date().toISOString().slice(0,10)}.txt`;
                  anchor.click(); URL.revokeObjectURL(url);
                }}
              >
                <FileText size={13} />
                Meeting Record
              </button>
            </div>
            <div className="space-y-2">
              {AGENDA.map(item => {
                const isOpen = expandedAgenda.includes(item.num);
                return (
                  <div key={item.num} className="border border-card-border rounded-xl overflow-hidden">
                    <button onClick={() => toggleAgenda(item.num)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left">
                      <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        {item.icon}
                      </span>
                      <span className="text-sm font-bold text-cyan-400 w-5 flex-shrink-0">{item.num}.</span>
                      <span className="flex-1 text-base font-semibold text-foreground"
                        style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{item.title}</span>
                      <span className="text-sm text-muted-foreground mr-2">{item.duration}</span>
                      {isOpen ? <ChevronDown size={15} className="text-muted-foreground" /> : <ChevronRight size={15} className="text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 bg-background/30">
                        <textarea
                          className="w-full min-h-[80px] bg-background/60 border border-card-border rounded-lg p-3 text-sm text-foreground resize-y placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                          placeholder="Type meeting notes here…"
                          value={agendaNotes[item.num] || ""}
                          onChange={e => setAgendaNotes(prev => ({ ...prev, [item.num]: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      </>
      )}

      {meetingView === "executive" && (
        <ExecutiveMeetingView
          clock={clock}
          fmtDate={fmtDate}
          fmtTime={fmtTime}
          execAgenda={execAgenda}
          setExecAgenda={setExecAgenda}
          execExpanded={execExpanded}
          toggleExecAgenda={toggleExecAgenda}
          attendees={attendees}
          setAttendees={setAttendees}
          execMeetingStatus={execMeetingStatus}
          execElapsed={execElapsed}
          fmtElapsed={fmtElapsed}
          startExecMeeting={startExecMeeting}
          completeExecMeeting={completeExecMeeting}
          resetExecMeeting={resetExecMeeting}
          actionItems={actionItems}
          setActionItems={setActionItems}
          actionFilter={actionFilter}
          setActionFilter={setActionFilter}
        />
      )}

      {/* ══ FLOATING RECORDING TOOLBAR (both meeting types) ═══════════════════════════════════ */}
      {!presentMode && (
        <div className="fixed bottom-6 right-6 z-[9000] flex flex-col items-end gap-3">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-full shadow-2xl transition-all active:scale-95 bg-red-500 text-white animate-pulse"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="font-bold text-sm tabular-nums">REC {fmtElapsed(recordSeconds)}</span>
              <span className="flex items-center gap-1.5 text-sm font-bold border-l border-white/30 pl-3">
                <Square size={14} />
                Stop Recording
              </span>
            </button>
          ) : isTranscribing ? (
            <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl bg-card border border-cyan-500/40 text-cyan-400">
              <RefreshCw size={16} className="animate-spin" />
              <span className="font-bold text-sm">Transcribing…</span>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl transition-all hover:opacity-90 active:scale-95 bg-background border-2 border-cyan-400 text-cyan-400"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              <Mic size={18} />
              <span className="font-bold text-sm">Record Meeting</span>
            </button>
          )}

          {minutesError && (
            <div className="max-w-xs px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-semibold shadow-xl">
              {minutesError}
            </div>
          )}
        </div>
      )}

      {/* ══ TRANSCRIPT / MINUTES MODAL PANEL ════════════════════════════════════════════ */}
      {(showTranscriptPanel || isRecording) && !presentMode && (
        <div className="fixed inset-0 z-[9500] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => { if (!isRecording) setShowTranscriptPanel(false); }}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-card-border rounded-2xl p-5 lg:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileTextIcon size={16} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  Meeting Transcript
                </h2>
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 ml-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    Live transcript
                  </span>
                )}
              </div>
              {!isRecording && (
                <button onClick={() => setShowTranscriptPanel(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>

            <textarea
              className="w-full min-h-[160px] bg-background/60 border border-card-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
              placeholder="Transcript will appear here as you speak — you can also paste or edit manually…"
              value={liveTranscript}
              onChange={e => setLiveTranscript(e.target.value)}
            />
            {interimTranscript && (
              <p className="text-sm text-muted-foreground/60 italic mt-1 px-1">{interimTranscript}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={() => generateMinutes(meetingView)}
                disabled={isGeneratingMinutes || !liveTranscript.trim()}
                className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 transition-colors disabled:opacity-40"
              >
                {isGeneratingMinutes ? <RefreshCw size={14} className="animate-spin" /> : <FileTextIcon size={14} />}
                {isGeneratingMinutes ? "Generating…" : "Generate Minutes"}
              </button>
              {!isRecording && (
                <button onClick={() => setShowTranscriptPanel(false)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-white/5 border border-card-border text-muted-foreground hover:text-foreground transition-colors">
                  Close
                </button>
              )}
            </div>

            {/* Generated minutes panel */}
            {generatedMinutes && (
              <div className="mt-5 border border-cyan-500/25 rounded-xl overflow-hidden">
                <button
                  onClick={() => setMinutesPanelOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/15 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    <FileTextIcon size={14} />
                    AI-Generated Minutes
                  </span>
                  {minutesPanelOpen ? <ChevronUp size={15} className="text-cyan-400" /> : <ChevronDown size={15} className="text-cyan-400" />}
                </button>
                {minutesPanelOpen && (
                  <div className="p-4 bg-background/40 space-y-3">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{generatedMinutes}</pre>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-card-border">
                      <button onClick={copyMinutes}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-card-border text-muted-foreground hover:text-foreground transition-colors">
                        <Copy size={12} /> Copy to Clipboard
                      </button>
                      {meetingView === "executive" && (
                        <>
                          <select
                            value={saveToAgendaId}
                            onChange={e => setSaveToAgendaId(e.target.value ? Number(e.target.value) : "")}
                            className="text-xs bg-background/80 border border-card-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-cyan-500/40"
                          >
                            <option value="">Save to agenda item…</option>
                            {execAgenda.map(item => (
                              <option key={item.id} value={item.id}>{item.id}. {item.title}</option>
                            ))}
                          </select>
                          <button onClick={saveMinutesToAgenda} disabled={saveToAgendaId === ""}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-40">
                            <Save size={12} /> Save to Agenda
                          </button>
                          <button onClick={() => {
                            const parsed = parseActionItemsFromMinutes(generatedMinutes);
                            if (parsed.length > 0) {
                              setActionItems(prev => [...prev, ...parsed]);
                              setCopyMsg(`Added ${parsed.length} action item${parsed.length > 1 ? "s" : ""} ✓`);
                              setTimeout(() => setCopyMsg(null), 2500);
                            } else {
                              setCopyMsg("No action items detected");
                              setTimeout(() => setCopyMsg(null), 2500);
                            }
                          }}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-colors">
                            <Clipboard size={12} /> Add Actions to Tracker
                          </button>
                        </>
                      )}
                      {copyMsg && <span className="text-xs font-semibold text-green-400">{copyMsg}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>{/* end present/normal content wrapper */}

      {/* Agenda side panel — only in present mode */}
      {presentMode && agendaSidePanel && (
        <div className="w-72 shrink-0 border-l border-white/10 bg-black/40 backdrop-blur-md overflow-y-auto px-4 py-5 space-y-3">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Agenda</p>
          {AGENDA.map(item => (
            <div key={item.num} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold text-white/40 w-4 shrink-0 mt-0.5">{item.num}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/90 leading-snug">{item.title}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{item.duration}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>{/* end flex row wrapper */}
    </div>
  );
}
