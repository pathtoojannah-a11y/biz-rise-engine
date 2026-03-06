import { Json } from "@/integrations/supabase/types";

export type ProvisioningScope = "local" | "state" | "fallback";

export interface OnboardingChecklist {
  workspace_created: boolean;
  pipeline_created: boolean;
  twilio_connected: boolean;
  google_reviews_connected: boolean;
  office_hours_set: boolean;
}

export interface OnboardingConfig {
  created_via?: string;
  selected_industry?: string;
  provisioned_number_id?: string | null;
  provisioning_scope?: ProvisioningScope | null;
  forwarding_pending?: boolean;
  forwarding_carrier?: string | null;
  test_call_started_at?: string | null;
  test_call_verified?: boolean;
  test_call_verified_at?: string | null;
  live?: boolean;
  live_at?: string | null;
  office_open?: string | null;
  office_close?: string | null;
  checklist: OnboardingChecklist;
}

const DEFAULT_CHECKLIST: OnboardingChecklist = {
  workspace_created: true,
  pipeline_created: true,
  twilio_connected: false,
  google_reviews_connected: false,
  office_hours_set: false,
};

export function createDefaultOnboardingConfig(industry?: string): OnboardingConfig {
  return {
    created_via: "guided_setup",
    selected_industry: industry,
    provisioned_number_id: null,
    provisioning_scope: null,
    forwarding_pending: false,
    forwarding_carrier: null,
    test_call_started_at: null,
    test_call_verified: false,
    test_call_verified_at: null,
    live: false,
    live_at: null,
    office_open: null,
    office_close: null,
    checklist: { ...DEFAULT_CHECKLIST },
  };
}

export function normalizeOnboardingConfig(value: Json | null | undefined, industry?: string): OnboardingConfig {
  const defaults = createDefaultOnboardingConfig(industry);
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return defaults;
  }

  const rawChecklist = value.checklist;
  const checklist =
    rawChecklist && !Array.isArray(rawChecklist) && typeof rawChecklist === "object"
      ? { ...DEFAULT_CHECKLIST, ...rawChecklist }
      : defaults.checklist;

  return {
    ...defaults,
    ...value,
    checklist,
  };
}

export function isWorkspaceLive(config: OnboardingConfig) {
  return Boolean(config.live);
}

export function isOnboardingLocked(config: OnboardingConfig) {
  return !isWorkspaceLive(config);
}

export function hasCoreSetup(config: OnboardingConfig) {
  return (
    config.checklist.twilio_connected &&
    config.checklist.google_reviews_connected &&
    config.checklist.office_hours_set &&
    Boolean(config.test_call_verified)
  );
}
