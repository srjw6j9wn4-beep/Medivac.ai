import { useState, useMemo } from "react";
import {
  Receipt, CheckCircle2, Clock, XCircle, DollarSign, Download,
  ShieldCheck, ArrowRight, ExternalLink, Filter,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type Tab = "submit" | "register" | "dva";
type ClaimStatus = "Approved" | "Pending" | "Rejected" | "Paid";

interface Claim {
  id: string;
  date: string;
  patient: string;
  item: string;
  amount: number;
  status: ClaimStatus;
  paymentDate: string;
}

const CLAIMS: Claim[] = [
  { id: "CLM-30291", date: "02 Jul 2026", patient: "J. P*****", item: "10990", amount: 4200, status: "Paid", paymentDate: "09 Jul 2026" },
  { id: "CLM-30292", date: "02 Jul 2026", patient: "S. M*****", item: "10991", amount: 5850, status: "Paid", paymentDate: "09 Jul 2026" },
  { id: "CLM-30310", date: "04 Jul 2026", patient: "R. T*****", item: "10990", amount: 3960, status: "Approved", paymentDate: "Pending payment run" },
  { id: "CLM-30314", date: "05 Jul 2026", patient: "K. W*****", item: "10992", amount: 2100, status: "Paid", paymentDate: "12 Jul 2026" },
  { id: "CLM-30322", date: "06 Jul 2026", patient: "D. B*****", item: "10990", amount: 4400, status: "Pending", paymentDate: "—" },
  { id: "CLM-30330", date: "07 Jul 2026", patient: "A. C*****", item: "10991", amount: 6100, status: "Approved", paymentDate: "Pending payment run" },
  { id: "CLM-30341", date: "08 Jul 2026", patient: "L. H*****", item: "10990", amount: 3780, status: "Rejected", paymentDate: "—" },
  { id: "CLM-30352", date: "10 Jul 2026", patient: "M. F*****", item: "10992", amount: 2350, status: "Paid", paymentDate: "16 Jul 2026" },
  { id: "CLM-30361", date: "12 Jul 2026", patient: "N. G*****", item: "10990", amount: 4050, status: "Pending", paymentDate: "—" },
  { id: "CLM-30372", date: "14 Jul 2026", patient: "E. O*****", item: "10991", amount: 5920, status: "Rejected", paymentDate: "—" },
];

const STATUS_CFG: Record<ClaimStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Approved: { color: "text-[#4F98A3]", bg: "bg-[#4F98A3]/10 border-[#4F98A3]/30", icon: <CheckCircle2 size={12} /> },
  Pending: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", icon: <Clock size={12} /> },
  Rejected: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", icon: <XCircle size={12} /> },
  Paid: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", icon: <CheckCircle2 size={12} /> },
};

const MBS_ITEMS = [
  { code: "10990", label: "10990 — Air Ambulance", rate: 4200 },
  { code: "10991", label: "10991 — NEPT Fixed-Wing", rate: 5850 },
  { code: "10992", label: "10992 — NEPT Transfer", rate: 2100 },
];

const MISSIONS = [
  { ref: "MRQ-4891 · YSDU→YSSY", km: 312 },
  { ref: "MRQ-4893 · YSDU→YBHI", km: 268 },
  { ref: "MRQ-4895 · YBHI→YSSY", km: 720 },
  { ref: "MRQ-4899 · YSDU→YWCA", km: 184 },
];

const DVA_RATES = [
  { type: "Air Transport — Metropolitan Area", rate: "$3.20/km, min. call-out $180" },
  { type: "Air Transport — Rural / Remote", rate: "$4.85/km, min. call-out $340" },
  { type: "Aeromedical (ICU-equipped, escorted)", rate: "$6.10/km, min. call-out $620" },
  { type: "Escort Allowance (per escort, per leg)", rate: "$95 flat" },
];

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
      <div className="text-xs text-[#797876] mb-1">{label}</div>
      <div className={`text-xl font-bold ${color ?? "text-[#CDCCCA]"}`} style={HF}>{value}</div>
      {sub && <div className="text-[11px] text-[#5A5957] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MedicareBilling() {
  const [tab, setTab] = useState<Tab>("submit");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "All">("All");
  const [mbsItem, setMbsItem] = useState("10990");
  const [missionRef, setMissionRef] = useState(MISSIONS[0].ref);

  const selectedItem = MBS_ITEMS.find(m => m.code === mbsItem)!;
  const selectedMission = MISSIONS.find(m => m.ref === missionRef)!;
  const claimedAmount = selectedItem.rate;

  const filteredClaims = useMemo(
    () => CLAIMS.filter(c => statusFilter === "All" || c.status === statusFilter),
    [statusFilter]
  );

  const totalClaimed = CLAIMS.reduce((s, c) => s + c.amount, 0);
  const totalReceived = CLAIMS.filter(c => c.status === "Paid" || c.status === "Approved").reduce((s, c) => s + c.amount, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "submit", label: "Submit Claim" },
    { key: "register", label: "Claims Register" },
    { key: "dva", label: "DVA Schedule" },
  ];

  return (
    <div className="p-6 space-y-5 min-h-screen bg-[#0f1117] text-[#CDCCCA]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={HF}>Medicare & DVA Billing</h1>
        <p className="text-xs text-[#797876] mt-0.5">
          MBS Item 10990 · DVA Transport · NEPT Reimbursement · ECLIPSE Claiming
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Claims This Month" value="47" />
        <KPI label="Approved" value="$182,400" sub="39 claims" color="text-green-400" />
        <KPI label="Pending" value="$28,100" sub="6 claims" color="text-amber-400" />
        <KPI label="Rejected" value="$9,600" sub="2 claims" color="text-red-400" />
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

      {/* TAB 1: Submit Claim */}
      {tab === "submit" && (
        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">Patient Medicare Number</label>
              <input type="text" placeholder="e.g. 2950 12345 1" className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]" />
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">DVA File Number (optional)</label>
              <input type="text" placeholder="e.g. NX123456" className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]" />
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">MBS Item</label>
              <select
                value={mbsItem}
                onChange={e => setMbsItem(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
              >
                {MBS_ITEMS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">Mission Reference</label>
              <select
                value={missionRef}
                onChange={e => setMissionRef(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
              >
                {MISSIONS.map(m => <option key={m.ref} value={m.ref}>{m.ref}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">Date of Service</label>
              <input type="date" defaultValue="2026-07-17" className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]" />
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">Referring Provider Number</label>
              <input type="text" placeholder="e.g. 2436781A" className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]" />
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">Service Provider Number</label>
              <input type="text" defaultValue="RFDS SE — 2103456B" readOnly className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#797876]" />
            </div>
            <div>
              <label className="text-xs text-[#797876] block mb-1.5">Distance (km)</label>
              <input type="text" value={`${selectedMission.km} km`} readOnly className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#797876]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[#797876] block mb-1.5">Amount Claimed</label>
              <input
                type="text"
                value={`$${claimedAmount.toLocaleString()}`}
                readOnly
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm font-semibold text-[#4F98A3]"
              />
            </div>
          </div>

          <button className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4F98A3] text-[#0f1117] text-sm font-semibold hover:bg-[#4F98A3]/90">
            <ShieldCheck size={15} /> Submit via ECLIPSE
          </button>
          <p className="text-xs text-[#5A5957] mt-3">
            Claims submitted via Medicare ECLIPSE gateway. Approval typically within 2–5 business days.
          </p>
        </div>
      )}

      {/* TAB 2: Claims Register */}
      {tab === "register" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {(["All", "Approved", "Pending", "Rejected", "Paid"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    statusFilter === s ? "bg-[#4F98A3]/15 border-[#4F98A3] text-[#4F98A3]" : "border-[#393836] text-[#797876] hover:text-[#CDCCCA]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#393836] text-xs text-[#CDCCCA] hover:bg-white/[0.03]">
              <Download size={13} /> Export to CSV
            </button>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-[#393836] text-left text-xs text-[#797876]">
                  <th className="px-4 py-3 font-medium">Claim ID</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">MBS Item</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map(c => (
                  <tr key={c.id} className="border-b border-[#393836] last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-[#CDCCCA]">{c.id}</td>
                    <td className="px-4 py-3 text-[#797876]">{c.date}</td>
                    <td className="px-4 py-3">{c.patient}</td>
                    <td className="px-4 py-3 text-[#797876]">{c.item}</td>
                    <td className="px-4 py-3 text-right font-medium">${c.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${STATUS_CFG[c.status].bg} ${STATUS_CFG[c.status].color}`}>
                        {STATUS_CFG[c.status].icon} {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#797876]">{c.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#393836] font-semibold">
                  <td className="px-4 py-3" colSpan={4}>Total</td>
                  <td className="px-4 py-3 text-right text-[#CDCCCA]">${totalClaimed.toLocaleString()} claimed</td>
                  <td className="px-4 py-3 text-green-400" colSpan={2}>${totalReceived.toLocaleString()} received</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DVA Schedule */}
      {tab === "dva" && (
        <div className="space-y-5">
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-2" style={HF}>DVA Transport Entitlements</h3>
            <p className="text-sm text-[#797876] leading-relaxed">
              Eligible veterans and dependants under the DVA Repatriation Health Card or Veteran Card scheme are entitled to fully funded
              aeromedical and non-emergency patient transport (NEPT) where clinically indicated and pre-approved. RFDS operates as an approved
              DVA transport provider, billing directly to DVA under contract — no out-of-pocket cost to the veteran.
            </p>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#393836] text-left text-xs text-[#797876]">
                  <th className="px-5 py-3 font-medium">Transport Type</th>
                  <th className="px-5 py-3 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {DVA_RATES.map(r => (
                  <tr key={r.type} className="border-b border-[#393836] last:border-0">
                    <td className="px-5 py-3.5">{r.type}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#CDCCCA]">{r.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={HF}>DVA Approval Workflow</h3>
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              {[
                { step: "1", title: "Pre-Approval Request", desc: "Submitted to DVA prior to mission via provider portal" },
                { step: "2", title: "Mission Completion", desc: "Aeromedical or NEPT transport carried out and logged" },
                { step: "3", title: "Claim Submission", desc: "Claim lodged against contract, reconciled with mission record" },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center gap-3 flex-1">
                  <div className="bg-[#0f1117] border border-[#393836] rounded-lg p-4 flex-1">
                    <div className="w-7 h-7 rounded-full bg-[#4F98A3]/15 border border-[#4F98A3]/40 text-[#4F98A3] flex items-center justify-center text-xs font-bold mb-2">
                      {s.step}
                    </div>
                    <div className="text-sm font-medium text-[#CDCCCA]">{s.title}</div>
                    <div className="text-xs text-[#797876] mt-1">{s.desc}</div>
                  </div>
                  {i < 2 && <ArrowRight size={16} className="text-[#5A5957] shrink-0 hidden md:block" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <div>
              <div className="text-xs text-[#797876] mb-1">Current DVA Contract Number</div>
              <div className="text-sm font-mono font-semibold text-[#CDCCCA]">DVA — Trans2024/RFDS/0042</div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4F98A3] text-[#0f1117] text-sm font-semibold hover:bg-[#4F98A3]/90">
              <ExternalLink size={14} /> DVA Provider Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
