import { type UserRole } from "@/lib/data";
import { FileText, Download, BarChart3, Shield, Calendar, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

function downloadWeeklyPack() {
  generatePDF({
    title: "Weekly Operations Pack",
    subtitle: "Flight Operations · Crew Hours · Mission Summary · Fuel Reconciliation",
    date: "27 May – 3 Jun 2026",
    reference: "WK22-2026",
    sections: [
      {
        heading: "Mission Summary",
        rows: [
          { label: "Total Missions", value: "24" },
          { label: "NEPT Missions", value: "18" },
          { label: "Medevac (P1)", value: "4" },
          { label: "Dental / Routine", value: "2" },
          { label: "Mission Completion Rate", value: "100%" },
          { label: "Average Mission Duration", value: "2h 14min" },
          { label: "Total Flight Hours", value: "53.5 hrs" },
        ],
      },
      {
        heading: "Fleet Utilisation",
        rows: [
          { label: "VH-MVW (B200)",  value: "18.2 hrs — Airborne" },
          { label: "VH-MQD (B350)",  value: "16.8 hrs — Airborne" },
          { label: "VH-XYR (B200)",  value: "14.6 hrs — Serviceable" },
          { label: "VH-MWH (B200)",  value: "13.4 hrs — Serviceable" },
          { label: "VH-VPQ (B350)",  value: "12.9 hrs — Serviceable" },
          { label: "VH-XYU (B200)",  value: "12.1 hrs — Maintenance" },
          { label: "VH-MVX (B200C)", value: "11.4 hrs — Serviceable" },
          { label: "VH-MWK (B200C)", value: "10.8 hrs — Serviceable" },
          { label: "VH-NAJ (B350)",  value: "9.6 hrs — Serviceable" },
          { label: "VH-MQK (B350)",  value: "9.1 hrs — Serviceable" },
          { label: "VH-XYJ (B200C)", value: "8.6 hrs — Serviceable" },
          { label: "VH-XYO (B200C)", value: "7.9 hrs — Serviceable" },
          { label: "VH-RFD (B200C)", value: "7.2 hrs — Serviceable" },
          { label: "VH-LTQ (B200C)", value: "6.5 hrs — Serviceable" },
          { label: "Aircraft Availability", value: "13 / 14 (93%)" },
        ],
      },
      {
        heading: "Crew Hours",
        rows: [
          { label: "Capt. R. Hughes", value: "38.5 hrs — 12% under EBA cap" },
          { label: "Capt. S. Nguyen", value: "35.0 hrs — 18% under EBA cap" },
          { label: "FO J. Walsh", value: "32.1 hrs — 24% under EBA cap" },
          { label: "FO M. Carter", value: "28.8 hrs — 30% under EBA cap" },
          { label: "EBA Violations", value: "None" },
          { label: "FRMS Fatigue Events", value: "1 (managed — crew substitution)" },
        ],
      },
      {
        heading: "Fuel Reconciliation",
        rows: [
          { label: "Total Uplift", value: "48,240 lb" },
          { label: "Primary Supplier", value: "Caltex Aviation — Dubbo" },
          { label: "Average Uplift per Sector", value: "2,010 lb" },
          { label: "Budget vs Actual", value: "$62,480 vs $59,940 — 4.1% under budget" },
          { label: "Outstanding Invoices", value: "2 (total: $8,420)" },
        ],
      },
      {
        heading: "Compliance Status",
        rows: [
          { label: "Dispatch Gate Compliance", value: "✓ 100% — all 24 missions released correctly" },
          { label: "APG Release Blocks", value: "1 (resolved — alternate routing)" },
          { label: "Maintenance Releases", value: "All current" },
          { label: "CASA Notifiable Events", value: "None" },
          { label: "ISO 9001 Actions", value: "2 open CAPAs — on track" },
        ],
      },
    ],
    footer: "CONFIDENTIAL — RFDS SE Section Aeromedical Operations",
  });
}

function downloadMonthlyReport() {
  generatePDF({
    title: "Monthly Compliance Report",
    subtitle: "Mission Analytics · Maintenance Summary · Compliance KPIs",
    date: "May 2026",
    reference: "MON-MAY-2026",
    sections: [
      {
        heading: "Operations Summary",
        rows: [
          { label: "Total Missions", value: "97" },
          { label: "Total Flight Hours", value: "214.8 hrs" },
          { label: "Mission Completion Rate", value: "99.0%" },
          { label: "Average Response Time (P1)", value: "22 min" },
          { label: "Patient Transfers", value: "89" },
          { label: "Sector States Covered", value: "NSW, QLD, VIC, SA" },
        ],
      },
      {
        heading: "ISO Compliance KPIs",
        rows: [
          { label: "ISO 9001 Readiness", value: "78%" },
          { label: "ISO 13485 Readiness", value: "62%" },
          { label: "ISO 27001 Readiness", value: "85%" },
          { label: "CASA Compliance", value: "94%" },
          { label: "Open CAPAs", value: "7 (3 critical, 4 minor)" },
          { label: "Closed CAPAs This Month", value: "5" },
          { label: "Internal Audits Completed", value: "2" },
        ],
      },
      {
        heading: "Maintenance Summary",
        rows: [
          { label: "Scheduled Services", value: "4 completed on time" },
          { label: "AOG Events", value: "1 (VH-XYU — 18hr AOG, resolved)" },
          { label: "Unscheduled Maintenance", value: "2 minor defects — both rectified" },
          { label: "Outstanding MEL Items", value: "None" },
          { label: "Component Replacements", value: "3 (avionics, tyres, brake pack)" },
        ],
      },
      {
        heading: "Crew & Training",
        rows: [
          { label: "EBA Compliance", value: "100% — no violations" },
          { label: "Simulator Sessions", value: "6 completed" },
          { label: "Medical Renewals Due", value: "1 (due 30 Jun 2026)" },
          { label: "Jotform Checks Submitted", value: "97 pre-flight, 97 post-flight" },
          { label: "Check & Training Forms", value: "14 submitted via Jotform" },
        ],
      },
    ],
    footer: "CONFIDENTIAL — RFDS SE Section Aeromedical Operations",
  });
}

function downloadYearlyPack() {
  generatePDF({
    title: "Financial Year Operations Report",
    subtitle: "FY2025–26 · Full Year Summary · Fleet · Crew · Compliance · Financials",
    date: "1 Jul 2025 – 30 Jun 2026",
    reference: "FY2026-ANNUAL",
    sections: [
      {
        heading: "Annual Operations Summary",
        rows: [
          { label: "Total Missions",            value: "1,142" },
          { label: "Total Flight Hours",         value: "2,518.4 hrs" },
          { label: "Mission Completion Rate",    value: "98.8%" },
          { label: "Patient Transfers Completed",value: "1,089" },
          { label: "Average P1 Response Time",   value: "21 min" },
          { label: "States Serviced",            value: "NSW, VIC, QLD, SA, ACT, TAS" },
          { label: "Base Operations",            value: "Dubbo · Broken Hill · Bankstown/Sydney · Launceston" },
        ],
      },
      {
        heading: "Fleet Performance",
        rows: [
          { label: "Fleet Size",                 value: "14 aircraft (10× B200, 4× B350)" },
          { label: "Total Fleet Hours",          value: "2,518.4 hrs" },
          { label: "Aircraft Availability",      value: "93.4% average" },
          { label: "AOG Events",                 value: "4 (avg 14hr resolution)" },
          { label: "Scheduled Services Completed",value: "42 on time" },
          { label: "Outstanding MEL Items (EOY)",value: "None" },
          { label: "Top Utilised Aircraft",      value: "VH-MVW — 218.4 hrs" },
        ],
      },
      {
        heading: "Crew & EBA Compliance",
        rows: [
          { label: "Total Pilot FTE",            value: "12 (Capt + FO roster)" },
          { label: "EBA Violations",             value: "None" },
          { label: "FRMS Fatigue Events",        value: "6 (all managed — crew substitution)" },
          { label: "Simulator Sessions Completed",value: "68" },
          { label: "BFR / IPC Currency",         value: "100% current at EOY" },
          { label: "Medical Certificates",       value: "All current at EOY" },
          { label: "New Trainees Inducted",      value: "2" },
        ],
      },
      {
        heading: "Compliance & Regulatory",
        rows: [
          { label: "CASA AOC Status",            value: "✓ Current — no conditions breached" },
          { label: "CASR Part 135 Compliance",   value: "✓ 100% dispatch gate compliance" },
          { label: "ISO 9001 Readiness",         value: "78% (target 85% by Dec 2026)" },
          { label: "ISO 13485 Readiness",        value: "62% (target 80% by Jun 2027)" },
          { label: "CASA Notifiable Events",     value: "None" },
          { label: "Open CAPAs (EOY)",           value: "7 (3 critical, 4 minor)" },
          { label: "CAPAs Closed This Year",     value: "31" },
        ],
      },
      {
        heading: "Fuel & Finance Summary",
        rows: [
          { label: "Total Fuel Uplift",          value: "578,880 lb" },
          { label: "Primary Suppliers",          value: "Caltex Aviation (Dubbo, BHI, YSBK, YMLT)" },
          { label: "Fuel Budget vs Actual",      value: "$748,200 vs $719,440 — 3.8% under" },
          { label: "Total Mission Costs",        value: "$4.18M (within approved budget)" },
          { label: "Outstanding Invoices (EOY)", value: "3 (total: $22,640)" },
          { label: "Budget Variance",            value: "1.9% under annual budget" },
        ],
      },
    ],
    footer: "CONFIDENTIAL — RFDS SE Section · Annual Operations Report FY2025–26",
  });
}

function downloadCASAAudit() {
  generatePDF({
    title: "CASA Audit Export Package",
    subtitle: "Flight Plans · W&B · Release Gates · Crew Sign-offs · Fuel Records",
    date: "1 May – 5 Jun 2026",
    reference: "CASA-AUDIT-2026-Q2",
    sections: [
      {
        heading: "Regulatory Compliance Summary",
        rows: [
          { label: "CAO 82.5 Compliance", value: "✓ Compliant — all crew rest periods met" },
          { label: "CASR Part 135 Operations", value: "✓ Compliant — all dispatch gates enforced" },
          { label: "CASR Part 61 Crew Currency", value: "✓ All pilots current — BFR, IPC, NVG" },
          { label: "AOC Conditions", value: "✓ All special conditions met" },
          { label: "NOTIFIABLE EVENTS", value: "None in period" },
        ],
      },
      {
        heading: "Dispatch Release Gate Audit",
        rows: [
          { label: "Total Missions Dispatched", value: "97" },
          { label: "Flight Plans Filed (NAIPS)", value: "97 / 97 — 100%" },
          { label: "W&B Calculations Completed", value: "97 / 97 — 100%" },
          { label: "APG Weather Releases", value: "96 / 97 — 1 alternate routing" },
          { label: "Maintenance Releases", value: "97 / 97 — 100%" },
          { label: "Crew Sign-offs", value: "97 / 97 — 100%" },
          { label: "Fuel Confirmed Pre-dispatch", value: "97 / 97 — 100%" },
          { label: "Gate Blocks Overridden", value: "None" },
        ],
      },
      {
        heading: "Flight & Crew Records",
        rows: [
          { label: "Tech Log Entries", value: "97 sectors — all signed" },
          { label: "Journey Log Entries", value: "97 sectors — all completed" },
          { label: "Crew Duty Records", value: "All filed — no anomalies" },
          { label: "Medical Certificates", value: "All current in period" },
          { label: "Drug & Alcohol Declarations", value: "All completed pre-duty" },
        ],
      },
      {
        heading: "Evidence Pack References",
        rows: [
          { label: "Flight Plan Archive", value: "Medivac.ai Document AI — 97 records" },
          { label: "W&B Spreadsheets", value: "Medivac.ai Tech Log module" },
          { label: "APG Release Records", value: "APG Aviation — electronically verified" },
          { label: "Maintenance Releases", value: "Veryon Tracking — exported on request" },
          { label: "Jotform Pre/Post Flight", value: "Jotform portal — 194 forms" },
          { label: "Crew Sign-off Logs", value: "Medivac.ai Dispatch module" },
        ],
      },
    ],
    footer: "CONFIDENTIAL — FOR CASA USE — RFDS SE Section",
  });
}

const AUDIT_EVENTS = [
  { time: "06:31", event: "Dispatch release signed", user: "Capt. R. Hughes", mission: "MEDIVAC 01", ok: true },
  { time: "06:28", event: "APG release accepted", user: "System", mission: "MEDIVAC 01", ok: true },
  { time: "06:15", event: "W&B calculated", user: "Capt. R. Hughes", mission: "MEDIVAC 01", ok: true },
  { time: "05:50", event: "Mission created", user: "Dispatcher", mission: "MEDIVAC 01", ok: true },
  { time: "05:10", event: "Airborne — MEDIVAC 03", user: "System", mission: "MEDIVAC 03", ok: true },
  { time: "04:45", event: "APG release BLOCKED", user: "System", mission: "MEDIVAC 02", ok: false },
];

export default function AuditReports({ role }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk',sans-serif" }}>Audit & Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">CASA audit export · Weekly/monthly packs · Compliance evidence</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Weekly Pack",
            icon: <Calendar size={18} className="text-cyan-400" />,
            desc: "Flight operations, crew hours, mission summary, fuel reconciliation",
            period: "27 May – 3 Jun 2026",
            ref: "WK22-2026",
            fn: downloadWeeklyPack,
          },
          {
            label: "Monthly Report",
            icon: <BarChart3 size={18} className="text-blue-400" />,
            desc: "Full mission analytics, maintenance summary, compliance KPIs",
            period: "May 2026",
            ref: "MON-MAY-2026",
            fn: downloadMonthlyReport,
          },
          {
            label: "CASA Audit Export",
            icon: <Shield size={18} className="text-orange-400" />,
            desc: "Complete audit package — flight plans, W&B, release gates, crew sign-offs",
            period: "Q2 2026 — On demand",
            ref: "CASA-AUDIT-2026-Q2",
            fn: downloadCASAAudit,
          },
          {
            label: "Financial Year Pack",
            icon: <TrendingUp size={18} className="text-purple-400" />,
            desc: "Full year summary — fleet, crew hours, compliance KPIs, fuel & finance",
            period: "FY2025–26 (1 Jul 2025 – 30 Jun 2026)",
            ref: "FY2026-ANNUAL",
            fn: downloadYearlyPack,
          },
        ].map((r, i) => (
          <div key={i} className="bg-card rounded-xl border border-card-border p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              {r.icon}
              <h3 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk',sans-serif" }}>{r.label}</h3>
              <span className="ml-auto status-green text-xs px-2 py-0.5 rounded-full">Ready</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{r.desc}</p>
            <div className="text-xs text-muted-foreground mb-1 font-mono">{r.period}</div>
            <div className="text-[10px] text-muted-foreground mb-4">Ref: {r.ref}</div>
            <button
              onClick={r.fn}
              className="mt-auto w-full flex items-center justify-center gap-2 p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-colors font-semibold"
            >
              <Download size={12} /> Download PDF
            </button>
          </div>
        ))}
      </div>

      {/* Recent audit log */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Audit Events</h2>
        <div className="bg-card rounded-xl border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mission</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_EVENTS.map((e, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{e.time}</td>
                  <td className="px-4 py-3 text-xs font-medium">{e.event}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.user}</td>
                  <td className="px-4 py-3 text-xs font-mono text-cyan-400">{e.mission}</td>
                  <td className="px-4 py-3 text-center">
                    {e.ok
                      ? <CheckCircle size={14} className="mx-auto text-green-400" />
                      : <span className="status-red text-xs px-2 py-0.5 rounded-full">Blocked</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
