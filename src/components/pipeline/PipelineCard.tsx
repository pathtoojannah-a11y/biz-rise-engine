import { StatusBadge } from '@/components/leads/LeadsInbox';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';

interface Props {
  job: any;
  stageId: string;
}

export function PipelineCard({ job, stageId }: Props) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('jobId', job.id);
    e.dataTransfer.setData('sourceStageId', stageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const lead = job.leads;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing active:shadow-lg"
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-foreground truncate">{lead?.name ?? 'Unknown'}</p>
        <StatusBadge status={job.status} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {job.scheduled_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(job.scheduled_at), 'MMM d')}
          </span>
        )}
        {lead?.assigned_to && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Assigned
          </span>
        )}
      </div>
    </div>
  );
}
