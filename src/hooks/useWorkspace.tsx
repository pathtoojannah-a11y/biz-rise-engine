import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  timezone: string | null;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  loading: boolean;
  hasWorkspace: boolean;
  createWorkspace: (name: string, industry: string, timezone: string) => Promise<{ error: Error | null }>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 7);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    const fetchWorkspace = async () => {
      setLoading(true);
      const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (members && members.length > 0) {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', members[0].workspace_id)
          .single();
        setWorkspace(ws);
      } else {
        setWorkspace(null);
      }
      setLoading(false);
    };

    fetchWorkspace();
  }, [user]);

  const createWorkspace = async (name: string, industry: string, timezone: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const slug = generateSlug(name);

    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name, slug, industry, timezone })
      .select()
      .single();

    if (wsError) return { error: wsError as unknown as Error };

    // Idempotent: upsert membership (unique constraint on workspace_id, user_id)
    const { error: memberError } = await supabase
      .from('workspace_members')
      .upsert({
        workspace_id: ws.id,
        user_id: user.id,
        role: 'owner' as const,
        status: 'active' as const,
      }, { onConflict: 'workspace_id,user_id' });

    if (memberError) return { error: memberError as unknown as Error };

    // Idempotent: insert default pipeline stages (unique on workspace_id,name and workspace_id,position)
    const stages = ['New Lead', 'Contacted', 'Quoted', 'Booked', 'Completed'];
    for (let i = 0; i < stages.length; i++) {
      await supabase.from('pipeline_stages').upsert(
        { workspace_id: ws.id, name: stages[i], position: i + 1 },
        { onConflict: 'workspace_id,name' }
      );
    }

    setWorkspace(ws);
    return { error: null };
  };

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, hasWorkspace: !!workspace, createWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
