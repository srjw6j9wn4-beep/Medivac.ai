/**
 * generateCharterQuotePDF
 * Produces a formatted Charter Quick Quote HTML document and opens it in a new
 * tab, triggering the browser's print-to-PDF dialog. Same pattern as
 * generateInvoicePDF.ts.
 */
import type { QuoteCostBreakdown, LegInput } from "./quoteEngine";
import { fmtCents } from "./quoteEngine";

export interface CharterQuotePDFData {
  quoteNumber: string;
  clientName: string;
  clientContact: string | null;
  purpose: string;
  aircraftType: "B200" | "B350";
  departureDate: string;
  legs: LegInput[];
  crew: {
    captain: boolean;
    firstOfficer: boolean;
    flightNurse: boolean;
    flightParamedic: boolean;
    icuDoctor: boolean;
    count: number;
  };
  marginPercent: number;
  notes?: string | null;
}

const AIRCRAFT_LABEL: Record<string, string> = {
  B200: "King Air B200",
  B350: "King Air B350 (Super King Air)",
};

const PURPOSE_LABEL: Record<string, string> = {
  medevac_charter: "Aeromedical Transfer",
  scenic: "Scenic Charter",
  freight: "Freight Charter",
  corporate: "Corporate Charter",
  other: "Other",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO || new Date().toISOString());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function generateCharterQuotePDF(quote: CharterQuotePDFData, breakdown: QuoteCostBreakdown): void {
  const generated = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const validUntil = addDaysISO(new Date().toISOString().slice(0, 10), 30);

  const crewList: string[] = ["Captain"];
  if (quote.crew.firstOfficer) crewList.push("First Officer");
  if (quote.crew.flightNurse) crewList.push("Flight Nurse");
  if (quote.crew.flightParamedic) crewList.push("Flight Paramedic");
  if (quote.crew.icuDoctor) crewList.push("ICU Doctor");

  const routeRows = breakdown.legs.map((lb, i) => `
    <tr>
      <td>Leg ${i + 1}</td>
      <td>${lb.leg.fromICAO} — ${lb.leg.fromName}</td>
      <td style="text-align:center">→</td>
      <td>${lb.leg.toICAO} — ${lb.leg.toName}</td>
      <td style="text-align:right">${lb.leg.distanceNm.toLocaleString("en-AU")} nm</td>
      <td style="text-align:right">${lb.flightHours.toFixed(1)} hrs</td>
      <td style="text-align:center">${lb.leg.departureTime || "—"}</td>
    </tr>`).join("");

  const crewRows = breakdown.crewBreakdown.map(c => `
    <tr>
      <td>${c.role}</td>
      <td style="text-align:center">${c.hours.toFixed(1)} hrs</td>
      <td style="text-align:right">${fmtCents(c.rate)}/hr</td>
      <td style="text-align:right">${fmtCents(c.cost)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Charter Quote ${quote.quoteNumber} — RFDS SE</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 9.5pt;
      color: #1a202c;
      background: #ffffff;
    }

    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 14mm 16mm 20mm;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }

    .cover-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid #01696F;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand { font-size: 20pt; font-weight: 800; color: #01696F; letter-spacing: -0.5px; }
    .brand em { color: #1a202c; font-style: normal; }
    .org-block { text-align: right; font-size: 8pt; color: #64748b; line-height: 1.5; }
    .org-block strong { color: #374151; display: block; font-size: 9pt; }

    .doc-title-band {
      background: #01696F;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .doc-title-band h1 { font-size: 16pt; font-weight: 800; letter-spacing: -0.3px; }
    .doc-title-band .doc-meta {
      font-size: 8.5pt;
      opacity: 0.9;
      margin-top: 4px;
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
    }

    .section { margin-bottom: 14px; page-break-inside: avoid; }
    .section-heading {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #01696F;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
    .info-row { display: flex; gap: 6px; align-items: baseline; }
    .info-label { font-weight: 600; color: #374151; font-size: 8.5pt; min-width: 120px; }
    .info-value { color: #1e293b; font-size: 8.5pt; }

    .bill-to-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .bill-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; background: #f0fdfb; }
    .bill-box .bill-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
    .bill-box .bill-name { font-size: 10pt; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
    .bill-box .bill-line { font-size: 8.5pt; color: #475569; }

    .aircraft-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: #f0fdfb; border: 1px solid #ccf3ef; border-radius: 20px;
      padding: 5px 14px; font-size: 9pt; font-weight: 700; color: #01696F;
    }

    .data-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 6px; }
    .data-table th {
      background: #f1f5f9;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #475569;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .data-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .data-table tr:last-child td { border-bottom: none; }

    .cost-section-title {
      font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
      color: #01696F; margin: 12px 0 4px;
    }
    .cost-line { display: flex; justify-content: space-between; font-size: 8.5pt; padding: 3px 0; }
    .cost-line .desc { color: #374151; }
    .cost-line .amt { font-weight: 600; color: #1e293b; }

    .totals-box { width: 280px; margin-left: auto; margin-top: 10px; }
    .totals-row { display: flex; justify-content: space-between; font-size: 9pt; padding: 5px 0; }
    .totals-row.grand {
      border-top: 2px solid #01696F;
      margin-top: 4px;
      padding-top: 8px;
      font-size: 14pt;
      font-weight: 800;
      color: #01696F;
    }
    .gst-note { font-size: 7.5pt; color: #94a3b8; font-style: italic; margin-top: 4px; text-align: right; }

    .payment-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f8fafc;
      font-size: 8.5pt;
    }
    .payment-box .p-label { font-weight: 600; color: #374151; display: inline-block; min-width: 110px; }

    .sig-line {
      margin-top: 30px;
      display: flex;
      gap: 40px;
    }
    .sig-block { flex: 1; }
    .sig-rule { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 4px; font-size: 8pt; color: #64748b; }

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

<!-- ══════════════════════ PAGE 1 — QUOTE HEADER ══════════════════════ -->
<div class="page">

  <div class="cover-header">
    <div>
      <div class="brand">Medivac<em>.ai</em></div>
      <div style="font-size:8pt;color:#64748b;margin-top:2px;">Royal Flying Doctor Service — South Eastern Section</div>
    </div>
    <div class="org-block">
      <strong>Royal Flying Doctor Service — South Eastern Section</strong>
      Aeromedical Operations · Bankstown · Dubbo · Broken Hill<br/>
      ABN: 18 123 456 789
    </div>
  </div>

  <div class="doc-title-band">
    <h1>Charter Quote</h1>
    <div class="doc-meta">
      <span>Quote No: <strong style="color:white">${quote.quoteNumber}</strong></span>
      <span>Date Issued: ${fmtDate(new Date().toISOString().slice(0,10))}</span>
      <span>Valid Until: ${fmtDate(validUntil)} (30 days)</span>
      <span>Generated: ${generated} AEST</span>
    </div>
  </div>

  <div class="section">
    <div class="section-heading">Client Details</div>
    <div class="bill-to-grid">
      <div class="bill-box">
        <div class="bill-label">Quote Prepared For</div>
        <div class="bill-name">${quote.clientName || "—"}</div>
        <div class="bill-line">${quote.clientContact || "—"}</div>
      </div>
      <div class="bill-box">
        <div class="bill-label">Charter Purpose</div>
        <div class="bill-name">${PURPOSE_LABEL[quote.purpose] || quote.purpose}</div>
        <div class="bill-line">Departure Date: ${fmtDate(quote.departureDate)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-heading">Aircraft &amp; Crew</div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span class="aircraft-chip">✈ ${AIRCRAFT_LABEL[quote.aircraftType]}</span>
      <span style="font-size:8.5pt;color:#64748b;">Total crew on board: <strong style="color:#1e293b;">${crewList.length}</strong> (${crewList.join(", ")})</span>
    </div>
  </div>

  <div class="section">
    <div class="section-heading">Route Summary</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Leg</th><th>From</th><th></th><th>To</th>
          <th style="text-align:right">Distance</th>
          <th style="text-align:right">Flight Time</th>
          <th style="text-align:center">Dep. (Local)</th>
        </tr>
      </thead>
      <tbody>
        ${routeRows}
      </tbody>
    </table>
    <div style="font-size:8pt;color:#64748b;margin-top:6px;">
      Total distance: <strong style="color:#1e293b;">${breakdown.totalDistanceNm.toLocaleString("en-AU")} nm</strong>
      &nbsp;·&nbsp; Total flight time: <strong style="color:#1e293b;">${breakdown.totalFlightHours.toFixed(1)} hrs</strong>
      &nbsp;·&nbsp; Estimated FDP: <strong style="color:#1e293b;">${breakdown.totalFdpHours.toFixed(1)} hrs</strong>
    </div>
  </div>

  ${quote.notes ? `
  <div class="section">
    <div class="section-heading">Notes</div>
    <p style="font-size:8.5pt;line-height:1.55;white-space:pre-wrap;border-left:3px solid #e2e8f0;padding-left:8px">${quote.notes}</p>
  </div>` : ""}

</div><!-- /page 1 -->

<!-- ══════════════════════ PAGE 2 — COST BREAKDOWN ══════════════════════ -->
<div class="page">

  <div class="cover-header">
    <div>
      <div class="brand">Medivac<em>.ai</em></div>
      <div style="font-size:8pt;color:#64748b;margin-top:2px;">Charter Quote ${quote.quoteNumber} — Cost Breakdown</div>
    </div>
    <div class="org-block">
      <strong>Royal Flying Doctor Service — South Eastern Section</strong>
      ABN: 18 123 456 789
    </div>
  </div>

  <div class="section">
    <div class="section-heading">Itemised Cost Breakdown</div>

    <div class="cost-section-title">Aircraft Costs</div>
    <div class="cost-line"><span class="desc">Aircraft hourly rate (${breakdown.totalFlightHours.toFixed(1)} hrs)</span><span class="amt">${fmtCents(breakdown.aircraftCost)}</span></div>
    <div class="cost-line"><span class="desc">Fuel (Jet-A1 @ $1.92/L)</span><span class="amt">${fmtCents(breakdown.subtotals.fuel)}</span></div>

    <div class="cost-section-title">Airservices Australia</div>
    <div class="cost-line"><span class="desc">Enroute nav charges (IFR)</span><span class="amt">${fmtCents(breakdown.subtotals.enroute)}</span></div>
    <div class="cost-line"><span class="desc">Met service surcharge</span><span class="amt">${fmtCents(breakdown.subtotals.met)}</span></div>
    <div class="cost-line"><span class="desc">Terminal nav charges (TNC)</span><span class="amt">${fmtCents(breakdown.subtotals.terminalNav)}</span></div>
    <div class="cost-line"><span class="desc">Out-of-hours surcharge</span><span class="amt">${fmtCents(breakdown.subtotals.outOfHoursSurcharge)}</span></div>

    <div class="cost-section-title">Airport Fees</div>
    <div class="cost-line"><span class="desc">Landing fees (all airports)</span><span class="amt">${fmtCents(breakdown.subtotals.landingFees)}</span></div>

    <div class="cost-section-title">Crew</div>
    <table class="data-table">
      <thead><tr><th>Role</th><th style="text-align:center">FDP Hours</th><th style="text-align:right">Rate</th><th style="text-align:right">Cost</th></tr></thead>
      <tbody>${crewRows}</tbody>
    </table>

    <div class="cost-section-title">Ground &amp; Logistics</div>
    <div class="cost-line"><span class="desc">Ground transport</span><span class="amt">${fmtCents(breakdown.subtotals.groundTransport)}</span></div>
    <div class="cost-line"><span class="desc">Accommodation${breakdown.accommodationRequired ? " (FDP advisory triggered)" : ""}</span><span class="amt">${fmtCents(breakdown.subtotals.accommodation)}</span></div>

    <div class="totals-box">
      <div class="totals-row"><span>Subtotal (incl. GST)</span><span>${fmtCents(breakdown.baseCost)}</span></div>
      <div class="totals-row"><span>Margin (${quote.marginPercent}%)</span><span>${fmtCents(breakdown.margin)}</span></div>
      <div class="totals-row grand"><span>Total Quote</span><span>${fmtCents(breakdown.finalQuote)}</span></div>
    </div>
    <div class="gst-note">All charges include GST. Quote is valid for 30 days from date of issue.</div>
  </div>

  <div class="section">
    <div class="section-heading">Payment Terms</div>
    <div class="payment-box">
      <div><span class="p-label">Payment Terms:</span> Net 14 days from acceptance</div>
      <div><span class="p-label">ABN:</span> 18 123 456 789</div>
      <div><span class="p-label">BSB:</span> 062-000</div>
      <div><span class="p-label">Account:</span> 1234 5678</div>
      <div><span class="p-label">Reference:</span> ${quote.quoteNumber}</div>
    </div>
  </div>

  <div class="sig-line">
    <div class="sig-block">
      <div class="sig-rule">Authorised by — RFDS South Eastern Section</div>
    </div>
    <div class="sig-block">
      <div class="sig-rule">Accepted by — Client Signature &amp; Date</div>
    </div>
  </div>

</div><!-- /page 2 -->

<div class="footer">
  <span>RFDS SE Section — Charter Quick Quote | All charges include GST | Quote valid 30 days from issue</span>
  <span>${quote.quoteNumber} · ${generated} AEST</span>
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 600);
  };
</script>
</body>
</html>`;

  try {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const safe = `RFDS_SE_CharterQuote_${quote.quoteNumber.replace(/[^\w-]/g, "_")}`;

    const w = window.open(url, "_blank");
    if (!w) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safe}.html`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    }
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (_) {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }
}
