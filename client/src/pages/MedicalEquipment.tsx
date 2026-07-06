import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import {
  Activity, AlertTriangle, CheckCircle, Clock, Download, Eye,
  Filter, Package, RefreshCw, Search, ShieldCheck, Sparkles,
  Thermometer, TrendingUp, Zap, ChevronDown, ChevronRight,
  Calendar, BarChart3, Pill, Droplets, HeartPulse, Syringe,
  FlaskConical, Stethoscope, Wind, Radio, Boxes, Clipboard,
  Plus, X, Check, Info, Lock, FileText, Star, MapPin, ShoppingCart, Briefcase
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ─── Types ───────────────────────────────────────────────────────────────────
type EquipStatus = "ok" | "warning" | "critical" | "overdue";
type DrugStatus  = "stocked" | "low" | "expiring" | "out" | "used";

interface Equipment {
  id: string;
  name: string;
  category: string;
  aircraft: string;
  serial: string;
  lastService: string;
  nextService: string;
  expiryDate: string | null;
  daysToService: number;
  daysToExpiry: number | null;
  status: EquipStatus;
  notes: string;
  icon: React.ReactNode;
  critical: boolean;
}

interface DrugItem {
  id: string;
  name: string;
  category: string;
  concentration: string;
  qty: number;
  minQty: number;
  unit: string;
  expiryDate: string;
  daysToExpiry: number;
  batchNo: string;
  storage: string;
  schedule: string;
  status: DrugStatus;
  usedToday: number;
  reorderQty: number;
}

interface BloodItem {
  id: string;
  group: string;
  component: string;
  units: number;
  minUnits: number;
  expiryDate: string;
  daysToExpiry: number;
  donorId: string;
  storage: string;
  status: DrugStatus;
  usedToday: number;
}

interface ChecklistEntry {
  id: string;
  time: string;
  nurse: string;
  aircraft: string;
  action: string;
  item: string;
  qty: string;
  note: string;
  type: "used" | "checked" | "reorder" | "expiry" | "restock";
}

// ─── Medical Chest Types ────────────────────────────────────────────────────
interface ChestItem {
  id: string;
  name: string;
  category: "S8 Controlled" | "S4 Prescription" | "S3 Pharmacist" | "IV Fluid" | "Consumable" | "Equipment";
  stockCatalogueId: string | null;  // links to StockUsage CATALOGUE id for reorder
  parQty: number;         // full par level
  unit: string;
  expiryDate?: string;    // optional
  storageNote?: string;
}

interface MedicalChest {
  id: string;
  name: string;           // e.g. "Dubbo Base — Medical Chest A"
  station: string;        // base location
  location: string;       // room / shelf label
  lastChecked?: string;
  checkedBy?: string;
}

interface ChestCheckEntry {
  chestId: string;
  itemId: string;
  qtyPresent: number;     // how many on hand right now
  used: number;           // used = par - qtyPresent
  note: string;
  flagReorder: boolean;
  expiryDate: string;     // ISO date — batch expiry for this chest
}

function expiryStatus(iso: string): "ok" | "soon" | "critical" | "expired" | "none" {
  if (!iso) return "none";
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(iso);
  const days  = Math.round((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0)   return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "soon";
  return "ok";
}

function expiryLabel(iso: string): string {
  if (!iso) return "";
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(iso);
  const days  = Math.round((exp.getTime() - today.getTime()) / 86400000);
  const formatted = exp.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  if (days < 0)   return `EXPIRED ${Math.abs(days)}d ago (${formatted})`;
  if (days === 0) return `Expires TODAY (${formatted})`;
  if (days <= 30) return `Expires in ${days}d (${formatted})`;
  if (days <= 90) return `Exp ${formatted} — ${days}d`;
  return formatted;
}

// ─── Station Medical Chests ───────────────────────────────────────────────────
const MEDICAL_CHESTS: MedicalChest[] = [
  { id: "ch-dub-a", name: "Dubbo Base — Chest A",           station: "Dubbo",       location: "Medical Store Room 1 — Shelf A",     lastChecked: "2026-07-05", checkedBy: "S. Williams (SFN)" },
  { id: "ch-dub-b", name: "Dubbo Base — Chest B (S8)",      station: "Dubbo",       location: "Medical Store Room 1 — Controlled",  lastChecked: "2026-07-05", checkedBy: "S. Williams (SFN)" },
  { id: "ch-bhi-a", name: "Broken Hill Base — Chest A",     station: "Broken Hill", location: "Medical Store Room — Shelf A",       lastChecked: "2026-07-04", checkedBy: "M. Nguyen (RN)" },
  { id: "ch-bhi-b", name: "Broken Hill Base — Chest B (S8)",station: "Broken Hill", location: "Medical Store Room — Controlled",    lastChecked: "2026-07-04", checkedBy: "M. Nguyen (RN)" },
  { id: "ch-bkb-a", name: "Bankstown Base — Chest A",       station: "Bankstown",   location: "Medical Store — Bay 2, Shelf A",    lastChecked: "2026-07-06", checkedBy: "B. Thompson (RN)" },
  { id: "ch-ess-a", name: "Essendon Base — Chest A",        station: "Essendon",    location: "Medical Supply Room — Shelf A",     lastChecked: "2026-07-03", checkedBy: "K. Brennan (RN)" },
  { id: "ch-las-a", name: "Launceston Base — Chest A",      station: "Launceston",  location: "Medical Store — Shelf A",           lastChecked: "2026-07-02", checkedBy: "J. Park (RN)" },
];

// ─── Chest Contents (par levels — shared across all chests, qty may vary) ────
const CHEST_ITEMS: ChestItem[] = [
  // S8 Controlled
  { id: "ci-s8-01", name: "Morphine Sulphate 10mg/mL",        category: "S8 Controlled",   stockCatalogueId: "s8-01", parQty: 10, unit: "ampoule",   storageNote: "Locked controlled cabinet" },
  { id: "ci-s8-02", name: "Fentanyl 50mcg/mL",                category: "S8 Controlled",   stockCatalogueId: "s8-02", parQty: 10, unit: "ampoule",   storageNote: "Locked controlled cabinet" },
  { id: "ci-s8-03", name: "Ketamine 200mg/mL",                category: "S8 Controlled",   stockCatalogueId: "s8-03", parQty: 5,  unit: "vial",      storageNote: "Locked controlled cabinet" },
  { id: "ci-s8-04", name: "Midazolam 5mg/mL",                 category: "S8 Controlled",   stockCatalogueId: "s8-04", parQty: 5,  unit: "ampoule",   storageNote: "Locked controlled cabinet" },
  // S4
  { id: "ci-s4-01", name: "Adrenaline 1mg/mL",                category: "S4 Prescription", stockCatalogueId: "s4-01", parQty: 10, unit: "ampoule" },
  { id: "ci-s4-02", name: "Metaraminol 10mg/mL",              category: "S4 Prescription", stockCatalogueId: "s4-02", parQty: 5,  unit: "ampoule" },
  { id: "ci-s4-03", name: "Paracetamol IV 10mg/mL 100mL",    category: "S4 Prescription", stockCatalogueId: "s4-03", parQty: 6,  unit: "bag" },
  { id: "ci-s4-04", name: "Ondansetron 2mg/mL",               category: "S4 Prescription", stockCatalogueId: "s4-04", parQty: 6,  unit: "ampoule" },
  { id: "ci-s4-05", name: "Salbutamol 5mg/mL nebule",         category: "S4 Prescription", stockCatalogueId: "s4-05", parQty: 10, unit: "nebule" },
  { id: "ci-s4-06", name: "Rocuronium 10mg/mL",               category: "S4 Prescription", stockCatalogueId: "s4-06", parQty: 2,  unit: "vial" },
  { id: "ci-s4-07", name: "Suxamethonium 50mg/mL",            category: "S4 Prescription", stockCatalogueId: "s4-07", parQty: 2,  unit: "ampoule" },
  { id: "ci-s4-08", name: "Tranexamic Acid 100mg/mL",         category: "S4 Prescription", stockCatalogueId: "s4-08", parQty: 4,  unit: "ampoule" },
  { id: "ci-s4-09", name: "Dexamethasone 4mg/mL",             category: "S4 Prescription", stockCatalogueId: "s4-09", parQty: 4,  unit: "ampoule" },
  // IV Fluids
  { id: "ci-iv-01", name: "Normal Saline 0.9% 1000mL",       category: "IV Fluid",        stockCatalogueId: "iv-01", parQty: 6,  unit: "bag" },
  { id: "ci-iv-02", name: "Hartmann's Solution 1000mL",      category: "IV Fluid",        stockCatalogueId: "iv-02", parQty: 6,  unit: "bag" },
  { id: "ci-iv-03", name: "Normal Saline 0.9% 500mL",        category: "IV Fluid",        stockCatalogueId: "iv-03", parQty: 6,  unit: "bag" },
  // Consumables
  { id: "ci-cn-01", name: "Defibrillator Pads (ZOLL adult)", category: "Consumable",      stockCatalogueId: "cn-01", parQty: 2,  unit: "set" },
  { id: "ci-cn-02", name: "Intubation Kit (disposable)",     category: "Consumable",      stockCatalogueId: "cn-03", parQty: 2,  unit: "kit" },
  { id: "ci-cn-03", name: "IV Cannula 18g",                  category: "Consumable",      stockCatalogueId: "cn-05", parQty: 20, unit: "each" },
  { id: "ci-cn-04", name: "IV Cannula 20g",                  category: "Consumable",      stockCatalogueId: "cn-06", parQty: 20, unit: "each" },
  { id: "ci-cn-05", name: "IV Giving Set",                   category: "Consumable",      stockCatalogueId: "cn-07", parQty: 10, unit: "each" },
  { id: "ci-cn-06", name: "Chest Seal (Bolin vented)",       category: "Consumable",      stockCatalogueId: "cn-10", parQty: 4,  unit: "each" },
  { id: "ci-cn-07", name: "Tourniquet (CAT Gen 7)",          category: "Consumable",      stockCatalogueId: "cn-11", parQty: 2,  unit: "each" },
  { id: "ci-cn-08", name: "ECG Electrodes (10-lead set)",    category: "Consumable",      stockCatalogueId: "cn-13", parQty: 10, unit: "set" },
  { id: "ci-cn-09", name: "Glucometer Strips (Accu-Chek)",   category: "Consumable",      stockCatalogueId: "cn-15", parQty: 50, unit: "strip" },
  { id: "ci-cn-10", name: "iSTAT Cartridge CG8+",            category: "Consumable",      stockCatalogueId: "cn-04", parQty: 10, unit: "cartridge" },
  { id: "ci-cn-11", name: "Urinary Catheter 14Fr Foley",     category: "Consumable",      stockCatalogueId: "cn-14", parQty: 4,  unit: "each" },
  { id: "ci-cn-12", name: "SpO2 Probe (Masimo adult)",       category: "Consumable",      stockCatalogueId: "cn-12", parQty: 2,  unit: "each" },
  { id: "ci-cn-13", name: "NPA 7.0",                         category: "Consumable",      stockCatalogueId: "cn-08", parQty: 4,  unit: "each" },
  { id: "ci-cn-14", name: "Aspirin 300mg",                   category: "S3 Pharmacist",   stockCatalogueId: "s3-01", parQty: 20, unit: "tablet" },
  { id: "ci-cn-15", name: "GTN Spray 400mcg/dose",           category: "S3 Pharmacist",   stockCatalogueId: "s3-02", parQty: 10, unit: "dose" },
];

const CHEST_CAT_COLOR: Record<string, string> = {
  "S8 Controlled":   "bg-red-500/15 text-red-400 border border-red-500/30",
  "S4 Prescription": "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  "S3 Pharmacist":   "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  "IV Fluid":        "bg-green-500/15 text-green-400 border border-green-500/30",
  "Consumable":      "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  "Equipment":       "bg-purple-500/15 text-purple-400 border border-purple-500/30",
};

// ─── Equipment Data ───────────────────────────────────────────────────────────
const EQUIPMENT: Equipment[] = [
  // Monitoring
  { id: "eq01", name: "ZOLL X Series Monitor/Defib", category: "Monitoring", aircraft: "VH-MVW", serial: "XS-441292", lastService: "15 Dec 2025", nextService: "15 Jun 2026", expiryDate: null, daysToService: 10, daysToExpiry: null, status: "warning", notes: "Annual calibration due", icon: <HeartPulse size={15} />, critical: true },
  { id: "eq02", name: "ZOLL X Series Monitor/Defib", category: "Monitoring", aircraft: "VH-MWH", serial: "XS-441293", lastService: "20 Jan 2026", nextService: "20 Jul 2026", expiryDate: null, daysToService: 45, daysToExpiry: null, status: "ok", notes: "Pads replaced Jan 26", icon: <HeartPulse size={15} />, critical: true },
  { id: "eq03", name: "ZOLL X Series Monitor/Defib", category: "Monitoring", aircraft: "VH-XYU", serial: "XS-441301", lastService: "5 Feb 2026", nextService: "5 Aug 2026", expiryDate: null, daysToService: 61, daysToExpiry: null, status: "ok", notes: "", icon: <HeartPulse size={15} />, critical: true },
  { id: "eq04", name: "Masimo Rad-97 SpO2/EtCO2", category: "Monitoring", aircraft: "VH-VPQ", serial: "R97-22041", lastService: "1 Mar 2026", nextService: "1 Sep 2026", expiryDate: null, daysToService: 88, daysToExpiry: null, status: "ok", notes: "", icon: <Activity size={15} />, critical: false },
  { id: "eq05", name: "Nihon Kohden BSM-3562 Monitor", category: "Monitoring", aircraft: "VH-MQD", serial: "NK-35621A", lastService: "10 Dec 2025", nextService: "10 Jun 2026", expiryDate: null, daysToService: 5, daysToExpiry: null, status: "critical", notes: "SERVICE OVERDUE — book immediately", icon: <Activity size={15} />, critical: true },

  // Ventilators
  { id: "eq06", name: "Hamilton T1 Transport Ventilator", category: "Ventilation", aircraft: "VH-MVW", serial: "HT1-88412", lastService: "2 Feb 2026", nextService: "2 Aug 2026", expiryDate: null, daysToService: 58, daysToExpiry: null, status: "ok", notes: "", icon: <Wind size={15} />, critical: true },
  { id: "eq07", name: "Hamilton T1 Transport Ventilator", category: "Ventilation", aircraft: "VH-MWH", serial: "HT1-88413", lastService: "2 Feb 2026", nextService: "2 Aug 2026", expiryDate: null, daysToService: 58, daysToExpiry: null, status: "ok", notes: "", icon: <Wind size={15} />, critical: true },
  { id: "eq08", name: "ResMed Astral 150 Vent", category: "Ventilation", aircraft: "VH-XYU", serial: "AST-150-2290", lastService: "20 Jan 2026", nextService: "20 Jul 2026", expiryDate: null, daysToService: 45, daysToExpiry: null, status: "ok", notes: "", icon: <Wind size={15} />, critical: true },

  // Infusion / Pumps
  { id: "eq09", name: "Baxter Sigma Spectrum IV Pump", category: "Infusion", aircraft: "VH-MVW", serial: "SS-204831", lastService: "15 Jan 2026", nextService: "15 Jul 2026", expiryDate: null, daysToService: 40, daysToExpiry: null, status: "ok", notes: "", icon: <Syringe size={15} />, critical: true },
  { id: "eq10", name: "Baxter Sigma Spectrum IV Pump", category: "Infusion", aircraft: "VH-MWH", serial: "SS-204832", lastService: "15 Jan 2026", nextService: "15 Jul 2026", expiryDate: null, daysToService: 40, daysToExpiry: null, status: "ok", notes: "", icon: <Syringe size={15} />, critical: true },
  { id: "eq11", name: "B.Braun Space Syringe Driver", category: "Infusion", aircraft: "VH-XYU", serial: "BBS-99201", lastService: "20 Apr 2026", nextService: "20 Oct 2026", expiryDate: null, daysToService: 137, daysToExpiry: null, status: "ok", notes: "", icon: <Syringe size={15} />, critical: false },

  // Airway
  { id: "eq12", name: "McGrath MAC Video Laryngoscope", category: "Airway", aircraft: "VH-MVW", serial: "MM-7741A", lastService: "1 Apr 2026", nextService: "1 Oct 2026", expiryDate: null, daysToService: 118, daysToExpiry: null, status: "ok", notes: "", icon: <Stethoscope size={15} />, critical: true },
  { id: "eq13", name: "McGrath MAC Video Laryngoscope", category: "Airway", aircraft: "VH-MWH", serial: "MM-7742A", lastService: "1 Apr 2026", nextService: "1 Oct 2026", expiryDate: null, daysToService: 118, daysToExpiry: null, status: "ok", notes: "", icon: <Stethoscope size={15} />, critical: true },
  { id: "eq14", name: "Suction Unit (Laerdal LSU)", category: "Airway", aircraft: "VH-VPQ", serial: "LSU-4492", lastService: "5 Mar 2026", nextService: "5 Sep 2026", expiryDate: null, daysToService: 92, daysToExpiry: null, status: "ok", notes: "", icon: <Stethoscope size={15} />, critical: false },
  { id: "eq15", name: "Neonatal Incubator (Drager 5400)", category: "Neonatal", aircraft: "VH-MVX", serial: "DR-54001", lastService: "30 Nov 2025", nextService: "30 May 2026", expiryDate: null, daysToService: -6, daysToExpiry: null, status: "overdue", notes: "6 DAYS OVERDUE — ground until serviced", icon: <Thermometer size={15} />, critical: true },

  // Diagnostic
  { id: "eq16", name: "iSTAT Alinity Point-of-Care Analyser", category: "Diagnostic", aircraft: "VH-MVW", serial: "IST-44120", lastService: "10 May 2026", nextService: "10 Nov 2026", expiryDate: null, daysToService: 158, daysToExpiry: null, status: "ok", notes: "", icon: <FlaskConical size={15} />, critical: false },
  { id: "eq17", name: "iSTAT Alinity Point-of-Care Analyser", category: "Diagnostic", aircraft: "VH-MWH", serial: "IST-44121", lastService: "10 May 2026", nextService: "10 Nov 2026", expiryDate: null, daysToService: 158, daysToExpiry: null, status: "ok", notes: "", icon: <FlaskConical size={15} />, critical: false },
  { id: "eq18", name: "Glucometer (Accu-Chek Guide)", category: "Diagnostic", aircraft: "ALL", serial: "ACG-FLEET", lastService: "1 Jun 2026", nextService: "1 Dec 2026", expiryDate: null, daysToService: 179, daysToExpiry: null, status: "ok", notes: "Test strips — check daily expiry", icon: <FlaskConical size={15} />, critical: false },

  // COMM / Comms
  { id: "eq19", name: "RFDS Medical Radio (Codan)", category: "Communications", aircraft: "VH-MVW", serial: "COD-MT9222", lastService: "20 Mar 2026", nextService: "20 Sep 2026", expiryDate: null, daysToService: 107, daysToExpiry: null, status: "ok", notes: "", icon: <Radio size={15} />, critical: false },

  // Consumable kits with expiry
  { id: "eq20", name: "Intubation Kit (disposable)", category: "Consumables", aircraft: "VH-MVW", serial: "—", lastService: "—", nextService: "—", expiryDate: "30 Sep 2026", daysToService: 0, daysToExpiry: 117, status: "ok", notes: "Check seal integrity", icon: <Package size={15} />, critical: true },
  { id: "eq21", name: "Defibrillator Pads (ZOLL adult)", category: "Consumables", aircraft: "VH-MVW", serial: "—", lastService: "—", nextService: "—", expiryDate: "31 Jul 2026", daysToService: 0, daysToExpiry: 26, status: "warning", notes: "Reorder in progress", icon: <Package size={15} />, critical: true },
  { id: "eq22", name: "Defibrillator Pads (ZOLL paediatric)", category: "Consumables", aircraft: "VH-MVW", serial: "—", lastService: "—", nextService: "—", expiryDate: "31 Aug 2026", daysToService: 0, daysToExpiry: 57, status: "ok", notes: "", icon: <Package size={15} />, critical: true },
  { id: "eq23", name: "iSTAT Cartridges (CG8+)", category: "Consumables", aircraft: "ALL", serial: "—", lastService: "—", nextService: "—", expiryDate: "30 Jun 2026", daysToService: 0, daysToExpiry: 25, status: "warning", notes: "Current batch 4C-9921 — order next batch", icon: <Package size={15} />, critical: false },
];

// ─── Drug Data ────────────────────────────────────────────────────────────────
const DRUGS: DrugItem[] = [
  // Analgesics
  { id: "dr01", name: "Morphine Sulphate", category: "Analgesics", concentration: "10 mg/mL", qty: 8, minQty: 10, unit: "ampoules", expiryDate: "30 Jun 2026", daysToExpiry: 25, batchNo: "MOR-2506A", storage: "Controlled Drug Safe", schedule: "S8", status: "low", usedToday: 2, reorderQty: 10 },
  { id: "dr02", name: "Fentanyl", category: "Analgesics", concentration: "50 mcg/mL", qty: 5, minQty: 5, unit: "ampoules", expiryDate: "30 Sep 2026", daysToExpiry: 117, batchNo: "FEN-2509B", storage: "Controlled Drug Safe", schedule: "S8", status: "low", usedToday: 1, reorderQty: 10 },
  { id: "dr03", name: "Ketamine", category: "Analgesics", concentration: "200 mg/mL", qty: 6, minQty: 4, unit: "vials", expiryDate: "31 Dec 2026", daysToExpiry: 209, batchNo: "KET-2512A", storage: "Controlled Drug Safe", schedule: "S8", status: "stocked", usedToday: 0, reorderQty: 5 },
  { id: "dr04", name: "Paracetamol IV", category: "Analgesics", concentration: "10 mg/mL", qty: 6, minQty: 4, unit: "bags (100mL)", expiryDate: "31 Aug 2026", daysToExpiry: 87, batchNo: "PAR-2508C", storage: "Drug Fridge 2–8°C", schedule: "S4", status: "stocked", usedToday: 1, reorderQty: 6 },

  // Cardiovascular
  { id: "dr05", name: "Adrenaline (Epinephrine)", category: "Cardiovascular", concentration: "1 mg/mL", qty: 12, minQty: 10, unit: "ampoules", expiryDate: "31 Oct 2026", daysToExpiry: 148, batchNo: "ADR-2510A", storage: "Ambient (away from light)", schedule: "S4", status: "stocked", usedToday: 0, reorderQty: 10 },
  { id: "dr06", name: "Amiodarone", category: "Cardiovascular", concentration: "50 mg/mL", qty: 4, minQty: 4, unit: "ampoules", expiryDate: "30 Jun 2026", daysToExpiry: 25, batchNo: "AMI-2506B", storage: "Ambient (away from light)", schedule: "S4", status: "low", usedToday: 0, reorderQty: 6 },
  { id: "dr07", name: "Atropine", category: "Cardiovascular", concentration: "0.6 mg/mL", qty: 10, minQty: 6, unit: "ampoules", expiryDate: "30 Sep 2026", daysToExpiry: 117, batchNo: "ATR-2509A", storage: "Ambient", schedule: "S4", status: "stocked", usedToday: 0, reorderQty: 0 },
  { id: "dr08", name: "Noradrenaline", category: "Cardiovascular", concentration: "1 mg/mL", qty: 3, minQty: 4, unit: "ampoules", expiryDate: "31 Jul 2026", daysToExpiry: 56, batchNo: "NOR-2507A", storage: "Drug Fridge 2–8°C", schedule: "S4", status: "low", usedToday: 1, reorderQty: 6 },

  // Anaesthetics / RSI
  { id: "dr09", name: "Propofol", category: "Anaesthetics", concentration: "10 mg/mL", qty: 4, minQty: 4, unit: "vials (50mL)", expiryDate: "31 Jul 2026", daysToExpiry: 56, batchNo: "PRO-2507C", storage: "Drug Fridge 2–8°C", schedule: "S4", status: "low", usedToday: 0, reorderQty: 4 },
  { id: "dr10", name: "Midazolam", category: "Anaesthetics", concentration: "5 mg/mL", qty: 8, minQty: 6, unit: "ampoules", expiryDate: "28 Feb 2027", daysToExpiry: 269, batchNo: "MID-2702A", storage: "Controlled Drug Safe", schedule: "S8", status: "stocked", usedToday: 0, reorderQty: 0 },
  { id: "dr11", name: "Suxamethonium", category: "Anaesthetics", concentration: "50 mg/mL", qty: 6, minQty: 4, unit: "ampoules", expiryDate: "30 Nov 2026", daysToExpiry: 178, batchNo: "SUX-2511A", storage: "Drug Fridge 2–8°C", schedule: "S4", status: "stocked", usedToday: 0, reorderQty: 0 },
  { id: "dr12", name: "Rocuronium", category: "Anaesthetics", concentration: "10 mg/mL", qty: 4, minQty: 4, unit: "vials (5mL)", expiryDate: "31 Aug 2026", daysToExpiry: 87, batchNo: "ROC-2508A", storage: "Drug Fridge 2–8°C", schedule: "S4", status: "stocked", usedToday: 0, reorderQty: 0 },

  // Respiratory
  { id: "dr13", name: "Salbutamol (Nebuliser)", category: "Respiratory", concentration: "2.5 mg/2.5mL", qty: 10, minQty: 6, unit: "nebules", expiryDate: "30 Oct 2026", daysToExpiry: 147, batchNo: "SAL-2510B", storage: "Ambient", schedule: "S3", status: "stocked", usedToday: 0, reorderQty: 0 },
  { id: "dr14", name: "Ipratropium Bromide", category: "Respiratory", concentration: "0.25 mg/mL", qty: 5, minQty: 4, unit: "nebules", expiryDate: "31 Dec 2026", daysToExpiry: 209, batchNo: "IPR-2512A", storage: "Ambient", schedule: "S3", status: "stocked", usedToday: 0, reorderQty: 0 },

  // Anticonvulsants
  { id: "dr15", name: "Diazepam IV", category: "Anticonvulsants", concentration: "5 mg/mL", qty: 6, minQty: 4, unit: "ampoules", expiryDate: "30 Sep 2026", daysToExpiry: 117, batchNo: "DIA-2509B", storage: "Controlled Drug Safe (away from light)", schedule: "S8", status: "stocked", usedToday: 0, reorderQty: 0 },
  { id: "dr16", name: "Levetiracetam IV", category: "Anticonvulsants", concentration: "100 mg/mL", qty: 2, minQty: 2, unit: "vials (10mL)", expiryDate: "30 Jun 2026", daysToExpiry: 25, batchNo: "LEV-2506A", storage: "Ambient", schedule: "S4", status: "expiring", usedToday: 0, reorderQty: 4 },

  // Fluids
  { id: "dr17", name: "Normal Saline 0.9% (500mL)", category: "IV Fluids", concentration: "0.9% NaCl", qty: 10, minQty: 8, unit: "bags", expiryDate: "31 Jan 2027", daysToExpiry: 240, batchNo: "NS-2701A", storage: "Ambient", schedule: "Unscheduled", status: "stocked", usedToday: 2, reorderQty: 0 },
  { id: "dr18", name: "Hartmann's Solution (1000mL)", category: "IV Fluids", concentration: "Compound Sodium Lactate", qty: 4, minQty: 6, unit: "bags", expiryDate: "30 Sep 2026", daysToExpiry: 117, batchNo: "HL-2509A", storage: "Ambient", schedule: "Unscheduled", status: "low", usedToday: 1, reorderQty: 8 },
  { id: "dr19", name: "Glucose 10% (250mL)", category: "IV Fluids", concentration: "10% Dextrose", qty: 4, minQty: 3, unit: "bags", expiryDate: "31 Oct 2026", daysToExpiry: 148, batchNo: "GLU-2510B", storage: "Ambient", schedule: "Unscheduled", status: "stocked", usedToday: 0, reorderQty: 0 },

  // Antiemetics
  { id: "dr20", name: "Ondansetron", category: "Antiemetics", concentration: "2 mg/mL", qty: 8, minQty: 6, unit: "ampoules", expiryDate: "31 Mar 2027", daysToExpiry: 299, batchNo: "OND-2703A", storage: "Ambient (away from light)", schedule: "S4", status: "stocked", usedToday: 0, reorderQty: 0 },

  // Anaphylaxis
  { id: "dr21", name: "Hydrocortisone Sodium Succinate", category: "Anaphylaxis", concentration: "500 mg vial", qty: 4, minQty: 4, unit: "vials (powder)", expiryDate: "30 Jun 2026", daysToExpiry: 25, batchNo: "HC-2506A", storage: "Ambient", schedule: "S4", status: "expiring", usedToday: 0, reorderQty: 6 },
  { id: "dr22", name: "Chlorphenamine (Chlorpheniramine)", category: "Anaphylaxis", concentration: "10 mg/mL", qty: 6, minQty: 4, unit: "ampoules", expiryDate: "31 Dec 2026", daysToExpiry: 209, batchNo: "CHL-2512A", storage: "Ambient", schedule: "S3", status: "stocked", usedToday: 0, reorderQty: 0 },
];

// ─── Blood Products ───────────────────────────────────────────────────────────
const BLOODS: BloodItem[] = [
  { id: "bl01", group: "O Negative", component: "Packed Red Blood Cells", units: 2, minUnits: 2, expiryDate: "12 Jun 2026", daysToExpiry: 7, donorId: "ARCBS-ONeg-2241", storage: "Blood Fridge 1–6°C", status: "low", usedToday: 0 },
  { id: "bl02", group: "A Positive",  component: "Packed Red Blood Cells", units: 2, minUnits: 2, expiryDate: "18 Jun 2026", daysToExpiry: 13, donorId: "ARCBS-APos-4481", storage: "Blood Fridge 1–6°C", status: "stocked", usedToday: 0 },
  { id: "bl03", group: "O Negative", component: "Fresh Frozen Plasma", units: 2, minUnits: 2, expiryDate: "5 Jun 2026", daysToExpiry: 0, donorId: "ARCBS-FFP-1102", storage: "Freezer −18°C", status: "expiring", usedToday: 0 },
  { id: "bl04", group: "AB Positive", component: "Fresh Frozen Plasma", units: 1, minUnits: 2, expiryDate: "20 Jun 2026", daysToExpiry: 15, donorId: "ARCBS-FFP-1108", storage: "Freezer −18°C", status: "low", usedToday: 0 },
  { id: "bl05", group: "O Negative", component: "Platelets", units: 1, minUnits: 1, expiryDate: "8 Jun 2026", daysToExpiry: 3, donorId: "ARCBS-PLT-0881", storage: "Platelet Agitator 20–24°C", status: "expiring", usedToday: 0 },
  { id: "bl06", group: "O Positive",  component: "Packed Red Blood Cells", units: 2, minUnits: 2, expiryDate: "25 Jun 2026", daysToExpiry: 20, donorId: "ARCBS-OPos-3312", storage: "Blood Fridge 1–6°C", status: "stocked", usedToday: 0 },
  { id: "bl07", group: "B Positive",  component: "Cryoprecipitate", units: 1, minUnits: 1, expiryDate: "10 Jun 2026", daysToExpiry: 5, donorId: "ARCBS-CRY-0442", storage: "Freezer −18°C", status: "expiring", usedToday: 0 },
];

// ─── Today's checklist ────────────────────────────────────────────────────────
const CHECKLIST: ChecklistEntry[] = [
  { id: "cl01", time: "05:55", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Daily drug count completed", item: "All S8 medications", qty: "Full count — matched",  note: "All secure in CD safe",        type: "checked"  },
  { id: "cl02", time: "06:10", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Used (mission MED-441)",    item: "Morphine Sulphate",  qty: "2 × 10mg ampoules",    note: "Administered to Pt. Smith J.", type: "used"     },
  { id: "cl03", time: "06:10", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Used (mission MED-441)",    item: "Fentanyl",           qty: "1 × 50mcg ampoule",    note: "Administered to Pt. Smith J.", type: "used"     },
  { id: "cl04", time: "06:15", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Used (mission MED-441)",    item: "Normal Saline 0.9%", qty: "2 × 500mL bags",       note: "IV maintenance",               type: "used"     },
  { id: "cl05", time: "06:45", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Used (mission MED-441)",    item: "Paracetamol IV",     qty: "1 × 100mL bag",        note: "Post-procedure analgesia",     type: "used"     },
  { id: "cl06", time: "07:00", nurse: "RN T. Williams",  aircraft: "VH-MWH", action: "Daily drug count completed", item: "All S8 medications", qty: "Full count — matched",  note: "",                             type: "checked"  },
  { id: "cl07", time: "07:30", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Reorder flagged",           item: "Morphine Sulphate",  qty: "10 ampoules",           note: "Below minimum threshold",      type: "reorder"  },
  { id: "cl08", time: "07:30", nurse: "RN K. Brennan",   aircraft: "VH-MVW", action: "Reorder flagged",           item: "Noradrenaline",      qty: "6 ampoules",            note: "Below minimum threshold",      type: "reorder"  },
  { id: "cl09", time: "08:00", nurse: "RN T. Williams",  aircraft: "VH-MWH", action: "Used (mission MED-447)",    item: "Normal Saline 0.9%", qty: "1 × 500mL bag",        note: "Paediatric transport",         type: "used"     },
  { id: "cl10", time: "08:00", nurse: "RN T. Williams",  aircraft: "VH-MWH", action: "Expiry alert",              item: "Hartmann's Solution", qty: "—",                    note: "4 bags remain; reorder needed", type: "expiry"  },
  { id: "cl11", time: "09:20", nurse: "NUM S. Patel",    aircraft: "ALL",    action: "Blood fridge temp verified", item: "Blood Fridge 1–6°C", qty: "Temp: 3.8°C — OK",     note: "Logged in fridge log",         type: "checked"  },
  { id: "cl12", time: "10:00", nurse: "NUM S. Patel",    aircraft: "ALL",    action: "Expiry alert — ARCBS",       item: "FFP O-Neg",          qty: "2 units expiring today", note: "Contact ARCBS for replacement", type: "expiry"  },
  { id: "cl13", time: "11:30", nurse: "NUM S. Patel",    aircraft: "ALL",    action: "Reorder placed — ARCBS",     item: "O-Neg PRBC",         qty: "2 units ordered",       note: "ETA 14:00 today",              type: "restock"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EQ_CATS = ["All", "Monitoring", "Ventilation", "Infusion", "Airway", "Neonatal", "Diagnostic", "Communications", "Consumables"];
const DRUG_CATS = ["All", "Analgesics", "Cardiovascular", "Anaesthetics", "Respiratory", "Anticonvulsants", "IV Fluids", "Antiemetics", "Anaphylaxis"];
const AIRCRAFT_LIST = [
  "All",
  // B200 series
  "VH-LTQ", "VH-MVW", "VH-MVX", "VH-MWH", "VH-MWK",
  "VH-RFD", "VH-XYJ", "VH-XYO", "VH-XYR", "VH-XYU",
  // B350 series
  "VH-MQD", "VH-MQK", "VH-NAJ", "VH-VPQ",
];

function statusBadge(s: EquipStatus) {
  const map: Record<EquipStatus, string> = {
    ok:       "bg-green-500/15 text-green-400 border border-green-500/30",
    warning:  "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    critical: "bg-red-500/15 text-red-400 border border-red-500/30",
    overdue:  "bg-red-600/20 text-red-300 border border-red-600/40",
  };
  return map[s] || map.ok;
}
function statusLabel(s: EquipStatus) {
  return { ok: "OK", warning: "Due Soon", critical: "Service Due", overdue: "OVERDUE" }[s];
}
function drugStatusBadge(s: DrugStatus) {
  const map: Record<DrugStatus, string> = {
    stocked:  "bg-green-500/15 text-green-400 border border-green-500/30",
    low:      "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    expiring: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    out:      "bg-red-500/15 text-red-400 border border-red-500/30",
    used:     "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  };
  return map[s] || map.stocked;
}
function drugStatusLabel(s: DrugStatus) {
  return { stocked: "Stocked", low: "Low Stock", expiring: "Expiring", out: "Out of Stock", used: "In Use" }[s];
}
function checklistBadge(t: ChecklistEntry["type"]) {
  const map = {
    used:    "bg-blue-500/15 text-blue-400",
    checked: "bg-green-500/15 text-green-400",
    reorder: "bg-amber-500/15 text-amber-400",
    expiry:  "bg-orange-500/15 text-orange-400",
    restock: "bg-cyan-500/15 text-cyan-400",
  };
  return map[t] || "bg-gray-500/15 text-gray-400";
}
function checklistIcon(t: ChecklistEntry["type"]) {
  return {
    used:    <Syringe size={11} />,
    checked: <Check size={11} />,
    reorder: <RefreshCw size={11} />,
    expiry:  <AlertTriangle size={11} />,
    restock: <Plus size={11} />,
  }[t] || <Info size={11} />;
}
function progressColor(pct: number) {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Summary Stats ────────────────────────────────────────────────────────────
const totalEquip   = EQUIPMENT.length;
const equipOk      = EQUIPMENT.filter(e => e.status === "ok").length;
const equipWarning = EQUIPMENT.filter(e => e.status === "warning").length;
const equipCrit    = EQUIPMENT.filter(e => e.status === "critical" || e.status === "overdue").length;
const drugsLow     = DRUGS.filter(d => d.status === "low" || d.status === "out").length;
const drugsExpiring= DRUGS.filter(d => d.status === "expiring").length;
const bloodsAlert  = BLOODS.filter(b => b.status === "expiring" || b.status === "low").length;
const reordersToday= CHECKLIST.filter(c => c.type === "reorder").length;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MedicalEquipment({ role }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "equipment" | "drugs" | "bloods" | "checklist" | "audit" | "chests">("overview");

  // ─ Medical Chest state ──────────────────────────────────────────────────
  const [selectedChestId, setSelectedChestId] = useState<string>(MEDICAL_CHESTS[0].id);
  // chestChecks: { [chestId]: { [itemId]: ChestCheckEntry } }
  const [chestChecks, setChestChecks] = useState<Record<string, Record<string, ChestCheckEntry>>>({});
  const [chestCheckedBy, setChestCheckedBy] = useState<Record<string, string>>({});
  const [chestSentReorder, setChestSentReorder] = useState<Record<string, boolean>>({});
  const [showChestReorderModal, setShowChestReorderModal] = useState(false);
  const [eqCat, setEqCat]       = useState("All");
  const [eqAircraft, setEqAircraft] = useState("All");
  const [eqSearch, setEqSearch] = useState("");
  const [drugCat, setDrugCat]   = useState("All");
  const [drugSearch, setDrugSearch] = useState("");
  // Inline-editable drug expiry + batch overrides — persisted to SQLite
  const [drugEdits, setDrugEdits] = useState<Record<string, { expiryDate?: string; batchNo?: string }>>({});
  const drugEditsLoaded = useRef(false);

  // Load saved drug edits from server on mount
  const { data: savedDrugEdits } = useQuery<Record<string, { expiryDate: string | null; batchNo: string | null }>>(
    { queryKey: ["/api/drug-edits"], staleTime: Infinity }
  );
  useEffect(() => {
    if (savedDrugEdits && !drugEditsLoaded.current) {
      drugEditsLoaded.current = true;
      const hydrated: Record<string, { expiryDate?: string; batchNo?: string }> = {};
      Object.entries(savedDrugEdits).forEach(([id, v]) => {
        hydrated[id] = {
          ...(v.expiryDate ? { expiryDate: v.expiryDate } : {}),
          ...(v.batchNo    ? { batchNo:    v.batchNo    } : {}),
        };
      });
      setDrugEdits(hydrated);
    }
  }, [savedDrugEdits]);

  // Debounced save — fires 800ms after last change for a given drugId
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const saveDrugEdit = useCallback((drugId: string, expiryDate: string | null, batchNo: string | null) => {
    clearTimeout(saveTimers.current[drugId]);
    saveTimers.current[drugId] = setTimeout(() => {
      apiRequest("PUT", `/api/drug-edits/${drugId}`, { expiryDate, batchNo }).catch(console.error);
    }, 800);
  }, []);

  const [showAlertOnly, setShowAlertOnly] = useState(false);
  const [expandedEq, setExpandedEq] = useState<string | null>(null);

  const isNurse          = role === "nurse";
  const isSeniorNurse    = role === "senior_flight_nurse";
  const isOrderingNurse  = role === "ordering_nurse";
  const isDoctor         = role === "doctor";
  const isManager        = role === "senior_management" || role === "dispatcher" || role === "safety";
  const canEdit          = isNurse || isSeniorNurse || isOrderingNurse || isDoctor || isManager;
  const canOrder         = isSeniorNurse || isOrderingNurse || isManager;
  const canSignOff       = isSeniorNurse || isDoctor || isManager;
  const canViewAudit     = isSeniorNurse || isOrderingNurse || isDoctor || isManager || role === "safety";

  // Filtered equipment
  const filteredEq = EQUIPMENT.filter(e => {
    if (eqCat !== "All" && e.category !== eqCat) return false;
    if (eqAircraft !== "All" && e.aircraft !== eqAircraft && e.aircraft !== "ALL") return false;
    if (eqSearch && !e.name.toLowerCase().includes(eqSearch.toLowerCase())) return false;
    if (showAlertOnly && e.status === "ok") return false;
    return true;
  });

  // Filtered drugs
  // Merge drugEdits into DRUGS — recompute daysToExpiry + status from edited date
  function drugDaysToExpiry(isoDate: string): number {
    if (!isoDate) return 999;
    const diff = new Date(isoDate).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  function drugComputedStatus(d: DrugItem, editedExpiry: string): DrugItem["status"] {
    const days = drugDaysToExpiry(editedExpiry);
    if (days <= 0)  return "expiring";   // expired
    if (days <= 30) return "expiring";
    if (d.qty < d.minQty) return "low";
    if (d.qty === 0) return "out";
    return "stocked";
  }
  const resolvedDrugs: DrugItem[] = DRUGS.map(d => {
    const edit = drugEdits[d.id];
    if (!edit) return d;
    const expiry = edit.expiryDate ?? d.expiryDate;
    const days   = drugDaysToExpiry(expiry);
    return {
      ...d,
      expiryDate:   expiry,
      batchNo:      edit.batchNo ?? d.batchNo,
      daysToExpiry: days,
      status:       drugComputedStatus(d, expiry),
    };
  });

  const filteredDrugs = resolvedDrugs.filter(d => {
    if (drugCat !== "All" && d.category !== drugCat) return false;
    if (drugSearch && !d.name.toLowerCase().includes(drugSearch.toLowerCase())) return false;
    if (showAlertOnly && d.status === "stocked") return false;
    return true;
  });

  const TABS = [
    { id: "overview",  label: "Overview",          icon: <BarChart3 size={14} /> },
    { id: "equipment", label: "Equipment",          icon: <Stethoscope size={14} /> },
    { id: "drugs",     label: "Drug Register",      icon: <Pill size={14} /> },
    { id: "bloods",    label: "Blood Products",     icon: <Droplets size={14} /> },
    { id: "checklist", label: "Daily Checklist",    icon: <Clipboard size={14} /> },
    { id: "chests",    label: "Medical Chests",     icon: <Briefcase size={14} /> },
    { id: "audit",     label: "AI Audit",           icon: <Sparkles size={14} /> },
  ];

  // ─── Generate audit PDF ──────────────────────────────────────────────────
  const handleExportAudit = () => {
    const drugAlerts = DRUGS.filter(d => d.status !== "stocked");
    const bloodAlerts = BLOODS.filter(b => b.status !== "stocked");
    const equipAlerts = EQUIPMENT.filter(e => e.status !== "ok");

    const lines: string[] = [
      "RFDS SE SECTION — MEDICAL EQUIPMENT & DRUG AUDIT REPORT",
      `Generated: ${new Date().toLocaleString("en-AU")}`,
      `Prepared by: ${role.toUpperCase()} role — Medivac.ai`,
      "",
      "═══════════════════════════════════════════════════════",
      "SUMMARY",
      `  Total Equipment Items:     ${totalEquip}`,
      `  Equipment OK:              ${equipOk}`,
      `  Equipment Warnings:        ${equipWarning}`,
      `  Equipment Critical/Overdue:${equipCrit}`,
      `  Drug Items Low/Out:        ${drugsLow}`,
      `  Drug Items Expiring:       ${drugsExpiring}`,
      `  Blood Product Alerts:      ${bloodsAlert}`,
      `  Reorders Flagged Today:    ${reordersToday}`,
      "",
      "═══════════════════════════════════════════════════════",
      "EQUIPMENT ALERTS",
      ...equipAlerts.map(e =>
        `  [${e.status.toUpperCase().padEnd(8)}] ${e.name} | ${e.aircraft} | S/N: ${e.serial} | Service: ${e.nextService}${e.notes ? " | " + e.notes : ""}`
      ),
      "",
      "═══════════════════════════════════════════════════════",
      "DRUG ALERTS & REORDERS REQUIRED",
      ...drugAlerts.map(d =>
        `  [${d.status.toUpperCase().padEnd(8)}] ${d.name} ${d.concentration} (Sched ${d.schedule}) | Qty: ${d.qty}/${d.minQty} ${d.unit} | Expiry: ${d.expiryDate} | Batch: ${d.batchNo}${d.reorderQty > 0 ? " | REORDER: " + d.reorderQty : ""}`
      ),
      "",
      "═══════════════════════════════════════════════════════",
      "BLOOD PRODUCT ALERTS",
      ...bloodAlerts.map(b =>
        `  [${b.status.toUpperCase().padEnd(8)}] ${b.group} ${b.component} | ${b.units} unit(s) | Expiry: ${b.expiryDate} | Storage: ${b.storage} | Donor: ${b.donorId}`
      ),
      "",
      "═══════════════════════════════════════════════════════",
      "TODAY'S CHECKLIST LOG",
      ...CHECKLIST.map(c =>
        `  ${c.time}  [${c.type.toUpperCase().padEnd(7)}]  ${c.nurse}  |  ${c.aircraft}  |  ${c.action}  |  ${c.item}  |  ${c.qty}  |  ${c.note}`
      ),
      "",
      "═══════════════════════════════════════════════════════",
      "AI RECOMMENDATIONS",
      "  1. Book VH-MQD (Nihon Kohden BSM-3562) for service — 5 days overdue.",
      "  2. Book VH-MVX (Drager Neonatal Incubator 5400) for service — 6 days overdue. Ground until completed.",
      "  3. Reorder Morphine Sulphate (10 ampoules), Noradrenaline (6 ampoules) — both below minimum.",
      "  4. Replace/discard expiring O-Neg FFP (2 units) — expiry TODAY. Contact ARCBS immediately.",
      "  5. Replace platelets (O-Neg) within 3 days — expiry 8 Jun 2026.",
      "  6. Review Hydrocortisone & Levetiracetam stocks — expiring within 25 days.",
      "  7. ZOLL adult defibrillator pads (VH-MVW) expiring 31 Jul 2026 — reorder in progress, confirm ETA.",
      "  8. iSTAT CG8+ cartridges expiring 30 Jun 2026 — order next batch immediately.",
      "",
      "─────────────────────────────────────────────────────────",
      "This report is generated by Medivac.ai for audit purposes.",
      "For regulatory compliance under CASA Civil Aviation Order 20.11 and AS/NZS ISO 9001:2016.",
    ];

    generatePDF(lines.join("\n"), `RFDS_Medical_Audit_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Medical Equipment & Drug Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-powered service tracking · Drug registers · Blood products · Daily audit
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
            <div className="relative w-2 h-2 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-green-400 live-dot" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-green-400 font-medium">AI Monitor Active</span>
          </div>
          <button
            onClick={handleExportAudit}
            className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
          >
            <Download size={13} />
            Export Audit PDF
          </button>
        </div>
      </div>

      {/* ── Role Access Banner ── */}
      {isSeniorNurse && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
          <ShieldCheck size={15} className="text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-emerald-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Senior Flight Nurse Access</span>
            <span className="text-xs text-emerald-300/70 ml-2">Full read · Equipment sign-off · Drug count verification · Reorder authorisation · Audit export</span>
          </div>
          <span className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full px-2.5 py-1 font-medium">SFN</span>
        </div>
      )}
      {isOrderingNurse && (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex items-center gap-3">
          <Boxes size={15} className="text-teal-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-teal-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Ordering / Stores Nurse Access</span>
            <span className="text-xs text-teal-300/70 ml-2">Drug register · Blood products · Daily reorder list · Checklist logging · Audit export</span>
          </div>
          <span className="text-xs bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-full px-2.5 py-1 font-medium">ON</span>
        </div>
      )}

      {/* ── Alerts Banner ── */}
      {(equipCrit > 0 || bloodsAlert > 0) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-red-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Immediate Action Required
            </div>
            <ul className="mt-1 space-y-0.5 text-xs text-red-300/80">
              {EQUIPMENT.filter(e => e.status === "overdue" || e.status === "critical").map(e => (
                <li key={e.id}>• {e.name} ({e.aircraft}) — {e.notes || "Service required"}</li>
              ))}
              {BLOODS.filter(b => b.status === "expiring" && b.daysToExpiry <= 1).map(b => (
                <li key={b.id}>• {b.group} {b.component} — Expiry: {b.expiryDate}. Contact ARCBS.</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${activeTab === t.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-card border border-card-border text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Equipment OK",       value: equipOk,      icon: <CheckCircle size={16} />, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
              { label: "Service Alerts",     value: equipWarning + equipCrit, icon: <AlertTriangle size={16} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { label: "Drugs Low/Expiring", value: drugsLow + drugsExpiring, icon: <Pill size={16} />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
              { label: "Blood Alerts",       value: bloodsAlert,  icon: <Droplets size={16} />,    color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3`}>
                <div className={`${s.color} mb-1`}>{s.icon}</div>
                <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI Assessment panel */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-cyan-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>AI Daily Assessment — 5 Jun 2026</span>
              <span className="ml-auto text-xs text-muted-foreground">Auto-generated 06:00 AEST</span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p className="text-foreground/80"><span className="text-red-400 font-semibold">⚠ Critical:</span> Drager Neonatal Incubator (VH-MVX) is 6 days overdue for service. Aircraft should be grounded for neonatal transports until service is complete.</p>
              <p className="text-foreground/80"><span className="text-red-400 font-semibold">⚠ Critical:</span> Nihon Kohden BSM-3562 (VH-MQD) — service overdue by 5 days. Book immediately.</p>
              <p className="text-foreground/80"><span className="text-amber-400 font-semibold">◈ Urgent:</span> O-Neg FFP (2 units) expires today. Contact ARCBS Dubbo for emergency replacement before next shift departure.</p>
              <p className="text-foreground/80"><span className="text-amber-400 font-semibold">◈ Urgent:</span> O-Neg Platelets expire 8 Jun (3 days). Monitor patient availability and arrange replacement.</p>
              <p className="text-foreground/80"><span className="text-orange-400 font-semibold">● Reorder:</span> Morphine Sulphate (8 remaining, min 10), Noradrenaline (3 remaining, min 4), Hartmann's Solution (4 bags, min 6). Submit controlled drug requisition today.</p>
              <p className="text-foreground/80"><span className="text-blue-400 font-semibold">ℹ Note:</span> ZOLL X Series (VH-MVW) annual calibration due in 10 days — schedule with biomedical engineering.</p>
              <p className="text-foreground/80"><span className="text-green-400 font-semibold">✓ Clear:</span> All other equipment within service windows. iSTAT analysers functional. Blood fridge temperature normal (3.8°C).</p>
            </div>
          </div>

          {/* Reorder summary */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={14} className="text-amber-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Today's Reorder List</span>
              <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-2 py-0.5">{reordersToday} items</span>
            </div>
            <div className="space-y-2">
              {DRUGS.filter(d => d.status === "low" || d.status === "out" || d.status === "expiring").map(d => (
                <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b border-card-border last:border-0">
                  <div>
                    <span className="text-foreground font-medium">{d.name}</span>
                    <span className="text-muted-foreground ml-2">{d.concentration} · Sched {d.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${drugStatusBadge(d.status)}`}>{drugStatusLabel(d.status)}</span>
                    {d.reorderQty > 0 && <span className="text-amber-400 font-medium">Order {d.reorderQty} {d.unit}</span>}
                    {canOrder && (
                      <button className="text-xs bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded px-2 py-0.5 hover:bg-teal-500/25 transition-colors flex items-center gap-1">
                        <Plus size={10} />Raise Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {BLOODS.filter(b => b.status === "expiring" || b.status === "low").map(b => (
                <div key={b.id} className="flex items-center justify-between text-xs py-1.5 border-b border-card-border last:border-0">
                  <div>
                    <span className="text-foreground font-medium">{b.group} {b.component}</span>
                    <span className="text-muted-foreground ml-2">Expires {b.expiryDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${drugStatusBadge(b.status)}`}>{drugStatusLabel(b.status)}</span>
                    {canOrder && (
                      <button className="text-xs bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded px-2 py-0.5 hover:bg-teal-500/25 transition-colors flex items-center gap-1">
                        <Plus size={10} />Contact ARCBS
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ordering Nurse dedicated work panel */}
          {(isOrderingNurse || isSeniorNurse) && (
            <div className="bg-teal-500/5 border border-teal-500/25 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Boxes size={14} className="text-teal-400" />
                <span className="text-sm font-semibold text-teal-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  {isOrderingNurse ? "Ordering Nurse — Action Queue" : "Senior Flight Nurse — Stores Overview"}
                </span>
                <span className="ml-auto text-xs bg-teal-500/15 text-teal-400 border border-teal-500/30 rounded px-2 py-0.5">
                  {DRUGS.filter(d => d.reorderQty > 0).length + BLOODS.filter(b => b.status !== "stocked").length} items pending
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: "S8 Reorders",    value: DRUGS.filter(d => d.schedule === "S8" && d.status !== "stocked").length, color: "text-red-400",   bg: "bg-red-500/10",   note: "Controlled drug requisition required" },
                  { label: "S4 Reorders",    value: DRUGS.filter(d => d.schedule === "S4" && d.status !== "stocked").length, color: "text-amber-400",bg: "bg-amber-500/10", note: "Standard pharmacy order" },
                  { label: "Blood / ARCBS",  value: BLOODS.filter(b => b.status !== "stocked").length,                      color: "text-rose-400",  bg: "bg-rose-500/10",  note: "Contact ARCBS Dubbo" },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                    <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
                    <div className="text-xs text-foreground font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.note}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Outstanding Actions</div>
                {[
                  { action: "Submit S8 requisition — Morphine Sulphate (10 amp) + Noradrenaline (6 amp)",    by: "Submit to pharmacy before 12:00",  priority: "high",   done: false },
                  { action: "Contact ARCBS Dubbo — Replace O-Neg FFP (2 units, expired today)",              by: "Call 1800 777 203",                priority: "urgent", done: false },
                  { action: "Order O-Neg Platelets replacement — expiry 8 Jun (3 days)",                    by: "Allow 48h lead time from ARCBS",  priority: "high",   done: false },
                  { action: "Confirm ZOLL adult defib pad ETA — reorder placed, verify delivery",            by: "Check with Stores",               priority: "medium", done: false },
                  { action: "Order iSTAT CG8+ cartridges — batch 4C-9921 expires 30 Jun",                   by: "Min 2-week buffer required",      priority: "medium", done: false },
                  { action: "Review Hydrocortisone & Levetiracetam stocks — expiring within 25 days",       by: "Raise S4 pharmacy order",         priority: "medium", done: true  },
                ].map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                    a.done ? "border-green-500/20 bg-green-500/5 opacity-60" :
                    a.priority === "urgent" ? "border-red-500/30 bg-red-500/5" :
                    a.priority === "high"   ? "border-amber-500/25 bg-amber-500/5" :
                    "border-card-border bg-sidebar/50"
                  }`}>
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                      a.done ? "bg-green-500 border-green-500" : "border-muted-foreground"
                    }`}>
                      {a.done && <Check size={10} className="text-black" />}
                    </div>
                    <div className="flex-1">
                      <div className={a.done ? "line-through text-muted-foreground" : "text-foreground"}>{a.action}</div>
                      <div className="text-muted-foreground mt-0.5">{a.by}</div>
                    </div>
                    {!a.done && canSignOff && (
                      <button className="flex-shrink-0 text-xs bg-green-500/15 border border-green-500/25 text-green-400 rounded px-2 py-0.5 hover:bg-green-500/25 transition-colors">
                        Mark Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canSignOff && (
                <div className="mt-4 pt-3 border-t border-teal-500/20 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Senior Flight Nurse sign-off required for S8 requisitions</span>
                  <button className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-emerald-500/25 transition-colors">
                    <ShieldCheck size={13} />
                    SFN Sign-Off & Submit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ EQUIPMENT TAB ══════════════════ */}
      {activeTab === "equipment" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                className="w-full pl-7 pr-3 py-2 text-xs bg-card border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-foreground placeholder-muted-foreground"
                placeholder="Search equipment..."
                value={eqSearch}
                onChange={e => setEqSearch(e.target.value)}
              />
            </div>
            <select value={eqCat} onChange={e => setEqCat(e.target.value)} className="text-xs bg-card border border-card-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none">
              {EQ_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={eqAircraft} onChange={e => setEqAircraft(e.target.value)} className="text-xs bg-card border border-card-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none">
              {AIRCRAFT_LIST.map(a => <option key={a}>{a}</option>)}
            </select>
            <button
              onClick={() => setShowAlertOnly(!showAlertOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${showAlertOnly ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-card border-card-border text-muted-foreground"}`}
            >
              <Filter size={12} />Alerts Only
            </button>
          </div>

          {/* Equipment cards */}
          <div className="space-y-2">
            {filteredEq.map(eq => (
              <div
                key={eq.id}
                className={`bg-card border rounded-xl overflow-hidden transition-all ${eq.status === "overdue" ? "border-red-500/50" : eq.status === "critical" ? "border-red-400/40" : eq.status === "warning" ? "border-amber-400/30" : "border-card-border"}`}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedEq(expandedEq === eq.id ? null : eq.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${eq.status === "overdue" || eq.status === "critical" ? "bg-red-500/15 text-red-400" : eq.status === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                    {eq.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{eq.name}</span>
                      {eq.critical && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">Critical</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{eq.aircraft}</span>
                      <span className="text-xs text-muted-foreground">{eq.category}</span>
                      {eq.serial !== "—" && <span className="text-xs text-muted-foreground">S/N {eq.serial}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(eq.status)}`}>{statusLabel(eq.status)}</span>
                    {expandedEq === eq.id ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </div>
                </div>
                {expandedEq === eq.id && (
                  <div className="border-t border-card-border px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-0.5">Last Service</div>
                      <div className="text-foreground font-medium">{eq.lastService !== "—" ? eq.lastService : "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Next Service</div>
                      <div className={`font-medium ${eq.daysToService <= 0 ? "text-red-400" : eq.daysToService <= 14 ? "text-amber-400" : "text-foreground"}`}>
                        {eq.nextService !== "—" ? `${eq.nextService}${eq.daysToService <= 30 ? ` (${Math.abs(eq.daysToService)} days${eq.daysToService <= 0 ? " overdue" : ""})` : ""}` : "—"}
                      </div>
                    </div>
                    {eq.expiryDate && (
                      <div>
                        <div className="text-muted-foreground mb-0.5">Expiry Date</div>
                        <div className={`font-medium ${(eq.daysToExpiry ?? 999) <= 30 ? "text-amber-400" : "text-foreground"}`}>{eq.expiryDate}</div>
                      </div>
                    )}
                    {eq.notes && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-0.5">Notes</div>
                        <div className={`font-medium ${eq.status === "overdue" || eq.status === "critical" ? "text-red-400" : "text-foreground"}`}>{eq.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filteredEq.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">No equipment matches your filters.</div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ DRUG REGISTER TAB ══════════════════ */}
      {activeTab === "drugs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                className="w-full pl-7 pr-3 py-2 text-xs bg-card border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-foreground placeholder-muted-foreground"
                placeholder="Search drugs..."
                value={drugSearch}
                onChange={e => setDrugSearch(e.target.value)}
              />
            </div>
            <select value={drugCat} onChange={e => setDrugCat(e.target.value)} className="text-xs bg-card border border-card-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none">
              {DRUG_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={() => setShowAlertOnly(!showAlertOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${showAlertOnly ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-card border-card-border text-muted-foreground"}`}
            >
              <Filter size={12} />Alerts Only
            </button>
          </div>

          {/* Expiring drugs alert banner */}
          {(() => {
            const expiring = resolvedDrugs.filter(d => d.daysToExpiry <= 90);
            if (expiring.length === 0) return null;
            const hasExpired  = expiring.some(d => d.daysToExpiry <= 0);
            const hasCritical = expiring.some(d => d.daysToExpiry > 0 && d.daysToExpiry <= 30);
            return (
              <div className={`rounded-xl border p-3 ${
                hasExpired  ? "bg-red-500/10 border-red-500/30" :
                hasCritical ? "bg-red-500/8 border-red-500/25" :
                              "bg-amber-500/10 border-amber-500/30"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className={hasExpired || hasCritical ? "text-red-400" : "text-amber-400"} />
                  <span className={`text-xs font-semibold ${hasExpired || hasCritical ? "text-red-300" : "text-amber-400"}`}
                    style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    {expiring.length} drug{expiring.length > 1 ? "s" : ""} expiring within 90 days
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {expiring.sort((a,b) => a.daysToExpiry - b.daysToExpiry).map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        d.daysToExpiry <= 0  ? "bg-red-500/20 text-red-300" :
                        d.daysToExpiry <= 30 ? "bg-red-500/15 text-red-400" :
                                               "bg-amber-500/15 text-amber-300"
                      }`}>
                        {d.daysToExpiry <= 0 ? "EXPIRED" : `${d.daysToExpiry}d`}
                      </span>
                      <span className="font-medium text-foreground/80 truncate">{d.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-auto">{d.expiryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* S8 Controlled Drugs banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
            <Lock size={14} className="text-amber-400 flex-shrink-0" />
            <div className="text-xs text-amber-300/90">
              <span className="font-semibold">Schedule 8 Controlled Drugs</span> — Morphine, Fentanyl, Ketamine, Midazolam, Diazepam. Dual-nurse count required before each shift departure. All discrepancies must be reported to the NUM and AHPRA within 24 hours.
            </div>
          </div>

          {/* Drug table */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    {["Drug / Concentration", "Category", "Sched", "Stock", "Expiry", "Batch", "Storage", "Status"].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-medium px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDrugs.map((d, i) => (
                    <tr key={d.id} className={`border-b border-card-border last:border-0 ${i % 2 === 0 ? "" : "bg-sidebar/40"}`}>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-muted-foreground">{d.concentration}</div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{d.category}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-bold ${d.schedule === "S8" ? "text-red-400" : d.schedule === "S4" ? "text-amber-400" : "text-muted-foreground"}`}>{d.schedule}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-sidebar rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${progressColor(d.qty / d.minQty * 100)}`} style={{ width: `${Math.min(100, d.qty / (d.minQty * 2) * 100)}%` }} />
                          </div>
                          <span className={d.qty < d.minQty ? "text-amber-400 font-medium" : "text-foreground"}>{d.qty}/{d.minQty} {d.unit}</span>
                        </div>
                        {d.usedToday > 0 && <div className="text-blue-400 mt-0.5">Used today: {d.usedToday}</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          <input
                            type="date"
                            value={d.expiryDate ? (() => { try { return new Date(d.expiryDate).toISOString().split('T')[0]; } catch { return ""; } })() : ""}
                            onChange={e => { const v = e.target.value; setDrugEdits(prev => { const cur = prev[d.id] ?? {}; saveDrugEdit(d.id, v || null, cur.batchNo ?? null); return { ...prev, [d.id]: { ...cur, expiryDate: v } }; }); }}
                            className={`w-30 bg-background/50 border rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none shrink-0 ${
                              d.daysToExpiry <= 0  ? "border-red-500/50 text-red-400 focus:border-red-400" :
                              d.daysToExpiry <= 30 ? "border-red-500/30 text-red-400 focus:border-red-400" :
                              d.daysToExpiry <= 90 ? "border-amber-500/30 text-amber-400 focus:border-amber-400" :
                              "border-card-border text-foreground focus:border-cyan-400/40"
                            }`}
                          />
                          {d.daysToExpiry <= 90 && (
                            <span className={`text-[10px] font-semibold ${
                              d.daysToExpiry <= 0  ? "text-red-400" :
                              d.daysToExpiry <= 30 ? "text-red-400" :
                              "text-amber-400"
                            }`}>
                              {d.daysToExpiry <= 0 ? "EXPIRED" : `${d.daysToExpiry}d`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={d.batchNo}
                          onChange={e => { const v = e.target.value; setDrugEdits(prev => { const cur = prev[d.id] ?? {}; saveDrugEdit(d.id, cur.expiryDate ?? null, v || null); return { ...prev, [d.id]: { ...cur, batchNo: v } }; }); }}
                          className="w-28 bg-background/50 border border-card-border rounded-md px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground focus:outline-none focus:border-cyan-400/40"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{d.storage}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${drugStatusBadge(d.status)}`}>{drugStatusLabel(d.status)}</span>
                          {d.reorderQty > 0 && <span className="text-xs text-amber-400">Reorder {d.reorderQty}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-card-border">
              {filteredDrugs.map(d => (
                <div key={d.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-foreground text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.concentration} · {d.category}</div>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${drugStatusBadge(d.status)}`}>{drugStatusLabel(d.status)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Stock: </span><span className={d.qty < d.minQty ? "text-amber-400 font-medium" : "text-foreground"}>{d.qty}/{d.minQty} {d.unit}</span></div>
                    <div><span className="text-muted-foreground">Sched: </span><span className={`font-bold ${d.schedule === "S8" ? "text-red-400" : "text-amber-400"}`}>{d.schedule}</span></div>
                    <div className="col-span-2 flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">Expiry:</span>
                      <input
                        type="date"
                        value={d.expiryDate ? (() => { try { return new Date(d.expiryDate).toISOString().split('T')[0]; } catch { return ""; } })() : ""}
                        onChange={e => { const v = e.target.value; setDrugEdits(prev => { const cur = prev[d.id] ?? {}; saveDrugEdit(d.id, v || null, cur.batchNo ?? null); return { ...prev, [d.id]: { ...cur, expiryDate: v } }; }); }}
                        className={`bg-background/50 border rounded px-1.5 py-0.5 text-[11px] focus:outline-none ${
                          d.daysToExpiry <= 0  ? "border-red-500/40 text-red-400" :
                          d.daysToExpiry <= 30 ? "border-red-500/30 text-red-400" :
                          d.daysToExpiry <= 90 ? "border-amber-500/30 text-amber-400" :
                          "border-card-border text-foreground"
                        }`}
                      />
                      {d.daysToExpiry <= 90 && (
                        <span className={`text-[10px] font-bold ${
                          d.daysToExpiry <= 0 ? "text-red-400" :
                          d.daysToExpiry <= 30 ? "text-red-400" : "text-amber-400"
                        }`}>{d.daysToExpiry <= 0 ? "EXPIRED" : `${d.daysToExpiry}d`}</span>
                      )}
                    </div>
                    <div><span className="text-muted-foreground">Batch:</span>
                      <input
                        type="text"
                        value={d.batchNo}
                        onChange={e => { const v = e.target.value; setDrugEdits(prev => { const cur = prev[d.id] ?? {}; saveDrugEdit(d.id, cur.expiryDate ?? null, v || null); return { ...prev, [d.id]: { ...cur, batchNo: v } }; }); }}
                        className="ml-1 bg-background/50 border border-card-border rounded px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground focus:outline-none focus:border-cyan-400/40 w-24"
                      />
                    </div>
                    <div><span className="text-muted-foreground">Storage: </span><span className="text-foreground">{d.storage}</span></div>
                    {d.usedToday > 0 && <div className="col-span-2 text-blue-400">Used today: {d.usedToday}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ BLOOD PRODUCTS TAB ══════════════════ */}
      {activeTab === "bloods" && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-red-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Blood Product Register</span>
              <span className="ml-auto text-xs text-muted-foreground">Fridge Temp: <span className="text-green-400 font-medium">3.8°C ✓</span></span>
            </div>

            {/* ARCBS compliance note */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 mb-4 text-xs text-red-300/90">
              <span className="font-semibold">ARCBS / NBA Compliance:</span> All blood products supplied under National Blood Authority arrangements. Cold chain integrity must be maintained. Irradiation/CMV status documented on issue slip. Discard expired units per ANZSBT guidelines.
            </div>

            {/* Blood table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    {["Blood Group", "Component", "Units", "Expiry", "Days Left", "Donor ID", "Storage", "Status"].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-medium px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BLOODS.map((b, i) => (
                    <tr key={b.id} className={`border-b border-card-border last:border-0 ${i % 2 === 0 ? "" : "bg-sidebar/40"}`}>
                      <td className="px-3 py-2.5 font-semibold text-foreground">{b.group}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{b.component}</td>
                      <td className="px-3 py-2.5">
                        <span className={b.units < b.minUnits ? "text-amber-400 font-medium" : "text-foreground"}>{b.units}</span>
                        <span className="text-muted-foreground"> / {b.minUnits} min</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={b.daysToExpiry <= 3 ? "text-red-400 font-medium" : b.daysToExpiry <= 14 ? "text-amber-400" : "text-foreground"}>{b.expiryDate}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={b.daysToExpiry <= 0 ? "text-red-400 font-bold" : b.daysToExpiry <= 3 ? "text-red-400 font-medium" : b.daysToExpiry <= 7 ? "text-amber-400" : "text-foreground"}>
                          {b.daysToExpiry <= 0 ? "EXPIRED" : `${b.daysToExpiry}d`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono">{b.donorId}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{b.storage}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${drugStatusBadge(b.status)}`}>{drugStatusLabel(b.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile blood cards */}
            <div className="sm:hidden space-y-2">
              {BLOODS.map(b => (
                <div key={b.id} className={`border rounded-xl p-3 ${b.status === "expiring" ? "border-orange-500/40 bg-orange-500/5" : b.status === "low" ? "border-amber-500/40 bg-amber-500/5" : "border-card-border"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{b.group}</span>
                      <span className="text-xs text-muted-foreground ml-2">{b.component}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${drugStatusBadge(b.status)}`}>{drugStatusLabel(b.status)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div><span className="text-muted-foreground">Units: </span><span className={b.units < b.minUnits ? "text-amber-400 font-medium" : "text-foreground"}>{b.units} / {b.minUnits} min</span></div>
                    <div><span className="text-muted-foreground">Expires: </span><span className={b.daysToExpiry <= 3 ? "text-red-400 font-medium" : "text-foreground"}>{b.expiryDate} ({b.daysToExpiry}d)</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Storage: </span><span className="text-foreground">{b.storage}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blood usage today */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Today's Usage</span>
            </div>
            {BLOODS.every(b => b.usedToday === 0)
              ? <p className="text-xs text-muted-foreground">No blood products used today. All units accounted for.</p>
              : BLOODS.filter(b => b.usedToday > 0).map(b => (
                  <div key={b.id} className="text-xs py-1.5 border-b border-card-border last:border-0 flex justify-between">
                    <span className="text-foreground">{b.group} {b.component}</span>
                    <span className="text-blue-400">Used: {b.usedToday} unit(s)</span>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ══════════════════ DAILY CHECKLIST TAB ══════════════════ */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          {/* Header stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "Checks Done",  value: CHECKLIST.filter(c => c.type === "checked").length,  color: "text-green-400",  bg: "bg-green-500/10" },
              { label: "Items Used",   value: CHECKLIST.filter(c => c.type === "used").length,     color: "text-blue-400",   bg: "bg-blue-500/10" },
              { label: "Reorders",     value: CHECKLIST.filter(c => c.type === "reorder").length,  color: "text-amber-400",  bg: "bg-amber-500/10" },
              { label: "Expiry Flags", value: CHECKLIST.filter(c => c.type === "expiry").length,   color: "text-orange-400", bg: "bg-orange-500/10" },
              { label: "Restocks",     value: CHECKLIST.filter(c => c.type === "restock").length,  color: "text-cyan-400",   bg: "bg-cyan-500/10" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard size={14} className="text-cyan-400" />
                <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Daily Medication & Equipment Checklist — 5 Jun 2026</span>
              </div>
              <button
                onClick={handleExportAudit}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Download size={12} />Export
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-sidebar/50">
                    {["Time", "Nurse / NUM", "Aircraft", "Action", "Item", "Qty / Detail", "Note", "Type"].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-medium px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHECKLIST.map((c, i) => (
                    <tr key={c.id} className={`border-b border-card-border last:border-0 ${i % 2 === 0 ? "" : "bg-sidebar/30"}`}>
                      <td className="px-3 py-2.5 text-cyan-400 font-medium font-mono">{c.time}</td>
                      <td className="px-3 py-2.5 text-foreground">{c.nurse}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.aircraft}</td>
                      <td className="px-3 py-2.5 text-foreground">{c.action}</td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{c.item}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.qty}</td>
                      <td className="px-3 py-2.5 text-muted-foreground italic">{c.note}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${checklistBadge(c.type)}`}>
                          {checklistIcon(c.type)}{c.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile checklist cards */}
            <div className="sm:hidden divide-y divide-card-border">
              {CHECKLIST.map(c => (
                <div key={c.id} className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-mono text-xs font-medium">{c.time}</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${checklistBadge(c.type)}`}>
                      {checklistIcon(c.type)}{c.type}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{c.item}</div>
                  <div className="text-xs text-muted-foreground">{c.action}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-muted-foreground">{c.nurse}</span>
                    <span className="text-muted-foreground">· {c.aircraft}</span>
                    {c.qty && <span className="text-foreground">· {c.qty}</span>}
                  </div>
                  {c.note && <div className="text-xs text-muted-foreground italic">{c.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ AI AUDIT TAB ══════════════════ */}
      {/* ══════════════════ MEDICAL CHESTS TAB ══════════════════ */}
      {activeTab === "chests" && (() => {
        const chest = MEDICAL_CHESTS.find(c => c.id === selectedChestId)!;
        const checks = chestChecks[selectedChestId] ?? {};

        // items that need reorder: flagged or used > 0
        const reorderItems = CHEST_ITEMS.filter(item => {
          const c = checks[item.id];
          return c && (c.flagReorder || c.used > 0);
        });

        // helper — get or create a check entry for an item
        function getCheck(itemId: string): ChestCheckEntry {
          return checks[itemId] ?? {
            chestId: selectedChestId,
            itemId,
            qtyPresent: CHEST_ITEMS.find(i => i.id === itemId)!.parQty,
            used: 0,
            note: "",
            flagReorder: false,
            expiryDate: "",
          };
        }

        function setExpiryDate(itemId: string, date: string) {
          const c = getCheck(itemId);
          // auto-flag for reorder if expiring within 90 days
          const es = expiryStatus(date);
          const shouldFlag = es === "expired" || es === "critical" || es === "soon";
          setChestChecks(prev => ({
            ...prev,
            [selectedChestId]: {
              ...(prev[selectedChestId] ?? {}),
              [itemId]: { ...c, expiryDate: date, flagReorder: c.flagReorder || shouldFlag },
            },
          }));
        }

        // items expiring within 90 days or already expired (with a date set)
        const expiringItems = CHEST_ITEMS.filter(item => {
          const c = checks[item.id];
          if (!c?.expiryDate) return false;
          const es = expiryStatus(c.expiryDate);
          return es === "expired" || es === "critical" || es === "soon";
        });

        function setQtyPresent(itemId: string, val: number) {
          const item = CHEST_ITEMS.find(i => i.id === itemId)!;
          const used = Math.max(0, item.parQty - val);
          setChestChecks(prev => ({
            ...prev,
            [selectedChestId]: {
              ...(prev[selectedChestId] ?? {}),
              [itemId]: { ...getCheck(itemId), qtyPresent: val, used, flagReorder: used > 0 },
            },
          }));
        }

        function toggleReorder(itemId: string) {
          const c = getCheck(itemId);
          setChestChecks(prev => ({
            ...prev,
            [selectedChestId]: {
              ...(prev[selectedChestId] ?? {}),
              [itemId]: { ...c, flagReorder: !c.flagReorder },
            },
          }));
        }

        function setNote(itemId: string, note: string) {
          const c = getCheck(itemId);
          setChestChecks(prev => ({
            ...prev,
            [selectedChestId]: {
              ...(prev[selectedChestId] ?? {}),
              [itemId]: { ...c, note },
            },
          }));
        }

        function markComplete() {
          const name = chestCheckedBy[selectedChestId]?.trim();
          if (!name) { alert("Enter your name before marking complete."); return; }
          // push reorder items to localStorage for StockUsage to read
          if (reorderItems.length > 0) {
            const existing: { stockId: string; qty: number; note: string }[] =
              JSON.parse(localStorage.getItem("medivac_chest_reorders") ?? "[]");
            const merged = [...existing];
            reorderItems.forEach(item => {
              if (!item.stockCatalogueId) return;
              const entry = checks[item.id];
              const idx = merged.findIndex(e => e.stockId === item.stockCatalogueId);
              if (idx >= 0) {
                merged[idx].qty = Math.max(merged[idx].qty, entry.used);
              } else {
                merged.push({ stockId: item.stockCatalogueId, qty: entry.used, note: entry.note || `Chest restock — ${chest.name}` });
              }
            });
            localStorage.setItem("medivac_chest_reorders", JSON.stringify(merged));
          }
          setChestSentReorder(prev => ({ ...prev, [selectedChestId]: true }));
        }

        // group items by category
        const categories = Array.from(new Set(CHEST_ITEMS.map(i => i.category)));

        return (
          <div className="space-y-5">

            {/* Banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-cyan-500/20" style={{ background: "rgba(6,182,212,0.04)" }}>
              <Briefcase size={14} className="text-cyan-400 shrink-0" />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-cyan-400">Station Medical Chests</span>
                <span className="text-muted-foreground ml-1.5">— Select a chest, record qty present, flag used items, and push automatically to the reorder queue.</span>
              </div>
            </div>

            {/* Chest selector */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {MEDICAL_CHESTS.map(ch => {
                const isSelected = ch.id === selectedChestId;
                const chChecks = chestChecks[ch.id] ?? {};
                const usedCount = CHEST_ITEMS.filter(i => (chChecks[i.id]?.used ?? 0) > 0).length;
                const sent = chestSentReorder[ch.id];
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChestId(ch.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected ? "bg-cyan-500/10 border-cyan-400/40" : "bg-card border-card-border hover:border-cyan-400/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="text-xs font-bold leading-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{ch.name}</div>
                      {sent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold shrink-0">Reorder Sent</span>}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin size={9} /> {ch.station}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{ch.location}</div>
                    {ch.lastChecked && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Last checked: {new Date(ch.lastChecked).toLocaleDateString("en-AU")} · {ch.checkedBy}
                      </div>
                    )}
                    {usedCount > 0 && (
                      <div className="mt-1.5 text-[10px] text-amber-400 font-semibold">{usedCount} item{usedCount > 1 ? "s" : ""} used</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected chest detail */}
            <div className="bg-card rounded-xl border border-cyan-500/30 overflow-hidden">
              <div className="px-5 py-4 border-b border-card-border flex items-center justify-between flex-wrap gap-3" style={{ background: "rgba(6,182,212,0.03)" }}>
                <div>
                  <div className="text-base font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    <Briefcase size={15} className="text-cyan-400" /> {chest.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <MapPin size={10} className="inline mr-1" />{chest.location}
                    {chest.lastChecked && ` · Last checked ${new Date(chest.lastChecked).toLocaleDateString("en-AU")} by ${chest.checkedBy}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Your name / role"
                    value={chestCheckedBy[selectedChestId] ?? ""}
                    onChange={e => setChestCheckedBy(prev => ({ ...prev, [selectedChestId]: e.target.value }))}
                    className="bg-background/50 border border-card-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400/50 w-48"
                  />
                  {reorderItems.length > 0 && !chestSentReorder[selectedChestId] && (
                    <button
                      onClick={() => setShowChestReorderModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 hover:bg-amber-500/20 transition-colors font-semibold"
                    >
                      <ShoppingCart size={12} /> Reorder ({reorderItems.length})
                    </button>
                  )}
                  {chestSentReorder[selectedChestId] && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 font-semibold">
                      <CheckCircle size={12} /> Reorder queued
                    </span>
                  )}
                </div>
              </div>

              {/* KPI bar */}
              <div className="px-5 py-3 border-b border-card-border bg-muted/10 flex flex-wrap gap-6 text-xs">
                <div><span className="text-muted-foreground">Items</span> <span className="font-bold ml-1">{CHEST_ITEMS.length}</span></div>
                <div><span className="text-muted-foreground">Used / low</span> <span className={`font-bold ml-1 ${reorderItems.length > 0 ? "text-amber-400" : "text-green-400"}`}>{reorderItems.length}</span></div>
                <div><span className="text-muted-foreground">Expiring</span> <span className={`font-bold ml-1 ${expiringItems.length > 0 ? "text-red-400" : "text-muted-foreground"}`}>{expiringItems.length}</span></div>
                <div><span className="text-muted-foreground">Checked</span> <span className="font-bold ml-1">{Object.keys(checks).length} of {CHEST_ITEMS.length}</span></div>
              </div>

              {/* Item checklist by category */}
              <div className="divide-y divide-card-border">
                {categories.map(cat => {
                  const catItems = CHEST_ITEMS.filter(i => i.category === cat);
                  return (
                    <div key={cat}>
                      <div className="px-5 py-2 bg-muted/10 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CHEST_CAT_COLOR[cat]}`}>{cat}</span>
                        {cat === "S8 Controlled" && (
                          <span className="text-[10px] text-red-400 font-semibold">Dual count required — witness signature</span>
                        )}
                      </div>
                      <div className="divide-y divide-border">
                        {catItems.map(item => {
                          const c = getCheck(item.id);
                          const usedQty = c.used;
                          const isLow = usedQty > 0 || c.flagReorder;
                          return (
                            <div key={item.id} className={`px-5 py-3 flex items-center gap-3 flex-wrap ${
                              isLow ? "bg-amber-500/5" : ""
                            }`}>
                              {/* Reorder toggle */}
                              <button
                                onClick={() => toggleReorder(item.id)}
                                title={c.flagReorder ? "Remove from reorder" : "Flag for reorder"}
                                className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  c.flagReorder
                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                                    : "bg-background/50 border-card-border text-transparent hover:border-amber-400/40"
                                }`}
                              >
                                <ShoppingCart size={10} />
                              </button>

                              {/* Name */}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold">{item.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  Par: {item.parQty} {item.unit}{item.parQty > 1 ? "s" : ""}
                                  {item.storageNote && <span className="ml-2 text-amber-400/80">⚠️ {item.storageNote}</span>}
                                </div>
                              </div>

                              {/* Qty present input */}
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-[10px] text-muted-foreground">Qty on hand</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={item.parQty}
                                  value={c.qtyPresent}
                                  onChange={e => setQtyPresent(item.id, parseInt(e.target.value) || 0)}
                                  className={`w-16 bg-background/50 border rounded-lg px-2 py-1 text-xs text-center focus:outline-none ${
                                    usedQty > 0 ? "border-amber-500/50 text-amber-400" : "border-card-border"
                                  }`}
                                />
                              </div>

                              {/* Used badge */}
                              {usedQty > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shrink-0">
                                  −{usedQty} used → reorder
                                </span>
                              )}

                              {/* Note field */}
                              <input
                                type="text"
                                placeholder="Note (optional)"
                                value={c.note}
                                onChange={e => setNote(item.id, e.target.value)}
                                className="w-36 bg-background/50 border border-card-border rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-400/40 shrink-0"
                              />

                              {/* Expiry date field */}
                              <input
                                type="date"
                                value={c.expiryDate}
                                onChange={e => setExpiryDate(item.id, e.target.value)}
                                title="Batch expiry date"
                                className="w-32 bg-background/50 border border-card-border rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-400/40 shrink-0 text-muted-foreground"
                              />
                              {c.expiryDate && expiryStatus(c.expiryDate) !== "ok" && expiryStatus(c.expiryDate) !== "none" && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                                  expiryStatus(c.expiryDate) === "expired" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                                  expiryStatus(c.expiryDate) === "critical" ? "bg-red-500/15 text-red-400 border-red-500/25" :
                                  "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                }`}>{expiryLabel(c.expiryDate)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expiring items alert panel */}
              {expiringItems.length > 0 && (
                <div className="mx-5 mb-4 mt-1 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold text-amber-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                      {expiringItems.length} item{expiringItems.length > 1 ? "s" : ""} expiring within 90 days — review and reorder
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {expiringItems.map(item => {
                      const c = checks[item.id];
                      const es = expiryStatus(c.expiryDate);
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                            es === "expired" ? "bg-red-500/20 text-red-300" :
                            es === "critical" ? "bg-red-500/15 text-red-400" :
                            "bg-amber-500/15 text-amber-300"
                          }`}>{es === "expired" ? "EXPIRED" : es === "critical" ? "CRITICAL" : "SOON"}</span>
                          <span className="font-medium text-foreground/80">{item.name}</span>
                          <span className="text-muted-foreground ml-auto shrink-0">{expiryLabel(c.expiryDate)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="px-5 py-4 border-t border-card-border flex items-center gap-3 flex-wrap bg-muted/5">
                {reorderItems.length > 0 && !chestSentReorder[selectedChestId] ? (
                  <>
                    <div className="text-xs text-amber-400 font-semibold">
                      {reorderItems.length} item{reorderItems.length > 1 ? "s" : ""} flagged for reorder
                    </div>
                    <button
                      onClick={() => setShowChestReorderModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 hover:bg-amber-500/20 transition-colors font-semibold"
                    >
                      <ShoppingCart size={12} /> Review &amp; Send to Reorder
                    </button>
                  </>
                ) : chestSentReorder[selectedChestId] ? (
                  <span className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle size={12} /> Reorder items queued in Stock Usage page
                  </span>
                ) : (
                  <span className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle size={12} /> All items at par — no reorder needed
                  </span>
                )}
              </div>
            </div>

            {/* Reorder confirmation modal */}
            {showChestReorderModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowChestReorderModal(false)}>
                <div
                  className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
                    <div>
                      <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Confirm Reorder</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{chest.name} — {reorderItems.length} item{reorderItems.length > 1 ? "s" : ""} to restock</p>
                    </div>
                    <button onClick={() => setShowChestReorderModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                  </div>

                  <div className="p-5 max-h-[50vh] overflow-y-auto space-y-2">
                    {reorderItems.map(item => {
                      const c = checks[item.id];
                      return (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-muted/20 rounded-lg px-3 py-2.5">
                          <div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold mr-2 ${CHEST_CAT_COLOR[item.category]}`}>
                              {item.category.split(" ")[0]}
                            </span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="font-bold text-amber-400">× {c?.used ?? item.parQty} {item.unit}{(c?.used ?? 1) > 1 ? "s" : ""}</div>
                            <div className="text-[10px] text-muted-foreground">par {item.parQty}</div>
                          </div>
                        </div>
                      );
                    })}
                    {reorderItems.some(i => i.category === "S8 Controlled") && (
                      <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertTriangle size={13} /> S8 items require a signed controlled drug requisition and witness countersign.
                      </div>
                    )}
                    {expiringItems.length > 0 && (
                      <div className="flex items-start gap-2 text-amber-300 text-xs p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                        <span><span className="font-semibold">{expiringItems.length} expiring item{expiringItems.length > 1 ? "s" : ""}</span> also flagged — verify batch expiry before restocking.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 px-5 py-4 border-t border-card-border">
                    <button
                      onClick={() => setShowChestReorderModal(false)}
                      className="px-4 py-2 text-xs text-muted-foreground border border-card-border rounded-lg hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setShowChestReorderModal(false); markComplete(); }}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500/20 border border-amber-400/40 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors"
                    >
                      <ShoppingCart size={13} /> Confirm — Send to Reorder Queue
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={15} className="text-cyan-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>AI Compliance Audit — Medical Equipment & Drugs</span>
              <span className="ml-auto text-xs text-muted-foreground">CASA CAO 20.11 · ISO 9001:2016 · AHPRA</span>
            </div>

            <div className="space-y-3">
              {/* Critical findings */}
              {[
                { level: "critical", icon: <AlertTriangle size={13} />, title: "Drager Neonatal Incubator (VH-MVX) — Service OVERDUE 6 days", body: "Aircraft VH-MVX must not conduct neonatal transports until incubator is serviced and returned to service. Book biomedical engineering immediately. Document in maintenance register." },
                { level: "critical", icon: <AlertTriangle size={13} />, title: "Nihon Kohden BSM-3562 (VH-MQD) — Service OVERDUE 5 days", body: "Monitor requires immediate biomedical service. Until serviced, ensure backup monitoring available on all missions using VH-MQD." },
                { level: "critical", icon: <AlertTriangle size={13} />, title: "O-Neg FFP (2 units) — EXPIRED TODAY", body: "Two units of O-Neg Fresh Frozen Plasma reached expiry 5 Jun 2026. Discard per ANZSBT guidelines. Contact ARCBS Dubbo for emergency replacement. Do not use expired units." },
              ].map((f, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-3">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">{f.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-red-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{f.title}</div>
                    <div className="text-xs text-red-300/70 mt-0.5 leading-relaxed">{f.body}</div>
                  </div>
                </div>
              ))}

              {/* Warning findings */}
              {[
                { title: "ZOLL X Series (VH-MVW) — Annual calibration due in 10 days (15 Jun 2026)", body: "Book biomedical engineering for annual calibration. Do not delay — compliance breach after due date." },
                { title: "Morphine Sulphate — Below minimum stock (8 of 10 ampoules)", body: "Schedule 8 — submit controlled drug requisition to pharmacy. Ensure dual-nurse count completed before next replenishment." },
                { title: "Noradrenaline — Below minimum stock (3 of 4 ampoules) + used today", body: "One ampoule used mission MED-441. Current stock at minimum. Immediate reorder required." },
                { title: "ZOLL Adult Defibrillator Pads (VH-MVW) — Expiry 31 Jul 2026 (26 days)", body: "Reorder confirmed in progress. Verify ETA and ensure replacement before expiry." },
                { title: "iSTAT CG8+ Cartridges — Expiry 30 Jun 2026 (25 days)", body: "Order new batch immediately. Minimum 2-week buffer required before expiry. Current batch 4C-9921." },
              ].map((f, i) => (
                <div key={i} className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex gap-3">
                  <Clock size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-amber-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{f.title}</div>
                    <div className="text-xs text-amber-300/70 mt-0.5 leading-relaxed">{f.body}</div>
                  </div>
                </div>
              ))}

              {/* Good standing */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex gap-3">
                <ShieldCheck size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-green-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Good Standing — {equipOk} equipment items within service windows</div>
                  <div className="text-xs text-green-300/70 mt-0.5 leading-relaxed">
                    Hamilton T1 ventilators, McGrath laryngoscopes, Baxter IV pumps, Masimo monitors, Hamilton T1 fleet — all within service windows. Daily checklist completed by RN K. Brennan (VH-MVW) and RN T. Williams (VH-MWH). Blood fridge temperature verified 3.8°C. All S8 counts matched.
                  </div>
                </div>
              </div>

              {/* Compliance score */}
              <div className="border border-card-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Overall Compliance Score</span>
                  <span className="text-lg font-bold text-amber-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>78%</span>
                </div>
                <div className="w-full bg-sidebar rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: "78%" }} />
                </div>
                <p className="text-xs text-muted-foreground">Score reduced by 2 overdue equipment services and 1 expired blood product. Resolve critical items to restore full compliance. Target: 95%+</p>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={handleExportAudit}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl px-4 py-3 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              <Download size={15} />
              Download Full Audit Report PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
