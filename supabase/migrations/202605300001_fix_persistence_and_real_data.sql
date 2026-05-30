delete from bookcase_books a
using bookcase_books b
where a.id > b.id
  and a.bookcase_id = b.bookcase_id
  and a.book_id = b.book_id;

create unique index if not exists bookcase_books_bookcase_book_unique
  on bookcase_books(bookcase_id, book_id);

alter table book_content_warnings add column if not exists source text default 'manual';
alter table book_content_warnings add column if not exists confidence numeric;

create unique index if not exists book_content_warnings_book_warning_user_source_idx
  on book_content_warnings(book_id, warning_id, user_id, source);

drop policy if exists "Authenticated users can update tropes" on tropes;
drop policy if exists "Authenticated users can update moods" on moods;
drop policy if exists "Authenticated users can update book trope links" on book_tropes;
drop policy if exists "Authenticated users can update book mood links" on book_moods;
drop policy if exists "Authenticated users can delete AI book trope links" on book_tropes;
drop policy if exists "Authenticated users can delete AI book mood links" on book_moods;
drop policy if exists "Authenticated users can delete AI warning links" on book_content_warnings;

create policy "Authenticated users can update tropes" on tropes
  for update to authenticated using (true) with check (true);

create policy "Authenticated users can update moods" on moods
  for update to authenticated using (true) with check (true);

create policy "Authenticated users can update book trope links" on book_tropes
  for update to authenticated using (true) with check (true);

create policy "Authenticated users can update book mood links" on book_moods
  for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete AI book trope links" on book_tropes
  for delete to authenticated using (source = 'ai_inferred');

create policy "Authenticated users can delete AI book mood links" on book_moods
  for delete to authenticated using (source = 'ai_inferred');

create policy "Authenticated users can delete AI warning links" on book_content_warnings
  for delete to authenticated using (source = 'ai_inferred');

drop policy if exists "Authenticated users can insert content warnings" on content_warnings;
drop policy if exists "Authenticated users can update content warnings" on content_warnings;

create policy "Authenticated users can insert content warnings" on content_warnings
  for insert to authenticated with check (true);

create policy "Authenticated users can update content warnings" on content_warnings
  for update to authenticated using (true) with check (true);
