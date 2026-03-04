import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { useWorkflowLogs } from '@/hooks/useWorkflowLogs';
import { CheckCircle, XCircle, Wifi, Phone, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Health() {
  const { workspace } = useWorkspace();
  const { config, isConnected } = useAutomationConfig();
  const { data: logs } = useWorkflowLogs(200);

  const recentErrors = (logs || []).filter((l: any) => {
    const age = Date.now() - new Date(l.created_at).getTime();
    return age < 86400000 && (l.event_type === 'error' || l.event_type === 'webhook_rejected' || l.event_type === 'review_error');
  });

  const lastWebhook = (logs || []).find((l: any) =>
    ['call_received', 'sms_received'].includes(l.event_type)
  );

  const hasFromNumber = !!(config as any)?.from_number;

  const checks = [
    {
      label: 'Twilio Connected',
      ok: isConnected,
      icon: Wifi,
      detail: isConnected ? 'Integration active' : 'Not connected — go to Automations',
    },
    {
      label: 'Phone Number Mapped',
      ok: hasFromNumber,
      icon: Phone,
      detail: hasFromNumber ? `Number: ${(config as any)?.from_number}` : 'No from_number configured',
    },
    {
      label: 'Webhook Activity',
      ok: !!lastWebhook,
      icon: Clock,
      detail: lastWebhook
        ? `Last webhook: ${formatDistanceToNow(new Date(lastWebhook.created_at), { addSuffix: true })}`
        : 'No webhook events recorded yet',
    },
    {
      label: 'Error Rate (24h)',
      ok: recentErrors.length === 0,
      icon: AlertTriangle,
      detail: recentErrors.length === 0
        ? 'No critical errors'
        : `${recentErrors.length} error${recentErrors.length > 1 ? 's' : ''} in last 24h`,
    },
  ];

  const allOk = checks.every(c => c.ok);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-sm text-muted-foreground">Real-time status for {workspace?.name}</p>
          </div>
          <Badge variant={allOk ? 'default' : 'destructive'} className="text-xs">
            {allOk ? '✓ All Systems Go' : '⚠ Issues Detected'}
          </Badge>
        </div>

        {!allOk && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">One or more health checks have failed. Review below.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {checks.map((c, i) => (
            <Card key={i} className={!c.ok ? 'border-destructive/30' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <c.icon className={`h-4 w-4 ${c.ok ? 'text-accent' : 'text-destructive'}`} />
                  {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{c.detail}</p>
                {c.ok ? <CheckCircle className="h-5 w-5 text-accent" /> : <XCircle className="h-5 w-5 text-destructive" />}
              </CardContent>
            </Card>
          ))}
        </div>

        {recentErrors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Recent Errors (24h)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentErrors.slice(0, 10).map((e: any) => (
                <div key={e.id} className="flex items-start gap-2 rounded border border-border p-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{e.event_type}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </span>
                    {e.payload && <p className="text-muted-foreground mt-0.5 truncate max-w-md">{JSON.stringify(e.payload).substring(0, 120)}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
