-- Busyness: used by the get_busyness and get_peak_times agent tools (see README "How busyness is worked out").
-- Visit data comes from gate scans (library_visits) plus the fake history in seed_visits.sql.

-- People inside at a moment. Someone is inside if they entered before `at_time` and either left
-- after it, or haven't scanned out yet today. Open visits from earlier days are stale and ignored.
create or replace function people_inside(at_time timestamptz default now(), tz text default 'Europe/London')
returns int language sql stable as $$
  select count(*)::int
  from library_visits
  where entered_at <= at_time
    and (
      left_at > at_time
      or (left_at is null and (entered_at at time zone tz)::date = (at_time at time zone tz)::date)
    )
$$;

-- Average people inside for each weekday (0 = Sunday) and opening hour, measured at half past,
-- over the 4 weeks before the last refresh. Too slow to work out on every chat message, so it's
-- precomputed: run `refresh materialized view typical_busyness;` after loading visit data.
create materialized view typical_busyness as
with slots as (
  select d::date as day,
         h as hour,
         (d::date + make_time(h, 30, 0)) at time zone 'Europe/London' as t
  from generate_series(current_date - 28, current_date - 1, interval '1 day') d,
       generate_series(8, 21) h
)
select extract(dow from s.day)::int as weekday,
       s.hour,
       round(avg((
         select count(*)
         from library_visits v
         where v.entered_at <= s.t
           and (v.left_at > s.t or (v.left_at is null and (v.entered_at at time zone 'Europe/London')::date = s.day))
       )))::int as avg_people
from slots s
group by 1, 2;

create unique index typical_busyness_key on typical_busyness (weekday, hour);

-- Only the Edge Functions read these (library_visits has no public access)
revoke execute on function people_inside(timestamptz, text) from public, anon, authenticated;
grant execute on function people_inside(timestamptz, text) to service_role;
revoke all on typical_busyness from anon, authenticated;
grant select on typical_busyness to service_role;
