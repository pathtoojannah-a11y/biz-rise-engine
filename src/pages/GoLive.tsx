import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { OnboardingLayout } from "@/components/OnboardingLayout";
import { Button } from "@/components/ui/button";
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
  "Your NexaOS number",
  "Set up forwarding",
  "Test call",
  "Google reviews",
  "Office hours",
  "Launch",
];

const CARRIER_GUIDES = {
  att: {
    label: "AT&T",
    instructions: (number: string) => `Dial *61*${number.replace(/\D/g, "")}# on the business phone to forward unanswered calls.`,
  },
  verizon: {
    label: "Verizon",
    instructions: (number: string) => `Dial *71${number.replace(/\D/g, "")} and press call to turn on no-answer forwarding.`,
  },
  tmobile: {
    label: "T-Mobile",
    instructions: (number: string) => `Dial **61*${number.replace(/\D/g, "")}# on the business phone to forward no-answer calls.`,
  },
  sprint: {
    label: "Sprint",
    instructions: (number: string) => `Dial *73, then call ${number} to set conditional forwarding.`,
  },
  landline: {
    label: "Landline / Other",
    instructions: (number: string) =>
      `Call the provider and ask for conditional call forwarding to ${number}. Tell them to forward missed or unanswered calls only.`,
  },
} as const;

function getRecommendedStep(
  onboarding: OnboardingConfig,
  hasProvisionedNumber: boolean,
  hasForwardingCarrier: boolean,
  hasReviewLink: boolean,
) {
  if (!hasProvisionedNumber) return 1;
  if (!hasForwardingCarrier) return 2;
  if (!onboarding.test_call_verified) return 3;
  if (!hasReviewLink) return 4;
  if (!onboarding.checklist.office_hours_set) return 5;
  return 6;
}

export default function GoLive() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace, refreshWorkspace } = useWorkspace();
  const { config, integrationStatus, isProvisioned, provisionNumber, saveConfig } = useAutomationConfig();
  const { data: locations } = useLocations();

  const onboarding = normalizeOnboardingConfig(workspace?.onboarding_config, workspace?.industry ?? undefined);
  const existingReviewLink = locations?.find((location) => location.google_review_link)?.google_review_link ?? "";
  const recommendedStep = getRecommendedStep(
    onboarding,
    Boolean(config.from_number),
    Boolean(onboarding.forwarding_carrier),
    Boolean(existingReviewLink),
  );

  const [currentStep, setCurrentStep] = useState(recommendedStep);
  const [selectedCarrier, setSelectedCarrier] = useState<keyof typeof CARRIER_GUIDES>(
    (onboarding.forwarding_carrier as keyof typeof CARRIER_GUIDES | null) ?? "att",
  );
  const [reviewLink, setReviewLink] = useState(existingReviewLink);
  const [officeStart, setOfficeStart] = useState(onboarding.office_open || config.office_hours.start || "08:00");
  const [officeEnd, setOfficeEnd] = useState(onboarding.office_close || config.office_hours.end || "18:00");
  const [launching, setLaunching] = useState(false);
  const [savingReviewLink, setSavingReviewLink] = useState(false);
  const [savingForwarding, setSavingForwarding] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [startingTest, setStartingTest] = useState(false);

  useEffect(() => {
    setCurrentStep((previous) => (recommendedStep > previous ? recommendedStep : previous));
  }, [recommendedStep]);

  useEffect(() => {
    setSelectedCarrier((onboarding.forwarding_carrier as keyof typeof CARRIER_GUIDES | null) ?? "att");
  }, [onboarding.forwarding_carrier]);

  useEffect(() => {
    setReviewLink(existingReviewLink);
  }, [existingReviewLink]);

  useEffect(() => {
    setOfficeStart(onboarding.office_open || config.office_hours.start || "08:00");
    setOfficeEnd(onboarding.office_close || config.office_hours.end || "18:00");
  }, [onboarding.office_open, onboarding.office_close, config.office_hours.end, config.office_hours.start]);

  useEffect(() => {
    if (!workspace || !onboarding.test_call_started_at || onboarding.test_call_verified) return;

    const interval = window.setInterval(() => {
      void refreshWorkspace();
    }, 4000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, onboarding.test_call_started_at, onboarding.test_call_verified]);

  useEffect(() => {
    if (onboarding.test_call_verified) {
      toast.success("Forwarding verified. NexaOS received your test call.");
    }
  }, [onboarding.test_call_verified]);

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

  const handleProvision = async () => {
    try {
      await provisionNumber.mutateAsync();
      await refreshWorkspace();
      toast.success("Your NexaOS recovery number is ready.");
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.message || "Unable to provision a number.");
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
      toast.success("Forwarding instructions saved. Run the test call next.");
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.message || "Could not save forwarding setup.");
    } finally {
      setSavingForwarding(false);
    }
  };

  const handleStartTest = async () => {
    setStartingTest(true);
    try {
      await persistOnboarding({
        forwarding_carrier: selectedCarrier,
        forwarding_pending: true,
        test_call_started_at: new Date().toISOString(),
      });
      toast("Call your business number and let it ring. We'll detect the forwarded call automatically.");
    } catch (error: any) {
      toast.error(error.message || "Could not start the forwarding test.");
    } finally {
      setStartingTest(false);
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

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await saveConfig.mutateAsync({
        office_hours: {
          enabled: true,
          start: officeStart,
          end: officeEnd,
        },
      });
      await persistOnboarding(
        {
          office_open: officeStart,
          office_close: officeEnd,
        },
        { office_hours_set: true },
      );
      toast.success("Office hours saved.");
      setCurrentStep(6);
    } catch (error: any) {
      toast.error(error.message || "Could not save office hours.");
    } finally {
      setSavingHours(false);
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await persistOnboarding(
        {
          live: true,
          live_at: new Date().toISOString(),
        },
        { twilio_connected: true, google_reviews_connected: true, office_hours_set: true },
      );
      toast.success("You're live. The full workspace is unlocked.");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Could not complete launch.");
    } finally {
      setLaunching(false);
    }
  };

  const canLaunch = hasCoreSetup(onboarding);
  const carrierGuide = CARRIER_GUIDES[selectedCarrier];

  return (
    <OnboardingLayout
      title="Launch Your Phone Assistant"
      description="Set up the NexaOS recovery number, forward missed calls, run one live test, then unlock the full workspace."
      currentStep={currentStep}
      steps={STEP_LABELS}
    >
      <div className="space-y-6">
        <Card className="border-slate-200/80 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="font-display text-3xl tracking-[-0.04em] text-slate-950">
                  {STEP_LABELS[currentStep]}
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-base text-slate-600">
                  {currentStep === 0 && "Review the core business details NexaOS will use for activation."}
                  {currentStep === 1 && "Provision a NexaOS-managed recovery number. Contractors never need Twilio credentials."}
                  {currentStep === 2 && "Pick the carrier and show the exact forwarding steps for missed or unanswered calls."}
                  {currentStep === 3 && "Run one forwarded test call. As soon as NexaOS receives it, Twilio is marked verified."}
                  {currentStep === 4 && "Add the Google review link that NexaOS should send after completed jobs."}
                  {currentStep === 5 && "Set the reminder window so follow-up texts only go out during office hours."}
                  {currentStep === 6 && "Everything critical is set. Confirm launch to unlock the normal dashboard and navigation."}
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
                  <Button onClick={() => setCurrentStep(1)}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-sm text-slate-600">NexaOS assigns one managed number per workspace. The contractor keeps the public-facing business number and forwards missed calls here.</p>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Assigned recovery number</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{config.from_number || "Provision on demand"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <p className="mt-2 text-lg font-semibold capitalize">{integrationStatus}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  {isProvisioned ? (
                    <Button onClick={() => setCurrentStep(2)}>
                      Continue to forwarding
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleProvision} disabled={provisionNumber.isPending}>
                      {provisionNumber.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                      Provision recovery number
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
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
                      <p className="mt-2 text-sm leading-6 text-slate-600">{carrier.instructions(config.from_number || "(your NexaOS number)")}</p>
                    </button>
                  ))}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Exact script</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{carrierGuide.instructions(config.from_number || "(your NexaOS number)")}</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleForwardingSaved} disabled={!config.from_number || savingForwarding}>
                    {savingForwarding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    I set the forwarding instructions
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-medium text-slate-950">How to verify it</p>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li>1. Use another phone and call the contractor's normal business number.</li>
                    <li>2. Let it ring long enough to hit the missed-call forwarding rule.</li>
                    <li>3. NexaOS will detect the forwarded call and mark this step complete automatically.</li>
                  </ol>
                  <div className="mt-5 rounded-2xl bg-slate-950 px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Forward missed calls to</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{config.from_number || "Provision the recovery number first"}</p>
                  </div>
                </div>

                {onboarding.test_call_verified ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold">Forwarding verified</p>
                        <p className="text-sm text-emerald-800">NexaOS received the test call and your missed-call automation is active.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-700">
                      {onboarding.test_call_started_at
                        ? "Listening for the forwarded call now. Keep this page open while you run the test."
                        : "Start the test when the forwarding rule is on."}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {!onboarding.test_call_verified && (
                    <Button onClick={handleStartTest} disabled={!config.from_number || startingTest}>
                      {startingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                      {onboarding.test_call_started_at ? "Retry test call" : "Start test call"}
                    </Button>
                  )}
                  {onboarding.test_call_verified && (
                    <Button onClick={() => setCurrentStep(4)}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
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
                  <p className="text-sm text-slate-500">NexaOS uses this link after completed jobs when it asks for a review by text.</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveReviewLink} disabled={savingReviewLink}>
                    {savingReviewLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Save review routing
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
                <p className="text-sm text-slate-500">Reminder texts will respect this window so customers are not nudged outside business hours.</p>
                <div className="flex justify-end">
                  <Button onClick={handleSaveHours} disabled={savingHours}>
                    {savingHours ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                    Save office hours
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Recovery number</p>
                    <p className="mt-2 text-sm text-slate-600">{config.from_number || "Pending"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Forwarding test</p>
                    <p className="mt-2 text-sm text-slate-600">{onboarding.test_call_verified ? "Verified" : "Still pending"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Review routing</p>
                    <p className="mt-2 text-sm text-slate-600">{existingReviewLink ? "Configured" : "Still missing"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <Clock3 className="h-5 w-5 text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">Office hours</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {onboarding.checklist.office_hours_set ? `${officeStart} - ${officeEnd}` : "Still missing"}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-700">
                    Once launched, the contractor can use the normal dashboard, leads, pipeline, and automations screens. Until then, NexaOS keeps them in this focused activation flow.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleLaunch} disabled={!canLaunch || launching}>
                    {launching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                    Launch workspace
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
