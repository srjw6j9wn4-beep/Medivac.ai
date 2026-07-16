import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  Search, FileText, Download, BookOpen, Clock,
  Shield, Plane, Heart, Wrench, DollarSign, Users, X,
  Maximize2, Minimize2, Eye, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";

// ── PDF.js worker (use CDN for the worker script to avoid bundling issues) ────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Document {
  id: string;
  title: string;
  code: string;
  category: string;
  description: string;
  audience: string[];
  tags: string[];
  pages: number;
  issued: string;
  reviewDue: string;
  filename: string;
  color: string;
  icon: React.ReactNode;
}

const DOCS: Document[] = [
  {
    id: "user-manual",
    title: "Medivac.ai User Manual",
    code: "MAN-001",
    category: "Operator Manual",
    description: "Comprehensive guide to all Medivac.ai platform modules — dashboards, missions, operations, assets, crew, clinical, AI tools, business, and administration. Covers all 10 navigation groups and 52 modules.",
    audience: ["All Users"],
    tags: ["manual", "overview", "platform", "all modules", "guide", "how to", "training", "onboarding", "navigation", "dashboard", "dispatch", "roster", "invoicing", "admin", "clinical", "crew", "assets"],
    pages: 36,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "medivac_user_manual.pdf",
    color: "#01696F",
    icon: <BookOpen size={18} />,
  },
  {
    id: "sop-dispatch",
    title: "Dispatch & Intake Operations",
    code: "SOP-OPS-001",
    category: "Standard Operating Procedure",
    description: "Standard operating procedures for dispatch and intake operations — NEPT tasking, mission initiation, patient intake, multiload rules, charter quoting, compliance checks, and after-hours escalation.",
    audience: ["Dispatchers", "Operations Managers"],
    tags: ["dispatch", "intake", "nept", "tasking", "charter", "mission", "quote", "operations", "ops", "multiload", "escalation", "after-hours", "compliance", "sop"],
    pages: 17,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "sop_dispatch.pdf",
    color: "#155e75",
    icon: <Shield size={18} />,
  },
  {
    id: "sop-pilots",
    title: "Pilot Operations",
    code: "SOP-FLT-001",
    category: "Standard Operating Procedure",
    description: "Flight crew standard operating procedures — pre-mission workflow, fleet performance reference, in-flight procedures, post-flight documentation, fatigue management, currency and training, and emergency procedures.",
    audience: ["Pilots", "Senior Base Pilots"],
    tags: ["pilot", "flight", "crew", "performance", "b200", "b350", "pc24", "fatigue", "frms", "training", "currency", "handover", "emergency", "abnormal", "sop", "pre-flight", "post-flight"],
    pages: 14,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "sop_pilots.pdf",
    color: "#1e40af",
    icon: <Plane size={18} />,
  },
  {
    id: "sop-nurses",
    title: "Flight Nurse Operations",
    code: "SOP-CLN-001",
    category: "Standard Operating Procedure",
    description: "Clinical nursing standard operating procedures — patient assessment, aeromedical considerations, medical equipment management, in-flight clinical care, handover documentation, and stock management.",
    audience: ["Flight Nurses", "Clinical Managers"],
    tags: ["nurse", "nursing", "clinical", "patient", "assessment", "aeromedical", "medication", "equipment", "handover", "stock", "orders", "flight nurse", "sop", "clinical care", "oxygen"],
    pages: 12,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "sop_nurses.pdf",
    color: "#9d174d",
    icon: <Heart size={18} />,
  },
  {
    id: "sop-doctors",
    title: "Flight Doctor Operations",
    code: "SOP-CLN-002",
    category: "Standard Operating Procedure",
    description: "Medical officer standard operating procedures — clinical decision-making, aeromedical assessment, in-flight medical management, telehealth consultation, and after-hours AI med line usage.",
    audience: ["Flight Doctors", "Medical Officers"],
    tags: ["doctor", "medical officer", "physician", "clinical", "aeromedical", "telehealth", "ai med line", "after-hours", "decision", "assessment", "sop", "medical", "oxygen"],
    pages: 12,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "sop_doctors.pdf",
    color: "#9d174d",
    icon: <Heart size={18} />,
  },
  {
    id: "sop-engineering",
    title: "Engineering & Maintenance",
    code: "SOP-ENG-001",
    category: "Standard Operating Procedure",
    description: "Engineering and maintenance standard operating procedures — tech log completion, defect reporting, scheduled maintenance, airworthiness management, ground vehicle servicing, and regulatory compliance.",
    audience: ["Engineers", "Maintenance Technicians"],
    tags: ["engineering", "maintenance", "tech log", "defect", "airworthiness", "scheduled maintenance", "maint planner", "ground vehicle", "regulatory", "compliance", "sop", "aircraft"],
    pages: 10,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "sop_engineering.pdf",
    color: "#9a3412",
    icon: <Wrench size={18} />,
  },
  {
    id: "sop-finance",
    title: "Finance & Business Operations",
    code: "SOP-BUS-001",
    category: "Standard Operating Procedure",
    description: "Finance and business operations procedures — invoicing workflows, fee reconciliation, payroll and leave, cost reporting, government tender submissions, contract compliance, and audit preparation.",
    audience: ["Finance Team", "Business Managers", "Administration"],
    tags: ["finance", "invoicing", "billing", "reconciliation", "payroll", "leave", "cost", "tender", "contract", "compliance", "audit", "business", "administration", "sop", "revenue"],
    pages: 10,
    issued: "July 2026",
    reviewDue: "July 2027",
    filename: "sop_finance.pdf",
    color: "#92400e",
    icon: <DollarSign size={18} />,
  },
];

const CATEGORY_ORDER = ["Operator Manual", "Standard Operating Procedure"];

function apiBase(): string {
  return window.location.hostname.endsWith(".pplx.app") ? "/port/5000" : "";
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-cyan-400/25 text-cyan-200 rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  );
}

function handleWatermarkedDownload(doc: Document) {
  const a = document.createElement("a");
  a.href = `${apiBase()}/api/docs/download/${encodeURIComponent(doc.filename)}`;
  a.download = `${doc.code} — ${doc.title} (Uncontrolled).pdf`;
  a.click();
}

// ── PDF.js canvas viewer ──────────────────────────────────────────────────────
function PDFViewer({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Load PDF — fetch bytes ourselves first so we bypass CORS/proxy quirks on pplx.app,
  // then hand the raw ArrayBuffer directly to PDF.js (no second fetch needed).
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPdf(null);
    setPageNum(1);
    let cancelled = false;

    const url = `${apiBase()}/docs/view/${encodeURIComponent(doc.filename)}`;

    fetch(url, { credentials: "same-origin" })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buf => {
        if (cancelled) return;
        const task = pdfjsLib.getDocument({ data: buf });
        return task.promise;
      })
      .then(pdfDoc => {
        if (cancelled || !pdfDoc) return;
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error("PDF load error:", err);
        setError("Could not load document. Please try again.");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [doc.filename]);

  // Render page
  const renderPage = useCallback(async (pdfDoc: pdfjsLib.PDFDocumentProxy, num: number, sc: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      await renderTaskRef.current.cancel().catch(() => {});
      renderTaskRef.current = null;
    }

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: sc });
    const ctx = canvas.getContext("2d")!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") console.error("Render error:", e);
    }
    renderTaskRef.current = null;
  }, []);

  useEffect(() => {
    if (pdf) renderPage(pdf, pageNum, scale);
  }, [pdf, pageNum, scale, renderPage]);

  const prev = () => setPageNum(p => Math.max(1, p - 1));
  const next = () => setPageNum(p => Math.min(totalPages, p + 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`flex flex-col bg-[#171614] border border-[#393836] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          expanded ? "w-full h-full rounded-none" : "w-full max-w-4xl h-[92vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#393836] bg-[#1C1B19] flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: doc.color + "33", color: doc.color }}
          >
            {doc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: doc.color }}>
              {doc.code}
            </div>
            <div className="text-sm font-bold text-[#CDCCCA] truncate" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {doc.title}
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded-full px-2.5 py-1 flex-shrink-0">
            <Eye size={9} /> Controlled — watermark applied on download
          </span>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876] hover:text-[#CDCCCA] transition-colors" title={expanded ? "Restore" : "Expand"}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876] hover:text-[#CDCCCA] transition-colors" title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[#111110] flex flex-col items-center py-4 px-2 gap-3">
          {loading && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <Loader2 size={28} className="text-[#4F98A3] animate-spin" />
              <span className="text-xs text-muted-foreground">Loading document…</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
              <div className="text-3xl">⚠️</div>
              <p className="text-sm font-semibold text-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">The document may still be loading on the server. Try closing and reopening.</p>
            </div>
          )}
          {!loading && !error && (
            <canvas
              ref={canvasRef}
              className="rounded shadow-lg max-w-full"
              style={{ display: "block" }}
            />
          )}
        </div>

        {/* Footer controls */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#393836] bg-[#1C1B19] flex-shrink-0 gap-2">
            {/* Page nav */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prev}
                disabled={pageNum <= 1}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[#797876] hover:text-[#CDCCCA] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums min-w-[60px] text-center">
                {pageNum} / {totalPages}
              </span>
              <button
                onClick={next}
                disabled={pageNum >= totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[#797876] hover:text-[#CDCCCA] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))} className="px-2 py-1 rounded text-[10px] hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">−</button>
              <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="px-2 py-1 rounded text-[10px] hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">+</button>
            </div>

            {/* Meta + download */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-[10px] text-[#5A5957]">
                {doc.pages}pp · {doc.issued} · Review {doc.reviewDue}
              </span>
              <button
                onClick={() => handleWatermarkedDownload(doc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-[#797876] hover:text-[#CDCCCA] transition-all"
              >
                <Download size={10} /> Download (watermarked)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Document Card ─────────────────────────────────────────────────────────────
function DocCard({ doc, query, onView }: { doc: Document; query: string; onView: () => void }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: doc.color + "33", color: doc.color }}>
          {doc.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: doc.color + "22", color: doc.color }}>
              {doc.code}
            </span>
            <span className="text-[10px] text-muted-foreground">{doc.category}</span>
          </div>
          <h3 className="text-sm font-bold text-foreground mt-1 leading-snug" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {highlight(doc.title, query)}
          </h3>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{highlight(doc.description, query)}</p>

      <div className="flex flex-wrap gap-1.5">
        {doc.audience.map(a => (
          <span key={a} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
            <Users size={9} /> {a}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-card-border pt-3 mt-auto">
        <span className="flex items-center gap-1"><FileText size={10} /> {doc.pages} pages</span>
        <span className="flex items-center gap-1"><Clock size={10} /> Issued {doc.issued}</span>
        <span className="flex items-center gap-1 ml-auto" style={{ color: "#f59e0b" }}>
          <Clock size={10} /> Review {doc.reviewDue}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border"
          style={{ backgroundColor: doc.color + "18", borderColor: doc.color + "44", color: doc.color }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = doc.color + "30"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = doc.color + "18"; }}
        >
          <Eye size={11} /> View
        </button>
        <button
          onClick={() => handleWatermarkedDownload(doc)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all"
          title="Download with UNCONTROLLED COPY watermark"
        >
          <Download size={11} /> Download
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentLibrary() {
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Document | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return DOCS;
    return DOCS.filter(doc =>
      doc.title.toLowerCase().includes(q) ||
      doc.code.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.audience.some(a => a.toLowerCase().includes(q)) ||
      doc.tags.some(t => t.includes(q))
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<string, Document[]> = {};
    for (const cat of CATEGORY_ORDER) {
      const docs = filtered.filter(d => d.category === cat);
      if (docs.length) map[cat] = docs;
    }
    return map;
  }, [filtered]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {viewing && <PDFViewer doc={viewing} onClose={() => setViewing(null)} />}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={16} className="text-slate-400" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Administration</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Manuals & SOPs
        </h1>
        <p className="text-sm text-muted-foreground">
          Operator manuals and standard operating procedures for RFDS SE Medivac.ai.
          All documents are Draft 1 — issued July 2026, next review July 2027.
        </p>
      </div>

      <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300/80">
        <Eye size={13} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          <span className="font-semibold">Document control:</span> Documents viewed in-app are controlled copies.
          All downloaded PDFs are automatically stamped <span className="font-semibold">UNCONTROLLED COPY</span> — verify currency before operational use.
        </p>
      </div>

      <div className="relative mb-6">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by keyword, role, procedure, module name…"
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-card-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#4F98A3]/60 focus:ring-1 focus:ring-[#4F98A3]/30 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
        )}
      </div>

      {query && (
        <div className="mb-4 text-xs text-muted-foreground">
          {filtered.length === 0 ? `No documents match "${query}"` : `${filtered.length} of ${DOCS.length} documents match "${query}"`}
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={32} className="text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm font-semibold text-foreground mb-1">No documents found</p>
          <p className="text-xs text-muted-foreground">Try "dispatch", "pilot", "invoice", "fatigue", or "compliance"</p>
          <button onClick={() => setQuery("")} className="mt-4 text-xs text-[#4F98A3] hover:underline">Clear search</button>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, docs]) => (
          <div key={cat} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}s</h2>
              <div className="flex-1 h-px bg-card-border" />
              <span className="text-[10px] text-muted-foreground">{docs.length} document{docs.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {docs.map(doc => (
                <DocCard key={doc.id} doc={doc} query={query} onView={() => setViewing(doc)} />
              ))}
            </div>
          </div>
        ))
      )}

      <div className="mt-4 pt-4 border-t border-card-border text-[10px] text-muted-foreground flex items-center justify-between">
        <span>All documents are uncontrolled when printed. Verify currency before operational use.</span>
        <span className="flex items-center gap-1"><Clock size={9} /> Annual review cycle</span>
      </div>
    </div>
  );
}
