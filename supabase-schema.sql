create table if not exists public.forms (
  id text primary key,
  token text unique,
  title text not null,
  description text,
  status text not null default 'open',
  event_date date,
  closes_at timestamptz,
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forms_token_idx on public.forms (token);

create table if not exists public.form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id text not null,
  answers jsonb not null default '{}'::jsonb,
  respondent_name text,
  signature_url text,
  signature_data_url text,
  created_at timestamptz not null default now()
);

create index if not exists form_responses_form_id_idx
  on public.form_responses (form_id, created_at desc);

alter table public.forms enable row level security;
alter table public.form_responses enable row level security;

create policy "public_select_forms"
  on public.forms for select
  using (true);

create policy "public_insert_forms"
  on public.forms for insert
  with check (true);

create policy "public_update_forms"
  on public.forms for update
  using (true);

create policy "public_delete_forms"
  on public.forms for delete
  using (true);

create policy "public_select_responses"
  on public.form_responses for select
  using (true);

create policy "public_insert_responses"
  on public.form_responses for insert
  with check (true);
