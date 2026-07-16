/**
 * ShiftFleetStatus — Live shift coverage + aircraft serviceability board
 * Designed for wall-mounted displays around the operations base.
 * Auto-refreshes every 60s.
 */

import { useState, useEffect } from "react";
import { CREW, AIRCRAFT } from "@/lib/data";
import type { UserRole } from "@/lib/data";
import {
  Users, Plane, MapPin, Clock, AlertTriangle,
  CheckCircle2, Wrench, RefreshCw, Circle,
} from "lucide-react";

interface Props { role: UserRole }

const BASES = ["Dubbo", "Broken Hill", "Bankstown", "Essendon", "Launceston"] as const;
type Base = typeof BASES[number];

// ── Defect detail by rego (drawn from Engineering page data) ────────────────
const DEFECT_DETAIL: Record<string, { description: string; mel: string; rts: string }[]> = {
  "VH-MWK": [
    { description: "R/H cabin door seal — minor air leak at cruise altitude", mel: "MEL 52-10-01 (Cat C — 10 days)", rts: "13 Jul 2026" },
  ],
  "VH-XYR": [
    { description: "Engine #1 oil consumption elevated — within limits but trending", mel: "Monitor only — Ops check each sector", rts: "Ongoing" },
  ],
  "VH-XYU": [
    { description: "R/H brake pack wear — replacement required before RTS", mel: "AOG pending part", rts: "07 Jul 2026" },
    { description: "Engine #1 oil consumption elevated — within limits but trending", mel: "Monitor only", rts: "Ongoing" },
    { description: "Altimeter #2 static source check required — annual inspection", mel: "Annual inspection — rectification in progress", rts: "10 Jul 2026" },
  ],
};

// ── Shift role labels ────────────────────────────────────────────────────────
const ROLE_ORDER = ["Pilot", "Flight Nurse", "Flight Doctor", "Dispatcher"];

function roleShort(role: string) {
  if (role === "Flight Nurse") return "FN";
  if (role === "Flight Doctor") return "FD";
  if (role === "Dispatcher") return "Disp";
  return role;
}

function statusDot(s: string) {
  if (s === "On Duty")  return { color: "bg-green-400",  label: "On Duty",  ring: "ring-green-400/30" };
  if (s === "On Call")  return { color: "bg-amber-400",  label: "On Call",  ring: "ring-amber-400/30" };
  if (s === "P Day")    return { color: "bg-blue-400",   label: "P Day",    ring: "ring-blue-400/30" };
  if (s === "Leave")    return { color: "bg-purple-400", label: "Leave",    ring: "ring-purple-400/30" };
  return { color: "bg-slate-500", label: "Off Duty", ring: "ring-slate-500/30" };
}

function aircraftStatusCfg(s: string) {
  if (s === "Serviceable") return { bg: "bg-green-400/10",  border: "border-green-400/30",  text: "text-green-400",  badge: "bg-green-400/20"  };
  if (s === "Airborne")    return { bg: "bg-cyan-400/10",   border: "border-cyan-400/30",   text: "text-cyan-400",   badge: "bg-cyan-400/20"   };
  if (s === "Maintenance") return { bg: "bg-amber-400/10",  border: "border-amber-400/30",  text: "text-amber-400",  badge: "bg-amber-400/20"  };
  if (s === "AOG")         return { bg: "bg-red-500/10",    border: "border-red-500/40",    text: "text-red-400",    badge: "bg-red-500/20"    };
  return                          { bg: "bg-slate-800/40",  border: "border-slate-600/30",  text: "text-slate-400",  badge: "bg-slate-700"     };
}

function baseForAircraft(base: string): Base {
  if (base.includes("Dubbo"))        return "Dubbo";
  if (base.includes("Broken Hill"))  return "Broken Hill";
  if (base.includes("Bankstown"))    return "Bankstown";
  if (base.includes("Essendon"))     return "Essendon";
  if (base.includes("Launceston"))   return "Launceston";
  return "Dubbo";
}

export default function ShiftFleetStatus({ role }: Props) {
  const [now, setNow] = useState(new Date());
  const [expandedAircraft, setExpandedAircraft] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh timestamp every 60s
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
      setLastRefresh(new Date());
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  function toggleAircraft(rego: string) {
    setExpandedAircraft(prev =>
      prev.includes(rego) ? prev.filter(r => r !== rego) : [...prev, rego]
    );
  }

  const timeStr = now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-8 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Shift & Fleet Status
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {timeStr}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground mt-1">
            <RefreshCw size={10} />
            Auto-refresh · last {lastRefresh.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 text-[10px] text-muted-foreground flex-wrap">
        {[
          { color: "bg-green-400",  label: "On Duty" },
          { color: "bg-amber-400",  label: "On Call" },
          { color: "bg-blue-400",   label: "P Day" },
          { color: "bg-purple-400", label: "Leave" },
          { color: "bg-slate-500",  label: "Off Duty" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            {l.label}
          </span>
        ))}
        <span className="ml-4 text-muted-foreground/50">|</span>
        {[
          { color: "text-green-400",  label: "Serviceable" },
          { color: "text-cyan-400",   label: "Airborne" },
          { color: "text-amber-400",  label: "Maintenance" },
          { color: "text-red-400",    label: "AOG" },
        ].map(l => (
          <span key={l.label} className={`flex items-center gap-1.5 font-semibold ${l.color}`}>
            <Plane size={10} />
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Section 1: Shift Coverage by Base ───────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Shift Coverage
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {BASES.map(base => {
            const baseCrew = CREW.filter(c => c.base === base);
            const onDuty   = baseCrew.filter(c => c.dutyStatus === "On Duty").length;
            const onCall   = baseCrew.filter(c => c.dutyStatus === "On Call").length;
            const hasGap   = onDuty === 0;

            // Group by role in defined order
            const byRole = ROLE_ORDER.map(r => ({
              role: r,
              members: baseCrew.filter(c => c.role === r),
            })).filter(g => g.members.length > 0);

            return (
              <div key={base}
                className={`bg-card border rounded-xl overflow-hidden ${hasGap ? "border-amber-400/40" : "border-card-border"}`}>

                {/* Base header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${hasGap ? "border-amber-400/30 bg-amber-400/5" : "border-card-border"}`}>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className={hasGap ? "text-amber-400" : "text-cyan-400"} />
                    <span className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                      {base}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    {onDuty > 0 && (
                      <span className="bg-green-400/15 text-green-400 border border-green-400/25 px-2 py-0.5 rounded-full font-semibold">
                        {onDuty} on duty
                      </span>
                    )}
                    {onCall > 0 && (
                      <span className="bg-amber-400/15 text-amber-400 border border-amber-400/25 px-2 py-0.5 rounded-full font-semibold">
                        {onCall} on call
                      </span>
                    )}
                    {baseCrew.length === 0 && (
                      <span className="text-muted-foreground italic">No crew assigned</span>
                    )}
                  </div>
                </div>

                {/* Crew list */}
                <div className="divide-y divide-card-border/50">
                  {baseCrew.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground italic">
                      No crew data
                    </div>
                  ) : (
                    byRole.map(group => (
                      <div key={group.role}>
                        <div className="px-4 pt-2 pb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {group.role}
                          </span>
                        </div>
                        {group.members.map(c => {
                          const dot = statusDot(c.dutyStatus);
                          return (
                            <div key={c.id} className="flex items-center justify-between px-4 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ring-2 ${dot.color} ${dot.ring}`} />
                                <span className="text-xs font-medium truncate">{c.name}</span>
                              </div>
                              <span className={`text-[10px] font-semibold flex-shrink-0 ml-2 ${
                                c.dutyStatus === "On Duty"  ? "text-green-400"  :
                                c.dutyStatus === "On Call"  ? "text-amber-400"  :
                                c.dutyStatus === "P Day"    ? "text-blue-400"   :
                                c.dutyStatus === "Leave"    ? "text-purple-400" :
                                "text-muted-foreground"
                              }`}>
                                {dot.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 2: Fleet Status ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Plane size={16} className="text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Fleet Status
          </h2>
        </div>

        <div className="space-y-6">
          {BASES.map(base => {
            const fleet = AIRCRAFT.filter(a => baseForAircraft(a.base) === base);
            if (fleet.length === 0) return null;

            return (
              <div key={base}>
                {/* Base label */}
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={11} className="text-muted-foreground/60" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{base}</span>
                  <div className="flex-1 h-px bg-card-border" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                  {fleet.map(a => {
                    const cfg = aircraftStatusCfg(a.status);
                    const defects = DEFECT_DETAIL[a.rego] ?? [];
                    const hasDefects = defects.length > 0 || a.defects > 0;
                    const isAOG = a.status === "AOG" || a.status === "Maintenance";
                    const expanded = expandedAircraft.includes(a.rego);

                    return (
                      <div key={a.rego}
                        className={`border rounded-xl overflow-hidden transition-all ${cfg.border} ${isAOG ? "ring-1 ring-red-500/20" : ""}`}>

                        {/* Aircraft header row */}
                        <div
                          className={`px-4 py-3 flex items-center justify-between ${cfg.bg} ${hasDefects ? "cursor-pointer hover:brightness-110" : ""}`}
                          onClick={() => hasDefects && toggleAircraft(a.rego)}>

                          <div className="flex items-center gap-3">
                            {/* Status icon */}
                            {a.status === "Airborne" ? (
                              <Plane size={16} className={`${cfg.text} rotate-45`} />
                            ) : a.status === "Serviceable" ? (
                              <CheckCircle2 size={16} className={cfg.text} />
                            ) : (
                              <AlertTriangle size={16} className={cfg.text} />
                            )}

                            <div>
                              <div className="font-bold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                                {a.rego}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{a.type}</div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.text} ${cfg.badge} ${cfg.border}`}>
                              {a.status.toUpperCase()}
                            </span>
                            {hasDefects && (
                              <span className="text-[9px] text-amber-400 font-semibold flex items-center gap-0.5">
                                <AlertTriangle size={9} />
                                {a.defects} defect{a.defects !== 1 ? "s" : ""}
                                <span className="text-muted-foreground/60 ml-0.5">{expanded ? "▲" : "▼"}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Location row */}
                        <div className="px-4 py-2 bg-card border-t border-card-border/50 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin size={9} />
                            <span>{a.base}</span>
                          </div>
                          {a.status !== "Airborne" && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Wrench size={9} />
                              <span>{a.nextService}</span>
                            </div>
                          )}
                          {!a.maintenanceRelease && (
                            <span className="text-red-400 font-bold">NO M/R</span>
                          )}
                        </div>

                        {/* Defect detail — expandable */}
                        {expanded && defects.length > 0 && (
                          <div className="border-t border-amber-400/20 bg-amber-400/5 divide-y divide-amber-400/10">
                            {defects.map((d, i) => (
                              <div key={i} className="px-4 py-2.5 space-y-1">
                                <div className="text-[11px] font-semibold text-amber-300 flex items-start gap-1.5">
                                  <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                                  {d.description}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-4">
                                  <span>{d.mel}</span>
                                  <span className={`font-semibold ${d.rts === "AOG" || d.rts.includes("2026") ? "text-red-400" : "text-muted-foreground"}`}>
                                    RTS: {d.rts}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {expanded && defects.length === 0 && a.defects > 0 && (
                          <div className="px-4 py-2 bg-amber-400/5 border-t border-amber-400/20 text-[10px] text-amber-400">
                            {a.defects} recorded defect{a.defects !== 1 ? "s" : ""} — see Engineering for detail
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
