/**
 * generateInvoicePDF
 * Produces a formatted NSW Health / Private NEPT invoice HTML document and opens
 * it in a new tab, triggering the browser's print-to-PDF dialog.
 *
 * Designed for the RFDS SE Section NEPT contract with NSW Health, following the
 * same pattern as generateNopPDF.ts.
 */

export interface InvoicePDFData {
  invoiceNumber: string;
  invoiceDate: string;      // ISO yyyy-mm-dd
  dueDate: string;          // ISO yyyy-mm-dd
  serviceDate: string;      // ISO yyyy-mm-dd
  status: string;           // Draft | Submitted | Paid | Overdue

  payerType: "nsw_health" | "private";
  payerName: string;

  taskRef: string | null;
  patientId: string | null;
  pickupLocation: string | null;
  destination: string | null;
  aircraftReg: string | null;
  missionType: string;

  baseAmountCents: number;
  afterHoursSurchargeCents: number;
  additionalChargesCents: number;
  gstAmountCents: number;
  totalAmountCents: number;

  notes: string | null;
}

function fmtAUD(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export function generateInvoicePDF(d: InvoicePDFData) {
  const generated = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const payerLabel = d.payerType === "nsw_health" ? "NSW Health (NEPT Funder)" : "Private / Insurance";

  const lineItems: { desc: string; qty: number; amount: number }[] = [
    { desc: `${d.missionType} — Aeromedical NEPT Transport`, qty: 1, amount: d.baseAmountCents },
  ];
  if (d.afterHoursSurchargeCents > 0) {
    lineItems.push({ desc: "After-Hours Surcharge", qty: 1, amount: d.afterHoursSurchargeCents });
  }
  if (d.additionalChargesCents > 0) {
    lineItems.push({ desc: "Additional Charges", qty: 1, amount: d.additionalChargesCents });
  }

  const subtotal = d.baseAmountCents + d.afterHoursSurchargeCents + d.additionalChargesCents;

  const lineItemRows = lineItems.map(li => `
    <tr>
      <td>${li.desc}</td>
      <td style="text-align:center">${li.qty}</td>
      <td style="text-align:right">${fmtAUD(li.amount)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${d.invoiceNumber} — RFDS SE</title>
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
    }

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

    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      margin-left: 8px;
    }
    .status-Draft     { background: #f1f5f9; color: #64748b; }
    .status-Submitted { background: #cffafe; color: #0e7490; }
    .status-Paid      { background: #d1fae5; color: #065f46; }
    .status-Overdue   { background: #fee2e2; color: #b91c1c; }

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

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
    }
    .info-row { display: flex; gap: 6px; align-items: baseline; }
    .info-label { font-weight: 600; color: #374151; font-size: 8.5pt; min-width: 110px; }
    .info-value { color: #1e293b; font-size: 8.5pt; }

    .bill-to-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .bill-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; background: #f8fafc; }
    .bill-box .bill-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
    .bill-box .bill-name { font-size: 10pt; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
    .bill-box .bill-line { font-size: 8.5pt; color: #475569; }

    .route-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f0fdff;
      border: 1px solid #cffafe;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 10px;
      font-size: 10pt;
      font-weight: 700;
      color: #0e7490;
    }
    .route-strip .arrow { color: #64748b; font-weight: 400; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
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

    .totals-box { width: 260px; margin-left: auto; margin-top: 8px; }
    .totals-row { display: flex; justify-content: space-between; font-size: 8.5pt; padding: 4px 0; }
    .totals-row.grand {
      border-top: 2px solid #0891b2;
      margin-top: 4px;
      padding-top: 8px;
      font-size: 13pt;
      font-weight: 800;
      color: #0891b2;
    }
    .gst-note { font-size: 7.5pt; color: #94a3b8; font-style: italic; margin-top: 4px; text-align: right; }

    .payment-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f8fafc;
      font-size: 8.5pt;
    }
    .payment-box .p-label { font-weight: 600; color: #374151; display: inline-block; min-width: 90px; }

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
      <div style="font-size:8pt;color:#64748b;margin-top:2px;">Royal Flying Doctor Service — South Eastern Section</div>
    </div>
    <div class="org-block">
      <strong>Royal Flying Doctor Service — South Eastern Section</strong>
      Aeromedical Operations · Bankstown · Dubbo · Broken Hill<br/>
      ABN: 18 123 456 789
    </div>
  </div>

  <!-- ── Document Title Band ──────────────────────────────────────── -->
  <div class="doc-title-band">
    <h1>Tax Invoice — NEPT Patient Transport
      <span class="status-badge status-${d.status}">${d.status}</span>
    </h1>
    <div class="doc-meta">
      <span>Invoice No: <strong style="color:white">${d.invoiceNumber}</strong></span>
      <span>Invoice Date: ${fmtDate(d.invoiceDate)}</span>
      <span>Due Date: ${fmtDate(d.dueDate)}</span>
      <span>Generated: ${generated} AEST</span>
    </div>
  </div>

  <!-- ── Bill To / From ───────────────────────────────────────────── -->
  <div class="section">
    <div class="section-heading">Bill To / From</div>
    <div class="bill-to-grid">
      <div class="bill-box">
        <div class="bill-label">From</div>
        <div class="bill-name">RFDS South Eastern Section</div>
        <div class="bill-line">ABN: 18 123 456 789</div>
        <div class="bill-line">Aeromedical Operations, NSW</div>
      </div>
      <div class="bill-box">
        <div class="bill-label">Bill To</div>
        <div class="bill-name">${d.payerName || "—"}</div>
        <div class="bill-line">${payerLabel}</div>
      </div>
    </div>
  </div>

  <!-- ── Mission Details ──────────────────────────────────────────── -->
  <div class="section">
    <div class="section-heading">Mission Details</div>
    <div class="route-strip">
      <span>${d.pickupLocation || "—"}</span>
      <span class="arrow">→</span>
      <span>${d.destination || "—"}</span>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Task Reference:</span><span class="info-value">${d.taskRef || "—"}</span></div>
      <div class="info-row"><span class="info-label">Patient ID:</span><span class="info-value">${d.patientId || "—"}</span></div>
      <div class="info-row"><span class="info-label">Service Date:</span><span class="info-value">${fmtDate(d.serviceDate)}</span></div>
      <div class="info-row"><span class="info-label">Aircraft Rego:</span><span class="info-value">${d.aircraftReg || "—"}</span></div>
      <div class="info-row"><span class="info-label">Mission Type:</span><span class="info-value">${d.missionType}</span></div>
      <div class="info-row"><span class="info-label">Payer:</span><span class="info-value">${d.payerName || "—"}</span></div>
    </div>
  </div>

  <!-- ── Charges ───────────────────────────────────────────────────── -->
  <div class="section">
    <div class="section-heading">Charges</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="width:60px;text-align:center">Qty</th>
          <th style="width:110px;text-align:right">Amount (AUD)</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${fmtAUD(subtotal)}</span></div>
      <div class="totals-row"><span>GST (0%)</span><span>${fmtAUD(d.gstAmountCents)}</span></div>
      <div class="totals-row grand"><span>Total</span><span>${fmtAUD(d.totalAmountCents)}</span></div>
    </div>
    <div class="gst-note">GST-free supply under GST Act Div 38-B — health services are GST-exempt</div>
  </div>

  <!-- ── Payment Instructions ─────────────────────────────────────── -->
  <div class="section">
    <div class="section-heading">Payment Instructions</div>
    <div class="payment-box">
      <div><span class="p-label">BSB:</span> 062-000</div>
      <div><span class="p-label">Account:</span> 1234 5678</div>
      <div><span class="p-label">Reference:</span> ${d.invoiceNumber}</div>
      <div><span class="p-label">Terms:</span> Payment due within 30 days of invoice date</div>
    </div>
  </div>

  ${d.notes ? `
  <div class="section">
    <div class="section-heading">Notes</div>
    <p style="font-size:8.5pt;line-height:1.55;white-space:pre-wrap;border-left:3px solid #e2e8f0;padding-left:8px">${d.notes}</p>
  </div>` : ""}

</div><!-- /page -->

<div class="footer">
  <span>NSW Health — NEPT Patient Transport Claim | GST-free supply under GST Act Div 38-B</span>
  <span>${d.invoiceNumber} · ${generated} AEST</span>
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
    const safe = `RFDS_SE_Invoice_${d.invoiceNumber.replace(/[^\w-]/g, "_")}`;

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
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (_) {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }
}
