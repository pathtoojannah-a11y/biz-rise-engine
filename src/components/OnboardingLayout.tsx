import { CheckCircle2, Circle, Hexagon, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";

interface OnboardingLayoutProps {
  title: string;
  description: string;
  currentStep: number;
  steps: string[];
  children: React.ReactNode;
  onStepSelect?: (stepIndex: number) => void;
  canSelectStep?: (stepIndex: number) => boolean;
  highestCompleted?: number;
}

export function OnboardingLayout({
  title,
  description,
  currentStep,
  steps,
  children,
  onStepSelect,
  canSelectStep,
  highestCompleted = -1,
}: OnboardingLayoutProps) {
  const { signOut } = useAuth();
  const { workspace } = useWorkspace();
  const progress = Math.round(((Math.max(currentStep, highestCompleted + 1) + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#ecfdf5_0%,#f8fafc_48%,#f8fafc_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col justify-between border-r border-emerald-500/10 bg-[linear-gradient(180deg,#02150f_0%,#052e16_42%,#020617_100%)] px-6 py-8 text-white">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <Hexagon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">NexaOS</p>
                <p className="text-xs text-slate-400">{workspace?.name || "Workspace setup"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-400/15 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(16,185,129,0.7)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Activation Flow</p>
              <h1 className="mt-3 text-2xl font-black tracking-[-0.04em]">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => {
                const complete = index <= highestCompleted;
                const active = index === currentStep;
                const selectable = onStepSelect ? (canSelectStep ? canSelectStep(index) : index <= currentStep) : false;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => selectable && onStepSelect?.(index)}
                    disabled={!selectable}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                      active
                        ? "border-emerald-400/40 bg-emerald-400/10 shadow-[0_12px_30px_-20px_rgba(52,211,153,0.7)]"
                        : "border-white/10 bg-white/[0.03]"
                    } ${selectable ? "text-left transition hover:border-emerald-300/30 hover:bg-white/[0.06]" : "text-left"}`}
                  >
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                    ) : (
                      <Circle className={`h-4 w-4 shrink-0 ${active ? "text-emerald-200" : "text-slate-500"}`} />
                    )}
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Step {index + 1}</p>
                      <p className="text-sm font-medium text-white">{step}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button variant="ghost" className="justify-start text-slate-300 hover:bg-white/5 hover:text-white" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </aside>

        <main className="flex items-start justify-center px-6 py-8 lg:px-10 lg:py-10">
          <div className="w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
