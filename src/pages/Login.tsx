import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronLeft, Hexagon, LineChart, MessageSquareText, PhoneCall } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const loginBenefits = [
  {
    title: "See every recovered lead",
    body: "Review the status of missed-call conversations without digging through voicemail or texts.",
    icon: PhoneCall,
  },
  {
    title: "Pick up live conversations",
    body: "Your team can step into the thread when qualification needs a human response.",
    icon: MessageSquareText,
  },
  {
    title: "Track the pipeline",
    body: "Move from recovery to booking and monitor what actually turned into work.",
    icon: LineChart,
  },
];

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    }

    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,transparent_65%,rgba(255,255,255,0.02))]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
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
              Customer Login
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Pick up the recovery queue exactly where your team left it.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Sign in to review recovered leads, manage the pipeline, and keep office follow-up moving.
              The system is built for owners and dispatchers who need the signal fast.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Lead inbox
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Pipeline visibility
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Review workflow controls
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {loginBenefits.map((item) => (
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
              Built for contractor office workflows
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Same dashboard for missed calls, pipeline, and reviews
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-12">
          <Card className="w-full max-w-xl border-white/10 bg-white/95 text-slate-950 shadow-[0_32px_120px_-40px_rgba(15,23,42,0.8)]">
            <CardHeader className="space-y-4 pb-2">
              <div className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Welcome Back
              </div>
              <div className="space-y-2">
                <CardTitle className="font-display text-3xl tracking-tight">Sign in to NexaOS</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-600">
                  Open your workspace and continue from the lead inbox, dispatch board, or review workflow.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="Enter your password"
                    className="h-12 border-slate-200 bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
                  disabled={submitting}
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Need an account first?</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Start the free trial, confirm your email, and move into setup to connect your missed-call flow.
                </p>
                <Link
                  to="/signup"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Go to signup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Do not have an account yet?{" "}
                <Link to="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
