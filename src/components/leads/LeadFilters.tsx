import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocations } from '@/hooks/useLocations';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { Constants } from '@/integrations/supabase/types';
import type { LeadFilters as LF } from '@/hooks/useLeads';

interface Props {
  filters: LF;
  updateFilter: <K extends keyof LF>(key: K, value: LF[K]) => void;
}

export function LeadFilters({ filters, updateFilter }: Props) {
  const { data: locations } = useLocations();
  const { data: members } = useWorkspaceMembers();

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={filters.status || 'all'} onValueChange={(v) => updateFilter('status', v === 'all' ? '' : v as any)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Constants.public.Enums.lead_status.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.locationId || 'all'} onValueChange={(v) => updateFilter('locationId', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {(locations ?? []).map((l) => (
            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.assignedTo || 'all'} onValueChange={(v) => updateFilter('assignedTo', v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assigned To" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {(members ?? []).map((m: any) => (
            <SelectItem key={m.user_id} value={m.user_id}>{m.profiles?.full_name || 'Unknown'}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sort} onValueChange={(v) => updateFilter('sort', v as any)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
