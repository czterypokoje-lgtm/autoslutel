-- ============================================================================
-- CRM fase 20: een plek voor de facturen zelf.
--
-- Run after 0019_purchase_invoices.sql. Idempotent.
--
-- The upload was going to Vercel Blob, which needs BLOB_READ_WRITE_TOKEN — a
-- variable this deployment does not have. Every upload therefore failed with
-- "Opslaan van het bestand mislukt" and no way for the monteur to know why.
-- Supabase is already paid for and already authenticated on the request.
--
-- Private on purpose. An invoice carries a supplier, an address and what
-- somebody paid; the page reads it back through a signed link that expires,
-- never a public URL that would sit in a browser history forever.
--
-- The path is `<technician_id>/<uuid>.<ext>`, so the first folder is the owner
-- and the policies below are one string comparison.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturen',
  'facturen',
  false,
  12582912, -- 12 MB, the same cap the route enforces
  array[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'facturen_read') then
    create policy facturen_read on storage.objects
      for select to authenticated
      using (
        bucket_id = 'facturen'
        and (
          public.crm_role() in ('owner', 'kantoor')
          -- The first path segment is the technician the invoice belongs to.
          or (storage.foldername(name))[1] = public.my_technician_id()::text
        )
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'facturen_write') then
    create policy facturen_write on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'facturen'
        and (
          public.crm_role() in ('owner', 'kantoor')
          or (storage.foldername(name))[1] = public.my_technician_id()::text
        )
      );
  end if;

  /* Deleting proof of a purchase is the office's call, never the buyer's. */
  if not exists (select 1 from pg_policies where policyname = 'facturen_delete') then
    create policy facturen_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'facturen' and public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;
