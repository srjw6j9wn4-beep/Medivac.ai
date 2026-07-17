import { useState } from "react";
import {
  HeartPulse,
  Plus,
  FileDown,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ClipboardCheck,
  User,
  Stethoscope,
  Pill,
  ListChecks,
  NotebookPen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VitalRow {
  time: string;
  spo2: string;
  hr: string;
  rr: string;
  bp: string;
  gcs: string;
  temp: string;
  pain: string;
}

interface MedRow {
  time: string;
  drug: string;
  dose: string;
  route: string;
  by: string;
  response: string;
}

interface Procedure {
  label: string;
  checked: boolean;
}

const initialVitals: VitalRow[] = [
  { time: "T+0", spo2: "94", hr: "88", rr: "18", bp: "138/86", gcs: "14", temp: "36.8", pain: "7" },
  { time: "T+20m", spo2: "96", hr: "82", rr: "16", bp: "132/80", gcs: "15", temp: "36.9", pain: "5" },
  { time: "T+40m", spo2: "97", hr: "78", rr: "15", bp: "128/78", gcs: "15", temp: "36.8", pain: "4" },
];

const initialMeds: MedRow[] = [
  { time: "09:15", drug: "Aspirin 300mg", dose: "300mg", route: "PO", by: "S. Mitchell RN", response: "Tolerated well" },
  { time: "09:22", drug: "Morphine", dose: "2.5mg", route: "IV", by: "Dr. K. Patel", response: "Pain reduced 7→5" },
];

const initialProcedures: Procedure[] = [
  { label: "IV access — 18G right antecubital", checked: true },
  { label: "12-lead ECG performed — copy faxed to receiving cardiology team", checked: true },
  { label: "Defibrillation", checked: false },
  { label: "Intubation / RSI", checked: false },
  { label: "Chest decompression", checked: false },
  { label: "Urinary catheter", checked: false },
  { label: "Nasogastric tube", checked: false },
  { label: "Continuous SpO2/ECG monitoring", checked: true },
  { label: "CPAP/BiPAP", checked: false },
];

const defaultHandover =
  "65-year-old male presenting with acute anterior STEMI. Post-primary PCI at Dubbo Health Service. Transferred to RPA Cardiology ICU for ongoing management. Stable in transit. Vitals improving — SpO2 97%, HR 78, BP 128/78. GCS 15 throughout. Pain well controlled (4/10). Aspirin and morphine administered en route. No adverse events during transfer.";

function trendArrow(curr: number, prev: number, higherIsBetter: boolean) {
  if (curr === prev) {
    return { icon: ArrowRight, color: "text-amber-400" };
  }
  const improving = higherIsBetter ? curr > prev : curr < prev;
  return improving
    ? { icon: ArrowUp, color: "text-green-400" }
    : { icon: ArrowDown, color: "text-red-400" };
}

function Trend({ curr, prev, higherIsBetter }: { curr: string; prev?: string; higherIsBetter: boolean }) {
  const c = parseFloat(curr);
  const p = prev !== undefined ? parseFloat(prev) : NaN;
  if (Number.isNaN(c) || Number.isNaN(p)) return null;
  const { icon: Icon, color } = trendArrow(c, p, higherIsBetter);
  return <Icon className={`inline-block w-3.5 h-3.5 ml-1 ${color}`} />;
}

export default function PatientCareRecord() {
  const { toast } = useToast();
  const [vitals, setVitals] = useState<VitalRow[]>(initialVitals);
  const [meds, setMeds] = useState<MedRow[]>(initialMeds);
  const [procedures, setProcedures] = useState<Procedure[]>(initialProcedures);
  const [handover, setHandover] = useState<string>(defaultHandover);
  const [finalised, setFinalised] = useState(false);

  const addVitalRow = () => {
    setVitals((rows) => [
      ...rows,
      { time: `T+${rows.length * 20}m`, spo2: "", hr: "", rr: "", bp: "", gcs: "", temp: "", pain: "" },
    ]);
  };

  const updateVital = (idx: number, field: keyof VitalRow, value: string) => {
    setVitals((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addMedRow = () => {
    setMeds((rows) => [...rows, { time: "", drug: "", dose: "", route: "", by: "", response: "" }]);
  };

  const updateMed = (idx: number, field: keyof MedRow, value: string) => {
    setMeds((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const toggleProcedure = (idx: number) => {
    setProcedures((rows) => rows.map((r, i) => (i === idx ? { ...r, checked: !r.checked } : r)));
  };

  const handleGeneratePDF = () => {
    toast({
      title: "PDF Handover generated",
      description: "Ready to print / transmit to receiving team",
      className: "bg-green-500/10 border-green-500/40 text-green-300",
    });
  };

  const handleFinalise = () => {
    setFinalised(true);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/30">
            <HeartPulse className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>In-Flight Patient Care Record</h1>
            <p className="text-sm text-muted-foreground">Clinical documentation · Auto-populated from dispatch · PDF handover export</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-card border border-card-border rounded-xl px-4 py-3 text-sm flex-wrap">
          <span className="text-muted-foreground">Active Mission:</span>
          <span className="text-cyan-400 font-semibold">MRQ-2026-4891</span>
          <span className="text-muted-foreground">—</span>
          <span className="font-semibold">J. Pemberton</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/30">
            P2 Urgent
          </span>
          <span className="text-muted-foreground">Dubbo → RPA</span>
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/30">
            VH-MVW
          </span>
        </div>
      </div>

      {/* Section 1: Patient Summary */}
      <section className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Patient Summary
          </h2>
          <span className="text-xs text-muted-foreground">(pre-populated from dispatch — read-only)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Name: </span><span className="font-medium">J. Pemberton</span><span className="text-muted-foreground"> | DOB: </span><span className="font-medium">14/03/1961 (65y)</span><span className="text-muted-foreground"> | MRN: </span><span className="font-medium">4471882</span></div>
          <div><span className="text-muted-foreground">Weight: </span><span className="font-medium">82 kg</span><span className="text-muted-foreground"> | Allergies: </span><span className="font-medium text-pink-400">Penicillin</span></div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Diagnosis: </span><span className="font-medium">Acute STEMI — post-cath requiring cardiology ICU admission</span></div>
          <div><span className="text-muted-foreground">Referring Doctor: </span><span className="font-medium">Dr. A. Singh — Dubbo Health Service</span></div>
          <div><span className="text-muted-foreground">Receiving: </span><span className="font-medium">Cardiology ICU, Royal Prince Alfred Hospital</span></div>
        </div>
      </section>

      {/* Section 2: Vital Signs Trending */}
      <section className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Vital Signs Trending
            </h2>
          </div>
          <button
            onClick={addVitalRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Observation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-card-border">
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">SpO2 %</th>
                <th className="py-2 pr-3 font-medium">HR bpm</th>
                <th className="py-2 pr-3 font-medium">RR /min</th>
                <th className="py-2 pr-3 font-medium">BP sys/dia</th>
                <th className="py-2 pr-3 font-medium">GCS</th>
                <th className="py-2 pr-3 font-medium">Temp °C</th>
                <th className="py-2 pr-3 font-medium">Pain /10</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map((row, idx) => {
                const prev = idx > 0 ? vitals[idx - 1] : undefined;
                const isLast = idx === vitals.length - 1;
                const editable = row.time === "" || idx >= initialVitals.length;
                return (
                  <tr key={idx} className="border-b border-card-border/50">
                    <td className="py-2 pr-3">
                      {editable ? (
                        <input
                          value={row.time}
                          onChange={(e) => updateVital(idx, "time", e.target.value)}
                          placeholder="T+..."
                          className="w-20 bg-[#0f1117] border border-card-border rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="font-medium">{row.time}</span>
                      )}
                    </td>
                    {(["spo2", "hr", "rr", "bp", "gcs", "temp", "pain"] as const).map((field) => {
                      const higherIsBetter = field === "spo2" || field === "gcs";
                      const lowerIsBetter = field === "hr" || field === "rr" || field === "pain";
                      const showTrend = isLast && prev && (higherIsBetter || lowerIsBetter);
                      return (
                        <td key={field} className="py-2 pr-3">
                          {editable ? (
                            <input
                              value={row[field]}
                              onChange={(e) => updateVital(idx, field, e.target.value)}
                              className="w-16 bg-[#0f1117] border border-card-border rounded px-2 py-1 text-xs"
                            />
                          ) : (
                            <span>
                              {row[field]}
                              {showTrend && (
                                <Trend curr={row[field]} prev={prev?.[field]} higherIsBetter={higherIsBetter} />
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Medications Administered */}
      <section className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-pink-400" />
            <h2 className="text-base font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Medications Administered
            </h2>
          </div>
          <button
            onClick={addMedRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medication
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-card-border">
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Drug</th>
                <th className="py-2 pr-3 font-medium">Dose</th>
                <th className="py-2 pr-3 font-medium">Route</th>
                <th className="py-2 pr-3 font-medium">Administered by</th>
                <th className="py-2 pr-3 font-medium">Response</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((row, idx) => {
                const editable = idx >= initialMeds.length;
                return (
                  <tr key={idx} className="border-b border-card-border/50">
                    {(["time", "drug", "dose", "route", "by", "response"] as const).map((field) => (
                      <td key={field} className="py-2 pr-3">
                        {editable ? (
                          <input
                            value={row[field]}
                            onChange={(e) => updateMed(idx, field, e.target.value)}
                            className="w-full min-w-[80px] bg-[#0f1117] border border-card-border rounded px-2 py-1 text-xs"
                          />
                        ) : (
                          <span>{row[field]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Procedures Performed */}
      <section className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Procedures Performed
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {procedures.map((proc, idx) => (
            <label
              key={idx}
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg border border-card-border/60 hover:border-cyan-500/30 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={proc.checked}
                onChange={() => toggleProcedure(idx)}
                className="w-4 h-4 rounded accent-cyan-500"
              />
              <span className={proc.checked ? "text-foreground" : "text-muted-foreground"}>{proc.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Section 5: Clinical Handover Summary */}
      <section className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-pink-400" />
          <h2 className="text-base font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Clinical Handover Summary
          </h2>
        </div>
        <textarea
          value={handover}
          onChange={(e) => setHandover(e.target.value)}
          rows={6}
          className="w-full bg-[#0f1117] border border-card-border rounded-lg px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-cyan-500/40 resize-y"
        />
      </section>

      {/* Section 6: Export row */}
      <section className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGeneratePDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl transition-colors text-sm"
        >
          <FileDown className="w-4 h-4" /> Generate PDF Handover
        </button>

        {finalised ? (
          <span className="flex items-center gap-2 px-5 py-2.5 bg-green-500/15 border border-green-500/40 text-green-400 font-semibold rounded-xl text-sm">
            <CheckCircle2 className="w-4 h-4" /> Record Finalised
          </span>
        ) : (
          <button
            onClick={handleFinalise}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-400 font-semibold rounded-xl transition-colors text-sm"
          >
            <ClipboardCheck className="w-4 h-4" /> Mark Record Complete
          </button>
        )}
      </section>
    </div>
  );
}
