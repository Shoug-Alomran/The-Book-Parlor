create table if not exists book_editions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade not null,
  source text not null default 'manual',
  source_edition_id text,
  edition_title text,
  format text,
  isbn_10 text,
  isbn_13 text,
  page_count integer,
  language text,
  publisher text,
  published_date text,
  published_year integer,
  cover_url text,
  imported_metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(book_id, source, source_edition_id)
);

alter table book_editions enable row level security;

drop policy if exists "Book editions readable" on book_editions;
drop policy if exists "Authenticated users can manage book editions" on book_editions;

create policy "Book editions readable" on book_editions for select using (true);
create policy "Authenticated users can manage book editions" on book_editions for all to authenticated using (true) with check (true);

alter table user_books add column if not exists edition_id uuid references book_editions(id) on delete set null;
