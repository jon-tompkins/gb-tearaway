-- Back of the Box — per-user app state.
-- Run once in the Supabase SQL editor (reuse an existing project or a new one).
-- The app reads/writes this table with the service_role key from the server,
-- so RLS can stay on with no policies (service_role bypasses RLS).

create table if not exists public.botb_state (
  user_key   text primary key,          -- "demo" or "user:<email>"
  state      jsonb not null,            -- the whole AppState blob
  updated_at timestamptz not null default now()
);

alter table public.botb_state enable row level security;
-- No policies needed: only the server (service_role) touches this table.
