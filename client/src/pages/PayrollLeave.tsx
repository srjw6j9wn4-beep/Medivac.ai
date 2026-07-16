import { useState } from "react";
import {
  Wallet,
  Users,
  CalendarClock,
  ClockAlert,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Download,
  CalendarDays,
  Plane,
  Stethoscope,
  Wrench,
  Briefcase,
  ClipboardList,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  FileBarChart2,
  FileClock,
  ShieldCheck,
  Coins,
  Landmark,
  CalendarCheck,
  User,
  Save,
  Send,
  Lock,
} from "lucide-react";
import type { UserRole } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface Props {
  role: UserRole;
}

const HEADING_FONT = { fontFamily: "'Cabinet Grotesk', sans-serif" };

// ─── Shared design tokens ───────────────────────────────────────────────────
const CARD = "bg-[#1C1B19] border border-[#393836] rounded-xl";
const MUTED = "text-[#797876]";
const FAINT = "text-[#5A5957]";
const TEXT = "text-[#CDCCCA]";
const ACCENT = "text-[#4F98A3]";
const ACCENT_BG = "bg-[#01696F]/20";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Processed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Submitted: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Draft: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] ?? "bg-[#393836]/40 text-[#797876] border-[#393836]"}`}>
      {status}
    </span>
  );
}

// ─── Tab 1: Payroll Overview data ───────────────────────────────────────────
const SUMMARY_STATS = [
  { label: "Total Payroll This Period", value: "$284,500", icon: Wallet, sub: "Fortnight ending 20 Jul 2026" },
  { label: "Staff Count", value: "48", icon: Users, sub: "Active employees on payroll" },
  { label: "Next Pay Run", value: "25 Jul 2026", icon: CalendarClock, sub: "Fortnightly cycle" },
  { label: "Pending Timesheets", value: "7", icon: ClockAlert, sub: "Awaiting approval", amber: true },
];

const PAYROLL_RUNS = [
  { period: "07 Jul – 20 Jul 2026", runDate: "22 Jul 2026", staff: 48, gross: 284500, net: 211930, super: 32718, status: "Draft" },
  { period: "23 Jun – 06 Jul 2026", runDate: "08 Jul 2026", staff: 47, gross: 278120, net: 207460, super: 31984, status: "Processed" },
  { period: "09 Jun – 22 Jun 2026", runDate: "24 Jun 2026", staff: 47, gross: 281960, net: 209870, super: 32425, status: "Processed" },
  { period: "26 May – 08 Jun 2026", runDate: "10 Jun 2026", staff: 46, gross: 271340, net: 202110, super: 31204, status: "Processed" },
  { period: "12 May – 25 May 2026", runDate: "27 May 2026", staff: 46, gross: 268900, net: 200340, super: 30924, status: "Pending" },
];

const PAY_CATEGORY_BREAKDOWN = [
  { label: "Pilots", value: 92400, icon: Plane },
  { label: "Nurses / Paramedics", value: 78200, icon: Stethoscope },
  { label: "Doctors", value: 46100, icon: Stethoscope },
  { label: "Engineers", value: 31800, icon: Wrench },
  { label: "Management", value: 22600, icon: Briefcase },
  { label: "Admin / Ops", value: 13400, icon: ClipboardList },
];
const CATEGORY_MAX = Math.max(...PAY_CATEGORY_BREAKDOWN.map(c => c.value));

// ─── Tab 2: Timesheets data ─────────────────────────────────────────────────
const BASES = ["All", "Dubbo", "Broken Hill", "Bankstown", "Launceston", "Essendon"] as const;
const TS_ROLES = ["All", "Pilot", "Nurse", "Doctor", "Engineer"] as const;
const TS_STATUSES = ["All", "Submitted", "Approved", "Rejected", "Draft"] as const;

const TIMESHEETS = [
  { name: "Capt. R. Hughes", base: "Dubbo", role: "Pilot", period: "07–20 Jul", ord: 76.0, ot: 4.5, allowances: 320, status: "Submitted" },
  { name: "Capt. S. Nguyen", base: "Broken Hill", role: "Pilot", period: "07–20 Jul", ord: 80.0, ot: 2.0, allowances: 410, status: "Approved" },
  { name: "FO J. Walsh", base: "Bankstown", role: "Pilot", period: "07–20 Jul", ord: 74.5, ot: 0.0, allowances: 180, status: "Approved" },
  { name: "S. Patterson RN", base: "Dubbo", role: "Nurse", period: "07–20 Jul", ord: 78.0, ot: 6.0, allowances: 260, status: "Submitted" },
  { name: "M. Okafor RN", base: "Launceston", role: "Nurse", period: "07–20 Jul", ord: 80.0, ot: 8.5, allowances: 340, status: "Submitted" },
  { name: "Dr. A. Kaur", base: "Essendon", role: "Doctor", period: "07–20 Jul", ord: 70.0, ot: 3.0, allowances: 220, status: "Draft" },
  { name: "Dr. T. Bianchi", base: "Dubbo", role: "Doctor", period: "07–20 Jul", ord: 72.0, ot: 5.5, allowances: 200, status: "Rejected" },
  { name: "C. Reddy — LAME", base: "Bankstown", role: "Engineer", period: "07–20 Jul", ord: 80.0, ot: 12.0, allowances: 150, status: "Submitted" },
  { name: "J. Fitzgerald — LAME", base: "Broken Hill", role: "Engineer", period: "07–20 Jul", ord: 76.0, ot: 1.0, allowances: 130, status: "Approved" },
  { name: "L. Nakamura RN", base: "Essendon", role: "Nurse", period: "07–20 Jul", ord: 79.5, ot: 4.0, allowances: 275, status: "Submitted" },
];

// ─── Tab 3: Leave Management data ───────────────────────────────────────────
const LEAVE_STAFF = [
  { name: "Capt. R. Hughes", role: "Pilot", base: "Dubbo", annual: 14, annualMax: 20, sick: 6, sickMax: 10, lsl: 32, lslMax: 65 },
  { name: "S. Patterson RN", role: "Flight Nurse", base: "Dubbo", annual: 9, annualMax: 20, sick: 3, sickMax: 10, lsl: 18, lslMax: 65 },
  { name: "Dr. A. Kaur", role: "Doctor", base: "Essendon", annual: 17, annualMax: 20, sick: 8, sickMax: 10, lsl: 44, lslMax: 65 },
  { name: "C. Reddy", role: "Engineer (LAME)", base: "Bankstown", annual: 5, annualMax: 20, sick: 2, sickMax: 10, lsl: 12, lslMax: 65 },
  { name: "M. Okafor RN", role: "Flight Nurse", base: "Launceston", annual: 11, annualMax: 20, sick: 7, sickMax: 10, lsl: 26, lslMax: 65 },
  { name: "FO J. Walsh", role: "Pilot", base: "Bankstown", annual: 16, annualMax: 20, sick: 9, sickMax: 10, lsl: 8, lslMax: 65 },
];

const LEAVE_REQUESTS = [
  { staff: "Capt. S. Nguyen", type: "Annual Leave", from: "28 Jul 2026", to: "04 Aug 2026", days: 6, status: "Approved", approver: "T. Marsh (Ops Mgr)", notes: "Pre-approved, replacement roster confirmed" },
  { staff: "L. Nakamura RN", type: "Sick Leave", from: "14 Jul 2026", to: "15 Jul 2026", days: 2, status: "Approved", approver: "Auto-approved", notes: "Medical certificate on file" },
  { staff: "Dr. T. Bianchi", type: "Long Service Leave", from: "01 Sep 2026", to: "19 Sep 2026", days: 15, status: "Pending", approver: "Awaiting: R. Osei (Medical Dir.)", notes: "First LSL application — 44 days accrued" },
  { staff: "J. Fitzgerald", type: "Annual Leave", from: "22 Jul 2026", to: "23 Jul 2026", days: 2, status: "Pending", approver: "Awaiting: D. Coleman (Chief Eng.)", notes: "" },
  { staff: "M. Okafor RN", type: "Compassionate Leave", from: "10 Jul 2026", to: "12 Jul 2026", days: 3, status: "Approved", approver: "T. Marsh (Ops Mgr)", notes: "Immediate family bereavement" },
  { staff: "FO J. Walsh", type: "Annual Leave", from: "05 Aug 2026", to: "12 Aug 2026", days: 6, status: "Rejected", approver: "T. Marsh (Ops Mgr)", notes: "Clashes with minimum crewing — resubmit for Sep" },
  { staff: "C. Reddy", type: "Sick Leave", from: "13 Jul 2026", to: "13 Jul 2026", days: 1, status: "Approved", approver: "Auto-approved", notes: "" },
];

const LEAVE_CALENDAR = [
  { day: "Mon 13 Jul", entries: ["C. Reddy — Sick (Bankstown)"] },
  { day: "Tue 14 Jul", entries: ["L. Nakamura RN — Sick (Essendon)"] },
  { day: "Wed 15 Jul", entries: ["L. Nakamura RN — Sick (Essendon)"] },
  { day: "Thu 16 Jul", entries: [] },
  { day: "Fri 17 Jul", entries: [] },
  { day: "Sat 18 Jul", entries: ["M. Okafor RN — Compassionate (Launceston)"] },
  { day: "Sun 19 Jul", entries: ["M. Okafor RN — Compassionate (Launceston)"] },
];

// ─── Tab 4: Staff Costs & Budgets data ──────────────────────────────────────
const COST_CENTRES = [
  { name: "Operations — Dubbo", budget: 68000, actual: 66200 },
  { name: "Operations — Broken Hill", budget: 42000, actual: 45900 },
  { name: "Operations — Bankstown", budget: 51000, actual: 47850 },
  { name: "Operations — Launceston", budget: 38000, actual: 39100 },
  { name: "Operations — Essendon", budget: 33000, actual: 30200 },
  { name: "Medical Staff", budget: 96000, actual: 94320 },
  { name: "Engineering", budget: 44000, actual: 41680 },
  { name: "Management", budget: 29000, actual: 28950 },
];

function costStatus(budget: number, actual: number) {
  const pct = actual / budget;
  if (pct > 1.0) return { label: "Over Budget", cls: "text-red-400", pct };
  if (pct >= 0.9) return { label: "Near Limit", cls: "text-amber-400", pct };
  return { label: "On Track", cls: "text-emerald-400", pct };
}

const EBA_AGREEMENTS = [
  { name: "Pilots EBA 2025", expiry: "30 Jun 2029", minRate: "$118,400 p.a. (Base Capt.)", penalty: "Yes — night ops, standby", status: "Compliant" },
  { name: "Nurses EBA 2023", expiry: "31 Mar 2027", minRate: "$92,150 p.a. (Flight Nurse)", penalty: "Yes — weekend, on-call", status: "Compliant" },
  { name: "Engineering EBA 2025", expiry: "30 Jun 2029", minRate: "$104,600 p.a. (LAME)", penalty: "Yes — callout, overtime", status: "Compliant" },
];

const AWARD_RATES = [
  { item: "Base Rate — Pilot (Capt.)", rate: "$56.90 / hr", notes: "Pilots EBA 2025 Level 3" },
  { item: "Base Rate — Flight Nurse", rate: "$44.30 / hr", notes: "Nurses EBA 2023 Level 4" },
  { item: "Base Rate — LAME Engineer", rate: "$50.10 / hr", notes: "Engineering EBA 2025 Level 2" },
  { item: "Overnight Allowance", rate: "$68.50 / night", notes: "Away-from-base, all crew categories" },
  { item: "Remote Base Allowance", rate: "$42.00 / day", notes: "Broken Hill & Launceston postings" },
  { item: "On-Call Allowance", rate: "$95.00 / 24hr block", notes: "Applies to rostered standby duty" },
  { item: "Weekend Penalty Rate", rate: "150% of base", notes: "Saturday — all EBAs" },
  { item: "Sunday / Public Holiday Rate", rate: "200% of base", notes: "Sunday and gazetted public holidays" },
  { item: "Callout Minimum", rate: "3 hrs @ 150%", notes: "Engineering EBA 2025 — unscheduled callout" },
];

// ─── Tab 5: Reports data ─────────────────────────────────────────────────────
const REPORTS = [
  { id: "payroll-summary", title: "Payroll Summary Report", desc: "Gross, net and superannuation totals broken down by cost centre for any pay period.", icon: FileBarChart2 },
  { id: "leave-liability", title: "Leave Liability Report", desc: "Outstanding annual, sick and long service leave balances by staff member, valued at current rates.", icon: FileClock },
  { id: "eba-compliance", title: "EBA Compliance Report", desc: "Cross-checks paid rates against current Pilots, Nurses and Engineering EBA minimums and penalty rates.", icon: ShieldCheck },
  { id: "overtime-analysis", title: "Overtime Analysis", desc: "Overtime hours and cost broken down by role, base and pay period, with trend comparison.", icon: Clock },
  { id: "super-report", title: "Superannuation Report", desc: "Employer superannuation contributions by staff and period, ready for SuperStream submission.", icon: Coins },
  { id: "ato-payroll-tax", title: "ATO Payroll Tax Summary", desc: "State-by-state payroll tax obligations based on total taxable wages, excluding GST.", icon: Landmark },
];

const SCHEDULED_REPORTS = [
  { name: "Payroll Summary Report", frequency: "Fortnightly", nextRun: "25 Jul 2026", recipients: "Finance Manager, CFO" },
  { name: "Leave Liability Report", frequency: "Monthly", nextRun: "01 Aug 2026", recipients: "HR Manager, Finance Manager" },
  { name: "EBA Compliance Report", frequency: "Quarterly", nextRun: "01 Oct 2026", recipients: "HR Manager, Ops Director" },
  { name: "ATO Payroll Tax Summary", frequency: "Annual", nextRun: "01 Jul 2027", recipients: "CFO, External Accountant" },
];

// ─── Tab 6: My Timesheet (self-service portal) data ─────────────────────────
const MY_TS_BASES = ["Dubbo", "Broken Hill", "Bankstown", "Launceston", "Essendon"] as const;
const MY_TS_ROLES = ["Pilot", "First Officer", "Retrieval Nurse", "Retrieval Physician", "Engineer", "Admin"] as const;
const SHIFT_TYPES = ["Off", "Day", "Night", "Standby", "Leave"] as const;
type ShiftType = typeof SHIFT_TYPES[number];

const PAY_PERIOD_START = new Date("2026-07-01");
const FORTNIGHT_LENGTH = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function formatShortDate(date: Date) {
  const weekday = date.toLocaleDateString("en-AU", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-AU", { month: "short" });
  return `${weekday} ${day} ${month}`;
}

function formatLongDate(date: Date) {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-AU", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

interface TimesheetDayRow {
  date: Date;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  remote: boolean;
  overnight: boolean;
  onCall: boolean;
  notes: string;
}

function buildInitialTimesheetRows(): TimesheetDayRow[] {
  return Array.from({ length: FORTNIGHT_LENGTH }, (_, i) => ({
    date: addDays(PAY_PERIOD_START, i),
    shiftType: "Off" as ShiftType,
    startTime: "",
    endTime: "",
    remote: false,
    overnight: false,
    onCall: false,
    notes: "",
  }));
}

// Computes ordinary/overtime hours for a day row, capping ordinary at 8 hrs.
function calcHoursForRow(row: TimesheetDayRow): { ordinary: number; overtime: number } {
  if (row.shiftType === "Off" || row.shiftType === "Leave") return { ordinary: 0, overtime: 0 };
  if (!row.startTime || !row.endTime) return { ordinary: 0, overtime: 0 };

  const [sh, sm] = row.startTime.split(":").map(Number);
  const [eh, em] = row.endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return { ordinary: 0, overtime: 0 };

  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60; // overnight shift wraps past midnight

  const totalHours = (endMinutes - startMinutes) / 60;
  const ordinary = Math.min(8, totalHours);
  const overtime = Math.max(0, totalHours - 8);
  return { ordinary, overtime };
}

const RATE_ORDINARY = 85;
const RATE_OVERTIME = 127.5;
const RATE_REMOTE = 42;

// ─── Small building blocks ──────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={`text-sm font-semibold uppercase tracking-wider ${MUTED}`}>{children}</h2>
  );
}

function LeaveBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className={MUTED}>{label}</span>
        <span className={TEXT}>{value} / {max} days</span>
      </div>
      <div className="h-1.5 bg-[#393836] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function PayrollLeave({ role }: { role: UserRole }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "timesheets" | "leave" | "costs" | "reports" | "my-timesheet">("overview");

  const [baseFilter, setBaseFilter] = useState<typeof BASES[number]>("All");
  const [roleFilter, setRoleFilter] = useState<typeof TS_ROLES[number]>("All");
  const [statusFilter, setStatusFilter] = useState<typeof TS_STATUSES[number]>("All");
  const [timesheetRows, setTimesheetRows] = useState(TIMESHEETS);

  const canApprove = role === "dispatcher" || role === "admin" || role === "senior_management";
  const canApproveLeave = role === "dispatcher" || role === "admin" || role === "senior_management" || role === "safety";

  const filteredTimesheets = timesheetRows.filter(t =>
    (baseFilter === "All" || t.base === baseFilter) &&
    (roleFilter === "All" || t.role === roleFilter) &&
    (statusFilter === "All" || t.status === statusFilter)
  );

  function setTimesheetStatus(idx: number, status: string) {
    setTimesheetRows(rows => rows.map((r, i) => (i === idx ? { ...r, status } : r)));
    toast({ title: status === "Approved" ? "Timesheet approved" : "Timesheet rejected" });
  }

  function generateReport(title: string) {
    toast({ title: "PDF generation coming soon", description: `${title} will be exportable once payroll integration is complete.` });
  }

  const tabs = [
    { id: "overview", label: "Payroll Overview" },
    { id: "timesheets", label: "Timesheets" },
    { id: "leave", label: "Leave Management" },
    { id: "costs", label: "Staff Costs & Budgets" },
    { id: "reports", label: "Reports" },
    { id: "my-timesheet", label: "My Timesheet" },
  ] as const;

  return (
    <div className="p-6 space-y-6 bg-[#171614] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${TEXT}`} style={HEADING_FONT}>Payroll &amp; Leave</h1>
          <p className={`text-sm ${MUTED} mt-0.5`}>RFDS SE Section — payroll processing, timesheets, leave management and EBA compliance</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 ${ACCENT_BG} border border-[#01696F]/40 rounded-xl`}>
          <Wallet size={16} className={ACCENT} />
          <span className={`text-xs font-semibold ${ACCENT}`}>All figures AUD, excl. GST</span>
        </div>
      </div>

      {/* Draft banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-400/10 border border-amber-400/30">
        <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300 leading-relaxed">
          <span className="font-semibold">Draft Module</span> — payroll data is sample only. Full integration with payroll provider coming soon.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1C1B19] border border-[#393836] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id ? `${ACCENT_BG} ${ACCENT}` : `${MUTED} hover:${TEXT}`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: PAYROLL OVERVIEW ═══════════════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SUMMARY_STATS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${CARD} p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-[#171614]">
                      <Icon size={18} className={s.amber ? "text-amber-400" : ACCENT} />
                    </div>
                    {s.amber && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Action needed
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${TEXT}`} style={HEADING_FONT}>{s.value}</div>
                  <div className={`text-xs font-medium ${TEXT} mt-0.5`}>{s.label}</div>
                  <div className={`text-[11px] ${FAINT} mt-0.5`}>{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Payroll Run table */}
          <div className="space-y-3">
            <SectionTitle>Payroll Run History</SectionTitle>
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b border-[#393836] ${MUTED}`}>
                      <th className="text-left p-3">Pay Period</th>
                      <th className="text-left p-3">Run Date</th>
                      <th className="text-right p-3">Staff Paid</th>
                      <th className="text-right p-3">Gross ($)</th>
                      <th className="text-right p-3">Net ($)</th>
                      <th className="text-right p-3">Super ($)</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAYROLL_RUNS.map(r => (
                      <tr key={r.period} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                        <td className={`p-3 font-medium ${TEXT}`}>{r.period}</td>
                        <td className={`p-3 ${MUTED}`}>{r.runDate}</td>
                        <td className={`p-3 text-right ${TEXT}`}>{r.staff}</td>
                        <td className={`p-3 text-right font-semibold ${TEXT}`}>${r.gross.toLocaleString()}</td>
                        <td className={`p-3 text-right ${TEXT}`}>${r.net.toLocaleString()}</td>
                        <td className={`p-3 text-right ${MUTED}`}>${r.super.toLocaleString()}</td>
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pay category breakdown */}
          <div className="space-y-3">
            <SectionTitle>Pay Category Breakdown — Current Period</SectionTitle>
            <div className={`${CARD} p-5 space-y-4`}>
              {PAY_CATEGORY_BREAKDOWN.map(c => {
                const Icon = c.icon;
                const pct = (c.value / CATEGORY_MAX) * 100;
                return (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-44 flex-shrink-0">
                      <Icon size={14} className={ACCENT} />
                      <span className={`text-xs font-medium ${TEXT}`}>{c.label}</span>
                    </div>
                    <div className="flex-1 h-3 bg-[#171614] rounded-full overflow-hidden border border-[#393836]">
                      <div className="h-full rounded-full bg-[#01696F]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${TEXT} w-20 text-right flex-shrink-0`}>
                      ${c.value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 2: TIMESHEETS ═══════════════ */}
      {tab === "timesheets" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className={`${CARD} p-4 flex flex-wrap items-center gap-4`}>
            <FilterGroup label="Base" options={BASES} value={baseFilter} onChange={setBaseFilter} />
            <FilterGroup label="Role" options={TS_ROLES} value={roleFilter} onChange={setRoleFilter} />
            <FilterGroup label="Status" options={TS_STATUSES} value={statusFilter} onChange={setStatusFilter} />
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b border-[#393836] ${MUTED}`}>
                    <th className="text-left p-3">Staff Name</th>
                    <th className="text-left p-3">Base</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Pay Period</th>
                    <th className="text-right p-3">Ordinary Hrs</th>
                    <th className="text-right p-3">Overtime Hrs</th>
                    <th className="text-right p-3">Allowances</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimesheets.length === 0 && (
                    <tr><td colSpan={9} className={`p-4 text-center ${MUTED}`}>No timesheets match the selected filters.</td></tr>
                  )}
                  {filteredTimesheets.map((t, idx) => {
                    const originalIdx = timesheetRows.indexOf(t);
                    return (
                      <tr key={t.name + t.period} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                        <td className={`p-3 font-medium ${TEXT}`}>{t.name}</td>
                        <td className={`p-3 ${MUTED}`}>{t.base}</td>
                        <td className={`p-3 ${MUTED}`}>{t.role}</td>
                        <td className={`p-3 ${MUTED}`}>{t.period}</td>
                        <td className={`p-3 text-right ${TEXT}`}>{t.ord.toFixed(1)}</td>
                        <td className={`p-3 text-right ${t.ot > 0 ? "text-amber-400 font-semibold" : MUTED}`}>{t.ot.toFixed(1)}</td>
                        <td className={`p-3 text-right ${TEXT}`}>${t.allowances}</td>
                        <td className="p-3"><StatusBadge status={t.status} /></td>
                        <td className="p-3">
                          {canApprove && t.status === "Submitted" ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setTimesheetStatus(originalIdx, "Approved")}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setTimesheetStatus(originalIdx, "Rejected")}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[11px] ${FAINT}`}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 3: LEAVE MANAGEMENT ═══════════════ */}
      {tab === "leave" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <SectionTitle>Leave Balance Overview</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LEAVE_STAFF.map(s => (
                <div key={s.name} className={`${CARD} p-4 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold ${TEXT}`} style={HEADING_FONT}>{s.name}</div>
                      <div className={`text-[11px] ${MUTED}`}>{s.role} · {s.base}</div>
                    </div>
                    <button
                      onClick={() => toast({ title: "Leave application started", description: `New leave request for ${s.name}` })}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${ACCENT_BG} ${ACCENT} border border-[#01696F]/40 hover:bg-[#01696F]/30 transition-colors`}
                    >
                      Apply
                    </button>
                  </div>
                  <div className="space-y-2">
                    <LeaveBar label="Annual Leave" value={s.annual} max={s.annualMax} color="bg-[#4F98A3]" />
                    <LeaveBar label="Sick Leave" value={s.sick} max={s.sickMax} color="bg-emerald-500" />
                    <LeaveBar label="Long Service Leave" value={s.lsl} max={s.lslMax} color="bg-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave requests */}
          <div className="space-y-3">
            <SectionTitle>Leave Requests</SectionTitle>
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b border-[#393836] ${MUTED}`}>
                      <th className="text-left p-3">Staff</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">From</th>
                      <th className="text-left p-3">To</th>
                      <th className="text-right p-3">Days</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Approver</th>
                      <th className="text-left p-3">Notes</th>
                      {canApproveLeave && <th className="text-left p-3">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {LEAVE_REQUESTS.map((r, i) => (
                      <tr key={r.staff + r.from} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                        <td className={`p-3 font-medium ${TEXT}`}>{r.staff}</td>
                        <td className={`p-3 ${MUTED}`}>{r.type}</td>
                        <td className={`p-3 ${MUTED}`}>{r.from}</td>
                        <td className={`p-3 ${MUTED}`}>{r.to}</td>
                        <td className={`p-3 text-right ${TEXT}`}>{r.days}</td>
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                        <td className={`p-3 ${MUTED}`}>{r.approver}</td>
                        <td className={`p-3 ${FAINT} max-w-[220px] truncate`} title={r.notes}>{r.notes || "—"}</td>
                        {canApproveLeave && (
                          <td className="p-3">
                            {r.status === "Pending" ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => toast({ title: "Leave request approved" })}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => toast({ title: "Leave request rejected" })}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[11px] ${FAINT}`}>—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Leave calendar */}
          <div className="space-y-3">
            <SectionTitle>Leave Calendar — This Week</SectionTitle>
            <div className={`${CARD} p-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                {LEAVE_CALENDAR.map(d => (
                  <div key={d.day} className="bg-[#171614] border border-[#393836] rounded-lg p-3 min-h-[90px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CalendarDays size={12} className={ACCENT} />
                      <span className={`text-[11px] font-semibold ${TEXT}`}>{d.day}</span>
                    </div>
                    {d.entries.length === 0 ? (
                      <div className={`text-[11px] ${FAINT}`}>No leave scheduled</div>
                    ) : (
                      <ul className="space-y-1">
                        {d.entries.map(e => (
                          <li key={e} className={`text-[11px] ${MUTED} leading-snug`}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 4: STAFF COSTS & BUDGETS ═══════════════ */}
      {tab === "costs" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <SectionTitle>Cost Centre Breakdown — Month to Date</SectionTitle>
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b border-[#393836] ${MUTED}`}>
                      <th className="text-left p-3">Cost Centre</th>
                      <th className="text-right p-3">Budget (Monthly)</th>
                      <th className="text-right p-3">Actual (MTD)</th>
                      <th className="text-right p-3">Variance</th>
                      <th className="text-right p-3">% Used</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COST_CENTRES.map(c => {
                      const variance = c.budget - c.actual;
                      const s = costStatus(c.budget, c.actual);
                      const VarIcon = variance > 0 ? TrendingDown : variance < 0 ? TrendingUp : Minus;
                      return (
                        <tr key={c.name} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                          <td className={`p-3 font-medium ${TEXT}`}>{c.name}</td>
                          <td className={`p-3 text-right ${MUTED}`}>${c.budget.toLocaleString()}</td>
                          <td className={`p-3 text-right ${TEXT}`}>${c.actual.toLocaleString()}</td>
                          <td className={`p-3 text-right font-semibold ${variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            <span className="inline-flex items-center gap-1 justify-end">
                              <VarIcon size={11} />
                              {variance >= 0 ? "+" : ""}{variance.toLocaleString()}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-semibold ${s.cls}`}>{(s.pct * 100).toFixed(1)}%</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              s.label === "On Track" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                              s.label === "Near Limit" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                              "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}>{s.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* EBA Compliance summary */}
          <div className="space-y-3">
            <SectionTitle>EBA Compliance Summary</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {EBA_AGREEMENTS.map(e => (
                <div key={e.name} className={`${CARD} p-4 space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${TEXT}`} style={HEADING_FONT}>{e.name}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <BadgeCheck size={16} />
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className={MUTED}>Expiry</span><span className={TEXT}>{e.expiry}</span></div>
                    <div className="flex justify-between"><span className={MUTED}>Min. Rate</span><span className={`${TEXT} text-right`}>{e.minRate}</span></div>
                    <div className="flex justify-between"><span className={MUTED}>Penalty Rates</span><span className={TEXT}>{e.penalty}</span></div>
                  </div>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={11} /> {e.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Award rates reference table */}
          <div className="space-y-3">
            <SectionTitle>Award Rates Reference</SectionTitle>
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b border-[#393836] ${MUTED}`}>
                      <th className="text-left p-3">Allowance / Rate</th>
                      <th className="text-left p-3">Rate</th>
                      <th className="text-left p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AWARD_RATES.map(r => (
                      <tr key={r.item} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                        <td className={`p-3 font-medium ${TEXT}`}>{r.item}</td>
                        <td className={`p-3 font-semibold ${ACCENT}`}>{r.rate}</td>
                        <td className={`p-3 ${MUTED}`}>{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 5: REPORTS ═══════════════ */}
      {tab === "reports" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <SectionTitle>Generate Reports</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORTS.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.id} className={`${CARD} p-5 flex flex-col justify-between gap-4 hover:border-[#4F98A3]/40 transition-colors`}>
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-[#171614] w-fit">
                        <Icon size={18} className={ACCENT} />
                      </div>
                      <div className={`text-sm font-semibold ${TEXT}`} style={HEADING_FONT}>{r.title}</div>
                      <p className={`text-[11px] ${MUTED} leading-relaxed`}>{r.desc}</p>
                    </div>
                    <button
                      onClick={() => generateReport(r.title)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${ACCENT_BG} ${ACCENT} border border-[#01696F]/40 hover:bg-[#01696F]/30 transition-colors`}
                    >
                      <Download size={13} /> Generate PDF
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheduled reports */}
          <div className="space-y-3">
            <SectionTitle>Scheduled Reports</SectionTitle>
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b border-[#393836] ${MUTED}`}>
                      <th className="text-left p-3">Report</th>
                      <th className="text-left p-3">Frequency</th>
                      <th className="text-left p-3">Next Run</th>
                      <th className="text-left p-3">Recipients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEDULED_REPORTS.map(s => (
                      <tr key={s.name} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                        <td className={`p-3 font-medium ${TEXT}`}>{s.name}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#393836]/40 text-[#CDCCCA] border border-[#393836]">
                            <CalendarCheck size={11} /> {s.frequency}
                          </span>
                        </td>
                        <td className={`p-3 ${MUTED}`}>{s.nextRun}</td>
                        <td className={`p-3 ${MUTED}`}>{s.recipients}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 6: MY TIMESHEET (SELF-SERVICE) ═══════════════ */}
      {tab === "my-timesheet" && <MyTimesheetTab toast={toast} />}
    </div>
  );
}

// ─── Filter group helper (Timesheets tab) ───────────────────────────────────
function FilterGroup<T extends string>({
  label, options, value, onChange,
}: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${FAINT}`}>{label}:</span>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              value === o
                ? "bg-[#01696F]/20 text-[#4F98A3] border border-[#01696F]/40"
                : "bg-[#171614] border border-[#393836] text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 6: My Timesheet (self-service portal) ──────────────────────────────
function MyTimesheetTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [staffName, setStaffName] = useState("");
  const [base, setBase] = useState<typeof MY_TS_BASES[number]>(MY_TS_BASES[0]);
  const [staffRole, setStaffRole] = useState<typeof MY_TS_ROLES[number]>(MY_TS_ROLES[0]);
  const [rows, setRows] = useState<TimesheetDayRow[]>(buildInitialTimesheetRows());
  const [submitted, setSubmitted] = useState(false);

  const periodEnd = addDays(PAY_PERIOD_START, FORTNIGHT_LENGTH - 1);

  function updateRow(idx: number, patch: Partial<TimesheetDayRow>) {
    if (submitted) return;
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleShiftTypeChange(idx: number, shiftType: ShiftType) {
    if (shiftType === "Off" || shiftType === "Leave") {
      updateRow(idx, { shiftType, startTime: "", endTime: "", remote: false, overnight: false, onCall: false });
    } else {
      updateRow(idx, { shiftType });
    }
  }

  const computedRows = rows.map((row) => ({ row, ...calcHoursForRow(row) }));

  const totals = computedRows.reduce(
    (acc, { ordinary, overtime, row }) => ({
      ordinary: acc.ordinary + ordinary,
      overtime: acc.overtime + overtime,
      remote: acc.remote + (row.remote ? 1 : 0),
      overnight: acc.overnight + (row.overnight ? 1 : 0),
      onCall: acc.onCall + (row.onCall ? 1 : 0),
    }),
    { ordinary: 0, overtime: 0, remote: 0, overnight: 0, onCall: 0 }
  );

  const estimatedGross =
    totals.ordinary * RATE_ORDINARY + totals.overtime * RATE_OVERTIME + totals.remote * RATE_REMOTE;

  function saveDraft() {
    toast({ title: "Timesheet saved — not yet submitted" });
  }

  function submitForApproval() {
    setSubmitted(true);
    toast({ title: "Timesheet submitted to payroll for approval" });
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className={`${CARD} p-5 space-y-4 relative`}>
        <div>
          <h2 className={`text-lg font-bold ${TEXT}`} style={HEADING_FONT}>
            Timesheet — Pay Period: {formatLongDate(PAY_PERIOD_START)} – {formatLongDate(periodEnd)}
          </h2>
          <p className={`text-xs ${MUTED} mt-0.5`}>Self-service portal — log your own hours for the current fortnight.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className={`text-[11px] font-semibold uppercase tracking-wider ${FAINT}`}>Staff Name</label>
            <div className="relative">
              <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A5957]" />
              <input
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Your Name"
                disabled={submitted}
                className="w-full bg-[#171614] border border-[#393836] rounded-lg pl-8 pr-3 py-2 text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={`text-[11px] font-semibold uppercase tracking-wider ${FAINT}`}>Base</label>
            <select
              value={base}
              onChange={(e) => setBase(e.target.value as typeof MY_TS_BASES[number])}
              disabled={submitted}
              className="w-full bg-[#171614] border border-[#393836] rounded-lg px-3 py-2 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50 disabled:opacity-50"
            >
              {MY_TS_BASES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={`text-[11px] font-semibold uppercase tracking-wider ${FAINT}`}>Role</label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as typeof MY_TS_ROLES[number])}
              disabled={submitted}
              className="w-full bg-[#171614] border border-[#393836] rounded-lg px-3 py-2 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50 disabled:opacity-50"
            >
              {MY_TS_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Daily log table + submitted overlay wrapper */}
      <div className="relative">
        {submitted && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#171614]/80 backdrop-blur-[1px] rounded-xl">
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1C1B19] border border-emerald-500/40 shadow-lg">
              <Lock size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Submitted — awaiting approval</span>
            </div>
          </div>
        )}

        <div className={`space-y-4 ${submitted ? "opacity-40 pointer-events-none select-none" : ""}`}>
          <div className="space-y-3">
            <SectionTitle>Daily Log — Fortnight</SectionTitle>
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b border-[#393836] ${MUTED}`}>
                      <th className="text-left p-2.5">Date</th>
                      <th className="text-left p-2.5">Shift Type</th>
                      <th className="text-left p-2.5">Start</th>
                      <th className="text-left p-2.5">End</th>
                      <th className="text-right p-2.5">Ordinary</th>
                      <th className="text-right p-2.5">Overtime</th>
                      <th className="text-left p-2.5">Allowances</th>
                      <th className="text-left p-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedRows.map(({ row, ordinary, overtime }, idx) => {
                      const isActive = row.shiftType !== "Off" && row.shiftType !== "Leave";
                      return (
                        <tr key={row.date.toISOString()} className="border-b border-[#393836]/50 hover:bg-[#171614]/60 transition-colors">
                          <td className={`p-2.5 font-medium ${TEXT} whitespace-nowrap`}>{formatShortDate(row.date)}</td>
                          <td className="p-2.5">
                            <select
                              value={row.shiftType}
                              onChange={(e) => handleShiftTypeChange(idx, e.target.value as ShiftType)}
                              className="bg-[#171614] border border-[#393836] rounded-md px-2 py-1 text-[11px] text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50"
                            >
                              {SHIFT_TYPES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            {isActive ? (
                              <input
                                type="time"
                                value={row.startTime}
                                onChange={(e) => updateRow(idx, { startTime: e.target.value })}
                                className="bg-[#171614] border border-[#393836] rounded-md px-2 py-1 text-[11px] text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50 w-[100px]"
                              />
                            ) : (
                              <span className={FAINT}>—</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {isActive ? (
                              <input
                                type="time"
                                value={row.endTime}
                                onChange={(e) => updateRow(idx, { endTime: e.target.value })}
                                className="bg-[#171614] border border-[#393836] rounded-md px-2 py-1 text-[11px] text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50 w-[100px]"
                              />
                            ) : (
                              <span className={FAINT}>—</span>
                            )}
                          </td>
                          <td className={`p-2.5 text-right ${TEXT}`}>{ordinary > 0 ? ordinary.toFixed(1) : "—"}</td>
                          <td className={`p-2.5 text-right ${overtime > 0 ? "text-amber-400 font-semibold" : FAINT}`}>{overtime > 0 ? overtime.toFixed(1) : "—"}</td>
                          <td className="p-2.5">
                            {isActive ? (
                              <div className="flex gap-1 flex-wrap">
                                <label className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-colors ${
                                  row.remote ? "bg-[#01696F]/20 border-[#4F98A3]/40 text-[#4F98A3]" : "bg-[#171614] border-[#393836] text-[#797876]"
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={row.remote}
                                    onChange={(e) => updateRow(idx, { remote: e.target.checked })}
                                    className="accent-[#4F98A3] w-3 h-3"
                                  />
                                  Remote
                                </label>
                                <label className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-colors ${
                                  row.overnight ? "bg-[#01696F]/20 border-[#4F98A3]/40 text-[#4F98A3]" : "bg-[#171614] border-[#393836] text-[#797876]"
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={row.overnight}
                                    onChange={(e) => updateRow(idx, { overnight: e.target.checked })}
                                    className="accent-[#4F98A3] w-3 h-3"
                                  />
                                  Overnight
                                </label>
                                <label className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-colors ${
                                  row.onCall ? "bg-[#01696F]/20 border-[#4F98A3]/40 text-[#4F98A3]" : "bg-[#171614] border-[#393836] text-[#797876]"
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={row.onCall}
                                    onChange={(e) => updateRow(idx, { onCall: e.target.checked })}
                                    className="accent-[#4F98A3] w-3 h-3"
                                  />
                                  On-Call
                                </label>
                              </div>
                            ) : (
                              <span className={FAINT}>—</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <input
                              value={row.notes}
                              onChange={(e) => updateRow(idx, { notes: e.target.value })}
                              placeholder="Optional"
                              className="w-full min-w-[110px] bg-[#171614] border border-[#393836] rounded-md px-2 py-1 text-[11px] text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary footer */}
          <div className="space-y-3">
            <SectionTitle>Summary</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${CARD} p-4`}>
                <div className={`text-2xl font-bold ${TEXT}`} style={HEADING_FONT}>{totals.ordinary.toFixed(1)}</div>
                <div className={`text-xs font-medium ${TEXT} mt-0.5`}>Total Ordinary Hours</div>
              </div>
              <div className={`${CARD} p-4`}>
                <div className={`text-2xl font-bold ${totals.overtime > 0 ? "text-amber-400" : TEXT}`} style={HEADING_FONT}>{totals.overtime.toFixed(1)}</div>
                <div className={`text-xs font-medium ${TEXT} mt-0.5`}>Total Overtime Hours</div>
              </div>
              <div className={`${CARD} p-4`}>
                <div className={`text-2xl font-bold ${TEXT}`} style={HEADING_FONT}>{totals.remote} / {totals.overnight} / {totals.onCall}</div>
                <div className={`text-xs font-medium ${TEXT} mt-0.5`}>Remote / Overnight / On-Call Days</div>
              </div>
              <div className={`${CARD} p-4`}>
                <div className={`text-2xl font-bold ${ACCENT}`} style={HEADING_FONT}>
                  ${estimatedGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className={`text-xs font-medium ${TEXT} mt-0.5`}>Estimated Gross</div>
                <div className={`text-[10px] ${FAINT} mt-0.5`}>Indicative only — subject to award rates &amp; payroll review</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {submitted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} /> Submitted for approval
          </span>
        ) : (
          <>
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1C1B19] border border-[#393836] text-[#CDCCCA] hover:border-[#4F98A3]/40 transition-colors"
            >
              <Save size={13} /> Save Draft
            </button>
            <button
              onClick={submitForApproval}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ${ACCENT_BG} ${ACCENT} border border-[#01696F]/40 hover:bg-[#01696F]/30 transition-colors`}
            >
              <Send size={13} /> Submit for Approval
            </button>
          </>
        )}
      </div>
    </div>
  );
}
