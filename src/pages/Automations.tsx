import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TwilioSettings } from '@/components/automations/TwilioSettings';
import { WorkflowLogsList } from '@/components/automations/WorkflowLogsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { useAutomationStats } from '@/hooks/useAutomationStats';
import { Badge } from '@/components/ui/badge';
import { Zap, Settings, Activity, ArrowRight, Phone, MessageSquare, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Automations() {
  const { isConnected } = useAutomationConfig();
  const { data: stats } = useAutomationStats();

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

        {/* Stats cards */}
        {stats && stats.totalEvents > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Calls (24h)"
              value={stats.callsReceived}
              icon={Phone}
              color="text-[hsl(var(--nexa-warning))]"
            />
            <StatCard
              label="SMS Sent"
              value={stats.smsSent}
              icon={MessageSquare}
              color="text-primary"
            />
            <StatCard
              label="Qualified"
              value={stats.qualificationsCompleted}
              icon={CheckCircle}
              color="text-accent"
            />
            <StatCard
              label="Error Rate"
              value={`${stats.errorRate}%`}
              icon={stats.errorRate > 10 ? AlertTriangle : BarChart3}
              color={stats.errorRate > 10 ? 'text-destructive' : 'text-muted-foreground'}
              alert={stats.errorRate > 10}
            />
          </div>
        )}

        {/* Alerts */}
        {stats && stats.rejectedWebhooks > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {stats.rejectedWebhooks} rejected webhook{stats.rejectedWebhooks > 1 ? 's' : ''} in last 24h
                </p>
                <p className="text-xs text-destructive/70">
                  Check for invalid signatures or unresolved phone number mappings
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {stats && stats.errors > 0 && (
          <Card className="border-[hsl(var(--nexa-warning))]/50 bg-[hsl(var(--nexa-warning))]/5">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--nexa-warning))] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[hsl(var(--nexa-warning))]">
                  {stats.errors} error{stats.errors > 1 ? 's' : ''} in last 24h — {stats.smsFailed > 0 ? `${stats.smsFailed} failed SMS send(s)` : 'check event log'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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

function StatCard({ label, value, icon: Icon, color, alert }: { label: string; value: string | number; icon: any; color: string; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-destructive/30' : ''}>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <Icon className={`h-5 w-5 ${color} shrink-0`} />
        <div>
          <p className="text-lg font-bold font-display text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
