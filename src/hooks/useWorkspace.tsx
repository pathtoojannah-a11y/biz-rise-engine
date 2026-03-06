import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { buildPipelineStages } from "@/lib/workspace-setup";
import { createDefaultOnboardingConfig, OnboardingConfig, normalizeOnboardingConfig } from "@/lib/onboarding";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  timezone: string | null;
  business_zip: string | null;
  onboarding_config: OnboardingConfig;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  loading: boolean;
  hasWorkspace: boolean;
  createWorkspace: (name: string, industry: string, timezone: string, businessZip: string) => Promise<{ error: Error | null }>;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 7);
}

function coerceWorkspace(rawWorkspace: any): Workspace {
  return {
    ...rawWorkspace,
    business_zip: rawWorkspace?.business_zip ?? null,
    onboarding_config: normalizeOnboardingConfig(rawWorkspace?.onboarding_config, rawWorkspace?.industry ?? undefined),
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspace = async () => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (members && members.length > 0) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", members[0].workspace_id)
        .single();
      setWorkspace(ws ? coerceWorkspace(ws) : null);
    } else {
      setWorkspace(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refreshWorkspace();
  }, [user]);

  const createWorkspace = async (name: string, industry: string, timezone: string, businessZip: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const workspaceId = crypto.randomUUID();
    const slug = generateSlug(name);
    const stages = buildPipelineStages(industry);
    const onboardingConfig = createDefaultOnboardingConfig(industry);

    const { error: wsError } = await supabase
      .from("workspaces")
      .insert({
        id: workspaceId,
        name,
        slug,
        industry,
        timezone,
        business_zip: businessZip,
        onboarding_config: onboardingConfig as any,
      } as any);

    if (wsError) return { error: wsError as unknown as Error };

    const { error: memberError } = await supabase
      .from("workspace_members")
      .upsert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: "owner" as const,
        status: "active" as const,
      }, { onConflict: "workspace_id,user_id" });

    if (memberError) return { error: memberError as unknown as Error };

    const { error: stageError } = await supabase.from("pipeline_stages").upsert(
      stages.map((stage, index) => ({
        workspace_id: workspaceId,
        name: stage,
        position: index + 1,
      })),
      { onConflict: "workspace_id,name" },
    );

    if (stageError) return { error: stageError as unknown as Error };

    const { data: ws, error: fetchError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (fetchError) return { error: fetchError as unknown as Error };

    setWorkspace(coerceWorkspace(ws));
    return { error: null };
  };

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, hasWorkspace: !!workspace, createWorkspace, refreshWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
