-- Fake visit history for busyness and peak times (run after migrations/004_busyness.sql).
-- Covers the last 4 weeks (what peak times are learned from) and the next 2 weeks (so the
-- live headcount looks realistic during the demo without a real gate). Re-running replaces it.
--
-- Shape: weekdays busiest 11:00-15:00, Fridays and weekends quieter, evenings emptier.
-- Each visit lasts 30 min to 3.5 h and ends by closing time (22:00).

delete from library_visits where student_id like 'seed-%';

insert into library_visits (student_id, entered_at, left_at)
select 'seed-' || lpad(floor(random() * 9000 + 1)::text, 4, '0'),
       arrival,
       least(arrival + (30 + floor(random() * 180)) * interval '1 minute', closing)
from (
  select (d::date + make_time(h, 0, 0)) at time zone 'Europe/London' + random() * interval '60 minutes' as arrival,
         (d::date + time '22:00') at time zone 'Europe/London' as closing
  from generate_series(current_date - 28, current_date + 14, interval '1 day') d
  cross join generate_series(8, 21) h
  -- arrivals per hour on a Mon-Thu, 08:00 ... 21:00, scaled by day of week, +/-15% noise
  cross join lateral generate_series(
    1,
    round(
      (array[125, 160, 195, 275, 300, 260, 200, 125, 160, 115, 70, 100, 45, 20])[h - 7]
      * (array[0.45, 1, 1, 1, 1, 0.75, 0.5])[extract(dow from d)::int + 1]
      * (0.85 + random() * 0.3)
    )::int
  ) n
) arrivals;

refresh materialized view typical_busyness;
