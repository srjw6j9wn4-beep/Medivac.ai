import { useState } from "react";
import { X, Bug, Send, CheckCircle, ChevronDown } from "lucide-react";

interface BugReportModalProps {
  path: string;
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
  { value: "low",      label: "Low",      desc: "Minor cosmetic issue",         color: "text-green-400" },
  { value: "medium",   label: "Medium",   desc: "Feature impaired but usable",  color: "text-yellow-400" },
  { value: "high",     label: "High",     desc: "Feature broken",               color: "text-orange-400" },
  { value: "critical", label: "Critical", desc: "Safety or data loss risk",      color: "text-red-400" },
];

export default function BugReportModal({ path, onClose }: BugReportModalProps) {
  const [category, setCategory]   = useState(CATEGORIES[0]);
  const [severity, setSeverity]   = useState("medium");
  const [description, setDescription] = useState("");
  const [steps, setSteps]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pageName = path
    .replace(/^\//, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) || "Dashboard";

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    // Small artificial delay so it feels like it's doing something
    await new Promise(r => setTimeout(r, 600));
    // In production wire this to an API endpoint or email
    // For now we log to console and show confirmation
    console.log("[BUG REPORT]", { page: path, category, severity, description, steps, ts: new Date().toISOString() });
    setSubmitting(false);
    setSubmitted(true);
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
          /* ── Confirmation ── */
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
            <CheckCircle size={40} className="text-green-400" />
            <div>
              <p className="font-semibold text-white mb-1">Bug report submitted</p>
              <p className="text-sm text-[#797876]">Thanks — your report has been logged. The team will review it shortly.</p>
            </div>
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors">
              Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="flex flex-col overflow-y-auto">
            <div className="px-5 py-4 space-y-4">

              {/* Page (auto-detected, read-only) */}
              <div>
                <label className="block text-xs font-medium text-[#797876] mb-1">Page</label>
                <div className="px-3 py-2 bg-[#28251D]/60 border border-[#393836] rounded-lg text-sm text-[#CDCCCA]">
                  {pageName} <span className="text-[#5A5957] ml-1 text-xs">{path || "/"}</span>
                </div>
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
