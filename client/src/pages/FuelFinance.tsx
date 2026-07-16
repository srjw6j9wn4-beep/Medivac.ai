import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserRole } from "@/lib/data";

interface Props { role: UserRole }

interface FuelReceipt {
  id: number;
  receiptRef: string;
  entryMethod: string;
  aircraftReg: string;
  airportIcao: string;
  upliftDate: string;
  upliftLb: number;
  pricePerLb: number;
  totalAud: number;
  supplier: string;
  invoiceRef: string | null;
  scanImageUrl: string | null;
  reconStatus: string;
  reconBatchId: string | null;
  notes: string | null;
  enteredBy: string;
  createdAt: string;
  updatedAt: string;
}

// All fuel in pounds (lb) for King Air

const MONTHLY_BUDGET = [
  { month: "Jan", budget: 38000, actual: 35200 },
  { month: "Feb", budget: 38000, actual: 37800 },
  { month: "Mar", budget: 40000, actual: 41200 },
  { month: "Apr", budget: 40000, actual: 38900 },
  { month: "May", budget: 42000, actual: 43100 },
  { month: "Jun", budget: 42000, actual: 14489 }, // MTD
];

const INVOICES = [
  { id: "INV-2026-041", vendor: "Viva Energy", period: "May 2026", amount: 18420.80, status: "Paid", due: "15 Jun 2026" },
  { id: "INV-2026-042", vendor: "Puma Energy", period: "May 2026", amount: 9870.00, status: "Paid", due: "20 Jun 2026" },
  { id: "INV-2026-043", vendor: "BP Aviation", period: "May 2026", amount: 7350.60, status: "Awaiting Approval", due: "25 Jun 2026" },
  { id: "INV-2026-044", vendor: "Airtac", period: "May 2026", amount: 4122.40, status: "Overdue", due: "01 Jun 2026" },
];

const invStatus = (s: string) => s === "Paid" ? "status-green" : s === "Awaiting Approval" ? "status-yellow" : s === "Overdue" ? "status-red" : "status-gray";

// ─── Airport Landing Fees (sample reconciliation data) ─────────────────────
const LANDING_FEES = [
  { id: "LF-2026-101", date: "2026-06-03", aircraftReg: "VH-MVW", airportIcao: "YSDU", flightType: "NEPT", feeAmount: 284.50, invoiceRef: "DBO-LF-0603", status: "Reconciled", notes: "Standard NEPT landing fee — Dubbo Regional" },
  { id: "LF-2026-102", date: "2026-06-05", aircraftReg: "VH-MVX", airportIcao: "YBHI", flightType: "NEPT", feeAmount: 198.00, invoiceRef: "BHQ-LF-0605", status: "Reconciled", notes: "Broken Hill Airport — after-hours surcharge included" },
  { id: "LF-2026-103", date: "2026-06-09", aircraftReg: "VH-MVW", airportIcao: "YSBK", flightType: "Charter", feeAmount: 412.75, invoiceRef: "BWU-LF-0609", status: "Pending", notes: "Bankstown charter movement — awaiting invoice from airport operator" },
  { id: "LF-2026-104", date: "2026-06-12", aircraftReg: "VH-MVY", airportIcao: "YMLT", flightType: "Ferry", feeAmount: 156.20, invoiceRef: "MLT-LF-0612", status: "Reconciled", notes: "Ferry positioning leg — Launceston" },
  { id: "LF-2026-105", date: "2026-06-18", aircraftReg: "VH-MVX", airportIcao: "YMEN", flightType: "NEPT", feeAmount: 227.90, invoiceRef: "EN-LF-0618", status: "Disputed", notes: "Fee disputed — landing category applied incorrectly by Essendon ops" },
];

// ─── Air Services Charges (Airservices Australia — en-route & terminal nav) ─
const AIR_SERVICES_CHARGES = [
  { id: "ASC-2026-06", month: "Jun 2026", aircraftReg: "VH-MVW", route: "YSDU–YSBK", enRouteCharge: 340.10, terminalNavCharge: 118.40, invoiceRef: "ASA-0626-01", status: "Reconciled", notes: "Standard en-route + terminal nav, Dubbo–Bankstown" },
  { id: "ASC-2026-05a", month: "May 2026", aircraftReg: "VH-MVX", route: "YBHI–YSDU", enRouteCharge: 285.60, terminalNavCharge: 96.20, invoiceRef: "ASA-0526-04", status: "Reconciled", notes: "Broken Hill–Dubbo retrieval sector" },
  { id: "ASC-2026-05b", month: "May 2026", aircraftReg: "VH-MVY", route: "YSBK–YMLT", enRouteCharge: 512.30, terminalNavCharge: 174.80, invoiceRef: "ASA-0526-07", status: "Pending", notes: "Charter movement — awaiting Airservices monthly statement" },
  { id: "ASC-2026-04", month: "Apr 2026", aircraftReg: "VH-MVW", route: "YSDU–YMEN", enRouteCharge: 398.75, terminalNavCharge: 132.15, invoiceRef: "ASA-0426-02", status: "Disputed", notes: "Terminal nav charge under review — duplicate billing suspected" },
];



const mtdFuel = MONTHLY_BUDGET[MONTHLY_BUDGET.length - 1].actual;
const mtdBudget = MONTHLY_BUDGET[MONTHLY_BUDGET.length - 1].budget;

const BAR_MAX = Math.max(...MONTHLY_BUDGET.map(m => Math.max(m.budget, m.actual)));

const HEADING_FONT = { fontFamily: "'Cabinet Grotesk', sans-serif" };

// Jet-A density: 1 litre = 0.8157 lb, so 1 lb = 1.2259 L
const LB_PER_L = 0.8157;

const emptyForm = {
  aircraftReg: "",
  airportIcao: "",
  upliftDate: new Date().toISOString().slice(0, 10),
  upliftLb: "",
  pricePerLb: "",
  supplier: "",
  receiptRef: "",
  notes: "",
};

export default function FuelFinance({ role }: Props) {
  const qc = useQueryClient();
  const [category, setCategory] = useState<"fuel" | "landing-fees" | "air-services">("fuel");
  const [tab, setTab] = useState<"fuel" | "reconciliation" | "budget" | "invoices">("fuel");
  const [filterAircraft, setFilterAircraft] = useState("All");
  const [showLandingFeeForm, setShowLandingFeeForm] = useState(false);
  const [showAirServicesForm, setShowAirServicesForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [queryNoteDrafts, setQueryNoteDrafts] = useState<Record<number, string>>({});
  const [fuelUnit, setFuelUnit] = useState<"lb" | "L">("lb");

  const toDisplayUnit = (lb: number) => fuelUnit === "lb" ? lb : +(lb / LB_PER_L).toFixed(1);
  const unitLabel = fuelUnit === "lb" ? "lb" : "L";

  const tabs = [
    { id: "fuel", label: "Fuel Uplift Log" },
    { id: "reconciliation", label: "Reconciliation" },
    { id: "budget", label: "Budget vs Actual" },
    { id: "invoices", label: "Invoices" },
  ] as const;

  const categories = [
    { id: "fuel", label: "Fuel" },
    { id: "landing-fees", label: "Airport Landing Fees" },
    { id: "air-services", label: "Air Services Charges" },
  ] as const;

  const landingFeeStatusClass = (s: string) => s === "Reconciled" ? "status-green" : s === "Disputed" ? "status-red" : "status-yellow";

  // ─── Live fuel receipts ─────────────────────────────────────────────────
  const { data: receipts = [], isLoading } = useQuery<FuelReceipt[]>({
    queryKey: ["/api/fuel-receipts"],
    queryFn: () => apiRequest("GET", "/api/fuel-receipts").then(r => r.json()),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/fuel-receipts", data).then(r => {
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      return r.json();
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/fuel-receipts"] });
      setForm(emptyForm);
      setShowAddForm(false);
      setFormError(null);
    },
    onError: (err: any) => setFormError(err?.message ?? "Failed to save entry"),
  });

  const updateReconMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest("PATCH", `/api/fuel-receipts/${id}`, updates).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/fuel-receipts"] }),
  });

  const aircraftOptions = ["All", ...Array.from(new Set(receipts.map(f => f.aircraftReg)))];
  const filtered = filterAircraft === "All" ? receipts : receipts.filter(f => f.aircraftReg === filterAircraft);

  const upliftLbNum = parseFloat(form.upliftLb) || 0;
  const pricePerLbNum = parseFloat(form.pricePerLb) || 0;
  const totalAud = upliftLbNum * pricePerLbNum;

  // ─── Last 7 days live stats ─────────────────────────────────────────────
  const { last7Lb, last7Cost } = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = receipts.filter(r => {
      const t = new Date(r.upliftDate).getTime();
      return !isNaN(t) && t >= cutoff;
    });
    return {
      last7Lb: recent.reduce((a, b) => a + (b.upliftLb || 0), 0),
      last7Cost: recent.reduce((a, b) => a + (b.totalAud || 0), 0),
    };
  }, [receipts]);

  const pending = receipts.filter(r => r.reconStatus === "pending");
  const pendingTotal = pending.reduce((a, b) => a + (b.totalAud || 0), 0);

  function handleAddEntry() {
    setFormError(null);
    if (!form.aircraftReg || !form.airportIcao || !form.upliftDate || !form.upliftLb || !form.pricePerLb || !form.supplier) {
      setFormError("Please fill in all required fields.");
      return;
    }
    createMutation.mutate({
      aircraftReg: form.aircraftReg.toUpperCase(),
      airportIcao: form.airportIcao.toUpperCase(),
      upliftDate: form.upliftDate,
      upliftLb: upliftLbNum,
      pricePerLb: pricePerLbNum,
      totalAud,
      supplier: form.supplier,
      receiptRef: form.receiptRef || undefined,
      notes: form.notes || null,
      entryMethod: "manual",
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={HEADING_FONT}>Fee Reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fuel, airport landing fees, and Airservices Australia charge reconciliation — fuel tracked in {unitLabel}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-xl">
          <span className="text-amber-400 text-sm">⛽</span>
          <span className="text-xs font-semibold text-amber-400">King Air — Fuel in {unitLabel}</span>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex items-center gap-3 flex-wrap" data-testid="fee-recon-category-selector">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category:</span>
        {categories.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            data-testid={`category-pill-${c.id}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              category === c.id ? "bg-cyan-400/20 border-cyan-400/40 text-cyan-400" : "bg-card border-card-border text-muted-foreground hover:text-foreground"
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {category === "fuel" && (
      <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: `Fuel (7 days, ${unitLabel})`, value: toDisplayUnit(last7Lb).toLocaleString(), color: "text-cyan-400" },
          { label: "Fuel Cost (7 days)", value: `$${last7Cost.toFixed(0)}`, color: "text-amber-400" },
          { label: "MTD Spend", value: `$${mtdFuel.toLocaleString()}`, color: "text-green-400" },
          { label: "MTD Budget Rem.", value: `$${(mtdBudget - mtdFuel).toLocaleString()}`, color: mtdFuel > mtdBudget ? "text-red-400" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={HEADING_FONT}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.id === "reconciliation" && pending.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-400/30 text-amber-300 text-[10px] font-bold">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Fuel Uplift Log */}
      {tab === "fuel" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter aircraft:</span>
              {aircraftOptions.map(a => (
                <button key={a} onClick={() => setFilterAircraft(a)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterAircraft === a ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30" : "bg-card border border-card-border text-muted-foreground hover:text-foreground"}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Units:</span>
              <div className="flex gap-1 bg-card border border-card-border rounded-lg p-1">
                {(["lb", "L"] as const).map(u => (
                  <button key={u} onClick={() => setFuelUnit(u)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${fuelUnit === u ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30" : "text-muted-foreground hover:text-foreground"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Aircraft</th>
                    <th className="text-left p-3">Airport</th>
                    <th className="text-right p-3">Uplift ({unitLabel})</th>
                    <th className="text-right p-3">${unitLabel === "L" ? "$/L" : "$/lb"}</th>
                    <th className="text-right p-3">Total (AUD)</th>
                    <th className="text-left p-3">Supplier</th>
                    <th className="text-left p-3">Receipt</th>
                    <th className="text-left p-3">Recon</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">Loading fuel receipts…</td></tr>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">No fuel uplift entries yet.</td></tr>
                  )}
                  {filtered.map(f => (
                    <tr key={f.id} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                      <td className="p-3">{f.upliftDate}</td>
                      <td className="p-3 font-bold text-cyan-400">{f.aircraftReg}</td>
                      <td className="p-3 font-mono">{f.airportIcao}</td>
                      <td className="p-3 text-right font-semibold">{toDisplayUnit(f.upliftLb).toLocaleString()}</td>
                      <td className="p-3 text-right">${fuelUnit === "L" ? (f.pricePerLb * LB_PER_L).toFixed(2) : f.pricePerLb.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-amber-400">${f.totalAud.toFixed(2)}</td>
                      <td className="p-3">{f.supplier}</td>
                      <td className="p-3 text-muted-foreground font-mono text-[10px]">{f.receiptRef}</td>
                      <td className="p-3">
                        <span className={`badge ${f.reconStatus === "matched" ? "status-green" : f.reconStatus === "queried" ? "status-yellow" : "status-gray"}`}>{f.reconStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-card-border bg-background/20">
                      <td colSpan={3} className="p-3 font-bold text-xs">Totals</td>
                      <td className="p-3 text-right font-bold">{toDisplayUnit(filtered.reduce((a, b) => a + b.upliftLb, 0)).toLocaleString()} {unitLabel}</td>
                      <td className="p-3" />
                      <td className="p-3 text-right font-bold text-amber-400">${filtered.reduce((a, b) => a + b.totalAud, 0).toFixed(2)}</td>
                      <td colSpan={3} className="p-3" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <button onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
            {showAddForm ? "Cancel" : "+ Add Uplift Entry"}
          </button>

          {showAddForm && (
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
              <div className="text-sm font-bold" style={HEADING_FONT}>New Fuel Uplift Entry</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Aircraft Reg *</label>
                  <input value={form.aircraftReg} onChange={e => setForm(f => ({ ...f, aircraftReg: e.target.value.toUpperCase() }))}
                    placeholder="VH-MVW" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Airport ICAO *</label>
                  <input value={form.airportIcao} onChange={e => setForm(f => ({ ...f, airportIcao: e.target.value.toUpperCase() }))}
                    placeholder="YSDU" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs uppercase" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Date *</label>
                  <input type="date" value={form.upliftDate} onChange={e => setForm(f => ({ ...f, upliftDate: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Uplift (lb) *</label>
                  <input type="number" value={form.upliftLb} onChange={e => setForm(f => ({ ...f, upliftLb: e.target.value }))}
                    placeholder="1840" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Price per lb (AUD) *</label>
                  <input type="number" step="0.01" value={form.pricePerLb} onChange={e => setForm(f => ({ ...f, pricePerLb: e.target.value }))}
                    placeholder="1.42" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Total (AUD, auto)</label>
                  <div className="w-full bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs font-semibold text-amber-400">
                    ${totalAud.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Supplier *</label>
                  <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    placeholder="Viva Energy" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Receipt Ref (optional)</label>
                  <input value={form.receiptRef} onChange={e => setForm(f => ({ ...f, receiptRef: e.target.value }))}
                    placeholder="Auto-generated if blank" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Notes" className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-xs" />
                </div>
              </div>
              {formError && <div className="text-xs text-red-400 font-medium">{formError}</div>}
              <div className="flex gap-2">
                <button onClick={handleAddEntry} disabled={createMutation.isPending}
                  className="px-4 py-2 bg-cyan-400 text-black text-xs font-bold rounded-lg disabled:opacity-50">
                  {createMutation.isPending ? "Saving…" : "Save Entry"}
                </button>
                <button onClick={() => { setShowAddForm(false); setForm(emptyForm); setFormError(null); }}
                  className="px-4 py-2 bg-background border border-card-border text-xs font-semibold rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reconciliation */}
      {tab === "reconciliation" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400" style={HEADING_FONT}>{pending.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pending Reconciliation</div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400" style={HEADING_FONT}>${pendingTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pending Total (AUD)</div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Aircraft</th>
                    <th className="text-left p-3">Airport</th>
                    <th className="text-right p-3">Total (AUD)</th>
                    <th className="text-left p-3">Receipt</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No fuel receipts to reconcile.</td></tr>
                  )}
                  {receipts.map(f => (
                    <tr key={f.id} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                      <td className="p-3">{f.upliftDate}</td>
                      <td className="p-3 font-bold text-cyan-400">{f.aircraftReg}</td>
                      <td className="p-3 font-mono">{f.airportIcao}</td>
                      <td className="p-3 text-right font-semibold text-amber-400">${f.totalAud.toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground font-mono text-[10px]">{f.receiptRef}</td>
                      <td className="p-3">
                        {f.reconStatus === "matched" ? (
                          <span className="badge status-green">✓ Matched</span>
                        ) : f.reconStatus === "queried" ? (
                          <span className="badge status-yellow">Queried{f.notes ? `: ${f.notes}` : ""}</span>
                        ) : (
                          <span className="badge status-gray">Pending</span>
                        )}
                      </td>
                      <td className="p-3">
                        {f.reconStatus === "pending" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1.5">
                              <button onClick={() => updateReconMutation.mutate({ id: f.id, updates: { reconStatus: "matched" } })}
                                className="px-2.5 py-1 bg-green-400/10 hover:bg-green-400/20 border border-green-400/30 text-green-400 text-[11px] font-semibold rounded-md">
                                Mark Matched
                              </button>
                              <button onClick={() => {
                                const note = queryNoteDrafts[f.id] || "Query raised";
                                updateReconMutation.mutate({ id: f.id, updates: { reconStatus: "queried", notes: note } });
                              }}
                                className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-[11px] font-semibold rounded-md">
                                Query
                              </button>
                            </div>
                            <input
                              value={queryNoteDrafts[f.id] ?? ""}
                              onChange={e => setQueryNoteDrafts(d => ({ ...d, [f.id]: e.target.value }))}
                              placeholder="Query note (optional)"
                              className="w-full bg-background border border-card-border rounded px-2 py-1 text-[11px]"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Budget vs Actual */}
      {tab === "budget" && (
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
          <div className="text-sm font-bold" style={HEADING_FONT}>2026 Fuel Budget vs Actual Spend</div>

          {/* Bar chart */}
          <div className="space-y-3">
            {MONTHLY_BUDGET.map(m => (
              <div key={m.month} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold w-8">{m.month}</span>
                  <span className="text-muted-foreground">Budget ${m.budget.toLocaleString()}</span>
                  <span className={m.actual > m.budget ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
                    Actual ${m.actual.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-1 items-end h-5">
                  <div className="flex-1 bg-background rounded overflow-hidden h-3 relative">
                    <div className="h-3 bg-cyan-400/30 rounded" style={{ width: `${(m.budget / BAR_MAX) * 100}%` }} />
                  </div>
                </div>
                <div className="flex-1 bg-background rounded overflow-hidden h-2 relative">
                  <div className={`h-2 rounded ${m.actual > m.budget ? "bg-red-400" : "bg-cyan-400"}`}
                    style={{ width: `${(m.actual / BAR_MAX) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-400/30" />Budget</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-400" />Actual (under)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400" />Actual (over)</div>
          </div>
        </div>
      )}

      {/* Invoices */}
      {tab === "invoices" && (
        <div className="space-y-3">
          {INVOICES.map(inv => (
            <div key={inv.id} className="bg-card border border-card-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-2xl">🧾</div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={HEADING_FONT}>{inv.vendor} — {inv.period}</div>
                <div className="text-xs text-muted-foreground font-mono">{inv.id}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Due: {inv.due}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="text-lg font-bold text-amber-400" style={HEADING_FONT}>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <span className={`badge ${invStatus(inv.status)}`}>{inv.status}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <label className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
              Upload Invoice
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) alert(`Invoice "${f.name}" selected. Upload processing would be handled by the server in production.`);
                e.target.value = '';
              }} />
            </label>
            <button onClick={() => {
              const rows = [['ID','Vendor','Period','Amount','Status','Due'],...INVOICES.map(i=>[i.id,i.vendor,i.period,i.amount.toFixed(2),i.status,i.due])];
              const csv = rows.map(r=>r.join(',')).join('\n');
              const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
              const a = document.createElement('a'); a.href=url; a.download='fuel-invoices.csv'; a.click(); URL.revokeObjectURL(url);
            }} className="px-4 py-2 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
              Export to CSV
            </button>
          </div>
        </div>
      )}
      </>
      )}

      {/* Airport Landing Fees */}
      {category === "landing-fees" && (
        <div className="space-y-4" data-testid="category-landing-fees">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Aircraft Reg</th>
                    <th className="text-left p-3">Airport (ICAO)</th>
                    <th className="text-left p-3">Flight Type</th>
                    <th className="text-right p-3">Fee Amount (AUD)</th>
                    <th className="text-left p-3">Invoice Ref</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {LANDING_FEES.map(f => (
                    <tr key={f.id} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                      <td className="p-3">{f.date}</td>
                      <td className="p-3 font-bold text-cyan-400">{f.aircraftReg}</td>
                      <td className="p-3 font-mono">{f.airportIcao}</td>
                      <td className="p-3">{f.flightType}</td>
                      <td className="p-3 text-right font-semibold text-amber-400">${f.feeAmount.toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground font-mono text-[10px]">{f.invoiceRef}</td>
                      <td className="p-3">
                        <span className={`badge ${landingFeeStatusClass(f.status)}`}>{f.status}</span>
                      </td>
                      <td className="p-3 text-muted-foreground max-w-[260px]">{f.notes}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-card-border bg-background/20">
                    <td colSpan={4} className="p-3 font-bold text-xs">Totals</td>
                    <td className="p-3 text-right font-bold text-amber-400">${LANDING_FEES.reduce((a, b) => a + b.feeAmount, 0).toFixed(2)}</td>
                    <td colSpan={3} className="p-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button onClick={() => setShowLandingFeeForm(v => !v)}
            data-testid="btn-add-landing-fee-entry"
            className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
            {showLandingFeeForm ? "Cancel" : "+ Add Entry"}
          </button>

          {showLandingFeeForm && (
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
              <div className="text-sm font-bold" style={HEADING_FONT}>New Landing Fee Entry</div>
              <p className="text-xs text-muted-foreground">
                Landing fee entry form would capture Date, Aircraft Reg, Airport (ICAO), Flight Type, Fee Amount, and Invoice Ref, and post to the reconciliation table above. Server-side persistence for this category is not yet wired up.
              </p>
              <button onClick={() => setShowLandingFeeForm(false)}
                className="px-4 py-2 bg-background border border-card-border text-xs font-semibold rounded-lg">
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Air Services Charges */}
      {category === "air-services" && (
        <div className="space-y-4" data-testid="category-air-services">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground">
                    <th className="text-left p-3">Month</th>
                    <th className="text-left p-3">Aircraft Reg</th>
                    <th className="text-left p-3">Route</th>
                    <th className="text-right p-3">En-Route Charge (AUD)</th>
                    <th className="text-right p-3">Terminal Nav Charge (AUD)</th>
                    <th className="text-right p-3">Total (AUD)</th>
                    <th className="text-left p-3">Invoice Ref</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {AIR_SERVICES_CHARGES.map(c => {
                    const total = c.enRouteCharge + c.terminalNavCharge;
                    return (
                      <tr key={c.id} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                        <td className="p-3">{c.month}</td>
                        <td className="p-3 font-bold text-cyan-400">{c.aircraftReg}</td>
                        <td className="p-3 font-mono">{c.route}</td>
                        <td className="p-3 text-right">${c.enRouteCharge.toFixed(2)}</td>
                        <td className="p-3 text-right">${c.terminalNavCharge.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-amber-400">${total.toFixed(2)}</td>
                        <td className="p-3 text-muted-foreground font-mono text-[10px]">{c.invoiceRef}</td>
                        <td className="p-3">
                          <span className={`badge ${landingFeeStatusClass(c.status)}`}>{c.status}</span>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[260px]">{c.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-card-border bg-background/20">
                    <td colSpan={3} className="p-3 font-bold text-xs">Totals</td>
                    <td className="p-3 text-right font-bold">${AIR_SERVICES_CHARGES.reduce((a, b) => a + b.enRouteCharge, 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold">${AIR_SERVICES_CHARGES.reduce((a, b) => a + b.terminalNavCharge, 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-amber-400">${AIR_SERVICES_CHARGES.reduce((a, b) => a + b.enRouteCharge + b.terminalNavCharge, 0).toFixed(2)}</td>
                    <td colSpan={3} className="p-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button onClick={() => setShowAirServicesForm(v => !v)}
            data-testid="btn-add-air-services-entry"
            className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
            {showAirServicesForm ? "Cancel" : "+ Add Entry"}
          </button>

          {showAirServicesForm && (
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
              <div className="text-sm font-bold" style={HEADING_FONT}>New Air Services Charge Entry</div>
              <p className="text-xs text-muted-foreground">
                Air services charge entry form would capture Month, Aircraft Reg, Route, En-Route Charge, Terminal Nav Charge, and Invoice Ref, and post to the reconciliation table above. Server-side persistence for this category is not yet wired up.
              </p>
              <button onClick={() => setShowAirServicesForm(false)}
                className="px-4 py-2 bg-background border border-card-border text-xs font-semibold rounded-lg">
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
