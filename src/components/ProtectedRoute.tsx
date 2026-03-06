import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { normalizeOnboardingConfig, isOnboardingLocked } from '@/lib/onboarding';

export function ProtectedRoute({
  children,
  allowIncompleteOnboarding = false,
  allowMissingWorkspace = false,
}: {
  children: React.ReactNode;
  allowIncompleteOnboarding?: boolean;
  allowMissingWorkspace?: boolean;
}) {
  const { user, loading } = useAuth();
  const { workspace, loading: workspaceLoading, hasWorkspace } = useWorkspace();

  if (loading || (user && workspaceLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasWorkspace) {
    return allowMissingWorkspace ? <>{children}</> : <Navigate to="/setup" replace />;
  }

  const onboarding = normalizeOnboardingConfig(workspace?.onboarding_config, workspace?.industry ?? undefined);
  if (!allowIncompleteOnboarding && isOnboardingLocked(onboarding)) {
    return <Navigate to="/go-live" replace />;
  }

  return <>{children}</>;
}
