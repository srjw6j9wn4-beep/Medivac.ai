import {
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  ArrowRight,
  Database,
  FileJson,
  UserCircle2,
  ShieldCheck,
  Network,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type StageStatus = "complete" | "in-progress" | "pending";

interface Stage {
  label: string;
  status: StageStatus;
  detail?: string;
}

const EPIC_STAGES: Stage[] = [
  { label: "Vendor Sandbox Access", status: "complete" },
  { label: "FHIR R4 Endpoint Validation", status: "complete" },
  { label: "App Orchard Application Submitted", status: "in-progress", detail: "Submitted 14 Jul 2026" },
  { label: "Epic Security Review", status: "pending" },
  { label: "User Acceptance Testing (UAT)", status: "pending" },
  { label: "Go-Live Approval", status: "pending" },
];

const CERNER_STAGES: Stage[] = [
  { label: "Cerner Code Developer Registration", status: "complete" },
  { label: "SMART on FHIR Auth Integration", status: "in-progress" },
  { label: "CDS Hooks Implementation", status: "pending" },
  { label: "Cerner Certification Testing", status: "pending" },
  { label: "Production Deployment", status: "pending" },
];

type SupportLevel = "full" | "partial" | "none";

interface FhirResourceRow {
  resource: string;
  medivac: SupportLevel;
  epic: SupportLevel;
  cerner: SupportLevel;
}

const FHIR_RESOURCES: FhirResourceRow[] = [
  { resource: "Patient", medivac: "full", epic: "full", cerner: "full" },
  { resource: "Encounter", medivac: "full", epic: "full", cerner: "partial" },
  { resource: "Observation (Vitals)", medivac: "full", epic: "full", cerner: "full" },
  { resource: "MedicationRequest", medivac: "partial", epic: "full", cerner: "partial" },
  { resource: "Condition", medivac: "full", epic: "full", cerner: "full" },
  { resource: "Procedure", medivac: "partial", epic: "partial", cerner: "partial" },
  { resource: "DiagnosticReport", medivac: "partial", epic: "full", cerner: "none" },
  { resource: "CarePlan", medivac: "none", epic: "partial", cerner: "none" },
];

function supportIcon(level: SupportLevel) {
  if (level === "full") return <span className="text-green-400 font-semibold">✓</span>;
  if (level === "partial") return <span className="text-amber-400 font-semibold">◑</span>;
  return <span className="text-red-400 font-semibold">✗</span>;
}

function StageStepper({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-col">
      {stages.map((s, i) => (
        <div key={s.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            {s.status === "complete" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
            {s.status === "in-progress" && <Clock className="w-5 h-5 text-amber-400" />}
            {s.status === "pending" && <Circle className="w-5 h-5 text-[#5A5957]" />}
            {i < stages.length - 1 && (
              <div
                className={`w-px flex-1 min-h-[24px] ${
                  s.status === "complete" ? "bg-green-400/40" : "bg-[#393836]"
                }`}
              />
            )}
          </div>
          <div className="pb-5">
            <p
              className={`text-sm font-medium ${
                s.status === "pending" ? "text-[#797876]" : "text-[#CDCCCA]"
              }`}
            >
              {s.label}
            </p>
            {s.detail && <p className="text-[#5A5957] text-xs mt-0.5">{s.detail}</p>}
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                s.status === "complete"
                  ? "bg-green-400/10 text-green-400 border-green-400/30"
                  : s.status === "in-progress"
                  ? "bg-amber-400/10 text-amber-400 border-amber-400/30"
                  : "bg-[#393836]/40 text-[#797876] border-[#393836]"
              }`}
            >
              {s.status === "complete" ? "Completed" : s.status === "in-progress" ? "In Progress" : "Pending"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EHRScoping() {
  return (
    <div className="p-6 min-h-screen bg-[#0f1117]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#CDCCCA]" style={HF}>
          EHR Integration — Scoping &amp; Certification
        </h1>
        <p className="text-[#797876] text-sm mt-1">Epic App Orchard · Oracle Cerner Code · HL7 FHIR R4</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-[#4F98A3]/10 text-[#4F98A3] border border-[#4F98A3]/30 rounded-lg px-3 py-1.5 font-semibold text-sm" style={HF}>
              Epic
            </span>
            <span className="text-[#797876] text-xs">App Orchard Certification Pathway</span>
          </div>
          <StageStepper stages={EPIC_STAGES} />
          <div className="mt-2 flex items-center gap-2 text-[#797876] text-xs bg-[#0f1117] border border-[#393836] rounded-lg p-3">
            <Clock className="w-4 h-4 text-[#4F98A3]" />
            Estimated timeline: 4–6 months from submission
          </div>
        </div>

        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-[#4F98A3]/10 text-[#4F98A3] border border-[#4F98A3]/30 rounded-lg px-3 py-1.5 font-semibold text-sm" style={HF}>
              Cerner
            </span>
            <span className="text-[#797876] text-xs">Oracle Cerner Code Pathway</span>
          </div>
          <StageStepper stages={CERNER_STAGES} />
          <div className="mt-2 flex items-center gap-2 text-[#797876] text-xs bg-[#0f1117] border border-[#393836] rounded-lg p-3">
            <Clock className="w-4 h-4 text-[#4F98A3]" />
            Estimated timeline: 5–7 months
          </div>
        </div>
      </div>

      <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 mb-8">
        <h2 className="text-[#CDCCCA] font-semibold text-base mb-4 flex items-center gap-2" style={HF}>
          <FileJson className="w-4 h-4 text-[#4F98A3]" />
          FHIR Resource Coverage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#797876] text-xs uppercase border-b border-[#393836]">
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Medivac.ai Support</th>
                <th className="px-4 py-3">Epic R4</th>
                <th className="px-4 py-3">Cerner R4</th>
              </tr>
            </thead>
            <tbody>
              {FHIR_RESOURCES.map((r) => (
                <tr key={r.resource} className="border-b border-[#393836] last:border-0">
                  <td className="px-4 py-3 text-[#CDCCCA]">{r.resource}</td>
                  <td className="px-4 py-3">{supportIcon(r.medivac)}</td>
                  <td className="px-4 py-3">{supportIcon(r.epic)}</td>
                  <td className="px-4 py-3">{supportIcon(r.cerner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-5 mt-3 text-xs text-[#797876]">
          <span className="flex items-center gap-1.5"><span className="text-green-400 font-semibold">✓</span> Full support</span>
          <span className="flex items-center gap-1.5"><span className="text-amber-400 font-semibold">◑</span> Partial support</span>
          <span className="flex items-center gap-1.5"><span className="text-red-400 font-semibold">✗</span> Not supported</span>
        </div>
      </div>

      <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 mb-8">
        <h2 className="text-[#CDCCCA] font-semibold text-base mb-5 flex items-center gap-2" style={HF}>
          <Network className="w-4 h-4 text-[#4F98A3]" />
          Integration Architecture
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto py-2">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="bg-[#0f1117] border border-[#393836] rounded-lg px-5 py-4 flex flex-col items-center gap-2 w-44">
              <Building2 className="w-6 h-6 text-[#4F98A3]" />
              <span className="text-[#CDCCCA] text-sm font-medium text-center">Hospital EHR</span>
              <span className="text-[#5A5957] text-[10px] text-center">Epic / Cerner</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 shrink-0">
            <ArrowRight className="w-6 h-6 text-[#4F98A3] hidden md:block" />
            <span className="text-[#797876] text-[10px] whitespace-nowrap">FHIR R4 API</span>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="bg-[#0f1117] border border-[#393836] rounded-lg px-5 py-4 flex flex-col items-center gap-2 w-44">
              <Database className="w-6 h-6 text-[#4F98A3]" />
              <span className="text-[#CDCCCA] text-sm font-medium text-center">Medivac.ai Referral Portal</span>
              <span className="text-[#5A5957] text-[10px] text-center">SMART on FHIR · OAuth2</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 shrink-0">
            <ArrowRight className="w-6 h-6 text-[#4F98A3] hidden md:block" />
            <span className="text-[#797876] text-[10px] whitespace-nowrap">Observation / Encounter Mapping</span>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="bg-[#0f1117] border border-[#393836] rounded-lg px-5 py-4 flex flex-col items-center gap-2 w-44">
              <ShieldCheck className="w-6 h-6 text-[#4F98A3]" />
              <span className="text-[#CDCCCA] text-sm font-medium text-center">Patient Care Record</span>
              <span className="text-[#5A5957] text-[10px] text-center">Medivac.ai Clinical Store</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
        <h2 className="text-[#CDCCCA] font-semibold text-base mb-4 flex items-center gap-2" style={HF}>
          <UserCircle2 className="w-4 h-4 text-[#4F98A3]" />
          Key Contacts
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { role: "Epic Integration Lead", contact: "TBA — pending App Orchard approval" },
            { role: "Cerner Code Partner", contact: "TBA" },
            { role: "Medivac.ai FHIR Dev", contact: "Internal Engineering" },
            { role: "FHIR Compliance Advisor", contact: "Engage before UAT" },
          ].map((c) => (
            <div key={c.role} className="bg-[#0f1117] border border-[#393836] rounded-lg p-4 flex flex-col gap-1">
              <span className="text-[#797876] text-xs">{c.role}</span>
              <span className="text-[#CDCCCA] text-sm font-medium">{c.contact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
