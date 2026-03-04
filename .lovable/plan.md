
# NexaOS — Phase 1: Database + Auth Foundation (Final)

## Overview
Build the Supabase backend foundation for NexaOS — a lead recovery and review automation platform for contractors. This phase: full schema with enums, auth, workspace membership with roles, RLS policies, and an authenticated app shell.

## 1. Enable Supabase (Lovable Cloud)

## 2. Enums
- `workspace_role`: owner, admin, staff, tech
- `member_status`: active, invited, disabled
- `lead_status`: new, contacted, qualified, unqualified, lost
- `job_status`: scheduled, in_progress, completed, cancelled
- `call_status`: missed, answered, voicemail
- `review_status`: pending, sent, completed, declined
- `conversation_channel`: sms, call, form, email

## 3. Database Schema

### Core
- **workspaces** — id, name, slug (UNIQUE), industry, timezone, created_at, updated_at
- **profiles** — id (FK auth.users), full_name, avatar_url, created_at, updated_at
- **workspace_members** — id, workspace_id, user_id, role (workspace_role), status (member_status default 'active'), joined_at, invited_by; UNIQUE(workspace_id, user_id)
- **locations** — id, workspace_id, name, address, phone, service_area, google_review_link, created_at, updated_at

### Leads & Pipeline
- **leads** — id, workspace_id, location_id, assigned_to (FK profiles), name, phone, normalized_phone, email, source, status (lead_status), created_at, updated_at
- **pipeline_stages** — id, workspace_id, name, position, created_at; UNIQUE(workspace_id, position), UNIQUE(workspace_id, name)
- **jobs** — id, lead_id, workspace_id, stage_id, scheduled_at, completed_at, status (job_status), created_at, updated_at

### Communications
- **conversations** — id, lead_id, workspace_id, channel (conversation_channel), direction, content, created_at
- **calls** — id, lead_id, workspace_id, direction, status (call_status), duration, twilio_sid, created_at

### Reviews
- **review_requests** — id, job_id, workspace_id, rating_value, status (review_status), google_review_url, created_at, updated_at
- **feedback_tickets** — id, review_request_id, workspace_id, content, created_at

### Platform
- **websites** — id, workspace_id, type (existing/generated), domain, config (jsonb), created_at, updated_at
- **integrations** — id, workspace_id, provider, config (jsonb), status, connected_at, created_at, updated_at
- **workflow_logs** — id, workspace_id, event_type, payload (jsonb), created_at

## 4. Auth & Security
- Email/password auth via Supabase Auth
- Auto-create profile on signup (DB trigger)
- `has_role(workspace_id, user_id, role)` security definer function
- RLS on all tables scoped to workspace membership WHERE member status = 'active'
- Permission matrix: owner (full CRUD + member mgmt), admin (CRUD, no billing), staff (read + assigned leads/jobs), tech (read-only own assignments)

## 5. Seed Data
- Default pipeline stages per workspace: New Lead → Contacted → Quoted → Booked → Completed
- Sample workspace, location, and leads for development

## 6. Authenticated App Shell
- Login / Signup pages with NexaOS branding
- Sidebar nav: Dashboard, Leads, Pipeline, Automations, Reviews, Website, Analytics, Settings
- Protected routes redirecting unauthenticated users
- Post-signup workspace creation flow (name, trade, timezone → auto-assign owner, create default stages)
- Mobile-responsive collapsible sidebar
