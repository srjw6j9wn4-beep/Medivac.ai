import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, ComposedChart,
  LineChart, ReferenceLine,
} from "recharts";
import {
  TrendingUp, DollarSign, Activity, Gauge, PieChart as PieIcon,
  UserX, PlaneTakeoff, Moon, Route, Truck, Hotel, Clock, Milestone,
  Plus, Trash2, CheckCircle2, Circle, Loader2, ChevronRight, Plane,
  Users, Car, Bus, Wallet, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  fmtAUD, getCostSummary, getMonthlyTrend, COST_BREAKDOWN,
  getLeakageItems, type LeakageItem,
  BASE_MATRIX, getStaffingOpportunities, type StaffingOpportunity,
  VEHICLE_ASSETS, AIRCRAFT_ASSETS, cumulativePnlSeries, findBreakEvenMonth,
  npv3yr, ebitdaMargin, approxIRR, monthlyDebtService,
  assignPriority,
  BARIATRIC_VAN, BARIATRIC_PLACEMENT_CANDIDATES, BARIATRIC_PLACEMENT_RECOMMENDATION,
  BARIATRIC_FLEET_PLAN,
} from "@/lib/costOptimizerEngine";
import { Star, Sparkles, MapPin } from "lucide-react";

// ─── Palette ──────────────────────────────────────────────────────────────
const TEAL = "#01696F";
const RED = "#A13544";
const GREEN = "#437A22";
const AMBER = "#964219";

const ICONS: Record<string, React.ComponentType<any>> = {
  UserX, PlaneTakeoff, Moon, Route, Truck, Hotel, Clock, Milestone,
};

type TabKey = "dashboard" | "leakage" | "staffing" | "assets" | "action-plan";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Cost Dashboard" },
  { key: "leakage", label: "Revenue Leakage Scanner" },
  { key: "staffing", label: "Base Staffing Planner" },
  { key: "assets", label: "Asset Acquisition Analyser" },
  { key: "action-plan", label: "Action Plan" },
];

// ─── Types mirroring backend ─────────────────────────────────────────────
interface ActionPlanItemRecord {
  id: number;
  title: string;
  category: string;
  estimatedAnnualValue: number; // cents
  priority: string;
  status: string;
  notes: string | null;
  sourceType: string | null;
  createdAt: string;
  updatedAt: string;
}

function ConfidenceBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const cls = level === "High"
    ? "bg-[#01696F]/15 text-[#01696F] border-[#01696F]/30"
    : level === "Medium"
    ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
    : "bg-gray-500/15 text-gray-400 border-gray-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${cls}`}>
      {level} confidence
    </span>
  );
}

function StatCard({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: valueColor, fontFamily: "'Cabinet Grotesk', sans-serif" }}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 1 — Cost Dashboard
// ══════════════════════════════════════════════════════════════════════════
function CostDashboardTab() {
  const summary = useMemo(() => getCostSummary(), []);
  const trend = useMemo(() => getMonthlyTrend(), []);

  return (
    <div className="space-y-5" data-testid="tab-dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Annual Revenue Potential" value={fmtAUD(summary.totalAnnualRevenuePotential)} valueColor={GREEN} sub="Across NEPT, charter & Dental/RAHS" />
        <StatCard label="Total Fixed Costs" value={fmtAUD(summary.totalFixedCosts)} valueColor={RED} sub="Annualised operating cost base" />
        <StatCard label="Variable Cost / Sector (NEPT)" value={fmtAUD(summary.variableCostsBySector[0].costPerSector)} sub="Per-sector variable cost" />
        <StatCard label="EBITDA Estimate" value={fmtAUD(summary.ebitdaEstimate)} valueColor={summary.ebitdaEstimate >= 0 ? GREEN : RED} sub="Revenue potential less fixed costs" />
        <StatCard label="Cost / Available Seat KM" value={`${(summary.costPerAvailableSeatKm).toFixed(3)}¢`} sub="Network-wide CASK" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut chart */}
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieIcon size={15} style={{ color: TEAL }} />
            <h3 className="text-sm font-bold">Cost Breakdown</h3>
          </div>
          <div className="h-72" data-testid="chart-cost-breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COST_BREAKDOWN}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {COST_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtAUD(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs cost trend */}
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} style={{ color: TEAL }} />
            <h3 className="text-sm font-bold">Revenue vs Cost Trend (12 months)</h3>
          </div>
          <div className="h-72" data-testid="chart-revenue-cost-trend">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${Math.round(v / 100_000)}00k`} />
                <Tooltip formatter={(v: number) => fmtAUD(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Revenue" fill={TEAL} radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="cost" name="Cost" stroke={RED} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4">
        <h3 className="text-sm font-bold mb-3">Variable Cost per Sector, by Sector Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summary.variableCostsBySector.map(v => (
            <div key={v.sector} className="rounded-lg border border-card-border p-3">
              <div className="text-xs text-muted-foreground">{v.sector}</div>
              <div className="text-lg font-bold tabular-nums">{fmtAUD(v.costPerSector)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 2 — Revenue Leakage Scanner
// ══════════════════════════════════════════════════════════════════════════
function LeakageCard({ item, onAdd, added }: { item: LeakageItem; onAdd: (i: LeakageItem) => void; added: boolean }) {
  const Icon = ICONS[item.icon] ?? DollarSign;
  const valueColor = item.isLoss ? RED : GREEN;
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex flex-col" data-testid={`leak-card-${item.id}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${valueColor}1A` }}>
            <Icon size={16} style={{ color: valueColor }} />
          </div>
          <h3 className="text-sm font-bold leading-tight">{item.title}</h3>
        </div>
        <ConfidenceBadge level={item.confidence} />
      </div>

      <div className="text-2xl font-bold tabular-nums mb-2" style={{ color: valueColor, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        {item.isLoss ? "" : "+"}{fmtAUD(item.annualValue)}<span className="text-xs font-normal text-muted-foreground ml-1">/yr</span>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        <span className="font-semibold text-foreground/80">Root cause: </span>{item.rootCause}
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        <span className="font-semibold text-foreground/80">Fix: </span>{item.fixRecommendation}
      </div>

      {item.breakEvenMonths !== undefined && (
        <div className="text-xs mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-card-border">
            <Gauge size={11} style={{ color: TEAL }} /> Break-even: {item.breakEvenMonths.toFixed(1)} months
          </span>
        </div>
      )}

      <button
        onClick={() => onAdd(item)}
        disabled={added}
        data-testid={`btn-add-action-${item.id}`}
        className={`mt-auto text-xs font-semibold rounded-lg px-3 py-2 transition-colors ${
          added
            ? "bg-white/5 text-muted-foreground cursor-default"
            : "text-white hover:opacity-90"
        }`}
        style={!added ? { backgroundColor: TEAL } : undefined}
      >
        {added ? "Added to Action Plan ✓" : "Add to Action Plan"}
      </button>
    </div>
  );
}

function LeakageScannerTab({ onAddAction, addedIds }: { onAddAction: (item: LeakageItem) => void; addedIds: Set<string> }) {
  const items = useMemo(() => getLeakageItems(), []);
  const totalLoss = items.filter(i => i.isLoss).reduce((s, i) => s + i.annualValue, 0);
  const totalOpportunity = items.filter(i => !i.isLoss).reduce((s, i) => s + i.annualValue, 0);

  return (
    <div className="space-y-5" data-testid="tab-leakage">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Identified Leakage" value={fmtAUD(totalLoss)} valueColor={RED} sub={`${items.filter(i => i.isLoss).length} leakage items`} />
        <StatCard label="Total Untapped Opportunity" value={fmtAUD(totalOpportunity)} valueColor={GREEN} sub={`${items.filter(i => !i.isLoss).length} opportunity items`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map(item => (
          <LeakageCard key={item.id} item={item} onAdd={onAddAction} added={addedIds.has(`leakage-${item.id}`)} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 3 — Base Staffing Planner
// ══════════════════════════════════════════════════════════════════════════
function StaffingPlannerTab({ onApprove, approvedIds }: { onApprove: (o: StaffingOpportunity) => void; approvedIds: Set<string> }) {
  const opportunities = useMemo(() => getStaffingOpportunities(), []);

  return (
    <div className="space-y-5" data-testid="tab-staffing">
      <div className="bg-card border border-card-border rounded-2xl p-4 overflow-x-auto">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Users size={15} style={{ color: TEAL }} /> Current Base Matrix</h3>
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="text-left text-muted-foreground uppercase tracking-wider border-b border-card-border">
              <th className="py-2 pr-3">Base</th>
              <th className="py-2 pr-3">Aircraft</th>
              <th className="py-2 pr-3">Captain</th>
              <th className="py-2 pr-3">FO</th>
              <th className="py-2 pr-3">Flight Nurse</th>
              <th className="py-2 pr-3">Paramedic</th>
              <th className="py-2 pr-3">Ground Vehicle</th>
            </tr>
          </thead>
          <tbody>
            {BASE_MATRIX.map(row => (
              <tr key={row.base} className="border-b border-card-border/50">
                <td className="py-2 pr-3 font-semibold">{row.base}</td>
                <td className="py-2 pr-3">{row.aircraft}</td>
                <td className="py-2 pr-3">{row.captain}</td>
                <td className="py-2 pr-3">{row.fo}</td>
                <td className="py-2 pr-3">{row.flightNurse}</td>
                <td className="py-2 pr-3">{row.paramedic}</td>
                <td className="py-2 pr-3">{row.groundVehicle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4 overflow-x-auto">
        <h3 className="text-sm font-bold mb-3">Opportunity Analysis — Proposed Positions</h3>
        <table className="w-full text-xs min-w-[820px]">
          <thead>
            <tr className="text-left text-muted-foreground uppercase tracking-wider border-b border-card-border">
              <th className="py-2 pr-3">Position</th>
              <th className="py-2 pr-3">Base</th>
              <th className="py-2 pr-3">Annual Cost</th>
              <th className="py-2 pr-3">Revenue Impact</th>
              <th className="py-2 pr-3">Net</th>
              <th className="py-2 pr-3">ROI</th>
              <th className="py-2 pr-3">Break-even</th>
              <th className="py-2 pr-3">Approve</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(o => {
              const isApproved = approvedIds.has(`staffing-${o.id}`);
              return (
                <tr key={o.id} className="border-b border-card-border/50" data-testid={`staffing-row-${o.id}`}>
                  <td className="py-2 pr-3 font-semibold">{o.position}</td>
                  <td className="py-2 pr-3">{o.base}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmtAUD(o.annualSalaryCost)}</td>
                  <td className="py-2 pr-3 tabular-nums" style={{ color: GREEN }}>{fmtAUD(o.revenueGenerated)}</td>
                  <td className="py-2 pr-3 tabular-nums font-bold" style={{ color: o.netBenefit >= 0 ? GREEN : RED }}>
                    {o.netBenefit >= 0 ? "+" : ""}{fmtAUD(o.netBenefit)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{o.roiPct.toFixed(0)}%</td>
                  <td className="py-2 pr-3 tabular-nums">{o.breakEvenMonths.toFixed(1)} mo</td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => onApprove(o)}
                      disabled={isApproved}
                      data-testid={`btn-approve-${o.id}`}
                      className={`text-[11px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
                        isApproved ? "bg-white/5 text-muted-foreground cursor-default" : "text-white hover:opacity-90"
                      }`}
                      style={!isApproved ? { backgroundColor: TEAL } : undefined}
                    >
                      {isApproved ? "Approved ✓" : "Approve"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 4 — Asset Acquisition Analyser
// ══════════════════════════════════════════════════════════════════════════
function BreakEvenChart({ purchasePrice, annualRunning, annualRevenue, months }: { purchasePrice: number; annualRunning: number; annualRevenue: number; months: number }) {
  const series = useMemo(() => cumulativePnlSeries(purchasePrice, annualRunning, annualRevenue, months), [purchasePrice, annualRunning, annualRevenue, months]);
  const breakEvenMonth = useMemo(() => findBreakEvenMonth(series), [series]);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="month" fontSize={10} label={{ value: "Month", position: "insideBottom", offset: -3, fontSize: 10 }} />
          <YAxis fontSize={10} tickFormatter={(v) => fmtAUD(v)} width={70} />
          <Tooltip formatter={(v: number) => fmtAUD(v)} labelFormatter={(l) => `Month ${l}`} />
          <ReferenceLine y={0} stroke="#888" strokeDasharray="2 2" />
          {breakEvenMonth !== null && (
            <ReferenceLine x={breakEvenMonth} stroke={TEAL} strokeDasharray="4 4" label={{ value: `Break-even: mo ${breakEvenMonth}`, fontSize: 10, fill: TEAL, position: "top" }} />
          )}
          <Line type="monotone" dataKey="cumulative" stroke={GREEN} strokeWidth={2} dot={false} name="Cumulative P&L" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VehicleCard({ v }: { v: typeof VEHICLE_ASSETS[number] }) {
  const npv = useMemo(() => npv3yr(v.purchasePrice, v.annualRunning, v.annualRevenue), [v]);
  const margin = useMemo(() => ebitdaMargin(v.annualRunning, v.annualRevenue), [v]);
  const weekly = v.annualRevenue / 52;
  const monthly = v.annualRevenue / 12;

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4" data-testid={`vehicle-card-${v.id}`}>
      <div className="flex items-center gap-2 mb-2">
        <Car size={16} style={{ color: TEAL }} />
        <h3 className="text-sm font-bold">{v.name}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div><span className="text-muted-foreground">Purchase: </span><span className="font-semibold tabular-nums">{fmtAUD(v.purchasePrice)}</span></div>
        <div><span className="text-muted-foreground">Running/yr: </span><span className="font-semibold tabular-nums">{fmtAUD(v.annualRunning)}</span></div>
        <div><span className="text-muted-foreground">Weekly rev: </span><span className="font-semibold tabular-nums">{fmtAUD(weekly)}</span></div>
        <div><span className="text-muted-foreground">Monthly rev: </span><span className="font-semibold tabular-nums">{fmtAUD(monthly)}</span></div>
        <div><span className="text-muted-foreground">Annual rev: </span><span className="font-semibold tabular-nums" style={{ color: GREEN }}>{fmtAUD(v.annualRevenue)}</span></div>
        <div><span className="text-muted-foreground">Break-even: </span><span className="font-semibold">{v.breakEvenMonths.toFixed(1)} mo</span></div>
      </div>
      <BreakEvenChart purchasePrice={v.purchasePrice} annualRunning={v.annualRunning} annualRevenue={v.annualRevenue} months={36} />
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">NPV @ 3yr (7%)</div>
          <div className="font-bold tabular-nums" style={{ color: npv >= 0 ? GREEN : RED }}>{fmtAUD(npv)}</div>
        </div>
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">EBITDA margin</div>
          <div className="font-bold tabular-nums">{margin.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}

function AircraftCard({ a }: { a: typeof AIRCRAFT_ASSETS[number] }) {
  const annualNet = a.annualRevenue - a.annualOps;
  const irr = useMemo(() => approxIRR(a.purchasePrice, annualNet, 10), [a, annualNet]);
  const debtService = useMemo(() => monthlyDebtService(a.purchasePrice, 6.5, 10), [a]);
  const monthlyOps = a.annualOps / 12;
  const monthlyRevenue = a.annualRevenue / 12;

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4" data-testid={`aircraft-card-${a.id}`}>
      <div className="flex items-center gap-2 mb-2">
        <Plane size={16} style={{ color: TEAL }} />
        <h3 className="text-sm font-bold">{a.name}</h3>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">{a.notes}</div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div><span className="text-muted-foreground">Acquisition: </span><span className="font-semibold tabular-nums">{fmtAUD(a.purchasePrice)}</span></div>
        <div><span className="text-muted-foreground">Monthly ops: </span><span className="font-semibold tabular-nums">{fmtAUD(monthlyOps)}</span></div>
        <div><span className="text-muted-foreground">Monthly rev: </span><span className="font-semibold tabular-nums" style={{ color: GREEN }}>{fmtAUD(monthlyRevenue)}</span></div>
        <div><span className="text-muted-foreground">Break-even: </span><span className="font-semibold">{a.breakEvenMonths} mo</span></div>
      </div>
      <BreakEvenChart purchasePrice={a.purchasePrice} annualRunning={a.annualOps} annualRevenue={a.annualRevenue} months={36} />
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">IRR (10yr)</div>
          <div className="font-bold tabular-nums">{irr.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">Payback</div>
          <div className="font-bold tabular-nums">{a.breakEvenMonths} mo</div>
        </div>
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">Debt svc/mo (6.5%, 10yr)</div>
          <div className="font-bold tabular-nums">{fmtAUD(debtService)}</div>
        </div>
      </div>
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < score ? TEAL : "none"}
          stroke={TEAL}
        />
      ))}
    </span>
  );
}

function BariatricVanCard() {
  const npv = BARIATRIC_VAN.npv3yrPerUnit;
  const series = useMemo(
    () => cumulativePnlSeries(BARIATRIC_VAN.purchasePrice, BARIATRIC_VAN.annualRunning + BARIATRIC_VAN.annualCrewCost, BARIATRIC_VAN.annualRevenueYear1Conservative, 36),
    []
  );
  const breakEvenMonth = useMemo(() => findBreakEvenMonth(series), [series]);
  const weekly = BARIATRIC_VAN.annualRevenueFullUtil / 52;
  const monthly = BARIATRIC_VAN.annualRevenueFullUtil / 12;

  return (
    <div
      className="bg-card border-2 rounded-2xl p-4 relative overflow-hidden xl:col-span-2"
      style={{ borderColor: TEAL }}
      data-testid="vehicle-card-bariatric-van"
    >
      <div
        className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white flex items-center gap-1"
        style={{ backgroundColor: TEAL }}
      >
        <Sparkles size={11} /> Highest ROI
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Car size={16} style={{ color: TEAL }} />
        <h3 className="text-sm font-bold">Bariatric Van — Purpose-Built Bariatric Patient Transport</h3>
      </div>
      <div className="text-[11px] text-muted-foreground mb-3">
        Toyota HiAce LWB (or Mercedes Sprinter) with bariatric fit-out — hydraulic stretcher, 500kg capacity, wide-access ramp.
        A standalone revenue stream that standard ambulances cannot service.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
        <div><span className="text-muted-foreground">Vehicle cost: </span><span className="font-semibold tabular-nums">{fmtAUD(BARIATRIC_VAN.vehicleCost)}</span></div>
        <div><span className="text-muted-foreground">Fit-out cost: </span><span className="font-semibold tabular-nums">{fmtAUD(BARIATRIC_VAN.fitoutCost)}</span></div>
        <div><span className="text-muted-foreground">Total purchase: </span><span className="font-semibold tabular-nums">{fmtAUD(BARIATRIC_VAN.purchasePrice)}</span></div>
        <div><span className="text-muted-foreground">Annual running: </span><span className="font-semibold tabular-nums">{fmtAUD(BARIATRIC_VAN.annualRunning)}</span></div>
        <div><span className="text-muted-foreground">Annual crew cost: </span><span className="font-semibold tabular-nums">{fmtAUD(BARIATRIC_VAN.annualCrewCost)}</span></div>
        <div><span className="text-muted-foreground">Sector rate (avg): </span><span className="font-semibold tabular-nums">{fmtAUD(BARIATRIC_VAN.sectorRate)}</span></div>
        <div><span className="text-muted-foreground">Weekly rev (full util): </span><span className="font-semibold tabular-nums">{fmtAUD(weekly)}</span></div>
        <div><span className="text-muted-foreground">Monthly rev (full util): </span><span className="font-semibold tabular-nums">{fmtAUD(monthly)}</span></div>
        <div><span className="text-muted-foreground">Annual rev (full util): </span><span className="font-semibold tabular-nums" style={{ color: GREEN }}>{fmtAUD(BARIATRIC_VAN.annualRevenueFullUtil)}</span></div>
      </div>

      <div className="rounded-lg bg-white/5 border border-card-border p-2 mb-3 text-xs">
        <span className="text-muted-foreground">Year 1 conservative (50% ramp-up): </span>
        <span className="font-semibold tabular-nums" style={{ color: GREEN }}>{fmtAUD(BARIATRIC_VAN.annualRevenueYear1Conservative)}</span>
      </div>

      <BreakEvenChart
        purchasePrice={BARIATRIC_VAN.purchasePrice}
        annualRunning={BARIATRIC_VAN.annualRunning + BARIATRIC_VAN.annualCrewCost}
        annualRevenue={BARIATRIC_VAN.annualRevenueYear1Conservative}
        months={36}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">Break-even (conservative)</div>
          <div className="font-bold tabular-nums">{BARIATRIC_VAN.breakEvenMonthsConservative.toFixed(1)} mo</div>
        </div>
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">Break-even (optimistic)</div>
          <div className="font-bold tabular-nums">{BARIATRIC_VAN.breakEvenMonthsOptimistic.toFixed(1)} mo</div>
        </div>
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">NPV @ 3yr (7%) / unit</div>
          <div className="font-bold tabular-nums" style={{ color: GREEN }}>{fmtAUD(npv)}</div>
        </div>
        <div className="rounded-lg border border-card-border p-2">
          <div className="text-muted-foreground">EBITDA margin</div>
          <div className="font-bold tabular-nums">{BARIATRIC_VAN.ebitdaMarginPct}%</div>
        </div>
      </div>

      <div className="mt-2 rounded-lg p-2 text-xs" style={{ backgroundColor: `${TEAL}1A` }}>
        <span className="font-semibold" style={{ color: TEAL }}>ROI Year 1 (post ramp-up): </span>
        <span className="font-bold tabular-nums" style={{ color: TEAL }}>{BARIATRIC_VAN.roiYear1Pct}%</span>
      </div>

      {/* Placement analysis */}
      <div className="mt-4">
        <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5"><MapPin size={12} style={{ color: TEAL }} /> Where to Place Them</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[520px]">
            <thead>
              <tr className="text-left text-muted-foreground uppercase tracking-wider border-b border-card-border">
                <th className="py-1.5 pr-3">Location</th>
                <th className="py-1.5 pr-3">Catchment Pop</th>
                <th className="py-1.5 pr-3">Est. Demand/wk</th>
                <th className="py-1.5 pr-3">Nearest Hospital</th>
                <th className="py-1.5 pr-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {BARIATRIC_PLACEMENT_CANDIDATES.map(c => (
                <tr key={c.location} className="border-b border-card-border/50">
                  <td className="py-1.5 pr-3 font-semibold">{c.location}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.catchmentPop.toLocaleString("en-AU")}</td>
                  <td className="py-1.5 pr-3">{c.estDemandPerWeek}</td>
                  <td className="py-1.5 pr-3">{c.nearestHospital}</td>
                  <td className="py-1.5 pr-3"><StarRating score={c.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{BARIATRIC_PLACEMENT_RECOMMENDATION}</p>
      </div>

      {/* Fleet sizing */}
      <div className="mt-4">
        <h4 className="text-xs font-bold mb-2">How Many to Acquire — Fleet Sizing Plan</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[480px]">
            <thead>
              <tr className="text-left text-muted-foreground uppercase tracking-wider border-b border-card-border">
                <th className="py-1.5 pr-3">Year</th>
                <th className="py-1.5 pr-3">Units</th>
                <th className="py-1.5 pr-3">Locations</th>
                <th className="py-1.5 pr-3">Revenue</th>
                <th className="py-1.5 pr-3">Net</th>
              </tr>
            </thead>
            <tbody>
              {BARIATRIC_FLEET_PLAN.map(f => (
                <tr key={f.year} className="border-b border-card-border/50">
                  <td className="py-1.5 pr-3 font-semibold">Year {f.year}</td>
                  <td className="py-1.5 pr-3">{f.units}</td>
                  <td className="py-1.5 pr-3">{f.unitLocations}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{fmtAUD(f.revenue)}</td>
                  <td className="py-1.5 pr-3 tabular-nums font-bold" style={{ color: GREEN }}>+{fmtAUD(f.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssetAcquisitionTab() {
  return (
    <div className="space-y-6" data-testid="tab-assets">
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Car size={15} style={{ color: TEAL }} /> Vehicle Acquisitions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {VEHICLE_ASSETS.map(v => <VehicleCard key={v.id} v={v} />)}
          <BariatricVanCard />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Plane size={15} style={{ color: TEAL }} /> Aircraft Acquisitions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {AIRCRAFT_ASSETS.map(a => <AircraftCard key={a.id} a={a} />)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 5 — Action Plan
// ══════════════════════════════════════════════════════════════════════════
function priorityColor(p: string) {
  switch (p) {
    case "high": return "bg-[#A13544]/15 text-[#A13544] border-[#A13544]/30";
    case "medium": return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    default: return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  }
}

function statusLabel(s: string) {
  switch (s) {
    case "proposed": return "Proposed";
    case "in_progress": return "In Progress";
    case "complete": return "Complete";
    default: return s;
  }
}

function ActionPlanTab() {
  const qc = useQueryClient();
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("ops");
  const [customValue, setCustomValue] = useState("");

  const { data: items = [], isLoading } = useQuery<ActionPlanItemRecord[]>({
    queryKey: ["/api/action-plan"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ActionPlanItemRecord> }) =>
      apiRequest("PUT", `/api/action-plan/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/action-plan"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/action-plan/${id}`, undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/action-plan"] }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; category: string; estimatedAnnualValue: number; priority: string; sourceType: string }) =>
      apiRequest("POST", "/api/action-plan", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/action-plan"] });
      setCustomTitle("");
      setCustomValue("");
    },
  });

  const totalApprovedValue = items
    .filter(i => i.status !== "complete" || true) // total tally across all items regardless of status per spec ("all approved actions")
    .reduce((s, i) => s + i.estimatedAnnualValue, 0);

  function addCustom() {
    const cents = Math.round(parseFloat(customValue || "0") * 100);
    if (!customTitle.trim() || !cents) return;
    createMutation.mutate({
      title: customTitle.trim(),
      category: customCategory,
      estimatedAnnualValue: cents,
      priority: assignPriority(cents),
      sourceType: "manual",
    });
  }

  return (
    <div className="space-y-5" data-testid="tab-action-plan">
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Annual Value — All Action Plan Items</div>
        <div className="text-3xl font-bold tabular-nums" style={{ color: GREEN, fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="action-plan-total">
          {fmtAUD(totalApprovedValue)}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4">
        <h3 className="text-sm font-bold mb-3">Add Custom Action</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            placeholder="Action title"
            className="flex-1 text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none"
            data-testid="input-custom-action-title"
          />
          <select
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            className="text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none"
            data-testid="select-custom-action-category"
          >
            <option value="staffing">Staffing</option>
            <option value="asset">Asset</option>
            <option value="ops">Ops</option>
          </select>
          <input
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            placeholder="Annual value ($)"
            type="number"
            className="w-40 text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none"
            data-testid="input-custom-action-value"
          />
          <button
            onClick={addCustom}
            disabled={createMutation.isPending}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 text-white hover:opacity-90"
            style={{ backgroundColor: TEAL }}
            data-testid="btn-add-custom-action"
          >
            {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Add
          </button>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading action plan…
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No action plan items yet. Add opportunities from the Leakage Scanner or Staffing Planner.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground uppercase tracking-wider border-b border-card-border">
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Annual Value</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Notes</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-card-border/50" data-testid={`action-row-${item.id}`}>
                  <td className="py-2 px-3 font-semibold max-w-[220px]">{item.title}</td>
                  <td className="py-2 px-3 capitalize">{item.category}</td>
                  <td className="py-2 px-3 tabular-nums font-bold" style={{ color: item.estimatedAnnualValue >= 0 ? GREEN : RED }}>
                    {fmtAUD(item.estimatedAnnualValue)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${priorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.status}
                      onChange={e => updateMutation.mutate({ id: item.id, updates: { status: e.target.value } })}
                      className="text-[11px] bg-background border border-card-border rounded-md px-2 py-1 focus:outline-none"
                      data-testid={`select-status-${item.id}`}
                    >
                      <option value="proposed">Proposed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="complete">Complete</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 min-w-[160px]">
                    <input
                      defaultValue={item.notes ?? ""}
                      placeholder="Add note…"
                      onBlur={e => {
                        if (e.target.value !== (item.notes ?? "")) {
                          updateMutation.mutate({ id: item.id, updates: { notes: e.target.value } });
                        }
                      }}
                      className="w-full text-[11px] bg-background border border-card-border rounded-md px-2 py-1 focus:outline-none"
                      data-testid={`input-notes-${item.id}`}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                      data-testid={`btn-delete-action-${item.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function CostOptimizer() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: existingActions = [] } = useQuery<ActionPlanItemRecord[]>({
    queryKey: ["/api/action-plan"],
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; category: string; estimatedAnnualValue: number; priority: string; sourceType: string }) =>
      apiRequest("POST", "/api/action-plan", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/action-plan"] }),
  });

  function markAdded(key: string) {
    setAddedIds(prev => new Set(prev).add(key));
  }

  function handleAddLeakageAction(item: LeakageItem) {
    const key = `leakage-${item.id}`;
    if (addedIds.has(key)) return;
    markAdded(key);
    createMutation.mutate({
      title: item.title,
      category: item.category,
      estimatedAnnualValue: item.isLoss ? item.annualValue : item.annualValue,
      priority: assignPriority(item.annualValue),
      sourceType: "leakage",
    });
  }

  function handleApproveStaffing(o: StaffingOpportunity) {
    const key = `staffing-${o.id}`;
    if (addedIds.has(key)) return;
    markAdded(key);
    createMutation.mutate({
      title: `${o.position} — ${o.base}`,
      category: "staffing",
      estimatedAnnualValue: o.netBenefit,
      priority: assignPriority(o.netBenefit),
      sourceType: "staffing",
    });
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      {/* Header — dark teal band matching CharterQuote style */}
      <div
        className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, #0C4E54 0%, #01696F 100%)` }}
        data-testid="cost-optimizer-header"
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Operations Cost Optimizer
          </h1>
          <p className="text-xs text-white/70 mt-0.5">
            Deep financial intelligence — cost, revenue leakage & growth opportunity engine
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-card-border mb-5 overflow-x-auto" data-testid="cost-optimizer-tabs">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-trigger-${tab.key}`}
              className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {active && (
                <span
                  className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full"
                  style={{ backgroundColor: TEAL }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && <CostDashboardTab />}
      {activeTab === "leakage" && (
        <LeakageScannerTab onAddAction={handleAddLeakageAction} addedIds={addedIds} />
      )}
      {activeTab === "staffing" && (
        <StaffingPlannerTab onApprove={handleApproveStaffing} approvedIds={addedIds} />
      )}
      {activeTab === "assets" && <AssetAcquisitionTab />}
      {activeTab === "action-plan" && <ActionPlanTab />}
    </div>
  );
}
