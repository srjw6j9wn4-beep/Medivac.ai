import { useState } from "react";
import {
  Building2, Users, Plane, Network, AlertTriangle, CheckCircle2, Circle,
  XCircle, Lock, Database, KeyRound, Shield, Globe2, Layers, ChevronRight,
  MapPin, Ban,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

// ─── Types ──────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  status: "Active" | "Prospecting";
  bases: string[];
  aircraft: number;
  users: number;
  plan: string;
}

const CURRENT_TENANT: Tenant = {
  id: "rfds-se",
  name: "RFDS SE",
  status: "Active",
  bases: ["Dubbo", "Broken Hill", "Bankstown", "Essendon", "Launceston"],
  aircraft: 8,
  users: 47,
  plan: "Enterprise",
};

const PLANNED_TENANTS: Array<{
  name: string;
  base: string;
  aircraftNote: string;
}> = [
  { name: "RFDS Queensland", base: "Brisbane base", aircraftNote: "~12 aircraft" },
  { name: "CareFlight NSW", base: "Westmead base", aircraftNote: "~6 aircraft" },
  { name: "Toll Helicopters", base: "Darwin base", aircraftNote: "~8 helicopters" },
  { name: "Life Flight NZ", base: "Auckland base", aircraftNote: "~5 aircraft" },
];

const ISOLATION_CHECKLIST: Array<{
  label: string;
  state: "done" | "partial" | "no";
}> = [
  { label: "Separate PostgreSQL schemas", state: "done" },
  { label: "JWT tenant claims", state: "done" },
  { label: "Row-level security", state: "done" },
  { label: "Cross-tenant mission brokering (planned)", state: "partial" },
  { label: "Shared crew pool (not planned)", state: "no" },
];

const PRICING_TIERS = [
  { tier: "Starter", price: "$4,900 / mo", aircraftLimit: "Up to 3 aircraft", users: "Up to 15 users", support: "Business hours support" },
  { tier: "Growth", price: "$11,500 / mo", aircraftLimit: "Up to 10 aircraft", users: "Up to 60 users", support: "24/7 support + onboarding" },
  { tier: "Enterprise", price: "Custom (from $22,000 / mo)", aircraftLimit: "Unlimited aircraft", users: "Unlimited users", support: "Dedicated CSM + SLA 99.95%" },
];

// ─── Small UI helpers ───────────────────────────────────────────────────────

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-[#797876] uppercase tracking-wider">{label}</div>
        <div className="text-lg font-semibold text-[#CDCCCA]" style={HF}>{value}</div>
      </div>
    </div>
  );
}

function ChecklistIcon({ state }: { state: "done" | "partial" | "no" }) {
  if (state === "done") return <CheckCircle2 size={16} className="text-green-400 shrink-0" />;
  if (state === "partial") return <Circle size={16} className="text-amber-400 shrink-0" />;
  return <XCircle size={16} className="text-red-400 shrink-0" />;
}

export default function MultiTenantAdmin() {
  const [tab, setTab] = useState<"registry" | "architecture">("registry");

  return (
    <div className="p-6 space-y-6 bg-[#0f1117] min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#CDCCCA]" style={HF}>Multi-Operator Platform</h1>
        <p className="text-sm text-[#797876] mt-0.5">
          Multi-Tenant Architecture · Network Expansion · Organisation Management
        </p>
      </div>

      {/* Architecture status banner */}
      <div className="bg-amber-950/30 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/90">
          Multi-tenant architecture in development — Q3 2027 target. Currently: RFDS SE single-tenant.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Building2 size={18} className="text-[#4F98A3]" />} label="Current Tenants" value="1 (RFDS SE)" />
        <KpiCard icon={<Network size={18} className="text-[#4F98A3]" />} label="Target Tenants" value="5 by 2028" />
        <KpiCard icon={<Layers size={18} className="text-[#797876]" />} label="Shared Fleet Pool" value="Off" />
        <KpiCard icon={<Plane size={18} className="text-[#797876]" />} label="Network Missions" value="0" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#393836]">
        {[
          { id: "registry", label: "Tenant Registry" },
          { id: "architecture", label: "Architecture Overview" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "registry" | "architecture")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#4F98A3] text-[#4F98A3]"
                : "border-transparent text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "registry" && (
        <div className="space-y-6">
          {/* Current tenant */}
          <div>
            <h2 className="text-sm font-semibold text-[#797876] uppercase tracking-wider mb-3">Current Tenant</h2>
            <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4F98A3]/15 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-[#4F98A3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[#CDCCCA]" style={HF}>{CURRENT_TENANT.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/30">
                        {CURRENT_TENANT.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#797876] mt-1">
                      <MapPin size={12} />
                      {CURRENT_TENANT.bases.join(" · ")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-[#CDCCCA] font-semibold">{CURRENT_TENANT.aircraft}</div>
                    <div className="text-xs text-[#5A5957]">Aircraft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#CDCCCA] font-semibold">{CURRENT_TENANT.users}</div>
                    <div className="text-xs text-[#5A5957]">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#4F98A3] font-semibold">{CURRENT_TENANT.plan}</div>
                    <div className="text-xs text-[#5A5957]">Plan</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Planned operators */}
          <div>
            <h2 className="text-sm font-semibold text-[#797876] uppercase tracking-wider mb-3">Planned Operators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLANNED_TENANTS.map((p) => (
                <div key={p.name} className="bg-[#1C1B19]/60 border border-[#393836] rounded-xl p-5 opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#393836]/50 flex items-center justify-center shrink-0">
                        <Building2 size={20} className="text-[#5A5957]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#CDCCCA]" style={HF}>{p.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#393836] text-[#797876] border border-[#5A5957]/40">
                            Prospecting
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#797876] mt-1">
                          <MapPin size={12} />
                          {p.base} · {p.aircraftNote}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled
                    className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg bg-[#393836]/40 text-[#5A5957] border border-[#393836] cursor-not-allowed"
                  >
                    <Ban size={12} />
                    Initiate Onboarding
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Isolation note */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex items-start gap-3">
            <Lock size={16} className="text-[#4F98A3] shrink-0 mt-0.5" />
            <p className="text-sm text-[#797876]">
              Each tenant operates in a fully isolated data environment. Cross-tenant data sharing requires explicit bilateral configuration.
            </p>
          </div>
        </div>
      )}

      {tab === "architecture" && (
        <div className="space-y-6">
          {/* Text diagram */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[#797876] uppercase tracking-wider mb-4">Platform Layers</h2>

            <div className="flex flex-col items-center gap-3">
              <div className="w-full md:w-2/3 text-center bg-[#4F98A3]/15 border border-[#4F98A3]/40 rounded-lg py-3">
                <span className="text-sm font-semibold text-[#4F98A3]" style={HF}>Medivac.ai Platform</span>
              </div>

              <ChevronRight size={16} className="text-[#5A5957] rotate-90" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {[
                  { name: "Tenant A (RFDS SE)", live: true },
                  { name: "Tenant B (CareFlight)", live: false },
                  { name: "Tenant C (RFDS QLD)", live: false },
                ].map((t) => (
                  <div
                    key={t.name}
                    className={`rounded-lg border p-4 text-center ${
                      t.live ? "border-[#4F98A3]/50 bg-[#4F98A3]/5" : "border-[#393836] bg-[#1C1B19]/60 opacity-60"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#CDCCCA] mb-2" style={HF}>{t.name}</div>
                    <div className="text-xs text-[#797876] space-y-1">
                      <div className="flex items-center gap-1.5 justify-center"><Database size={12} className="text-[#4F98A3]" /> Isolated DB schema</div>
                      <div className="flex items-center gap-1.5 justify-center"><KeyRound size={12} className="text-[#4F98A3]" /> Separate auth</div>
                      <div className="flex items-center gap-1.5 justify-center"><Shield size={12} className="text-[#4F98A3]" /> Own branding</div>
                    </div>
                  </div>
                ))}
              </div>

              <ChevronRight size={16} className="text-[#5A5957] rotate-90" />

              <div className="w-full text-center bg-[#393836]/40 border border-[#393836] rounded-lg py-3">
                <div className="text-xs text-[#797876] uppercase tracking-wider mb-1">Shared Infrastructure</div>
                <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-[#CDCCCA]">
                  <span className="flex items-center gap-1"><Globe2 size={12} className="text-[#4F98A3]" /> FHIR Gateway</span>
                  <span className="text-[#5A5957]">|</span>
                  <span className="flex items-center gap-1"><Globe2 size={12} className="text-[#4F98A3]" /> ADS-B Feed</span>
                  <span className="text-[#5A5957]">|</span>
                  <span className="flex items-center gap-1"><Globe2 size={12} className="text-[#4F98A3]" /> Avinode API</span>
                  <span className="text-[#5A5957]">|</span>
                  <span className="flex items-center gap-1"><Globe2 size={12} className="text-[#4F98A3]" /> Regulatory Monitor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data isolation checklist */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#797876] uppercase tracking-wider mb-4">Data Isolation Checklist</h2>
            <div className="space-y-2.5">
              {ISOLATION_CHECKLIST.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <ChecklistIcon state={item.state} />
                  <span className="text-sm text-[#CDCCCA]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing model */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#797876] uppercase tracking-wider mb-4">Per-Tenant Subscription Tiers (AUD)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#797876] uppercase tracking-wider border-b border-[#393836]">
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Aircraft</th>
                    <th className="py-2 pr-4">Users</th>
                    <th className="py-2 pr-4">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_TIERS.map((tier) => (
                    <tr key={tier.tier} className="border-b border-[#393836]/60 last:border-0">
                      <td className="py-3 pr-4 font-semibold text-[#4F98A3]" style={HF}>{tier.tier}</td>
                      <td className="py-3 pr-4 text-[#CDCCCA]">{tier.price}</td>
                      <td className="py-3 pr-4 text-[#797876]">{tier.aircraftLimit}</td>
                      <td className="py-3 pr-4 text-[#797876]">{tier.users}</td>
                      <td className="py-3 pr-4 text-[#797876]">{tier.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
