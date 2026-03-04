import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TwilioSettings } from '@/components/automations/TwilioSettings';
import { WorkflowLogsList } from '@/components/automations/WorkflowLogsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { Badge } from '@/components/ui/badge';
import { Zap, Settings, Activity, ArrowRight, Phone, MessageSquare, CheckCircle } from 'lucide-react';

export default function Automations() {
  const { isConnected } = useAutomationConfig();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Automations</h1>
            <p className="text-sm text-muted-foreground">Missed call recovery & SMS lead qualification</p>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
            <Zap className="mr-1 h-3 w-3" />
            {isConnected ? 'Active' : 'Setup Required'}
          </Badge>
        </div>

        {/* Flow diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Automation Flow</CardTitle>
            <CardDescription>How missed call recovery and lead qualification works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <FlowStep icon={Phone} label="Missed Call" color="bg-[hsl(var(--nexa-warning))]/15 text-[hsl(var(--nexa-warning))]" />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <FlowStep icon={MessageSquare} label="Auto SMS" color="bg-primary/15 text-primary" />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <FlowStep icon={MessageSquare} label="Service Type?" color="bg-primary/15 text-primary" />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <FlowStep icon={MessageSquare} label="Urgency?" color="bg-primary/15 text-primary" />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <FlowStep icon={MessageSquare} label="Zip Code?" color="bg-primary/15 text-primary" />
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <FlowStep icon={CheckCircle} label="Lead Qualified" color="bg-accent/15 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList>
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="h-3.5 w-3.5" /> Settings
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1">
              <Activity className="h-3.5 w-3.5" /> Event Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-4">
            <TwilioSettings />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <WorkflowLogsList />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function FlowStep({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${color}`}>
      <Icon className="h-3 w-3" />
      <span className="font-medium">{label}</span>
    </div>
  );
}
