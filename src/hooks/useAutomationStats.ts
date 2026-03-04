import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export interface AutomationStats {
  totalEvents: number;
  errors: number;
  errorRate: number;
  smsSent: number;
  smsFailed: number;
  callsReceived: number;
  qualificationsCompleted: number;
  optOuts: number;
  rejectedWebhooks: number;
}

export function useAutomationStats() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ['automation-stats', workspace?.id],
    queryFn: async (): Promise<AutomationStats> => {
      if (!workspace) return { totalEvents: 0, errors: 0, errorRate: 0, smsSent: 0, smsFailed: 0, callsReceived: 0, qualificationsCompleted: 0, optOuts: 0, rejectedWebhooks: 0 };

      // Get last 24h of logs
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await supabase
        .from('workflow_logs')
        .select('event_type')
        .eq('workspace_id', workspace.id)
        .gte('created_at', since);

      if (!logs) return { totalEvents: 0, errors: 0, errorRate: 0, smsSent: 0, smsFailed: 0, callsReceived: 0, qualificationsCompleted: 0, optOuts: 0, rejectedWebhooks: 0 };

      const total = logs.length;
      const errors = logs.filter(l => l.event_type === 'error').length;
      const smsSent = logs.filter(l => ['sms_sent', 'manual_sms_sent'].includes(l.event_type)).length;
      const smsFailed = logs.filter(l => l.event_type === 'error').length;
      const callsReceived = logs.filter(l => l.event_type === 'call_received').length;
      const qualificationsCompleted = logs.filter(l => l.event_type === 'qualification_completed').length;
      const optOuts = logs.filter(l => l.event_type === 'opt_out').length;
      const rejectedWebhooks = logs.filter(l => l.event_type === 'webhook_rejected').length;

      return {
        totalEvents: total,
        errors,
        errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
        smsSent,
        smsFailed,
        callsReceived,
        qualificationsCompleted,
        optOuts,
        rejectedWebhooks,
      };
    },
    enabled: !!workspace,
    refetchInterval: 15000,
  });
}
