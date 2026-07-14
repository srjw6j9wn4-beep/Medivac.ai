import { useState } from "react";
import {
  Zap,
  ZapOff,
  Battery,
  BatteryCharging,
  Plug,
  AlertTriangle,
  Power,
  Radio,
} from "lucide-react";

/**
 * ElectricalSystemSimulator
 * King Air B200 Electrical System — interactive bus diagram trainer.
 * Self-contained: only `useState` from React + icons from `lucide-react`.
 */

interface LoadBox {
  label: string;
  x: number;
  y: number;
}

export default function ElectricalSystemSimulator() {
  const [gen1On, setGen1On] = useState(true);
  const [gen2On, setGen2On] = useState(true);
  const [avionicsMaster, setAvionicsMaster] = useState(true);
  const [gen1Failed, setGen1Failed] = useState(false);
  const [gen2Failed, setGen2Failed] = useState(false);
  const [externalPower, setExternalPower] = useState(false);
  const [batteryOn, setBatteryOn] = useState(true);

  // --- Derived power logic -------------------------------------------------
  const gen1Powered = gen1On && !gen1Failed;
  const gen2Powered = gen2On && !gen2Failed;
  const leftBusPowered = gen1Powered || externalPower || batteryOn;
  const rightBusPowered = gen2Powered || leftBusPowered; // tie bus connects if one gen fails
  const avionicsBusPowered = avionicsMaster && (leftBusPowered || rightBusPowered);
  const batteryBusPowered = batteryOn;
  const tieBusActive =
    (gen1Powered && !gen2Powered) || (!gen1Powered && gen2Powered);

  const bothGensFailed =
    (!gen1Powered && !gen2Powered) && !externalPower;

  // --- Status description ---------------------------------------------------
  function getStatusDescription(): { text: string; tone: "normal" | "caution" | "emergency" } {
    if (externalPower && !gen1Powered && !gen2Powered) {
      return {
        text: "Ground power connected — GPU powering left DC bus. Generators should be offline.",
        tone: "caution",
      };
    }
    if (!gen1Powered && !gen2Powered) {
      return {
        text: "EMERGENCY — Both generators offline. Battery bus only. ~30 min endurance. Shed non-essential loads.",
        tone: "emergency",
      };
    }
    if (!gen1Powered && gen2Powered) {
      return {
        text: "GEN 1 INOP — Tie bus active. Right generator powering all DC buses. Monitor load.",
        tone: "caution",
      };
    }
    if (!gen2Powered && gen1Powered) {
      return {
        text: "GEN 2 INOP — Tie bus active. Left generator powering all DC buses. Monitor load.",
        tone: "caution",
      };
    }
    return {
      text: "Normal electrical — both generators on line, all buses powered",
      tone: "normal",
    };
  }

  const status = getStatusDescription();

  // --- Helpers ---------------------------------------------------------------
  const colorFor = (powered: boolean, failed?: boolean) =>
    failed ? "#ef4444" : powered ? "#22c55e" : "#6b7280";

  const fillFor = (powered: boolean, failed?: boolean) =>
    failed ? "rgba(239,68,68,0.15)" : powered ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.12)";

  const lineProps = (powered: boolean, failed?: boolean) => ({
    stroke: failed ? "#ef4444" : powered ? "#22c55e" : "#6b7280",
    strokeWidth: 2.5,
    strokeDasharray: failed ? "4 4" : powered ? "6 3" : "3 3",
    style: powered
      ? ({ animation: "flowDown 1s linear infinite" } as Record<string, string>)
      : failed
      ? ({ animation: "pulse 1.2s ease-in-out infinite" } as Record<string, string>)
      : undefined,
  });

  const leftLoads: LoadBox[] = [
    { label: "Pitot Heat", x: 30, y: 280 },
    { label: "Nav Lights", x: 110, y: 280 },
    { label: "L Boost Pump", x: 190, y: 280 },
  ];
  const rightLoads: LoadBox[] = [
    { label: "R Boost Pump", x: 355, y: 280 },
    { label: "Landing Light", x: 435, y: 280 },
    { label: "Autopilot", x: 515, y: 280 },
  ];
  const avionicsLoads: LoadBox[] = [
    { label: "PFD", x: 195, y: 310 },
    { label: "MFD", x: 270, y: 310 },
    { label: "FMS", x: 345, y: 310 },
    { label: "AHRS", x: 420, y: 310 },
  ];

  const annunciators: { text: string; active: boolean; tone: "red" | "amber" | "cyan" }[] = [
    { text: "GEN 1 INOP", active: gen1Failed, tone: "red" },
    { text: "GEN 2 INOP", active: gen2Failed, tone: "red" },
    { text: "L DC BUS OFF", active: !leftBusPowered, tone: "red" },
    { text: "R DC BUS OFF", active: !rightBusPowered, tone: "red" },
    { text: "AVIONICS OFF", active: !avionicsBusPowered, tone: "amber" },
    {
      text: "TIE BUS — Tie bus active, single generator carrying load",
      active: tieBusActive,
      tone: "cyan",
    },
  ];

  const toneClasses = (tone: "red" | "amber" | "cyan") => {
    switch (tone) {
      case "red":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "amber":
        return "bg-amber-500/20 border-amber-500 text-amber-400";
      case "cyan":
        return "bg-cyan-500/20 border-cyan-500 text-cyan-400";
    }
  };

  const toggleBtnClass = (state: "active" | "failed" | "off") => {
    if (state === "active") return "bg-green-500/20 border-green-500 text-green-400";
    if (state === "failed") return "bg-red-500/20 border-red-500 text-red-400";
    return "bg-muted/30 border-border text-muted-foreground";
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-4">
      <style>{`
        @keyframes flowDown { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-foreground">
          King Air B200 — Electrical System Simulator
        </h2>
      </div>

      {/* SVG Diagram */}
      <div className="bg-black/40 border border-border rounded-lg p-2 overflow-x-auto">
        <svg viewBox="0 0 640 400" className="w-full h-auto min-w-[640px]">
          <defs>
            <marker
              id="arrowGreen"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#22c55e" />
            </marker>
            <marker
              id="arrowGray"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#6b7280" />
            </marker>
            <marker
              id="arrowRed"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444" />
            </marker>
            <marker
              id="arrowCyan"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
            </marker>
          </defs>

          {/* ---------------- Vertical flow lines: sources -> buses ---------------- */}
          {/* GEN1 -> LEFT BUS */}
          <line
            x1={85}
            y1={60}
            x2={85}
            y2={120}
            markerEnd={gen1Powered ? "url(#arrowGreen)" : "url(#arrowGray)"}
            {...lineProps(gen1Powered, gen1Failed)}
          />
          {/* BATTERY -> BATT BUS */}
          <line
            x1={305}
            y1={60}
            x2={280}
            y2={120}
            markerEnd={batteryOn ? "url(#arrowGreen)" : "url(#arrowGray)"}
            {...lineProps(batteryOn)}
          />
          {/* EXT PWR -> LEFT BUS */}
          <line
            x1={425}
            y1={60}
            x2={150}
            y2={120}
            markerEnd={externalPower ? "url(#arrowGreen)" : "url(#arrowGray)"}
            {...lineProps(externalPower)}
          />
          {/* GEN2 -> RIGHT BUS */}
          <line
            x1={555}
            y1={60}
            x2={555}
            y2={120}
            markerEnd={gen2Powered ? "url(#arrowGreen)" : "url(#arrowGray)"}
            {...lineProps(gen2Powered, gen2Failed)}
          />

          {/* ---------------- Tie bus connector between left & right ---------------- */}
          <line
            x1={200}
            y1={137}
            x2={360}
            y2={137}
            stroke={tieBusActive ? "#22d3ee" : "#374151"}
            strokeWidth={tieBusActive ? 3 : 1.5}
            strokeDasharray={tieBusActive ? "6 3" : "2 4"}
            style={
              tieBusActive
                ? ({ animation: "flowDown 1s linear infinite" } as Record<string, string>)
                : undefined
            }
          />
          <text
            x={280}
            y={128}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill={tieBusActive ? "#22d3ee" : "#6b7280"}
          >
            TIE BUS
          </text>

          {/* BATT BUS connects to LEFT BUS always (battery relay) */}
          <line
            x1={230}
            y1={137}
            x2={200}
            y2={137}
            stroke={batteryBusPowered ? "#22c55e" : "#6b7280"}
            strokeWidth={2}
            strokeDasharray="4 3"
          />

          {/* ---------------- Power source boxes ---------------- */}
          {/* GEN 1 */}
          <g>
            <rect
              x={40}
              y={20}
              width={90}
              height={40}
              rx={4}
              fill={fillFor(gen1Powered, gen1Failed)}
              stroke={colorFor(gen1Powered, gen1Failed)}
              strokeWidth={2}
            />
            <text x={85} y={38} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e5e7eb">
              GEN 1
            </text>
            <text
              x={85}
              y={52}
              textAnchor="middle"
              fontSize="9"
              fill={colorFor(gen1Powered, gen1Failed)}
            >
              {gen1Failed ? "FAILED" : gen1Powered ? "ON LINE" : "OFF"}
            </text>
          </g>

          {/* BATTERY */}
          <g>
            <rect
              x={260}
              y={20}
              width={90}
              height={40}
              rx={4}
              fill={fillFor(batteryOn)}
              stroke={colorFor(batteryOn)}
              strokeWidth={2}
            />
            <text x={305} y={35} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e5e7eb">
              BATTERY
            </text>
            <text x={305} y={47} textAnchor="middle" fontSize="8" fill={colorFor(batteryOn)}>
              {batteryOn ? "BATT 24V" : "OFF"}
            </text>
          </g>

          {/* EXT PWR */}
          <g>
            <rect
              x={380}
              y={20}
              width={90}
              height={40}
              rx={4}
              fill={externalPower ? "rgba(245,158,11,0.15)" : fillFor(false)}
              stroke={externalPower ? "#f59e0b" : "#6b7280"}
              strokeWidth={2}
            />
            <text x={425} y={38} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#e5e7eb">
              EXT PWR
            </text>
            <text
              x={425}
              y={51}
              textAnchor="middle"
              fontSize="8"
              fill={externalPower ? "#f59e0b" : "#6b7280"}
            >
              {externalPower ? "CONNECTED" : "DISCONNECTED"}
            </text>
          </g>

          {/* GEN 2 */}
          <g>
            <rect
              x={510}
              y={20}
              width={90}
              height={40}
              rx={4}
              fill={fillFor(gen2Powered, gen2Failed)}
              stroke={colorFor(gen2Powered, gen2Failed)}
              strokeWidth={2}
            />
            <text x={555} y={38} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e5e7eb">
              GEN 2
            </text>
            <text
              x={555}
              y={52}
              textAnchor="middle"
              fontSize="9"
              fill={colorFor(gen2Powered, gen2Failed)}
            >
              {gen2Failed ? "FAILED" : gen2Powered ? "ON LINE" : "OFF"}
            </text>
          </g>

          {/* ---------------- Bus bars ---------------- */}
          {/* LEFT DC BUS */}
          <rect
            x={20}
            y={120}
            width={180}
            height={35}
            rx={3}
            fill={leftBusPowered ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.15)"}
            stroke={colorFor(leftBusPowered)}
            strokeWidth={2}
          />
          <text x={110} y={135} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#e5e7eb">
            LEFT DC BUS
          </text>
          <text x={110} y={148} textAnchor="middle" fontSize="8" fill={colorFor(leftBusPowered)}>
            {leftBusPowered ? "28V DC" : "UNPOWERED"}
          </text>

          {/* BATT BUS */}
          <rect
            x={230}
            y={120}
            width={100}
            height={35}
            rx={3}
            fill={batteryBusPowered ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.15)"}
            stroke={colorFor(batteryBusPowered)}
            strokeWidth={2}
          />
          <text x={280} y={135} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#e5e7eb">
            BATT BUS
          </text>
          <text x={280} y={148} textAnchor="middle" fontSize="8" fill={colorFor(batteryBusPowered)}>
            {batteryBusPowered ? "28V DC" : "UNPOWERED"}
          </text>

          {/* RIGHT DC BUS */}
          <rect
            x={360}
            y={120}
            width={180}
            height={35}
            rx={3}
            fill={rightBusPowered ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.15)"}
            stroke={colorFor(rightBusPowered)}
            strokeWidth={2}
          />
          <text x={450} y={135} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#e5e7eb">
            RIGHT DC BUS
          </text>
          <text x={450} y={148} textAnchor="middle" fontSize="8" fill={colorFor(rightBusPowered)}>
            {rightBusPowered ? "28V DC" : "UNPOWERED"}
          </text>

          {/* ---------------- Vertical lines: buses -> avionics bus ---------------- */}
          <line
            x1={110}
            y1={155}
            x2={250}
            y2={220}
            markerEnd={avionicsBusPowered ? "url(#arrowGreen)" : "url(#arrowGray)"}
            {...lineProps(avionicsBusPowered)}
          />
          <line
            x1={450}
            y1={155}
            x2={390}
            y2={220}
            markerEnd={avionicsBusPowered ? "url(#arrowGreen)" : "url(#arrowGray)"}
            {...lineProps(avionicsBusPowered)}
          />

          {/* AVIONICS BUS */}
          <rect
            x={180}
            y={220}
            width={280}
            height={35}
            rx={3}
            fill={avionicsBusPowered ? "rgba(34,211,238,0.2)" : "rgba(107,114,128,0.15)"}
            stroke={avionicsBusPowered ? "#22d3ee" : "#6b7280"}
            strokeWidth={2}
          />
          <text x={320} y={235} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#e5e7eb">
            AVIONICS BUS
          </text>
          <text
            x={320}
            y={248}
            textAnchor="middle"
            fontSize="8"
            fill={avionicsBusPowered ? "#22d3ee" : "#6b7280"}
          >
            {avionicsBusPowered ? "28V DC" : "UNPOWERED"}
          </text>

          {/* ---------------- Horizontal lines: buses -> loads ---------------- */}
          {leftLoads.map((load, i) => (
            <line
              key={`l-line-${i}`}
              x1={110}
              y1={155}
              x2={load.x + 35}
              y2={280}
              {...lineProps(leftBusPowered)}
            />
          ))}
          {rightLoads.map((load, i) => (
            <line
              key={`r-line-${i}`}
              x1={450}
              y1={155}
              x2={load.x + 35}
              y2={280}
              {...lineProps(rightBusPowered)}
            />
          ))}
          {avionicsLoads.map((load, i) => (
            <line
              key={`a-line-${i}`}
              x1={320}
              y1={255}
              x2={load.x + 25}
              y2={310}
              {...lineProps(avionicsBusPowered)}
            />
          ))}

          {/* ---------------- Load boxes ---------------- */}
          {leftLoads.map((load, i) => (
            <g key={`l-box-${i}`}>
              <rect
                x={load.x}
                y={load.y}
                width={70}
                height={26}
                rx={3}
                fill={fillFor(leftBusPowered)}
                stroke={colorFor(leftBusPowered)}
                strokeWidth={1.5}
              />
              <text
                x={load.x + 35}
                y={load.y + 16}
                textAnchor="middle"
                fontSize="7.5"
                fill="#e5e7eb"
              >
                {load.label}
              </text>
            </g>
          ))}
          {rightLoads.map((load, i) => (
            <g key={`r-box-${i}`}>
              <rect
                x={load.x}
                y={load.y}
                width={70}
                height={26}
                rx={3}
                fill={fillFor(rightBusPowered)}
                stroke={colorFor(rightBusPowered)}
                strokeWidth={1.5}
              />
              <text
                x={load.x + 35}
                y={load.y + 16}
                textAnchor="middle"
                fontSize="7.5"
                fill="#e5e7eb"
              >
                {load.label}
              </text>
            </g>
          ))}
          {avionicsLoads.map((load, i) => (
            <g key={`a-box-${i}`}>
              <rect
                x={load.x}
                y={load.y}
                width={50}
                height={26}
                rx={3}
                fill={
                  avionicsBusPowered ? "rgba(34,211,238,0.15)" : "rgba(107,114,128,0.12)"
                }
                stroke={avionicsBusPowered ? "#22d3ee" : "#6b7280"}
                strokeWidth={1.5}
              />
              <text
                x={load.x + 25}
                y={load.y + 16}
                textAnchor="middle"
                fontSize="8"
                fill="#e5e7eb"
              >
                {load.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Status description */}
      <div
        className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
          status.tone === "emergency"
            ? "bg-red-500/10 border-red-500 text-red-400"
            : status.tone === "caution"
            ? "bg-amber-500/10 border-amber-500 text-amber-400"
            : "bg-green-500/10 border-green-500 text-green-400"
        }`}
      >
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{status.text}</span>
      </div>

      {/* Annunciator panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {annunciators.map((a, i) => (
          <div
            key={i}
            className={`rounded-md border px-3 py-2 text-xs font-semibold text-center transition-opacity ${
              a.active ? toneClasses(a.tone) : "bg-muted/20 border-border text-muted-foreground/40"
            }`}
            style={a.active ? { animation: "pulse 1.5s ease-in-out infinite" } : undefined}
          >
            {a.text}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Power className="w-4 h-4" />
          Electrical System Controls
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* GEN 1 switch */}
          <button
            onClick={() => setGen1On((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              gen1Failed ? "off" : gen1On ? "active" : "off"
            )}`}
          >
            {gen1On ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            GEN 1: {gen1On ? "ON" : "OFF"}
          </button>

          {/* GEN 2 switch */}
          <button
            onClick={() => setGen2On((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              gen2Failed ? "off" : gen2On ? "active" : "off"
            )}`}
          >
            {gen2On ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            GEN 2: {gen2On ? "ON" : "OFF"}
          </button>

          {/* AVIONICS MASTER */}
          <button
            onClick={() => setAvionicsMaster((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              avionicsMaster ? "active" : "off"
            )}`}
          >
            <Radio className="w-3.5 h-3.5" />
            AVIONICS: {avionicsMaster ? "ON" : "OFF"}
          </button>

          {/* BATTERY */}
          <button
            onClick={() => setBatteryOn((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              batteryOn ? "active" : "off"
            )}`}
          >
            {batteryOn ? (
              <BatteryCharging className="w-3.5 h-3.5" />
            ) : (
              <Battery className="w-3.5 h-3.5" />
            )}
            BATTERY: {batteryOn ? "ON" : "OFF"}
          </button>

          {/* EXTERNAL POWER */}
          <button
            onClick={() => setExternalPower((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              externalPower ? "active" : "off"
            )}`}
          >
            <Plug className="w-3.5 h-3.5" />
            EXT PWR: {externalPower ? "CONNECTED" : "DISCONNECTED"}
          </button>

          {/* GEN 1 FAIL */}
          <button
            onClick={() => setGen1Failed((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              gen1Failed ? "failed" : "off"
            )}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            GEN 1 FAIL: {gen1Failed ? "FAILED" : "NORMAL"}
          </button>

          {/* GEN 2 FAIL */}
          <button
            onClick={() => setGen2Failed((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${toggleBtnClass(
              gen2Failed ? "failed" : "off"
            )}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            GEN 2 FAIL: {gen2Failed ? "FAILED" : "NORMAL"}
          </button>
        </div>
      </div>

      {bothGensFailed && (
        <div className="flex items-center gap-2 rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          Both generators offline — aircraft is on battery power only. Endurance is limited.
        </div>
      )}
    </div>
  );
}
