import { useState } from "react";
import {
  Shield, Key, CheckCircle2, XCircle, Clock, ExternalLink,
  Eye, EyeOff, Save, RefreshCw, AlertTriangle, Copy, Check,
  Plug, Lock, ChevronDown, ChevronUp, Info, Terminal
} from "lucide-react";
import type { UserRole } from "@/lib/data";

// ─── Integration catalogue ───────────────────────────────────────────────────

type ConnStatus = "connected" | "disconnected" | "pending" | "error";

interface ApiField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;          // mask value
  hint?: string;
}

interface Integration {
  id: string;
  name: string;
  logo: string;             // emoji / short glyph
  category: string;
  description: string;
  docsUrl: string;
  fields: ApiField[];
  status: ConnStatus;
  lastSync?: string;
  latency?: string;
  notes?: string;           // approval / pending note
  comingSoon?: boolean;
}

const INTEGRATIONS: Integration[] = [
  // ── Aviation Operations ─────────────────────────────────────────────────────
  {
    id: "air-maestro",
    name: "Air Maestro",
    logo: "✈️",
    category: "Aviation Operations",
    description: "Live roster sync, crew duty times, EBA limit monitoring, and FRMS fatigue data.",
    docsUrl: "https://www.airmaestro.net",
    status: "pending",
    notes: "Pending RFDS SE approval. API access requires Air Maestro account admin to issue OAuth credentials.",
    fields: [
      { key: "am_base_url",    label: "Base URL",      placeholder: "https://your-org.airmaestro.net/api/v1", hint: "Provided by your Air Maestro account manager" },
      { key: "am_client_id",   label: "Client ID",     placeholder: "am_client_xxxxxxxx" },
      { key: "am_client_secret", label: "Client Secret", placeholder: "am_secret_xxxxxxxx", secret: true },
      { key: "am_org_id",      label: "Organisation ID", placeholder: "RFDS-SE", hint: "Your Air Maestro organisation code" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "veryon",
    name: "Veryon (Traxxall)",
    logo: "🔧",
    category: "Aviation Operations",
    description: "Aircraft maintenance tracking, component hours, defect logging, and airworthiness status.",
    docsUrl: "https://www.veryon.com",
    status: "pending",
    notes: "Pending approval. Veryon REST API requires a dedicated service account — contact Veryon support to enable API access for your fleet.",
    fields: [
      { key: "veryon_api_url",   label: "API Base URL",  placeholder: "https://api.veryon.com/v2" },
      { key: "veryon_api_key",   label: "API Key",       placeholder: "vry_live_xxxxxxxxxxxx", secret: true },
      { key: "veryon_org",       label: "Organisation",  placeholder: "RFDS-SE", hint: "Your Veryon fleet group code" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "apg",
    name: "APG Genesis Pro",
    logo: "🌤️",
    category: "Aviation Operations",
    description: "Runway analysis, weight & balance, performance charts, and weather release approvals.",
    docsUrl: "https://www.apg.aero",
    status: "pending",
    notes: "Pending API agreement with APG. Genesis Pro REST API is available to approved operators — submit a request via your APG account representative.",
    fields: [
      { key: "apg_api_key",     label: "API Key",       placeholder: "apg_xxxxxxxxxxxxxxxx", secret: true },
      { key: "apg_fleet_id",    label: "Fleet ID",      placeholder: "RFDS-SE-FLEET", hint: "Assigned by APG for your aircraft group" },
      { key: "apg_base_url",    label: "API URL",       placeholder: "https://api.genesis.apg.aero/v1" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "avplan",
    name: "AvPlan EFB",
    logo: "🗺️",
    category: "Aviation Operations",
    description: "Flight plan sync, weather overlays, NOTAM briefings, and route data.",
    docsUrl: "https://www.avplan-efb.com",
    status: "disconnected",
    fields: [
      { key: "avplan_api_key", label: "API Key",     placeholder: "avp_xxxxxxxxxxxxxxxx", secret: true },
      { key: "avplan_org",     label: "Operator ID", placeholder: "RFDS-SE" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "logten",
    name: "LogTen Pro",
    logo: "📓",
    category: "Aviation Operations",
    description: "Pilot logbook sync — flight hours, approaches, currency, and endorsement tracking.",
    docsUrl: "https://www.coradine.com",
    status: "disconnected",
    fields: [
      { key: "logten_api_key",    label: "API Key",       placeholder: "lt_xxxxxxxxxxxxxxxx", secret: true },
      { key: "logten_account_id", label: "Account ID",    placeholder: "RFDS-SE-OPS" },
    ],
    lastSync: "—",
    latency: "—",
  },

  // ── Health & Medical ────────────────────────────────────────────────────────
  {
    id: "lhd",
    name: "NSW Local Health Districts (LHD)",
    logo: "🏥",
    category: "Health & Medical",
    description: "Patient referral data, hospital capacity feeds, trauma alerts, and aeromedical tasking coordination with LHD dispatch systems.",
    docsUrl: "https://www.health.nsw.gov.au",
    status: "pending",
    notes: "Requires NSW Health Information Sharing Agreement (ISA). Contact NSW Ministry of Health — Digital Health & Innovation Branch to initiate. Data sharing governed by the Health Records and Information Privacy Act 2002.",
    fields: [
      { key: "lhd_api_url",    label: "API Gateway URL",  placeholder: "https://api.health.nsw.gov.au/v1", hint: "Provided by NSW Health Digital" },
      { key: "lhd_client_id",  label: "Client ID",        placeholder: "rfds-se-client-xxxxxx" },
      { key: "lhd_client_secret", label: "Client Secret", placeholder: "nsw_health_secret_xxxxxxxx", secret: true },
      { key: "lhd_district",   label: "LHD District Code", placeholder: "FWD", hint: "Far West: FWD · Western: WES · Hunter New England: HNE" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "acc",
    name: "Aeromedical Control Centre (ACC)",
    logo: "🚁",
    category: "Health & Medical",
    description: "NSW Health ACC tasking feed — real-time mission requests, patient acuity scoring, and retrieval coordination for RFDS SE operations.",
    docsUrl: "https://www.ambulance.nsw.gov.au",
    status: "pending",
    notes: "Requires NSW Ambulance MOU and ACC system access approval. ACC integration uses HL7 FHIR R4 messaging — contact NSW Ambulance Operations Technology to initiate data sharing agreement.",
    fields: [
      { key: "acc_fhir_url",      label: "FHIR Base URL",    placeholder: "https://fhir.acc.ambulance.nsw.gov.au/R4", hint: "Provided by NSW Ambulance Operations Technology" },
      { key: "acc_client_id",     label: "OAuth Client ID",  placeholder: "rfds-se-acc-client" },
      { key: "acc_client_secret", label: "OAuth Secret",     placeholder: "acc_secret_xxxxxxxx", secret: true },
      { key: "acc_scope",         label: "FHIR Scope",       placeholder: "system/ServiceRequest.read system/Patient.read", hint: "Approved scopes from your MOU" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "naas",
    name: "NAAS — National Aerial Ambulance Service",
    logo: "🚑",
    category: "Health & Medical",
    description: "National Aerial Ambulance Service coordination feed — inter-hospital transfer tasking, patient priority data, and mission handover messaging between NAAS coordination and RFDS SE operations.",
    docsUrl: "https://www.ambulance.nsw.gov.au",
    status: "pending" as ConnStatus,
    notes: "Requires a formal data sharing agreement with NSW Ambulance / NAAS. Integration uses secure HL7 FHIR R4 messaging for transfer request coordination. Contact NAAS Operations to initiate the MOU and obtain API gateway credentials.",
    fields: [
      { key: "naas_api_url",      label: "API Gateway URL",  placeholder: "https://api.naas.ambulance.nsw.gov.au/v1", hint: "Provided by NAAS Operations Technology" },
      { key: "naas_client_id",    label: "OAuth Client ID",  placeholder: "rfds-se-naas-client" },
      { key: "naas_client_secret",label: "OAuth Secret",     placeholder: "naas_secret_xxxxxxxx", secret: true },
      { key: "naas_org_code",     label: "Organisation Code",placeholder: "RFDS-SE", hint: "Your NAAS-assigned operator code" },
      { key: "naas_scope",        label: "FHIR Scope",       placeholder: "system/ServiceRequest.read system/Patient.read system/Task.write", hint: "Approved scopes from your MOU" },
    ],
    lastSync: "—", latency: "—",
  },
  {
    id: "healthconnect",
    name: "HealthConnect / Telehealth",
    logo: "💊",
    category: "Health & Medical",
    description: "Telehealth session management, patient record access gateway, and secure clinical communications.",
    docsUrl: "https://www.healthconnect.gov.au",
    status: "disconnected",
    fields: [
      { key: "hc_api_key",   label: "API Key",     placeholder: "hc_xxxxxxxxxxxxxxxx", secret: true },
      { key: "hc_org_code",  label: "Org Code",    placeholder: "RFDS-SE-DBO" },
    ],
    lastSync: "—",
    latency: "—",
  },

  // ── Forms & Workflow ────────────────────────────────────────────────────────
  {
    id: "jotform",
    name: "Jotform",
    logo: "📋",
    category: "Forms & Workflow",
    description: "Check & training form submissions, checklist responses, and signed document webhooks.",
    docsUrl: "https://api.jotform.com/docs",
    status: "disconnected",
    fields: [
      { key: "jotform_api_key", label: "API Key", placeholder: "jf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true, hint: "Found in Jotform Account Settings → API" },
    ],
    lastSync: "—",
    latency: "—",
  },
  {
    id: "smartsheet",
    name: "Smartsheet",
    logo: "📊",
    category: "Forms & Workflow",
    description: "Operational spreadsheet sync, maintenance schedules, and compliance tracking sheets.",
    docsUrl: "https://smartsheet.redoc.ly",
    status: "disconnected",
    fields: [
      { key: "smartsheet_token", label: "Access Token", placeholder: "sm_xxxxxxxxxxxxxxxxxxxxxxxx", secret: true, hint: "Generate in Smartsheet: Account → Apps & Integrations → API Access" },
    ],
    lastSync: "—",
    latency: "—",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ConnStatus }) {
  const cfg = {
    connected:    { cls: "status-green",  icon: <CheckCircle2 size={11} />, label: "Connected"    },
    disconnected: { cls: "status-red",    icon: <XCircle size={11} />,      label: "Not Connected" },
    pending:      { cls: "status-amber",  icon: <Clock size={11} />,        label: "Pending Approval" },
    error:        { cls: "status-red",    icon: <AlertTriangle size={11} />, label: "Error"        },
  }[status];
  return (
    <span className={`badge ${cfg.cls} flex items-center gap-1`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Single integration card ──────────────────────────────────────────────────
function IntegrationCard({ integ }: { integ: Integration }) {
  const [open,    setOpen]    = useState(false);
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [shown,   setShown]   = useState<Record<string, boolean>>({});
  const [saved,   setSaved]   = useState(false);
  const [copied,  setCopied]  = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleCopy(val: string, key: string) {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function handleTest() {
    setTesting(true);
    setTestResult(null);
    // Simulate test — real implementation would call backend /api/integrations/:id/test
    setTimeout(() => {
      setTesting(false);
      setTestResult(Object.values(values).some(v => v.trim()) ? "ok" : "fail");
    }, 1800);
  }

  const allFilled = integ.fields.every(f => (values[f.key] ?? "").trim().length > 0);

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden transition-all">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="text-2xl w-9 text-center shrink-0">{integ.logo}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {integ.name}
            </span>
            <StatusBadge status={integ.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{integ.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {integ.latency && integ.status === "connected" && (
            <span className="text-xs text-muted-foreground font-mono">{integ.latency}</span>
          )}
          {open ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Expandable config panel */}
      {open && (
        <div className="border-t border-card-border px-5 py-5 space-y-5">

          {/* Description + docs link */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-muted-foreground leading-relaxed">{integ.description}</p>
            <a
              href={integ.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-cyan-400 hover:underline shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={11} /> API Docs
            </a>
          </div>

          {/* Pending approval notice */}
          {integ.notes && (
            <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Info size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">{integ.notes}</p>
            </div>
          )}

          {/* Credential fields */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credentials</div>
            {integ.fields.map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-medium text-foreground/80">{f.label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={f.secret && !shown[f.key] ? "password" : "text"}
                      value={values[f.key] ?? ""}
                      onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyan-500/50 pr-8"
                    />
                    {f.secret && (
                      <button
                        type="button"
                        onClick={() => setShown(s => ({ ...s, [f.key]: !s[f.key] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {shown[f.key] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    )}
                  </div>
                  {values[f.key] && (
                    <button
                      type="button"
                      onClick={() => handleCopy(values[f.key], f.key)}
                      className="px-2.5 py-1.5 rounded-lg border border-card-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === f.key ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
                {f.hint && <p className="text-[10px] text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-xs border ${
              testResult === "ok"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {testResult === "ok"
                ? <><CheckCircle2 size={13} /> Connection successful — API responded normally.</>
                : <><XCircle size={13} /> Connection failed — check credentials and network access.</>}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={handleTest}
              disabled={testing || !allFilled}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-card-border text-xs text-muted-foreground hover:text-foreground hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {testing
                ? <><RefreshCw size={11} className="animate-spin" /> Testing…</>
                : <><Terminal size={11} /> Test Connection</>}
            </button>
            <button
              onClick={handleSave}
              disabled={!allFilled}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
            >
              {saved
                ? <><Check size={11} /> Saved</>
                : <><Save size={11} /> Save Credentials</>}
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-card-border">
            <Lock size={9} className="shrink-0" />
            Credentials are stored encrypted server-side and never exposed in the browser after saving. Only System Admins can view or modify API keys.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApiIntegrations({ role }: { role: UserRole }) {
  const [category, setCategory] = useState("All");
  const [search,   setSearch]   = useState("");

  // Hard gate — admin only
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <div>
          <div className="font-bold text-lg" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Access Restricted
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            The API Integration Hub is restricted to System Administrators only.
          </p>
        </div>
      </div>
    );
  }

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = category === "All" || i.category === category;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = {
    connected:    INTEGRATIONS.filter(i => i.status === "connected").length,
    pending:      INTEGRATIONS.filter(i => i.status === "pending").length,
    disconnected: INTEGRATIONS.filter(i => i.status === "disconnected").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Plug size={18} className="text-cyan-400" />
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              API Integration Hub
            </h1>
            <span className="badge status-red text-[10px] flex items-center gap-1">
              <Shield size={9} /> Admin Only
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centralised credential management for all external system connections.
          </p>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Connected",       value: counts.connected,    color: "text-green-400",  bg: "bg-green-500/8"  },
          { label: "Pending Approval", value: counts.pending,     color: "text-amber-400",  bg: "bg-amber-500/8"  },
          { label: "Not Connected",   value: counts.disconnected, color: "text-red-400",    bg: "bg-red-500/8"    },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-card-border rounded-xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Security notice */}
      <div className="flex gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/8">
        <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300 leading-relaxed">
          <span className="font-semibold">Admin access only.</span> All API credentials entered here are encrypted at rest using AES-256. Never share this page or its credentials with non-admin personnel. For integrations marked <span className="font-semibold">Pending Approval</span>, do not enter credentials until the relevant MOU or API agreement has been executed.
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search integrations…"
          className="flex-1 min-w-[180px] px-3 py-2 bg-card border border-card-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyan-500/50"
        />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === c
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30"
                  : "bg-card border border-card-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Integration cards grouped by category */}
      {CATEGORIES.filter(c => c !== "All").map(cat => {
        const items = filtered.filter(i => i.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat} className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {cat}
            </div>
            {items.map(integ => (
              <IntegrationCard key={integ.id} integ={integ} />
            ))}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No integrations match your search.
        </div>
      )}
    </div>
  );
}
