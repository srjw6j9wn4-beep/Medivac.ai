-- Run this in the Supabase SQL Editor for project fbstcyegnzufiebnktrx
-- Dashboard → SQL Editor → New Query → paste and run

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  page        text        NOT NULL,
  page_path   text        NOT NULL,
  category    text        NOT NULL,
  severity    text        NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  description text        NOT NULL,
  steps       text        NOT NULL DEFAULT '',
  status      text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','resolved','wont-fix')),
  resolved_at timestamptz,
  resolved_by text
);

-- Allow authenticated users and anon key to insert (reporters don't need auth)
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit bug reports"
  ON public.bug_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can read bug reports"
  ON public.bug_reports FOR SELECT
  USING (true);

CREATE POLICY "Anon can update bug report status"
  ON public.bug_reports FOR UPDATE
  USING (true);
