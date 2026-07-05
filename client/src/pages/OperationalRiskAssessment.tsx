import { useState, useMemo } from "react";
import { type UserRole } from "@/lib/data";
import {
  CheckCircle, AlertTriangle, XCircle, ChevronRight, ChevronLeft,
  ClipboardList, User, Cloud, Plane, BarChart3, Shield, Info
} from "lucide-react";

interface Props { role: UserRole; }

const SECTORS = [1, 2, 3, 4, 5, 6];

// ── Scoring weights ──────────────────────────────────────────────────────────
// Each checkbox tick adds to that sector's score. Thresholds: 0-3 GREEN, 4-6 AMBER, 7+ RED

const WEATHER_ITEMS = [
  { key: "ts_dep",       label: "TS Forecast Dep/Dest",        weight: 2 },
  { key: "shear",        label: "Shear / Turb Dep/Dest",       weight: 1 },
  { key: "fog",          label: "Fog / Mist Forecast Dep/Dest",weight: 1 },
  { key: "ts_enr",       label: "Thunderstorms ENR",           weight: 2 },
  { key: "icing",        label: "Icing ENR",                   weight: 2 },
  { key: "turb_hi",      label: "Turb ENR Above 10,000ft",     weight: 1 },
  { key: "turb_lo",      label: "Turb ENR Below 10,000ft",     weight: 1 },
  { key: "hold_30",      label: "30 min Weather Holding",      weight: 1 },
  { key: "hold_60",      label: "60 min Weather Holding",      weight: 2 },
  { key: "alt_base",     label: "Home Base Requires Alternate", weight: 1 },
  { key: "dust",         label: "Dust Storms",                  weight: 2 },
];

const AERODROME_ITEMS = [
  { key: "no_aid",       label: "No Aid / Approach",           weight: 2 },
  { key: "circling",     label: "Circling Approach Required",  weight: 2 },
  { key: "ala",          label: "ALA",                         weight: 2 },
  { key: "unfamiliar",   label: "Unfamiliar / Infrequent",     weight: 1 },
  { key: "high_risk",    label: "Considered High Risk",        weight: 2 },
  { key: "lhd_day",      label: "Lord Howe Day",               weight: 2 },
  { key: "lhd_night",    label: "Lord Howe Night",             weight: 3 },
  { key: "non_apg",      label: "Non APG",                     weight: 1 },
];

const TOL_ITEMS = [
  { key: "day_to",       label: "Day T/O",                     weight: 0 },
  { key: "day_ldg",      label: "Day LDG",                     weight: 0 },
  { key: "night_to",     label: "Night T/O",                   weight: 1 },
  { key: "night_ldg",    label: "Night LDG Before Midnight",   weight: 1 },
  { key: "after_mid",    label: "Landing After Midnight",      weight: 2 },
  { key: "day_night",    label: "Daylight T/O or LDG on Night Shift", weight: 1 },
];

type SectorChecks = Record<string, boolean>;

interface ORAResult {
  score:   number;
  level:   "GREEN" | "AMBER" | "RED";
  label:   string;
  instruction: string;
}

function scoreToResult(score: number): ORAResult {
  if (score <= 3)  return { score, level: "GREEN", label: "NORMAL OPERATIONS",   instruction: "Operate as planned." };
  if (score <= 6)  return { score, level: "AMBER", label: "ELEVATED RISK",       instruction: "Caution required. Consult SBP / HOFO before proceeding. Pilot confirms acceptance of elevated risk." };
  return             { score, level: "RED",   label: "HIGH RISK — REVIEW",  instruction: "Do not operate without HOFO / senior management authorisation. Document mitigation." };
}

// Human factors scoring
function humanFactorsScore(hf: HumanFactors): number {
  let s = 0;
  if (hf.commence === "1601-2359") s += 1;
  if (hf.commence === "0000-0559") s += 2;
  if (hf.shiftDuration === "9")    s += 1;
  if (hf.shiftDuration === "10")   s += 2;
  if (hf.shiftDuration === "11")   s += 2;
  if (hf.shiftDuration === "12")   s += 3;
  if (hf.priorDutyFree === "10-11:59 hours") s += 1;
  if (hf.priorDutyFree === "8-9:59 hours")   s += 2;
  if (hf.sleep === "Less than Normal") s += 2;
  if (hf.prevFlightTime === "5-6.9 hours") s += 1;
  if (hf.prevFlightTime === "7+ hours")    s += 2;
  if (hf.faid === "61-70") s += 1;
  if (hf.faid === "71-80") s += 2;
  if (hf.faid === "81+")   s += 3;
  if (hf.checkedLess60days) s += 1;
  if (hf.secondTasking)     s += 1;
  if (hf.notFlown14days)    s += 1;
  if (hf.awake16hrs)        s += 1;
  return s;
}

interface HumanFactors {
  commence:        string;
  shiftDuration:   string;
  priorDutyFree:   string;
  sleep:           string;
  prevFlightTime:  string;
  faid:            string;
  checkedLess60days: boolean;
  secondTasking:     boolean;
  notFlown14days:    boolean;
  awake16hrs:        boolean;
}

const defaultHF: HumanFactors = {
  commence: "0600-1600", shiftDuration: "1-4", priorDutyFree: "12 or more hours",
  sleep: "Normal", prevFlightTime: "0-2.9 hours", faid: "0-60",
  checkedLess60days: false, secondTasking: false, notFlown14days: false, awake16hrs: false,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function OperationalRiskAssessment({ role }: Props) {
  const [page, setPage] = useState(0);

  // Page 1 — Pilot details
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [homeBase,      setHomeBase]      = useState("Dubbo");
  const [taskingAgent,  setTaskingAgent]  = useState("NSW Ambulance Control Centre (ACC)");
  const [fitForDuty,    setFitForDuty]    = useState(true);
  const [opsType,       setOpsType]       = useState("Medical Transport Ops");
  const [numSectors,    setNumSectors]    = useState(2);
  const [wicrCount,     setWicrCount]     = useState("N/A");
  const [revisedORA,    setRevisedORA]    = useState("No");

  // Page 2 — Human factors
  const [hf, setHF] = useState<HumanFactors>(defaultHF);
  const hfScore = humanFactorsScore(hf);

  // Page 3 — Operational checks per sector (weather, aerodrome, tol)
  const [wxChecks,    setWxChecks]    = useState<SectorChecks[]>(SECTORS.map(() => ({})));
  const [adChecks,    setAdChecks]    = useState<SectorChecks[]>(SECTORS.map(() => ({})));
  const [tolChecks,   setTolChecks]   = useState<SectorChecks[]>(SECTORS.map(() => ({})));
  const [mitigated,   setMitigated]   = useState<boolean[]>(SECTORS.map(() => false));
  const [routeDist,   setRouteDist]   = useState<string[]>(SECTORS.map(() => "0-150 nm"));

  // Pilot override confirmations (per-sector for amber/red)
  const [pilotOverride, setPilotOverride] = useState<Record<number, boolean>>({});

  // ── Compute per-sector scores ─────────────────────────────────────────────
  const results: ORAResult[] = useMemo(() => {
    return SECTORS.slice(0, numSectors).map((_, si) => {
      let score = hfScore;

      // Weather
      WEATHER_ITEMS.forEach(item => {
        if (wxChecks[si][item.key]) score += item.weight;
      });

      // Aerodrome
      AERODROME_ITEMS.forEach(item => {
        if (adChecks[si][item.key]) score += item.weight;
      });

      // T/O & Landing
      TOL_ITEMS.forEach(item => {
        if (tolChecks[si][item.key]) score += item.weight;
      });

      // Route distance
      if (routeDist[si] === "251-350 nm") score += 1;
      if (routeDist[si] === "351+ nm")    score += 2;

      // Mitigation: unfamiliar/high-risk mitigated reduces score by 2
      if (mitigated[si]) score = Math.max(0, score - 2);

      return scoreToResult(score);
    });
  }, [hfScore, wxChecks, adChecks, tolChecks, routeDist, mitigated, numSectors]);

  const overallLevel: "GREEN" | "AMBER" | "RED" = results.some(r => r.level === "RED") ? "RED"
    : results.some(r => r.level === "AMBER") ? "AMBER" : "GREEN";

  const toggleSectorCheck = (
    arr: SectorChecks[], setter: (v: SectorChecks[]) => void,
    si: number, key: string
  ) => {
    const next = arr.map((s, i) => i === si ? { ...s, [key]: !s[key] } : s);
    setter(next);
  };

  const levelColour = (l: string) =>
    l === "GREEN" ? "text-green-400 bg-green-500/10 border-green-500/30"
    : l === "AMBER" ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-red-400 bg-red-500/10 border-red-500/30";

  const levelIcon = (l: string) =>
    l === "GREEN" ? <CheckCircle size={14} className="text-green-400" />
    : l === "AMBER" ? <AlertTriangle size={14} className="text-amber-400" />
    : <XCircle size={14} className="text-red-400" />;

  const activeSectors = SECTORS.slice(0, numSectors);

  // ── Pages ─────────────────────────────────────────────────────────────────
  const pages = [
    {
      title: "Pilot Details & Mission Parameters",
      icon: <User size={16} className="text-cyan-400" />,
    },
    {
      title: "Human Factors Considerations",
      icon: <Shield size={16} className="text-cyan-400" />,
    },
    {
      title: "Operational Considerations",
      icon: <Cloud size={16} className="text-cyan-400" />,
    },
    {
      title: "ORA Results",
      icon: <BarChart3 size={16} className="text-cyan-400" />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <ClipboardList size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Operational Risk Assessment
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">ORA 2.0 · Pilot completes before each mission · Final authorisation remains with PIC</p>
        </div>
        {overallLevel !== "GREEN" && page === 3 && (
          <div className={`ml-auto px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${levelColour(overallLevel)}`}>
            {levelIcon(overallLevel)} {overallLevel}
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => setPage(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 justify-center
                ${page === i
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                  : i < page
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-card border border-card-border text-muted-foreground'}`}
            >
              {i < page ? <CheckCircle size={11} /> : p.icon}
              <span className="hidden sm:inline">{p.title.split(" ")[0]}{i === 2 ? " Ops" : ""}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < pages.length - 1 && <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── Page 0: Pilot Details ────────────────────────────────────────────── */}
      {page === 0 && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pilot Details</div>
            <div className="grid grid-cols-2 gap-3">
              <ORAField label="First Name"><input value={firstName} onChange={e => setFirstName(e.target.value)} className={inp} placeholder="e.g. Thomas" /></ORAField>
              <ORAField label="Last Name"><input value={lastName} onChange={e => setLastName(e.target.value)} className={inp} placeholder="e.g. Barnes" /></ORAField>
            </div>
            <ORAField label="Home Base">
              <div className="flex flex-wrap gap-2">
                {['Bankstown','Broken Hill','Dubbo','Essendon','Launceston','Pilot Management'].map(b => (
                  <RadioChip key={b} label={b} selected={homeBase === b} onClick={() => setHomeBase(b)} />
                ))}
              </div>
            </ORAField>
            <ORAField label="Tasking Agent">
              <div className="flex flex-wrap gap-2">
                {['NSW Ambulance Control Centre (ACC)','Ambulance Tasmania','RFDS SE Operations','RFDS Victoria','Other'].map(a => (
                  <RadioChip key={a} label={a} selected={taskingAgent === a} onClick={() => setTaskingAgent(a)} />
                ))}
              </div>
            </ORAField>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mission Parameters</div>

            <ORAField label="Are you fit for duty?">
              <div className="flex gap-3">
                <RadioChip label="Yes" selected={fitForDuty} onClick={() => setFitForDuty(true)} colour="green" />
                <RadioChip label="No"  selected={!fitForDuty} onClick={() => setFitForDuty(false)} colour="red" />
              </div>
              {!fitForDuty && (
                <div className="mt-2 flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                  <XCircle size={13} /> Pilot not fit for duty — mission cannot proceed.
                </div>
              )}
            </ORAField>

            <ORAField label="Type of Operations">
              <div className="flex flex-wrap gap-2">
                {['Medical Transport Ops','Any Operations','Private Operations'].map(t => (
                  <RadioChip key={t} label={t} selected={opsType === t} onClick={() => setOpsType(t)} />
                ))}
              </div>
            </ORAField>

            <ORAField label="Number of Sectors">
              <div className="flex gap-2">
                {SECTORS.map(n => (
                  <button key={n} onClick={() => setNumSectors(n)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold border transition-colors
                      ${numSectors === n ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-background border-border text-muted-foreground hover:border-cyan-500/20'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </ORAField>

            <div className="grid grid-cols-2 gap-3">
              <ORAField label="WICR Infringement (past 7 days)">
                <select value={wicrCount} onChange={e => setWicrCount(e.target.value)} className={sel}>
                  {['N/A','First','Second','Third','Fourth'].map(o => <option key={o}>{o}</option>)}
                </select>
              </ORAField>
              <ORAField label="Revised ORA?">
                <select value={revisedORA} onChange={e => setRevisedORA(e.target.value)} className={sel}>
                  <option>No</option><option>Yes</option>
                </select>
              </ORAField>
            </div>
          </div>
        </div>
      )}

      {/* ── Page 1: Human Factors ────────────────────────────────────────────── */}
      {page === 1 && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Human Factors Considerations</div>

            <ORAField label="Mission Commencement">
              <div className="flex flex-wrap gap-2">
                {['0600-1600','1601-2359','0000-0559'].map(t => (
                  <RadioChip key={t} label={t} selected={hf.commence === t} onClick={() => setHF(h => ({...h, commence: t}))}
                    colour={t === '0000-0559' ? 'amber' : t === '1601-2359' ? 'amber' : 'default'} />
                ))}
              </div>
            </ORAField>

            <ORAField label="Expected Shift Duration (hours)">
              <div className="flex flex-wrap gap-2">
                {['1-4','5-6','7-8','9','10','11','12'].map(t => (
                  <RadioChip key={t} label={t} selected={hf.shiftDuration === t} onClick={() => setHF(h => ({...h, shiftDuration: t}))}
                    colour={parseInt(t) >= 10 ? 'amber' : 'default'} />
                ))}
              </div>
            </ORAField>

            <ORAField label="Prior Duty Free Period">
              <div className="flex flex-wrap gap-2">
                {['12 or more hours','10-11:59 hours','8-9:59 hours'].map(t => (
                  <RadioChip key={t} label={t} selected={hf.priorDutyFree === t} onClick={() => setHF(h => ({...h, priorDutyFree: t}))}
                    colour={t !== '12 or more hours' ? 'amber' : 'default'} />
                ))}
              </div>
            </ORAField>

            <ORAField label="Sleep in Last 24 Hours">
              <div className="flex flex-wrap gap-2">
                {['Less than Normal','Normal','More than Normal'].map(t => (
                  <RadioChip key={t} label={t} selected={hf.sleep === t} onClick={() => setHF(h => ({...h, sleep: t}))}
                    colour={t === 'Less than Normal' ? 'amber' : 'default'} />
                ))}
              </div>
            </ORAField>

            <div className="grid grid-cols-2 gap-3">
              <ORAField label="Previous Shift Flight Time">
                <select value={hf.prevFlightTime} onChange={e => setHF(h => ({...h, prevFlightTime: e.target.value}))} className={sel}>
                  {['0-2.9 hours','3-4.9 hours','5-6.9 hours','7+ hours'].map(o => <option key={o}>{o}</option>)}
                </select>
              </ORAField>
              <ORAField label="FAID Score">
                <select value={hf.faid} onChange={e => setHF(h => ({...h, faid: e.target.value}))} className={sel}>
                  {['0-60','61-70','71-80','81+'].map(o => <option key={o}>{o}</option>)}
                </select>
              </ORAField>
            </div>

            <ORAField label="Additional Considerations — select all that apply">
              <div className="space-y-2">
                {[
                  { key: 'checkedLess60days', label: 'Checked to line less than 60 days' },
                  { key: 'secondTasking',     label: 'Second Tasking' },
                  { key: 'notFlown14days',    label: 'Not flown at base 14 days or more' },
                  { key: 'awake16hrs',        label: '16 hour awake time will infringe projected flight' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox"
                      checked={hf[item.key as keyof HumanFactors] as boolean}
                      onChange={e => setHF(h => ({...h, [item.key]: e.target.checked}))}
                      className="w-4 h-4 rounded border-border accent-cyan-400 cursor-pointer" />
                    <span className="text-sm text-sidebar-foreground/80 group-hover:text-foreground transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </ORAField>
          </div>

          {/* HF score preview */}
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold ${levelColour(hfScore <= 3 ? 'GREEN' : hfScore <= 6 ? 'AMBER' : 'RED')}`}>
            {levelIcon(hfScore <= 3 ? 'GREEN' : hfScore <= 6 ? 'AMBER' : 'RED')}
            Human Factors Score: {hfScore} — {hfScore <= 3 ? 'Low risk' : hfScore <= 6 ? 'Elevated — review before proceeding' : 'High — consult HOFO'}
          </div>
        </div>
      )}

      {/* ── Page 2: Operational Checks ──────────────────────────────────────── */}
      {page === 2 && (
        <div className="space-y-5">
          {/* Sector tabs */}
          {activeSectors.map(sn => {
            const si = sn - 1;
            const r = results[si];
            return (
              <div key={sn} className={`bg-card border rounded-xl overflow-hidden ${
                r.level === 'RED' ? 'border-red-500/30' : r.level === 'AMBER' ? 'border-amber-500/30' : 'border-card-border'
              }`}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/40">
                  <Plane size={14} className="text-cyan-400" />
                  <span className="text-sm font-semibold">Sector {sn}</span>
                  <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${levelColour(r.level)}`}>
                    {levelIcon(r.level)} {r.label}
                  </div>
                </div>

                <div className="p-4 grid md:grid-cols-3 gap-5">
                  {/* Weather */}
                  <CheckGroup title="Weather" items={WEATHER_ITEMS} checks={wxChecks[si]}
                    onToggle={(key) => toggleSectorCheck(wxChecks, setWxChecks, si, key)} />
                  {/* Aerodrome */}
                  <CheckGroup title="Aerodrome" items={AERODROME_ITEMS} checks={adChecks[si]}
                    onToggle={(key) => toggleSectorCheck(adChecks, setAdChecks, si, key)} />
                  {/* T/O & Landing + Route */}
                  <div className="space-y-4">
                    <CheckGroup title="Takeoff & Landing" items={TOL_ITEMS} checks={tolChecks[si]}
                      onToggle={(key) => toggleSectorCheck(tolChecks, setTolChecks, si, key)} />

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Last Sector Route Distance</div>
                      <div className="space-y-1.5">
                        {['0-150 nm','151-250 nm','251-350 nm','351+ nm'].map(d => (
                          <label key={d} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name={`dist-${si}`} value={d} checked={routeDist[si] === d}
                              onChange={() => setRouteDist(prev => prev.map((v, i) => i === si ? d : v))}
                              className="accent-cyan-400" />
                            <span className="text-xs">{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Mitigation */}
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={mitigated[si]}
                        onChange={e => setMitigated(prev => prev.map((v, i) => i === si ? e.target.checked : v))}
                        className="w-4 h-4 mt-0.5 rounded accent-cyan-400" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        Unfamiliar / High Risk Mitigated? <span className="text-cyan-400">(SBP, HOFO or delegate consulted)</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Page 3: Results ─────────────────────────────────────────────────── */}
      {page === 3 && (
        <div className="space-y-4">
          {/* Pilot note */}
          <div className="flex items-start gap-2.5 p-3.5 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-xs text-cyan-300">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <span>The ORA provides an <strong>initial risk picture</strong>. Final go/no-go authority rests entirely with the Pilot in Command. Amber and Red sectors require explicit pilot confirmation before dispatch proceeds.</span>
          </div>

          {/* Per-sector results */}
          <div className="space-y-3">
            {results.map((r, si) => (
              <div key={si} className={`rounded-xl border p-4 ${levelColour(r.level)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {levelIcon(r.level)}
                  <span className="font-semibold text-sm">Sector {si + 1}</span>
                  <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold border ${levelColour(r.level)}`}>{r.label}</span>
                  <span className="text-xs opacity-70">Score: {r.score}</span>
                </div>
                <p className="text-xs opacity-80 mb-3">{r.instruction}</p>

                {/* Pilot must confirm amber/red */}
                {r.level !== "GREEN" && (
                  <label className="flex items-center gap-2.5 cursor-pointer mt-2">
                    <input type="checkbox"
                      checked={!!pilotOverride[si]}
                      onChange={e => setPilotOverride(prev => ({ ...prev, [si]: e.target.checked }))}
                      className="w-4 h-4 accent-cyan-400" />
                    <span className="text-xs font-semibold">
                      {r.level === "AMBER"
                        ? "I, the PIC, have reviewed the elevated risk factors and accept responsibility for proceeding."
                        : "I, the PIC, confirm HOFO / senior management authorisation has been obtained and documented."}
                    </span>
                  </label>
                )}
              </div>
            ))}
          </div>

          {/* Overall status */}
          <div className={`p-4 rounded-xl border font-semibold text-sm flex items-center gap-3 ${levelColour(overallLevel)}`}>
            {levelIcon(overallLevel)}
            <div>
              <div>Overall Mission Risk: {overallLevel}</div>
              <div className="text-xs font-normal opacity-70 mt-0.5">
                {overallLevel === "GREEN" && "All sectors within normal parameters. Cleared to proceed."}
                {overallLevel === "AMBER" && `${results.filter(r => r.level === "AMBER").length} sector(s) elevated. Pilot confirmation required before gate opens.`}
                {overallLevel === "RED"   && `${results.filter(r => r.level === "RED").length} sector(s) high risk. HOFO authorisation + pilot confirmation required.`}
              </div>
            </div>
          </div>

          {/* ORA complete / ready badge */}
          {(() => {
            const needsOverride = results.filter(r => r.level !== "GREEN");
            const allOverridden = needsOverride.every((_, i) => {
              const actualIdx = results.indexOf(needsOverride[i]);
              return !!pilotOverride[actualIdx];
            });
            const oraReady = fitForDuty && (needsOverride.length === 0 || allOverridden);
            return (
              <div className={`flex items-center gap-3 p-4 rounded-xl border font-semibold text-sm ${oraReady ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-muted border-border text-muted-foreground'}`}>
                {oraReady ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <div>
                  <div>{oraReady ? "ORA Complete — Gate Unlocked" : "ORA Incomplete — Gate Locked"}</div>
                  <div className="text-xs font-normal opacity-70 mt-0.5">
                    {oraReady
                      ? `Completed by ${firstName || 'Pilot'} ${lastName || ''} · ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`
                      : !fitForDuty ? "Pilot not fit for duty." : "Complete all required confirmations above."}
                  </div>
                </div>
                {oraReady && (
                  <span className="ml-auto px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-bold">
                    READY FOR DISPATCH
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-cyan-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        {page < pages.length - 1 && (
          <button
            onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 text-background font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const inp = "w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50";
const sel = "w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50";

function ORAField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function RadioChip({ label, selected, onClick, colour = "default" }: {
  label: string; selected: boolean; onClick: () => void; colour?: "default" | "green" | "red" | "amber";
}) {
  const activeClass =
    colour === "green" ? "bg-green-500/20 border-green-500/40 text-green-400"
    : colour === "red"   ? "bg-red-500/20 border-red-500/40 text-red-400"
    : colour === "amber" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
    : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400";
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
        ${selected ? activeClass : 'bg-background border-border text-muted-foreground hover:border-cyan-500/20'}`}>
      {label}
    </button>
  );
}

function CheckGroup({ title, items, checks, onToggle }: {
  title: string;
  items: { key: string; label: string; weight: number }[];
  checks: SectorChecks;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-1.5">
        {items.map(item => (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={!!checks[item.key]} onChange={() => onToggle(item.key)}
              className="w-3.5 h-3.5 rounded accent-cyan-400 flex-shrink-0" />
            <span className={`text-xs transition-colors ${checks[item.key] ? 'text-amber-400' : 'text-sidebar-foreground/70 group-hover:text-foreground'}`}>
              {item.label}
            </span>
            {item.weight >= 2 && (
              <span className="ml-auto text-xs opacity-40">+{item.weight}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
