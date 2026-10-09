-- Book reservations, used by the reserve_book / get_my_reservations / cancel_reservation agent tools.
-- A copy on the shelf is held for collection ('ready'); if every copy is out the student joins
-- the waiting list ('waiting') and gets the next copy back.

-- When the next copy of a fully-loaned book is due back (no loans table in the demo)
alter table books add column if not exists next_due_back date;
update books
set next_due_back = current_date + 2 + (abs(hashtext(title)) % 10)
where copies_available = 0 and next_due_back is null;

create table book_holds (
  id             uuid primary key default gen_random_uuid(),
  book_id        uuid not null references books(id),
  student_id     text not null,
  status         text not null check (status in ('ready', 'waiting', 'cancelled')),
  collect_by     date,               -- ready: collect it before this date
  available_from date,               -- waiting: when a copy is expected back
  created_at     timestamptz not null default now()
);
-- one live reservation per student per book
create unique index one_hold_per_book on book_holds (student_id, book_id) where status <> 'cancelled';

-- Per-student data: no public policy. All access goes through the Edge Functions (service role).
alter table book_holds enable row level security;

-- Reserve atomically: lock the book row so two students can't take the last copy.
-- Returns { hold, book, already }.
create or replace function reserve_book(p_book_id uuid, p_student_id text)
returns jsonb language plpgsql as $$
declare
  b books;
  h book_holds;
begin
  select * into b from books where id = p_book_id for update;
  if not found then
    raise exception 'book not found' using errcode = 'no_data_found';
  end if;

  select * into h from book_holds
  where book_id = p_book_id and student_id = p_student_id and status <> 'cancelled';
  if found then
    return jsonb_build_object('hold', to_jsonb(h), 'book', to_jsonb(b), 'already', true);
  end if;

  if b.copies_available > 0 then
    update books set copies_available = copies_available - 1 where id = p_book_id returning * into b;
    insert into book_holds (book_id, student_id, status, collect_by)
    values (p_book_id, p_student_id, 'ready', current_date + 3)
    returning * into h;
  else
    insert into book_holds (book_id, student_id, status, available_from)
    values (p_book_id, p_student_id, 'waiting', coalesce(b.next_due_back, current_date + 7))
    returning * into h;
  end if;

  return jsonb_build_object('hold', to_jsonb(h), 'book', to_jsonb(b), 'already', false);
end;
$$;

-- Cancel a student's reservation; a held copy goes back on the shelf. Returns { hold, book } or null.
create or replace function cancel_book_hold(p_hold_id uuid, p_student_id text)
returns jsonb language plpgsql as $$
declare
  b books;
  h book_holds;
begin
  update book_holds set status = 'cancelled'
  where id = p_hold_id and student_id = p_student_id and status <> 'cancelled'
  returning * into h;
  if not found then
    return null;
  end if;

  -- the hold's status before the update isn't in h, so check whether a copy was set aside
  if h.collect_by is not null then
    update books set copies_available = least(copies_available + 1, copies_total)
    where id = h.book_id returning * into b;
  else
    select * into b from books where id = h.book_id;
  end if;

  return jsonb_build_object('hold', to_jsonb(h), 'book', to_jsonb(b));
end;
$$;

-- Only the Edge Functions may call these
revoke execute on function reserve_book(uuid, text) from public, anon, authenticated;
revoke execute on function cancel_book_hold(uuid, text) from public, anon, authenticated;
grant execute on function reserve_book(uuid, text) to service_role;
grant execute on function cancel_book_hold(uuid, text) to service_role;
