import { normalizeOnboardingConfig, isOnboardingLocked, isWorkspaceLive } from "@/lib/onboarding";
import { useWorkspace } from "./useWorkspace";

export function useOnboardingStatus() {
  const { workspace } = useWorkspace();
  const config = normalizeOnboardingConfig(workspace?.onboarding_config, workspace?.industry ?? undefined);

  return {
    config,
    isLocked: Boolean(workspace) && isOnboardingLocked(config),
    isLive: Boolean(workspace) && isWorkspaceLive(config),
  };
}

