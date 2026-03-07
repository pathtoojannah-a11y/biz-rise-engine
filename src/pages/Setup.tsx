import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Hexagon,
  Layers3,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { isWorkspaceLive, normalizeOnboardingConfig } from "@/lib/onboarding";
import {
  buildPipelineStages,
  formatTimezoneLabel,
  getBusinessNameSuggestion,
  getDetectedTimezone,
  TIMEZONE_OPTIONS,
  TRADE_OPTIONS,
} from "@/lib/workspace-setup";

const setupHighlights = [
  {
    title: "Workspace created",
    body: "Your business profile becomes the home for leads, routing, and launch progress.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Pipeline prepared",
    body: "Stages are tailored to your trade so the board is usable once the automation is live.",
    icon: Layers3,
  },
  {
    title: "Local number match",
    body: "Your ZIP code helps NexaOS look for a nearby recovery number during provisioning.",
    icon: MapPinned,
  },
];

export default function Setup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { workspace, hasWorkspace, loading: wsLoading, createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("General Contractor");
  const [timezone, setTimezone] = useState("America/New_York");
  const [businessZip, setBusinessZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hydratedDefaults, setHydratedDefaults] = useState(false);

  useEffect(() => {
    if (!user || hydratedDefaults) return;

    const suggestedName = getBusinessNameSuggestion(
      user.user_metadata?.full_name,
      user.email,
    );

    if (suggestedName) {
      setName(suggestedName);
    }

    setTimezone(getDetectedTimezone());
    setHydratedDefaults(true);
  }, [hydratedDefaults, user]);

  if (authLoading || wsLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (hasWorkspace && workspace) {
    const onboarding = normalizeOnboardingConfig(workspace.onboarding_config, workspace.industry ?? undefined);
    return <Navigate to={isWorkspaceLive(onboarding) ? "/dashboard" : "/go-live"} replace />;
  }

  const pipelineStages = buildPipelineStages(industry);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedZip = businessZip.trim();

    if (!trimmedName) {
      toast.error("Add your business name before continuing.");
      return;
    }

    if (!/^\d{5}$/.test(trimmedZip)) {
      toast.error("Enter a valid 5-digit ZIP code.");
      return;
    }

    setSubmitting(true);
    const { error } = await createWorkspace(trimmedName, industry, timezone, trimmedZip);

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Workspace created. Continue to activation.");
    navigate("/go-live", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,transparent_65%,rgba(255,255,255,0.02))]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Hexagon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">NexaOS</p>
                <p className="text-xs text-slate-400">Step 1 of 2</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl py-10 lg:py-16">
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Workspace Setup
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Set up the business once, then activate the recovery flow.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              We only ask for the fields that shape your workspace, pipeline, and NexaOS number search.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-200">
                Signed in as {user.email}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-200">
                About 2 minutes
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-200">
                Twilio stays hidden from contractors
              </span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {setupHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_-40px_rgba(16,185,129,0.35)] backdrop-blur"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-emerald-300">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Default stages are generated automatically
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Activation starts immediately after this screen
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-12">
          <Card className="w-full max-w-xl border-white/10 bg-white/95 text-slate-950 shadow-[0_32px_120px_-40px_rgba(15,23,42,0.8)]">
            <CardHeader className="space-y-4 pb-2">
              <div className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Business Details
              </div>
              <div className="space-y-2">
                <CardTitle className="font-display text-3xl tracking-tight">Create your workspace</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-600">
                  Business info plus ZIP code is enough to build the initial workspace and start number provisioning.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="biz-name">Business name</Label>
                  <Input
                    id="biz-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    placeholder="Smith's HVAC"
                    className="h-12 border-slate-200 bg-white"
                  />
                  <p className="text-sm text-slate-500">
                    This becomes the workspace name your team sees across the app.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Trade / industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="h-12 border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADE_OPTIONS.map((trade) => (
                          <SelectItem key={trade} value={trade}>
                            {trade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="h-12 border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatTimezoneLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-zip">Business ZIP code</Label>
                  <Input
                    id="business-zip"
                    inputMode="numeric"
                    maxLength={5}
                    value={businessZip}
                    onChange={(event) => setBusinessZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
                    required
                    placeholder="48201"
                    className="h-12 border-slate-200 bg-white"
                  />
                  <p className="text-sm text-slate-500">
                    NexaOS uses this to look for a nearby recovery number first.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock3 className="h-4 w-4 text-emerald-600" />
                    What gets created right now
                  </div>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Workspace shell</p>
                        <p className="text-sm leading-6 text-slate-600">
                          Owner membership, business details, and onboarding progress tracking.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Pipeline template for {industry}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pipelineStages.map((stage) => (
                            <span
                              key={stage}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {stage}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Activation next</p>
                <p className="text-sm leading-6 text-slate-600">
                          NexaOS will provision the number, connect it to the contractor's cell, and verify one live test call.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
                  disabled={submitting}
                >
                  {submitting ? "Creating workspace..." : "Create Workspace and Continue"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                The contractor only sees setup outcomes. NexaOS handles the Twilio infrastructure.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
