import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export function useWorkspaceMembers() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('user_id, role, profiles:user_id(full_name)')
        .eq('workspace_id', workspace!.id)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });
}
