import { useState } from "react";
import { Brain, TrendingUp, Calendar, MapPin, AlertCircle, CheckCircle2, BarChart3, Plane, Users, Cloud } from "lucide-react";

interface DayForecast {
  date: string;
  dayShort: string;
  predictedMissions: number;
  actualMissions: number | null;
  confidence: number;
  breakdown: { type: string; count: number }[];
  staffingRec: string;
  positioningRec: string | null;
}

interface RegionForecast {
  region: string;
  lhd: string;
  predictedLoad: "low" | "moderate" | "high" | "critical";
  missions7d: number;
  trend: "up" | "stable" | "down";
  topCause: string;
}

const WEEK_FORECAST: DayForecast[] = [
  { date:"Fri 18 Jul", dayShort:"Fri", predictedMissions:8,  actualMissions:null, confidence:87, breakdown:[{type:"IHT Cardiac",count:2},{type:"IHT Trauma",count:1},{type:"NEPT",count:4},{type:"Clinic Run",count:1}], staffingRec:"2 crews Dubbo · 1 Broken Hill · 1 Bankstown", positioningRec:"Pre-position VH-XYJ to Broken Hill (Fri PM)" },
  { date:"Sat 19 Jul", dayShort:"Sat", predictedMissions:6,  actualMissions:null, confidence:82, breakdown:[{type:"IHT Cardiac",count:1},{type:"IHT Trauma",count:2},{type:"NEPT",count:3}], staffingRec:"2 crews Dubbo · 1 Bankstown", positioningRec:null },
  { date:"Sun 20 Jul", dayShort:"Sun", predictedMissions:5,  actualMissions:null, confidence:79, breakdown:[{type:"IHT Cardiac",count:2},{type:"NEPT",count:3}], staffingRec:"1 crew Dubbo · 1 Broken Hill", positioningRec:null },
  { date:"Mon 21 Jul", dayShort:"Mon", predictedMissions:12, actualMissions:null, confidence:91, breakdown:[{type:"IHT Cardiac",count:3},{type:"IHT Trauma",count:2},{type:"NEPT",count:5},{type:"Clinic Run",count:2}], staffingRec:"3 crews Dubbo · 2 Broken Hill · 1 Bankstown · 1 Essendon", positioningRec:"Pre-position VH-NAJ to Dubbo (Mon AM) — Monday peak historically +38%" },
  { date:"Tue 22 Jul", dayShort:"Tue", predictedMissions:11, actualMissions:null, confidence:88, breakdown:[{type:"IHT Cardiac",count:3},{type:"IHT Trauma",count:2},{type:"NEPT",count:5},{type:"Clinic Run",count:1}], staffingRec:"3 crews Dubbo · 1 Broken Hill · 1 Bankstown · 1 Essendon", positioningRec:null },
  { date:"Wed 23 Jul", dayShort:"Wed", predictedMissions:9,  actualMissions:null, confidence:85, breakdown:[{type:"IHT Cardiac",count:2},{type:"IHT Trauma",count:1},{type:"NEPT",count:5},{type:"Clinic Run",count:1}], staffingRec:"2 crews Dubbo · 1 Broken Hill · 1 Bankstown", positioningRec:null },
  { date:"Thu 24 Jul", dayShort:"Thu", predictedMissions:10, actualMissions:null, confidence:84, breakdown:[{type:"IHT Cardiac",count:2},{type:"IHT Trauma",count:2},{type:"NEPT",count:5},{type:"Clinic Run",count:1}], staffingRec:"2 crews Dubbo · 1 Broken Hill · 1 Bankstown · 1 Essendon", positioningRec:null },
];

// Historical actuals for model calibration display
const HISTORICAL = [
  { week:"Wk 27 (Jul 1–7)",  predicted:58, actual:55, accuracy:94.8 },
  { week:"Wk 26 (Jun 24–30)",predicted:52, actual:54, accuracy:96.3 },
  { week:"Wk 25 (Jun 17–23)",predicted:49, actual:47, accuracy:95.9 },
  { week:"Wk 24 (Jun 10–16)",predicted:61, actual:63, accuracy:96.8 },
  { week:"Wk 23 (Jun 3–9)",  predicted:44, actual:45, accuracy:97.8 },
];

const REGION_FORECASTS: RegionForecast[] = [
  { region:"Western NSW",    lhd:"WNSWLHD", predictedLoad:"high",     missions7d:22, trend:"up",     topCause:"Cardiac IHT" },
  { region:"Far West NSW",   lhd:"FWLHD",   predictedLoad:"moderate", missions7d:14, trend:"stable", topCause:"NEPT (renal)" },
  { region:"Hunter / NE",    lhd:"HNELHD",  predictedLoad:"moderate", missions7d:11, trend:"stable", topCause:"Trauma IHT" },
  { region:"Victoria",       lhd:"VIC",     predictedLoad:"low",      missions7d:7,  trend:"down",   topCause:"NEPT" },
  { region:"Tasmania",       lhd:"TAS",     predictedLoad:"low",      missions7d:5,  trend:"stable", topCause:"Cardiac IHT" },
];

const LOAD_CFG = {
  low:      { color:"text-green-400",  bg:"bg-green-500/10 border-green-500/20",  label:"Low" },
  moderate: { color:"text-amber-400",  bg:"bg-amber-500/10 border-amber-500/20",  label:"Moderate" },
  high:     { color:"text-orange-400", bg:"bg-orange-500/10 border-orange-500/20",label:"High" },
  critical: { color:"text-red-400",    bg:"bg-red-500/10 border-red-500/20",      label:"Critical" },
};

const MODEL_FEATURES = [
  "Mission type (IHT / NEPT / Clinic)",
  "Origin hospital & referring LHD",
  "Destination hospital",
  "Day of week (Monday +38% vs baseline)",
  "Time of day distribution",
  "Season / month",
  "Weather (BOM API — visibility, crosswind)",
  "Public holiday calendar",
  "Historical 3-year rolling dataset",
  "Referring hospital admission rates",
];

type Tab = "forecast" | "regions" | "model";

export default function DemandForecasting() {
  const [activeTab, setActiveTab] = useState<Tab>("forecast");
  const [selectedDay, setSelectedDay] = useState<number>(0);

  const day = WEEK_FORECAST[selectedDay];
  const totalPredicted = WEEK_FORECAST.reduce((s, d) => s + d.predictedMissions, 0);
  const avgConfidence = Math.round(WEEK_FORECAST.reduce((s, d) => s + d.confidence, 0) / WEEK_FORECAST.length);
  const positioningRecs = WEEK_FORECAST.filter(d => d.positioningRec);

  const maxBarMissions = Math.max(...WEEK_FORECAST.map(d => d.predictedMissions));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-cyan-400" />
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Predictive Mission Demand Forecasting</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI model trained on 3-year RFDS SE mission history · 10 predictor variables · 7-day rolling forecast · No equivalent globally
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-3 py-1.5">
          <Brain size={11} />
          Model accuracy: 96.3% (Wk 26)
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"7-Day Forecast",    value:`${totalPredicted} missions`,   color:"text-cyan-400",  icon:<Calendar size={15} className="text-cyan-400" /> },
          { label:"Avg Confidence",    value:`${avgConfidence}%`,            color:"text-green-400", icon:<Brain size={15} className="text-green-400" /> },
          { label:"Positioning Alerts",value:`${positioningRecs.length}`,    color:"text-amber-400", icon:<Plane size={15} className="text-amber-400" /> },
          { label:"Peak Day",          value:"Mon 21 Jul (12)",              color:"text-orange-400",icon:<TrendingUp size={15} className="text-orange-400" /> },
        ].map(k => (
          <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">{k.icon}<span className="text-xs text-muted-foreground">{k.label}</span></div>
            <div className={`text-xl font-bold ${k.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key:"forecast", label:"7-Day Forecast" },
          { key:"regions",  label:"Regional Load" },
          { key:"model",    label:"Model Details" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px
              ${activeTab === t.key ? "border-cyan-500 text-cyan-400" : "border-transparent text-muted-foreground hover:text-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 7-Day Forecast Tab */}
      {activeTab === "forecast" && (
        <div className="space-y-4">
          {/* Bar chart day selector */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Mission Volume Forecast — Next 7 Days</h3>
            <div className="flex items-end gap-3">
              {WEEK_FORECAST.map((d, i) => {
                const pct = (d.predictedMissions / maxBarMissions) * 100;
                const isSelected = selectedDay === i;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer"
                    onClick={() => setSelectedDay(i)}>
                    <span className="text-[10px] font-semibold text-slate-300">{d.predictedMissions}</span>
                    <div className={`w-full rounded-t transition-all ${isSelected ? "bg-cyan-500" : "bg-cyan-900/60 hover:bg-cyan-800/60"}`}
                      style={{ height: `${Math.max(pct * 0.9, 8)}px` }} />
                    <span className={`text-[10px] ${isSelected ? "text-cyan-400 font-bold" : "text-slate-500"}`}>{d.dayShort}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">{day.date}</h3>
                <p className="text-xs text-muted-foreground">Predicted: {day.predictedMissions} missions · Confidence: {day.confidence}%</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${day.confidence}%` }} />
                </div>
                {day.confidence}% confident
              </div>
            </div>

            {/* Mission breakdown */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Predicted mission types</p>
              <div className="flex flex-wrap gap-2">
                {day.breakdown.map(b => (
                  <div key={b.type} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-center">
                    <div className="text-lg font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{b.count}</div>
                    <div className="text-[10px] text-slate-400">{b.type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staffing recommendation */}
            <div className="bg-slate-900/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1"><Users size={12} className="text-cyan-400" />Staffing Recommendation</div>
              <p className="text-sm text-slate-200">{day.staffingRec}</p>
            </div>

            {/* Positioning alert */}
            {day.positioningRec && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3">
                <Plane size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-400 mb-0.5">Positioning Recommendation</div>
                  <div className="text-sm text-amber-200">{day.positioningRec}</div>
                </div>
              </div>
            )}
          </div>

          {/* All positioning recommendations */}
          {positioningRecs.length > 1 && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">All Positioning Recommendations This Week</h3>
              <div className="space-y-2">
                {positioningRecs.map(d => (
                  <div key={d.date} className="flex items-start gap-2 text-sm">
                    <Plane size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-slate-500 w-20 shrink-0">{d.dayShort}</span>
                    <span className="text-slate-300">{d.positioningRec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regional Load Tab */}
      {activeTab === "regions" && (
        <div className="space-y-3">
          {REGION_FORECASTS.map(r => {
            const lc = LOAD_CFG[r.predictedLoad];
            const trendIcon = r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "→";
            const trendColor = r.trend === "up" ? "text-orange-400" : r.trend === "down" ? "text-green-400" : "text-slate-400";
            return (
              <div key={r.region} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
                <MapPin size={16} className="text-cyan-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-100">{r.region}</div>
                  <div className="text-xs text-muted-foreground">{r.lhd} · Top cause: {r.topCause}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-200">{r.missions7d} missions</div>
                  <div className="text-[10px] text-muted-foreground">next 7 days</div>
                </div>
                <span className={`text-lg font-bold ${trendColor}`}>{trendIcon}</span>
                <span className={`text-[11px] px-2.5 py-1 rounded-full border ${lc.bg} ${lc.color}`}>{lc.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Details Tab */}
      {activeTab === "model" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature list */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Brain size={14} className="text-cyan-400" />Predictor Variables</h3>
              <div className="space-y-1.5">
                {MODEL_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={11} className="text-cyan-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Historical accuracy */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-cyan-400" />Historical Accuracy</h3>
              <div className="space-y-3">
                {HISTORICAL.map(h => (
                  <div key={h.week}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{h.week}</span>
                      <span className="text-green-400 font-semibold">{h.accuracy}%</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-slate-500">
                      <span>Predicted: {h.predicted}</span>
                      <span>Actual: {h.actual}</span>
                      <span>Δ {Math.abs(h.predicted - h.actual)}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${h.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
                Model retrained weekly on rolling 3-year RFDS SE mission dataset (n=4,847 missions)
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-sm text-cyan-200">
              <span className="font-semibold">Unique capability:</span> No competitor aeromedical platform (Leon Software, FL3XX, HEMS Ops, Medaero, Flightman, VectorCare, RapidSOS UNITE, or Juvare) offers predictive mission demand forecasting trained on operational data. This is a genuine AI moat for Medivac.ai.
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        Model: Gradient Boosted Trees (XGBoost) · Training data: RFDS SE 2023–2026 · Weather: BOM API · Retrained weekly · Demo: simulated outputs
      </div>
    </div>
  );
}
