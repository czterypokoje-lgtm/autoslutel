-- ============================================================================
-- CRM fase 10: productinhoud beheerbaar maken — foto's, teksten, meta tags.
--
-- Run after 0010_product_overrides.sql. Idempotent.
--
-- Same principle as 0010: the supplier feed stays the base, these columns hold
-- what the office decided. Null means "use the feed", which is why nothing here
-- has a default.
-- ============================================================================

-- Main image. A supplier photo of a blank key on a white background sells
-- nothing; a photo of the actual part, shot in the workshop, does.
alter table public.product_overrides add column if not exists image_override text;

-- Extra photos, in display order: ["https://…", "https://…"].
alter table public.product_overrides add column if not exists images jsonb not null default '[]'::jsonb;

-- SEO. Kept separate from the on-page title: the sentence that wins a click in
-- Google is rarely the sentence that reads best as a heading.
alter table public.product_overrides add column if not exists meta_title_override       text;
alter table public.product_overrides add column if not exists meta_description_override text;

-- Short copy on the card and the direct answer block.
alter table public.product_overrides add column if not exists excerpt_override      text;
alter table public.product_overrides add column if not exists direct_answer_override text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_overrides_images_check'
  ) then
    alter table public.product_overrides
      add constraint product_overrides_images_check
      check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 12);
  end if;
end $$;

notify pgrst, 'reload schema';
