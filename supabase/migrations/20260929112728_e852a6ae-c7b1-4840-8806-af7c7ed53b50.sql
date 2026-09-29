ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS pairing_code text,
  ADD COLUMN IF NOT EXISTS pairing_code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_paired boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paired_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS screens_pairing_code_key ON public.screens (pairing_code) WHERE pairing_code IS NOT NULL;

UPDATE public.screens SET is_paired = true, paired_at = created_at WHERE store_id IS NOT NULL AND is_paired = false;