import { useState, useMemo } from "react";
import { type UserRole } from "@/lib/data";
import {
  Brain, Plane, Wrench, Calendar, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Download, RefreshCw, Zap,
  ArrowRight, MapPin, User, Package, Shield, BarChart2,
  AlertCircle, Info, Play, ChevronLeft, Grid3x3, BarChart
} from "lucide-react";
import { SkynetTimeline } from "@/components/SkynetTimeline";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ── Shift allocation data ────────────────────────────────────────────────────

const SHIFT_ALLOCATION_DATA = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  aircraft: [
    { rego: 'VH-XYJ', base: 'Dubbo',       shifts: ['AM', 'AM', 'PM', 'PM', 'Night', 'Spare', 'Spare'] },
    { rego: 'VH-XYR', base: 'Broken Hill',  shifts: ['AM', 'PM', 'Maintenance', 'Maintenance', 'RTS', 'AM', 'PM'] },
    { rego: 'VH-XYU', base: 'Dubbo',        shifts: ['Maintenance', 'Maintenance', 'Maintenance', 'RTS', 'AM', 'PM', 'Night'] },
    { rego: 'VH-MWH', base: 'Dubbo',        shifts: ['PM', 'Night', 'AM', 'PM', 'Spare', 'Spare', 'AM'] },
    { rego: 'VH-MVX', base: 'Broken Hill',  shifts: ['Night', 'Spare', 'AM', 'AM', 'PM', 'Night', 'Spare'] },
    { rego: 'VH-NAJ', base: 'Dubbo',        shifts: ['Ferry', 'Ferry', 'AM', 'PM', 'Night', 'AM', 'PM'] },
  ],
};

// ── Maintenance event data ───────────────────────────────────────────────────

const UPCOMING_EVENTS = [
  {
    id: "EVT-001",
    aircraft: "VH-XYJ",
    type: "King Air B200",
    currentBase: "Dubbo (YSDU)",
    maintenanceBase: "Dubbo (YSDU)",
    ferryRequired: false,
    serviceType: "120 hr check",
    dueDate: "28 Jun 2026",
    dueHours: "14,864 hrs",
    remainingHours: 42,
    remainingDays: 23,
    urgency: "plan",
    urgencyColor: "text-blue-400",
    urgencyBg: "status-blue",
    // Calendar span: ground time 3–4 days, window 20–24 Jun 2026
    calStart: new Date(2026, 5, 20), // Jun 20
    calEnd:   new Date(2026, 5, 24), // Jun 24
    components: [
      { name: "Propeller L/H overhaul", remaining: "260 hrs", due: "est. 28 Jun 2026", status: "warn" },
      { name: "Propeller R/H overhaul", remaining: "260 hrs", due: "est. 28 Jun 2026", status: "warn" },
    ],
    aiPlan: {
      summary: "VH-XYJ is currently based at Dubbo — the maintenance base. No ferry flight is required for the upcoming 120 hr check and propeller overhauls. I recommend scheduling the check window during a low-operational-tempo period to minimise mission impact. Based on current flying rate (~1.8 hrs/day), the aircraft will reach the 120 hr interval in approximately 23 days.",
      ferryOutDate: null, ferryOutRoute: null, ferryReturnDate: null, ferryReturnRoute: null,
      groundTime: "3–4 days (120 hr check + prop overhauls combined)",
      pilotRequired: "Capt. R. Hughes or Capt. T. Barnes (ferry-endorsed)",
      windowRecommendation: "20–24 Jun 2026 (low NEPT demand historically — pre-school holiday window)",
      coverAircraft: "VH-XYR repositioned from Broken Hill to Dubbo to maintain operational cover",
      actions: [
        { label: "Schedule 120 hr check", owner: "Eng. D. Evans", due: "By 10 Jun 2026", status: "pending" },
        { label: "Order propeller overhaul parts", owner: "Eng. D. Evans", due: "By 12 Jun 2026", status: "pending" },
        { label: "Confirm LAME availability", owner: "Ops Manager", due: "By 12 Jun 2026", status: "pending" },
        { label: "Notify Dubbo crew schedule", owner: "Dispatcher", due: "By 15 Jun 2026", status: "pending" },
        { label: "Arrange VH-XYR cover reposition", owner: "Ops Manager", due: "By 18 Jun 2026", status: "pending" },
      ],
    },
  },
  {
    id: "EVT-002",
    aircraft: "VH-XYR",
    type: "King Air B200",
    currentBase: "Broken Hill (YBHI)",
    maintenanceBase: "Dubbo (YSDU)",
    ferryRequired: true,
    serviceType: "6-Monthly check",
    dueDate: "18 Jul 2026",
    dueHours: "12,393 hrs",
    remainingHours: 88,
    remainingDays: 43,
    urgency: "plan",
    urgencyColor: "text-blue-400",
    urgencyBg: "status-blue",
    calStart: new Date(2026, 5, 10), // Jun 10 (ferry out)
    calEnd:   new Date(2026, 5, 17), // Jun 17 (RTS)
    components: [
      { name: "Cabin door seal replacement", remaining: "MEL — 13 Jun 2026", due: "13 Jun 2026", status: "warn" },
    ],
    aiPlan: {
      summary: "VH-XYR is based at Broken Hill. The 6-monthly check and active MEL item (cabin door seal) both require ferry to Dubbo — the nearest certified maintenance base. I recommend combining both defect rectification and the scheduled service in one maintenance visit to minimise total ground time and ferry movements. The MEL expiry on 13 Jun 2026 creates a hard deadline for the ferry-OUT departure.",
      ferryOutDate: "10–11 Jun 2026", ferryOutRoute: "YBHI → YSDU (ferry, no medical config)",
      ferryReturnDate: "est. 17 Jun 2026", ferryReturnRoute: "YSDU → YBHI (return to service)",
      groundTime: "5–6 days (defect + 6-monthly combined)",
      pilotRequired: "Capt. T. Barnes (Broken Hill based, ferry-endorsed)",
      windowRecommendation: "Ferry-OUT by 10 Jun 2026 — MEL hard deadline 13 Jun. Combined service window 10–16 Jun 2026.",
      coverAircraft: "VH-XYJ repositioned to Broken Hill or NEPT missions re-routed via Dubbo during ground period",
      actions: [
        { label: "Book LAME — Dubbo maintenance base", owner: "Eng. D. Evans", due: "By 7 Jun 2026", status: "urgent" },
        { label: "Order cabin door seal part", owner: "Eng. D. Evans", due: "By 7 Jun 2026", status: "urgent" },
        { label: "Plan ferry-OUT — YBHI→YSDU", owner: "Capt. T. Barnes", due: "By 9 Jun 2026", status: "urgent" },
        { label: "Notify Broken Hill crew of ground period", owner: "Dispatcher", due: "By 8 Jun 2026", status: "urgent" },
        { label: "Arrange VH-XYJ Broken Hill cover", owner: "Ops Manager", due: "By 9 Jun 2026", status: "urgent" },
        { label: "Confirm 6-monthly scope with LAME", owner: "Eng. D. Evans", due: "By 8 Jun 2026", status: "urgent" },
        { label: "Plan ferry return — YSDU→YBHI (RTS)", owner: "Capt. T. Barnes", due: "By 16 Jun 2026", status: "pending" },
      ],
    },
  },
  {
    id: "EVT-003",
    aircraft: "VH-XYU",
    type: "King Air B300",
    currentBase: "Dubbo (YSDU)",
    maintenanceBase: "Dubbo (YSDU)",
    ferryRequired: false,
    serviceType: "Annual inspection — IN PROGRESS",
    dueDate: "10 Jun 2026",
    dueHours: "Maintenance hold",
    remainingHours: 0,
    remainingDays: 5,
    urgency: "critical",
    urgencyColor: "text-red-400",
    urgencyBg: "status-red",
    calStart: new Date(2026, 5, 1),  // Jun 1
    calEnd:   new Date(2026, 5, 10), // Jun 10
    components: [
      { name: "R/H Brake Pack (AOG)", remaining: "Part ETA 7 Jun 2026", due: "7 Jun 2026", status: "fail" },
      { name: "Altimeter #2 static source check", remaining: "In progress", due: "In progress", status: "warn" },
      { name: "Engine #1 oil consumption check", remaining: "Monitor only", due: "Ongoing", status: "warn" },
    ],
    aiPlan: {
      summary: "VH-XYU is currently on maintenance hold at Dubbo — annual inspection in progress. R/H brake pack is AOG with part ETA 7 Jun 2026. Estimated return to service is 10 Jun 2026. No ferry flight is required — aircraft is already at the maintenance base. The priority is tracking part arrival and LAME completion of the brake pack, altimeter check, and engine oil trending before signing the maintenance release.",
      ferryOutDate: null, ferryOutRoute: null,
      ferryReturnDate: "10 Jun 2026 (RTS target)", ferryReturnRoute: "Return to operational service at YSDU",
      groundTime: "In progress — est. 5 days total (opened 01 Jun 2026)",
      pilotRequired: "N/A — aircraft at maintenance base. First flight after RTS: Capt. R. Hughes (test flight)",
      windowRecommendation: "Brake pack part arriving 7 Jun. Altimeter check scheduled 8 Jun. Target MR sign-off 10 Jun. Notify operations by 9 Jun for morning commitment.",
      coverAircraft: "VH-XYJ covering all Dubbo commitments — Broken Hill tasking via VH-XYR",
      actions: [
        { label: "Confirm brake pack part arrival — 7 Jun", owner: "Eng. D. Evans", due: "7 Jun 2026", status: "urgent" },
        { label: "Complete altimeter static source check", owner: "LAME J. Torres", due: "8 Jun 2026", status: "urgent" },
        { label: "Engine #1 oil consumption trend sign-off", owner: "LAME J. Torres", due: "9 Jun 2026", status: "urgent" },
        { label: "Issue maintenance release", owner: "LAME J. Torres", due: "10 Jun 2026", status: "pending" },
        { label: "Test flight — Capt. R. Hughes", owner: "Capt. R. Hughes", due: "10 Jun 2026", status: "pending" },
        { label: "Return to operational schedule", owner: "Dispatcher", due: "10 Jun 2026", status: "pending" },
      ],
    },
  },
  {
    id: "EVT-004",
    aircraft: "VH-MVW",
    type: "King Air B200",
    currentBase: "Broken Hill (YBHI)",
    maintenanceBase: "Broken Hill (YBHI)",
    ferryRequired: false,
    serviceType: "Annual inspection",
    dueDate: "15 Aug 2026",
    dueHours: "est. 15,440 hrs",
    remainingHours: 310,
    remainingDays: 71,
    urgency: "watch",
    urgencyColor: "text-amber-400",
    urgencyBg: "status-orange",
    calStart: new Date(2026, 7, 10), // Aug 10
    calEnd:   new Date(2026, 7, 20), // Aug 20
    components: [],
    aiPlan: {
      summary: "VH-MVW is based at Broken Hill. The annual inspection is due in approximately 71 days. As a Broken Hill-based aircraft the inspection can be conducted at the Broken Hill maintenance base. I recommend beginning LAME and slot booking within the next 30 days to avoid peak demand conflicts. No immediate action required but planning should commence now.",
      ferryOutDate: null, ferryOutRoute: null, ferryReturnDate: null, ferryReturnRoute: null,
      groundTime: "est. 7–10 days (annual inspection scope)",
      pilotRequired: "Local Broken Hill crew",
      windowRecommendation: "Target window: 10–20 Aug 2026. Book LAME slot by 1 Jul 2026.",
      coverAircraft: "VH-XYR or VH-XYJ to cover Broken Hill commitments during annual",
      actions: [
        { label: "Book LAME slot — Broken Hill base", owner: "Eng. D. Evans", due: "By 1 Jul 2026", status: "pending" },
        { label: "Scope annual inspection requirements", owner: "LAME J. Torres", due: "By 15 Jul 2026", status: "pending" },
        { label: "Plan cover aircraft arrangements", owner: "Ops Manager", due: "By 1 Aug 2026", status: "pending" },
      ],
    },
  },
];

const FERRY_SCHEDULE = [
  { id: "FRY-001", aircraft: "VH-XYR", direction: "OUT", route: "YBHI → YSDU", fromICAO: "YBHI", toICAO: "YSDU", fromName: "Broken Hill", toName: "Dubbo", purpose: "Cabin door seal MEL + 6-monthly check", pilot: "Capt. T. Barnes", aiRecommended: "10 Jun 2026", deadline: "13 Jun 2026 (MEL expiry)", flightTime: "1 hr 15 min", urgency: "urgent", eventId: "EVT-002", calDate: new Date(2026, 5, 10) },
  { id: "FRY-002", aircraft: "VH-XYJ", direction: "REPOSITION", route: "YSDU → YBHI", fromICAO: "YSDU", toICAO: "YBHI", fromName: "Dubbo", toName: "Broken Hill", purpose: "Cover while VH-XYR at Dubbo", pilot: "Capt. R. Hughes", aiRecommended: "10 Jun 2026", deadline: "Cover from 10 Jun", flightTime: "1 hr 15 min", urgency: "urgent", eventId: "EVT-002", calDate: new Date(2026, 5, 10) },
  { id: "FRY-003", aircraft: "VH-XYR", direction: "RETURN", route: "YSDU → YBHI", fromICAO: "YSDU", toICAO: "YBHI", fromName: "Dubbo", toName: "Broken Hill", purpose: "Return to service — Broken Hill base", pilot: "Capt. T. Barnes", aiRecommended: "est. 17 Jun 2026", deadline: "Post RTS sign-off", flightTime: "1 hr 15 min", urgency: "plan", eventId: "EVT-002", calDate: new Date(2026, 5, 17) },
  { id: "FRY-004", aircraft: "VH-XYJ", direction: "REPOSITION", route: "YBHI → YSDU", fromICAO: "YBHI", toICAO: "YSDU", fromName: "Broken Hill", toName: "Dubbo", purpose: "Return to Dubbo base after XYR RTS", pilot: "Capt. R. Hughes", aiRecommended: "est. 17 Jun 2026", deadline: "After VH-XYR returns to YBHI", flightTime: "1 hr 15 min", urgency: "plan", eventId: "EVT-002", calDate: new Date(2026, 5, 17) },
  { id: "FRY-005", aircraft: "VH-XYJ", direction: "OUT", route: "YSDU → YSDU", fromICAO: "YSDU", toICAO: "YSDU", fromName: "Dubbo", toName: "Dubbo (maintenance)", purpose: "120 hr check + propeller overhauls", pilot: "N/A — at base", aiRecommended: "20 Jun 2026", deadline: "est. 28 Jun 2026", flightTime: "No ferry required", urgency: "plan", eventId: "EVT-001", calDate: new Date(2026, 5, 20) },
];

const URGENCY_ORDER = { critical: 0, urgent: 1, watch: 2, plan: 3 };

// ── Colour helpers ────────────────────────────────────────────────────────────

function urgencyToBar(u: string) {
  if (u === "critical") return "bg-red-500/80 border-red-400";
  if (u === "urgent")   return "bg-orange-500/80 border-orange-400";
  if (u === "watch")    return "bg-amber-500/80 border-amber-400";
  return "bg-blue-500/80 border-blue-400";
}
function urgencyToText(u: string) {
  if (u === "critical") return "text-red-400";
  if (u === "urgent")   return "text-orange-400";
  if (u === "watch")    return "text-amber-400";
  return "text-blue-400";
}

// ── Shift allocation helpers ──────────────────────────────────────────────────

function aircraftShiftStatus(shifts: string[]): { label: string; cls: string } {
  if (shifts.some(s => s === "Maintenance" || s === "RTS")) {
    return { label: "Maintenance", cls: "status-orange" };
  }
  if (shifts.some(s => s === "Ferry")) {
    return { label: "Ferry", cls: "bg-amber-500/20 text-amber-300 border border-amber-500/30" };
  }
  return { label: "Operational", cls: "status-green" };
}

function shiftCellStyle(shift: string): string {
  switch (shift) {
    case "AM":           return "bg-teal-500/20 text-teal-300 border-teal-500/30";
    case "PM":           return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "Night":        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Spare":        return "bg-muted/60 text-muted-foreground border-border";
    case "Maintenance":  return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "RTS":          return "bg-green-500/20 text-green-300 border-green-500/30";
    case "Ferry":        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    default:             return "bg-muted/60 text-muted-foreground border-border";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UrgencyBadge({ urgency, label }: { urgency: string; label: string }) {
  const cls =
    urgency === "critical" ? "status-red" :
    urgency === "urgent"   ? "status-orange" :
    urgency === "watch"    ? "status-yellow" : "status-blue";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>;
}

function ActionRow({ action }: { action: { label: string; owner: string; due: string; status: string } }) {
  const isUrgent = action.status === "urgent";
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-lg border ${isUrgent ? "border-orange-400/30 bg-orange-500/5" : "border-card-border bg-background"}`}>
      <div className={`mt-0.5 shrink-0 ${isUrgent ? "text-orange-400" : "text-muted-foreground"}`}>
        {isUrgent ? <AlertTriangle size={12} /> : <Clock size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold leading-snug">{action.label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{action.owner} · {action.due}</div>
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${isUrgent ? "status-orange" : "status-blue"}`}>
        {isUrgent ? "Urgent" : "Pending"}
      </span>
    </div>
  );
}

// ── CALENDAR COMPONENT ────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface CalEvent {
  id: string;
  aircraft: string;
  label: string;
  urgency: string;
  start: Date;
  end: Date;
  type: "maintenance" | "ferry";
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateInRange(d: Date, start: Date, end: Date) {
  return d >= start && d <= end;
}

function MaintenanceCalendar({ onSelectEvent }: { onSelectEvent: (id: string) => void }) {
  const today = new Date(2026, 6, 7); // July 7 2026
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Build flat event list
  const calEvents: CalEvent[] = useMemo(() => {
    const evts: CalEvent[] = UPCOMING_EVENTS.map(e => ({
      id: e.id,
      aircraft: e.aircraft,
      label: e.serviceType,
      urgency: e.urgency,
      start: e.calStart,
      end: e.calEnd,
      type: "maintenance" as const,
    }));
    // Ferry point events (single day)
    const ferryEvts: CalEvent[] = FERRY_SCHEDULE
      .filter(f => f.calDate)
      .map(f => ({
        id: f.id,
        aircraft: f.aircraft,
        label: `Ferry ${f.direction}: ${f.fromName} → ${f.toName}`,
        urgency: f.urgency,
        start: f.calDate!,
        end: f.calDate!,
        type: "ferry" as const,
      }));
    return [...evts, ...ferryEvts];
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // Pad to full 6-week grid
  while (cells.length % 7 !== 0) cells.push(null);

  // Events for a given day
  function eventsForDay(d: Date): CalEvent[] {
    return calEvents.filter(e => dateInRange(d, e.start, e.end));
  }

  // Which events span this month at all?
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);
  const monthEvents = calEvents.filter(e => e.end >= monthStart && e.start <= monthEnd);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px]">
        <span className="font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {[
          { color: "bg-red-500/80", label: "Critical" },
          { color: "bg-orange-500/80", label: "Urgent" },
          { color: "bg-amber-500/80", label: "Watch" },
          { color: "bg-blue-500/80", label: "Plan" },
          { color: "bg-cyan-500/60 border border-cyan-400 border-dashed", label: "Ferry" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${l.color}`} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="w-3 h-3 rounded-sm bg-cyan-400/20 border border-cyan-400/60 ring-1 ring-cyan-400" />
          Today
        </span>
      </div>

      {/* Month navigator */}
      <div className="bg-card rounded-xl border border-card-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-card-border">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors" data-testid="cal-prev">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <h3 className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {MONTHS[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors" data-testid="cal-next">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-card-border">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell ? isSameDay(cell, today) : false;
            const isOtherMonth = cell === null;
            const dayEvents = cell ? eventsForDay(cell) : [];
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div
                key={idx}
                className={`min-h-[80px] border-b border-r border-card-border p-1.5 transition-colors
                  ${isOtherMonth ? "bg-muted/10" : isWeekend ? "bg-muted/5" : ""}
                  ${isToday ? "ring-1 ring-inset ring-cyan-400/60 bg-cyan-400/5" : ""}
                `}
              >
                {cell && (
                  <>
                    <div className={`text-[11px] font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full
                      ${isToday ? "bg-cyan-400 text-black" : "text-muted-foreground"}`}>
                      {cell.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(e => {
                        const isStart = isSameDay(cell, e.start);
                        const isEnd   = isSameDay(cell, e.end);
                        const isFerry = e.type === "ferry";
                        return (
                          <button
                            key={e.id + cell.getTime()}
                            data-testid={`cal-event-${e.id}`}
                            onClick={() => {
                              if (!isFerry) onSelectEvent(e.id);
                              else {
                                // find parent event
                                const ferry = FERRY_SCHEDULE.find(f => f.id === e.id);
                                if (ferry) onSelectEvent(ferry.eventId);
                              }
                            }}
                            onMouseEnter={() => setHoverId(e.id)}
                            onMouseLeave={() => setHoverId(null)}
                            title={`${e.aircraft} — ${e.label}`}
                            className={`w-full text-left text-[9px] font-semibold px-1.5 py-0.5 rounded border truncate transition-all
                              ${isFerry
                                ? `bg-cyan-500/20 border-cyan-400/50 text-cyan-300 border-dashed`
                                : `${urgencyToBar(e.urgency)} text-white`}
                              ${hoverId === e.id ? "opacity-100 scale-[1.02]" : "opacity-90"}
                              ${isStart ? "rounded-l" : "rounded-l-none border-l-0"}
                              ${isEnd   ? "rounded-r" : "rounded-r-none border-r-0"}
                            `}
                          >
                            {isStart ? (isFerry ? "✈ " : "") + e.aircraft : ""}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* This-month event summary */}
      {monthEvents.length > 0 && (
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {MONTHS[month]} — Scheduled Events
          </div>
          <div className="space-y-2">
            {monthEvents.map(e => {
              const isFerry = e.type === "ferry";
              const ferry = isFerry ? FERRY_SCHEDULE.find(f => f.id === e.id) : null;
              return (
                <button
                  key={e.id}
                  data-testid={`cal-list-${e.id}`}
                  onClick={() => {
                    if (!isFerry) onSelectEvent(e.id);
                    else if (ferry) onSelectEvent(ferry.eventId);
                  }}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-card-border hover:border-cyan-400/30 bg-background hover:bg-cyan-400/5 transition-all"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isFerry ? "bg-cyan-400" : urgencyToBar(e.urgency).split(" ")[0]
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{e.aircraft}</span>
                      {isFerry && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">Ferry</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{e.label}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">
                      {isSameDay(e.start, e.end)
                        ? e.start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                        : `${e.start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${e.end.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
                      }
                    </div>
                    {!isFerry && (
                      <div className={`text-[9px] font-semibold ${urgencyToText(e.urgency)}`}>
                        {e.urgency.charAt(0).toUpperCase() + e.urgency.slice(1)}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3-month lookahead strip */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          3-Month Maintenance Horizon
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(offset => {
            const m = (month + offset) % 12;
            const y = year + Math.floor((month + offset) / 12);
            const ms = new Date(y, m, 1);
            const me = new Date(y, m + 1, 0);
            const evts = calEvents.filter(e => e.end >= ms && e.start <= me);
            return (
              <div key={offset} className="rounded-xl border border-card-border p-3 bg-background">
                <div className="text-xs font-bold mb-2">{MONTHS[m]} {y}</div>
                {evts.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground">No events</div>
                ) : (
                  <div className="space-y-1.5">
                    {evts.map(e => (
                      <div key={e.id} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          e.type === "ferry" ? "bg-cyan-400" : urgencyToBar(e.urgency).split(" ")[0]
                        }`} />
                        <span className="text-[10px] truncate">{e.aircraft} — {e.type === "ferry" ? "Ferry" : e.label.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SHIFT ALLOCATION VIEW COMPONENT ───────────────────────────────────────────

function ShiftAllocationView() {
  const { days, aircraft } = SHIFT_ALLOCATION_DATA;
  const bases = Array.from(new Set(aircraft.map(a => a.base)));

  const windowStart = new Date(2026, 6, 9); // 09 Jul 2026 — "current date"
  const windowEnd = new Date(2026, 6, 16);  // +7 days

  const spareCountsPerDay = days.map((_, dayIdx) =>
    aircraft.filter(a => a.shifts[dayIdx] === "Spare").length
  );

  return (
    <div className="space-y-4">
      {/* Note */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
        <Info size={13} className="shrink-0" />
        <span>
          Shift allocation view — week of {windowStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
          {" "}–{" "}
          {windowEnd.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}.
          Tap any cell for details.
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <span className="font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {[
          { cls: shiftCellStyle("AM"), label: "AM" },
          { cls: shiftCellStyle("PM"), label: "PM" },
          { cls: shiftCellStyle("Night"), label: "Night" },
          { cls: shiftCellStyle("Spare"), label: "Spare" },
          { cls: shiftCellStyle("Maintenance"), label: "Maintenance" },
          { cls: shiftCellStyle("RTS"), label: "RTS" },
          { cls: shiftCellStyle("Ferry"), label: "Ferry" },
        ].map(l => (
          <span key={l.label} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${l.cls}`}>
            {l.label === "Maintenance" && <Wrench size={10} />}
            {l.label}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: "760px" }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-card-border" style={{ minWidth: "180px" }}>
                  Aircraft
                </th>
                {days.map(d => (
                  <th key={d} className="text-center px-2 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-l border-card-border" style={{ minWidth: "80px" }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bases.map(base => (
                <FragmentBaseGroup key={base} base={base} aircraft={aircraft.filter(a => a.base === base)} days={days} />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/20">
                <td className="sticky left-0 z-10 bg-muted/20 px-4 py-3 text-xs font-bold border-t border-card-border">
                  Spare capacity per day
                </td>
                {spareCountsPerDay.map((count, i) => (
                  <td key={i} className="text-center px-2 py-3 border-t border-l border-card-border">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      count === 0 ? "bg-red-500/10 text-red-400" : "bg-muted/60 text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function FragmentBaseGroup({ base, aircraft, days }: { base: string; aircraft: typeof SHIFT_ALLOCATION_DATA.aircraft; days: string[] }) {
  return (
    <>
      <tr>
        <td colSpan={days.length + 1} className="px-4 py-1.5 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t border-b border-card-border">
          {base}
        </td>
      </tr>
      {aircraft.map(a => {
        const status = aircraftShiftStatus(a.shifts);
        return (
          <tr key={a.rego} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
            <td className="sticky left-0 z-10 bg-card px-4 py-2.5 border-r border-card-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{a.rego}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${status.cls}`}>{status.label}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{a.base}</div>
            </td>
            {a.shifts.map((s, i) => (
              <td key={i} className="p-1 border-l border-card-border">
                <button
                  title={`${a.rego} — ${days[i]}: ${s}`}
                  className={`w-full h-8 flex items-center justify-center gap-1 rounded-lg border text-[10px] font-semibold transition-opacity hover:opacity-70 ${shiftCellStyle(s)}`}
                >
                  {s === "Maintenance" && <Wrench size={9} />}
                  {s === "RTS" ? "RTS" : s}
                </button>
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}


// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function MaintenancePlanner({ role }: Props) {
  const [tab, setTab] = useState<"planner" | "shiftview" | "calendar" | "timeline">("planner");
  const [selectedEvent, setSelectedEvent] = useState(UPCOMING_EVENTS[1]);
  const [runningAI, setRunningAI] = useState(false);
  const [aiRun, setAiRun] = useState(true);

  const sorted = [...UPCOMING_EVENTS].sort(
    (a, b) => URGENCY_ORDER[a.urgency as keyof typeof URGENCY_ORDER] - URGENCY_ORDER[b.urgency as keyof typeof URGENCY_ORDER]
  );

  function handleCalendarSelect(id: string) {
    const evt = UPCOMING_EVENTS.find(e => e.id === id);
    if (evt) { setSelectedEvent(evt); setTab("planner"); }
  }
  function handleTimelineSelect(id: string) {
    const evt = UPCOMING_EVENTS.find(e => e.id === id);
    if (evt) { setSelectedEvent(evt); setTab("planner"); }
  }

  function runAIAnalysis() {
    setRunningAI(true);
    setTimeout(() => { setRunningAI(false); setAiRun(true); }, 2200);
  }

  function downloadPlan() {
    generatePDF({
      title: "AI Maintenance Ferry Planner — Structured Plan",
      subtitle: "Proactive ferry scheduling · Component life · Operational continuity",
      date: new Date().toLocaleDateString("en-AU"),
      reference: "MAINT-PLAN-" + new Date().toISOString().slice(0, 10),
      sections: [
        {
          heading: "Executive Summary",
          rows: [
            { label: "Analysis Generated", value: new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }) + " AEST" },
            { label: "Aircraft Analysed", value: "VH-XYJ, VH-XYR, VH-XYU, VH-MVW" },
            { label: "Critical Events", value: UPCOMING_EVENTS.filter(e => e.urgency === "critical").length + " — requires immediate action" },
            { label: "Urgent Events", value: UPCOMING_EVENTS.filter(e => e.urgency === "urgent").length + " — action within 7 days" },
            { label: "Ferry Movements Required", value: FERRY_SCHEDULE.filter(f => f.fromName !== f.toName).length.toString() },
          ],
        },
        ...UPCOMING_EVENTS.map(e => ({
          heading: `${e.aircraft} — ${e.serviceType}`,
          rows: [
            { label: "Aircraft", value: `${e.aircraft} (${e.type})` },
            { label: "Current Base", value: e.currentBase },
            { label: "Service Due", value: `${e.dueDate} (${e.remainingDays} days)` },
            { label: "Urgency", value: e.urgency.toUpperCase() },
            { label: "Ground Time", value: e.aiPlan.groundTime },
            { label: "Cover Aircraft", value: e.aiPlan.coverAircraft },
            { label: "AI Summary", value: e.aiPlan.summary },
          ],
        })),
      ],
    });
  }

  const ev = selectedEvent;
  const plan = ev.aiPlan;
  const relatedFerry = FERRY_SCHEDULE.filter(f => f.eventId === ev.id);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            AI Maintenance Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Proactive scheduling · Ferry flight optimisation · Operational continuity · Veryon data
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={runAIAnalysis}
            disabled={runningAI}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-400/30 rounded-lg text-xs text-purple-400 hover:bg-purple-500/20 transition-colors font-semibold disabled:opacity-50"
            data-testid="btn-run-ai"
          >
            {runningAI ? <><RefreshCw size={12} className="animate-spin" /> Analysing...</> : <><Brain size={12} /> Re-run AI</>}
          </button>
          <button
            onClick={downloadPlan}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold"
            data-testid="btn-export"
          >
            <Download size={12} /> Export Plan
          </button>
        </div>
      </div>

      {/* AI banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${aiRun ? "bg-purple-500/10 border-purple-400/20" : "bg-muted/30 border-card-border"}`}>
        <Brain size={15} className={aiRun ? "text-purple-400 shrink-0" : "text-muted-foreground shrink-0"} />
        <div className="flex-1 text-xs">
          {runningAI ? (
            <span className="text-purple-400 font-semibold">AI is analysing fleet maintenance schedule, component lives, crew availability, and operational tempo...</span>
          ) : aiRun ? (
            <>
              <span className="text-purple-400 font-semibold">AI analysis complete</span>
              <span className="text-muted-foreground ml-1.5">—{" "}
                <span className="text-red-400 font-semibold">1 critical</span>,{" "}
                <span className="text-orange-400 font-semibold">1 urgent</span>,{" "}
                <span className="text-amber-400 font-semibold">1 watch</span>,{" "}
                <span className="text-blue-400 font-semibold">1 plan</span>{" "}
                across 4 aircraft · {FERRY_SCHEDULE.length} ferry movements scheduled
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Click Re-run AI to analyse current fleet maintenance requirements.</span>
          )}
        </div>
        {aiRun && !runningAI && (
          <span className="text-[10px] text-purple-400 font-mono shrink-0">
            {new Date().toLocaleTimeString("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit" })} AEST
          </span>
        )}
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: UPCOMING_EVENTS.filter(e => e.urgency === "critical").length, sub: "Immediate action", color: "text-red-400", bg: "border-red-400/20" },
          { label: "Urgent",   value: UPCOMING_EVENTS.filter(e => e.urgency === "urgent").length,   sub: "Action within 7 days", color: "text-orange-400", bg: "border-orange-400/20" },
          { label: "Ferry Movements", value: FERRY_SCHEDULE.length, sub: "Scheduled by AI", color: "text-cyan-400", bg: "border-cyan-400/20" },
          { label: "Days Coverage",   value: "43+", sub: "Proactive horizon", color: "text-green-400", bg: "border-green-400/20" },
        ].map((s, i) => (
          <div key={i} className={`bg-card rounded-xl border ${s.bg} p-4`}>
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5">{s.label}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-card-border w-fit">
        {([
          { id: "planner",   icon: <Brain size={13} />,       label: "AI Planner" },
          { id: "shiftview", icon: <Grid3x3 size={13} />,     label: "Shift View" },
          { id: "calendar",  icon: <Calendar size={13} />,    label: "Maintenance Calendar" },
          { id: "timeline",  icon: <BarChart size={13} />,    label: "Skynet Timeline" },
        ] as const).map(t => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === t.id
                ? "bg-card border border-card-border text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── SHIFT VIEW TAB ── */}
      {tab === "shiftview" && (
        <ShiftAllocationView />
      )}

      {/* ── CALENDAR TAB ── */}
      {tab === "calendar" && (
        <MaintenanceCalendar onSelectEvent={handleCalendarSelect} />
      )}

      {/* ── TIMELINE TAB ── */}
      {tab === "timeline" && (
        <SkynetTimeline onSelectEvent={handleTimelineSelect} />
      )}

      {/* ── PLANNER TAB ── */}
      {tab === "planner" && (
        <div className="grid xl:grid-cols-3 gap-6">

          {/* Event list */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Maintenance Events
            </div>
            {sorted.map(e => (
              <button
                key={e.id}
                data-testid={`event-${e.id}`}
                onClick={() => setSelectedEvent(e)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedEvent.id === e.id
                    ? "bg-cyan-400/10 border-cyan-400/40"
                    : "bg-card border-card-border hover:border-cyan-400/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{e.aircraft}</span>
                  <UrgencyBadge urgency={e.urgency} label={
                    e.urgency === "critical" ? "Critical" :
                    e.urgency === "urgent"   ? "Urgent"   :
                    e.urgency === "watch"    ? "Watch"    : "Plan"
                  } />
                </div>
                <div className="text-xs text-muted-foreground mb-1">{e.serviceType}</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Calendar size={10} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span className="font-semibold">{e.dueDate}</span>
                  <span className="text-muted-foreground ml-auto">{e.remainingDays}d</span>
                </div>
                {e.ferryRequired && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-card-border">
                    <Plane size={10} className="text-cyan-400" />
                    <span className="text-[10px] text-cyan-400 font-semibold">Ferry required — {e.currentBase.split(" ")[0]} → {e.maintenanceBase.split(" ")[0]}</span>
                  </div>
                )}
                {e.components.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.components.map((c, i) => (
                      <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                        c.status === "fail" ? "border-red-400/40 text-red-400 bg-red-500/5" :
                        c.status === "warn" ? "border-amber-400/40 text-amber-400 bg-amber-500/5" :
                        "border-card-border text-muted-foreground"
                      }`}>{c.name.split(" ").slice(0, 3).join(" ")}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {/* Ferry schedule */}
            <div className="mt-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ferry Schedule</div>
              <div className="bg-card rounded-xl border border-card-border overflow-hidden">
                <div className="divide-y divide-border">
                  {FERRY_SCHEDULE.map((f, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Plane size={11} className={
                            f.direction === "OUT"    ? "text-amber-400" :
                            f.direction === "RETURN" ? "text-green-400" : "text-cyan-400"
                          } />
                          <span className="text-xs font-bold">{f.aircraft}</span>
                          <span className="text-[10px] text-muted-foreground">{f.direction}</span>
                        </div>
                        <UrgencyBadge urgency={f.urgency} label={f.urgency === "urgent" ? "Urgent" : "Plan"} />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-cyan-400">{f.fromName}</span>
                        <ArrowRight size={10} className="text-muted-foreground" />
                        <span className="text-cyan-400">{f.toName}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{f.aiRecommended} · {f.flightTime}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-card-border p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{ev.aircraft}</h2>
                    <UrgencyBadge urgency={ev.urgency} label={
                      ev.urgency === "critical" ? "Critical — Immediate Action" :
                      ev.urgency === "urgent"   ? "Urgent — Action This Week"  :
                      ev.urgency === "watch"    ? "Watch — Plan in 30 Days"    : "Plan — 60+ Days"
                    } />
                  </div>
                  <div className="text-sm text-muted-foreground">{ev.type} · {ev.serviceType}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Due: <span className="text-foreground font-semibold">{ev.dueDate}</span> · {ev.remainingDays} days · {ev.remainingHours > 0 ? `${ev.remainingHours} hrs remaining` : "Maintenance hold"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Current base</div>
                  <div className="text-sm font-semibold">{ev.currentBase}</div>
                  <div className="text-xs text-muted-foreground mt-1">Maintenance base</div>
                  <div className="text-sm font-semibold">{ev.maintenanceBase}</div>
                </div>
              </div>

              {ev.components.length > 0 && (
                <div className="space-y-2 mb-4">
                  {ev.components.map((c, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${
                      c.status === "fail" ? "border-red-400/30 bg-red-500/5" : "border-amber-400/30 bg-amber-500/5"
                    }`}>
                      <AlertTriangle size={12} className={c.status === "fail" ? "text-red-400" : "text-amber-400"} />
                      <span className="font-semibold flex-1">{c.name}</span>
                      <span className={`font-mono text-[11px] ${c.status === "fail" ? "text-red-400" : "text-amber-400"}`}>{c.remaining}</span>
                      <span className="text-muted-foreground">{c.due}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-purple-500/5 border border-purple-400/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={13} className="text-purple-400" />
                  <span className="text-xs font-bold text-purple-400">Jennifer AI — Maintenance Assessment</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{plan.summary}</p>
              </div>
            </div>

            {(ev.ferryRequired || plan.ferryReturnDate) && (
              <div className="bg-card rounded-xl border border-card-border p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  <Plane size={14} className="text-cyan-400" /> Ferry Movement Plan
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "Ferry OUT", value: plan.ferryOutDate || "Not required", sub: plan.ferryOutRoute || "Aircraft at maintenance base", icon: <Plane size={12} className="text-amber-400" />, highlight: !!plan.ferryOutDate },
                    { label: "Ferry RETURN", value: plan.ferryReturnDate || "TBD", sub: plan.ferryReturnRoute || "Post maintenance release", icon: <Plane size={12} className="text-green-400" />, highlight: false },
                    { label: "Ground Time", value: plan.groundTime, sub: "Estimated maintenance window", icon: <Wrench size={12} className="text-orange-400" />, highlight: false },
                    { label: "Pilot Required", value: plan.pilotRequired, sub: "Ferry-endorsed, current currency", icon: <User size={12} className="text-blue-400" />, highlight: false },
                  ].map((c, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${c.highlight ? "border-amber-400/30 bg-amber-500/5" : "border-card-border bg-background"}`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">{c.icon} {c.label}</div>
                      <div className="text-sm font-semibold leading-snug">{c.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</div>
                    </div>
                  ))}
                </div>
                {relatedFerry.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Movements</div>
                    {relatedFerry.map((f, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                        f.urgency === "urgent" ? "border-orange-400/30 bg-orange-500/5" : "border-card-border bg-background"
                      }`}>
                        <div className={`shrink-0 p-1.5 rounded-lg ${
                          f.direction === "OUT" ? "bg-amber-500/10" :
                          f.direction === "RETURN" ? "bg-green-500/10" : "bg-cyan-500/10"
                        }`}>
                          <Plane size={12} className={
                            f.direction === "OUT" ? "text-amber-400" :
                            f.direction === "RETURN" ? "text-green-400" : "text-cyan-400"
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold">{f.aircraft}</span>
                            <span className="text-[10px] text-muted-foreground">{f.direction}</span>
                            <span className="font-mono text-xs text-cyan-400">{f.fromName}</span>
                            <ArrowRight size={10} className="text-muted-foreground" />
                            <span className="font-mono text-xs text-cyan-400">{f.toName}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{f.purpose}</div>
                          <div className="text-[10px] text-muted-foreground">Pilot: {f.pilot} · {f.flightTime}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold">{f.aiRecommended}</div>
                          <div className="text-[10px] text-muted-foreground">{f.deadline}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Shield size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="text-cyan-400 font-semibold">Operational cover: </span>
                      <span className="text-muted-foreground">{plan.coverAircraft}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border border-card-border p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                <Calendar size={14} className="text-cyan-400" /> AI Recommended Window
              </h3>
              <div className="p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl text-sm leading-relaxed mb-4">
                {plan.windowRecommendation}
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Structured Action Plan — {ev.aiPlan.actions.length} items
              </div>
              <div className="space-y-2">
                {plan.actions.map((a, i) => <ActionRow key={i} action={a} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
