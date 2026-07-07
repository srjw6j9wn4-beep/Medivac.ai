import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";
import { type UserRole } from "@/lib/data";
import {
  Plus, Search, FileText, Download, Trash2, Send, CheckCircle2,
  Save, X, DollarSign, Clock, AlertTriangle, Receipt, Plane,
  MapPin, ArrowRight, Building2, ShieldCheck, FileSpreadsheet,
} from "lucide-react";

interface Props { role: UserRole; }

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus = "Draft" | "Submitted" | "Paid" | "Overdue";
type PayerType = "nsw_health" | "private";
type MissionType = "Standard NEPT" | "Complex/Long-haul NEPT" | "NETS Neonatal" | "ECMO";

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  serviceDate: string;
  status: InvoiceStatus;
  payerType: PayerType;
  payerName: string;
  taskRef: string | null;
  patientId: string | null;
  pickupLocation: string | null;
  destination: string | null;
  aircraftReg: string | null;
  missionType: MissionType;
  baseAmount: number;
  afterHoursSurcharge: number;
  additionalCharges: number;
  gstAmount: number;
  totalAmount: number;
  notes: string | null;
  submittedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MISSION_BASE_AMOUNTS: Record<MissionType, number> = {
  "Standard NEPT": 285000,
  "Complex/Long-haul NEPT": 420000,
  "NETS Neonatal": 550000,
  "ECMO": 780000,
};
const AFTER_HOURS_SURCHARGE_CENTS = 45000; // $450
const MISSION_TYPES: MissionType[] = ["Standard NEPT", "Complex/Long-haul NEPT", "NETS Neonatal", "ECMO"];
const FILTERS: (InvoiceStatus | "All")[] = ["All", "Draft", "Submitted", "Paid", "Overdue"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO || todayISO());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDateShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(inv: Invoice): boolean {
  if (inv.status === "Paid") return false;
  if (!inv.dueDate) return false;
  const due = new Date(inv.dueDate);
  const now = new Date();
  return due.getTime() < now.getTime() - 0 && (inv.status === "Draft" || inv.status === "Submitted") &&
    (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24) > 30;
}

function effectiveStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === "Paid" || inv.status === "Draft") return inv.status;
  return isOverdue(inv) ? "Overdue" : inv.status;
}

function getStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case "Draft":     return "bg-gray-500/15 text-gray-300 border-gray-500/30";
    case "Submitted": return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "Paid":      return "bg-green-500/15 text-green-300 border-green-500/30";
    case "Overdue":   return "bg-red-500/15 text-red-300 border-red-500/30";
    default:          return "bg-gray-500/15 text-gray-300 border-gray-500/30";
  }
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}

function parseQueryParams(): Record<string, string> {
  const hash = window.location.hash || "";
  const qIdx = hash.indexOf("?");
  if (qIdx === -1) return {};
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  const result: Record<string, string> = {};
  params.forEach((v, k) => { result[k] = v; });
  return result;
}

function buildXeroCSV(invoices: Invoice[]): string {
  const headers = [
    "ContactName", "EmailAddress", "POAddressLine1", "POCity", "POPostalCode", "POCountry",
    "InvoiceNumber", "Reference", "InvoiceDate", "DueDate", "Total", "TaxTotal",
    "InvoiceAmountPaid", "InvoiceAmountDue", "InventoryItemCode", "Description",
    "Quantity", "UnitAmount", "AccountCode", "TaxType", "TaxAmount",
    "TrackingName1", "TrackingOption1",
  ];

  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = invoices.map(inv => {
    const total = inv.totalAmount / 100;
    const tax = inv.gstAmount / 100;
    const paid = inv.status === "Paid" ? total : 0;
    const due = inv.status === "Paid" ? 0 : total;
    return [
      inv.payerName,
      "",
      "",
      "",
      "",
      "AU",
      inv.invoiceNumber,
      inv.taskRef ?? "",
      inv.invoiceDate,
      inv.dueDate,
      total.toFixed(2),
      tax.toFixed(2),
      paid.toFixed(2),
      due.toFixed(2),
      "NEPT-MISSION",
      `${inv.missionType} — ${inv.pickupLocation ?? ""} to ${inv.destination ?? ""}`,
      "1",
      total.toFixed(2),
      "200",
      "GST Free Income",
      "0.00",
      "Payer Type",
      inv.payerType === "nsw_health" ? "NSW Health" : "Private / Insurance",
    ].map(esc).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

// ─── Empty draft builder ────────────────────────────────────────────────────
function emptyDraft(nextInvoiceNumber: string, prefill?: Record<string, string>): Partial<Invoice> {
  const invoiceDate = prefill?.date || todayISO();
  return {
    invoiceNumber: nextInvoiceNumber,
    invoiceDate,
    dueDate: addDaysISO(invoiceDate, 30),
    serviceDate: prefill?.date || todayISO(),
    status: "Draft",
    payerType: "nsw_health",
    payerName: "NSW Health",
    taskRef: prefill?.taskRef || "",
    patientId: "",
    pickupLocation: prefill?.from || "",
    destination: prefill?.to || "",
    aircraftReg: prefill?.aircraft || "",
    missionType: "Standard NEPT",
    baseAmount: MISSION_BASE_AMOUNTS["Standard NEPT"],
    afterHoursSurcharge: 0,
    additionalCharges: 0,
    gstAmount: 0,
    totalAmount: MISSION_BASE_AMOUNTS["Standard NEPT"],
    notes: "",
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Invoicing({ role }: Props) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<InvoiceStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Partial<Invoice> | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    refetchInterval: 30_000,
  });

  const { data: nextNumberData } = useQuery<{ invoiceNumber: string }>({
    queryKey: ["/api/invoices/next-number"],
  });

  // ── Handle deep-link query params from NEPTTasking "Generate Invoice" ──────
  useEffect(() => {
    const params = parseQueryParams();
    if (params.taskRef && nextNumberData?.invoiceNumber) {
      setSelectedId("new");
      setDraft(emptyDraft(nextNumberData.invoiceNumber, params));
      setMobileDetailOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextNumberData?.invoiceNumber]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Invoice>) => apiRequest("POST", "/api/invoices", data).then(r => r.json()),
    onSuccess: (created: Invoice) => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/invoices/next-number"] });
      setSelectedId(created.id);
      setDraft(created);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Invoice> }) =>
      apiRequest("PATCH", `/api/invoices/${id}`, updates).then(r => r.json()),
    onSuccess: (updated: Invoice) => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      setDraft(updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/invoices/${id}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      setSelectedId(null);
      setDraft(null);
      setMobileDetailOpen(false);
    },
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const withStatus = invoices.map(inv => ({ ...inv, status: effectiveStatus(inv) }));
    const total = withStatus.length;
    const draftCount = withStatus.filter(i => i.status === "Draft").length;
    const submittedCount = withStatus.filter(i => i.status === "Submitted").length;
    const paidCount = withStatus.filter(i => i.status === "Paid").length;
    const overdueCount = withStatus.filter(i => i.status === "Overdue").length;
    const revenue = withStatus.filter(i => i.status === "Paid").reduce((s, i) => s + i.totalAmount, 0);
    const outstanding = withStatus.filter(i => i.status === "Draft" || i.status === "Submitted" || i.status === "Overdue")
      .reduce((s, i) => s + i.totalAmount, 0);
    return { total, draftCount, submittedCount, paidCount, overdueCount, revenue, outstanding };
  }, [invoices]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = invoices.map(inv => ({ ...inv, status: effectiveStatus(inv) }));
    if (filter !== "All") list = list.filter(i => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        (i.taskRef ?? "").toLowerCase().includes(q) ||
        i.payerName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [invoices, filter, search]);

  // ── Selection handlers ───────────────────────────────────────────────────
  function openInvoice(inv: Invoice) {
    setSelectedId(inv.id);
    setDraft(inv);
    setMobileDetailOpen(true);
  }

  function startNew() {
    setSelectedId("new");
    setDraft(emptyDraft(nextNumberData?.invoiceNumber || "INV-NEPT-2026-0001"));
    setMobileDetailOpen(true);
  }

  function closeDetail() {
    setMobileDetailOpen(false);
    setSelectedId(null);
    setDraft(null);
  }

  // ── Draft field updater with auto-calculation ────────────────────────────
  function setField<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setDraft(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };

      // Mission type drives base amount default (only if user hasn't customized away from a known default)
      if (key === "missionType") {
        const mt = value as MissionType;
        next.baseAmount = MISSION_BASE_AMOUNTS[mt] ?? prev.baseAmount;
      }

      // Invoice date drives due date (+30 days)
      if (key === "invoiceDate") {
        next.dueDate = addDaysISO(value as string, 30);
      }

      // Recalculate total whenever charge-related fields change
      const base = key === "baseAmount" ? (value as number) : (next.baseAmount ?? 0);
      const surcharge = key === "afterHoursSurcharge" ? (value as number) : (next.afterHoursSurcharge ?? 0);
      const additional = key === "additionalCharges" ? (value as number) : (next.additionalCharges ?? 0);
      const gst = next.gstAmount ?? 0;
      next.baseAmount = base;
      next.afterHoursSurcharge = surcharge;
      next.additionalCharges = additional;
      next.totalAmount = base + surcharge + additional + gst;

      return next;
    });
  }

  function toggleAfterHours(checked: boolean) {
    setField("afterHoursSurcharge", (checked ? AFTER_HOURS_SURCHARGE_CENTS : 0) as any);
  }

  function handleSaveDraft() {
    if (!draft) return;
    if (selectedId === "new") {
      createMutation.mutate(draft);
    } else if (typeof selectedId === "number") {
      updateMutation.mutate({ id: selectedId, updates: draft });
    }
  }

  function handleSubmit() {
    if (!draft) return;
    if (selectedId === "new") {
      createMutation.mutate({ ...draft, status: "Submitted" });
    } else if (typeof selectedId === "number") {
      updateMutation.mutate({ id: selectedId, updates: { ...draft, status: "Submitted" } });
    }
  }

  function handleMarkPaid() {
    if (!draft || typeof selectedId !== "number") return;
    updateMutation.mutate({ id: selectedId, updates: { status: "Paid" } });
  }

  function handleDelete() {
    if (typeof selectedId !== "number") return;
    if (!window.confirm(`Delete invoice ${draft?.invoiceNumber}? This cannot be undone.`)) return;
    deleteMutation.mutate(selectedId);
  }

  function handleExportPDF() {
    if (!draft) return;
    generateInvoicePDF({
      invoiceNumber: draft.invoiceNumber || "",
      invoiceDate: draft.invoiceDate || todayISO(),
      dueDate: draft.dueDate || todayISO(),
      serviceDate: draft.serviceDate || todayISO(),
      status: draft.status || "Draft",
      payerType: (draft.payerType || "nsw_health") as PayerType,
      payerName: draft.payerName || "",
      taskRef: draft.taskRef ?? null,
      patientId: draft.patientId ?? null,
      pickupLocation: draft.pickupLocation ?? null,
      destination: draft.destination ?? null,
      aircraftReg: draft.aircraftReg ?? null,
      missionType: draft.missionType || "Standard NEPT",
      baseAmountCents: draft.baseAmount || 0,
      afterHoursSurchargeCents: draft.afterHoursSurcharge || 0,
      additionalChargesCents: draft.additionalCharges || 0,
      gstAmountCents: draft.gstAmount || 0,
      totalAmountCents: draft.totalAmount || 0,
      notes: draft.notes ?? null,
    });
  }

  function handleExportCSV() {
    const list = filtered.length > 0 ? filtered : invoices;
    const csv = buildXeroCSV(list);
    downloadCSV(csv, `medivac_invoices_xero_export_${todayISO()}.csv`);
  }

  const fieldCls = "w-full text-xs bg-muted/10 border border-card-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50";
  const labelCls = "text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block";

  const canEdit = draft?.status === "Draft" || selectedId === "new";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex h-full min-h-[calc(100vh-49px)]">
      {/* ══════════════════════ LEFT PANEL — Invoice List ══════════════════════ */}
      <div className={`flex flex-col w-full lg:w-[62%] lg:border-r border-card-border ${mobileDetailOpen ? "hidden lg:flex" : "flex"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-cyan-400" />
            <h1 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Invoicing</h1>
            <span className="text-[10px] text-muted-foreground">NEPT &amp; Private Billing</span>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
          >
            <Plus size={13} /> New Invoice
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 px-4 py-3 border-b border-card-border bg-muted/5">
          <StatCard label="Total" value={String(stats.total)} />
          <StatCard label="Draft" value={String(stats.draftCount)} color="text-gray-300" />
          <StatCard label="Submitted" value={String(stats.submittedCount)} color="text-cyan-300" />
          <StatCard label="Paid" value={String(stats.paidCount)} color="text-green-300" />
          <StatCard label="Overdue" value={String(stats.overdueCount)} color="text-red-300" />
          <StatCard label="Revenue" value={formatCents(stats.revenue)} color="text-green-300" wide />
          <StatCard label="Outstanding" value={formatCents(stats.outstanding)} color="text-amber-300" wide />
        </div>

        {/* Filter tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5 border-b border-card-border">
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice #, task ref, payer…"
              className="w-full text-xs bg-muted/10 border border-card-border rounded-md pl-7 pr-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <button
            onClick={handleExportCSV}
            title="Export Xero/MYOB CSV"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-card-border rounded-md text-muted-foreground hover:text-cyan-300 hover:border-cyan-400/40 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet size={12} /> Export CSV
          </button>
        </div>

        {/* Invoice list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <div className="p-6 text-center text-muted-foreground text-xs">Loading invoices…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-xs">
              <Receipt size={24} className="mx-auto mb-2 opacity-30" />
              No invoices found
            </div>
          )}
          <div className="divide-y divide-card-border">
            {filtered.map(inv => (
              <button
                key={inv.id}
                onClick={() => openInvoice(inv)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/10 transition-colors ${
                  selectedId === inv.id ? "bg-cyan-500/5 border-l-2 border-cyan-400" : "border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">{inv.invoiceNumber}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="text-xs text-foreground/90 mt-1 truncate">{inv.payerName}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                      <Plane size={10} className="text-cyan-400/70" />
                      <span>{inv.missionType}</span>
                      <span>·</span>
                      <span>{fmtDateShort(inv.serviceDate)}</span>
                      {inv.taskRef && <><span>·</span><span className="font-mono">{inv.taskRef}</span></>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">{formatCents(inv.totalAmount)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Due {fmtDateShort(inv.dueDate)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-card-border text-[10px] text-muted-foreground flex items-center justify-between">
          <span>{filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
          <span>Auto-refreshes every 30s</span>
        </div>
      </div>

      {/* ══════════════════════ RIGHT PANEL — Detail / Create Form ══════════════════════ */}
      <div className={`flex-col w-full lg:w-[38%] ${mobileDetailOpen ? "flex" : "hidden lg:flex"}`}>
        {!draft ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FileText size={32} className="text-muted-foreground opacity-30 mb-3" />
            <p className="text-sm text-muted-foreground">Select an invoice to view details,<br />or create a new one.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 border-b border-card-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <button onClick={closeDetail} className="lg:hidden text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                  <span className="font-mono text-sm font-bold text-foreground truncate">{draft.invoiceNumber}</span>
                  <StatusBadge status={effectiveStatus(draft as Invoice)} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-card-border rounded-md text-muted-foreground hover:text-cyan-300 hover:border-cyan-400/40 transition-colors disabled:opacity-50"
                >
                  <Save size={11} /> Save Draft
                </button>
                {draft.status !== "Paid" && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-cyan-500/40 bg-cyan-500/10 rounded-md text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                  >
                    <Send size={11} /> Submit
                  </button>
                )}
                {draft.status !== "Paid" && typeof selectedId === "number" && (
                  <button
                    onClick={handleMarkPaid}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-green-500/40 bg-green-500/10 rounded-md text-green-300 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={11} /> Mark Paid
                  </button>
                )}
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-card-border rounded-md text-muted-foreground hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
                >
                  <Download size={11} /> PDF
                </button>
                {typeof selectedId === "number" && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-card-border rounded-md text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors ml-auto"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Payer Details */}
              <section>
                <SectionHeading icon={<Building2 size={12} />} title="Payer Details" />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    disabled={!canEdit}
                    onClick={() => { setField("payerType", "nsw_health" as any); setField("payerName", "NSW Health" as any); }}
                    className={`text-xs py-2 rounded-md border font-medium transition-colors ${
                      draft.payerType === "nsw_health"
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                        : "text-muted-foreground border-card-border hover:text-foreground"
                    } disabled:opacity-60`}
                  >
                    NSW Health
                  </button>
                  <button
                    disabled={!canEdit}
                    onClick={() => { setField("payerType", "private" as any); setField("payerName", "" as any); }}
                    className={`text-xs py-2 rounded-md border font-medium transition-colors ${
                      draft.payerType === "private"
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                        : "text-muted-foreground border-card-border hover:text-foreground"
                    } disabled:opacity-60`}
                  >
                    Private / Insurance
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Payer Name</label>
                  <input
                    disabled={!canEdit}
                    className={fieldCls}
                    value={draft.payerName || ""}
                    onChange={e => setField("payerName", e.target.value as any)}
                    placeholder={draft.payerType === "nsw_health" ? "NSW Health" : "e.g. Bupa, Medibank, self-funded"}
                  />
                </div>
              </section>

              {/* Mission Details */}
              <section>
                <SectionHeading icon={<Plane size={12} />} title="Mission Details" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Task Reference</label>
                    <input disabled={!canEdit} className={`${fieldCls} font-mono`} value={draft.taskRef || ""} onChange={e => setField("taskRef", e.target.value as any)} placeholder="NEPT-2026-0047" />
                  </div>
                  <div>
                    <label className={labelCls}>Patient ID</label>
                    <input disabled={!canEdit} className={`${fieldCls} font-mono`} value={draft.patientId || ""} onChange={e => setField("patientId", e.target.value as any)} placeholder="Task ref only — no medical info" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Service Date</label>
                    <input disabled={!canEdit} type="date" className={fieldCls} value={draft.serviceDate || ""} onChange={e => setField("serviceDate", e.target.value as any)} />
                  </div>
                  <div>
                    <label className={labelCls}>Pickup Location</label>
                    <input disabled={!canEdit} className={fieldCls} value={draft.pickupLocation || ""} onChange={e => setField("pickupLocation", e.target.value as any)} placeholder="e.g. Dubbo Base Hospital" />
                  </div>
                  <div>
                    <label className={labelCls}>Destination</label>
                    <input disabled={!canEdit} className={fieldCls} value={draft.destination || ""} onChange={e => setField("destination", e.target.value as any)} placeholder="e.g. Bankstown Airport" />
                  </div>
                  <div>
                    <label className={labelCls}>Aircraft Rego</label>
                    <input disabled={!canEdit} className={`${fieldCls} font-mono`} value={draft.aircraftReg || ""} onChange={e => setField("aircraftReg", e.target.value.toUpperCase() as any)} placeholder="VH-KBC" />
                  </div>
                  <div>
                    <label className={labelCls}>Mission Type</label>
                    <select disabled={!canEdit} className={fieldCls} value={draft.missionType || "Standard NEPT"} onChange={e => setField("missionType", e.target.value as any)}>
                      {MISSION_TYPES.map(mt => <option key={mt} value={mt}>{mt}</option>)}
                    </select>
                  </div>
                </div>
                {(draft.pickupLocation || draft.destination) && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-300 bg-cyan-500/5 border border-cyan-500/20 rounded-md px-2.5 py-1.5">
                    <MapPin size={10} />
                    <span>{draft.pickupLocation || "—"}</span>
                    <ArrowRight size={10} className="text-muted-foreground" />
                    <span>{draft.destination || "—"}</span>
                  </div>
                )}
              </section>

              {/* Dates */}
              <section>
                <SectionHeading icon={<Clock size={12} />} title="Dates" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Invoice Date</label>
                    <input disabled={!canEdit} type="date" className={fieldCls} value={draft.invoiceDate || ""} onChange={e => setField("invoiceDate", e.target.value as any)} />
                  </div>
                  <div>
                    <label className={labelCls}>Due Date (auto +30d)</label>
                    <input disabled type="date" className={`${fieldCls} opacity-70`} value={draft.dueDate || ""} readOnly />
                  </div>
                </div>
              </section>

              {/* Charges */}
              <section>
                <SectionHeading icon={<DollarSign size={12} />} title="Charges" />
                <div className="space-y-2.5">
                  <div>
                    <label className={labelCls}>Base Amount (AUD)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input
                        disabled={!canEdit}
                        type="number"
                        step="0.01"
                        className={`${fieldCls} pl-5`}
                        value={((draft.baseAmount ?? 0) / 100).toFixed(2)}
                        onChange={e => setField("baseAmount", Math.round(parseFloat(e.target.value || "0") * 100) as any)}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                    <input
                      disabled={!canEdit}
                      type="checkbox"
                      checked={(draft.afterHoursSurcharge ?? 0) > 0}
                      onChange={e => toggleAfterHours(e.target.checked)}
                      className="rounded border-card-border"
                    />
                    After-Hours Surcharge (+$450.00)
                  </label>

                  <div>
                    <label className={labelCls}>Additional Charges (AUD)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input
                        disabled={!canEdit}
                        type="number"
                        step="0.01"
                        className={`${fieldCls} pl-5`}
                        value={((draft.additionalCharges ?? 0) / 100).toFixed(2)}
                        onChange={e => setField("additionalCharges", Math.round(parseFloat(e.target.value || "0") * 100) as any)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-card-border/60">
                    <span>GST (health services exempt)</span>
                    <span className="font-mono">{formatCents(draft.gstAmount ?? 0)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-card-border">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-cyan-400" /> Total
                    </span>
                    <span className="text-2xl font-extrabold text-cyan-300">{formatCents(draft.totalAmount ?? 0)}</span>
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section>
                <SectionHeading icon={<FileText size={12} />} title="Notes" />
                <textarea
                  disabled={!canEdit}
                  className={`${fieldCls} min-h-[80px] resize-y`}
                  value={draft.notes || ""}
                  onChange={e => setField("notes", e.target.value as any)}
                  placeholder="Any additional notes for this invoice…"
                />
              </section>

              {draft.status === "Overdue" && (
                <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                  <AlertTriangle size={13} />
                  This invoice is more than 30 days past its due date.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small subcomponents ────────────────────────────────────────────────────
function StatCard({ label, value, color, wide }: { label: string; value: string; color?: string; wide?: boolean }) {
  return (
    <div className={`text-center ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className={`text-sm font-bold ${color || "text-foreground"}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
      {icon} {title}
    </div>
  );
}
