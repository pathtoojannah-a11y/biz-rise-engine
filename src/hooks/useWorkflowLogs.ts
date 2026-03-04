import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export function useWorkflowLogs(limit = 50) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ['workflow-logs', workspace?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
    refetchInterval: 10000,
  });
}
