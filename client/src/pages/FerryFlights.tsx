import { useState, useRef, useEffect, useCallback } from "react";
import { type UserRole } from "@/lib/data";
import {
  CheckCircle, AlertTriangle, Camera, ArrowRight, ArrowLeft,
  History, RotateCcw, Lock, Unlock, User, Clock,
  Plane, Download, AlertCircle, Barcode, X, ScanLine, Image
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ── Checklist definitions ────────────────────────────────────────────────────

const OUT_CHECKLIST = [
  {
    id: "out_01", category: "Medical Equipment",
    item: "Patient stretcher", detail: "Remove, inspect, confirm unserviceable flag if applicable",
    requiresPhoto: true, critical: true,
  },
  {
    id: "out_02", category: "Medical Equipment",
    item: "Oxygen system (cylinders + delivery sets)", detail: "Isolate O2, remove cylinders, stow masks and tubing",
    requiresPhoto: true, critical: true,
  },
  {
    id: "out_03", category: "Medical Equipment",
    item: "Cardiac monitor / defibrillator", detail: "Power down, remove, secure cable harness",
    requiresPhoto: true, critical: true,
  },
  {
    id: "out_04", category: "Medical Equipment",
    item: "Suction unit", detail: "Remove suction unit, disinfect, cap ports",
    requiresPhoto: true, critical: false,
  },
  {
    id: "out_05", category: "Medical Equipment",
    item: "IV poles (×2)", detail: "Remove both IV poles — confirm count",
    requiresPhoto: false, critical: false,
  },
  {
    id: "out_06", category: "Medical Equipment",
    item: "Drug safe / medications", detail: "Remove controlled drugs safe, return to pharmacy under dual witness",
    requiresPhoto: true, critical: true,
  },
  {
    id: "out_07", category: "Cabin Configuration",
    item: "Cabin interior photograph — pre-ferry state", detail: "360° cabin photo logged — shows all equipment removed",
    requiresPhoto: true, critical: true,
  },
  {
    id: "out_08", category: "Aircraft Airworthiness",
    item: "Maintenance release confirmed valid for ferry", detail: "LAME to confirm MR covers ferry profile (no medical equipment)",
    requiresPhoto: false, critical: true,
  },
  {
    id: "out_09", category: "Aircraft Airworthiness",
    item: "Weight & balance calculated — ferry config", detail: "W&B recalculated with medical equipment removed",
    requiresPhoto: false, critical: true,
  },
  {
    id: "out_10", category: "Documentation",
    item: "Ferry flight plan filed (NAIPS)", detail: "IFR flight plan filed — route, fuel, alternates",
    requiresPhoto: false, critical: true,
  },
  {
    id: "out_11", category: "Documentation",
    item: "Tech log entry — ferry departure", detail: "Ferry purpose, equipment status, and MR reference noted in tech log",
    requiresPhoto: false, critical: true,
  },
  {
    id: "out_12", category: "Crew",
    item: "Pilot ferry endorsement confirmed", detail: "Pilot holds current ferry endorsement — confirmed in Air Maestro",
    requiresPhoto: false, critical: true,
  },
  // ── Additional items from AVM851 v3.0 / RFDS SOPs ────────────────────────────
  {
    id: "out_13", category: "Medical Equipment",
    item: "Transport ventilator removed (if fitted)", detail: "ICU / NETS config — ventilator powered down, removed, and secured in base store",
    requiresPhoto: true, critical: true, techLogItem: true,
  },
  {
    id: "out_14", category: "Medical Equipment",
    item: "Infusion pumps removed (×2)", detail: "Both syringe / infusion pumps removed — serial numbers noted, secured in base store",
    requiresPhoto: false, critical: false, techLogItem: false,
  },
  {
    id: "out_15", category: "Medical Equipment",
    item: "Incubator / humidicrib removed (NETS config)", detail: "Neonatal incubator removed if fitted — STC-listed item; LAME to log removal",
    requiresPhoto: true, critical: true, techLogItem: true,
  },
  {
    id: "out_16", category: "Medical Equipment",
    item: "Patient restraint harness removed", detail: "Stretcher lap belt and restraint harness removed with stretcher frame",
    requiresPhoto: false, critical: false, techLogItem: false,
  },
  {
    id: "out_17", category: "Cabin Configuration",
    item: "Medical equipment mounting rails / rack frames", detail: "STC-listed structural items — if removed, LAME must log in tech log; confirm status before ferry",
    requiresPhoto: true, critical: true, techLogItem: true,
  },
  {
    id: "out_18", category: "Cabin Configuration",
    item: "Cabin divider / privacy curtain secured or removed", detail: "Structural attachment points confirmed secure — if removed, record in tech log",
    requiresPhoto: false, critical: false, techLogItem: true,
  },
  {
    id: "out_19", category: "Aircraft Airworthiness",
    item: "ELT confirmed armed and functional", detail: "ELT armed, activation switch set to ARM — confirmed pre-departure",
    requiresPhoto: false, critical: true, techLogItem: false,
  },
  {
    id: "out_20", category: "Aircraft Airworthiness",
    item: "Fuel checked — ferry profile load", detail: "Fuel load calculated for ferry profile (no medical weight) — adequate for route + alternates",
    requiresPhoto: false, critical: true, techLogItem: false,
  },
  {
    id: "out_21", category: "Documentation",
    item: "Weather brief + alternates confirmed", detail: "SIGMET / TAF reviewed for route; YSBK / YSSY / YMLT filed as alternates if applicable",
    requiresPhoto: false, critical: true, techLogItem: false,
  },
  {
    id: "out_22", category: "Documentation",
    item: "AVM851 v3.0 form physically signed and filed", detail: "Hard-copy AVM851 completed, signed by authorising officer, filed with Ops Centre",
    requiresPhoto: false, critical: true, techLogItem: false,
  },
  {
    id: "out_23", category: "Documentation",
    item: "Equipment removal register updated", detail: "Asset register updated — all removed items logged with serial numbers, condition, and responsible person",
    requiresPhoto: false, critical: true, techLogItem: false,
  },
  {
    id: "out_24", category: "Crew",
    item: "Operations Centre notified — ferry dispatched", detail: "Ops Centre informed of ferry departure, estimated arrival, and contact details",
    requiresPhoto: false, critical: true, techLogItem: false,
  },
];

const IN_CHECKLIST = [
  {
    id: "in_01", category: "Medical Equipment",
    item: "Patient stretcher reinstalled and secured", detail: "Stretcher fitted, locking pins engaged, tilt function tested",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_02", category: "Medical Equipment",
    item: "Oxygen system refitted — cylinders recharged", detail: "Full cylinders fitted, regulators connected, system pressure tested",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_03", category: "Medical Equipment",
    item: "Cardiac monitor / defibrillator refitted and tested", detail: "Power on, self-test complete, pads connected, comms linked",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_04", category: "Medical Equipment",
    item: "Suction unit refitted and functional test", detail: "Unit seated, tubing connected, suction tested at cabin pressure",
    requiresPhoto: false, critical: false,
  },
  {
    id: "in_05", category: "Medical Equipment",
    item: "IV poles reinstalled (×2 confirmed)", detail: "Both poles fitted and stow-locked — count confirmed",
    requiresPhoto: false, critical: false,
  },
  {
    id: "in_06", category: "Medical Equipment",
    item: "Drug safe returned and secured", detail: "Drug safe locked, seal intact, medications reconciled",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_07", category: "Cabin Configuration",
    item: "Cabin interior photograph — return-to-service state", detail: "Full 360° cabin photo showing all equipment reinstalled",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_08", category: "Aircraft Airworthiness",
    item: "Post-maintenance defects cleared", detail: "All work order items signed off — no outstanding defects",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_09", category: "Aircraft Airworthiness",
    item: "W&B recalculated — aeromedical config", detail: "W&B with full medical equipment confirms within limits",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_10", category: "Documentation",
    item: "Tech log entry — return to service", detail: "Maintenance work, equipment reinstallation, and MR reference noted",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_11", category: "Sign-off",
    item: "LAME maintenance release signed", detail: "LAME signs MR for aeromedical operations — valid for 90 days or next scheduled check",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_12", category: "Sign-off",
    item: "Pilot acceptance signed", detail: "Accepting pilot inspects, signs tech log — aircraft accepted for service",
    requiresPhoto: false, critical: true,
  },
  // ── Additional items from AVM851 v3.0 / RFDS SOPs ────────────────────────────
  {
    id: "in_13", category: "Medical Equipment",
    item: "Transport ventilator reinstalled and self-tested", detail: "Ventilator fitted, powered on, self-test passed — record O2 consumption rate",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_14", category: "Medical Equipment",
    item: "Infusion pumps reinstalled (×2) and tested", detail: "Both pumps fitted, battery tested, alarm functions verified — serial numbers reconciled",
    requiresPhoto: false, critical: false,
  },
  {
    id: "in_15", category: "Medical Equipment",
    item: "Patient restraint harness inspected and refitted", detail: "Harness condition checked — no fraying or buckle damage; lap belt engagement tested",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_16", category: "Medical Equipment",
    item: "Medical equipment asset serial numbers reconciled", detail: "Barcode / serial scan of each item against asset register — all items accounted for",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_17", category: "Medical Equipment",
    item: "Cabin O2 outlet ports pressure-tested", detail: "All O2 outlets pressure-tested post-reconnection — no leaks, flow rates confirmed",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_18", category: "Cabin Configuration",
    item: "Incubator / humidicrib reinstalled (NETS config)", detail: "Neonatal incubator reinstalled to STC attachment points — LAME to sign off",
    requiresPhoto: true, critical: true,
  },
  {
    id: "in_19", category: "Aircraft Airworthiness",
    item: "Cabin pressurisation check completed", detail: "Post-maintenance pressurisation check — seal integrity confirmed for B200 / B350 (critical)",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_20", category: "Aircraft Airworthiness",
    item: "Engine run / ground run completed (if engines worked on)", detail: "Ground run to operating temp, oil pressure and temps within limits, no abnormal vibration",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_21", category: "Aircraft Airworthiness",
    item: "Avionics and comms check — ADSB, SATCOM, EFIS", detail: "ADSB OUT confirmed transmitting, SATCOM tested, EFIS displays healthy — all comms functional",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_22", category: "Sign-off",
    item: "Operations Centre RTS sign-off", detail: "Ops Centre notified — aircraft accepted back into operational schedule",
    requiresPhoto: false, critical: true,
  },
  {
    id: "in_23", category: "Sign-off",
    item: "Flight Nurse / Clinical crew equipment sign-off", detail: "Medical crew accepts clinical equipment — all items functional, stocked, and secured",
    requiresPhoto: false, critical: true,
  },
];

const FERRY_MISSIONS = [
  {
    id: "FM-001",
    aircraft: "VH-XYR",
    type: "Maintenance Ferry OUT",
    route: "YBHI → YSDU",
    from: "Broken Hill",
    to: "Dubbo",
    pilot: "Capt. T. Barnes",
    date: "10 Jun 2026",
    reason: "Cabin door seal MEL + 6-monthly check",
    status: "upcoming",
    direction: "out",
  },
  {
    id: "FM-002",
    aircraft: "VH-XYR",
    type: "Return to Service",
    route: "YSDU → YBHI",
    from: "Dubbo",
    to: "Broken Hill",
    pilot: "Capt. T. Barnes",
    date: "est. 17 Jun 2026",
    reason: "Post 6-monthly check — return to Broken Hill base",
    status: "planned",
    direction: "in",
  },
];

const HISTORY = [
  { date: "3 Jun 2026", aircraft: "VH-XYU", type: "Maintenance Ferry OUT", route: "YSDU → YSDU", reason: "Annual inspection commenced", status: "Complete" },
  { date: "28 May 2026", aircraft: "VH-XYJ", type: "Operational Reposition", route: "YBHI → YSDU", reason: "Fleet balance — Dubbo shortage", status: "Complete" },
  { date: "15 May 2026", aircraft: "VH-XYU", type: "Medical Config Swap", route: "YSDU → YSDU", reason: "ICU config upgrade", status: "Complete" },
  { date: "2 May 2026", aircraft: "VH-XYR", type: "Maintenance Ferry — RTS", route: "YSDU → YBHI", reason: "Post 120 hr check return", status: "Complete" },
];

// Category order for grouping
const OUT_CATEGORIES = ["Medical Equipment", "Cabin Configuration", "Aircraft Airworthiness", "Documentation", "Crew"] as const;
const IN_CATEGORIES  = ["Medical Equipment", "Cabin Configuration", "Aircraft Airworthiness", "Documentation", "Sign-off"] as const;

export default function FerryFlights({ role }: Props) {
  const [activeMission, setActiveMission] = useState(FERRY_MISSIONS[0]);
  const [activeChecklist, setActiveChecklist] = useState<"out" | "in">("out");

  // OUT checklist state
  const [outChecked, setOutChecked] = useState<Record<string, boolean>>({});
  const [outPhotos,  setOutPhotos]  = useState<Record<string, boolean>>({});

  // IN checklist state
  const [inChecked,  setInChecked]  = useState<Record<string, boolean>>({});
  const [inPhotos,   setInPhotos]   = useState<Record<string, boolean>>({});

  // Capture modal state
  const [captureTarget, setCaptureTarget] = useState<{ id: string; isIn: boolean; label: string } | null>(null);
  const [captureMode, setCaptureMode] = useState<"choose" | "camera" | "barcode">("choose");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop all streams and timers on modal close
  const closeCapture = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); }
    setCaptureTarget(null);
    setCaptureMode("choose");
    setCameraStream(null);
    setCapturedImage(null);
    setBarcodeResult(null);
    setBarcodeScanning(false);
    setCameraError(null);
  }, [cameraStream]);

  // Open camera stream
  const openCamera = useCallback(async () => {
    setCaptureMode("camera");
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCameraStream(stream);
    } catch {
      setCameraError("Camera not available. Use the file picker below.");
    }
  }, []);

  // Attach stream to video element
  useEffect(() => {
    if (cameraStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = cameraStream;
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  // Snap photo from live stream
  function snapPhoto() {
    const video = videoPreviewRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.85));
    // Stop live stream once captured
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
  }

  // Accept captured photo / barcode and log it
  function acceptCapture() {
    if (!captureTarget) return;
    const { id, isIn } = captureTarget;
    if (isIn) setInPhotos(p => ({ ...p, [id]: true }));
    else setOutPhotos(p => ({ ...p, [id]: true }));
    closeCapture();
  }

  // Open barcode mode
  const openBarcode = useCallback(async () => {
    setCaptureMode("barcode");
    setBarcodeResult(null);
    setCameraError(null);
    setBarcodeScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCameraStream(stream);
    } catch {
      setCameraError("Camera not available for barcode scanning. Enter barcode manually below.");
      setBarcodeScanning(false);
    }
  }, []);

  // Barcode scan loop via BarcodeDetector or fallback
  useEffect(() => {
    if (captureMode !== "barcode" || !cameraStream || barcodeResult) return;
    const video = videoPreviewRef.current;
    if (!video) return;

    const BarcodeDetectorAPI = (window as any).BarcodeDetector;
    if (!BarcodeDetectorAPI) {
      // No native BarcodeDetector — just let user confirm the camera view
      setBarcodeScanning(false);
      return;
    }

    const detector = new BarcodeDetectorAPI({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "data_matrix", "pdf417"] });
    scanIntervalRef.current = setInterval(async () => {
      if (!video || video.readyState < 2) return;
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          setBarcodeResult(barcodes[0].rawValue);
          setBarcodeScanning(false);
          cameraStream.getTracks().forEach(t => t.stop());
          setCameraStream(null);
        }
      } catch { /* continue scanning */ }
    }, 300);

    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, [captureMode, cameraStream, barcodeResult]);

  // File picker fallback
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCapturedImage(ev.target?.result as string);
      setCaptureMode("camera"); // show image preview UI
    };
    reader.readAsDataURL(file);
  }

  function openCapture(id: string, isIn: boolean, label: string) {
    setCapturedImage(null);
    setBarcodeResult(null);
    setCameraError(null);
    setCaptureMode("choose");
    setCaptureTarget({ id, isIn, label });
  }

  function toggleOut(id: string) {
    setOutChecked(c => ({ ...c, [id]: !c[id] }));
  }
  function toggleIn(id: string) {
    setInChecked(c => ({ ...c, [id]: !c[id] }));
  }
  function resetOut() { setOutChecked({}); setOutPhotos({}); }
  function resetIn()  { setInChecked({});  setInPhotos({}); }

  const outItems    = OUT_CHECKLIST;
  const inItems     = IN_CHECKLIST;

  const outDone     = outItems.filter(i => outChecked[i.id] && (!i.requiresPhoto || outPhotos[i.id])).length;
  const outTotal    = outItems.length;
  const outCritical = outItems.filter(i => i.critical && (!outChecked[i.id] || (i.requiresPhoto && !outPhotos[i.id]))).length;
  const outBlocked  = outCritical > 0;

  const inDone     = inItems.filter(i => inChecked[i.id] && (!i.requiresPhoto || inPhotos[i.id])).length;
  const inTotal    = inItems.length;
  const inCritical = inItems.filter(i => i.critical && (!inChecked[i.id] || (i.requiresPhoto && !inPhotos[i.id]))).length;
  const inBlocked  = inCritical > 0;

  function downloadChecklist() {
    const list = activeChecklist === "out" ? outItems : inItems;
    const checked = activeChecklist === "out" ? outChecked : inChecked;
    const photos  = activeChecklist === "out" ? outPhotos  : inPhotos;
    const done    = activeChecklist === "out" ? outDone : inDone;
    const total   = activeChecklist === "out" ? outTotal : inTotal;

    generatePDF({
      title: `Ferry Checklist — ${activeChecklist.toUpperCase()} — ${activeMission.aircraft}`,
      subtitle: `${activeMission.route} · ${activeMission.reason}`,
      date: activeMission.date,
      reference: `${activeMission.id}-${activeChecklist.toUpperCase()}`,
      sections: [
        {
          heading: "Flight Details",
          rows: [
            { label: "Aircraft", value: activeMission.aircraft },
            { label: "Route", value: activeMission.route },
            { label: "Pilot", value: activeMission.pilot },
            { label: "Date", value: activeMission.date },
            { label: "Purpose", value: activeMission.reason },
            { label: "Checklist Completion", value: `${done} / ${total} items complete` },
          ],
        },
        {
          heading: `${activeChecklist.toUpperCase()} Checklist Items`,
          rows: list.map(i => ({
            label: `${i.critical ? "★ " : ""}${i.item}`,
            value: checked[i.id]
              ? (i.requiresPhoto ? (photos[i.id] ? "✓ Complete + Photo" : "✓ Checked — Photo pending") : "✓ Complete")
              : "☐ Not completed",
          })),
        },
      ],
    });
  }

  const checklist = activeChecklist === "out" ? outItems : inItems;
  const categories = activeChecklist === "out" ? OUT_CATEGORIES : IN_CATEGORIES;
  const checked = activeChecklist === "out" ? outChecked : inChecked;
  const photos  = activeChecklist === "out" ? outPhotos  : inPhotos;
  const done    = activeChecklist === "out" ? outDone : inDone;
  const total   = activeChecklist === "out" ? outTotal : inTotal;
  const blocked = activeChecklist === "out" ? outBlocked : inBlocked;
  const criticalRemaining = activeChecklist === "out" ? outCritical : inCritical;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Ferry Flights & Repositioning
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live interactive checklist · Medical equipment tracking · Photo evidence · RTS gate
          </p>
        </div>
        <button
          onClick={downloadChecklist}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold shrink-0"
        >
          <Download size={12} /> Export Checklist
        </button>
      </div>

      {/* Ferry mission selector */}
      <div className="flex gap-3 flex-wrap">
        {FERRY_MISSIONS.map(fm => (
          <button
            key={fm.id}
            onClick={() => setActiveMission(fm)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
              activeMission.id === fm.id
                ? "bg-cyan-400/10 border-cyan-400/40"
                : "bg-card border-card-border hover:border-cyan-400/30"
            }`}
          >
            <Plane size={14} className={fm.direction === "out" ? "text-amber-400" : "text-green-400"} />
            <div>
              <div className="text-xs font-bold">{fm.aircraft} — {fm.type}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{fm.route} · {fm.date}</div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2 ${
              fm.status === "upcoming" ? "status-orange" : "status-blue"
            }`}>{fm.status === "upcoming" ? "Upcoming" : "Planned"}</span>
          </button>
        ))}
      </div>

      {/* Active mission detail */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{activeMission.aircraft} — {activeMission.type}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{activeMission.reason}</div>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-cyan-400 font-bold">{activeMission.from}</span>
              <ArrowRight size={14} className="text-muted-foreground" />
              <span className="text-cyan-400 font-bold">{activeMission.to}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span><User size={11} className="inline mr-1" />{activeMission.pilot}</span>
            <span><Clock size={11} className="inline mr-1" />{activeMission.date}</span>
          </div>
        </div>
      </div>

      {/* AVM851 note */}
      <div className="flex items-start gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/20 text-xs text-yellow-300" style={{background:'rgba(234,179,8,0.05)'}}>
        <AlertCircle size={13} className="shrink-0 mt-0.5" />
        <span><strong>AVM851 v3.0</strong> — Items marked <span className="px-1 py-0.5 border border-yellow-400/30 rounded text-yellow-400 font-semibold" style={{background:'rgba(234,179,8,0.1)'}}>Tech Log</span> must be recorded in the Aircraft Tech Log if taken from the aircraft. Missing items must be sourced prior to departure — escalate to the Operations Centre if unable to source.</span>
      </div>

      {/* Checklist tab selector */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {(["out", "in"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveChecklist(tab)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                activeChecklist === tab
                  ? tab === "out"
                    ? "bg-amber-500/10 border-amber-400/40 text-amber-400"
                    : "bg-green-500/10 border-green-400/40 text-green-400"
                  : "bg-card border-card-border text-muted-foreground"
              }`}
            >
              {tab === "out"
                ? <><ArrowRight size={14} /><span>Ferry OUT</span>{outDone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded-full">{outDone}/{outTotal}</span>}</>
                : <><ArrowLeft size={14} /><span>Return to Service</span>{inDone > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 rounded-full">{inDone}/{inTotal}</span>}</>
              }
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={activeChecklist === "out" ? resetOut : resetIn}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-card-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={12} /> Reset demo
          </button>
        </div>
      </div>

      {/* Progress + dispatch block */}
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card" style={{ borderColor: blocked ? "rgb(239 68 68 / 0.3)" : done === total ? "rgb(34 197 94 / 0.3)" : "var(--card-border)" }}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">{activeChecklist === "out" ? "Ferry OUT (AVM851 v3.0)" : "Return to Service"} — {done} / {total} items complete</span>
            {blocked
              ? <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><Lock size={12} /> DEPARTURE BLOCKED — {criticalRemaining} critical item{criticalRemaining !== 1 ? "s" : ""} outstanding</span>
              : done === total
              ? <span className="flex items-center gap-1 text-xs text-green-400 font-semibold"><Unlock size={12} /> ALL CLEAR — {activeChecklist === "out" ? "Cleared for ferry departure" : "Return to service authorised"}</span>
              : <span className="text-xs text-muted-foreground">{criticalRemaining} critical remaining</span>
            }
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                done === total ? "bg-green-400" : blocked ? "bg-red-400" : "bg-cyan-400"
              }`}
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-6">
        {categories.map(cat => {
          const items = checklist.filter(i => i.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</div>
                <div className="flex-1 h-px bg-card-border" />
                <div className="text-[10px] text-muted-foreground">
                  {items.filter(i => checked[i.id] && (!i.requiresPhoto || photos[i.id])).length} / {items.length}
                </div>
              </div>
              <div className="space-y-2">
                {items.map(item => {
                  const isChecked = !!checked[item.id];
                  const hasPhoto  = !!photos[item.id];
                  const photoNeeded = item.requiresPhoto && !hasPhoto;
                  const isComplete  = isChecked && (!item.requiresPhoto || hasPhoto);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isComplete
                          ? "bg-green-500/5 border-green-500/30"
                          : isChecked && photoNeeded
                          ? "bg-amber-500/5 border-amber-500/30"
                          : item.critical
                          ? "bg-card border-red-400/10 hover:border-red-400/20"
                          : "bg-card border-card-border hover:border-cyan-400/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => activeChecklist === "out" ? toggleOut(item.id) : toggleIn(item.id)}
                          className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-green-500 border-green-500"
                              : "border-muted-foreground hover:border-cyan-400"
                          }`}
                        >
                          {isChecked && <CheckCircle size={12} className="text-white" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${isComplete ? "line-through text-muted-foreground" : ""}`}>
                              {item.item}
                            </span>
                            {item.critical && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 border border-red-400/30 text-red-400 rounded-full font-semibold">Critical</span>
                            )}
                            {(item as any).techLogItem && (
                              <span className="text-[9px] px-1.5 py-0.5 border border-yellow-400/30 text-yellow-400 rounded-full font-semibold" style={{background:'rgba(234,179,8,0.1)'}}>Tech Log</span>
                            )}
                            {item.requiresPhoto && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${
                                hasPhoto ? "bg-green-500/10 border-green-400/30 text-green-400" : "bg-cyan-500/10 border-cyan-400/30 text-cyan-400"
                              }`}>
                                <Camera size={8} className="inline mr-0.5" />{hasPhoto ? "Photo ✓" : "Photo required"}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</div>
                        </div>

                        {/* Photo / Barcode button */}
                        {item.requiresPhoto && !hasPhoto && (
                          <button
                            onClick={() => openCapture(item.id, activeChecklist === "in", item.item)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-cyan-500/10 border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold transition-all"
                          >
                            <Camera size={12} />
                            Capture
                          </button>
                        )}
                        {item.requiresPhoto && hasPhoto && (
                          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-400/30 bg-green-500/10 text-xs text-green-400">
                            <CheckCircle size={12} /> Evidence logged
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch / RTS gate */}
      <div className={`p-5 rounded-xl border-2 text-center transition-all ${
        blocked
          ? "border-red-400/40 bg-red-500/5"
          : done === total
          ? "border-green-400/40 bg-green-500/5"
          : "border-card-border"
      }`}>
        {done < total ? (
          <>
            <Lock size={24} className={`mx-auto mb-2 ${blocked ? "text-red-400" : "text-muted-foreground"}`} />
            <div className="text-sm font-bold mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {activeChecklist === "out" ? "Ferry Departure" : "Return to Service"} — BLOCKED
            </div>
            <div className="text-xs text-muted-foreground">
              {criticalRemaining} critical item{criticalRemaining !== 1 ? "s" : ""} must be completed before {activeChecklist === "out" ? "departure" : "aircraft is released"}.
            </div>
          </>
        ) : (
          <>
            <Unlock size={24} className="mx-auto mb-2 text-green-400" />
            <div className="text-sm font-bold text-green-400 mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {activeChecklist === "out" ? "ALL CLEAR — Ferry departure authorised" : "ALL CLEAR — Return to service authorised"}
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              All {total} checklist items complete. All critical items signed off. Photo evidence logged.
            </div>
            <button onClick={() => alert(`${activeChecklist === 'out' ? 'Ferry Departure AUTHORISED' : 'Maintenance Release SIGNED'}\n\nAircraft: ${activeMission.registration}\nMission: ${activeMission.callsign}\nTime: ${new Date().toLocaleTimeString('en-AU')}\n\nIn production this would record the sign-off in the tech log and notify Operations Centre.`)} className="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-green-500/30">
              {activeChecklist === "out" ? "Authorise Ferry Departure →" : "Sign Maintenance Release →"}
            </button>
          </>
        )}
      </div>

      {/* ── Capture Modal ── */}
      {captureTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
              <div className="min-w-0">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Evidence Capture</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{captureTarget.label}</div>
              </div>
              <button onClick={closeCapture} className="text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* MODE: Choose */}
            {captureMode === "choose" && (
              <div className="p-5 space-y-3">
                <p className="text-xs text-muted-foreground text-center mb-4">Select the type of evidence to capture for this item.</p>
                <button
                  onClick={openCamera}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Camera size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-400">Take Photo</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Capture a photo using device camera or upload an image</div>
                  </div>
                </button>
                <button
                  onClick={openBarcode}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Barcode size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-400">Scan Barcode</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Scan equipment barcode or QR code to log serial number</div>
                  </div>
                </button>
              </div>
            )}

            {/* MODE: Camera */}
            {captureMode === "camera" && (
              <div className="p-4 space-y-3">
                {cameraError && (
                  <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-amber-400">{cameraError}</div>
                )}
                {/* Live preview or captured image */}
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
                  {!capturedImage ? (
                    cameraStream ? (
                      <video ref={videoPreviewRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Image size={28} />
                        <span className="text-xs">No camera — use file picker</span>
                      </div>
                    )
                  ) : (
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                  )}
                  {cameraStream && !capturedImage && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/40 rounded-xl">
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br" />
                    </div>
                  )}
                  {capturedImage && (
                    <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> Captured
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  {!capturedImage ? (
                    <>
                      {cameraStream && (
                        <button onClick={snapPhoto}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors">
                          <Camera size={14} /> Snap Photo
                        </button>
                      )}
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-card-border bg-card hover:bg-white/5 text-xs font-semibold transition-colors">
                        <Image size={13} /> Choose File
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setCapturedImage(null); openCamera(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-card-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        <RotateCcw size={12} /> Retake
                      </button>
                      <button onClick={acceptCapture}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-white text-xs font-bold transition-colors">
                        <CheckCircle size={13} /> Accept &amp; Log
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => { setCaptureMode("choose"); cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors py-1">
                  ← Back to options
                </button>
              </div>
            )}

            {/* MODE: Barcode */}
            {captureMode === "barcode" && (
              <div className="p-4 space-y-3">
                {cameraError && (
                  <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-amber-400">{cameraError}</div>
                )}
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
                  {!barcodeResult ? (
                    cameraStream ? (
                      <video ref={videoPreviewRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Barcode size={28} />
                        <span className="text-xs">Camera unavailable</span>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-green-500/10">
                      <CheckCircle size={32} className="text-green-400" />
                      <div className="text-center px-4">
                        <div className="text-xs font-bold text-green-400 mb-1">Barcode Detected</div>
                        <div className="text-sm font-mono text-foreground break-all">{barcodeResult}</div>
                      </div>
                    </div>
                  )}
                  {/* Scan line animation */}
                  {barcodeScanning && cameraStream && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-x-8 top-1/2 h-0.5 bg-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ animation: "scanline 2s ease-in-out infinite" }} />
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400 rounded-tr" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-400 rounded-br" />
                    </div>
                  )}
                  {barcodeScanning && cameraStream && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-purple-300 text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <ScanLine size={10} className="animate-pulse" /> Scanning…
                    </div>
                  )}
                </div>

                {/* Manual barcode entry */}
                {!barcodeResult && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground text-center">Or enter barcode / serial number manually</div>
                    <div className="flex gap-2">
                      <input
                        id="manual-barcode"
                        type="text"
                        placeholder="e.g. SN-2024-X4829"
                        className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-400/50"
                        onKeyDown={e => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (v) { setBarcodeResult(v); setBarcodeScanning(false); cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); } } }}
                      />
                      <button
                        onClick={() => { const el = document.getElementById("manual-barcode") as HTMLInputElement; const v = el?.value.trim(); if (v) { setBarcodeResult(v); setBarcodeScanning(false); cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); } }}
                        className="px-3 py-2 bg-purple-500/20 border border-purple-400/30 rounded-lg text-xs text-purple-400 font-semibold hover:bg-purple-500/30 transition-colors">
                        Log
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {barcodeResult ? (
                    <>
                      <button onClick={() => { setBarcodeResult(null); setBarcodeScanning(true); openBarcode(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-card-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        <RotateCcw size={12} /> Rescan
                      </button>
                      <button onClick={acceptCapture}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-white text-xs font-bold transition-colors">
                        <CheckCircle size={13} /> Accept &amp; Log
                      </button>
                    </>
                  ) : (
                    <button onClick={closeCapture}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-card-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
                <button onClick={() => { setCaptureMode("choose"); cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setBarcodeScanning(false); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors py-1">
                  ← Back to options
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Repositioning history */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <History size={13} /> Ferry History — All Fleet
        </h2>
        <div className="bg-card rounded-xl border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aircraft</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Route</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-xs font-bold text-cyan-400">{r.aircraft}</td>
                  <td className="px-4 py-3 text-xs font-medium">{r.type}</td>
                  <td className="px-4 py-3 text-xs font-mono text-cyan-400">{r.route}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.reason}</td>
                  <td className="px-4 py-3 text-center"><span className="status-green text-xs px-2 py-0.5 rounded-full">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
