-- Book search used by the search_books agent tool.
-- Matches title, author, subject or ISBN, tolerates typos ("clen code") and partial
-- queries ("pragmatic"), and ranks the closest matches first.

create or replace function book_search_text(b books)
returns text language sql immutable as $$
  select lower(b.title || ' ' || coalesce(b.author, '') || ' ' || coalesce(b.subject, ''))
$$;

create index books_search_trgm on books using gin (book_search_text(books) gin_trgm_ops);

create or replace function search_books(q text, max_results int default 8)
returns table (
  book_id          uuid,
  title            text,
  author           text,
  isbn             text,
  subject          text,
  floor            int,
  shelf            text,
  copies_total     int,
  copies_available int
)
language sql stable as $$
  with input as (
    select lower(trim(q)) as q,
           nullif(regexp_replace(q, '[^0-9Xx]', '', 'g'), '') as isbn_q
  )
  select b.id, b.title, b.author, b.isbn, b.subject, b.floor, b.shelf,
         b.copies_total, b.copies_available
  from books b, input i
  where i.q <> ''
    and (
      b.isbn = i.isbn_q
      or book_search_text(b) like '%' || i.q || '%'
      or word_similarity(i.q, book_search_text(b)) >= 0.5
    )
  order by
    (b.isbn = i.isbn_q) desc nulls last,
    (lower(b.title) = i.q) desc,
    (lower(b.title) like '%' || i.q || '%') desc,
    word_similarity(i.q, book_search_text(b)) desc,
    b.copies_available desc
  limit least(greatest(max_results, 1), 20)
$$;
