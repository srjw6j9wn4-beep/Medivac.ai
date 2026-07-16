/**
 * SpecialMissions — QC Operations Workflow
 * Role-agnostic, operator-independent quality control for:
 * Lord Howe Island · NETS · ECMO · Isolation · Telehealth
 *
 * Design principle: procedure drives the outcome, not the person.
 * Every sign-off captures ROLE, not name — consistent regardless of who is on duty.
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import {
  Anchor, Heart, Activity, Plane, Shield, CheckCircle2, AlertTriangle,
  ChevronRight, Plus, ClipboardList, Clock, User, ChevronDown, ChevronUp,
  CheckSquare, Square, Loader2, ArrowRight, FileText, RotateCcw, X,
  Radio, Stethoscope, Globe,
} from "lucide-react";

interface Props { role: UserRole; }

// ─── Types ────────────────────────────────────────────────────────────────────
type MissionType = "lord-howe" | "nets" | "ecmo" | "isolation" | "telehealth" | "international-transfer";
type WorkflowStage =
  | "pre-flight"
  | "crew-brief"
  | "aircraft-config"
  | "patient-handover"
  | "airborne"
  | "post-flight"
  | "complete";

interface CheckItem {
  id: string;
  label: string;
  detail?: string;
  blocker?: boolean; // if unchecked, blocks stage advance
  role: string;      // which role verifies this item
}

interface ChecklistSection {
  stage: WorkflowStage;
  title: string;
  items: CheckItem[];
}

interface SignoffEntry {
  stage: WorkflowStage;
  role: string;
  timestamp: string;
  notes: string;
}

interface CheckState {
  checked: boolean;
  role: string;
  signedAt: string;
}

interface Session {
  id: number;
  missionType: MissionType;
  missionRef: string;
  status: WorkflowStage;
  aircraftReg: string | null;
  destination: string | null;
  checklistData: string; // JSON
  signoffs: string;       // JSON
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// ─── Mission definitions ──────────────────────────────────────────────────────
const MISSION_TYPES: {
  id: MissionType;
  label: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  accent: string;
  desc: string;
  defaultDest?: string;
} [] = [
  {
    id: "lord-howe",
    label: "Lord Howe Island",
    icon: <Anchor size={18} />,
    color: "text-orange-400",
    border: "border-orange-500/40",
    accent: "bg-orange-500/10",
    desc: "YLHI — 700 km over-water sector",
    defaultDest: "YLHI",
  },
  {
    id: "nets",
    label: "NETS",
    icon: <Heart size={18} />,
    color: "text-cyan-400",
    border: "border-cyan-500/40",
    accent: "bg-cyan-500/10",
    desc: "Neonatal Emergency Transport",
  },
  {
    id: "ecmo",
    label: "ECMO",
    icon: <Activity size={18} />,
    color: "text-purple-400",
    border: "border-purple-500/40",
    accent: "bg-purple-500/10",
    desc: "Extracorporeal Membrane Oxygenation",
  },
  {
    id: "isolation",
    label: "Isolation / Infectious",
    icon: <Shield size={18} />,
    color: "text-red-400",
    border: "border-red-500/40",
    accent: "bg-red-500/10",
    desc: "Confirmed or suspected infectious patient",
  },
  {
    id: "telehealth",
    label: "Telehealth Support",
    icon: <Radio size={18} />,
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    accent: "bg-emerald-500/10",
    desc: "Remote telehealth-assisted transfer",
  },
  {
    id: "international-transfer",
    label: "International Organ / Insurance",
    icon: <Globe size={18} />,
    color: "text-indigo-400",
    border: "border-indigo-500/40",
    accent: "bg-indigo-500/10",
    desc: "Cross-border organ retrieval or insurance repatriation",
  },
];

// ─── Checklists — operator-independent, role-tagged ──────────────────────────
const CHECKLISTS: Record<MissionType, ChecklistSection[]> = {
  "lord-howe": [
    {
      stage: "pre-flight",
      title: "Pre-flight Gate Checks",
      items: [
        { id: "lhi-01", label: "Life raft confirmed serviceable & aboard", blocker: true, role: "Pilot in Command", detail: "Check tag date within 12 months" },
        { id: "lhi-02", label: "Over-water survival pack loaded & sealed", blocker: true, role: "Pilot in Command", detail: "Pack contents per CASR Part 135 Schedule 7" },
        { id: "lhi-03", label: "EPIRB × 2 — battery & registration current", blocker: true, role: "Pilot in Command" },
        { id: "lhi-04", label: "Life jackets confirmed per pax count + crew", blocker: true, role: "Pilot in Command" },
        { id: "lhi-05", label: "HF communications tested on ATC frequency", blocker: true, role: "Pilot in Command" },
        { id: "lhi-06", label: "SARTIME lodged with JRCC Australia", blocker: true, role: "Dispatching Operator" },
        { id: "lhi-07", label: "Alternate aerodrome filed — Port Macquarie (YPMQ)", role: "Dispatching Operator" },
        { id: "lhi-08", label: "Fuel uplifted to ferry range + 45 min reserve", blocker: true, role: "Pilot in Command" },
        { id: "lhi-09", label: "APG weather release obtained — oceanic route", blocker: true, role: "Dispatching Operator" },
        { id: "lhi-10", label: "NAIPS flight plan filed — IFR oceanic", blocker: true, role: "Dispatching Operator" },
      ],
    },
    {
      stage: "crew-brief",
      title: "Crew Briefing",
      items: [
        { id: "lhi-11", label: "Over-water ditching procedure briefed to all crew", blocker: true, role: "Pilot in Command" },
        { id: "lhi-12", label: "Life jacket donning demonstration completed", role: "Flight Nurse / Paramedic" },
        { id: "lhi-13", label: "EPIRB activation procedure confirmed understood", role: "Pilot in Command" },
        { id: "lhi-14", label: "Emergency comms plan confirmed (HF + satellite backup)", role: "Pilot in Command" },
        { id: "lhi-15", label: "Patient briefed on over-water operation & equipment", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "aircraft-config",
      title: "Aircraft Configuration",
      items: [
        { id: "lhi-16", label: "Life raft stowage confirmed — accessible in flight", blocker: true, role: "Pilot in Command" },
        { id: "lhi-17", label: "Medical oxygen cylinders secured — min 2× D-size", role: "Flight Nurse / Paramedic" },
        { id: "lhi-18", label: "Stretcher locked — if configured", role: "Flight Nurse / Paramedic" },
        { id: "lhi-19", label: "All pax briefed — emergency exits & brace position", role: "Pilot in Command" },
      ],
    },
    {
      stage: "patient-handover",
      title: "Patient Acceptance",
      items: [
        { id: "lhi-20", label: "Patient clinical status assessed & documented", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "lhi-21", label: "Receiving facility at YLHI confirmed & available", blocker: true, role: "Dispatching Operator" },
        { id: "lhi-22", label: "Patient weight verified for W&B", role: "Pilot in Command" },
        { id: "lhi-23", label: "Medications & equipment manifest completed", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "airborne",
      title: "Airborne Monitoring",
      items: [
        { id: "lhi-24", label: "SARTIME activated — position report schedule set", blocker: true, role: "Pilot in Command" },
        { id: "lhi-25", label: "HF radio check passed — OCTA area control", role: "Pilot in Command" },
        { id: "lhi-26", label: "Patient clinical status stable — documented en route", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "post-flight",
      title: "Post-flight QC",
      items: [
        { id: "lhi-27", label: "SARTIME closed with JRCC", blocker: true, role: "Pilot in Command" },
        { id: "lhi-28", label: "Life raft & survival equipment returned to store", role: "Pilot in Command" },
        { id: "lhi-29", label: "Patient handover completed & documented", role: "Flight Nurse / Paramedic" },
        { id: "lhi-30", label: "Journey log signed — all sectors", blocker: true, role: "Pilot in Command" },
        { id: "lhi-31", label: "Tech log defect entry made if applicable", role: "Pilot in Command" },
        { id: "lhi-32", label: "Mission debrief notes completed", role: "Dispatching Operator" },
      ],
    },
  ],

  "nets": [
    {
      stage: "pre-flight",
      title: "Pre-flight Gate Checks",
      items: [
        { id: "nets-01", label: "NETS incubator confirmed serviceable & battery charged", blocker: true, role: "Flight Nurse / Paramedic", detail: "Check service tag and battery %age" },
        { id: "nets-02", label: "Neonatal specialist confirmed on crew", blocker: true, role: "Dispatching Operator" },
        { id: "nets-03", label: "Receiving NICU confirmed & bed available", blocker: true, role: "Dispatching Operator" },
        { id: "nets-04", label: "NETS team briefed & equipment loaded", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-05", label: "Medical oxygen — neonatal flow rates verified", role: "Flight Nurse / Paramedic" },
        { id: "nets-06", label: "Medications checked — cold chain if required", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-07", label: "Patient Transfer Authority obtained", blocker: true, role: "Dispatching Operator" },
        { id: "nets-08", label: "Medicare / Insurance cover confirmed", role: "Dispatching Operator" },
        { id: "nets-09", label: "APG weather release obtained", blocker: true, role: "Dispatching Operator" },
        { id: "nets-10", label: "NAIPS flight plan filed", blocker: true, role: "Dispatching Operator" },
      ],
    },
    {
      stage: "crew-brief",
      title: "Crew Briefing",
      items: [
        { id: "nets-11", label: "NETS clinical handover brief completed with referring team", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-12", label: "Incubator operation briefed to all crew", role: "Flight Nurse / Paramedic" },
        { id: "nets-13", label: "Turbulence / acceleration contingency plan discussed", role: "Pilot in Command" },
        { id: "nets-14", label: "Emergency diversion plan confirmed", role: "Pilot in Command" },
      ],
    },
    {
      stage: "aircraft-config",
      title: "Aircraft Configuration",
      items: [
        { id: "nets-15", label: "Incubator mounting & restraint confirmed", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-16", label: "Power supply connected & tested in aircraft", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-17", label: "All medical equipment secured for flight", role: "Flight Nurse / Paramedic" },
        { id: "nets-18", label: "Cabin temperature set for neonatal comfort", role: "Pilot in Command" },
      ],
    },
    {
      stage: "patient-handover",
      title: "Neonatal Patient Acceptance",
      items: [
        { id: "nets-19", label: "Neonate clinical status documented — APGAR/vital signs", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-20", label: "Referring clinician handover signature obtained", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-21", label: "Parent / guardian consent documented", blocker: true, role: "Dispatching Operator" },
        { id: "nets-22", label: "Neonate weight confirmed for dosing calculations", role: "Flight Nurse / Paramedic" },
        { id: "nets-23", label: "Incubator temperature pre-set to prescribed range", blocker: true, role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "airborne",
      title: "Airborne Monitoring",
      items: [
        { id: "nets-24", label: "Vital signs logged every 15 min from departure", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-25", label: "Incubator power & temperature monitored", role: "Flight Nurse / Paramedic" },
        { id: "nets-26", label: "Receiving NICU given updated ETA", role: "Dispatching Operator" },
      ],
    },
    {
      stage: "post-flight",
      title: "Post-flight QC",
      items: [
        { id: "nets-27", label: "Neonate clinical handover completed — receiving NICU", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-28", label: "Receiving clinician signature obtained", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "nets-29", label: "Incubator returned to store — cleaning protocol completed", role: "Flight Nurse / Paramedic" },
        { id: "nets-30", label: "Journey log signed — all sectors", blocker: true, role: "Pilot in Command" },
        { id: "nets-31", label: "Mission debrief & outcome documented", role: "Dispatching Operator" },
      ],
    },
  ],

  "ecmo": [
    {
      stage: "pre-flight",
      title: "Pre-flight Gate Checks",
      items: [
        { id: "ecmo-01", label: "ECMO circuit & pump confirmed serviceable", blocker: true, role: "Perfusionist", detail: "Check circuit integrity, prime status and flow calibration" },
        { id: "ecmo-02", label: "Perfusionist assigned & confirmed available", blocker: true, role: "Dispatching Operator" },
        { id: "ecmo-03", label: "ICU Doctor confirmed on crew", blocker: true, role: "Dispatching Operator" },
        { id: "ecmo-04", label: "ICU Nurse confirmed on crew", blocker: true, role: "Dispatching Operator" },
        { id: "ecmo-05", label: "Receiving ICU confirmed — ECMO-capable & bed available", blocker: true, role: "Dispatching Operator" },
        { id: "ecmo-06", label: "Aircraft power supply verified — ECMO load requirements", blocker: true, role: "Pilot in Command" },
        { id: "ecmo-07", label: "Backup battery capacity confirmed ≥ 2× flight duration", blocker: true, role: "Perfusionist" },
        { id: "ecmo-08", label: "Blood products on board if prescribed", role: "Flight Nurse / Paramedic" },
        { id: "ecmo-09", label: "Medications checked — heparin, vasopressors, sedation", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "ecmo-10", label: "APG weather release obtained", blocker: true, role: "Dispatching Operator" },
        { id: "ecmo-11", label: "NAIPS flight plan filed", blocker: true, role: "Dispatching Operator" },
      ],
    },
    {
      stage: "crew-brief",
      title: "Crew Briefing",
      items: [
        { id: "ecmo-12", label: "ECMO team clinical brief completed", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-13", label: "Power failure contingency — manual crank procedure confirmed", blocker: true, role: "Perfusionist" },
        { id: "ecmo-14", label: "In-flight emergency scenarios reviewed", role: "Pilot in Command" },
        { id: "ecmo-15", label: "Diversion plan agreed — nearest ICU en route", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-16", label: "EMI/RF interference protocol understood by all", role: "Perfusionist" },
      ],
    },
    {
      stage: "aircraft-config",
      title: "Aircraft Configuration",
      items: [
        { id: "ecmo-17", label: "ECMO pump mounted & power connected — aircraft power tested", blocker: true, role: "Perfusionist" },
        { id: "ecmo-18", label: "EMI shielding confirmed — avionics interference check passed", blocker: true, role: "Pilot in Command" },
        { id: "ecmo-19", label: "All medical equipment secured — no loose items in cabin", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "ecmo-20", label: "Oxygen supply — flow rates confirmed for ECMO + patient", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "patient-handover",
      title: "Patient Acceptance",
      items: [
        { id: "ecmo-21", label: "Patient haemodynamics documented & stable for transport", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-22", label: "ECMO flows & sweep gas checked post-patient connection", blocker: true, role: "Perfusionist" },
        { id: "ecmo-23", label: "Cannula position confirmed — no dislodgement during transfer", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-24", label: "Referring ICU consultant sign-off obtained", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-25", label: "All lines, drains & tubes secured for flight", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "airborne",
      title: "Airborne Monitoring",
      items: [
        { id: "ecmo-26", label: "ECMO flows monitored — logged every 10 min", blocker: true, role: "Perfusionist" },
        { id: "ecmo-27", label: "Patient haemodynamics logged every 15 min", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-28", label: "Heparin infusion rate — ACT check at 30 min", role: "Perfusionist" },
        { id: "ecmo-29", label: "Receiving ICU notified with updated ETA & clinical status", role: "Dispatching Operator" },
      ],
    },
    {
      stage: "post-flight",
      title: "Post-flight QC",
      items: [
        { id: "ecmo-30", label: "Patient handover completed — receiving ICU team", blocker: true, role: "ICU Doctor" },
        { id: "ecmo-31", label: "ECMO team sign-off — receiving perfusionist", blocker: true, role: "Perfusionist" },
        { id: "ecmo-32", label: "ECMO circuit returned to service team — decontamination", role: "Perfusionist" },
        { id: "ecmo-33", label: "Aircraft decontamination completed", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "ecmo-34", label: "Journey log signed — all sectors", blocker: true, role: "Pilot in Command" },
        { id: "ecmo-35", label: "ECMO mission debrief completed — all crew", role: "Dispatching Operator" },
      ],
    },
  ],

  "isolation": [
    {
      stage: "pre-flight",
      title: "Pre-flight Gate Checks",
      items: [
        { id: "iso-01", label: "Isolation pod or barrier configured — infection class confirmed", blocker: true, role: "Flight Nurse / Paramedic", detail: "Airborne / Droplet / Contact — PPE tier matched" },
        { id: "iso-02", label: "PPE stockpile confirmed — sufficient for all crew + duration", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-03", label: "Negative pressure capability verified (if applicable)", role: "Flight Nurse / Paramedic" },
        { id: "iso-04", label: "Infection disease notification submitted — public health", blocker: true, role: "Dispatching Operator" },
        { id: "iso-05", label: "Receiving facility isolation room confirmed available", blocker: true, role: "Dispatching Operator" },
        { id: "iso-06", label: "Crew immunisation / fit-test status verified", blocker: true, role: "Dispatching Operator" },
        { id: "iso-07", label: "APG weather release obtained", blocker: true, role: "Dispatching Operator" },
        { id: "iso-08", label: "NAIPS flight plan filed", blocker: true, role: "Dispatching Operator" },
      ],
    },
    {
      stage: "crew-brief",
      title: "Crew Briefing",
      items: [
        { id: "iso-09", label: "PPE donning & doffing procedure demonstrated", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-10", label: "Decontamination protocol post-flight briefed to all", role: "Flight Nurse / Paramedic" },
        { id: "iso-11", label: "Patient isolation protocol confirmed — crew zone discipline", blocker: true, role: "Pilot in Command" },
        { id: "iso-12", label: "Emergency access to patient — procedure agreed", role: "Pilot in Command" },
      ],
    },
    {
      stage: "aircraft-config",
      title: "Aircraft Configuration",
      items: [
        { id: "iso-13", label: "Isolation barrier installed and integrity checked", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-14", label: "PPE station positioned — accessible without crossing zone", role: "Flight Nurse / Paramedic" },
        { id: "iso-15", label: "HEPA filter / ventilation mode confirmed", role: "Pilot in Command" },
        { id: "iso-16", label: "Waste disposal bags secured — labelled biohazard", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "patient-handover",
      title: "Patient Acceptance",
      items: [
        { id: "iso-17", label: "Patient infection status confirmed — organism & precaution class", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-18", label: "Full PPE donned by all clinical crew before patient contact", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-19", label: "Patient masked / contained per infection class", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-20", label: "Referring team handover documentation received", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "airborne",
      title: "Airborne Monitoring",
      items: [
        { id: "iso-21", label: "Zone discipline maintained — no crew cross-contamination", blocker: true, role: "Pilot in Command" },
        { id: "iso-22", label: "Patient vital signs monitored — minimised contact protocol", role: "Flight Nurse / Paramedic" },
        { id: "iso-23", label: "Receiving facility given updated ETA & infection status", role: "Dispatching Operator" },
      ],
    },
    {
      stage: "post-flight",
      title: "Post-flight QC & Decontamination",
      items: [
        { id: "iso-24", label: "Patient transferred — isolation maintained at receiving facility", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-25", label: "Aircraft decontamination completed — biocide spray & wipe protocol", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-26", label: "All PPE disposed — biohazard bags sealed and removed", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "iso-27", label: "Crew post-exposure assessment completed", blocker: true, role: "Dispatching Operator" },
        { id: "iso-28", label: "Public health post-transport notification submitted", role: "Dispatching Operator" },
        { id: "iso-29", label: "Journey log signed — all sectors", blocker: true, role: "Pilot in Command" },
        { id: "iso-30", label: "Decontamination certificate issued to engineering", blocker: true, role: "Dispatching Operator" },
      ],
    },
  ],

  "telehealth": [
    {
      stage: "pre-flight",
      title: "Pre-flight Gate Checks",
      items: [
        { id: "th-01", label: "Telehealth platform confirmed — GP / specialist connected", blocker: true, role: "Dispatching Operator" },
        { id: "th-02", label: "Satellite or 4G comms confirmed — coverage for route", blocker: true, role: "Pilot in Command" },
        { id: "th-03", label: "Tablet / device charged & tested — video and audio clear", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "th-04", label: "Clinician at remote end briefed on mission details", blocker: true, role: "Dispatching Operator" },
        { id: "th-05", label: "Patient consent for telehealth consultation obtained", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "th-06", label: "APG weather release obtained", blocker: true, role: "Dispatching Operator" },
        { id: "th-07", label: "NAIPS flight plan filed", blocker: true, role: "Dispatching Operator" },
      ],
    },
    {
      stage: "crew-brief",
      title: "Crew Briefing",
      items: [
        { id: "th-08", label: "Telehealth session protocol confirmed — session activation", role: "Flight Nurse / Paramedic" },
        { id: "th-09", label: "Connectivity contingency — comms blackout plan agreed", role: "Pilot in Command" },
        { id: "th-10", label: "Remote clinician contact number confirmed", role: "Dispatching Operator" },
      ],
    },
    {
      stage: "aircraft-config",
      title: "Aircraft Configuration",
      items: [
        { id: "th-11", label: "Device mount secured — accessible for flight nurse", role: "Flight Nurse / Paramedic" },
        { id: "th-12", label: "External antenna connected (if installed)", role: "Pilot in Command" },
        { id: "th-13", label: "Examination lighting confirmed adequate for video", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "patient-handover",
      title: "Patient & Clinician Connection",
      items: [
        { id: "th-14", label: "Telehealth session initiated — clinician connected", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "th-15", label: "Patient vital signs shared with remote clinician", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "th-16", label: "Treatment orders received from remote clinician & documented", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "airborne",
      title: "Airborne Monitoring",
      items: [
        { id: "th-17", label: "Telehealth session maintained — connectivity logged", role: "Flight Nurse / Paramedic" },
        { id: "th-18", label: "Patient status updates provided to remote clinician every 20 min", role: "Flight Nurse / Paramedic" },
        { id: "th-19", label: "Any treatment changes documented in real time", role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "post-flight",
      title: "Post-flight QC",
      items: [
        { id: "th-20", label: "Telehealth session closed — clinician sign-off recorded", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "th-21", label: "Session recording / transcript archived (if applicable)", role: "Dispatching Operator" },
        { id: "th-22", label: "Patient outcome documented", role: "Flight Nurse / Paramedic" },
        { id: "th-23", label: "Journey log signed — all sectors", blocker: true, role: "Pilot in Command" },
        { id: "th-24", label: "Device disinfected & returned to store", role: "Flight Nurse / Paramedic" },
      ],
    },
  ],

  "international-transfer": [
    {
      stage: "pre-flight",
      title: "Pre-Flight — International Clearances",
      items: [
        { id: "intl-01", label: "International flight plan filed & accepted — ICAO format", blocker: true, role: "Pilot in Command" },
        { id: "intl-02", label: "Overflight permits obtained for all transit countries", blocker: true, role: "Dispatching Operator" },
        { id: "intl-03", label: "CASA Part 121 AOC confirmed for this registration", blocker: true, role: "Pilot in Command" },
        { id: "intl-04", label: "Crew passports & visas valid for all destination/transit countries", blocker: true, role: "Pilot in Command" },
        { id: "intl-05", label: "Customs and Border Protection (ABF) notified — outbound", role: "Dispatching Operator" },
        { id: "intl-06", label: "Destination country entry requirements confirmed", blocker: true, role: "Dispatching Operator" },
        { id: "intl-07", label: "Health authority declarations prepared (if required)", role: "Flight Nurse / Paramedic" },
        { id: "intl-08", label: "Aerodrome PPR obtained for international destination", role: "Pilot in Command" },
        { id: "intl-09", label: "Handling agent confirmed at destination", role: "Dispatching Operator" },
        { id: "intl-10", label: "Fuel arrangements confirmed at all stops", blocker: true, role: "Pilot in Command" },
        { id: "intl-11", label: "Weather & NOTAM check completed — all sectors including international", blocker: true, role: "Pilot in Command" },
        { id: "intl-12", label: "ETOPS / Extended range authorisation confirmed (if applicable)", role: "Pilot in Command" },
      ],
    },
    {
      stage: "crew-brief",
      title: "Crew Brief — Mission Specifics",
      items: [
        // Organ-specific items
        { id: "intl-13", label: "Organ Donor Authority (Donate Life / ANZOD) notified", blocker: true, role: "Dispatching Operator", detail: "For organ retrieval missions only" },
        { id: "intl-14", label: "Transplant coordinator contact details confirmed", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-15", label: "Cold ischaemia time window noted & clock started at retrieval", blocker: true, role: "Flight Nurse / Paramedic", detail: "Heart/Lung: 4–6 hrs | Liver: 12 hrs | Kidney: 24 hrs" },
        { id: "intl-16", label: "Receiving transplant team confirmed & available at destination", blocker: true, role: "Dispatching Operator" },
        // Insurance-specific items
        { id: "intl-17", label: "Insurance company medical authority reference number obtained", blocker: true, role: "Dispatching Operator", detail: "For repatriation/insurance missions" },
        { id: "intl-18", label: "Financial liability confirmation received in writing", blocker: true, role: "Dispatching Operator" },
        { id: "intl-19", label: "Receiving hospital acceptance confirmed", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-20", label: "Patient/family informed consent for international transfer documented", blocker: true, role: "Flight Nurse / Paramedic" },
        // General
        { id: "intl-21", label: "Emergency diversion airports identified — all sectors", role: "Pilot in Command" },
        { id: "intl-22", label: "In-flight emergency protocols briefed — international context", role: "Pilot in Command" },
      ],
    },
    {
      stage: "aircraft-config",
      title: "Aircraft Config — Jet & Medical",
      items: [
        { id: "intl-23", label: "Aircraft airworthiness confirmed — journey log current", blocker: true, role: "Pilot in Command" },
        { id: "intl-24", label: "Part 121 maintenance release signed", blocker: true, role: "Pilot in Command" },
        { id: "intl-25", label: "Fuel load calculated for international range + alternate + reserves", blocker: true, role: "Pilot in Command" },
        { id: "intl-26", label: "Medical equipment installed & serviceable", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-27", label: "Organ transport container loaded — temp monitoring active", blocker: true, role: "Flight Nurse / Paramedic", detail: "For organ missions — verify cooling/perfusion active" },
        { id: "intl-28", label: "Medical oxygen supply confirmed — extended duration", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-29", label: "Defibrillator, ventilator & medication stock checked", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-30", label: "HF / SATCOM comms tested & operational", blocker: true, role: "Pilot in Command" },
        { id: "intl-31", label: "Aircraft documents — Airworthiness, Insurance, Registration on board", blocker: true, role: "Pilot in Command" },
      ],
    },
    {
      stage: "patient-handover",
      title: "Patient / Organ Handover",
      items: [
        { id: "intl-32", label: "Patient identity confirmed — full name, DOB, passport", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-33", label: "Medical summary & transfer documentation received", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-34", label: "Sending physician handover completed — verbal & written", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-35", label: "Organ retrieval surgical team handover completed", blocker: true, role: "Flight Nurse / Paramedic", detail: "For organ missions" },
        { id: "intl-36", label: "Organ cold time logged at handover", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-37", label: "Customs declaration forms completed for patient/organ transport", role: "Dispatching Operator" },
        { id: "intl-38", label: "Border health declaration completed (if required)", role: "Flight Nurse / Paramedic" },
        { id: "intl-39", label: "Patient stable & fit for air transport — fitness to fly confirmed", blocker: true, role: "Flight Nurse / Paramedic" },
      ],
    },
    {
      stage: "airborne",
      title: "En Route — International Sectors",
      items: [
        { id: "intl-40", label: "Position reports at required intervals — HF/SATCOM", role: "Pilot in Command" },
        { id: "intl-41", label: "FIR boundary position reports filed", role: "Pilot in Command" },
        { id: "intl-42", label: "Organ cold time monitored — notify transplant coordinator if nearing limit", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-43", label: "Organ perfusion/temp status checked every 30 min", role: "Flight Nurse / Paramedic" },
        { id: "intl-44", label: "Patient vital signs monitored & documented every 20 min", role: "Flight Nurse / Paramedic" },
        { id: "intl-45", label: "Customs arrival notification transmitted (if required by destination)", role: "Dispatching Operator" },
        { id: "intl-46", label: "Diversion fuel state checked — alternate remaining confirmed", role: "Pilot in Command" },
      ],
    },
    {
      stage: "post-flight",
      title: "Post-Flight — Handover & Compliance",
      items: [
        { id: "intl-47", label: "Organ handover to receiving surgical team — cold time logged at delivery", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-48", label: "ANZOD / Donate Life mission completion report submitted", blocker: true, role: "Dispatching Operator", detail: "For organ missions" },
        { id: "intl-49", label: "Insurance company post-transfer report submitted", blocker: true, role: "Dispatching Operator", detail: "For insurance/repatriation missions" },
        { id: "intl-50", label: "Patient handover to receiving facility — written confirmation", blocker: true, role: "Flight Nurse / Paramedic" },
        { id: "intl-51", label: "Customs clearance completed — arrival declaration lodged", role: "Pilot in Command" },
        { id: "intl-52", label: "ABF inbound notification lodged (for return to Australia)", role: "Dispatching Operator" },
        { id: "intl-53", label: "Journey log signed — all international sectors", blocker: true, role: "Pilot in Command" },
        { id: "intl-54", label: "Part 121 operational record completed", blocker: true, role: "Pilot in Command" },
        { id: "intl-55", label: "Mission debrief completed — all crew", role: "Dispatching Operator" },
        { id: "intl-56", label: "Medivac.ai mission summary exported for audit file", role: "Dispatching Operator" },
      ],
    },
  ],
};

// ─── Workflow stage config ────────────────────────────────────────────────────
const STAGES: { id: WorkflowStage; label: string; short: string }[] = [
  { id: "pre-flight",       label: "Pre-flight",       short: "Pre-flight" },
  { id: "crew-brief",       label: "Crew Brief",        short: "Brief"      },
  { id: "aircraft-config",  label: "Aircraft Config",   short: "Config"     },
  { id: "patient-handover", label: "Patient Handover",  short: "Handover"   },
  { id: "airborne",         label: "Airborne",          short: "Airborne"   },
  { id: "post-flight",      label: "Post-flight QC",    short: "Post-QC"    },
  { id: "complete",         label: "Complete",          short: "Done"       },
];

const STAGE_IDX: Record<WorkflowStage, number> = Object.fromEntries(
  STAGES.map((s, i) => [s.id, i])
) as Record<WorkflowStage, number>;

const ROLES = [
  "Pilot in Command",
  "First Officer",
  "Flight Nurse / Paramedic",
  "Dispatching Operator",
  "ICU Doctor",
  "Perfusionist",
  "Other",
];

function roleToSigningRole(r: UserRole): string {
  if (r === 'pilot' || r === 'senior_base_pilot' || r === 'hofo' || r === 'hotac' || r === 'training_captain') return "Pilot in Command";
  if (r === 'nurse' || r === 'senior_flight_nurse' || r === 'ordering_nurse') return "Flight Nurse / Paramedic";
  if (r === 'doctor') return "ICU Doctor";
  if (r === 'dispatcher') return "Dispatching Operator";
  return "Other";
}

function nextStage(s: WorkflowStage): WorkflowStage {
  const idx = STAGE_IDX[s];
  return STAGES[Math.min(idx + 1, STAGES.length - 1)].id;
}

function genRef(type: MissionType): string {
  const prefix: Record<MissionType, string> = {
    "lord-howe": "LHI",
    nets: "NETS",
    ecmo: "ECMO",
    isolation: "ISO",
    telehealth: "TH",
    "international-transfer": "INTL",
  };
  const y = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix[type]}-${y}-${n}`;
}

// ─── New session modal ────────────────────────────────────────────────────────
function NewSessionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (type: MissionType, aircraft: string, dest: string) => void;
}) {
  const [selType, setSelType] = useState<MissionType>("lord-howe");
  const [aircraft, setAircraft] = useState("");
  const [dest, setDest] = useState("");
  const def = MISSION_TYPES.find(m => m.id === selType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-card-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            New QC Workflow Session
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mission Type</label>
            <div className="grid grid-cols-1 gap-2">
              {MISSION_TYPES.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelType(m.id); setDest(m.defaultDest ?? ""); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selType === m.id ? `${m.border} ${m.accent}` : "border-card-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className={m.color}>{m.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.desc}</div>
                  </div>
                  {selType === m.id && <CheckCircle2 size={16} className={`ml-auto ${m.color}`} />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Aircraft Reg</label>
              <input
                value={aircraft}
                onChange={e => setAircraft(e.target.value.toUpperCase())}
                placeholder="VH-MVW"
                className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-400/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Destination</label>
              <input
                value={dest}
                onChange={e => setDest(e.target.value.toUpperCase())}
                placeholder="YLHI"
                className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-400/40"
              />
            </div>
          </div>

          <button
            onClick={() => onCreate(selType, aircraft, dest)}
            className="w-full py-2.5 bg-cyan-500/15 border border-cyan-400/40 rounded-xl text-sm text-cyan-300 font-bold hover:bg-cyan-500/25 transition-colors"
          >
            Start Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Session detail / workflow view ──────────────────────────────────────────
function SessionWorkflow({
  session,
  onClose,
  onUpdate,
  role,
}: {
  session: Session;
  onClose: () => void;
  onUpdate: (updates: Partial<Session>) => void;
  role: UserRole;
}) {
  const mCfg  = MISSION_TYPES.find(m => m.id === session.missionType)!;
  const stage = session.status as WorkflowStage;

  // Local optimistic state — updated instantly on click, synced to server with debounce
  const [checklistData, setChecklistData] = useState<Record<string, CheckState>>(
    () => JSON.parse(session.checklistData || "{}")
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  // Sync server → local ONLY when switching to a different session or when there is no
  // pending debounce (i.e. the user is not actively ticking items).
  // This prevents the server response from overwriting optimistic UI mid-checklist.
  const prevSessionId = useRef(session.id);
  useEffect(() => {
    const switchedSession = session.id !== prevSessionId.current;
    const noPendingSync   = debounceRef.current === null;
    if (switchedSession || noPendingSync) {
      prevSessionId.current = session.id;
      setChecklistData(JSON.parse(session.checklistData || "{}"));
    }
  }, [session.id, session.checklistData]);

  const signoffs: SignoffEntry[] = useMemo(
    () => JSON.parse(session.signoffs || "[]"),
    [session.signoffs]
  );

  const [signingRole, setSigningRole] = useState(() => roleToSigningRole(role));
  const [signingNotes, setSigningNotes] = useState("");
  const [showSignoff, setShowSignoff] = useState(false);
  const [showStandDown, setShowStandDown] = useState(false);
  const [sdReason, setSdReason] = useState("");
  const [sdAdvisedBy, setSdAdvisedBy] = useState("");
  const [sdSignature, setSdSignature] = useState("");
  const [sdComments, setSdComments] = useState("");

  // All checklist sections for this mission type
  const sections = CHECKLISTS[session.missionType] ?? [];
  // Current stage's section
  const currentSection = sections.find(s => s.stage === stage);

  // Items for current stage — with their check state
  const items = currentSection?.items ?? [];

  // Check if current stage blockers are all satisfied
  const blockers = items.filter(i => i.blocker);
  const blockersOk = blockers.every(b => checklistData[b.id]?.checked);
  const allChecked = items.every(i => checklistData[i.id]?.checked);

  // Debounced server sync — UI updates instantly, API call fires 600ms after last toggle
  const syncToServer = useCallback((data: Record<string, CheckState>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdateRef.current({ checklistData: JSON.stringify(data) });
    }, 600);
  }, []);

  function toggleItem(item: CheckItem) {
    if (stage === "complete") return;
    setChecklistData(prev => {
      const newData = {
        ...prev,
        [item.id]: {
          checked: !prev[item.id]?.checked,
          role: signingRole,
          signedAt: new Date().toISOString(),
        },
      };
      syncToServer(newData);
      return newData;
    });
  }

  function advanceStage() {
    if (!blockersOk) return;
    // Flush any pending checklist debounce before advancing stage
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const ns = nextStage(stage);
    const newSignoffs: SignoffEntry[] = [
      ...signoffs,
      {
        stage,
        role: signingRole,
        timestamp: new Date().toISOString(),
        notes: signingNotes.trim(),
      },
    ];
    onUpdate({
      checklistData: JSON.stringify(checklistData),
      status: ns,
      signoffs: JSON.stringify(newSignoffs),
      ...(ns === "complete" ? { completedAt: new Date().toISOString() } : {}),
    });
    setSigningNotes("");
    setShowSignoff(false);
  }

  // Completion progress across all stages
  const allItems = sections.flatMap(s => s.items);
  const checkedCount = allItems.filter(i => checklistData[i.id]?.checked).length;
  const pct = allItems.length ? Math.round((checkedCount / allItems.length) * 100) : 0;

  const stageIdx  = STAGE_IDX[stage];
  const isComplete = stage === "complete";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {showStandDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-red-500/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-400" />
              <h2 className="text-base font-bold text-red-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Stand Down — {session.missionRef}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">This will close the mission as stood down. All fields are required for audit.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason for Stand Down *</label>
                <textarea
                  value={sdReason}
                  onChange={e => setSdReason(e.target.value)}
                  rows={3}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  placeholder="Describe the reason for standing down this mission..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Advised By *</label>
                <input
                  value={sdAdvisedBy}
                  onChange={e => setSdAdvisedBy(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  placeholder="Name and role of person who advised stand down"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Timestamp</label>
                <input
                  value={new Date().toLocaleString('en-AU')}
                  readOnly
                  className="w-full text-sm bg-background/50 border border-border rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Signature / Full Name *</label>
                <input
                  value={sdSignature}
                  onChange={e => setSdSignature(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  placeholder="Type your full name as signature"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Additional Comments</label>
                <textarea
                  value={sdComments}
                  onChange={e => setSdComments(e.target.value)}
                  rows={2}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (!sdReason || !sdAdvisedBy || !sdSignature) return;
                  const standDownData = {
                    standDown: true,
                    reason: sdReason,
                    advisedBy: sdAdvisedBy,
                    timestamp: new Date().toISOString(),
                    signature: sdSignature,
                    comments: sdComments,
                    role: signingRole,
                  };
                  onUpdate({ status: 'complete' as WorkflowStage, notes: JSON.stringify(standDownData) });
                  onClose();
                }}
                disabled={!sdReason || !sdAdvisedBy || !sdSignature}
                className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Stand Down
              </button>
              <button
                onClick={() => setShowStandDown(false)}
                className="px-4 py-2 bg-card border border-card-border text-muted-foreground rounded-xl text-sm font-semibold hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-card-border bg-card/80 backdrop-blur-sm shrink-0">
        <button
          onClick={() => setShowStandDown(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/25 transition-colors"
        >
          <AlertTriangle size={13} /> Stand Down
        </button>
        <button onClick={onClose} className="p-2 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors">
          <X size={16} />
        </button>
        <span className={mCfg.color}>{mCfg.icon}</span>
        <div>
          <h2 className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {mCfg.label} — QC Workflow
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{session.missionRef}</span>
            {session.aircraftReg && <><span>·</span><span className="font-mono">{session.aircraftReg}</span></>}
            {session.destination && <><span>·</span><span>{session.destination}</span></>}
          </div>
        </div>

        {/* Overall progress */}
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Overall progress</div>
            <div className="text-sm font-bold text-cyan-300">{pct}% · {checkedCount}/{allItems.length} items</div>
          </div>
          <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Stage stepper */}
      <div className="px-6 py-3 border-b border-card-border bg-muted/5 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1 min-w-max">
          {STAGES.filter(s => s.id !== "complete").map((s, idx) => {
            const done    = stageIdx > idx;
            const current = stageIdx === idx;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  isComplete
                    ? "bg-green-500/15 text-green-300 border border-green-500/30"
                    : done
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                      : current
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-transparent text-muted-foreground border border-transparent"
                }`}>
                  {done || isComplete
                    ? <CheckCircle2 size={11} className="text-cyan-400" />
                    : current
                      ? <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  }
                  {s.short}
                </div>
                {idx < STAGES.length - 2 && (
                  <ChevronRight size={12} className="text-muted-foreground/30" />
                )}
              </div>
            );
          })}
          {isComplete && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 ml-1">
              <CheckCircle2 size={11} /> Complete
            </div>
          )}
        </div>
      </div>

      {/* Role selector bar */}
      <div className="px-6 py-2.5 border-b border-card-border bg-muted/5 shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <User size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Signing as role:</span>
        </div>
        {role === 'admin' ? (
          <select
            value={signingRole}
            onChange={e => setSigningRole(e.target.value)}
            className="bg-card border border-card-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-cyan-400/40"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : (
          <span className="text-xs font-semibold text-cyan-400 px-2 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
            {signingRole}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-2">
          Tick each item as your role verifies it. All operators follow the same procedure.
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        {isComplete ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-green-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Mission Complete — All QC Gates Cleared
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              All {allItems.length} checklist items were verified and all workflow stages signed off.
              This session is archived for compliance audit purposes.
            </p>
            {session.completedAt && (
              <div className="text-xs text-muted-foreground font-mono">
                Completed: {new Date(session.completedAt).toLocaleString("en-AU")}
              </div>
            )}
            {/* Signoff log */}
            <div className="w-full max-w-lg text-left mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sign-off Log</h4>
              {signoffs.map((s, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-t border-card-border first:border-0">
                  <CheckCircle2 size={13} className="text-green-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{STAGES.find(st => st.id === s.stage)?.label}</div>
                    <div className="text-xs text-muted-foreground">{s.role} · {new Date(s.timestamp).toLocaleString("en-AU")}</div>
                    {s.notes && <div className="text-xs text-slate-400 mt-0.5 italic">"{s.notes}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Current stage checklist */}
            {currentSection && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                      Stage {stageIdx + 1} of {STAGES.length - 1}: {currentSection.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {items.filter(i => checklistData[i.id]?.checked).length}/{items.length} items verified
                      {blockers.length > 0 && ` · ${blockers.filter(b => !checklistData[b.id]?.checked).length} blockers remaining`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map(item => {
                    const state = checklistData[item.id];
                    const checked = state?.checked ?? false;
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          checked
                            ? "bg-green-500/8 border-green-500/25"
                            : item.blocker
                              ? "bg-card border-amber-500/30 hover:border-amber-400/50"
                              : "bg-card border-card-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {checked
                            ? <CheckSquare size={16} className="text-green-400" />
                            : <Square size={16} className={item.blocker ? "text-amber-400/70" : "text-muted-foreground/40"} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium leading-snug ${checked ? "line-through text-muted-foreground" : ""}`}>
                            {item.label}
                          </div>
                          {item.detail && (
                            <div className="text-xs text-muted-foreground mt-0.5 italic">{item.detail}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground/60 font-mono bg-muted/20 px-1.5 py-0.5 rounded">
                              Verified by: {item.role}
                            </span>
                            {item.blocker && !checked && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                REQUIRED TO ADVANCE
                              </span>
                            )}
                            {checked && state && (
                              <span className="text-[10px] text-green-400/70 font-mono">
                                ✓ {state.role} · {new Date(state.signedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false })}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Previous stages summary */}
            {stageIdx > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed Stages</h4>
                <div className="space-y-2">
                  {signoffs.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5 text-xs">
                      <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                      <span className="font-semibold text-green-300">{STAGES.find(st => st.id === s.stage)?.label}</span>
                      <span className="text-muted-foreground">signed off by {s.role}</span>
                      <span className="ml-auto font-mono text-muted-foreground/60">
                        {new Date(s.timestamp).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage advance panel */}
            <div className={`rounded-2xl border p-5 ${
              blockersOk ? "border-cyan-500/30 bg-cyan-500/5" : "border-card-border bg-muted/10"
            }`}>
              {!blockersOk ? (
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-300">Stage advance blocked</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {blockers.filter(b => !checklistData[b.id]?.checked).length} required item(s) must be verified before proceeding.
                      Checklist items marked "REQUIRED TO ADVANCE" must be ticked.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-cyan-400" />
                    <div className="text-sm font-semibold text-cyan-300">
                      {stage === "post-flight" ? "All stages complete — close mission" : `Ready to advance to: ${STAGES[stageIdx + 1]?.label}`}
                    </div>
                  </div>

                  {!showSignoff ? (
                    <button
                      onClick={() => setShowSignoff(true)}
                      className="w-full py-2.5 bg-cyan-500/15 border border-cyan-400/40 rounded-xl text-sm text-cyan-300 font-bold hover:bg-cyan-500/25 transition-colors"
                    >
                      {stage === "post-flight" ? "Complete Mission & Close" : `Sign Off & Advance →`}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Notes for this sign-off (optional)
                        </label>
                        <textarea
                          rows={2}
                          value={signingNotes}
                          onChange={e => setSigningNotes(e.target.value)}
                          placeholder="Any deviations, observations, or comments…"
                          className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/40 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSignoff(false)}
                          className="px-4 py-2 border border-card-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={advanceStage}
                          className="flex-1 py-2 bg-cyan-500/15 border border-cyan-400/40 rounded-lg text-sm text-cyan-300 font-bold hover:bg-cyan-500/25 transition-colors"
                        >
                          Confirm Sign-off — {signingRole}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Session list card ────────────────────────────────────────────────────────
function SessionCard({
  session,
  onClick,
}: {
  session: Session;
  onClick: () => void;
}) {
  const mCfg    = MISSION_TYPES.find(m => m.id === session.missionType)!;
  const stageIdx = STAGE_IDX[session.status as WorkflowStage] ?? 0;
  const isComplete = session.status === "complete";
  const sections = CHECKLISTS[session.missionType] ?? [];
  const allItems = sections.flatMap(s => s.items);
  const cd: Record<string, CheckState> = JSON.parse(session.checklistData || "{}");
  const checkedCount = allItems.filter(i => cd[i.id]?.checked).length;
  const pct = allItems.length ? Math.round((checkedCount / allItems.length) * 100) : 0;

  const stageLabel = STAGES.find(s => s.id === session.status)?.label ?? session.status;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card rounded-2xl border p-5 hover:border-muted-foreground/30 transition-all group ${mCfg.border}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span className={mCfg.color}>{mCfg.icon}</span>
          <div>
            <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {mCfg.label}
            </div>
            <div className="text-xs font-mono text-muted-foreground">{session.missionRef}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
          isComplete
            ? "bg-green-500/10 border-green-500/20 text-green-300"
            : stageIdx === 0
              ? "bg-slate-500/10 border-slate-500/20 text-slate-300"
              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
        }`}>
          {isComplete ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {stageLabel}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        {session.aircraftReg && <span className="font-mono">{session.aircraftReg}</span>}
        {session.destination && <><span>→</span><span>{session.destination}</span></>}
        <span className="ml-auto">{new Date(session.createdAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{checkedCount}/{allItems.length} items verified</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-cyan-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1 mt-3">
        {STAGES.filter(s => s.id !== "complete").map((s, i) => (
          <div key={s.id} className={`h-1 flex-1 rounded-full transition-colors ${
            isComplete ? "bg-green-500/60"
            : i < stageIdx ? "bg-cyan-500/60"
            : i === stageIdx ? "bg-white/30"
            : "bg-muted/20"
          }`} />
        ))}
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SpecialMissions({ role }: Props) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [filterType, setFilterType] = useState<MissionType | "all">("all");
  const [filterComplete, setFilterComplete] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["/api/special-missions"],
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/special-missions", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/special-missions"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest("PATCH", `/api/special-missions/${id}`, updates),
    onSuccess: async (_, vars) => {
      await qc.invalidateQueries({ queryKey: ["/api/special-missions"] });
      // Refresh active session from updated list
      const fresh = await qc.fetchQuery<Session[]>({ queryKey: ["/api/special-missions"] });
      const updated = fresh.find(s => s.id === vars.id);
      if (updated) setActiveSession(updated);
    },
  });

  function handleCreate(type: MissionType, aircraft: string, dest: string) {
    const now = new Date().toISOString();
    createMutation.mutate({
      missionType:   type,
      missionRef:    genRef(type),
      status:        "pre-flight",
      aircraftReg:   aircraft || null,
      destination:   dest || null,
      checklistData: "{}",
      signoffs:      "[]",
      notes:         null,
      createdAt:     now,
      updatedAt:     now,
    });
    setShowNew(false);
  }

  function handleUpdate(session: Session, updates: Partial<Session>) {
    updateMutation.mutate({ id: session.id, updates });
  }

  const filtered = sessions.filter(s => {
    // "complete" status includes both normally completed AND stood-down missions
    const isComplete = s.status === "complete";
    const isStandDown = isComplete && (() => { try { return JSON.parse(s.notes || '{}').standDown === true; } catch { return false; } })();

    if (!showCancelled && isStandDown) return false;
    if (!filterComplete && isComplete && !isStandDown) return false;
    if (filterType !== "all" && s.missionType !== filterType) return false;
    return true;
  });

  const active   = sessions.filter(s => s.status !== "complete").length;
  const complete = sessions.filter(s => s.status === "complete").length;

  if (activeSession) {
    try {
      return (
        <SessionWorkflow
          session={activeSession}
          onClose={() => setActiveSession(null)}
          onUpdate={(updates) => handleUpdate(activeSession, updates as Partial<Session>)}
          role={role}
        />
      );
    } catch (err) {
      console.error("[SpecialMissions] SessionWorkflow render error:", err);
      setActiveSession(null);
      return null;
    }
  }

  if (renderError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
        <div className="text-red-400 font-semibold">Something went wrong loading Special Missions.</div>
        <button
          onClick={() => { setRenderError(null); setActiveSession(null); }}
          className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-colors"
        >
          ↺ Reload
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {showNew && (
        <NewSessionModal onClose={() => setShowNew(false)} onCreate={handleCreate} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Special Missions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lord Howe Island · NETS · ECMO · Isolation · Telehealth — operator-independent QC workflow
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-400/40 rounded-xl text-sm text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-colors"
        >
          <Plus size={15} /> New QC Session
        </button>
      </div>

      {/* Active / Cancelled toggle */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setShowCancelled(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!showCancelled ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          Active Missions
        </button>
        <button
          onClick={() => setShowCancelled(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showCancelled ? "bg-red-400/20 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          Stood Down / Cancelled
        </button>
      </div>

      {/* Quality philosophy callout */}
      <div className="flex items-start gap-4 p-4 rounded-2xl border border-card-border bg-muted/10">
        <ClipboardList size={18} className="text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold mb-1">Consistent Operations — Regardless of Operator</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every special mission follows an identical, role-tagged checklist workflow. Sign-offs capture the
            <strong className="text-foreground"> role</strong>, not the individual — ensuring client-facing quality is consistent
            whether it's a senior captain or a first-tour crew member on duty.
            Each stage must be completed in sequence before advancing. All gates are logged for CASA audit.
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-2xl font-black text-cyan-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{sessions.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Total Sessions</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-2xl font-black text-amber-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{active}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Active</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-2xl font-black text-green-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{complete}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Complete</div>
        </div>
        {MISSION_TYPES.slice(0, 2).map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-card-border p-4">
            <div className={`text-2xl font-black ${m.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {sessions.filter(s => s.missionType === m.id).length}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{m.label === "Lord Howe Island" ? "Lord Howe" : m.label.split(" ")[0]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            filterType === "all" ? "bg-white/10 border-white/20 text-foreground" : "border-card-border text-muted-foreground hover:border-white/20"
          }`}
        >
          All Types
        </button>
        {MISSION_TYPES.map(m => (
          <button
            key={m.id}
            onClick={() => setFilterType(filterType === m.id ? "all" : m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              filterType === m.id ? `${m.accent} ${m.border} ${m.color}` : "border-card-border text-muted-foreground hover:border-muted-foreground/30"
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setFilterComplete(v => !v)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            filterComplete ? "bg-green-500/10 border-green-500/20 text-green-300" : "border-card-border text-muted-foreground"
          }`}
        >
          {filterComplete ? "Hide" : "Show"} Completed
        </button>
      </div>

      {/* Session grid */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading sessions…</span>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/20 border border-card-border flex items-center justify-center">
            <ClipboardList size={24} className="text-muted-foreground/40" />
          </div>
          <div>
            <div className="text-sm font-semibold text-muted-foreground">No active QC sessions</div>
            <div className="text-xs text-muted-foreground/60 mt-1">Start a new session to begin the workflow for a special mission.</div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-400/40 rounded-xl text-sm text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-colors"
          >
            <Plus size={14} /> New QC Session
          </button>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <SessionCard key={s.id} session={s} onClick={() => { try { setActiveSession(s); } catch(e) { setRenderError(String(e)); } }} />
          ))}
        </div>
      )}
    </div>
  );
}
