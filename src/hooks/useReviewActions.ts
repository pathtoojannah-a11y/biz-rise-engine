import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';

export function useReviewActions() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const sendReviewRequest = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('review-request-send', {
        body: { job_id: jobId, workspace_id: workspace!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['review-stats'] });
      toast.success(data?.already_exists ? 'Review request already sent' : 'Review request sent!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { sendReviewRequest };
}
