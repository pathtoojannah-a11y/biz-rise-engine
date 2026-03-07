ALTER TABLE public.provisioned_numbers
  ADD COLUMN IF NOT EXISTS number_type text NOT NULL DEFAULT 'primary';
