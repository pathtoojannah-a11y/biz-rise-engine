import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';

export function useFeedbackTickets() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ['feedback-tickets', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_tickets')
        .select('*, review_requests!inner(rating_value, job_id, jobs!inner(leads!inner(name, phone)))')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('feedback_tickets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-tickets'] });
      toast.success('Ticket updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { tickets: ticketsQuery.data ?? [], isLoading: ticketsQuery.isLoading, updateTicket };
}
