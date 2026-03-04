
-- ==========================================
-- NexaOS Phase 1: Full Schema Migration
-- ==========================================

-- 1. ENUMS
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'staff', 'tech');
CREATE TYPE public.member_status AS ENUM ('active', 'invited', 'disabled');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'lost');
CREATE TYPE public.job_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.call_status AS ENUM ('missed', 'answered', 'voicemail');
CREATE TYPE public.review_status AS ENUM ('pending', 'sent', 'completed', 'declined');
CREATE TYPE public.conversation_channel AS ENUM ('sms', 'call', 'form', 'email');

-- 2. HELPER: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. TABLES

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT DEFAULT 'contractor',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- workspace_members
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'staff',
  status public.member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(workspace_id, user_id)
);

-- locations
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  service_area TEXT,
  google_review_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  assigned_to UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  phone TEXT,
  normalized_phone TEXT,
  email TEXT,
  source TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pipeline_stages
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, position),
  UNIQUE(workspace_id, name)
);

-- jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.pipeline_stages(id),
  assigned_to UUID REFERENCES public.profiles(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status public.job_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel public.conversation_channel NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- calls
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status public.call_status NOT NULL DEFAULT 'missed',
  duration INT DEFAULT 0,
  twilio_sid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- review_requests
CREATE TABLE public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rating_value INT CHECK (rating_value >= 1 AND rating_value <= 5),
  status public.review_status NOT NULL DEFAULT 'pending',
  google_review_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_review_requests_updated_at BEFORE UPDATE ON public.review_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- feedback_tickets
CREATE TABLE public.feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id UUID NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- websites
CREATE TABLE public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('existing', 'generated')),
  domain TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- integrations
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'disconnected',
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- workflow_logs
CREATE TABLE public.workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX idx_leads_normalized_phone ON public.leads(normalized_phone);
CREATE INDEX idx_jobs_workspace ON public.jobs(workspace_id);
CREATE INDEX idx_jobs_assigned ON public.jobs(assigned_to);
CREATE INDEX idx_conversations_workspace ON public.conversations(workspace_id);
CREATE INDEX idx_calls_workspace ON public.calls(workspace_id);
CREATE INDEX idx_review_requests_workspace ON public.review_requests(workspace_id);
CREATE INDEX idx_workflow_logs_workspace ON public.workflow_logs(workspace_id);

-- 5. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SECURITY DEFINER HELPER FUNCTIONS

-- Check active workspace membership
CREATE OR REPLACE FUNCTION public.is_active_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND status = 'active'
  )
$$;

-- Check role
CREATE OR REPLACE FUNCTION public.has_role(_workspace_id UUID, _user_id UUID, _role public.workspace_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role = _role
      AND status = 'active'
  )
$$;

-- Check if user has owner or admin role
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
$$;

-- 7. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System creates profile on signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- workspaces
CREATE POLICY "Members can view workspace" ON public.workspaces FOR SELECT
  USING (public.is_active_member(id, auth.uid()));
CREATE POLICY "Authenticated users can create workspace" ON public.workspaces FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update workspace" ON public.workspaces FOR UPDATE
  USING (public.has_role(id, auth.uid(), 'owner'));
CREATE POLICY "Owners can delete workspace" ON public.workspaces FOR DELETE
  USING (public.has_role(id, auth.uid(), 'owner'));

-- workspace_members
CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Owner/admin can invite members" ON public.workspace_members FOR INSERT
  TO authenticated WITH CHECK (
    public.is_owner_or_admin(workspace_id, auth.uid())
    OR (user_id = auth.uid()) -- allow self-insert when creating workspace
  );
CREATE POLICY "Owner/admin can update members" ON public.workspace_members FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner can delete members" ON public.workspace_members FOR DELETE
  USING (public.has_role(workspace_id, auth.uid(), 'owner'));

-- locations
CREATE POLICY "Members can view locations" ON public.locations FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can create locations" ON public.locations FOR INSERT
  TO authenticated WITH CHECK (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update locations" ON public.locations FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete locations" ON public.locations FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- leads
CREATE POLICY "Members can view leads" ON public.leads FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create leads" ON public.leads FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin/assigned can update leads" ON public.leads FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Owner/admin can delete leads" ON public.leads FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- pipeline_stages
CREATE POLICY "Members can view stages" ON public.pipeline_stages FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can create stages" ON public.pipeline_stages FOR INSERT
  TO authenticated WITH CHECK (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update stages" ON public.pipeline_stages FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete stages" ON public.pipeline_stages FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- jobs
CREATE POLICY "Members can view jobs" ON public.jobs FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create jobs" ON public.jobs FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin/assigned can update jobs" ON public.jobs FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Owner/admin can delete jobs" ON public.jobs FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- conversations
CREATE POLICY "Members can view conversations" ON public.conversations FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create conversations" ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update conversations" ON public.conversations FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete conversations" ON public.conversations FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- calls
CREATE POLICY "Members can view calls" ON public.calls FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create calls" ON public.calls FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update calls" ON public.calls FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete calls" ON public.calls FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- review_requests
CREATE POLICY "Members can view reviews" ON public.review_requests FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create reviews" ON public.review_requests FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update reviews" ON public.review_requests FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete reviews" ON public.review_requests FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- feedback_tickets
CREATE POLICY "Members can view feedback" ON public.feedback_tickets FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create feedback" ON public.feedback_tickets FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update feedback" ON public.feedback_tickets FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete feedback" ON public.feedback_tickets FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- websites
CREATE POLICY "Members can view websites" ON public.websites FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can create websites" ON public.websites FOR INSERT
  TO authenticated WITH CHECK (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update websites" ON public.websites FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete websites" ON public.websites FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- integrations
CREATE POLICY "Members can view integrations" ON public.integrations FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can create integrations" ON public.integrations FOR INSERT
  TO authenticated WITH CHECK (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can update integrations" ON public.integrations FOR UPDATE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete integrations" ON public.integrations FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));

-- workflow_logs
CREATE POLICY "Members can view logs" ON public.workflow_logs FOR SELECT
  USING (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create logs" ON public.workflow_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_active_member(workspace_id, auth.uid()));
CREATE POLICY "Owner/admin can delete logs" ON public.workflow_logs FOR DELETE
  USING (public.is_owner_or_admin(workspace_id, auth.uid()));
