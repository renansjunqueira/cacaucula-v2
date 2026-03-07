ALTER TABLE public.collaborators
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2) NOT NULL DEFAULT 0;
