import { useWorkflowLogs } from '@/hooks/useWorkflowLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Activity, AlertCircle, CheckCircle, Phone, MessageSquare, User, Zap } from 'lucide-react';

const EVENT_ICONS: Record<string, any> = {
  call_received: Phone,
  sms_received: MessageSquare,
  sms_sent: MessageSquare,
  manual_sms_sent: MessageSquare,
  lead_upserted: User,
  qualification_step: Zap,
  qualification_completed: CheckCircle,
  opt_out: AlertCircle,
  error: AlertCircle,
  webhook_rejected: AlertCircle,
};

const EVENT_COLORS: Record<string, string> = {
  error: 'bg-destructive/15 text-destructive',
  webhook_rejected: 'bg-destructive/15 text-destructive',
  qualification_completed: 'bg-accent/15 text-accent',
  sms_sent: 'bg-primary/15 text-primary',
  manual_sms_sent: 'bg-primary/15 text-primary',
  call_received: 'bg-[hsl(var(--nexa-warning))]/15 text-[hsl(var(--nexa-warning))]',
  opt_out: 'bg-muted text-muted-foreground',
};

export function WorkflowLogsList() {
  const { data: logs, isLoading } = useWorkflowLogs(100);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">No automation events yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Events will appear here when automations run</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const Icon = EVENT_ICONS[log.event_type] || Activity;
        const colorClass = EVENT_COLORS[log.event_type] || 'bg-muted text-muted-foreground';
        const payload = (log.payload as any) || {};

        return (
          <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
            <div className={`mt-0.5 rounded-full p-1.5 ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground capitalize">
                  {log.event_type.replace(/_/g, ' ')}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {format(new Date(log.created_at), 'h:mm:ss a')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {payload.error || payload.phone || payload.from || payload.to || payload.reason || payload.lead_id || ''}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {format(new Date(log.created_at), 'MMM d')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
