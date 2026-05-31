-- Decouple shared_responses from messages table.
-- Client uses locally-generated UUIDs for messages that may differ from
-- the database row id, so the FK + unique(user_id, source_message_id)
-- pair made shares fail with "Unable to create share link". We keep
-- source_message_id for analytics but allow null and stop enforcing
-- uniqueness on it. A new column source_conversation_id captures the
-- owning conversation so RLS / ownership checks remain meaningful.

alter table shared_responses
  drop constraint if exists shared_responses_source_message_id_fkey;

alter table shared_responses
  alter column source_message_id drop not null;

alter table shared_responses
  drop constraint if exists shared_responses_user_id_source_message_id_key;

alter table shared_responses
  add column if not exists source_conversation_id uuid
    references conversations(id) on delete cascade;

create index if not exists idx_shared_responses_user_conversation
  on shared_responses(user_id, source_conversation_id);
