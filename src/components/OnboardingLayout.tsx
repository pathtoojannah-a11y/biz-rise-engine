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
}

export function OnboardingLayout({ title, description, currentStep, steps, children }: OnboardingLayoutProps) {
  const { signOut } = useAuth();
  const { workspace } = useWorkspace();

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#020617_10%,#0f172a_42%,#f8fafc_42%,#f8fafc_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col justify-between border-r border-white/10 bg-slate-950/90 px-6 py-8 text-white">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <Hexagon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">NexaOS</p>
                <p className="text-xs text-slate-400">{workspace?.name || "Workspace setup"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Activation Flow</p>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const complete = index < currentStep;
                const active = index === currentStep;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                      active ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/5"
                    }`}
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
                  </div>
                );
              })}
            </div>
          </div>

          <Button variant="ghost" className="justify-start text-slate-300 hover:bg-white/5 hover:text-white" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </aside>

        <main className="flex items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
