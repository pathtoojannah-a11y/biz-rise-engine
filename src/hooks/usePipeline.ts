import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useMemo } from 'react';

export function usePipeline() {
  const { workspace } = useWorkspace();

  const query = useQuery({
    queryKey: ['pipeline-jobs', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, leads!inner(name, phone, status, assigned_to)')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });

  const jobsByStage = useMemo(() => {
    const map: Record<string, typeof query.data> = {};
    for (const job of query.data ?? []) {
      const sid = job.stage_id ?? 'unassigned';
      if (!map[sid]) map[sid] = [];
      map[sid]!.push(job);
    }
    return map;
  }, [query.data]);

  return {
    jobs: query.data ?? [],
    jobsByStage,
    isLoading: query.isLoading,
  };
}
