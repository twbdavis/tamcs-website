-- 0030_drop_snapchat_handle.sql
-- Snapchat is no longer collected — drop the column and its check
-- constraint. Instagram stays.
--
-- Safe to re-run.

alter table public.profiles
  drop constraint if exists profiles_snapchat_handle_valid;

alter table public.profiles
  drop column if exists snapchat_handle;
