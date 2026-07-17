import { useMemo, useState } from "react";
import {
  Clock, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Filter, Gauge, ClipboardCheck, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CREW = [
  { id: "C1", name: "Capt. R. Hughes", role: "Pilot", base: "Dubbo", d7: 18.5, d28: 62, d90: 180, d365: 680, avail28: 142 },
  { id: "C2", name: "Capt. T. Barnes", role: "Pilot", base: "Broken Hill", d7: 22.0, d28: 48, d90: 142, d365: 560, avail28: 110 },
  { id: "C3", name: "Capt. M. Clarke", role: "Pilot", base: "Dubbo", d7: 14.0, d28: 91, d90: 268, d365: 820, avail28: 158 },
  { id: "C4", name: "Capt. S. Nguyen", role: "Pilot", base: "Dubbo", d7: 16.5, d28: 54, d90: 160, d365: 610, avail28: 128 },
  { id: "C5", name: "Capt. L. Grant", role: "Pilot", base: "Essendon", d7: 10.0, d28: 38, d90: 114, d365: 440, avail28: 90 },
  { id: "C6", name: "S. Mitchell RN", role: "Flight Nurse", base: "Dubbo", d7: 20.0, d28: 75, d90: 220, d365: 850, avail28: 155 },
  { id: "C7", name: "J. O'Brien RN", role: "Flight Nurse", base: "Broken Hill", d7: 8.0, d28: 44, d90: 130, d365: 510, avail28: 100 },
  { id: "C8", name: "Dr. K. Patel", role: "Flight Doctor", base: "Dubbo", d7: 12.0, d28: 38, d90: 112, d365: 420, avail28: 88 },
  { id: "C9", name: "Capt. B. Henson", role: "Pilot", base: "Launceston", d7: 24.0, d28: 98, d90: 290, d365: 900, avail28: 168 },
  { id: "C10", name: "C. Andrews RN", role: "Flight Nurse", base: "Dubbo", d7: 6.0, d28: 30, d90: 88, d365: 330, avail28: 72 },
];

type CrewMember = (typeof CREW)[number];
type WindowKey = "d7" | "d28" | "d90" | "d365" | "avail28";

const PILOT_LIMITS: Record<WindowKey, number> = { d7: 30, d28: 100, d90: 300, d365: 1000, avail28: 168 };
const MED_LIMITS: Record<WindowKey, number> = { d7: 35, d28: 110, d90: 330, d365: 1100, avail28: 168 };
const BLOCK_PCT = 0.95;

const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "d7", label: "7-day" }, { key: "d28", label: "28-day" }, { key: "d90", label: "90-day" },
  { key: "d365", label: "365-day" }, { key: "avail28", label: "Avail-28" },
];

const ROLES = ["All", "Pilot", "Flight Nurse", "Flight Doctor"] as const;
const BASES = ["All", "Dubbo", "Broken Hill", "Essendon", "Launceston"] as const;

const LIMIT_REFERENCE = [
  { group: "Pilots", window: "7-day", limit: "30 hours", ref: "CAO 48.1 Sch. 1 / EBA Cl. 19.2" },
  { group: "Pilots", window: "28-day", limit: "100 hours", ref: "CAO 48.1 Sch. 1" },
  { group: "Pilots", window: "90-day", limit: "300 hours", ref: "CAO 48.1 Sch. 1" },
  { group: "Pilots", window: "365-day", limit: "1000 hours", ref: "CAO 48.1 Sch. 1" },
  { group: "Pilots", window: "Availability (28d)", limit: "168 hours", ref: "EBA Schedule B" },
  { group: "Nurses / Doctors", window: "7-day", limit: "35 hours", ref: "EBA Cl. 19.4" },
  { group: "Nurses / Doctors", window: "28-day", limit: "110 hours", ref: "EBA Cl. 19.4" },
  { group: "Nurses / Doctors", window: "90-day", limit: "330 hours", ref: "EBA Cl. 19.4" },
  { group: "Nurses / Doctors", window: "365-day", limit: "1100 hours", ref: "EBA Cl. 19.4" },
  { group: "Nurses / Doctors", window: "Availability (28d)", limit: "168 hours", ref: "EBA Schedule B" },
];

function limitsFor(role: string) { return role === "Pilot" ? PILOT_LIMITS : MED_LIMITS; }
function pctOf(value: number, limit: number) { return limit > 0 ? (value / limit) * 100 : 0; }
function barColor(pct: number) {
  if (pct >= BLOCK_PCT * 100) return "bg-red-500";
  if (pct >= 80) return "bg-amber-400";
  return "bg-green-500";
}
function crewWindowPcts(c: CrewMember) {
  const limits = limitsFor(c.role);
  return WINDOWS.map((w) => ({ key: w.key, label: w.label, value: c[w.key], limit: limits[w.key], pct: pctOf(c[w.key], limits[w.key]) }));
}
function crewStatus(c: CrewMember): "CLEAR" | "WARNING" | "BLOCK" {
  const pcts = crewWindowPcts(c).map((w) => w.pct);
  if (pcts.some((p) => p >= BLOCK_PCT * 100)) return "BLOCK";
  if (pcts.some((p) => p >= 80)) return "WARNING";
  return "CLEAR";
}

function StatusBadge({ status }: { status: "CLEAR" | "WARNING" | "BLOCK" }) {
  const cfg = {
    BLOCK: { icon: XCircle, cls: "text-red-400 bg-red-500/10 border-red-500/25" },
    WARNING: { icon: AlertTriangle, cls: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
    CLEAR: { icon: CheckCircle2, cls: "text-green-400 bg-green-500/10 border-green-500/20" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border", cfg.cls)}>
      <Icon size={12} /> {status}
    </span>
  );
}

function MiniBar({ value, limit, pct }: { value: number; limit: number; pct: number }) {
  return (
    <div className="min-w-[92px]">
      <div className="text-[11px] font-mono text-slate-200 whitespace-nowrap">{value}<span className="text-muted-foreground">/{limit}h</span></div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
        <div className={cn("h-full rounded-full transition-all", barColor(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export default function FTLCompliance() {
  const [roleFilter, setRoleFilter] = useState<(typeof ROLES)[number]>("All");
  const [baseFilter, setBaseFilter] = useState<(typeof BASES)[number]>("All");
  const [simCrewId, setSimCrewId] = useState<string>(CREW[0].id);
  const [simHours, setSimHours] = useState<string>("");
  const [simResult, setSimResult] = useState<null | { crew: CrewMember; breaches: { label: string; value: number; limit: number; pct: number }[]; clear: boolean }>(null);

  const filteredCrew = useMemo(() => CREW.filter((c) =>
    (roleFilter === "All" || c.role === roleFilter) && (baseFilter === "All" || c.base === baseFilter)
  ), [roleFilter, baseFilter]);

  const statuses = useMemo(() => CREW.map((c) => ({ id: c.id, status: crewStatus(c) })), []);
  const warningCount = statuses.filter((s) => s.status === "WARNING" || s.status === "BLOCK").length;
  const blockCount = statuses.filter((s) => s.status === "BLOCK").length;

  const highestLoading = useMemo(() => {
    let best: { name: string; pct: number } | null = null;
    for (const c of CREW) {
      const pct = pctOf(c.d28, limitsFor(c.role).d28);
      if (!best || pct > best.pct) best = { name: c.name, pct };
    }
    return best;
  }, []);

  function runSimulation() {
    const crew = CREW.find((c) => c.id === simCrewId);
    const hours = parseFloat(simHours);
    if (!crew || Number.isNaN(hours) || hours < 0) { setSimResult(null); return; }
    const limits = limitsFor(crew.role);
    const projected = [
      { key: "d7", label: "7-day", value: crew.d7 + hours, limit: limits.d7, pct: pctOf(crew.d7 + hours, limits.d7) },
      { key: "d28", label: "28-day", value: crew.d28 + hours, limit: limits.d28, pct: pctOf(crew.d28 + hours, limits.d28) },
      { key: "d90", label: "90-day", value: crew.d90 + hours, limit: limits.d90, pct: pctOf(crew.d90 + hours, limits.d90) },
      { key: "d365", label: "365-day", value: crew.d365 + hours, limit: limits.d365, pct: pctOf(crew.d365 + hours, limits.d365) },
    ];
    const breaches = projected.filter((w) => w.pct >= BLOCK_PCT * 100);
    setSimResult({ crew, breaches, clear: breaches.length === 0 });
  }

  return (
    <div className="min-h-full bg-[#0f1117] p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>FTL Compliance Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Rolling-window flight time tracking · CASA Part 48 / CAO 48.1 · EBA 2025</p>
        </div>
        <div className={cn("flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border h-fit",
          warningCount > 0 ? "text-amber-400 bg-amber-500/10 border-amber-500/25" : "text-green-400 bg-green-500/10 border-green-500/20")}
          data-testid="badge-ftl-alerts">
          {warningCount > 0 ? <AlertTriangle size={13} /> : <ShieldAlert size={13} />}
          <span className="font-semibold">{warningCount}</span><span>crew at ≥85% on a rolling window</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><Clock size={14} className="text-cyan-400" /> Crew Tracked</div>
          <div className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{CREW.length}</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><AlertTriangle size={14} className="text-amber-400" /> At Warning (≥85%)</div>
          <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{warningCount}</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><XCircle size={14} className="text-red-400" /> At Hard Block (≥95%)</div>
          <div className="text-2xl font-bold text-red-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{blockCount}</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><Gauge size={14} className="text-cyan-400" /> Highest Loading</div>
          <div className="text-lg font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{highestLoading ? `${highestLoading.pct.toFixed(0)}%` : "—"}</div>
          <div className="text-xs text-muted-foreground truncate">{highestLoading?.name}</div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Filter size={14} className="text-cyan-400" /> Filters</div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as (typeof ROLES)[number])}
            className="bg-[#0f1117] border border-card-border text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400" data-testid="select-role-filter">
            {ROLES.map((r) => <option key={r} value={r}>{r === "All" ? "All Roles" : r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Base</label>
          <select value={baseFilter} onChange={(e) => setBaseFilter(e.target.value as (typeof BASES)[number])}
            className="bg-[#0f1117] border border-card-border text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400" data-testid="select-base-filter">
            {BASES.map((b) => <option key={b} value={b}>{b === "All" ? "All Bases" : b}</option>)}
          </select>
        </div>
        <div className="text-xs text-muted-foreground ml-auto">Showing {filteredCrew.length} of {CREW.length} crew</div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Base</th>
                <th className="px-4 py-3 font-medium">7-day</th>
                <th className="px-4 py-3 font-medium">28-day</th>
                <th className="px-4 py-3 font-medium">90-day</th>
                <th className="px-4 py-3 font-medium">365-day</th>
                <th className="px-4 py-3 font-medium">Avail-28</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrew.map((c) => {
                const map = Object.fromEntries(crewWindowPcts(c).map((p) => [p.key, p]));
                return (
                  <tr key={c.id} className="border-b border-card-border/60 last:border-0 hover:bg-white/[0.02]" data-testid={`row-crew-${c.id}`}>
                    <td className="px-4 py-3 text-slate-100 font-medium whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.role}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.base}</td>
                    <td className="px-4 py-3"><MiniBar value={map.d7.value} limit={map.d7.limit} pct={map.d7.pct} /></td>
                    <td className="px-4 py-3"><MiniBar value={map.d28.value} limit={map.d28.limit} pct={map.d28.pct} /></td>
                    <td className="px-4 py-3"><MiniBar value={map.d90.value} limit={map.d90.limit} pct={map.d90.pct} /></td>
                    <td className="px-4 py-3"><MiniBar value={map.d365.value} limit={map.d365.limit} pct={map.d365.pct} /></td>
                    <td className="px-4 py-3"><MiniBar value={map.avail28.value} limit={map.avail28.limit} pct={map.avail28.pct} /></td>
                    <td className="px-4 py-3"><StatusBadge status={crewStatus(c)} /></td>
                  </tr>
                );
              })}
              {filteredCrew.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No crew match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Assignment Simulator</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Check if adding hours would breach a limit</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Crew member</label>
            <select value={simCrewId} onChange={(e) => setSimCrewId(e.target.value)}
              className="bg-[#0f1117] border border-card-border text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 min-w-[220px]" data-testid="select-sim-crew">
              {CREW.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.role}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Planned flight hours</label>
            <input type="number" min={0} step={0.5} value={simHours} onChange={(e) => setSimHours(e.target.value)} placeholder="e.g. 4.5"
              className="bg-[#0f1117] border border-card-border text-slate-100 text-sm rounded-lg px-3 py-2 w-40 focus:outline-none focus:ring-1 focus:ring-cyan-400" data-testid="input-sim-hours" />
          </div>
          <button onClick={runSimulation}
            className="px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/25 transition-colors" data-testid="button-check-assignment">
            Check Assignment
          </button>
        </div>

        {simResult && (
          <div className={cn("rounded-lg border p-4 text-sm", simResult.clear ? "border-green-500/25 bg-green-500/5" : "border-red-500/25 bg-red-500/5")} data-testid="text-sim-result">
            {simResult.clear ? (
              <div className="flex items-center gap-2 text-green-400 font-semibold"><CheckCircle2 size={15} /> CLEAR — assignment permitted for {simResult.crew.name}</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <XCircle size={15} /> BLOCK — assignment would breach {simResult.breaches.length} window{simResult.breaches.length > 1 ? "s" : ""} for {simResult.crew.name}
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {simResult.breaches.map((b) => (
                    <li key={b.label} className="flex items-center gap-2"><span className="text-red-400">•</span>{b.label}: projected {b.value.toFixed(1)}h / {b.limit}h ({b.pct.toFixed(0)}%)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Limit Reference</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Crew Group</th>
                <th className="px-3 py-2 font-medium">Window</th>
                <th className="px-3 py-2 font-medium">Limit</th>
                <th className="px-3 py-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {LIMIT_REFERENCE.map((r, i) => (
                <tr key={i} className="border-b border-card-border/60 last:border-0">
                  <td className="px-3 py-2 text-slate-200">{r.group}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.window}</td>
                  <td className="px-3 py-2 text-cyan-400 font-mono">{r.limit}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">Warning threshold: 85% of limit (amber). Hard block threshold: 95% of limit (red) — blocks new assignment.</p>
      </div>
    </div>
  );
}
