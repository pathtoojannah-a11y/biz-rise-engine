
-- Add outcome tracking to review_requests
CREATE TYPE public.review_outcome AS ENUM ('pending', 'public_redirected', 'private_recovery', 'no_response');

ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS outcome public.review_outcome NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0;

-- Add status/priority/assignment to feedback_tickets
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_review', 'resolved');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high');

ALTER TABLE public.feedback_tickets
  ADD COLUMN IF NOT EXISTS status public.ticket_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS priority public.ticket_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_requests_workspace_status ON public.review_requests(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_review_requests_outcome ON public.review_requests(outcome);
CREATE INDEX IF NOT EXISTS idx_review_requests_job_id ON public.review_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_workspace_status ON public.feedback_tickets(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_assigned ON public.feedback_tickets(assigned_to);
