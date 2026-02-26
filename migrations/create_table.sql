Run this SQL in your Supabase SQL editor:

-- Create partner_payments table
create table public.partner_payments (
  id uuid not null default gen_random_uuid(),
  partner_id uuid not null,
  razorpay_order_id text not null,
  razorpay_payment_id text null,
  amount integer not null default 99900, -- INR 999 in paisa
  currency text not null default 'INR'::text,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint partner_payments_pkey primary key (id),
  constraint partner_payments_partner_id_fkey foreign key (partner_id) references partners (id) on delete cascade,
  constraint partner_payments_status_check check (
    (status = any (array['pending'::text, 'paid'::text, 'failed'::text]))
  )
) tablespace pg_default;

-- Create indexes
create index if not exists partner_payments_partner_id_idx on public.partner_payments using btree (partner_id) tablespace pg_default;
create index if not exists partner_payments_razorpay_order_id_idx on public.partner_payments using btree (razorpay_order_id) tablespace pg_default;

-- Enable RLS (Row Level Security)
alter table public.partner_payments enable row level security;

-- Create RLS policies
create policy "Partners can view their own payments" on public.partner_payments
  for select using (auth.uid() = partner_id);

create policy "Partners can insert their own payments" on public.partner_payments
  for insert with check (auth.uid() = partner_id);

create policy "Partners can update their own payments" on public.partner_payments
  for update using (auth.uid() = partner_id);
