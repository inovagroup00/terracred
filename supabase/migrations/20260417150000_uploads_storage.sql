-- Cliente vai subir foto do documento e selfie. Endereco vira opcional.
alter table public.transactions
  add column if not exists document_photo_url text,
  add column if not exists selfie_url text;

-- Bucket publico para uploads do cliente.
insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', true)
on conflict (id) do update set public = true;

-- Anon pode upload e leitura
drop policy if exists "client uploads insert" on storage.objects;
drop policy if exists "client uploads select" on storage.objects;

create policy "client uploads insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'client-uploads');

create policy "client uploads select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'client-uploads');
