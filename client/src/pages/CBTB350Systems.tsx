/**
 * CBT — King Air B350 Aircraft Systems
 * Computer Based Training Module — Medivac.ai
 *
 * Source: Super King Air 350 Pilot Training Manual
 *         Beechcraft King Air B350 Airplane Flight Manual (AFM)
 *         AVM004h B350 Quick Reference Handbook (QRH)
 *         Beechcraft King Air B350 Checklist
 *
 * 5 Modules:
 *   Module 1 — Flight Controls & Hydraulics
 *   Module 2 — Powerplant & Propellers: PT6A-60A
 *   Module 3 — Electrical System
 *   Module 4 — Pressurisation & Environmental Control
 *   Module 5 — Fuel, Avionics & Systems Integration
 */

import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle, BookOpen,
  Award, AlertTriangle, Gauge, Zap, Wind,
  Fuel, Plane, RotateCcw, X
} from "lucide-react";
import HydraulicSystemSimulator from "@/components/simulators/HydraulicSystemSimulator";
import EngineStartSimulator from "@/components/simulators/EngineStartSimulator";
import ElectricalSystemSimulator from "@/components/simulators/ElectricalSystemSimulator";
import PressurisationSimulator from "@/components/simulators/PressurisationSimulator";
import FuelSystemSimulator from "@/components/simulators/FuelSystemSimulator";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface SlideContent {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface CBTModule {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;         // tailwind text color
  bg: string;            // tailwind bg
  border: string;        // tailwind border
  bar: string;           // tailwind progress bar bg
  icon: React.ReactNode;
  slides: SlideContent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function KeyPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <CheckCircle size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mt-3">
      <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-200 leading-relaxed font-medium">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 mt-3">
      <BookOpen size={15} className="text-purple-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-purple-200 leading-relaxed">{children}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto mt-3 rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-b border-border last:border-0 ${ri % 2 === 0 ? "" : "bg-muted/20"}`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-foreground leading-snug">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// B350 vs B200 quick comparison chip
function CompareChip({ label, b350, b200 }: { label: string; b350: string; b200: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-card border border-border">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-purple-400 font-semibold">B350</p>
          <p className="text-xs font-bold text-foreground">{b350}</p>
        </div>
        <div className="flex-1 border-l border-border pl-2">
          <p className="text-[10px] text-muted-foreground font-semibold">B200</p>
          <p className="text-xs text-muted-foreground">{b200}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — Flight Controls & Hydraulics (purple)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_1_SLIDES: SlideContent[] = [
  {
    id: "m1-s1",
    title: "Primary Flight Controls",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The King Air B350 uses a <strong className="text-foreground">conventional cable-and-pushrod mechanical</strong> flight control system. Ailerons, elevator and rudder are all manually actuated by the flight controls — there is <strong className="text-foreground">no hydraulic flight control actuation</strong> on this airframe.
        </p>
        <SectionHeader>Trim Systems</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Electrically actuated trim tabs</strong> on elevator, aileron and rudder</KeyPoint>
          <KeyPoint><strong>Manual trim wheel backup</strong> is provided for the elevator in case of electric trim failure</KeyPoint>
          <KeyPoint>Trim position indicators are visible to the crew for all three axes</KeyPoint>
        </ul>
        <SectionHeader>T-Tail Configuration</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 features a <strong className="text-foreground">T-tail</strong> — the elevator is mounted at the top of the vertical stabiliser rather than at the base of the fuselage as on the straight-tail B200. This placement keeps the elevator clear of engine wake and flap-disturbed airflow in normal flight, but has important handling implications covered in the next slide.
        </p>
        <Note>Source: Super King Air 350 Pilot Training Manual — Flight Controls chapter</Note>
      </div>
    ),
  },
  {
    id: "m1-s2",
    title: "T-Tail Characteristics",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A T-tail places the horizontal stabiliser and elevator <strong className="text-foreground">above and clear of the wing wake</strong> in normal flight — but this same geometry creates a critical risk at high angles of attack.
        </p>
        <SectionHeader>Deep Stall Risk</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>At extreme AOA, the wing and engine wake can <strong>blanket the elevator</strong> in a power-off full stall</KeyPoint>
          <KeyPoint>This is known as a <strong>deep stall</strong> — the elevator loses effectiveness precisely when nose-down authority is needed most</KeyPoint>
          <KeyPoint>Stick shaker activates at the stall margin — this warning must be <strong>heeded immediately</strong></KeyPoint>
        </ul>
        <Warning>In T-tail aircraft, recovery from a deep stall may be IMPOSSIBLE. Never allow airspeed to decay below Vs in level flight — especially in the landing configuration where AOA margins are already reduced.</Warning>
        <Note>Source: Super King Air 350 Pilot Training Manual — Aerodynamics & Stall Characteristics</Note>
      </div>
    ),
  },
  {
    id: "m1-s3",
    title: "Landing Gear System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 landing gear is <strong className="text-foreground">hydraulically actuated</strong>, powered by an electric motor-driven hydraulic power pack — a different arrangement from the B200's engine-driven pump.
        </p>
        <SectionHeader>Key Parameters</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>VLE (max gear extended speed) = 182 KIAS</strong></KeyPoint>
          <KeyPoint><strong>3 green lights</strong> confirm gear down and locked</KeyPoint>
          <KeyPoint>Anti-skid braking is standard equipment</KeyPoint>
        </ul>
        <SectionHeader>Alternate Gear Extension</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If the normal hydraulic system fails to extend the gear, an <strong className="text-foreground">emergency gear release handle</strong> mechanically unlocks the gear uplocks, allowing gravity and airflow to free-fall the gear into the down position.
        </p>
        <Table
          headers={["Parameter", "B350 Value"]}
          rows={[
            ["Gear actuation", "Hydraulic (electric motor-driven power pack)"],
            ["VLE", "182 KIAS"],
            ["Gear indication", "3 green = down & locked"],
            ["Emergency extension", "Gravity free-fall via release handle"],
            ["Braking", "Anti-skid standard"],
          ]}
        />
        <Note>Source: B350 AFM — Landing Gear System description</Note>
      </div>
    ),
  },
  {
    id: "m1-s4",
    title: "Hydraulic System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 hydraulic system operates at approximately <strong className="text-purple-400">3,000 PSI</strong> — significantly higher than the B200's ~1,500 PSI system.
        </p>
        <SectionHeader>Power Source</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Electric hydraulic power pack</strong> — motor-driven, not an engine-driven pump like the B200</KeyPoint>
          <KeyPoint>A pressure switch cycles the pump <strong>on and off</strong> automatically to maintain system pressure</KeyPoint>
        </ul>
        <SectionHeader>Services Powered</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Landing gear extension/retraction</KeyPoint>
          <KeyPoint>Wheel brakes</KeyPoint>
          <KeyPoint>Nose wheel steering</KeyPoint>
        </ul>
        <Warning>Primary flight controls are NOT hydraulically actuated on the B350 — ailerons, elevator and rudder remain fully mechanical (cable/pushrod), independent of hydraulic system status.</Warning>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-foreground">HYD FLUID LOW</strong> amber advisory indicates reduced reservoir quantity — monitor closely and plan accordingly.
        </p>
        <Note>Source: B350 AFM — Hydraulic System chapter</Note>
      </div>
    ),
  },
  {
    id: "m1-s5",
    title: "Rudder Boost",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 rudder boost system operates on the <strong className="text-foreground">same principle as the B200</strong> — it is bleed-air powered and assists the pilot in maintaining directional control during asymmetric thrust conditions.
        </p>
        <SectionHeader>Function</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Reduces required rudder pedal force during <strong>engine-out (OEI)</strong> operations</KeyPoint>
          <KeyPoint>Senses differential power lever position / torque and applies a boosting force to the rudder</KeyPoint>
          <KeyPoint>Powered by engine bleed air routed to a rudder boost servo</KeyPoint>
        </ul>
        <SectionHeader>Failure Indication</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-red-400">RUDDER BOOST FAIL</strong> annunciator illuminates if the system malfunctions.
        </p>
        <Warning>Without rudder boost operating, full rudder pedal force will be required for directional control following an engine failure — be prepared for significantly higher pedal forces than normal.</Warning>
        <Note>Source: Super King Air 350 Pilot Training Manual — Flight Controls, Rudder Boost System</Note>
      </div>
    ),
  },
  {
    id: "m1-s6",
    title: "Flaps & Ground Spoilers",
    body: (
      <div className="space-y-4">
        <SectionHeader>Flap System</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Fowler flaps</strong>, electrically actuated</KeyPoint>
          <KeyPoint>VFE at approach flap setting: <strong>178 KIAS</strong> (always confirm exact values against the current AFM)</KeyPoint>
        </ul>
        <SectionHeader>Ground Spoilers</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Auto-deploy</strong> on main gear compression (weight-on-wheels)</KeyPoint>
          <KeyPoint>Wing-mounted spoiler panels reduce lift on rollout, increasing effective braking</KeyPoint>
          <KeyPoint>Anti-skid braking works in conjunction with spoiler deployment for optimal stopping performance</KeyPoint>
        </ul>
        <Table
          headers={["Item", "B350 Value / Note"]}
          rows={[
            ["Flap type", "Fowler, electrically actuated"],
            ["VFE (approach setting)", "178 KIAS (check current AFM)"],
            ["Ground spoiler trigger", "Main gear compression (WOW)"],
            ["Braking assist", "Anti-skid standard"],
          ]}
        />
        <Note>Source: AVM004h B350 QRH — Flaps & Ground Spoiler Limitations</Note>
      </div>
    ),
  },
  {
    id: "m1-s7",
    title: "Interactive: Hydraulic System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Toggle the controls below to see live hydraulic flow, gear operation, and brake accumulator behaviour. Simulate an EDP failure and practice the alternate gear extension procedure. The B350 uses the same hydraulic architecture as the B200.</p>
        </div>
        <HydraulicSystemSimulator />
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — Powerplant & Propellers: PT6A-60A (amber)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_2_SLIDES: SlideContent[] = [
  {
    id: "m2-s1",
    title: "PT6A-60A Overview (B350)",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 is powered by two Pratt & Whitney Canada <strong className="text-foreground">PT6A-60A</strong> turboprop engines — the same base engine family as the B200, but <strong className="text-amber-400">flat-rated at 1,050 SHP</strong> for the B350 (compared to 850 SHP on the B200).
        </p>
        <SectionHeader>Engine Design</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Free turbine</strong>, reverse-flow design</KeyPoint>
          <KeyPoint><strong>Ng</strong> = gas generator speed (compressor turbine)</KeyPoint>
          <KeyPoint><strong>Np</strong> = power turbine / propeller speed — mechanically independent of Ng</KeyPoint>
        </ul>
        <SectionHeader>Why the Higher Flat Rating Matters</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The higher flat-rate power on the B350 provides a greater <strong className="text-foreground">thrust margin</strong> at high altitude and in hot/high conditions — important given the B350's higher MTOW and T-tail stall considerations.
        </p>
        <Note>Source: B350 AFM — Powerplant Section, PT6A-60A Description</Note>
      </div>
    ),
  },
  {
    id: "m2-s2",
    title: "Engine Limits (B350 specific)",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350's PT6A-60A flat rating results in different published limits than the B200 variant. Always cross-check the current AFM limitations section.
        </p>
        <Table
          headers={["Parameter", "Limit"]}
          rows={[
            ["Max take-off ITT", "800°C (5 min limit)"],
            ["Max continuous ITT", "750°C"],
            ["Max Ng", "101.5%"],
            ["Max torque", "Per AFM — higher rating than B200 at full flat-rate"],
            ["Normal cruise Np", "1,900–2,000 RPM"],
          ]}
        />
        <Warning>Any limit exceedance (ITT, Ng, or torque) requires a logbook entry and may require maintenance action before further flight.</Warning>
        <Note>Source: B350 AFM — Section 2 Limitations, Powerplant Limits</Note>
      </div>
    ),
  },
  {
    id: "m2-s3",
    title: "Fuel & Condition Controls",
    body: (
      <div className="space-y-4">
        <SectionHeader>Condition Lever Positions</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          {["FUEL CUTOFF", "LOW IDLE", "HIGH IDLE", "MAX"].map((pos, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border text-center">
              <p className="text-xs font-bold text-amber-400">{pos}</p>
            </div>
          ))}
        </div>
        <SectionHeader>Power Lever & FCU</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Power lever controls <strong>Ng</strong> (gas generator speed)</KeyPoint>
          <KeyPoint>Fuel Control Unit (FCU) is <strong>hydromechanical</strong></KeyPoint>
          <KeyPoint><strong>Beta gate</strong> prevents ground-fine/reverse pitch selection while airborne</KeyPoint>
        </ul>
        <SectionHeader>Engine Start Sequence</SectionHeader>
        <div className="space-y-1.5">
          {[
            "Ng reaches ≥12–13%",
            "Move condition lever to LOW IDLE",
            "Monitor ITT closely for any exceedance",
            "Starter auto-disconnects at approximately 50% Ng",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
        <Note>Source: Beechcraft King Air B350 Checklist — Engine Starting Procedure</Note>
      </div>
    ),
  },
  {
    id: "m2-s4",
    title: "Propeller System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 uses <strong className="text-foreground">Hartzell 4-blade, full-feathering, constant-speed propellers</strong> — the same propeller type as the B200.
        </p>
        <SectionHeader>Auto-Feather System</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Arms</strong> automatically when both power levers are advanced above a preset threshold (typically for takeoff)</KeyPoint>
          <KeyPoint>If one engine's torque drops below a set limit, that engine's propeller <strong>automatically feathers</strong></KeyPoint>
          <KeyPoint><strong>AUTOFEATHER ARM</strong> annunciator confirms system is armed and ready</KeyPoint>
        </ul>
        <SectionHeader>Propeller Synchronization</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Prop sync <strong className="text-foreground">slaves the right propeller to the left (master)</strong> — reducing cabin noise/vibration from RPM beat frequency in cruise.
        </p>
        <Note>Source: Super King Air 350 Pilot Training Manual — Propeller System & Auto-Feather</Note>
      </div>
    ),
  },
  {
    id: "m2-s5",
    title: "Engine Oil System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350's engine oil system performs the same three functions as the B200: <strong className="text-foreground">lubrication</strong>, <strong className="text-foreground">cooling</strong>, and <strong className="text-foreground">propeller pitch-change actuation</strong>.
        </p>
        <SectionHeader>Normal Operating Range</SectionHeader>
        <Table
          headers={["Parameter", "Normal Value"]}
          rows={[
            ["Oil pressure", "~90–135 PSI"],
            ["Chip detector", "Illuminated = possible imminent bearing failure"],
          ]}
        />
        <Warning>Chip detector illumination indicates possible imminent bearing failure. Plan a landing at the nearest suitable aerodrome — do not continue to destination unless operationally required and risk-assessed.</Warning>
        <Note>Source: B350 AFM — Powerplant Oil System Description</Note>
      </div>
    ),
  },
  {
    id: "m2-s6",
    title: "Engine Anti-Ice & Icing Operations",
    body: (
      <div className="space-y-4">
        <SectionHeader>Engine Anti-Ice (EAI)</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Routes <strong>bleed air to the engine inlet lips</strong> to prevent ice accretion</KeyPoint>
          <KeyPoint>Activate when: <strong>OAT ≤10°C AND visible moisture</strong> present</KeyPoint>
          <KeyPoint>Both EAI systems ON reduces available bleed air for cabin pressurisation/conditioning</KeyPoint>
        </ul>
        <SectionHeader>Airframe Ice Protection</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Wing de-ice boots</strong> — inflate pneumatically after ¼–½ inch ice accretion; do NOT pre-activate before ice forms</KeyPoint>
          <KeyPoint><strong>Windscreen</strong> — electrically heated</KeyPoint>
          <KeyPoint><strong>Propellers</strong> — electrically heated boots</KeyPoint>
        </ul>
        <Warning>Do not cycle wing de-ice boots before sufficient ice has accreted (¼–½ inch) — premature cycling can create ice "bridging" that boots cannot subsequently break.</Warning>
        <Note>Source: AVM004h B350 QRH — Ice Protection Systems</Note>
      </div>
    ),
  },
  {
    id: "m2-s7",
    title: "Interactive: PT6A-60A Engine Start Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Work through the start sequence step-by-step. Watch Ng, ITT, Np and oil pressure build in real time. The B350 uses the same PT6A-60A engine as the B200 — start limits and procedures are identical.</p>
        </div>
        <EngineStartSimulator />
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — Electrical System (green)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_3_SLIDES: SlideContent[] = [
  {
    id: "m3-s1",
    title: "System Overview",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 electrical system shares the <strong className="text-foreground">same fundamental architecture as the B200</strong>: a 28V DC main system supplemented by AC power for specific avionics loads.
        </p>
        <SectionHeader>Key Components</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>28V DC main system</strong></KeyPoint>
          <KeyPoint><strong>Two engine-driven starter-generators</strong> (one per engine)</KeyPoint>
          <KeyPoint><strong>Two DC buses plus a bus tie</strong> for cross-connection</KeyPoint>
          <KeyPoint><strong>115V AC</strong> supplied via static inverters at 400Hz</KeyPoint>
          <KeyPoint><strong>24V battery</strong> for starting and emergency backup</KeyPoint>
        </ul>
        <Note>Source: Super King Air 350 Pilot Training Manual — Electrical System Overview</Note>
      </div>
    ),
  },
  {
    id: "m3-s2",
    title: "Generator Operation",
    body: (
      <div className="space-y-4">
        <SectionHeader>Dual-Mode Operation</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Operates as a <strong>starter (motor)</strong> during engine start</KeyPoint>
          <KeyPoint>Transitions to <strong>generator mode</strong> automatically after approximately <strong>50% Ng</strong></KeyPoint>
        </ul>
        <SectionHeader>Voltage Regulation</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Voltage regulator maintains a constant <strong>28V</strong> output</KeyPoint>
          <KeyPoint><strong>Overvoltage protection</strong> automatically trips the generator offline if output exceeds safe limits</KeyPoint>
        </ul>
        <SectionHeader>Failure Response</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-red-400">GEN FAIL / GEN OFF</strong> annunciator indicates a generator has dropped offline. A reset attempt is appropriate per checklist. A single generator is capable of carrying the <strong className="text-foreground">full electrical load</strong> if required.
        </p>
        <Note>Source: B350 AFM — Electrical System, Generator Description</Note>
      </div>
    ),
  },
  {
    id: "m3-s3",
    title: "Bus Architecture & Avionics Master",
    body: (
      <div className="space-y-4">
        <SectionHeader>Bus Layout</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Left generator → left bus</strong>; <strong>right generator → right bus</strong></KeyPoint>
          <KeyPoint><strong>Bus tie</strong> automatically cross-connects the buses on a generator failure, allowing the remaining generator to supply both sides</KeyPoint>
        </ul>
        <SectionHeader>Avionics Master Switch</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Disconnects the avionics bus from the electrical system. Use it on the ground during <strong className="text-foreground">taxi and engine start</strong> to protect sensitive avionics from voltage transients.
        </p>
        <SectionHeader>Essential / Emergency Bus</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Powered directly from the battery — remains energised as long as <strong className="text-foreground">any</strong> electrical source is available, ensuring critical systems stay powered during abnormal conditions.
        </p>
        <Note>Source: Super King Air 350 Pilot Training Manual — DC Bus Architecture</Note>
      </div>
    ),
  },
  {
    id: "m3-s4",
    title: "Generator Failure Response",
    body: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-bold text-red-400 mb-1">GEN OFF Annunciator</p>
          <p className="text-xs text-muted-foreground">Indicates the associated generator has dropped offline and is no longer supplying its bus.</p>
        </div>
        <SectionHeader>Response Sequence</SectionHeader>
        <div className="space-y-1.5">
          {[
            "Attempt generator reset per checklist procedure",
            "If reset unsuccessful: shed non-essential electrical loads",
            "Remaining generator now carries full electrical load",
            "Monitor ammeter/loadmeter to confirm load within limits",
            "Estimate endurance and plan accordingly",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-green-400 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A ground power unit (GPU) is available for electrical support while on the ground.
        </p>
        <Note>Source: AVM004h B350 QRH — Generator Failure Procedure</Note>
      </div>
    ),
  },
  {
    id: "m3-s5",
    title: "Circuit Breakers",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Circuit breakers are located on a <strong className="text-foreground">right-side, crew-accessible panel</strong>, with individual protection provided for each circuit.
        </p>
        <SectionHeader>Reset Procedure</SectionHeader>
        <div className="space-y-2">
          {[
            { step: "1", action: "Identify the tripped breaker", detail: "Confirm which circuit has tripped before resetting" },
            { step: "2", action: "Wait approximately 30 seconds", detail: "Allow the breaker to cool before resetting" },
            { step: "3", action: "Reset ONCE only", detail: "Push the breaker back in a single time" },
            { step: "4", action: "If it trips again", detail: "Leave it pulled — a genuine circuit fault is present" },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-card border border-border">
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
              <div>
                <p className="text-xs font-semibold">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Warning>Never hold a circuit breaker in — doing so bypasses the protection it provides and can allow a fault to develop into a fire or further electrical damage.</Warning>
        <Note>Source: Beechcraft King Air B350 Checklist — Electrical Abnormal Procedures</Note>
      </div>
    ),
  },
  {
    id: "m3-s6",
    title: "Emergency Electrical",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          If <strong className="text-red-400">both generators fail</strong>, the aircraft battery becomes the sole power source.
        </p>
        <SectionHeader>Battery-Only Operation</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Battery provides approximately <strong>30 minutes</strong> of essential power</KeyPoint>
          <KeyPoint>The <strong>shed bus</strong> automatically drops non-essential loads to conserve battery capacity</KeyPoint>
          <KeyPoint><strong>Inverters go offline</strong> — no AC power available</KeyPoint>
        </ul>
        <SectionHeader>Standby Instruments</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pneumatic standby instruments — <strong className="text-foreground">ADI, altimeter, and airspeed indicator</strong> — remain independent of the electrical system and continue functioning normally.
        </p>
        <Warning>On dual generator failure with battery depleting: declare MAYDAY and land as soon as possible. Do not delay — battery endurance is limited and further system degradation should be expected.</Warning>
        <Note>Source: AVM004h B350 QRH — Emergency Electrical Procedures</Note>
      </div>
    ),
  },
  {
    id: "m3-s7",
    title: "Interactive: Electrical System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Toggle generators on and off, simulate failures, and watch power flow through bus bars. Simulate dual-generator failure to understand battery-only endurance and load shedding. The B350 electrical architecture matches the B200.</p>
        </div>
        <ElectricalSystemSimulator />
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — Pressurisation & Environmental Control (blue)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_4_SLIDES: SlideContent[] = [
  {
    id: "m4-s1",
    title: "Pressurisation Overview",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cabin pressurisation air is bled from the <strong className="text-foreground">PT6A compressor sections</strong> of both engines.
        </p>
        <SectionHeader>Maximum Differential Pressure</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 is rated for <strong className="text-blue-400">max ΔP = 6.6 PSI</strong> — higher than the B200's 6.0 PSI. This is an important distinction to note between the two types.
        </p>
        <ul className="space-y-2">
          <KeyPoint>At <strong>FL350</strong> with 6.6 PSI ΔP, cabin altitude is approximately <strong>8,000 ft</strong></KeyPoint>
          <KeyPoint>The <strong>outflow valve</strong> is the primary pressure control element</KeyPoint>
          <KeyPoint>A <strong>cabin rate controller</strong> limits the rate of cabin altitude change for passenger comfort</KeyPoint>
        </ul>
        <Table
          headers={["Parameter", "B350", "B200"]}
          rows={[
            ["Max ΔP", "6.6 PSI", "6.0 PSI"],
            ["Cabin alt at FL350", "~8,000 ft", "Higher (lower ΔP margin)"],
          ]}
        />
        <Note>Source: B350 AFM — Pressurisation System, Limitations Section</Note>
      </div>
    ),
  },
  {
    id: "m4-s2",
    title: "Safety Valves & Dump",
    body: (
      <div className="space-y-4">
        <SectionHeader>Relief Valves</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Positive pressure relief (safety) valve</strong> — opens if ΔP exceeds 6.6 PSI, preventing structural overpressure</KeyPoint>
          <KeyPoint><strong>Negative pressure relief valve</strong> — prevents ambient pressure exceeding cabin pressure (protects against implosion)</KeyPoint>
        </ul>
        <SectionHeader>Dump Valve</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fully opens the outflow valve, rapidly equalising cabin pressure with ambient. Use it:
        </p>
        <ul className="space-y-2">
          <KeyPoint>Before opening any door — <strong>confirm ΔP = 0</strong> first</KeyPoint>
          <KeyPoint>During emergency ground egress situations</KeyPoint>
        </ul>
        <Warning>Never attempt to open any door with a positive ΔP indicated. Always dump cabin pressure and confirm ΔP = 0 before door operation — attempting to open a pressurised door can cause serious injury and rapid uncontrolled decompression.</Warning>
        <Note>Source: AVM004h B350 QRH — Pressurisation Safety Systems</Note>
      </div>
    ),
  },
  {
    id: "m4-s3",
    title: "Decompression & TUC",
    body: (
      <div className="space-y-4">
        <SectionHeader>Warning Indication</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-red-400">CABIN ALT</strong> warning activates at approximately <strong className="text-foreground">10,000 ft</strong> cabin altitude.
        </p>
        <SectionHeader>Time of Useful Consciousness (TUC)</SectionHeader>
        <Table
          headers={["Altitude", "Approx. TUC (Rapid Decompression)"]}
          rows={[
            ["FL350", "30–60 seconds"],
            ["FL250", "3–5 minutes"],
          ]}
        />
        <SectionHeader>Emergency Descent Checklist</SectionHeader>
        <div className="space-y-1.5">
          {[
            "Oxygen masks ON — crew first",
            "Power to idle",
            "Increase speed toward Vmo",
            "Deploy speedbrakes if fitted",
            "Descend to target altitude — FL140",
            "Squawk 7700",
            "Declare MAYDAY",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-400 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
        <Warning>At FL350, useful consciousness may last as little as 30 seconds during a rapid decompression. Masks must go on immediately — do not delay for any other action.</Warning>
        <Note>Source: AVM004h B350 QRH — Emergency Descent / Rapid Decompression</Note>
      </div>
    ),
  },
  {
    id: "m4-s4",
    title: "Air Conditioning",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cabin conditioning uses a <strong className="text-foreground">bleed-air-cycle refrigeration</strong> system.
        </p>
        <SectionHeader>Process Flow</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Hot bleed air is routed through a <strong>heat exchanger</strong></KeyPoint>
          <KeyPoint>Cooled air is then mixed to the selected temperature and distributed to the cabin</KeyPoint>
          <KeyPoint>Separate <strong>temperature zones</strong> exist for crew and cabin/patient areas</KeyPoint>
        </ul>
        <SectionHeader>Capacity Considerations</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Running <strong className="text-foreground">engine anti-ice (EAI) on both engines</strong> reduces the bleed air available for conditioning, which can reduce cabin comfort/cooling capacity during icing operations.
        </p>
        <Note>Source: Super King Air 350 Pilot Training Manual — Environmental Control System</Note>
      </div>
    ),
  },
  {
    id: "m4-s5",
    title: "Ice Protection",
    body: (
      <div className="space-y-4">
        <Table
          headers={["System", "Method", "Notes"]}
          rows={[
            ["Engine anti-ice", "Bleed air to inlet lips", "Activate below 10°C OAT + visible moisture"],
            ["Wing de-ice boots", "Pneumatic inflation", "Cycle after ¼–½ inch ice accretion"],
            ["Windscreen", "Electrically heated", "Continuous when selected"],
            ["Propellers", "Electrically heated boots", "Cyclic or continuous per system design"],
            ["Ice detector (if fitted)", "Vibrating probe", "Alerts crew to ice accretion onset"],
          ]}
        />
        <Warning>Do not activate wing de-ice boots prematurely — inflating boots before sufficient ice accretion (¼–½ inch) can cause ice bridging, where ice re-forms around the inflated boot shape and becomes very difficult to shed.</Warning>
        <Note>Source: AVM004h B350 QRH — Ice Protection Systems</Note>
      </div>
    ),
  },
  {
    id: "m4-s6",
    title: "Oxygen System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Oxygen is stored in <strong className="text-foreground">high-pressure cylinders</strong> and distributed separately to crew and cabin occupants.
        </p>
        <SectionHeader>Distribution</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Crew</strong> — diluter-demand masks</KeyPoint>
          <KeyPoint><strong>Cabin</strong> — continuous-flow masks, auto-deploying at approximately <strong>14,000 ft</strong> cabin altitude</KeyPoint>
        </ul>
        <SectionHeader>Requirements</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Oxygen required for crew above <strong>FL290</strong></KeyPoint>
          <KeyPoint>Pre-flight check: pressure gauge should indicate in the <strong>green sector</strong> minimum</KeyPoint>
        </ul>
        <Warning>In a rapid decompression: crew masks on FIRST, then manage the aircraft (emergency descent), then attend to passenger/patient oxygen needs. Crew incapacitation helps no one.</Warning>
        <Note>Source: B350 AFM — Oxygen System, Section 7</Note>
      </div>
    ),
  },
  {
    id: "m4-s7",
    title: "Interactive: Pressurisation System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Adjust flight altitude and watch cabin altitude and differential pressure in auto mode. Switch to manual and control the outflow valve directly. Trigger the emergency dump to see why oxygen masks are needed above 14,000 ft. The B350 uses the same pressurisation system as the B200 with a max diff pressure of 6.5 PSI.</p>
        </div>
        <PressurisationSimulator />
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — Fuel, Avionics & Systems Integration (indigo)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_5_SLIDES: SlideContent[] = [
  {
    id: "m5-s1",
    title: "Fuel System Layout (B350)",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 carries a total usable fuel capacity of approximately <strong className="text-indigo-400">544 US gallons</strong> (~3,600 lb of Jet-A1) — significantly larger than the B200's capacity.
        </p>
        <SectionHeader>Tank Configuration</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Nacelle tanks</strong> — feed the engines directly</KeyPoint>
          <KeyPoint><strong>Wing tanks</strong> — transfer fuel into the nacelle tanks</KeyPoint>
          <KeyPoint><strong>Crossfeed valve</strong> — same function as the B200, allowing either engine to draw from either side's fuel supply</KeyPoint>
        </ul>
        <SectionHeader>Limits & Density</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Maximum nacelle tank imbalance — per current AFM</KeyPoint>
          <KeyPoint>Jet-A1 fuel density: approximately <strong>6.7 lb/US gal</strong> at standard conditions</KeyPoint>
        </ul>
        <Note>Source: B350 AFM — Fuel System Description, Section 7</Note>
      </div>
    ),
  },
  {
    id: "m5-s2",
    title: "Fuel Management",
    body: (
      <div className="space-y-4">
        <SectionHeader>Approved Fuels</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Jet-A, Jet-A1, Jet-B</strong> — approved primary fuels</KeyPoint>
          <KeyPoint><strong>AVGAS 100LL</strong> — emergency use only, per AFM limitations</KeyPoint>
        </ul>
        <SectionHeader>Normal Operations</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Boost pumps</strong> maintain fuel pressure to each engine</KeyPoint>
          <KeyPoint><strong>Crossfeed</strong> is used in an engine failure scenario to balance fuel supply</KeyPoint>
          <KeyPoint>Monitor <strong>nacelle tank quantities</strong> and transfer from wing tanks as required throughout the flight</KeyPoint>
        </ul>
        <Warning>All fuel quantities for operational planning and load sheets are calculated in POUNDS — not litres or gallons — as the primary unit for weight and balance purposes.</Warning>
        <Note>Source: Beechcraft King Air B350 Checklist — Fuel Management Procedures</Note>
      </div>
    ),
  },
  {
    id: "m5-s3",
    title: "Avionics — Collins Pro Line 21",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 is equipped with the <strong className="text-foreground">Collins Pro Line 21</strong> avionics suite — identical in architecture to the B200 installation covered in the dedicated Pro Line 21 CBT.
        </p>
        <Table
          headers={["Component", "Function"]}
          rows={[
            ["PFD (AFD-3010)", "Primary flight data — attitude, airspeed, altitude, heading"],
            ["MFD", "Navigation, traffic display, weather radar"],
            ["AHRS", "Solid-state attitude/heading — no gyro drift"],
            ["ADC", "Pitot/static → CAS, TAS, altitude, Mach"],
            ["FMS", "GPS primary navigation, VOR/DME backup"],
          ]}
        />
        <p className="text-sm text-muted-foreground leading-relaxed">
          For full detail on TCAS integration and traffic symbology, refer to the dedicated <strong className="text-foreground">Collins Pro Line 21 / TCAS-4000 CBT module</strong>.
        </p>
        <Note>Source: B350 AFM — Avionics Section; Collins Pro Line 21 System Description</Note>
      </div>
    ),
  },
  {
    id: "m5-s4",
    title: "Safety Systems",
    body: (
      <div className="space-y-4">
        <SectionHeader>Terrain & Traffic Awareness</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>EGPWS/TAWS</strong> — Modes 1–7 plus onboard terrain database</KeyPoint>
          <KeyPoint><strong>TCAS II</strong> — see the Pro Line 21 CBT for complete detail on TA/RA operation</KeyPoint>
        </ul>
        <SectionHeader>Stall Warning</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 stall warning system uses an <strong className="text-foreground">AOA vane on the wing leading edge</strong>, which accounts for flap position when computing the stall warning threshold, feeding the stick shaker.
        </p>
        <Warning>T-tail deep stall risk: the stall warning MUST be respected immediately. Never allow airspeed to decay below Vs — the consequences of an actual deep stall on a T-tail aircraft can be unrecoverable.</Warning>
        <SectionHeader>Additional Systems</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Windshear detection</strong> system</KeyPoint>
          <KeyPoint><strong>EFIS COMPARE monitoring</strong> — flags left/right display discrepancies</KeyPoint>
        </ul>
        <Note>Source: Super King Air 350 Pilot Training Manual — Safety & Warning Systems</Note>
      </div>
    ),
  },
  {
    id: "m5-s5",
    title: "Autopilot & Approach Coupling",
    body: (
      <div className="space-y-4">
        <SectionHeader>Coupled Modes</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Couples to <strong>ILS (localizer + glideslope)</strong>, <strong>VOR</strong>, and <strong>RNAV</strong> approaches</KeyPoint>
          <KeyPoint>Standard modes: <strong>altitude hold, vertical speed, pitch</strong></KeyPoint>
        </ul>
        <SectionHeader>Disconnection Requirements</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Disconnect the autopilot before complying with a <strong>TCAS RA</strong></KeyPoint>
        </ul>
        <SectionHeader>Failure Modes</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>PFD failure</strong> — revert to standby pneumatic instruments</KeyPoint>
          <KeyPoint><strong>EFIS COMPARE warning</strong> — indicates a left/right discrepancy; the crew must identify which system is in error before continuing to rely on either</KeyPoint>
        </ul>
        <Note>Source: B350 AFM — Autopilot System, Section 7</Note>
      </div>
    ),
  },
  {
    id: "m5-s6",
    title: "Systems Integration & Key Differences vs B200",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B350 shares its systems philosophy with the B200 but differs in several important respects. Understanding these differences is essential when transitioning between types.
        </p>
        <SectionHeader>B350 vs B200 — Key Differences</SectionHeader>
        <Table
          headers={["Parameter", "B350", "B200"]}
          rows={[
            ["MTOW", "15,000 lb", "~12,500 lb"],
            ["Engine power (flat-rated)", "1,050 SHP", "850 SHP"],
            ["Fuel capacity", "~544 US gal", "~333 US gal"],
            ["Max ΔP", "6.6 PSI", "6.0 PSI"],
            ["Hydraulic pressure", "~3,000 PSI", "~1,500 PSI"],
            ["T-tail configuration", "Yes", "No"],
          ]}
        />
        <SectionHeader>Squat Switch (Weight-on-Wheels)</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Prevents landing <strong>gear retraction</strong> while weight is on the wheels</KeyPoint>
          <KeyPoint><strong>Arms ground spoilers</strong> for deployment on landing rollout</KeyPoint>
        </ul>
        <SectionHeader>Pre-Flight Discipline</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pre-flight flow follows the <strong className="text-foreground">same discipline as the B200</strong> — systematic, checklist-driven, with particular attention to the higher hydraulic pressure, higher MTOW performance calculations, and T-tail stall margins unique to this type.
        </p>
        <Note>Source: Super King Air 350 Pilot Training Manual — Systems Integration & Type Differences Summary; B350 AFM</Note>
      </div>
    ),
  },
  {
    id: "m5-s7",
    title: "Interactive: Fuel System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Watch live fuel flow between wing tanks, nacelle tanks and engines. Toggle boost pumps, open crossfeed, and simulate an engine failure to practise single-engine fuel management. The B350 carries approximately 544 US gallons vs the B200’s 333 — same flow architecture, greater capacity.</p>
        </div>
        <FuelSystemSimulator />
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CBT MODULES DEFINITION
// ─────────────────────────────────────────────────────────────────────────────
const CBT_MODULES: CBTModule[] = [
  {
    id: "m1",
    number: 1,
    title: "Flight Controls & Hydraulics",
    subtitle: "Mechanical flight controls, T-tail deep stall risk, gear, hydraulics, rudder boost, flaps",
    color: "text-purple-400",
    bg: "bg-purple-500/5",
    border: "border-purple-500/30",
    bar: "bg-purple-500",
    icon: <Plane size={18} />,
    slides: MODULE_1_SLIDES,
  },
  {
    id: "m2",
    number: 2,
    title: "Powerplant & Propellers: PT6A-60A",
    subtitle: "1,050 SHP flat rating, engine limits, fuel/condition controls, props, oil, anti-ice",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    bar: "bg-amber-500",
    icon: <Gauge size={18} />,
    slides: MODULE_2_SLIDES,
  },
  {
    id: "m3",
    number: 3,
    title: "Electrical System",
    subtitle: "28V DC architecture, generators, bus tie, circuit breakers, emergency electrical",
    color: "text-green-400",
    bg: "bg-green-500/5",
    border: "border-green-500/30",
    bar: "bg-green-500",
    icon: <Zap size={18} />,
    slides: MODULE_3_SLIDES,
  },
  {
    id: "m4",
    number: 4,
    title: "Pressurisation & Environmental Control",
    subtitle: "6.6 PSI max ΔP, decompression/TUC, air conditioning, ice protection, oxygen",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/30",
    bar: "bg-blue-500",
    icon: <Wind size={18} />,
    slides: MODULE_4_SLIDES,
  },
  {
    id: "m5",
    number: 5,
    title: "Fuel, Avionics & Systems Integration",
    subtitle: "544 gal fuel system, Pro Line 21 avionics, safety systems, B350 vs B200 comparison",
    color: "text-indigo-400",
    bg: "bg-indigo-500/5",
    border: "border-indigo-500/30",
    bar: "bg-indigo-500",
    icon: <Fuel size={18} />,
    slides: MODULE_5_SLIDES,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CBTB350Systems() {
  const [phase, setPhase] = useState<"home" | "module">("home");
  const [activeModule, setActiveModule] = useState<CBTModule | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [completedSlides, setCompletedSlides] = useState<Record<string, Set<number>>>({});

  function openModule(mod: CBTModule) {
    setActiveModule(mod);
    setSlideIndex(0);
    setPhase("module");
  }

  function closeModule() {
    setPhase("home");
    setActiveModule(null);
  }

  function nextSlide() {
    if (!activeModule) return;
    const next = slideIndex + 1;
    if (next < activeModule.slides.length) {
      // Mark current slide viewed
      setCompletedSlides(prev => {
        const modSlides = new Set(prev[activeModule.id] ?? []);
        modSlides.add(slideIndex);
        return { ...prev, [activeModule.id]: modSlides };
      });
      setSlideIndex(next);
    } else {
      // Completed final slide
      setCompletedSlides(prev => {
        const modSlides = new Set(prev[activeModule.id] ?? []);
        modSlides.add(slideIndex);
        return { ...prev, [activeModule.id]: modSlides };
      });
      setCompletedModules(prev => new Set(prev).add(activeModule.id));
      setPhase("home");
      setActiveModule(null);
    }
  }

  function prevSlide() {
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
  }

  function resetAll() {
    setCompletedModules(new Set());
    setCompletedSlides({});
    setPhase("home");
    setActiveModule(null);
  }

  const totalSlides = CBT_MODULES.reduce((a, m) => a + m.slides.length, 0);
  const viewedSlides = Object.values(completedSlides).reduce((a, s) => a + s.size, 0);
  const overallPct = Math.round((viewedSlides / totalSlides) * 100);

  // ── HOME SCREEN ──────────────────────────────────────────────────────────
  if (phase === "home") {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              King Air B350 Aircraft Systems
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Computer Based Training — Super King Air 350 Pilot Training Manual · B350 AFM · AVM004h QRH
            </p>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
          >
            <RotateCcw size={11} /> Reset Progress
          </button>
        </div>

        {/* Overall Progress */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Progress</span>
            <span className="text-xs font-bold text-purple-400">{overallPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-2 rounded-full bg-purple-500 transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{viewedSlides} of {totalSlides} slides reviewed</span>
            <span className="text-xs text-muted-foreground">{completedModules.size}/{CBT_MODULES.length} modules complete</span>
          </div>
        </div>

        {/* B350 vs B200 Quick Reference */}
        <div className="grid grid-cols-3 gap-2">
          <CompareChip label="MTOW" b350="15,000 lb" b200="~12,500 lb" />
          <CompareChip label="Engine Power" b350="1,050 SHP" b200="850 SHP" />
          <CompareChip label="Hydraulic PSI" b350="~3,000 PSI" b200="~1,500 PSI" />
        </div>

        {/* Module Cards */}
        <div className="space-y-3">
          {CBT_MODULES.map(mod => {
            const modViewed = completedSlides[mod.id]?.size ?? 0;
            const modPct = Math.round((modViewed / mod.slides.length) * 100);
            const isComplete = completedModules.has(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => openModule(mod)}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:border-purple-500/30 ${isComplete ? `${mod.bg} ${mod.border}` : "bg-card border-border hover:bg-muted/10"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${mod.bg} ${mod.color} border ${mod.border}`}>
                    {isComplete ? <Award size={18} /> : mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${mod.color}`}>Module {mod.number}</span>
                      {isComplete && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">Complete</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-tight">{mod.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{mod.subtitle}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                        <div className={`h-1 rounded-full ${mod.bar} transition-all duration-500`} style={{ width: `${modPct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{modViewed}/{mod.slides.length} slides</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Source Footer */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Reference:</strong> Super King Air 350 Pilot Training Manual; Beechcraft King Air B350 Airplane Flight Manual (AFM); AVM004h B350 Quick Reference Handbook (QRH); Beechcraft King Air B350 Checklist.
          </p>
          <p className="text-xs text-purple-400 mt-1.5 font-semibold">Always cross-reference with the current approved AFM and QRH in your aircraft documentation. T-tail deep stall margins must never be treated casually.</p>
        </div>
      </div>
    );
  }

  // ── MODULE SLIDE VIEW ────────────────────────────────────────────────────
  if (phase === "module" && activeModule) {
    const slide = activeModule.slides[slideIndex];
    const isLast = slideIndex === activeModule.slides.length - 1;
    const slidePct = Math.round(((slideIndex + 1) / activeModule.slides.length) * 100);

    return (
      <div className="flex flex-col h-full min-h-[600px]">
        {/* Module Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <button
            onClick={closeModule}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${activeModule.color}`}>Module {activeModule.number}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">{slideIndex + 1} of {activeModule.slides.length}</span>
            </div>
            <p className="text-sm font-semibold truncate">{activeModule.title}</p>
          </div>
          <span className={`text-xs font-bold ${activeModule.color}`}>{slidePct}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-border flex-shrink-0">
          <div className={`h-1 ${activeModule.bar} transition-all duration-500`} style={{ width: `${slidePct}%` }} />
        </div>

        {/* Slide Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {slide.title}
          </h2>
          <div>{slide.body}</div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={prevSlide}
            disabled={slideIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Previous
          </button>

          {/* Slide dots */}
          <div className="flex items-center gap-1">
            {activeModule.slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all ${i === slideIndex ? `w-4 h-2 ${activeModule.bar}` : "w-2 h-2 bg-border hover:bg-muted-foreground"}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isLast ? "bg-green-500 hover:bg-green-400 text-white border border-green-400" : `${activeModule.bar} hover:opacity-90 text-white border ${activeModule.border}`}`}
          >
            {isLast ? (
              <><Award size={14} /> Complete Module</>
            ) : (
              <>Next <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
