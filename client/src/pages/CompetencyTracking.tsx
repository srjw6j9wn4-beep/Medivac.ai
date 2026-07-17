import { useState, useMemo } from "react";
import {
  Search, User, CheckCircle2, AlertTriangle, XCircle, Minus, Award,
  Calendar, BarChart3, Plus, GraduationCap, Stethoscope, ShieldCheck,
  Users2,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type Tab = "register" | "matrix" | "ce";
type CredStatus = "current" | "expiring" | "lapsed" | "na";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  base: string;
  current: number;
  expiring: number;
  expired: number;
  lastCheck: string;
  ceHours: number;
}

const CREW: CrewMember[] = [
  { id: "c1", name: "Capt. Sarah Mitchell", role: "Pilot in Command", base: "Dubbo", current: 9, expiring: 1, expired: 0, lastCheck: "Check Ride — 14 May 2026", ceHours: 38.5 },
  { id: "c2", name: "Capt. David Walsh", role: "Pilot in Command", base: "Dubbo", current: 8, expiring: 1, expired: 1, lastCheck: "Check Ride — 02 Feb 2026", ceHours: 29.0 },
  { id: "c3", name: "F/O Emma Watkins", role: "First Officer", base: "Broken Hill", current: 9, expiring: 1, expired: 0, lastCheck: "Check Ride — 28 Apr 2026", ceHours: 41.5 },
  { id: "c4", name: "Michael Chen RN", role: "Flight Nurse", base: "Dubbo", current: 9, expiring: 0, expired: 0, lastCheck: "Clinical Review — 10 Jun 2026", ceHours: 44.0 },
  { id: "c5", name: "Priya Nair RN", role: "Flight Nurse", base: "Broken Hill", current: 8, expiring: 1, expired: 0, lastCheck: "Clinical Review — 22 May 2026", ceHours: 33.5 },
  { id: "c6", name: "Rebecca Ford RN", role: "Flight Nurse", base: "Dubbo", current: 9, expiring: 0, expired: 0, lastCheck: "Clinical Review — 15 Jun 2026", ceHours: 27.0 },
  { id: "c7", name: "Tom Reynolds", role: "LAME — Aircraft Engineer", base: "Dubbo", current: 7, expiring: 1, expired: 0, lastCheck: "Competency Assessment — 05 Mar 2026", ceHours: 22.5 },
  { id: "c8", name: "Grace O'Sullivan", role: "LAME — Aircraft Engineer", base: "Broken Hill", current: 8, expiring: 0, expired: 0, lastCheck: "Competency Assessment — 18 Apr 2026", ceHours: 31.0 },
];

const CREDENTIAL_TYPES = [
  "ATPL/CPL", "B200 Type Rating", "B350 Type Rating", "IFR", "NVG",
  "HUET", "First Aid", "CASA Medical Class 1", "Dangerous Goods", "CRM",
];

interface MatrixCell {
  status: CredStatus;
  date?: string;
}

const MATRIX: Record<string, MatrixCell[]> = {
  "Capt. Sarah Mitchell":  [{status:"current"},{status:"current"},{status:"current"},{status:"current"},{status:"current"},{status:"current"},{status:"current"},{status:"expiring",date:"14 Aug 2026"},{status:"current"},{status:"current"}],
  "Capt. David Walsh":     [{status:"current"},{status:"current"},{status:"current"},{status:"current"},{status:"lapsed",date:"lapsed 01 Jul 2026"},{status:"current"},{status:"current"},{status:"expiring",date:"05 Aug 2026"},{status:"current"},{status:"current"}],
  "F/O Emma Watkins":      [{status:"current"},{status:"current"},{status:"na"},{status:"current"},{status:"current"},{status:"current"},{status:"current"},{status:"expiring",date:"22 Aug 2026"},{status:"current"},{status:"current"}],
  "Michael Chen RN":       [{status:"na"},{status:"na"},{status:"na"},{status:"na"},{status:"na"},{status:"current"},{status:"current"},{status:"na"},{status:"current"},{status:"current"}],
  "Priya Nair RN":         [{status:"na"},{status:"na"},{status:"na"},{status:"na"},{status:"na"},{status:"current"},{status:"expiring",date:"09 Aug 2026"},{status:"na"},{status:"current"},{status:"current"}],
  "Rebecca Ford RN":       [{status:"na"},{status:"na"},{status:"na"},{status:"na"},{status:"na"},{status:"current"},{status:"current"},{status:"na"},{status:"current"},{status:"current"}],
  "Tom Reynolds":          [{status:"na"},{status:"current"},{status:"current"},{status:"na"},{status:"na"},{status:"current"},{status:"current"},{status:"na"},{status:"expiring",date:"30 Jul 2026"},{status:"current"}],
  "Grace O'Sullivan":      [{status:"na"},{status:"current"},{status:"current"},{status:"na"},{status:"na"},{status:"current"},{status:"current"},{status:"na"},{status:"current"},{status:"current"}],
};

interface CEBreakdown {
  name: string;
  hours: number;
  clinical: number;
  aviation: number;
  safety: number;
  leadership: number;
  dueDate: string;
}

const CE_DATA: CEBreakdown[] = [
  { name: "Capt. Sarah Mitchell", hours: 38.5, clinical: 4, aviation: 22, safety: 8, leadership: 4.5, dueDate: "30 Jun 2027" },
  { name: "Capt. David Walsh", hours: 29.0, clinical: 2, aviation: 18, safety: 7, leadership: 2, dueDate: "30 Jun 2027" },
  { name: "F/O Emma Watkins", hours: 41.5, clinical: 3, aviation: 26, safety: 9.5, leadership: 3, dueDate: "30 Jun 2027" },
  { name: "Michael Chen RN", hours: 44.0, clinical: 30, aviation: 4, safety: 7, leadership: 3, dueDate: "30 Jun 2027" },
  { name: "Priya Nair RN", hours: 33.5, clinical: 24, aviation: 3, safety: 5, leadership: 1.5, dueDate: "30 Jun 2027" },
  { name: "Rebecca Ford RN", hours: 27.0, clinical: 19, aviation: 2, safety: 4, leadership: 2, dueDate: "30 Jun 2027" },
  { name: "Tom Reynolds", hours: 22.5, clinical: 1, aviation: 15, safety: 5, leadership: 1.5, dueDate: "30 Jun 2027" },
  { name: "Grace O'Sullivan", hours: 31.0, clinical: 1, aviation: 21, safety: 6, leadership: 3, dueDate: "30 Jun 2027" },
];

const CE_LOGS = [
  { crew: "Capt. Sarah Mitchell", date: "12 Jun 2026", hours: 4, category: "Aviation", provider: "CASA Flight Standards", desc: "Annual IFR proficiency refresher" },
  { crew: "Michael Chen RN", date: "05 Jun 2026", hours: 6, category: "Clinical", provider: "ACCCN", desc: "Critical care retrieval nursing workshop" },
  { crew: "Tom Reynolds", date: "18 May 2026", hours: 3, category: "Safety", provider: "RFDS Safety & Quality", desc: "SMS refresher and hazard reporting" },
];

function CredIcon({ status }: { status: CredStatus }) {
  if (status === "current") return <CheckCircle2 size={14} className="text-green-400" />;
  if (status === "expiring") return <AlertTriangle size={14} className="text-amber-400" />;
  if (status === "lapsed") return <XCircle size={14} className="text-red-400" />;
  return <Minus size={14} className="text-[#5A5957]" />;
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
      <div className="text-xs text-[#797876] mb-1">{label}</div>
      <div className={`text-xl font-bold ${color ?? "text-[#CDCCCA]"}`} style={HF}>{value}</div>
    </div>
  );
}

const roleIcon = (role: string) => {
  if (role.includes("Pilot") || role.includes("Officer")) return <User size={16} className="text-[#4F98A3]" />;
  if (role.includes("Nurse")) return <Stethoscope size={16} className="text-[#4F98A3]" />;
  return <ShieldCheck size={16} className="text-[#4F98A3]" />;
};

export default function CompetencyTracking() {
  const [tab, setTab] = useState<Tab>("register");
  const [search, setSearch] = useState("");
  const [logCrew, setLogCrew] = useState(CREW[0].name);
  const [logDate, setLogDate] = useState("2026-07-17");
  const [logHours, setLogHours] = useState("2");
  const [logCategory, setLogCategory] = useState("Clinical");
  const [logProvider, setLogProvider] = useState("");
  const [logDesc, setLogDesc] = useState("");

  const filteredCrew = useMemo(
    () => CREW.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "register", label: "Crew Register" },
    { key: "matrix", label: "Credential Matrix" },
    { key: "ce", label: "CE Tracker" },
  ];

  return (
    <div className="p-6 space-y-5 min-h-screen bg-[#0f1117] text-[#CDCCCA]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={HF}>Competency & Credential Tracking</h1>
        <p className="text-xs text-[#797876] mt-0.5">
          Per-Crew Lifecycles · Recency · CE Hours · Expiry Alerts
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Active Crew" value="24" />
        <KPI label="Expiring ≤30 days" value="3" color="text-amber-400" />
        <KPI label="Lapsed" value="1" color="text-red-400" />
        <KPI label="CE Hours YTD (avg)" value="34.2h" color="text-[#4F98A3]" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#393836] pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              tab === t.key ? "border-[#4F98A3] text-[#4F98A3]" : "border-transparent text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Crew Register */}
      {tab === "register" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5957]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search crew by name or role..."
              className="w-full bg-[#1C1B19] border border-[#393836] rounded-lg pl-9 pr-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCrew.map(c => (
              <div key={c.id} className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  {roleIcon(c.role)}
                  <span className="text-sm font-semibold text-[#CDCCCA]">{c.name}</span>
                </div>
                <div className="text-xs text-[#797876] mb-3">{c.role} · {c.base}</div>

                <div className="flex gap-2 mb-3">
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/25 rounded-full px-2 py-0.5">
                    <CheckCircle2 size={11} /> {c.current} current
                  </span>
                  {c.expiring > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded-full px-2 py-0.5">
                      <AlertTriangle size={11} /> {c.expiring} expiring
                    </span>
                  )}
                  {c.expired > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 border border-red-400/25 rounded-full px-2 py-0.5">
                      <XCircle size={11} /> {c.expired} expired
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-[#5A5957] mb-3">{c.lastCheck}</div>

                <button className="w-full text-xs px-3 py-2 rounded-lg border border-[#393836] text-[#CDCCCA] hover:bg-white/[0.03] transition-colors">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Credential Matrix */}
      {tab === "matrix" && (
        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#393836] text-left text-xs text-[#797876]">
                <th className="px-4 py-3 font-medium sticky left-0 bg-[#1C1B19]">Crew Member</th>
                {CREDENTIAL_TYPES.map(ct => (
                  <th key={ct} className="px-3 py-3 font-medium text-center whitespace-nowrap">{ct}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(MATRIX).map(([name, cells]) => (
                <tr key={name} className="border-b border-[#393836] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#CDCCCA] whitespace-nowrap sticky left-0 bg-[#1C1B19]">{name}</td>
                  {cells.map((cell, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <CredIcon status={cell.status} />
                        {cell.date && <span className="text-[10px] text-[#5A5957] whitespace-nowrap">{cell.date}</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-5 px-4 py-3 border-t border-[#393836] text-xs text-[#797876] flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" /> Current</span>
            <span className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-400" /> Expiring</span>
            <span className="flex items-center gap-1.5"><XCircle size={12} className="text-red-400" /> Lapsed</span>
            <span className="flex items-center gap-1.5"><Minus size={12} className="text-[#5A5957]" /> Not Required</span>
          </div>
        </div>
      )}

      {/* TAB 3: CE Tracker */}
      {tab === "ce" && (
        <div className="space-y-5">
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={HF}>CE Hours This Year (Annual Requirement: 50h)</h3>
            <div className="space-y-3">
              {CE_DATA.map(c => {
                const pct = Math.min((c.hours / 50) * 100, 100);
                const barColor = c.hours >= 50 ? "bg-green-400" : c.hours >= 35 ? "bg-[#4F98A3]" : "bg-amber-400";
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#CDCCCA] font-medium">{c.name}</span>
                      <span className="text-[#797876]">{c.hours}h / 50h · due {c.dueDate}</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#393836] text-left text-xs text-[#797876]">
                  <th className="px-4 py-3 font-medium">Crew Member</th>
                  <th className="px-4 py-3 font-medium text-right">Clinical</th>
                  <th className="px-4 py-3 font-medium text-right">Aviation</th>
                  <th className="px-4 py-3 font-medium text-right">Safety</th>
                  <th className="px-4 py-3 font-medium text-right">Leadership</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {CE_DATA.map(c => (
                  <tr key={c.name} className="border-b border-[#393836] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#CDCCCA]">{c.name}</td>
                    <td className="px-4 py-3 text-right text-[#797876]">{c.clinical}h</td>
                    <td className="px-4 py-3 text-right text-[#797876]">{c.aviation}h</td>
                    <td className="px-4 py-3 text-right text-[#797876]">{c.safety}h</td>
                    <td className="px-4 py-3 text-right text-[#797876]">{c.leadership}h</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#4F98A3]">{c.hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Log CE activity form */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-[#4F98A3]" />
              <h3 className="text-sm font-semibold" style={HF}>Log CE Activity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#797876] block mb-1.5">Crew Member</label>
                <select
                  value={logCrew}
                  onChange={e => setLogCrew(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                >
                  {CREW.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#797876] block mb-1.5">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                />
              </div>
              <div>
                <label className="text-xs text-[#797876] block mb-1.5">Hours</label>
                <input
                  type="number"
                  value={logHours}
                  onChange={e => setLogHours(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                />
              </div>
              <div>
                <label className="text-xs text-[#797876] block mb-1.5">Category</label>
                <select
                  value={logCategory}
                  onChange={e => setLogCategory(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                >
                  {["Clinical", "Aviation", "Safety", "Leadership"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#797876] block mb-1.5">Provider</label>
                <input
                  type="text"
                  value={logProvider}
                  onChange={e => setLogProvider(e.target.value)}
                  placeholder="e.g. CASA Flight Standards, ACCCN"
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#797876] block mb-1.5">Description</label>
                <textarea
                  value={logDesc}
                  onChange={e => setLogDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief description of the activity"
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3] resize-none"
                />
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4F98A3] text-[#0f1117] text-sm font-semibold hover:bg-[#4F98A3]/90">
              <Plus size={14} /> Log CE Activity
            </button>
          </div>

          {/* Recent log entries */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#393836] text-left text-xs text-[#797876]">
                  <th className="px-4 py-3 font-medium">Crew</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {CE_LOGS.map((log, i) => (
                  <tr key={i} className="border-b border-[#393836] last:border-0">
                    <td className="px-4 py-3 text-[#CDCCCA]">{log.crew}</td>
                    <td className="px-4 py-3 text-[#797876]">{log.date}</td>
                    <td className="px-4 py-3 text-[#797876]">{log.hours}h</td>
                    <td className="px-4 py-3 text-[#797876]">{log.category}</td>
                    <td className="px-4 py-3 text-[#797876]">{log.provider}</td>
                    <td className="px-4 py-3 text-[#797876]">{log.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
