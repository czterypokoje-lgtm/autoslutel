-- ============================================================================
-- CRM fase 8: Routing and Maps
-- ============================================================================

-- Add coordinate columns to jobs
alter table public.jobs add column if not exists lat numeric(9,6);
alter table public.jobs add column if not exists lng numeric(9,6);

-- Add coordinate columns to technicians for their home base
alter table public.technicians add column if not exists base_lat numeric(9,6);
alter table public.technicians add column if not exists base_lng numeric(9,6);

-- Indexes to quickly find active jobs or technicians by location (bounding box searches)
create index if not exists jobs_lat_lng_idx on public.jobs (lat, lng);
create index if not exists technicians_base_lat_lng_idx on public.technicians (base_lat, base_lng);

notify pgrst, 'reload schema';
