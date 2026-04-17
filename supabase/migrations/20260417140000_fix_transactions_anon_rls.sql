-- Fluxo novo nao usa qr_code. Promotor (anon) precisa ler transactions
-- de eventos ativos pra mostrar lista de "Aguardando ativacao".

drop policy if exists transactions_anon_read on public.transactions;

create policy transactions_anon_read_active_event on public.transactions
  for select to anon using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'active'
    )
  );
