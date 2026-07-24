import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX,
  AlertTriangle, Zap, Globe, FileX, Search,
  Bug, Radar, Lock, RefreshCw, ChevronDown, ChevronUp,
  Activity, Clock, Cpu, Loader2, Eye, Ban,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ThreatEvent = {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  threat_type: string;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
  blocked: boolean;
  user_agent?: string;
};

type ThreatStats = {
  total: number;
  last_hour: number;
  last_24h: number;
  by_severity: { low: number; medium: number; high: number; critical: number };
  by_type: Record<string, number>;
  blocked_ips: number;
};

// ── Severity config ───────────────────────────────────────────────────────────
const SEV = {
  critical: { label: "CRITICAL", cls: "bg-red-500/20 text-red-400 border-red-500/30",   dot: "bg-red-500",    icon: ShieldX },
  high:     { label: "HIGH",     cls: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-500", icon: ShieldAlert },
  medium:   { label: "MEDIUM",   cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-500", icon: AlertTriangle },
  low:      { label: "LOW",      cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",  dot: "bg-blue-500",   icon: Shield },
};

// ── Threat type icons + labels ────────────────────────────────────────────────
const THREAT_META: Record<string, { icon: React.ElementType; label: string }> = {
  SQL_INJECTION:          { icon: Bug,         label: "SQL Injection" },
  XSS_ATTEMPT:            { icon: Zap,         label: "XSS Attempt" },
  PATH_TRAVERSAL:         { icon: Search,      label: "Path Traversal" },
  COMMAND_INJECTION:      { icon: Cpu,         label: "Command Injection" },
  NOSQL_INJECTION:        { icon: Bug,         label: "NoSQL Injection" },
  SSRF_ATTEMPT:           { icon: Globe,       label: "SSRF Attempt" },
  SCANNER_DETECTED:       { icon: Radar,       label: "Vulnerability Scanner" },
  BAD_BOT:                { icon: Bug,         label: "Malicious Bot" },
  MISSING_USER_AGENT:     { icon: Eye,         label: "No User-Agent" },
  OVERSIZED_HEADERS:      { icon: AlertTriangle, label: "Oversized Headers" },
  HOST_HEADER_INJECTION:  { icon: Globe,       label: "Host Header Injection" },
  EXPLOIT_PROBE:          { icon: Search,      label: "Exploit Path Probe" },
  DIRECTORY_SCAN:         { icon: Radar,       label: "Directory Scan" },
  BLOCKED_IP_RANGE:       { icon: Ban,         label: "Blocked IP Range" },
  DISALLOWED_FILE_TYPE:   { icon: FileX,       label: "Blocked File Type" },
  DISALLOWED_FILE_EXTENSION:{ icon: FileX,     label: "Blocked File Extension" },
  OVERSIZED_FILE:         { icon: FileX,       label: "Oversized File Upload" },
  INVALID_FILE_ENCODING:  { icon: FileX,       label: "Invalid File Encoding" },
};

function getMeta(type: string) {
  // Handle dynamic MALWARE_ prefix
  if (type.startsWith("MALWARE_")) {
    return { icon: ShieldX, label: `Malware: ${type.replace("MALWARE_", "").replace(/_/g, " ")}` };
  }
  return THREAT_META[type] || { icon: ShieldAlert, label: type.replace(/_/g, " ") };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function fmtDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}
function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Chip component ────────────────────────────────────────────────────────────
function Chip({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{label}</span>;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, cls }: { icon: React.ElementType; label: string; value: number | string; sub?: string; cls: string }) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-current/10 flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-2xl font-black tabular-nums">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-widest mt-0.5 opacity-80">{label}</div>
        {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Threat row ────────────────────────────────────────────────────────────────
function ThreatRow({ event }: { event: ThreatEvent }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV[event.severity];
  const meta = getMeta(event.threat_type);
  const SevIcon = sev.icon;
  const TypeIcon = meta.icon;

  return (
    <div className="rounded-lg border border-sidebar-border bg-card/50 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        {/* Severity dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot} ${event.severity === 'critical' ? 'animate-pulse' : ''}`} />

        {/* Type icon */}
        <TypeIcon className={`h-3.5 w-3.5 flex-shrink-0 ${event.severity === 'critical' ? 'text-red-400' : event.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'}`} />

        {/* Threat label */}
        <span className="text-xs font-bold text-white flex-shrink-0 w-44 truncate">{meta.label}</span>

        {/* IP */}
        <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-32 truncate">{event.ip}</span>

        {/* Method + Path */}
        <span className="text-xs text-muted-foreground flex-1 truncate">
          <span className="text-cyan-400 font-bold">{event.method}</span> {event.path}
        </span>

        {/* Chips */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Chip label={sev.label} cls={sev.cls} />
          {event.blocked && <Chip label="BLOCKED" cls="bg-red-900/40 text-red-300 border-red-700/40" />}
        </div>

        {/* Time */}
        <span className="text-xs text-muted-foreground flex-shrink-0 w-16 text-right">{relTime(event.timestamp)}</span>

        {/* Expand */}
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-sidebar-border px-4 py-3 space-y-2 bg-black/20">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">Time:</span> <span className="text-white font-mono">{fmtDate(event.timestamp)} {fmtTime(event.timestamp)}</span></div>
            <div><span className="text-muted-foreground">IP:</span> <span className="text-white font-mono">{event.ip}</span></div>
            <div><span className="text-muted-foreground">Method:</span> <span className="text-cyan-400 font-bold">{event.method}</span></div>
            <div><span className="text-muted-foreground">Path:</span> <span className="text-white font-mono">{event.path}</span></div>
          </div>
          {event.user_agent && (
            <div className="text-xs">
              <span className="text-muted-foreground">User-Agent:</span>{" "}
              <span className="text-white font-mono break-all">{event.user_agent}</span>
            </div>
          )}
          <div className="text-xs">
            <span className="text-muted-foreground">Detail:</span>{" "}
            <span className={`font-mono break-all ${event.severity === 'critical' ? 'text-red-300' : event.severity === 'high' ? 'text-orange-300' : 'text-yellow-300'}`}>{event.detail}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SecurityMonitor() {
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: threats = [], isLoading: threatsLoading, refetch } = useQuery<ThreatEvent[]>({
    queryKey: ["/api/security/threats"],
    queryFn: () => apiRequest("GET", "/api/security/threats").then(r => r.json()),
    refetchInterval: 15_000,  // live-poll every 15s
  });

  const { data: stats } = useQuery<ThreatStats>({
    queryKey: ["/api/security/stats"],
    queryFn: () => apiRequest("GET", "/api/security/stats").then(r => r.json()),
    refetchInterval: 15_000,
  });

  const filtered = threats.filter(t =>
    (sevFilter === "all" || t.severity === sevFilter) &&
    (typeFilter === "all" || t.threat_type === typeFilter)
  );

  const allTypes = [...new Set(threats.map(t => t.threat_type))].sort();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-cyan-400" />
            <h1 className="text-lg font-black text-white tracking-tight">Security Monitor</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Real-time threat detection — SQL injection, XSS, malware uploads, scanners, bot attacks, IP reputation</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Activity}    label="Total Events"    value={stats.total}          sub="all time"        cls="border-sidebar-border text-muted-foreground" />
          <StatCard icon={Clock}       label="Last Hour"       value={stats.last_hour}      sub="detected"        cls="border-cyan-500/20 text-cyan-400" />
          <StatCard icon={Radar}       label="Last 24h"        value={stats.last_24h}       sub="events"          cls="border-blue-500/20 text-blue-400" />
          <StatCard icon={ShieldX}     label="Critical"        value={stats.by_severity.critical} sub="events"   cls={stats.by_severity.critical > 0 ? "border-red-500/30 text-red-400" : "border-sidebar-border text-muted-foreground"} />
          <StatCard icon={ShieldAlert} label="High"            value={stats.by_severity.high}    sub="events"    cls={stats.by_severity.high > 0 ? "border-orange-500/30 text-orange-400" : "border-sidebar-border text-muted-foreground"} />
          <StatCard icon={Ban}         label="Blocked IPs"     value={stats.blocked_ips}    sub="unique"          cls="border-purple-500/20 text-purple-400" />
        </div>
      )}

      {/* Threat type breakdown */}
      {stats && Object.keys(stats.by_type).length > 0 && (
        <div className="rounded-xl border border-sidebar-border bg-card/50 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Attack Breakdown</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_type)
              .sort(([,a],[,b]) => b - a)
              .map(([type, count]) => {
                const meta = getMeta(type);
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(t => t === type ? "all" : type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${typeFilter === type ? "bg-red-500/20 border-red-500/30 text-red-300" : "border-sidebar-border text-muted-foreground hover:text-white"}`}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                    <span className="ml-0.5 bg-white/10 rounded px-1">{count}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Detection layers info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Bug,     label: "Payload Inspection",   desc: "SQL injection · XSS · Path traversal · Command injection · NoSQL · SSRF", color: "text-red-400",    border: "border-red-500/20",    bg: "bg-red-500/5" },
          { icon: FileX,   label: "File Upload Scanner",  desc: "Malware signatures · Trojan detection · Macro viruses · EICAR · Type enforcement", color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5" },
          { icon: Radar,   label: "Anomaly Detection",    desc: "Scanner fingerprints · Bad bots · Header anomalies · Directory bruteforce", color: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/5" },
          { icon: Globe,   label: "IP Reputation",        desc: "Known malicious CIDRs · Tor exit nodes · Botnet infrastructure ranges", color: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5" },
        ].map(layer => {
          const Icon = layer.icon;
          return (
            <div key={layer.label} className={`rounded-xl border ${layer.border} ${layer.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${layer.color}`} />
                <span className={`text-xs font-bold ${layer.color}`}>{layer.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{layer.desc}</p>
              <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${layer.color}`}>
                <ShieldCheck className="h-2.5 w-2.5" /> Active
              </div>
            </div>
          );
        })}
      </div>

      {/* Event log */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Event Log {filtered.length > 0 && <span className="text-white ml-1">({filtered.length})</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Severity filter */}
            {["all", "critical", "high", "medium", "low"].map(s => (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  sevFilter === s
                    ? s === "all" ? "bg-white/10 text-white border-white/20"
                    : SEV[s as keyof typeof SEV]?.cls || "bg-white/10 text-white border-white/20"
                    : "border-sidebar-border text-muted-foreground hover:text-white"
                }`}
              >
                {s === "all" ? "All" : SEV[s as keyof typeof SEV]?.label || s.toUpperCase()}
              </button>
            ))}
            {typeFilter !== "all" && (
              <button onClick={() => setTypeFilter("all")} className="px-3 py-1 rounded-full text-xs font-semibold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                ✕ {getMeta(typeFilter).label}
              </button>
            )}
          </div>
        </div>

        {threatsLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading threat log...
          </div>
        )}

        {!threatsLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="text-sm font-semibold text-emerald-400">No threats detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              {threats.length === 0
                ? "All systems clear. Threat detection is active and monitoring."
                : "No events match the current filters."}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(event => <ThreatRow key={event.id} event={event} />)}
        </div>
      </div>

      {/* Footer note */}
      <div className="rounded-xl border border-sidebar-border bg-card/30 px-4 py-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="text-white font-semibold">Detection engine v1.0</span> — In-memory ring buffer holds last 500 events (newest first). All events are also persisted to Supabase threat_log for long-term retention and compliance review. Auto-refreshes every 15 seconds. Blocked requests are rejected at the server edge before reaching application logic. File uploads are scanned for PE/ELF executables, Mach-O binaries, EICAR test files, VBA macros, PDF JavaScript, and other embedded threats. Detection layers run in sequence: IP reputation → anomaly detection → payload inspection → file scan.
        </p>
      </div>
    </div>
  );
}
