-- ============================================================================
-- Van Cortlandt Bench Adoption — DEMONSTRATION seed data
--
-- Creates 520 FICTIONAL benches (VC-001 … VC-520) and fictional adoption
-- records. None of this is real park data and none of the donors are real.
--
-- Safe to re-run: benches are inserted with ON CONFLICT DO NOTHING, and
-- demo adoptions are only added to benches that have no adoption history.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Benches
-- ---------------------------------------------------------------------------
with areas as (
  select * from (values
    (0, 'Parade Ground',             'Overlooks the open lawn used for cricket, soccer, and summer picnics.'),
    (1, 'Van Cortlandt Lake',        'A shaded spot along the lakeshore path, popular with birdwatchers.'),
    (2, 'Old Croton Aqueduct Trail', 'Set beside the historic aqueduct trail under a canopy of oaks.'),
    (3, 'Northwest Woods',           'A quiet resting point on a wooded trail loop.'),
    (4, 'Indian Field',              'Faces the ballfields and the tree line at the park''s northern edge.'),
    (5, 'Putnam Trail',              'Along the flat, former rail bed that runs the length of the park.'),
    (6, 'Other Park Areas',          'Near a playground, entrance plaza, or neighborhood path.')
  ) as t(idx, name, blurb)
),
gen as (
  select
    n,
    'VC-' || lpad(n::text, 3, '0') as bench_number,
    -- Weighted spread across areas so counts differ per area.
    case
      when n % 20 in (0, 1, 2, 3)      then 0
      when n % 20 in (4, 5, 6)         then 1
      when n % 20 in (7, 8, 9)         then 2
      when n % 20 in (10, 11, 12, 13)  then 3
      when n % 20 in (14, 15)          then 4
      when n % 20 in (16, 17, 18)      then 5
      else 6
    end as area_idx,
    (array[
      'Classic slatted wooden bench with cast-iron ends.',
      'Backless stone bench, good for an afternoon in the sun.',
      'Wooden bench with a curved back and armrests.',
      'Recycled-plastic bench installed during a recent path renovation.',
      'Long two-seat wooden bench under mature shade trees.'
    ])[(n % 5) + 1] as style
  from generate_series(1, 520) as n
)
insert into public.benches (bench_number, area, description)
select
  g.bench_number,
  a.name,
  g.style || ' ' || a.blurb || ' (Sample record for demonstration only.)'
from gen g
join areas a on a.idx = g.area_idx
order by g.n
on conflict (bench_number) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Demo adoptions
--    ~120 active, ~40 expired-only, plus a handful of benches that have BOTH
--    an old expired record and a current one (to show history is preserved).
-- ---------------------------------------------------------------------------
with names as (
  select
    array['Jane','Marcus','Priya','Elena','Samuel','Aisha','Tomás','Grace','Daniel','Mei',
          'Oliver','Fatima','Noah','Sofia','Leo','Hannah','Ravi','Chloe','Ibrahim','Nora'] as firsts,
    array['Smith','Rivera','Patel','Okafor','Nguyen','Cohen','Kowalski','Haddad','Brooks','Tanaka',
          'Morales','Fischer','Adeyemi','Larsen','Chen','Delgado','Murphy','Sato','Rahman','Walsh'] as lasts
),
candidates as (
  select
    b.id as bench_id,
    substring(b.bench_number from 4)::int as n
  from public.benches b
  where not exists (select 1 from public.adoptions a where a.bench_id = b.id)
),
rows_to_insert as (
  -- Active adoptions: n % 13 in (0, 3, 7)  → 120 benches
  select
    c.bench_id,
    c.n,
    'active' as kind,
    (public.park_today() - ((c.n * 37) % 150))::date as start_date,
    (array[6, 12, 24, 36, 60])[(c.n % 5) + 1] as duration_months
  from candidates c
  where c.n % 13 in (0, 3, 7)

  union all

  -- Expired adoptions (6 or 12 months, started ~3 years ago).
  -- n % 13 = 5      → expired-only benches (these show as AVAILABLE)
  -- n % 26 = 0      → benches that also have an active record above
  select
    c.bench_id,
    c.n,
    'expired' as kind,
    (public.park_today() - interval '3 years' + ((c.n * 13) % 200) * interval '1 day')::date as start_date,
    (array[6, 12])[(c.n % 2) + 1] as duration_months
  from candidates c
  where c.n % 13 = 5 or c.n % 26 = 0
)
insert into public.adoptions (
  bench_id, donor_name, donor_email, public_recognition_name,
  display_name_publicly, duration_months, start_date, end_date, source
)
select
  r.bench_id,
  nm.firsts[(r.n % 20) + 1] || ' ' || nm.lasts[((r.n * 7) % 20) + 1]   as donor_name,
  'donor' || r.n || '-' || r.kind || '@example.com'                     as donor_email,
  case (r.n % 4)
    when 0 then 'The ' || nm.lasts[((r.n * 7) % 20) + 1] || ' Family'
    when 1 then 'In memory of ' || nm.firsts[((r.n * 3) % 20) + 1] || ' ' || nm.lasts[((r.n * 7) % 20) + 1]
    when 2 then null   -- falls back to donor_name when displayed publicly
    else nm.firsts[(r.n % 20) + 1] || ' & ' || nm.firsts[((r.n * 11) % 20) + 1] || ' ' || nm.lasts[((r.n * 7) % 20) + 1]
  end                                                                    as public_recognition_name,
  (r.n % 5 <> 1)                                                         as display_name_publicly,  -- ~80% public, ~20% anonymous
  r.duration_months,
  r.start_date,
  (r.start_date + make_interval(months => r.duration_months))::date      as end_date,
  'seed'
from rows_to_insert r
cross join names nm
order by r.n, r.kind;

-- ---------------------------------------------------------------------------
-- 3. Summary (informational)
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.benches)                                            as total_benches,
  (select count(*) from public.benches_public where adoption_id is not null)       as adopted_now,
  (select count(*) from public.benches_public where adoption_id is null)           as available_now,
  (select count(*) from public.adoptions)                                          as adoption_records;
