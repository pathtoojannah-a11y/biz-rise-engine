

# NexaOS Phase 2: Implementation Plan

## Migration (single SQL)
- `ALTER PUBLICATION supabase_realtime ADD TABLE` for leads, jobs, conversations, calls

## Data Hooks (7 files in `src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useLeads` | Paginated query with server-side filters (status, source, location, assigned_to, date range, search via `ilike`). Uses `count: 'exact'` for correct totalCount under all filter combos. |
| `useLeadDetail` | Single lead + conversations + calls in parallel queries |
| `useLeadMutations` | Create (with phone normalization: strip non-digits, +1 prefix), update. Catches RLS errors → toast. |
| `usePipelineStages` | Stages ordered by position |
| `usePipeline` | Jobs with `select('*, leads!inner(name, phone, status, assigned_to)')`, grouped by stage_id client-side |
| `useJobMutations` | Create job, `moveJob(id, newStageId)` with optimistic cache update + rollback on error. Server state always wins (re-fetch after mutation settles). |
| `useRealtimeInvalidation` | Single channel per workspace, subscribes to postgres_changes on 4 tables **filtered by `filter: 'workspace_id=eq.{id}'`** — prevents cross-tenant cache pollution. Invalidates specific query keys. |

## 5 Critical Checks — How They're Addressed

1. **Realtime filter safety**: Channel subscription uses `filter: 'workspace_id=eq.${workspace.id}'` so only current tenant events arrive. Query key invalidation is scoped.

2. **Optimistic DnD race conditions**: `moveJob` uses `onMutate` for instant UI, but `onSettled` always calls `invalidateQueries` to re-fetch server truth. Two concurrent moves → both settle → final server state rendered.

3. **Staff assigned-to policy edge**: All mutations wrap errors in a check — if Supabase returns 403/RLS violation, show toast "You don't have permission to update this record" and rollback optimistic state.

4. **Pagination + totalCount**: `useLeads` passes all active filters into the same query that uses `{ count: 'exact' }`. Total pages = `Math.ceil(count / pageSize)`. Filter/search changes reset page to 1.

5. **Timeline ordering**: Activity tab merges conversations + calls, sorts by `new Date(item.created_at).getTime()` descending. All timestamps come from Postgres `timestamptz` — consistent UTC comparison.

## Components (10 files in `src/components/leads/` and `src/components/pipeline/`)

**Leads:**
- `LeadsInbox` — table with search bar (debounced 300ms), filter bar, pagination footer
- `LeadFilters` — dropdowns for status, source, location, assigned user; date range picker
- `LeadRow` — table row with status badge, click opens drawer
- `LeadDetailDrawer` — Sheet from right, tabs (Activity, Conversations, Calls), inline edit form
- `NewLeadModal` — Dialog with zod-validated form, optional "create initial job" checkbox

**Pipeline:**
- `PipelineBoard` — horizontal scroll container, renders columns
- `PipelineColumn` — stage header + card list, drop target via HTML drag API
- `PipelineCard` — draggable job card (lead name, status, scheduled_at, assigned user)
- `AddJobModal` — Dialog to create job for a lead

## Pages
- `src/pages/Leads.tsx` — replaces placeholder, wraps LeadsInbox in AppLayout
- `src/pages/Pipeline.tsx` — replaces placeholder, wraps PipelineBoard in AppLayout

## Route Updates
- Replace Placeholder imports in App.tsx for `/leads` and `/pipeline`

## UX
- Skeleton loaders for table and kanban columns
- Status badges color-coded (new=blue, contacted=yellow, qualified=green, unqualified=gray, lost=red)
- Mobile: inbox becomes stacked cards, pipeline horizontally scrollable with snap
- Empty states for no leads / no jobs per column
- NexaOS design system preserved (Space Grotesk headings, indigo/teal)

## No Changes To
- Auth, workspace bootstrap, sidebar, other pages, RLS policies, existing schema

