-- What the customer said in their own words.
--
-- Every field the wizard collects is a menu: a plate, two icons, a postcode.
-- A menu cannot hold "sleutel afgebroken in het contactslot" or "auto staat
-- in een parkeergarage" -- and that detail is what separates a twenty-minute
-- visit from a tow. The wizard writes it through /api/leads/details, on the
-- row the lead already has, so a missing column can never cost us the lead
-- itself.
alter table public.leads add column if not exists note text;

comment on column public.leads.note is
  'Free-text description from the customer. Optional, max 500 chars, never required.';
