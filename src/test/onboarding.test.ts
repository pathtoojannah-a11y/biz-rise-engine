import { describe, expect, it } from "vitest";
import {
  createDefaultOnboardingConfig,
  hasCoreSetup,
  isOnboardingLocked,
  normalizeOnboardingConfig,
} from "@/lib/onboarding";

describe("onboarding helpers", () => {
  it("fills in defaults when onboarding_config is missing fields", () => {
    const config = normalizeOnboardingConfig(
      {
        checklist: {
          google_reviews_connected: true,
        },
      },
      "Roofing",
    );

    expect(config.selected_industry).toBe("Roofing");
    expect(config.checklist.workspace_created).toBe(true);
    expect(config.checklist.google_reviews_connected).toBe(true);
    expect(config.checklist.twilio_connected).toBe(false);
  });

  it("requires verification, reviews, and office hours before launch readiness", () => {
    const config = createDefaultOnboardingConfig("HVAC");
    config.checklist.twilio_connected = true;
    config.checklist.google_reviews_connected = true;
    config.checklist.office_hours_set = true;
    config.test_call_verified = true;

    expect(hasCoreSetup(config)).toBe(true);
    expect(isOnboardingLocked(config)).toBe(true);
  });

  it("unlocks only after the workspace is marked live", () => {
    const config = createDefaultOnboardingConfig("Plumbing");
    config.live = true;

    expect(isOnboardingLocked(config)).toBe(false);
  });
});
