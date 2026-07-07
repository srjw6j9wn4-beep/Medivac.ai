
import React from "react";
import { AlertTriangle, Clock, Plane, ChevronRight, Info, RotateCcw, Zap } from "lucide-react";

// ── Extension allowances by service type (days) ─────────────────────────────
const EXTENSION_DAYS: Record<string, number> = {
  "120 hr check + Prop overhauls": 10,
  "6-Monthly check + MEL (door seal)": 14,
  "Annual inspection (IN PROGRESS)": 0,
  "Annual inspection": 0,
};

// ── Full fleet rows ──────────────────────────────────────────────────────────
const FLEET_ROWS = [
  { rego: "VH-XYJ", type: "King Air B200", base: "Dubbo (YSDU)" },
  { rego: "VH-XYR", type: "King Air B200", base: "Broken Hill (YBHI)" },
  { rego: "VH-XYU", type: "King Air B300", base: "Dubbo (YSDU)" },
  { rego: "VH-MVW", type: "King Air B200", base: "Broken Hill (YBHI)" },
  { rego: "VH-VPQ", type: "King Air B200", base: "Bankstown (YSBK)" },
];

// ── CYCLES-BEFORE-HOURS alert data ──────────────────────────────────────────
// These are components where CYCLES drive the limit — not hours.
// At YMLT (Moree) and similar short-sector aerodromes, cycles accumulate
// far faster than hours, catching crews off guard.
export interface CycleAlert {
  id: string;
  rego: string;
  component: string;
  partNo: string;
  limitType: "cycles" | "hours" | "both";
  cycleLimit: number;
  cyclesUsed: number;
  cyclesRemaining: number;
  // Approx hours the aircraft flies per cycle at this base
  avgHoursPerCycle: number;
  // Projected cycles-due date based on ops tempo
  projectedDueByCycles: string;
  // If hours-limited instead, what's the hour limit remaining
  hoursRemaining: number | null;
  // Would cycles expire BEFORE hours?
  cyclesDueBeforeHours: boolean;
  urgency: "critical" | "urgent" | "watch" | "ok";
  base: string;
  notes: string;
}

const CYCLE_ALERTS: CycleAlert[] = [
  {
    id: "CYC-001",
    rego: "VH-XYJ",
    component: "L/H Main Gear Tyre",
    partNo: "AER-6120",
    limitType: "cycles",
    cycleLimit: 450,
    cyclesUsed: 312,
    cyclesRemaining: 138,
    avgHoursPerCycle: 1.8,
    projectedDueByCycles: "est. 20 Sep 2026",
    hoursRemaining: null,
    cyclesDueBeforeHours: false,
    urgency: "watch",
    base: "Dubbo (YSDU)",
    notes: "Normal sector length at YSDU. Monitor as YMLT rotations increase — short sectors accelerate cycle burn significantly.",
  },
  {
    id: "CYC-002",
    rego: "VH-XYR",
    component: "R/H Main Gear Tyre",
    partNo: "AER-6120",
    limitType: "cycles",
    cycleLimit: 450,
    cyclesUsed: 387,
    cyclesRemaining: 63,
    avgHoursPerCycle: 0.8,   // YBHI short-sector ops
    projectedDueByCycles: "est. 12 Aug 2026",
    hoursRemaining: 280,
    cyclesDueBeforeHours: true,   // ← CRITICAL — cycles will expire first
    urgency: "urgent",
    base: "Broken Hill (YBHI)",
    notes: "YBHI ops include frequent short YMLT sectors (~25 min). At current 0.8 hr/cycle average, tyre will reach cycle limit well before hour limit. Order replacement tyre now — lead time 7–10 days.",
  },
  {
    id: "CYC-003",
    rego: "VH-XYR",
    component: "NLG Steering Collar",
    partNo: "101-384018-1",
    limitType: "both",
    cycleLimit: 2000,
    cyclesUsed: 1876,
    cyclesRemaining: 124,
    avgHoursPerCycle: 0.8,
    projectedDueByCycles: "est. 6 Aug 2026",
    hoursRemaining: 620,
    cyclesDueBeforeHours: true,   // ← cycles expire ~5x before hours
    urgency: "urgent",
    base: "Broken Hill (YBHI)",
    notes: "YMLT short-sector pattern is the primary risk here. NLG collar has both hour AND cycle limit — cycles will expire approximately 5× sooner than hours at current BHI/YMLT ops tempo. This is the exact scenario that catches engineers off guard. Replacement required before cycle limit.",
  },
  {
    id: "CYC-004",
    rego: "VH-XYU",
    component: "Propeller Governor (L/H)",
    partNo: "PM-A-U8-14",
    limitType: "hours",
    cycleLimit: 0,
    cyclesUsed: 0,
    cyclesRemaining: 0,
    avgHoursPerCycle: 0,
    projectedDueByCycles: "N/A — hours limit only",
    hoursRemaining: 210,
    cyclesDueBeforeHours: false,
    urgency: "watch",
    base: "Dubbo (YSDU)",
    notes: "Hours-only limit. No cycle concern. Monitor as part of annual inspection scope.",
  },
  {
    id: "CYC-005",
    rego: "VH-MVW",
    component: "Brake Pack L/H & R/H",
    partNo: "2-1546-2",
    limitType: "cycles",
    cycleLimit: 600,
    cyclesUsed: 441,
    cyclesRemaining: 159,
    avgHoursPerCycle: 1.1,
    projectedDueByCycles: "est. 8 Oct 2026",
    hoursRemaining: 310,
    cyclesDueBeforeHours: true,   // cycles expire before hours at YBHI pace
    urgency: "watch",
    base: "Broken Hill (YBHI)",
    notes: "BHI short-sector pattern to YMLT and Tibooburra. Cycles accumulating faster than hours. Watch closely — if YMLT rotations increase this quarter, bring forward.",
  },
  {
    id: "CYC-006",
    rego: "VH-XYJ",
    component: "Propeller L/H",
    partNo: "HC-E4A-3D/E10477",
    limitType: "hours",
    cycleLimit: 0,
    cyclesUsed: 0,
    cyclesRemaining: 0,
    avgHoursPerCycle: 0,
    projectedDueByCycles: "N/A — hours limit only",
    hoursRemaining: 260,
    cyclesDueBeforeHours: false,
    urgency: "watch",
    base: "Dubbo (YSDU)",
    notes: "Due for overhaul at 2,400 TBO. Hours-only limit applies. Combined with 120hr check.",
  },
];

// ── Timeline event type ──────────────────────────────────────────────────────
export interface TimelineEvent {
  eventId: string;
  rego: string;
  serviceType: string;
  maintenanceBase: string;
  lame: string;
  urgency: string;
  windowOpen: Date;
  windowClose: Date;
  windowExt: Date;
  groundStart: Date;
  groundEnd: Date;
  ferryRequired: boolean;
  ferryBase: string;
  notes: string;
  // Live hours approximation
  currentHours: number;
  hoursAtWindowOpen: number;
  hoursAtWindowClose: number;
  dailyHourBurn: number; // avg hrs/day
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    eventId: "EVT-001",
    rego: "VH-XYJ",
    serviceType: "120 hr check + Prop overhauls",
    maintenanceBase: "Dubbo (YSDU)",
    lame: "LAME D. Evans",
    urgency: "plan",
    windowOpen:   new Date(2026, 5, 15),
    windowClose:  new Date(2026, 5, 28),
    windowExt:    new Date(2026, 6, 8),
    groundStart:  new Date(2026, 5, 20),
    groundEnd:    new Date(2026, 5, 24),
    ferryRequired: false,
    ferryBase: "N/A — at base",
    notes: "Propeller L/H and R/H overhaul combined with 120hr check. ~1.8 hrs/day burn rate.",
    currentHours: 14822,
    hoursAtWindowOpen: 14840,
    hoursAtWindowClose: 14864,
    dailyHourBurn: 1.8,
  },
  {
    eventId: "EVT-002",
    rego: "VH-XYR",
    serviceType: "6-Monthly check + MEL (door seal)",
    maintenanceBase: "Dubbo (YSDU)",
    lame: "LAME J. Torres",
    urgency: "urgent",
    windowOpen:   new Date(2026, 5, 7),
    windowClose:  new Date(2026, 5, 13),
    windowExt:    new Date(2026, 5, 27),
    groundStart:  new Date(2026, 5, 10),
    groundEnd:    new Date(2026, 5, 17),
    ferryRequired: true,
    ferryBase: "Ferry: YBHI → YSDU",
    notes: "MEL cabin door seal expiry 13 Jun — hard deadline. Extension window for 6-monthly only.",
    currentHours: 12305,
    hoursAtWindowOpen: 12340,
    hoursAtWindowClose: 12393,
    dailyHourBurn: 1.6,
  },
  {
    eventId: "EVT-003",
    rego: "VH-XYU",
    serviceType: "Annual inspection (IN PROGRESS)",
    maintenanceBase: "Dubbo (YSDU)",
    lame: "LAME J. Torres",
    urgency: "critical",
    windowOpen:   new Date(2026, 5, 1),
    windowClose:  new Date(2026, 5, 10),
    windowExt:    new Date(2026, 5, 10),
    groundStart:  new Date(2026, 5, 1),
    groundEnd:    new Date(2026, 5, 10),
    ferryRequired: false,
    ferryBase: "N/A — at base",
    notes: "AOG: R/H brake pack — part ETA 7 Jun. Annual does not attract extension provisions.",
    currentHours: 0,
    hoursAtWindowOpen: 0,
    hoursAtWindowClose: 0,
    dailyHourBurn: 0,
  },
  {
    eventId: "EVT-004",
    rego: "VH-MVW",
    serviceType: "Annual inspection",
    maintenanceBase: "Broken Hill (YBHI)",
    lame: "LAME D. Evans",
    urgency: "watch",
    windowOpen:   new Date(2026, 7, 1),
    windowClose:  new Date(2026, 7, 15),
    windowExt:    new Date(2026, 7, 15),
    groundStart:  new Date(2026, 7, 10),
    groundEnd:    new Date(2026, 7, 20),
    ferryRequired: false,
    ferryBase: "N/A — at base",
    notes: "Book LAME slot by 1 Jul. 7–10 day ground time expected.",
    currentHours: 15130,
    hoursAtWindowOpen: 15380,
    hoursAtWindowClose: 15440,
    dailyHourBurn: 1.4,
  },
];

type ViewMode = "1W" | "1M" | "3M" | "6M";

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function diffDays(a: Date, b: Date)  { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function fmtShort(d: Date)           { return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }); }
function fmtFull(d: Date)            { return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }); }

const VIEW_DAYS: Record<ViewMode, number> = { "1W": 7, "1M": 30, "3M": 91, "6M": 182 };

const URGENCY_BAR: Record<string, string> = {
  critical: "bg-red-500/30 border-red-500",
  urgent:   "bg-orange-500/30 border-orange-500",
  watch:    "bg-amber-500/30 border-amber-400",
  plan:     "bg-blue-500/20 border-blue-400",
};
const URGENCY_DOT: Record<string, string> = {
  critical: "bg-red-400", urgent: "bg-orange-400", watch: "bg-amber-400", ok: "bg-green-400", plan: "bg-blue-400",
};
const URGENCY_TEXT: Record<string, string> = {
  critical: "text-red-400", urgent: "text-orange-400", watch: "text-amber-400", ok: "text-green-400", plan: "text-blue-400",
};
const URGENCY_BADGE: Record<string, string> = {
  critical: "status-red", urgent: "status-orange", watch: "status-yellow", ok: "status-green", plan: "status-blue",
};

// ── Hours Until component ────────────────────────────────────────────────────
function HoursUntilRow({ evt, today }: { evt: TimelineEvent; today: Date }) {
  const daysToOpen  = diffDays(today, evt.windowOpen);
  const daysToClose = diffDays(today, evt.windowClose);
  const daysToExt   = diffDays(today, evt.windowExt);
  const hasExt      = diffDays(evt.windowClose, evt.windowExt) > 0;
  const inGround    = today >= evt.groundStart && today <= evt.groundEnd;
  const isOverdue   = today > evt.windowClose;

  // Approx current hours (project forward from known currentHours)
  const daysSinceBase = 0; // hours already reflect today
  const approxNowHrs  = evt.currentHours;

  const hrsToOpen  = evt.hoursAtWindowOpen  - approxNowHrs;
  const hrsToClose = evt.hoursAtWindowClose - approxNowHrs;
  const approxNote = evt.dailyHourBurn > 0
    ? `~${evt.dailyHourBurn} hr/day burn rate — ±10% depending on ops tempo`
    : "Aircraft on maintenance hold";

  if (evt.currentHours === 0 && evt.dailyHourBurn === 0) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
        <RotateCcw size={10} /> Aircraft on maintenance hold — hours accumulation paused
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        {/* Window Open */}
        <div className={`p-2 rounded-lg border ${daysToOpen > 0 ? "border-green-400/30 bg-green-500/5" : "border-card-border bg-muted/10"}`}>
          <div className="flex items-center gap-1 mb-1"><span className="text-green-400 text-xs">◆</span><span className="text-muted-foreground font-semibold">Window Open</span></div>
          <div className="font-bold text-xs">{fmtShort(evt.windowOpen)}</div>
          {daysToOpen > 0 ? (
            <>
              <div className="text-muted-foreground">{daysToOpen}d away</div>
              {hrsToOpen > 0 && <div className="text-green-400 font-semibold">~{hrsToOpen.toFixed(0)} hrs to accumulate</div>}
            </>
          ) : (
            <div className="text-green-400 font-semibold">Window open ✓</div>
          )}
        </div>

        {/* Window Close — no ext */}
        <div className={`p-2 rounded-lg border ${isOverdue ? "border-red-400/50 bg-red-500/10" : daysToClose < 14 ? "border-red-400/30 bg-red-500/5" : "border-card-border bg-muted/10"}`}>
          <div className="flex items-center gap-1 mb-1"><span className="text-red-400 font-bold text-xs">✕</span><span className="text-muted-foreground font-semibold">Close (no ext.)</span></div>
          <div className={`font-bold text-xs ${daysToClose < 14 ? "text-red-400" : ""}`}>{fmtShort(evt.windowClose)}</div>
          {isOverdue ? (
            <div className="text-red-400 font-bold">OVERDUE</div>
          ) : (
            <>
              <div className={daysToClose < 14 ? "text-red-400" : "text-muted-foreground"}>{daysToClose}d remaining</div>
              {hrsToClose > 0 && <div className="text-red-400 font-semibold">~{hrsToClose.toFixed(0)} hrs to limit</div>}
            </>
          )}
        </div>

        {/* Window Close — ext */}
        {hasExt ? (
          <div className="p-2 rounded-lg border border-amber-400/30 bg-amber-500/5">
            <div className="flex items-center gap-1 mb-1"><span className="text-amber-400 text-xs">⬡</span><span className="text-muted-foreground font-semibold">Close (ext.)</span></div>
            <div className="font-bold text-xs text-amber-400">{fmtShort(evt.windowExt)}</div>
            <div className="text-amber-400">{daysToExt}d w/ ext.</div>
            <div className="text-[9px] text-muted-foreground italic">Airworthiness approval req.</div>
          </div>
        ) : (
          <div className="p-2 rounded-lg border border-card-border bg-muted/10">
            <div className="flex items-center gap-1 mb-1"><span className="text-muted-foreground text-xs">⬡</span><span className="text-muted-foreground font-semibold">No extension</span></div>
            <div className="text-[10px] text-muted-foreground italic">This service type does not attract extension provisions under CASR Part 42.</div>
          </div>
        )}
      </div>

      {/* Burn rate note */}
      {evt.dailyHourBurn > 0 && (
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-muted/10 rounded-lg px-2 py-1.5">
          <Info size={9} className="shrink-0" />
          <span>Hours estimated from current airframe time {approxNowHrs.toLocaleString()} hrs · {approxNote}</span>
        </div>
      )}
    </div>
  );
}

// ── Cycles Alert Panel ───────────────────────────────────────────────────────
export function CyclesAlertPanel({ onDismiss }: { onDismiss?: () => void }) {
  const critical = CYCLE_ALERTS.filter(a => a.cyclesDueBeforeHours && a.urgency !== "ok");
  const all = CYCLE_ALERTS;

  return (
    <div className="space-y-4">

      {/* Banner — cycles before hours warning */}
      {critical.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-400/40 bg-orange-500/8">
          <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-orange-400 mb-1">
              {critical.length} component{critical.length > 1 ? "s" : ""} will reach cycle limit BEFORE hour limit
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Short-sector operations at YMLT (Moree), Tibooburra, Wilcannia, and similar aerodromes cause cycles to accumulate significantly faster than hours. These components will expire by cycles while hours remaining appear healthy — the exact scenario that creates missed limits.
            </div>
          </div>
        </div>
      )}

      {/* Component table */}
      <div className="bg-card rounded-xl border border-card-border overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Component Limits — Cycles vs Hours
          </div>
          <div className="text-[10px] text-muted-foreground">YMLT short-sector flag active for YBHI fleet</div>
        </div>

        <div className="divide-y divide-card-border">
          {all.map(alert => {
            const pctCycles = alert.limitType !== "hours" ? (alert.cyclesUsed / alert.cycleLimit) * 100 : 0;
            const isCritical = alert.cyclesDueBeforeHours;

            return (
              <div
                key={alert.id}
                data-testid={`cycle-alert-${alert.id}`}
                className={`p-4 ${isCritical ? "bg-orange-500/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${URGENCY_DOT[alert.urgency]}`} />

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold">{alert.rego}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${URGENCY_BADGE[alert.urgency]}`}>
                        {alert.urgency.charAt(0).toUpperCase() + alert.urgency.slice(1)}
                      </span>
                      {isCritical && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-400/30">
                          ⚠ CYCLES DUE BEFORE HOURS
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground ml-auto">{alert.base.split(" ")[0]}</span>
                    </div>

                    <div className="text-xs font-semibold mb-0.5">{alert.component}</div>
                    <div className="text-[9px] text-muted-foreground mb-2">P/N: {alert.partNo}</div>

                    {/* Limits grid */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      {/* Cycles column */}
                      {alert.limitType !== "hours" && (
                        <div>
                          <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
                            <Zap size={9} /> Cycles
                          </div>
                          <div className="flex items-end gap-2 mb-1">
                            <span className={`text-sm font-bold ${alert.cyclesRemaining < 100 ? "text-orange-400" : alert.cyclesRemaining < 200 ? "text-amber-400" : "text-foreground"}`}>
                              {alert.cyclesRemaining.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-muted-foreground">remaining / {alert.cycleLimit.toLocaleString()} limit</span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pctCycles > 90 ? "bg-red-400" : pctCycles > 75 ? "bg-orange-400" : pctCycles > 60 ? "bg-amber-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(pctCycles, 100)}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{pctCycles.toFixed(0)}% used</div>
                          {alert.avgHoursPerCycle > 0 && (
                            <div className="text-[9px] text-amber-400 mt-0.5">
                              Due by cycles: {alert.projectedDueByCycles}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hours column */}
                      <div>
                        <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock size={9} /> Hours remaining
                        </div>
                        {alert.hoursRemaining !== null ? (
                          <>
                            <div className="flex items-end gap-2 mb-1">
                              <span className={`text-sm font-bold ${alert.hoursRemaining < 100 ? "text-orange-400" : "text-foreground"}`}>
                                {alert.hoursRemaining.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-muted-foreground">hrs to limit</span>
                            </div>
                            {isCritical && (
                              <div className="text-[9px] text-orange-400 font-semibold">
                                Cycles expire ~{Math.round(alert.cyclesRemaining * alert.avgHoursPerCycle).toLocaleString()} hrs sooner
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-[9px] text-muted-foreground italic">Hours-unlimited component</div>
                        )}
                      </div>
                    </div>

                    {/* YMLT short-sector context */}
                    {alert.avgHoursPerCycle > 0 && alert.avgHoursPerCycle < 1.2 && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/5 border border-amber-400/20 text-[9px] text-muted-foreground">
                        <AlertTriangle size={9} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>Short-sector ops detected ({alert.avgHoursPerCycle} hr/cycle avg). At YMLT, Tibooburra, or Wilcannia, cycle burn rate increases significantly. This component will expire by cycles before hours.</span>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="text-[9px] text-muted-foreground mt-1.5 italic leading-relaxed">
                      {alert.notes}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* YMLT explanation card */}
      <div className="p-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5">
        <div className="flex items-start gap-2">
          <Info size={13} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-cyan-400 mb-1">Why YMLT (Moree) and short sectors matter</div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              A typical RFDS SE sector from YBHI averages ~1.4 hrs. A YMLT (Moree) sector averages ~0.6 hrs — less than half. Components with cycle limits accumulate those cycles at the same rate regardless of flight time. At YMLT ops tempo, an aircraft can burn through 10 cycles in a day that logs only 6 hours. A component with 100 cycles remaining and 280 hours remaining will expire <strong className="text-foreground">in days</strong>, not weeks — exactly what gets missed when you only check the hours column. This panel flags any component where projected cycle expiry comes before projected hour expiry, regardless of which limit looks healthy at a glance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skynet Timeline ──────────────────────────────────────────────────────────
export function SkynetTimeline({ onSelectEvent }: { onSelectEvent: (id: string) => void }) {
  const today = new Date(2026, 6, 7);
  const [view, setView] = React.useState<ViewMode>("3M");
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [tooltipEvent, setTooltipEvent] = React.useState<TimelineEvent | null>(null);
  const [tooltipX, setTooltipX] = React.useState(0);
  const [tooltipY, setTooltipY] = React.useState(0);
  const [showCycles, setShowCycles] = React.useState(false);

  const totalDays  = VIEW_DAYS[view];
  const rangeStart = today;
  const rangeEnd   = addDays(today, totalDays);

  const headers = React.useMemo(() => {
    const cols: { label: string; date: Date; isToday: boolean; isWeekend: boolean }[] = [];
    if (view === "1W") {
      for (let i = 0; i < 7; i++) {
        const d = addDays(rangeStart, i);
        cols.push({ label: d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }), date: d, isToday: i === 0, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
      }
    } else if (view === "1M") {
      for (let i = 0; i < 30; i++) {
        const d = addDays(rangeStart, i);
        cols.push({ label: d.getDate() === 1 || i === 0 ? d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : String(d.getDate()), date: d, isToday: i === 0, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
      }
    } else if (view === "3M") {
      let d = new Date(rangeStart);
      while (d < rangeEnd) {
        cols.push({ label: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }), date: new Date(d), isToday: diffDays(rangeStart, d) === 0, isWeekend: false });
        d = addDays(d, 7);
      }
    } else {
      let m = rangeStart.getMonth(), y = rangeStart.getFullYear();
      for (let i = 0; i < 7; i++) {
        const d = new Date(y, m, 1);
        if (d > rangeEnd) break;
        cols.push({ label: d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" }), date: d, isToday: i === 0, isWeekend: false });
        m++; if (m > 11) { m = 0; y++; }
      }
    }
    return cols;
  }, [view]);

  function dateToPercent(d: Date) {
    const c = Math.max(rangeStart.getTime(), Math.min(rangeEnd.getTime(), d.getTime()));
    return ((c - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100;
  }
  function isInRange(evt: TimelineEvent) { return evt.windowOpen < rangeEnd && evt.windowExt >= rangeStart; }

  const cycleWarningCount = CYCLE_ALERTS.filter(a => a.cyclesDueBeforeHours).length;

  return (
    <div className="space-y-4">

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View selector */}
        <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-card-border">
          {(["1W","1M","3M","6M"] as ViewMode[]).map(v => (
            <button key={v} data-testid={`timeline-view-${v}`} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? "bg-card border border-card-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {v}
            </button>
          ))}
        </div>

        {/* Cycles toggle */}
        <button
          data-testid="btn-cycles-panel"
          onClick={() => setShowCycles(s => !s)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
            ${showCycles ? "bg-orange-500/20 border-orange-400/50 text-orange-400" : "bg-card border-card-border text-muted-foreground hover:text-orange-400 hover:border-orange-400/30"}`}
        >
          <Zap size={12} />
          Cycles / Hours Alert
          {cycleWarningCount > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold">
              {cycleWarningCount}
            </span>
          )}
        </button>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] ml-auto">
          <span className="flex items-center gap-1"><span className="text-green-400">◆</span>Window Open</span>
          <span className="flex items-center gap-1"><span className="text-red-400 font-bold">✕</span>Close (no ext.)</span>
          <span className="flex items-center gap-1"><span className="text-amber-400">⬡</span>Close (ext.)</span>
          <span className="flex items-center gap-1"><div className="w-5 h-2 rounded-sm bg-blue-500/30 border border-blue-400" />Ground</span>
          <span className="flex items-center gap-1"><div className="w-px h-3 bg-cyan-400" />Today</span>
        </div>
      </div>

      {/* Cycles alert panel (collapsible) */}
      {showCycles && <CyclesAlertPanel />}

      {/* Gantt grid */}
      <div className="bg-card rounded-xl border border-card-border overflow-hidden">
        {/* Header */}
        <div className="flex border-b border-card-border bg-muted/20">
          <div className="w-36 shrink-0 px-3 py-2 border-r border-card-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rego / Type</div>
          <div className="flex-1 overflow-hidden">
            <div className="flex">
              {headers.map((h, i) => (
                <div key={i} className={`flex-1 text-center text-[9px] py-2 border-r border-card-border/50 font-semibold truncate
                  ${h.isToday ? "text-cyan-400 bg-cyan-400/10" : h.isWeekend ? "text-muted-foreground/40 bg-muted/10" : "text-muted-foreground"}`}>
                  {h.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-card-border">
          {FLEET_ROWS.map((aircraft, rowIdx) => {
            const rowEvents = TIMELINE_EVENTS.filter(e => e.rego === aircraft.rego && isInRange(e));
            const rowCycleAlerts = CYCLE_ALERTS.filter(a => a.rego === aircraft.rego && a.cyclesDueBeforeHours);
            return (
              <div key={aircraft.rego} className={`flex min-h-[60px] ${rowIdx % 2 === 0 ? "" : "bg-muted/5"}`}>
                {/* Label */}
                <div className="w-36 shrink-0 px-3 py-2 border-r border-card-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{aircraft.rego}</span>
                    {rowCycleAlerts.length > 0 && (
                      <span title={`${rowCycleAlerts.length} cycle alert(s)`} className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[8px] flex items-center justify-center font-bold shrink-0">
                        {rowCycleAlerts.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground">{aircraft.type}</div>
                  <div className="text-[9px] text-muted-foreground">{aircraft.base.split(" ")[0]}</div>
                </div>

                {/* Track */}
                <div className="flex-1 relative overflow-hidden py-1">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {headers.map((h, i) => (
                      <div key={i} className={`flex-1 border-r border-card-border/20 ${h.isWeekend ? "bg-muted/8" : ""} ${h.isToday ? "bg-cyan-400/4" : ""}`} />
                    ))}
                  </div>
                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-px bg-cyan-400/60 z-20 pointer-events-none" style={{ left: `${dateToPercent(today)}%` }} />

                  {rowEvents.length === 0 && (
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-[9px] text-muted-foreground/30 italic">No events in window</span>
                    </div>
                  )}

                  {rowEvents.map(evt => {
                    const openPct   = dateToPercent(evt.windowOpen);
                    const closePct  = dateToPercent(evt.windowClose);
                    const extPct    = dateToPercent(evt.windowExt);
                    const gStartPct = dateToPercent(evt.groundStart);
                    const gEndPct   = dateToPercent(evt.groundEnd);
                    const hasExt    = diffDays(evt.windowClose, evt.windowExt) > 0;
                    return (
                      <div key={evt.eventId} className="absolute inset-0 flex items-center">
                        {/* Ground bar */}
                        <div
                          className={`absolute h-6 rounded border cursor-pointer transition-all ${URGENCY_BAR[evt.urgency]} ${hoveredId === evt.eventId ? "opacity-100 shadow-lg" : "opacity-75"}`}
                          style={{ left: `${gStartPct}%`, width: `${Math.max(gEndPct - gStartPct, 0.8)}%`, top: "50%", transform: "translateY(-50%)" }}
                          onMouseEnter={e => { setHoveredId(evt.eventId); setTooltipEvent(evt); setTooltipX(e.clientX); setTooltipY(e.clientY); }}
                          onMouseLeave={() => { setHoveredId(null); setTooltipEvent(null); }}
                          onClick={() => onSelectEvent(evt.eventId)}
                          data-testid={`timeline-bar-${evt.eventId}`}
                        >
                          <div className={`px-1.5 text-[8px] font-bold truncate leading-6 ${URGENCY_TEXT[evt.urgency]}`}>
                            {evt.serviceType.split(" ").slice(0, 3).join(" ")}
                            {evt.ferryRequired ? " ✈" : ""}
                          </div>
                        </div>
                        {/* ◆ Open */}
                        {openPct >= 0 && openPct <= 100 && (
                          <div className="absolute z-30 cursor-pointer" style={{ left: `${openPct}%`, top: "50%", transform: "translate(-50%,-50%)" }}
                            onMouseEnter={e => { setHoveredId(evt.eventId); setTooltipEvent(evt); setTooltipX(e.clientX); setTooltipY(e.clientY); }}
                            onMouseLeave={() => { setHoveredId(null); setTooltipEvent(null); }}
                            onClick={() => onSelectEvent(evt.eventId)} data-testid={`marker-open-${evt.eventId}`}>
                            <span className="text-green-400 text-base leading-none select-none drop-shadow-sm">◆</span>
                          </div>
                        )}
                        {/* ✕ Close */}
                        {closePct >= 0 && closePct <= 100 && (
                          <div className="absolute z-30 cursor-pointer" style={{ left: `${closePct}%`, top: "50%", transform: "translate(-50%,-50%)" }}
                            onMouseEnter={e => { setHoveredId(evt.eventId); setTooltipEvent(evt); setTooltipX(e.clientX); setTooltipY(e.clientY); }}
                            onMouseLeave={() => { setHoveredId(null); setTooltipEvent(null); }}
                            onClick={() => onSelectEvent(evt.eventId)} data-testid={`marker-close-${evt.eventId}`}>
                            <span className="text-red-400 font-black text-sm leading-none select-none drop-shadow-sm">✕</span>
                          </div>
                        )}
                        {/* ⬡ Extension */}
                        {hasExt && extPct >= 0 && extPct <= 100 && (
                          <div className="absolute z-30 cursor-pointer" style={{ left: `${extPct}%`, top: "50%", transform: "translate(-50%,-50%)" }}
                            onMouseEnter={e => { setHoveredId(evt.eventId); setTooltipEvent(evt); setTooltipX(e.clientX); setTooltipY(e.clientY); }}
                            onMouseLeave={() => { setHoveredId(null); setTooltipEvent(null); }}
                            onClick={() => onSelectEvent(evt.eventId)} data-testid={`marker-ext-${evt.eventId}`}>
                            <span className="text-amber-400 text-base leading-none select-none drop-shadow-sm">⬡</span>
                          </div>
                        )}
                        {/* Dashed extension zone */}
                        {hasExt && closePct >= 0 && extPct <= 100 && (
                          <div className="absolute h-px border-t-2 border-dashed border-amber-400/40 pointer-events-none z-10"
                            style={{ left: `${closePct}%`, width: `${Math.max(extPct - closePct, 0)}%`, top: "50%" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover tooltip — fixed to mouse position */}
      {tooltipEvent && (
        <div className="fixed z-50 pointer-events-none" style={{ left: tooltipX + 14, top: tooltipY - 8 }}>
          <div className="bg-card border border-card-border rounded-xl shadow-2xl p-4 w-80 text-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_DOT[tooltipEvent.urgency]}`} />
              <span className="font-bold">{tooltipEvent.rego}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${URGENCY_BADGE[tooltipEvent.urgency]}`}>
                {tooltipEvent.urgency.charAt(0).toUpperCase() + tooltipEvent.urgency.slice(1)}
              </span>
              {tooltipEvent.ferryRequired && <span className="text-cyan-400 text-[9px] font-bold ml-auto">✈ Ferry reqd.</span>}
            </div>
            <div className="font-semibold text-foreground mb-2">{tooltipEvent.serviceType}</div>
            <div className="space-y-1 text-[10px] mb-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Maintenance base</span><span className="font-semibold text-cyan-400">{tooltipEvent.maintenanceBase}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">LAME</span><span className="font-semibold">{tooltipEvent.lame}</span></div>
              {tooltipEvent.ferryRequired && <div className="flex justify-between"><span className="text-muted-foreground">Ferry</span><span className="font-semibold text-cyan-400">{tooltipEvent.ferryBase}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Ground period</span><span className="font-semibold">{fmtShort(tooltipEvent.groundStart)} – {fmtShort(tooltipEvent.groundEnd)}</span></div>
            </div>
            {/* 3 markers */}
            <div className="border-t border-card-border pt-2 space-y-1 text-[10px]">
              <div className="flex items-center justify-between"><span className="flex items-center gap-1"><span className="text-green-400">◆</span>Window Open</span><span className="font-semibold">{fmtShort(tooltipEvent.windowOpen)}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1"><span className="text-red-400 font-bold">✕</span>Close (no ext.)</span><span className="font-semibold text-red-400">{fmtShort(tooltipEvent.windowClose)}</span></div>
              {diffDays(tooltipEvent.windowClose, tooltipEvent.windowExt) > 0
                ? <div className="flex items-center justify-between"><span className="flex items-center gap-1"><span className="text-amber-400">⬡</span>Close (ext. applied)</span><span className="font-semibold text-amber-400">{fmtShort(tooltipEvent.windowExt)}</span></div>
                : <div className="flex items-center justify-between"><span className="flex items-center gap-1"><span className="text-muted-foreground">⬡</span>No extension</span><span className="text-muted-foreground italic text-[9px]">Not applicable</span></div>
              }
            </div>
            {/* Hours countdown */}
            {tooltipEvent.currentHours > 0 && (
              <div className="border-t border-card-border pt-2 mt-2 space-y-0.5 text-[10px]">
                <div className="text-muted-foreground font-semibold mb-1">Hours estimate</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Current airframe</span><span className="font-semibold">{tooltipEvent.currentHours.toLocaleString()} hrs</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Hrs to window open</span><span className="font-semibold text-green-400">~{(tooltipEvent.hoursAtWindowOpen - tooltipEvent.currentHours).toFixed(0)} hrs</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Hrs to close (no ext.)</span><span className="font-semibold text-red-400">~{(tooltipEvent.hoursAtWindowClose - tooltipEvent.currentHours).toFixed(0)} hrs</span></div>
                <div className="text-[9px] text-muted-foreground italic mt-0.5">~{tooltipEvent.dailyHourBurn} hr/day · ±10%</div>
              </div>
            )}
            {tooltipEvent.notes && (
              <div className="border-t border-card-border pt-2 mt-2 text-[9px] text-muted-foreground italic leading-relaxed">{tooltipEvent.notes}</div>
            )}
            <div className="mt-2 pt-2 border-t border-card-border text-[9px] text-muted-foreground">Click to open AI Planner detail</div>
          </div>
        </div>
      )}

      {/* Hours Until summary — below the Gantt */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Live Hours Until Window Open / Close
          <span className="ml-2 text-[9px] normal-case font-normal">(estimated from current airframe hours + ops burn rate)</span>
        </div>
        {TIMELINE_EVENTS.filter(e => isInRange(e)).map(evt => (
          <div key={evt.eventId} className="bg-card rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${URGENCY_DOT[evt.urgency]}`} />
              <span className="text-xs font-bold">{evt.rego}</span>
              <span className="text-xs text-muted-foreground">— {evt.serviceType}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ml-auto ${URGENCY_BADGE[evt.urgency]}`}>
                {evt.urgency.charAt(0).toUpperCase() + evt.urgency.slice(1)}
              </span>
            </div>
            <HoursUntilRow evt={evt} today={today} />
          </div>
        ))}
      </div>

      {/* Window summary table */}
      <div className="bg-card rounded-xl border border-card-border overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Window Summary — {VIEW_DAYS[view]}-Day Horizon
          </div>
        </div>
        <div className="divide-y divide-card-border">
          {TIMELINE_EVENTS.filter(e => isInRange(e)).map(evt => {
            const daysToClose = diffDays(today, evt.windowClose);
            const extDays     = diffDays(evt.windowClose, evt.windowExt);
            return (
              <button key={evt.eventId} data-testid={`timeline-row-${evt.eventId}`}
                onClick={() => onSelectEvent(evt.eventId)}
                className="w-full text-left px-5 py-3 hover:bg-muted/10 transition-colors grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 font-bold text-xs">{evt.rego}</div>
                <div className="col-span-3 text-xs text-muted-foreground truncate">{evt.serviceType}</div>
                <div className="col-span-2 text-[10px] text-cyan-400 font-semibold">{evt.maintenanceBase.split(" ")[0]}</div>
                <div className="col-span-2 flex items-center gap-1 text-[10px]"><span className="text-green-400">◆</span>{fmtShort(evt.windowOpen)}</div>
                <div className="col-span-2 flex items-center gap-1 text-[10px]">
                  <span className="text-red-400 font-bold">✕</span>
                  <span className={daysToClose < 14 ? "text-red-400 font-semibold" : ""}>{fmtShort(evt.windowClose)}</span>
                  {daysToClose >= 0 && <span className="text-muted-foreground">({daysToClose}d)</span>}
                </div>
                <div className="col-span-2">
                  {extDays > 0
                    ? <div className="flex items-center gap-1 text-[10px]"><span className="text-amber-400">⬡</span><span className="text-amber-400">{fmtShort(evt.windowExt)}</span><span className="text-muted-foreground">(+{extDays}d)</span></div>
                    : <span className="text-[9px] text-muted-foreground italic">No ext.</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
