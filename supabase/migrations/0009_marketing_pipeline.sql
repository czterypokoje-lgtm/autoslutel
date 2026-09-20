-- Marketing Data Pipeline

-- 1. Table for daily marketing costs
CREATE TABLE IF NOT EXISTS public.crm_marketing_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  source text NOT NULL, -- 'google', 'meta', 'bing', 'seo'
  spend numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, source)
);

-- 2. Add tracking columns to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS click_id text; -- gclid, fbclid, msclkid

-- Grant permissions
GRANT ALL ON public.crm_marketing_costs TO authenticated;
GRANT ALL ON public.crm_marketing_costs TO service_role;
