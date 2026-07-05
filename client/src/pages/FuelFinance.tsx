import { useState } from "react";
import type { UserRole } from "@/lib/data";

interface Props { role: UserRole }

// All fuel in pounds (lb) for King Air
const FUEL_LOG = [
  { id: "F001", date: "05 Jun 2026", aircraft: "VH-MVW", airport: "YSDU", uplift: 1840, unit: "lb", price: 1.42, total: 2612.80, supplier: "Viva Energy", receipt: "VE-20260605-001" },
  { id: "F002", date: "05 Jun 2026", aircraft: "VH-XYR", airport: "YBHI", uplift: 2120, unit: "lb", price: 1.55, total: 3286.00, supplier: "Puma Energy", receipt: "PE-20260605-044" },
  { id: "F003", date: "04 Jun 2026", aircraft: "VH-XYJ", airport: "YSSY", uplift: 980, unit: "lb", price: 1.68, total: 1646.40, supplier: "BP Aviation", receipt: "BP-20260604-887" },
  { id: "F004", date: "04 Jun 2026", aircraft: "VH-XYU", airport: "YSDU", uplift: 3200, unit: "lb", price: 1.42, total: 4544.00, supplier: "Viva Energy", receipt: "VE-20260604-072" },
  { id: "F005", date: "03 Jun 2026", aircraft: "VH-XYR", airport: "YMOR", uplift: 1460, unit: "lb", price: 1.61, total: 2350.60, supplier: "Airtac", receipt: "AT-20260603-012" },
];

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

const totalFuel = FUEL_LOG.reduce((a, b) => a + b.uplift, 0);
const totalCost = FUEL_LOG.reduce((a, b) => a + b.total, 0);
const mtdFuel = MONTHLY_BUDGET[MONTHLY_BUDGET.length - 1].actual;
const mtdBudget = MONTHLY_BUDGET[MONTHLY_BUDGET.length - 1].budget;

const BAR_MAX = Math.max(...MONTHLY_BUDGET.map(m => Math.max(m.budget, m.actual)));

export default function FuelFinance({ role }: Props) {
  const [tab, setTab] = useState<"fuel" | "budget" | "invoices">("fuel");
  const [filterAircraft, setFilterAircraft] = useState("All");

  const tabs = [
    { id: "fuel", label: "Fuel Uplift Log" },
    { id: "budget", label: "Budget vs Actual" },
    { id: "invoices", label: "Invoices" },
  ] as const;

  const aircraft = ["All", ...Array.from(new Set(FUEL_LOG.map(f => f.aircraft)))];
  const filtered = filterAircraft === "All" ? FUEL_LOG : FUEL_LOG.filter(f => f.aircraft === filterAircraft);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Fuel & Finance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fuel uplift tracking, budget monitoring, and invoice management — all fuel in lb</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-xl">
          <span className="text-amber-400 text-sm">⛽</span>
          <span className="text-xs font-semibold text-amber-400">King Air — Fuel in lb</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Fuel (5 days, lb)", value: totalFuel.toLocaleString(), color: "text-cyan-400" },
          { label: "Fuel Cost (5 days)", value: `$${totalCost.toFixed(0)}`, color: "text-amber-400" },
          { label: "MTD Spend", value: `$${mtdFuel.toLocaleString()}`, color: "text-green-400" },
          { label: "MTD Budget Rem.", value: `$${(mtdBudget - mtdFuel).toLocaleString()}`, color: mtdFuel > mtdBudget ? "text-red-400" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Fuel Log */}
      {tab === "fuel" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter aircraft:</span>
            {aircraft.map(a => (
              <button key={a} onClick={() => setFilterAircraft(a)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterAircraft === a ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30" : "bg-card border border-card-border text-muted-foreground hover:text-foreground"}`}>
                {a}
              </button>
            ))}
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-muted-foreground">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Aircraft</th>
                    <th className="text-left p-3">Airport</th>
                    <th className="text-right p-3">Uplift (lb)</th>
                    <th className="text-right p-3">$/lb</th>
                    <th className="text-right p-3">Total ($)</th>
                    <th className="text-left p-3">Supplier</th>
                    <th className="text-left p-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.id} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                      <td className="p-3">{f.date}</td>
                      <td className="p-3 font-bold text-cyan-400">{f.aircraft}</td>
                      <td className="p-3 font-mono">{f.airport}</td>
                      <td className="p-3 text-right font-semibold">{f.uplift.toLocaleString()}</td>
                      <td className="p-3 text-right">${f.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-amber-400">${f.total.toFixed(2)}</td>
                      <td className="p-3">{f.supplier}</td>
                      <td className="p-3 text-muted-foreground font-mono text-[10px]">{f.receipt}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-card-border bg-background/20">
                    <td colSpan={3} className="p-3 font-bold text-xs">Totals</td>
                    <td className="p-3 text-right font-bold">{filtered.reduce((a, b) => a + b.uplift, 0).toLocaleString()} lb</td>
                    <td className="p-3" />
                    <td className="p-3 text-right font-bold text-amber-400">${filtered.reduce((a, b) => a + b.total, 0).toFixed(2)}</td>
                    <td colSpan={2} className="p-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
            + Add Uplift Entry
          </button>
        </div>
      )}

      {/* Budget vs Actual */}
      {tab === "budget" && (
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
          <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>2026 Fuel Budget vs Actual Spend</div>

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
                <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{inv.vendor} — {inv.period}</div>
                <div className="text-xs text-muted-foreground font-mono">{inv.id}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Due: {inv.due}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="text-lg font-bold text-amber-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <span className={`badge ${invStatus(inv.status)}`}>{inv.status}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
              Upload Invoice
            </button>
            <button className="px-4 py-2 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
              Export to CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
