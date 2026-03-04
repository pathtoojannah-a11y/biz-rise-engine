import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from '@/hooks/use-toast';

export interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  from_number: string;
  missed_call_sms: boolean;
  qualification_flow: boolean;
  auto_create_job: boolean;
  missed_call_template: string;
  booking_link: string;
}

const DEFAULT_CONFIG: TwilioConfig = {
  account_sid: '',
  auth_token: '',
  from_number: '',
  missed_call_sms: true,
  qualification_flow: true,
  auto_create_job: true,
  missed_call_template: '',
  booking_link: '',
};

export function useAutomationConfig() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['twilio-config', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .eq('provider', 'twilio')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workspace,
  });

  const config: TwilioConfig = {
    ...DEFAULT_CONFIG,
    ...((query.data?.config as any) || {}),
  };

  const isConnected = query.data?.status === 'connected';

  const saveConfig = useMutation({
    mutationFn: async (newConfig: Partial<TwilioConfig>) => {
      if (!workspace) throw new Error('No workspace');
      const merged = { ...config, ...newConfig };
      const hasCredentials = merged.account_sid && merged.auth_token && merged.from_number;

      if (query.data) {
        const { error } = await supabase
          .from('integrations')
          .update({
            config: merged as any,
            status: hasCredentials ? 'connected' : 'disconnected',
            connected_at: hasCredentials ? new Date().toISOString() : null,
          })
          .eq('id', query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert({
            workspace_id: workspace.id,
            provider: 'twilio',
            config: merged as any,
            status: hasCredentials ? 'connected' : 'disconnected',
            connected_at: hasCredentials ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twilio-config'] });
      toast({ title: 'Settings saved' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const sendTestSms = useMutation({
    mutationFn: async (to: string) => {
      if (!workspace) throw new Error('No workspace');
      const { data, error } = await supabase.functions.invoke('twilio-send-sms', {
        body: { workspace_id: workspace.id, to, message: 'Test SMS from NexaOS 🚀' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Test SMS sent!' });
    },
    onError: (err: any) => {
      toast({ title: 'SMS failed', description: err.message, variant: 'destructive' });
    },
  });

  return { config, isConnected, isLoading: query.isLoading, saveConfig, sendTestSms };
}
