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

const STEP_LABELS = [
  "Business info",
  "Phone setup",
  "Test call",
  "Booking link",
  "Google reviews",
  "Office hours",
];

const STEP_DESCRIPTIONS = [
  "Check the business details NexaOS will use for launch.",
  "Enter the cell number NexaOS should ring, then create your new business number.",
  "Run one real missed-call test so NexaOS can verify the automation.",
  "Decide whether qualified leads should get a booking link by text.",
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
  const [bookingChoice, setBookingChoice] = useState<"yes" | "no" | null>(
    config.booking_link ? "yes" : onboarding.booking_link_ready ? "no" : null,
  );
  const [bookingLink, setBookingLink] = useState(config.booking_link || "");
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

  useEffect(() => {
    setCurrentStep((previous) => (recommendedStep > previous ? recommendedStep : previous));
  }, [recommendedStep]);

  useEffect(() => {
    setContractorPhone(config.contractor_phone || "");
    setBookingChoice(config.booking_link ? "yes" : onboarding.booking_link_ready ? "no" : null);
    setBookingLink(config.booking_link || "");
  }, [config.contractor_phone, config.booking_link, onboarding.booking_link_ready]);

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
      await provisionNumber.mutateAsync({
        contractor_phone: normalizePhone(contractorPhone),
        preferred_area_code: getAreaCode(contractorPhone),
      });
      await refreshWorkspace();
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
      toast("Use another phone to call your new NexaOS number and let it ring.");
    } catch (error: any) {
      toast.error(error.message || "Could not start the test call.");
    } finally {
      setStartingTest(false);
    }
  };

  const handleSaveBooking = async () => {
    if (!bookingChoice) {
      toast.error("Choose whether you want NexaOS to send a booking link.");
      return;
    }
    if (bookingChoice === "yes" && !bookingLink.trim()) {
      toast.error("Paste the scheduling link before continuing.");
      return;
    }

    setSavingBooking(true);
    try {
      await saveConfig.mutateAsync({ booking_link: bookingChoice === "yes" ? bookingLink.trim() : "" });
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
                        {isProvisioned ? "Recheck my number" : "Create my business number"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[linear-gradient(165deg,#022c22_0%,#052e16_54%,#020617_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(6,95,70,0.95)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Your business number</p>
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
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Run one real test</p>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    <li>1. Use a different phone and call your new NexaOS business number.</li>
                    <li>2. Let your cell ring, but do not answer.</li>
                    <li>3. NexaOS should catch the miss and mark this step complete automatically.</li>
                  </ol>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Call this number</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{config.from_number || "Create the NexaOS number first"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">This cell should ring</p>
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
                        <p className="font-semibold">Test passed</p>
                        <p className="text-sm text-emerald-800">NexaOS saw the missed call and your phone flow is active.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-700">
                      {onboarding.test_call_started_at
                        ? "Listening for the missed call now. Keep this page open while you run the test."
                        : "Start the test when your new NexaOS number is ready."}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {!onboarding.test_call_verified && (
                    <Button className={primaryButtonClass} onClick={handleStartTest} disabled={!config.from_number || startingTest}>
                      {startingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                      {onboarding.test_call_started_at ? "Retry test" : "Start test"}
                    </Button>
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
                    onClick={() => setBookingChoice("yes")}
                    className={`rounded-3xl border p-6 text-left transition ${
                      bookingChoice === "yes"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Yes</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Send my scheduling link</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      NexaOS will text qualified leads a direct booking link right after qualification.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingChoice("no")}
                    className={`rounded-3xl border p-6 text-left transition ${
                      bookingChoice === "no"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Not yet</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Stop after qualification</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      NexaOS will collect the lead details, then tell the customer someone will reach out soon.
                    </p>
                  </button>
                </div>

                {bookingChoice === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="booking-link">Scheduling link</Label>
                    <Input
                      id="booking-link"
                      value={bookingLink}
                      onChange={(event) => setBookingLink(event.target.value)}
                      placeholder="https://calendly.com/your-business"
                    />
                    <p className="text-sm text-slate-500">Calendly, Housecall Pro, Jobber, or any booking page works.</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button className={primaryButtonClass} onClick={handleSaveBooking} disabled={savingBooking}>
                    {savingBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    Save and continue
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
                    <p className="mt-4 text-sm font-semibold text-slate-950">Rings this cell</p>
                    <p className="mt-2 text-sm text-slate-600">{config.contractor_phone || "Pending"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Booking step</p>
                    <p className="mt-2 text-sm text-slate-600">{bookingChoice === "yes" ? "Link will be sent by SMS" : "NexaOS stops after qualification"}</p>
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
