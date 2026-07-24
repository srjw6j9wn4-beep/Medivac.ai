import { useState, useMemo } from "react";
import {
  UserPlus, ExternalLink, Plane, Stethoscope, HeartPulse, Wrench, Radio, Star,
  ArrowLeft, ArrowRight, Check, X, ShieldAlert, CheckCircle2, Upload, FileText,
  Loader2, ChevronDown, ChevronUp, MapPin, Clock, ClipboardList, Search, Eye,
} from "lucide-react";
import { ROLES, APPRENTICE, getRole, mandatoryCount, type Role } from "@/lib/recruitRoles";

// ── constants ──────────────────────────────────────────────────────────────────
const CAREERS_API = "https://medivac-careers.pplx.app";

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pilot: Plane,
  flight_nurse: HeartPulse,
  flight_doctor: Stethoscope,
  lame: Wrench,
  operations: Radio,
};

// ── tiny helpers ───────────────────────────────────────────────────────────────
function Chip({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-white mb-3">{children}</h2>;
}

// ── Step indicator ─────────────────────────────────────────────────────────────
type Step = "list" | "overview" | "checklist" | "blocked" | "form" | "done";
const STEP_LABELS: Partial<Record<Step, string>> = {
  overview: "Role", checklist: "Eligibility", form: "Application", done: "Confirmed",
};
const STEP_ORDER: Step[] = ["overview", "checklist", "form", "done"];

function StepDots({ step }: { step: Step }) {
  if (step === "list" || step === "blocked") return null;
  const idx = STEP_ORDER.indexOf(step);
  const labels = ["Role", "Eligibility", "Application", "Confirmed"];
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1.5">
          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
            i < idx ? "bg-primary text-primary-foreground" :
            i === idx ? "bg-primary/20 text-primary ring-1 ring-primary" :
            "bg-sidebar-accent text-muted-foreground"
          }`}>
            {i < idx ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          <span className={`hidden sm:inline text-[11px] ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
          {i < labels.length - 1 && <span className="hidden sm:inline w-4 h-px bg-sidebar-border" />}
        </div>
      ))}
    </div>
  );
}

// ── Role List ──────────────────────────────────────────────────────────────────
function RoleList({ onSelect }: { onSelect: (roleId: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Open Roles</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Each role starts with a mandatory eligibility check — select a role to begin</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map(role => {
          const Icon = ROLE_ICONS[role.id] || Plane;
          const mc = mandatoryCount(role);
          return (
            <button key={role.id} onClick={() => onSelect(role.id)}
              className="text-left rounded-xl border border-sidebar-border bg-sidebar hover:bg-sidebar-accent/50 p-5 transition-all group flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors mt-1" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">{role.category}</p>
                <h3 className="text-sm font-bold text-white mt-0.5">{role.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{role.tagline}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-2 border-t border-sidebar-border">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{role.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{role.employmentType}</span>
                <span className="ml-auto font-semibold text-white">{mc} mandatory checks</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Apprentice banner */}
      <button onClick={() => onSelect("apprentice")}
        className="w-full text-left rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 p-5 transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            <Chip label="Apprentice Program" cls="text-amber-300 bg-amber-500/10 border-amber-500/20" />
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <h3 className="text-sm font-bold text-amber-300">Start Here. Go Anywhere.</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          15–25 years old? From regional Australia? No experience needed — just the drive to learn.
          Aviation trades & operations pathway with full mentorship from our engineering and ops team.
        </p>
      </button>

      {/* Status check */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar/50 p-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Already applied? Check your application status</div>
        <a href={`${CAREERS_API}/#/status`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
          <Search className="h-3.5 w-3.5" /> Check status
        </a>
      </div>
    </div>
  );
}

// ── Role Overview ──────────────────────────────────────────────────────────────
function RoleOverview({ role, onStart }: { role: Role; onStart: () => void }) {
  const mandatory = role.requirements.filter(r => r.mandatory);
  const desirable = role.requirements.filter(r => !r.mandatory);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">{role.category}</p>
        <h2 className="text-lg font-extrabold text-white mt-0.5">{role.name}</h2>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{role.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{role.employmentType}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{role.overview}</p>
      </div>

      <div className="rounded-xl border border-sidebar-border bg-sidebar p-4 space-y-3">
        <div className="text-xs font-bold text-white">Mandatory Requirements ({mandatory.length})</div>
        <p className="text-[11px] text-muted-foreground">You must meet every one of these to proceed</p>
        <div className="space-y-1.5">
          {mandatory.map(r => (
            <div key={r.key} className="flex items-start gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground/80">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {desirable.length > 0 && (
        <div className="rounded-xl border border-sidebar-border bg-sidebar/50 p-4 space-y-2">
          <div className="text-xs font-bold text-muted-foreground">Desirable</div>
          <div className="space-y-1.5">
            {desirable.map(r => (
              <div key={r.key} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary/60 mt-0.5">+</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onStart}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 py-3 text-sm font-bold text-white transition-colors">
        <ClipboardList className="h-4 w-4" /> Start Eligibility Check
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Eligibility Checklist ──────────────────────────────────────────────────────
function EligibilityChecklist({
  role, responses, setResponses, onProceed, onBlocked,
}: {
  role: Role;
  responses: Record<string, boolean>;
  setResponses: (r: Record<string, boolean>) => void;
  onProceed: () => void;
  onBlocked: () => void;
}) {
  const mandatory = role.requirements.filter(r => r.mandatory);
  const desirable = role.requirements.filter(r => !r.mandatory);
  const answeredAll = mandatory.every(r => r.key in responses);
  const set = (key: string, val: boolean) => setResponses({ ...responses, [key]: val });

  const submit = () => {
    const allMet = mandatory.every(r => responses[r.key] === true);
    if (allMet) onProceed(); else onBlocked();
  };

  const Row = ({ label, keyName, isMandatory }: { label: string; keyName: string; isMandatory: boolean }) => {
    const val = responses[keyName];
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar p-3">
        <div className="flex items-start gap-2 text-xs">
          <span className="text-foreground/90 leading-relaxed">{label}</span>
          {isMandatory && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">Required</span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button type="button" onClick={() => set(keyName, true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
              val === true ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "border-sidebar-border text-muted-foreground hover:text-white"
            }`}>
            <Check className="h-3 w-3" /> Yes
          </button>
          <button type="button" onClick={() => set(keyName, false)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
              val === false ? "border-red-500/50 bg-red-500/15 text-red-300" : "border-sidebar-border text-muted-foreground hover:text-white"
            }`}>
            <X className="h-3 w-3" /> No
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-white">Eligibility Checklist — {role.name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Answer honestly. You must answer <strong className="text-white">Yes</strong> to every mandatory item to proceed.</p>
      </div>

      <div className="space-y-2">
        {mandatory.map(r => <Row key={r.key} label={r.label} keyName={r.key} isMandatory />)}
      </div>

      {desirable.length > 0 && (
        <>
          <div className="text-xs font-bold text-muted-foreground pt-2">Desirable — optional, helps your assessment</div>
          <div className="space-y-2">
            {desirable.map(r => <Row key={r.key} label={r.label} keyName={r.key} isMandatory={false} />)}
          </div>
        </>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={submit} disabled={!answeredAll}
          className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-bold text-white transition-colors">
          {answeredAll ? "Check my eligibility" : "Answer all mandatory items"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Blocked ────────────────────────────────────────────────────────────────────
function Blocked({ role, responses, onRetry, onBack }: { role: Role; responses: Record<string, boolean>; onRetry: () => void; onBack: () => void }) {
  const failed = role.requirements.filter(r => r.mandatory && responses[r.key] !== true);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/20">
        <ShieldAlert className="h-6 w-6 text-red-400" />
      </div>
      <div>
        <h2 className="text-base font-extrabold text-white">Not eligible yet</h2>
        <p className="text-xs text-muted-foreground mt-1">You do not currently meet the minimum requirements for <strong className="text-white">{role.name}</strong>. Re-apply when you meet all criteria.</p>
      </div>
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
        <p className="text-xs font-bold text-red-300">Requirements not yet met:</p>
        {failed.map(r => (
          <div key={r.key} className="flex items-start gap-2 text-xs text-foreground/80">
            <X className="h-3.5 w-3.5 text-red-300 flex-shrink-0 mt-0.5" />
            {r.label}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onRetry} className="flex items-center gap-2 rounded-lg border border-sidebar-border px-4 py-2 text-xs font-semibold text-white hover:bg-sidebar-accent transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Review answers
        </button>
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg border border-sidebar-border px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors">
          Back to roles
        </button>
      </div>
    </div>
  );
}

// ── Application Form ───────────────────────────────────────────────────────────
interface FormState {
  firstName: string; lastName: string; email: string; phone: string;
  location: string; workRights: string; availableFrom: string;
  experienceSummary: string; registrationNumbers: Record<string, string>;
  cvFilename: string | null; cvData: string | null;
}
const emptyForm: FormState = {
  firstName: "", lastName: "", email: "", phone: "", location: "",
  workRights: "", availableFrom: "", experienceSummary: "",
  registrationNumbers: {}, cvFilename: null, cvData: null,
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground";

function ApplicationForm({ role, responses, onSubmitted }: { role: Role; responses: Record<string, boolean>; onSubmitted: (id: number) => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upd = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError("CV must be under 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => upd({ cvFilename: file.name, cvData: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError(null);
    const required: [keyof FormState, string][] = [
      ["firstName","First name"],["lastName","Last name"],["email","Email"],
      ["phone","Phone"],["location","Location"],["workRights","Work rights"],
      ["availableFrom","Available from"],["experienceSummary","Experience summary"],
    ];
    for (const [k, label] of required) {
      if (!String(form[k] || "").trim()) { setError(`${label} is required`); return; }
    }
    if (!form.cvData) { setError("Please upload your CV"); return; }

    const mandatory = role.requirements.filter(r => r.mandatory);
    const checklistScore = mandatory.filter(r => responses[r.key] === true).length;

    const payload = {
      roleId: role.id, roleName: role.name,
      firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      email: form.email.trim(), phone: form.phone.trim(),
      location: form.location.trim(), workRights: form.workRights.trim(),
      availableFrom: form.availableFrom.trim(),
      checklistResponses: JSON.stringify(responses),
      checklistScore, totalRequirements: mandatory.length,
      experienceSummary: form.experienceSummary.trim(),
      registrationNumbers: JSON.stringify(form.registrationNumbers),
      cvFilename: form.cvFilename, cvData: form.cvData,
      isApprentice: false, age: null, referralSource: null,
      interestAreas: null, currentActivity: null, guardianContact: null, recruiterNotes: null,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${CAREERS_API}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const created = await res.json();
      onSubmitted(created.id);
    } catch (e: any) {
      setError("Submission failed. Please try again or use the portal directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-white">Application — {role.name}</h2>
        <p className="text-xs text-emerald-300 flex items-center gap-1.5 mt-0.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Eligibility confirmed. Complete your details below.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 flex items-center gap-2">
          <X className="h-3.5 w-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Personal details */}
      <section className="space-y-3">
        <SectionHeading>Personal details</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="First name *"><input className={inputCls} value={form.firstName} onChange={e => upd({ firstName: e.target.value })} /></FieldRow>
          <FieldRow label="Last name *"><input className={inputCls} value={form.lastName} onChange={e => upd({ lastName: e.target.value })} /></FieldRow>
          <FieldRow label="Email *"><input type="email" className={inputCls} value={form.email} onChange={e => upd({ email: e.target.value })} /></FieldRow>
          <FieldRow label="Phone *"><input className={inputCls} value={form.phone} onChange={e => upd({ phone: e.target.value })} /></FieldRow>
          <FieldRow label="Where are you based? *"><input className={inputCls} placeholder="Town / city, state" value={form.location} onChange={e => upd({ location: e.target.value })} /></FieldRow>
          <FieldRow label="Work rights *"><input className={inputCls} placeholder="Citizen / PR / visa type" value={form.workRights} onChange={e => upd({ workRights: e.target.value })} /></FieldRow>
        </div>
      </section>

      {/* Professional registrations */}
      {role.registrationFields.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Professional registrations</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {role.registrationFields.map(rf => (
              <FieldRow key={rf.key} label={rf.label}>
                <input className={inputCls} placeholder={rf.placeholder}
                  value={form.registrationNumbers[rf.key] || ""}
                  onChange={e => upd({ registrationNumbers: { ...form.registrationNumbers, [rf.key]: e.target.value } })} />
              </FieldRow>
            ))}
          </div>
        </section>
      )}

      {/* Availability & experience */}
      <section className="space-y-3">
        <SectionHeading>Availability & experience</SectionHeading>
        <FieldRow label="Available from *">
          <input type="date" className={inputCls} value={form.availableFrom} onChange={e => upd({ availableFrom: e.target.value })} />
        </FieldRow>
        <FieldRow label="Experience summary *">
          <textarea className={`${inputCls} resize-none`} rows={6}
            placeholder="Summarise your relevant experience, hours, endorsements, and roles. Be specific — this feeds our AI screening."
            value={form.experienceSummary} onChange={e => upd({ experienceSummary: e.target.value })} />
          <p className="text-[11px] text-muted-foreground">
            {form.experienceSummary.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </FieldRow>
      </section>

      {/* CV Upload */}
      <section className="space-y-2">
        <SectionHeading>CV / Resume *</SectionHeading>
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sidebar-border bg-sidebar/50 hover:bg-sidebar-accent/30 px-6 py-8 text-center cursor-pointer transition-colors">
          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFile(e.target.files?.[0])} />
          {form.cvFilename ? (
            <>
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm text-white">{form.cvFilename}</span>
              <span className="text-xs text-muted-foreground">Click to replace</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-white">Upload your CV</span>
              <span className="text-xs text-muted-foreground">PDF or Word · up to 8 MB</span>
            </>
          )}
        </label>
      </section>

      <div className="flex justify-end pt-2">
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 px-6 py-2.5 text-sm font-bold text-white transition-colors">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Application
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Apprentice Form ────────────────────────────────────────────────────────────
function ApprenticeForm({ onSubmitted }: { onSubmitted: (id: number) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", location: "", age: "", referralSource: "", currentActivity: "", guardianContact: "", interestAreas: "", statement: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.firstName || !form.lastName || !form.email || !form.statement.trim()) {
      setError("Please fill in all required fields including your personal statement"); return;
    }

    const softCriteria = APPRENTICE.criteria.reduce((acc, c) => ({ ...acc, [c.key]: true }), {});
    const payload = {
      roleId: "apprentice", roleName: APPRENTICE.name,
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, phone: form.phone || "Not provided",
      location: form.location || "Not provided", workRights: "To be confirmed",
      availableFrom: "Flexible", checklistResponses: JSON.stringify(softCriteria),
      checklistScore: APPRENTICE.criteria.length, totalRequirements: APPRENTICE.criteria.length,
      experienceSummary: form.statement,
      registrationNumbers: "{}", cvFilename: null, cvData: null,
      isApprentice: true,
      age: form.age ? parseInt(form.age) : null,
      referralSource: form.referralSource || null,
      interestAreas: form.interestAreas ? JSON.stringify(form.interestAreas.split(",").map(s => s.trim())) : null,
      currentActivity: form.currentActivity || null,
      guardianContact: form.guardianContact || null,
      recruiterNotes: null,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${CAREERS_API}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const created = await res.json();
      onSubmitted(created.id);
    } catch {
      setError("Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Star className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold text-amber-300">Apprentice Program Application</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">No CV needed. Tell us about yourself. The Mentorship Coordinator will read every application personally.</p>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="First name *"><input className={inputCls} value={form.firstName} onChange={e => upd("firstName", e.target.value)} /></FieldRow>
        <FieldRow label="Last name *"><input className={inputCls} value={form.lastName} onChange={e => upd("lastName", e.target.value)} /></FieldRow>
        <FieldRow label="Email *"><input type="email" className={inputCls} value={form.email} onChange={e => upd("email", e.target.value)} /></FieldRow>
        <FieldRow label="Phone"><input className={inputCls} value={form.phone} onChange={e => upd("phone", e.target.value)} /></FieldRow>
        <FieldRow label="Where do you live?"><input className={inputCls} placeholder="Town / region" value={form.location} onChange={e => upd("location", e.target.value)} /></FieldRow>
        <FieldRow label="Your age"><input type="number" min={15} max={25} className={inputCls} placeholder="15–25" value={form.age} onChange={e => upd("age", e.target.value)} /></FieldRow>
        <FieldRow label="What are you doing now?"><input className={inputCls} placeholder="School / TAFE / working / looking" value={form.currentActivity} onChange={e => upd("currentActivity", e.target.value)} /></FieldRow>
        <FieldRow label="What interests you about aviation?"><input className={inputCls} placeholder="e.g. Aircraft maintenance, operations, flying" value={form.interestAreas} onChange={e => upd("interestAreas", e.target.value)} /></FieldRow>
        <FieldRow label="How did you hear about us?"><input className={inputCls} value={form.referralSource} onChange={e => upd("referralSource", e.target.value)} /></FieldRow>
        <FieldRow label="Parent/guardian contact (if under 18)"><input className={inputCls} placeholder="Name and phone" value={form.guardianContact} onChange={e => upd("guardianContact", e.target.value)} /></FieldRow>
      </div>

      <FieldRow label="Tell us about yourself *">
        <textarea className={`${inputCls} resize-none`} rows={8}
          placeholder="Why do you want to work in aviation? Where did you grow up? What drives you? There are no wrong answers — just be honest."
          value={form.statement} onChange={e => upd("statement", e.target.value)} />
        <p className="text-[11px] text-muted-foreground">{form.statement.trim().split(/\s+/).filter(Boolean).length} words</p>
      </FieldRow>

      <div className="flex justify-end">
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 px-6 py-2.5 text-sm font-bold text-white transition-colors">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Application
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Confirmation ───────────────────────────────────────────────────────────────
function Confirmation({ roleName, appId, onDone }: { roleName: string; appId: number; onDone: () => void }) {
  const ref = `MVC-${String(appId).padStart(5, "0")}`;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-base font-extrabold text-white">Application received</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Thank you for applying for <strong className="text-white">{roleName}</strong>. Your application has been received and forwarded to our recruitment team.
        </p>
      </div>
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Reference number</p>
        <p className="text-2xl font-extrabold text-primary mt-1 font-mono">{ref}</p>
        <p className="text-xs text-muted-foreground mt-2">Keep this for your records. You can check your status using your email at the careers portal.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a href={`${CAREERS_API}/#/status`} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-bold text-white transition-colors">
          <Eye className="h-3.5 w-3.5" /> Check status
        </a>
        <button onClick={onDone} className="flex items-center gap-2 rounded-lg border border-sidebar-border px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors">
          Back to roles
        </button>
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function Recruitment() {
  const [step, setStep] = useState<Step>("list");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [appId, setAppId] = useState<number | null>(null);

  const role = useMemo(() => selectedRoleId ? getRole(selectedRoleId) : undefined, [selectedRoleId]);
  const isApprentice = selectedRoleId === "apprentice";

  const selectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    setResponses({});
    setAppId(null);
    if (roleId === "apprentice") setStep("form"); // Apprentice skips checklist
    else setStep("overview");
  };

  const goBack = () => {
    if (step === "overview") { setStep("list"); setSelectedRoleId(null); }
    else if (step === "checklist") setStep("overview");
    else if (step === "blocked") setStep("checklist");
    else if (step === "form") setStep(isApprentice ? "list" : "checklist");
    else setStep("list");
  };

  const roleName = role?.name ?? (isApprentice ? APPRENTICE.name : "");
  const showBack = step !== "list" && step !== "done";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-sidebar-border bg-sidebar flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={goBack} className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-sidebar-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex-shrink-0">
            <UserPlus className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">
              {step === "list" ? "Recruitment Portal" : roleName || "Recruitment Portal"}
            </div>
            <div className="text-[11px] text-muted-foreground">Medivac.ai Careers</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StepDots step={step} />
          <a href="https://medivac-careers.pplx.app" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-sidebar-border text-xs text-muted-foreground hover:text-white transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl mx-auto">
          {step === "list" && <RoleList onSelect={selectRole} />}

          {step === "overview" && role && (
            <RoleOverview role={role} onStart={() => setStep("checklist")} />
          )}

          {step === "checklist" && role && (
            <EligibilityChecklist
              role={role} responses={responses} setResponses={setResponses}
              onProceed={() => setStep("form")}
              onBlocked={() => setStep("blocked")}
            />
          )}

          {step === "blocked" && role && (
            <Blocked role={role} responses={responses}
              onRetry={() => setStep("checklist")}
              onBack={() => { setStep("list"); setSelectedRoleId(null); }} />
          )}

          {step === "form" && !isApprentice && role && (
            <ApplicationForm role={role} responses={responses}
              onSubmitted={id => { setAppId(id); setStep("done"); }} />
          )}

          {step === "form" && isApprentice && (
            <ApprenticeForm onSubmitted={id => { setAppId(id); setStep("done"); }} />
          )}

          {step === "done" && appId != null && (
            <Confirmation roleName={roleName} appId={appId}
              onDone={() => { setStep("list"); setSelectedRoleId(null); setAppId(null); }} />
          )}
        </div>
      </div>
    </div>
  );
}
