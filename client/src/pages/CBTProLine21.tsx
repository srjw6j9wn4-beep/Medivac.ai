/**
 * CBT — Collins Pro Line 21 / TCAS-4000 (TCAS II Version 7.0)
 * Computer Based Training Module — Medivac.ai
 *
 * Source: Elliott Aviation FAA-Approved Airplane Flight Manual Supplement
 *         Collins TCAS-4000 with Pro Line 21 Avionics — Report FS2026-576, Rev 2 (07/28/2010)
 *         FAA STC # SA01352CH
 *
 * 5 Modules:
 *   Module 1 — System Overview & Hardware
 *   Module 2 — Traffic Types & Display Symbology
 *   Module 3 — Normal Procedures & In-Flight Operation
 *   Module 4 — Resolution & Traffic Advisories (RA/TA)
 *   Module 5 — Emergency, Abnormal & Limitations
 */

import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle, Circle, BookOpen,
  Award, Radio, AlertTriangle, Eye, Zap, Shield,
  ArrowUp, ArrowDown, Minus, RotateCcw, X
} from "lucide-react";

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
      <CheckCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
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
    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2 mt-4 first:mt-0">
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

// Traffic symbol component for visual display
function TrafficSymbol({ type }: { type: "RA" | "TA" | "PT" | "OT" }) {
  const configs = {
    RA: { shape: "square", color: "bg-red-500", label: "RA — Resolution Advisory", textColor: "text-red-400" },
    TA: { shape: "circle", color: "bg-yellow-400", label: "TA — Traffic Alert", textColor: "text-yellow-400" },
    PT: { shape: "diamond-filled", color: "bg-cyan-400", label: "PT — Proximate Traffic", textColor: "text-cyan-400" },
    OT: { shape: "diamond-open", color: "border-cyan-400 bg-transparent border-2", label: "OT — Other Traffic", textColor: "text-cyan-400" },
  };
  const cfg = configs[type];
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
        {type === "RA" && (
          <div className="w-6 h-6 bg-red-500" style={{ clipPath: "none" }} />
        )}
        {type === "TA" && (
          <div className="w-6 h-6 rounded-full bg-yellow-400" />
        )}
        {type === "PT" && (
          <div className="w-6 h-6 bg-cyan-400" style={{ transform: "rotate(45deg)" }} />
        )}
        {type === "OT" && (
          <div className="w-6 h-6 border-2 border-cyan-400" style={{ transform: "rotate(45deg)" }} />
        )}
      </div>
      <div>
        <p className={`text-xs font-bold ${cfg.textColor}`}>{type}</p>
        <p className="text-xs text-muted-foreground">{cfg.label}</p>
      </div>
    </div>
  );
}

// VSI Advisory display
function VSIDisplay({ type }: { type: "climb" | "descend" | "monitor" | "clear" }) {
  const configs = {
    climb: {
      label: "CLIMB, CLIMB",
      green: "top-0 h-1/3",
      red: "bottom-0 h-2/3",
      response: "Establish ≥1500 FPM CLIMB — fly the GREEN arc",
    },
    descend: {
      label: "DESCEND, DESCEND",
      green: "bottom-0 h-1/3",
      red: "top-0 h-2/3",
      response: "Establish ≥1500 FPM DESCENT — fly the GREEN arc",
    },
    monitor: {
      label: "MONITOR VERTICAL SPEED",
      green: "",
      red: "top-0 h-1/4",
      response: "Stay out of RED zone — be alert for approaching traffic",
    },
    clear: {
      label: "CLEAR OF CONFLICT",
      green: "top-0 h-full opacity-20",
      red: "",
      response: "Expeditiously return to ATC clearance altitude",
    },
  };
  const cfg = configs[type];
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
      {/* Simplified VSI bar */}
      <div className="relative w-6 h-24 bg-muted/40 rounded-full overflow-hidden flex-shrink-0 border border-border">
        {cfg.red && <div className={`absolute left-0 right-0 bg-red-500/70 ${cfg.red}`} />}
        {cfg.green && <div className={`absolute left-0 right-0 bg-green-500/70 ${cfg.green}`} />}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60 -translate-y-0.5" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-foreground mb-1">{cfg.label}</p>
        <p className="text-xs text-muted-foreground leading-snug">{cfg.response}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — System Overview & Hardware
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_1_SLIDES: SlideContent[] = [
  {
    id: "m1-s1",
    title: "What is TCAS II?",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong className="text-foreground">Collins TCAS-4000</strong> is a Traffic Alert and Collision Avoidance System (TCAS II, Version 7.0) installed in Beechcraft B200 series aircraft under FAA STC #SA01352CH. It interfaces with the Collins <strong className="text-foreground">Pro Line 21 Avionics</strong> suite.
        </p>
        <SectionHeader>Primary Function</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Identifies potential airborne traffic conflicts within at least <strong>14 nautical miles</strong></KeyPoint>
          <KeyPoint>Provides appropriate <strong>Traffic Alerts (TA)</strong> and <strong>Resolution Advisories (RA)</strong></KeyPoint>
          <KeyPoint>Presents vertical flight path guidance on the <strong>PFD VSI scale</strong></KeyPoint>
          <KeyPoint>Coordinates manoeuvres between TCAS II aircraft via <strong>Mode S data link</strong></KeyPoint>
        </ul>
        <Warning>TCAS does NOT provide protection from aircraft without an operating transponder. It is a backup to the "SEE AND AVOID" concept — not a replacement for ATC radar separation.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 1, General Description</Note>
      </div>
    ),
  },
  {
    id: "m1-s2",
    title: "System Components",
    body: (
      <div className="space-y-4">
        <SectionHeader>TCAS-4000 Hardware</SectionHeader>
        <Table
          headers={["Component", "Description", "Qty"]}
          rows={[
            ["TTR-4000", "TCAS Transmitter/Receiver — the main processing unit", "1"],
            ["TDR-94D", "Mode S Transponder — responds to ATCRBS interrogations (Mode A, C & S)", "2"],
            ["TRE-920", "TCAS Directional Antennas (L-Band) — 2 top, 2 bottom", "4"],
            ["CDU", "Control Display Unit — primary TCAS control interface", "1"],
            ["DCP", "Display Control Panel — secondary control", "1"],
            ["RTU", "Radio Tuning Unit — can also operate TCAS", "1"],
          ]}
        />
        <SectionHeader>Displays</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Pilot & Copilot AFD-3010 (PFD)</strong> — Resolution Advisories on VSI scale; TCAS messages</KeyPoint>
          <KeyPoint><strong>MFD AFD-3010</strong> — All traffic displays (TA, RA, PT, OT symbols); traffic map</KeyPoint>
        </ul>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 1, §A Mode S Transponder System & §B TCAS-4000 System Description</Note>
      </div>
    ),
  },
  {
    id: "m1-s3",
    title: "System Prerequisites",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          TCAS cannot function alone. The following aircraft systems must be <strong className="text-foreground">functional and operating</strong> for TCAS to work:
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { label: "Mode S Transponders", detail: "2 × TDR-94D required" },
            { label: "Air Data Computer", detail: "Provides altitude data" },
            { label: "AHRS Computer", detail: "Provides heading/attitude" },
            { label: "Radio Altimeter", detail: "AGL altitude for inhibits" },
            { label: "Pilot PFD", detail: "RA display — AFD-3010" },
            { label: "Copilot PFD", detail: "RA display — AFD-3010" },
            { label: "MFD", detail: "Traffic display — AFD-3010" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-card border border-border">
              <CheckCircle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Warning>If the ADC or Radio Altimeter becomes inoperable, TCAS must be turned OFF — it will no longer be operable.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 1, §2 & Section 3A, §B.2</Note>
      </div>
    ),
  },
  {
    id: "m1-s4",
    title: "Power Interruption & Self-Test",
    body: (
      <div className="space-y-4">
        <SectionHeader>After Power Interruption</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Following a power interruption, allow <strong className="text-orange-400">~15 seconds</strong> before TCAS shows traffic:
        </p>
        <div className="flex gap-2 mt-2">
          {[
            { seconds: "0–10s", label: "Self-test mode", color: "bg-amber-500/20 border-amber-500/30 text-amber-300" },
            { seconds: "10–15s", label: "Acquiring traffic", color: "bg-orange-500/20 border-orange-500/30 text-orange-300" },
            { seconds: "15s+", label: "Traffic displayed", color: "bg-green-500/20 border-green-500/30 text-green-300" },
          ].map((step, i) => (
            <div key={i} className={`flex-1 p-2.5 rounded-lg border text-center ${step.color}`}>
              <p className="text-xs font-bold">{step.seconds}</p>
              <p className="text-[11px] mt-0.5">{step.label}</p>
            </div>
          ))}
        </div>
        <SectionHeader>TCAS Self-Test</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Initiated by pressing <strong>TEST</strong> line select key on CDU TCAS CONTROL page</KeyPoint>
          <KeyPoint>Takes approximately <strong>10 seconds</strong> to complete</KeyPoint>
          <KeyPoint>Tests: TCAS receiver-transmitter, Mode S transponders, TCAS antennas, radio altimeter, heading data, TCAS displays</KeyPoint>
          <KeyPoint>Success: <strong>"TCAS SYSTEM TEST OK"</strong> broadcast over cockpit audio</KeyPoint>
          <KeyPoint>Failure: <strong>"TCAS SYSTEM TEST FAIL"</strong> heard — turn TCAS OFF</KeyPoint>
        </ul>
        <Warning>Using self-test in flight inhibits TCAS and Transponder for up to 20 seconds depending on the number of aircraft being tracked.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §B.16 & §C.8</Note>
      </div>
    ),
  },
  {
    id: "m1-s5",
    title: "TCAS Modes",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          TCAS mode is selected from the <strong className="text-foreground">CDU TUNE page</strong> or <strong className="text-foreground">CDU TCAS CONTROL page</strong>. Three modes are available:
        </p>
        <div className="space-y-2 mt-2">
          {[
            {
              mode: "TA/RA",
              label: "Traffic & Resolution Advisories",
              desc: "Full TCAS operation. Active intruder traffic displayed on MFD. RA guidance on PFD VSI scale. TCAS coordinates with other TCAS aircraft via Mode S.",
              color: "border-green-500/30 bg-green-500/5",
              badge: "bg-green-500/20 text-green-300",
            },
            {
              mode: "TA ONLY",
              label: "Traffic Advisories Only",
              desc: "Active intruder traffic displayed on MFD. No RA fly-to commands on PFD VSI. RA traffic is shown as TA traffic on MFD. Required after engine failure when time permits.",
              color: "border-amber-500/30 bg-amber-500/5",
              badge: "bg-amber-500/20 text-amber-300",
            },
            {
              mode: "STBY",
              label: "Standby",
              desc: "No traffic shown on displays. No RAs issued. Does NOT reply to other aircraft TCAS interrogations. 'TCAS OFF' shown in white on PFD. Set automatically when transponder not in ALT reporting mode.",
              color: "border-border bg-muted/20",
              badge: "bg-muted text-muted-foreground",
            },
          ].map((item, i) => (
            <div key={i} className={`p-3 rounded-lg border ${item.color}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.badge}`}>{item.mode}</span>
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §C.7 TCAS Modes</Note>
      </div>
    ),
  },
  {
    id: "m1-s6",
    title: "Dual Mode S Transponders",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The B200 is fitted with <strong className="text-foreground">two TDR-94D Mode S Transponders</strong>. They respond to Mode A, Mode C and Mode S interrogations from ATC radar and from other TCAS-equipped aircraft.
        </p>
        <SectionHeader>Key Capabilities of Mode S</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Can be <strong>discretely addressed</strong> — TCAS II can direct interrogations to a specific aircraft</KeyPoint>
          <KeyPoint>Sends and receives <strong>data link messages</strong> for TCAS II RA coordination</KeyPoint>
          <KeyPoint>Operates from <strong>two antennas</strong> (top and bottom) for diversity</KeyPoint>
          <KeyPoint>Enhanced Surveillance parameters transmitted per Appendix A of the AFMS</KeyPoint>
        </ul>
        <SectionHeader>Normal Operation — Transponder Selection</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>The <strong>1/2 switch</strong> on the CDU ATC CONTROL page selects which transponder is active</KeyPoint>
          <KeyPoint>If <strong>ACT light flashes continuously</strong> with switch in position 1 → select position 2 (or conversely)</KeyPoint>
        </ul>
        <Warning>If both ALTN AUDIO switches are required to be turned on, TCAS must be turned OFF — select STBY or OFF on the TCAS Control. TCAS will no longer be operable.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 1, §A; Section 2, §B; Section 3A, §A.1</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — Traffic Types & Display Symbology
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_2_SLIDES: SlideContent[] = [
  {
    id: "m2-s1",
    title: "Four Traffic Classifications",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          TCAS classifies all nearby transponder-equipped aircraft into one of <strong className="text-foreground">four categories</strong> based on threat level. Each has a unique symbol and colour on the MFD Traffic Display.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <TrafficSymbol type="RA" />
          <TrafficSymbol type="TA" />
          <TrafficSymbol type="PT" />
          <TrafficSymbol type="OT" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          A <strong className="text-foreground">VS Arrow</strong> is displayed to the right of the traffic symbol for intruders with vertical speed ≥ ±500 FPM. Altitude data (relative or actual) is displayed above/below the symbol.
        </p>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 1, §C Traffic Types & Traffic Detail diagram</Note>
      </div>
    ),
  },
  {
    id: "m2-s2",
    title: "OT — Other Traffic",
    body: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="w-7 h-7 border-2 border-cyan-400 flex-shrink-0" style={{ transform: "rotate(45deg)" }} />
          <div>
            <p className="text-sm font-bold text-cyan-400">Cyan Hollow Diamond — Other Traffic (OT)</p>
            <p className="text-xs text-muted-foreground">Non-threat traffic within selected display range and altitude</p>
          </div>
        </div>
        <SectionHeader>Display Control</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>OT display can be <strong>turned ON or OFF</strong> from the CDU TCAS main display page</KeyPoint>
          <KeyPoint>OT Altitude window — <strong>NORMAL</strong> (default): ±2700 ft of own altitude</KeyPoint>
          <KeyPoint><strong>ABOVE</strong>: extends upper window to 9900 ft above own altitude</KeyPoint>
          <KeyPoint><strong>BELOW</strong>: extends lower window to 9900 ft below own altitude</KeyPoint>
          <KeyPoint>ABOVE + BELOW combined: ±9900 ft coverage</KeyPoint>
        </ul>
        <SectionHeader>Important</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          OT is <strong className="text-foreground">non-threat</strong> traffic — TCAS has determined it does not pose an imminent conflict. No advisory is issued for OT targets.
        </p>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §B.1 Other Traffic (OT)</Note>
      </div>
    ),
  },
  {
    id: "m2-s3",
    title: "PT — Proximate Traffic",
    body: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="w-7 h-7 bg-cyan-400 flex-shrink-0" style={{ transform: "rotate(45deg)" }} />
          <div>
            <p className="text-sm font-bold text-cyan-400">Cyan Filled Diamond — Proximate Traffic (PT)</p>
            <p className="text-xs text-muted-foreground">Close aircraft — not a threat, but awareness required</p>
          </div>
        </div>
        <SectionHeader>Definition</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Within <strong>±1200 ft relative altitude</strong></KeyPoint>
          <KeyPoint>Within <strong>6 nautical miles</strong> of own aircraft</KeyPoint>
          <KeyPoint>CPA (Closest Point of Approach) determined by TCAS computer to be <strong>NOT a threat</strong></KeyPoint>
        </ul>
        <SectionHeader>Display Behaviour</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>PT traffic <strong>always shows</strong> on the traffic display when TA and RA traffic are present</KeyPoint>
          <KeyPoint>Aids pilots in <strong>visually acquiring</strong> the traffic</KeyPoint>
          <KeyPoint>No advisory issued — visual awareness only</KeyPoint>
        </ul>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §B.2 Proximate Traffic (PT)</Note>
      </div>
    ),
  },
  {
    id: "m2-s4",
    title: "TA — Traffic Alert",
    body: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="w-7 h-7 rounded-full bg-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-yellow-400">Yellow Filled Circle — Traffic Alert (TA)</p>
            <p className="text-xs text-muted-foreground">Intruder developing into a collision threat</p>
          </div>
        </div>
        <SectionHeader>When Issued</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Traffic within approximately <strong>40 seconds</strong> of projected Closest Point of Approach (CPA)</KeyPoint>
          <KeyPoint>Aural: <strong>"TRAFFIC, TRAFFIC"</strong> over cockpit audio</KeyPoint>
          <KeyPoint>Visual: Yellow circle on MFD; <strong>"TRAFFIC"</strong> in yellow below VS scale on PFD</KeyPoint>
          <KeyPoint>Warning period: <strong>48 to 20 seconds</strong> before CPA depending on closure rate</KeyPoint>
        </ul>
        <SectionHeader>Required Crew Response</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Conduct a <strong>visual search</strong> for the intruder</KeyPoint>
          <KeyPoint>If acquired visually, <strong>maintain visual acquisition</strong> to ensure safe separation</KeyPoint>
        </ul>
        <Warning>Do NOT initiate evasive manoeuvres based on the traffic display alone or on a TA only — without visually sighting the traffic. The display is for visual acquisition assistance only.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §B.3 & §E; Section 4, §C.6</Note>
      </div>
    ),
  },
  {
    id: "m2-s5",
    title: "RA — Resolution Advisory",
    body: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="w-7 h-7 bg-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">Red Filled Square — Resolution Advisory (RA)</p>
            <p className="text-xs text-muted-foreground">Immediate threat — vertical manoeuvre required</p>
          </div>
        </div>
        <SectionHeader>When Issued</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Intruder within approximately <strong>25 seconds</strong> of CPA</KeyPoint>
          <KeyPoint>Penetrates protected airspace: <strong>35–15 seconds</strong> before CPA depending on closure rate</KeyPoint>
          <KeyPoint>Provides <strong>recommended vertical manoeuvre</strong> — fly the GREEN arc on the VSI</KeyPoint>
        </ul>
        <SectionHeader>Types of RA</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint><strong>Corrective RA</strong> — requires immediate vertical speed change to avoid traffic</KeyPoint>
          <KeyPoint><strong>Preventive RA</strong> — current vertical speed resolves threat; maintain it and stay out of RED zone</KeyPoint>
        </ul>
        <SectionHeader>Coordination</SectionHeader>
        <p className="text-sm text-muted-foreground">TCAS II automatically coordinates with the intruder aircraft via <strong className="text-foreground">Mode S data link</strong> — if you get CLIMB, the intruder gets DESCEND.</p>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §B.4 & §F</Note>
      </div>
    ),
  },
  {
    id: "m2-s6",
    title: "Traffic Display — Range & Altitude",
    body: (
      <div className="space-y-4">
        <SectionHeader>Display Range</SectionHeader>
        <div className="grid grid-cols-4 gap-2">
          {["5 nmi", "10 nmi", "25 nmi", "50 nmi"].map((r, i) => (
            <div key={i} className={`p-2 rounded-lg text-center text-xs font-semibold border ${i === 1 ? "bg-orange-500/20 border-orange-500/30 text-orange-300" : "bg-card border-border text-muted-foreground"}`}>
              {r}{i === 1 && <p className="font-normal text-[10px] mt-0.5">Auto-set on TCAS select</p>}
            </div>
          ))}
        </div>
        <SectionHeader>Special Display Cases</SectionHeader>
        <Table
          headers={["Situation", "Display"]}
          rows={[
            ["No Bearing Traffic", "First 2 TA/RA intruders without calculable bearing → textual table, lower-right MFD"],
            ["Out of Range Traffic", "TA/RA symbols at edge of display (half visible) + data table"],
            ["Max tracked aircraft", "Up to 32 transponder-equipped aircraft tracked simultaneously"],
          ]}
        />
        <SectionHeader>Range Ring Symbology</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Full-range ring with 12 cardinal marks; half-range ring with 12 marks</KeyPoint>
          <KeyPoint>3 nmi ring (12 small tick marks) shown when range = 5, 10 or 25 nmi</KeyPoint>
          <KeyPoint>When overlaid on Rose/ARC maps: TCAS targets only shown within <strong>50 nmi</strong></KeyPoint>
        </ul>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §C.1–§C.6</Note>
      </div>
    ),
  },
  {
    id: "m2-s7",
    title: "TCAS Messages on PFD & MFD",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">The following messages appear on the PFD and/or MFD:</p>
        <Table
          headers={["Message", "Colour", "Display", "Meaning"]}
          rows={[
            ["TRAFFIC", "RED", "PFD — below VS scale", "RA traffic detected"],
            ["TRAFFIC", "YELLOW", "PFD — below VS scale", "TA traffic detected"],
            ["TA ONLY", "WHITE", "PFD — below VS scale", "TCAS in TA ONLY mode — no TA intruders"],
            ["TA ONLY", "YELLOW", "PFD — below VS scale", "TCAS in TA ONLY mode — TA traffic detected"],
            ["TCAS TEST", "WHITE", "PFD & MFD centre", "Self-test is active"],
            ["TCAS OFF", "WHITE", "PFD — below VS scale", "TCAS in standby (STBY) mode"],
            ["TCAS FAIL", "YELLOW", "PFD & MFD", "TCAS fault detected — no traffic or RA displayed"],
            ["TD FAIL", "YELLOW", "MFD only", "MFD unable to display TCAS traffic information"],
          ]}
        />
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §B.1.a–f TCAS Messages</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — Normal Procedures & In-Flight Operation
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_3_SLIDES: SlideContent[] = [
  {
    id: "m3-s1",
    title: "TCAS In-Flight Inhibit Altitudes",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          TCAS automatically inhibits certain advisories near the ground to prevent nuisance alerts during approach and departure:
        </p>
        <Table
          headers={["Limit / Mode", "Climbing", "Descending"]}
          rows={[
            ["TA Aural inhibited", "Below 600 ft AGL", "Below 400 ft AGL"],
            ['"DESCEND" RA inhibited', "Below 1200 ft AGL", "Below 1000 ft AGL"],
            ['"INCREASE DESCENT" RA inhibited', "Below 1550 ft AGL", "Below 1450 ft AGL"],
            ["All RAs inhibited (auto TA/TA ONLY)", "Below 1100 ft AGL", "Below 900 ft AGL"],
          ]}
        />
        <SectionHeader>Visual TA Continues</SectionHeader>
        <p className="text-sm text-muted-foreground">
          Even when aural TA is inhibited below the above thresholds, visual <strong className="text-foreground">'TRAFFIC'</strong> messages will continue to be issued on the PFD.
        </p>
        <SectionHeader>GPWS Priority</SectionHeader>
        <p className="text-sm text-muted-foreground">
          TCAS automatically switches to <strong className="text-foreground">TA or TA ONLY mode</strong> when the Enhanced Ground Proximity Warning System (GPWS) is active — to allow GPWS higher advisory priority.
        </p>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §C.4, §C.5; Section 4, §D table</Note>
      </div>
    ),
  },
  {
    id: "m3-s2",
    title: "ALT LIMITS & Traffic Display Selection",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The display can be tailored using <strong className="text-foreground">TRAFFIC</strong> and <strong className="text-foreground">ALT LIMITS</strong> on the TCAS page via the DCP:
        </p>
        <SectionHeader>ALT LIMITS Selections</SectionHeader>
        <div className="space-y-2">
          {[
            { mode: "NORM", desc: "Traffic located ±2700 ft of your altitude (default)", badge: "bg-blue-500/20 text-blue-300" },
            { mode: "ABOVE", desc: "Traffic from 2700 ft below to 9900 ft ABOVE your altitude", badge: "bg-green-500/20 text-green-300" },
            { mode: "BELOW", desc: "Traffic from 2700 ft above to 9900 ft BELOW your altitude", badge: "bg-amber-500/20 text-amber-300" },
            { mode: "ABOVE + BELOW", desc: "Coverage ±9900 ft of your altitude", badge: "bg-purple-500/20 text-purple-300" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${item.badge}`}>{item.mode}</span>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
        <SectionHeader>TRAFFIC Selection</SectionHeader>
        <p className="text-sm text-muted-foreground">Selecting TRAFFIC to ON will present additional targets outside the TA/RA envelope as defined by the ALT LIMITS selection.</p>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §C.3</Note>
      </div>
    ),
  },
  {
    id: "m3-s3",
    title: "Responding to a TA",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-orange-400">Traffic Advisory (TA)</strong> is a warning that a collision threat is developing. It prepares you to respond but does not command a vertical manoeuvre.
        </p>
        <div className="space-y-2">
          {[
            { step: "1", action: "Acknowledge the aural alert", detail: '"TRAFFIC, TRAFFIC"', color: "border-orange-500/30" },
            { step: "2", action: "Visually search for the intruder", detail: "Use the MFD traffic display to determine bearing and relative position", color: "border-orange-500/30" },
            { step: "3", action: "Establish visual contact", detail: "Maintain visual acquisition to ensure safe separation", color: "border-orange-500/30" },
            { step: "4", action: "Prepare for possible RA", detail: "Be ready to respond immediately if advisory escalates to RA within ~25s CPA", color: "border-orange-500/30" },
          ].map((item, i) => (
            <div key={i} className={`flex gap-3 p-3 rounded-lg bg-card border ${item.color}`}>
              <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
              <div>
                <p className="text-xs font-semibold">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Warning>Do NOT initiate evasive manoeuvres based on traffic display information alone, or on a TA only. Visual TA displays are intended to ASSIST in locating traffic — not to guide evasive manoeuvres.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §C.6; Section 7, §E</Note>
      </div>
    ),
  },
  {
    id: "m3-s4",
    title: "Responding to an RA — Standard",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-red-400">Resolution Advisory (RA)</strong> requires immediate pilot action. The RA algorithms are based on you initiating the manoeuvre within <strong className="text-foreground">5 seconds</strong>.
        </p>
        <SectionHeader>Standard RA Response — Manoeuvre Required</SectionHeader>
        <div className="space-y-2">
          {[
            { label: "AUTOPILOT", action: "DISCONNECT" },
            { label: "PITCH", action: "AS REQUIRED TO COMPLY WITH RA" },
            { label: "POWER", action: "AS REQUIRED" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border">
              <span className="text-xs font-bold text-orange-400 w-20 flex-shrink-0">{item.label}</span>
              <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-semibold">{item.action}</span>
            </div>
          ))}
        </div>
        <SectionHeader>Key Principles</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Fly the <strong>GREEN arc</strong> — avoid the <strong>RED arc</strong> on the VSI</KeyPoint>
          <KeyPoint>Respond <strong>immediately and smoothly</strong> — initial 0.25g manoeuvre within ~5 seconds</KeyPoint>
          <KeyPoint>Corrective RAs (increase or reversal) require response within <strong>~2.5 seconds</strong></KeyPoint>
          <KeyPoint>Limit deviation to <strong>minimum required</strong> — typically 300–500 ft altitude change resolves conflict</KeyPoint>
          <KeyPoint>After <strong>"CLEAR OF CONFLICT"</strong> — expeditiously return to ATC clearance altitude</KeyPoint>
        </ul>
        <Warning>TCAS annunciation has PRIORITY over flight profile advisory annunciations. Do not ignore an RA to comply with a profile advisory.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §C.7–§C.14</Note>
      </div>
    ),
  },
  {
    id: "m3-s5",
    title: "RA During Landing Configuration",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-orange-400">CLIMB RA</strong> issued while configured for landing requires a <strong className="text-foreground">balked landing (go-around)</strong> procedure:
        </p>
        <div className="space-y-2">
          {[
            { label: "AUTOPILOT", action: "DISCONNECT" },
            { label: "POWER", action: "GO AROUND POWER" },
            { label: "FLAPS", action: "RETRACT TO GO AROUND POSITION" },
            { label: "PITCH", action: "AS REQUIRED TO COMPLY WITH RA" },
            { label: "GEAR", action: "UP WITH POSITIVE RATE OF CLIMB" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border">
              <span className="text-xs font-bold text-orange-400 w-20 flex-shrink-0">{item.label}</span>
              <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-semibold">{item.action}</span>
            </div>
          ))}
        </div>
        <Warning>
          Care has been taken to ensure airplane capability to comply with RAs under most normal circumstances. However, TCAS II may command manoeuvres that could significantly reduce stall margins when: bank angle exceeds 15°, one engine is inoperative, leaving airplane in inappropriate configurations during climb RA, operating at airports outside 0–5300 ft MSL or temperatures outside ISA 27.8°C, or speeds below normal operating speeds. Respect the stall warning horn when following an RA.
        </Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §C.8 & §C.11.b</Note>
      </div>
    ),
  },
  {
    id: "m3-s6",
    title: "Softening RA & Return to Clearance",
    body: (
      <div className="space-y-4">
        <SectionHeader>RA Softening — Corrective → Preventive</SectionHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          After the corrective RA is satisfied, it may <strong className="text-foreground">"soften"</strong> to a preventive advisory:
        </p>
        <ul className="space-y-2">
          <KeyPoint>The <strong>green arc is removed</strong> — the red arc decreases in magnitude</KeyPoint>
          <KeyPoint>Aural command: <strong>"MONITOR VERTICAL SPEED"</strong></KeyPoint>
          <KeyPoint>The new preventive RA <strong>restricts the rate</strong> at which you may return to original flight path</KeyPoint>
          <KeyPoint>Using the softening advisory <strong>greatly reduces the ultimate altitude deviation</strong></KeyPoint>
        </ul>
        <SectionHeader>After "CLEAR OF CONFLICT"</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>VSI red and green areas are <strong>removed</strong></KeyPoint>
          <KeyPoint><strong>Expeditiously return</strong> to applicable ATC clearance — unless otherwise directed by ATC</KeyPoint>
        </ul>
        <SectionHeader>Engine Failure — TA ONLY Required</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>When time permits after engine failure → select <strong>TA ONLY</strong> mode via CDU TCAS CONTROL page</KeyPoint>
          <KeyPoint>RAs are predicated on <strong>all engines operating</strong> — RA climb performance may not be achievable engine-out</KeyPoint>
        </ul>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §C.10, §C.13; Section 3, §B</Note>
      </div>
    ),
  },
  {
    id: "m3-s7",
    title: "ATC Coordination & Transponder Altitude Reporting",
    body: (
      <div className="space-y-4">
        <SectionHeader>When ATC Requests Altitude Reporting Disable</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Select <strong>ALT OFF</strong> on the CDU ATC CONTROL page</KeyPoint>
          <KeyPoint>This <strong>automatically</strong> places TCAS in standby (STBY) mode</KeyPoint>
          <KeyPoint><strong>"TCAS OFF"</strong> displayed on PFD and MFD</KeyPoint>
        </ul>
        <SectionHeader>Pilot Authority</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Pilots are <strong>authorised to deviate</strong> from ATC clearance to the extent necessary to comply with a TCAS II RA</KeyPoint>
          <KeyPoint>TCAS is a <strong>backup system</strong> — it complements, not replaces, ATC radar separation</KeyPoint>
          <KeyPoint>After an RA — expeditiously <strong>return to ATC clearance</strong> unless otherwise directed</KeyPoint>
        </ul>
        <SectionHeader>Crossing vs. Non-Crossing RAs</SectionHeader>
        <Warning>Noncompliance with a crossing RA by one airplane may result in reduced vertical separation — safe horizontal separation must also be assured by visual means.</Warning>
        <Note>Once a non-crossing RA is issued, do not change vertical speed except as needed to comply. TCAS II to TCAS II coordination may be in progress — changing VS may negate the other aircraft's RA compliance.</Note>
        <div className="mt-1">
          <Note>Source: AFMS FS2026-576 Rev 2 — Section 2, §A; Section 4, §C.13–§C.15</Note>
        </div>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — Resolution & Traffic Advisory Details
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_4_SLIDES: SlideContent[] = [
  {
    id: "m4-s1",
    title: "Reading the PFD VSI During an RA",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          When an RA is active, the PFD vertical speed scale shows <strong className="text-red-400">RED</strong> (prohibited) and <strong className="text-green-400">GREEN</strong> (acceptable) bands. <strong className="text-foreground">Fly the GREEN. Avoid the RED.</strong>
        </p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <VSIDisplay type="climb" />
          <VSIDisplay type="descend" />
          <VSIDisplay type="monitor" />
          <VSIDisplay type="clear" />
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §B.4 & §F RA Annunciations</Note>
      </div>
    ),
  },
  {
    id: "m4-s2",
    title: "Standard RA Aural Commands & Responses",
    body: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">All corrective RAs require prompt and smooth response — target vertical speed and response listed below:</p>
        <Table
          headers={["Aural Command", "VSI", "Crew Response"]}
          rows={[
            [
              <span key="c1" className="font-bold">"CLIMB, CLIMB"</span>,
              <div key="v1" className="flex items-center gap-1"><span className="text-red-400 text-xs">RED: −6000→+1500</span><span className="text-green-400 text-xs ml-1">GREEN: +1500→+2000</span></div>,
              "≥1500 FPM CLIMB — fly the green arc",
            ],
            [
              <span key="c2" className="font-bold">"DESCEND, DESCEND"</span>,
              <div key="v2" className="flex items-center gap-1"><span className="text-red-400 text-xs">RED: +6000→−1500</span><span className="text-green-400 text-xs ml-1">GREEN: −1500→−2000</span></div>,
              "≥1500 FPM DESCENT — fly the green arc",
            ],
            [
              <span key="c3">"MONITOR VERTICAL SPEED"</span>,
              <span key="v3" className="text-xs">Present VS outside RED arc</span>,
              "Be alert — keep VS out of RED zone",
            ],
            [
              <span key="c4">"ADJUST VERTICAL SPEED… ADJUST"</span>,
              <span key="v4" className="text-xs">Prohibited VS in RED; goal in GREEN</span>,
              "Smoothly reduce VS to GREEN arc (RA weakening)",
            ],
            [
              <span key="c5">"MAINTAIN VERTICAL SPEED… MAINTAIN"</span>,
              <span key="v5" className="text-xs">Acceptable VS in GREEN</span>,
              "Keep VS in GREEN — stay out of RED",
            ],
            [
              <span key="c6">"CLEAR OF CONFLICT"</span>,
              <span key="v6" className="text-xs">RED & GREEN removed</span>,
              "Return to ATC clearance altitude",
            ],
          ]}
        />
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §F RA Annunciations Table</Note>
      </div>
    ),
  },
  {
    id: "m4-s3",
    title: "Crossing RAs",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-foreground">Crossing RA</strong> indicates that your flight path will cross that of the intruder during the manoeuvre. The aural commands add <strong className="text-orange-400">"CROSSING"</strong> to indicate this:
        </p>
        <Table
          headers={["Aural Command", "Meaning", "Response"]}
          rows={[
            [
              '"CLIMB, CROSSING CLIMB, CLIMB, CROSSING CLIMB"',
              "Same as CLIMB — plus your path will cross the intruder",
              "≥1500 FPM CLIMB",
            ],
            [
              '"DESCEND, CROSSING DESCEND, DESCEND, CROSSING DESCEND"',
              "Same as DESCEND — plus your path will cross the intruder",
              "≥1500 FPM DESCENT",
            ],
            [
              '"MAINTAIN VERTICAL SPEED… CROSSING MAINTAIN"',
              "Same as MAINTAIN — plus path crossing indicated",
              "Keep VS in GREEN — stay out of RED",
            ],
          ]}
        />
        <Warning>Noncompliance with a crossing RA by one airplane may result in reduced vertical separation. Safe horizontal separation must also be assured by visual means.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §F & crossing RA WARNING</Note>
      </div>
    ),
  },
  {
    id: "m4-s4",
    title: "Enhanced Resolution Advisories",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enhanced RAs are issued when the <strong className="text-foreground">initial RA did not provide sufficient vertical separation</strong>. They denote <strong className="text-red-400">increased urgency</strong> — respond promptly and positively.
        </p>
        <Table
          headers={["Enhanced Aural", "Follows", "Required VS", "Response"]}
          rows={[
            [
              '"INCREASE CLIMB, INCREASE CLIMB"',
              "CLIMB advisory",
              "≥2500 FPM CLIMB (GREEN: +2500→+3500)",
              "Promptly increase climb to ≥2500 FPM",
            ],
            [
              '"INCREASE DESCENT, INCREASE DESCENT"',
              "DESCEND advisory",
              "≥2500 FPM DESCENT (GREEN: −2500→−3500)",
              "Promptly increase descent to ≥2500 FPM",
            ],
            [
              '"CLIMB, CLIMB NOW, CLIMB, CLIMB NOW"',
              "DESCEND advisory",
              "Reversal to ≥1500 FPM CLIMB",
              "Positively reverse to ≥1500 FPM CLIMB",
            ],
            [
              '"DESCEND, DESCEND NOW, DESCEND, DESCEND NOW"',
              "CLIMB advisory",
              "Reversal to ≥1500 FPM DESCENT",
              "Positively reverse to ≥1500 FPM DESCENT",
            ],
          ]}
        />
        <Warning>Enhanced RAs require a more aggressive response than initial RAs. The "CLIMB/DESCEND NOW" commands require a full reversal of vertical direction — act immediately.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §G Enhanced RA Annunciations</Note>
      </div>
    ),
  },
  {
    id: "m4-s5",
    title: "RA Types — Corrective vs Preventive",
    body: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs font-bold text-red-400 mb-2">CORRECTIVE RA</p>
            <ul className="space-y-1.5">
              <li className="text-xs text-muted-foreground leading-snug">• Requires immediate <strong className="text-foreground">change in vertical speed</strong></li>
              <li className="text-xs text-muted-foreground leading-snug">• Computer determined <strong className="text-foreground">corrective action needed</strong> to avoid traffic</li>
              <li className="text-xs text-muted-foreground leading-snug">• Examples: CLIMB, DESCEND, INCREASE CLIMB</li>
              <li className="text-xs text-muted-foreground leading-snug">• Fly the GREEN arc on VSI</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs font-bold text-amber-400 mb-2">PREVENTIVE RA</p>
            <ul className="space-y-1.5">
              <li className="text-xs text-muted-foreground leading-snug">• Current vertical speed will resolve the threat</li>
              <li className="text-xs text-muted-foreground leading-snug">• Do NOT enter the <strong className="text-foreground">RED zone</strong> — maintain current VS</li>
              <li className="text-xs text-muted-foreground leading-snug">• Example: MONITOR VERTICAL SPEED</li>
              <li className="text-xs text-muted-foreground leading-snug">• Aural issues MONITOR VERTICAL SPEED command</li>
            </ul>
          </div>
        </div>
        <SectionHeader>RA Vertical Speed Diagrams</SectionHeader>
        <p className="text-sm text-muted-foreground">The AFMS includes 8 types of corrective RA VSI presentations — Climb Preventive, Descend Preventive, Climb Corrective, Descend Corrective, and combined versions where a softening RA is displayed alongside the original.</p>
        <p className="text-xs text-orange-400 mt-1">→ Reference Section 4, §C — Examples of various RA (Page 8 diagram)</p>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 7, §B.4 RA types</Note>
      </div>
    ),
  },
  {
    id: "m4-s6",
    title: "RA Scenario Drill — Engine Fire at FL180",
    body: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <p className="text-xs font-bold text-orange-400 mb-1">SCENARIO</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your B200 is cruising at FL180. Engine #1 has failed. You have declared MAYDAY and ATC is providing traffic. Suddenly the TCAS issues: <strong className="text-foreground">"CLIMB, CLIMB"</strong>. The PFD VSI shows RED from −6000 to +1500 FPM and GREEN from +1500 to +2000 FPM.
          </p>
        </div>
        <SectionHeader>What do you do?</SectionHeader>
        <div className="space-y-2">
          {[
            { q: "Is compliance mandatory?", a: "Yes — you are authorised to deviate from ATC clearance to comply with the RA. Do not ignore it because of the engine failure." },
            { q: "Is RA climb achievable?", a: "Possibly not — RAs are predicated on all engines operating. Select TA ONLY mode when time permits after engine failure." },
            { q: "Immediate action?", a: "Disconnect autopilot, pitch as required, apply as much power as available on the operating engine. Stall warning horn must be respected." },
            { q: "After CLEAR OF CONFLICT?", a: "Expeditiously return to ATC-assigned altitude unless otherwise directed. Advise ATC of the RA you received." },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-xs font-semibold text-orange-400 mb-1">{item.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 3, §B Emergency; Section 4, §C.8 & §C.11</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — Emergency, Abnormal & Limitations
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_5_SLIDES: SlideContent[] = [
  {
    id: "m5-s1",
    title: "Limitations — Section 2",
    body: (
      <div className="space-y-4">
        <SectionHeader>TCAS II System Limitations</SectionHeader>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-card border border-orange-500/30">
            <p className="text-xs font-bold text-orange-400 mb-1">Limitation A.1</p>
            <p className="text-xs text-muted-foreground">Pilots are authorised to deviate from their current ATC clearance to the extent necessary to comply with a TCAS II resolution advisory (RA).</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-orange-500/30">
            <p className="text-xs font-bold text-orange-400 mb-1">Limitation A.2</p>
            <p className="text-xs text-muted-foreground">If flight crew is advised by ATC to disable transponder altitude reporting, TCAS must be turned off by using the CDU ATC CONTROL page — select Mode S transponder to ON and TCAS off. <strong className="text-foreground">'TCAS OFF'</strong> will be displayed on PFD and MFD.</p>
          </div>
        </div>
        <SectionHeader>Mode S Transponder — Enhanced Surveillance (Limitation B)</SectionHeader>
        <p className="text-sm text-muted-foreground">The aircraft transponder system will transmit the parameters shown in <strong className="text-foreground">Appendix A</strong> (Additional Limitations and Information for Certification) of the AFMS supplement.</p>
        <Warning>These limitations are FAA-approved and mandatory. Non-compliance with Limitation A.1 (RA compliance authority) or A.2 (transponder altitude disable procedure) constitutes a regulatory violation.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 2, Limitations</Note>
      </div>
    ),
  },
  {
    id: "m5-s2",
    title: "Emergency Procedures",
    body: (
      <div className="space-y-4">
        <SectionHeader>Mode S Transponder System — Emergency</SectionHeader>
        <p className="text-sm text-muted-foreground">No change from basic AFM procedures for the Mode S Transponder System.</p>
        <SectionHeader>TCAS II System — Engine Failure Emergency</SectionHeader>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-bold text-red-400 mb-2">In the event of an engine failure:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">When time permits, using the CDU TCAS CONTROL page, select <strong className="text-foreground">"TA ONLY"</strong> mode.</p>
        </div>
        <Warning>RAs are predicated on ALL engines operating. RA climb performance may not be achievable during engine out operation. Selecting TA ONLY prevents potentially dangerous climb RA commands that cannot be met single-engine.</Warning>
        <SectionHeader>Sequence for Engine Failure + TCAS</SectionHeader>
        <div className="space-y-1.5">
          {[
            "Complete engine failure memory items — ENGINE FIRE / FAILURE drill",
            "Aircraft under control — then when time permits:",
            "CDU → TCAS CONTROL page → select TA ONLY mode",
            "Advise ATC of engine failure and TA ONLY TCAS status",
            "Monitor traffic via MFD traffic display",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-orange-400 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-xs text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 3, §B TCAS II Emergency Procedures</Note>
      </div>
    ),
  },
  {
    id: "m5-s3",
    title: "Abnormal Procedures — TCAS FAIL",
    body: (
      <div className="space-y-4">
        <SectionHeader>TCAS FAIL Annunciation</SectionHeader>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-3">
          <p className="text-xs font-bold text-red-400">Trigger: <span className="font-normal">'TCAS FAIL' shown in yellow on PFD/MFD <strong>OR</strong> 'TCAS SYSTEM TEST FAIL' audio heard</span></p>
        </div>
        <div className="space-y-2">
          {[
            { label: "TCAS", action: "TURN OFF" },
            { label: "CDU ATC CONTROL page", action: 'Select "STBY"' },
            { label: "Result", action: "TCAS will no longer be operable" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border">
              <span className="text-xs font-bold text-red-400 w-40 flex-shrink-0">{item.label}</span>
              <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-semibold">{item.action}</span>
            </div>
          ))}
        </div>
        <SectionHeader>ADC or Radio Altimeter Failure</SectionHeader>
        <div className="p-2.5 rounded-lg bg-card border border-border flex items-center gap-3">
          <span className="text-xs font-bold text-red-400 w-40 flex-shrink-0">ADC or RAD ALT inop</span>
          <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-semibold">Turn TCAS OFF — TCAS will no longer be operable</span>
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 3A, §B.1–§B.2</Note>
      </div>
    ),
  },
  {
    id: "m5-s4",
    title: "Abnormal Procedures — Transponder & Display Failures",
    body: (
      <div className="space-y-4">
        <SectionHeader>Dual Mode S Transponder Fault</SectionHeader>
        <Table
          headers={["Symptom", "Action"]}
          rows={[
            ["ACT light flashes continuously with switch in position 1", "Select position 2 (or conversely)"],
            ["ACT light flashes with switch in position 2 also", "Turn both to STBY — advise ATC"],
          ]}
        />
        <SectionHeader>RA Flag on PFD</SectionHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">If the RA flag appears on either PFD:</p>
          <ul className="space-y-1.5">
            <KeyPoint>First verify TCAS control mode is set to <strong>TA/RA</strong></KeyPoint>
            <KeyPoint>If RA flag persists → pilot with <strong>operable PFD</strong> (no RA OFF flag) conducts subsequent RA manoeuvres</KeyPoint>
          </ul>
        </div>
        <SectionHeader>V/S Flag on PFD</SectionHeader>
        <ul className="space-y-1.5">
          <KeyPoint>Pilot with <strong>operable VSI</strong> (no V/S flag) conducts subsequent RA manoeuvres</KeyPoint>
        </ul>
        <SectionHeader>Both ALTN AUDIO Switches ON</SectionHeader>
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs font-semibold text-amber-300">If both ALTN AUDIO switches must be turned on → turn TCAS OFF (select STBY or OFF on TCAS Control)</p>
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 3A, §A.1 & §B.3–§B.6</Note>
      </div>
    ),
  },
  {
    id: "m5-s5",
    title: "TCAS Normal Operating Limits Table",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">The TCAS-4000 limits are set by aircraft wiring and software based on aircraft performance (climb rate, gear/flap positions). These limits determine when specific advisories are inhibited:</p>
        <Table
          headers={["Advisory Affected", "Inhibit Altitude (Climbing)", "Inhibit Altitude (Descending)"]}
          rows={[
            ['"INCREASE DESCENT" RA inhibited', "Below 1550 ft AGL", "Below 1450 ft AGL"],
            ['"DESCEND" RA inhibited', "Below 1200 ft AGL", "Below 1000 ft AGL"],
            ["All RAs inhibited (auto TA/TA ONLY)", "Below 1100 ft AGL", "Below 900 ft AGL"],
            ["TA Aural inhibited", "Below 600 ft AGL", "Below 400 ft AGL"],
          ]}
        />
        <SectionHeader>GPWS Advisory Priority</SectionHeader>
        <p className="text-sm text-muted-foreground">TCAS automatically changes to TA or TA ONLY mode to allow GPWS to provide higher priority terrain avoidance advisories.</p>
        <Warning>After an RA — always expeditiously return to the applicable ATC clearance unless otherwise directed by ATC. Excessive altitude deviations create additional conflict potential.</Warning>
        <Note>Source: AFMS FS2026-576 Rev 2 — Section 4, §D TCAS Normal Operating Characteristics table</Note>
      </div>
    ),
  },
  {
    id: "m5-s6",
    title: "Knowledge Check — Critical Rules",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Review these critical rules before taking the Pro Line 21 exam:</p>
        <div className="space-y-2">
          {[
            { rule: "14 nmi monitoring radius", detail: "TCAS II monitors at least 14 nmi around your aircraft" },
            { rule: "5 second initiation", detail: "Initiate RA manoeuvre within ~5 seconds; corrective increase/reversal within ~2.5 seconds" },
            { rule: "300–500 ft deviation", detail: "Typical altitude deviation from level flight to resolve a conflict" },
            { rule: "15 seconds after power loss", detail: "Allow ~15s before TCAS shows traffic (10s self-test + 5s acquisition)" },
            { rule: "Engine failure → TA ONLY", detail: "Select TA ONLY when time permits — RAs predicated on all engines operating" },
            { rule: "No RA from TA alone", detail: "Never initiate evasive manoeuvre from traffic display or TA only — visual acquisition only" },
            { rule: "GPWS > TCAS priority", detail: "TCAS automatically gives priority to GPWS advisories" },
            { rule: "TCAS FAIL → STBY", detail: "Turn TCAS off and select STBY — TCAS will no longer be operable" },
            { rule: "ADC/Rad Alt failure → OFF", detail: "If Air Data Computer or Radio Altimeter inoperable, TCAS must be turned off" },
            { rule: "ALT OFF = TCAS STBY", detail: "Selecting ALT OFF on transponder automatically places TCAS in standby" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border">
              <CheckCircle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-400">{item.rule}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Note>Source: AFMS FS2026-576 Rev 2 — All Sections</Note>
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
    title: "System Overview & Hardware",
    subtitle: "TCAS-4000 components, Mode S transponders, system modes and self-test",
    color: "text-orange-400",
    bg: "bg-orange-500/5",
    border: "border-orange-500/30",
    bar: "bg-orange-500",
    icon: <Radio size={18} />,
    slides: MODULE_1_SLIDES,
  },
  {
    id: "m2",
    number: 2,
    title: "Traffic Types & Display Symbology",
    subtitle: "OT, PT, TA, RA symbols; traffic display; TCAS messages and range",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/30",
    bar: "bg-blue-500",
    icon: <Eye size={18} />,
    slides: MODULE_2_SLIDES,
  },
  {
    id: "m3",
    number: 3,
    title: "Normal Procedures & In-Flight Operation",
    subtitle: "TA/RA response, ALT LIMITS, inhibit altitudes, ATC coordination",
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
    title: "Resolution & Traffic Advisory Details",
    subtitle: "All RA types, enhanced RAs, VSI guidance, crossing RAs, corrective vs preventive",
    color: "text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/30",
    bar: "bg-red-500",
    icon: <ArrowUp size={18} />,
    slides: MODULE_4_SLIDES,
  },
  {
    id: "m5",
    number: 5,
    title: "Emergency, Abnormal & Limitations",
    subtitle: "TCAS FAIL, engine failure, display faults, regulatory limitations",
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
export default function CBTProLine21() {
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
              Collins Pro Line 21 / TCAS-4000
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Computer Based Training — AFMS FS2026-576 Rev 2 · FAA STC #SA01352CH
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
            <span className="text-xs font-bold text-orange-400">{overallPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-2 rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${overallPct}%` }} />
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
                className={`w-full text-left p-4 rounded-xl border transition-all hover:border-orange-500/30 ${isComplete ? `${mod.bg} ${mod.border}` : "bg-card border-border hover:bg-muted/10"}`}
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
            <strong className="text-foreground">Reference:</strong> Elliott Aviation FAA-Approved AFMS — Collins TCAS-4000 with Pro Line 21 Avionics, Report FS2026-576 Revision 2, Dated 07/28/2010. FAA STC #SA01352CH. Applicable to Beechcraft B200/B200C/B200CT/B200T/B200GT/B200CGT, 300/300LW/B300/B300C (Type Certificate #A24CE).
          </p>
          <p className="text-xs text-orange-400 mt-1.5 font-semibold">Always cross-reference with the current approved AFMS supplement in your aircraft documentation.</p>
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
