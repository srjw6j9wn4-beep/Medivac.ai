import { useState } from "react";
import {
  Power,
  PowerOff,
  ArrowLeftRight,
  AlertTriangle,
  Gauge,
  Fuel,
} from "lucide-react";

export default function FuelSystemSimulator() {
  const [leftBoostPump, setLeftBoostPump] = useState(true);
  const [rightBoostPump, setRightBoostPump] = useState(true);
  const [crossfeedOpen, setCrossfeedOpen] = useState(false);
  const [leftEngineRunning, setLeftEngineRunning] = useState(true);
  const [rightEngineRunning, setRightEngineRunning] = useState(true);
  const [leftWingFuel, setLeftWingFuel] = useState(85); // percentage
  const [rightWingFuel, setRightWingFuel] = useState(85);
  const [leftNacelleFuel, setLeftNacelleFuel] = useState(90);
  const [rightNacelleFuel, setRightNacelleFuel] = useState(90);

  // ---- Derived flow logic ----
  const leftWingFlowing = leftBoostPump && leftNacelleFuel < 95;
  const rightWingFlowing = rightBoostPump && rightNacelleFuel < 95;
  const leftEngineFeeding = leftEngineRunning && (leftBoostPump || crossfeedOpen);
  const rightEngineFeeding = rightEngineRunning && (rightBoostPump || crossfeedOpen);
  const crossfeedFlowingToRight =
    crossfeedOpen && leftEngineRunning && !rightEngineRunning;
  const crossfeedFlowingToLeft =
    crossfeedOpen && rightEngineRunning && !leftEngineRunning;

  // ---- Annunciators ----
  const lowFuelL = leftNacelleFuel < 20;
  const lowFuelR = rightNacelleFuel < 20;
  const fuelPressL = leftEngineRunning && !leftBoostPump && !crossfeedOpen;
  const fuelPressR = rightEngineRunning && !rightBoostPump && !crossfeedOpen;
  const xfeedOpenAnnunc = crossfeedOpen;

  // ---- Status text ----
  function getStatusText(): { text: string; tone: "normal" | "warning" | "caution" } {
    if (!leftEngineRunning && !rightEngineRunning) {
      return {
        text: "CAUTION: Both engines failed — no fuel demand, check engine restart procedures.",
        tone: "warning",
      };
    }

    if (fuelPressL || fuelPressR) {
      const sides = [fuelPressL ? "left" : null, fuelPressR ? "right" : null]
        .filter(Boolean)
        .join(" and ");
      return {
        text: `WARNING: Low fuel pressure on ${sides} side — boost pump failure. Consider opening crossfeed.`,
        tone: "warning",
      };
    }

    if (lowFuelL || lowFuelR) {
      const sides = [lowFuelL ? "left" : null, lowFuelR ? "right" : null]
        .filter(Boolean)
        .join(" and ");
      return {
        text: `CAUTION: Low fuel quantity in ${sides} nacelle tank(s). Monitor closely.`,
        tone: "caution",
      };
    }

    if (crossfeedFlowingToRight) {
      return {
        text: "Single engine: Crossfeed open — left side feeding right engine across crossfeed line.",
        tone: "caution",
      };
    }

    if (crossfeedFlowingToLeft) {
      return {
        text: "Single engine: Crossfeed open — right side feeding left engine across crossfeed line.",
        tone: "caution",
      };
    }

    if (!leftEngineRunning) {
      return {
        text: "Left engine failed — right engine feeding normally from right nacelle tank.",
        tone: "caution",
      };
    }

    if (!rightEngineRunning) {
      return {
        text: "Right engine failed — left engine feeding normally from left nacelle tank.",
        tone: "caution",
      };
    }

    if (crossfeedOpen) {
      return {
        text: "Crossfeed open with both engines running — cross-tank flow available but not required.",
        tone: "caution",
      };
    }

    return {
      text: "Normal fuel flow — both engines feeding from their respective nacelle tanks.",
      tone: "normal",
    };
  }

  const status = getStatusText();

  const statusStyles: Record<string, string> = {
    normal: "border-green-500/40 bg-green-500/10 text-green-400",
    caution: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    warning: "border-red-500/40 bg-red-500/10 text-red-400",
  };

  // Crossfeed line color / animation
  let crossfeedStroke = "#374151";
  let crossfeedAnim = "none";
  if (crossfeedOpen) {
    if (crossfeedFlowingToRight) {
      crossfeedStroke = "#f59e0b";
      crossfeedAnim = "flowRight 0.6s linear infinite";
    } else if (crossfeedFlowingToLeft) {
      crossfeedStroke = "#f59e0b";
      crossfeedAnim = "flowLeft 0.6s linear infinite";
    } else {
      crossfeedStroke = "#f59e0b";
      crossfeedAnim = "flowRight 1.2s linear infinite";
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-background rounded-lg border border-border">
      <style>
        {`
          @keyframes flowRight { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
          @keyframes flowLeft { from { stroke-dashoffset: -20; } to { stroke-dashoffset: 0; } }
          @keyframes flowDown { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        `}
      </style>

      <div className="flex items-center gap-2">
        <Fuel className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-foreground">
          King Air B200/B350 Fuel System
        </h2>
      </div>

      {/* SVG Diagram */}
      <div className="w-full bg-card rounded-md border border-border p-2">
        <svg viewBox="0 0 600 320" className="w-full h-auto">
          <defs>
            <marker
              id="arrowRight"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
            </marker>
            <marker
              id="arrowLeft"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
            </marker>
            <marker
              id="arrowCyan"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#06b6d4" />
            </marker>
            <marker
              id="arrowCyanLeft"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#06b6d4" />
            </marker>
            <marker
              id="arrowGreenDown"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#22c55e" />
            </marker>
          </defs>

          {/* ---- Flow line: Left wing -> Left nacelle ---- */}
          <path
            d="M160,90 H190"
            fill="none"
            strokeWidth={4}
            strokeDasharray="8 4"
            markerEnd={leftWingFlowing ? "url(#arrowCyan)" : undefined}
            style={{
              animation: leftWingFlowing ? "flowRight 0.6s linear infinite" : "none",
              stroke: leftWingFlowing ? "#06b6d4" : "#374151",
            }}
          />

          {/* ---- Flow line: Right wing -> Right nacelle ---- */}
          <path
            d="M440,90 H410"
            fill="none"
            strokeWidth={4}
            strokeDasharray="8 4"
            markerEnd={rightWingFlowing ? "url(#arrowCyanLeft)" : undefined}
            style={{
              animation: rightWingFlowing ? "flowLeft 0.6s linear infinite" : "none",
              stroke: rightWingFlowing ? "#06b6d4" : "#374151",
            }}
          />

          {/* ---- Flow line: Left nacelle -> Left engine ---- */}
          <path
            d="M230,120 V210"
            fill="none"
            strokeWidth={4}
            strokeDasharray="8 4"
            markerEnd={leftEngineFeeding ? "url(#arrowGreenDown)" : undefined}
            style={{
              animation: leftEngineFeeding ? "flowDown 0.6s linear infinite" : "none",
              stroke: leftEngineFeeding ? "#22c55e" : "#374151",
            }}
          />

          {/* ---- Flow line: Right nacelle -> Right engine ---- */}
          <path
            d="M370,120 V210"
            fill="none"
            strokeWidth={4}
            strokeDasharray="8 4"
            markerEnd={rightEngineFeeding ? "url(#arrowGreenDown)" : undefined}
            style={{
              animation: rightEngineFeeding ? "flowDown 0.6s linear infinite" : "none",
              stroke: rightEngineFeeding ? "#22c55e" : "#374151",
            }}
          />

          {/* ---- Crossfeed line ---- */}
          <path
            d="M270,97 H330"
            fill="none"
            strokeWidth={4}
            strokeDasharray="8 4"
            markerEnd={crossfeedFlowingToRight ? "url(#arrowRight)" : undefined}
            markerStart={crossfeedFlowingToLeft ? "url(#arrowLeft)" : undefined}
            style={{
              animation: crossfeedAnim,
              stroke: crossfeedStroke,
            }}
          />
          <text
            x={300}
            y={90}
            textAnchor="middle"
            className="fill-current"
            fontSize={10}
            fontWeight={600}
            fill={crossfeedOpen ? "#f59e0b" : "#6b7280"}
          >
            XFEED
          </text>

          {/* ---- Left Wing Tank ---- */}
          <text x={90} y={50} textAnchor="middle" fontSize={12} fontWeight={600} fill="#94a3b8">
            LEFT WING TANK
          </text>
          <rect x={20} y={60} width={140} height={60} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <rect
            x={21}
            y={61 + 58 * (1 - leftWingFuel / 100)}
            width={138}
            height={58 * (leftWingFuel / 100)}
            fill="#0ea5e9"
            opacity={0.3}
            rx={3}
          />
          <text x={90} y={94} textAnchor="middle" fontSize={14} fontWeight={700} fill="#e2e8f0">
            {leftWingFuel}%
          </text>

          {/* ---- Right Wing Tank ---- */}
          <text x={510} y={50} textAnchor="middle" fontSize={12} fontWeight={600} fill="#94a3b8">
            RIGHT WING TANK
          </text>
          <rect x={440} y={60} width={140} height={60} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <rect
            x={441}
            y={61 + 58 * (1 - rightWingFuel / 100)}
            width={138}
            height={58 * (rightWingFuel / 100)}
            fill="#0ea5e9"
            opacity={0.3}
            rx={3}
          />
          <text x={510} y={94} textAnchor="middle" fontSize={14} fontWeight={700} fill="#e2e8f0">
            {rightWingFuel}%
          </text>

          {/* ---- Left Nacelle Tank ---- */}
          <text x={230} y={70} textAnchor="middle" fontSize={10} fontWeight={600} fill="#94a3b8">
            L NACELLE
          </text>
          <rect x={190} y={75} width={80} height={45} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <rect
            x={191}
            y={76 + 43 * (1 - leftNacelleFuel / 100)}
            width={78}
            height={43 * (leftNacelleFuel / 100)}
            fill="#0ea5e9"
            opacity={0.35}
            rx={3}
          />
          <text x={230} y={101} textAnchor="middle" fontSize={12} fontWeight={700} fill="#e2e8f0">
            {leftNacelleFuel}%
          </text>

          {/* ---- Right Nacelle Tank ---- */}
          <text x={370} y={70} textAnchor="middle" fontSize={10} fontWeight={600} fill="#94a3b8">
            R NACELLE
          </text>
          <rect x={330} y={75} width={80} height={45} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <rect
            x={331}
            y={76 + 43 * (1 - rightNacelleFuel / 100)}
            width={78}
            height={43 * (rightNacelleFuel / 100)}
            fill="#0ea5e9"
            opacity={0.35}
            rx={3}
          />
          <text x={370} y={101} textAnchor="middle" fontSize={12} fontWeight={700} fill="#e2e8f0">
            {rightNacelleFuel}%
          </text>

          {/* ---- Boost pump indicators ---- */}
          <circle cx={230} cy={135} r={7} fill={leftBoostPump ? "#22c55e" : "#4b5563"} />
          <text x={230} y={150} textAnchor="middle" fontSize={8} fill="#94a3b8">
            PUMP
          </text>
          <circle cx={370} cy={135} r={7} fill={rightBoostPump ? "#22c55e" : "#4b5563"} />
          <text x={370} y={150} textAnchor="middle" fontSize={8} fill="#94a3b8">
            PUMP
          </text>

          {/* ---- Left Engine ---- */}
          <rect
            x={200}
            y={210}
            width={60}
            height={40}
            rx={4}
            fill="#1e293b"
            stroke={leftEngineRunning ? "#22c55e" : "#ef4444"}
            strokeWidth={2.5}
          />
          <text x={230} y={228} textAnchor="middle" fontSize={9} fontWeight={700} fill="#e2e8f0">
            PT6A-60A
          </text>
          <text
            x={230}
            y={240}
            textAnchor="middle"
            fontSize={8}
            fontWeight={600}
            fill={leftEngineRunning ? "#22c55e" : "#ef4444"}
          >
            {leftEngineRunning ? "RUNNING" : "FAILED"}
          </text>
          <text x={230} y={265} textAnchor="middle" fontSize={11} fontWeight={600} fill="#94a3b8">
            LEFT ENGINE
          </text>

          {/* ---- Right Engine ---- */}
          <rect
            x={340}
            y={210}
            width={60}
            height={40}
            rx={4}
            fill="#1e293b"
            stroke={rightEngineRunning ? "#22c55e" : "#ef4444"}
            strokeWidth={2.5}
          />
          <text x={370} y={228} textAnchor="middle" fontSize={9} fontWeight={700} fill="#e2e8f0">
            PT6A-60A
          </text>
          <text
            x={370}
            y={240}
            textAnchor="middle"
            fontSize={8}
            fontWeight={600}
            fill={rightEngineRunning ? "#22c55e" : "#ef4444"}
          >
            {rightEngineRunning ? "RUNNING" : "FAILED"}
          </text>
          <text x={370} y={265} textAnchor="middle" fontSize={11} fontWeight={600} fill="#94a3b8">
            RIGHT ENGINE
          </text>
        </svg>
      </div>

      {/* Annunciator panel */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <AnnunciatorLight label="LOW FUEL L" active={lowFuelL} color="red" />
        <AnnunciatorLight label="LOW FUEL R" active={lowFuelR} color="red" />
        <AnnunciatorLight label="FUEL PRESS L" active={fuelPressL} color="amber" />
        <AnnunciatorLight label="FUEL PRESS R" active={fuelPressR} color="amber" />
        <AnnunciatorLight label="XFEED OPEN" active={xfeedOpenAnnunc} color="cyan" />
      </div>

      {/* Status panel */}
      <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${statusStyles[status.tone]}`}>
        {status.tone === "normal" ? (
          <Gauge className="w-4 h-4 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        )}
        <span>{status.text}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleButton
            label="Left Boost Pump"
            state={leftBoostPump ? "ON" : "OFF"}
            active={leftBoostPump}
            onClick={() => setLeftBoostPump((v) => !v)}
            icon={leftBoostPump ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
          />
          <ToggleButton
            label="Right Boost Pump"
            state={rightBoostPump ? "ON" : "OFF"}
            active={rightBoostPump}
            onClick={() => setRightBoostPump((v) => !v)}
            icon={rightBoostPump ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
          />
          <ToggleButton
            label="Crossfeed Valve"
            state={crossfeedOpen ? "OPEN" : "CLOSED"}
            active={crossfeedOpen}
            onClick={() => setCrossfeedOpen((v) => !v)}
            icon={<ArrowLeftRight className="w-4 h-4" />}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ToggleButton
            label="Left Engine"
            state={leftEngineRunning ? "RUNNING" : "FAILED"}
            active={leftEngineRunning}
            failed={!leftEngineRunning}
            onClick={() => setLeftEngineRunning((v) => !v)}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <ToggleButton
            label="Right Engine"
            state={rightEngineRunning ? "RUNNING" : "FAILED"}
            active={rightEngineRunning}
            failed={!rightEngineRunning}
            onClick={() => setRightEngineRunning((v) => !v)}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Fuel quantity sliders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
        <FuelSlider
          label="L Wing Fuel"
          value={leftWingFuel}
          onChange={setLeftWingFuel}
        />
        <FuelSlider
          label="R Wing Fuel"
          value={rightWingFuel}
          onChange={setRightWingFuel}
        />
        <FuelSlider
          label="L Nacelle Fuel"
          value={leftNacelleFuel}
          onChange={setLeftNacelleFuel}
        />
        <FuelSlider
          label="R Nacelle Fuel"
          value={rightNacelleFuel}
          onChange={setRightNacelleFuel}
        />
      </div>
    </div>
  );
}

function AnnunciatorLight({
  label,
  active,
  color,
}: {
  label: string;
  active: boolean;
  color: "red" | "amber" | "cyan";
}) {
  const activeStyles: Record<string, string> = {
    red: "bg-red-500/20 border-red-500 text-red-400",
    amber: "bg-amber-500/20 border-amber-500 text-amber-400",
    cyan: "bg-cyan-500/20 border-cyan-500 text-cyan-400",
  };
  return (
    <div
      className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-semibold tracking-wide transition-colors ${
        active ? activeStyles[color] : "bg-muted/20 border-border text-muted-foreground/50"
      }`}
    >
      <AlertTriangle className={`w-3.5 h-3.5 ${active ? "" : "opacity-30"}`} />
      {label}
    </div>
  );
}

function ToggleButton({
  label,
  state,
  active,
  failed,
  onClick,
  icon,
}: {
  label: string;
  state: string;
  active: boolean;
  failed?: boolean;
  onClick: () => void;
  icon: JSX.Element;
}) {
  let styles = "bg-muted/30 border-border text-muted-foreground";
  if (failed) {
    styles = "bg-red-500/20 border-red-500 text-red-400";
  } else if (active) {
    styles = "bg-green-500/20 border-green-500 text-green-400";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-md border-2 px-3 py-2 transition-colors hover:brightness-110 ${styles}`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold tracking-wide">{state}</span>
    </button>
  );
}

function FuelSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground flex justify-between">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full bg-muted accent-cyan-500 cursor-pointer"
      />
    </div>
  );
}
