-- Back of the Box usage events (page views, emails sent). Admin dashboard reads this.
create table if not exists botb_events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  type text not null,            -- 'pageview' | 'email_sent'
  path text,
  visitor text,                  -- random per-browser id (localStorage), not personal
  user_key text,                 -- 'user:<email>' when signed in
  referrer text,
  meta jsonb
);
create index if not exists botb_events_ts_idx on botb_events (ts desc);
create index if not exists botb_events_type_ts_idx on botb_events (type, ts desc);
alter table botb_events enable row level security;
