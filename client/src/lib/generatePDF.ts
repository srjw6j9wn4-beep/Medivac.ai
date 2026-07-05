/**
 * generatePDF — pure client-side PDF generation.
 * Writes HTML to a Blob URL and opens via <a download> to bypass popup blockers.
 * Falls back to window.open if Blob API unavailable.
 */

export interface PDFSection {
  heading: string;
  rows: { label: string; value: string }[];
}

export interface PDFOptions {
  title: string;
  subtitle?: string;
  date?: string;
  reference?: string;
  sections: PDFSection[];
  footer?: string;
  filename?: string;
}

export function generatePDF(opts: PDFOptions) {
  const now = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const sectionsHTML = opts.sections.map(s => `
    <div class="section">
      <div class="section-heading">${s.heading}</div>
      <table>
        ${s.rows.map(r => `
          <tr>
            <td class="label">${r.label}</td>
            <td class="value">${r.value}</td>
          </tr>
        `).join("")}
      </table>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${opts.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a2e;
      background: white;
      padding: 20mm 18mm;
    }
    .header {
      border-bottom: 3px solid #06b6d4;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .brand {
      font-size: 18pt;
      font-weight: 800;
      color: #06b6d4;
      letter-spacing: -0.5px;
    }
    .brand span { color: #1a1a2e; }
    .org {
      font-size: 8pt;
      color: #64748b;
      text-align: right;
    }
    h1 {
      font-size: 15pt;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 3px;
    }
    .meta {
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
    }
    .meta strong { color: #374151; }
    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section-heading {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #06b6d4;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    tr { border-bottom: 1px solid #f1f5f9; }
    tr:last-child { border-bottom: none; }
    td { padding: 4px 6px; vertical-align: top; }
    td.label {
      width: 38%;
      font-weight: 600;
      color: #374151;
      font-size: 9pt;
    }
    td.value {
      color: #1e293b;
      font-size: 9pt;
    }
    .status-ok { color: #16a34a; font-weight: 600; }
    .status-warn { color: #d97706; font-weight: 600; }
    .status-fail { color: #dc2626; font-weight: 600; }
    .footer {
      position: fixed;
      bottom: 12mm;
      left: 18mm;
      right: 18mm;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 7.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      @page { size: A4; margin: 0; }
      body { padding: 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-row">
      <div class="brand">Medivac<span>.ai</span></div>
      <div class="org">RFDS SE Section<br/>Aeromedical Operations · Dubbo NSW</div>
    </div>
    <h1>${opts.title}</h1>
    <div class="meta">
      ${opts.subtitle ? `<span>${opts.subtitle}</span>` : ""}
      ${opts.date ? `<span><strong>Period:</strong> ${opts.date}</span>` : ""}
      ${opts.reference ? `<span><strong>Ref:</strong> ${opts.reference}</span>` : ""}
      <span><strong>Generated:</strong> ${now} AEST</span>
    </div>
  </div>

  ${sectionsHTML}

  <div class="footer">
    <span>${opts.footer ?? "CONFIDENTIAL — Medivac.ai · RFDS SE Section · Aeromedical Operations"}</span>
    <span>${opts.title} · ${now}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;

  // ── Blob URL approach — bypasses popup blockers ──────────────────────────
  try {
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const safe = (opts.title || "report").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = opts.filename ?? `RFDS_${safe}_${new Date().toISOString().split("T")[0]}.html`;

    const a = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Clean up after short delay
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (_) {
    // Fallback: window.open
    const w = window.open("", "_blank", "width=900,height=700");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }
}
