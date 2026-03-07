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
import { hasCoreSetup, isWorkspaceLive, normalizeOnboardingConfig, OnboardingConfig, PhonePath } from "@/lib/onboarding";
import { toast } from "sonner";

const STEP_LABELS = [
  "Business info",
  "Phone setup",
  "Number assignment",
  "Test call",
  "Booking link",
  "Google reviews",
  "Office hours",
];

const CARRIER_GUIDES = {
  att: {
    label: "AT&T",
    instructions: (number: string) => `*61*${number.replace(/\D/g, "")}#`,
  },
  verizon: {
    label: "Verizon",
    instructions: (number: string) => `*71${number.replace(/\D/g, "")}`,
  },
  tmobile: {
    label: "T-Mobile",
    instructions: (number: string) => `**61*${number.replace(/\D/g, "")}#`,
  },
  sprint: {
    label: "Sprint",
    instructions: (number: string) => `*73 then call ${number}`,
  },
  landline: {
    label: "Landline / Other",
    instructions: (number: string) => `Call your provider and ask for missed-call forwarding to ${number}`,
  },
} as const;

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
    return "No recovery numbers are available right now. Try again shortly.";
  }

  return message || "We couldn't assign a NexaOS number yet.";
}

function getRecommendedStep(
  onboarding: OnboardingConfig,
  config: {
    phone_path: PhonePath | null;
    from_number: string;
  },
  hasReviewLink: boolean,
) {
  if (!config.phone_path) return 1;
  if (!config.from_number) return 2;
  if (config.phone_path === "B" && !onboarding.forwarding_carrier) return 2;
  if (!onboarding.test_call_verified) return 3;
  if (!onboarding.booking_link_ready) return 4;
  if (!hasReviewLink) return 5;
  return 6;
}

export default function GoLive() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace, refreshWorkspace } = useWorkspace();
  const { config, isProvisioned, provisionNumber, saveConfig } = useAutomationConfig();
  const { data: locations } = useLocations();

  const onboarding = normalizeOnboardingConfig(workspace?.onboarding_config, workspace?.industry ?? undefined);
  const existingReviewLink = locations?.find((location) => location.google_review_link)?.google_review_link ?? "";
  const recommendedStep = getRecommendedStep(onboarding, {
    phone_path: config.phone_path,
    from_number: config.from_number,
  }, Boolean(existingReviewLink));

  const [currentStep, setCurrentStep] = useState(recommendedStep);
  const [phonePath, setPhonePath] = useState<PhonePath | null>(config.phone_path ?? null);
  const [publicNumber, setPublicNumber] = useState(
    config.phone_path === "A" ? config.from_number : config.public_number || "",
  );
  const [contractorPhone, setContractorPhone] = useState(config.contractor_phone || "");
  const [selectedCarrier, setSelectedCarrier] = useState<keyof typeof CARRIER_GUIDES>(
    (onboarding.forwarding_carrier as keyof typeof CARRIER_GUIDES | null) ?? "att",
  );
  const [bookingChoice, setBookingChoice] = useState<"yes" | "no" | null>(
    config.booking_link ? "yes" : onboarding.booking_link_ready ? "no" : null,
  );
  const [bookingLink, setBookingLink] = useState(config.booking_link || "");
  const [reviewLink, setReviewLink] = useState(existingReviewLink);
  const [officeStart, setOfficeStart] = useState(onboarding.office_open || config.office_hours.start || "08:00");
  const [officeEnd, setOfficeEnd] = useState(onboarding.office_close || config.office_hours.end || "18:00");
  const [savingPhoneSetup, setSavingPhoneSetup] = useState(false);
  const [savingForwarding, setSavingForwarding] = useState(false);
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
    setPhonePath(config.phone_path ?? null);
    setPublicNumber(config.phone_path === "A" ? config.from_number : config.public_number || "");
    setContractorPhone(config.contractor_phone || "");
    setBookingChoice(config.booking_link ? "yes" : onboarding.booking_link_ready ? "no" : null);
    setBookingLink(config.booking_link || "");
  }, [config.phone_path, config.from_number, config.public_number, config.contractor_phone, config.booking_link, onboarding.booking_link_ready]);

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

  if (!workspace) {
    return <Navigate to="/setup" replace />;
  }

  if (isWorkspaceLive(onboarding)) {
    return <Navigate to="/dashboard" replace />;
  }

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
      .update({ onboarding_config: nextConfig as any })
      .eq("id", workspace.id);

    if (error) throw error;
    await refreshWorkspace();
    return nextConfig;
  };

  const handleSavePhoneSetup = async () => {
    if (!phonePath) {
      toast.error("Pick the phone setup that matches how customers reach you.");
      return;
    }

    if (!isPhoneValid(contractorPhone)) {
      toast.error(phonePath === "A" ? "Enter the cell number NexaOS should ring." : "Enter the mobile number NexaOS should text.");
      return;
    }

    if (phonePath === "B" && !isPhoneValid(publicNumber)) {
      toast.error("Enter the public business number customers already call.");
      return;
    }

    setSavingPhoneSetup(true);
    try {
      await saveConfig.mutateAsync({
        phone_path: phonePath,
        contractor_phone: normalizePhone(contractorPhone),
        public_number: phonePath === "B" ? normalizePhone(publicNumber) : "",
      });
      if (phonePath === "A") {
        await persistOnboarding({ forwarding_carrier: null, forwarding_pending: false });
      } else {
        await persistOnboarding({ forwarding_carrier: null, forwarding_pending: true });
      }
      toast.success("Phone setup saved.");
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.message || "Could not save the phone setup.");
    } finally {
      setSavingPhoneSetup(false);
    }
  };

  const handleProvision = async () => {
    if (!phonePath) {
      toast.error("Pick the phone setup first.");
      return;
    }

    setProvisioningError(null);
    try {
      await provisionNumber.mutateAsync({
        phone_path: phonePath,
        contractor_phone: normalizePhone(contractorPhone),
        public_number: phonePath === "B" ? normalizePhone(publicNumber) : undefined,
        preferred_area_code: getAreaCode(phonePath === "A" ? contractorPhone : publicNumber),
      });
      await refreshWorkspace();
      toast.success(phonePath === "A" ? "Your new NexaOS number is ready." : "Your backup NexaOS number is ready.");
      setCurrentStep(phonePath === "A" ? 3 : 2);
    } catch (error) {
      const message = getProvisioningErrorMessage(error);
      setProvisioningError(message);
      toast.error(message);
    }
  };

  const handleForwardingSaved = async () => {
    if (!config.from_number) return;
    setSavingForwarding(true);
    try {
      await persistOnboarding({
        forwarding_carrier: selectedCarrier,
        forwarding_pending: true,
      });
      toast.success("Forwarding noted. Run the test call next.");
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.message || "Could not save the forwarding step.");
    } finally {
      setSavingForwarding(false);
    }
  };

  const handleStartTest = async () => {
    setStartingTest(true);
    try {
      await persistOnboarding({
        forwarding_carrier: phonePath === "B" ? selectedCarrier : null,
        forwarding_pending: phonePath === "B",
        test_call_started_at: new Date().toISOString(),
      });
      toast(
        phonePath === "A"
          ? "Use another phone to call your new NexaOS number and let it ring."
          : "Use another phone to call your public business number and let it ring.",
      );
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
      await saveConfig.mutateAsync({
        booking_link: bookingChoice === "yes" ? bookingLink.trim() : "",
      });
      await persistOnboarding({ booking_link_ready: true });
      toast.success("Booking step saved.");
      setCurrentStep(5);
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
      setCurrentStep(6);
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
        office_hours: {
          enabled: true,
          start: officeStart,
          end: officeEnd,
        },
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

  const customerFacingNumber =
    phonePath === "A" ? config.from_number || "your new NexaOS number" : config.public_number || publicNumber || "your public business number";
  const carrierGuide = CARRIER_GUIDES[selectedCarrier];

  return (
    <OnboardingLayout
      title="Launch Your Phone Assistant"
      description="Answer one phone question, activate the number flow, then let NexaOS handle missed-call follow-up by text."
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
                  {currentStep === 0 && "Check the business details NexaOS will use for launch."}
                  {currentStep === 1 && "Tell NexaOS what number customers call so we can route the right phone path."}
                  {currentStep === 2 && "NexaOS assigns the right number for your phone path and gives you the next action."}
                  {currentStep === 3 && "Run one real missed-call test so NexaOS can verify the automation."}
                  {currentStep === 4 && "Decide whether qualified leads should get a booking link by text."}
                  {currentStep === 5 && "Paste your Google review link. High ratings go public. Low ratings stay private."}
                  {currentStep === 6 && "Set reminder hours, finish setup, and unlock the workspace."}
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
                <div className="grid gap-4 lg:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPhonePath("A")}
                    className={`rounded-3xl border p-6 text-left transition ${
                      phonePath === "A"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Path A</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">My personal cell</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      NexaOS gives you a new local business number. Customers call that number, it rings your cell, and missed calls get handled automatically.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhonePath("B")}
                    className={`rounded-3xl border p-6 text-left transition ${
                      phonePath === "B"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Path B</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">A separate business line</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Keep the public business number you already use. NexaOS gives you a private backup number and you forward only missed calls to it.
                    </p>
                  </button>
                </div>

                {phonePath && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {phonePath === "A" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="contractor-cell">Cell number NexaOS should ring</Label>
                          <Input
                            id="contractor-cell"
                            value={contractorPhone}
                            onChange={(event) => setContractorPhone(normalizePhoneInput(event.target.value))}
                            placeholder="(313) 555-1234"
                          />
                          <p className="text-sm text-slate-500">When customers call your new NexaOS number, this cell rings.</p>
                        </div>
                        <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-5">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">What changes</p>
                          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                            <li>Customers call a new local NexaOS number.</li>
                            <li>Your cell still rings in real time.</li>
                            <li>No carrier forwarding setup is needed.</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="public-number">Public business number</Label>
                            <Input
                              id="public-number"
                              value={publicNumber}
                              onChange={(event) => setPublicNumber(normalizePhoneInput(event.target.value))}
                              placeholder="(313) 555-1234"
                            />
                            <p className="text-sm text-slate-500">This is the number customers already call today.</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contractor-mobile">Mobile number for NexaOS texts</Label>
                            <Input
                              id="contractor-mobile"
                              value={contractorPhone}
                              onChange={(event) => setContractorPhone(normalizePhoneInput(event.target.value))}
                              placeholder="(313) 555-1234"
                            />
                            <p className="text-sm text-slate-500">NexaOS sends new-lead alerts and review confirmations here.</p>
                          </div>
                        </div>
                        <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-5">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">What changes</p>
                          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                            <li>Your public number stays public.</li>
                            <li>NexaOS gives you a private backup number.</li>
                            <li>You only turn on missed-call forwarding after the number is assigned.</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button className={primaryButtonClass} onClick={handleSavePhoneSetup} disabled={savingPhoneSetup}>
                    {savingPhoneSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {phonePath === "A" ? (
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Path A</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your new business number</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        NexaOS will reserve a local number that customers can call directly. It rings {contractorPhone || "your cell"} and handles missed calls automatically.
                      </p>
                      <div className="mt-5 rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Use publicly after setup</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {config.from_number || "Not assigned yet"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-[linear-gradient(165deg,#022c22_0%,#052e16_54%,#020617_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(6,95,70,0.95)]">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{config.from_number || "Waiting on assignment"}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-200">
                        {isProvisioned
                          ? "Your new public NexaOS number is ready. Next, run one missed-call test."
                          : "Create the number now. NexaOS will search for a local match first."}
                      </p>
                      <div className="mt-6">
                        {isProvisioned ? (
                          <Button className={`w-full ${primaryButtonClass}`} onClick={() => setCurrentStep(3)}>
                            Continue to test call
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button className={`w-full ${primaryButtonClass}`} onClick={handleProvision} disabled={provisionNumber.isPending}>
                            {provisionNumber.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                            Create my NexaOS number
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
                        Keep {publicNumber || "your current number"} public
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                        Forward missed calls to {config.from_number || "your backup NexaOS number"}
                      </div>
                    </div>

                    {!isProvisioned ? (
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-6">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Path B</p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create your backup number</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            NexaOS assigns a private number that only catches missed calls from your public business line.
                          </p>
                        </div>
                        <div className="rounded-3xl bg-[linear-gradient(165deg,#022c22_0%,#052e16_54%,#020617_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(6,95,70,0.95)]">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Backup number</p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight">Not assigned yet</p>
                          <div className="mt-6">
                            <Button className={`w-full ${primaryButtonClass}`} onClick={handleProvision} disabled={provisionNumber.isPending}>
                              {provisionNumber.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                              Create backup number
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-6">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Do this on your public line</p>
                          <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                              <p className="mt-3 text-sm font-semibold text-slate-950">Pick your carrier</p>
                              <p className="mt-1 text-sm text-slate-600">Choose the company behind {publicNumber || "your public number"}.</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                              <p className="mt-3 text-sm font-semibold text-slate-950">Dial the code</p>
                              <p className="mt-1 text-sm text-slate-600">This tells your carrier to forward only missed calls to NexaOS.</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                              <p className="mt-3 text-sm font-semibold text-slate-950">Come back here</p>
                              <p className="mt-1 text-sm text-slate-600">Then run the test call on your public number.</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {Object.entries(CARRIER_GUIDES).map(([key, carrier]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedCarrier(key as keyof typeof CARRIER_GUIDES)}
                              className={`rounded-3xl border p-4 text-left transition ${
                                selectedCarrier === key
                                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <p className="text-sm font-semibold text-slate-950">{carrier.label}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {selectedCarrier === key ? "Selected" : "Tap to use this carrier's code"}
                              </p>
                            </button>
                          ))}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dial this on {publicNumber || "your public line"}</p>
                              <p className="mt-2 text-sm text-slate-300">{carrierGuide.label}</p>
                            </div>
                            <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200 hover:bg-emerald-500/15">
                              Backup number
                            </Badge>
                          </div>
                          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                            <p className="text-2xl font-semibold tracking-tight">{carrierGuide.instructions(config.from_number || "(your NexaOS number)")}</p>
                          </div>
                          <p className="mt-4 text-sm text-slate-300">
                            Customers still call {publicNumber || "your public number"}. Only missed calls route to {config.from_number}.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button className={primaryButtonClass} onClick={handleForwardingSaved} disabled={savingForwarding}>
                            {savingForwarding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            I turned on missed-call forwarding
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {provisioningError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-950 [&>svg]:text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>We couldn't create the number yet</AlertTitle>
                    <AlertDescription>{provisioningError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Run one real test</p>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    {phonePath === "A" ? (
                      <>
                        <li>1. Use another phone and call your new NexaOS number.</li>
                        <li>2. Let your cell ring, but do not answer.</li>
                        <li>3. NexaOS should catch the miss and mark this step complete automatically.</li>
                      </>
                    ) : (
                      <>
                        <li>1. Use another phone and call your public business number.</li>
                        <li>2. Do not answer it.</li>
                        <li>3. The missed call should forward to NexaOS and complete this step automatically.</li>
                      </>
                    )}
                  </ol>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {phonePath === "A" ? "Call this number" : "Customers call this number"}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{customerFacingNumber || "Finish the phone setup first"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">NexaOS catches misses here</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {config.from_number || "Provision the NexaOS number first"}
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
                        : "Start the test when the number setup above is done."}
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
                    <Button className={primaryButtonClass} onClick={() => setCurrentStep(4)}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
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

            {currentStep === 5 && (
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

            {currentStep === 6 && (
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
                    <p className="mt-4 text-sm font-semibold text-slate-950">Phone flow</p>
                    <p className="mt-2 text-sm text-slate-600">{phonePath === "A" ? "Direct to your cell" : "Forward missed calls only"}</p>
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
