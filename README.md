# The Book Parlor

The Book Parlor is a cozy full-stack reading tracker inspired by Goodreads and TBR Bookshelf, designed like a sleek late-night book cafe. It supports personal libraries, separate reading and ownership statuses, visual bookcases, genre-specific emotional ratings, reviews/comments, trope suggestions, reading goals, and Supabase-backed data architecture.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Framer Motion
- Supabase Auth, PostgreSQL, Row Level Security, and Storage-ready profile/custom asset fields
- Google Books API first, Open Library fallback
- AI-ready service boundaries for future trope detection and recommendations

## MVP Included

- Auth page with Supabase-backed email/password and username/password login
- Dashboard with currently reading, yearly goal, stats, and quick add
- Search/add book by title, author, or ISBN
- Google Books lookup with Open Library fallback
- Manual add and future scanner entry points
- My Books with independent reading status and ownership status filters
- Book detail page with metadata, tropes, moods, content warnings, community ratings, reviews, and comments
- Purchased, Read, TBR, Favorites, and Owned But Unread visual bookcases
- Spine, cover, grid, and cozy shelf display modes
- Genre-specific rating UI with large tappable icons
- Rule-based `tropeDetectionService` that can be replaced with AI later
- Basic discover, goals, stats, profile, settings, quotes, and reading session scaffolds
- Supabase migration with tables and RLS policies

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_BOOKS_API_KEY=optional-google-books-key
OPENAI_API_KEY=server-side-only
OPENAI_MODEL=gpt-4.1-mini
```

The app requires Supabase credentials for account and library persistence. Google Books search works without an API key where the public API allows it, and `VITE_GOOGLE_BOOKS_API_KEY` can be added for more reliable metadata requests.

`OPENAI_API_KEY` must only be configured on the backend/serverless environment. Do not expose it as a `VITE_` variable. The frontend calls `/api/enrich-book`, and that endpoint calls the AI model.

## Supabase

Apply the migrations in order through the Supabase SQL editor or Supabase CLI:

1. `supabase/migrations/202605280001_initial_schema.sql`
2. `supabase/migrations/202605280002_function_ready.sql`
3. `supabase/migrations/202605280003_rating_journal_metadata.sql`
4. `supabase/migrations/202605280004_external_metadata_and_rating_aggregates.sql`
5. `supabase/migrations/202605280005_username_login_rpc.sql`
6. `supabase/migrations/202605280006_goal_upsert_unique.sql`
7. `supabase/migrations/202605280007_book_ai_suggestions.sql`

The second migration makes the app ready for real use by adding external book IDs, persisted trope/mood arrays, and automatic profile creation after sign up.

The schema includes:

- `profiles`
- `books`
- `user_books`
- `shelves`
- `shelf_books`
- `ratings`
- `reviews`
- `comments`
- `likes`
- `tropes`
- `book_tropes`
- `user_book_tropes`
- `moods`
- `book_moods`
- `quotes`
- `reading_sessions`
- `bookcases`
- `bookcase_books`
- `goals`
- `achievements`
- `user_achievements`
- `content_warnings`
- `book_content_warnings`

RLS is enabled. Public book metadata, public reviews/comments, and public bookcases/shelves are readable. User-owned records are editable only by their owner. Notes, annotations, quotes, reading sessions, and private bookcase/shelf data remain owner-visible by default.

## Project Structure

```text
src/
  components/       reusable UI: book cards, bookcases, ratings, chips, reviews
  data/             rating templates and constants
  lib/              Supabase client
  pages/            app routes
  services/         auth, books, shelves, bookcases, ratings, stats, reviews, comments, trope detection
  styles/           Tailwind entry CSS
supabase/
  migrations/       PostgreSQL schema and RLS
```

## Future AI Hooks

`src/services/tropeDetectionService.ts` currently infers tropes and moods from simple keywords. Replace its `infer` method later with an AI call without changing the UI flow:

1. Fetch description and metadata.
2. Suggest genres, tropes, moods, and warnings.
3. Let the user accept/remove/add tags.
4. Store accepted tags and generate smart shelves.

Recommendation logic should follow the same pattern: start with rule-based signals, then swap in an AI-backed service when ready.
