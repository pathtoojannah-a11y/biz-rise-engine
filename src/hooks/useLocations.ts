import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export function useLocations() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ['locations', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('workspace_id', workspace!.id)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });
}
