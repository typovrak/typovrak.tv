-- Run against Neon by hand: psql "$DATABASE_URL" -f db/schema.sql
-- No migration tooling. Statements must stay idempotent.
-- See the GDPR section in CLAUDE.md before adding a column here.

-- One row per view, append-only. The source of truth. `referrer_host` holds the
-- host of the referring site, '(internal)' for a navigation inside the site, or
-- null for a direct arrival.
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

-- Added after the table shipped, so it goes in as its own statement rather
-- than in the create above. `campaign` is a utm_source from the closed list in
-- src/data/campaigns.ts, so two links on the same host can be told apart. A
-- value outside that list is dropped by the API, never stored here.
alter table page_view_event add column if not exists campaign text;

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

-- Where visits come from, campaigns included:
-- select coalesce(campaign, '(none)') as campaign,
--        coalesce(referrer_host, '(direct)') as referrer,
--        count(*) as visits
-- from page_view_event group by 1, 2 order by visits desc;

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

-- Anonymous quiz results, one row per completed quiz. No identifier, so a row
-- can never be tied to a visitor: only which post, the score, and when.
create table if not exists quiz_result (
  id bigint generated always as identity primary key,
  path text not null,
  correct smallint not null,
  total smallint not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_result_path_idx on quiz_result (path);

-- Retention: audience-adjacent, purge by hand like the rest.
-- delete from quiz_result where created_at < now() - interval '25 months';

-- Score distribution per post: completions, average score, perfect-score count:
-- select path, count(*) as completions,
--        round(avg(100.0 * correct / total), 1) as avg_pct,
--        count(*) filter (where correct = total) as perfect
-- from quiz_result group by path order by completions desc;

-- One row per answered question, to see which question is too hard and which
-- wrong option tempts people. `question` is the 0-based index in the quiz.
-- `picked` is the 0-based indices of the chosen options, comma-joined, so it
-- holds a single answer ("2") or a multi-select one ("0,3"). Still anonymous.
create table if not exists quiz_answer (
  id bigint generated always as identity primary key,
  path text not null,
  question smallint not null,
  picked text not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_answer_path_idx on quiz_answer (path);

-- Retention: audience-adjacent, purge by hand like the rest.
-- delete from quiz_answer where created_at < now() - interval '25 months';

-- Which question is hardest (highest wrong rate):
-- select path, question,
--        count(*) filter (where not correct) as wrong,
--        count(*) as attempts,
--        round(100.0 * count(*) filter (where not correct) / count(*), 1) as wrong_pct
-- from quiz_answer group by path, question order by wrong_pct desc, attempts desc;

-- Which option tempts people in wrong answers (works for single and multi):
-- select path, question, opt, count(*) as picks
-- from quiz_answer, unnest(string_to_array(picked, ',')) as opt
-- where not correct group by path, question, opt order by picks desc;
