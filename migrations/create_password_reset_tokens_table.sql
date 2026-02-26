-- Create password_reset_tokens table for secure password reset flow
-- Run this in your Supabase SQL Editor

create table if not exists public.password_reset_tokens (
  id uuid not null default gen_random_uuid(),
  partner_id uuid not null,
  token text not null,
  expires_at timestamp with time zone not null,
  used boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint password_reset_tokens_pkey primary key (id),
  constraint password_reset_tokens_partner_id_fkey foreign key (partner_id) references public.partners(id) on delete cascade,
  constraint password_reset_tokens_token_key unique (token)
);

-- Create index for faster token lookups
create index if not exists password_reset_tokens_token_idx on public.password_reset_tokens(token);
create index if not exists password_reset_tokens_partner_id_idx on public.password_reset_tokens(partner_id);
create index if not exists password_reset_tokens_expires_at_idx on public.password_reset_tokens(expires_at);

-- Enable Row Level Security
alter table public.password_reset_tokens enable row level security;

-- No policies needed - tokens are managed server-side only via service role key

-- Optional: Clean up expired/used tokens (run periodically or set up as a cron job)
-- DELETE FROM public.password_reset_tokens WHERE expires_at < NOW() OR used = true;
