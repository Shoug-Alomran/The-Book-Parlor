alter table books add column if not exists external_id text;
alter table books add column if not exists tropes text[] default '{}';
alter table books add column if not exists moods text[] default '{}';
alter table books add column if not exists content_warnings text[] default '{}';

create unique index if not exists books_external_source_idx on books(source, external_id) where external_id is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "Authenticated users can insert tropes" on tropes;
drop policy if exists "Authenticated users can insert moods" on moods;
drop policy if exists "Authenticated users can insert book trope links" on book_tropes;
drop policy if exists "Authenticated users can insert book mood links" on book_moods;

create policy "Authenticated users can insert tropes" on tropes for insert to authenticated with check (true);
create policy "Authenticated users can insert moods" on moods for insert to authenticated with check (true);
create policy "Authenticated users can insert book trope links" on book_tropes for insert to authenticated with check (true);
create policy "Authenticated users can insert book mood links" on book_moods for insert to authenticated with check (true);
