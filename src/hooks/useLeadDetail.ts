import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export function useLeadDetail(leadId: string | null) {
  const { workspace } = useWorkspace();

  const leadQuery = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, locations(name), profiles:assigned_to(full_name)')
        .eq('id', leadId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && !!workspace,
  });

  const conversationsQuery = useQuery({
    queryKey: ['lead-conversations', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId && !!workspace,
  });

  const callsQuery = useQuery({
    queryKey: ['lead-calls', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId && !!workspace,
  });

  return {
    lead: leadQuery.data ?? null,
    conversations: conversationsQuery.data ?? [],
    calls: callsQuery.data ?? [],
    isLoading: leadQuery.isLoading || conversationsQuery.isLoading || callsQuery.isLoading,
  };
}
