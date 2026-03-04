import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from '@/hooks/use-toast';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return '+' + digits;
}

function handleRlsError(error: any) {
  const msg = error?.message ?? '';
  if (msg.includes('row-level security') || msg.includes('policy') || error?.code === '42501') {
    toast({ title: 'Permission denied', description: "You don't have permission to update this record.", variant: 'destructive' });
  } else {
    toast({ title: 'Error', description: msg, variant: 'destructive' });
  }
}

export function useLeadMutations() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const createLead = useMutation({
    mutationFn: async (input: Omit<TablesInsert<'leads'>, 'workspace_id'>) => {
      if (!workspace) throw new Error('No workspace');
      const normalized_phone = input.phone ? normalizePhone(input.phone) : null;
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...input, workspace_id: workspace.id, normalized_phone })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead created' });
    },
    onError: handleRlsError,
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'leads'> & { id: string }) => {
      if (updates.phone) {
        updates.normalized_phone = normalizePhone(updates.phone);
      }
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead', data.id] });
      toast({ title: 'Lead updated' });
    },
    onError: handleRlsError,
  });

  return { createLead, updateLead };
}
