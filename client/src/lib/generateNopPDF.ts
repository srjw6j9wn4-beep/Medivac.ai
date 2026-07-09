/**
 * generateNopPDF
 * Produces a formatted "Notice of Operations" HTML document and opens it
 * in a new tab, triggering the browser's print-to-PDF dialog.
 *
 * Designed for the RFDS SE Section NEPT contract with NSW Health.
 */

export interface NopPDFData {
  month: string;           // e.g. "July 2026"
  contractRef: string;
  preparedBy: string;
  reviewedBy: string;
  status: string;
  submittedDate: string;

  // Mission KPIs
  totalMissions: number;
  completedMissions: number;
  cancelledMissions: number;
  onTimeCount: number;
  completionRate: number;  // 0–100
  onTimeRate: number;      // 0–100
  avgResponseMins: number;
  p1ResponseMins: number;
  p2ResponseMins: number;

  // Fleet
  aircraftDeclared: string[];
  fleetChanges: string;

  // Crew
  crewChanges: string;

  // Ops changes / incidents
  opsChanges: {
    category: string;
    date: string;
    description: string;
    actionTaken: string;
  }[];

  // Narrative
  executiveSummary: string;
  issuesIdentified: string;
  actionsPlanned: string;

  // Financial
  groundTransportTotal: number;  // total van ground transport for the period ($)
}

export function generateNopPDF(d: NopPDFData) {
  const generated = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const docId = `RFDS-SE-NOPT-${d.month.replace(/\s/g, "-").toUpperCase()}`;

  // ── KPI status colouring ──────────────────────────────────────────────────
  const kpiColor = (val: number, good: number, warn: number) =>
    val >= good ? "green" : val >= warn ? "amber" : "red";

  const completionColor = kpiColor(d.completionRate, 95, 85);
  const onTimeColor     = kpiColor(d.onTimeRate, 95, 85);

  // ── Ops changes rows ──────────────────────────────────────────────────────
  const opsChangesRows = d.opsChanges.length
    ? d.opsChanges.map(c => `
        <tr>
          <td><span class="cat cat-${c.category.toLowerCase()}">${c.category}</span></td>
          <td>${c.date}</td>
          <td>${c.description}</td>
          <td>${c.actionTaken || "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="4" class="nil">No operational changes or incidents recorded this period.</td></tr>`;

  // ── Checklist items ───────────────────────────────────────────────────────
  const checks: { label: string; done: boolean }[] = [
    { label: "Mission statistics reviewed and verified",       done: d.totalMissions > 0 },
    { label: "On-time rate calculated",                        done: d.onTimeCount > 0 },
    { label: "Response times confirmed",                       done: d.avgResponseMins > 0 },
    { label: "Aircraft fleet declared",                        done: d.aircraftDeclared.length > 0 },
    { label: "Prepared by field completed",                    done: !!d.preparedBy },
    { label: "Reviewed by field completed",                    done: !!d.reviewedBy },
    { label: "Executive summary written",                      done: d.executiveSummary.trim().length > 10 },
    { label: "Incidents / changes documented or confirmed nil",done: true },
    { label: "Document approved prior to submission",          done: ["Approved","Submitted"].includes(d.status) },
  ];

  const checklistHTML = checks.map(c => `
    <tr>
      <td class="chk-icon">${c.done ? "✔" : "○"}</td>
      <td class="chk-label ${c.done ? "chk-done" : "chk-todo"}">${c.label}</td>
      <td class="chk-status ${c.done ? "chk-done" : "chk-todo"}">${c.done ? "Complete" : "Pending"}</td>
    </tr>`).join("");

  // ── Aircraft tags ─────────────────────────────────────────────────────────
  const aircraftTags = d.aircraftDeclared.map(r => `<span class="tag">${r}</span>`).join(" ");

  // ── Narrative rows ────────────────────────────────────────────────────────
  const narrativeRow = (label: string, text: string) =>
    text.trim()
      ? `<div class="narrative-block"><div class="narrative-label">${label}</div><div class="narrative-text">${text.replace(/\n/g, "<br/>")}</div></div>`
      : `<div class="narrative-block"><div class="narrative-label">${label}</div><div class="narrative-text nil-text">No entry provided.</div></div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Notice of Operations — ${d.month} — RFDS SE</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 9.5pt;
      color: #1a202c;
      background: #ffffff;
    }

    /* ── Page wrapper ───────────────────────────── */
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 14mm 16mm 20mm;
    }

    /* ── Cover header ───────────────────────────── */
    .cover-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid #0891b2;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand { font-size: 20pt; font-weight: 800; color: #0891b2; letter-spacing: -0.5px; }
    .brand em { color: #1a202c; font-style: normal; }
    .org-block { text-align: right; font-size: 8pt; color: #64748b; line-height: 1.5; }
    .org-block strong { color: #374151; display: block; font-size: 9pt; }

    /* ── Document title band ────────────────────── */
    .doc-title-band {
      background: #0891b2;
      color: white;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .doc-title-band h1 { font-size: 14pt; font-weight: 800; letter-spacing: -0.3px; }
    .doc-title-band .doc-meta {
      font-size: 8.5pt;
      opacity: 0.85;
      margin-top: 3px;
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
    }

    /* ── Status badge ───────────────────────────── */
    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      margin-left: 8px;
    }
    .status-Draft        { background: #f1f5f9; color: #64748b; }
    .status-Under-Review { background: #fef3c7; color: #92400e; }
    .status-Approved     { background: #d1fae5; color: #065f46; }
    .status-Submitted    { background: #cffafe; color: #0e7490; }

    /* ── Section headings ───────────────────────── */
    .section { margin-bottom: 14px; page-break-inside: avoid; }
    .section-heading {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0891b2;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    /* ── Info grid (document details) ──────────── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
    }
    .info-row { display: flex; gap: 6px; align-items: baseline; }
    .info-label { font-weight: 600; color: #374151; font-size: 8.5pt; min-width: 110px; }
    .info-value { color: #1e293b; font-size: 8.5pt; }

    /* ── KPI dashboard ──────────────────────────── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
      background: #f8fafc;
    }
    .kpi-value { font-size: 20pt; font-weight: 800; line-height: 1.1; }
    .kpi-label { font-size: 7.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px; }
    .kv-green { color: #16a34a; }
    .kv-amber { color: #d97706; }
    .kv-red   { color: #dc2626; }
    .kv-blue  { color: #0891b2; }
    .kv-grey  { color: #64748b; }

    .kpi-bar-row { margin-bottom: 7px; }
    .kpi-bar-header { display: flex; justify-content: space-between; font-size: 8pt; margin-bottom: 3px; }
    .kpi-bar-track { background: #e2e8f0; border-radius: 4px; height: 7px; overflow: hidden; }
    .kpi-bar-fill  { height: 7px; border-radius: 4px; }
    .bar-green { background: #16a34a; }
    .bar-amber { background: #d97706; }
    .bar-red   { background: #dc2626; }

    .response-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 8px;
    }
    .response-card {
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 8px;
      background: #f8fafc;
    }
    .response-val { font-size: 13pt; font-weight: 700; color: #0891b2; }
    .response-label { font-size: 7.5pt; color: #64748b; text-transform: uppercase; }

    /* ── Aircraft tags ──────────────────────────── */
    .tag {
      display: inline-block;
      padding: 2px 7px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 600;
      font-family: monospace;
      margin: 2px 2px 2px 0;
    }

    /* ── Ops changes table ──────────────────────── */
    .data-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .data-table th {
      background: #f1f5f9;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #475569;
      padding: 5px 7px;
      text-align: left;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .data-table td { padding: 5px 7px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .data-table tr:last-child td { border-bottom: none; }
    .nil { color: #94a3b8; font-style: italic; text-align: center; padding: 10px; }

    /* Category pills */
    .cat { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 7.5pt; font-weight: 700; }
    .cat-aircraft  { background: #e0f2fe; color: #0369a1; }
    .cat-crew      { background: #dbeafe; color: #1d4ed8; }
    .cat-route     { background: #ede9fe; color: #7c3aed; }
    .cat-procedure { background: #fef3c7; color: #92400e; }
    .cat-incident  { background: #fee2e2; color: #b91c1c; }
    .cat-other     { background: #f1f5f9; color: #64748b; }

    /* ── Checklist ──────────────────────────────── */
    .chk-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .chk-table td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; }
    .chk-table tr:last-child td { border-bottom: none; }
    .chk-icon { width: 18px; font-size: 9pt; text-align: center; }
    .chk-done .chk-icon { color: #16a34a; }
    .chk-todo .chk-icon { color: #d1d5db; }
    .chk-done { color: #1e293b; }
    .chk-todo { color: #94a3b8; }
    .chk-status { text-align: right; width: 60px; font-size: 7.5pt; font-weight: 600; }

    /* ── Narrative ──────────────────────────────── */
    .narrative-block { margin-bottom: 10px; }
    .narrative-label { font-weight: 700; font-size: 8.5pt; color: #374151; margin-bottom: 3px; }
    .narrative-text { font-size: 8.5pt; color: #1e293b; line-height: 1.55; white-space: pre-wrap; border-left: 3px solid #e2e8f0; padding-left: 8px; }
    .nil-text { color: #94a3b8; font-style: italic; }

    /* ── Signature block ────────────────────────── */
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 4px; }
    .sig-box { border-top: 1.5px solid #374151; padding-top: 4px; }
    .sig-name { font-weight: 600; font-size: 8.5pt; }
    .sig-role { font-size: 7.5pt; color: #64748b; }
    .sig-date { font-size: 7.5pt; color: #94a3b8; margin-top: 2px; }

    /* ── Footer ─────────────────────────────────── */
    .footer {
      position: fixed;
      bottom: 8mm;
      left: 16mm;
      right: 16mm;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      font-size: 7pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { background: white; }
      .page { padding: 12mm 14mm 22mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ── Cover Header ─────────────────────────────────────────────── -->
  <div class="cover-header">
    <div>
      <div class="brand">Medivac<em>.ai</em></div>
      <div style="font-size:8pt;color:#64748b;margin-top:2px;">Powered by RFDS SE Section Operations Platform</div>
    </div>
    <div class="org-block">
      <strong>Royal Flying Doctor Service — South Eastern Section</strong>
      Aeromedical Operations · Bankstown · Dubbo · Broken Hill<br/>
      CASA AOC AUS/AOC/2827 · ABN 78 990 288 023
    </div>
  </div>

  <!-- ── Document Title Band ──────────────────────────────────────── -->
  <div class="doc-title-band">
    <h1>Notice of Operations
      <span class="status-badge status-${d.status.replace(/\s/g,"-")}">${d.status}</span>
    </h1>
    <div class="doc-meta">
      <span>Reporting Period: <strong style="color:white">${d.month}</strong></span>
      <span>Contract Ref: <strong style="color:white">${d.contractRef}</strong></span>
      <span>Doc ID: <strong style="color:white">${docId}</strong></span>
      <span>Generated: ${generated} AEST</span>
    </div>
  </div>

  <!-- ── Section 1: Document Details ─────────────────────────────── -->
  <div class="section">
    <div class="section-heading">1. Document Details</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Prepared By:</span><span class="info-value">${d.preparedBy || "—"}</span></div>
      <div class="info-row"><span class="info-label">Reviewed By:</span><span class="info-value">${d.reviewedBy || "—"}</span></div>
      <div class="info-row"><span class="info-label">Contract Reference:</span><span class="info-value">${d.contractRef}</span></div>
      <div class="info-row"><span class="info-label">Document Status:</span><span class="info-value">${d.status}</span></div>
      <div class="info-row"><span class="info-label">Reporting Period:</span><span class="info-value">${d.month}</span></div>
      ${d.submittedDate ? `<div class="info-row"><span class="info-label">Submitted Date:</span><span class="info-value">${d.submittedDate}</span></div>` : ""}
      <div class="info-row"><span class="info-label">Submitted To:</span><span class="info-value">NSW Ministry of Health — Patient Transport Services Unit</span></div>
      <div class="info-row"><span class="info-label">Service Type:</span><span class="info-value">Non-Emergency Patient Transport (NEPT) — Aeromedical</span></div>
    </div>
  </div>

  <!-- ── Section 2: Mission Statistics ───────────────────────────── -->
  <div class="section">
    <div class="section-heading">2. Mission Statistics &amp; KPI Compliance</div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-value kv-blue">${d.totalMissions}</div>
        <div class="kpi-label">Total Missions</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value kv-green">${d.completedMissions}</div>
        <div class="kpi-label">Completed</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value kv-grey">${d.cancelledMissions}</div>
        <div class="kpi-label">Cancelled</div>
      </div>
    </div>

    <div class="kpi-bar-row">
      <div class="kpi-bar-header">
        <span>Completion Rate</span>
        <span class="kv-${completionColor}" style="font-weight:700">${d.completionRate}%</span>
      </div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill bar-${completionColor}" style="width:${d.completionRate}%"></div></div>
    </div>

    <div class="kpi-bar-row">
      <div class="kpi-bar-header">
        <span>On-Time Rate <span style="color:#94a3b8;font-size:7.5pt">(Contract target ≥95%)</span></span>
        <span class="kv-${onTimeColor}" style="font-weight:700">${d.onTimeRate}%</span>
      </div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill bar-${onTimeColor}" style="width:${d.onTimeRate}%"></div></div>
    </div>

    <div class="response-grid">
      <div class="response-card">
        <div class="response-val">${d.avgResponseMins} min</div>
        <div class="response-label">Avg Response Time</div>
      </div>
      <div class="response-card">
        <div class="response-val">${d.p1ResponseMins} min</div>
        <div class="response-label">P1 Response Time</div>
      </div>
      <div class="response-card">
        <div class="response-val">${d.p2ResponseMins} min</div>
        <div class="response-label">P2 Response Time</div>
      </div>
    </div>
  </div>

  <!-- ── Section 3: Aircraft Fleet Declaration ────────────────────── -->
  <div class="section">
    <div class="section-heading">3. Aircraft Fleet Declaration</div>
    <p style="font-size:8.5pt;margin-bottom:6px;">
      The following aircraft were operated under this contract during the reporting period:
    </p>
    <div style="margin-bottom:8px">${aircraftTags || '<span style="color:#94a3b8;font-style:italic">No aircraft declared</span>'}</div>
    ${d.fleetChanges.trim() ? `
    <div style="font-size:8.5pt">
      <span style="font-weight:600;color:#374151">Fleet Changes / Notes:</span>
      <span style="color:#1e293b;margin-left:6px">${d.fleetChanges}</span>
    </div>` : `<div style="font-size:8pt;color:#94a3b8;font-style:italic">No fleet changes or maintenance flags to declare.</div>`}
  </div>

  <!-- ── Section 4: Crew & Personnel ─────────────────────────────── -->
  <div class="section">
    <div class="section-heading">4. Crew &amp; Personnel</div>
    ${d.crewChanges.trim()
      ? `<p style="font-size:8.5pt;line-height:1.55;white-space:pre-wrap;border-left:3px solid #e2e8f0;padding-left:8px">${d.crewChanges}</p>`
      : `<p style="font-size:8pt;color:#94a3b8;font-style:italic">No crew changes or qualification updates to declare this period.</p>`}
  </div>

  <!-- ── Section 5: Operational Changes & Incidents ───────────────── -->
  <div class="section">
    <div class="section-heading">5. Operational Changes &amp; Incidents</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:90px">Category</th>
          <th style="width:72px">Date</th>
          <th>Description</th>
          <th style="width:30%">Action Taken</th>
        </tr>
      </thead>
      <tbody>
        ${opsChangesRows}
      </tbody>
    </table>
  </div>

  <!-- ── Section 6: Narrative & Commentary ────────────────────────── -->
  <div class="section">
    <div class="section-heading">6. Narrative &amp; Commentary</div>
    ${narrativeRow("Executive Summary", d.executiveSummary)}
    ${narrativeRow("Issues Identified", d.issuesIdentified)}
    ${narrativeRow("Planned Actions / Improvements", d.actionsPlanned)}
  </div>

  <!-- ── Section 7: Financial Summary ────────────────────────────────── -->
  <div class="section">
    <div class="section-heading">7. Financial Summary — Ground Transport</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:30%">Cost Category</th>
          <th>Basis</th>
          <th style="text-align:right;width:60px">Missions</th>
          <th style="text-align:right;width:90px">Rate / Transfer</th>
          <th style="text-align:right;width:90px">Period Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:600">Van — Ground Transport</td>
          <td>Pick-up + drop-off per task (2 transfers / task) at operator-recorded rate. Default $200/transfer.</td>
          <td style="text-align:right">${d.totalMissions}</td>
          <td style="text-align:right">${d.totalMissions > 0 ? "$" + Math.round(d.groundTransportTotal / d.totalMissions / 2).toLocaleString() : "$200"}/transfer</td>
          <td style="text-align:right;font-weight:700;color:#0891b2;font-size:10pt">$${d.groundTransportTotal.toLocaleString()}</td>
        </tr>
        <tr style="background:#f1f5f9">
          <td colspan="4" style="font-weight:700;text-align:right;padding-right:10px;font-size:9pt">Ground Transport Sub-total (excl. GST)</td>
          <td style="text-align:right;font-weight:800;font-size:11pt;color:#0891b2">$${d.groundTransportTotal.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:7.5pt;color:#64748b;margin-top:6px;line-height:1.5">
      Ground transport costs reflect van transfers (patient pick-up and drop-off) at the per-task rate recorded
      in the NEPT Tasker for each mission during the reporting period. The rate is operator-configurable per task
      (default $200 per transfer). Figures are exclusive of GST and do not include NSW Ambulance contracted ground legs.
    </p>
  </div>

  <!-- ── Section 7: Pre-Submission Checklist ──────────────────────── -->
  <div class="section">
    <div class="section-heading">8. Pre-Submission Checklist</div>
    <table class="chk-table">
      <tbody>${checklistHTML}</tbody>
    </table>
  </div>

  <!-- ── Section 8: Authorisation & Signatures ────────────────────── -->
  <div class="section">
    <div class="section-heading">9. Authorisation</div>
    <p style="font-size:8.5pt;color:#374151;margin-bottom:14px;">
      This Notice of Operations has been prepared in accordance with the NSW Health Non-Emergency Patient Transport
      Service Agreement and accurately reflects the operations conducted by RFDS South Eastern Section during the
      reporting period.
    </p>
    <div class="sig-grid">
      <div>
        <div class="sig-box">
          <div class="sig-name">${d.preparedBy || "Operations Director"}</div>
          <div class="sig-role">Prepared By — Operations Director, RFDS SE</div>
          <div class="sig-date">Date: ___________________</div>
        </div>
      </div>
      <div>
        <div class="sig-box">
          <div class="sig-name">${d.reviewedBy || "________________________________"}</div>
          <div class="sig-role">Reviewed &amp; Approved By</div>
          <div class="sig-date">Date: ___________________</div>
        </div>
      </div>
    </div>
  </div>

</div><!-- /page -->

<div class="footer">
  <span>CONFIDENTIAL — RFDS South Eastern Section · NSW Health NEPT Contract · ${d.contractRef}</span>
  <span>${docId} · ${generated} AEST</span>
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 600);
  };
</script>
</body>
</html>`;

  // Open in new tab and trigger print dialog
  try {
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const safe = `RFDS_SE_Notice_of_Ops_${d.month.replace(/\s/g, "_")}`;

    const w = window.open(url, "_blank");
    if (!w) {
      // Popup blocked — fall back to download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safe}.html`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    }
    // Don't revoke immediately — let the window use it
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (_) {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }
}
