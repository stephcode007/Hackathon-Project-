-- Rooms, desks, laptops and bookings (mock). Safe to re-run: it also resets all bookings,
-- so run it right before the demo. Names match the frontend prototype (frontend/src/mocks/db.js).
-- Other students' bookings are created for today and the next two days, relative to when this runs.

truncate bookings, resources;

-- Rooms
insert into resources (type, name, floor, zone, capacity, features) values
  ('room', 'Group Room 1.01',   1, 'group',  4, '{whiteboard}'),
  ('room', 'Group Room 1.02',   1, 'group',  6, '{whiteboard,screen}'),
  ('room', 'Group Room 2.03',   2, 'group',  4, '{screen}'),
  ('room', 'Group Room 2.04',   2, 'group',  6, '{whiteboard,screen}'),
  ('room', 'Group Room 2.05',   2, 'group',  8, '{whiteboard,screen}'),
  ('room', 'Seminar Room 3.01', 3, 'group', 12, '{screen,whiteboard}'),
  ('room', 'Study Pod 3.02',    3, 'group',  2, '{power}'),
  ('room', 'Study Pod 3.03',    3, 'group',  2, '{power}');

-- Desks: every third desk has no power socket
insert into resources (type, name, floor, zone, features)
select 'desk', format('Desk %s-%s', d.prefix, lpad(n::text, 2, '0')), d.floor, d.zone,
       case when n % 3 = 0 then '{}'::text[] else '{power}'::text[] end
from (values ('G', 1, 8, 1, 'group'), ('S', 1, 12, 2, 'silent'), ('Q', 9, 12, 3, 'quiet'))
       as d(prefix, first, count, floor, zone),
     generate_series(d.first, d.first + d.count - 1) as n;

-- Laptops (collected from the help desk on floor 1)
insert into resources (type, name, floor, features)
select 'laptop', format('MacBook Air #%s', n), 1, '{mac}'::text[] from generate_series(1, 4) n
union all
select 'laptop', format('Dell Latitude #%s', n), 1, '{windows}'::text[] from generate_series(1, 4) n;

-- Alex's example booking, so "my bookings" isn't empty: Group Room 2.04 tomorrow 15:00-17:00
insert into bookings (resource_id, student_id, starts_at, ends_at)
select id, 'demo-student-001',
       ((now() at time zone 'Europe/London')::date + 1 + time '15:00') at time zone 'Europe/London',
       ((now() at time zone 'Europe/London')::date + 1 + time '17:00') at time zone 'Europe/London'
from resources where name = 'Group Room 2.04';

-- Other students: a morning and an afternoon block per resource per day, so availability looks real
insert into bookings (resource_id, student_id, starts_at, ends_at)
select r.id, format('seed-%s', lpad(((r.i * 3 + d) % 999 + 1)::text, 4, '0')),
       ((now() at time zone 'Europe/London')::date + d + make_time(b.h, 0, 0)) at time zone 'Europe/London',
       ((now() at time zone 'Europe/London')::date + d + make_time(b.h + b.len, 0, 0)) at time zone 'Europe/London'
from (select id, (row_number() over (order by type, name))::int as i from resources) r,
     generate_series(0, 2) d,
     lateral (values (8 + (r.i * 5 + d * 3) % 4, 1 + r.i % 2),
                     (13 + (r.i * 3 + d) % 5, 1 + (r.i + d) % 2)) as b(h, len)
on conflict do nothing;
