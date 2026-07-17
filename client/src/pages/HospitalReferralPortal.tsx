import { useState, type ReactNode } from "react";
import {
  ClipboardList, Send, CheckCircle2, ShieldCheck, Plane, Clock,
  UserRound, Stethoscope, ChevronRight, ChevronLeft, FileText,
} from "lucide-react";

const REFERRING_HOSPITALS = [
  "Dubbo Health Service", "Broken Hill Health", "Bourke District Hospital",
  "Walgett Hospital", "Wilcannia Health Service", "Cobar District Hospital",
  "Lightning Ridge District Hospital", "Moree District Hospital",
  "Narrabri District Hospital", "Coonamble District Hospital",
];

const DESTINATION_HOSPITALS = [
  "Royal Prince Alfred", "Westmead Hospital", "John Hunter Hospital",
  "Royal North Shore", "Liverpool Hospital", "Prince of Wales Hospital",
  "Sydney Children's Hospital",
];

const EQUIPMENT_OPTIONS = ["Ventilator", "Infusion pump", "Cardiac monitor", "Defibrillator", "Incubator", "CPAP"];

const MY_REQUESTS = [
  { ref: "MRQ-2026-4891", patient: "J. Pemberton", priority: "P2 Urgent", status: "En Route", submitted: "16 Jul 09:14", aircraft: "VH-MVW" },
  { ref: "MRQ-2026-4887", patient: "R. Okafor", priority: "P1 Immediate", status: "Completed", submitted: "16 Jul 02:33", aircraft: "VH-XYJ" },
  { ref: "MRQ-2026-4882", patient: "M. Singh", priority: "P3 Semi-urgent", status: "Scheduled", submitted: "15 Jul 16:45", aircraft: "TBC" },
  { ref: "MRQ-2026-4875", patient: "T. Williams", priority: "P1 Immediate", status: "Completed", submitted: "15 Jul 11:20", aircraft: "VH-MVX" },
  { ref: "MRQ-2026-4869", patient: "A. Nguyen", priority: "P2 Urgent", status: "Completed", submitted: "14 Jul 08:55", aircraft: "VH-MWK" },
];

const priorityBadge = (p: string) => {
  if (p.startsWith("P1")) return "bg-red-400/10 border border-red-400/30 text-red-400";
  if (p.startsWith("P2")) return "bg-amber-400/10 border border-amber-400/30 text-amber-400";
  return "bg-slate-400/10 border border-slate-400/30 text-slate-300";
};

const statusBadge = (s: string) => {
  if (s === "En Route") return "bg-cyan-400/10 border border-cyan-400/30 text-cyan-400";
  if (s === "Completed") return "bg-green-400/10 border border-green-400/30 text-green-400";
  return "bg-slate-400/10 border border-slate-400/30 text-slate-300";
};

interface PatientDetails {
  name: string; dob: string; mrn: string; gender: string; weight: string;
  priority: string; diagnosis: string; preExisting: string;
}
interface TransportDetails {
  referringHospital: string; referringDoctor: string; referringPhone: string;
  destination: string; transportType: string; equipment: string[];
  escort: string; departureWindow: string;
}

const initialPatient: PatientDetails = {
  name: "", dob: "", mrn: "", gender: "", weight: "", priority: "",
  diagnosis: "", preExisting: "",
};
const initialTransport: TransportDetails = {
  referringHospital: "", referringDoctor: "", referringPhone: "",
  destination: "", transportType: "", equipment: [], escort: "", departureWindow: "",
};

const inputCls = "w-full bg-background/40 border border-card-border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50";
const labelCls = "text-xs font-semibold text-muted-foreground mb-1 block";

export default function HospitalReferralPortal() {
  const [tab, setTab] = useState<"new" | "mine">("new");
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState<PatientDetails>(initialPatient);
  const [transport, setTransport] = useState<TransportDetails>(initialTransport);
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState("");

  const toggleEquipment = (item: string) => {
    setTransport(t => ({
      ...t,
      equipment: t.equipment.includes(item) ? t.equipment.filter(e => e !== item) : [...t.equipment, item],
    }));
  };

  const handleSubmit = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    setRefNumber(`MRQ-2026-${digits}`);
    setSubmitted(true);
  };

  const resetForm = () => {
    setPatient(initialPatient);
    setTransport(initialTransport);
    setSubmitted(false);
    setStep(1);
  };

  const steps = [
    { id: 1, label: "Patient Details", icon: UserRound },
    { id: 2, label: "Transport Details", icon: Plane },
    { id: 3, label: "Confirmation", icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Hospital Referral Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit a transport request directly into Medivac.ai dispatch — HL7 FHIR integrated
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-green-400/10 border border-green-400/30 rounded-lg text-xs font-semibold text-green-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> FHIR R4 Connected
          </div>
          <div className="px-3 py-1.5 bg-slate-400/10 border border-slate-400/30 rounded-lg text-xs font-semibold text-slate-300">
            Epic · Cerner · MedTech
          </div>
        </div>
      </div>

      {/* KPI Status bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>4</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active Requests</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>18 min</div>
          <div className="text-xs text-muted-foreground mt-0.5">Avg Response Time</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>11</div>
          <div className="text-xs text-muted-foreground mt-0.5">Missions Today</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {[
          { id: "new", label: "New Request" },
          { id: "mine", label: "My Requests" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "new" | "mine")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-slate-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* NEW REQUEST TAB */}
      {tab === "new" && (
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-6">
          {!submitted && (
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${step === s.id ? "bg-cyan-400/20 text-cyan-400" : step > s.id ? "text-green-400" : "text-muted-foreground"}`}><s.icon className="w-3.5 h-3.5" /> {s.label}</div>
                  {i < steps.length - 1 && <div className="flex-1 h-px bg-card-border" />}
                </div>
              ))}
            </div>
          )}

          {/* Step 1 */}
          {!submitted && step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Patient Name"><input className={inputCls} value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} placeholder="e.g. Jane Pemberton" /></Field>
                <Field label="Date of Birth"><input type="date" className={inputCls} value={patient.dob} onChange={e => setPatient({ ...patient, dob: e.target.value })} /></Field>
                <Field label="MRN / UR Number"><input className={inputCls} value={patient.mrn} onChange={e => setPatient({ ...patient, mrn: e.target.value })} placeholder="e.g. UR-004471" /></Field>
                <Field label="Gender">
                  <select className={inputCls} value={patient.gender} onChange={e => setPatient({ ...patient, gender: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Male</option><option>Female</option><option>Non-binary</option><option>Unknown</option>
                  </select>
                </Field>
                <Field label="Weight (kg)"><input type="number" className={inputCls} value={patient.weight} onChange={e => setPatient({ ...patient, weight: e.target.value })} placeholder="e.g. 72" /></Field>
                <Field label="Clinical Priority">
                  <select className={inputCls} value={patient.priority} onChange={e => setPatient({ ...patient, priority: e.target.value })}>
                    <option value="">Select...</option>
                    <option>P1 Immediate</option><option>P2 Urgent</option><option>P3 Semi-urgent</option>
                  </select>
                </Field>
              </div>
              <Field label="Primary Diagnosis / Presenting Condition"><textarea className={`${inputCls} min-h-[80px]`} value={patient.diagnosis} onChange={e => setPatient({ ...patient, diagnosis: e.target.value })} placeholder="Describe presenting condition..." /></Field>
              <Field label="Pre-existing Conditions (optional)"><textarea className={`${inputCls} min-h-[60px]`} value={patient.preExisting} onChange={e => setPatient({ ...patient, preExisting: e.target.value })} placeholder="Optional history..." /></Field>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                  Next: Transport Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {!submitted && step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Referring Hospital">
                  <select className={inputCls} value={transport.referringHospital} onChange={e => setTransport({ ...transport, referringHospital: e.target.value })}>
                    <option value="">Select...</option>
                    {REFERRING_HOSPITALS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Destination Hospital">
                  <select className={inputCls} value={transport.destination} onChange={e => setTransport({ ...transport, destination: e.target.value })}>
                    <option value="">Select...</option>
                    {DESTINATION_HOSPITALS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Referring Doctor Name"><input className={inputCls} value={transport.referringDoctor} onChange={e => setTransport({ ...transport, referringDoctor: e.target.value })} placeholder="Dr. ..." /></Field>
                <Field label="Referring Doctor Phone"><input className={inputCls} value={transport.referringPhone} onChange={e => setTransport({ ...transport, referringPhone: e.target.value })} placeholder="e.g. 02 6884 xxxx" /></Field>
                <Field label="Transport Type">
                  <select className={inputCls} value={transport.transportType} onChange={e => setTransport({ ...transport, transportType: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Aeromedical (IHT)</option><option>NEPT (Non-Emergency)</option><option>Urgent retrieval</option>
                  </select>
                </Field>
                <Field label="Escort Required">
                  <select className={inputCls} value={transport.escort} onChange={e => setTransport({ ...transport, escort: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Flight Nurse</option><option>Flight Doctor</option><option>Paramedic</option><option>None</option>
                  </select>
                </Field>
                <Field label="Requested Departure Window">
                  <select className={inputCls} value={transport.departureWindow} onChange={e => setTransport({ ...transport, departureWindow: e.target.value })}>
                    <option value="">Select...</option>
                    <option>ASAP</option><option>Within 2 hours</option><option>Within 4 hours</option><option>Scheduled</option>
                  </select>
                </Field>
              </div>
              <Field label="Equipment Required">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <label key={eq} className="flex items-center gap-2 text-sm text-slate-100 bg-background/40 border border-card-border rounded-lg px-3 py-2 cursor-pointer">
                      <input type="checkbox" checked={transport.equipment.includes(eq)} onChange={() => toggleEquipment(eq)} className="accent-cyan-500" />
                      {eq}
                    </label>
                  ))}
                </div>
              </Field>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="border border-card-border text-slate-100 hover:border-cyan-400/50 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(3)} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                  Next: Review & Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {!submitted && step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-slate-100 font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}><ClipboardList className="w-4 h-4 text-cyan-400" /> Review Request Summary</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-background/40 rounded-lg p-4 space-y-2">
                  <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5"><UserRound className="w-3.5 h-3.5" /> Patient Details</div>
                  <SummaryRow label="Name" value={patient.name} />
                  <SummaryRow label="DOB" value={patient.dob} />
                  <SummaryRow label="MRN / UR" value={patient.mrn} />
                  <SummaryRow label="Gender" value={patient.gender} />
                  <SummaryRow label="Weight" value={patient.weight ? `${patient.weight} kg` : ""} />
                  <SummaryRow label="Priority" value={patient.priority} />
                  <SummaryRow label="Diagnosis" value={patient.diagnosis} />
                  <SummaryRow label="Pre-existing" value={patient.preExisting} />
                </div>
                <div className="bg-background/40 rounded-lg p-4 space-y-2">
                  <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5"><Plane className="w-3.5 h-3.5" /> Transport Details</div>
                  <SummaryRow label="Referring Hospital" value={transport.referringHospital} />
                  <SummaryRow label="Referring Doctor" value={transport.referringDoctor} />
                  <SummaryRow label="Doctor Phone" value={transport.referringPhone} />
                  <SummaryRow label="Destination" value={transport.destination} />
                  <SummaryRow label="Transport Type" value={transport.transportType} />
                  <SummaryRow label="Equipment" value={transport.equipment.join(", ")} />
                  <SummaryRow label="Escort" value={transport.escort} />
                  <SummaryRow label="Departure Window" value={transport.departureWindow} />
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="border border-card-border text-slate-100 hover:border-cyan-400/50 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Submit Request
                </button>
              </div>
            </div>
          )}

          {/* Success state */}
          {submitted && (
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Request Submitted to Dispatch</div>
                <p className="text-sm text-muted-foreground mt-1">Your aeromedical transport request has been received.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md">
                <div className="bg-background/40 rounded-lg p-3"><div className="text-xs text-muted-foreground mb-1">Reference</div><div className="text-sm font-bold text-cyan-400">{refNumber}</div></div>
                <div className="bg-background/40 rounded-lg p-3"><div className="text-xs text-muted-foreground mb-1">Est. Response</div><div className="text-sm font-bold text-green-400 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> 18 minutes</div></div>
                <div className="bg-background/40 rounded-lg p-3"><div className="text-xs text-muted-foreground mb-1">Dispatcher</div><div className="text-sm font-bold text-slate-100">Ops Dubbo — M. Reeves</div></div>
              </div>
              <button onClick={resetForm} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold mt-2">
                Submit Another Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* MY REQUESTS TAB */}
      {tab === "mine" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-5 overflow-x-auto">
            <div className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <FileText className="w-4 h-4 text-cyan-400" /> Recent Referral Requests
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-card-border">
                  <th className="text-left py-2 pr-4">Ref</th>
                  <th className="text-left py-2 pr-4">Patient</th>
                  <th className="text-left py-2 pr-4">Priority</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Submitted</th>
                  <th className="text-left py-2 pr-4">Aircraft</th>
                </tr>
              </thead>
              <tbody>
                {MY_REQUESTS.map(r => (
                  <tr key={r.ref} className="border-b border-card-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-semibold text-cyan-400">{r.ref}</td>
                    <td className="py-2.5 pr-4 text-slate-100">{r.patient}</td>
                    <td className="py-2.5 pr-4"><span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${priorityBadge(r.priority)}`}>{r.priority}</span></td>
                    <td className="py-2.5 pr-4"><span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusBadge(r.status)}`}>{r.status}</span></td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{r.submitted}</td>
                    <td className="py-2.5 pr-4 text-slate-100">{r.aircraft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FHIR integration status */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <Stethoscope className="w-4 h-4 text-cyan-400" /> FHIR Integration Status
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: "Epic MyChart", status: "Connected" },
                { label: "Cerner PowerChart", status: "Connected" },
                { label: "MedTech Evolution", status: "Connected" },
                { label: "HL7 v2.7", status: "Active" },
                { label: "SMART on FHIR", status: "Active" },
              ].map(item => (
                <div key={item.label} className="bg-background/40 rounded-lg p-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-slate-100 text-right">{value || "—"}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (<div><label className={labelCls}>{label}</label>{children}</div>);
}
