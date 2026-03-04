import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge } from './LeadsInbox';
import { format } from 'date-fns';

interface Props {
  lead: any;
  onClick: () => void;
}

export function LeadRow({ lead, onClick }: Props) {
  return (
    <TableRow className="cursor-pointer" onClick={onClick}>
      <TableCell className="font-medium text-foreground">{lead.name}</TableCell>
      <TableCell className="text-muted-foreground">{lead.phone || '—'}</TableCell>
      <TableCell className="text-muted-foreground capitalize">{lead.source || '—'}</TableCell>
      <TableCell><StatusBadge status={lead.status} /></TableCell>
      <TableCell className="text-muted-foreground">{lead.profiles?.full_name || 'Unassigned'}</TableCell>
      <TableCell className="text-muted-foreground">{lead.locations?.name || '—'}</TableCell>
      <TableCell className="text-muted-foreground">{format(new Date(lead.created_at), 'MMM d, yyyy')}</TableCell>
    </TableRow>
  );
}
