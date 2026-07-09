import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  DollarSign, Plus, Pencil, Trash2, Save, X, Building2,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClientRate {
  id: number;
  orgName: string;
  orgCode: string;
  missionType: string;
  rateType: string;
  rateAmountCents: number;
  afterHoursSurchargeCents: number;
  gstApplicable: number;
  notes: string | null;
  effectiveFrom: string | null;
  active: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MISSION_TYPES = ["NEPT", "Dental", "ACC", "Charter", "Special", "NETS"];
const RATE_TYPES = ["per_flight", "per_hour", "per_leg"];
const RATE_TYPE_LABELS: Record<string, string> = {
  per_flight: "Per Flight",
  per_hour: "Per Hour",
  per_leg: "Per Leg",
};

// Default organisations based on RFDS SE operations
const DEFAULT_ORGS = [
  { name: "NSW Health", code: "nsw_health" },
  { name: "RAHS Dental", code: "rahs_dental" },
  { name: "Affiliated Health Services", code: "acc_ahs" },
  { name: "icare NSW", code: "acc_icare" },
  { name: "Private Charter", code: "charter_private" },
  { name: "NETS NSW", code: "nets_nsw" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function parseDollar(str: string): number {
  return Math.round(parseFloat(str.replace(/[^0-9.]/g, "")) * 100) || 0;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

const EMPTY_FORM = {
  orgName: "",
  orgCode: "",
  missionType: "NEPT",
  rateType: "per_flight",
  rateAmountDollar: "",
  afterHoursDollar: "",
  gstApplicable: 0,
  notes: "",
  effectiveFrom: todayISO(),
  active: 1,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientRateSheet() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [filterMission, setFilterMission] = useState("All");

  const { data: rates = [], isLoading } = useQuery<ClientRate[]>({
    queryKey: ["/api/client-rates"],
    queryFn: () => apiRequest("GET", "/api/client-rates").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/client-rates", body).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/client-rates"] }); resetForm(); toast({ title: "Rate saved" }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => apiRequest("PATCH", `/api/client-rates/${id}`, body).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/client-rates"] }); resetForm(); toast({ title: "Rate updated" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/client-rates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/client-rates"] }); toast({ title: "Rate removed" }); },
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function startEdit(r: ClientRate) {
    setForm({
      orgName: r.orgName,
      orgCode: r.orgCode,
      missionType: r.missionType,
      rateType: r.rateType,
      rateAmountDollar: (r.rateAmountCents / 100).toFixed(2),
      afterHoursDollar: (r.afterHoursSurchargeCents / 100).toFixed(2),
      gstApplicable: r.gstApplicable,
      notes: r.notes ?? "",
      effectiveFrom: r.effectiveFrom ?? todayISO(),
      active: r.active,
    });
    setEditingId(r.id);
    setShowForm(true);
  }

  function handleSubmit() {
    const body = {
      orgName: form.orgName,
      orgCode: form.orgCode || form.orgName.toLowerCase().replace(/\s+/g, "_"),
      missionType: form.missionType,
      rateType: form.rateType,
      rateAmountCents: parseDollar(form.rateAmountDollar),
      afterHoursSurchargeCents: parseDollar(form.afterHoursDollar),
      gstApplicable: form.gstApplicable,
      notes: form.notes || null,
      effectiveFrom: form.effectiveFrom,
      active: form.active,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, body });
    } else {
      createMutation.mutate(body);
    }
  }

  function selectOrg(name: string, code: string) {
    setForm(f => ({ ...f, orgName: name, orgCode: code }));
  }

  function toggleOrg(orgCode: string) {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgCode)) next.delete(orgCode);
      else next.add(orgCode);
      return next;
    });
  }

  // Group by org
  const filtered = filterMission === "All" ? rates : rates.filter(r => r.missionType === filterMission);
  const grouped = filtered.reduce<Record<string, ClientRate[]>>((acc, r) => {
    if (!acc[r.orgCode]) acc[r.orgCode] = [];
    acc[r.orgCode].push(r);
    return acc;
  }, {});

  const totalOrgs = Object.keys(grouped).length;
  const totalActive = rates.filter(r => r.active).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Client Rate Sheet
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Per-organisation billing rates by mission type — used to auto-populate invoices
          </p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
          className="gap-2 bg-cyan-700 hover:bg-cyan-600 text-white"
          data-testid="button-add-rate"
        >
          <Plus className="h-4 w-4" /> Add Rate
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Organisations", value: totalOrgs, icon: Building2 },
          { label: "Active Rates", value: totalActive, icon: DollarSign },
          { label: "Mission Types", value: [...new Set(rates.map(r => r.missionType))].length, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-cyan-900/30">
              <Icon className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...MISSION_TYPES].map(m => (
          <button
            key={m}
            onClick={() => setFilterMission(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterMission === m ? "bg-cyan-700 text-white border-cyan-700" : "border-border text-muted-foreground hover:text-foreground"}`}
            data-testid={`filter-${m.toLowerCase()}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Rate form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {editingId !== null ? "Edit Rate" : "Add New Rate"}
            </h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          {/* Quick-select org */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quick-select organisation</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_ORGS.map(o => (
                <button
                  key={o.code}
                  onClick={() => selectOrg(o.name, o.code)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${form.orgCode === o.code ? "bg-cyan-700 text-white border-cyan-700" : "border-border hover:border-cyan-600"}`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Organisation Name</label>
              <Input value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} placeholder="e.g. NSW Health" data-testid="input-org-name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Org Code (system key)</label>
              <Input value={form.orgCode} onChange={e => setForm(f => ({ ...f, orgCode: e.target.value }))} placeholder="e.g. nsw_health" data-testid="input-org-code" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mission Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.missionType}
                onChange={e => setForm(f => ({ ...f, missionType: e.target.value }))}
                data-testid="select-mission-type"
              >
                {MISSION_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rate Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.rateType}
                onChange={e => setForm(f => ({ ...f, rateType: e.target.value }))}
                data-testid="select-rate-type"
              >
                {RATE_TYPES.map(t => <option key={t} value={t}>{RATE_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rate Amount ($)</label>
              <Input
                value={form.rateAmountDollar}
                onChange={e => setForm(f => ({ ...f, rateAmountDollar: e.target.value }))}
                placeholder="e.g. 2850.00"
                data-testid="input-rate-amount"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">After-Hours Surcharge ($)</label>
              <Input
                value={form.afterHoursDollar}
                onChange={e => setForm(f => ({ ...f, afterHoursDollar: e.target.value }))}
                placeholder="e.g. 450.00"
                data-testid="input-after-hours"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Effective From</label>
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                data-testid="input-effective-from"
              />
            </div>
            <div className="flex flex-col gap-3 justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.gstApplicable}
                  onChange={e => setForm(f => ({ ...f, gstApplicable: e.target.checked ? 1 : 0 }))}
                  data-testid="checkbox-gst"
                />
                <span className="text-sm">GST Applicable (10%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))}
                  data-testid="checkbox-active"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Rate per NSW Health Schedule 5 contract" data-testid="input-notes" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !form.orgName || !form.rateAmountDollar}
              className="gap-2 bg-cyan-700 hover:bg-cyan-600 text-white"
              data-testid="button-save-rate"
            >
              <Save className="h-4 w-4" /> {editingId !== null ? "Update Rate" : "Save Rate"}
            </Button>
            <Button variant="outline" onClick={resetForm} data-testid="button-cancel-rate">Cancel</Button>
          </div>
        </div>
      )}

      {/* Rate table grouped by org */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading rates…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm">No rates configured yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Add a rate to start auto-populating invoices from dispatch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([orgCode, orgRates]) => {
            const isExpanded = expandedOrgs.has(orgCode);
            const orgName = orgRates[0].orgName;
            const activeCount = orgRates.filter(r => r.active).length;
            return (
              <div key={orgCode} className="rounded-lg border bg-card overflow-hidden">
                {/* Org header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  onClick={() => toggleOrg(orgCode)}
                  data-testid={`toggle-org-${orgCode}`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <span className="font-semibold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{orgName}</span>
                    <Badge variant="secondary" className="text-xs">{orgCode}</Badge>
                    <span className="text-xs text-muted-foreground">{activeCount} active rate{activeCount !== 1 ? "s" : ""}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Mission Type</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Rate Type</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Base Rate</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">After Hours</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">GST</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Effective</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgRates.map(r => (
                          <tr key={r.id} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="px-4 py-2.5">
                              <span className="font-medium">{r.missionType}</span>
                              {r.notes && <div className="text-xs text-muted-foreground mt-0.5">{r.notes}</div>}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">{RATE_TYPE_LABELS[r.rateType] ?? r.rateType}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-cyan-400">{fmtCents(r.rateAmountCents)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                              {r.afterHoursSurchargeCents > 0 ? `+${fmtCents(r.afterHoursSurchargeCents)}` : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {r.gstApplicable ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline" /> : <span className="text-muted-foreground text-xs">No</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {r.active ? (
                                <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-800 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs text-muted-foreground">Inactive</Badge>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                              {r.effectiveFrom ?? "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-muted" data-testid={`edit-rate-${r.id}`}>
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => { if (confirm("Remove this rate?")) deleteMutation.mutate(r.id); }}
                                  className="p-1.5 rounded hover:bg-red-900/20"
                                  data-testid={`delete-rate-${r.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-4 text-sm text-cyan-300">
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Auto-population:</span> When a mission is dispatched, Medivac.ai looks up the matching org + mission type rate and creates a pending invoice line automatically. If no rate is found, the line is flagged for manual review.
          </div>
        </div>
      </div>
    </div>
  );
}
