/**
 * CBT — King Air B200 Aircraft Systems
 * Computer Based Training Module — Medivac.ai
 *
 * Source: King Air B200/B200GT/250 Pilot Training Manual
 *         Beechcraft King Air B200 Airplane Flight Manual (AFM)
 *         AVM004c Quick Reference Handbook (QRH)
 *         Beechcraft King Air B200 Normal/Abnormal/Emergency Checklists
 *
 * 5 Modules:
 *   Module 1 — Flight Controls & Hydraulics
 *   Module 2 — Powerplant & Propellers: PT6A-60A
 *   Module 3 — Electrical System
 *   Module 4 — Pressurisation, Bleed Air & Environmental
 *   Module 5 — Fuel, Avionics & Systems Integration
 */

import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle, BookOpen,
  Award, AlertTriangle, Zap, Shield, Plane,
  RotateCcw, X, Wind, Activity
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
      <CheckCircle size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 mt-3">
      <BookOpen size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-orange-200 leading-relaxed">{children}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 mt-4 first:mt-0">
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

// Annunciator-style indicator chip
function Annunciator({ label, color = "amber" }: { label: string; color?: "amber" | "red" | "green" }) {
  const colors = {
    amber: "bg-amber-500/20 border-amber-500/30 text-amber-300",
    red: "bg-red-500/20 border-red-500/30 text-red-300",
    green: "bg-green-500/20 border-green-500/30 text-green-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded border text-[11px] font-bold tracking-wide ${colors[color]}`}>
      {label}
    </span>
  );
}

// Step-by-step procedure list
function ProcedureStep({ step, action, detail }: { step: string; action: string; detail?: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-card border border-cyan-500/20">
      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</div>
      <div>
        <p className="text-xs font-semibold">{action}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — Flight Controls & Hydraulics
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_1_SLIDES: SlideContent[] = [
  {
    id: "m1-s1",
    title: "Primary Flight Controls",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The King Air B200 uses <strong className="text-foreground">conventional mechanical flight controls</strong> — there is no hydraulic or fly-by-wire actuation of the primary control surfaces. Control inputs are transmitted directly from the cockpit controls to the surfaces via <strong className="text-foreground">cables, bellcranks and pushrods</strong>.
        </p>
        <SectionHeader>Primary Surfaces</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Ailerons</strong> — cable-actuated from the control wheel, mechanically interconnected between yokes</KeyPoint>
          <KeyPoint><strong>Elevator</strong> — cable/pushrod-actuated from the control column</KeyPoint>
          <KeyPoint><strong>Rudder</strong> — cable-actuated from the rudder pedals, interconnected between pilot and copilot pedals</KeyPoint>
        </ul>
        <SectionHeader>Trim Tabs</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Trim tabs are fitted on <strong className="text-foreground">all three axes</strong> (elevator, aileron, rudder) to relieve sustained control forces and allow the aircraft to be flown "hands off" in a trimmed condition.
        </p>
        <Warning>Because flight controls are fully mechanical, a hydraulic system failure does NOT affect primary flight control authority — pitch, roll, and yaw control is retained regardless of hydraulic status.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Flight Controls chapter</Note>
      </div>
    ),
  },
  {
    id: "m1-s2",
    title: "Trim Systems",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 is fitted with <strong className="text-foreground">electric trim</strong> on the elevator, aileron and rudder tabs, each controlled independently.
        </p>
        <SectionHeader>Trim Control Summary</SectionHeader>
        <Table
          headers={["Axis", "Primary Actuation", "Backup"]}
          rows={[
            ["Elevator", "Electric trim switch (control wheel)", "Manual trim wheel (pedestal)"],
            ["Aileron", "Electric trim switch", "None — electric only"],
            ["Rudder", "Electric trim switch", "None — electric only"],
          ]}
        />
        <SectionHeader>Trim Runaway Procedure</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Identify the runaway axis" detail="Note direction of uncommanded trim movement and control force required to counter it" />
          <ProcedureStep step="2" action="Overpower trim with control input" detail="Maintain aircraft control while diagnosing" />
          <ProcedureStep step="3" action="Pull the relevant TRIM circuit breaker" detail="Isolates electrical power to the runaway trim motor" />
          <ProcedureStep step="4" action="Use manual trim wheel (elevator only) as required" detail="Re-trim manually once electric trim is isolated" />
        </div>
        <Warning>An uncommanded trim movement must be countered immediately with firm control input before troubleshooting — do not delay control input to search for the correct circuit breaker.</Warning>
        <Note>Source: Beechcraft King Air B200 Emergency Checklist — Trim Runaway; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m1-s3",
    title: "Landing Gear System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The landing gear is <strong className="text-foreground">hydraulically actuated</strong> and electrically controlled. Retraction and extension are powered by hydraulic pressure delivered from either the engine-driven pump or the electric standby pump.
        </p>
        <SectionHeader>Gear Power Sources</SectionHeader>
        <Table
          headers={["Source", "Role"]}
          rows={[
            ["Engine-driven hydraulic pump", "Primary — normally supplies all gear/brake/steering hydraulics"],
            ["Electric standby hydraulic pump", "Backup — activates automatically or manually if system pressure is low"],
            ["Alternate gear release handle", "Emergency — mechanically releases uplocks for gravity free-fall extension"],
          ]}
        />
        <SectionHeader>Key Limits & Indications</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>V<sub>LE</sub> (max gear extended speed)</strong> = 182 KIAS</KeyPoint>
          <KeyPoint><strong>3 green lights</strong> = gear down and locked (nose, left main, right main)</KeyPoint>
          <KeyPoint>Red unsafe light + horn = gear in transit or not locked when configuration warrants</KeyPoint>
        </ul>
        <SectionHeader>Alternate (Emergency) Gear Extension</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If normal hydraulic extension fails, pulling the <strong className="text-foreground">alternate gear release handle</strong> mechanically releases the uplocks, allowing the gear to free-fall and lock down under gravity and airflow — no hydraulic pressure required for this method.
        </p>
        <Warning>Do not exceed 182 KIAS (VLE) with the landing gear extended — structural loads on gear doors and mechanisms increase rapidly above this speed.</Warning>
        <Note>Source: King Air B200 AFM — Landing Gear System; Beechcraft King Air B200 Normal/Emergency Checklist</Note>
      </div>
    ),
  },
  {
    id: "m1-s4",
    title: "Hydraulic System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 hydraulic system operates at approximately <strong className="text-foreground">1,500 PSI</strong> and provides power for gear actuation, wheel brakes, nose wheel steering, and the rudder boost system.
        </p>
        <SectionHeader>System Components</SectionHeader>
        <Table
          headers={["Component", "Function"]}
          rows={[
            ["Engine-driven pump", "Primary hydraulic pressure source, ~1,500 PSI"],
            ["Electric standby pump", "Backup pressure source if engine pump output is insufficient"],
            ["Reservoir", "Stores hydraulic fluid, allows for thermal expansion"],
            ["Accumulator", "Stores pressure for emergency braking after pump failure"],
          ]}
        />
        <SectionHeader>Systems Served by Hydraulics</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Landing gear retraction and extension</KeyPoint>
          <KeyPoint>Wheel brakes</KeyPoint>
          <KeyPoint>Nose wheel steering</KeyPoint>
          <KeyPoint>Rudder boost system (assists rudder authority)</KeyPoint>
        </ul>
        <Warning>Primary flight controls (ailerons, elevator, rudder) are NOT hydraulically actuated and remain fully functional in the event of a total hydraulic system failure. Only gear, brakes, steering and rudder boost are affected.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Hydraulic System chapter</Note>
      </div>
    ),
  },
  {
    id: "m1-s5",
    title: "Rudder Boost System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The rudder boost system is <strong className="text-foreground">bleed-air powered</strong> and automatically assists the pilot's rudder input to counteract asymmetric thrust following an engine failure.
        </p>
        <SectionHeader>Operating Principle</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Senses differential torque/pressure between the two engines</KeyPoint>
          <KeyPoint>Applies a boosting force to the rudder in the direction needed to counter yaw from the failed engine</KeyPoint>
          <KeyPoint>Powered by engine bleed air — requires an operating bleed air supply from at least one engine</KeyPoint>
          <KeyPoint>Reduces the leg force required by the pilot during single-engine operation</KeyPoint>
        </ul>
        <SectionHeader>RUDDER BOOST Annunciator</SectionHeader>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <Annunciator label="RUDDER BOOST" color="amber" />
          <p className="text-xs text-muted-foreground">Illuminated = system has failed (typically due to loss of bleed air supply)</p>
        </div>
        <Warning>If the RUDDER BOOST annunciator illuminates, the system has failed — the pilot must apply full leg force manually to maintain directional control during asymmetric thrust conditions (e.g., engine failure on takeoff or go-around).</Warning>
        <Note>Source: AVM004c QRH — Rudder Boost System; King Air B200 AFM Abnormal Procedures</Note>
      </div>
    ),
  },
  {
    id: "m1-s6",
    title: "Flaps & Ground Spoilers",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 uses <strong className="text-foreground">Fowler-type flaps</strong>, electrically actuated, which extend aft and down to increase wing area and camber for reduced approach and landing speeds.
        </p>
        <SectionHeader>Flap Limits</SectionHeader>
        <Table
          headers={["Speed / Setting", "Value"]}
          rows={[
            ["VFE — Approach flap setting", "178 KIAS"],
            ["Flap positions", "UP / APPROACH / DOWN (full)"],
            ["Actuation", "Electric flap motor and gearbox drive"],
          ]}
        />
        <SectionHeader>Ground Spoilers</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Automatically deploy on <strong>main gear compression</strong> (weight-on-wheels) after landing</KeyPoint>
          <KeyPoint>Spoil lift over the wing, increasing effective weight on the wheels for braking</KeyPoint>
          <KeyPoint>Significantly reduce landing roll distance</KeyPoint>
          <KeyPoint>Not used for in-flight roll control — ground-deployment only</KeyPoint>
        </ul>
        <SectionHeader>Anti-Skid Braking</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An <strong className="text-foreground">anti-skid braking system</strong> is standard on later B200 models, modulating brake pressure at each main wheel to prevent tyre skidding and reduce stopping distance, particularly on wet or contaminated runways.
        </p>
        <Note>Source: King Air B200 AFM — Limitations Section (VFE); King Air B200/B200GT/250 Pilot Training Manual — Flaps & Ground Spoilers</Note>
      </div>
    ),
  },
  {
    id: "m1-s7",
    title: "Interactive: Hydraulic System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Toggle the controls below to see live hydraulic flow, gear operation, and brake accumulator behaviour. Simulate an EDP failure and practice the alternate gear extension procedure.</p>
        </div>
        <HydraulicSystemSimulator />
      </div>
    ),
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — Powerplant & Propellers: PT6A-60A
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_2_SLIDES: SlideContent[] = [
  {
    id: "m2-s1",
    title: "PT6A-60A Overview",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The King Air B200 is powered by two <strong className="text-foreground">Pratt & Whitney Canada PT6A-60A</strong> engines — free turbine turboprops flat-rated at <strong className="text-foreground">850 SHP</strong> for takeoff.
        </p>
        <SectionHeader>Free Turbine Architecture</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Gas generator section (Ng)</strong> — compressor and compressor turbine, mechanically independent of the propeller shaft</KeyPoint>
          <KeyPoint><strong>Power turbine section (Np)</strong> — drives the propeller through a reduction gearbox, coupled only aerodynamically (via gas flow) to the gas generator</KeyPoint>
          <KeyPoint>Because the two turbines are mechanically separate, Ng and Np can be controlled independently</KeyPoint>
        </ul>
        <SectionHeader>Combustion & Airflow</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Reverse-flow, can-annular combustion chamber design</KeyPoint>
          <KeyPoint>Airflow reverses direction through the combustor, shortening overall engine length</KeyPoint>
        </ul>
        <SectionHeader>Operational Benefit</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The free turbine design provides significant operational flexibility — the propeller (Np) speed can be held constant while gas generator (Ng) speed and torque are varied independently to manage power output.
        </p>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Powerplant chapter, PT6A-60A Description</Note>
      </div>
    ),
  },
  {
    id: "m2-s2",
    title: "Engine Limits",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Strict adherence to PT6A-60A operating limits is essential — engine and gearbox life is directly affected by exceedances.
        </p>
        <Table
          headers={["Parameter", "Limit"]}
          rows={[
            ["Max takeoff ITT", "800°C (5 minutes maximum)"],
            ["Max continuous ITT", "750°C"],
            ["Max Ng (gas generator speed)", "101.5%"],
            ["Max torque", "~2,230 ft-lb"],
            ["Normal cruise Np", "1,900–2,000 RPM"],
          ]}
        />
        <SectionHeader>Exceedance Handling</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Any limit exceedance (ITT, Ng, torque, Np) must be recorded with a <strong>engine log entry</strong></KeyPoint>
          <KeyPoint>Exceedances may require a <strong>maintenance inspection</strong> before further flight, depending on magnitude and duration</KeyPoint>
        </ul>
        <Warning>Exceeding ANY PT6A-60A limit — ITT, Ng, torque or Np — requires a logbook entry and may mandate a maintenance inspection before the aircraft returns to service. Do not disregard momentary exceedances.</Warning>
        <Note>Source: King Air B200 AFM — Limitations Section, Powerplant Limits; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m2-s3",
    title: "Fuel & Condition Controls",
    body: (
      <div className="space-y-4">
        <SectionHeader>Condition Lever Positions</SectionHeader>
        <Table
          headers={["Position", "Function"]}
          rows={[
            ["FUEL CUTOFF", "Shuts off fuel flow to the engine — used for shutdown"],
            ["LOW IDLE", "Minimum ground idle Ng — normal start and taxi position"],
            ["HIGH IDLE", "Increased idle Ng — used for icing conditions / electrical load"],
            ["MAX", "Full fuel governing range (some variants) — normal flight position"],
          ]}
        />
        <SectionHeader>Power Lever & FCU</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Power lever controls <strong>Ng</strong> through the hydromechanical Fuel Control Unit (FCU)</KeyPoint>
          <KeyPoint>The <strong>beta gate</strong> is a mechanical stop preventing inadvertent movement of the power lever into ground-fine or reverse pitch range while airborne</KeyPoint>
        </ul>
        <SectionHeader>Fuel Introduction During Start</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Engage starter, monitor Ng" detail="Wait for Ng to reach 12–13%" />
          <ProcedureStep step="2" action="Move condition lever to LOW IDLE" detail="Introduces fuel and initiates light-off" />
          <ProcedureStep step="3" action="Monitor ITT rise closely" detail="Watch for hot start indications — abort if ITT limit is approached" />
        </div>
        <Warning>A hot start (rapid or excessive ITT rise) requires the condition lever to be immediately returned to FUEL CUTOFF and the start aborted, per the AFM abnormal start procedure.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Fuel & Condition Control System; Beechcraft King Air B200 Normal Checklist, Engine Start</Note>
      </div>
    ),
  },
  {
    id: "m2-s4",
    title: "Propeller System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each engine drives a <strong className="text-foreground">Hartzell 4-blade, full-feathering, constant-speed propeller</strong> through a reduction gearbox.
        </p>
        <SectionHeader>Governing</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>The <strong>propeller governor</strong> controls blade pitch to maintain a selected RPM regardless of power lever position or airspeed changes</KeyPoint>
          <KeyPoint>Full feathering capability allows blades to be turned edge-on to airflow, minimising drag after an engine failure or shutdown</KeyPoint>
        </ul>
        <SectionHeader>Auto-Feather System</SectionHeader>
        <div className="p-3 rounded-lg bg-card border border-cyan-500/20">
          <ul className="space-y-2">
            <KeyPoint><strong>AUTOFEATHER</strong> arms above approximately <strong>400 ft-lb torque</strong> threshold on both engines (typically armed for takeoff and landing)</KeyPoint>
            <KeyPoint>If torque on one engine drops below the AFMS-specified limit, that engine's propeller <strong>automatically feathers</strong> to minimise drag</KeyPoint>
            <KeyPoint>Reduces the pilot's workload and improves climb performance following an engine failure at a critical phase of flight</KeyPoint>
          </ul>
        </div>
        <SectionHeader>Annunciation</SectionHeader>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <Annunciator label="AUTOFEATHER ARM" color="green" />
          <p className="text-xs text-muted-foreground">Confirms the auto-feather system is armed and ready</p>
        </div>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Propeller System; AVM004c QRH Auto-Feather System</Note>
      </div>
    ),
  },
  {
    id: "m2-s5",
    title: "Engine Oil System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Engine oil serves three critical functions: <strong className="text-foreground">lubrication</strong> of bearings and gears, <strong className="text-foreground">cooling</strong> of internal components, and hydraulic actuation for <strong className="text-foreground">propeller pitch change</strong>.
        </p>
        <SectionHeader>Oil Pressure Limits</SectionHeader>
        <Table
          headers={["Parameter", "Value"]}
          rows={[
            ["Minimum oil pressure (caution)", "90 PSI"],
            ["Normal operating range", "~90–135 PSI"],
          ]}
        />
        <SectionHeader>Chip Detector</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Magnetic chip detector plug monitors for metallic particles in the oil system</KeyPoint>
          <KeyPoint>Illumination indicates metallic contamination — possible internal component wear or impending failure</KeyPoint>
        </ul>
        <Warning>If the CHIP DETECTOR light illuminates, treat as an indication of possible internal engine damage. Assess engine parameters immediately and consider landing at the nearest suitable aerodrome.</Warning>
        <Note>Source: King Air B200 AFM — Powerplant Limitations; AVM004c QRH, Engine Oil System</Note>
      </div>
    ),
  },
  {
    id: "m2-s6",
    title: "Engine Anti-Ice & Start",
    body: (
      <div className="space-y-4">
        <SectionHeader>Engine Anti-Ice (EAI)</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Routes hot compressor bleed air to the engine inlet lips to prevent ice accretion</KeyPoint>
          <KeyPoint>Must be selected <strong>ON</strong> whenever icing conditions exist — OAT ≤10°C and visible moisture present</KeyPoint>
          <KeyPoint>Running EAI on both engines simultaneously reduces bleed air available for cabin pressurisation and air conditioning</KeyPoint>
        </ul>
        <SectionHeader>Normal Engine Start Sequence</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Select STARTER" detail="Begins motoring the gas generator" />
          <ProcedureStep step="2" action="Monitor Ng to 12–13%" detail="Minimum speed for fuel introduction" />
          <ProcedureStep step="3" action="Move condition lever to LOW IDLE" detail="Introduces fuel, initiates light-off" />
          <ProcedureStep step="4" action="Monitor ITT rise" detail="Confirm normal light-off, watch for hot start indications" />
          <ProcedureStep step="5" action="Starter disengages automatically" detail="At approximately 50% Ng" />
        </div>
        <Warning>Operating with EAI ON on both engines reduces available bleed air — expect a corresponding reduction in cabin pressurisation/conditioning performance, particularly at high altitude.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Ice & Rain Protection, Engine Anti-Ice; Beechcraft King Air B200 Normal Checklist, Engine Start</Note>
      </div>
    ),
  },
  {
    id: "m2-s7",
    title: "Interactive: PT6A-60A Engine Start Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Work through the start sequence step-by-step. Watch Ng, ITT, Np and oil pressure build in real time. Try introducing fuel too early or without ignition to see hot-start and hung-start warnings.</p>
        </div>
        <EngineStartSimulator />
      </div>
    ),
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — Electrical System
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_3_SLIDES: SlideContent[] = [
  {
    id: "m3-s1",
    title: "System Overview",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 electrical system is a <strong className="text-foreground">28V DC</strong> system, supplied by two engine-driven starter-generators, with static inverters providing 115V AC for avionics.
        </p>
        <SectionHeader>Major Components</SectionHeader>
        <Table
          headers={["Component", "Description"]}
          rows={[
            ["Starter-generators (×2)", "28V DC each, one per engine — dual function: starter (motor) then generator"],
            ["Left & right DC buses", "Two separate buses, each normally fed by its own generator"],
            ["Bus tie", "Cross-connects left and right buses when required"],
            ["Static inverters", "Convert 28V DC to 115V AC at 400Hz for avionics"],
            ["Battery", "24V Ni-Cd or lead-acid, provides starting and emergency power"],
          ]}
        />
        <SectionHeader>Design Philosophy</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Redundancy is built in at every level — two independent generators, a bus-tie for cross-feed, and a battery for emergency backup — ensuring essential systems remain powered through a wide range of failure scenarios.
        </p>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Electrical System chapter</Note>
      </div>
    ),
  },
  {
    id: "m3-s2",
    title: "Generator Operation",
    body: (
      <div className="space-y-4">
        <SectionHeader>Dual-Function Starter-Generators</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Each unit starts its own engine in <strong>motor mode</strong>, drawing DC power from the battery or external power</KeyPoint>
          <KeyPoint>At approximately <strong>50% Ng</strong>, the unit automatically transitions to <strong>generator mode</strong>, supplying electrical power to its bus</KeyPoint>
        </ul>
        <SectionHeader>Voltage Regulation</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>A voltage regulator maintains generator output at a constant <strong>28V DC</strong> across the full range of engine RPM</KeyPoint>
          <KeyPoint>Compensates automatically for changing electrical load and engine speed</KeyPoint>
        </ul>
        <SectionHeader>Overvoltage Protection</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An overvoltage protection relay monitors generator output and automatically <strong className="text-foreground">trips the generator offline</strong> if voltage exceeds the safe limit, protecting downstream avionics and electrical components from damage.
        </p>
        <Warning>Never attempt to reset a generator that has tripped on overvoltage more than once in flight without further diagnosis — repeated tripping indicates a regulator or generator fault.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Generator System Operation; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m3-s3",
    title: "Bus Architecture",
    body: (
      <div className="space-y-4">
        <SectionHeader>Normal Configuration</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Each generator normally supplies <strong>only its own bus</strong> (left generator → left bus, right generator → right bus)</KeyPoint>
          <KeyPoint>The <strong>bus tie</strong> is open in normal dual-generator operation</KeyPoint>
        </ul>
        <SectionHeader>Bus Tie — Cross-Connection</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If one generator fails, closing the bus tie interconnects both buses so the <strong className="text-foreground">remaining generator supplies all essential loads</strong> on both sides.
        </p>
        <SectionHeader>Special Buses</SectionHeader>
        <Table
          headers={["Bus", "Purpose"]}
          rows={[
            ["Avionics bus", "Powers avionics; disconnected via avionics master switch for ground protection during start/shutdown"],
            ["Emergency / essential bus", "Connected directly to the battery — powers minimum equipment if both generators fail"],
          ]}
        />
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Bus Architecture & Bus Tie System</Note>
      </div>
    ),
  },
  {
    id: "m3-s4",
    title: "Generator Failure",
    body: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <Annunciator label="GEN OFF" color="red" />
          <p className="text-xs text-muted-foreground">Generator has tripped offline or failed</p>
        </div>
        <SectionHeader>Response Sequence</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Identify GEN OFF annunciator" detail="Confirm which side has failed" />
          <ProcedureStep step="2" action="Attempt reset via GEN switch" detail="Cycle OFF then RESET/ON per checklist — one attempt only" />
          <ProcedureStep step="3" action="If reset unsuccessful, leave generator OFF" detail="Remaining generator (with bus tie closed) carries the full electrical load" />
          <ProcedureStep step="4" action="Shed non-essential electrical loads" detail="Reduce demand on the single operating generator" />
        </div>
        <SectionHeader>Backup Sources</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Battery provides emergency backup power — limited duration, approximately <strong>30 minutes</strong></KeyPoint>
          <KeyPoint>External power (GPU) ground connection available for ground operations when both generators are unavailable</KeyPoint>
        </ul>
        <Warning>Do not repeatedly attempt to reset a tripped generator — a single reset attempt per the checklist is appropriate. Continued resets risk further electrical system damage.</Warning>
        <Note>Source: Beechcraft King Air B200 Abnormal Checklist — Generator Failure; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m3-s5",
    title: "Circuit Breakers & Protection",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Circuit breakers (CBs) protect individual electrical circuits from overload or short-circuit conditions, automatically opening (tripping) the circuit to prevent wiring damage or fire.
        </p>
        <SectionHeader>Location & Access</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Located on the <strong>right-side circuit breaker panel</strong>, accessible to the crew in flight</KeyPoint>
          <KeyPoint>Pulling a CB manually and physically disconnects power to that specific circuit</KeyPoint>
        </ul>
        <SectionHeader>Tripped Circuit Breaker Procedure</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Identify the tripped (popped out) CB" detail="Note which system is affected" />
          <ProcedureStep step="2" action="Wait approximately 30 seconds" detail="Allow circuit to cool before resetting" />
          <ProcedureStep step="3" action="Reset ONCE by pushing the CB back in" detail="A single reset attempt is standard practice" />
          <ProcedureStep step="4" action="If it trips again — do NOT reset" detail="Indicates an active circuit fault; leave the CB open" />
        </div>
        <Warning>Never repeatedly reset a circuit breaker that trips a second time. This indicates a genuine fault (short circuit or overload) — continued resets risk an electrical fire.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Circuit Protection; Beechcraft King Air B200 Abnormal Checklist</Note>
      </div>
    ),
  },
  {
    id: "m3-s6",
    title: "Emergency Power & Load Shedding",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          If <strong className="text-foreground">both generators fail</strong>, the aircraft relies entirely on battery power — a time-critical emergency requiring immediate load management.
        </p>
        <SectionHeader>Battery-Only Operation</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Battery provides approximately <strong>30 minutes</strong> of emergency power, depending on load and battery condition</KeyPoint>
          <KeyPoint>The essential/emergency bus remains powered directly from the battery</KeyPoint>
          <KeyPoint>The shed bus automatically or manually drops all non-essential loads</KeyPoint>
          <KeyPoint>Static inverters go offline without generator input — <strong>no AC power for avionics</strong> that depend on inverter output</KeyPoint>
        </ul>
        <SectionHeader>Minimum Equipment Retained</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Standby flight instruments</KeyPoint>
          <KeyPoint>Communications radio (at least one)</KeyPoint>
          <KeyPoint>Essential navigation equipment</KeyPoint>
        </ul>
        <Warning>Dual generator failure is a critical emergency. Declare MAYDAY, shed all non-essential loads immediately, and land as soon as possible — battery endurance is finite and rapidly diminishing.</Warning>
        <Note>Source: Beechcraft King Air B200 Emergency Checklist — Dual Generator Failure; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m3-s7",
    title: "Interactive: Electrical System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Toggle generators, simulate failures and watch how power flows through bus bars to loads. Simulate dual-gen failure to see battery bus-only operation and understand load shedding priorities.</p>
        </div>
        <ElectricalSystemSimulator />
      </div>
    ),
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — Pressurisation, Bleed Air & Environmental
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_4_SLIDES: SlideContent[] = [
  {
    id: "m4-s1",
    title: "Pressurisation Overview",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cabin pressurisation uses bleed air extracted from the PT6A-60A compressors, regulated to maintain a comfortable cabin altitude while the aircraft operates at high flight levels.
        </p>
        <SectionHeader>Key Parameters</SectionHeader>
        <Table
          headers={["Parameter", "Value"]}
          rows={[
            ["Maximum differential pressure (ΔP)", "6.0 PSI"],
            ["Cabin altitude at FL350 (max ΔP)", "≈8,000–9,000 ft"],
          ]}
        />
        <SectionHeader>Key Components</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Cabin pressurisation controller</strong> — automatically maintains the selected pressure differential</KeyPoint>
          <KeyPoint><strong>Outflow valve</strong> — the key pressure-controlling component; modulates the rate air leaves the cabin to control ΔP</KeyPoint>
          <KeyPoint><strong>Negative pressure relief valve</strong> — prevents outside pressure exceeding cabin pressure (e.g., during rapid descent)</KeyPoint>
        </ul>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Pressurisation System chapter</Note>
      </div>
    ),
  },
  {
    id: "m4-s2",
    title: "Safety Valves & Dump",
    body: (
      <div className="space-y-4">
        <SectionHeader>Positive Pressure Relief (Safety) Valve</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Opens <strong className="text-foreground">automatically</strong> if cabin differential pressure exceeds <strong className="text-foreground">6.0 PSI</strong>, protecting the fuselage structure from overpressure.
        </p>
        <SectionHeader>Dump Valve (Pressurisation Override)</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Fully opens the outflow valve, rapidly equalising cabin pressure to outside ambient</KeyPoint>
          <KeyPoint>Used on the ground, or prior to opening any door, to ensure no residual pressure differential exists</KeyPoint>
        </ul>
        <Warning>Always confirm cabin differential pressure (ΔP) reads zero before attempting to open any aircraft door — opening a door under residual pressure can cause serious injury or structural damage.</Warning>
        <Note>Source: King Air B200 AFM — Pressurisation System, Normal Procedures; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m4-s3",
    title: "Cabin Altitude Warning & Decompression",
    body: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <Annunciator label="CABIN ALT" color="red" />
          <p className="text-xs text-muted-foreground">Triggers at approximately 10,000 ft cabin altitude</p>
        </div>
        <SectionHeader>Time of Useful Consciousness (TUC)</SectionHeader>
        <Table
          headers={["Flight Level", "Approx. TUC"]}
          rows={[
            ["FL350", "30–60 seconds"],
            ["FL250", "3–5 minutes"],
          ]}
        />
        <SectionHeader>Emergency Descent Procedure</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Initiate maximum practicable rate of descent" />
          <ProcedureStep step="2" action="Descend below FL140 (or 10,000 ft) as appropriate" />
          <ProcedureStep step="3" action="Oxygen ON — don masks immediately" />
          <ProcedureStep step="4" action="Squawk 7700 and notify ATC" />
        </div>
        <SectionHeader>Single Engine Bleed Loss</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Loss of bleed air from one engine typically results in <strong className="text-foreground">reduced but usually adequate</strong> pressurisation performance — full emergency descent is not automatically required, but performance should be closely monitored.
        </p>
        <Warning>A CABIN ALT warning demands an immediate emergency descent — do not delay to troubleshoot the cause. Don oxygen masks first, then begin descent and notify ATC.</Warning>
        <Note>Source: King Air B200 AFM — Emergency Procedures, Rapid Decompression; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m4-s4",
    title: "Air Conditioning",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cabin conditioned air is produced by a <strong className="text-foreground">bleed-air cycle system</strong>, combining engine bleed air with a bootstrap refrigeration cycle to control cabin temperature.
        </p>
        <SectionHeader>Air Conditioning Flow</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Hot compressor bleed air extracted" detail="From each engine" />
          <ProcedureStep step="2" action="Passed through bootstrap refrigeration cycle" detail="Air-cycle machine cools the bleed air" />
          <ProcedureStep step="3" action="Cooled through heat exchanger" detail="Further reduces temperature" />
          <ProcedureStep step="4" action="Delivered as conditioned air to cabin" detail="Mixed with hot bleed air as needed" />
        </div>
        <SectionHeader>Temperature Control</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Temperature controller mixes hot bleed air with cooled air to reach the selected cabin temperature</KeyPoint>
          <KeyPoint>Separate crew and cabin temperature zones may be independently controlled</KeyPoint>
          <KeyPoint>Using engine anti-ice (EAI) reduces bleed air available for conditioning — expect reduced cooling/heating performance</KeyPoint>
        </ul>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Environmental System, Air Conditioning</Note>
      </div>
    ),
  },
  {
    id: "m4-s5",
    title: "Ice Protection",
    body: (
      <div className="space-y-4">
        <SectionHeader>Ice Protection Systems Summary</SectionHeader>
        <Table
          headers={["System", "Type", "Notes"]}
          rows={[
            ["Engine anti-ice (EAI)", "Bleed air to inlet lips", "Continuous — select ON before/during icing conditions"],
            ["Wing de-ice boots", "Pneumatic inflate/deflate cycle", "Cyclic — cracks ice AFTER accretion, not preventive"],
            ["Windscreen anti-ice", "Electrically heated", "Continuous — maintains windscreen clarity"],
            ["Propeller anti-ice", "Electrically heated boots on leading edge", "Continuous — prevents ice buildup on blades"],
          ]}
        />
        <SectionHeader>Wing Boot Timing</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Wing de-ice boots must <strong className="text-foreground">NOT</strong> be activated preventively before ice forms. Activate only once ice accretion reaches approximately <strong className="text-foreground">¼ to ½ inch</strong> — premature cycling can create ice bridging that the boots cannot subsequently break.
        </p>
        <Warning>Do not cycle the wing de-ice boots before sufficient ice has accreted (¼–½ inch). Premature activation can cause ice bridging, rendering the boots ineffective for the remainder of the icing encounter.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Ice & Rain Protection chapter; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m4-s6",
    title: "Oxygen System",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Supplemental oxygen is stored in <strong className="text-foreground">compressed O₂ cylinders</strong> and distributed separately to the flight crew and cabin.
        </p>
        <SectionHeader>Crew & Cabin Oxygen</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Crew masks</strong> — diluter-demand type, providing oxygen mixed with cabin air on demand</KeyPoint>
          <KeyPoint><strong>Cabin masks</strong> — continuous-flow type, deploy automatically at approximately <strong>14,000 ft</strong> cabin altitude</KeyPoint>
        </ul>
        <SectionHeader>Regulatory Requirement</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Above <strong className="text-foreground">FL290</strong>, supplemental oxygen use is required per operating rules — crew should be prepared to don oxygen promptly at these altitudes.
        </p>
        <SectionHeader>Pre-Flight Check</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Check the oxygen pressure gauge before every flight</KeyPoint>
          <KeyPoint>Confirm indication is within the <strong>green sector</strong> — the minimum acceptable quantity</KeyPoint>
        </ul>
        <Warning>Do not depart with oxygen quantity below the green sector minimum — insufficient oxygen supply compromises the crew's ability to respond to a decompression emergency at altitude.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Oxygen System; Beechcraft King Air B200 Normal Checklist, Preflight</Note>
      </div>
    ),
  },
  {
    id: "m4-s7",
    title: "Interactive: Pressurisation System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Adjust flight altitude and watch the cabin altitude and differential pressure respond in auto mode. Switch to manual and control the outflow valve directly. Activate the emergency dump to see rapid equalisation — and why oxygen masks are needed above 14,000 ft cabin altitude.</p>
        </div>
        <PressurisationSimulator />
      </div>
    ),
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — Fuel, Avionics & Systems Integration
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_5_SLIDES: SlideContent[] = [
  {
    id: "m5-s1",
    title: "Fuel System Layout",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 fuel system has a total usable capacity of approximately <strong className="text-foreground">333 US gallons (2,220 lb of Jet-A1)</strong>, distributed across four integral tanks.
        </p>
        <SectionHeader>Tank Arrangement</SectionHeader>
        <Table
          headers={["Tank", "Role"]}
          rows={[
            ["2 × Nacelle tanks", "Engine feed tanks — fuel is drawn directly from these by each engine"],
            ["2 × Wing tanks", "Bulk storage — feed fuel forward into the nacelle tanks"],
          ]}
        />
        <SectionHeader>Normal Fuel Flow</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Fuel flows from <strong>wing tanks → nacelle tanks</strong> to maintain nacelle tank fuel level</KeyPoint>
          <KeyPoint>Each engine draws fuel from its own <strong>nacelle tank</strong></KeyPoint>
          <KeyPoint>A <strong>crossfeed valve</strong> allows fuel from one nacelle tank to feed the engine on the opposite side</KeyPoint>
        </ul>
        <SectionHeader>Fuel Imbalance Limit</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Maximum permissible imbalance between the two nacelle tanks is approximately <strong className="text-foreground">200–250 lb</strong>. Monitor fuel quantities regularly to avoid exceeding this limit.
        </p>
        <Note>Source: King Air B200 AFM — Fuel System Description & Limitations</Note>
      </div>
    ),
  },
  {
    id: "m5-s2",
    title: "Fuel Management",
    body: (
      <div className="space-y-4">
        <SectionHeader>Approved Fuels</SectionHeader>
        <Table
          headers={["Fuel Type", "Status"]}
          rows={[
            ["Jet-A / Jet-A1", "Approved — primary fuel"],
            ["Jet-B (kerosene)", "Approved"],
            ["AVGAS 100LL", "Emergency use ONLY — not for routine operations"],
          ]}
        />
        <SectionHeader>Boost Pumps & Pressure</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Electric boost pumps in each nacelle tank maintain <strong>positive fuel pressure</strong> to the Fuel Control Unit (FCU)</KeyPoint>
          <KeyPoint><strong>Minimum fuel pressure</strong> must be maintained for continued engine operation — a low-pressure indication requires immediate attention</KeyPoint>
        </ul>
        <SectionHeader>Crossfeed Use — Engine Failure</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Following a single-engine failure, the <strong className="text-foreground">crossfeed valve</strong> can be opened to feed the failed-side engine's fuel from the live-side nacelle tank into the operating engine — extending range and managing fuel balance during single-engine flight.
        </p>
        <Warning>A low fuel pressure indication must not be ignored — verify boost pump operation immediately and select crossfeed or an alternate tank source as required by the checklist.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Fuel System, Crossfeed Operation; AVM004c QRH</Note>
      </div>
    ),
  },
  {
    id: "m5-s3",
    title: "Avionics Suite — Collins Pro Line 21",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 avionics suite is built around the <strong className="text-foreground">Collins Pro Line 21</strong> integrated flight deck.
        </p>
        <SectionHeader>Core Displays & Computers</SectionHeader>
        <Table
          headers={["Component", "Function"]}
          rows={[
            ["PFD (AFD-3010)", "Primary Flight Display — airspeed, altitude, attitude, vertical speed"],
            ["MFD", "Navigation maps, traffic display, weather radar"],
            ["AHRS", "Solid-state gyros + accelerometers — provides attitude and heading data"],
            ["ADC", "Air Data Computer — pitot/static inputs; computes CAS, TAS, altitude, Mach"],
            ["FMS", "Flight Management System — GPS primary navigation, VOR/DME backup"],
          ]}
        />
        <SectionHeader>Redundancy</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pilot and copilot each have independent PFDs, AHRS and ADC inputs — providing cross-checking capability and continued operation if a single component fails.
        </p>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Avionics chapter; refer also to Collins Pro Line 21/TCAS-4000 CBT for detailed TCAS operation</Note>
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
          <KeyPoint><strong>EGPWS/TAWS</strong> — Enhanced Ground Proximity Warning / Terrain Awareness & Warning System; provides terrain alerting Modes 1–7 plus a terrain database for look-ahead alerting</KeyPoint>
          <KeyPoint><strong>TCAS II</strong> — Traffic Alert & Collision Avoidance System; provides Traffic Advisories and Resolution Advisories (see the dedicated Pro Line 21/TCAS CBT module for full detail)</KeyPoint>
        </ul>
        <SectionHeader>Stall Protection</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A vane-type angle-of-attack (AOA) sensor feeds the stall warning system, activating the <strong className="text-foreground">stick shaker</strong> to provide tactile warning of an approaching stall.
        </p>
        <SectionHeader>Cross-Check & Compare Monitoring</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Windshear detection system fitted on applicable aircraft, alerting crew to hazardous windshear encounters</KeyPoint>
          <KeyPoint>All primary flight data is cross-checked between pilot and copilot EFIS systems via <strong>compare monitoring</strong></KeyPoint>
        </ul>
        <Warning>Respect the stall warning stick shaker at all times — including during a TCAS Resolution Advisory manoeuvre. Never allow an RA response to induce a stall.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Safety & Warning Systems chapter</Note>
      </div>
    ),
  },
  {
    id: "m5-s5",
    title: "Autopilot & Flight Director",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Collins autopilot integrates with the Pro Line 21 flight director to provide coupled guidance for a range of approach and en-route modes.
        </p>
        <SectionHeader>Coupled Modes</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Couples to <strong>ILS (LOC + GS)</strong>, VOR, and RNAV/GPS approaches</KeyPoint>
          <KeyPoint>Pitch, roll, altitude hold, and vertical speed (VS) modes available</KeyPoint>
        </ul>
        <SectionHeader>Mandatory Disconnect</SectionHeader>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-bold text-red-400 mb-1">Autopilot MUST be disconnected before flying a TCAS Resolution Advisory (RA)</p>
          <p className="text-xs text-muted-foreground">Manual control is required to accurately fly the commanded vertical speed</p>
        </div>
        <SectionHeader>PFD Failure — Standby Instruments</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>If a PFD fails, revert to standby instruments: pneumatic ADI, standby altimeter, standby ASI</KeyPoint>
          <KeyPoint><strong>EFIS COMPARE</strong> warning indicates a significant discrepancy between left and right systems — cross-check against standby instruments to determine the faulty side</KeyPoint>
        </ul>
        <Warning>An EFIS COMPARE warning means at least one PFD/AHRS/ADC source is unreliable. Do not trust either side blindly — cross-check with standby instruments before continuing flight on instruments.</Warning>
        <Note>Source: King Air B200/B200GT/250 Pilot Training Manual — Autopilot & Flight Director; Beechcraft King Air B200 Abnormal Checklist</Note>
      </div>
    ),
  },
  {
    id: "m5-s6",
    title: "Systems Integration & Pre-Flight",
    body: (
      <div className="space-y-4">
        <SectionHeader>Weight-on-Wheels (WOW / Squat Switch)</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The squat switch senses whether the aircraft is on the ground or airborne, and integrates with several systems:
        </p>
        <ul className="space-y-2">
          <KeyPoint>Prevents inadvertent <strong>landing gear retraction</strong> while on the ground</KeyPoint>
          <KeyPoint>Arms the <strong>ground spoiler</strong> system for automatic deployment on landing</KeyPoint>
          <KeyPoint>Changes certain <strong>avionics modes</strong> between ground and flight configurations</KeyPoint>
        </ul>
        <SectionHeader>Propeller Synchronisation</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Propeller sync (prop sync) automatically matches the <strong className="text-foreground">slave (right) propeller</strong> RPM and phase to the <strong className="text-foreground">master (left) propeller</strong>, reducing the audible "beat frequency" and cabin vibration caused by mismatched propeller speeds.
        </p>
        <SectionHeader>Pre-Flight Flow</SectionHeader>
        <div className="space-y-2">
          <ProcedureStep step="1" action="Exterior inspection" detail="Visual check of airframe, control surfaces, gear, engines and propellers" />
          <ProcedureStep step="2" action="Fuel quantity and quality check" detail="Verify quantity, check for contamination/water" />
          <ProcedureStep step="3" action="Oxygen system check" detail="Confirm pressure in green sector minimum" />
          <ProcedureStep step="4" action="Battery check" detail="Confirm charge and condition before start" />
          <ProcedureStep step="5" action="Avionics setup" detail="Configure PFD/MFD, FMS, radios prior to engine start" />
          <ProcedureStep step="6" action="Engine start sequence" detail="Starter → Ng 12–13% → condition lever LOW IDLE → monitor ITT" />
        </div>
        <Note>Source: Beechcraft King Air B200 Normal Checklist — Pre-Flight & Before Start; King Air B200/B200GT/250 Pilot Training Manual</Note>
      </div>
    ),
  },
  {
    id: "m5-s7",
    title: "Interactive: Fuel System Simulator",
    body: (
      <div className="-mx-6 -mb-6">
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground">Watch live fuel flow direction between wing tanks, nacelle tanks and engines. Toggle boost pumps, open the crossfeed valve, and simulate an engine failure to see how crossfeed supports single-engine operations.</p>
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
    subtitle: "Mechanical flight controls, trim, landing gear, hydraulics, rudder boost, flaps & spoilers",
    color: "text-cyan-400",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/30",
    bar: "bg-cyan-500",
    icon: <Plane size={18} />,
    slides: MODULE_1_SLIDES,
  },
  {
    id: "m2",
    number: 2,
    title: "Powerplant & Propellers: PT6A-60A",
    subtitle: "Free turbine turboprop, engine limits, fuel/condition controls, propeller & auto-feather, oil, anti-ice",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    bar: "bg-amber-500",
    icon: <Zap size={18} />,
    slides: MODULE_2_SLIDES,
  },
  {
    id: "m3",
    number: 3,
    title: "Electrical System",
    subtitle: "28V DC system, starter-generators, bus architecture, generator failure, circuit breakers, emergency power",
    color: "text-green-400",
    bg: "bg-green-500/5",
    border: "border-green-500/30",
    bar: "bg-green-500",
    icon: <Activity size={18} />,
    slides: MODULE_3_SLIDES,
  },
  {
    id: "m4",
    number: 4,
    title: "Pressurisation, Bleed Air & Environmental",
    subtitle: "Cabin pressurisation, safety/dump valves, decompression, air conditioning, ice protection, oxygen",
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
    subtitle: "Fuel system layout & management, Pro Line 21 avionics, safety systems, autopilot, pre-flight integration",
    color: "text-purple-400",
    bg: "bg-purple-500/5",
    border: "border-purple-500/30",
    bar: "bg-purple-500",
    icon: <Shield size={18} />,
    slides: MODULE_5_SLIDES,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CBTB200Systems() {
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
              King Air B200 Aircraft Systems
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Computer Based Training — B200/B200GT/250 Pilot Training Manual · AFM · AVM004c QRH
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
            <span className="text-xs font-bold text-cyan-400">{overallPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-2 rounded-full bg-cyan-500 transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{viewedSlides} of {totalSlides} slides reviewed</span>
            <span className="text-xs text-muted-foreground">{completedModules.size}/{CBT_MODULES.length} modules complete</span>
          </div>
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
                className={`w-full text-left p-4 rounded-xl border transition-all hover:border-cyan-500/30 ${isComplete ? `${mod.bg} ${mod.border}` : "bg-card border-border hover:bg-muted/10"}`}
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
            <strong className="text-foreground">Reference:</strong> King Air B200/B200GT/250 Pilot Training Manual; Beechcraft King Air B200 Airplane Flight Manual (AFM); AVM004c Quick Reference Handbook (QRH); Beechcraft King Air B200 Normal/Abnormal/Emergency Checklists.
          </p>
          <p className="text-xs text-cyan-400 mt-1.5 font-semibold">Always cross-reference with the current approved AFM and checklist in your aircraft documentation.</p>
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
