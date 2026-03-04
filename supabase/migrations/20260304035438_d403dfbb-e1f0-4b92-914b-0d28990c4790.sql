
-- Pilots tracking table
CREATE TABLE public.pilots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  status text NOT NULL DEFAULT 'onboarding',
  connected_number text,
  start_date date,
  notes text,
  metrics_before jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics_after jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pilots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pilots" ON public.pilots FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can create pilots" ON public.pilots FOR INSERT
  WITH CHECK (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update pilots" ON public.pilots FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete pilots" ON public.pilots FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

CREATE TRIGGER update_pilots_updated_at
  BEFORE UPDATE ON public.pilots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add onboarding_config to workspaces for go-live wizard state
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS onboarding_config jsonb NOT NULL DEFAULT '{}'::jsonb;
