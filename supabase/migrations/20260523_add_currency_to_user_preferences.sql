-- Add a global display currency preference for user_preferences.

alter table user_preferences
  add column if not exists currency text not null default 'INR';

do $$ begin
  alter table user_preferences
    add constraint user_preferences_currency_check
    check (currency in ('INR', 'USD', 'EUR', 'GBP'));
exception
  when duplicate_object then null;
end $$;
