-- Anon precisa ler eventos ativos para o promotor app validar URL via join
create policy events_anon_read_active on public.events
  for select to anon using (status = 'active');
