-- Novo fluxo: promotor ativa direto, sem PIN/QR/caixa.
-- PIN, QR e cashier viram opcionais (mantidos pra historico). Adiciona promoter token na ativacao.

alter table public.transactions
  add column if not exists activated_by_promoter_token_id uuid references public.event_promoter_tokens(id);

-- caso alguma policy ainda dependa de cashier ativando
drop policy if exists transactions_cashier_activate on public.transactions;

-- Nada mais e necessario; promoter-activate edge function usa service role.
