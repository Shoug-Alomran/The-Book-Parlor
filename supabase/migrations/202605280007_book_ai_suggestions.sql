alter table books add column if not exists ai_summary text;

alter table book_moods add column if not exists confidence numeric;
alter table book_content_warnings add column if not exists source text default 'manual';
alter table book_content_warnings add column if not exists confidence numeric;

create unique index if not exists book_moods_book_mood_source_idx on book_moods(book_id, mood_id, source);
create unique index if not exists book_content_warnings_book_warning_user_source_idx on book_content_warnings(book_id, warning_id, user_id, source);

create table if not exists book_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade,
  field_name text not null,
  suggested_value jsonb not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  source text not null default 'ai_inferred',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table book_ai_suggestions enable row level security;

drop policy if exists "Book AI suggestions readable" on book_ai_suggestions;
drop policy if exists "Users can create book AI suggestions" on book_ai_suggestions;
drop policy if exists "Users manage own book AI suggestions" on book_ai_suggestions;

create policy "Book AI suggestions readable"
on book_ai_suggestions
for select
using (user_id is null or auth.uid() = user_id);

create policy "Users can create book AI suggestions"
on book_ai_suggestions
for insert
to authenticated
with check (source = 'ai_inferred' and (user_id is null or auth.uid() = user_id));

create policy "Users manage own book AI suggestions"
on book_ai_suggestions
for update
to authenticated
using (user_id is null or auth.uid() = user_id)
with check (user_id is null or auth.uid() = user_id);
