import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from '@/hooks/use-toast';
import type { TablesInsert } from '@/integrations/supabase/types';

function handleRlsError(error: any) {
  const msg = error?.message ?? '';
  if (msg.includes('row-level security') || msg.includes('policy') || error?.code === '42501') {
    toast({ title: 'Permission denied', description: "You don't have permission to update this record.", variant: 'destructive' });
  } else {
    toast({ title: 'Error', description: msg, variant: 'destructive' });
  }
}

export function useJobMutations() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const createJob = useMutation({
    mutationFn: async (input: Omit<TablesInsert<'jobs'>, 'workspace_id'>) => {
      if (!workspace) throw new Error('No workspace');
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...input, workspace_id: workspace.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-jobs'] });
      toast({ title: 'Job created' });
    },
    onError: handleRlsError,
  });

  const moveJob = useMutation({
    mutationFn: async ({ jobId, newStageId }: { jobId: string; newStageId: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ stage_id: newStageId })
        .eq('id', jobId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ jobId, newStageId }) => {
      await qc.cancelQueries({ queryKey: ['pipeline-jobs'] });
      const prev = qc.getQueryData(['pipeline-jobs', workspace?.id]);
      qc.setQueryData(['pipeline-jobs', workspace?.id], (old: any[]) =>
        old?.map((j: any) => j.id === jobId ? { ...j, stage_id: newStageId } : j)
      );
      return { prev };
    },
    onError: (err, _vars, context) => {
      if (context?.prev) qc.setQueryData(['pipeline-jobs', workspace?.id], context.prev);
      handleRlsError(err);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-jobs'] });
    },
  });

  return { createJob, moveJob };
}
