export const TRADE_OPTIONS = [
  "General Contractor",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Painting",
  "Cleaning",
  "Other",
] as const;

export const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
] as const;

const PIPELINE_TEMPLATES: Record<string, string[]> = {
  "General Contractor": ["New Lead", "Contacted", "Estimate Scheduled", "Proposal Sent", "Booked", "Completed"],
  HVAC: ["New Lead", "Contacted", "Diagnosis Scheduled", "Estimate Sent", "Booked", "Job Complete"],
  Plumbing: ["New Lead", "Contacted", "Dispatch Scheduled", "Estimate Sent", "Booked", "Job Complete"],
  Electrical: ["New Lead", "Contacted", "Site Visit Scheduled", "Quote Sent", "Booked", "Job Complete"],
  Roofing: ["New Lead", "Contacted", "Inspection Scheduled", "Estimate Sent", "Contract Signed", "Project Complete"],
  Landscaping: ["New Lead", "Contacted", "Walkthrough Scheduled", "Proposal Sent", "Booked", "Completed"],
  Painting: ["New Lead", "Contacted", "Walkthrough Scheduled", "Quote Sent", "Booked", "Completed"],
  Cleaning: ["New Lead", "Contacted", "Walkthrough Scheduled", "Quote Sent", "Booked", "Completed"],
  Other: ["New Lead", "Contacted", "Qualified", "Quoted", "Booked", "Completed"],
};

export function buildPipelineStages(industry: string) {
  return PIPELINE_TEMPLATES[industry] ?? PIPELINE_TEMPLATES.Other;
}

export function formatTimezoneLabel(timezone: string) {
  const [, city = timezone] = timezone.split("/");
  return city.replace(/_/g, " ");
}

export function getDetectedTimezone() {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_OPTIONS.includes(detectedTimezone as (typeof TIMEZONE_OPTIONS)[number])
    ? detectedTimezone
    : "America/New_York";
}

export function getBusinessNameSuggestion(fullName: string | null | undefined, email: string | null | undefined) {
  if (fullName?.trim()) {
    return `${fullName.trim()}'s Business`;
  }

  if (email?.includes("@")) {
    const [domain] = email.split("@")[1].split(".");
    return domain.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return "";
}
