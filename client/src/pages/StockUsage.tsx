import { useState, useMemo, useEffect } from "react";
import { type UserRole } from "@/lib/data";
import {
  Package, Plus, Trash2, Send, Download, CheckCircle,
  AlertTriangle, ClipboardList, ShoppingCart, X, ChevronDown, ChevronUp,
  Calendar, Plane, User, FileText, RefreshCw
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ─── Stock catalogue ──────────────────────────────────────────────────────────
interface StockItem {
  id: string;
  category: "S8 Controlled" | "S4 Prescription" | "S3 Pharmacist" | "Consumable" | "Blood Product" | "IV Fluid" | "Equipment";
  name: string;
  unit: string;
  unitCost: number;    // AUD
  supplier: string;
  supplierEmail: string;
  supplierCode: string;
  minReorder: number;
}

const CATALOGUE: StockItem[] = [
  // S8 Controlled
  { id: "s8-01", category: "S8 Controlled",   name: "Morphine Sulphate 10mg/mL",       unit: "ampoule",   unitCost: 4.80,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "MOR-10-1ML",  minReorder: 10 },
  { id: "s8-02", category: "S8 Controlled",   name: "Fentanyl 50mcg/mL",               unit: "ampoule",   unitCost: 5.20,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "FEN-50-2ML",  minReorder: 10 },
  { id: "s8-03", category: "S8 Controlled",   name: "Ketamine 200mg/mL",               unit: "vial",      unitCost: 18.50, supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "KET-200-10ML",minReorder: 5  },
  { id: "s8-04", category: "S8 Controlled",   name: "Midazolam 5mg/mL",                unit: "ampoule",   unitCost: 6.40,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "MID-5-3ML",   minReorder: 5  },
  { id: "s8-05", category: "S8 Controlled",   name: "Hydromorphone 2mg/mL",            unit: "ampoule",   unitCost: 7.20,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "HYD-2-1ML",   minReorder: 5  },
  // S4
  { id: "s4-01", category: "S4 Prescription", name: "Adrenaline 1mg/mL (Epinephrine)", unit: "ampoule",   unitCost: 3.10,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "ADR-1-1ML",   minReorder: 10 },
  { id: "s4-02", category: "S4 Prescription", name: "Metaraminol 10mg/mL",             unit: "ampoule",   unitCost: 4.50,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "MET-10-1ML",  minReorder: 5  },
  { id: "s4-03", category: "S4 Prescription", name: "Paracetamol IV 10mg/mL 100mL",   unit: "bag",       unitCost: 9.80,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "PAR-IV-100",  minReorder: 6  },
  { id: "s4-04", category: "S4 Prescription", name: "Ondansetron 2mg/mL",              unit: "ampoule",   unitCost: 3.60,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "OND-2-2ML",   minReorder: 6  },
  { id: "s4-05", category: "S4 Prescription", name: "Salbutamol 5mg/mL nebule",        unit: "nebule",    unitCost: 1.80,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "SAL-5-2.5ML", minReorder: 10 },
  { id: "s4-06", category: "S4 Prescription", name: "Rocuronium 10mg/mL",              unit: "vial",      unitCost: 14.20, supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "ROC-10-5ML",  minReorder: 2  },
  { id: "s4-07", category: "S4 Prescription", name: "Suxamethonium 50mg/mL",           unit: "ampoule",   unitCost: 8.90,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "SUX-50-2ML",  minReorder: 2  },
  { id: "s4-08", category: "S4 Prescription", name: "Tranexamic Acid 100mg/mL",        unit: "ampoule",   unitCost: 6.20,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "TXA-100-5ML", minReorder: 4  },
  { id: "s4-09", category: "S4 Prescription", name: "Dexamethasone 4mg/mL",            unit: "ampoule",   unitCost: 3.40,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "DEX-4-1ML",   minReorder: 4  },
  { id: "s4-10", category: "S4 Prescription", name: "Calcium Gluconate 100mg/mL",      unit: "ampoule",   unitCost: 4.10,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "CAL-100-10ML",minReorder: 4  },
  // S3
  { id: "s3-01", category: "S3 Pharmacist",   name: "Aspirin 300mg",                   unit: "tablet",    unitCost: 0.20,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "ASP-300-TAB", minReorder: 20 },
  { id: "s3-02", category: "S3 Pharmacist",   name: "GTN Spray 400mcg/dose",           unit: "dose",      unitCost: 0.80,  supplier: "Sigma Healthcare",  supplierEmail: "orders@sigmahealthcare.com.au",  supplierCode: "GTN-400-SPRAY",minReorder: 10},
  // IV Fluids
  { id: "iv-01", category: "IV Fluid",        name: "Normal Saline 0.9% 1000mL",       unit: "bag",       unitCost: 3.20,  supplier: "Baxter Healthcare", supplierEmail: "orders@baxter.com.au",           supplierCode: "NS-1000",     minReorder: 6  },
  { id: "iv-02", category: "IV Fluid",        name: "Hartmann's Solution 1000mL",      unit: "bag",       unitCost: 3.80,  supplier: "Baxter Healthcare", supplierEmail: "orders@baxter.com.au",           supplierCode: "HART-1000",   minReorder: 6  },
  { id: "iv-03", category: "IV Fluid",        name: "Normal Saline 0.9% 500mL",        unit: "bag",       unitCost: 2.40,  supplier: "Baxter Healthcare", supplierEmail: "orders@baxter.com.au",           supplierCode: "NS-500",      minReorder: 6  },
  { id: "iv-04", category: "IV Fluid",        name: "Glucose 5% 500mL",                unit: "bag",       unitCost: 2.80,  supplier: "Baxter Healthcare", supplierEmail: "orders@baxter.com.au",           supplierCode: "GLU-500",     minReorder: 4  },
  // Blood products
  { id: "bp-01", category: "Blood Product",   name: "Packed Red Blood Cells (pRBC)",   unit: "unit",      unitCost: 0,     supplier: "Australian Red Cross Lifeblood", supplierEmail: "orders@lifeblood.com.au", supplierCode: "PRBC-UNIT",   minReorder: 2  },
  { id: "bp-02", category: "Blood Product",   name: "Fresh Frozen Plasma (FFP)",       unit: "unit",      unitCost: 0,     supplier: "Australian Red Cross Lifeblood", supplierEmail: "orders@lifeblood.com.au", supplierCode: "FFP-UNIT",    minReorder: 2  },
  { id: "bp-03", category: "Blood Product",   name: "Platelets (pooled)",              unit: "unit",      unitCost: 0,     supplier: "Australian Red Cross Lifeblood", supplierEmail: "orders@lifeblood.com.au", supplierCode: "PLT-POOL",    minReorder: 1  },
  // Consumables
  { id: "cn-01", category: "Consumable",      name: "Defibrillator Pads (ZOLL adult)", unit: "set",       unitCost: 28.50, supplier: "Zoll Medical",      supplierEmail: "orders@zoll.com.au",             supplierCode: "ZOLL-PAD-AD", minReorder: 2  },
  { id: "cn-02", category: "Consumable",      name: "Defibrillator Pads (ZOLL paed)", unit: "set",       unitCost: 32.00, supplier: "Zoll Medical",      supplierEmail: "orders@zoll.com.au",             supplierCode: "ZOLL-PAD-PD", minReorder: 1  },
  { id: "cn-03", category: "Consumable",      name: "Intubation Kit (disposable)",    unit: "kit",       unitCost: 45.00, supplier: "Intersurgical",     supplierEmail: "orders@intersurgical.com.au",    supplierCode: "INT-KIT-DIS", minReorder: 2  },
  { id: "cn-04", category: "Consumable",      name: "iSTAT Cartridge CG8+",           unit: "cartridge", unitCost: 18.90, supplier: "Abbott Point of Care",supplierEmail:"orders@abbott.com.au",           supplierCode: "ISTAT-CG8",   minReorder: 10 },
  { id: "cn-05", category: "Consumable",      name: "IV Cannula 18g",                 unit: "each",      unitCost: 1.10,  supplier: "BD Medical",        supplierEmail: "orders@bd.com.au",               supplierCode: "BD-18G",      minReorder: 20 },
  { id: "cn-06", category: "Consumable",      name: "IV Cannula 20g",                 unit: "each",      unitCost: 1.10,  supplier: "BD Medical",        supplierEmail: "orders@bd.com.au",               supplierCode: "BD-20G",      minReorder: 20 },
  { id: "cn-07", category: "Consumable",      name: "IV Giving Set",                  unit: "each",      unitCost: 2.40,  supplier: "Baxter Healthcare", supplierEmail: "orders@baxter.com.au",           supplierCode: "GIVESET",     minReorder: 10 },
  { id: "cn-08", category: "Consumable",      name: "Nasopharyngeal Airway (NPA) 7.0",unit: "each",      unitCost: 3.80,  supplier: "Intersurgical",     supplierEmail: "orders@intersurgical.com.au",    supplierCode: "NPA-70",      minReorder: 4  },
  { id: "cn-09", category: "Consumable",      name: "Supraglottic Airway (LMA sz 4)", unit: "each",      unitCost: 22.00, supplier: "Intersurgical",     supplierEmail: "orders@intersurgical.com.au",    supplierCode: "LMA-4",       minReorder: 2  },
  { id: "cn-10", category: "Consumable",      name: "Chest Seal (Bolin vented)",      unit: "each",      unitCost: 14.50, supplier: "NAR / North American Rescue", supplierEmail:"orders@narescue.com.au",  supplierCode: "BOLIN-SEAL",  minReorder: 4  },
  { id: "cn-11", category: "Consumable",      name: "Tourniquet (CAT Gen 7)",         unit: "each",      unitCost: 42.00, supplier: "NAR / North American Rescue", supplierEmail:"orders@narescue.com.au",  supplierCode: "CAT-GEN7",    minReorder: 2  },
  { id: "cn-12", category: "Consumable",      name: "SpO2 Probe (Masimo adult)",      unit: "each",      unitCost: 38.00, supplier: "Masimo Corporation",supplierEmail: "orders@masimo.com.au",           supplierCode: "MAS-SPO2-AD", minReorder: 2  },
  { id: "cn-13", category: "Consumable",      name: "ECG Electrodes (10-lead set)",   unit: "set",       unitCost: 2.20,  supplier: "Zoll Medical",      supplierEmail: "orders@zoll.com.au",             supplierCode: "ECG-10-SET",  minReorder: 10 },
  { id: "cn-14", category: "Consumable",      name: "Urinary Catheter 14Fr Foley",    unit: "each",      unitCost: 4.80,  supplier: "BD Medical",        supplierEmail: "orders@bd.com.au",               supplierCode: "CATH-14FR",   minReorder: 4  },
  { id: "cn-15", category: "Consumable",      name: "Glucometer Strips (Accu-Chek)",  unit: "strip",     unitCost: 0.95,  supplier: "Roche Diagnostics", supplierEmail: "orders@roche.com.au",            supplierCode: "ACC-STRIP",   minReorder: 50 },
];

// ─── Usage entry (one per flight/incident) ────────────────────────────────────
interface UsageEntry {
  id: string;
  date: string;
  missionRef: string;
  aircraft: string;
  nurse: string;
  items: { stockId: string; qty: number; notes: string }[];
  locked: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function weekLabel(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7); // Monday
  const mon = d.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
  d.setDate(d.getDate() + 6);
  const sun = d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  return `${mon} – ${sun}`;
}

function getWeekStart(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const CATEGORIES: StockItem["category"][] = [
  "S8 Controlled", "S4 Prescription", "S3 Pharmacist", "IV Fluid", "Blood Product", "Consumable", "Equipment",
];

const CAT_COLOR: Record<string, string> = {
  "S8 Controlled":   "status-red",
  "S4 Prescription": "status-orange",
  "S3 Pharmacist":   "status-blue",
  "IV Fluid":        "status-green",
  "Blood Product":   "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  "Consumable":      "status-blue",
  "Equipment":       "bg-slate-500/10 text-slate-400 border border-slate-500/20",
};

const AIRCRAFT = ["VH-MVW","VH-MVX","VH-MWH","VH-MWK","VH-XYJ","VH-XYO","VH-XYR","VH-XYU","VH-RFD","VH-MQD","VH-MQK","VH-NAJ","VH-VPQ","VH-LTQ"];

// ─── Demo seed data ───────────────────────────────────────────────────────────
const DEMO_ENTRIES: UsageEntry[] = [
  {
    id: "u001", date: "2026-06-02", missionRef: "RFDS-2026-0482", aircraft: "VH-MVW", nurse: "S. Williams (SFN)",
    items: [
      { stockId: "s8-01", qty: 2, notes: "Morphine for pain management — long transfer" },
      { stockId: "s4-01", qty: 1, notes: "Epi — anaphylaxis on scene" },
      { stockId: "iv-01", qty: 2, notes: "Fluid resus" },
      { stockId: "cn-05", qty: 2, notes: "" },
      { stockId: "cn-07", qty: 2, notes: "" },
      { stockId: "cn-13", qty: 1, notes: "" },
    ],
    locked: true,
  },
  {
    id: "u002", date: "2026-06-03", missionRef: "RFDS-2026-0484", aircraft: "VH-XYJ", nurse: "B. Thompson (RN)",
    items: [
      { stockId: "s8-02", qty: 1, notes: "Fentanyl — procedural sedation" },
      { stockId: "s4-03", qty: 1, notes: "" },
      { stockId: "s4-04", qty: 2, notes: "Ondansetron — nausea" },
      { stockId: "iv-02", qty: 1, notes: "" },
      { stockId: "cn-04", qty: 2, notes: "iSTAT — lactate + BGL" },
    ],
    locked: true,
  },
  {
    id: "u003", date: "2026-06-04", missionRef: "RFDS-2026-0487", aircraft: "VH-MVW", nurse: "M. Nguyen (RN)",
    items: [
      { stockId: "s4-08", qty: 1, notes: "TXA — trauma" },
      { stockId: "s4-06", qty: 1, notes: "Rocuronium — RSI" },
      { stockId: "s4-07", qty: 1, notes: "Sux — RSI backup" },
      { stockId: "cn-03", qty: 1, notes: "Intubation kit" },
      { stockId: "iv-01", qty: 3, notes: "Fluid resus trauma" },
      { stockId: "cn-10", qty: 2, notes: "Chest seal — bilateral" },
      { stockId: "cn-11", qty: 1, notes: "CAT tourniquet" },
    ],
    locked: true,
  },
  {
    id: "u004", date: "2026-06-05", missionRef: "RFDS-2026-0491", aircraft: "VH-XYR", nurse: "S. Williams (SFN)",
    items: [
      { stockId: "s8-01", qty: 1, notes: "" },
      { stockId: "s4-05", qty: 3, notes: "Salbutamol — respiratory" },
      { stockId: "iv-03", qty: 2, notes: "" },
      { stockId: "cn-13", qty: 1, notes: "" },
      { stockId: "cn-15", qty: 4, notes: "BGL monitoring" },
    ],
    locked: false,
  },
];

// ─── Blank usage entry ────────────────────────────────────────────────────────
const BLANK_ENTRY = (): UsageEntry => ({
  id: `u${Date.now()}`,
  date: new Date().toISOString().split("T")[0],
  missionRef: "",
  aircraft: AIRCRAFT[0],
  nurse: "",
  items: [],
  locked: false,
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StockUsage({ role }: Props) {
  const [entries, setEntries] = useState<UsageEntry[]>(DEMO_ENTRIES);

  // ─ Auto-import chest reorders from server queue (replaces localStorage) ─────
  const [chestReorderBanner, setChestReorderBanner] = useState(false);
  useEffect(() => {
    fetch("/api/chest-reorder-queue")
      .then(r => r.json())
      .then((pending: { stockId: string; qty: number; note: string }[]) => {
        if (!pending || pending.length === 0) return;
        const entry: UsageEntry = {
          id: `chest-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          missionRef: "CHEST-RESTOCK",
          aircraft: "Ground Stock",
          nurse: "Station Medical Chest",
          items: pending.map(p => ({ stockId: p.stockId, qty: p.qty, notes: p.note })),
          locked: true,
        };
        setEntries(prev => {
          if (prev.some(e => e.missionRef === "CHEST-RESTOCK" && e.date === entry.date)) return prev;
          return [...prev, entry];
        });
        fetch("/api/chest-reorder-queue", { method: "DELETE" }).catch(() => {});
        setChestReorderBanner(true);
        setTimeout(() => setChestReorderBanner(false), 6000);
      })
      .catch(() => {});
  }, []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<UsageEntry | null>(null);
  const [catFilter, setCatFilter] = useState<string>("All");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // ── Filter entries to current week ──────────────────────────────────────────
  const weekStart = getWeekStart(weekOffset);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

  const weekEntries = useMemo(() =>
    entries.filter(e => {
      const d = new Date(e.date);
      return d >= weekStart && d < weekEnd;
    }),
    [entries, weekOffset]
  );

  // ── Accumulate totals ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    weekEntries.forEach(e => {
      e.items.forEach(i => {
        map[i.stockId] = (map[i.stockId] ?? 0) + i.qty;
      });
    });
    return map;
  }, [weekEntries]);

  const usedItems = CATALOGUE.filter(c => totals[c.id] > 0);

  // ── Order lines: items used + items at/below min reorder ──────────────────
  const orderLines = CATALOGUE.filter(c => {
    const used = totals[c.id] ?? 0;
    return used > 0;
  });

  // ── Grouped by supplier for order form ───────────────────────────────────
  const bySupplier = useMemo(() => {
    const map: Record<string, { supplier: string; email: string; items: { item: StockItem; qty: number }[] }> = {};
    orderLines.forEach(item => {
      const qty = totals[item.id] ?? 0;
      if (!map[item.supplier]) map[item.supplier] = { supplier: item.supplier, email: item.supplierEmail, items: [] };
      map[item.supplier].items.push({ item, qty });
    });
    return Object.values(map);
  }, [orderLines, totals]);

  const totalCost = orderLines.reduce((s, c) => s + (totals[c.id] ?? 0) * c.unitCost, 0);

  // ── Add/edit entry helpers ─────────────────────────────────────────────────
  const [draft, setDraft] = useState<UsageEntry>(BLANK_ENTRY());
  const [draftItem, setDraftItem] = useState({ stockId: "", qty: 1, notes: "" });
  const [draftError, setDraftError] = useState("");

  function openAdd() {
    setDraft(BLANK_ENTRY());
    setDraftItem({ stockId: "", qty: 1, notes: "" });
    setDraftError("");
    setShowAddModal(true);
  }

  function addItemToDraft() {
    if (!draftItem.stockId) return setDraftError("Select a stock item");
    if (draftItem.qty < 1)  return setDraftError("Quantity must be ≥ 1");
    setDraft(p => ({ ...p, items: [...p.items, { ...draftItem }] }));
    setDraftItem({ stockId: "", qty: 1, notes: "" });
    setDraftError("");
  }

  function removeDraftItem(idx: number) {
    setDraft(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  }

  function saveEntry() {
    if (!draft.missionRef.trim()) return setDraftError("Mission reference required");
    if (!draft.nurse.trim())      return setDraftError("Nurse / medical crew name required");
    if (draft.items.length === 0) return setDraftError("Add at least one stock item used");
    setEntries(p => {
      const existing = p.find(e => e.id === draft.id);
      if (existing) return p.map(e => e.id === draft.id ? { ...draft, locked: true } : e);
      return [...p, { ...draft, locked: true }];
    });
    setShowAddModal(false);
  }

  function deleteEntry(id: string) {
    setEntries(p => p.filter(e => e.id !== id));
  }

  // ── Download order PDF ─────────────────────────────────────────────────────
  function downloadOrderPDF() {
    generatePDF({
      title: "Medical Consumables Order — Weekly Replenishment",
      subtitle: `Week: ${weekLabel(weekOffset)} · RFDS SE Section`,
      date: weekLabel(weekOffset),
      reference: `MED-ORDER-${new Date().toISOString().slice(0, 10)}`,
      sections: [
        {
          heading: "Order Summary",
          rows: [
            { label: "Total line items",    value: `${orderLines.length}` },
            { label: "Missions this week",  value: `${weekEntries.length}` },
            { label: "Estimated total cost",value: `$${totalCost.toFixed(2)} AUD (excl. blood products)` },
            { label: "Prepared by",         value: "RFDS SE Section — Medical Operations" },
          ],
        },
        ...bySupplier.map(s => ({
          heading: `Supplier: ${s.supplier}  |  ${s.email}`,
          rows: s.items.map(({ item, qty }) => ({
            label: `${item.supplierCode} — ${item.name}`,
            value: `Qty: ${qty} ${item.unit}${item.unitCost > 0 ? `  |  Est. $${(qty * item.unitCost).toFixed(2)}` : "  |  Blood product — no cost"}`,
          })),
        })),
        {
          heading: "Mission Usage Detail",
          rows: weekEntries.map(e => ({
            label: `${e.date} · ${e.missionRef}`,
            value: `${e.aircraft} · ${e.nurse} · ${e.items.length} item type${e.items.length !== 1 ? "s" : ""}`,
          })),
        },
      ],
      footer: "CONFIDENTIAL — RFDS SE Section · Medical Consumables Order · Authorised signatory required for S8 items",
    });
  }

  // ── Mailto order (one per supplier) ────────────────────────────────────────
  function sendOrderEmails() {
    bySupplier.forEach(s => {
      const subject = encodeURIComponent(`RFDS SE Section — Medical Consumables Order ${weekLabel(weekOffset)}`);
      const body = encodeURIComponent(
        `Dear ${s.supplier},\n\nPlease supply the following items to RFDS South Eastern Section.\n\nOrganisation:  RFDS South Eastern Section\nAddress:       Coorena Road (Judy Jakins Drive), Dubbo Regional Airport NSW 2830\nContact:       Medical Operations — Dubbo Base\nOrder Period:  ${weekLabel(weekOffset)}\nOrder Ref:     MED-ORDER-${new Date().toISOString().slice(0, 10)}\n\nORDER ITEMS:\n` +
        s.items.map(({ item, qty }) =>
          `  ${item.supplierCode}  ${item.name}  x${qty} ${item.unit}${item.unitCost > 0 ? `  (Est. $${(qty * item.unitCost).toFixed(2)})` : ""}`
        ).join("\n") +
        `\n\nPlease invoice RFDS South Eastern Section ABN 48 096 916 620.\n\nNote: S8 controlled substance items require a valid RFDS SE Section permit attached.\n\nKind regards,\nRFDS South Eastern Section — Medical Operations\n`
      );
      window.open(`mailto:${s.email}?subject=${subject}&body=${body}`, "_blank");
    });
    setOrderSent(true);
    setTimeout(() => setShowOrderModal(false), 1200);
  }

  // ── Filtered catalogue for category ───────────────────────────────────────
  const filteredCatalogue = catFilter === "All" ? CATALOGUE : CATALOGUE.filter(c => c.category === catFilter);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Medical Stock Usage
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weekly consumables log · Accumulator · Replenishment orders
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus size={13} /> Log Stock Used
          </button>
          {orderLines.length > 0 && (
            <button
              onClick={() => { setOrderSent(false); setShowOrderModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShoppingCart size={13} /> Generate Order
            </button>
          )}
        </div>
      </div>

      {/* Chest reorder import banner */}
      {chestReorderBanner && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/5 text-xs">
          <CheckCircle size={13} className="text-green-400 shrink-0" />
          <span className="text-green-300 font-semibold">Medical Chest reorder items imported</span>
          <span className="text-muted-foreground">— added to this week’s usage log and order queue automatically.</span>
        </div>
      )}

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="px-3 py-1.5 text-xs border border-card-border rounded-lg hover:bg-muted transition-colors"
        >← Prev</button>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-card border border-card-border rounded-lg">
          <Calendar size={12} className="text-cyan-400" />
          <span className="text-xs font-semibold">{weekLabel(weekOffset)}</span>
          {weekOffset === 0 && <span className="text-[10px] text-cyan-400 font-bold ml-1">Current</span>}
        </div>
        <button
          onClick={() => setWeekOffset(o => Math.min(o + 1, 0))}
          disabled={weekOffset === 0}
          className="px-3 py-1.5 text-xs border border-card-border rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
        >Next →</button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Missions Logged",    value: weekEntries.length,         color: "text-cyan-400"    },
          { label: "Item Types Used",    value: usedItems.length,           color: "text-amber-400"   },
          { label: "Total Units Used",   value: Object.values(totals).reduce((a, b) => a + b, 0), color: "text-blue-400" },
          { label: "Est. Order Value",   value: `$${totalCost.toFixed(0)}`, color: "text-emerald-400" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Left: Mission usage log ── */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Mission Usage Log
            </h2>
            <span className="text-[10px] text-muted-foreground">{weekEntries.length} missions</span>
          </div>
          {weekEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <ClipboardList size={24} className="mx-auto mb-2 opacity-40" />
              No usage logged this week
            </div>
          ) : (
            <div className="divide-y divide-border">
              {weekEntries.map(e => {
                const expanded = expandedEntry === e.id;
                return (
                  <div key={e.id}>
                    <button
                      onClick={() => setExpandedEntry(expanded ? null : e.id)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plane size={12} className="text-cyan-400 shrink-0" />
                          <span className="text-xs font-mono font-bold text-cyan-400">{e.missionRef}</span>
                          <span className="text-[10px] text-muted-foreground">{e.aircraft}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{e.date}</span>
                          {expanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={10} className="text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{e.nurse}</span>
                        <span className="text-[10px] text-cyan-400/70 ml-1">{e.items.length} item type{e.items.length !== 1 ? "s" : ""}</span>
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3 space-y-1.5 bg-muted/10">
                        {e.items.map((item, idx) => {
                          const stock = CATALOGUE.find(c => c.id === item.stockId);
                          if (!stock) return null;
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-border last:border-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${CAT_COLOR[stock.category]}`}>{stock.category.split(" ")[0]}</span>
                                <span className="font-medium">{stock.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-cyan-400">{item.qty} {stock.unit}{item.qty > 1 ? "s" : ""}</span>
                                {!e.locked && (
                                  <button onClick={() => deleteEntry(e.id)} className="text-red-400 hover:text-red-300">
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {e.items.some(i => i.notes) && (
                          <div className="text-[10px] text-muted-foreground pt-1">
                            {e.items.filter(i => i.notes).map((i, idx) => {
                              const s = CATALOGUE.find(c => c.id === i.stockId);
                              return <div key={idx}>{s?.name}: {i.notes}</div>;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Weekly totals ── */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Weekly Totals
            </h2>
            <div className="flex gap-1 flex-wrap">
              {["All", ...CATEGORIES].map(c => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                    catFilter === c ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30" : "text-muted-foreground hover:text-foreground"
                  }`}
                >{c === "All" ? "All" : c.split(" ")[0]}</button>
              ))}
            </div>
          </div>
          {usedItems.filter(c => catFilter === "All" || c.category === catFilter).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Package size={24} className="mx-auto mb-2 opacity-40" />
              No usage recorded this week
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
              {usedItems
                .filter(c => catFilter === "All" || c.category === catFilter)
                .sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))
                .map(stock => {
                  const used = totals[stock.id] ?? 0;
                  const isLow = used >= stock.minReorder;
                  return (
                    <div key={stock.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${CAT_COLOR[stock.category]}`}>
                        {stock.category.split(" ")[0]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{stock.name}</div>
                        <div className="text-[10px] text-muted-foreground">{stock.supplier}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${isLow ? "text-amber-400" : "text-cyan-400"}`}>
                          {used} <span className="text-[10px] font-normal text-muted-foreground">{stock.unit}{used > 1 ? "s" : ""}</span>
                        </div>
                        {stock.unitCost > 0 && (
                          <div className="text-[10px] text-muted-foreground">${(used * stock.unitCost).toFixed(2)}</div>
                        )}
                        {isLow && <div className="text-[9px] text-amber-400 font-bold">↑ Reorder</div>}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          {usedItems.length > 0 && (
            <div className="px-4 py-3 border-t border-card-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Estimated cost this week</span>
              <span className="text-sm font-bold text-emerald-400">${totalCost.toFixed(2)} AUD</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Order preview ── */}
      {bySupplier.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={14} className="text-emerald-400" />
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Order Preview — {bySupplier.length} Supplier{bySupplier.length > 1 ? "s" : ""}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadOrderPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 border border-cyan-400/30 bg-cyan-500/5 hover:bg-cyan-500/15 rounded-lg font-semibold transition-colors"
              >
                <Download size={12} /> Download PDF
              </button>
              <button
                onClick={() => { setOrderSent(false); setShowOrderModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-400/30 bg-emerald-500/5 hover:bg-emerald-500/15 rounded-lg font-semibold transition-colors"
              >
                <Send size={12} /> Send Orders
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {bySupplier.map((s, si) => (
              <div key={si} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold">{s.supplier}</span>
                  <span className="text-[10px] text-muted-foreground">{s.email}</span>
                  <span className="ml-auto text-[10px] font-semibold text-emerald-400">
                    ${s.items.reduce((sum, { item, qty }) => sum + qty * item.unitCost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {s.items.map(({ item, qty }, ii) => (
                    <div key={ii} className="flex items-center justify-between text-[11px] bg-muted/20 rounded-lg px-3 py-1.5">
                      <span className="truncate font-medium mr-2">{item.name}</span>
                      <span className="shrink-0 font-bold text-cyan-400">× {qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-card-border flex items-center justify-between bg-emerald-500/5">
            <span className="text-xs font-semibold text-muted-foreground">Total order value (excl. blood products)</span>
            <span className="text-base font-bold text-emerald-400">${totalCost.toFixed(2)} AUD</span>
          </div>
        </div>
      )}

      {/* ── Log Stock Used Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Log Stock Used</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Enter all items used for this mission / shift</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Mission details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Date</label>
                  <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Aircraft</label>
                  <select value={draft.aircraft} onChange={e => setDraft(p => ({ ...p, aircraft: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400">
                    {AIRCRAFT.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Mission Reference *</label>
                  <input type="text" placeholder="e.g. RFDS-2026-0495" value={draft.missionRef}
                    onChange={e => setDraft(p => ({ ...p, missionRef: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Nurse / Medical Crew *</label>
                  <input type="text" placeholder="e.g. S. Williams (SFN)" value={draft.nurse}
                    onChange={e => setDraft(p => ({ ...p, nurse: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" />
                </div>
              </div>

              {/* Add item */}
              <div className="rounded-xl border border-card-border p-3 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Add Item Used</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select value={draftItem.stockId}
                      onChange={e => setDraftItem(p => ({ ...p, stockId: e.target.value }))}
                      className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400">
                      <option value="">— Select item —</option>
                      {CATEGORIES.map(cat => (
                        <optgroup key={cat} label={cat}>
                          {CATALOGUE.filter(c => c.category === cat).map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input type="number" min={1} value={draftItem.qty}
                      onChange={e => setDraftItem(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400" />
                  </div>
                </div>
                <input type="text" placeholder="Notes (optional — patient context, reason)"
                  value={draftItem.notes}
                  onChange={e => setDraftItem(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400" />
                <button onClick={addItemToDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 rounded-lg font-semibold transition-colors">
                  <Plus size={11} /> Add to list
                </button>
              </div>

              {/* Items added */}
              {draft.items.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{draft.items.length} item{draft.items.length > 1 ? "s" : ""} added</p>
                  {draft.items.map((item, idx) => {
                    const stock = CATALOGUE.find(c => c.id === item.stockId);
                    return stock ? (
                      <div key={idx} className="flex items-center justify-between text-[11px] bg-muted/20 rounded-lg px-3 py-2">
                        <div>
                          <span className={`px-1 py-0.5 rounded text-[9px] font-bold mr-2 ${CAT_COLOR[stock.category]}`}>{stock.category.split(" ")[0]}</span>
                          <span className="font-medium">{stock.name}</span>
                          {item.notes && <span className="text-muted-foreground ml-2">— {item.notes}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-cyan-400">{item.qty} {stock.unit}{item.qty > 1 ? "s" : ""}</span>
                          <button onClick={() => removeDraftItem(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* S8 warning */}
              {draft.items.some(i => CATALOGUE.find(c => c.id === i.stockId)?.category === "S8 Controlled") && (
                <div className="flex items-center gap-2 text-amber-400 text-xs p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle size={13} /> S8 controlled drugs — ensure signed register entry with witness and SFN countersign.
                </div>
              )}

              {draftError && (
                <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={13} /> {draftError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-card-border">
              <button onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs text-muted-foreground border border-card-border rounded-lg hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={saveEntry}
                className="px-5 py-2 text-xs font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors">
                Save Usage Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Order Confirmation Modal ── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Send Replenishment Orders</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">
                This will open {bySupplier.length} email{bySupplier.length > 1 ? "s" : ""} — one per supplier — pre-filled with the order for <span className="text-foreground font-semibold">{weekLabel(weekOffset)}</span>.
              </p>
              <div className="space-y-2">
                {bySupplier.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-3 bg-muted/20 rounded-lg">
                    <div>
                      <div className="font-semibold">{s.supplier}</div>
                      <div className="text-muted-foreground">{s.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-400">{s.items.length} lines</div>
                      <div className="text-muted-foreground">${s.items.reduce((sum, { item, qty }) => sum + qty * item.unitCost, 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                ⚠ S8 orders require a separate controlled drug permit. Ensure your email client is open before proceeding.
              </div>
              {orderSent && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle size={13} /> Orders opened in your email client — review and send each one.
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-t border-card-border">
              <button onClick={downloadOrderPDF}
                className="flex items-center gap-1.5 px-4 py-2 text-xs border border-card-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <Download size={12} /> PDF Only
              </button>
              <button onClick={sendOrderEmails}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors">
                <Send size={13} /> Send All Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
