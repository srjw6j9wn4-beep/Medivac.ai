import { useState } from "react";
import { type UserRole } from "@/lib/data";
import { PlayCircle, CheckCircle, ChevronRight, Star, Users, Shield, Plane, BarChart3, MessageCircle, Tablet, Smartphone } from "lucide-react";

interface Props { role: UserRole; }

// ─── Device frame components ────────────────────────────────────────────────

function IPadFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Tablet size={12} />{label}
      </div>
      {/* iPad shell */}
      <div className="relative bg-[#1a1a2e] border-[3px] border-[#2a2a4a] rounded-[20px] shadow-2xl" style={{ width: 280, height: 380 }}>
        {/* Top bar — camera + speaker */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center pt-2 pb-1 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#333] mr-2" />
          <div className="w-10 h-1 rounded-full bg-[#333]" />
        </div>
        {/* Home button */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border border-[#333] z-10" />
        {/* Screen */}
        <div className="absolute inset-0 top-6 bottom-7 mx-1 rounded-[14px] overflow-hidden bg-[#0f172a]">
          {children}
        </div>
      </div>
    </div>
  );
}

function IPhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Smartphone size={12} />{label}
      </div>
      {/* iPhone shell */}
      <div className="relative bg-[#1a1a2e] border-[3px] border-[#2a2a4a] rounded-[28px] shadow-2xl" style={{ width: 170, height: 340 }}>
        {/* Dynamic island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-full bg-[#111] z-10" />
        {/* Side button */}
        <div className="absolute right-[-5px] top-16 w-1 h-8 rounded-full bg-[#2a2a4a]" />
        {/* Volume buttons */}
        <div className="absolute left-[-5px] top-14 w-1 h-5 rounded-full bg-[#2a2a4a]" />
        <div className="absolute left-[-5px] top-22 w-1 h-5 rounded-full bg-[#2a2a4a]" />
        {/* Screen */}
        <div className="absolute inset-0 top-5 bottom-4 mx-0.5 rounded-[24px] overflow-hidden bg-[#0f172a]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Pilot iPad screen ───────────────────────────────────────────────────────

function PilotIPadScreen() {
  return (
    <div className="h-full flex flex-col text-white overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1628] border-b border-white/10">
        <span className="text-[8px] font-bold text-cyan-400">MEDIVAC 01</span>
        <span className="text-[7px] text-white/50">06:18 AEST</span>
      </div>
      {/* Mission header */}
      <div className="px-3 py-2 bg-gradient-to-b from-[#0e2040] to-transparent">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[8px] font-bold text-green-400 uppercase tracking-wider">All Gates Green — Ready for Dispatch</span>
        </div>
        <div className="text-[11px] font-bold">YSDU → YSSY</div>
        <div className="text-[8px] text-white/60">VH-MVW · B200 · P1 Medivac</div>
      </div>
      {/* Release gates */}
      <div className="px-3 py-1.5 space-y-1">
        <div className="text-[7px] text-white/40 uppercase tracking-wider font-semibold mb-1">Release Gates</div>
        {[
          "Flight Plan Filed", "W&B Calculated", "APG Release",
          "Medical Crew Release", "Maintenance Release", "Fuel Confirmed"
        ].map(g => (
          <div key={g} className="flex items-center gap-1.5">
            <CheckCircle size={7} className="text-green-400 shrink-0" />
            <span className="text-[8px] text-white/80">{g}</span>
          </div>
        ))}
      </div>
      {/* ETD / ETA */}
      <div className="mx-3 mt-1 bg-white/5 rounded-lg p-2 flex justify-between">
        <div className="text-center">
          <div className="text-[8px] text-white/40">ETD</div>
          <div className="text-[11px] font-bold text-cyan-400">06:30</div>
        </div>
        <div className="text-center">
          <div className="text-[8px] text-white/40">ETA</div>
          <div className="text-[11px] font-bold">08:15</div>
        </div>
        <div className="text-center">
          <div className="text-[8px] text-white/40">Fuel</div>
          <div className="text-[11px] font-bold text-amber-400">3,420 lb</div>
        </div>
      </div>
      {/* Crew */}
      <div className="mx-3 mt-2 space-y-1">
        <div className="text-[7px] text-white/40 uppercase tracking-wider font-semibold">Crew</div>
        {["✈ Capt. R. Hughes (PIC)", "🏥 S. Mitchell RN", "⚕ Dr. K. Patel"].map(c => (
          <div key={c} className="text-[8px] text-white/70">{c}</div>
        ))}
      </div>
      {/* Acknowledge button */}
      <div className="mx-3 mt-auto mb-3">
        <div className="bg-cyan-500/20 border border-cyan-500/40 rounded-lg py-1.5 text-center">
          <span className="text-[9px] font-bold text-cyan-400">Acknowledge & Sign Off</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pilot iPhone screen ─────────────────────────────────────────────────────

function PilotIPhoneScreen() {
  return (
    <div className="h-full flex flex-col text-white overflow-hidden pt-4" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="px-2.5 flex items-center justify-between mb-2">
        <span className="text-[8px] font-bold text-cyan-400">My Mission</span>
        <span className="text-[7px] text-white/40">06:18</span>
      </div>
      {/* Big mission card */}
      <div className="mx-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2 mb-2">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[7px] text-green-400 font-bold">RELEASED</span>
        </div>
        <div className="text-[11px] font-bold">MEDIVAC 01</div>
        <div className="text-[8px] text-white/60">YSDU → YSSY · P1</div>
        <div className="flex justify-between mt-1.5">
          <div className="text-center">
            <div className="text-[7px] text-white/40">ETD</div>
            <div className="text-[9px] font-bold text-cyan-400">06:30</div>
          </div>
          <div className="text-center">
            <div className="text-[7px] text-white/40">Aircraft</div>
            <div className="text-[9px] font-bold">VH-MVW</div>
          </div>
        </div>
      </div>
      {/* Duty hours */}
      <div className="mx-2 bg-white/5 rounded-xl p-2 mb-2">
        <div className="text-[7px] text-white/40 mb-1 uppercase font-semibold">Duty Hours</div>
        <div className="flex justify-between text-[8px] mb-1">
          <span>62 / 100 hrs</span>
          <span className="text-green-400">Within limit</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 rounded-full" style={{ width: "62%" }} />
        </div>
      </div>
      {/* Weather */}
      <div className="mx-2 bg-white/5 rounded-xl p-2">
        <div className="text-[7px] text-white/40 mb-1 uppercase font-semibold">Weather</div>
        <div className="text-[8px]">YSDU: CAVOK · Wind 180/08</div>
        <div className="text-[8px] text-white/60">YSSY: SCT025 · 15kt · VMC</div>
      </div>
    </div>
  );
}

// ─── Nurse iPad screen ───────────────────────────────────────────────────────

function NurseIPadScreen() {
  return (
    <div className="h-full flex flex-col text-white overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1628] border-b border-white/10">
        <span className="text-[8px] font-bold text-green-400">MEDIVAC 01 — Patient Brief</span>
        <span className="text-[7px] text-white/50">🏥 S. Mitchell RN</span>
      </div>
      {/* Patient header */}
      <div className="px-3 py-2">
        <div className="text-[11px] font-bold">Patient: J. Maher, 67M</div>
        <div className="flex gap-1.5 mt-0.5">
          <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[7px] text-red-400 font-bold">P1 STEMI</span>
          <span className="px-1.5 py-0.5 bg-white/10 rounded text-[7px] text-white/60">Walgett ED</span>
        </div>
      </div>
      {/* Vitals */}
      <div className="px-3 space-y-1 mb-2">
        <div className="text-[7px] text-white/40 uppercase font-semibold tracking-wider">Current Vitals</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "SpO₂", value: "96%", ok: true },
            { label: "HR", value: "88", ok: true },
            { label: "BP", value: "142/88", ok: false },
            { label: "RR", value: "18", ok: true },
            { label: "GCS", value: "15", ok: true },
            { label: "Temp", value: "37.1°", ok: true },
          ].map(v => (
            <div key={v.label} className={`rounded p-1 ${v.ok ? "bg-white/5" : "bg-red-500/10 border border-red-500/20"}`}>
              <div className="text-[6px] text-white/40">{v.label}</div>
              <div className={`text-[9px] font-bold ${v.ok ? "" : "text-red-400"}`}>{v.value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Medications */}
      <div className="px-3 space-y-1 mb-2">
        <div className="text-[7px] text-white/40 uppercase font-semibold tracking-wider">Medications</div>
        {["Aspirin 300mg — Administered 05:45", "GTN 0.4mg SL — 05:50"].map(m => (
          <div key={m} className="flex items-center gap-1">
            <CheckCircle size={7} className="text-green-400 shrink-0" />
            <span className="text-[7px] text-white/70">{m}</span>
          </div>
        ))}
      </div>
      {/* Clinical notes */}
      <div className="mx-3 flex-1 bg-white/5 rounded-lg p-2">
        <div className="text-[7px] text-white/40 uppercase font-semibold mb-1">Clinical Notes</div>
        <div className="text-[7px] text-white/60 leading-relaxed">Patient alert, oriented. Chest pain 7/10 at onset, now 3/10 post-GTN. 12-lead confirms inferior STEMI. IV access ×2. Monitoring in progress. Receiving team notified.</div>
      </div>
      <div className="mx-3 my-2">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg py-1.5 text-center">
          <span className="text-[8px] font-bold text-green-400">Handover Ready — Tap to Send</span>
        </div>
      </div>
    </div>
  );
}

// ─── Nurse iPhone screen ─────────────────────────────────────────────────────

function NurseIPhoneScreen() {
  return (
    <div className="h-full flex flex-col text-white overflow-hidden pt-4" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="px-2.5 mb-2">
        <span className="text-[8px] font-bold text-green-400">My Patient</span>
      </div>
      <div className="mx-2 bg-green-500/10 border border-green-500/30 rounded-xl p-2 mb-2">
        <div className="text-[9px] font-bold">J. Maher · 67M</div>
        <div className="text-[7px] text-red-400 font-bold">P1 STEMI — YSDU→YSSY</div>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          {[{ l: "SpO₂", v: "96%" }, { l: "HR", v: "88bpm" }, { l: "BP", v: "142/88" }, { l: "GCS", v: "15/15" }].map(x => (
            <div key={x.l} className="bg-white/5 rounded p-1">
              <div className="text-[6px] text-white/40">{x.l}</div>
              <div className="text-[9px] font-bold">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Checklist */}
      <div className="mx-2 bg-white/5 rounded-xl p-2 mb-2">
        <div className="text-[7px] text-white/40 mb-1 uppercase font-semibold">Pre-flight Checklist</div>
        {["IV access ×2 confirmed", "Oxygen connected", "Monitor attached", "Medications loaded", "Stretcher secured"].map((item, i) => (
          <div key={item} className="flex items-center gap-1 py-0.5">
            <CheckCircle size={7} className={i < 3 ? "text-green-400" : "text-white/20"} />
            <span className={`text-[7px] ${i < 3 ? "text-white/80" : "text-white/30"}`}>{item}</span>
          </div>
        ))}
      </div>
      {/* Telehealth */}
      <div className="mx-2 bg-white/5 rounded-xl p-2">
        <div className="text-[7px] text-white/40 mb-0.5 uppercase font-semibold">Telehealth</div>
        <div className="text-[7px] text-cyan-400">Dr. K. Patel — Connected ●</div>
      </div>
    </div>
  );
}

// ─── Doctor iPad screen ──────────────────────────────────────────────────────

function DoctorIPadScreen() {
  return (
    <div className="h-full flex flex-col text-white overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1628] border-b border-white/10">
        <span className="text-[8px] font-bold text-cyan-400">AI Mission Analyst</span>
        <span className="text-[7px] text-white/50">⚕ Dr. K. Patel</span>
      </div>
      {/* AI summary */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[8px] font-bold text-cyan-400">Jennifer</span>
          <span className="text-[7px] text-white/40">GPT-4o · Mission context loaded</span>
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2 text-[7px] text-white/80 leading-relaxed">
          M001 — Inferior STEMI, 67yo male. ETA YSSY 08:15. Cardiac cath lab pre-notified via HealthConnect. BP elevated — consider additional anti-hypertensive in-flight if systolic &gt;160. Crew optimal for case complexity. Confidence: 94%.
        </div>
      </div>
      {/* Risk matrix */}
      <div className="px-3 mb-2">
        <div className="text-[7px] text-white/40 uppercase font-semibold tracking-wider mb-1">Risk Assessment</div>
        {[
          { label: "Patient instability", level: "Medium", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
          { label: "Weather enroute", level: "Low", color: "text-green-400 border-green-400/30 bg-green-400/10" },
          { label: "Crew duty hours", level: "Low", color: "text-green-400 border-green-400/30 bg-green-400/10" },
        ].map(r => (
          <div key={r.label} className={`flex items-center justify-between p-1.5 rounded border mb-1 ${r.color}`}>
            <span className="text-[7px]">{r.label}</span>
            <span className={`text-[7px] font-bold ${r.color.split(" ")[0]}`}>{r.level}</span>
          </div>
        ))}
      </div>
      {/* Recommendation */}
      <div className="mx-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 mb-2">
        <div className="text-[7px] text-cyan-400 font-bold mb-0.5">Recommendation</div>
        <div className="text-[7px] text-white/80">PROCEED — All gates green. Brief crew on deterioration protocol. Alert cath lab at 30 min out.</div>
      </div>
      {/* Telehealth button */}
      <div className="mx-3">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg py-1.5 text-center">
          <span className="text-[8px] font-bold text-green-400">Launch Telehealth Session</span>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor iPhone screen ────────────────────────────────────────────────────

function DoctorIPhoneScreen() {
  return (
    <div className="h-full flex flex-col text-white overflow-hidden pt-4" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="px-2.5 mb-2">
        <span className="text-[8px] font-bold text-cyan-400">Jennifer AI</span>
      </div>
      {/* Chat bubble */}
      <div className="mx-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2 mb-2">
        <div className="text-[7px] text-cyan-400 font-bold mb-0.5">Jennifer</div>
        <div className="text-[7px] text-white/80 leading-relaxed">Inferior STEMI confirmed. Cath lab pre-alerted. Recommend anti-hypertensive review if BP &gt;160 systolic enroute.</div>
      </div>
      {/* Consults */}
      <div className="mx-2 bg-white/5 rounded-xl p-2 mb-2">
        <div className="text-[7px] text-white/40 mb-1 uppercase font-semibold">Active Consults</div>
        <div className="flex items-center gap-1 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[7px]">MEDIVAC 01 — J. Maher</span>
        </div>
        <div className="flex items-center gap-1 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[7px]">MEDIVAC 02 — Scheduled 09:00</span>
        </div>
      </div>
      {/* ISO score */}
      <div className="mx-2 bg-white/5 rounded-xl p-2">
        <div className="text-[7px] text-white/40 mb-1 uppercase font-semibold">ISO 13485</div>
        <div className="flex justify-between text-[7px] mb-1">
          <span>Clinical compliance</span>
          <span className="text-green-400 font-bold">78%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full" style={{ width: "78%" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Role Demo Panel ─────────────────────────────────────────────────────────

const ROLE_DEMOS = [
  {
    id: "pilot",
    title: "Pilot View",
    icon: "✈",
    color: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    bgColor: "bg-cyan-400/5",
    description: "Mission release status, ETD/ETA, fuel load, duty hours and weather — everything a pilot needs at a glance, nothing they don't.",
    features: ["Release gate summary (all-green or blocked)", "Fuel uplift in lb", "Crew manifest", "Duty hour tracker", "One-tap sign-off"],
    iPadScreen: <PilotIPadScreen />,
    iPhoneScreen: <PilotIPhoneScreen />,
  },
  {
    id: "nurse",
    title: "Flight Nurse View",
    icon: "🏥",
    color: "text-green-400",
    borderColor: "border-green-400/30",
    bgColor: "bg-green-400/5",
    description: "Patient handover brief, live vitals, pre-flight clinical checklist, and telehealth connection — all on one screen, offline-capable.",
    features: ["Patient demographics and priority", "Live vital signs monitoring", "Medications administered", "Pre-flight clinical checklist", "Telehealth link to doctor"],
    iPadScreen: <NurseIPadScreen />,
    iPhoneScreen: <NurseIPhoneScreen />,
  },
  {
    id: "doctor",
    title: "Flight Doctor View",
    icon: "⚕",
    color: "text-blue-400",
    borderColor: "border-blue-400/30",
    bgColor: "bg-blue-400/5",
    description: "Jennifer AI brief, risk assessment, clinical recommendations, and telehealth session launch — the decision-support layer for in-flight doctors.",
    features: ["AI mission analysis with confidence score", "Risk matrix (patient, weather, crew)", "Jennifer recommendation", "Telehealth session control", "ISO 13485 clinical compliance"],
    iPadScreen: <DoctorIPadScreen />,
    iPhoneScreen: <DoctorIPhoneScreen />,
  },
];

// ─── Demo Steps ──────────────────────────────────────────────────────────────

const DEMO_STEPS = [
  { id: 1, title: "Welcome & Intro", cue: "Jennifer intro video", talking: "Medivac.ai is an end-to-end aeromedical operations platform for King Air B200/B300 fleets, built for RFDS-style operators.", done: true },
  { id: 2, title: "Mission Acceptance Story", cue: "Navigate to Mission Board", talking: "Walk through a live P1 Medivac from NEPT call → dispatch intake → release gates → airborne. Show how every compliance gate is enforced.", done: true },
  { id: 3, title: "Compliance Gate Demo", cue: "Open MEDIVAC 02 (blocked)", talking: "Show dispatch BLOCKED state — APG release and fuel missing. Explain how the system prevents premature release. CASA audit trail is automatic.", done: false },
  { id: 4, title: "iPad & iPhone Role Demo", cue: "Demo Mode — Device Views tab", talking: "Show how each role sees a purpose-built screen. Pilot gets release gates and fuel. Nurse gets patient vitals and checklist. Doctor gets Jennifer AI brief.", done: false },
  { id: 5, title: "ISO Compliance Score", cue: "Switch to Safety role → ISO page", talking: "Live readiness scoring across ISO 9001, 13485, 27001, and 25010. Evidence packs, CAPA tracking, certification critical path.", done: false },
  { id: 6, title: "Jennifer Q&A Demo", cue: "Open AI Mission Analyst", talking: "Let the client ask Jennifer a capability question. Demonstrate voice input and lip-sync response. Position as a white-label option.", done: false },
  { id: 7, title: "Reporting Value", cue: "Navigate to Audit & Reports", talking: "One-click weekly, monthly, and financial-year packs. CASA audit export. Fuel reconciliation. Crew hours vs Air Maestro.", done: false },
  { id: 8, title: "Pilot Program Ask", cue: "Return to this page", talking: "We'd love to run a 90-day pilot with your operations team at no cost. Three aircraft, full feature access, dedicated onboarding support.", done: false },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function DemoMode({ role }: Props) {
  const [tab, setTab] = useState<"runsheet" | "devices" | "qa">("devices");
  const [selectedRole, setSelectedRole] = useState(ROLE_DEMOS[0]);

  const tabs = [
    { id: "devices", label: "iPad & iPhone Demo" },
    { id: "runsheet", label: "Run-of-Show" },
    { id: "qa", label: "Client Q&A" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
          <PlayCircle size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Client Demo Mode</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Guided run-of-show · Device mockups · Role-based views · Talking points</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Demo Ready</span>
        </div>
      </div>

      {/* Proof points */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Plane size={16} />, label: "3 aircraft types", sub: "B200/B300 fleet" },
          { icon: <Users size={16} />, label: "8 role types", sub: "Full RBAC" },
          { icon: <Shield size={16} />, label: "4 ISO standards", sub: "Cert. ready" },
          { icon: <BarChart3 size={16} />, label: "Live audit trail", sub: "CASA export" },
        ].map((p, i) => (
          <div key={i} className="bg-card rounded-xl border border-card-border p-3 flex items-center gap-3">
            <div className="text-cyan-400">{p.icon}</div>
            <div>
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Device Demo tab ── */}
      {tab === "devices" && (
        <div className="space-y-6">
          {/* Role selector */}
          <div className="flex gap-2 flex-wrap">
            {ROLE_DEMOS.map(r => (
              <button key={r.id} onClick={() => setSelectedRole(r)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${selectedRole.id === r.id ? `${r.bgColor} ${r.borderColor} ${r.color}` : "bg-card border-card-border text-muted-foreground hover:text-foreground"}`}>
                <span>{r.icon}</span>{r.title}
              </button>
            ))}
          </div>

          {/* Description + features */}
          <div className={`${selectedRole.bgColor} border ${selectedRole.borderColor} rounded-xl p-4`}>
            <p className="text-sm mb-3">{selectedRole.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedRole.features.map(f => (
                <span key={f} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-background/60 border border-card-border rounded-full">
                  <CheckCircle size={10} className={selectedRole.color} />{f}
                </span>
              ))}
            </div>
          </div>

          {/* Device mockups */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 py-4">
            <IPadFrame label="iPad (landscape ready)">{selectedRole.iPadScreen}</IPadFrame>
            <IPhoneFrame label="iPhone">{selectedRole.iPhoneScreen}</IPhoneFrame>
          </div>

          {/* Talking point */}
          <div className="bg-card border border-card-border rounded-xl p-4 flex gap-3">
            <MessageCircle size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-cyan-400 mb-1">Demo Talking Point — {selectedRole.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedRole.id === "pilot" && "\"A pilot opens the app and immediately sees their mission is fully released — every gate green. Fuel load in pounds, ETD, ETA, and one-tap acknowledgement. No noise, no complexity. If a gate was missing, the dispatch button is locked. The system enforces the process, not the person.\""}
                {selectedRole.id === "nurse" && "\"The flight nurse has the patient brief before they board — vitals, medications given, clinical notes, and a checklist to complete before wheels up. If connectivity drops in the aircraft, the app keeps working offline and syncs when they land. Telehealth links straight to the doctor.\""}
                {selectedRole.id === "doctor" && "\"The flight doctor gets Jennifer's AI brief — case summary, risk matrix, a recommendation, and confidence score. They can launch a telehealth session directly from the app. ISO 13485 clinical compliance is tracked automatically — every consult generates an audit record.\""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Run-of-Show tab ── */}
      {tab === "runsheet" && (
        <div className="space-y-2">
          {DEMO_STEPS.map(step => (
            <div key={step.id} className={`p-4 rounded-xl border transition-all ${step.done ? "bg-green-500/5 border-green-500/20 opacity-60" : "bg-card border-card-border hover:border-cyan-500/30"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step.done ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-muted border-border text-muted-foreground"}`}>
                  {step.done ? "✓" : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{step.title}</span>
                    <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">→ {step.cue}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">"{step.talking}"</p>
                </div>
                {!step.done && <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />}
              </div>
            </div>
          ))}

          {/* Pilot program ask */}
          <div className="p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-background mt-4">
            <div className="flex items-center gap-3 mb-2">
              <Star size={18} className="text-cyan-400" />
              <h2 className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Closing — Pilot Program Ask</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              "We'd love to run a <strong className="text-foreground">90-day pilot</strong> with your operations team at no cost — three aircraft, full feature access, and dedicated onboarding support. Our goal is to show you measurable improvement in dispatch speed, compliance confidence, and audit readiness within the first 30 days."
            </p>
          </div>
        </div>
      )}

      {/* ── Client Q&A tab ── */}
      {tab === "qa" && (
        <div className="bg-card rounded-xl border border-card-border p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <MessageCircle size={14} />Client Q&A Prompts
          </h2>
          <div className="grid lg:grid-cols-2 gap-3">
            {[
              { q: "How does this integrate with Air Maestro?", a: "Medivac.ai uses Air Maestro as the source of truth for crew hours, FRMS, training, and currency. All data syncs in real time." },
              { q: "Can we customise the roles and permissions?", a: "Fully. The RBAC model supports custom role templates, mission-scoped permissions, and break-glass access with full audit logging." },
              { q: "How does the CASA audit export work?", a: "Every mission generates an audit package — flight plan, W&B, APG release, crew sign-offs, and medical documentation — exportable as a single PDF." },
              { q: "What happens if connectivity is lost in the air?", a: "The app caches mission data locally. Clinical documentation can be completed offline and syncs when connectivity is restored." },
              { q: "Can pilots and nurses use it on their own devices?", a: "Yes. The app is optimised for iPad and iPhone, with role-gated views so each crew member only sees what's relevant to their job." },
              { q: "How is patient data protected?", a: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Australian data sovereignty — hosted in ap-southeast-2 Sydney. ISO 27001 controls in place." },
            ].map((qa, i) => (
              <div key={i} className="p-3 bg-background rounded-lg border border-border">
                <div className="text-xs font-semibold text-foreground mb-1 flex items-start gap-1.5">
                  <Star size={11} className="text-yellow-400 flex-shrink-0 mt-0.5" />{qa.q}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{qa.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
