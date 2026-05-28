alter table books add column if not exists edition_title text;
alter table books add column if not exists format text;
alter table books add column if not exists published_date text;
alter table books add column if not exists series_name text;
alter table books add column if not exists series_position text;

alter table user_books add column if not exists selected_edition jsonb;
