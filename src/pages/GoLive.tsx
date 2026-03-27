import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { OnboardingLayout } from "@/components/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAutomationConfig } from "@/hooks/useAutomationConfig";
import { useLocations } from "@/hooks/useLocations";
import { hasCoreSetup, isWorkspaceLive, normalizeOnboardingConfig, OnboardingConfig } from "@/lib/onboarding";
import { toast } from "sonner";

type BookingChoice = "external" | "nexaos" | null;
type BookingProvider = "calendly" | "jobber" | "housecall-pro" | "other";
type WorkDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type JobVariability = "same" | "varies";

const BOOKING_PROVIDERS: { value: BookingProvider; label: string }[] = [
  { value: "calendly", label: "Calendly" },
  { value: "jobber", label: "Jobber" },
  { value: "housecall-pro", label: "Housecall Pro" },
  { value: "other", label: "Other" },
];

const WORK_DAYS: { value: WorkDay; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const STEP_LABELS = [
  "Business info",
  "Phone setup",
  "Text your NexaOS number",
  "Booking link",
  "Google reviews",
  "Office hours",
];

const STEP_DESCRIPTIONS = [
  "Check the business details NexaOS will use for launch.",
  "Enter the cell number NexaOS should ring, then create your new business number.",
  "Start the check, then text your NexaOS number from your saved cell so NexaOS can verify the SMS path.",
  "Choose an existing booking link or answer a few simple questions so NexaOS can suggest your booking setup.",
  "Paste your Google review link. High ratings go public. Low ratings stay private.",
  "Set reminder hours, finish setup, and unlock the workspace.",
];

function normalizePhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function getAreaCode(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return digits.slice(0, 3);
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1, 4);
  return "";
}

function isPhoneValid(value: string) {
  return Boolean(normalizePhone(value));
}

function getBookingProviderFromLink(link: string): BookingProvider {
  const normalized = link.toLowerCase();
  if (normalized.includes("calendly")) return "calendly";
  if (normalized.includes("jobber")) return "jobber";
  if (normalized.includes("housecallpro")) return "housecall-pro";
  return "other";
}

function isValidBookingUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getPublicAppUrl() {
  return (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || window.location.origin;
}

function normalizeWorkDays(value: unknown): WorkDay[] {
  if (!Array.isArray(value)) return ["mon", "tue", "wed", "thu", "fri"];

  const days = value.filter((item): item is WorkDay =>
    typeof item === "string" && WORK_DAYS.some((day) => day.value === item),
  );

  return days.length > 0 ? days : ["mon", "tue", "wed", "thu", "fri"];
}

function getJobVariability(value: unknown): JobVariability {
  return value === "same" ? "same" : "varies";
}

function formatWorkDaySummary(days: WorkDay[]) {
  const ordered = WORK_DAYS.filter((day) => days.includes(day.value)).map((day) => day.label);
  if (ordered.length === 0) return "No work days selected";
  if (ordered.length === 7) return "Every day";
  return ordered.join(", ");
}

function getWindowRecommendation(jobsPerDay: number, jobVariability: JobVariability) {
  if (jobsPerDay <= 1) {
    return {
      title: "One daytime window",
      description: "NexaOS will show one broad daytime request window so you can place the visit where it fits.",
    };
  }

  if (jobsPerDay === 2) {
    return {
      title: "Morning and afternoon windows",
      description:
        jobVariability === "same"
          ? "This keeps things simple and still gives customers two clear choices."
          : "Because jobs vary, wider morning and afternoon windows are the safest recommendation.",
    };
  }

  if (jobsPerDay === 3) {
    return {
      title: "Morning, midday, and afternoon windows",
      description:
        jobVariability === "same"
          ? "This gives you a balanced day without forcing exact-time scheduling."
          : "This is the best default for variable field work because customers pick a window and you confirm the exact arrival later.",
    };
  }

  return {
    title: "Shorter windows across the day",
    description:
      jobVariability === "same"
        ? "Because your jobs are more predictable, NexaOS can safely offer more windows in a day."
        : "NexaOS can still offer more windows, but the contractor should confirm the exact arrival time after booking.",
  };
}

function getProvisioningErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (message.includes("Failed to send a request to the Edge Function")) {
    return "We could not reach the NexaOS number service. Try again in a minute.";
  }

  if (message.includes("Missing Twilio master credentials") || message.includes("Missing NEXAOS_WEBHOOK_BASE_URL")) {
    return "NexaOS number setup is not fully connected yet. Finish the server-side phone setup, then try again.";
  }

  if (message.includes("Only workspace owners")) {
    return "Only the workspace owner can assign the NexaOS number.";
  }

  if (message.includes("No Twilio numbers available")) {
    return "No local business numbers are available right now. Try again shortly.";
  }

  return message || "We couldn't assign a NexaOS number yet.";
}

function getRecommendedStep(
  onboarding: OnboardingConfig,
  config: { contractor_phone: string; from_number: string },
  hasReviewLink: boolean,
) {
  if (!config.contractor_phone || !config.from_number) return 1;
  if (!onboarding.test_call_verified) return 2;
  if (!onboarding.booking_link_ready) return 3;
  if (!hasReviewLink) return 4;
  return 5;
}

export default function GoLive() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace, refreshWorkspace } = useWorkspace();
  const { config, isProvisioned, provisionNumber, saveConfig } = useAutomationConfig();
  const { data: locations } = useLocations();

  const onboarding = normalizeOnboardingConfig(workspace?.onboarding_config, workspace?.industry ?? undefined);
  const existingReviewLink = locations?.find((location) => location.google_review_link)?.google_review_link ?? "";
  const recommendedStep = getRecommendedStep(
    onboarding,
    { contractor_phone: config.contractor_phone, from_number: config.from_number },
    Boolean(existingReviewLink),
  );

  const [currentStep, setCurrentStep] = useState(recommendedStep);
  const [contractorPhone, setContractorPhone] = useState(config.contractor_phone || "");
  const [bookingChoice, setBookingChoice] = useState<BookingChoice>(
    config.booking_mode ?? (config.booking_link ? "external" : null),
  );
  const [bookingProvider, setBookingProvider] = useState<BookingProvider>(
    config.booking_provider ?? getBookingProviderFromLink(config.booking_link || ""),
  );
  const [bookingLink, setBookingLink] = useState(config.booking_link || "");
  const [bookingTimezone, setBookingTimezone] = useState(config.booking_settings.timezone || workspace?.timezone || "America/New_York");
  const [bookingStart, setBookingStart] = useState(
    config.booking_settings.start_time || onboarding.office_open || config.office_hours.start || "08:00",
  );
  const [bookingEnd, setBookingEnd] = useState(
    config.booking_settings.end_time || onboarding.office_close || config.office_hours.end || "18:00",
  );
  const [bookingDays, setBookingDays] = useState<WorkDay[]>(normalizeWorkDays(config.booking_settings.work_days));
  const [jobsPerDay, setJobsPerDay] = useState(String(config.booking_settings.jobs_per_day || 3));
  const [jobVariability, setJobVariability] = useState<JobVariability>(getJobVariability(config.booking_settings.job_variability));
  const [reviewLink, setReviewLink] = useState(existingReviewLink);
  const [officeStart, setOfficeStart] = useState(onboarding.office_open || config.office_hours.start || "08:00");
  const [officeEnd, setOfficeEnd] = useState(onboarding.office_close || config.office_hours.end || "18:00");
  const [savingPhoneSetup, setSavingPhoneSetup] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [savingReviewLink, setSavingReviewLink] = useState(false);
  const [finishingSetup, setFinishingSetup] = useState(false);
  const [startingTest, setStartingTest] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(null);

  const primaryButtonClass =
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_18px_40px_-24px_rgba(5,150,105,0.8)]";

  const toggleBookingDay = (day: WorkDay) => {
    setBookingDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  useEffect(() => {
    setCurrentStep((previous) => (recommendedStep > previous ? recommendedStep : previous));
  }, [recommendedStep]);

  useEffect(() => {
    setContractorPhone(config.contractor_phone || "");
    setBookingChoice(config.booking_mode ?? (config.booking_link ? "external" : null));
    setBookingProvider(config.booking_provider ?? getBookingProviderFromLink(config.booking_link || ""));
    setBookingLink(config.booking_link || "");
    setBookingTimezone(config.booking_settings.timezone || workspace?.timezone || "America/New_York");
    setBookingStart(config.booking_settings.start_time || onboarding.office_open || config.office_hours.start || "08:00");
    setBookingEnd(config.booking_settings.end_time || onboarding.office_close || config.office_hours.end || "18:00");
    setBookingDays(normalizeWorkDays(config.booking_settings.work_days));
    setJobsPerDay(String(config.booking_settings.jobs_per_day || 3));
    setJobVariability(getJobVariability(config.booking_settings.job_variability));
  }, [
    config.contractor_phone,
    config.booking_mode,
    config.booking_provider,
    config.booking_link,
    config.booking_settings.timezone,
    config.booking_settings.start_time,
    config.booking_settings.end_time,
    config.booking_settings.work_days,
    config.booking_settings.jobs_per_day,
    config.booking_settings.job_variability,
    onboarding.office_open,
    onboarding.office_close,
    config.office_hours.start,
    config.office_hours.end,
    workspace?.timezone,
  ]);

  useEffect(() => {
    setReviewLink(existingReviewLink);
  }, [existingReviewLink]);

  useEffect(() => {
    setOfficeStart(onboarding.office_open || config.office_hours.start || "08:00");
    setOfficeEnd(onboarding.office_close || config.office_hours.end || "18:00");
  }, [onboarding.office_open, onboarding.office_close, config.office_hours.start, config.office_hours.end]);

  useEffect(() => {
    if (!workspace || !onboarding.test_call_started_at || onboarding.test_call_verified) return;
    const interval = window.setInterval(() => {
      void refreshWorkspace();
    }, 4000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, onboarding.test_call_started_at, onboarding.test_call_verified]);

  if (!workspace) return <Navigate to="/setup" replace />;
  if (isWorkspaceLive(onboarding)) return <Navigate to="/dashboard" replace />;

  const persistOnboarding = async (
    updates: Partial<OnboardingConfig>,
    checklistUpdates?: Partial<OnboardingConfig["checklist"]>,
  ) => {
    const current = normalizeOnboardingConfig(workspace.onboarding_config, workspace.industry ?? undefined);
    const nextConfig = {
      ...current,
      ...updates,
      checklist: {
        ...current.checklist,
        ...(checklistUpdates || {}),
      },
    };

    const { error } = await supabase
      .from("workspaces")
      .update({ onboarding_config: nextConfig as never })
      .eq("id", workspace.id);

    if (error) throw error;
    await refreshWorkspace();
  };

  const handleSavePhoneSetup = async () => {
    if (!isPhoneValid(contractorPhone)) {
      toast.error("Enter the cell number NexaOS should ring.");
      return;
    }

    setSavingPhoneSetup(true);
    try {
      await saveConfig.mutateAsync({ contractor_phone: normalizePhone(contractorPhone) });
      toast.success("Cell number saved.");
      setCurrentStep(1);
    } catch (error: any) {
      toast.error(error.message || "Could not save the cell number.");
    } finally {
      setSavingPhoneSetup(false);
    }
  };

  const handleProvision = async () => {
    setProvisioningError(null);
    try {
      const normalizedContractorPhone = normalizePhone(contractorPhone);
      if (!normalizedContractorPhone) {
        toast.error("Enter the cell number NexaOS should ring.");
        return;
      }

      if (normalizedContractorPhone !== config.contractor_phone) {
        await saveConfig.mutateAsync({ contractor_phone: normalizedContractorPhone });
      }

      await provisionNumber.mutateAsync({
        contractor_phone: normalizedContractorPhone,
        preferred_area_code: getAreaCode(contractorPhone),
      });
      await refreshWorkspace();
      setContractorPhone(normalizePhoneInput(normalizedContractorPhone));
      toast.success("Your new NexaOS number is ready.");
      setCurrentStep(2);
    } catch (error) {
      const message = getProvisioningErrorMessage(error);
      setProvisioningError(message);
      toast.error(message);
    }
  };

  const handleStartTest = async () => {
    setStartingTest(true);
    try {
      await persistOnboarding({ test_call_started_at: new Date().toISOString() });
      toast("Text your NexaOS number from your saved cell. Send something short like hello.");
    } catch (error: any) {
      toast.error(error.message || "Could not start the SMS verification.");
    } finally {
      setStartingTest(false);
    }
  };

  const handleSaveBooking = async () => {
    if (!bookingChoice) {
      toast.error("Choose how NexaOS should send customers to booking.");
      return;
    }

    setSavingBooking(true);
    try {
      if (bookingChoice === "external") {
        if (!bookingLink.trim()) {
          toast.error("Paste the scheduling link before continuing.");
          return;
        }
        if (!isValidBookingUrl(bookingLink.trim())) {
          toast.error("Enter a valid booking URL.");
          return;
        }

        await saveConfig.mutateAsync({
          booking_mode: "external",
          booking_provider: bookingProvider,
          booking_link: bookingLink.trim(),
        });
      } else {
        const parsedJobsPerDay = Number(jobsPerDay);

        if (bookingDays.length === 0) {
          toast.error("Choose at least one work day.");
          return;
        }
        if (!bookingStart || !bookingEnd || bookingStart >= bookingEnd) {
          toast.error("Set a valid work day schedule.");
          return;
        }
        if (!Number.isFinite(parsedJobsPerDay) || parsedJobsPerDay < 1) {
          toast.error("Choose how many jobs you can take in a day.");
          return;
        }

        const generatedBookingLink = `${getPublicAppUrl()}/book/${workspace.slug}`;
        await saveConfig.mutateAsync({
          booking_mode: "nexaos",
          booking_provider: "other",
          booking_link: generatedBookingLink,
          booking_settings: {
            timezone: bookingTimezone || workspace.timezone || "America/New_York",
            start_time: bookingStart,
            end_time: bookingEnd,
            work_days: bookingDays,
            jobs_per_day: Math.min(parsedJobsPerDay, 5),
            job_variability: jobVariability,
          },
        });
        setBookingLink(generatedBookingLink);
      }

      await persistOnboarding({ booking_link_ready: true });
      toast.success("Booking step saved.");
      setCurrentStep(4);
    } catch (error: any) {
      toast.error(error.message || "Could not save the booking link.");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleSaveReviewLink = async () => {
    const trimmedReviewLink = reviewLink.trim();
    if (!trimmedReviewLink) {
      toast.error("Enter a Google review link before continuing.");
      return;
    }

    setSavingReviewLink(true);
    try {
      const existingLocation = locations?.[0];
      if (existingLocation) {
        const { error } = await supabase
          .from("locations")
          .update({ google_review_link: trimmedReviewLink })
          .eq("id", existingLocation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("locations").insert({
          workspace_id: workspace.id,
          name: `${workspace.name} Main Location`,
          google_review_link: trimmedReviewLink,
        });
        if (error) throw error;
      }

      await persistOnboarding({}, { google_reviews_connected: true });
      await queryClient.invalidateQueries({ queryKey: ["locations", workspace.id] });
      toast.success("Google review routing is saved.");
      setCurrentStep(5);
    } catch (error: any) {
      toast.error(error.message || "Could not save the Google review link.");
    } finally {
      setSavingReviewLink(false);
    }
  };

  const handleFinishSetup = async () => {
    setFinishingSetup(true);
    try {
      await saveConfig.mutateAsync({
        office_hours: { enabled: true, start: officeStart, end: officeEnd },
        review_delay_days: config.review_delay_days || 2,
      });
      await persistOnboarding(
        {
          office_open: officeStart,
          office_close: officeEnd,
          live: true,
          live_at: new Date().toISOString(),
        },
        { twilio_connected: true, google_reviews_connected: true, office_hours_set: true },
      );
      toast.success("NexaOS is live.");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Could not finish setup.");
    } finally {
      setFinishingSetup(false);
    }
  };

  const canFinish = hasCoreSetup({
    ...onboarding,
    checklist: {
      ...onboarding.checklist,
      google_reviews_connected: Boolean(existingReviewLink),
      office_hours_set: true,
      twilio_connected: onboarding.test_call_verified,
    },
  });

  const parsedJobsPerDay = Number(jobsPerDay);
  const bookingSuggestion = getWindowRecommendation(
    Number.isFinite(parsedJobsPerDay) && parsedJobsPerDay > 0 ? parsedJobsPerDay : 3,
    jobVariability,
  );

  return (
    <OnboardingLayout
      title="Launch Your Phone Assistant"
      description="Add your cell number once, get a new NexaOS business number, and let missed calls turn into text conversations automatically."
      currentStep={currentStep}
      steps={STEP_LABELS}
    >
      <div className="space-y-6">
        <Card className="border-emerald-100/80 bg-white/95 shadow-xl shadow-emerald-100/60">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="font-display text-3xl tracking-[-0.04em] text-slate-950">
                  {STEP_LABELS[currentStep]}
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-base text-slate-600">
                  {STEP_DESCRIPTIONS[currentStep]}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                Step {currentStep + 1} of {STEP_LABELS.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 text-slate-900">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Business</p>
                      <p className="mt-1 text-lg font-semibold">{workspace.name}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 text-slate-900">
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Trade</p>
                      <p className="mt-1 text-lg font-semibold">{workspace.industry || "General Contractor"}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 text-slate-900">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">ZIP / Timezone</p>
                      <p className="mt-1 text-lg font-semibold">
                        {workspace.business_zip || "Not set"} / {workspace.timezone || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-3 flex justify-end">
                  <Button className={primaryButtonClass} onClick={() => setCurrentStep(1)}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-5 rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-6">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">One phone field</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">What's your cell number?</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        This is the cell that rings when someone calls your new NexaOS business number.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contractor-phone">Cell number</Label>
                      <Input
                        id="contractor-phone"
                        inputMode="tel"
                        autoComplete="tel"
                        value={contractorPhone}
                        onChange={(event) => setContractorPhone(normalizePhoneInput(event.target.value))}
                        placeholder="(313) 555-1234"
                        className="h-12 border-slate-200 bg-white"
                      />
                      <p className="text-sm text-slate-500">
                        Put your NexaOS number on your truck, website, and Google listing. When customers call it, your cell rings.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                        <p className="mt-3 text-sm font-semibold text-slate-950">Create your number</p>
                        <p className="mt-1 text-sm text-slate-600">NexaOS assigns a local business number.</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                        <p className="mt-3 text-sm font-semibold text-slate-950">Use it publicly</p>
                        <p className="mt-1 text-sm text-slate-600">This becomes the number customers call.</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                        <p className="mt-3 text-sm font-semibold text-slate-950">Missed calls become texts</p>
                        <p className="mt-1 text-sm text-slate-600">If you miss it, NexaOS starts the reply flow automatically.</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={handleSavePhoneSetup} disabled={savingPhoneSetup}>
                        {savingPhoneSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save cell number
                      </Button>
                      <Button
                        className={primaryButtonClass}
                        onClick={handleProvision}
                        disabled={!isPhoneValid(contractorPhone) || provisionNumber.isPending}
                      >
                        {provisionNumber.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                        {isProvisioned ? "Recheck my NexaOS number" : "Create my NexaOS number"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[linear-gradient(165deg,#022c22_0%,#052e16_54%,#020617_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(6,95,70,0.95)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Your NexaOS number</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">{config.from_number || "Not assigned yet"}</p>
                      </div>
                      <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200 hover:bg-emerald-500/15">
                        {isProvisioned ? "Ready" : "Waiting"}
                      </Badge>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rings this cell</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {normalizePhone(contractorPhone) || "Add your cell number first"}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3 text-sm text-slate-300">
                      <p>Customers call your NexaOS number.</p>
                      <p>Your cell rings like a normal call.</p>
                      <p>If you miss it, NexaOS texts the customer and starts qualification.</p>
                    </div>
                  </div>
                </div>

                {provisioningError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-950 [&>svg]:text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>We couldn't create the number yet</AlertTitle>
                    <AlertDescription>{provisioningError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Verify by text</p>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    <li>1. Click <span className="font-semibold">Start SMS check</span>.</li>
                    <li>2. From your saved cell, text your NexaOS number. Send something short like <span className="font-semibold">hello</span>.</li>
                    <li>3. NexaOS replies and this step switches to verified automatically.</li>
                  </ol>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Text this number</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{config.from_number || "Create the NexaOS number first"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Send the text from this cell</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {config.contractor_phone || normalizePhone(contractorPhone) || "Add your cell number first"}
                      </p>
                    </div>
                  </div>
                </div>

                {onboarding.test_call_verified ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold">SMS verified</p>
                        <p className="text-sm text-emerald-800">NexaOS replied to your text and the number is connected.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-700">
                      {onboarding.test_call_started_at
                        ? "SMS check started. Send the text now from your saved cell, then keep this page open."
                        : "Start the check first, then send a text to your NexaOS number."}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {!onboarding.test_call_verified && (
                    <>
                      {onboarding.test_call_started_at && (
                        <Button variant="outline" disabled>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Text sent? Waiting for reply
                        </Button>
                      )}
                      <Button className={primaryButtonClass} onClick={handleStartTest} disabled={!config.from_number || startingTest}>
                        {startingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                        {onboarding.test_call_started_at ? "Restart SMS check" : "Start SMS check"}
                      </Button>
                    </>
                  )}
                  {onboarding.test_call_verified && (
                    <Button className={primaryButtonClass} onClick={() => setCurrentStep(3)}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBookingChoice("external")}
                    className={`rounded-3xl border p-6 text-left transition ${
                      bookingChoice === "external"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Existing link</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">I already have a booking link</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Paste your Calendly, Jobber, Housecall Pro, or other booking URL and NexaOS will text it after qualification.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingChoice("nexaos")}
                    className={`rounded-3xl border p-6 text-left transition ${
                      bookingChoice === "nexaos"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">NexaOS link</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create my NexaOS booking link</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Set the days, hours, and job windows you want to offer. NexaOS will capture the preferred window and you confirm the exact time later.
                    </p>
                  </button>
                </div>

                {bookingChoice === "external" && (
                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="space-y-2">
                      <Label>Booking provider</Label>
                      <div className="flex flex-wrap gap-2">
                        {BOOKING_PROVIDERS.map((provider) => (
                          <button
                            key={provider.value}
                            type="button"
                            onClick={() => setBookingProvider(provider.value)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              bookingProvider === provider.value
                                ? "border-emerald-500 bg-emerald-100 text-emerald-950"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {provider.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking-link">Booking URL</Label>
                      <Input
                        id="booking-link"
                        value={bookingLink}
                        onChange={(event) => setBookingLink(event.target.value)}
                        placeholder="https://calendly.com/your-business"
                      />
                      <p className="text-sm text-slate-500">
                        NexaOS stores this link and texts it to qualified leads automatically.
                      </p>
                    </div>
                  </div>
                )}

                {bookingChoice === "nexaos" && (
                  <div className="space-y-5 rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-5">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">NexaOS booking page</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Answer a few quick questions</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        NexaOS will suggest the simplest booking setup based on how you actually work. If something looks off, tap the answer you want to change.
                      </p>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                      <Label>1. Which days do you usually work?</Label>
                      <div className="flex flex-wrap gap-2">
                        {WORK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleBookingDay(day.value)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              bookingDays.includes(day.value)
                                ? "border-emerald-500 bg-emerald-100 text-emerald-950"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-slate-500">Tap the days you normally want customers to request visits.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <Label htmlFor="booking-start">2. What time do you usually start?</Label>
                        <Input
                          id="booking-start"
                          type="time"
                          value={bookingStart}
                          onChange={(event) => setBookingStart(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <Label htmlFor="booking-end">What time do you usually stop?</Label>
                        <Input
                          id="booking-end"
                          type="time"
                          value={bookingEnd}
                          onChange={(event) => setBookingEnd(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <Label>3. How many jobs can you usually handle in a day?</Label>
                        <div className="flex flex-wrap gap-2">
                          {["1", "2", "3", "4", "5"].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setJobsPerDay(value)}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                jobsPerDay === value
                                  ? "border-emerald-500 bg-emerald-100 text-emerald-950"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              {value === "5" ? "5+" : value}
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">
                          NexaOS uses this to suggest simple service windows instead of rigid time slots.
                        </p>
                      </div>
                      <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <Label>4. Do jobs usually take about the same amount of time?</Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "same", label: "Usually about the same" },
                            { value: "varies", label: "They vary a lot" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setJobVariability(option.value as JobVariability)}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                jobVariability === option.value
                                  ? "border-emerald-500 bg-emerald-100 text-emerald-950"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">
                          If jobs vary a lot, NexaOS leans toward wider windows so you can confirm the exact arrival later.
                        </p>
                      </div>
                      <div className="space-y-2 md:col-span-2 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <Label htmlFor="booking-timezone">Timezone</Label>
                        <Input
                          id="booking-timezone"
                          value={bookingTimezone}
                          onChange={(event) => setBookingTimezone(event.target.value)}
                          placeholder="America/New_York"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">NexaOS suggestion</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{bookingSuggestion.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{bookingSuggestion.description}</p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                        <div>
                          <p className="font-semibold text-slate-950">Work days</p>
                          <p>{formatWorkDaySummary(bookingDays)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">Hours</p>
                          <p>{bookingStart} - {bookingEnd}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">Jobs per day</p>
                          <p>{jobsPerDay === "5" ? "5+" : jobsPerDay}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">Job pattern</p>
                          <p>{jobVariability === "same" ? "Usually about the same" : "They vary a lot"}</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Generated NexaOS booking link</p>
                        <p className="mt-2 break-all text-base font-semibold text-slate-950">{`${getPublicAppUrl()}/book/${workspace.slug}`}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Customers will request a service window first. You confirm the exact arrival time after that.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button className={primaryButtonClass} onClick={handleSaveBooking} disabled={savingBooking}>
                    {savingBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    {bookingChoice === "nexaos" ? "Looks good, create my NexaOS booking link" : "Save booking and continue"}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="google-review-link">Google review link</Label>
                  <Input
                    id="google-review-link"
                    value={reviewLink}
                    onChange={(event) => setReviewLink(event.target.value)}
                    placeholder="https://g.page/r/your-business/review"
                  />
                  <p className="text-sm text-slate-500">
                    After a job is confirmed done, NexaOS asks the customer to rate you. 4-5 stars go to this link. Lower ratings stay private.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button className={primaryButtonClass} onClick={handleSaveReviewLink} disabled={savingReviewLink}>
                    {savingReviewLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Save review link
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="office-start">Open time</Label>
                    <Input id="office-start" type="time" value={officeStart} onChange={(event) => setOfficeStart(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="office-end">Close time</Label>
                    <Input id="office-end" type="time" value={officeEnd} onChange={(event) => setOfficeEnd(event.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">NexaOS number</p>
                    <p className="mt-2 text-sm text-slate-600">{config.from_number || "Pending"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Activation</p>
                    <p className="mt-2 text-sm text-slate-600">{onboarding.test_call_verified ? "SMS verified" : "Waiting for SMS verification"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Booking step</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {config.booking_mode === "external"
                        ? "External booking link will be sent by SMS"
                        : config.booking_mode === "nexaos"
                          ? "NexaOS service-window booking is ready"
                          : "Booking setup still needs review"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <Clock3 className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Reminder hours</p>
                    <p className="mt-2 text-sm text-slate-600">{officeStart} - {officeEnd}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-700">
                    NexaOS will handle missed calls, lead qualification, contractor alerts, and review requests by text. The dashboard becomes optional after this.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button className={primaryButtonClass} onClick={handleFinishSetup} disabled={!canFinish || finishingSetup}>
                    {finishingSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                    Save hours and finish
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
}
