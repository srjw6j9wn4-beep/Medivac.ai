import { useState } from "react";
import { type UserRole } from "@/lib/data";
import {
  AlertTriangle, CheckCircle, Clock, Download, Filter,
  Search, ShieldCheck, Sparkles, RefreshCw, Calendar,
  FileText, ChevronDown, ChevronRight, MapPin, Truck,
  Car, Activity, BarChart3, Info, Wrench, Star
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ─── Types ────────────────────────────────────────────────────────────────────
type VehicleStatus = "compliant" | "due_soon" | "overdue" | "out_of_service" | "required";
type VehicleType   = "PTV" | "Base Car" | "4WD" | "Utility" | "Golf Buggy";

interface Vehicle {
  id: string;
  rego: string;
  state: "NSW" | "SA" | "ACT";
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  base: string;
  purpose: string;
  colour: string;
  vin: string;
  // Compliance fields
  regoExpiry: string;
  regoDaysLeft: number;
  regoStatus: VehicleStatus;
  insuranceProvider: string;
  insurancePolicyNo: string;
  insuranceExpiry: string;
  insuranceDaysLeft: number;
  insuranceStatus: VehicleStatus;
  ctpProvider: string;     // Compulsory Third Party
  ctpExpiry: string;
  ctpDaysLeft: number;
  ctpStatus: VehicleStatus;
  nextService: string;
  serviceDaysLeft: number;
  serviceStatus: VehicleStatus;
  roadworthyExpiry: string | null;
  roadworthyDaysLeft: number | null;
  rwcStatus: VehicleStatus | null;
  lastInspection: string;
  odometer: number;       // km
  driverAccess: string;   // who can drive
  notes: string;
  overallStatus: VehicleStatus;
}

// ─── Vehicle Data ─────────────────────────────────────────────────────────────
// RFDSSE bases: Dubbo (NSW), Broken Hill (NSW), Bankstown/Sydney (NSW)
// Also service routes into SA (Broken Hill is on NSW/SA border) and ACT (Bankstown ops)

const VEHICLES: Vehicle[] = [
  // ═══ PATIENT TRANSFER VANS (PTV) ═══════════════════════════════════════════
  {
    id: "ptv01",
    rego: "EJ42FR", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Dubbo (YSDU)", purpose: "Patient Transfer — Dubbo Base",
    colour: "White / RFDS livery", vin: "WDB9066371R123441",
    regoExpiry: "31 Oct 2026", regoDaysLeft: 147, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-44812",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Oct 2026", ctpDaysLeft: 147, ctpStatus: "compliant",
    nextService: "20 Jun 2026", serviceDaysLeft: 15, serviceStatus: "due_soon",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "20 Dec 2025", odometer: 62840,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Stretcher configuration. ALS kit fitted. Due 15,000 km service.",
    overallStatus: "due_soon",
  },
  {
    id: "ptv02",
    rego: "EJ43FR", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Dubbo (YSDU)", purpose: "Patient Transfer — Dubbo Base",
    colour: "White / RFDS livery", vin: "WDB9066371R123442",
    regoExpiry: "31 Oct 2026", regoDaysLeft: 147, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-44813",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Oct 2026", ctpDaysLeft: 147, ctpStatus: "compliant",
    nextService: "15 Aug 2026", serviceDaysLeft: 70, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "15 Feb 2026", odometer: 44210,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Reserve PTV. Neonatal transport configuration available on request.",
    overallStatus: "compliant",
  },
  {
    id: "ptv03",
    rego: "BH91KL", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2021,
    type: "PTV", base: "Broken Hill (YBHI)", purpose: "Patient Transfer — Broken Hill Base",
    colour: "White / RFDS livery", vin: "WDB9066371R118801",
    regoExpiry: "30 Jun 2026", regoDaysLeft: 25, regoStatus: "due_soon",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-41290",
    insuranceExpiry: "30 Jun 2026", insuranceDaysLeft: 25, insuranceStatus: "due_soon",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "30 Jun 2026", ctpDaysLeft: 25, ctpStatus: "due_soon",
    nextService: "10 Jun 2026", serviceDaysLeft: 5, serviceStatus: "due_soon",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "10 Dec 2025", odometer: 88450,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "REGO, CTP AND INSURANCE ALL EXPIRE 30 JUN — renew before 25 Jun. Service also due within 5 days.",
    overallStatus: "due_soon",
  },
  {
    id: "ptv04",
    rego: "BH92KL", state: "NSW", make: "Ford", model: "Transit 470E LWB", year: 2023,
    type: "PTV", base: "Broken Hill (YBHI)", purpose: "Patient Transfer — Broken Hill Base",
    colour: "White / RFDS livery", vin: "WF0XXXTTGXNB84120",
    regoExpiry: "28 Feb 2027", regoDaysLeft: 268, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2025-51240",
    insuranceExpiry: "28 Feb 2027", insuranceDaysLeft: 268, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "28 Feb 2027", ctpDaysLeft: 268, ctpStatus: "compliant",
    nextService: "1 Nov 2026", serviceDaysLeft: 148, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "1 May 2026", odometer: 21330,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "New fleet addition. ALS and bariatric equipment fitted.",
    overallStatus: "compliant",
  },
  {
    id: "ptv05",
    rego: "BW14QA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2020,
    type: "PTV", base: "Bankstown (YSBK)", purpose: "Patient Transfer — Sydney / Bankstown Base",
    colour: "White / RFDS livery", vin: "WDB9066371R109910",
    regoExpiry: "31 Aug 2026", regoDaysLeft: 86, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-39882",
    insuranceExpiry: "31 Aug 2026", insuranceDaysLeft: 86, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Aug 2026", ctpDaysLeft: 86, ctpStatus: "compliant",
    nextService: "30 May 2026", serviceDaysLeft: -6, serviceStatus: "overdue",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "30 Nov 2025", odometer: 109220,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "SERVICE OVERDUE by 6 days. Book immediately — vehicle at 109,220 km.",
    overallStatus: "overdue",
  },
  {
    id: "ptv06",
    rego: "BW15QA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2020,
    type: "PTV", base: "Bankstown (YSBK)", purpose: "Patient Transfer — Sydney / Bankstown Base",
    colour: "White / RFDS livery", vin: "WDB9066371R109911",
    regoExpiry: "31 Aug 2026", regoDaysLeft: 86, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-39883",
    insuranceExpiry: "31 Aug 2026", insuranceDaysLeft: 86, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Aug 2026", ctpDaysLeft: 86, ctpStatus: "compliant",
    nextService: "15 Sep 2026", serviceDaysLeft: 101, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "15 Mar 2026", odometer: 94100,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "High mileage — monitor tyre wear. Reserve PTV for Sydney metro transfers.",
    overallStatus: "compliant",
  },

  // ═══ BASE CARS — DUBBO ══════════════════════════════════════════════════════
  {
    id: "bc01",
    rego: "DU01RF", state: "NSW", make: "Toyota", model: "LandCruiser 200 GXL", year: 2021,
    type: "4WD", base: "Dubbo (YSDU)", purpose: "Base Operations — Crew Transport / Remote Access",
    colour: "White", vin: "JTMHV05J505011201",
    regoExpiry: "31 Mar 2027", regoDaysLeft: 299, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-44820",
    insuranceExpiry: "31 Mar 2027", insuranceDaysLeft: 299, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Mar 2027", ctpDaysLeft: 299, ctpStatus: "compliant",
    nextService: "15 Jul 2026", serviceDaysLeft: 39, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "15 Jan 2026", odometer: 48200,
    driverAccess: "Authorised RFDS staff",
    notes: "Remote area access vehicle. UHF fitted. First aid kit onboard.",
    overallStatus: "compliant",
  },
  {
    id: "bc02",
    rego: "DU02RF", state: "NSW", make: "Toyota", model: "Camry Ascent Sport", year: 2023,
    type: "Base Car", base: "Dubbo (YSDU)", purpose: "Base Car — Staff / Crew Admin Runs",
    colour: "Silver", vin: "JTNB11HK802144812",
    regoExpiry: "30 Nov 2026", regoDaysLeft: 177, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2025-50112",
    insuranceExpiry: "30 Nov 2026", insuranceDaysLeft: 177, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "30 Nov 2026", ctpDaysLeft: 177, ctpStatus: "compliant",
    nextService: "1 Dec 2026", serviceDaysLeft: 178, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "1 Jun 2026", odometer: 14200,
    driverAccess: "Authorised RFDS staff",
    notes: "New fleet. Low mileage.",
    overallStatus: "compliant",
  },
  {
    id: "bc03",
    rego: "DU03RF", state: "NSW", make: "Toyota", model: "HiLux SR5 4WD", year: 2022,
    type: "Utility", base: "Dubbo (YSDU)", purpose: "Stores / Logistics — Dubbo",
    colour: "White", vin: "MR0FB3CD802044912",
    regoExpiry: "30 Sep 2026", regoDaysLeft: 116, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-45002",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "30 Sep 2026", ctpDaysLeft: 116, ctpStatus: "compliant",
    nextService: "10 Jun 2026", serviceDaysLeft: 5, serviceStatus: "due_soon",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "10 Dec 2025", odometer: 55810,
    driverAccess: "Authorised RFDS staff",
    notes: "Tow bar fitted for equipment trailer. Service due in 5 days.",
    overallStatus: "due_soon",
  },

  // ═══ BASE CARS — BROKEN HILL ════════════════════════════════════════════════
  {
    id: "bc04",
    rego: "BH01RF", state: "NSW", make: "Toyota", model: "LandCruiser 200 GXL", year: 2020,
    type: "4WD", base: "Broken Hill (YBHI)", purpose: "Base Operations — Remote Area Access",
    colour: "White", vin: "JTMHV05J405010988",
    regoExpiry: "30 Jun 2026", regoDaysLeft: 25, regoStatus: "due_soon",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-41288",
    insuranceExpiry: "30 Jun 2026", insuranceDaysLeft: 25, insuranceStatus: "due_soon",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "30 Jun 2026", ctpDaysLeft: 25, ctpStatus: "due_soon",
    nextService: "20 Jun 2026", serviceDaysLeft: 15, serviceStatus: "due_soon",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "20 Dec 2025", odometer: 81990,
    driverAccess: "Authorised RFDS staff",
    notes: "Broken Hill — SA border ops vehicle. Rego/Insurance/CTP expire 30 Jun — renew before 20 Jun.",
    overallStatus: "due_soon",
  },
  {
    id: "bc05",
    rego: "BH02RF", state: "NSW", make: "Toyota", model: "Camry Ascent", year: 2022,
    type: "Base Car", base: "Broken Hill (YBHI)", purpose: "Base Car — Staff / Admin",
    colour: "White", vin: "JTNB11HK702144001",
    regoExpiry: "28 Feb 2027", regoDaysLeft: 268, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-41291",
    insuranceExpiry: "28 Feb 2027", insuranceDaysLeft: 268, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "28 Feb 2027", ctpDaysLeft: 268, ctpStatus: "compliant",
    nextService: "20 Aug 2026", serviceDaysLeft: 75, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "20 Feb 2026", odometer: 36100,
    driverAccess: "Authorised RFDS staff",
    notes: "",
    overallStatus: "compliant",
  },
  {
    id: "bc06",
    rego: "BH03RF", state: "NSW", make: "Toyota", model: "HiLux SR 4WD", year: 2021,
    type: "Utility", base: "Broken Hill (YBHI)", purpose: "Stores / Logistics — Broken Hill",
    colour: "White", vin: "MR0FB3CD702044002",
    regoExpiry: "31 Jul 2026", regoDaysLeft: 55, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-41292",
    insuranceExpiry: "31 Jul 2026", insuranceDaysLeft: 55, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Jul 2026", ctpDaysLeft: 55, ctpStatus: "compliant",
    nextService: "30 Jun 2026", serviceDaysLeft: 25, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "30 Dec 2025", odometer: 74200,
    driverAccess: "Authorised RFDS staff",
    notes: "SA border runs. Tow bar fitted.",
    overallStatus: "compliant",
  },
  // SA clinic support vehicle (Broken Hill base operates SA-border clinics)
  {
    id: "bc07",
    rego: "S441RFD", state: "SA", make: "Toyota", model: "LandCruiser 79 Series", year: 2022,
    type: "4WD", base: "Broken Hill (YBHI) / SA Clinic Routes", purpose: "SA Clinic Support — Remote Access",
    colour: "White / RFDS livery", vin: "JTFHX02P802050881",
    regoExpiry: "31 Jan 2027", regoDaysLeft: 240, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2025-48810",
    insuranceExpiry: "31 Jan 2027", insuranceDaysLeft: 240, insuranceStatus: "compliant",
    ctpProvider: "CTP Insurance (SA — SGIC / GIO)", ctpExpiry: "31 Jan 2027", ctpDaysLeft: 240, ctpStatus: "compliant",
    nextService: "1 Sep 2026", serviceDaysLeft: 87, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "1 Mar 2026", odometer: 29440,
    driverAccess: "Authorised RFDS staff — remote area qualified",
    notes: "SA-registered. Used for Far West NSW / SA clinic access — Broken Hill base ops.",
    overallStatus: "compliant",
  },

  // ═══ BASE CARS — BANKSTOWN / SYDNEY ═════════════════════════════════════════
  {
    id: "bc08",
    rego: "BK01RF", state: "NSW", make: "Toyota", model: "Camry Ascent Sport", year: 2024,
    type: "Base Car", base: "Bankstown (YSBK)", purpose: "Base Car — Staff / Crew Admin",
    colour: "Silver", vin: "JTNB11HK902145100",
    regoExpiry: "30 Apr 2027", regoDaysLeft: 328, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2025-52001",
    insuranceExpiry: "30 Apr 2027", insuranceDaysLeft: 328, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "30 Apr 2027", ctpDaysLeft: 328, ctpStatus: "compliant",
    nextService: "1 Mar 2027", serviceDaysLeft: 268, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "1 Sep 2026", odometer: 4100,
    driverAccess: "Authorised RFDS staff",
    notes: "New fleet — 2024 model.",
    overallStatus: "compliant",
  },
  {
    id: "bc09",
    rego: "BK02RF", state: "NSW", make: "Toyota", model: "RAV4 GX AWD", year: 2022,
    type: "Base Car", base: "Bankstown (YSBK)", purpose: "Base Car — Staff / Admin",
    colour: "White", vin: "JTMWFREV702054001",
    regoExpiry: "31 May 2026", regoDaysLeft: -5, regoStatus: "overdue",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-40012",
    insuranceExpiry: "31 May 2026", insuranceDaysLeft: -5, insuranceStatus: "overdue",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 May 2026", ctpDaysLeft: -5, ctpStatus: "overdue",
    nextService: "15 Jul 2026", serviceDaysLeft: 39, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "15 Jan 2026", odometer: 41880,
    driverAccess: "Authorised RFDS staff",
    notes: "REGO, CTP AND INSURANCE EXPIRED 5 DAYS AGO. Vehicle must NOT be driven until renewed.",
    overallStatus: "overdue",
  },
  {
    id: "bc10",
    rego: "BK03RF", state: "NSW", make: "Toyota", model: "HiLux SR5 4WD", year: 2023,
    type: "Utility", base: "Bankstown (YSBK)", purpose: "Stores / Logistics — Sydney",
    colour: "White", vin: "MR0FB3CD902045200",
    regoExpiry: "31 Mar 2027", regoDaysLeft: 299, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2025-50998",
    insuranceExpiry: "31 Mar 2027", insuranceDaysLeft: 299, insuranceStatus: "compliant",
    ctpProvider: "NRMA Insurance (NSW CTP Green Slip)", ctpExpiry: "31 Mar 2027", ctpDaysLeft: 299, ctpStatus: "compliant",
    nextService: "10 Nov 2026", serviceDaysLeft: 157, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "10 May 2026", odometer: 17300,
    driverAccess: "Authorised RFDS staff",
    notes: "Bankstown freight/stores logistics.",
    overallStatus: "compliant",
  },
  // ACT-registered (Bankstown base services ACT/Queanbeyan corridor)
  {
    id: "bc11",
    rego: "YRR22F", state: "ACT", make: "Toyota", model: "Camry Ascent", year: 2023,
    type: "Base Car", base: "Bankstown (YSBK) / ACT Ops", purpose: "ACT / Canberra Corridor Ops",
    colour: "White", vin: "JTNB11HK802145002",
    regoExpiry: "30 Sep 2026", regoDaysLeft: 116, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2025-49901",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "CTP Insurance (ACT — NRMA)", ctpExpiry: "30 Sep 2026", ctpDaysLeft: 116, ctpStatus: "compliant",
    nextService: "15 Aug 2026", serviceDaysLeft: 70, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "15 Feb 2026", odometer: 22400,
    driverAccess: "Authorised RFDS staff",
    notes: "ACT-registered for Canberra / Queanbeyan corridor operations.",
    overallStatus: "compliant",
  },
  // ═══ GOLF BUGGIES — DUBBO BASE ═══════════════════════════════════════════════
  {
    id: "gb01",
    rego: "UNREGISTERED", state: "NSW", make: "Club Car", model: "Precedent Electric", year: 2021,
    type: "Golf Buggy", base: "Dubbo (YSDU)", purpose: "Airside Ground Movements — Dubbo Base",
    colour: "White / RFDS livery", vin: "CC-DBO-GB01-2021",
    regoExpiry: "N/A — Private Airside Use", regoDaysLeft: 9999, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-GB001",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "N/A — Airside Only (not road-registered)", ctpExpiry: "N/A", ctpDaysLeft: 9999, ctpStatus: "compliant",
    nextService: "01 Sep 2026", serviceDaysLeft: 87, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "01 Mar 2026", odometer: 4210,
    driverAccess: "Authorised RFDS airside-rated staff only",
    notes: "Electric airside buggy. Not road-registered — airside movements only. Annual battery and brake inspection required. Dubbo Airport airside access permit required for operators.",
    overallStatus: "compliant",
  },
  {
    id: "gb02",
    rego: "UNREGISTERED", state: "NSW", make: "Club Car", model: "Precedent Electric", year: 2021,
    type: "Golf Buggy", base: "Dubbo (YSDU)", purpose: "Airside Ground Movements — Dubbo Base",
    colour: "White / RFDS livery", vin: "CC-DBO-GB02-2021",
    regoExpiry: "N/A — Private Airside Use", regoDaysLeft: 9999, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-GB002",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "N/A — Airside Only (not road-registered)", ctpExpiry: "N/A", ctpDaysLeft: 9999, ctpStatus: "compliant",
    nextService: "01 Sep 2026", serviceDaysLeft: 87, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "01 Mar 2026", odometer: 3890,
    driverAccess: "Authorised RFDS airside-rated staff only",
    notes: "Electric airside buggy. Not road-registered — airside movements only. Annual battery and brake inspection required.",
    overallStatus: "compliant",
  },
  {
    id: "gb03",
    rego: "UNREGISTERED", state: "NSW", make: "Club Car", model: "Tempo Electric", year: 2023,
    type: "Golf Buggy", base: "Dubbo (YSDU)", purpose: "Airside Ground Movements — Dubbo Base",
    colour: "White / RFDS livery", vin: "CC-DBO-GB03-2023",
    regoExpiry: "N/A — Private Airside Use", regoDaysLeft: 9999, regoStatus: "compliant",
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "QBE-MV-2024-GB003",
    insuranceExpiry: "30 Sep 2026", insuranceDaysLeft: 116, insuranceStatus: "compliant",
    ctpProvider: "N/A — Airside Only (not road-registered)", ctpExpiry: "N/A", ctpDaysLeft: 9999, ctpStatus: "compliant",
    nextService: "01 Sep 2026", serviceDaysLeft: 87, serviceStatus: "compliant",
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "01 Dec 2025", odometer: 1640,
    driverAccess: "Authorised RFDS airside-rated staff only",
    notes: "Newer Tempo model — increased passenger capacity. Not road-registered — airside movements only. Assigned to tarmac crew transfer and equipment staging at Dubbo.",
    overallStatus: "compliant",
  },

  // ═══ GRIFFITH BASE ══════════════════════════════════════════════════════════
  {
    id: "gth01",
    rego: "TBA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Griffith (YGTH)", purpose: "Patient Transfer — Griffith Base",
    colour: "White", vin: "TBA",
    regoExpiry: "30 Jun 2027", regoDaysLeft: 355, regoStatus: "compliant" as VehicleStatus,
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "TBA",
    insuranceExpiry: "30 Jun 2027", insuranceDaysLeft: 355, insuranceStatus: "compliant" as VehicleStatus,
    ctpProvider: "NRMA", ctpExpiry: "30 Jun 2027", ctpDaysLeft: 355, ctpStatus: "compliant" as VehicleStatus,
    nextService: "TBA", serviceDaysLeft: 120, serviceStatus: "compliant" as VehicleStatus,
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "TBA", odometer: 0,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Griffith base PTV — on books. Rego, insurance and service details to be confirmed and updated. Regional hub serving Wagga Wagga and Sydney corridor.",
    overallStatus: "compliant" as VehicleStatus,
  },
  // ═══ WAGGA WAGGA BASE ════════════════════════════════════════════════════════
  {
    id: "wag01",
    rego: "TBA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Wagga Wagga (YSWG)", purpose: "Patient Transfer — Wagga Wagga Base",
    colour: "White", vin: "TBA",
    regoExpiry: "30 Jun 2027", regoDaysLeft: 355, regoStatus: "compliant" as VehicleStatus,
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "TBA",
    insuranceExpiry: "30 Jun 2027", insuranceDaysLeft: 355, insuranceStatus: "compliant" as VehicleStatus,
    ctpProvider: "NRMA", ctpExpiry: "30 Jun 2027", ctpDaysLeft: 355, ctpStatus: "compliant" as VehicleStatus,
    nextService: "TBA", serviceDaysLeft: 120, serviceStatus: "compliant" as VehicleStatus,
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "TBA", odometer: 0,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Wagga Wagga base PTV — on books. Rego, insurance and service details to be confirmed and updated. Major referral hub — Wagga Base Hospital transfers.",
    overallStatus: "compliant" as VehicleStatus,
  },
  // ═══ ORANGE BASE ═════════════════════════════════════════════════════════════
  {
    id: "org01",
    rego: "TBA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Orange (YORG)", purpose: "Patient Transfer — Orange Base",
    colour: "White", vin: "TBA",
    regoExpiry: "30 Jun 2027", regoDaysLeft: 355, regoStatus: "compliant" as VehicleStatus,
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "TBA",
    insuranceExpiry: "30 Jun 2027", insuranceDaysLeft: 355, insuranceStatus: "compliant" as VehicleStatus,
    ctpProvider: "NRMA", ctpExpiry: "30 Jun 2027", ctpDaysLeft: 355, ctpStatus: "compliant" as VehicleStatus,
    nextService: "TBA", serviceDaysLeft: 120, serviceStatus: "compliant" as VehicleStatus,
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "TBA", odometer: 0,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Orange base PTV — on books. Rego, insurance and service details to be confirmed and updated. Central West hub — Orange Base Hospital connections.",
    overallStatus: "compliant" as VehicleStatus,
  },
  // ═══ BOURKE BASE ═════════════════════════════════════════════════════════════
  {
    id: "bke01",
    rego: "TBA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Bourke (YBKE)", purpose: "Patient Transfer — Bourke Base",
    colour: "White", vin: "TBA",
    regoExpiry: "30 Jun 2027", regoDaysLeft: 355, regoStatus: "compliant" as VehicleStatus,
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "TBA",
    insuranceExpiry: "30 Jun 2027", insuranceDaysLeft: 355, insuranceStatus: "compliant" as VehicleStatus,
    ctpProvider: "NRMA", ctpExpiry: "30 Jun 2027", ctpDaysLeft: 355, ctpStatus: "compliant" as VehicleStatus,
    nextService: "TBA", serviceDaysLeft: 120, serviceStatus: "compliant" as VehicleStatus,
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "TBA", odometer: 0,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Bourke base PTV — on books. Rego, insurance and service details to be confirmed and updated. Remote Far West — limited transport alternatives on ground.",
    overallStatus: "compliant" as VehicleStatus,
  },
  // ═══ LIGHTNING RIDGE BASE ════════════════════════════════════════════════════
  {
    id: "lrd01",
    rego: "TBA", state: "NSW", make: "Mercedes-Benz", model: "Sprinter 519 CDI", year: 2022,
    type: "PTV", base: "Lightning Ridge (YLRD)", purpose: "Patient Transfer — Lightning Ridge Base",
    colour: "White", vin: "TBA",
    regoExpiry: "30 Jun 2027", regoDaysLeft: 355, regoStatus: "compliant" as VehicleStatus,
    insuranceProvider: "QBE Insurance", insurancePolicyNo: "TBA",
    insuranceExpiry: "30 Jun 2027", insuranceDaysLeft: 355, insuranceStatus: "compliant" as VehicleStatus,
    ctpProvider: "NRMA", ctpExpiry: "30 Jun 2027", ctpDaysLeft: 355, ctpStatus: "compliant" as VehicleStatus,
    nextService: "TBA", serviceDaysLeft: 120, serviceStatus: "compliant" as VehicleStatus,
    roadworthyExpiry: null, roadworthyDaysLeft: null, rwcStatus: null,
    lastInspection: "TBA", odometer: 0,
    driverAccess: "Authorised RFDS drivers — HR licence required",
    notes: "Lightning Ridge base PTV — on books. Rego, insurance and service details to be confirmed and updated. Outback remote — nearest major hospital 100+ km.",
    overallStatus: "compliant" as VehicleStatus,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BASES   = ["All Bases", "Dubbo (YSDU)", "Broken Hill (YBHI)", "Bankstown (YSBK)", "Griffith (YGTH)", "Wagga Wagga (YSWG)", "Orange (YORG)", "Bourke (YBKE)", "Lightning Ridge (YLRD)"];
const STATES  = ["All States", "NSW", "SA", "ACT"];
const V_TYPES = ["All Types", "PTV", "Base Car", "4WD", "Utility", "Golf Buggy"];

const totalVehicles   = VEHICLES.length;
const ptvsTotal       = VEHICLES.filter(v => v.type === "PTV").length;
const baseCarsTotal   = VEHICLES.filter(v => v.type !== "PTV" && v.type !== "Golf Buggy").length;
const golfBuggiesTotal = VEHICLES.filter(v => v.type === "Golf Buggy").length;
const overdueCnt      = VEHICLES.filter(v => v.overallStatus === "overdue").length;
const dueSoonCnt      = VEHICLES.filter(v => v.overallStatus === "due_soon").length;
const compliantCnt    = VEHICLES.filter(v => v.overallStatus === "compliant").length;

function statusColor(s: VehicleStatus) {
  return {
    compliant:      "text-green-400",
    due_soon:       "text-amber-400",
    overdue:        "text-red-400",
    out_of_service: "text-gray-400",
    required:       "text-purple-400",
  }[s];
}
function statusBg(s: VehicleStatus) {
  return {
    compliant:      "bg-green-500/15 text-green-400 border border-green-500/30",
    due_soon:       "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    overdue:        "bg-red-500/15 text-red-400 border border-red-500/30",
    out_of_service: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
    required:       "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  }[s];
}
function statusLabel(s: VehicleStatus) {
  return { compliant: "Compliant", due_soon: "Due Soon", overdue: "OVERDUE", out_of_service: "Off Road", required: "Van Required" }[s];
}
function typeIcon(t: VehicleType) {
  return t === "PTV" ? <Truck size={14} /> : <Car size={14} />;
}
function stateFlag(s: string) {
  return { NSW: "🔵", SA: "🔴", ACT: "🟡" }[s] || "";
}
function daysColor(d: number) {
  if (d < 0)  return "text-red-400 font-bold";
  if (d <= 14) return "text-red-400 font-medium";
  if (d <= 30) return "text-amber-400";
  return "text-foreground";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GroundVehicles({ role }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "vehicles" | "compliance" | "audit">("overview");
  const [filterBase,  setFilterBase]  = useState("All Bases");
  const [filterState, setFilterState] = useState("All States");
  const [filterType,  setFilterType]  = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const canManage = ["senior_management", "dispatcher", "safety", "admin"].includes(role);

  const filtered = VEHICLES.filter(v => {
    if (filterBase  !== "All Bases"   && !(filterBase.match(/\(([A-Z]{4})\)/)?.[1] ? v.base.includes(filterBase.match(/\(([A-Z]{4})\)/)?.[1] ?? "") : v.base.toLowerCase().startsWith(filterBase.split(" (")[0].toLowerCase()))) return false;
    if (filterState !== "All States"  && v.state !== filterState) return false;
    if (filterType  !== "All Types"   && v.type  !== filterType)  return false;
    if (filterStatus === "Alerts"     && v.overallStatus === "compliant") return false;
    if (search && !v.rego.toLowerCase().includes(search.toLowerCase()) &&
                  !v.make.toLowerCase().includes(search.toLowerCase()) &&
                  !v.model.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const criticalItems = VEHICLES.flatMap(v => {
    const alerts: { rego: string; issue: string; level: "overdue"|"due_soon" }[] = [];
    if (v.regoStatus === "overdue")      alerts.push({ rego: v.rego, issue: `Registration EXPIRED (${v.state})`, level: "overdue" });
    if (v.insuranceStatus === "overdue") alerts.push({ rego: v.rego, issue: `Insurance EXPIRED`, level: "overdue" });
    if (v.ctpStatus === "overdue")       alerts.push({ rego: v.rego, issue: `CTP EXPIRED`, level: "overdue" });
    if (v.serviceStatus === "overdue")   alerts.push({ rego: v.rego, issue: `Vehicle Service OVERDUE`, level: "overdue" });
    if (v.regoStatus === "due_soon")     alerts.push({ rego: v.rego, issue: `Registration expires in ${v.regoDaysLeft} days`, level: "due_soon" });
    if (v.insuranceStatus === "due_soon") alerts.push({ rego: v.rego, issue: `Insurance expires in ${v.insuranceDaysLeft} days`, level: "due_soon" });
    if (v.ctpStatus === "due_soon")      alerts.push({ rego: v.rego, issue: `CTP expires in ${v.ctpDaysLeft} days`, level: "due_soon" });
    if (v.serviceStatus === "due_soon")  alerts.push({ rego: v.rego, issue: `Service due in ${v.serviceDaysLeft} days`, level: "due_soon" });
    return alerts;
  });

  const handleExport = () => {
    const lines: string[] = [
      "RFDS SE SECTION — GROUND VEHICLE COMPLIANCE REPORT",
      `Generated: ${new Date().toLocaleString("en-AU")}`,
      "",
      "═══════════════════════════════════════════════════════",
      "FLEET SUMMARY",
      `  Total Vehicles:        ${totalVehicles}`,
      `  Patient Transfer Vans: ${ptvsTotal}`,
      `  Base / Support Cars:   ${baseCarsTotal}`,
      `  Golf Buggies (Airside): ${golfBuggiesTotal}`,
      `  Fully Compliant:       ${compliantCnt}`,
      `  Due Soon (≤30 days):   ${dueSoonCnt}`,
      `  OVERDUE:               ${overdueCnt}`,
      "",
      "═══════════════════════════════════════════════════════",
      "CRITICAL ALERTS",
      ...criticalItems.filter(a => a.level === "overdue").map(a => `  ⚠ OVERDUE  [${a.rego}] ${a.issue}`),
      ...criticalItems.filter(a => a.level === "due_soon").map(a => `  ◈ DUE SOON [${a.rego}] ${a.issue}`),
      "",
      "═══════════════════════════════════════════════════════",
      "FULL VEHICLE REGISTER",
      "",
      ...VEHICLES.map(v => [
        `  ┌─ ${v.type}: ${v.rego} (${v.state}) — ${v.make} ${v.model} ${v.year}`,
        `  │  Base: ${v.base}`,
        `  │  Purpose: ${v.purpose}`,
        `  │  VIN: ${v.vin}  |  Odometer: ${v.odometer.toLocaleString()} km`,
        `  │  Colour: ${v.colour}`,
        `  │  Registration: Expires ${v.regoExpiry} (${v.regoDaysLeft >= 0 ? v.regoDaysLeft + "d remaining" : Math.abs(v.regoDaysLeft) + "d OVERDUE"})`,
        `  │  Insurance: ${v.insuranceProvider} — Policy ${v.insurancePolicyNo} — Expires ${v.insuranceExpiry}`,
        `  │  CTP: ${v.ctpProvider} — Expires ${v.ctpExpiry}`,
        `  │  Next Service: ${v.nextService} (${v.serviceDaysLeft >= 0 ? v.serviceDaysLeft + "d" : Math.abs(v.serviceDaysLeft) + "d OVERDUE"})`,
        `  │  Last Inspection: ${v.lastInspection}`,
        `  │  Authorised Drivers: ${v.driverAccess}`,
        v.notes ? `  │  Notes: ${v.notes}` : "",
        `  └─ Status: ${statusLabel(v.overallStatus)}`,
        "",
      ].filter(Boolean).join("\n")),
      "═══════════════════════════════════════════════════════",
      "Generated by Medivac.ai — RFDS SE Section Ground Vehicle Compliance",
    ];
    generatePDF(lines.join("\n"), `RFDS_GroundVehicle_Compliance_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const TABS = [
    { id: "overview",   label: "Overview",          icon: <BarChart3 size={14} /> },
    { id: "vehicles",   label: "All Vehicles",      icon: <Truck size={14} /> },
    { id: "compliance", label: "Compliance Matrix",  icon: <ShieldCheck size={14} /> },
    { id: "audit",      label: "AI Audit",           icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Ground Vehicle Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Patient Transfer Vans · Base Cars · NSW · SA · ACT — Registration, Insurance, CTP, Service
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
            <div className="relative w-2 h-2 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-green-400 live-dot" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-green-400 font-medium">AI Compliance Active</span>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
          >
            <Download size={13} />Export Report PDF
          </button>
        </div>
      </div>

      {/* Critical alert banner */}
      {overdueCnt > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
          <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-red-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Immediate Action Required — {overdueCnt} vehicle(s) out of compliance
            </div>
            <ul className="mt-1 space-y-0.5 text-xs text-red-300/80">
              {criticalItems.filter(a => a.level === "overdue").map((a, i) => (
                <li key={i}>• [{a.rego}] {a.issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${activeTab === t.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-card border border-card-border text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Fleet",    value: totalVehicles, icon: <Truck size={16} />,       color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20" },
              { label: "Compliant",      value: compliantCnt,  icon: <CheckCircle size={16} />, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
              { label: "Due ≤30 Days",   value: dueSoonCnt,    icon: <Clock size={16} />,       color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
              { label: "Overdue",        value: overdueCnt,    icon: <AlertTriangle size={16} />, color: "text-red-400",  bg: "bg-red-500/10",    border: "border-red-500/20" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3`}>
                <div className={`${s.color} mb-1`}>{s.icon}</div>
                <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Fleet by base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {["Dubbo (YSDU)", "Broken Hill (YBHI)", "Bankstown (YSBK)", "Griffith (YGTH)", "Wagga Wagga (YSWG)", "Orange (YORG)", "Bourke (YBKE)", "Lightning Ridge (YLRD)"].map(base => {
              const icao = base.match(/\(([A-Z]{4})\)/)?.[1] ?? "";
              const bv = VEHICLES.filter(v => v.base.includes(icao));
              const bo = bv.filter(v => v.overallStatus === "overdue").length;
              const bd = bv.filter(v => v.overallStatus === "due_soon").length;
              return (
                <div key={base} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={13} className="text-cyan-400" />
                    <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{base.split(" (")[0]}</span>
                    {bo > 0 && <span className="ml-auto text-xs bg-red-500/15 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">{bo} overdue</span>}
                    {bd > 0 && bo === 0 && <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">{bd} due soon</span>}
                    {bd === 0 && bo === 0 && <span className="ml-auto text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">All OK</span>}
                  </div>
                  <div className="space-y-1.5">
                    {bv.map(v => (
                      <div key={v.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {typeIcon(v.type)}
                          <span className="font-medium text-foreground">{v.rego}</span>
                          <span className="text-muted-foreground">{v.make} {v.model}</span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusBg(v.overallStatus)}`}>{statusLabel(v.overallStatus)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upcoming renewals */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Upcoming Renewals — Next 60 Days</span>
            </div>
            <div className="space-y-1.5">
              {criticalItems
                .filter(a => {
                  const v = VEHICLES.find(x => x.rego === a.rego);
                  return v && (a.level === "overdue" || (a.level === "due_soon" && (
                    (a.issue.includes("Registration") && (v.regoDaysLeft <= 60)) ||
                    (a.issue.includes("Insurance")    && (v.insuranceDaysLeft <= 60)) ||
                    (a.issue.includes("CTP")          && (v.ctpDaysLeft <= 60)) ||
                    (a.issue.includes("Service")      && (v.serviceDaysLeft <= 60))
                  )));
                })
                .map((a, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs py-1.5 border-b border-card-border last:border-0`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${a.level === "overdue" ? "text-red-400" : "text-foreground"}`}>[{a.rego}]</span>
                      <span className="text-muted-foreground">{a.issue}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.level === "overdue" ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
                      {a.level === "overdue" ? "OVERDUE" : "Due Soon"}
                    </span>
                  </div>
                ))
              }
              {/* New base PTVs — documentation pending */}
              {[
                { rego: "TBA", base: "Griffith (YGTH)" },
                { rego: "TBA", base: "Wagga Wagga (YSWG)" },
                { rego: "TBA", base: "Orange (YORG)" },
                { rego: "TBA", base: "Bourke (YBKE)" },
                { rego: "TBA", base: "Lightning Ridge (YLRD)" },
              ].map(p => (
                <div key={p.base} className="flex items-center justify-between text-xs py-1.5 border-b border-card-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">[{p.base}]</span>
                    <span className="text-muted-foreground">Rego · CTP · Insurance · Service — all details TBA</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30">Pending</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ALL VEHICLES ══════════ */}
      {activeTab === "vehicles" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                className="w-full pl-7 pr-3 py-2 text-xs bg-card border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-foreground placeholder-muted-foreground"
                placeholder="Search rego / make..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            {[
              { value: filterBase,   set: setFilterBase,   opts: BASES },
              { value: filterState,  set: setFilterState,  opts: STATES },
              { value: filterType,   set: setFilterType,   opts: V_TYPES },
            ].map((f, i) => (
              <select key={i} value={f.value} onChange={e => f.set(e.target.value)}
                className="text-xs bg-card border border-card-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none">
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            <button onClick={() => setFilterStatus(filterStatus === "Alerts" ? "All" : "Alerts")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${filterStatus === "Alerts" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-card border-card-border text-muted-foreground"}`}>
              <Filter size={12} />Alerts Only
            </button>
          </div>

          <div className="space-y-2">
            {filtered.map(v => (
              <div key={v.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${v.overallStatus === "overdue" ? "border-red-500/50" : v.overallStatus === "due_soon" ? "border-amber-400/30" : "border-card-border"}`}>
                <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${v.overallStatus === "overdue" ? "bg-red-500/15 text-red-400" : v.overallStatus === "due_soon" ? "bg-amber-500/15 text-amber-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                    {typeIcon(v.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{v.rego}</span>
                      <span className="text-xs text-muted-foreground">{stateFlag(v.state)} {v.state}</span>
                      <span className="text-xs bg-sidebar rounded px-1.5 py-0.5 text-muted-foreground">{v.type}</span>
                      {v.overallStatus === "overdue" && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 font-bold">OVERDUE</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{v.make} {v.model} {v.year} · {v.base.split(" ")[0]} · {v.purpose}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg(v.overallStatus)}`}>{statusLabel(v.overallStatus)}</span>
                    {expanded === v.id ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </div>
                </div>
                {expanded === v.id && (
                  <div className="border-t border-card-border px-4 py-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div><div className="text-muted-foreground mb-0.5">VIN</div><div className="font-mono text-foreground text-xs">{v.vin}</div></div>
                      <div><div className="text-muted-foreground mb-0.5">Colour</div><div className="text-foreground">{v.colour}</div></div>
                      <div><div className="text-muted-foreground mb-0.5">Odometer</div><div className="text-foreground">{v.odometer.toLocaleString()} km</div></div>
                      <div><div className="text-muted-foreground mb-0.5">Last Inspection</div><div className="text-foreground">{v.lastInspection}</div></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { label: "Registration",   val: v.regoExpiry,      days: v.regoDaysLeft,      status: v.regoStatus,       note: `${v.state} Roads Authority` },
                        { label: "CTP Insurance",  val: v.ctpExpiry,       days: v.ctpDaysLeft,       status: v.ctpStatus,        note: v.ctpProvider },
                        { label: "Fleet Insurance",val: v.insuranceExpiry, days: v.insuranceDaysLeft, status: v.insuranceStatus,  note: `${v.insuranceProvider} — ${v.insurancePolicyNo}` },
                        { label: "Next Service",   val: v.nextService,     days: v.serviceDaysLeft,   status: v.serviceStatus,    note: "Scheduled maintenance" },
                      ].map(item => (
                        <div key={item.label} className={`border rounded-lg p-2.5 ${item.status === "overdue" ? "border-red-500/30 bg-red-500/5" : item.status === "due_soon" ? "border-amber-500/25 bg-amber-500/5" : "border-card-border"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">{item.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusBg(item.status)}`}>{statusLabel(item.status)}</span>
                          </div>
                          <div className={`text-xs font-medium ${daysColor(item.days)}`}>
                            {item.val} {item.days < 0 ? `(${Math.abs(item.days)} days overdue)` : item.days <= 30 ? `(${item.days} days)` : ""}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.note}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Authorised Drivers: </span>
                      <span className="text-foreground">{v.driverAccess}</span>
                    </div>
                    {v.notes && (
                      <div className={`text-xs px-3 py-2 rounded-lg ${v.overallStatus === "overdue" ? "bg-red-500/10 text-red-300" : v.overallStatus === "due_soon" ? "bg-amber-500/10 text-amber-300" : "bg-sidebar text-muted-foreground"}`}>
                        {v.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">No vehicles match your filters.</div>}
          </div>
        </div>
      )}

      {/* ══════════ COMPLIANCE MATRIX ══════════ */}
      {activeTab === "compliance" && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Compliance Matrix — All Vehicles</span>
            </div>
            <button onClick={handleExport} className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300">
              <Download size={12} />Export
            </button>
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-sidebar/50">
                  {["Rego", "State", "Base", "Type", "Make / Model", "Rego Expiry", "CTP Expiry", "Insurance Expiry", "Next Service", "Odo (km)", "Status"].map(h => (
                    <th key={h} className="text-left text-muted-foreground font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VEHICLES.map((v, i) => (
                  <tr key={v.id} className={`border-b border-card-border last:border-0 ${i % 2 === 0 ? "" : "bg-sidebar/30"} ${v.overallStatus === "overdue" ? "bg-red-500/5" : ""}`}>
                    <td className="px-3 py-2.5 font-bold text-foreground">{v.rego}</td>
                    <td className="px-3 py-2.5">{stateFlag(v.state)} {v.state}</td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{v.base.split(" (")[0]}</td>
                    <td className="px-3 py-2.5"><span className="bg-sidebar rounded px-1.5 py-0.5 text-muted-foreground">{v.type}</span></td>
                    <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{v.make} {v.model}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${daysColor(v.regoDaysLeft)}`}>{v.regoExpiry}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${daysColor(v.ctpDaysLeft)}`}>{v.ctpExpiry}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${daysColor(v.insuranceDaysLeft)}`}>{v.insuranceExpiry}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${daysColor(v.serviceDaysLeft)}`}>{v.nextService}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{v.odometer.toLocaleString()}</td>
                    <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(v.overallStatus)}`}>{statusLabel(v.overallStatus)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile compliance cards */}
          <div className="sm:hidden divide-y divide-card-border">
            {VEHICLES.map(v => (
              <div key={v.id} className={`p-3 space-y-1.5 ${v.overallStatus === "overdue" ? "bg-red-500/5" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{v.rego}</span>
                    <span className="text-xs text-muted-foreground ml-2">{stateFlag(v.state)} {v.state} · {v.type}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg(v.overallStatus)}`}>{statusLabel(v.overallStatus)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{v.make} {v.model} · {v.base.split(" (")[0]}</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><span className="text-muted-foreground">Rego: </span><span className={daysColor(v.regoDaysLeft)}>{v.regoExpiry}</span></div>
                  <div><span className="text-muted-foreground">CTP: </span><span className={daysColor(v.ctpDaysLeft)}>{v.ctpExpiry}</span></div>
                  <div><span className="text-muted-foreground">Insurance: </span><span className={daysColor(v.insuranceDaysLeft)}>{v.insuranceExpiry}</span></div>
                  <div><span className="text-muted-foreground">Service: </span><span className={daysColor(v.serviceDaysLeft)}>{v.nextService}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ AI AUDIT ══════════ */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={15} className="text-cyan-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>AI Compliance Audit — Ground Vehicle Fleet</span>
              <span className="ml-auto text-xs text-muted-foreground">NSW Roads · SA Dept for Infrastructure · ACT Access Canberra</span>
            </div>
            <div className="space-y-3">
              {/* Critical findings */}
              {[
                {
                  title: "[BK02RF] Toyota RAV4 — Rego, CTP & Insurance ALL EXPIRED (5 days overdue)",
                  body: "Base Car at Bankstown. Registration, Compulsory Third Party, and fleet insurance all expired 31 May 2026. Vehicle MUST NOT be driven until all three are renewed. Renew NSW registration online (Service NSW) and obtain new Green Slip immediately. Notify fleet manager and ground operations supervisor."
                },
                {
                  title: "[BW14QA] Mercedes Sprinter PTV — Service OVERDUE 6 days",
                  body: "Patient Transfer Van at Bankstown base. Odometer at 109,220 km. Service 6 days overdue. As a patient transport vehicle, this may constitute a roadworthiness compliance breach. Book immediately with approved RFDS fleet service provider."
                },
              ].map((f, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-3">
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-red-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{f.title}</div>
                    <div className="text-xs text-red-300/70 mt-0.5 leading-relaxed">{f.body}</div>
                  </div>
                </div>
              ))}
              {/* Warning findings */}
              {[
                { title: "[BH91KL] Sprinter PTV + [BH01RF] LandCruiser — Rego, CTP & Insurance expire 30 Jun 2026 (25 days)", body: "Both Broken Hill vehicles expire simultaneously. Given remote location processing times, renew before 20 Jun to avoid any gap in coverage. CTP Green Slip must be obtained prior to rego renewal (NSW requirement)." },
                { title: "[EJ42FR] Dubbo PTV + [DU03RF] Dubbo HiLux — Service due within 5–15 days", body: "Two Dubbo vehicles have services due within the fortnight. Book both in the same service cycle where possible to reduce downtime." },
                { title: "[BH03RF] Broken Hill HiLux — Rego/CTP/Insurance expire 31 Jul 2026 (55 days)", body: "Schedule renewal now to avoid Broken Hill base being short a logistics vehicle." },
                { title: "5 New Base PTVs (Griffith, Wagga Wagga, Orange, Bourke, Lightning Ridge) — Registration & documentation pending", body: "All five new base vans are operational (Mercedes-Benz Sprinter 519 CDI, 2022) but show rego, VIN, insurance policy numbers and service records as TBA. Fleet manager must action: (1) confirm rego plates and VINs with the dealer/registration authority, (2) obtain QBE policy numbers for each vehicle, (3) schedule initial service inspection, and (4) enter all details into this register before next compliance audit." },
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
                  <div className="text-xs font-semibold text-green-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Good Standing — {compliantCnt} of {totalVehicles} vehicles fully compliant</div>
                  <div className="text-xs text-green-300/70 mt-0.5 leading-relaxed">
                    EJ43FR, BH92KL, BW15QA (PTVs) · DU01RF, DU02RF, BH02RF, BH03RF, S441RFD (SA), BK01RF, BK03RF, YRR22F (ACT) and all 5 new base PTVs (Griffith, Wagga Wagga, Orange, Bourke, Lightning Ridge) are compliant across registration, CTP, insurance and service intervals. New base documentation to be completed.
                  </div>
                </div>
              </div>
              {/* Base-by-base notes */}
              <div className="border border-card-border rounded-xl p-3">
                <div className="text-xs font-semibold text-foreground mb-2.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Base-by-Base Audit Notes</div>
                <div className="space-y-2 text-xs">
                  {[
                    { base: "Dubbo (YSDU)",           color: "text-cyan-400",   note: "5 vehicles + 3 airside buggies. Two PTVs and utility due for service within a fortnight — book together to minimise downtime. Buggies require annual battery and brake inspection; next due Sep 2026." },
                    { base: "Broken Hill (YBHI)",      color: "text-cyan-400",   note: "5 vehicles including 1 SA-registered LandCruiser for SA clinic routes. BH91KL and BH01RF expire 30 Jun — priority renewal. BH03RF expires 31 Jul — schedule now. Processing delays common in remote areas; allow 2+ weeks." },
                    { base: "Bankstown (YSBK)",        color: "text-red-400",    note: "5 vehicles. BK02RF (RAV4) has expired rego, CTP and insurance — IMMEDIATE ACTION required before vehicle can be used. BW14QA service overdue 6 days — book this week. ACT-registered YRR22F is compliant; ensure cross-border operating permit is current." },
                    { base: "Griffith (YGTH)",         color: "text-amber-400",  note: "1 PTV operational. Rego plates, VIN, insurance policy number and service schedule all pending confirmation. Fleet manager to finalise documentation. Regional hub — high patient volume on Wagga Wagga and Sydney corridors; vehicle must be compliance-ready before operational handover." },
                    { base: "Wagga Wagga (YSWG)",      color: "text-amber-400",  note: "1 PTV operational. Documentation (rego, VIN, QBE policy, service record) pending. Major referral hub for Wagga Base Hospital — ensure vehicle is roadworthy certified and insurance current before commencing patient transfers." },
                    { base: "Orange (YORG)",           color: "text-amber-400",  note: "1 PTV operational. Documentation pending. Central West hub for Orange Base Hospital connections. Confirm rego plate and obtain CTP Green Slip from Service NSW before first patient transfer run." },
                    { base: "Bourke (YBKE)",           color: "text-amber-400",  note: "1 PTV operational. Documentation pending. Remote Far West location — nearest authorised service centre is Dubbo (approx. 360 km). Pre-schedule service well in advance and maintain higher stock of consumables on-site." },
                    { base: "Lightning Ridge (YLRD)",  color: "text-amber-400",  note: "1 PTV operational. Documentation pending. Most remote base — nearest major hospital 100+ km. Rego renewal must be processed online via Service NSW well before expiry; no local registry office. Annual roadworthy inspection required (vehicle >5 years); book nearest authorised inspector in advance." },
                  ].map(b => (
                    <div key={b.base} className="flex gap-2 py-1.5 border-b border-card-border last:border-0">
                      <MapPin size={11} className={`${b.color} mt-0.5 flex-shrink-0`} />
                      <div>
                        <span className={`font-semibold ${b.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{b.base}: </span>
                        <span className="text-muted-foreground">{b.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* State notes */}
              <div className="border border-card-border rounded-xl p-3">
                <div className="text-xs font-semibold text-foreground mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Multi-State Compliance Notes</div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p><span className="text-cyan-400 font-medium">NSW (19 vehicles across 8 bases):</span> CTP Green Slip must be renewed before registration. Service NSW online portal or Transport for NSW. Annual registration includes pink slip (roadworthy) for vehicles over 5 years. New base PTVs must complete rego and CTP before first patient transfer run.</p>
                  <p><span className="text-red-400 font-medium">SA (1 vehicle — S441RFD):</span> SA registration via SA Dept for Infrastructure. CTP via SGIC or approved insurer. Annual safety inspection required. Operating cross-border into NSW — ensure NSW non-resident permit is current for extended NSW operations.</p>
                  <p><span className="text-amber-400 font-medium">ACT (1 vehicle — YRR22F):</span> ACT registration via Access Canberra. CTP via NRMA or approved insurer. Annual vehicle inspection required at licensed inspection station.</p>
                </div>
              </div>
              {/* Score */}
              <div className="border border-card-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Overall Fleet Compliance Score</span>
                  <span className="text-lg font-bold text-amber-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>74%</span>
                </div>
                <div className="w-full bg-sidebar rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: "74%" }} />
                </div>
                <p className="text-xs text-muted-foreground">Score reduced by expired rego/CTP/insurance on BK02RF and overdue service on BW14QA. Resolve both immediately to restore fleet compliance. Target: 100%.</p>
              </div>
            </div>
            <button onClick={handleExport}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl px-4 py-3 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <Download size={15} />Download Full Vehicle Compliance Report PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
