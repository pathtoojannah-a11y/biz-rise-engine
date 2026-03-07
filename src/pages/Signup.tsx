import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Hexagon, MessageSquareText, PhoneCall, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const launchSteps = [
  {
    title: "Create your workspace",
    body: "Set the owner account and confirm your email.",
    icon: ShieldCheck,
  },
  {
    title: "Connect your missed-call flow",
    body: "Forward unanswered calls to your NexaOS number during setup.",
    icon: PhoneCall,
  },
  {
    title: "Start recovering leads",
    body: "Customers get an instant text instead of a dead-end voicemail.",
    icon: MessageSquareText,
  },
];

const microProof = [
  "14-day free trial",
  "Keep your current number",
  "No contract required",
];

export default function Signup() {
  const { signUp, user, loading } = useAuth();
  const location = useLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefillEmail = params.get("email");
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [location.search]);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created. Check your email to confirm.");
    }

    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,transparent_65%,rgba(255,255,255,0.02))]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to site
            </Link>

            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Hexagon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">NexaOS</p>
                <p className="text-xs text-slate-400">Missed-call recovery for contractors</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl py-10 lg:py-16">
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Start Free Trial
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Launch the recovery flow before the next missed call becomes lost revenue.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Create the account, confirm your email, and move into setup. The goal is simple:
              missed call in, text conversation out, dispatch-ready lead card next.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {microProof.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {launchSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_-40px_rgba(16,185,129,0.35)] backdrop-blur"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-emerald-300">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Under 10 minutes to first test flow
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Designed for HVAC, plumbing, electrical, and roofing
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-12">
          <Card className="w-full max-w-xl border-white/10 bg-white/95 text-slate-950 shadow-[0_32px_120px_-40px_rgba(15,23,42,0.8)]">
            <CardHeader className="space-y-4 pb-2">
              <div className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Create Account
              </div>
              <div className="space-y-2">
                <CardTitle className="font-display text-3xl tracking-tight">Get your workspace live</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-600">
                  Start the free trial now. After signup, you will move into the onboarding flow to connect forwarding,
                  test the SMS sequence, and launch.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    placeholder="Marcus Hill"
                    className="h-12 border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="you@company.com"
                    className="h-12 border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Create a secure password"
                    minLength={6}
                    className="h-12 border-slate-200 bg-white"
                  />
                  <p className="text-sm text-slate-500">Use at least 6 characters. You will confirm the account by email.</p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
                  disabled={submitting}
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">What happens next</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  We send a confirmation email first. Once you confirm, you can finish setup and run your first missed-call test.
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
