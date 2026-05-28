create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  favorite_genres text[] default '{}',
  is_private boolean default true,
  created_at timestamptz default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  authors text[] default '{}',
  description text,
  cover_url text,
  isbn_10 text,
  isbn_13 text,
  page_count integer,
  publisher text,
  published_year integer,
  categories text[] default '{}',
  language text,
  source text,
  created_at timestamptz default now()
);

create table if not exists user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  reading_status text not null default 'Want to Read',
  ownership_status text not null default 'Not Owned',
  format text,
  current_page integer default 0,
  start_date date,
  finish_date date,
  is_favorite boolean default false,
  is_reread boolean default false,
  would_read_again boolean,
  dnf_reason text,
  private_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

create table if not exists shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text default 'custom',
  visibility text default 'private',
  created_at timestamptz default now(),
  unique(user_id, name)
);

create table if not exists shelf_books (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid references shelves(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(shelf_id, book_id)
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  rating_genre text not null,
  overall numeric check (overall >= 0 and overall <= 5),
  rating_data jsonb default '{}',
  would_read_again boolean default false,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  rating_id uuid references ratings(id) on delete set null,
  title text,
  body text,
  has_spoilers boolean default false,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  parent_comment_id uuid references comments(id) on delete cascade,
  body text not null,
  has_spoilers boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id)
);

create table if not exists tropes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  category text,
  created_at timestamptz default now()
);

create table if not exists book_tropes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade not null,
  trope_id uuid references tropes(id) on delete cascade not null,
  source text default 'manual',
  confidence numeric,
  created_at timestamptz default now(),
  unique(book_id, trope_id, source)
);

create table if not exists user_book_tropes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  trope_id uuid references tropes(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, book_id, trope_id)
);

create table if not exists moods (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

create table if not exists book_moods (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade not null,
  mood_id uuid references moods(id) on delete cascade not null,
  source text default 'manual',
  unique(book_id, mood_id, source)
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  quote_text text not null,
  note text,
  page_number integer,
  tab_color text check (tab_color in ('pink','blue','yellow','purple','green','orange')),
  has_spoilers boolean default false,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  pages_read integer default 0,
  start_page integer,
  end_page integer,
  mood text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists bookcases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text,
  theme text default 'cafe',
  shelf_color text default '#7B5138',
  background text,
  decor jsonb default '[]',
  visibility text default 'private',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookcase_books (
  id uuid primary key default gen_random_uuid(),
  bookcase_id uuid references bookcases(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  position_x integer default 0,
  position_y integer default 0,
  shelf_number integer default 0,
  display_mode text default 'spine',
  custom_spine_color text,
  created_at timestamptz default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  year integer not null,
  goal_type text not null,
  target_number integer not null,
  current_number integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  condition_key text unique,
  created_at timestamptz default now()
);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  achievement_id uuid references achievements(id) on delete cascade not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

create table if not exists content_warnings (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

create table if not exists book_content_warnings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade not null,
  warning_id uuid references content_warnings(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table books enable row level security;
alter table user_books enable row level security;
alter table shelves enable row level security;
alter table shelf_books enable row level security;
alter table ratings enable row level security;
alter table reviews enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table tropes enable row level security;
alter table book_tropes enable row level security;
alter table user_book_tropes enable row level security;
alter table moods enable row level security;
alter table book_moods enable row level security;
alter table quotes enable row level security;
alter table reading_sessions enable row level security;
alter table bookcases enable row level security;
alter table bookcase_books enable row level security;
alter table goals enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table content_warnings enable row level security;
alter table book_content_warnings enable row level security;

create policy "Public book metadata is readable" on books for select using (true);
create policy "Authenticated users can insert books" on books for insert to authenticated with check (true);
create policy "Authenticated users can update books" on books for update to authenticated using (true);

create policy "Public profiles are readable" on profiles for select using (not is_private or auth.uid() = id);
create policy "Users manage own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Public reviews readable" on reviews for select using (is_public or auth.uid() = user_id);
create policy "Public ratings readable" on ratings for select using (is_public or auth.uid() = user_id);
create policy "Comments readable" on comments for select using (true);
create policy "Public quotes readable" on quotes for select using (is_public or auth.uid() = user_id);
create policy "Public bookcases readable" on bookcases for select using (visibility = 'public' or auth.uid() = user_id);
create policy "Public shelves readable" on shelves for select using (visibility = 'public' or auth.uid() = user_id);

create policy "Reference tropes readable" on tropes for select using (true);
create policy "Reference moods readable" on moods for select using (true);
create policy "Book trope links readable" on book_tropes for select using (true);
create policy "Book mood links readable" on book_moods for select using (true);
create policy "Warnings readable" on content_warnings for select using (true);
create policy "Book warnings readable" on book_content_warnings for select using (true);
create policy "Achievements readable" on achievements for select using (true);

create policy "Users manage own user_books" on user_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own shelves" on shelves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own shelf_books" on shelf_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own ratings" on ratings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own reviews" on reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own comments" on comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own likes" on likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own user tropes" on user_book_tropes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own quotes" on quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own sessions" on reading_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own bookcases" on bookcases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own bookcase books" on bookcase_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own goals" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own achievements" on user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own warning votes" on book_content_warnings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into achievements (name, description, icon, condition_key) values
  ('Night Owl', 'Logged reading sessions after midnight', 'moon', 'night_owl'),
  ('Dragon Tamer', 'Read 15 fantasy books', 'sparkles', 'dragon_tamer'),
  ('Emotionally Destroyed', 'Read 10 books with 5/5 tear rating', 'droplet', 'emotionally_destroyed'),
  ('Slow Burn Survivor', 'Finished 20 slow-burn books', 'flame', 'slow_burn_survivor'),
  ('Book Hoarder', 'Own 100+ unread purchased books', 'library', 'book_hoarder'),
  ('Series Slayer', 'Completed a series', 'sword', 'series_slayer'),
  ('Cafe Regular', 'Logged in many days', 'coffee', 'cafe_regular'),
  ('Quote Collector', 'Saved many quotes', 'quote', 'quote_collector')
on conflict (condition_key) do nothing;
