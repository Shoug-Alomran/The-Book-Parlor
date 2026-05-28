alter table books add column if not exists google_books_id text;
alter table books add column if not exists external_average_rating numeric;
alter table books add column if not exists external_ratings_count integer;
alter table books add column if not exists external_rating_source text;
alter table books add column if not exists imported_metadata jsonb default '{}';
alter table books add column if not exists openlibrary_work_key text;
alter table books add column if not exists openlibrary_edition_key text;
alter table books add column if not exists external_subjects text[] default '{}';

create index if not exists books_google_books_id_idx on books(google_books_id);
create index if not exists books_openlibrary_work_key_idx on books(openlibrary_work_key);

drop policy if exists "Public completed user book statuses readable for aggregates" on user_books;
create policy "Public completed user book statuses readable for aggregates"
on user_books
for select
using (lower(reading_status) in ('read', 'dnf'));
