-- Run against Neon by hand: psql "$DATABASE_URL" -f db/schema.sql
-- No migration tooling. Statements must stay idempotent.
-- See the GDPR section in CLAUDE.md before adding a column here.

-- One row per view, append-only. The source of truth.
-- `path` is the page path (`/`, `/about`, `/posts/my-post`). Pages live in
-- git, not in Postgres, so there is no page table to reference.
create table if not exists page_view_event (
  id bigint generated always as identity primary key,
  path text not null,
  viewed_at timestamptz not null default now(),
  referrer_host text,
  country text,
  device text
);

create index if not exists page_view_event_path_idx on page_view_event (path);
create index if not exists page_view_event_viewed_at_idx on page_view_event (viewed_at);

-- Deliberate denormalisation: count(*) over page_view_event is O(rows) and runs
-- on every page load, this is O(1). Written in the same transaction as the
-- event, and rebuildable from it (see the query at the bottom of this file).
create table if not exists page_view (
  path text primary key,
  views bigint not null default 0
);

-- CNIL caps audience-measurement data at 25 months. Run periodically.
-- Only trims the event log; page_view keeps the lifetime total on purpose.
-- delete from page_view_event where viewed_at < now() - interval '25 months';

-- Rebuild the aggregate if it ever drifts, or after a manual purge:
-- insert into page_view (path, views)
-- select path, count(*) from page_view_event group by path
-- on conflict (path) do update set views = excluded.views;

-- Visitor-submitted requests for a new NixOS module. Stores the email so the
-- publisher can reply; a ticked consent box is the legal basis, so the row
-- only exists once consent is given (enforced in the API route).
create table if not exists module_request (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  module text not null,
  details text not null,
  email text not null
);

create index if not exists module_request_created_at_idx on module_request (created_at);

-- Retention: keep only while a request is being handled. Purge by hand.
-- delete from module_request where created_at < now() - interval '12 months';
