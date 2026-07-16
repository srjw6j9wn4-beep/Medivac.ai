import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, AlertTriangle, CheckCircle, Clock, ExternalLink,
  RefreshCw, Bell, BellOff, ChevronDown, ChevronRight, FileText, Zap
} from "lucide-react";

interface RegSource {
  id: number;
  key: string;
  label: string;
  url: string;
  last_hash: string | null;
  last_checked: string | null;
  last_changed: string | null;
  status: "pending" | "ok" | "changed" | "error";
}

interface RegAlert {
  id: number;
  source_key: string;
  source_label: string;
  summary: string;
  impact: string;
  affected_sops: string; // JSON array
  detected_at: string;
  read_at: string | null;
}

const STATUS_CONFIG = {
  pending: { label: "Not yet checked", color: "#797876", bg: "#79787622", icon: <Clock size={12} /> },
  ok:      { label: "No changes",      color: "#437A22", bg: "#437A2222", icon: <CheckCircle size={12} /> },
  changed: { label: "Change detected", color: "#DA7101", bg: "#DA710122", icon: <AlertTriangle size={12} /> },
  error:   { label: "Check failed",    color: "#A13544", bg: "#A1354422", icon: <AlertTriangle size={12} /> },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SourceRow({ source }: { source: RegSource }) {
  const cfg = STATUS_CONFIG[source.status] ?? STATUS_CONFIG.pending;
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-card-border last:border-b-0">
      {/* Status pill */}
      <div
        className="flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0 min-w-[110px]"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {cfg.icon} {cfg.label}
      </div>

      {/* Source info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground truncate">{source.label}</div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#4F98A3] hover:underline flex items-center gap-0.5 w-fit"
        >
          <ExternalLink size={8} /> {source.url.replace("https://", "").split("/")[0]}
        </a>
      </div>

      {/* Timestamps */}
      <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
        <span className="text-[10px] text-muted-foreground">
          Checked: <span className="text-foreground">{timeAgo(source.last_checked)}</span>
        </span>
        {source.last_changed && (
          <span className="text-[10px] text-amber-400">
            Changed: {timeAgo(source.last_changed)}
          </span>
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onRead }: { alert: RegAlert; onRead: (id: number) => void }) {
  const [expanded, setExpanded] = useState(!alert.read_at);
  let sops: string[] = [];
  try { sops = JSON.parse(alert.affected_sops); } catch { /* */ }
  const isUnread = !alert.read_at;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isUnread
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-card-border bg-card"
      }`}
    >
      {/* Alert header */}
      <button
        onClick={() => {
          setExpanded(e => !e);
          if (isUnread) onRead(alert.id);
        }}
        className="w-full flex items-start gap-3 px-4 py-3 text-left"
      >
        <div className="flex-shrink-0 mt-0.5">
          {isUnread
            ? <div className="w-2 h-2 rounded-full bg-amber-400 mt-1" />
            : <div className="w-2 h-2 rounded-full bg-transparent border border-[#5A5957] mt-1" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
              Change Detected
            </span>
            <span className="text-[10px] text-muted-foreground">{alert.source_label}</span>
            <span className="text-[10px] text-[#5A5957] ml-auto flex-shrink-0">{formatDate(alert.detected_at)}</span>
          </div>
          <p className="text-xs font-semibold text-foreground mt-1 leading-snug line-clamp-2">
            {alert.summary}
          </p>
        </div>
        <div className="flex-shrink-0 text-muted-foreground mt-0.5">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {/* Operational impact */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#4F98A3] mb-1.5">
              Operational Impact for RFDS SE
            </div>
            <p className="text-xs text-[#CDCCCA] leading-relaxed">{alert.impact}</p>
          </div>

          {/* Affected SOPs */}
          {sops.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#797876] mb-1.5 flex items-center gap-1">
                <FileText size={9} /> Affected Documents
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sops.map(sop => (
                  <span key={sop} className="text-[10px] font-semibold bg-white/5 border border-white/15 rounded px-2 py-0.5 text-[#CDCCCA]">
                    {sop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source link */}
          <a
            href={`https://www.legislation.gov.au`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#4F98A3] hover:underline"
          >
            <ExternalLink size={9} /> View source regulation
          </a>
        </div>
      )}
    </div>
  );
}

export default function RegulatoryMonitor() {
  const qc = useQueryClient();

  const { data: sources = [], isLoading: loadingSources } = useQuery<RegSource[]>({
    queryKey: ["/api/reg-monitor/sources"],
    queryFn: () => apiRequest("GET", "/api/reg-monitor/sources").then(r => r.json()),
  });

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<RegAlert[]>({
    queryKey: ["/api/reg-monitor/alerts"],
    queryFn: () => apiRequest("GET", "/api/reg-monitor/alerts").then(r => r.json()),
  });

  const readMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/reg-monitor/alerts/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/reg-monitor/alerts"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reg-monitor/alerts/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/reg-monitor/alerts"] }),
  });

  const unreadCount = alerts.filter(a => !a.read_at).length;
  const changedCount = sources.filter(s => s.status === "changed").length;
  const checkedCount = sources.filter(s => s.status !== "pending").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-slate-400" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Administration</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Regulatory Monitor
            </h1>
            <p className="text-sm text-muted-foreground">
              Automatically tracks CASA regulations, ERSA, and aviation medical standards for changes.
              When a change is detected, the relevant SOPs are flagged for review and line managers are notified.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-card-border rounded-xl px-4 py-3">
          <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{sources.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Sources monitored</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl px-4 py-3">
          <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{checkedCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Sources checked</div>
        </div>
        <div className={`rounded-xl px-4 py-3 border ${changedCount > 0 ? "bg-amber-500/8 border-amber-500/30" : "bg-card border-card-border"}`}>
          <div className={`text-2xl font-bold ${changedCount > 0 ? "text-amber-400" : "text-foreground"}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{changedCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Changes detected</div>
        </div>
        <div className={`rounded-xl px-4 py-3 border ${unreadCount > 0 ? "bg-amber-500/8 border-amber-500/30" : "bg-card border-card-border"}`}>
          <div className={`text-2xl font-bold ${unreadCount > 0 ? "text-amber-400" : "text-foreground"}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{unreadCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Unread alerts</div>
        </div>
      </div>

      {/* Schedule notice */}
      <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#4F98A3]/8 border border-[#4F98A3]/20">
        <Zap size={13} className="text-[#4F98A3] flex-shrink-0" />
        <p className="text-xs text-[#CDCCCA] leading-relaxed">
          <span className="font-semibold text-[#4F98A3]">Automatic weekly check:</span> Every Wednesday at 8:00 AM AEST, the system fetches each regulatory source and compares it to the last known version.
          If a change is detected, an AI analysis identifies the impact on RFDS SE operations, flags the affected SOPs, and sends an in-app notification to line managers.
        </p>
      </div>

      {/* Monitored sources */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monitored Sources</h2>
          <div className="flex-1 h-px bg-card-border" />
          <span className="text-[10px] text-muted-foreground">{sources.length} sources</span>
        </div>
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          {loadingSources ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading sources…</div>
          ) : (
            sources.map(s => <SourceRow key={s.id} source={s} />)
          )}
        </div>
      </div>

      {/* Alerts / change history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Change Alerts</h2>
          <div className="flex-1 h-px bg-card-border" />
          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              className="flex items-center gap-1 text-[10px] text-[#4F98A3] hover:underline"
            >
              <BellOff size={9} /> Mark all read
            </button>
          )}
          <span className="text-[10px] text-muted-foreground">{alerts.length} total</span>
        </div>

        {loadingAlerts ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-card-border rounded-xl">
            <CheckCircle size={32} className="text-[#437A22] mb-3 opacity-60" />
            <p className="text-sm font-semibold text-foreground mb-1">No regulatory changes detected</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              The system will run its first check at the next scheduled time (Wednesday 8:00 AM AEST).
              Any changes found will appear here with an operational impact summary.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRead={id => readMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-card-border text-[10px] text-muted-foreground flex items-center justify-between">
        <span>Sources: legislation.gov.au · airservicesaustralia.com · casa.gov.au</span>
        <span className="flex items-center gap-1"><RefreshCw size={9} /> Weekly · Wednesdays 8:00 AM AEST</span>
      </div>
    </div>
  );
}
