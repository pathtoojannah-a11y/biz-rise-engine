
-- ==========================================
-- NexaOS Phase 1 Hardening Migration
-- ==========================================

-- 1. MISSING INDEXES
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_workspace ON public.feedback_tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON public.integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_locations_workspace ON public.locations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_websites_workspace ON public.websites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_location ON public.leads(location_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_lead ON public.jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON public.jobs(stage_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_job ON public.review_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON public.workspace_members(workspace_id, status);

-- 2. FIX UPDATE POLICIES: Add WITH CHECK to prevent workspace_id mutation
-- For every table with UPDATE policy, add WITH CHECK that workspace_id matches USING

-- calls
DROP POLICY "Owner/admin can update calls" ON public.calls;
CREATE POLICY "Owner/admin can update calls" ON public.calls FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- conversations
DROP POLICY "Owner/admin can update conversations" ON public.conversations;
CREATE POLICY "Owner/admin can update conversations" ON public.conversations FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- feedback_tickets
DROP POLICY "Owner/admin can update feedback" ON public.feedback_tickets;
CREATE POLICY "Owner/admin can update feedback" ON public.feedback_tickets FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- integrations
DROP POLICY "Owner/admin can update integrations" ON public.integrations;
CREATE POLICY "Owner/admin can update integrations" ON public.integrations FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- jobs
DROP POLICY "Owner/admin/assigned can update jobs" ON public.jobs;
CREATE POLICY "Owner/admin/assigned can update jobs" ON public.jobs FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()) OR (assigned_to = auth.uid() AND is_active_member(workspace_id, auth.uid())))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()) OR (assigned_to = auth.uid() AND is_active_member(workspace_id, auth.uid())));

-- leads
DROP POLICY "Owner/admin/assigned can update leads" ON public.leads;
CREATE POLICY "Owner/admin/assigned can update leads" ON public.leads FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()) OR (assigned_to = auth.uid() AND is_active_member(workspace_id, auth.uid())))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()) OR (assigned_to = auth.uid() AND is_active_member(workspace_id, auth.uid())));

-- locations
DROP POLICY "Owner/admin can update locations" ON public.locations;
CREATE POLICY "Owner/admin can update locations" ON public.locations FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- pipeline_stages
DROP POLICY "Owner/admin can update stages" ON public.pipeline_stages;
CREATE POLICY "Owner/admin can update stages" ON public.pipeline_stages FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- review_requests
DROP POLICY "Owner/admin can update reviews" ON public.review_requests;
CREATE POLICY "Owner/admin can update reviews" ON public.review_requests FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- websites
DROP POLICY "Owner/admin can update websites" ON public.websites;
CREATE POLICY "Owner/admin can update websites" ON public.websites FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- workspace_members
DROP POLICY "Owner/admin can update members" ON public.workspace_members;
CREATE POLICY "Owner/admin can update members" ON public.workspace_members FOR UPDATE
  USING (is_owner_or_admin(workspace_id, auth.uid()))
  WITH CHECK (is_owner_or_admin(workspace_id, auth.uid()));

-- workspaces
DROP POLICY "Owners can update workspace" ON public.workspaces;
CREATE POLICY "Owners can update workspace" ON public.workspaces FOR UPDATE
  USING (has_role(id, auth.uid(), 'owner'))
  WITH CHECK (has_role(id, auth.uid(), 'owner'));

-- 3. Make workspace_id columns immutable via trigger (prevents changing workspace_id on UPDATE)
CREATE OR REPLACE FUNCTION public.prevent_workspace_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'Cannot change workspace_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER immutable_workspace_id_locations BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_pipeline_stages BEFORE UPDATE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_jobs BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_conversations BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_calls BEFORE UPDATE ON public.calls FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_review_requests BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_feedback_tickets BEFORE UPDATE ON public.feedback_tickets FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_websites BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_integrations BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_workflow_logs BEFORE UPDATE ON public.workflow_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();
CREATE TRIGGER immutable_workspace_id_workspace_members BEFORE UPDATE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_id_change();

-- 4. Bootstrap idempotency: unique constraints already exist on pipeline_stages(workspace_id, name) and workspace_members(workspace_id, user_id)
-- Add ON CONFLICT handling in app code (already safe via UNIQUE constraints)
