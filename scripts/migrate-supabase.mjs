// scripts/migrate-supabase.mjs
// Attempts to apply the Supabase schema migrations programmatically.
// The anon key cannot run DDL directly through supabase-js (no raw SQL exec
// is exposed to the anon role by default). We first check whether an
// `exec_sql` RPC function exists (some projects expose one for automation);
// if not, we verify column/table presence and report what's missing so the
// user can run scripts/supabase-migrations.sql manually in the SQL Editor.
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbstcyegnzufiebnktrx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3RjeWVnbnp1ZmllYm5rdHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTQ3MDUsImV4cCI6MjA5OTE3MDcwNX0.GfiAmBe66R64dISvV0Dzg0BNV9p5wsw5dps0RGRSmJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: WebSocket },
});

const sqlPath = path.join(__dirname, 'supabase-migrations.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function tryExecSql() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log('[migrate] exec_sql RPC not usable:', error.message);
      return false;
    }
    console.log('[migrate] exec_sql RPC succeeded:', data);
    return true;
  } catch (e) {
    console.log('[migrate] exec_sql RPC call failed:', e.message);
    return false;
  }
}

async function tryRestRpc() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ sql }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.log(`[migrate] REST exec_sql failed (${res.status}):`, text);
      return false;
    }
    console.log('[migrate] REST exec_sql succeeded:', text);
    return true;
  } catch (e) {
    console.log('[migrate] REST exec_sql call failed:', e.message);
    return false;
  }
}

async function checkSchema() {
  console.log('\n[migrate] Checking current schema state via SELECT probes...');
  const results = {};

  // invoices new columns
  const { error: invErr } = await supabase
    .from('invoices')
    .select('approval_status, approved_by, approved_at, rejected_by, rejected_at, approval_note, auto_generated, source_type')
    .limit(1);
  results.invoicesColumns = invErr ? `MISSING (${invErr.message})` : 'OK';

  // charter_quotes auto_invoice
  const { error: cqErr } = await supabase
    .from('charter_quotes')
    .select('auto_invoice')
    .limit(1);
  results.charterQuotesAutoInvoice = cqErr ? `MISSING (${cqErr.message})` : 'OK';

  // fuel_receipts table
  const { error: frErr } = await supabase
    .from('fuel_receipts')
    .select('id')
    .limit(1);
  results.fuelReceiptsTable = frErr ? `MISSING (${frErr.message})` : 'OK';

  console.log(JSON.stringify(results, null, 2));
  return results;
}

async function main() {
  console.log('[migrate] Attempting programmatic DDL via RPC exec_sql...');
  const ok1 = await tryExecSql();
  if (!ok1) {
    const ok2 = await tryRestRpc();
    if (!ok2) {
      console.log('\n[migrate] Programmatic DDL is not available with the anon key (expected).');
      console.log('[migrate] Please run scripts/supabase-migrations.sql manually in the Supabase SQL Editor:');
      console.log(`[migrate] https://supabase.com/dashboard/project/fbstcyegnzufiebnktrx/sql`);
    }
  }
  await checkSchema();
}

main();
