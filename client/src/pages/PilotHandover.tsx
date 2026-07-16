import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plane, Fuel, Wind, Droplets, AlertTriangle,
  Clock, User, Plus, Save, ClipboardList,
  ShieldAlert, Wrench, ArrowRight, X, ChevronDown,
} from "lucide-react";
import type { UserRole } from "@/lib/data";

const AIRCRAFT = [
  // Dubbo
  { reg: "VH-MVW", type: "B200",  base: "Dubbo" },
  { reg: "VH-MWH", type: "B200",  base: "Dubbo" },
  { reg: "VH-MWK", type: "B200C", base: "Dubbo" },
  { reg: "VH-XYU", type: "B200",  base: "Dubbo" },
  { reg: "VH-MQD", type: "B350",  base: "Dubbo" },
  // Broken Hill
  { reg: "VH-MVX", type: "B200C", base: "Broken Hill" },
  { reg: "VH-XYJ", type: "B200C", base: "Broken Hill" },
  { reg: "VH-XYR", type: "B200",  base: "Broken Hill" },
  { reg: "VH-NAJ", type: "B350",  base: "Broken Hill" },
  // Bankstown
  { reg: "VH-LTQ", type: "B200C", base: "Bankstown" },
  { reg: "VH-RFD", type: "B200C", base: "Bankstown" },
  { reg: "VH-XYO", type: "B200C", base: "Bankstown" },
  { reg: "VH-MQK", type: "B350",  base: "Bankstown" },
  { reg: "VH-VPQ", type: "B350",  base: "Bankstown" },
  // Launceston
  { reg: "VH-MQD", type: "B350",  base: "Launceston" },
  { reg: "VH-LTQ", type: "B200C", base: "Launceston" },
  { reg: "VH-RFD", type: "B200C", base: "Launceston" },
  { reg: "VH-MVW", type: "B200",  base: "Launceston" },
  // Essendon
  { reg: "VH-MQK", type: "B350",  base: "Essendon" },
  { reg: "VH-NAJ", type: "B350",  base: "Essendon" },
];

const BASES = ["Dubbo", "Broken Hill", "Bankstown", "Launceston", "Essendon"];

const CONDITION_OPTS = [
  { value: "serviceable",   label: "Serviceable",   color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  { value: "defects_noted", label: "Defects Noted", color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/30" },
  { value: "mel_active",    label: "MEL Active",    color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/30" },
  { value: "aog",           label: "AOG",           color: "text-red-400",     bg: "bg-red-400/10 border-red-400/30" },
];

// ── Airport library ─────────────────────────────────────────────────────────
const AIRPORTS = [
  // RFDS SE home bases
  { icao: 'YSDU', name: 'Dubbo' },
  { icao: 'YBHI', name: 'Broken Hill' },
  { icao: 'YSBK', name: 'Bankstown' },
  { icao: 'YMEN', name: 'Essendon' },
  { icao: 'YMLT', name: 'Launceston' },
  // NSW
  { icao: 'YSSY', name: 'Sydney (Kingsford Smith)' },
  { icao: 'YWLG', name: 'Walgett' },
  { icao: 'YWCA', name: 'Wilcannia' },
  { icao: 'YMOR', name: 'Moree' },
  { icao: 'YNAR', name: 'Narromine' },
  { icao: 'YCOR', name: 'Cobar' },
  { icao: 'YBKE', name: 'Bourke' },
  { icao: 'YLRE', name: 'Longreach' },
  { icao: 'YNTN', name: 'Normanton' },
  { icao: 'YLTV', name: 'Lithgow' },
  { icao: 'YGFN', name: 'Grafton' },
  { icao: 'YARM', name: 'Armidale' },
  { icao: 'YTAM', name: 'Tamworth' },
  { icao: 'YORG', name: 'Orange' },
  { icao: 'YBTH', name: 'Bathurst' },
  { icao: 'YGTH', name: 'Griffith' },
  { icao: 'YWGT', name: 'Wangaratta' },
  { icao: 'YWOL', name: 'Wollongong (Albion Park)' },
  { icao: 'YNBR', name: 'Narrabri' },
  { icao: 'YIVL', name: 'Inverell' },
  { icao: 'YGLN', name: 'Glen Innes' },
  { icao: 'YLIS', name: 'Lightning Ridge' },
  { icao: 'YWLM', name: 'Newcastle (Williamtown)' },
  { icao: 'YMLB', name: 'Mildura' },
  { icao: 'YSCO', name: 'Scone' },
  { icao: 'YDYS', name: 'Deniliquin' },
  { icao: 'YWYY', name: 'Wyong' },
  { icao: 'YCBA', name: 'Coober Pedy' },
  { icao: 'YBWR', name: 'Balranald' },
  { icao: 'YWDH', name: 'White Cliffs' },
  { icao: 'YCNF', name: 'Condobolin' },
  { icao: 'YFLI', name: 'Flinders Island' },
  // South Australia
  { icao: 'YPAD', name: 'Adelaide' },
  { icao: 'YPAG', name: 'Port Augusta' },
  { icao: 'YPLC', name: 'Port Lincoln' },
  { icao: 'YWHA', name: 'Whyalla' },
  { icao: 'YCED', name: 'Ceduna' },
  { icao: 'YNKB', name: 'Broken Hill (alt YNKB)' },
  // Victoria
  { icao: 'YMML', name: 'Melbourne (Tullamarine)' },
  { icao: 'YMHB', name: 'Hobart' },
  { icao: 'YMBT', name: 'Mildura' },
  { icao: 'YBLA', name: 'Bairnsdale' },
  { icao: 'YHSM', name: 'Horsham' },
  { icao: 'YSWH', name: 'Swan Hill' },
  { icao: 'YMES', name: 'Mount Gambier' },
  // Queensland
  { icao: 'YBBN', name: 'Brisbane' },
  { icao: 'YBCG', name: 'Gold Coast' },
  { icao: 'YBTL', name: 'Townsville' },
  { icao: 'YBCS', name: 'Cairns' },
  { icao: 'YBMA', name: 'Mount Isa' },
  { icao: 'YBOK', name: 'Oakey' },
  { icao: 'YBMK', name: 'Mackay' },
  { icao: 'YBRK', name: 'Rockhampton' },
  { icao: 'YBAF', name: 'Amberley' },
  // Other
  { icao: 'YLHI', name: 'Lord Howe Island' },
  { icao: 'YNRM', name: 'Narrandera' },
  { icao: 'YWYF', name: 'Young' },
  { icao: 'YCEE', name: 'Cowra' },
  { icao: 'YMCO', name: 'Coonabarabran' },
  { icao: 'YGON', name: 'Goonoo Goonoo (Tamworth Helicopter)' },
  { icao: 'YGLB', name: 'Goulburn' },
  { icao: 'YKRY', name: 'Katoomba' },
  { icao: 'YKER', name: 'Kerang' },
];

// ── MEL item library ─────────────────────────────────────────────────────────
// Format: "REF — Description (Limitation)"
// ── Shared MEL items (applicable to all King Air types) ──────────────────────
const MEL_COMMON = [
  // ATA 21 — Air Conditioning / Pressurisation
  "MEL 21-11 — Air Conditioning — Bleed Air Source No. 1 Inoperative (Single-source dispatch, limitation applies)",
  "MEL 21-12 — Air Conditioning — Bleed Air Source No. 2 Inoperative (Single-source dispatch, limitation applies)",
  "MEL 21-21 — Pressurisation Auto Controller No. 1 Inoperative (Manual or standby auto available)",
  "MEL 21-22 — Pressurisation Auto Controller No. 2 Inoperative (Auto No. 1 operative)",
  "MEL 21-31 — Cabin Altitude Warning Horn Inoperative (Maintenance within 10 days, crew vigilance)",
  "MEL 21-41 — Dump Valve Manual Control Inoperative (Auto dump operative, maintenance required)",
  // ATA 22 — Autopilot
  "MEL 22-11 — Autopilot Inoperative (Manual flight, workload assessed, crew rest limitations may apply)",
  "MEL 22-12 — Flight Director No. 2 Inoperative (FD No. 1 operative)",
  "MEL 22-21 — Yaw Damper Inoperative (Dispatch with Mach/altitude restriction if applicable)",
  // ATA 23 — Communications
  "MEL 23-11 — HF Radio No. 1 Inoperative (HF No. 2 operative, no oceanic if both unserviceable)",
  "MEL 23-12 — HF Radio No. 2 Inoperative (HF No. 1 operative)",
  "MEL 23-21 — VHF Comm No. 1 Inoperative (VHF No. 2 & No. 3 operative)",
  "MEL 23-22 — VHF Comm No. 2 Inoperative (VHF No. 1 & No. 3 operative)",
  "MEL 23-23 — VHF Comm No. 3 Inoperative (2 VHF required for IFR, No. 1 & No. 2 operative)",
  "MEL 23-51 — Passenger Address System Inoperative (Crew to brief passengers directly)",
  "MEL 23-61 — Cockpit Voice Recorder Inoperative (10-day maintenance limit, FDR operative)",
  "MEL 23-71 — Flight Data Recorder Inoperative (10-day maintenance limit)",
  "MEL 23-81 — Emergency Locator Transmitter (ELT) Inoperative (Maintenance within 30 days, NOTAM required)",
  // ATA 24 — Electrical Power
  "MEL 24-11 — AC Generator No. 1 (Left) Inoperative (Generator No. 2 operative, load shedding required)",
  "MEL 24-12 — AC Generator No. 2 (Right) Inoperative (Generator No. 1 operative, load shedding)",
  "MEL 24-21 — Battery No. 1 Inoperative (Battery No. 2 operative, maintenance within 5 days)",
  "MEL 24-22 — Battery No. 2 Inoperative (Battery No. 1 operative)",
  "MEL 24-31 — External Power Receptacle Inoperative (GPU connection unavailable, battery start only)",
  // ATA 25 — Equipment / Furnishings
  "MEL 25-11 — Emergency Exit Light — One Inoperative (Portable light substituted, 10-day limit)",
  "MEL 25-12 — Emergency Exit Light — Multiple Inoperative (Maintenance required before dispatch)",
  "MEL 25-21 — Passenger Seat — One Inoperative (Seat placarded INOP, pax reduced accordingly)",
  "MEL 25-31 — Stretcher Frame — Rear Position Inoperative (Single-stretcher config, front only)",
  "MEL 25-32 — Stretcher Frame — Front Position Inoperative (Single-stretcher config, rear only)",
  "MEL 25-41 — Seat Belt — One Inoperative (Seat placarded INOP, no occupant permitted)",
  // ATA 26 — Fire Protection
  "MEL 26-11 — Engine Fire Extinguisher Bottle No. 1 Inoperative (Bottle No. 2 operative, single-shot dispatch)",
  "MEL 26-12 — Engine Fire Extinguisher Bottle No. 2 Inoperative (Bottle No. 1 operative)",
  "MEL 26-21 — Engine Fire Detection Loop A — One Engine Inoperative (Loop B operative, performance monitored)",
  "MEL 26-22 — Engine Fire Detection Loop B — One Engine Inoperative (Loop A operative)",
  "MEL 26-31 — Baggage Compartment Fire/Smoke Detection Inoperative (Cargo inspection required pre-flight)",
  // ATA 28 — Fuel
  "MEL 28-11 — Fuel Quantity Indicator — Left Tank Inoperative (Dip check required, fuel logs mandatory)",
  "MEL 28-12 — Fuel Quantity Indicator — Right Tank Inoperative (Dip check required)",
  "MEL 28-13 — Fuel Quantity Indicator — Total Inoperative (Both tank gauges operative, manual calculation)",
  "MEL 28-21 — Fuel Crossfeed Valve Inoperative (Symmetric fuel loading required, crossfeed prohibited)",
  "MEL 28-31 — Fuel Boost Pump — Left Engine Inoperative (Gravity feed dispatch, limitations apply)",
  "MEL 28-32 — Fuel Boost Pump — Right Engine Inoperative (Gravity feed dispatch)",
  "MEL 28-41 — Fuel Flow Indicator — One Engine Inoperative (Torque/ITT monitoring for fuel burn)",
  // ATA 29 — Hydraulic Power
  "MEL 29-11 — Hydraulic Pressure Gauge Inoperative (Alternate pressure monitoring)",
  "MEL 29-21 — Hydraulic Fluid Level Sight Glass Inoperative (Dip check required pre-flight)",
  // ATA 30 — Ice & Rain Protection
  "MEL 30-11 — Windshield Wiper No. 1 (Pilot) Inoperative (VMC dispatch or No. 2 operative)",
  "MEL 30-12 — Windshield Wiper No. 2 (Co-pilot) Inoperative (No. 1 operative)",
  "MEL 30-21 — Engine Inlet Anti-Ice — Left Engine Inoperative (Flight into known icing prohibited)",
  "MEL 30-22 — Engine Inlet Anti-Ice — Right Engine Inoperative (Known icing prohibited)",
  "MEL 30-31 — Pitot Heat — Pilot Side Inoperative (Co-pilot pitot heat operative, icing avoidance required)",
  "MEL 30-32 — Pitot Heat — Co-pilot Side Inoperative (Pilot pitot heat operative)",
  "MEL 30-41 — Propeller De-Ice — Left Inoperative (Known icing prohibited)",
  "MEL 30-42 — Propeller De-Ice — Right Inoperative (Known icing prohibited)",
  "MEL 30-51 — Stall Warning System Inoperative (Increased crew vigilance, speed margins)",
  "MEL 30-61 — Windshield Anti-Ice/De-ice Inoperative (VMC dispatch only, alternate de-fog)",
  // ATA 31 — Indicating / Recording
  "MEL 31-11 — Standby Attitude Indicator Inoperative (Additional crew vigilance, primary AI cross-checked)",
  "MEL 31-21 — Standby Airspeed Indicator Inoperative (Primary ASI cross-checked)",
  "MEL 31-31 — Standby Altimeter Inoperative (Primary altimeters operative)",
  "MEL 31-41 — ITT Indicator — One Engine Inoperative (Alternate engine monitoring)",
  "MEL 31-42 — Torque Indicator — One Engine Inoperative (Alternate power monitoring)",
  "MEL 31-51 — Clock — One Inoperative (Alternate time source used)",
  // ATA 32 — Landing Gear
  "MEL 32-11 — Nose Wheel Steering Inoperative (Differential braking and rudder taxi, long runways preferred)",
  "MEL 32-21 — Anti-Skid System Inoperative (Increased landing distance required, dry runway only)",
  "MEL 32-31 — Landing Gear Position Indicator — Nose Inoperative (Main gear indicators confirm down-lock)",
  "MEL 32-32 — Landing Gear Position Indicator — Main One Inoperative (Remaining indicators confirm down-lock)",
  "MEL 32-41 — Gear Warning Horn Inoperative (Maintenance within 3 days, crew checklist required)",
  "MEL 32-51 — Brake Temperature Monitor Inoperative (Manual brake cooling procedure applied)",
  // ATA 33 — Lighting
  "MEL 33-11 — Landing Light — One Inoperative (Remaining landing light operative, Night ops caution)",
  "MEL 33-12 — Landing Light — Both Inoperative (Day VFR/IFR only, night ops prohibited)",
  "MEL 33-21 — Anti-Collision Strobe — One Inoperative (Remaining strobe operative)",
  "MEL 33-31 — Wing Tip Nav Light — One Inoperative (Night/IMC restricted, day VFR only)",
  "MEL 33-41 — Cockpit Dome/Flood Light Inoperative (Alternate cockpit lighting adequate)",
  "MEL 33-51 — Cabin Reading Lights — Partial Failure (Min. one per two seats maintained)",
  "MEL 33-61 — Taxi Light Inoperative (Landing light provides ground illumination)",
  // ATA 34 — Navigation
  "MEL 34-11 — VOR No. 1 Inoperative (VOR No. 2 operative, IFR maintained)",
  "MEL 34-12 — VOR No. 2 Inoperative (VOR No. 1 operative)",
  "MEL 34-13 — DME No. 1 Inoperative (DME No. 2 operative)",
  "MEL 34-14 — DME No. 2 Inoperative (DME No. 1 operative)",
  "MEL 34-15 — ADF No. 1 Inoperative (NDB approaches not available)",
  "MEL 34-16 — ADF No. 2 Inoperative (ADF No. 1 operative)",
  "MEL 34-21 — ILS Localiser No. 1 Inoperative (ILS No. 2 operative or non-precision approaches)",
  "MEL 34-22 — ILS Localiser No. 2 Inoperative (ILS No. 1 operative)",
  "MEL 34-23 — Glideslope No. 1 Inoperative (Non-precision approaches only)",
  "MEL 34-24 — Glideslope No. 2 Inoperative (GS No. 1 operative)",
  "MEL 34-31 — Marker Beacon Receiver Inoperative (DME/RNAV substituted)",
  "MEL 34-41 — Weather Radar Inoperative (Day VMC only, avoid forecast CB/TS areas)",
  "MEL 34-51 — TCAS Inoperative (ATC separation required, advisory note in ops log)",
  "MEL 34-52 — TCAS RA Inoperative — TA-only Mode (Traffic advisories only, no RAs generated)",
  "MEL 34-61 — GPS/FMS No. 1 Inoperative (GPS No. 2 operative, RNAV maintained)",
  "MEL 34-62 — GPS/FMS No. 2 Inoperative (GPS No. 1 operative)",
  "MEL 34-71 — Radar Altimeter Inoperative (No Cat II/III approaches, Cat I minima only)",
  "MEL 34-81 — Transponder Mode C Inoperative (Mode A only, ATC advised, RVSM not available)",
  "MEL 34-82 — Transponder Mode S / ADS-B Inoperative (Alternative transponder operative, ATC advised)",
  // ATA 35 — Oxygen
  "MEL 35-11 — Passenger Oxygen System Inoperative (Altitude restriction FL250 max, crew O2 confirmed)",
  "MEL 35-21 — Crew Oxygen Mask — One Inoperative (Replacement mask fitted or flight crew reduced)",
  "MEL 35-31 — Oxygen Quantity Gauge Inoperative (Manual check of cylinder pressure, duration calculated)",
  // ATA 36 — Pneumatic
  "MEL 36-11 — Bleed Air Duct Leak Detection System Inoperative (Visual/temp monitoring, maintenance within 5 days)",
  // ATA 52 — Doors
  "MEL 52-11 — Cargo/Baggage Door Annunciator Inoperative (Visual check mandatory before each flight)",
  "MEL 52-21 — Airstair Door Seal Defective — Minor Leak (Pressurisation checked, cabin altitude monitored)",
  // ATA 73 — Engine Fuel & Control
  "MEL 73-11 — Fuel Control Unit — One Engine — Minor Defect (Refer maintenance release, monitor fuel flow)",
  // ATA 77 — Engine Indicating
  "MEL 77-11 — ITT Exceedance Warning Light — One Engine Inoperative (Manual ITT monitoring)",
  "MEL 77-21 — Torquemeter — One Engine Inoperative (Power set by ITT, performance tables used)",
  "MEL 77-31 — Propeller Overspeed Governor — One Engine Inoperative (Dispatch with power limitation, speed monitoring)",
  // RFDS-Specific Medical Equipment
  "RFDS MEL — Suction Unit — Primary Inoperative (Backup electric suction operative, no high-dependency airway patients)",
  "RFDS MEL — Defibrillator/Monitor No. 2 Inoperative (No. 1 operative, mission risk assessed by clinical coordinator)",
  "RFDS MEL — Infusion Pump No. 2 Inoperative (No. 1 operative, single-pump missions only)",
  "RFDS MEL — Incubator/Isolette Inoperative (Neonatal transport prohibited until rectified)",
  "RFDS MEL — Isolette Temperature Controller Inoperative (Manual monitoring, neonatal transport prohibited)",
  "RFDS MEL — Medical Lighting — Cabin Flood Inoperative (Torch backup, day missions only)",
  "RFDS MEL — Portable Oxygen Unit Inoperative (Fixed system operative, flow rates checked)",
  "RFDS MEL — Medical Suction Regulator Inoperative (Alternate regulator fitted or airway patients excluded)",
  "RFDS MEL — Pulse Oximeter — Secondary Inoperative (Primary operative, monitoring maintained)",
  "RFDS MEL — ECG Monitor — Secondary Inoperative (Primary operative, clinical decision by FMO)",
];

// ── B200/B200C-specific MEL items ─────────────────────────────────────────────
const MEL_B200 = [
  // ATA 22
  "MEL 22-31 — SPZ-500 Autopilot Roll Channel Inoperative (Pitch only, lateral hand-flown)",
  "MEL 22-32 — SPZ-500 Autopilot Pitch Channel Inoperative (Maintenance required)",
  // ATA 27 — Flight Controls
  "MEL 27-11 — Aileron Trim Inoperative (Manual roll trim via rudder, asymmetric fuel load minimised)",
  "MEL 27-21 — Rudder Trim Inoperative (Manual rudder trim technique, power lever positioning)",
  "MEL 27-31 — Elevator Trim — Electric Inoperative (Manual trim tab operative)",
  "MEL 27-41 — Flap Asymmetry Detection Inoperative (Visual check before each selection, maintenance required)",
  "MEL 27-51 — Flap Position Indicator Inoperative (Flap setting confirmed by position switches)",
  // ATA 37 — Vacuum System
  "MEL 37-11 — Vacuum Pump — Engine Driven — One Inoperative (Electric standby pump available)",
  // ATA 61 — Propellers
  "MEL 61-11 — Propeller Synchrophaser Inoperative (Manual RPM synchronisation)",
  "MEL 61-21 — Beta/Feather Warning Light — One Engine Inoperative (Crew awareness required)",
  "MEL 61-31 — Auto-Feather System — One Engine Inoperative (Manual feather procedure, single-engine perf checked)",
  // ATA 71 — Power Plant
  "MEL 71-11 — Firewall Shutoff Valve — One Engine Inoperative (Engine shutdown procedure modified)",
  // ATA 80
  "MEL 80-11 — Engine Start Ignition Exciter — One Engine Inoperative (Cross-bleed or ground start)",
  // King Air B200 Avionics
  "MEL 34-91 — Proline 21 / Primus 1000 MFD No. 2 Inoperative (MFD No. 1 operative)",
  "MEL 34-92 — Proline 21 / Primus 1000 PFD No. 2 Inoperative (Standby instruments cross-referenced)",
  "MEL 34-93 — EFIS Reversionary Mode Inoperative (Normal EFIS operative on both sides)",
];

// ── B350-specific MEL items ───────────────────────────────────────────────────
const MEL_B350 = [
  // ATA 22
  "MEL 22-31 — AFCS (Pro Line Fusion) Autopilot Roll Axis Inoperative (Pitch axis operative, lateral hand-flown)",
  "MEL 22-32 — AFCS Pitch Axis Inoperative (Maintenance required before IFR dispatch)",
  "MEL 22-41 — VNAV Function Inoperative (Procedural VNAV only, advisory only)",
  // ATA 27 — Flight Controls
  "MEL 27-11 — Aileron Trim Inoperative (Lateral trim adjusted via rudder/fuel balance)",
  "MEL 27-21 — Rudder Trim Inoperative (Foot pressure technique, speed limitations)",
  "MEL 27-31 — Elevator Trim — Electric Inoperative (Manual trim tab checked)",
  "MEL 27-41 — Flap Asymmetry Protection Inoperative (Crew monitoring per checklist)",
  "MEL 27-51 — Flap Position Indicator Inoperative (Position confirmed by discrete switches)",
  // ATA 34 — Navigation (B350 specific)
  "MEL 34-91 — Pro Line Fusion PFD No. 2 Inoperative (Reversionary mode active, PFD No. 1 operative)",
  "MEL 34-92 — Pro Line Fusion MFD Centre Inoperative (Outer MFDs operative)",
  "MEL 34-93 — Pro Line Fusion MFD — One Outer Inoperative (Remaining displays adequate)",
  "MEL 34-94 — Synthetic Vision System (SVS) Inoperative (Conventional attitude display used)",
  "MEL 34-95 — TOLD/Performance Computation Inoperative (Manual performance tables)",
  // ATA 36
  "MEL 36-11 — Bleed Air Valve — One Engine Inoperative (Single-source pressurisation, altitude limitation)",
  // ATA 61 — Propellers
  "MEL 61-11 — Propeller Synchrophaser Inoperative (Manual RPM sync, vibration monitoring)",
  "MEL 61-21 — Auto-Feather System — One Engine Inoperative (Manual feather procedure)",
  "MEL 61-31 — Propeller Ice Protection — One Engine Inoperative (Icing conditions prohibited)",
  // ATA 71
  "MEL 71-11 — Firewall Shutoff Valve Inoperative — One Engine (Emergency shutdown procedure modified)",
  // ATA 80
  "MEL 80-11 — Engine Start Ignition — One Engine Inoperative (Cross-bleed or APU start)",
  // B350 Cabin
  "MEL 25-51 — Cabin Pressurisation Outflow Valve — Standby Inoperative (Primary valve operative)",
  "MEL 21-51 — Zone Temperature Controller — Aft Cabin Inoperative (Forward zone maintains cabin temp)",
];

// Map aircraft type to MEL list
function getMelLibrary(acType: string): string[] {
  const t = acType.toUpperCase();
  if (t.includes('350')) return [...MEL_COMMON, ...MEL_B350];
  // B200 and B200C
  return [...MEL_COMMON, ...MEL_B200];
}

function nowDate() { return new Date().toISOString().slice(0, 10); }
function nowTime() { return new Date().toTimeString().slice(0, 5); }

function blank(ac: typeof AIRCRAFT[0]) {
  return {
    aircraft_reg: ac.reg,
    aircraft_type: ac.type,
    base: ac.base,
    handover_date: nowDate(),
    handover_time: nowTime(),
    fuel_on_board_lb: 0,
    oxygen_psi: 0,
    oil_left_qt: "",
    oil_right_qt: "",
    logged_defects: "",
    mel_items: "",       // stored as newline-joined string
    issues: "",
    aircraft_condition: "serviceable",
    outgoing_pilot: "",
    incoming_pilot: "",
    next_flight: "",
    notes: "",
  };
}

interface Props { role: UserRole }

// ── MEL Picker component ──────────────────────────────────────────────────────
function MelPicker({ value, onChange, acType }: { value: string; onChange: (v: string) => void; acType: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse stored value → array of selected items
  const selected: string[] = value ? value.split("\n").filter(Boolean) : [];
  const library = getMelLibrary(acType);

  const filtered = query.trim().length > 0
    ? library.filter(item =>
        item.toLowerCase().includes(query.toLowerCase()) &&
        !selected.includes(item)
      ).slice(0, 12)
    : library.filter(item => !selected.includes(item)).slice(0, 12);

  function addItem(item: string) {
    const next = [...selected, item];
    onChange(next.join("\n"));
    setQuery("");
    inputRef.current?.focus();
  }

  function removeItem(item: string) {
    const next = selected.filter(s => s !== item);
    onChange(next.join("\n"));
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {selected.map(item => {
            const ref = item.match(/^([\w\s\-]+—)/)?.[1]?.trim() ?? item.slice(0, 18);
            const desc = item.replace(/^[\w\s\-]+—\s*/, "");
            return (
              <div
                key={item}
                className="flex items-start gap-2 bg-orange-400/10 border border-orange-400/25 rounded-lg px-3 py-2 group"
              >
                <ShieldAlert size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-orange-300">{ref}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                </div>
                <button
                  onClick={() => removeItem(item)}
                  className="text-muted-foreground/40 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
                  data-testid={`mel-remove-${ref}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search / add input */}
      <div className="relative">
        <div className="flex items-center gap-2 input-base cursor-text" onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
          <Plus size={12} className="text-muted-foreground/60 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? "Search or select MEL items — leave blank if nil defects" : "Add another MEL item…"}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50 min-w-0"
            data-testid="input-mel-search"
          />
          <ChevronDown size={12} className={`text-muted-foreground/50 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        </div>

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {filtered.map(item => {
              const ref = item.match(/^([\w\s\-]+—)/)?.[1]?.trim() ?? "";
              const desc = item.replace(/^[\w\s\-]+—\s*/, "");
              return (
                <button
                  key={item}
                  onMouseDown={e => { e.preventDefault(); addItem(item); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-orange-400/10 transition-colors border-b border-border/40 last:border-0 flex items-start gap-2 group"
                  data-testid={`mel-option-${ref}`}
                >
                  <ShieldAlert size={11} className="text-orange-400/60 group-hover:text-orange-400 mt-0.5 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground/80 group-hover:text-foreground">{ref}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Flight Picker component ─────────────────────────────────────────────────────────
function FlightPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // value stored as "YWLG 09:30L"
  const parts = value ? value.split(' ') : [];
  const icaoVal = parts[0] ?? '';
  const timeVal = parts[1] ?? '';

  const [icaoQuery, setIcaoQuery] = useState(icaoVal);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const icaoRef = useRef<HTMLInputElement>(null);

  // Sync if value cleared externally
  useEffect(() => {
    if (!value) { setIcaoQuery(''); }
  }, [value]);

  function commit(icao: string, time: string) {
    const t = time ? ` ${time}L` : '';
    onChange(icao ? `${icao}${t}` : '');
  }

  function selectAirport(ap: { icao: string; name: string }) {
    setIcaoQuery(ap.icao);
    setOpen(false);
    commit(ap.icao, timeVal.replace('L', ''));
  }

  function handleTimeChange(t: string) {
    commit(icaoQuery || icaoVal, t);
  }

  const filtered = icaoQuery.length > 0
    ? AIRPORTS.filter(a =>
        a.icao.toLowerCase().includes(icaoQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(icaoQuery.toLowerCase())
      ).slice(0, 10)
    : AIRPORTS.slice(0, 10);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTime = timeVal.replace('L', '');

  return (
    <div ref={containerRef} className="flex gap-2">
      {/* ICAO search */}
      <div className="relative flex-1">
        <input
          ref={icaoRef}
          type="text"
          value={icaoQuery}
          onChange={e => { setIcaoQuery(e.target.value); setOpen(true); commit(e.target.value, currentTime); }}
          onFocus={() => setOpen(true)}
          placeholder="ICAO or airport name"
          className="input-base uppercase font-mono font-bold tracking-wider"
          data-testid="input-next-flight-icao"
          maxLength={4}
          style={{ textTransform: icaoQuery.length <= 4 ? 'uppercase' : 'none' }}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {filtered.map(ap => (
              <button
                key={ap.icao}
                onMouseDown={e => { e.preventDefault(); selectAirport(ap); }}
                className="w-full text-left px-3 py-2 hover:bg-cyan-500/10 transition-colors border-b border-border/40 last:border-0 flex items-center gap-3"
                data-testid={`flight-option-${ap.icao}`}
              >
                <span className="font-mono font-bold text-cyan-400 text-sm w-12 flex-shrink-0">{ap.icao}</span>
                <span className="text-sm text-muted-foreground truncate">{ap.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time input */}
      <div className="flex-shrink-0 w-36">
        <input
          type="time"
          value={currentTime}
          onChange={e => handleTimeChange(e.target.value)}
          className="input-base font-mono"
          data-testid="input-next-flight-time"
        />
      </div>

      {/* L suffix label */}
      <div className="flex items-center text-xs text-muted-foreground flex-shrink-0 pb-0.5">Local</div>
    </div>
  );
}

export default function PilotHandover({ role }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedReg, setSelectedReg] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [filterBase, setFilterBase] = useState<string>("All");

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingForm   = useRef<any>(null);
  const formRef       = useRef<any>(null); // always mirrors latest form state

  const { data: handovers = [] } = useQuery<any[]>({
    queryKey: ["/api/handover"],
    refetchInterval: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (d: any) =>
      d.id
        ? apiRequest("PATCH", `/api/handover/${d.id}`, d)
        : apiRequest("POST", "/api/handover", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/handover"] });
      toast({ title: "Handover saved", description: `${form.aircraft_reg} handover recorded.` });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  async function doSave(d: any) {
    if (!d) return;
    try {
      const saved = await (d.id
        ? apiRequest("PATCH", `/api/handover/${d.id}`, d)
        : apiRequest("POST", "/api/handover", d));
      // If this was a POST, store the returned id so future saves use PATCH
      if (!d.id && saved?.id) {
        formRef.current = { ...formRef.current, id: saved.id };
        setForm((f: any) => f ? { ...f, id: saved.id } : f);
      }
      qc.invalidateQueries({ queryKey: ["/api/handover"] });
    } catch {}
  }

  async function flushAutoSave() {
    // Cancel any pending debounce
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    // Use formRef — always has the latest state regardless of React batching
    if (pendingForm.current && formRef.current) {
      pendingForm.current = null;
      await doSave(formRef.current);
    }
  }

  async function selectAircraft(reg: string) {
    // Flush unsaved changes for current aircraft before switching
    await flushAutoSave();
    const ac = AIRCRAFT.find(a => a.reg === reg)!;
    const fresh = qc.getQueryData<any[]>(["/api/handover"]) ?? handovers;
    const existing = fresh.find((h: any) => h.aircraft_reg === reg);
    const next = existing ? { ...existing } : blank(ac);
    formRef.current = next;
    setSelectedReg(reg);
    setForm(next);
  }

  function update(k: string, v: any) {
    setForm((p: any) => {
      const next = { ...p, [k]: v };

      // Auto-set condition based on MEL items and issues
      const hasMel    = k === "mel_items"      ? Boolean(String(v).trim()) : Boolean(String(p.mel_items ?? "").trim());
      const hasIssues = k === "issues"          ? Boolean(String(v).trim()) : Boolean(String(p.issues ?? "").trim());

      // Priority ladder (highest to lowest): aog > mel_active > defects_noted > serviceable
      // Only auto-promote, never auto-demote below current manual selection
      const currentCond = next.aircraft_condition;
      const PRIORITY: Record<string, number> = { serviceable: 0, defects_noted: 1, mel_active: 2, aog: 3 };

      let autoCond = "serviceable";
      if (hasIssues) autoCond = "defects_noted";
      if (hasMel)    autoCond = "mel_active";     // MEL overrides issues

      // Promote if auto condition is higher priority than current; never demote
      if (PRIORITY[autoCond] > PRIORITY[currentCond]) {
        next.aircraft_condition = autoCond;
      }

      // If both MEL and issues are cleared, and condition was auto-set, revert to serviceable
      // (but only if not manually set to aog or defects_noted above auto level)
      if (!hasMel && !hasIssues) {
        if (currentCond === "mel_active" || currentCond === "defects_noted") {
          next.aircraft_condition = "serviceable";
        }
      } else if (!hasMel && hasIssues) {
        // MEL cleared but issues remain — drop from mel_active to defects_noted if auto-set
        if (currentCond === "mel_active") {
          next.aircraft_condition = "defects_noted";
        }
      }

      // Keep ref in sync so flushAutoSave always has latest data
      formRef.current = next;
      pendingForm.current = true; // mark as dirty
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        autoSaveTimer.current = null;
        if (!pendingForm.current) return;
        pendingForm.current = null;
        await doSave(formRef.current);
      }, 800);

      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try { await saveMutation.mutateAsync(form); }
    finally { setSaving(false); }
  }

  const cond = CONDITION_OPTS.find(c => c.value === form?.aircraft_condition) ?? CONDITION_OPTS[0];
  const filteredAircraft = filterBase === "All" ? AIRCRAFT : AIRCRAFT.filter(a => a.base === filterBase);
  const activeMelCount = form?.mel_items ? form.mel_items.split("\n").filter(Boolean).length : 0;

  const latestByReg = AIRCRAFT.reduce((acc, ac) => {
    const h = handovers.filter((h: any) => h.aircraft_reg === ac.reg)
      .sort((a: any, b: any) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];
    acc[ac.reg] = h;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 flex-shrink-0">
        <ClipboardList size={18} className="text-cyan-400" />
        <div>
          <h1 className="text-sm font-bold text-foreground">Pilot Handover Board</h1>
          <p className="text-[11px] text-muted-foreground">Aircraft condition, fuel state & crew handover</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg overflow-hidden text-xs">
            {["All", ...BASES].map(b => (
              <button
                key={b}
                onClick={() => setFilterBase(b)}
                className={`px-2.5 py-1.5 transition-colors ${filterBase === b ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >{b}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Aircraft Grid */}
        <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto bg-card/30 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Select Aircraft</p>
          {filteredAircraft.map(ac => {
            const latest = latestByReg[ac.reg];
            const isSelected = selectedReg === ac.reg;
            // For the selected aircraft, use live form state so badges/pulse reflect edits instantly
            const liveCondition = isSelected && form ? form.aircraft_condition : latest?.aircraft_condition;
            const liveMelItems  = isSelected && form ? form.mel_items : latest?.mel_items;
            const condOpt = CONDITION_OPTS.find(c => c.value === liveCondition);
            const ageHrs = latest?.updated_at
              ? Math.round((Date.now() - new Date(latest.updated_at).getTime()) / 3_600_000)
              : null;
            const melCount = liveMelItems ? liveMelItems.split("\n").filter(Boolean).length : 0;

            return (
              <button
                key={ac.reg}
                onClick={() => selectAircraft(ac.reg)}
                data-testid={`aircraft-card-${ac.reg}`}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  liveCondition === 'aog'
                    ? 'aog-pulse'
                    : isSelected
                      ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(6,182,212,0.3)]'
                      : 'border-border bg-card hover:border-cyan-500/30 hover:bg-card/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Plane size={13} className={isSelected ? "text-cyan-400" : "text-muted-foreground"} />
                    <span className="text-sm font-bold text-foreground">{ac.reg}</span>
                    <span className="text-[10px] text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">{ac.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {melCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-orange-400/15 border-orange-400/40 text-orange-400">
                        <ShieldAlert size={9} />{melCount} MEL
                      </span>
                    )}
                    {condOpt && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${condOpt.bg} ${condOpt.color}`}>
                        {condOpt.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>{ac.base}</span>
                  {latest ? (
                    <span className={ageHrs !== null && ageHrs > 8 ? "text-amber-400" : "text-muted-foreground"}>
                      {ageHrs !== null ? `${ageHrs}h ago` : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50 italic">No handover</span>
                  )}
                </div>
                {latest && (
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Fuel size={10} />{latest.fuel_on_board_lb} lb</span>
                    <span className="flex items-center gap-1"><Wind size={10} />{latest.oxygen_psi} psi</span>
                    {latest.logged_defects && <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={10} />Defects</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Handover Form */}
        <div className="flex-1 overflow-y-auto p-4">
          {!form ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <Plane size={40} className="opacity-20" />
              <p className="text-sm">Select an aircraft to view or enter a handover</p>
            </div>
          ) : (
            <div className={`max-w-3xl mx-auto space-y-4 p-2 transition-all ${form.aircraft_condition === 'aog' ? 'aog-pulse' : ''}`}>

              {/* Aircraft Header */}
              <div className={`rounded-xl border p-4 flex items-center justify-between ${cond.bg}`}>
                <div className="flex items-center gap-3">
                  <Plane size={22} className={cond.color} />
                  <div>
                    <p className="text-lg font-bold text-foreground">{form.aircraft_reg}</p>
                    <p className="text-xs text-muted-foreground">{form.aircraft_type} · {form.base}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {CONDITION_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update("aircraft_condition", opt.value)}
                      data-testid={`condition-${opt.value}`}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        form.aircraft_condition === opt.value
                          ? `${opt.bg} ${opt.color} shadow-sm`
                          : "border-border text-muted-foreground hover:border-border/80 bg-card/50"
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Date / Time / Pilots row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Handover Date" icon={<Clock size={12} />}>
                  <input type="date" value={form.handover_date} onChange={e => update("handover_date", e.target.value)}
                    className="input-base" data-testid="input-handover-date" />
                </Field>
                <Field label="Handover Time (L)" icon={<Clock size={12} />}>
                  <input type="time" value={form.handover_time} onChange={e => update("handover_time", e.target.value)}
                    className="input-base" data-testid="input-handover-time" />
                </Field>
                <Field label="Outgoing Pilot" icon={<User size={12} />}>
                  <input type="text" value={form.outgoing_pilot} onChange={e => update("outgoing_pilot", e.target.value)}
                    placeholder="Capt. Smith" className="input-base" data-testid="input-outgoing-pilot" />
                </Field>
                <Field label="Incoming Pilot" icon={<ArrowRight size={12} />}>
                  <input type="text" value={form.incoming_pilot} onChange={e => update("incoming_pilot", e.target.value)}
                    placeholder="F/O Jones" className="input-base" data-testid="input-incoming-pilot" />
                </Field>
              </div>

              {/* Fuel — full width, no endurance */}
              <SectionCard title="Fuel State" icon={<Fuel size={14} className="text-amber-400" />} accent="amber">
                <Field label="Fuel on Board (lb)">
                  <div className="relative">
                    <input
                      type="number" min={0} max={8000}
                      value={form.fuel_on_board_lb === 0 ? '' : form.fuel_on_board_lb}
                      onChange={e => update("fuel_on_board_lb", e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="input-base pr-10 text-lg font-bold" data-testid="input-fuel-lb"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lb</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-background/60 overflow-hidden border border-border/40">
                    <div
                      className={`h-full rounded-full transition-all ${
                        form.fuel_on_board_lb > 3000 ? "bg-emerald-500" :
                        form.fuel_on_board_lb > 1500 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, (form.fuel_on_board_lb / 7200) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Max usable ~7,200 lb (B200/B350)</p>
                </Field>
              </SectionCard>

              {/* Oxygen & Oils */}
              <div className="grid grid-cols-3 gap-3">
                <SectionCard title="Oxygen" icon={<Wind size={14} className="text-sky-400" />} accent="sky">
                  <Field label="Pressure (PSI)">
                    <div className="relative">
                      <input type="number" min={0} max={2000}
                        value={form.oxygen_psi === 0 ? '' : form.oxygen_psi}
                        onChange={e => update("oxygen_psi", e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="0"
                        className={`input-base pr-12 text-lg font-bold transition-colors ${
                          form.oxygen_psi > 0 && form.oxygen_psi < 1500
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400 focus:border-amber-400'
                            : ''
                        }`}
                        data-testid="input-oxygen-psi" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">psi</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-background/60 overflow-hidden border border-border/40">
                      <div
                        className={`h-full rounded-full transition-all ${
                          form.oxygen_psi > 1200 ? "bg-sky-500" :
                          form.oxygen_psi > 600 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, (form.oxygen_psi / 1800) * 100)}%` }}
                      />
                    </div>
                    {form.oxygen_psi > 0 && form.oxygen_psi < 1500 && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-1.5">
                        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-amber-400">Below minimum for Dispatch</span>
                      </div>
                    )}
                  </Field>
                </SectionCard>

                <SectionCard title="Oil — Left Engine" icon={<Droplets size={14} className="text-cyan-400" />} accent="cyan">
                  <Field label="Level (QT)">
                    <div className="relative">
                      <input type="number" step={0.5} min={0} max={12}
                        value={form.oil_left_qt}
                        onChange={e => update("oil_left_qt", e.target.value)}
                        className="input-base pr-10 text-lg font-bold" data-testid="input-oil-left" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">qt</span>
                    </div>
                  </Field>
                </SectionCard>

                <SectionCard title="Oil — Right Engine" icon={<Droplets size={14} className="text-cyan-400" />} accent="cyan">
                  <Field label="Level (QT)">
                    <div className="relative">
                      <input type="number" step={0.5} min={0} max={12}
                        value={form.oil_right_qt}
                        onChange={e => update("oil_right_qt", e.target.value)}
                        className="input-base pr-10 text-lg font-bold" data-testid="input-oil-right" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">qt</span>
                    </div>
                  </Field>
                </SectionCard>
              </div>

              {/* Logged Defects */}
              <SectionCard
                title="Logged Defects"
                icon={<Wrench size={14} className="text-orange-400" />}
                accent="orange"
                badge={form.logged_defects ? "⚠ Active" : undefined}
              >
                <textarea
                  rows={3}
                  value={form.logged_defects}
                  onChange={e => update("logged_defects", e.target.value)}
                  placeholder="Describe any logged defects entered in the tech log. Leave blank if nil."
                  className="input-base resize-none w-full"
                  data-testid="input-defects"
                />
              </SectionCard>

              {/* MEL Items — dropdown picker */}
              <SectionCard
                title={`MEL Items${form.aircraft_type ? ` — ${form.aircraft_type}` : ''}`}
                icon={<ShieldAlert size={14} className="text-orange-400" />}
                accent="orange"
                badge={activeMelCount > 0 ? `${activeMelCount} Active` : undefined}
              >
                <MelPicker
                  value={form.mel_items ?? ""}
                  onChange={v => update("mel_items", v)}
                  acType={form.aircraft_type ?? ""}
                />
              </SectionCard>

              {/* Other Issues */}
              <SectionCard
                title="Other Issues"
                icon={<AlertTriangle size={14} className="text-amber-400" />}
                accent="amber"
              >
                <textarea
                  rows={2}
                  value={form.issues}
                  onChange={e => update("issues", e.target.value)}
                  placeholder="Any other issues, snags, or items to be aware of."
                  className="input-base resize-none w-full"
                  data-testid="input-issues"
                />
              </SectionCard>

              {/* Next flight */}
              <Field label="Next Planned Flight">
                <FlightPicker
                  value={form.next_flight ?? ''}
                  onChange={v => update('next_flight', v)}
                />
              </Field>

              {/* Notes */}
              <Field label="General Notes">
                <input type="text" value={form.notes}
                  onChange={e => update("notes", e.target.value)}
                  placeholder="Any additional handover notes"
                  className="input-base" data-testid="input-notes" />
              </Field>

              {/* Save */}
              <div className="flex items-center justify-between pt-2 pb-6">
                <span className="text-[11px] text-muted-foreground/60 italic">Changes auto-save as you type</span>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.outgoing_pilot}
                  data-testid="button-save-handover"
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-lg"
                >
                  {saving ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : <Save size={15} />}
                  {saving ? "Saving…" : "Confirm Handover"}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wide">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

function SectionCard({
  title, icon, children, accent = "default", badge,
}: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; accent?: string; badge?: string;
}) {
  const borderMap: Record<string, string> = {
    amber:   "border-amber-500/20",
    orange:  "border-orange-500/20",
    sky:     "border-sky-500/20",
    cyan:    "border-cyan-500/20",
    default: "border-border",
  };
  return (
    <div className={`rounded-xl border ${borderMap[accent] ?? "border-border"} bg-card/60 p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}{title}
        </div>
        {badge && (
          <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
