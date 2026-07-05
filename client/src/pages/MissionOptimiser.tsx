import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapPin, Plane, Clock, DollarSign, Navigation,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  RotateCcw, Zap, Layers, X, FileText, Fuel, Wrench, Users,
  TrendingUp, BarChart3, ArrowLeftRight, Info, Award, Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "leaflet/dist/leaflet.css";

// ─────────────────────────────────────────────────────────────────────────────
// NSW AMBULANCE FEES — effective 1 July 2025
// Source: https://www.ambulance.nsw.gov.au/our-services/accounts-and-fees
// Km calculated as round-trip: station → scene → destination → station
// ─────────────────────────────────────────────────────────────────────────────
const AMB_FEES = {
  emergency: {
    callOut: 464,         // NSW resident (49% govt subsidy applied)
    perKm: 4.18,
    maxCharge: 7601,      // NSW resident cap
    callOutNonNSW: 909,
    perKmNonNSW: 8.20,
  },
  nonEmergency: {
    callOut: 365,
    perKm: 2.26,
    maxCharge: 7601,
    callOutNonNSW: 365,
    perKmNonNSW: 2.26,
  },
} as const;

function calcAmbulanceCost(
  gndKm: number,
  isEmergency: boolean,
  isNSWResident = true
): { callOut: number; kmCharge: number; total: number; capped: boolean } {
  const fees = isEmergency ? AMB_FEES.emergency : AMB_FEES.nonEmergency;
  const callOut = isNSWResident ? fees.callOut : (fees as any).callOutNonNSW;
  const perKm   = isNSWResident ? fees.perKm   : (fees as any).perKmNonNSW;
  // NSW Ambulance km = round trip from station; we have one-way gndKm to hospital
  // approximate round trip station → scene (gndKm) + scene → hospital (gndKm) = 2×
  const billableKm = gndKm * 2;
  const kmCharge = Math.round(billableKm * perKm);
  const raw = callOut + kmCharge;
  const cap = isNSWResident ? fees.maxCharge : Infinity;
  const total = Math.min(raw, cap);
  return { callOut, kmCharge, total, capped: raw > cap };
}

// ─────────────────────────────────────────────────────────────────────────────
// FLEET — B200, B300, PC24 primary; B350 + HELO retained for optimiser
// contractRate = health-system billing rate (per hr)
// costPerHour  = full cost recovery rate (per hr)
// ─────────────────────────────────────────────────────────────────────────────
const FLEET = {
  B200: {
    name: "King Air B200", shortName: "B200",
    cruiseKts: 240, rangeNm: 1580,
    costPerHour: 4000, contractRate: 3200,
    fuelBurnLph: 320, fuelCostPerL: 1.85,
    pilotRate: 850, maintenanceRate: 0.28,
    canDirt: false, icon: "✈", seats: 6,
    color: "#0097A7", accentLight: "#e0f7fa",
  },
  B300: {
    name: "King Air B300", shortName: "B300",
    cruiseKts: 295, rangeNm: 1806,
    costPerHour: 5200, contractRate: 4100,
    fuelBurnLph: 420, fuelCostPerL: 1.85,
    pilotRate: 950, maintenanceRate: 0.30,
    canDirt: false, icon: "✈", seats: 8,
    color: "#1565C0", accentLight: "#e3f2fd",
  },
  B350: {
    name: "King Air B350", shortName: "B350",
    cruiseKts: 270, rangeNm: 1806,
    costPerHour: 4800, contractRate: 3800,
    fuelBurnLph: 380, fuelCostPerL: 1.85,
    pilotRate: 950, maintenanceRate: 0.30,
    canDirt: false, icon: "✈", seats: 8,
    color: "#00838F", accentLight: "#e0f7fa",
  },
  PC24: {
    name: "Pilatus PC-24", shortName: "PC-24",
    cruiseKts: 440, rangeNm: 2000,
    costPerHour: 6000, contractRate: 4800,
    fuelBurnLph: 520, fuelCostPerL: 1.85,
    pilotRate: 1100, maintenanceRate: 0.32,
    canDirt: true, icon: "🛩", seats: 6,
    color: "#6A1B9A", accentLight: "#f3e5f5",
  },
  HELO: {
    name: "Helicopter (AW139)", shortName: "AW139",
    cruiseKts: 180, rangeNm: 500,
    costPerHour: 8500, contractRate: 7000,
    fuelBurnLph: 580, fuelCostPerL: 1.95,
    pilotRate: 1050, maintenanceRate: 0.38,
    canDirt: true, icon: "🚁", seats: 4,
    color: "#E65100", accentLight: "#fff3e0",
  },
} as const;
type FleetKey = keyof typeof FLEET;
const AIRCRAFT = { B200: FLEET.B200, B350: FLEET.B350, PC24: FLEET.PC24, HELO: FLEET.HELO } as const;
type AircraftKey = keyof typeof AIRCRAFT;
type CasePriority = "P1" | "P2" | "P3";
type CaseType = "trauma"|"cardiac"|"stroke"|"burns"|"neuro"|"paeds"|"general";
type CostMode = "contract"|"full";

// ─────────────────────────────────────────────────────────────────────────────
// GEO + FORMAT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const LHDs = [
  { id:"western-nsw",           name:"Western NSW",           lat:-32.24, lon:148.60 },
  { id:"far-west",              name:"Far West",              lat:-31.95, lon:141.45 },
  { id:"murrumbidgee",          name:"Murrumbidgee",          lat:-35.11, lon:147.37 },
  { id:"hunter-new-england",    name:"Hunter New England",    lat:-32.92, lon:151.78 },
  { id:"mid-north-coast",       name:"Mid North Coast",       lat:-31.43, lon:152.91 },
  { id:"northern-nsw",          name:"Northern NSW",          lat:-28.81, lon:153.28 },
  { id:"central-coast",         name:"Central Coast",         lat:-33.42, lon:151.34 },
  { id:"nepean-blue-mountains", name:"Nepean Blue Mountains", lat:-33.75, lon:150.69 },
  { id:"western-sydney",        name:"Western Sydney",        lat:-33.81, lon:151.00 },
  { id:"northern-sydney",       name:"Northern Sydney",       lat:-33.83, lon:151.20 },
  { id:"sydney",                name:"Sydney",                lat:-33.89, lon:151.19 },
  { id:"south-eastern-sydney",  name:"South Eastern Sydney",  lat:-33.92, lon:151.24 },
  { id:"south-western-sydney",  name:"South Western Sydney",  lat:-33.92, lon:150.92 },
  { id:"illawarra-shoalhaven",  name:"Illawarra Shoalhaven",  lat:-34.43, lon:150.89 },
  { id:"southern-nsw",          name:"Southern NSW",          lat:-34.75, lon:149.72 },
];
const RFDS_BASES = [
  { id:"bankstown",   name:"Bankstown",   icao:"YSBK", lat:-33.924, lon:150.988 },
  { id:"dubbo",       name:"Dubbo",       icao:"YSDU", lat:-32.217, lon:148.575 },
  { id:"broken-hill", name:"Broken Hill", icao:"YBHI", lat:-31.988, lon:141.472 },
];
// gndKm = actual road distance (airport → hospital front door)
// gndSpeedKph = realistic average incl. traffic lights, hospital zone, intersections
//   Metro Sydney: 30-35 km/h  |  Regional towns: 40-45 km/h  |  Highway mix: 50-55 km/h
const HOSPITALS = [
  { id:"rpa",          name:"Royal Prince Alfred",      lhd:"sydney",               lat:-33.889, lon:151.186, level:1, capabilities:["trauma","cardiac","stroke","burns","neuro","paeds"], runway:"YSSY", gndKm:15, gndSpeedKph:30 },
  { id:"westmead",     name:"Westmead Hospital",        lhd:"western-sydney",        lat:-33.806, lon:150.987, level:1, capabilities:["trauma","cardiac","stroke","neuro","paeds"],         runway:"YSCN", gndKm:14, gndSpeedKph:35 },
  { id:"liverpool",    name:"Liverpool Hospital",        lhd:"south-western-sydney",  lat:-33.921, lon:150.921, level:1, capabilities:["trauma","cardiac","stroke","neuro"],                  runway:"YSCN", gndKm:18, gndSpeedKph:35 },
  { id:"john-hunter", name:"John Hunter Hospital",      lhd:"hunter-new-england",    lat:-32.906, lon:151.713, level:1, capabilities:["trauma","cardiac","stroke","neuro","paeds"],          runway:"YWLM", gndKm:30, gndSpeedKph:50 },
  { id:"st-george",   name:"St George Hospital",        lhd:"south-eastern-sydney",  lat:-33.964, lon:151.133, level:1, capabilities:["trauma","cardiac","stroke"],                          runway:"YSSY", gndKm:22, gndSpeedKph:30 },
  { id:"concord",     name:"Concord Repat Hospital",    lhd:"sydney",                lat:-33.864, lon:151.087, level:2, capabilities:["cardiac","stroke","trauma"],                          runway:"YSCN", gndKm:12, gndSpeedKph:35 },
  { id:"nepean",      name:"Nepean Hospital",           lhd:"nepean-blue-mountains", lat:-33.746, lon:150.671, level:2, capabilities:["trauma","cardiac","stroke","paeds"],                  runway:"YSCN", gndKm:32, gndSpeedKph:50 },
  { id:"gosford",     name:"Gosford Hospital",          lhd:"central-coast",         lat:-33.418, lon:151.323, level:2, capabilities:["cardiac","stroke","trauma"],                          runway:"YWLM", gndKm:55, gndSpeedKph:55 },
  { id:"wollongong",  name:"Wollongong Hospital",       lhd:"illawarra-shoalhaven",  lat:-34.431, lon:150.894, level:2, capabilities:["cardiac","stroke","trauma"],                          runway:"YWOL", gndKm:10, gndSpeedKph:40 },
  { id:"lismore",     name:"Lismore Base Hospital",     lhd:"northern-nsw",          lat:-28.812, lon:153.267, level:2, capabilities:["trauma","cardiac","stroke"],                          runway:"YLRD", gndKm:7,  gndSpeedKph:40 },
  { id:"tamworth",    name:"Tamworth Hospital",         lhd:"hunter-new-england",    lat:-31.094, lon:150.915, level:2, capabilities:["trauma","cardiac"],                                   runway:"YSTW", gndKm:7,  gndSpeedKph:40 },
  { id:"wagga",       name:"Wagga Base Hospital",       lhd:"murrumbidgee",          lat:-35.107, lon:147.373, level:2, capabilities:["trauma","cardiac","stroke"],                          runway:"YSWG", gndKm:8,  gndSpeedKph:40 },
  { id:"orange",      name:"Orange Health Service",     lhd:"western-nsw",           lat:-33.282, lon:149.100, level:3, capabilities:["trauma","cardiac"],                                   runway:"YORG", gndKm:10, gndSpeedKph:40 },
  { id:"dubbo-h",     name:"Dubbo Health Service",      lhd:"western-nsw",           lat:-32.247, lon:148.605, level:3, capabilities:["trauma","cardiac"],                                   runway:"YSDU", gndKm:12, gndSpeedKph:40 },
  { id:"broken-hill-h",name:"Broken Hill Health",      lhd:"far-west",              lat:-31.953, lon:141.469, level:3, capabilities:["trauma"],                                              runway:"YBHI", gndKm:10, gndSpeedKph:40 },
  { id:"griffith",    name:"Griffith Base Hospital",    lhd:"murrumbidgee",          lat:-34.293, lon:146.047, level:3, capabilities:["trauma","cardiac"],                                   runway:"YGTH", gndKm:8,  gndSpeedKph:40 },
  { id:"port-mac",    name:"Port Macquarie Hospital",   lhd:"mid-north-coast",       lat:-31.434, lon:152.909, level:3, capabilities:["trauma","cardiac"],                                   runway:"YPMQ", gndKm:12, gndSpeedKph:40 },
];

function haversineKm(la1:number,lo1:number,la2:number,lo2:number){
  const R=6371,dL=((la2-la1)*Math.PI)/180,dO=((lo2-lo1)*Math.PI)/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function kmToNm(k:number){return k/1.852;}
function fmtTime(m:number){if(m<60)return`${m}m`;const h=Math.floor(m/60),r=m%60;return r===0?`${h}h`:`${h}h ${r}m`;}
function fmtCost(n:number){return`$${n.toLocaleString("en-AU")}`;};
// Operational time allowances
const STARTUP_MIN = 20;       // engine start + taxi + approach per airfield op
const PATIENT_HANDLING_MIN = 30; // patient loading (at pickup) + unloading (at destination)
function fmtKm(n:number){return`${Math.round(n)} km`;}
function fmtNm(km:number){return`${Math.round(km/1.852)} nm`;}
function fmtDist(km:number){return`${Math.round(km/1.852)} nm (${Math.round(km)} km)`;}

// ─────────────────────────────────────────────────────────────────────────────
// ROUND-TRIP ENGINE
// Leg 1: Base → Patient (positioning/outbound)
// Leg 2: Patient → Hospital (loaded)
// Leg 3: Hospital → Base (return, empty)
// Ground: hospital aerodrome → hospital door (NSW Ambulance 2025 rates)
// ─────────────────────────────────────────────────────────────────────────────
interface RoundTripResult {
  fleetKey: FleetKey;
  // distances
  leg1Km:number; leg2Km:number; leg3Km:number; totalKm:number; totalNm:number;
  // times (each leg includes 15 min startup)
  leg1Min:number; leg2Min:number; leg3Min:number;
  flightTotalMin:number; gndTimeMin:number; missionTotalMin:number;
  billedHrs:number;
  // fuel
  fuelLitres:number; fuelCost:number;
  // full cost components
  airframeCost:number; crewCost:number; contingency:number;
  fullAircraftCost:number;
  // ground (NSW Ambulance 2025)
  ambCallOut:number; ambKmCharge:number; ambTotal:number; ambCapped:boolean;
  // totals
  fullTotalCost:number;
  contractAircraftCost:number; contractTotalCost:number;
  // efficiency metrics
  withinRange:boolean; variance:number;
  costPerNm:number; contractCostPerNm:number;
  speedKts:number; rangeNm:number;
}

function calcRoundTrip(
  key: FleetKey,
  baseLat:number, baseLon:number,
  patLat:number, patLon:number,
  hospLat:number, hospLon:number,
  hospGndKm:number,
  isEmergency:boolean,
  hospGndSpeedKph:number = 40
): RoundTripResult {
  const ac = FLEET[key];
  // 1.12 routing factor: airways/ATC routing adds ~12% over direct great-circle distance
  const leg1Km = haversineKm(baseLat,baseLon,patLat,patLon)*1.12;
  const leg2Km = haversineKm(patLat,patLon,hospLat,hospLon)*1.12;
  const leg3Km = haversineKm(hospLat,hospLon,baseLat,baseLon)*1.12;
  const totalKm = leg1Km+leg2Km+leg3Km;
  const totalNm = kmToNm(totalKm);
  const withinRange = totalNm <= ac.rangeNm * 1.1;

  // +20 min per leg: engine start + taxi + approach/landing at each airfield
  const leg1Min = Math.round(kmToNm(leg1Km)/ac.cruiseKts*60+STARTUP_MIN);
  const leg2Min = Math.round(kmToNm(leg2Km)/ac.cruiseKts*60+STARTUP_MIN);
  const leg3Min = Math.round(kmToNm(leg3Km)/ac.cruiseKts*60+STARTUP_MIN);
  const flightTotalMin = leg1Min+leg2Min+leg3Min;
  // Patient handling: 30 min loading at pickup + 30 min unloading at hospital
  const handlingTotalMin = PATIENT_HANDLING_MIN*2;

  // NSW Ambulance ground leg
  const amb = calcAmbulanceCost(hospGndKm, isEmergency, true);
  const gndTimeMin = Math.round((hospGndKm/hospGndSpeedKph)*60);
  const missionTotalMin = flightTotalMin + handlingTotalMin + gndTimeMin;

  // Billed hours: all flight + 0.5 hr positioning/return overhead
  const billedHrs = flightTotalMin/60 + 0.5;

  const fuelLitres = Math.round(ac.fuelBurnLph*billedHrs);
  const fuelCost   = Math.round(fuelLitres*ac.fuelCostPerL);
  const airframeCost = Math.round(ac.costPerHour*ac.maintenanceRate*billedHrs);
  const crewCost     = Math.round(2*ac.pilotRate*billedHrs);
  const baseSub      = fuelCost+airframeCost+crewCost;
  const contingency  = Math.round(baseSub*0.15);
  const fullAircraftCost = baseSub+contingency;
  const fullTotalCost = fullAircraftCost+amb.total;

  const contractAircraftCost = Math.round(ac.contractRate*billedHrs);
  const contractTotalCost    = contractAircraftCost+amb.total;

  const variance = fullTotalCost-contractTotalCost;
  const costPerNm      = totalNm>0 ? Math.round(fullTotalCost/totalNm) : 0;
  const contractCostPerNm = totalNm>0 ? Math.round(contractTotalCost/totalNm) : 0;

  return {
    fleetKey:key, leg1Km,leg2Km,leg3Km,totalKm,totalNm,
    leg1Min,leg2Min,leg3Min,flightTotalMin,gndTimeMin,missionTotalMin,billedHrs,
    fuelLitres,fuelCost,airframeCost,crewCost,contingency,fullAircraftCost,
    ambCallOut:amb.callOut, ambKmCharge:amb.kmCharge, ambTotal:amb.total, ambCapped:amb.capped,
    fullTotalCost, contractAircraftCost, contractTotalCost,
    withinRange, variance,
    costPerNm, contractCostPerNm,
    speedKts: ac.cruiseKts, rangeNm: ac.rangeNm,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FLEET COMPARISON — board-ready
// ─────────────────────────────────────────────────────────────────────────────
const BOARD_FLEET: FleetKey[] = ["B200","B300","PC24"];

interface FleetComparisonProps {
  baseLat:number; baseLon:number;
  patLat:number; patLon:number;
  hospLat:number; hospLon:number;
  hospName:string; hospGndKm:number; hospGndSpeedKph:number; hospRunway:string;
  baseName:string; isEmergency:boolean;
  enabledFleet:FleetKey[];
}

function FleetComparison({
  baseLat,baseLon,patLat,patLon,hospLat,hospLon,
  hospName,hospGndKm,hospGndSpeedKph,hospRunway,baseName,isEmergency,enabledFleet,
}: FleetComparisonProps){
  const [mode, setMode] = useState<CostMode>("contract");
  const [expandedKey, setExpandedKey] = useState<FleetKey|null>(null);

  const results: RoundTripResult[] = enabledFleet
    .map(k => calcRoundTrip(k,baseLat,baseLon,patLat,patLon,hospLat,hospLon,hospGndKm,isEmergency,hospGndSpeedKph))
    .sort((a,b)=>a.missionTotalMin-b.missionTotalMin);

  if(results.length===0) return null;

  const getCost = (r:RoundTripResult) => mode==="contract" ? r.contractTotalCost : r.fullTotalCost;
  const getAcCost = (r:RoundTripResult) => mode==="contract" ? r.contractAircraftCost : r.fullAircraftCost;
  const maxCost = Math.max(...results.map(r=>getCost(r)));
  const minCostR = results.reduce((b,r)=>getCost(r)<getCost(b)?r:b, results[0]);
  const fastestR = results[0];
  const avgVariance = Math.round(results.reduce((s,r)=>s+r.variance,0)/results.length);

  // Efficiency score 0-100: weighted time (40%) + cost (40%) + range (20%)
  const maxTime = Math.max(...results.map(r=>r.missionTotalMin));
  const effScore = (r:RoundTripResult) => {
    const tScore = ((maxTime-r.missionTotalMin)/maxTime)*40;
    const cScore = ((maxCost-getCost(r))/maxCost)*40;
    const rScore = (r.rangeNm/2000)*20;
    return Math.round(tScore+cScore+rScore);
  };

  return (
    <div className="space-y-5">

      {/* ── Toggle + header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
            Board Fleet Comparison — Round Trip
          </div>
          <div className="text-xs text-muted-foreground">
            {baseName} → Patient pickup → {hospName} ({hospRunway}) → {baseName}
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-[#0d1922]">
          {(["contract","full"] as CostMode[]).map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode===m
                  ? m==="contract" ? "bg-cyan-600 text-white shadow" : "bg-amber-600 text-white shadow"
                  : "text-muted-foreground hover:text-white"
              }`}>
              {m==="contract" ? "Contract Rate" : "Full Cost Recovery"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mode banner ── */}
      <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-xs border ${
        mode==="contract"
          ? "bg-cyan-500/8 border-cyan-500/20 text-cyan-300"
          : "bg-amber-500/8 border-amber-500/20 text-amber-300"
      }`}>
        <Info size={13} className="mt-0.5 shrink-0"/>
        <div>
          {mode==="contract"
            ? <><strong>Contract Rate</strong> — hourly rate billed to the NSW health system under the NEPT/aeromedical services agreement. Used for invoicing, tender pricing, and inter-hospital transport agreements.</>
            : <><strong>Full Cost Recovery</strong> — actual operational expenditure: fuel at $1.85/L Avtur, airframe maintenance, 2-crew pilot cost, and 15% operational contingency. Represents true mission cost to RFDS SE operations.</>
          }
        </div>
      </div>

      {/* ── KPI summary row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label:"Fastest Mission",
            icon:<Clock size={15} className="text-cyan-400"/>,
            primary: FLEET[fastestR.fleetKey].icon+" "+FLEET[fastestR.fleetKey].shortName,
            value: fmtTime(fastestR.missionTotalMin),
            sub:`${fmtTime(fastestR.flightTotalMin)} flight`,
            color:"#0097A7",
          },
          {
            label: mode==="contract" ? "Lowest Contract Cost" : "Lowest Full Cost",
            icon:<DollarSign size={15} className="text-green-400"/>,
            primary: FLEET[minCostR.fleetKey].icon+" "+FLEET[minCostR.fleetKey].shortName,
            value: fmtCost(getCost(minCostR)),
            sub:`${fmtCost(minCostR.contractCostPerNm)}/nm`,
            color:"#43A047",
          },
          {
            label:"Avg Subsidy Gap",
            icon:<ArrowLeftRight size={15} className="text-amber-400"/>,
            primary:"Full − Contract",
            value: fmtCost(avgVariance),
            sub:"per mission (avg fleet)",
            color:"#FB8C00",
          },
        ].map((kpi,i)=>(
          <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">{kpi.icon}{kpi.label}</div>
            <div className="text-sm font-bold mb-0.5" style={{color:kpi.color}}>{kpi.primary}</div>
            <div className="text-lg font-bold">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main comparison table ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {/* Column headers */}
        <div className="grid" style={{gridTemplateColumns:`200px repeat(${results.length},1fr)`}}>
          {/* blank corner */}
          <div className="bg-[#0b1520] px-4 py-3 border-r border-white/10 flex items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Metric</span>
          </div>
          {results.map(r=>{
            const ac = FLEET[r.fleetKey];
            const score = effScore(r);
            const isBest = r.fleetKey===minCostR.fleetKey && r.fleetKey===fastestR.fleetKey;
            return (
              <div key={r.fleetKey} className="bg-[#0b1520] px-3 py-3 text-center border-r border-white/10 last:border-r-0"
                style={{borderTop:`3px solid ${ac.color}`}}>
                <div className="text-xl mb-1">{ac.icon}</div>
                <div className="text-sm font-bold" style={{color:ac.color}}>{ac.shortName}</div>
                <div className="text-xs text-muted-foreground">{ac.name}</div>
                {!r.withinRange && (
                  <Badge className="mt-1 text-xs bg-red-500/20 text-red-400 border-red-500/40">Range exceeded</Badge>
                )}
                {/* Efficiency pill */}
                <div className="mt-2 flex items-center justify-center gap-1">
                  <div className="text-xs text-muted-foreground/60">Efficiency</div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{background:`${ac.color}20`, color:ac.color}}>
                    {score}/100
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {([
          // ── TIMING ──────────────────────────────────────────────────────────
          { section:true, label:"Flight Performance" },
          {
            label:"Cruise Speed",
            icon:<Gauge size={11}/>,
            fmt:(r:RoundTripResult)=>{ const ac=FLEET[r.fleetKey]; return `${ac.cruiseKts} kts`; },
            sub:(_r:RoundTripResult)=>"true airspeed",
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>FLEET[r.fleetKey].cruiseKts>FLEET[b.fleetKey].cruiseKts?r:b,rs[0]).fleetKey,
          },
          {
            label:"Total Flight Time",
            icon:<Plane size={11}/>,
            fmt:(r:RoundTripResult)=>fmtTime(r.flightTotalMin),
            sub:(r:RoundTripResult)=>`3 legs`,  
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.flightTotalMin<b.flightTotalMin?r:b,rs[0]).fleetKey,
          },
          {
            label:"Mission Total",
            icon:<Clock size={11}/>,
            fmt:(r:RoundTripResult)=>fmtTime(r.missionTotalMin),
            sub:(r:RoundTripResult)=>`+${fmtTime(r.gndTimeMin)} ground`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.missionTotalMin<b.missionTotalMin?r:b,rs[0]).fleetKey,
            bold:true,
          },
          {
            label:"Billed Hours",
            icon:<Clock size={11}/>,
            fmt:(r:RoundTripResult)=>`${r.billedHrs.toFixed(2)} hr`,
            sub:(_r:RoundTripResult)=>"incl. 30 min overhead",
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.billedHrs<b.billedHrs?r:b,rs[0]).fleetKey,
          },
          // ── FUEL ────────────────────────────────────────────────────────────
          { section:true, label:"Fuel & Operating" },
          {
            label:"Fuel Consumed",
            icon:<Fuel size={11}/>,
            fmt:(r:RoundTripResult)=>`${r.fuelLitres.toLocaleString("en-AU")} L`,
            sub:(r:RoundTripResult)=>`${FLEET[r.fleetKey].fuelBurnLph} L/hr burn`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.fuelLitres<b.fuelLitres?r:b,rs[0]).fleetKey,
          },
          {
            label:"Fuel Cost",
            icon:<DollarSign size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.fuelCost),
            sub:(r:RoundTripResult)=>`$${FLEET[r.fleetKey].fuelCostPerL.toFixed(2)}/L Avtur`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.fuelCost<b.fuelCost?r:b,rs[0]).fleetKey,
          },
          {
            label:"Airframe & Maint.",
            icon:<Wrench size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.airframeCost),
            sub:(r:RoundTripResult)=>`${Math.round(FLEET[r.fleetKey].maintenanceRate*100)}% of hrly rate`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.airframeCost<b.airframeCost?r:b,rs[0]).fleetKey,
          },
          {
            label:"Crew Cost (×2 pilots)",
            icon:<Users size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.crewCost),
            sub:(r:RoundTripResult)=>`${fmtCost(FLEET[r.fleetKey].pilotRate)}/pilot/hr`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.crewCost<b.crewCost?r:b,rs[0]).fleetKey,
          },
          {
            label:"Contingency (15%)",
            icon:<TrendingUp size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.contingency),
            sub:(_r:RoundTripResult)=>"weather, positioning",
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>r.contingency<b.contingency?r:b,rs[0]).fleetKey,
          },
          // ── GROUND ──────────────────────────────────────────────────────────
          { section:true, label:"Ground Transport (NSW Ambulance 2025)" },
          {
            label:"Amb. Call-out Fee",
            icon:<Navigation size={11}/>,
            fmt:(_r:RoundTripResult)=>fmtCost(_r.ambCallOut),
            sub:(_r:RoundTripResult)=>isEmergency?"Emergency rate":"Non-emergency rate",
          },
          {
            label:"Amb. per-km Charge",
            icon:<Navigation size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.ambKmCharge),
            sub:(r:RoundTripResult)=>`${r.ambCapped?"Capped at $7,601":""}${!r.ambCapped?`${(hospGndKm*2)} km round trip`:""}`,
          },
          {
            label:"Ground Total",
            icon:<Navigation size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.ambTotal),
            sub:(r:RoundTripResult)=>r.ambCapped?"★ NSW max cap applied":"NSW resident rate",
          },
          // ── COST TOTALS ─────────────────────────────────────────────────────
          { section:true, label: mode==="contract" ? "Contract Billing" : "Full Cost Recovery" },
          {
            label: mode==="contract" ? "Aircraft Charge" : "Aircraft Cost",
            icon:<Plane size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(getAcCost(r)),
            sub:(r:RoundTripResult)=>mode==="contract"
              ? `${fmtCost(FLEET[r.fleetKey].contractRate)}/hr × ${r.billedHrs.toFixed(2)}h`
              : `fuel+maint+crew+cont.`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>getAcCost(r)<getAcCost(b)?r:b,rs[0]).fleetKey,
          },
          {
            label:"TOTAL MISSION COST",
            icon:<DollarSign size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(getCost(r)),
            sub:(r:RoundTripResult)=>`${fmtCost(mode==="contract"?r.contractCostPerNm:r.costPerNm)}/nm`,
            best:(rs:RoundTripResult[])=>rs.reduce((b,r)=>getCost(r)<getCost(b)?r:b,rs[0]).fleetKey,
            bold:true, highlight:true,
          },
          {
            label:"Subsidy Gap",
            icon:<ArrowLeftRight size={11}/>,
            fmt:(r:RoundTripResult)=>fmtCost(r.variance),
            sub:(_r:RoundTripResult)=>"full cost − contract billed",
            amber:true,
          },
        ] as any[]).map((row,ri)=>{
          if(row.section){
            return (
              <div key={ri} className="grid border-t border-white/10"
                style={{gridTemplateColumns:`200px repeat(${results.length},1fr)`}}>
                <div className="col-span-full bg-white/5 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-white/8">
                  {row.label}
                </div>
              </div>
            );
          }
          const bestKey = row.best?.(results);
          return (
            <div key={ri} className={`grid border-t border-white/5 ${ri%2===0?"bg-white/2":""}`}
              style={{gridTemplateColumns:`200px repeat(${results.length},1fr)`}}>
              {/* label */}
              <div className="px-4 py-2.5 flex items-center gap-2 border-r border-white/8">
                <span className="text-muted-foreground shrink-0">{row.icon}</span>
                <span className={`text-xs ${row.bold?"font-semibold text-foreground":"text-muted-foreground"}`}>{row.label}</span>
              </div>
              {/* values */}
              {results.map(r=>{
                const isBest = bestKey===r.fleetKey;
                const ac = FLEET[r.fleetKey];
                return (
                  <div key={r.fleetKey}
                    className={`px-3 py-2.5 text-center border-r border-white/5 last:border-r-0 ${
                      row.highlight && isBest ? "bg-cyan-500/10" :
                      row.highlight ? "bg-white/2" : ""
                    }`}>
                    <div className={`text-sm ${
                      row.bold ? "font-bold" : "font-semibold"
                    } ${
                      row.amber ? "text-amber-400" :
                      row.highlight && isBest ? "text-cyan-300" :
                      isBest ? "" : ""
                    }`}
                      style={isBest && !row.amber && !row.highlight ? {color:ac.color} : undefined}>
                      {row.fmt(r)}
                      {isBest && !row.amber && (
                        <span className="ml-1 text-xs">★</span>
                      )}
                    </div>
                    {row.sub && <div className="text-xs text-muted-foreground/60 mt-0.5">{row.sub(r)}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Cost efficiency bars ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <BarChart3 size={13} className="text-cyan-400"/>
          <span className="text-xs font-semibold uppercase tracking-widest">Fleet Cost Efficiency</span>
          <span className="text-xs text-muted-foreground ml-1">
            — {mode==="contract"?"Contract billing":"Full cost"} per mission · lower bar = more efficient
          </span>
        </div>
        <div className="p-4 space-y-4">
          {results.map(r=>{
            const ac = FLEET[r.fleetKey];
            const cost = getCost(r);
            const pct = maxCost>0 ? (cost/maxCost)*100 : 0;
            const isLowest = cost===Math.min(...results.map(getCost));
            const flightPct = (r.flightTotalMin/(r.flightTotalMin+r.gndTimeMin))*100;
            return (
              <div key={r.fleetKey}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{ac.icon}</span>
                    <div>
                      <span className="text-sm font-bold" style={{color:ac.color}}>{ac.shortName}</span>
                      <span className="text-xs text-muted-foreground ml-2">{ac.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtTime(r.missionTotalMin)}</span>
                    {isLowest && (
                      <Badge className="text-xs bg-cyan-500/15 text-cyan-400 border-cyan-500/30 gap-1">
                        <Award size={9}/> Most efficient
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{fmtCost(cost)}</div>
                    {mode==="full" && r.variance>0 && (
                      <div className="text-xs text-amber-400">{fmtCost(r.variance)} gap</div>
                    )}
                  </div>
                </div>
                {/* Main cost bar */}
                <div className="w-full bg-white/5 rounded-full h-3 relative overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{width:`${pct}%`, background:ac.color, opacity:isLowest?1:0.55}}/>
                </div>
                {/* Leg time mini-bar */}
                <div className="flex gap-px mt-1 rounded-full overflow-hidden h-1.5 w-full">
                  <div className="h-1.5 rounded-l-full" style={{width:`${(r.leg1Min/r.flightTotalMin)*100}%`, background:"#0097A7"}}/>
                  <div className="h-1.5" style={{width:`${(r.leg2Min/r.flightTotalMin)*100}%`, background:"#4CAF50"}}/>
                  <div className="h-1.5 rounded-r-full" style={{width:`${(r.leg3Min/r.flightTotalMin)*100}%`, background:"#607D8B"}}/>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground/50">
                  <span style={{color:"#0097A7"}}>▬ Outbound {fmtTime(r.leg1Min)}</span>
                  <span style={{color:"#4CAF50"}}>▬ Loaded {fmtTime(r.leg2Min)}</span>
                  <span style={{color:"#607D8B"}}>▬ Return {fmtTime(r.leg3Min)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Per-aircraft accordion detail ── */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold px-1">Full Cost Breakdown Per Aircraft</div>
        {results.map(r=>{
          const ac = FLEET[r.fleetKey];
          const open = expandedKey===r.fleetKey;
          return (
            <div key={r.fleetKey} className="rounded-xl border border-white/10 overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={()=>setExpandedKey(open?null:r.fleetKey)}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ac.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold" style={{color:ac.color}}>{ac.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtTime(r.missionTotalMin)} · {fmtCost(getCost(r))} {mode==="contract"?"(contract)":"(full cost)"}
                      {!r.withinRange && <span className="text-red-400 ml-2">⚠ range exceeded</span>}
                    </div>
                  </div>
                </div>
                {open?<ChevronUp size={15} className="text-muted-foreground"/>:<ChevronDown size={15} className="text-muted-foreground"/>}
              </button>
              {open && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* 3 legs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {label:"Leg 1 — Outbound", sub:`${baseName} → Patient`, km:r.leg1Km, min:r.leg1Min, col:"#0097A7"},
                      {label:"Leg 2 — Patient Loaded", sub:`Patient → ${hospName}`, km:r.leg2Km, min:r.leg2Min, col:"#4CAF50"},
                      {label:"Leg 3 — Return", sub:`${hospName} → ${baseName}`, km:r.leg3Km, min:r.leg3Min, col:"#607D8B"},
                    ].map((leg,li)=>(
                      <div key={li} className="rounded-lg p-3 border border-white/8 bg-white/3 text-center">
                        <div className="text-xs font-semibold mb-1" style={{color:leg.col}}>{leg.label}</div>
                        <div className="text-lg font-bold">{fmtTime(leg.min)}</div>
                        <div className="text-xs text-muted-foreground"></div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">{leg.sub}</div>
                      </div>
                    ))}
                  </div>
                  {/* Cost table */}
                  <div className="rounded-lg border border-white/10 overflow-hidden text-xs">
                    <div className="bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-white/8">
                      Cost Breakdown — {mode==="contract"?"Contract Rate":"Full Cost Recovery"}
                    </div>
                    <div className="divide-y divide-white/5">
                      {mode==="full" ? <>
                        {[
                          {icon:<Fuel size={10}/>, label:`Fuel — ${r.fuelLitres.toLocaleString("en-AU")} L @ $${ac.fuelCostPerL}/L`, val:r.fuelCost},
                          {icon:<Wrench size={10}/>, label:`Airframe & Maintenance (${Math.round(ac.maintenanceRate*100)}%)`, val:r.airframeCost},
                          {icon:<Users size={10}/>, label:`Flight Crew × 2 pilots @ ${fmtCost(ac.pilotRate)}/hr`, val:r.crewCost},
                          {icon:<TrendingUp size={10}/>, label:`Contingency 15%`, val:r.contingency},
                        ].map((row,i)=>(
                          <div key={i} className="flex justify-between items-center px-3 py-2">
                            <span className="text-muted-foreground flex items-center gap-1.5">{row.icon}{row.label}</span>
                            <span className="font-semibold">{fmtCost(row.val)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between px-3 py-2 bg-white/3 font-semibold">
                          <span className="text-amber-300">Aircraft Subtotal</span>
                          <span className="text-amber-300">{fmtCost(r.fullAircraftCost)}</span>
                        </div>
                      </> : (
                        <div className="flex justify-between items-center px-3 py-2">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Plane size={10}/>{fmtCost(ac.contractRate)}/hr × {r.billedHrs.toFixed(2)} hr
                          </span>
                          <span className="font-semibold text-cyan-300">{fmtCost(r.contractAircraftCost)}</span>
                        </div>
                      )}
                      {/* Ground */}
                      <div className="flex justify-between items-center px-3 py-2">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Navigation size={10}/>NSW Ambulance — call-out + {hospGndKm*2} km
                          {r.ambCapped && " (capped)"}
                        </span>
                        <span className="font-semibold">{fmtCost(r.ambTotal)}</span>
                      </div>
                      <div className="flex justify-between px-3 py-2.5 bg-cyan-500/8 border-t border-cyan-500/15 font-bold text-sm">
                        <span className="text-cyan-300">TOTAL</span>
                        <span className="text-cyan-300">{fmtCost(getCost(r))}</span>
                      </div>
                    </div>
                  </div>
                  {/* Subsidy gap */}
                  {mode==="full" && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                      <ArrowLeftRight size={12} className="text-amber-400 mt-0.5 shrink-0"/>
                      <div className="text-xs">
                        <span className="font-semibold text-amber-300">Subsidy gap: {fmtCost(r.variance)}</span>
                        <span className="text-amber-400/70"> — full cost {fmtCost(r.fullTotalCost)} vs contract billing {fmtCost(r.contractTotalCost)} per mission</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footnote ── */}
      <div className="text-xs text-muted-foreground/50 leading-relaxed border-t border-white/5 pt-3">
        Round-trip: 3 legs (base→patient→hospital→base). Flight times apply a 1.12 airways routing factor over direct track distance, plus 20 min per airfield op (engine start, taxi, approach/landing) and 30 min per patient handling event (loading at pickup, unloading at destination). Fuel at $1.85/L Avtur (Jet-A1). Pilot rates indicative. Ground transport calculated at <a href="https://www.ambulance.nsw.gov.au/our-services/accounts-and-fees" className="underline hover:text-white" target="_blank">NSW Ambulance 2025 rates</a>: {isEmergency?"$464 call-out + $4.18/km":"$365 call-out + $2.26/km"} (NSW resident); capped at $7,601. Medical crew, pharmaceuticals, handling, and overnight allowances excluded. For board presentation purposes only.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE-MISSION COST MODAL (optimiser tab)
// ─────────────────────────────────────────────────────────────────────────────
interface RouteOption {
  hospital:typeof HOSPITALS[0]; aircraftKey:AircraftKey;
  flightTimeMin:number; flightKm:number; gndTimeMin:number; totalTimeMin:number;
  aircraftCost:number; gndCost:number; totalCost:number;
  capabilityMatch:boolean; divertedFrom?:string; isRecommended:boolean; score:number;
}
interface MissionInputs {
  aircraftBase:string; patientLat:string; patientLon:string; patientLocation:string;
  lhd:string; caseType:CaseType; priority:CasePriority;
  availableAircraft:AircraftKey[]; ambulanceSpeedKph:number; ambulanceCostPerKm:number;
}
function optimise(inputs:MissionInputs):RouteOption[]{
  const pLat=parseFloat(inputs.patientLat),pLon=parseFloat(inputs.patientLon);
  if(isNaN(pLat)||isNaN(pLon))return[];
  const base=RFDS_BASES.find(b=>b.id===inputs.aircraftBase)||RFDS_BASES[0];
  const all:RouteOption[]=[];
  for(const hosp of HOSPITALS){
    for(const acKey of inputs.availableAircraft){
      const ac=AIRCRAFT[acKey];
      const legKm=(haversineKm(base.lat,base.lon,pLat,pLon)+haversineKm(pLat,pLon,hosp.lat,hosp.lon))*1.12;
      if(kmToNm(legKm)>ac.rangeNm)continue;
      const fHrs=kmToNm(legKm)/ac.cruiseKts;
      // Aircraft leg = air time + 2×STARTUP (engine start/taxi at base + pickup airfield)
      const fMin=Math.round(fHrs*60 + STARTUP_MIN*2);
      // Patient handling is ground time — separate from aircraft leg
      const handlingMin=PATIENT_HANDLING_MIN*2;  // 30 min load + 30 min unload
      const gMin=Math.round((hosp.gndKm/hosp.gndSpeedKph)*60);
      const tMin=fMin+handlingMin+gMin;
      const acCost=(fHrs+0.5)*ac.costPerHour;
      const isEmer=inputs.priority==="P1"||inputs.priority==="P2";
      const amb=calcAmbulanceCost(hosp.gndKm,isEmer,true);
      const capMatch=hosp.capabilities.includes(inputs.caseType)||inputs.caseType==="general";
      const pF=inputs.priority==="P1"?3:inputs.priority==="P2"?1.5:1;
      const score=(4-hosp.level)*10+(capMatch?40:0)-tMin*pF*0.5-acCost*0.01;
      all.push({
        hospital:hosp,aircraftKey:acKey,flightTimeMin:fMin,flightKm:Math.round(legKm),
        handlingMin,gndTimeMin:gMin,totalTimeMin:tMin,aircraftCost:Math.round(acCost),
        gndCost:amb.total,totalCost:Math.round(acCost)+amb.total,
        capabilityMatch:capMatch,
        divertedFrom:inputs.lhd!==hosp.lhd?LHDs.find(l=>l.id===inputs.lhd)?.name:undefined,
        isRecommended:false,score,
      });
    }
  }
  all.sort((a,b)=>b.score-a.score);
  const seen=new Set<string>();
  const top=all.filter(r=>{if(seen.has(r.hospital.id))return false;seen.add(r.hospital.id);return true;}).slice(0,5);
  if(top.length)top[0].isRecommended=true;
  return top;
}
const PRIORITY_STYLE:Record<CasePriority,string>={
  P1:"bg-red-500/20 text-red-400 border-red-500/40",
  P2:"bg-amber-500/20 text-amber-400 border-amber-500/40",
  P3:"bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
};
const LEVEL_LABEL:Record<number,string>={1:"Level 1 — Major Trauma",2:"Level 2 — Metropolitan",3:"Level 3 — Regional"};

interface CostModalProps{route:RouteOption;patientLocation:string;priority:CasePriority;onClose:()=>void;}
function CostBreakdownModal({route,patientLocation,priority,onClose}:CostModalProps){
  const ac=AIRCRAFT[route.aircraftKey];
  const bHrs=route.flightTimeMin/60;
  const fuel=Math.round(ac.fuelBurnLph*bHrs);
  const fuelC=Math.round(fuel*ac.fuelCostPerL);
  const airC=Math.round(ac.costPerHour*ac.maintenanceRate*bHrs);
  const crew=Math.round(2*ac.pilotRate*bHrs);
  const sub=fuelC+airC+crew;
  const cont=Math.round(sub*0.15);
  const acSub=sub+cont;
  const total=acSub+route.gndCost;
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="bg-[#0f1923] border border-cyan-500/30 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden" style={{maxHeight:"90vh",overflowY:"auto"}}>
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-cyan-400"/>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Mission Cost Forecast (One-way)</span>
              <Badge className={`${PRIORITY_STYLE[priority]} text-xs`}>{priority}</Badge>
            </div>
            <div className="text-sm font-bold">{ac.icon} {ac.name} → {route.hospital.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{patientLocation} · {fmtTime(route.flightTimeMin)} flight</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded"><X size={18}/></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              {label:"Flight time",val:fmtTime(route.flightTimeMin),sub:"incl. 2 × 20m startup"},
              {label:"Patient handling",val:fmtTime(route.handlingMin),sub:"30 min load + 30 min unload"},
              {label:"Billed hours",val:`${bHrs.toFixed(2)} hr`,sub:"flight + handling time"},
              {label:"Rate",val:fmtCost(ac.costPerHour)+"/hr",sub:""},
            ].map((k,i)=>(
              <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
                <div className="text-base font-bold text-cyan-400">{k.val}</div>
                {k.sub&&<div className="text-xs text-muted-foreground">{k.sub}</div>}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/10 overflow-hidden text-xs">
            <div className="bg-white/5 px-3 py-2 font-semibold uppercase tracking-widest text-muted-foreground border-b border-white/8 flex items-center gap-2">
              <Plane size={11}/>Aircraft Cost
            </div>
            {[
              {icon:<Fuel size={10}/>, label:`Fuel — ${fuel.toLocaleString("en-AU")} L`, val:fuelC},
              {icon:<Wrench size={10}/>, label:`Airframe & Maintenance`, val:airC},
              {icon:<Users size={10}/>, label:`Flight Crew × 2`, val:crew},
              {icon:<TrendingUp size={10}/>, label:`Contingency 15%`, val:cont},
            ].map((row,i)=>(
              <div key={i} className="flex justify-between px-3 py-2 border-t border-white/5">
                <span className="text-muted-foreground flex items-center gap-1.5">{row.icon}{row.label}</span>
                <span className="font-semibold">{fmtCost(row.val)}</span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 bg-white/3 font-semibold border-t border-white/8">
              <span className="text-cyan-300">Aircraft Subtotal</span><span className="text-cyan-300">{fmtCost(acSub)}</span>
            </div>
          </div>
          <div className="flex justify-between px-3 py-2.5 rounded-lg border border-white/10 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5"><Navigation size={10}/>NSW Ambulance ground</span>
            <span className="font-semibold">{fmtCost(route.gndCost)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/5">
            <div>
              <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Total Mission Cost</div>
              <div className="text-xs text-muted-foreground">Aircraft + Ground (one-way)</div>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{fmtCost(total)}</div>
          </div>
          <div className="text-xs text-muted-foreground/50 border-t border-white/5 pt-2 leading-relaxed">
            One-way only. Does not include return leg, medical crew, pharmaceuticals, handling, or overnight. NSW Ambulance rates effective 1 July 2025.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MAP (Leaflet)
// ─────────────────────────────────────────────────────────────────────────────
interface MapProps{patientLat:number;patientLon:number;base:typeof RFDS_BASES[0];results:RouteOption[];selectedIdx:number|null;}
function LiveMap({patientLat,patientLon,base,results,selectedIdx}:MapProps){
  const mapRef=useRef<any>(null),mapInstanceRef=useRef<any>(null),layersRef=useRef<any[]>([]);
  useEffect(()=>{
    if(mapInstanceRef.current||!mapRef.current)return;
    import("leaflet").then(L=>{
      delete(L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"});
      const map=L.map(mapRef.current!,{center:[-32.5,146.5],zoom:6,zoomControl:true,attributionControl:true});
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:18}).addTo(map);
      mapInstanceRef.current={map,L};
    });
    return()=>{if(mapInstanceRef.current){mapInstanceRef.current.map.remove();mapInstanceRef.current=null;}};
  },[]);
  useEffect(()=>{
    if(!mapInstanceRef.current)return;
    const{map,L}=mapInstanceRef.current;
    layersRef.current.forEach(l=>map.removeLayer(l));layersRef.current=[];
    const add=(layer:any)=>{layer.addTo(map);layersRef.current.push(layer);};
    add(L.marker([base.lat,base.lon],{icon:L.divIcon({className:"",html:`<div style="background:#0097A7;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">✈</div>`,iconSize:[32,32],iconAnchor:[16,16]})}).bindPopup(`<b>RFDS ${base.name}</b><br/>${base.icao}`));
    if(!isNaN(patientLat)&&!isNaN(patientLon)){
      add(L.marker([patientLat,patientLon],{icon:L.divIcon({className:"",html:`<div style="background:#ef4444;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">🚑</div>`,iconSize:[32,32],iconAnchor:[16,16]})}).bindPopup("<b>Patient Location</b>"));
    }
    HOSPITALS.forEach(h=>add(L.marker([h.lat,h.lon],{icon:L.divIcon({className:"",html:`<div style="background:#1e293b;color:#94a3b8;border-radius:4px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:1px solid #334155;">🏥</div>`,iconSize:[24,24],iconAnchor:[12,12]})}).bindPopup(`<b>${h.name}</b><br/>${LEVEL_LABEL[h.level]}`)));
    results.forEach((r,idx)=>{
      const isSel=idx===selectedIdx||(selectedIdx===null&&r.isRecommended);
      const col=r.isRecommended?"#0097A7":"#64748b";const w=isSel?3:1.5;const op=isSel?0.9:0.35;
      if(!isNaN(patientLat)&&!isNaN(patientLon)){
        add(L.polyline([[base.lat,base.lon],[patientLat,patientLon]],{color:col,weight:w,opacity:op,dashArray:"6 4"}));
        add(L.polyline([[patientLat,patientLon],[r.hospital.lat,r.hospital.lon]],{color:col,weight:w,opacity:op}));
      }
      if(isSel)add(L.marker([r.hospital.lat,r.hospital.lon],{icon:L.divIcon({className:"",html:`<div style="background:${r.isRecommended?"#0097A7":"#334155"};color:white;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;border:1px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);">🏥 ${r.hospital.name}</div>`,iconSize:[160,24],iconAnchor:[80,12]})}));
    });
    if(!isNaN(patientLat)&&!isNaN(patientLon)&&results.length){
      const rec=results.find(r=>r.isRecommended)||results[0];
      map.fitBounds(L.latLngBounds([[base.lat,base.lon],[patientLat,patientLon],[rec.hospital.lat,rec.hospital.lon]]),{padding:[40,40]});
    }
  },[patientLat,patientLon,base,results,selectedIdx]);
  return<div ref={mapRef} style={{height:"420px",width:"100%",borderRadius:"8px",overflow:"hidden",zIndex:0}}/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
type PageTab="optimiser"|"fleet";
export default function MissionOptimiser(){
  const[tab,setTab]=useState<PageTab>("optimiser");
  const[inputs,setInputs]=useState<MissionInputs>({
    aircraftBase:"dubbo",patientLat:"-32.24",patientLon:"148.60",
    patientLocation:"Dubbo — Patient pickup",lhd:"western-nsw",caseType:"trauma",
    priority:"P1",availableAircraft:["B200","B350"],ambulanceSpeedKph:80,ambulanceCostPerKm:12,
  });
  const[fleetEnabled,setFleetEnabled]=useState<FleetKey[]>(["B200","B300","PC24"]);
  const[fleetHospIdx,setFleetHospIdx]=useState(0);
  const[isEmergency,setIsEmergency]=useState(true);
  const[results,setResults]=useState<RouteOption[]>([]);
  const[hasRun,setHasRun]=useState(false);
  const[expandedIdx,setExpandedIdx]=useState<number|null>(null);
  const[showMap,setShowMap]=useState(true);
  const[costModal,setCostModal]=useState<RouteOption|null>(null);

  const toggleAc=(key:AircraftKey)=>setInputs(p=>({...p,availableAircraft:p.availableAircraft.includes(key)?p.availableAircraft.filter(k=>k!==key):[...p.availableAircraft,key]}));
  const toggleFleet=(key:FleetKey)=>setFleetEnabled(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key]);
  const run=useCallback(()=>{setResults(optimise(inputs));setHasRun(true);setExpandedIdx(0);},[inputs]);
  const reset=()=>{setResults([]);setHasRun(false);setExpandedIdx(null);};

  const base=RFDS_BASES.find(b=>b.id===inputs.aircraftBase)||RFDS_BASES[0];
  const pLat=parseFloat(inputs.patientLat),pLon=parseFloat(inputs.patientLon);
  const recommended=results.find(r=>r.isRecommended);
  const selectedHosp=HOSPITALS[fleetHospIdx];

  return(
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {costModal&&<CostBreakdownModal route={costModal} patientLocation={inputs.patientLocation} priority={inputs.priority} onClose={()=>setCostModal(null)}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>Mission Optimiser</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI routing · Fleet comparison · Round-trip cost forecasting</p>
        </div>
        <Badge variant="outline" className="text-cyan-400 border-cyan-500/40 text-xs">NSW · 15 LHDs · NSW Ambulance 2025 Fees</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
        {([["optimiser","Mission Optimiser",<Zap size={13}/>],["fleet","Fleet Comparison",<BarChart3 size={13}/>]] as const).map(([id,label,icon])=>(
          <button key={id} onClick={()=>setTab(id as PageTab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab===id?"bg-cyan-600 text-white shadow":"text-muted-foreground hover:text-white"}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ═══ OPTIMISER TAB ═══ */}
      {tab==="optimiser"&&(<>
        {showMap&&(
          <Card className="border-card-border overflow-hidden">
            <CardContent className="p-0"><LiveMap patientLat={pLat} patientLon={pLon} base={base} results={results} selectedIdx={expandedIdx}/></CardContent>
            <div className="px-3 py-2 flex gap-4 text-xs text-muted-foreground border-t border-card-border flex-wrap">
              <span>✈ RFDS base</span><span>🚑 Patient</span><span>🏥 Hospitals</span>
              <span className="text-cyan-400">— Recommended</span>
              <Button variant="outline" size="sm" onClick={()=>setShowMap(false)} className="ml-auto gap-1 text-xs h-6"><Layers size={11}/>Hide</Button>
            </div>
          </Card>
        )}
        {!showMap&&<Button variant="outline" size="sm" onClick={()=>setShowMap(true)} className="gap-1 text-xs"><Layers size={11}/>Show Map</Button>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-card-border bg-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MapPin size={14} className="text-cyan-400"/>Patient & Task</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input value={inputs.patientLat} onChange={e=>setInputs(p=>({...p,patientLat:e.target.value}))} placeholder="-32.247" className="h-8 text-sm mt-1"/></div>
                <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input value={inputs.patientLon} onChange={e=>setInputs(p=>({...p,patientLon:e.target.value}))} placeholder="148.605" className="h-8 text-sm mt-1"/></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Location description</Label><Input value={inputs.patientLocation} onChange={e=>setInputs(p=>({...p,patientLocation:e.target.value}))} className="h-8 text-sm mt-1"/></div>
              <div><Label className="text-xs text-muted-foreground">Patient's LHD</Label>
                <Select value={inputs.lhd} onValueChange={v=>setInputs(p=>({...p,lhd:v}))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent>{LHDs.map(l=><SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground">Case type</Label>
                  <Select value={inputs.caseType} onValueChange={v=>setInputs(p=>({...p,caseType:v as CaseType}))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{["trauma","cardiac","stroke","burns","neuro","paeds","general"].map(t=><SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select value={inputs.priority} onValueChange={v=>setInputs(p=>({...p,priority:v as CasePriority}))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 — Life Threatening</SelectItem>
                      <SelectItem value="P2">P2 — Urgent</SelectItem>
                      <SelectItem value="P3">P3 — Non-Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-card-border bg-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Plane size={14} className="text-cyan-400"/>Aircraft & Base</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs text-muted-foreground">Departing base</Label>
                <Select value={inputs.aircraftBase} onValueChange={v=>setInputs(p=>({...p,aircraftBase:v}))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent>{RFDS_BASES.map(b=><SelectItem key={b.id} value={b.id}>{b.name} ({b.icao})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Available aircraft</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(AIRCRAFT) as AircraftKey[]).map(key=>{
                    const ac=AIRCRAFT[key];const active=inputs.availableAircraft.includes(key);
                    return(
                      <button key={key} onClick={()=>toggleAc(key)}
                        className={`text-left p-2 rounded-lg border text-xs transition-all ${active?"border-cyan-500/60 bg-cyan-500/10 text-cyan-300":"border-border text-muted-foreground hover:border-cyan-500/30"}`}>
                        <div className="font-semibold">{ac.icon} {key}</div>
                        <div className="opacity-70">{ac.cruiseKts} kts · {ac.rangeNm} nm</div>
                        <div className="opacity-70">{fmtCost(ac.costPerHour)}/hr</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Amb speed</Label>
                <div className="h-8 text-sm mt-1 flex items-center text-muted-foreground text-xs">Per hospital (realistic)</div></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button onClick={run} disabled={inputs.availableAircraft.length===0} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"><Zap size={15}/>Calculate Optimal Routing</Button>
          {hasRun&&<Button variant="outline" onClick={reset} className="gap-2"><RotateCcw size={14}/>Reset</Button>}
        </div>

        {hasRun&&results.length===0&&(
          <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="p-4 flex items-center gap-3"><AlertTriangle size={18} className="text-amber-400"/><p className="text-sm text-amber-300">No routes found. Check aircraft range or coordinates.</p></CardContent></Card>
        )}
        {hasRun&&results.length>0&&(
          <div className="space-y-3">
            {recommended&&(
              <Card className="border-cyan-500/50 bg-cyan-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-cyan-400 mt-0.5 shrink-0"/>
                    <div className="flex-1">
                      <div className="text-xs text-cyan-400 font-semibold mb-1">AI RECOMMENDED PROFILE</div>
                      <div className="text-sm font-bold">{AIRCRAFT[recommended.aircraftKey].name} → {recommended.hospital.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmtTime(recommended.totalTimeMin)} total · {fmtCost(recommended.totalCost)} · {LEVEL_LABEL[recommended.hospital.level]}
                        {recommended.divertedFrom&&<span className="text-amber-400"> · Divert from {recommended.divertedFrom}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Badge className={PRIORITY_STYLE[inputs.priority]}>{inputs.priority}</Badge>
                      <Button size="sm" variant="outline" className="text-xs gap-1.5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 h-7" onClick={()=>setCostModal(recommended)}>
                        <FileText size={11}/>Cost Forecast
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-1">Ranked options</div>
            {results.map((r,idx)=>(
              <Card key={idx} className={`border transition-all ${r.isRecommended?"border-cyan-500/50":"border-card-border"}`}>
                <button className="w-full text-left p-4" onClick={()=>setExpandedIdx(expandedIdx===idx?null:idx)}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{AIRCRAFT[r.aircraftKey].icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold truncate">{r.hospital.name}</span>
                        {r.isRecommended&&<Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 text-xs">Recommended</Badge>}
                        {r.divertedFrom&&<Badge variant="outline" className="text-amber-400 border-amber-500/40 text-xs">Divert</Badge>}
                        {r.capabilityMatch&&<Badge variant="outline" className="text-green-400 border-green-500/40 text-xs capitalize">{inputs.caseType} capable</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{AIRCRAFT[r.aircraftKey].name} · {LEVEL_LABEL[r.hospital.level]}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-cyan-400">{fmtTime(r.totalTimeMin)}</div>
                      <div className="text-xs text-muted-foreground">{fmtCost(r.totalCost)}</div>
                    </div>
                    {expandedIdx===idx?<ChevronUp size={16} className="text-muted-foreground shrink-0"/>:<ChevronDown size={16} className="text-muted-foreground shrink-0"/>}
                  </div>
                </button>
                {expandedIdx===idx&&(
                  <div className="px-4 pb-4 border-t border-card-border pt-4 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {label:"Aircraft Leg",val:fmtTime(r.flightTimeMin),sub:AIRCRAFT[r.aircraftKey].name,sub2:"",col:"text-cyan-400",icon:<Plane size={11} className="text-cyan-400"/>, border:"border-card-border bg-background"},
                        {label:"Patient Handling",val:fmtTime(r.handlingMin),sub:"30m load + 30m unload",sub2:"pickup & hospital",col:"text-purple-400",icon:<Clock size={11} className="text-purple-400"/>, border:"border-purple-500/20 bg-background"},
                        {label:"Ground Leg",val:fmtTime(r.gndTimeMin),sub:`${r.hospital.runway} → hospital`,sub2:"NSW Ambulance",col:"text-amber-400",icon:<Navigation size={11} className="text-amber-400"/>, border:"border-card-border bg-background"},
                        {label:"Total",val:fmtTime(r.totalTimeMin),sub:fmtCost(r.totalCost),sub2:"door to hospital",col:"text-cyan-400",icon:<Clock size={11} className="text-cyan-400"/>, border:"border-cyan-500/30 bg-cyan-500/5"},
                      ].map((c,i)=>(
                        <div key={i} className={`p-3 rounded-lg border ${c.border}`}>
                          <div className="flex items-center gap-1.5 mb-2">{c.icon}<span className={`text-xs font-semibold ${c.col}`}>{c.label}</span></div>
                          <div className={`text-lg font-bold ${i===3?c.col:""}`}>{c.val}</div>
                          <div className="text-xs text-muted-foreground">{c.sub}</div>
                          <div className="text-xs text-muted-foreground">{c.sub2}</div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" onClick={()=>setCostModal(r)}>
                      <FileText size={13}/>View Detailed Cost Forecast
                    </Button>
                    <div className="p-3 rounded-lg bg-background border border-card-border text-xs">
                      <div className="font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Receiving Hospital</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div><span className="text-muted-foreground">Hospital: </span><span className="font-medium">{r.hospital.name}</span></div>
                        <div><span className="text-muted-foreground">LHD: </span><span className="font-medium">{LHDs.find(l=>l.id===r.hospital.lhd)?.name}</span></div>
                        <div><span className="text-muted-foreground">Level: </span><span className="font-medium">{LEVEL_LABEL[r.hospital.level]}</span></div>
                        <div><span className="text-muted-foreground">Aerodrome: </span><span className="font-medium">{r.hospital.runway}</span></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Capabilities: </span><span className="font-medium capitalize">{r.hospital.capabilities.join(", ")}</span></div>
                      </div>
                      {r.divertedFrom&&(
                        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300">
                          <AlertTriangle size={11} className="inline mr-1"/>Patient LHD is <strong>{r.divertedFrom}</strong> — diversion outside home LHD.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </>)}

      {/* ═══ FLEET COMPARISON TAB ═══ */}
      {tab==="fleet"&&(
        <div className="space-y-5">
          <Card className="border-card-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 size={14} className="text-cyan-400"/>Fleet Comparison Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Departing base</Label>
                  <Select value={inputs.aircraftBase} onValueChange={v=>setInputs(p=>({...p,aircraftBase:v}))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{RFDS_BASES.map(b=><SelectItem key={b.id} value={b.id}>{b.name} ({b.icao})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Patient coordinates</Label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <Input value={inputs.patientLat} onChange={e=>setInputs(p=>({...p,patientLat:e.target.value}))} placeholder="Lat" className="h-8 text-sm"/>
                    <Input value={inputs.patientLon} onChange={e=>setInputs(p=>({...p,patientLon:e.target.value}))} placeholder="Lon" className="h-8 text-sm"/>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Receiving hospital</Label>
                  <Select value={String(fleetHospIdx)} onValueChange={v=>setFleetHospIdx(Number(v))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{HOSPITALS.map((h,i)=><SelectItem key={h.id} value={String(i)}>{h.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Aircraft to compare</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(FLEET) as FleetKey[]).map(key=>{
                      const ac=FLEET[key];const active=fleetEnabled.includes(key);
                      return(
                        <button key={key} onClick={()=>toggleFleet(key)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active?"border-cyan-500/50":"border-border text-muted-foreground hover:border-cyan-500/30"}`}
                          style={active?{color:ac.color,borderColor:ac.color+"60",background:ac.color+"15"}:undefined}>
                          {ac.icon} {ac.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Mission type</Label>
                  <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-white/5">
                    {([true,false] as const).map(em=>(
                      <button key={String(em)} onClick={()=>setIsEmergency(em)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isEmergency===em?"bg-cyan-600 text-white":"text-muted-foreground hover:text-white"}`}>
                        {em?"Emergency (P1/P2)":"Non-Emergency (P3)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 px-3 py-2 text-xs text-cyan-300/70">
                <Info size={11} className="inline mr-1.5"/>NSW Ambulance ground fees auto-applied: {isEmergency?"$464 call-out + $4.18/km":"$365 call-out + $2.26/km"} (NSW resident, 2025). Capped at $7,601.
              </div>
            </CardContent>
          </Card>

          {!isNaN(pLat)&&!isNaN(pLon)&&fleetEnabled.length>0?(
            <FleetComparison
              baseLat={base.lat} baseLon={base.lon}
              patLat={pLat} patLon={pLon}
              hospLat={selectedHosp.lat} hospLon={selectedHosp.lon}
              hospName={selectedHosp.name} hospGndKm={selectedHosp.gndKm} hospGndSpeedKph={selectedHosp.gndSpeedKph} hospRunway={selectedHosp.runway}
              baseName={base.name} isEmergency={isEmergency}
              enabledFleet={fleetEnabled}
            />
          ):(
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-amber-400"/>
                <p className="text-sm text-amber-300">Enter patient coordinates and select at least one aircraft to generate the comparison.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
