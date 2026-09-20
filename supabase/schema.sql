-- ============================================================================
-- Van Cortlandt Bench Adoption — database schema
-- Run this once in the Supabase SQL editor (or via psql). Safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists btree_gist with schema extensions; -- exclusion constraint on (bench_id, daterange)

-- ---------------------------------------------------------------------------
-- "Today" for the program is the calendar date in New York, where the park is.
-- Both the view below and the adopt_bench() function use this so that the
-- database and the app agree on which day it is.
-- ---------------------------------------------------------------------------
create or replace function public.park_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/New_York')::date
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.benches (
  id            uuid primary key default gen_random_uuid(),
  bench_number  text not null unique,
  area          text not null,
  description   text not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.adoptions (
  id                       uuid primary key default gen_random_uuid(),
  bench_id                 uuid not null references public.benches(id) on delete restrict,
  donor_name               text not null,
  donor_email              text not null,
  public_recognition_name  text,
  display_name_publicly    boolean not null default false,
  duration_months          integer not null,
  start_date               date not null,
  end_date                 date not null,   -- EXCLUSIVE: the first day the bench is free again
  source                   text not null default 'web',
  created_at               timestamptz not null default now(),

  constraint adoptions_donor_name_len   check (char_length(btrim(donor_name)) between 1 and 120),
  constraint adoptions_email_format     check (donor_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint adoptions_duration_allowed check (duration_months in (6, 12, 24, 36, 60)),
  constraint adoptions_dates_ordered    check (end_date > start_date),
  constraint adoptions_source_allowed   check (source in ('seed', 'web')),

  -- Defense in depth: two adoptions for the same bench can never overlap in
  -- time, even if someone bypasses adopt_bench() and inserts directly.
  constraint adoptions_no_overlap exclude using gist (
    bench_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
);

create index if not exists adoptions_bench_id_idx on public.adoptions (bench_id, start_date, end_date);

-- ---------------------------------------------------------------------------
-- Public view: every bench + its CURRENT active adoption (if any).
-- Never exposes donor_email. The app reads all listing/detail data from here.
-- Availability is computed from dates, never stored as a flag.
-- ---------------------------------------------------------------------------
create or replace view public.benches_public
with (security_invoker = true)
as
select
  b.id,
  b.bench_number,
  b.area,
  b.description,
  a.id                      as adoption_id,
  case
    when a.id is null then null
    when a.display_name_publicly
      then coalesce(nullif(btrim(a.public_recognition_name), ''), a.donor_name)
    else null
  end                       as public_display_name,
  a.duration_months,
  a.start_date,
  a.end_date,
  a.source                  as adoption_source
from public.benches b
left join lateral (
  select x.*
  from public.adoptions x
  where x.bench_id = b.id
    and x.start_date <= public.park_today()
    and x.end_date   >  public.park_today()
  order by x.start_date desc
  limit 1
) a on true;

-- ---------------------------------------------------------------------------
-- adopt_bench(): the ONLY way adoptions are created by the application.
--
-- Runs as a single transaction:
--   1. validate input
--   2. lock the bench row (SELECT ... FOR UPDATE) so concurrent requests for
--      the same bench queue up behind each other
--   3. check for an active adoption (the second request sees the first one's
--      committed row here and is rejected)
--   4. insert
-- ---------------------------------------------------------------------------
create or replace function public.adopt_bench(
  p_bench_id                uuid,
  p_donor_name              text,
  p_donor_email             text,
  p_public_recognition_name text,
  p_display_name_publicly   boolean,
  p_duration_months         integer
)
returns table (adoption_id uuid, start_date date, end_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bench_id uuid;
  v_start    date;
  v_end      date;
  v_id       uuid;
  v_name     text := btrim(coalesce(p_donor_name, ''));
  v_email    text := lower(btrim(coalesce(p_donor_email, '')));
  v_recog    text := nullif(btrim(coalesce(p_public_recognition_name, '')), '');
begin
  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'INVALID_NAME';
  end if;
  if v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_email) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;
  if v_recog is not null and char_length(v_recog) > 120 then
    raise exception 'INVALID_RECOGNITION_NAME';
  end if;
  if p_duration_months is null or p_duration_months not in (6, 12, 24, 36, 60) then
    raise exception 'INVALID_DURATION';
  end if;

  -- Lock the bench row. A second concurrent call for the same bench blocks
  -- here until the first transaction commits or rolls back.
  select b.id into v_bench_id
  from public.benches b
  where b.id = p_bench_id
  for update;

  if v_bench_id is null then
    raise exception 'BENCH_NOT_FOUND';
  end if;

  v_start := public.park_today();

  if exists (
    select 1 from public.adoptions x
    where x.bench_id = v_bench_id
      and x.start_date <= v_start
      and x.end_date   >  v_start
  ) then
    raise exception 'BENCH_UNAVAILABLE';
  end if;

  -- Calendar-month arithmetic (e.g. Jan 31 + 1 month = Feb 28/29).
  v_end := (v_start + make_interval(months => p_duration_months))::date;

  insert into public.adoptions (
    bench_id, donor_name, donor_email, public_recognition_name,
    display_name_publicly, duration_months, start_date, end_date, source
  ) values (
    v_bench_id, v_name, v_email, v_recog,
    coalesce(p_display_name_publicly, false), p_duration_months, v_start, v_end, 'web'
  )
  returning id into v_id;

  return query select v_id, v_start, v_end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Security: the browser never talks to the database. Only the server, using
-- the service-role key, reads or writes. Lock everything down for the public
-- roles that the anon key would use.
-- ---------------------------------------------------------------------------
alter table public.benches   enable row level security;
alter table public.adoptions enable row level security;

revoke all on table public.benches        from anon, authenticated;
revoke all on table public.adoptions      from anon, authenticated;
revoke all on public.benches_public       from anon, authenticated;
revoke all on function public.adopt_bench(uuid, text, text, text, boolean, integer) from anon, authenticated, public;
revoke all on function public.park_today() from anon, authenticated, public;
grant execute on function public.adopt_bench(uuid, text, text, text, boolean, integer) to service_role;
grant execute on function public.park_today() to service_role;
