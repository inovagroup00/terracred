-- ============================================================================
-- Credshow MVP — Schema inicial
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
create type event_status as enum ('draft', 'active', 'closed');
create type transaction_status as enum (
  'pending_onboarding',  -- promotor aprovou, cliente ainda nao terminou onboarding
  'awaiting_activation', -- cliente terminou onboarding, gerou QR, aguardando caixa
  'activated',           -- caixa ativou, credito liberado
  'cancelled',           -- cancelado pelo cliente ou caixa
  'expired'              -- nao foi ativado a tempo
);
create type user_role as enum ('admin', 'cashier');

-- ============================================================================
-- TABLE: events
-- ============================================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue text not null,
  event_date timestamptz not null,
  status event_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_status_idx on public.events(status);
create index events_date_idx on public.events(event_date);

-- ============================================================================
-- TABLE: event_promoter_tokens
-- URL unica por promotor por evento
-- ============================================================================
create table public.event_promoter_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token text not null unique,
  promoter_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index promoter_tokens_event_idx on public.event_promoter_tokens(event_id);
create index promoter_tokens_token_idx on public.event_promoter_tokens(token);

-- ============================================================================
-- TABLE: bureau_queries
-- Cada consulta de CPF feita por um promotor
-- ============================================================================
create table public.bureau_queries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  promoter_token_id uuid not null references public.event_promoter_tokens(id) on delete cascade,
  cpf text not null,
  approved boolean not null,
  approved_limit numeric(10,2),
  reason text,
  phone text,
  sms_sent_at timestamptz,
  sms_link_token text unique,
  sms_link_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index bureau_queries_event_idx on public.bureau_queries(event_id);
create index bureau_queries_cpf_idx on public.bureau_queries(cpf);
create index bureau_queries_sms_token_idx on public.bureau_queries(sms_link_token);

-- ============================================================================
-- TABLE: transactions
-- Transacao de credito apos cliente terminar onboarding
-- ============================================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  bureau_query_id uuid not null references public.bureau_queries(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,

  -- dados do cliente para boleto futuro
  cpf text not null,
  full_name text,
  email text,
  phone text,

  -- endereco
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,

  -- valor e parcelamento
  chosen_amount numeric(10,2),
  installments int,
  installment_value numeric(10,2),
  first_due_date date,
  terms_accepted_at timestamptz,

  -- pin e seguranca
  pin_hash text,
  pin_attempts int not null default 0,
  pin_locked_until timestamptz,

  -- qr code (string unica, codificada como QR no cliente)
  qr_code text unique,

  -- status
  status transaction_status not null default 'pending_onboarding',
  activated_at timestamptz,
  activated_by_cashier_id uuid references auth.users(id),
  cancelled_at timestamptz,
  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_event_idx on public.transactions(event_id);
create index transactions_qr_idx on public.transactions(qr_code);
create index transactions_status_idx on public.transactions(status);
create index transactions_cpf_idx on public.transactions(cpf);

-- ============================================================================
-- TABLE: transaction_events
-- Audit log de tudo que acontece com uma transacao
-- ============================================================================
create table public.transaction_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id),
  actor_role text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index transaction_events_tx_idx on public.transaction_events(transaction_id);
create index transaction_events_type_idx on public.transaction_events(event_type);

-- ============================================================================
-- TABLE: profiles
-- Profile dos usuarios autenticados (admin / cashier)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text,
  event_id uuid references public.events(id),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- ============================================================================
-- TRIGGER: updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- REALTIME
-- ============================================================================
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.bureau_queries;
alter publication supabase_realtime add table public.transaction_events;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.events enable row level security;
alter table public.event_promoter_tokens enable row level security;
alter table public.bureau_queries enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_events enable row level security;
alter table public.profiles enable row level security;

-- helper: current user role
create or replace function public.current_user_role()
returns user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- events: admin tudo, cashier le todos os ativos
create policy events_admin_all on public.events
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy events_cashier_read on public.events
  for select using (public.current_user_role() = 'cashier' and status = 'active');

-- event_promoter_tokens: admin tudo, anon pode ler por token (validacao no app)
create policy promoter_tokens_admin_all on public.event_promoter_tokens
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy promoter_tokens_anon_read on public.event_promoter_tokens
  for select to anon using (active = true);

-- bureau_queries: admin/cashier le tudo, anon le por sms_link_token
create policy bureau_queries_staff_read on public.bureau_queries
  for select using (public.current_user_role() in ('admin', 'cashier'));

create policy bureau_queries_anon_read on public.bureau_queries
  for select to anon using (sms_link_token is not null);

-- transactions: admin/cashier le tudo, cashier UPDATE para activated, anon le por qr_code
create policy transactions_staff_read on public.transactions
  for select using (public.current_user_role() in ('admin', 'cashier'));

create policy transactions_anon_read on public.transactions
  for select to anon using (qr_code is not null);

create policy transactions_cashier_activate on public.transactions
  for update using (public.current_user_role() = 'cashier' and status = 'awaiting_activation')
  with check (public.current_user_role() = 'cashier');

-- transaction_events: admin/cashier le tudo
create policy transaction_events_staff_read on public.transaction_events
  for select using (public.current_user_role() in ('admin', 'cashier'));

create policy transaction_events_anon_read on public.transaction_events
  for select to anon using (true);

-- profiles: usuario ve seu proprio + admin ve todos
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());

create policy profiles_admin_all on public.profiles
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
