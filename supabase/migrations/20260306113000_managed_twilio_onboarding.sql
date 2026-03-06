ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS business_zip text;

CREATE TABLE IF NOT EXISTS public.provisioned_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid UNIQUE REFERENCES public.workspaces(id) ON DELETE SET NULL,
  phone_number text NOT NULL UNIQUE,
  twilio_sid text NOT NULL UNIQUE,
  friendly_name text,
  area_code text,
  status text NOT NULL DEFAULT 'active',
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pn_workspace ON public.provisioned_numbers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pn_phone ON public.provisioned_numbers(phone_number);

ALTER TABLE public.provisioned_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view provisioned numbers" ON public.provisioned_numbers;
CREATE POLICY "Members can view provisioned numbers" ON public.provisioned_numbers FOR SELECT
  USING (workspace_id IS NOT NULL AND public.is_active_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Owner/admin can manage provisioned numbers" ON public.provisioned_numbers;
CREATE POLICY "Owner/admin can manage provisioned numbers" ON public.provisioned_numbers FOR ALL
  USING (workspace_id IS NOT NULL AND public.is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_owner_or_admin(workspace_id, auth.uid()));
