create extension if not exists "uuid-ossp";

create table if not exists shared_responses (
  id                uuid primary key default uuid_generate_v4(),
  token             text not null unique,
  user_id           uuid not null references auth.users(id) on delete cascade,
  source_message_id uuid not null references messages(id) on delete cascade,
  content           text not null check (char_length(content) between 1 and 120000),
  created_at        timestamptz not null default now(),

  unique (user_id, source_message_id),
  constraint shared_responses_token_format_chk check (token ~ '^[a-z]{16}$')
);

create index if not exists idx_shared_responses_token on shared_responses(token);
create index if not exists idx_shared_responses_user_created on shared_responses(user_id, created_at desc);

grant select, insert, update, delete on public.shared_responses to authenticated;
grant select, insert, update, delete on public.shared_responses to service_role;
grant select on public.shared_responses to anon;

alter table shared_responses enable row level security;

drop policy if exists "Anyone with a valid token can view shared responses" on shared_responses;
create policy "Anyone with a valid token can view shared responses"
  on shared_responses for select
  using (true);

drop policy if exists "Users can create their own shared responses" on shared_responses;
create policy "Users can create their own shared responses"
  on shared_responses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own shared responses" on shared_responses;
create policy "Users can update their own shared responses"
  on shared_responses for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own shared responses" on shared_responses;
create policy "Users can delete their own shared responses"
  on shared_responses for delete
  using (auth.uid() = user_id);
