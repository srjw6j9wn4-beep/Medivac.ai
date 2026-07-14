/**
 * CBT — RFDS South Eastern Section
 * Emergency Response Plan (ERP001 V4.7)
 * Computer Based Training Module — Medivac.ai
 *
 * Source: ERP001 Emergency Response Plan V4.7
 *         Effective Date: 18 June 2026 | Due for Review: 18 June 2027
 *         Approved by: Head of Risk and Assurance (HORA)
 *
 * 6 Modules:
 *   Module 1 — ERP Foundations & Event Classification
 *   Module 2 — Emergency Codes & Notification
 *   Module 3 — Operations Centre Procedures
 *   Module 4 — Initial Assessment Team (IAT)
 *   Module 5 — Emergency Coordination Centre (ECC)
 *   Module 6 — Communication, Media & SARWATCH
 *
 * FOR OPS TEAM TRAINING — all content is sourced verbatim from ERP001 V4.7
 */

import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle, AlertTriangle,
  BookOpen, Award, Phone, Radio, Shield, Users,
  RotateCcw, X, Megaphone, FileText, MapPin, Clock
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
  color: string;
  bg: string;
  border: string;
  bar: string;
  icon: React.ReactNode;
  slides: SlideContent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function KeyPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <CheckCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-3">
      <BookOpen size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-200/80 leading-relaxed">{children}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2 mt-4 first:mt-0">
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

function CodeBadge({ code, children }: { code: "yellow" | "amber" | "red"; children: React.ReactNode }) {
  const styles = {
    yellow: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    amber: "bg-amber-500/20 border-amber-500/40 text-amber-300",
    red: "bg-red-500/20 border-red-500/40 text-red-300",
  };
  return (
    <div className={`px-3 py-2.5 rounded-lg border ${styles[code]} text-xs font-semibold`}>
      {children}
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
      <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function PhoneCard({ role, number, highlight }: { role: string; number: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${highlight ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"}`}>
      <span className={`text-xs ${highlight ? "font-bold text-red-300" : "text-muted-foreground"}`}>{role}</span>
      <span className={`text-xs font-mono font-bold ${highlight ? "text-red-400" : "text-foreground"}`}>{number}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — ERP Foundations & Event Classification
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_1_SLIDES: SlideContent[] = [
  {
    id: "m1-s1",
    title: "What is the RFDSSE ERP?",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong className="text-foreground">Emergency Response Plan (ERP001 V4.7)</strong> provides RFDSSE personnel with clear, structured procedures for managing emergencies that fall outside routine operations. Effective from <strong className="text-foreground">18 June 2026</strong>.
        </p>
        <SectionHeader>Purpose</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Provide clear, structured actions during an emergency</KeyPoint>
          <KeyPoint>Ensure a coordinated response with defined roles and responsibilities</KeyPoint>
          <KeyPoint>Enable an orderly transition from normal to emergency operations</KeyPoint>
          <KeyPoint>Support safe continuation or restoration of operations as soon as possible</KeyPoint>
          <KeyPoint>Maintain alignment with RFDSSE's <strong>SMS, Transport Security Program (TSP)</strong>, and <strong>Clinical Governance Framework</strong></KeyPoint>
        </ul>
        <SectionHeader>Framework</SectionHeader>
        <p className="text-sm text-muted-foreground">Adopts the <strong className="text-foreground">Prevention, Preparation, Response and Recovery (PPRR)</strong> framework endorsed by Emergency Management Australia and State Emergency Management Agencies.</p>
        <Warning>The ERP must not be shared externally without HORA approval. Managers must ensure their teams understand their roles and review this plan annually.</Warning>
        <Note>Source: ERP001 V4.7 §1.1 Forward & §2.1 Purpose</Note>
      </div>
    ),
  },
  {
    id: "m1-s2",
    title: "When Does the ERP Activate?",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Activate the ERP for any <strong className="text-foreground">significant unplanned event</strong> that impacts or may impact RFDSSE operations, people, assets, or reputation.
        </p>
        <SectionHeader>Activation Triggers — Examples</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Serious injuries to personnel, contractors, patients or the public</KeyPoint>
          <KeyPoint>Damage to RFDSSE aircraft, vehicles or facilities</KeyPoint>
          <KeyPoint>Incidents that could harm RFDSSE's public image</KeyPoint>
          <KeyPoint>Natural disasters impacting operations</KeyPoint>
          <KeyPoint>Security incidents (bomb threat, hostage, cyber attack)</KeyPoint>
        </ul>
        <SectionHeader>When the ERP is NOT Activated</SectionHeader>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm font-semibold text-amber-300">Pandemic Plan Exception</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">The ERP will <strong className="text-foreground">NOT</strong> be activated if the RFDSSE Pandemic Plan is active — the Pandemic Plan takes precedence. However, pandemic disease outbreaks that do NOT trigger the Pandemic Plan may activate the ERP.</p>
        </div>
        <SectionHeader>Quick Reference</SectionHeader>
        <p className="text-sm text-muted-foreground">Always refer to the <strong className="text-foreground">Operations Centre Quick Reference Handbook — ERP001</strong> as a quick guide during an emergency.</p>
        <Note>Source: ERP001 V4.7 §2.4 — When to use this ERP & §2.2 — Pandemic Plan</Note>
      </div>
    ),
  },
  {
    id: "m1-s3",
    title: "Three Emergency Event Types",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">The RFDSSE ERP covers three distinct emergency event types:</p>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">Operations Events</p>
            <ul className="space-y-1">
              {[
                "Aircraft or vehicle incident/accident, including missing aircraft or vehicle",
                "Bomb threat",
                "Aircraft or vehicle hijack or hostage situation",
                "Employee held hostage or personal threat/violence",
                "Aircraft or vehicle biohazard",
              ].map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wide">Natural Disaster Events</p>
            <ul className="space-y-1">
              {[
                "Severe thunderstorm, cyclone, or severe low depression",
                "Heatwave or other significant weather events",
                "Flood or flash flooding",
                "Earthquake",
                "Bushfire, or significant fire event",
              ].map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">Facility, Infrastructure & Community Events</p>
            <ul className="space-y-1">
              {[
                "System or infrastructure failure (power, structural, sprinkler, sewer)",
                "Environmental events (oil spill, chemical/fuel/air contamination, biological, radiological)",
                "IT disaster — cyber security incidents including telecommunications",
                "Significant fire event",
                "Significant community & fundraising event",
              ].map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Note>Source: ERP001 V4.7 §2.3 — Emergency Event Classification</Note>
      </div>
    ),
  },
  {
    id: "m1-s4",
    title: "Mayday vs PAN PAN — Response Levels",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Two pilot distress declarations have distinctly different response expectations:</p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-red-400 uppercase tracking-wide">MAYDAY</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold">Full Emergency Response</span>
            </div>
            <ul className="space-y-1.5">
              <li className="text-xs text-muted-foreground leading-snug">• <strong className="text-foreground">Grave and imminent danger</strong> — requires immediate assistance</li>
              <li className="text-xs text-muted-foreground leading-snug">• Ambulance Service activates FULL emergency response — multiple ambulance vehicles to airport</li>
              <li className="text-xs text-muted-foreground leading-snug">• Aircraft expected to have <strong className="text-foreground">major damage</strong> (uncontained fire, incomplete undercarriage, critical flight control issue)</li>
              <li className="text-xs text-muted-foreground leading-snug">• If emergency checklist resolves to abnormal checklist → precautionary preparation for landing commences</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">PAN PAN</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">Local Standby</span>
            </div>
            <ul className="space-y-1.5">
              <li className="text-xs text-muted-foreground leading-snug">• <strong className="text-foreground">Urgent situation</strong> — assistance desired but not a life-threatening emergency</li>
              <li className="text-xs text-muted-foreground leading-snug">• Ambulance dispatched <strong className="text-foreground">if there are patients on board</strong></li>
              <li className="text-xs text-muted-foreground leading-snug">• Aircraft expected to land <strong className="text-foreground">safely</strong> with minimal damage or injury</li>
              <li className="text-xs text-muted-foreground leading-snug">• No full emergency response anticipated</li>
            </ul>
          </div>
        </div>
        <Note>Source: ERP001 V4.7 §1.2 — Abbreviations</Note>
      </div>
    ),
  },
  {
    id: "m1-s5",
    title: "Local Emergency Procedures",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each RFDSSE site maintains its own <strong className="text-foreground">Local Emergency Procedures</strong> that may be required in conjunction with the overarching ERP. Some locations (airports, hospitals) have their own emergency response plans — Local Emergency Procedures may be tailored to align with these.
        </p>
        <SectionHeader>Local Procedures Cover</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Fire or smoke",
            "Evacuation",
            "Medical emergency",
            "Personal threat or violence",
            "Robbery",
            "Bomb threat",
            "Mental health emergency",
            "Loss of services",
            "Aviation security",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
              <CheckCircle size={12} className="text-red-400 flex-shrink-0" />
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
        <SectionHeader>Drills & Training</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Regular emergency response training drills scheduled every <strong>12 months</strong></KeyPoint>
          <KeyPoint>All key personnel must be included where possible — or invited to observe</KeyPoint>
          <KeyPoint>Drill formats: table-top exercises, lessons-learnt debriefs, participation in airport authority exercises</KeyPoint>
        </ul>
        <Note>Source: ERP001 V4.7 §2.9 — Local Emergency Procedures & §4.2 — ERP Drills</Note>
      </div>
    ),
  },
  {
    id: "m1-s6",
    title: "ERP Checklists — What to Use & When",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">The ERP contains checklists, accident/incident logs, and a call log (Appendices A–H). All are available on BaseConnect and electronically.</p>
        <Table
          headers={["Appendix", "Checklist", "Used By"]}
          rows={[
            ["A", "Emergency Call Checklist – Operations Centre", "Ops Centre Coordinator — when emergency call comes in"],
            ["B", "Local Coordination Centre Checklist", "Regional Services / Base Manager"],
            ["C", "Organisational ECC Checklist", "ECC Chairperson once elected"],
            ["D–G", "Role-specific ECC checklists", "ECC members (various roles)"],
            ["H", "Accident/Incident Log", "Scribe during ECC meetings"],
          ]}
        />
        <SectionHeader>Hard Copy Rule</SectionHeader>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-300 font-semibold">Hard copies should ONLY be used if there is no access to technology or computers.</p>
          <p className="text-xs text-muted-foreground mt-1">If hard copies have been completed, they <strong className="text-foreground">must</strong> be sent to <strong className="text-foreground">ERP@rfdsse.org.au</strong> to ensure all information is centralised.</p>
        </div>
        <Note>Source: ERP001 V4.7 §2.5 — Checklists</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — Emergency Codes & Notification
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_2_SLIDES: SlideContent[] = [
  {
    id: "m2-s1",
    title: "Three Emergency Colour Codes",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">A graduated colour code system enables proportionate responses. Codes are <strong className="text-foreground">assigned by the Emergency Coordinator</strong> and may be upgraded or downgraded as the situation changes.</p>
        <div className="space-y-3">
          <CodeBadge code="yellow">
            <p className="font-bold text-sm">CODE YELLOW — Minor to Moderate Occurrence</p>
            <ul className="mt-2 space-y-1 font-normal">
              <li className="text-xs text-muted-foreground">• Aircraft/vehicle incident that cannot be managed through documented procedures</li>
              <li className="text-xs text-muted-foreground">• Possible chemical spill or biological event contained in a secure section of facility</li>
              <li className="text-xs text-muted-foreground">• Any occurrence involving a facility used by RFDSSE</li>
              <li className="text-xs text-muted-foreground">• A security breach that has occurred</li>
              <li className="text-xs text-muted-foreground">• Personal threat or violence to non-specified RFDSSE personnel</li>
            </ul>
          </CodeBadge>
          <CodeBadge code="amber">
            <p className="font-bold text-sm">CODE AMBER — Serious Accident/Incident</p>
            <ul className="mt-2 space-y-1 font-normal">
              <li className="text-xs text-muted-foreground">• Damage to aircraft/vehicle under RFDSSE control — possibly involves injuries</li>
              <li className="text-xs text-muted-foreground">• Significant damage to a facility used by RFDSSE</li>
              <li className="text-xs text-muted-foreground">• Significant chemical spill or biological event in a secure section of facility</li>
              <li className="text-xs text-muted-foreground">• Injuries involving RFDSSE personnel, contractors, patients, or the public</li>
            </ul>
          </CodeBadge>
          <CodeBadge code="red">
            <p className="font-bold text-sm">CODE RED — Emergency</p>
            <ul className="mt-2 space-y-1 font-normal">
              <li className="text-xs text-muted-foreground">• Aircraft/vehicle crashed or missing — fatalities expected or confirmed</li>
              <li className="text-xs text-muted-foreground">• Bomb threat</li>
              <li className="text-xs text-muted-foreground">• Cyclone Warning with gale force/strong winds expected to impact RFDSSE</li>
              <li className="text-xs text-muted-foreground">• Significant security incident (hostage, major fire, catastrophic infrastructure)</li>
            </ul>
          </CodeBadge>
        </div>
        <Note>Source: ERP001 V4.7 §2.6 — Emergency Codes</Note>
      </div>
    ),
  },
  {
    id: "m2-s2",
    title: "The Emergency Response Poster — 3 Steps",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">The Emergency Response Poster must be displayed prominently at <strong className="text-foreground">ALL RFDSSE facilities</strong>. It is also available on the Document Management System and BaseConnect.</p>
        <SectionHeader>Three Emergency Actions — IN ORDER</SectionHeader>
        <div className="space-y-2">
          <Step number={1}>
            <strong>Assess the situation</strong> — before acting, determine the nature and scope of the emergency
          </Step>
          <Step number={2}>
            Provide <strong>medical support if safe to do so</strong>
          </Step>
          <Step number={3}>
            Call <strong>000</strong> if required, then call RFDSSE Internal Emergency Number: <strong className="text-red-400">1800 377 359</strong>
          </Step>
        </div>
        <SectionHeader>Five Questions to Answer When Calling 1800 377 359</SectionHeader>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { q: "WHO", detail: "are you?" },
            { q: "WHERE", detail: "has it happened?" },
            { q: "WHEN", detail: "did it happen?" },
            { q: "WHAT", detail: "has happened?" },
            { q: "HOW", detail: "have they been affected?" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
              <span className="text-xs font-bold text-red-400 w-16 flex-shrink-0">{item.q}</span>
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 §2.7 — Emergency Notification & Figure 1.2 — ERP Poster</Note>
      </div>
    ),
  },
  {
    id: "m2-s3",
    title: "Emergency Phone Numbers",
    body: (
      <div className="space-y-4">
        <SectionHeader>Primary Numbers</SectionHeader>
        <div className="space-y-2">
          <PhoneCard role="External emergency services" number="000" highlight />
          <PhoneCard role="RFDSSE Internal Emergency Response (1800 DRS FLY)" number="1800 377 359" highlight />
          <PhoneCard role="RFDS Retrieval Consultant (DR HELP line)" number="1800 374 357" />
          <PhoneCard role="Alternate — Operations Centre (if 1800 377 359 offline)" number="(02) 6841 2551" />
        </div>
        <SectionHeader>Key Internal Contacts</SectionHeader>
        <div className="space-y-1.5">
          <PhoneCard role="Chief Executive Officer" number="0419 767 284" />
          <PhoneCard role="EGM Aviation & Operations" number="0477 058 998" />
          <PhoneCard role="Head of Aviation Ops & Service Delivery" number="0447 637 798" />
          <PhoneCard role="Head of Risk & Assurance (HORA)" number="0426 165 220" />
          <PhoneCard role="EGM Health & Clinical Services" number="0409 903 325" />
        </div>
        <SectionHeader>Media Contact</SectionHeader>
        <div className="p-2.5 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Send media brief/summary to: <strong className="text-foreground">galah@rfdsse.org.au</strong></p>
          <p className="text-xs text-muted-foreground mt-1">ERP documentation: <strong className="text-foreground">ERP@rfdsse.org.au</strong></p>
        </div>
        <Note>Source: ERP001 V4.7 §6.1 — Internal Key Personnel Contact Numbers & §2.7</Note>
      </div>
    ),
  },
  {
    id: "m2-s4",
    title: "Emergency Line Unavailable — Contingency",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">If <strong className="text-foreground">1800 377 359</strong> becomes unavailable due to technical issues, three teams have specific responsibilities:</p>
        <SectionHeader>Digital & Technology Steps</SectionHeader>
        <div className="space-y-2">
          <Step number={1}>Call <strong>Urgent Assistance line 1300 856 636</strong> — explain that the emergency phone line is currently offline</Step>
          <Step number={2}>Work to restore 1800 377 359 as quickly as possible and advise Operations Centre when it is back online</Step>
        </div>
        <SectionHeader>Operations Centre Steps</SectionHeader>
        <div className="space-y-2">
          <Step number={1}><strong>(02) 6841 2551</strong> becomes the main avenue for emergency calls. Same process — just through alternate number</Step>
          <Step number={2}>Alternate number is platform for both incoming patient transport AND internal emergency phone calls while 1800 377 359 is offline</Step>
        </div>
        <SectionHeader>Health Services Steps</SectionHeader>
        <div className="space-y-2">
          <Step number={1}>Call <strong>1800 374 357</strong> (RFDS Retrieval Consultant) — advise emergency line is offline</Step>
          <Step number={2}>Retrieval Consultant informs all external patient booking services (Far West LHD, Ambulance Western Ops, ACC) to use alternate number (02) 6841 2551</Step>
        </div>
        <Warning>When the line is restored, the RFDS Retrieval Consultant is responsible for notifying patient booking services to return to normal procedures.</Warning>
        <Note>Source: ERP001 V4.7 §2.8 — Emergency Line Unavailable</Note>
      </div>
    ),
  },
  {
    id: "m2-s5",
    title: "Emergency Coordinator — Who to Call",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">After the emergency call, the Operations Centre contacts the most appropriate Emergency Coordinator based on event type:</p>
        <Table
          headers={["Event Category", "Primary EC — Contact First"]}
          rows={[
            [
              <span key="r1" className="font-semibold">Operations Events (Aviation)</span>,
              <div key="v1"><p className="font-semibold">EGM Aviation & Operations</p><p className="font-mono text-xs text-muted-foreground">0477 058 998</p></div>,
            ],
            [
              <span key="r2" className="font-semibold">Operations Events (Other)</span>,
              <div key="v2"><p className="font-semibold">EGM Aviation & Operations</p><p className="font-mono text-xs text-muted-foreground">0477 058 998</p></div>,
            ],
            [
              <span key="r3" className="font-semibold">Natural Disaster Events</span>,
              <div key="v3"><p className="font-semibold">EGM Aviation & Operations</p><p className="font-mono text-xs text-muted-foreground">0477 058 998</p></div>,
            ],
            [
              <span key="r4" className="font-semibold">Facility, Infrastructure & Community Events</span>,
              <div key="v4"><p className="font-semibold">EGM Aviation & Operations</p><p className="font-mono text-xs text-muted-foreground">0477 058 998</p></div>,
            ],
          ]}
        />
        <SectionHeader>If EC Cannot Be Contacted</SectionHeader>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-semibold text-red-300">Contact the next EC on Table 2.11.1 immediately. Never delay — the situation requires urgent escalation regardless of which EC is reachable.</p>
        </div>
        <SectionHeader>Local Initial Response</SectionHeader>
        <ul className="space-y-1.5">
          <KeyPoint>The <strong>Regional Services Manager or Base Manager</strong> coordinates the initial local response</KeyPoint>
          <KeyPoint>May be delegated if they are required to coordinate site access or liaise with local authorities</KeyPoint>
        </ul>
        <Note>Source: ERP001 V4.7 §2.11.1 — Emergency Coordinators Table & §2.11.2 — Local Initial Response</Note>
      </div>
    ),
  },
  {
    id: "m2-s6",
    title: "Media Notification — Always Required",
    body: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40">
          <p className="text-sm font-bold text-red-300">Regardless of the level of response required — the Media Team must ALWAYS be informed when the emergency number is called.</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Even if the event is under control or minor, media may create a false narrative. If the Media Team is notified quickly, they can provide communications explaining the situation.
        </p>
        <SectionHeader>How to Notify Media Team</SectionHeader>
        <div className="p-2.5 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Send a simple brief or summary to: <strong className="text-foreground">galah@rfdsse.org.au</strong></p>
          <p className="text-xs text-muted-foreground mt-1">Can be submitted by either the <strong className="text-foreground">Emergency Coordinator</strong> or <strong className="text-foreground">Operations Centre Coordinator</strong> at a suitable time</p>
        </div>
        <SectionHeader>Employee Response to Media Enquiry (Script)</SectionHeader>
        <div className="p-3 rounded-lg bg-muted/30 border border-border italic">
          <p className="text-sm text-foreground">"Can I please take down your details and I will ask someone from our Media Team to contact you."</p>
        </div>
        <SectionHeader>What to Capture from Journalists</SectionHeader>
        <ul className="space-y-1.5">
          <KeyPoint>Name of the journalist and media outlet</KeyPoint>
          <KeyPoint>Topic of enquiry or question</KeyPoint>
          <KeyPoint>Contact phone number and email address</KeyPoint>
          <KeyPoint>Journalist's deadline</KeyPoint>
        </ul>
        <Warning>Employees must not confirm or deny facts to media. Do not comment externally unless specifically authorised. Only the CEO or GM Corporate Affairs (or delegate) may speak to media.</Warning>
        <Note>Source: ERP001 V4.7 §2.11.3 & §3.5 — Media Notification & Communication Plan</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — Operations Centre Procedures
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_3_SLIDES: SlideContent[] = [
  {
    id: "m3-s1",
    title: "The Operations Centre Role",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Operations Centre is the <strong className="text-foreground">recipient of all incoming calls</strong> to 1800 377 359 (1800 DRS FLY). The number is used by:
        </p>
        <ul className="space-y-2">
          <KeyPoint>The general public for medical emergencies</KeyPoint>
          <KeyPoint>RFDSSE personnel to notify of internal organisational emergencies</KeyPoint>
          <KeyPoint>Airservices Australia for aircraft incidents</KeyPoint>
        </ul>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mt-2">
          <p className="text-xs font-semibold text-amber-300">This manual's contents are only relevant to management of internal emergencies.</p>
        </div>
        <SectionHeader>Core Responsibility</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Gather initial information from the caller using <strong>Appendix A — Emergency Call Checklist</strong></KeyPoint>
          <KeyPoint>Capture all critical information accurately to ensure accuracy in transmission to EC</KeyPoint>
          <KeyPoint>Once emergency call is completed → call most appropriate Emergency Coordinator</KeyPoint>
        </ul>
        <SectionHeader>Contract Emergencies</SectionHeader>
        <p className="text-sm text-muted-foreground">When an emergency involves a contract, the Ops Centre notifies the designated contract representative — they become part of the IAT and later the ECC.</p>
        <Note>Source: ERP001 V4.7 §2.10 — Operations Centre</Note>
      </div>
    ),
  },
  {
    id: "m3-s2",
    title: "Appendix A — Emergency Call Checklist",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">When an emergency call comes through on 1800 377 359, the Operations Centre Coordinator works through Appendix A in order:</p>
        <div className="space-y-2">
          {[
            { step: "1. WHO", detail: "Who are you? Get caller's name, role, location" },
            { step: "2. WHERE", detail: "Where has the event occurred? Exact location if possible" },
            { step: "3. WHEN", detail: "When did it happen? Exact time if known" },
            { step: "4. WHAT", detail: "What has happened? Nature and type of event" },
            { step: "5. HOW", detail: "How have people been affected? Injuries, numbers, severity" },
            { step: "6. NOTIFY", detail: "Call most appropriate Emergency Coordinator once call is complete" },
            { step: "7. MEDIA", detail: "Notify Media Team via galah@rfdsse.org.au" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border">
              <span className="text-xs font-bold text-red-400 w-20 flex-shrink-0">{item.step}</span>
              <p className="text-xs text-muted-foreground leading-snug">{item.detail}</p>
            </div>
          ))}
        </div>
        <Warning>Document ALL information given. Accuracy in transmission to the Emergency Coordinator is critical. Use exact words where possible — do not paraphrase the caller's description of events.</Warning>
        <Note>Source: ERP001 V4.7 §2.10 — Operations Centre & Appendix A</Note>
      </div>
    ),
  },
  {
    id: "m3-s3",
    title: "After the Call — Ops Centre Actions",
    body: (
      <div className="space-y-4">
        <SectionHeader>Immediate Post-Call Sequence</SectionHeader>
        <div className="space-y-2">
          <Step number={1}>Call the <strong>most appropriate Emergency Coordinator</strong> for the situation — use Table 2.11.1 to determine who</Step>
          <Step number={2}>If EC cannot be contacted → <strong>immediately contact the next EC on the list</strong>. Never delay waiting for a specific person</Step>
          <Step number={3}>Relay the information captured in Appendix A accurately to the EC</Step>
          <Step number={4}>EC will assess and determine escalation — Code Yellow, Amber, or Red</Step>
          <Step number={5}>If EC determines <strong>Code Amber or Code Red</strong> → EC determines ECC location and advises Ops Centre</Step>
          <Step number={6}>Ops Centre sends <strong>GROUP INVITATION</strong> to IAT members (for Code Yellow) or ECC invitation (for Amber/Red)</Step>
        </div>
        <SectionHeader>IAT Notification Message</SectionHeader>
        <div className="p-3 rounded-lg bg-muted/30 border border-border italic">
          <p className="text-xs text-foreground">"Emergency/Event unfolding. Initial Assessment Team Activated. Please join today at [TIME] on [CONFERENCE LINE]."</p>
        </div>
        <SectionHeader>ECC Notification Message</SectionHeader>
        <div className="p-3 rounded-lg bg-muted/30 border border-border italic">
          <p className="text-xs text-foreground">"Emergency Response Plan Activated, an event is unfolding. At [time], join the video conference line or attend in person at [location]."</p>
        </div>
        <Note>Source: ERP001 V4.7 §2.10 & §3.1 — Operations Centre & IAT Activation</Note>
      </div>
    ),
  },
  {
    id: "m3-s4",
    title: "SARWATCH — Aircraft Overdue Procedures",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          RFDSSE aircraft operate under <strong className="text-foreground">SARWATCH procedures</strong> with Airservices Australia. Pilots provide position reports and cancel SARWATCH after landing. If SARWATCH is not cancelled, Airservices escalates through three phases:
        </p>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-xs font-bold text-yellow-300 mb-1">INCERFA — Uncertainty Phase</p>
            <p className="text-xs text-muted-foreground">Airservices attempts contact for 15 minutes after missed position report. Ops Centre action: <strong className="text-foreground">attempt to confirm aircraft status</strong></p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs font-bold text-amber-300 mb-1">ALERFA — Alert Phase</p>
            <p className="text-xs text-muted-foreground">Ops Centre action: <strong className="text-foreground">notify Emergency Coordinator and consider IAT activation</strong></p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs font-bold text-red-300 mb-1">DISTRESSFA — Distress Phase</p>
            <p className="text-xs text-muted-foreground">Ops Centre action: <strong className="text-foreground">confirm Code Red and activate ERP</strong>. JRCC coordinates all search and rescue activities</p>
          </div>
        </div>
        <SectionHeader>Joint Rescue Coordination Centre (JRCC)</SectionHeader>
        <p className="text-sm text-muted-foreground">JRCC coordinates ALL search and rescue activities — including beacon (ELT/EPIRB) activations and lost personnel or vehicles — until resolution.</p>
        <Note>Source: ERP001 V4.7 §3.6.4 — Specific Emergency Interface: Airservices and JRCC</Note>
      </div>
    ),
  },
  {
    id: "m3-s5",
    title: "Contract Operations Interface",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          RFDSSE holds contracts with state and commonwealth agencies. Aircraft under these contracts often carry <strong className="text-foreground">customer staff</strong> (flight nurses, paramedics, doctors) and <strong className="text-foreground">patients under their direct care</strong>. Each contract has specific interface requirements:
        </p>
        <SectionHeader>General Contract Protocol</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Regional Services Manager or Base Manager must communicate with the contract customer early in the incident</KeyPoint>
          <KeyPoint>Contract representative participates in IAT and ECC when their contract is involved</KeyPoint>
          <KeyPoint>At each contracted base, a nominated emergency contact participates in the ECC as the main contact between RFDSSE and the contractor</KeyPoint>
        </ul>
        <SectionHeader>Air Ambulance Tasmania (AT)</SectionHeader>
        <ul className="space-y-1.5">
          <KeyPoint>AT COMMS can communicate directly with aircraft and is usually alerted first</KeyPoint>
          <KeyPoint>If RFDSSE learns of incident first → Fixed-Wing Operations Manager contacts AT COMMS and Ops Manager Critical Care and Retrieval</KeyPoint>
          <KeyPoint>If ERP activated → AT leads emergency response; RFDSSE provides technical support</KeyPoint>
          <KeyPoint>All external communications must be approved by <strong>Manager Aeromedical Ambulance Tasmania</strong> before distribution</KeyPoint>
        </ul>
        <Note>Source: ERP001 V4.7 §3.6 — Customer and Consumer Interface & §3.6.2 — Air Ambulance Tasmania</Note>
      </div>
    ),
  },
  {
    id: "m3-s6",
    title: "Regulatory Authorities & Documentation",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Regulatory authorities (CASA, ATSB, Police, Coroner) follow a defined protocol and issue formal requests for documentation/records following an incident.
        </p>
        <SectionHeader>Who Can Release Documentation</SectionHeader>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-semibold text-red-300">Only two authorised personnel:</p>
          <ul className="mt-2 space-y-1">
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Head of Risk and Assurance (HORA)</strong></li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Head of Clinical Governance</strong></li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">Both maintain a record and copies of all documentation/records released to outside authorities. Same process applies for customer or OEM requests.</p>
        </div>
        <SectionHeader>Social Media Protocol</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Employees must <strong>NOT</strong> post or respond on social media during an emergency</KeyPoint>
          <KeyPoint>Corporate Affairs Team monitors and responds as needed</KeyPoint>
          <KeyPoint>If you see something concerning on social media: take a screenshot and send to <strong>galah@rfdsse.org.au</strong> — or call the emergency number and provide a screenshot/link</KeyPoint>
          <KeyPoint>RFDS website managed by Corporate Affairs will be the single source of truth for staff and public during a crisis</KeyPoint>
        </ul>
        <Note>Source: ERP001 V4.7 §4.1 — Regulatory Authorities & §3.5.4 — Social Media</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — Initial Assessment Team (IAT)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_4_SLIDES: SlideContent[] = [
  {
    id: "m4-s1",
    title: "What is the IAT?",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong className="text-foreground">Initial Assessment Team (IAT)</strong> is responsible for the <strong className="text-foreground">initial assessment, verification of facts, monitoring of the unfolding situation</strong>, and providing direction to the organisation's response.
        </p>
        <SectionHeader>IAT Purpose</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Investigate and confirm the facts as quickly as possible</KeyPoint>
          <KeyPoint>Assess the situation and determine the appropriate level of response</KeyPoint>
          <KeyPoint>Decide whether to escalate to a Full Emergency Response (Code Amber/Red)</KeyPoint>
          <KeyPoint>Determine the location of the Emergency Coordination Centre if required</KeyPoint>
        </ul>
        <SectionHeader>IAT Meeting Rule</SectionHeader>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs font-semibold text-amber-300">Members of the IAT must hold silent unless they have critically relevant information to add.</p>
          <p className="text-xs text-muted-foreground mt-1">The IAT can be held as long as necessary to monitor a still-unfolding situation.</p>
        </div>
        <SectionHeader>Code at Start of IAT</SectionHeader>
        <p className="text-sm text-muted-foreground">At the commencement of the IAT conference call, the Emergency Coordinator designates the emergency as <strong className="text-foreground">Code Yellow</strong>. If the situation warrants, the code may be upgraded to Amber or Red.</p>
        <Note>Source: ERP001 V4.7 §3.1 — Activation of the Initial Assessment Team</Note>
      </div>
    ),
  },
  {
    id: "m4-s2",
    title: "IAT Activation Sequence",
    body: (
      <div className="space-y-4">
        <SectionHeader>How the IAT is Activated</SectionHeader>
        <div className="space-y-2">
          <Step number={1}>Operations Centre receives emergency call → gathers information → contacts Emergency Coordinator</Step>
          <Step number={2}>Emergency Coordinator assesses situation → decides to activate IAT</Step>
          <Step number={3}>Operations Centre sends <strong>GROUP INVITATION</strong> to IAT members — indicating the event and instructions to call in on the conference line</Step>
          <Step number={4}>IAT Standard Activation Message: <em>"Emergency/Event unfolding. Initial Assessment Team Activated. Please join today at [TIME] on [CONFERENCE LINE]."</em></Step>
          <Step number={5}>Emergency Coordinator designates Code Yellow at commencement of call</Step>
          <Step number={6}>IAT investigates and verifies facts — can upgrade/downgrade code as situation evolves</Step>
        </div>
        <SectionHeader>IAT Outcomes</SectionHeader>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {[
            { outcome: "No significant threat", action: "No response required — business may continue to monitor" },
            { outcome: "Limited risk identified", action: "Monitor situation; limited response only; no full ERP activation" },
            { outcome: "Code Amber or Red", action: "ERP activated — EC determines ECC location and key personnel" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border">
              <span className="text-xs font-semibold text-red-400 w-40 flex-shrink-0">{item.outcome}</span>
              <span className="text-xs text-muted-foreground">{item.action}</span>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 §3.1 — Activation of the IAT & §3.2 — ERP Activation</Note>
      </div>
    ),
  },
  {
    id: "m4-s3",
    title: "IAT Members — By Event Type",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">IAT membership varies by event type. The relevant Regional Services Manager is always added to the IAT. Additional members may be added based on location and nature of incident.</p>
        <SectionHeader>Operations Events (Aviation)</SectionHeader>
        <div className="space-y-1">
          {[
            "EGM Aviation & Operations — 0477 058 998",
            "Head of Aviation Ops & Service Delivery — 0447 637 798",
            "On Call Doctor — 1800 374 357",
            "Head of Clinical Governance — 0449 778 279",
            "Head of Risk & Assurance — 0426 165 220",
            "Head of Corporate Affairs — 0407 583 854",
          ].map((m, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-2 p-1.5 rounded bg-card border border-border">
              <span className="text-red-400 flex-shrink-0">•</span> {m}
            </div>
          ))}
        </div>
        <SectionHeader>Natural Disaster Events — Additional Members</SectionHeader>
        <div className="space-y-1">
          {[
            "CFO/EGM Corporate Services — 0419 130 828",
            "EGM Health & Clinical Services — 0409 903 325",
            "Head of Community Engagement — 0437 370 702",
          ].map((m, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-2 p-1.5 rounded bg-card border border-border">
              <span className="text-amber-400 flex-shrink-0">+</span> {m}
            </div>
          ))}
        </div>
        <SectionHeader>Facility/IT Events — Additional Members</SectionHeader>
        <div className="space-y-1">
          {[
            "Head of Assets & Infrastructure — 0457 312 618",
            "Business Manager Office of CEO & Company Secretary — 0409 088 920 (for IT events)",
          ].map((m, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-2 p-1.5 rounded bg-card border border-border">
              <span className="text-blue-400 flex-shrink-0">+</span> {m}
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 §3.1.1–3.1.4 — IAT Members by Event Type</Note>
      </div>
    ),
  },
  {
    id: "m4-s4",
    title: "Considerations During IAT Review",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">When the IAT reviews the event to determine if a limited response is required, it considers:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { area: "Welfare", detail: "Customers, staff, families of employees/patients" },
            { area: "Media Relations", detail: "Current or potential media interest" },
            { area: "Impact on Operations", detail: "Operational disruption scale and duration" },
            { area: "Resourcing", detail: "Staffing, aircraft, facilities impacted" },
            { area: "Financial Impacts", detail: "Costs, liability, insurance implications" },
            { area: "RFDSSE Reputation", detail: "Reputational risk and stakeholder concerns" },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-xs font-bold text-red-400">{item.area}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
          ))}
        </div>
        <SectionHeader>Decision Points</SectionHeader>
        <Table
          headers={["IAT Decision", "Outcome"]}
          rows={[
            ["No significant threat", "No response — continue monitoring"],
            ["Limited risk, manageable", "Monitor + limited response, no ERP activation"],
            ["Code Amber or Red", "Full ERP activation — ECC established"],
          ]}
        />
        <Note>Source: ERP001 V4.7 §3.1 — IAT Review Considerations</Note>
      </div>
    ),
  },
  {
    id: "m4-s5",
    title: "Affected Person Support Facility (APSF)",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          If a major incident has occurred (aircraft accident, major vehicle accident), an <strong className="text-foreground">Affected Person Support Facility (APSF)</strong> will be established.
        </p>
        <SectionHeader>APSF Purpose</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>For <strong>direct family and friends</strong> of those involved in the event</KeyPoint>
          <KeyPoint>Must be a <strong>private facility</strong> — away from media and general public</KeyPoint>
          <KeyPoint>Established at the base where accident occurred (if safe) — alternate location if unsafe or inappropriate</KeyPoint>
        </ul>
        <SectionHeader>APSF Responsibility</SectionHeader>
        <p className="text-sm text-muted-foreground">The <strong className="text-foreground">Regional Services Manager, Base Manager, Team Leader</strong>, or delegate assumes responsibility for APSF establishment and facilitation.</p>
        <SectionHeader>Gateway Airport Exception</SectionHeader>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs font-semibold text-blue-300">If accident occurs at a Gateway Airport (Sydney, Melbourne, Brisbane, Hobart, Launceston, Adelaide):</p>
          <p className="text-xs text-muted-foreground mt-1">The Airport Authority provides facilities for affected persons as part of their Airport Emergency Plan. An RFDSSE representative will be available to support families in the nominated facility.</p>
        </div>
        <Note>Source: ERP001 V4.7 §3.7 — Affected Person Support Facility</Note>
      </div>
    ),
  },
  {
    id: "m4-s6",
    title: "Scenario Drill — IAT Activation",
    body: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-bold text-red-400 mb-1">SCENARIO</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Operations Centre receives a call at 14:22. A pilot has declared PAN PAN — one engine inoperative, patient on board, diverting to YSDU. The caller is unsure if the patient is stable.
          </p>
        </div>
        <SectionHeader>Walk Through the Response</SectionHeader>
        <div className="space-y-2">
          {[
            { q: "What does PAN PAN mean?", a: "Urgent but not grave — local standby, ambulance dispatched because there is a patient on board" },
            { q: "What checklist does Ops use?", a: "Appendix A — Emergency Call Checklist. Document WHO, WHERE, WHEN, WHAT, HOW" },
            { q: "Who does Ops call next?", a: "Emergency Coordinator — EGM Aviation & Operations (0477 058 998) first for Operations Events (Aviation)" },
            { q: "What code does the EC assign?", a: "EC assesses — likely Code Amber given damage + possible injuries. EC starts IAT at Code Yellow, upgrades if needed" },
            { q: "What happens at IAT commencement?", a: "Emergency Coordinator designates Code Yellow. IAT verifies facts and may upgrade to Amber" },
            { q: "Does Media Team get notified?", a: "YES — regardless of code level, Media Team must always be informed. Send brief to galah@rfdsse.org.au" },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-xs font-semibold text-red-400 mb-1">{item.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 §1.2, §2.6, §2.10, §2.11.3, §3.1</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — Emergency Coordination Centre (ECC)
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_5_SLIDES: SlideContent[] = [
  {
    id: "m5-s1",
    title: "What is the ECC?",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong className="text-foreground">Emergency Coordination Centre (ECC)</strong> is established for <strong className="text-foreground">Code Amber or Code Red events</strong>. It assumes leadership, responsibility and accountability for the response — serving as the <strong className="text-foreground">single source of validated information</strong>.
        </p>
        <SectionHeader>ECC Responsibilities</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Agree on timing, frequency, methods, and communications protocols</KeyPoint>
          <KeyPoint>Ensure coordination across the organisation — all efforts in sync</KeyPoint>
          <KeyPoint>Provide ongoing management of risk and issues</KeyPoint>
          <KeyPoint>Ensure regulatory requirements are considered and met</KeyPoint>
          <KeyPoint>Oversee resource and finance allocation</KeyPoint>
          <KeyPoint>Reinforce protocols — EAP, fatigue management, reporting, log-keeping, communication</KeyPoint>
        </ul>
        <SectionHeader>ECC Meeting Cadence</SectionHeader>
        <p className="text-sm text-muted-foreground">The ECC meets <strong className="text-foreground">regularly throughout the response</strong> to assess status, discuss impending issues, and assign actions. Meeting intervals are determined at ECC commencement.</p>
        <Note>Source: ERP001 V4.7 §3.3 — Emergency Coordination Centre</Note>
      </div>
    ),
  },
  {
    id: "m5-s2",
    title: "ECC Locations",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">The location is determined by the Emergency Coordinator. One of three nominated locations is used:</p>
        <div className="space-y-3">
          {[
            {
              city: "Sydney",
              address: "Level 5, 418a Elizabeth Street, Surry Hills, NSW 2010",
              room: "Sydney Broken Hill Room",
              color: "border-blue-500/30 bg-blue-500/5",
              badge: "text-blue-400",
            },
            {
              city: "Dubbo",
              address: "21 Judy Jakins Drive, Dubbo, NSW 2830",
              room: "Dubbo Board Room",
              color: "border-green-500/30 bg-green-500/5",
              badge: "text-green-400",
            },
            {
              city: "Broken Hill",
              address: "McCardell Hangar, 1 Airport Road, Broken Hill, NSW 2880",
              room: "Broken Hill FSB Board Room",
              color: "border-amber-500/30 bg-amber-500/5",
              badge: "text-amber-400",
            },
          ].map((loc, i) => (
            <div key={i} className={`p-3 rounded-lg border ${loc.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={13} className={loc.badge} />
                <span className={`text-xs font-bold ${loc.badge}`}>{loc.city}</span>
              </div>
              <p className="text-xs text-foreground font-semibold">{loc.room}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>
            </div>
          ))}
        </div>
        <SectionHeader>Local Coordination Centre</SectionHeader>
        <p className="text-sm text-muted-foreground">The ECC Chairperson may form a <strong className="text-foreground">Local Coordination Centre</strong> to assist with on-site coordination — linked to ECC via video/audio. The Regional Services Manager, Base Manager, or Team Leader completes the Appendix B (Local Coordination Centre Checklist).</p>
        <Note>Source: ERP001 V4.7 §3.3.3 — ECC Locations</Note>
      </div>
    ),
  },
  {
    id: "m5-s3",
    title: "ECC Roles — Chairperson & Scribe",
    body: (
      <div className="space-y-4">
        <SectionHeader>ECC Chairperson</SectionHeader>
        <div className="p-3 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Chairperson is <strong className="text-foreground">appointed by ECC Key Personnel</strong> once the ECC assembles. The Chairperson uses <strong className="text-foreground">Appendix C (Organisational ECC Checklist)</strong> to ensure all necessary actions are assigned and tracked.
          </p>
        </div>
        <SectionHeader>Key Chairperson Actions</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Brief ECC members on the event</KeyPoint>
          <KeyPoint>Appoint a Scribe to record meeting notes and complete checklists</KeyPoint>
          <KeyPoint>Determine meeting frequency and communication protocols</KeyPoint>
          <KeyPoint>Assign tasks and track actions to completion</KeyPoint>
          <KeyPoint>Ensure regulatory and compliance obligations are met</KeyPoint>
        </ul>
        <SectionHeader>ECC Scribe</SectionHeader>
        <div className="p-3 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Appointed by the ECC Chairperson. The Scribe completes checklists and records <strong className="text-foreground">meeting notes for timeline and key decisions</strong>. For multi-day events, this role may be delegated.
          </p>
        </div>
        <SectionHeader>ECC Emergency Bag Contents</SectionHeader>
        <p className="text-sm text-muted-foreground">At each ECC location, an emergency bag contains the current ERP and supporting checklists/materials ready for immediate use.</p>
        <Note>Source: ERP001 V4.7 §3.3.1 — ECC Chairperson & §3.3.2 — Scribe</Note>
      </div>
    ),
  },
  {
    id: "m5-s4",
    title: "ERP Activation Flow — Full Sequence",
    body: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">The complete flow from event to Full Emergency Response:</p>
        <div className="space-y-2">
          {[
            { phase: "Event Occurs", detail: "Incident or emergency identified by any RFDSSE person" },
            { phase: "Initial Notification", detail: "Call 000 if required → Call 1800 377 359" },
            { phase: "Ops Centre", detail: "Completes Appendix A → Contacts Emergency Coordinator" },
            { phase: "EC Assessment", detail: "EC designates Code Yellow, considers IAT activation" },
            { phase: "IAT Activated", detail: "Ops sends GROUP INVITATION → IAT convenes → verifies facts" },
            { phase: "Code Yellow", detail: "IAT starts at Code Yellow — may escalate if situation warrants" },
            { phase: "Code Amber / Red", detail: "Full ERP Activated → EC determines ECC location" },
            { phase: "ECC Assembled", detail: "Key Personnel contacted → assembled → briefed" },
            { phase: "ECC Chairperson Elected", detail: "ECC Key Personnel appoint Chairperson" },
            { phase: "Actions Assigned", detail: "Tasks discussed, assigned, tracked. Comms plan initiated" },
            { phase: "Regular Reviews", detail: "ECC meets at set intervals → status updates → escalate or de-escalate" },
            { phase: "Stand Down", detail: "EC designates stand-down → debriefs and lessons learnt" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-red-400 font-bold text-xs w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 flex items-start gap-2 p-2 rounded-lg bg-card border border-border">
                <span className="text-xs font-semibold w-36 flex-shrink-0">{item.phase}</span>
                <span className="text-xs text-muted-foreground">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 §3.2 — ERP Activation & Figure 1.3</Note>
      </div>
    ),
  },
  {
    id: "m5-s5",
    title: "Communication Plan During ECC",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong className="text-foreground">GM Corporate Affairs and Fundraising</strong> develops a Communication Plan to manage internal and external messaging.
        </p>
        <SectionHeader>Communication Plan Covers</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>Briefing staff on event details and media response protocols</KeyPoint>
          <KeyPoint>Setting update intervals — initially <strong>≤60 minutes</strong>, later 90–120 minutes as situation stabilises</KeyPoint>
          <KeyPoint>Only the <strong>CEO or GM Corporate Affairs</strong> (or their delegate) may speak to media</KeyPoint>
        </ul>
        <SectionHeader>National / Interstate Media</SectionHeader>
        <p className="text-sm text-muted-foreground">If the incident may attract national or interstate media, notify the <strong className="text-foreground">Head of Corporate Affairs</strong>. They brief the Federation Communications team to ensure national awareness and coordinate updates for other RFDS sections.</p>
        <SectionHeader>Single Source of Truth</SectionHeader>
        <div className="p-3 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">The <strong className="text-foreground">RFDS website</strong>, managed by Corporate Affairs, will be regularly updated during a crisis — acting as the single source of truth for staff and the public. All crisis communications include the website link.</p>
        </div>
        <Note>Source: ERP001 V4.7 §3.5 — Communication Plan & §3.5.3</Note>
      </div>
    ),
  },
  {
    id: "m5-s6",
    title: "Scenario — Code Red: Aircraft Crash",
    body: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40">
          <p className="text-xs font-bold text-red-400 mb-1">SCENARIO — CODE RED</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            At 07:45, Airservices Australia advises the Ops Centre that an RFDSSE aircraft has not cancelled SARWATCH. All contact attempts have failed. It is now DISTRESSFA. The aircraft had 3 POB.
          </p>
        </div>
        <SectionHeader>Step-by-Step Response</SectionHeader>
        <div className="space-y-2">
          {[
            { q: "What SAR phase triggers Code Red?", a: "DISTRESSFA — Ops Centre confirms Code Red and activates ERP immediately" },
            { q: "Who coordinates SAR?", a: "JRCC (Joint Rescue Coordination Centre) coordinates all search and rescue until resolution" },
            { q: "What code applies?", a: "Code Red — aircraft missing, fatalities expected or unknown. EC confirms Code Red" },
            { q: "Does IAT still convene?", a: "Yes — IAT starts at Code Yellow per protocol, then immediately upgrades to Red given confirmed distress phase" },
            { q: "Where is the ECC?", a: "EC determines location — Sydney, Dubbo, or Broken Hill based on proximity and operational situation" },
            { q: "APSF required?", a: "Yes — once a major accident is confirmed, APSF established at base or alternate private location. Gateway airport rules apply if applicable" },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-xs font-semibold text-red-400 mb-1">{item.q}</p>
              <p className="text-xs text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 §2.6, §3.1, §3.2, §3.7, §3.6.4</Note>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 — Communication, Media & SARWATCH
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_6_SLIDES: SlideContent[] = [
  {
    id: "m6-s1",
    title: "Critical Numbers — Quick Reference",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Memorise these numbers. Every minute matters in an emergency.</p>
        <SectionHeader>Emergency Numbers</SectionHeader>
        <div className="space-y-2">
          <PhoneCard role="External emergency services" number="000" highlight />
          <PhoneCard role="RFDSSE Emergency Response (1800 DRS FLY)" number="1800 377 359" highlight />
          <PhoneCard role="RFDS Retrieval Consultant (DR HELP)" number="1800 374 357" />
          <PhoneCard role="Alternate Ops (if 1800 377 359 offline)" number="(02) 6841 2551" />
          <PhoneCard role="D&T Urgent Assistance (if line offline)" number="1300 856 636" />
        </div>
        <SectionHeader>Senior Leadership</SectionHeader>
        <div className="space-y-1.5">
          <PhoneCard role="CEO" number="0419 767 284" />
          <PhoneCard role="EGM Aviation & Operations" number="0477 058 998" />
          <PhoneCard role="Head of Aviation Ops & Service Delivery" number="0447 637 798" />
          <PhoneCard role="HORA — Head of Risk & Assurance" number="0426 165 220" />
          <PhoneCard role="EGM Health & Clinical Services" number="0409 903 325" />
          <PhoneCard role="EGM Corporate Services (CFO)" number="0419 130 828" />
          <PhoneCard role="Head of Corporate Affairs" number="0407 583 854" />
        </div>
        <Note>Source: ERP001 V4.7 §6.1 — Internal Key Personnel Contact Numbers</Note>
      </div>
    ),
  },
  {
    id: "m6-s2",
    title: "Social Media Rules During an Emergency",
    body: (
      <div className="space-y-4">
        <Warning>Employees must NOT post or respond on social media during an emergency. Do not confirm or deny facts to anyone — not journalists, not the public, not on social media.</Warning>
        <SectionHeader>What You Must Do</SectionHeader>
        <ul className="space-y-2">
          <KeyPoint>If you see concerning social media content — take a screenshot and send to <strong>galah@rfdsse.org.au</strong></KeyPoint>
          <KeyPoint>Or call the RFDSSE Emergency Number and provide the screenshot or link</KeyPoint>
          <KeyPoint>Corporate Affairs Team handles all monitoring and response during an emergency</KeyPoint>
        </ul>
        <SectionHeader>Who Speaks to Media</SectionHeader>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-semibold text-red-300">ONLY two people may speak to media:</p>
          <ul className="mt-2 space-y-1">
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">Chief Executive Officer (CEO)</strong></li>
            <li className="text-xs text-muted-foreground">• <strong className="text-foreground">GM Corporate Affairs and Fundraising</strong> (or their delegate)</li>
          </ul>
        </div>
        <SectionHeader>If Journalist Pushes for Comment</SectionHeader>
        <div className="p-3 rounded-lg bg-muted/30 border border-border italic">
          <p className="text-sm text-foreground">"Can I please take down your details and I will ask someone from our Media Team to contact you."</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Even if they say they're on deadline — do not comment. Record their details and forward to GM Corporate Affairs.</p>
        <Note>Source: ERP001 V4.7 §3.5 — Communication Plan & §3.5.4 — Social Media</Note>
      </div>
    ),
  },
  {
    id: "m6-s3",
    title: "Key Rules to Remember — Final Review",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Critical rules every ops team member must know without hesitation:</p>
        <div className="space-y-2">
          {[
            { rule: "000 first, then 1800 377 359", detail: "Always call external emergency services first if life is at risk, then RFDSSE emergency line" },
            { rule: "Media team — ALWAYS notified", detail: "Regardless of code level — even minor events. Send brief to galah@rfdsse.org.au" },
            { rule: "Pandemic Plan overrides ERP", detail: "If Pandemic Plan is active, ERP is NOT activated" },
            { rule: "IAT always starts Code Yellow", detail: "EC designates Yellow at IAT commencement — may upgrade to Amber/Red" },
            { rule: "Code can change at any time", detail: "Codes may be upgraded OR downgraded as the situation evolves" },
            { rule: "Hard copies → ERP@rfdsse.org.au", detail: "If paper checklists used due to no tech access, must email to that address" },
            { rule: "HORA + Head Clinical Gov only", detail: "Only these two can release documentation to regulatory authorities" },
            { rule: "No social media during emergency", detail: "Screenshot and forward to galah@rfdsse.org.au — do not post or comment" },
            { rule: "EC cannot be reached — try next", detail: "Never delay waiting for one specific EC. Move to the next on the list immediately" },
            { rule: "Drills every 12 months", detail: "All key personnel must participate or observe — table-top or full exercise" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border">
              <CheckCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400">{item.rule}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 Emergency Response Plan V4.7 — All Sections</Note>
      </div>
    ),
  },
  {
    id: "m6-s4",
    title: "Scenario Bank — Test Yourself",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Work through each scenario — answers below each question:</p>
        <div className="space-y-3">
          {[
            {
              scenario: "A bomb threat is received at Dubbo base. Unverified. What code?",
              answer: "Code Red — bomb threats are explicitly listed as Code Red in the ERP.",
            },
            {
              scenario: "A journalist calls Ops during an active Code Amber event asking for details.",
              answer: "Take down journalist details (name, outlet, question, phone, email, deadline) and advise Media Team will call them back. Do NOT confirm or deny any facts.",
            },
            {
              scenario: "Emergency line 1800 377 359 is offline. A patient transport booking comes in.",
              answer: "(02) 6841 2551 is the alternate number — use same process for both patient transport and internal emergency calls while the main line is offline.",
            },
            {
              scenario: "A cyclone warning is issued with gale force winds affecting RFDSSE areas. What code?",
              answer: "Code Red — cyclone warnings with gale force or strong winds expected to impact RFDSSE are a Code Red Natural Disaster Event.",
            },
            {
              scenario: "During Code Red, the situation improves significantly. Can the code change?",
              answer: "Yes — codes may be upgraded OR downgraded at any time as the situation changes. The Emergency Coordinator makes this determination.",
            },
            {
              scenario: "Computer systems are down during the emergency. You complete Appendix A on paper. What next?",
              answer: "Once technology is restored, send the hard copy to ERP@rfdsse.org.au to centralise all information.",
            },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-xs font-semibold text-red-400 mb-1">Scenario {i + 1}: {item.scenario}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">→ {item.answer}</p>
            </div>
          ))}
        </div>
        <Note>Source: ERP001 V4.7 — Multiple Sections</Note>
      </div>
    ),
  },
  {
    id: "m6-s5",
    title: "ERP Quick Reference Card",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Your single-page reference for the most time-critical information:</p>

        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40">
          <p className="text-xs font-bold text-red-400 mb-2">STEP 1 — IMMEDIATE</p>
          <p className="text-xs text-foreground">1. Assess situation → 2. Provide medical support if safe → 3. Call <strong>000</strong> if required → 4. Call <strong>1800 377 359</strong></p>
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs font-bold text-yellow-400 mb-1">FIVE QUESTIONS FOR 1800 377 359</p>
          <p className="text-xs text-foreground">WHO · WHERE · WHEN · WHAT · HOW</p>
        </div>

        <Table
          headers={["Code", "Level", "EC Response"]}
          rows={[
            [<span key="1" className="text-yellow-300 font-bold">Yellow</span>, "Minor–Moderate", "IAT activated · Monitor situation"],
            [<span key="2" className="text-amber-300 font-bold">Amber</span>, "Serious", "ERP activated · ECC established"],
            [<span key="3" className="text-red-300 font-bold">Red</span>, "Emergency", "Full response · ECC + APSF if needed"],
          ]}
        />

        <Table
          headers={["Mayday/Pan", "Response"]}
          rows={[
            [<span key="1" className="text-red-300 font-bold">MAYDAY</span>, "Full Emergency — multiple ambo + fire crews"],
            [<span key="2" className="text-amber-300 font-bold">PAN PAN</span>, "Local Standby — ambo if patients on board"],
          ]}
        />

        <Table
          headers={["SARWATCH Phase", "Ops Centre Action"]}
          rows={[
            ["INCERFA", "Confirm aircraft status"],
            ["ALERFA", "Notify EC — consider IAT"],
            ["DISTRESSFA", "Code Red — activate ERP"],
          ]}
        />
        <Note>Source: ERP001 V4.7 — All Sections. Review annually or when document is updated.</Note>
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
    title: "ERP Foundations & Event Classification",
    subtitle: "Purpose, PPRR framework, three event types, Mayday vs PAN PAN, checklists",
    color: "text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/30",
    bar: "bg-red-500",
    icon: <Shield size={18} />,
    slides: MODULE_1_SLIDES,
  },
  {
    id: "m2",
    number: 2,
    title: "Emergency Codes & Notification",
    subtitle: "Code Yellow/Amber/Red criteria, ERP poster, five questions, emergency numbers",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    bar: "bg-amber-500",
    icon: <AlertTriangle size={18} />,
    slides: MODULE_2_SLIDES,
  },
  {
    id: "m3",
    number: 3,
    title: "Operations Centre Procedures",
    subtitle: "Appendix A, post-call sequence, SARWATCH phases, contract interface, regulatory authorities",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/30",
    bar: "bg-blue-500",
    icon: <Radio size={18} />,
    slides: MODULE_3_SLIDES,
  },
  {
    id: "m4",
    number: 4,
    title: "Initial Assessment Team (IAT)",
    subtitle: "IAT purpose, activation sequence, member lists by event type, APSF, drill scenario",
    color: "text-purple-400",
    bg: "bg-purple-500/5",
    border: "border-purple-500/30",
    bar: "bg-purple-500",
    icon: <Users size={18} />,
    slides: MODULE_4_SLIDES,
  },
  {
    id: "m5",
    number: 5,
    title: "Emergency Coordination Centre (ECC)",
    subtitle: "ECC roles, three locations, Chairperson/Scribe, full activation flow, comms plan",
    color: "text-green-400",
    bg: "bg-green-500/5",
    border: "border-green-500/30",
    bar: "bg-green-500",
    icon: <MapPin size={18} />,
    slides: MODULE_5_SLIDES,
  },
  {
    id: "m6",
    number: 6,
    title: "Communication, Media & SARWATCH",
    subtitle: "All key numbers, social media rules, media response script, scenario bank, quick reference card",
    color: "text-orange-400",
    bg: "bg-orange-500/5",
    border: "border-orange-500/30",
    bar: "bg-orange-500",
    icon: <Megaphone size={18} />,
    slides: MODULE_6_SLIDES,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CBTEmergencyResponsePlan() {
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

  function markSlide(modId: string, idx: number) {
    setCompletedSlides(prev => {
      const s = new Set(prev[modId] ?? []);
      s.add(idx);
      return { ...prev, [modId]: s };
    });
  }

  function nextSlide() {
    if (!activeModule) return;
    const next = slideIndex + 1;
    if (next < activeModule.slides.length) {
      markSlide(activeModule.id, slideIndex);
      setSlideIndex(next);
    } else {
      markSlide(activeModule.id, slideIndex);
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

  // ── HOME ────────────────────────────────────────────────────────────────
  if (phase === "home") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Emergency Response Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              ERP001 V4.7 · Effective 18 June 2026 · Approved by HORA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">OPS TEAM</span>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Progress</span>
            <span className="text-xs font-bold text-red-400">{overallPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-2 rounded-full bg-red-500 transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{viewedSlides} of {totalSlides} slides reviewed</span>
            <span className="text-xs text-muted-foreground">{completedModules.size}/{CBT_MODULES.length} modules complete</span>
          </div>
        </div>

        {/* Emergency Quick Reference Banner */}
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <Phone size={16} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-300">Emergency Numbers at a Glance</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <strong className="text-foreground">000</strong> (external) · <strong className="text-foreground">1800 377 359</strong> (RFDSSE) · <strong className="text-foreground">(02) 6841 2551</strong> (alternate if 1800 377 359 offline)
            </p>
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
                className={`w-full text-left p-4 rounded-xl border transition-all hover:border-red-500/30 ${isComplete ? `${mod.bg} ${mod.border}` : "bg-card border-border hover:bg-muted/10"}`}
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

        <div className="p-3 rounded-xl bg-muted/20 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Source:</strong> ERP001 Emergency Response Plan V4.7 — Approved by Head of Risk and Assurance. Effective Date: 18 June 2026. Due for Review: 18 June 2027. This CBT is for training purposes only — always refer to the current master ERP document on the Document Management System.
          </p>
          <p className="text-xs text-red-400 mt-1.5 font-semibold">INTERNAL USE ONLY — must not be shared externally without HORA approval.</p>
        </div>
      </div>
    );
  }

  // ── SLIDE VIEW ────────────────────────────────────────────────────────────
  if (phase === "module" && activeModule) {
    const slide = activeModule.slides[slideIndex];
    const isLast = slideIndex === activeModule.slides.length - 1;
    const slidePct = Math.round(((slideIndex + 1) / activeModule.slides.length) * 100);

    return (
      <div className="flex flex-col h-full min-h-[600px]">
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

        <div className="h-1 bg-border flex-shrink-0">
          <div className={`h-1 ${activeModule.bar} transition-all duration-500`} style={{ width: `${slidePct}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {slide.title}
          </h2>
          <div>{slide.body}</div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={prevSlide}
            disabled={slideIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Previous
          </button>

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
            {isLast ? <><Award size={14} /> Complete Module</> : <>Next <ChevronRight size={14} /></>}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
