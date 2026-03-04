-- Automation sessions for qualification state machine
CREATE TABLE public.automation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'qualification',
  current_step text NOT NULL DEFAULT 'step_1_service_type',
  answers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  last_message_sid text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, lead_id, type)
);

ALTER TABLE public.automation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sessions" ON public.automation_sessions
  FOR SELECT USING (is_active_member(workspace_id, auth.uid()));

CREATE POLICY "Members can create sessions" ON public.automation_sessions
  FOR INSERT WITH CHECK (is_active_member(workspace_id, auth.uid()));

CREATE POLICY "Owner/admin can update sessions" ON public.automation_sessions
  FOR UPDATE USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

CREATE POLICY "Owner/admin can delete sessions" ON public.automation_sessions
  FOR DELETE USING (is_owner_or_admin(workspace_id, auth.uid()));

-- Indexes
CREATE INDEX idx_automation_sessions_workspace ON public.automation_sessions(workspace_id);
CREATE INDEX idx_automation_sessions_lead ON public.automation_sessions(lead_id);
CREATE INDEX idx_automation_sessions_status ON public.automation_sessions(status);
CREATE INDEX idx_calls_twilio_sid ON public.calls(twilio_sid) WHERE twilio_sid IS NOT NULL;

-- Prevent workspace_id mutation
CREATE TRIGGER prevent_automation_sessions_workspace_change
  BEFORE UPDATE ON public.automation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();

-- Updated_at trigger
CREATE TRIGGER update_automation_sessions_updated_at
  BEFORE UPDATE ON public.automation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_logs;