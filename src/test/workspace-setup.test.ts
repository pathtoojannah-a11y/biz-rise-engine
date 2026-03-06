import { describe, expect, it } from "vitest";
import { buildPipelineStages, formatTimezoneLabel } from "@/lib/workspace-setup";

describe("workspace setup helpers", () => {
  it("returns a trade-specific pipeline for hvac", () => {
    expect(buildPipelineStages("HVAC")).toEqual([
      "New Lead",
      "Contacted",
      "Diagnosis Scheduled",
      "Estimate Sent",
      "Booked",
      "Job Complete",
    ]);
  });

  it("falls back to the generic template for unknown trades", () => {
    expect(buildPipelineStages("Solar")).toEqual([
      "New Lead",
      "Contacted",
      "Qualified",
      "Quoted",
      "Booked",
      "Completed",
    ]);
  });

  it("formats timezone labels for the setup select", () => {
    expect(formatTimezoneLabel("America/New_York")).toBe("New York");
  });
});
