import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./useWorkspace";
import { toast } from "@/hooks/use-toast";

export interface TwilioConfig {
  from_number: string;
  twilio_number_sid: string;
  provisioned_number_id: string;
  provisioning_scope: "local" | "state" | "fallback" | null;
  contractor_phone: string;
  public_number: string;
  phone_path: "A" | "B" | null;
  missed_call_sms: boolean;
  qualification_flow: boolean;
  auto_create_job: boolean;
  missed_call_template: string;
  booking_link: string;
  review_delay_days: number;
  review_template: string;
  office_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const DEFAULT_CONFIG: TwilioConfig = {
  from_number: "",
  twilio_number_sid: "",
  provisioned_number_id: "",
  provisioning_scope: null,
  contractor_phone: "",
  public_number: "",
  phone_path: null,
  missed_call_sms: true,
  qualification_flow: true,
  auto_create_job: true,
  missed_call_template: "",
  booking_link: "",
  review_delay_days: 2,
  review_template: "",
  office_hours: {
    enabled: false,
    start: "08:00",
    end: "18:00",
  },
};

export function useAutomationConfig() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["twilio-config", workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("workspace_id", workspace!.id)
        .eq("provider", "twilio")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workspace,
  });

  const config: TwilioConfig = {
    ...DEFAULT_CONFIG,
    ...((query.data?.config as any) || {}),
    office_hours: {
      ...DEFAULT_CONFIG.office_hours,
      ...(((query.data?.config as any)?.office_hours as any) || {}),
    },
  };

  const integrationStatus = query.data?.status ?? "disconnected";
  const isProvisioned = integrationStatus === "provisioned" || integrationStatus === "connected";
  const isConnected = integrationStatus === "connected";

  const saveConfig = useMutation({
    mutationFn: async (newConfig: Partial<TwilioConfig>) => {
      if (!workspace) throw new Error("No workspace");
      const merged = {
        ...config,
        ...newConfig,
        office_hours: {
          ...config.office_hours,
          ...(newConfig.office_hours || {}),
        },
      };
      const nextStatus =
        query.data?.status ??
        (merged.from_number ? "provisioned" : "disconnected");

      if (query.data) {
        const { error } = await supabase
          .from("integrations")
          .update({
            config: merged as any,
            status: nextStatus,
            connected_at: nextStatus === "connected" ? new Date().toISOString() : query.data.connected_at,
          })
          .eq("id", query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert({
            workspace_id: workspace.id,
            provider: "twilio",
            config: merged as any,
            status: merged.from_number ? "provisioned" : "disconnected",
            connected_at: null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["twilio-config"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const provisionNumber = useMutation({
    mutationFn: async (payload: {
      preferred_area_code?: string;
      phone_path: "A" | "B";
      contractor_phone?: string;
      public_number?: string;
    }) => {
      if (!workspace) throw new Error("No workspace");
      const { data, error } = await supabase.functions.invoke("provision-number", {
        body: { workspace_id: workspace.id, ...payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["twilio-config"] });
    },
    onError: (err: any) => {
      toast({ title: "Provisioning failed", description: err.message, variant: "destructive" });
    },
  });

  const sendTestSms = useMutation({
    mutationFn: async (to: string) => {
      if (!workspace) throw new Error("No workspace");
      const { data, error } = await supabase.functions.invoke("twilio-send-sms", {
        body: { workspace_id: workspace.id, to, message: "Test SMS from NexaOS" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Test SMS sent" });
    },
    onError: (err: any) => {
      toast({ title: "SMS failed", description: err.message, variant: "destructive" });
    },
  });

  return {
    config,
    integrationStatus,
    isProvisioned,
    isConnected,
    isLoading: query.isLoading,
    saveConfig,
    sendTestSms,
    provisionNumber,
  };
}
