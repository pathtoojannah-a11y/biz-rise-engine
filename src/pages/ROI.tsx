import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, PhoneOff, Users, Briefcase, Star, AlertTriangle } from 'lucide-react';

export default function ROI() {
  const { workspace } = useWorkspace();
  const [period, setPeriod] = useState<'7' | '30'>('30');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['roi-metrics', workspace?.id, period],
    queryFn: async () => {
      const since = new Date(Date.now() - parseInt(period) * 86400000).toISOString();

      // Parallel queries
      const [callsRes, leadsRes, jobsRes, reviewsRes, logsRes, convosRes] = await Promise.all([
        supabase.from('calls').select('id, status, created_at').eq('workspace_id', workspace!.id).gte('created_at', since),
        supabase.from('leads').select('id, source, status, created_at').eq('workspace_id', workspace!.id).gte('created_at', since),
        supabase.from('jobs').select('id, created_at').eq('workspace_id', workspace!.id).gte('created_at', since),
        supabase.from('review_requests').select('id, outcome, rating_value, status').eq('workspace_id', workspace!.id).gte('created_at', since),
        supabase.from('workflow_logs').select('id, event_type, created_at, payload').eq('workspace_id', workspace!.id).gte('created_at', since),
        supabase.from('conversations').select('id, direction, created_at, lead_id').eq('workspace_id', workspace!.id).eq('direction', 'outbound').gte('created_at', since),
      ]);

      const calls = callsRes.data || [];
      const leads = leadsRes.data || [];
      const jobs = jobsRes.data || [];
      const reviews = reviewsRes.data || [];
      const logs = logsRes.data || [];
      const convos = convosRes.data || [];

      const missedCalls = calls.filter(c => c.status === 'missed').length;
      const recoveredLogs = logs.filter(l => l.event_type === 'sms_sent').length;
      const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
      const automationJobs = logs.filter(l => l.event_type === 'qualification_completed').length;
      const highRatings = reviews.filter(r => r.rating_value && r.rating_value >= 4).length;
      const lowRatings = reviews.filter(r => r.rating_value && r.rating_value <= 3).length;
      const googleRedirects = reviews.filter(r => (r.outcome as string) === 'public_redirected').length;

      // Avg first response: time from lead creation to first outbound convo
      let avgResponseMs = 0;
      if (convos.length > 0 && leads.length > 0) {
        const leadMap = new Map(leads.map(l => [l.id, new Date(l.created_at).getTime()]));
        const responseTimes: number[] = [];
        const seen = new Set<string>();
        for (const c of convos) {
          const lid = (c as any).lead_id;
          if (lid && leadMap.has(lid) && !seen.has(lid)) {
            seen.add(lid);
            responseTimes.push(new Date(c.created_at).getTime() - leadMap.get(lid)!);
          }
        }
        if (responseTimes.length > 0) {
          avgResponseMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }
      }

      const avgResponseMin = Math.round(avgResponseMs / 60000);

      return {
        missedCalls, recoveredLogs, qualifiedLeads, automationJobs,
        highRatings, lowRatings, googleRedirects,
        avgResponseMin, totalLeads: leads.length, totalJobs: jobs.length,
      };
    },
    enabled: !!workspace,
  });

  const cards = metrics ? [
    { label: 'Avg First Response', value: `${metrics.avgResponseMin}m`, icon: Clock, color: 'text-primary' },
    { label: 'Missed Calls Recovered', value: metrics.recoveredLogs, icon: PhoneOff, color: 'text-accent' },
    { label: 'Qualified Leads', value: metrics.qualifiedLeads, icon: Users, color: 'text-accent' },
    { label: 'Jobs from Automation', value: metrics.automationJobs, icon: Briefcase, color: 'text-primary' },
    { label: '4-5 Star → Google', value: metrics.googleRedirects, icon: Star, color: 'text-accent' },
    { label: '1-3 Star Tickets', value: metrics.lowRatings, icon: AlertTriangle, color: 'text-destructive' },
  ] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">ROI Dashboard</h1>
            <p className="text-sm text-muted-foreground">Automation impact metrics for {workspace?.name}</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as '7' | '30')}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 py-4 px-5">
                  <c.icon className={`h-6 w-6 shrink-0 ${c.color}`} />
                  <div>
                    <p className="text-2xl font-bold font-display text-foreground">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Summary</CardTitle>
              <CardDescription>Exportable snapshot for case studies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border p-4 bg-muted/30 text-sm space-y-1 font-mono">
                <p>Period: Last {period} days</p>
                <p>Total Leads: {metrics.totalLeads}</p>
                <p>Qualified: {metrics.qualifiedLeads}</p>
                <p>Total Jobs: {metrics.totalJobs}</p>
                <p>Missed Calls Recovered: {metrics.recoveredLogs}</p>
                <p>Avg First Response: {metrics.avgResponseMin} min</p>
                <p>Google Review Redirects: {metrics.googleRedirects}</p>
                <p>Low-Rating Tickets: {metrics.lowRatings}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
