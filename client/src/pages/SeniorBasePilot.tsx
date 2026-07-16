import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Plane, Users, Calendar, Clock, AlertTriangle, CheckCircle2,
  Wrench, ChevronRight, ChevronLeft, ArrowUpRight, ReceiptText,
  ClipboardList, Timer, CalendarCheck, Wifi, WifiOff, MapPin,
  Shield, FileText, Coins, Send, Plus, X, CloudSun, CloudRain,
  Cloud, Sun, Wind, Thermometer, Zap, Activity, Inbox, User,
  RefreshCw, Lock, Building, Phone
} from "lucide-react";
import type { UserRole } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeatherDay { date: string; code: number; high: number; low: number; }
interface WeatherCurrent { temp: number; feels: number; wind: number; windDir: number; humidity: number; code: number; }
interface WeatherData { current: WeatherCurrent; daily: WeatherDay[]; locationName: string; }

// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD = "bg-[#1C1B19] border border-[#393836] rounded-xl";
const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };
const BASES = ["Dubbo", "Broken Hill", "Bankstown", "Essendon", "Launceston"] as const;
type Base = typeof BASES[number];

const BASE_META: Record<Base, { icao: string; lat: number; lon: number; tz: string; code: string }> = {
  "Dubbo":        { icao: "YSDU", lat: -32.2169, lon: 148.5740, tz: "Australia/Sydney",    code: "DU"  },
  "Broken Hill":  { icao: "YBHI", lat: -31.9920, lon: 141.4722, tz: "Australia/Sydney",    code: "BHI" },
  "Bankstown":    { icao: "YSBK", lat: -33.9244, lon: 150.9883, tz: "Australia/Sydney",    code: "BK"  },
  "Essendon":     { icao: "YMEN", lat: -37.7279, lon: 144.9018, tz: "Australia/Melbourne", code: "ESS" },
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
  { id: 'P10',name: 'F/O B. Kwan',          role: 'First Officer',  base: 'Essendon',    dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200','IFR'],                week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
];

const ALL_OPS: CrewMember[] = [
  { id: 'O1', name: 'Fiona Gallagher',  role: 'Base Manager',       base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['OPS','CASA','ISO'],           week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O2', name: 'Robert Chen',      role: 'Operations Manager',  base: 'Dubbo',       dutyStatus: 'Touring',  currency: true, qualifications: ['OPS','FRMS','Dispatch'],      week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O3', name: 'Angela Morris',    role: 'Base Manager',        base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true, qualifications: ['OPS','CASA'],                 week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O4', name: 'Sarah Blackwell',  role: 'Base Manager',        base: 'Launceston',  dutyStatus: 'On Duty',  currency: true, qualifications: ['OPS','CASA','TAS Amb'],       week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'O5', name: 'Dispatcher L. Yau',role: 'Flight Dispatcher',   base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['Dispatch','FRMS'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'O6', name: 'Dispatcher P. Singh',role:'Flight Dispatcher',  base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true, qualifications: ['Dispatch'],                   week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'O7', name: 'Dispatcher R. Evans',role:'Flight Dispatcher',  base: 'Bankstown',   dutyStatus: 'On Duty',  currency: true, qualifications: ['Dispatch','FRMS'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'O8', name: 'T. Stafford',      role: 'Dispatcher (On-Call)',base: 'Essendon',    dutyStatus: 'On Call',  currency: true, qualifications: ['Dispatch'],                   week: ['OFF','OFF','ON','ON','ON','ON','OFF'] },
];

const ALL_ENGINEERS: CrewMember[] = [
  { id: 'E1', name: 'Craig Holloway',   role: 'LAME — On Call', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['B200','B350','LAME','Avionics'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'E2', name: 'Darren Stubbs',    role: 'LAME',           base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['B200','B350','LAME'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'E3', name: 'Mia Kowalski',     role: 'LAME — On Call', base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true, qualifications: ['B200','LAME'],                   week: ['ON','ON','OFF','OFF','OFF','ON','ON'] },
  { id: 'E4', name: 'Paul Tran',        role: 'Maint. Controller',base:'Dubbo',       dutyStatus: 'On Duty',  currency: true, qualifications: ['Veryon','MEL','Planning'],       week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'E5', name: 'B. Martinez',      role: 'LAME — On Call', base: 'Bankstown',   dutyStatus: 'On Call',  currency: true, qualifications: ['B200','LAME'],                   week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'E6', name: 'J. Fitzgerald',    role: 'LAME — On Call', base: 'Essendon',    dutyStatus: 'On Call',  currency: true, qualifications: ['B200','B350','LAME'],            week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
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
  "Essendon":     [],
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
  const [activeTab, setActiveTab] = useState<"overview" | "roster" | "finance" | "leave">("overview");
  const [expenses, setExpenses] = useState(EXPENSE_DATA);
  const [leaves, setLeaves] = useState(LEAVE_DATA);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

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

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[#1C1B19] border border-[#393836] rounded-xl p-1 w-fit">
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
