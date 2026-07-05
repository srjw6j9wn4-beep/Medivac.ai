import { ExternalLink, BookOpen, AlertTriangle, CheckCircle, Clock, Wrench, ArrowUpRight, RefreshCw, Wifi, WifiOff, Plane } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

const JOURNEY_LOG_URL = "https://rfds-journey-log.pplx.app";
const TECH_LOG_URL    = "https://rfds-techjourneylog.pplx.app";

interface SyncedEntry {
  id: number;
  uuid: string;
  device_id: string;
  aircraft: string;
  date: string;
  from_icao: string;
  to_icao: string;
  pic: string;
  sic?: string;
  block_off?: string;
  block_on?: string;
  block_hours?: string;
  flight_hours?: string;
  fuel_start?: number;
  fuel_uplift?: number;
  fuel_finish?: number;
  mission_type?: string;
  defects?: string;
  remarks?: string;
  synced_at: string;
}

function formatSyncTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)   return "Just now";
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `${diffH}h ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function hasDefect(entry: SyncedEntry) {
  if (!entry.defects) return false;
  try { const d = JSON.parse(entry.defects); return d?.noted === true || (typeof d === "string" && d.length > 0); }
  catch { return entry.defects.length > 0; }
}

export default function TechLogEmbed() {
  const [entries,    setEntries]    = useState<SyncedEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastSync,   setLastSync]   = useState<Date | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [acFilter,   setAcFilter]   = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set("date", dateFilter);
      if (acFilter)   params.set("aircraft", acFilter);
      const res  = await apiRequest("GET", `/api/techlog/entries${params.toString() ? "?" + params : ""}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setLastSync(new Date());
    } catch (e) {
      setError("Unable to load entries — server unreachable");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, acFilter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const t = setInterval(fetchEntries, 60000);
    return () => clearInterval(t);
  }, [fetchEntries]);

  const openDefects = entries.filter(hasDefect);
  const todayStr    = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter(e => e.date === todayStr);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Tech &amp; Journey Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live synced entries from the RFDS Journey Log PWA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={JOURNEY_LOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-sm font-bold rounded-xl transition-colors shadow-lg shadow-cyan-400/20"
          >
            <ArrowUpRight size={15} />
            Journey Log App
          </a>
          <button
            onClick={fetchEntries}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-card-border hover:border-cyan-400/40 text-sm rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-cyan-400" : "text-muted-foreground"} />
            <span className="text-muted-foreground text-xs">
              {lastSync ? `Synced ${formatSyncTime(lastSync.toISOString())}` : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total entries", value: entries.length,       color: "text-cyan-400" },
          { label: "Today's sectors", value: todayEntries.length, color: "text-green-400" },
          { label: "Open defects",   value: openDefects.length,  color: openDefects.length > 0 ? "text-red-400" : "text-green-400" },
          { label: "Aircraft flown", value: [...new Set(entries.map(e => e.aircraft))].length, color: "text-cyan-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Open defects banner */}
      {openDefects.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <AlertTriangle size={15} />
            {openDefects.length} defect{openDefects.length > 1 ? "s" : ""} recorded — review required
          </div>
          {openDefects.map(e => (
            <div key={e.uuid} className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-red-300 font-bold">{e.aircraft}</span>
              <span>{e.from_icao}→{e.to_icao}</span>
              <span>{e.date}</span>
              <span className="text-red-200">{e.defects}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="bg-card border border-card-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-cyan-400/60"
          placeholder="Filter by date"
        />
        <input
          type="text"
          value={acFilter}
          onChange={e => setAcFilter(e.target.value)}
          className="bg-card border border-card-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-cyan-400/60 w-32"
          placeholder="Aircraft rego"
        />
        {(dateFilter || acFilter) && (
          <button
            onClick={() => { setDateFilter(""); setAcFilter(""); }}
            className="text-xs text-muted-foreground hover:text-cyan-400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Entry table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Synced Journey Log Entries
          </span>
          <span className="text-xs text-muted-foreground">{entries.length} total</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
            <RefreshCw size={14} className="animate-spin" /> Loading entries…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center gap-2 py-12 text-red-400 text-sm">
            <WifiOff size={14} /> {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Plane size={32} className="opacity-30" />
            <p className="text-sm">No synced entries yet</p>
            <p className="text-xs opacity-60">Entries appear here automatically when the Journey Log app syncs on landing</p>
            <a
              href={JOURNEY_LOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink size={11} /> Open Journey Log App
            </a>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-4 py-3">Aircraft</th>
                  <th className="text-left px-4 py-3">Route</th>
                  <th className="text-left px-4 py-3">PIC</th>
                  <th className="text-left px-4 py-3">Block</th>
                  <th className="text-left px-4 py-3">Mission</th>
                  <th className="text-left px-4 py-3">Fuel (lbs)</th>
                  <th className="text-left px-4 py-3">Defect</th>
                  <th className="text-left px-4 py-3">Synced</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={e.uuid}
                    className={`border-b border-card-border/50 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                  >
                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-3 font-bold text-cyan-400 text-xs">{e.aircraft}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{e.from_icao} → {e.to_icao}</td>
                    <td className="px-4 py-3 text-xs">{e.pic}{e.sic ? ` / ${e.sic}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-green-400 font-mono">
                      {e.block_hours ? `${e.block_hours}h` : e.block_off && e.block_on ? `${e.block_off}–${e.block_on}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {e.mission_type ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-medium">
                          {e.mission_type}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {e.fuel_uplift ? `+${e.fuel_uplift}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {hasDefect(e)
                        ? <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={11} /> Yes</span>
                        : <span className="flex items-center gap-1 text-green-400"><CheckCircle size={11} /> Clear</span>}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1"><Wifi size={10} className="text-green-400" />{formatSyncTime(e.synced_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Trend Monitoring */}
      {entries.length > 0 && (() => {
        // Build last-7-days date array
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d.toISOString().slice(0, 10));
        }

        // Sectors per day
        const sectorsPerDay = days.map(d => ({
          date: d,
          label: new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
          count: entries.filter(e => e.date === d).length,
          hours: entries.filter(e => e.date === d).reduce((acc, e) => {
            const h = parseFloat(e.flight_hours || '0') || 0;
            return acc + h;
          }, 0),
          defects: entries.filter(e => e.date === d && e.defects && e.defects !== '[]' && e.defects !== '').length,
        }));

        const maxCount = Math.max(...sectorsPerDay.map(d => d.count), 1);
        const totalHours7d = sectorsPerDay.reduce((a, d) => a + d.hours, 0);
        const totalSectors7d = sectorsPerDay.reduce((a, d) => a + d.count, 0);
        const totalDefects7d = sectorsPerDay.reduce((a, d) => a + d.defects, 0);

        // Per-aircraft utilisation (all time)
        const aircraftSet = [...new Set(entries.map(e => e.aircraft))];
        const aircraftUtil = aircraftSet.map(ac => ({
          rego: ac,
          sectors: entries.filter(e => e.aircraft === ac).length,
          hours: entries.filter(e => e.aircraft === ac).reduce((acc, e) => acc + (parseFloat(e.flight_hours || '0') || 0), 0),
          defects: entries.filter(e => e.aircraft === ac && e.defects && e.defects !== '[]' && e.defects !== '').length,
        })).sort((a, b) => b.hours - a.hours);

        return (
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-card-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold px-2">Daily Trend Monitoring — Last 7 Days</span>
              <div className="h-px flex-1 bg-card-border" />
            </div>

            {/* 7-day summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '7-day sectors', value: totalSectors7d, color: 'text-cyan-400' },
                { label: '7-day flight hrs', value: totalHours7d.toFixed(1), color: 'text-green-400' },
                { label: '7-day defects', value: totalDefects7d, color: totalDefects7d > 0 ? 'text-red-400' : 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="bg-card border border-card-border rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart — sectors & hours per day */}
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sectors per Day</div>
              <div className="flex items-end gap-2 h-28">
                {sectorsPerDay.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] text-cyan-400 font-bold">{d.count > 0 ? d.count : ''}</div>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        d.defects > 0 ? 'bg-red-400/60' : 'bg-cyan-400/60'
                      }`}
                      style={{ height: `${Math.max((d.count / maxCount) * 80, d.count > 0 ? 6 : 2)}px` }}
                      title={`${d.label}: ${d.count} sectors, ${d.hours.toFixed(1)}h${d.defects > 0 ? `, ${d.defects} defect${d.defects > 1 ? 's' : ''}` : ''}`}
                    />
                    <div className="text-[9px] text-muted-foreground text-center leading-tight whitespace-nowrap">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400/60 inline-block" /> Sectors (clear)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400/60 inline-block" /> Day with defect(s)</span>
              </div>
            </div>

            {/* Aircraft utilisation table */}
            {aircraftUtil.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-card-border">
                  <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Aircraft Utilisation</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-card-border text-[10px] text-muted-foreground uppercase tracking-wider">
                        <th className="text-left px-5 py-2">Aircraft</th>
                        <th className="text-right px-4 py-2">Sectors</th>
                        <th className="text-right px-4 py-2">Flight Hrs</th>
                        <th className="text-right px-4 py-2">Defects</th>
                        <th className="text-left px-4 py-2">Utilisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aircraftUtil.map((ac, i) => {
                        const maxH = aircraftUtil[0].hours || 1;
                        return (
                          <tr key={ac.rego} className={`border-b border-card-border/50 ${ i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                            <td className="px-5 py-2.5 font-bold text-cyan-400 font-mono">{ac.rego}</td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">{ac.sectors}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-green-400">{ac.hours.toFixed(1)}</td>
                            <td className={`px-4 py-2.5 text-right font-bold ${ ac.defects > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                              {ac.defects > 0 ? ac.defects : '—'}
                            </td>
                            <td className="px-4 py-2.5 w-32">
                              <div className="h-2 bg-card-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-400/60 rounded-full"
                                  style={{ width: `${(ac.hours / maxH) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Journey Log App link card */}
      <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
          <BookOpen size={22} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Medivac Ai Journey Log App
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install on iPhone / iPad from Safari · Face ID auth · Full offline · Auto-syncs on landing
          </p>
        </div>
        <a
          href={JOURNEY_LOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20 text-cyan-400 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
        >
          <ExternalLink size={12} /> Open App
        </a>
      </div>

    </div>
  );
}
