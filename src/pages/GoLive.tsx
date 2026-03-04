import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { useLocations } from '@/hooks/useLocations';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Rocket, Building2, Phone, MapPin, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { key: 'business', label: 'Business Info', icon: Building2 },
  { key: 'twilio', label: 'Twilio Connect', icon: Phone },
  { key: 'reviews', label: 'Google Reviews', icon: MapPin },
  { key: 'hours', label: 'Office Hours', icon: Clock },
];

export default function GoLive() {
  const { workspace } = useWorkspace();
  const { isConnected } = useAutomationConfig();
  const { data: locations } = useLocations();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    const ws = workspace as any;
    if (ws?.onboarding_config) {
      setConfig(typeof ws.onboarding_config === 'object' ? ws.onboarding_config : {});
    }
  }, [workspace]);

  const saveProgress = async (updates: any) => {
    if (!workspace) return;
    setSaving(true);
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    const { error } = await supabase.from('workspaces').update({ onboarding_config: newConfig } as any).eq('id', workspace.id);
    if (error) toast.error(error.message);
    setSaving(false);
  };

  const hasGoogleLink = locations?.some((l: any) => l.google_review_link);
  const checks = [
    { done: !!workspace?.name && !!workspace?.industry, label: 'Business name & industry set' },
    { done: isConnected, label: 'Twilio connected' },
    { done: !!hasGoogleLink, label: 'Google review link configured' },
    { done: !!(config as any)?.office_hours_set, label: 'Office hours configured' },
  ];
  const allDone = checks.every(c => c.done);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Go Live</h1>
          <p className="text-sm text-muted-foreground">Complete setup to launch your automation</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setCurrentStep(i)}
              className={`flex-1 flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                currentStep === i ? 'border-primary bg-primary/5' : 'border-border'
              }`}>
              {checks[i].done ? <CheckCircle className="h-4 w-4 text-accent shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className="text-xs font-medium text-foreground">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">{STEPS[currentStep].label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={workspace?.name || ''} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Edit in Settings</p>
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={workspace?.industry || ''} disabled className="bg-muted/50" />
                </div>
                <Badge variant={checks[0].done ? 'default' : 'secondary'}>{checks[0].done ? '✓ Complete' : 'Incomplete'}</Badge>
              </>
            )}
            {currentStep === 1 && (
              <>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Twilio is connected and ready.' : 'Go to Automations → Settings to connect Twilio.'}
                </p>
                <Badge variant={isConnected ? 'default' : 'secondary'}>{isConnected ? '✓ Connected' : 'Not Connected'}</Badge>
                {!isConnected && <Button variant="outline" onClick={() => window.location.href = '/automations'}>Go to Automations</Button>}
              </>
            )}
            {currentStep === 2 && (
              <>
                <p className="text-sm text-muted-foreground">
                  {hasGoogleLink ? 'Google review link is configured on at least one location.' : 'Add a Google review link to a location for review routing.'}
                </p>
                <Badge variant={hasGoogleLink ? 'default' : 'secondary'}>{hasGoogleLink ? '✓ Configured' : 'Not Set'}</Badge>
              </>
            )}
            {currentStep === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Open Time</Label>
                    <Input type="time" value={(config as any)?.office_open || '08:00'}
                      onChange={e => saveProgress({ office_open: e.target.value, office_hours_set: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Close Time</Label>
                    <Input type="time" value={(config as any)?.office_close || '18:00'}
                      onChange={e => saveProgress({ office_close: e.target.value, office_hours_set: true })} />
                  </div>
                </div>
                <Badge variant={(config as any)?.office_hours_set ? 'default' : 'secondary'}>
                  {(config as any)?.office_hours_set ? '✓ Set' : 'Not Set'}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Checklist + Go Live */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Launch Checklist</CardTitle>
            <CardDescription>All items must be complete before going live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                {c.done ? <CheckCircle className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm ${c.done ? 'text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
              </div>
            ))}
            <Button className="w-full mt-4" disabled={!allDone || saving}
              onClick={() => { saveProgress({ live: true, live_at: new Date().toISOString() }); toast.success('🚀 You are live!'); }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Go Live
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
