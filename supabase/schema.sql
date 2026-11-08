-- English Trainer: cloud progress for logged-in users.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.

-- One row per user. "data" holds the user's whole progress (compressed).
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       text        not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security: every user can only see and change their own row.
alter table public.progress enable row level security;

drop policy if exists "Read own progress" on public.progress;
create policy "Read own progress" on public.progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Insert own progress" on public.progress;
create policy "Insert own progress" on public.progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Update own progress" on public.progress;
create policy "Update own progress" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Nobody (not even logged-in users) can read other people's rows, and
-- anonymous visitors can't read anything.
revoke all on public.progress from anon;
grant select, insert, update on public.progress to authenticated;
