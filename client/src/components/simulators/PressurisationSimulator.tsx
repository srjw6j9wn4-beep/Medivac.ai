import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// King Air B200 Pressurisation System Simulator
// Self-contained CBT training component.
// ---------------------------------------------------------------------------

function CircleGauge({
  value,
  max,
  label,
  unit,
  greenMax,
  amberMax,
  size = 120,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  greenMax: number;
  amberMax: number;
  size?: number;
}) {
  const angle = (value / max) * 270 - 135; // -135 to +135 degrees
  const toRad = (d: number) => (d * Math.PI) / 180;
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.38;
  const needleX = cx + r * 0.85 * Math.sin(toRad(angle));
  const needleY = cy - r * 0.85 * Math.cos(toRad(angle));
  const color = value > amberMax ? "#ef4444" : value > greenMax ? "#f59e0b" : "#22c55e";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
        strokeDasharray={`${(value / max) * 2.4 * r} 999`}
        strokeDashoffset={-0.6 * r}
        transform={`rotate(-135 ${cx} ${cy})`}
        strokeLinecap="round"
      />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="white" />
      {/* Label */}
      <text x={cx} y={size - 8} textAnchor="middle" fill="#94a3b8" fontSize={9}>
        {label}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
        {value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#94a3b8" fontSize={8}>
        {unit}
      </text>
    </svg>
  );
}

export default function PressurisationSimulator() {
  const [flightAlt, setFlightAlt] = useState(25000); // ft — slider 0-35000
  const [outflowValvePos, setOutflowValvePos] = useState(50); // 0=closed, 100=fully open — slider
  const [bleedAirOn, setBleedAirOn] = useState(true);
  const [pressController, setPressController] = useState<"auto" | "manual">("auto");
  const [emergencyDump, setEmergencyDump] = useState(false);
  const [cabinAlt, setCabinAlt] = useState(8000); // computed
  const [diffPressure, setDiffPressure] = useState(0); // computed

  useEffect(() => {
    if (emergencyDump) {
      setCabinAlt(flightAlt); // cabin equalises to flight altitude
      setDiffPressure(0);
      return;
    }
    if (!bleedAirOn) {
      setCabinAlt(flightAlt); // no pressurisation
      setDiffPressure(0);
      return;
    }
    // Normal pressurisation: cabin alt depends on outflow valve position
    // Outflow valve fully open (100) = no pressurisation = cabin matches flight alt
    // Outflow valve closed (0) = maximum pressurisation = cabin alt ~6000ft regardless of flight alt
    // Mid position: linear interpolation
    const targetCabinAlt =
      pressController === "auto"
        ? Math.min(8000, flightAlt * 0.3) // auto: maintain ~8000ft cabin
        : flightAlt * (outflowValvePos / 100); // manual: outflow pos controls cabin
    const dp = Math.max(0, ((flightAlt - targetCabinAlt) / 1000) * 0.36); // approx PSI
    setCabinAlt(Math.round(targetCabinAlt));
    setDiffPressure(Math.round(dp * 10) / 10);
  }, [flightAlt, outflowValvePos, bleedAirOn, pressController, emergencyDump]);

  const cabinAltHigh = cabinAlt > 10000;
  const cabinAltCritical = cabinAlt > 14000;
  const diffPressHigh = diffPressure > 6.5;
  const bleedOff = !bleedAirOn;

  // Outflow valve opening visualization: 0 = tiny gap, 100 = large opening
  const valveGapHeight = 6 + (outflowValvePos / 100) * 50; // px height of gap
  const valveActive = bleedAirOn && !emergencyDump && outflowValvePos > 2;
  const bleedActive = bleedAirOn && !emergencyDump;

  // Pressure bar fill (0-6.5 psi mapped 0-100%)
  const pressureBarPct = Math.min(100, (diffPressure / 6.5) * 100);
  const pressureBarColor = diffPressure > 6.5 ? "#ef4444" : diffPressure > 5.5 ? "#f59e0b" : "#22c55e";

  let statusText = "";
  if (emergencyDump) {
    statusText = "⚠ EMERGENCY DUMP — Cabin equalising to flight altitude. Don oxygen masks immediately.";
  } else if (!bleedAirOn) {
    statusText = "BLEED AIR OFF — cabin unpressurised. Cabin altitude equals flight altitude.";
  } else if (pressController === "manual") {
    statusText = "Manual mode — adjust outflow valve to control cabin altitude";
  } else {
    statusText = `Auto pressurisation — maintaining ${cabinAlt.toLocaleString()} ft cabin altitude. Differential: ${diffPressure} PSI`;
  }

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-xl p-4 md:p-6 shadow-xl border border-slate-700">
      <style>{`
        @keyframes flowRight {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes flowOut {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }
        @keyframes cabinPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.55; }
        }
        @keyframes dumpFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        .bleed-flow-line {
          stroke-dasharray: 6 6;
          animation: flowRight 0.6s linear infinite;
        }
        .outflow-flow-line {
          stroke-dasharray: 6 6;
          animation: flowOut 0.6s linear infinite;
        }
        .cabin-alt-warning-fill {
          animation: cabinPulse 1.2s ease-in-out infinite;
        }
        .dump-flash {
          animation: dumpFlash 0.5s ease-in-out infinite;
        }
      `}</style>

      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold tracking-wide text-slate-50">
          King Air B200 — Pressurisation System
        </h2>
        <p className="text-xs text-slate-400">Interactive cabin pressurisation trainer</p>
      </div>

      {/* Aircraft cross-section SVG */}
      <div className="bg-slate-950 rounded-lg border border-slate-700 p-2 mb-4">
        <svg viewBox="0 0 600 280" className="w-full h-auto">
          {/* Fuselage outline */}
          <rect x={50} y={40} width={500} height={180} rx={80} stroke="#64748b" strokeWidth={3} fill="transparent" />
          {/* Cabin interior */}
          <rect x={70} y={60} width={460} height={140} rx={60} fill="#1e293b" />
          {/* Cabin altitude warning pulse fill */}
          {cabinAltHigh && (
            <rect
              x={70}
              y={60}
              width={460}
              height={140}
              rx={60}
              fill="#ef4444"
              className="cabin-alt-warning-fill"
            />
          )}

          {/* Windows */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={140 + i * 65} cy={95} r={8} fill="#0f172a" stroke="#475569" strokeWidth={1.5} />
          ))}

          {/* Pressure differential arc indicator on fuselage (top arc) */}
          <path
            d="M 130 45 A 250 100 0 0 1 470 45"
            fill="none"
            stroke="#334155"
            strokeWidth={10}
            strokeLinecap="round"
          />
          <path
            d="M 130 45 A 250 100 0 0 1 470 45"
            fill="none"
            stroke={pressureBarColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${(pressureBarPct / 100) * 420} 999`}
          />
          <text x={300} y={30} textAnchor="middle" fill="#94a3b8" fontSize={11}>
            CABIN PRESSURE {diffPressure} PSI
          </text>

          {/* Bleed air entering from left */}
          <g>
            <text x={20} y={110} fill={bleedActive ? "#f97316" : "#64748b"} fontSize={10} fontWeight="bold">
              BLEED
            </text>
            <line
              x1={5}
              y1={130}
              x2={65}
              y2={130}
              stroke={bleedActive ? "#f97316" : "#64748b"}
              strokeWidth={5}
              className={bleedActive ? "bleed-flow-line" : ""}
            />
            <polygon
              points="65,122 85,130 65,138"
              fill={bleedActive ? "#f97316" : "#64748b"}
            />
          </g>

          {/* Outflow valve on right side - opening in fuselage wall */}
          <g>
            {/* wall segment gap representing the valve opening */}
            <rect
              x={545}
              y={130 - valveGapHeight / 2}
              width={10}
              height={valveGapHeight}
              fill="#0f172a"
            />
            <text x={575} y={110} fill={valveActive ? "#22d3ee" : "#64748b"} fontSize={10} fontWeight="bold" textAnchor="end">
              OUTFLOW
            </text>
            {valveActive && (
              <>
                <line
                  x1={555}
                  y1={130}
                  x2={595}
                  y2={130}
                  stroke="#22d3ee"
                  strokeWidth={5}
                  className="outflow-flow-line"
                />
                <polygon points="595,122 595,138 595,138" fill="#22d3ee" />
                <polygon points="590,123 595,130 590,137" fill="#22d3ee" />
              </>
            )}
            {!valveActive && (
              <line x1={555} y1={130} x2={575} y2={130} stroke="#64748b" strokeWidth={5} />
            )}
          </g>

          {/* Oxygen mask icon warning */}
          {cabinAltCritical && (
            <g>
              <circle cx={300} cy={130} r={22} fill="#0f172a" stroke="#ef4444" strokeWidth={2} className="dump-flash" />
              <text x={300} y={137} textAnchor="middle" fill="#ef4444" fontSize={16} fontWeight="bold" className="dump-flash">
                O₂
              </text>
            </g>
          )}

          {/* Emergency dump indicator */}
          {emergencyDump && (
            <text x={300} y={215} textAnchor="middle" fill="#ef4444" fontSize={13} fontWeight="bold" className="dump-flash">
              EMERGENCY DUMP ACTIVE
            </text>
          )}
        </svg>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 bg-slate-950 rounded-lg border border-slate-700 p-3">
        <div className="flex flex-col items-center">
          <CircleGauge
            value={cabinAlt}
            max={25000}
            label="CABIN ALT"
            unit="FT"
            greenMax={10000}
            amberMax={14000}
          />
          <div className="text-center mt-1">
            <div className="text-sm font-bold text-slate-100">{cabinAlt.toLocaleString()} ft</div>
            {cabinAltHigh && (
              <div className="text-[10px] font-bold text-red-500 animate-pulse">CABIN ALT HI</div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <CircleGauge
            value={diffPressure}
            max={7.0}
            label="DIFF PRESS"
            unit="PSI"
            greenMax={5.5}
            amberMax={6.5}
          />
          <div className="text-center mt-1">
            <div className="text-sm font-bold text-slate-100">{diffPressure} PSI</div>
            {diffPressHigh && (
              <div className="text-[10px] font-bold text-red-500 animate-pulse">DIFF PRESS HI</div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between h-full">
          <div className="text-[9px] text-slate-400 mb-1">OUTFLOW VALVE</div>
          <div className="w-8 h-24 bg-slate-800 rounded border border-slate-600 relative overflow-hidden flex flex-col justify-end">
            <div
              className="w-full transition-all duration-300"
              style={{
                height: `${outflowValvePos}%`,
                backgroundColor:
                  outflowValvePos < 10 ? "#22c55e" : outflowValvePos > 80 ? "#6b7280" : "#f59e0b",
              }}
            />
          </div>
          <div className="text-center mt-1">
            <div className="text-sm font-bold text-slate-100">{outflowValvePos}%</div>
            <div className="text-[10px] text-slate-400">
              {outflowValvePos < 10 ? "CLOSED" : outflowValvePos > 80 ? "OPEN" : "MID"}
            </div>
          </div>
        </div>
      </div>

      {/* Annunciator lights */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div
          className={`rounded px-2 py-2 text-center text-[10px] font-bold border ${
            cabinAltHigh
              ? "bg-red-600 border-red-400 text-white animate-pulse"
              : "bg-slate-800 border-slate-700 text-slate-600"
          }`}
        >
          CABIN ALT
        </div>
        <div
          className={`rounded px-2 py-2 text-center text-[10px] font-bold border ${
            diffPressHigh
              ? "bg-red-600 border-red-400 text-white animate-pulse"
              : "bg-slate-800 border-slate-700 text-slate-600"
          }`}
        >
          DIFF PRESS HI
        </div>
        <div
          className={`rounded px-2 py-2 text-center text-[10px] font-bold border ${
            bleedOff
              ? "bg-amber-500 border-amber-300 text-slate-900"
              : "bg-slate-800 border-slate-700 text-slate-600"
          }`}
        >
          BLEED OFF
        </div>
        <div
          className={`rounded px-2 py-2 text-center text-[10px] font-bold border ${
            emergencyDump
              ? "bg-red-600 border-red-400 text-white dump-flash"
              : "bg-slate-800 border-slate-700 text-slate-600"
          }`}
        >
          DUMP OPEN
        </div>
      </div>

      {/* Status text */}
      <div
        className={`rounded-lg p-3 mb-4 text-sm font-medium border ${
          emergencyDump
            ? "bg-red-950 border-red-600 text-red-300"
            : bleedOff
            ? "bg-amber-950 border-amber-600 text-amber-300"
            : "bg-slate-800 border-slate-700 text-slate-200"
        }`}
      >
        {statusText}
      </div>

      {/* Controls panel */}
      <div className="bg-slate-950 rounded-lg border border-slate-700 p-4 space-y-4">
        {/* Flight Altitude slider */}
        <div>
          <label className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
            <span>FLIGHT ALTITUDE</span>
            <span className="text-slate-100">{flightAlt.toLocaleString()} ft</span>
          </label>
          <input
            type="range"
            min={0}
            max={35000}
            step={500}
            value={flightAlt}
            onChange={(e) => setFlightAlt(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Outflow valve slider (manual only) */}
        <div>
          <label
            className={`flex justify-between text-xs font-semibold mb-1 ${
              pressController === "auto" ? "text-slate-500" : "text-slate-300"
            }`}
          >
            <span>OUTFLOW VALVE — {outflowValvePos}% open</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={outflowValvePos}
            disabled={pressController === "auto"}
            onChange={(e) => setOutflowValvePos(Number(e.target.value))}
            className={`w-full ${
              pressController === "auto" ? "opacity-40 cursor-not-allowed accent-slate-600" : "accent-cyan-500"
            }`}
          />
        </div>

        {/* Toggle buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => setBleedAirOn((v) => !v)}
            className={`rounded-md py-2 text-xs font-bold border transition-colors ${
              bleedAirOn
                ? "bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
            }`}
          >
            BLEED AIR: {bleedAirOn ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setPressController((v) => (v === "auto" ? "manual" : "auto"))}
            className="rounded-md py-2 text-xs font-bold border bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 transition-colors"
          >
            PRESS CTRL: {pressController === "auto" ? "AUTO" : "MANUAL"}
          </button>

          <button
            onClick={() => setEmergencyDump((v) => !v)}
            className={`rounded-md py-2 text-xs font-bold border transition-colors ${
              emergencyDump
                ? "bg-red-600 border-red-400 text-white dump-flash"
                : "bg-red-900 border-red-700 text-red-200 hover:bg-red-800"
            }`}
          >
            DUMP: {emergencyDump ? "ACTIVE" : "ARM"}
          </button>
        </div>
      </div>
    </div>
  );
}
