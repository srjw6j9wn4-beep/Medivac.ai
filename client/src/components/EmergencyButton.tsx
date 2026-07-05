import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, X, Radio, Shield, CheckCircle2, Clock,
  PhoneCall, Plane, MapPin, Siren, Truck, Flame,
  AlertCircle, ToggleLeft, ToggleRight,
} from "lucide-react";
import type { UserRole } from "@/lib/data";

// ── Role gates ─────────────────────────────────────────────
const EMERGENCY_ROLES: UserRole[] = [
  "pilot", "nurse", "senior_flight_nurse", "doctor", "dispatcher",
];
const DISPATCH_ROLES: UserRole[] = ["dispatcher"];

// ── Role display labels ────────────────────────────────────
const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  pilot:               "Pilot in Command",
  nurse:               "Flight Nurse",
  senior_flight_nurse: "Senior Flight Nurse",
  doctor:              "Flight Doctor",
  dispatcher:          "Dispatch / Operations",
};

// ── Protocol checklists by phase ───────────────────────────
const AIRBORNE_STEPS = [
  { id: 1,  label: "Declare MAYDAY/PAN PAN on 121.5 MHz",        atc: true,      svc: "atc"      },
  { id: 2,  label: "Set transponder 7700",                        atc: true,      svc: "atc"      },
  { id: 3,  label: "Attempt diversion to nearest suitable strip", atc: false,     svc: "crew"     },
  { id: 4,  label: "Alert Base Ops — Dispatch phone/radio",       atc: false,     svc: "dispatch" },
  { id: 5,  label: "Activate EPIRB / ELT if required",           atc: false,     svc: "crew"     },
  { id: 6,  label: "Notify Medical Director on call",             atc: false,     svc: "dispatch" },
  { id: 7,  label: "Contact receiving hospital / trauma team",    atc: false,     svc: "dispatch" },
  { id: 8,  label: "Initiate SAR if overdue — JRCC 1800 815 257",atc: false,     svc: "dispatch" },
  { id: 9,  label: "Document all times & crew actions",           atc: false,     svc: "crew"     },
  { id: 10, label: "Notify ATSB if accident/serious incident",    atc: false,     svc: "dispatch" },
];

const GROUND_STEPS = [
  { id: 1,  label: "Call 000 — Confirm Police, Fire & Ambulance en route", svc: "000"      },
  { id: 2,  label: "Assess scene safety before approaching",                svc: "crew"     },
  { id: 3,  label: "Notify Dispatch — Base Ops phone/radio",               svc: "dispatch" },
  { id: 4,  label: "Establish patient count & triage priority",             svc: "crew"     },
  { id: 5,  label: "Position aircraft / vehicle to mark scene for services",svc: "crew"     },
  { id: 6,  label: "Advise Dispatch: GPS coords, road name, hazards",       svc: "dispatch" },
  { id: 7,  label: "Coordinate with Police — scene commander handover",     svc: "police"   },
  { id: 8,  label: "Brief incoming Ambulance — patient status & access",    svc: "ambo"     },
  { id: 9,  label: "Fire service: hazmat / entrapment / fuel spill",        svc: "fire"     },
  { id: 10, label: "Notify Medical Director — critical patient authority",  svc: "dispatch" },
  { id: 11, label: "Document scene, times, actions & hand-off",             svc: "crew"     },
];

// ── Service badge colours — HIGH CONTRAST on bright red bg ─
// Solid white-toned backgrounds so badges pop off rgb(160,0,0)
const SVC_STYLE: Record<string, string> = {
  atc:      "bg-white/90 text-cyan-800 border-cyan-300",
  dispatch: "bg-white/90 text-orange-800 border-orange-300",
  crew:     "bg-white/80 text-gray-700 border-gray-300",
  "000":    "bg-white/90 text-red-800 border-red-300",
  police:   "bg-white/90 text-blue-800 border-blue-300",
  ambo:     "bg-white/90 text-green-800 border-green-300",
  fire:     "bg-white/90 text-amber-800 border-amber-300",
};
const SVC_LABEL: Record<string, string> = {
  atc: "ATC", dispatch: "Dispatch", crew: "Crew",
  "000": "Triple Zero", police: "Police", ambo: "Ambulance", fire: "Fire",
};

type Phase = "airborne" | "ground";

// ── Shared overlay component (used by both desktop portal & mobile portal) ──
interface OverlayProps {
  event: { timestamp: string; role: string; phase: Phase };
  isAirborne: boolean;
  pulse: boolean;
  steps: Array<{ id: number; label: string; done: boolean; svc?: string; atc?: boolean }>;
  isDispatch: boolean;
  toggleStep: (id: number) => void;
  standDown: () => void;
  atcPanel: boolean;
  emergencyServicesPanel: boolean;
}

function EmergencyOverlay({
  event, isAirborne, pulse, steps, isDispatch, toggleStep, standDown, atcPanel, emergencyServicesPanel,
}: OverlayProps) {
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:9999, display:"flex", flexDirection:"column", background:"rgb(190,0,0)" }}>
      {/* Pulsing border */}
      <div className="absolute inset-0 pointer-events-none border-4 border-white transition-opacity duration-700" style={{ opacity: pulse ? 0.7 : 0.2 }} />

      {/* Header */}
      <div style={{ background:"rgb(140,0,0)", borderBottom:"3px solid #fff", flexShrink:0 }} className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4">
        <AlertTriangle size={24} style={{ color:"#fff", flexShrink:0 }} className="animate-pulse" />
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:"clamp(0.85rem,2.5vw,1.2rem)", fontWeight:900, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em", textShadow:"0 2px 6px rgba(0,0,0,0.5)" }}>
            EMERGENCY —{" "}
            <span style={{ color: isAirborne ? "#FFF176" : "#B9F6CA" }}>{isAirborne ? "AIRBORNE" : "ON GROUND"}</span>
          </div>
          <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.9)", marginTop:"2px", fontFamily:"monospace" }} className="truncate">
            {event.timestamp} · {event.role}
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"right" }}>
          <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Status</div>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:"5px", justifyContent:"flex-end" }}>
            <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#fff" }} className="animate-pulse" />
            ACTIVE
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", background:"rgb(190,0,0)", padding:"1rem" }}>
        <div className="max-w-5xl mx-auto space-y-3">

          {/* Notification panels */}
          <div className={`grid gap-3 ${isAirborne ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
            {/* ATC */}
            {atcPanel && (
              <div style={{ borderRadius:"10px", border:"2px solid rgba(255,255,255,0.5)", background:"rgba(0,0,0,0.35)", padding:"0.85rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"8px" }}>
                  <Radio size={14} style={{ color:"#67E8F9" }} />
                  <span style={{ fontSize:"11px", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em" }}>ATC Notified</span>
                  <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"3px", fontSize:"10px", color:"#86EFAC" }}><CheckCircle2 size={10}/> Transmitted</span>
                </div>
                <div style={{ background:"rgba(0,0,0,0.5)", borderRadius:"7px", padding:"8px", fontFamily:"monospace", fontSize:"10px", color:"#86EFAC", lineHeight:1.6, border:"1px solid rgba(134,239,172,0.3)" }}>
                  <div style={{ color:"#4ADE80", marginBottom:"2px" }}>▶ AUTO</div>
                  <div>MAYDAY MAYDAY MAYDAY</div>
                  <div>RFDS {event.role.toUpperCase()}</div>
                  <div>EMERGENCY DECLARED</div>
                  <div style={{ color:"#67E8F9", marginTop:"3px" }}>SQUAWK 7700</div>
                </div>
                <div style={{ marginTop:"5px", fontSize:"10px", color:"rgba(255,255,255,0.7)" }}>121.5 MHz · Transponder 7700</div>
              </div>
            )}
            {/* Dispatch */}
            <div style={{ borderRadius:"10px", border:"2px solid rgba(255,255,255,0.5)", background:"rgba(0,0,0,0.35)", padding:"0.85rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"8px" }}>
                <PhoneCall size={14} style={{ color:"#FCD34D" }} />
                <span style={{ fontSize:"11px", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em" }}>Dispatch Alerted</span>
                <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"3px", fontSize:"10px", color:"#86EFAC" }}><CheckCircle2 size={10}/> Sent</span>
              </div>
              <div style={{ background:"rgba(0,0,0,0.5)", borderRadius:"7px", padding:"8px", fontSize:"10px", color:"#FEF3C7", lineHeight:1.6, border:"1px solid rgba(253,211,77,0.3)" }}>
                <div style={{ fontWeight:700, color:"#FCD34D", marginBottom:"3px" }}>EMERGENCY ALERT</div>
                <div>By: <span style={{ fontWeight:700 }}>{event.role}</span></div>
                <div>Phase: <span style={{ fontWeight:700 }}>{isAirborne ? "AIRBORNE" : "ON GROUND"}</span></div>
                <div style={{ marginTop:"3px", color:"#FCD34D" }}>Full protocol launched in Ops Centre.</div>
              </div>
              <div style={{ marginTop:"5px", fontSize:"10px", color:"rgba(255,255,255,0.7)" }}>All dispatchers paged · Ops Centre live</div>
            </div>
            {/* Emergency Services */}
            {emergencyServicesPanel && (
              <div style={{ borderRadius:"10px", border:"2px solid rgba(255,255,255,0.5)", background:"rgba(0,0,0,0.35)", padding:"0.85rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"8px" }}>
                  <AlertCircle size={14} style={{ color:"#FCA5A5" }} />
                  <span style={{ fontSize:"11px", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em" }}>Triple Zero — 000</span>
                  <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"3px", fontSize:"10px", color:"#86EFAC" }}><CheckCircle2 size={10}/> Alerted</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                  {[
                    { Icon: Siren,  label:"NSW Ambulance", sub:"000 · Patient care",    border:"rgba(134,239,172,0.5)", icon:"#4ADE80" },
                    { Icon: Shield, label:"NSW Police",    sub:"000 · Scene control",   border:"rgba(147,197,253,0.5)", icon:"#93C5FD" },
                    { Icon: Flame,  label:"Fire & Rescue", sub:"000 · Hazmat / rescue", border:"rgba(253,186,116,0.5)", icon:"#FB923C" },
                  ].map(({ Icon, label, sub, border, icon }) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:"7px", borderRadius:"7px", border:`1px solid ${border}`, padding:"5px 9px", background:"rgba(0,0,0,0.4)" }}>
                      <Icon size={12} style={{ color:icon }} />
                      <div>
                        <div style={{ fontSize:"10px", fontWeight:700, color:"#fff" }}>{label}</div>
                        <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.7)" }}>{sub}</div>
                      </div>
                      <CheckCircle2 size={10} style={{ marginLeft:"auto", color:"#4ADE80" }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:"5px", fontSize:"10px", color:"rgba(255,255,255,0.7)" }}>GPS coordinates broadcast to services</div>
              </div>
            )}
          </div>

          {/* Ground scene strip */}
          {!isAirborne && (
            <div style={{ borderRadius:"10px", border:"2px solid rgba(255,220,0,0.6)", background:"rgba(0,0,0,0.35)", padding:"0.85rem" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"9px" }}>
                <MapPin size={14} style={{ color:"#FDE047", marginTop:"2px", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#FDE047", marginBottom:"7px" }}>First-On-Scene — MVA Protocol</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"6px" }}>
                    {[
                      { label:"GPS Location", val:"Broadcasting…" },
                      { label:"Scene Time",   val: event.timestamp.split(",")[1]?.trim() ?? "—" },
                      { label:"Triage Status",val:"Pending assessment" },
                      { label:"Scene Hazards",val:"Assess before approach" },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background:"rgba(0,0,0,0.4)", borderRadius:"7px", padding:"7px", border:"1px solid rgba(253,224,71,0.3)" }}>
                        <div style={{ fontSize:"9px", fontWeight:700, color:"#FDE047" }}>{label}</div>
                        <div style={{ marginTop:"2px", fontSize:"9px", color:"#fff", fontFamily:"monospace" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Protocol checklist */}
          <div style={{ borderRadius:"10px", border:"2px solid rgba(255,255,255,0.4)", background:"rgba(0,0,0,0.35)", padding:"0.85rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"10px", flexWrap:"wrap" }}>
              <Shield size={14} style={{ color:"#fff" }} />
              <span style={{ fontSize:"11px", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {isAirborne ? "Airborne Emergency Protocol" : "Ground / First-On-Scene Protocol"}
              </span>
              {isDispatch
                ? <span style={{ fontSize:"9px", background:"rgba(255,255,255,0.2)", color:"#fff", padding:"2px 7px", borderRadius:"9999px", border:"1px solid rgba(255,255,255,0.5)", fontWeight:700 }}>DISPATCH — TAKE CONTROL</span>
                : <span style={{ fontSize:"9px", background:"rgba(0,0,0,0.3)", color:"rgba(255,255,255,0.8)", padding:"2px 7px", borderRadius:"9999px", border:"1px solid rgba(255,255,255,0.3)" }}>Dispatch executing</span>
              }
              <div style={{ marginLeft:"auto", fontSize:"10px", color:"#fff", fontFamily:"monospace", display:"flex", alignItems:"center", gap:"3px" }}>
                <Clock size={10} />{steps.filter(s=>s.done).length}/{steps.length} complete
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {steps.map(step => {
                const svc = (step as any).svc ?? ((step as any).atc ? "atc" : "crew");
                const badgeCls = SVC_STYLE[svc] ?? SVC_STYLE.crew;
                return (
                  <button key={step.id} onClick={()=>toggleStep(step.id)} disabled={!isDispatch}
                    style={{ display:"flex", alignItems:"flex-start", gap:"9px", padding:"9px", borderRadius:"7px",
                      border: step.done ? "1.5px solid rgba(134,239,172,0.8)" : "1.5px solid rgba(255,255,255,0.35)",
                      background: step.done ? "rgba(0,100,0,0.45)" : "rgba(0,0,0,0.35)",
                      cursor: isDispatch ? "pointer" : "default", textAlign:"left", transition:"all 0.15s",
                    }}
                  >
                    <div style={{ marginTop:"2px", flexShrink:0, width:14, height:14, borderRadius:"50%",
                      border:`2px solid ${step.done ? "#4ADE80" : "rgba(255,255,255,0.6)"}`,
                      background: step.done ? "#16A34A" : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {step.done && <CheckCircle2 size={9} style={{ color:"#fff" }} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:"10px", fontWeight:600, color: step.done ? "#86EFAC" : "#fff", lineHeight:1.4 }}>{step.label}</span>
                      <span className={`inline-block mt-0.5 text-[9px] px-1 py-0.5 rounded border font-bold ${badgeCls}`}>{SVC_LABEL[svc] ?? svc}</span>
                      {(step as any).atc && <div style={{ fontSize:"9px", color:"#86EFAC", marginTop:"1px" }}>Auto-transmitted to ATC</div>}
                    </div>
                  </button>
                );
              })}
            </div>
            {!isDispatch && <p style={{ marginTop:"8px", fontSize:"10px", color:"rgba(255,255,255,0.75)", textAlign:"center" }}>Checklist controlled by Dispatch</p>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:"rgb(120,0,0)", borderTop:"3px solid #fff", flexShrink:0, padding:"0.65rem 1rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem" }}>
        <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.85)", maxWidth:"440px" }} className="hidden md:block">
          Emergency logged with timestamp and activating role. Stand down only when situation is resolved and authorised by Pilot in Command or Dispatch.
        </div>
        <button onClick={standDown} data-testid="emergency-stand-down"
          style={{ display:"flex", alignItems:"center", gap:"7px", padding:"9px 18px", borderRadius:"8px",
            background:"#1F2937", border:"1.5px solid rgba(255,255,255,0.5)", color:"#fff",
            fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em",
            cursor:"pointer", transition:"all 0.15s", flexShrink:0,
          }}
        >
          <X size={12} /> Stand Down — Clear Emergency
        </button>
      </div>
    </div>
  );
}

interface EmergencyEvent {
  timestamp: string;
  role: string;
  phase: Phase;
}

interface Props {
  role: UserRole;
  /** Optional — pass from parent if you know the aircraft phase */
  phase?: Phase;
  /** Mobile mode: renders as a fixed floating button (bottom-right) instead of inline */
  mobile?: boolean;
}

export default function EmergencyButton({ role, phase: externalPhase, mobile = false }: Props) {
  if (!EMERGENCY_ROLES.includes(role)) return null;

  // ── State ──────────────────────────────────────────────
  const [armed,    setArmed]    = useState(false);
  const [active,   setActive]   = useState(false);
  const [armTimer, setArmTimer] = useState(3);
  const [event,    setEvent]    = useState<EmergencyEvent | null>(null);
  const [pulse,    setPulse]    = useState(false);

  // Phase: airborne or on-ground — toggleable in the button bar
  const [phase, setPhase] = useState<Phase>(externalPhase ?? "airborne");
  // Protocol steps — reset when phase changes
  const [steps, setSteps] = useState(AIRBORNE_STEPS.map(s => ({ ...s, done: false })));

  const armTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDispatch = DISPATCH_ROLES.includes(role);
  const roleLabel  = ROLE_LABELS[role] ?? role;

  // Sync external phase if provided
  useEffect(() => {
    if (externalPhase) setPhase(externalPhase);
  }, [externalPhase]);

  // Reset checklist when phase changes (only if not active)
  useEffect(() => {
    if (!active) {
      setSteps(
        (phase === "airborne" ? AIRBORNE_STEPS : GROUND_STEPS)
          .map(s => ({ ...s, done: false }))
      );
    }
  }, [phase, active]);

  // Pulse heartbeat when active
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(id);
  }, [active]);

  // Cleanup timers
  useEffect(() => () => {
    if (armTimeout.current)  clearTimeout(armTimeout.current);
    if (armInterval.current) clearInterval(armInterval.current);
  }, []);

  // ── Disarm helper ───────────────────────────────────────
  const cancelArm = useCallback(() => {
    if (armTimeout.current)  clearTimeout(armTimeout.current);
    if (armInterval.current) clearInterval(armInterval.current);
    setArmed(false);
    setArmTimer(3);
  }, []);

  // ── Double-trigger press ────────────────────────────────
  const handlePress = useCallback(() => {
    if (active) return;

    if (armed) {
      // Second press — declare emergency
      if (armTimeout.current)  clearTimeout(armTimeout.current);
      if (armInterval.current) clearInterval(armInterval.current);
      setArmed(false);
      setArmTimer(3);
      const now = new Date();
      setEvent({
        timestamp: now.toLocaleString("en-AU", {
          weekday: "short", day: "2-digit", month: "short",
          year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
          timeZoneName: "short",
        }),
        role: roleLabel,
        phase,
      });
      setActive(true);
      return;
    }

    // First press — arm with 3 s countdown
    setArmed(true);
    setArmTimer(3);
    armInterval.current = setInterval(() => {
      setArmTimer(t => {
        if (t <= 1) { clearInterval(armInterval.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    armTimeout.current = setTimeout(() => {
      setArmed(false);
      setArmTimer(3);
    }, 3000);
  }, [armed, active, roleLabel, phase]);

  // ── Toggle phase (only when not active) ────────────────
  const togglePhase = () => {
    if (active) return;
    cancelArm();
    setPhase(p => p === "airborne" ? "ground" : "airborne");
  };

  // ── Checklist interaction ───────────────────────────────
  const toggleStep = (id: number) => {
    if (!isDispatch) return;
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  // ── Stand down ─────────────────────────────────────────
  const standDown = () => {
    setActive(false);
    setArmed(false);
    setArmTimer(3);
    setEvent(null);
    setSteps(
      (phase === "airborne" ? AIRBORNE_STEPS : GROUND_STEPS)
        .map(s => ({ ...s, done: false }))
    );
  };

  // ── Phase-dependent content ─────────────────────────────
  const isAirborne = phase === "airborne";

  // Notification panels to show
  const atcPanel = isAirborne;
  const dispatchPanel = true;           // always
  const emergencyServicesPanel = !isAirborne;

  // ── Mobile FAB mode ─────────────────────────────────────
  if (mobile) {
    return (
      <>
        {/* Inline circle button — sits in the header flow, no floating */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "6px",
        }}>
          {/* Phase toggle pill above FAB */}
          {!active && (
            <button
              onClick={togglePhase}
              title={isAirborne ? "Switch to On-Ground mode" : "Switch to Airborne mode"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                padding: "5px 10px",
                borderRadius: "9999px",
                border: "1.5px solid",
                fontWeight: 700,
                cursor: "pointer",
                background: isAirborne ? "rgb(6,150,190)" : "rgb(22,160,80)",
                borderColor: isAirborne ? "rgb(4,110,150)" : "rgb(16,120,60)",
                color: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              }}
            >
              {isAirborne ? <><Plane size={11} /> Airborne</> : <><MapPin size={11} /> On Ground</>}
            </button>
          )}

          {/* Cancel arm */}
          {armed && (
            <button
              onClick={cancelArm}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: "8px",
                border: "1.5px solid rgb(251,146,60)",
                background: "rgb(234,88,12)",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              }}
            >
              Cancel
            </button>
          )}

          {/* Emergency button — small rectangle */}
          <button
            onClick={handlePress}
            data-testid="emergency-button-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              borderRadius: "7px",
              border: "2px solid",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
              transition: "all 0.15s",
              ...(active
                ? { background: "rgb(220,0,0)", borderColor: "rgb(255,130,130)", color: "#fff", boxShadow: "0 0 14px rgba(239,68,68,0.8)" }
                : armed
                  ? { background: "rgb(217,70,0)", borderColor: "rgb(251,146,60)", color: "#fff", boxShadow: "0 0 10px rgba(251,146,60,0.8)" }
                  : { background: "rgb(200,0,0)", borderColor: "rgba(255,100,100,0.8)", color: "#fff", boxShadow: "0 1px 6px rgba(180,0,0,0.5)" }
              ),
            }}
          >
            <AlertTriangle size={12} style={{ color: "#fff", flexShrink: 0 }} />
            {active ? "ACTIVE" : armed ? `${armTimer}s` : "EMERGENCY"}
          </button>
        </div>

        {/* Overlay portal — reuses the same full-screen overlay as desktop */}
        {active && event && createPortal(<EmergencyOverlay
          event={event} isAirborne={isAirborne} pulse={pulse}
          steps={steps} isDispatch={isDispatch} toggleStep={toggleStep}
          standDown={standDown} atcPanel={atcPanel} emergencyServicesPanel={emergencyServicesPanel}
        />, document.body)}
      </>
    );
  }

  return (
    <>
      {/* ── Top-bar controls ──────────────────────────────────── */}
      {/*
        Daylight-optimised: solid saturated colours with white text
        so they're visible on both light and dark app headers.
      */}
      <div className="relative flex items-center gap-1.5">

        {/* Phase toggle — solid pill, highly visible */}
        {!active && (
          <button
            onClick={togglePhase}
            title={isAirborne ? "Switch to On-Ground mode" : "Switch to Airborne mode"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "10px",
              padding: "3px 8px",
              borderRadius: "9999px",
              border: "1.5px solid",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
              background: isAirborne ? "rgb(6,150,190)" : "rgb(22,160,80)",
              borderColor: isAirborne ? "rgb(4,110,150)" : "rgb(16,120,60)",
              color: "#fff",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
              boxShadow: isAirborne
                ? "0 0 8px rgba(6,150,190,0.55)"
                : "0 0 8px rgba(22,160,80,0.55)",
              transition: "all 0.15s",
            }}
          >
            {isAirborne
              ? <><Plane size={10} /> Airborne</>
              : <><MapPin size={10} /> On Ground</>
            }
          </button>
        )}

        {/* Cancel arm */}
        {armed && (
          <button
            onClick={cancelArm}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1.5px solid rgb(251,146,60)",
              background: "rgb(234,88,12)",
              color: "#fff",
              cursor: "pointer",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            Cancel
          </button>
        )}

        {/* Emergency button — solid, never translucent */}
        <button
          onClick={handlePress}
          data-testid="emergency-button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "7px",
            border: "2px solid",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            cursor: "pointer",
            userSelect: "none",
            whiteSpace: "nowrap",
            transition: "all 0.15s",
            ...(active
              ? {
                  background: "rgb(220,0,0)",
                  borderColor: "rgb(255,100,100)",
                  color: "#fff",
                  boxShadow: "0 0 24px rgba(239,68,68,0.9)",
                }
              : armed
                ? {
                    background: "rgb(217,70,0)",
                    borderColor: "rgb(251,146,60)",
                    color: "#fff",
                    boxShadow: "0 0 14px rgba(251,146,60,0.8)",
                    transform: "scale(1.05)",
                  }
                : {
                    background: "rgb(185,0,0)",
                    borderColor: "rgb(255,60,60)",
                    color: "#fff",
                    boxShadow: "0 0 10px rgba(185,0,0,0.5)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                  }
            ),
          }}
        >
          <AlertTriangle size={13} style={{ color: "#fff" }} />
          {active
            ? "EMERGENCY ACTIVE"
            : armed
              ? `CONFIRM — ${armTimer}s`
              : "EMERGENCY"
          }
        </button>
      </div>

      {/* ── Emergency overlay (portal — mounts on body to escape stacking) ── */}
      {active && event && createPortal(<EmergencyOverlay
        event={event} isAirborne={isAirborne} pulse={pulse}
        steps={steps} isDispatch={isDispatch} toggleStep={toggleStep}
        standDown={standDown} atcPanel={atcPanel} emergencyServicesPanel={emergencyServicesPanel}
      />, document.body)}
    </>
  );
}
