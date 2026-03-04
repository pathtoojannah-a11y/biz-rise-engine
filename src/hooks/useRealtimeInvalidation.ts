import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

const TABLES = ['leads', 'jobs', 'conversations', 'calls'] as const;

const INVALIDATION_MAP: Record<string, string[][]> = {
  leads: [['leads'], ['lead']],
  jobs: [['pipeline-jobs']],
  conversations: [['lead-conversations']],
  calls: [['lead-calls']],
};

export function useRealtimeInvalidation() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  useEffect(() => {
    if (!workspace) return;

    const channel = supabase.channel(`workspace-${workspace.id}`);

    for (const table of TABLES) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          for (const key of INVALIDATION_MAP[table]) {
            qc.invalidateQueries({ queryKey: key });
          }
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace, qc]);
}
