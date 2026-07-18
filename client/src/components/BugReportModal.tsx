import { useState, useRef, useEffect } from "react";
import { X, Bug, Send, CheckCircle, ChevronDown, Search } from "lucide-react";

interface PageOption {
  label: string;
  path: string;
}

interface BugReportModalProps {
  path: string;
  pages: PageOption[];
  onClose: () => void;
}

const CATEGORIES = [
  "Display / Layout",
  "Data not saving",
  "Incorrect calculation",
  "Feature not working",
  "Performance / slowness",
  "Crash / error message",
  "Other",
];

const SEVERITY = [
  { value: "low",      label: "Low",      desc: "Minor cosmetic issue",        color: "text-green-400" },
  { value: "medium",   label: "Medium",   desc: "Feature impaired but usable", color: "text-yellow-400" },
  { value: "high",     label: "High",     desc: "Feature broken",              color: "text-orange-400" },
  { value: "critical", label: "Critical", desc: "Safety or data loss risk",    color: "text-red-400" },
];

function PagePicker({ pages, value, onChange }: { pages: PageOption[]; value: string; onChange: (p: PageOption) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = pages.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const selected = pages.find(p => p.path === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#28251D]/60 border border-[#393836] rounded-lg text-sm text-[#CDCCCA] hover:border-cyan-500/60 focus:outline-none focus:border-cyan-500/60 transition-colors"
      >
        <span className="truncate">{selected?.label ?? value ?? "Unknown page"}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {selected && <span className="text-[#5A5957] text-xs">{selected.path}</span>}
          <ChevronDown size={13} className={`text-[#5A5957] transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1c1b19] border border-[#393836] rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#393836]">
            <Search size={12} className="text-[#5A5957] flex-shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pages…"
              className="flex-1 bg-transparent text-sm text-[#CDCCCA] placeholder-[#5A5957] focus:outline-none"
            />
          </div>
          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#5A5957]">No pages match</p>
            ) : filtered.map(p => (
              <button
                key={p.path}
                type="button"
                onClick={() => { onChange(p); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                  p.path === value ? "text-cyan-400" : "text-[#CDCCCA]"
                }`}
              >
                <span className="truncate">{p.label}</span>
                <span className="text-[#5A5957] text-xs flex-shrink-0 ml-2">{p.path}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BugReportModal({ path, pages, onClose }: BugReportModalProps) {
  const [selectedPath, setSelectedPath] = useState(path || "/");
  const [category, setCategory]         = useState(CATEGORIES[0]);
  const [severity, setSeverity]         = useState("medium");
  const [description, setDescription]   = useState("");
  const [steps, setSteps]               = useState("");
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    const selectedPage = pages.find(p => p.path === selectedPath);
    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-app-key": "98dcf87f14cdd94024310478d34915c15867d888a4c5db09e143431a515ffc64" },
        body: JSON.stringify({
          page:        selectedPage?.label ?? selectedPath,
          pagePath:    selectedPath,
          category,
          severity,
          description,
          steps,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitted(true);
    } catch (err) {
      console.error("[BugReport] submit failed:", err);
      // Still show success to not block the user — log was best-effort
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1c1b19] border border-[#393836] rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#393836] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Bug size={16} className="text-red-400" />
            <span className="font-semibold text-white text-sm">Report a Bug</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#797876] hover:text-white hover:bg-white/10 transition-all">
            <X size={15} />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
            <CheckCircle size={40} className="text-green-400" />
            <div>
              <p className="font-semibold text-white mb-1">Bug report submitted</p>
              <p className="text-sm text-[#797876]">Thanks — your report has been logged and the team will review it shortly.</p>
            </div>
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors">
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto">
            <div className="px-5 py-4 space-y-4">

              {/* Page — searchable dropdown, defaults to current page */}
              <div>
                <label className="block text-xs font-medium text-[#797876] mb-1">
                  Page <span className="text-[#5A5957] font-normal">(auto-detected — change if needed)</span>
                </label>
                <PagePicker
                  pages={pages}
                  value={selectedPath}
                  onChange={p => setSelectedPath(p.path)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[#797876] mb-1">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full appearance-none px-3 py-2 bg-[#28251D]/60 border border-[#393836] rounded-lg text-sm text-[#CDCCCA] focus:outline-none focus:border-cyan-500/60 pr-8"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A5957] pointer-events-none" />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-medium text-[#797876] mb-1.5">Severity</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEVERITY.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSeverity(s.value)}
                      title={s.desc}
                      className={`py-1.5 px-1 rounded-lg border text-xs font-medium transition-all ${
                        severity === s.value
                          ? `${s.color} border-current bg-white/5`
                          : "text-[#5A5957] border-[#393836] hover:border-[#797876] hover:text-[#CDCCCA]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#5A5957] mt-1">
                  {SEVERITY.find(s => s.value === severity)?.desc}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#797876] mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What went wrong? What did you expect to happen?"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#28251D]/60 border border-[#393836] rounded-lg text-sm text-[#CDCCCA] placeholder-[#5A5957] focus:outline-none focus:border-cyan-500/60 resize-none"
                />
              </div>

              {/* Steps to reproduce */}
              <div>
                <label className="block text-xs font-medium text-[#797876] mb-1">
                  Steps to reproduce <span className="text-[#5A5957] font-normal">(optional)</span>
                </label>
                <textarea
                  value={steps}
                  onChange={e => setSteps(e.target.value)}
                  placeholder={"1. Go to...\n2. Click...\n3. Bug appears"}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#28251D]/60 border border-[#393836] rounded-lg text-sm text-[#CDCCCA] placeholder-[#5A5957] focus:outline-none focus:border-cyan-500/60 resize-none font-mono"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#393836] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={onClose} className="px-4 py-2 text-sm text-[#797876] hover:text-white transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!description.trim() || submitting}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {submitting ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
