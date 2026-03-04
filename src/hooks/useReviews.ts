import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

export function useReviews(filters?: { status?: string; outcome?: string }) {
  const { workspace } = useWorkspace();

  const reviewsQuery = useQuery({
    queryKey: ['reviews', workspace?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('review_requests')
        .select('*, jobs!inner(id, lead_id, status, leads!inner(name, phone))')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false });
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.outcome) query = query.eq('outcome', filters.outcome as any);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });

  const statsQuery = useQuery({
    queryKey: ['review-stats', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_requests')
        .select('status, outcome, rating_value')
        .eq('workspace_id', workspace!.id);
      if (error) throw error;
      const total = data?.length ?? 0;
      const sent = data?.filter(r => r.status === 'sent' || r.status === 'completed').length ?? 0;
      const completed = data?.filter(r => r.status === 'completed').length ?? 0;
      const high = data?.filter(r => r.rating_value && r.rating_value >= 4).length ?? 0;
      const low = data?.filter(r => r.rating_value && r.rating_value <= 3).length ?? 0;
      const redirected = data?.filter(r => (r.outcome as string) === 'public_redirected').length ?? 0;
      return {
        total, sent, completed, high, low,
        responseRate: sent > 0 ? Math.round((completed / sent) * 100) : 0,
        redirectRate: completed > 0 ? Math.round((redirected / completed) * 100) : 0,
      };
    },
    enabled: !!workspace,
  });

  return { reviews: reviewsQuery.data ?? [], stats: statsQuery.data, isLoading: reviewsQuery.isLoading };
}
