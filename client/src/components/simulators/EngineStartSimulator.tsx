import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// King Air B200 — PT6A-60A Engine Start Sequence Simulator
// Self-contained CBT training component.
// ---------------------------------------------------------------------------

type StartPhase =
  | "ready"
  | "starter_engaged"
  | "ignition_on"
  | "fuel_on"
  | "light_off"
  | "stabilising"
  | "running"
  | "hot_start"
  | "aborted";

type ConditionLever = "cutoff" | "low_idle" | "high_idle";

// ---------------------------------------------------------------------------
// Small circular gauge helper (mirrors the CircleGauge approach used in the
// pressurisation simulator).
// ---------------------------------------------------------------------------
function CircleGauge({
  value,
  max,
  label,
  unit,
  greenMax,
  amberMax,
  size = 130,
  displayValue,
  dashedAt,
  flashRed = false,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  greenMax: number;
  amberMax: number;
  size?: number;
  displayValue?: string;
  dashedAt?: number; // draw a dashed reference line at this value
  flashRed?: boolean;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const angle = (clamped / max) * 270 - 135; // -135 to +135 degrees
  const toRad = (d: number) => (d * Math.PI) / 180;
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.38;
  const needleX = cx + r * 0.85 * Math.sin(toRad(angle));
  const needleY = cy - r * 0.85 * Math.cos(toRad(angle));
  const color = value > amberMax ? "#ef4444" : value > greenMax ? "#f59e0b" : "#22c55e";

  let dashedPoint: { x: number; y: number } | null = null;
  if (dashedAt !== undefined) {
    const dAngle = (dashedAt / max) * 270 - 135;
    dashedPoint = {
      x: cx + r * Math.sin(toRad(dAngle)),
      y: cy - r * Math.cos(toRad(dAngle)),
    };
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {flashRed && (
        <circle cx={cx} cy={cy} r={size / 2 - 2} fill="#7f1d1d" className="itt-flash-bg" />
      )}
      {/* Background arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth={8} />
      {/* Colored arc based on value */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${(clamped / max) * 2.4 * r} 999`}
        strokeDashoffset={-0.6 * r}
        transform={`rotate(-135 ${cx} ${cy})`}
        strokeLinecap="round"
      />
      {/* Dashed reference marker (e.g. starter disengage point) */}
      {dashedPoint && (
        <line
          x1={cx + (dashedPoint.x - cx) * 0.62}
          y1={cy + (dashedPoint.y - cy) * 0.62}
          x2={dashedPoint.x}
          y2={dashedPoint.y}
          stroke="#38bdf8"
          strokeWidth={2.5}
          strokeDasharray="3 2"
        />
      )}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="white" />
      {/* Label */}
      <text x={cx} y={size - 8} textAnchor="middle" fill="#94a3b8" fontSize={9}>
        {label}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill="white" fontSize={13} fontWeight="bold">
        {displayValue ?? value.toFixed(0)}
      </text>
      <text x={cx} y={cy + 33} textAnchor="middle" fill="#94a3b8" fontSize={8}>
        {unit}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Checklist step definitions
// ---------------------------------------------------------------------------
const CHECKLIST_STEPS = [
  "Verify fuel quantity — CHECK",
  "Engine area — CLEAR",
  "Starter switch — ENGAGE",
  "Ignition — ON",
  "Ng 12%+ — FUEL INTRODUCE (condition lever LOW IDLE)",
  "ITT rise — MONITOR (max 1000°C)",
  "Ng 50%+ — STARTER DISENGAGE (auto)",
  "Oil pressure — CHECK (within 30s)",
  "Ng/ITT stable — IDLE POWER",
];

export default function EngineStartSimulator() {
  const [phase, setPhase] = useState<StartPhase>("ready");
  const [ng, setNg] = useState(0); // %
  const [itt, setItt] = useState(15); // °C (ambient)
  const [np, setNp] = useState(0); // RPM
  const [oilPsi, setOilPsi] = useState(0); // PSI
  const [starterOn, setStarterOn] = useState(false);
  const [ignitionOn, setIgnitionOn] = useState(false);
  const [conditionLever, setConditionLever] = useState<ConditionLever>("cutoff");
  const [starterDisengaged, setStarterDisengaged] = useState(false);
  const [step, setStep] = useState(0); // current checklist step (0-indexed)
  const [elapsed, setElapsed] = useState(0); // seconds since fuel on
  const [isHotStart, setIsHotStart] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 4000);
  };

  // -------------------------------------------------------------------------
  // Animation loop — runs while engine is spooling / running.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (
      phase !== "fuel_on" &&
      phase !== "light_off" &&
      phase !== "stabilising" &&
      phase !== "running"
    )
      return;

    const timer = setInterval(() => {
      setElapsed((e) => e + 0.5);

      setNg((prev) => {
        if (phase === "running") return Math.min(65 + Math.random() * 2 - 1, 68);
        return Math.min(prev + (prev < 50 ? 1.2 : prev < 65 ? 0.8 : 0.3), 65);
      });

      setItt((prev) => {
        if (phase === "fuel_on") return Math.min(prev + 15, 400); // initial rise
        if (phase === "light_off") return Math.min(prev + 20, isHotStart ? 1020 : 720); // peak
        if (phase === "stabilising") return Math.max(prev - 8, 650); // settle
        return 650 + Math.random() * 10 - 5; // idle
      });

      setNp((prev) => {
        if (ng > 30) return Math.min(prev + 30, 1900);
        return prev;
      });

      setOilPsi((prev) => {
        if (ng > 20) return Math.min(prev + 5, 55);
        return prev;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [phase, isHotStart, ng]);

  // -------------------------------------------------------------------------
  // Automatic phase transitions driven by Ng / ITT.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (phase === "fuel_on" && ng > 12) {
      setPhase("light_off");
      setStep(5);
    } else if (phase === "light_off" && ng > 50) {
      setStarterOn(false);
      setStarterDisengaged(true);
      setPhase("stabilising");
      setStep(7);
    } else if (phase === "stabilising" && ng > 63 && itt < 680) {
      setPhase("running");
      setStep(8);
    }

    if ((phase === "light_off" || phase === "stabilising") && itt > 1000 && !isHotStart) {
      setIsHotStart(true);
      setPhase("hot_start");
    }
  }, [ng, itt, phase, isHotStart]);

  // -------------------------------------------------------------------------
  // Manual control handlers
  // -------------------------------------------------------------------------
  const handleStarterToggle = () => {
    if (phase === "aborted" || phase === "hot_start") return;
    if (!starterOn) {
      setStarterOn(true);
      if (phase === "ready") {
        setPhase("starter_engaged");
        setStep(2);
      }
    } else {
      setStarterOn(false);
    }
  };

  const handleIgnitionToggle = () => {
    if (phase === "aborted" || phase === "hot_start") return;
    setIgnitionOn((prev) => {
      const next = !prev;
      if (next && phase === "starter_engaged") {
        setPhase("ignition_on");
        setStep(3);
      }
      return next;
    });
  };

  const handleConditionLever = (pos: ConditionLever) => {
    if (phase === "aborted" || phase === "hot_start") return;

    if (pos === "low_idle" || pos === "high_idle") {
      // Introducing fuel — must have starter engaged and Ng building
      if (!starterOn && !starterDisengaged) {
        showError("STARTER NOT ENGAGED — Cannot introduce fuel without starter rotation");
        return;
      }
      if (ng < 12 && phase !== "fuel_on" && phase !== "light_off" && phase !== "stabilising" && phase !== "running") {
        showError("Ng BELOW 12% — Wait for gas generator speed before introducing fuel");
        return;
      }
      if (!ignitionOn) {
        showError("IGNITION NOT ON — Hung start risk");
      }
      setConditionLever(pos);
      if (phase === "ignition_on" || phase === "starter_engaged") {
        setPhase("fuel_on");
        setStep(4);
      }
    } else {
      setConditionLever(pos);
    }
  };

  const handleAbort = () => {
    setConditionLever("cutoff");
    setStarterOn(false);
    setPhase("aborted");
  };

  const handleReset = () => {
    setPhase("ready");
    setNg(0);
    setItt(15);
    setNp(0);
    setOilPsi(0);
    setStarterOn(false);
    setIgnitionOn(false);
    setConditionLever("cutoff");
    setStarterDisengaged(false);
    setStep(0);
    setElapsed(0);
    setIsHotStart(false);
    setErrorMsg(null);
  };

  // -------------------------------------------------------------------------
  // Derived display state
  // -------------------------------------------------------------------------
  const ittHot = itt > 1000;
  const ittCaution = itt > 800 && itt <= 1000;
  const oilPressureLate =
    ng > 20 && oilPsi < 30 && elapsed > 30 && phase !== "aborted" && phase !== "ready";
  const running = phase === "running";
  const spooling = phase === "fuel_on" || phase === "light_off" || phase === "stabilising";
  const engineLit = phase === "light_off" || phase === "stabilising" || phase === "running";

  let bannerType: "hot" | "oil" | "aborted" | "running" | "none" = "none";
  if (phase === "hot_start") bannerType = "hot";
  else if (phase === "aborted") bannerType = "aborted";
  else if (oilPressureLate) bannerType = "oil";
  else if (running) bannerType = "running";

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-xl p-4 md:p-6 shadow-xl border border-slate-700">
      <style>{`
        @keyframes ittFlashBg {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.55; }
        }
        .itt-flash-bg {
          animation: ittFlashBg 0.6s ease-in-out infinite;
        }
        @keyframes flowIn {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        .intake-flow {
          stroke-dasharray: 5 5;
          animation: flowIn 0.5s linear infinite;
        }
        @keyframes flowOut {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        .exhaust-flow {
          stroke-dasharray: 5 5;
          animation: flowOut 0.5s linear infinite;
        }
        @keyframes flamePulse {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .flame-glow {
          animation: flamePulse 0.5s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes bannerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .banner-pulse {
          animation: bannerPulse 0.7s ease-in-out infinite;
        }
      `}</style>

      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold tracking-wide text-slate-50">
          King Air B200 — PT6A-60A Engine Start Sequence
        </h2>
        <p className="text-xs text-slate-400">Interactive engine start trainer — left engine</p>
      </div>

      {/* Engine cross-section diagram */}
      <div className="bg-slate-950 rounded-lg border border-slate-700 p-2 mb-4">
        <svg viewBox="0 0 600 200" className="w-full h-auto">
          {/* Air intake */}
          <rect x={10} y={70} width={70} height={60} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <text x={45} y={62} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
            INTAKE
          </text>
          {[0, 1, 2].map((i) => (
            <line
              key={`intake-${i}`}
              x1={15}
              y1={85 + i * 15}
              x2={70}
              y2={85 + i * 15}
              stroke={starterOn || engineLit ? "#22d3ee" : "#475569"}
              strokeWidth={3}
              className={starterOn || engineLit ? "intake-flow" : ""}
            />
          ))}
          {(starterOn || engineLit) && (
            <polygon points="70,80 85,100 70,120" fill="#22d3ee" opacity={0.8} />
          )}

          {/* Compressor chevrons (converging) */}
          {[0, 1, 2, 3].map((i) => (
            <polygon
              key={`comp-${i}`}
              points={`${95 + i * 22},70 ${110 + i * 22},100 ${95 + i * 22},130`}
              fill={starterOn || engineLit ? "#334155" : "#1e293b"}
              stroke="#64748b"
              strokeWidth={1.5}
            />
          ))}
          <text x={140} y={150} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
            COMPRESSOR
          </text>

          {/* Combustion chamber */}
          <circle
            cx={300}
            cy={100}
            r={45}
            fill={engineLit ? "#7c2d12" : "#1e293b"}
            stroke={engineLit ? "#f97316" : "#475569"}
            strokeWidth={3}
          />
          {engineLit && (
            <g className="flame-glow">
              <path
                d="M 285 120 Q 290 90 300 75 Q 310 90 315 120 Q 305 130 300 130 Q 295 130 285 120 Z"
                fill={ittHot ? "#ef4444" : "#f97316"}
              />
              <path
                d="M 292 118 Q 296 100 300 90 Q 304 100 308 118 Q 300 124 292 118 Z"
                fill="#facc15"
              />
            </g>
          )}
          <text x={300} y={158} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
            COMBUSTION
          </text>

          {/* Turbine chevrons (diverging / reverse) */}
          {[0, 1, 2, 3].map((i) => (
            <polygon
              key={`turb-${i}`}
              points={`${385 + i * 22},100 ${400 + i * 22},70 ${400 + i * 22},130`}
              fill={engineLit ? "#334155" : "#1e293b"}
              stroke="#64748b"
              strokeWidth={1.5}
            />
          ))}
          <text x={445} y={150} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
            TURBINE
          </text>

          {/* Exhaust */}
          <rect x={520} y={70} width={70} height={60} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <text x={555} y={62} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
            EXHAUST
          </text>
          {[0, 1, 2].map((i) => (
            <line
              key={`exhaust-${i}`}
              x1={520}
              y1={85 + i * 15}
              x2={575}
              y2={85 + i * 15}
              stroke={running ? "#facc15" : engineLit ? "#f97316" : "#475569"}
              strokeWidth={3}
              className={engineLit ? "exhaust-flow" : ""}
            />
          ))}
          {engineLit && (
            <polygon points="575,80 590,100 575,120" fill={running ? "#facc15" : "#f97316"} opacity={0.8} />
          )}

          {/* Ng/ITT quick readout under diagram */}
          <text x={300} y={190} textAnchor="middle" fill="#94a3b8" fontSize={11}>
            Ng {ng.toFixed(0)}%  ·  ITT {itt.toFixed(0)}°C  ·  Np {np.toFixed(0)} RPM
          </text>
        </svg>
      </div>

      {/* Status banners */}
      {bannerType === "hot" && (
        <div className="rounded-lg p-3 mb-4 text-sm font-bold border bg-red-700 border-red-400 text-white banner-pulse">
          ⚠ HOT START — ITT EXCEEDED 1000°C. Abort and investigate.
        </div>
      )}
      {bannerType === "oil" && (
        <div className="rounded-lg p-3 mb-4 text-sm font-bold border bg-amber-600 border-amber-400 text-slate-950">
          OIL PRESSURE — Check within 30 seconds of start
        </div>
      )}
      {bannerType === "aborted" && (
        <div className="rounded-lg p-3 mb-4 text-sm font-bold border bg-amber-700 border-amber-400 text-white">
          START ABORTED. Allow EGT to cool before re-attempt.
        </div>
      )}
      {bannerType === "running" && (
        <div className="rounded-lg p-3 mb-4 text-sm font-bold border bg-emerald-700 border-emerald-400 text-white">
          ENGINE RUNNING — Ground idle stable. Ng {ng.toFixed(0)}% ITT {itt.toFixed(0)}°C
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg p-3 mb-4 text-sm font-bold border bg-red-800 border-red-500 text-white">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Main content: gauges + checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Gauges 2x2 grid */}
        <div className="lg:col-span-2 bg-slate-950 rounded-lg border border-slate-700 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center relative">
              <CircleGauge
                value={ng}
                max={100}
                label="Ng — GAS GENERATOR"
                unit="%"
                greenMax={70}
                amberMax={85}
                dashedAt={50}
                displayValue={`${ng.toFixed(0)}%`}
              />
              <div className="text-[10px] text-slate-400 -mt-1">starter disengage ≈ 50%</div>
            </div>

            <div className="flex flex-col items-center relative">
              <CircleGauge
                value={itt}
                max={1090}
                label="ITT"
                unit="°C"
                greenMax={800}
                amberMax={1000}
                displayValue={`${itt.toFixed(0)}°C`}
                flashRed={ittHot}
              />
              {ittHot && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded banner-pulse">
                    HOT START — ABORT
                  </span>
                </div>
              )}
              {!ittHot && ittCaution && (
                <div className="text-[10px] text-amber-400 -mt-1 font-bold">CAUTION — ITT RISING</div>
              )}
            </div>

            <div className="flex flex-col items-center">
              <CircleGauge
                value={np}
                max={2200}
                label="Np — PROPELLER"
                unit="RPM"
                greenMax={2000}
                amberMax={2100}
                displayValue={`${np.toFixed(0)}`}
              />
            </div>

            <div className="flex flex-col items-center">
              <CircleGauge
                value={oilPsi}
                max={100}
                label="OIL PRESSURE"
                unit="PSI"
                greenMax={65}
                amberMax={40}
                displayValue={`${oilPsi.toFixed(0)}`}
              />
              {oilPressureLate && (
                <div className="text-[10px] text-red-400 -mt-1 font-bold animate-pulse">NO OIL PRESSURE</div>
              )}
            </div>
          </div>
        </div>

        {/* Checklist panel */}
        <div className="bg-slate-950 rounded-lg border border-slate-700 p-3">
          <div className="text-xs font-bold tracking-wide text-slate-300 mb-2 border-b border-slate-700 pb-1">
            START CHECKLIST — PT6A-60A
          </div>
          <ul className="space-y-1.5">
            {CHECKLIST_STEPS.map((text, i) => {
              const completed = i < step;
              const current = i === step && phase !== "aborted" && phase !== "hot_start";
              return (
                <li
                  key={i}
                  className={`text-xs rounded px-2 py-1.5 flex items-start gap-1.5 border ${
                    completed
                      ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                      : current
                      ? "bg-amber-950 border-amber-600 text-amber-300"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                >
                  <span className="font-bold shrink-0">
                    {completed ? "✓" : current ? "→" : "□"}
                  </span>
                  <span>
                    {i + 1}. {text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Controls panel */}
      <div className="bg-slate-950 rounded-lg border border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column — Engine Controls */}
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-wide text-slate-300 border-b border-slate-700 pb-1">
              ENGINE CONTROLS
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">STARTER</label>
              <button
                onClick={handleStarterToggle}
                disabled={phase === "aborted" || phase === "hot_start" || starterDisengaged}
                className={`w-full rounded-md py-2 text-xs font-bold border transition-colors ${
                  starterOn
                    ? "bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500"
                    : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                } ${
                  phase === "aborted" || phase === "hot_start" || starterDisengaged
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
              >
                {starterDisengaged ? "STARTER: DISENGAGED (AUTO)" : starterOn ? "STARTER: ENGAGED" : "STARTER: ENGAGE"}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">IGNITION</label>
              <button
                onClick={handleIgnitionToggle}
                disabled={phase === "aborted" || phase === "hot_start"}
                className={`w-full rounded-md py-2 text-xs font-bold border transition-colors ${
                  ignitionOn
                    ? "bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500"
                    : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                } ${phase === "aborted" || phase === "hot_start" ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                IGNITION: {ignitionOn ? "ON" : "OFF"}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">CONDITION LEVER</label>
              <div className="flex bg-slate-800 rounded-md border border-slate-600 p-1 gap-1">
                {(["cutoff", "low_idle", "high_idle"] as ConditionLever[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handleConditionLever(pos)}
                    disabled={phase === "aborted" || phase === "hot_start"}
                    className={`flex-1 rounded py-2 text-[10px] font-bold border transition-colors ${
                      conditionLever === pos
                        ? "bg-cyan-600 border-cyan-400 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700"
                    } ${phase === "aborted" || phase === "hot_start" ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {pos === "cutoff" ? "CUTOFF" : pos === "low_idle" ? "LOW IDLE" : "HIGH IDLE"}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Lever position: <span className="text-slate-300 font-semibold">{conditionLever.replace("_", " ").toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Right column — Actions */}
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-wide text-slate-300 border-b border-slate-700 pb-1">
              ACTIONS
            </div>

            <button
              onClick={handleAbort}
              disabled={phase === "ready" || phase === "aborted"}
              className={`w-full rounded-md py-4 text-sm font-extrabold border-2 tracking-wide transition-colors ${
                phase === "ready" || phase === "aborted"
                  ? "bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed"
                  : "bg-red-700 border-red-400 text-white hover:bg-red-600"
              }`}
            >
              ABORT START
            </button>

            <button
              onClick={handleReset}
              className="w-full rounded-md py-3 text-xs font-bold border border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600 transition-colors"
            >
              RESET
            </button>

            <div className="text-[10px] text-slate-500 leading-relaxed pt-1">
              Phase: <span className="text-slate-300 font-semibold">{phase.replace("_", " ").toUpperCase()}</span>
              <br />
              Elapsed since fuel intro: <span className="text-slate-300 font-semibold">{elapsed.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
