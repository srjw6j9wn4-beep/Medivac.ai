-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/fbstcyegnzufiebnktrx/sql
-- Auto-Invoice & Fuel Receipts — Medivac.ai schema migration
-- These statements are idempotent (IF NOT EXISTS) and safe to re-run.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rejected_by TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rejected_at TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_note TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS auto_generated INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS source_type TEXT;

ALTER TABLE charter_quotes ADD COLUMN IF NOT EXISTS auto_invoice INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS fuel_receipts (
  id BIGSERIAL PRIMARY KEY,
  receipt_ref TEXT NOT NULL,
  entry_method TEXT NOT NULL DEFAULT 'manual',
  aircraft_reg TEXT NOT NULL,
  airport_icao TEXT NOT NULL,
  uplift_date TEXT NOT NULL,
  uplift_lb REAL NOT NULL,
  price_per_lb REAL NOT NULL,
  total_aud REAL NOT NULL,
  supplier TEXT NOT NULL,
  invoice_ref TEXT,
  scan_image_url TEXT,
  recon_status TEXT NOT NULL DEFAULT 'pending',
  recon_batch_id TEXT,
  notes TEXT,
  entered_by TEXT NOT NULL DEFAULT 'ops',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
