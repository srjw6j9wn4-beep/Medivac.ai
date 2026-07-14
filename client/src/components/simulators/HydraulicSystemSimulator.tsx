import { useState } from "react";

/**
 * HydraulicSystemSimulator
 * King Air B200 Hydraulic System — interactive diagram trainer.
 * Self-contained: only `useState` from React. Tailwind CSS + inline SVG.
 */

type GearPosition = "up" | "transit" | "down";

export default function HydraulicSystemSimulator() {
  const [engineRunning, setEngineRunning] = useState(true); // left engine (drives EDP)
  const [electricPumpOn, setElectricPumpOn] = useState(false);
  const [gearPosition, setGearPosition] = useState<GearPosition>("down");
  const [flapPosition, setFlapPosition] = useState(0); // degrees: 0, 10, 20, 40
  const [brakeAccumPsi, setBrakeAccumPsi] = useState(950); // PSI, max ~1000
  const [alternateGearRelease, setAlternateGearRelease] = useState(false);
  const [systemPressure] = useState(1500); // PSI (nominal reference)
  const [gearBusy, setGearBusy] = useState(false);

  // --- Derived state ---------------------------------------------------------
  const edpActive = engineRunning;
  const ehpActive = electricPumpOn;
  const hydraulicPower = edpActive || ehpActive;
  const systemPressureActual = hydraulicPower
    ? systemPressure
    : brakeAccumPsi > 0
    ? brakeAccumPsi
    : 0;
  const gearOperable = hydraulicPower || alternateGearRelease;
  const brakesAvailable = systemPressureActual > 0 || brakeAccumPsi > 50;
  const rudderBoostActive = hydraulicPower;

  // --- Annunciators ------------------------------------------------------------
  const annunciators: { text: string; active: boolean; tone: "red" | "amber" | "green" }[] = [
    { text: "HYD PRESS", active: !hydraulicPower, tone: "red" },
    { text: "L ENG HYD", active: !engineRunning, tone: "red" },
    { text: "GEAR UNSAFE", active: gearPosition === "transit", tone: "amber" },
    { text: "GEAR DOWN", active: gearPosition === "down", tone: "green" },
    { text: "ACCUM LOW", active: brakeAccumPsi < 300, tone: "amber" },
    { text: "BRAKE FAIL", active: brakeAccumPsi < 50, tone: "red" },
  ];

  // --- Status text ---------------------------------------------------------
  function getStatus(): { text: string; tone: "normal" | "caution" | "emergency" } {
    if (alternateGearRelease) {
      return {
        text:
          "ALTERNATE GEAR EXTENSION — Gear released via mechanical uplocks. Gravity/airflow extension. Cannot retract.",
        tone: "caution",
      };
    }
    if (!hydraulicPower) {
      return {
        text: `HYD FAILURE — No hydraulic pressure. Use alternate gear extension for landing. Brake accumulator: ${brakeAccumPsi} PSI (${Math.floor(
          brakeAccumPsi / 150
        )} applications remaining).`,
        tone: "emergency",
      };
    }
    if (!edpActive && ehpActive) {
      return {
        text:
          "EDP FAILED — Electric hydraulic pump on. All systems operational. Monitor for overheating.",
        tone: "caution",
      };
    }
    return {
      text: "Normal hydraulic — EDP pressurising system at 1500 PSI. All systems operational.",
      tone: "normal",
    };
  }
  const status = getStatus();

  // --- Helpers ---------------------------------------------------------------
  const flowLineProps = (active: boolean) =>
    ({
      stroke: active ? "#ef4444" : "#374151",
      strokeWidth: 3,
      strokeDasharray: "8 4",
      style: active
        ? ({ animation: "flowHyd 0.6s linear infinite" } as React.CSSProperties)
        : undefined,
      fill: "none",
      strokeLinecap: "round" as const,
    });

  const accumColor =
    brakeAccumPsi > 500 ? "#22c55e" : brakeAccumPsi > 200 ? "#f59e0b" : "#ef4444";

  function handleGearLever() {
    if (gearBusy) return;
    if (gearPosition === "down") {
      setGearBusy(true);
      setGearPosition("transit");
      setTimeout(() => {
        setGearPosition("up");
        setGearBusy(false);
      }, 1000);
    } else if (gearPosition === "up") {
      setGearBusy(true);
      setGearPosition("transit");
      setTimeout(() => {
        setGearPosition("down");
        setGearBusy(false);
      }, 1000);
    }
  }

  function handleApplyBrakes() {
    setBrakeAccumPsi((p) => Math.max(0, p - 150));
  }

  function handleRecharge() {
    setBrakeAccumPsi(950);
  }

  function handleAlternateGear() {
    if (alternateGearRelease) return;
    setAlternateGearRelease(true);
    setGearPosition("down");
  }

  // Gear rendering helpers: returns wheel y-offset & color per position
  const gearColor =
    gearPosition === "down" ? "#22c55e" : gearPosition === "transit" ? "#f59e0b" : "#ef4444";
  const gearExtend = gearPosition === "down" ? 1 : gearPosition === "transit" ? 0.5 : 0;

  const annunColor = (tone: "red" | "amber" | "green") =>
    tone === "red" ? "#ef4444" : tone === "amber" ? "#f59e0b" : "#22c55e";

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-lg border border-slate-800 p-4">
      <style>{`
        @keyframes flowHyd { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div className="mb-3">
        <h2 className="text-lg font-bold tracking-wide text-slate-100">
          King Air B200 — Hydraulic System
        </h2>
        <p className="text-xs text-slate-400">
          Interactive training diagram — EDP / EHP, landing gear, brakes, flaps &amp; rudder boost
        </p>
      </div>

      {/* SVG Diagram */}
      <div className="bg-slate-900 rounded-md border border-slate-800 p-2">
        <svg viewBox="0 0 640 360" className="w-full h-auto">
          {/* Flow lines: EDP -> Reservoir -> EHP */}
          <path d="M 115 100 L 270 35" {...flowLineProps(edpActive)} />
          <path d="M 370 35 L 525 100" {...flowLineProps(ehpActive)} />

          {/* Pressure header line beneath reservoir spanning to actuators */}
          <path d="M 320 60 L 320 130" {...flowLineProps(hydraulicPower)} />
          <path d="M 320 130 L 150 130 L 150 170" {...flowLineProps(hydraulicPower)} />
          <path d="M 320 130 L 320 170" {...flowLineProps(hydraulicPower)} />
          <path d="M 320 130 L 470 130 L 470 170" {...flowLineProps(hydraulicPower)} />
          <path d="M 150 170 L 90 260" {...flowLineProps(hydraulicPower || brakeAccumPsi > 0)} />
          <path d="M 470 170 L 470 250" {...flowLineProps(hydraulicPower)} />
          <path d="M 320 170 L 320 220" {...flowLineProps(gearOperable)} />
          <path d="M 470 60 L 545 60 L 545 90" {...flowLineProps(rudderBoostActive)} />

          {/* Pressure label */}
          {hydraulicPower && (
            <text x="320" y="150" textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="700">
              1500 PSI
            </text>
          )}

          {/* Reservoir */}
          <rect
            x="270"
            y="10"
            width="100"
            height="50"
            rx="4"
            fill={hydraulicPower ? "rgba(239,68,68,0.20)" : "rgba(107,114,128,0.15)"}
            stroke={hydraulicPower ? "#ef4444" : "#6b7280"}
            strokeWidth="2"
          />
          {/* fluid level */}
          <rect
            x="274"
            y="34"
            width="92"
            height="22"
            fill={hydraulicPower ? "#ef4444" : "#4b5563"}
            opacity="0.55"
          />
          <text x="320" y="28" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="700">
            HYD RESERVOIR
          </text>
          <text x="320" y="52" textAnchor="middle" fontSize="8" fill="#94a3b8">
            MIL-PRF-5606
          </text>

          {/* EDP */}
          <circle
            cx="80"
            cy="100"
            r="35"
            fill={edpActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}
            stroke={edpActive ? "#22c55e" : "#ef4444"}
            strokeWidth="3"
          />
          <text x="80" y="96" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="700">
            EDP
          </text>
          <text x="80" y="108" textAnchor="middle" fontSize="8" fill="#94a3b8">
            L ENGINE
          </text>

          {/* EHP */}
          <circle
            cx="560"
            cy="100"
            r="35"
            fill={
              ehpActive
                ? "rgba(34,197,94,0.2)"
                : hydraulicPower
                ? "rgba(245,158,11,0.15)"
                : "rgba(107,114,128,0.15)"
            }
            stroke={ehpActive ? "#22c55e" : hydraulicPower ? "#f59e0b" : "#6b7280"}
            strokeWidth="3"
          />
          <text x="560" y="96" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="700">
            EHP
          </text>
          <text x="560" y="108" textAnchor="middle" fontSize="8" fill="#94a3b8">
            ELECTRIC
          </text>

          {/* Rudder boost box */}
          <rect
            x="500"
            y="55"
            width="90"
            height="35"
            rx="4"
            fill={rudderBoostActive ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.12)"}
            stroke={rudderBoostActive ? "#22c55e" : "#6b7280"}
            strokeWidth="2"
          />
          <text x="545" y="76" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="700">
            RUDDER BOOST
          </text>

          {/* Landing gear group */}
          <g>
            <rect
              x="260"
              y="220"
              width="120"
              height="70"
              rx="4"
              fill="rgba(30,41,59,0.6)"
              stroke={gearColor}
              strokeWidth="2"
            />
            <text x="320" y="234" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="700">
              LANDING GEAR
            </text>

            {/* Nose gear */}
            <line
              x1="320"
              y1="240"
              x2="320"
              y2={240 + 20 * gearExtend}
              stroke={gearColor}
              strokeWidth="3"
            />
            <circle cx="320" cy={240 + 20 * gearExtend} r="6" fill={gearColor} />

            {/* Left main gear */}
            <line
              x1="285"
              y1="240"
              x2={285 - 10 * gearExtend}
              y2={240 + 22 * gearExtend}
              stroke={gearColor}
              strokeWidth="3"
            />
            <circle cx={285 - 10 * gearExtend} cy={240 + 22 * gearExtend} r="6" fill={gearColor} />

            {/* Right main gear */}
            <line
              x1="355"
              y1="240"
              x2={355 + 10 * gearExtend}
              y2={240 + 22 * gearExtend}
              stroke={gearColor}
              strokeWidth="3"
            />
            <circle cx={355 + 10 * gearExtend} cy={240 + 22 * gearExtend} r="6" fill={gearColor} />

            <text
              x="320"
              y="282"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={gearColor}
              style={gearPosition === "transit" ? { animation: "blink 0.8s infinite" } : undefined}
            >
              {gearPosition === "down"
                ? "DOWN & LOCKED"
                : gearPosition === "transit"
                ? "IN TRANSIT"
                : "UP & LOCKED"}
            </text>
            {alternateGearRelease && (
              <text x="320" y="292" textAnchor="middle" fontSize="7" fill="#f59e0b">
                ALTERNATE RELEASE ACTIVE
              </text>
            )}
          </g>

          {/* Brake accumulator */}
          <g>
            <rect
              x="40"
              y="260"
              width="100"
              height="50"
              rx="4"
              fill="rgba(30,41,59,0.6)"
              stroke={accumColor}
              strokeWidth="2"
            />
            <text x="90" y="273" textAnchor="middle" fontSize="8" fill="#e2e8f0" fontWeight="700">
              BRAKE ACCUM
            </text>
            {/* Gauge arc */}
            <g transform="translate(90,296)">
              <path
                d="M -25 0 A 25 25 0 0 1 25 0"
                fill="none"
                stroke="#334155"
                strokeWidth="6"
              />
              <path
                d={`M -25 0 A 25 25 0 0 1 ${
                  -25 + 50 * Math.min(1, brakeAccumPsi / 1000)
                } ${-Math.sin(Math.PI * Math.min(1, brakeAccumPsi / 1000)) * 25}`}
                fill="none"
                stroke={accumColor}
                strokeWidth="6"
                strokeLinecap="round"
              />
            </g>
            <text x="90" y="304" textAnchor="middle" fontSize="8" fill={accumColor} fontWeight="700">
              {brakeAccumPsi} PSI
            </text>
          </g>

          {/* Flap indicator */}
          <g>
            <rect
              x="480"
              y="250"
              width="120"
              height="70"
              rx="4"
              fill="rgba(30,41,59,0.6)"
              stroke={hydraulicPower ? "#ef4444" : "#6b7280"}
              strokeWidth="2"
            />
            <text x="540" y="264" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="700">
              FLAPS
            </text>
            {/* wing cross-section */}
            <line x1="495" y1="290" x2="565" y2="290" stroke="#94a3b8" strokeWidth="3" />
            <line
              x1="565"
              y1="290"
              x2={565 + 25 * Math.cos((flapPosition * Math.PI) / 180)}
              y2={290 + 25 * Math.sin((flapPosition * Math.PI) / 180)}
              stroke={hydraulicPower ? "#ef4444" : "#94a3b8"}
              strokeWidth="4"
            />
            <text x="540" y="312" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="700">
              {flapPosition}°
            </text>
          </g>
        </svg>
      </div>

      {/* Annunciator panel */}
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {annunciators.map((a) => (
          <div
            key={a.text}
            className="rounded-sm border px-2 py-1.5 text-center text-[10px] font-bold tracking-wide"
            style={{
              borderColor: a.active ? annunColor(a.tone) : "#334155",
              backgroundColor: a.active ? `${annunColor(a.tone)}22` : "#0f172a",
              color: a.active ? annunColor(a.tone) : "#475569",
              animation: a.active && a.tone === "red" ? "blink 1s infinite" : undefined,
            }}
          >
            {a.text}
          </div>
        ))}
      </div>

      {/* Status text */}
      <div
        className="mt-3 rounded-md border px-3 py-2 text-sm font-medium"
        style={{
          borderColor:
            status.tone === "emergency" ? "#ef4444" : status.tone === "caution" ? "#f59e0b" : "#22c55e",
          backgroundColor:
            status.tone === "emergency"
              ? "rgba(239,68,68,0.1)"
              : status.tone === "caution"
              ? "rgba(245,158,11,0.1)"
              : "rgba(34,197,94,0.1)",
          color:
            status.tone === "emergency" ? "#fca5a5" : status.tone === "caution" ? "#fcd34d" : "#86efac",
        }}
      >
        {status.text}
      </div>

      {/* Controls panel */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Left column: Engine & Electric pump */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Power Sources
          </h3>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Left Engine (drives EDP)</div>
            <button
              onClick={() => setEngineRunning((v) => !v)}
              className={`w-full rounded px-3 py-2 text-xs font-bold border ${
                engineRunning
                  ? "bg-green-500/20 border-green-500 text-green-300"
                  : "bg-red-500/20 border-red-500 text-red-300"
              }`}
            >
              {engineRunning ? "RUNNING" : "FAILED"}
            </button>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Electric Hydraulic Pump</div>
            <button
              onClick={() => setElectricPumpOn((v) => !v)}
              className={`w-full rounded px-3 py-2 text-xs font-bold border ${
                electricPumpOn
                  ? "bg-green-500/20 border-green-500 text-green-300"
                  : "bg-slate-700/30 border-slate-600 text-slate-300"
              }`}
            >
              {electricPumpOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Center column: Gear */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Landing Gear
          </h3>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Gear Lever</div>
            <button
              onClick={handleGearLever}
              disabled={gearBusy || alternateGearRelease}
              className={`w-full rounded px-3 py-2 text-xs font-bold border disabled:opacity-50 ${
                gearPosition === "down"
                  ? "bg-green-500/20 border-green-500 text-green-300"
                  : gearPosition === "transit"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-red-500/20 border-red-500 text-red-300"
              }`}
            >
              {gearPosition === "down" ? "DOWN" : gearPosition === "transit" ? "TRANSIT..." : "UP"}
            </button>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Alternate Gear Release</div>
            <button
              onClick={handleAlternateGear}
              disabled={alternateGearRelease}
              className={`w-full rounded px-3 py-2 text-xs font-bold border disabled:opacity-60 ${
                alternateGearRelease
                  ? "bg-slate-700/30 border-slate-600 text-slate-400"
                  : "bg-red-600/20 border-red-600 text-red-300 hover:bg-red-600/30"
              }`}
            >
              {alternateGearRelease ? "RELEASED" : "PULL — ALT GEAR"}
            </button>
            <p className="text-[9px] text-slate-500 mt-1">
              Mechanical release — gravity/airflow extension. One-way, cannot retract.
            </p>
          </div>
        </div>

        {/* Right column: Flaps & Brakes */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Flaps &amp; Brakes
          </h3>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Flap Lever</div>
            <div className="grid grid-cols-4 gap-1">
              {[0, 10, 20, 40].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setFlapPosition(deg)}
                  className={`rounded px-1 py-1.5 text-[10px] font-bold border ${
                    flapPosition === deg
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-slate-700/30 border-slate-600 text-slate-300"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyBrakes}
              disabled={!brakesAvailable}
              className="flex-1 rounded px-2 py-2 text-[10px] font-bold border bg-amber-500/20 border-amber-500 text-amber-300 disabled:opacity-40"
            >
              APPLY BRAKES
            </button>
            <button
              onClick={handleRecharge}
              className="flex-1 rounded px-2 py-2 text-[10px] font-bold border bg-sky-500/20 border-sky-500 text-sky-300"
            >
              RECHARGE ACCUM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
