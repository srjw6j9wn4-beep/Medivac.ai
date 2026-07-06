import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import { FEATURES } from "@/lib/config";
import TechLogWidget from "@/components/TechLogWidget";
import {
  Clock, Plane, AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Radio, Truck, CloudRain, Calendar, MapPin, Users, Activity,
  AlertCircle, FileText, Clipboard, Wind, RefreshCw,
  Sun, Cloud, CloudDrizzle, CloudSnow, CloudLightning, Droplets,
  Thermometer, Navigation, CloudFog, Edit3, Save, X, ExternalLink,
  LayoutGrid, Table2, Plus, Trash2, Maximize, Minimize, Monitor
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

type CrewStatus = "green" | "offline";

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
  rego: string; status: "green" | "red"; location: string; mel?: string; bisDate?: string;
}
const DEFAULT_AIRCRAFT: Aircraft[] = [
  { rego: "VH-LTQ", status: "green", location: "Bankstown" },
  { rego: "VH-MQD", status: "green", location: "Launceston" },
  { rego: "VH-MQK", status: "green", location: "Essendon" },
  { rego: "VH-MVW", status: "green", location: "Dubbo" },
  { rego: "VH-MVX", status: "green", location: "Broken Hill", mel: "Cabin Alt Controller Exp 18/06" },
  { rego: "VH-MWH", status: "red",   location: "Toowoomba",   bisDate: "24/06/26" },
  { rego: "VH-MWK", status: "green", location: "Broken Hill", mel: "COM2 Exp 27/07 · Headset squeal" },
  { rego: "VH-NAJ", status: "green", location: "Essendon" },
  { rego: "VH-RFD", status: "green", location: "Launceston",  mel: "MEL active" },
  { rego: "VH-XYJ", status: "green", location: "Dubbo" },
  { rego: "VH-XYO", status: "green", location: "Broken Hill" },
  { rego: "VH-XYR", status: "green", location: "Broken Hill" },
  { rego: "VH-VPQ", status: "green", location: "Bankstown",   mel: "Window shades INOP Exp 25/08" },
  { rego: "VH-XYU", status: "green", location: "Dubbo",       mel: "VHF Exp 25/06" },
];

interface Notam { location: string; detail: string; active: boolean; today?: boolean; }
const DEFAULT_NOTAMS: Notam[] = [
  { location: "Broken Hill Airport", detail: "Apron Works — Old Apron closed (19/02 – Sept/Oct)", active: false },
  { location: "Flinders Island",     detail: "Runway Lighting Upgrade (27/04 – 22/06/26)", active: true },
  { location: "Dubbo Airport",       detail: "Runway closure 22:00–05:00 (15/06 – 20/06)", active: true, today: true },
];

interface FerryFlight { id: string; rego: string; route: string; date: string; crew: string; confirmed: boolean; }
const DEFAULT_FERRY: FerryFlight[] = [
  { id: "Ferry269", rego: "VH-NAJ", route: "ESS → BHI", date: "Today",  crew: "A Striffler", confirmed: true  },
  { id: "Ferry267", rego: "VH-LTQ", route: "BKK → DU",  date: "19/06",  crew: "TBC",          confirmed: false },
  { id: "Ferry268", rego: "VH-NAJ", route: "BHI → BKK", date: "19/06",  crew: "TBC",          confirmed: false },
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
      <span className={`text-[10px] font-bold ${status === "green" ? "text-green-400" : "text-zinc-500"}`}>{role}</span>
      <span className={`w-2.5 h-2.5 rounded-full ${status === "green" ? "bg-green-400" : "bg-zinc-600"}`} />
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
  return (
    <button
      onClick={next}
      className={`text-xs font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${colorMap[status] || "bg-zinc-700 border-zinc-500 text-zinc-400"}`}
      title="Click to cycle status"
    >
      {status}
    </button>
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

      <div className={presentMode ? "px-4 lg:px-8 pb-8 pt-4 space-y-5" : "contents"}>
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
          <div className="relative w-full" style={{ height: "720px" }}>
            <iframe
              src={SMARTSHEET_URL}
              className="w-full h-full border-0"
              title="Smartsheet Operations Board"
              loading="lazy"
              allowFullScreen
            />
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
                            onChange={v => setServices(prev => prev.map((s, i) => i === idx ? { ...s, status: v as Service["status"] } : s))} />
                        </td>
                        <td className="px-2">
                          {editMode ? (
                            <div className="flex items-center justify-center gap-1">
                              {(["pilot","doctor","nurse"] as const).map(crew => (
                                <StatusCycle key={crew} status={svc[crew]} editMode={editMode} options={["green","offline"]}
                                  onChange={v => setServices(prev => prev.map((s, i) => i === idx ? { ...s, [crew]: v as CrewStatus } : s))} />
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
                            <input className="bg-background/80 border border-cyan-500/40 rounded px-1 py-0.5 text-xs w-14 text-right focus:outline-none"
                              value={svc.updated}
                              onChange={e => setServices(prev => prev.map((s, i) => i === idx ? { ...s, updated: e.target.value } : s))} />
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
                      onClick={() => !editMode && setExpandedMel(expandedMel === ac.rego ? null : ac.rego)}>
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
                      {!editMode && (ac.mel || ac.bisDate) && (
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
                      </div>
                    )}
                    {!editMode && expandedMel === ac.rego && (ac.mel || ac.bisDate) && (
                      <div className="mx-2 mb-1.5 px-3 py-2 rounded-b-xl bg-amber-500/5 border-x border-b border-amber-500/20 text-sm">
                        {ac.mel && <p className="text-amber-300"><span className="font-semibold text-amber-400">MEL:</span> {ac.mel}</p>}
                        {ac.bisDate && <p className="text-red-300 mt-0.5"><span className="font-semibold text-red-400">Back in service:</span> {ac.bisDate}</p>}
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
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> AOG ({aircraft.filter(a => a.status === "red").length})</span>
              </div>
            </div>

            {/* ── Col 3: NOTAMs + Ferry + Clinics ── */}
            <div className="space-y-5">

              {/* NOTAMs */}
              <div className="bg-card border border-card-border rounded-2xl p-5">
                <SectionHeading label="Weather & Airport NOTAMs" icon={<CloudRain size={14} />} />
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
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-xs w-14 focus:outline-none" value={c.base}
                            onChange={e => setClinics(prev => prev.map((x,i) => i===idx ? {...x, base: e.target.value} : x))} />
                          <input className="bg-background/80 border border-cyan-500/40 rounded px-2 py-0.5 text-xs w-24 focus:outline-none" value={c.type}
                            onChange={e => setClinics(prev => prev.map((x,i) => i===idx ? {...x, type: e.target.value} : x))} />
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
      </div>{/* end present/normal content wrapper */}
    </div>
  );
}
