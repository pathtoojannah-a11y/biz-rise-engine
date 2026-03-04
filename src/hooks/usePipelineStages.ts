import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export function usePipelineStages() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ['pipeline-stages', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .order('position');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });
}
