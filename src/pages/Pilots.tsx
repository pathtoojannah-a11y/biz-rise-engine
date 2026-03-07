import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Loader2, Phone, CalendarDays, NotebookPen, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';

const statusColors: Record<string, string> = {
  onboarding: 'bg-primary/15 text-primary',
  active: 'bg-accent/15 text-accent',
  paused: 'bg-muted text-muted-foreground',
  churned: 'bg-destructive/15 text-destructive',
};

type PilotMetrics = {
  avg_response_time_minutes: number;
  recovered_leads: number;
  qualified_leads: number;
  jobs_created: number;
  review_4_5_count: number;
  review_1_3_count: number;
};

const DEFAULT_METRICS: PilotMetrics = {
  avg_response_time_minutes: 0,
  recovered_leads: 0,
  qualified_leads: 0,
  jobs_created: 0,
  review_4_5_count: 0,
  review_1_3_count: 0,
};

const METRIC_FIELDS: Array<{ key: keyof PilotMetrics; label: string }> = [
  { key: 'avg_response_time_minutes', label: 'Avg Response Time (min)' },
  { key: 'recovered_leads', label: 'Recovered Leads' },
  { key: 'qualified_leads', label: 'Qualified Leads' },
  { key: 'jobs_created', label: 'Jobs Created' },
  { key: 'review_4_5_count', label: '4-5 Star Outcomes' },
  { key: 'review_1_3_count', label: '1-3 Star Outcomes' },
];

function parseMetrics(value: unknown): PilotMetrics {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, any>;
  return {
    avg_response_time_minutes: Number(raw.avg_response_time_minutes || 0),
    recovered_leads: Number(raw.recovered_leads || 0),
    qualified_leads: Number(raw.qualified_leads || 0),
    jobs_created: Number(raw.jobs_created || 0),
    review_4_5_count: Number(raw.review_4_5_count || 0),
    review_1_3_count: Number(raw.review_1_3_count || 0),
  };
}

function metricDelta(before: number, after: number) {
  return after - before;
}

function deltaClass(delta: number, inverted = false) {
  if (delta === 0) return 'text-muted-foreground';
  const positive = inverted ? delta < 0 : delta > 0;
  return positive ? 'text-accent' : 'text-destructive';
}

export default function Pilots() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_name: '', connected_number: '', notes: '' });
  const [expandedPilotId, setExpandedPilotId] = useState<string | null>(null);
  const [editingPilotId, setEditingPilotId] = useState<string | null>(null);
  const [metricsBefore, setMetricsBefore] = useState<PilotMetrics>(DEFAULT_METRICS);
  const [metricsAfter, setMetricsAfter] = useState<PilotMetrics>(DEFAULT_METRICS);

  const { data: pilots, isLoading } = useQuery({
    queryKey: ['pilots', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilots')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });

  const addPilot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pilots').insert({
        workspace_id: workspace!.id,
        client_name: form.client_name,
        connected_number: form.connected_number || null,
        notes: form.notes || null,
        start_date: new Date().toISOString().split('T')[0],
        status: 'onboarding',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilots'] });
      setOpen(false);
      setForm({ client_name: '', connected_number: '', notes: '' });
      toast.success('Pilot added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('pilots').update({ status } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilots'] });
      toast.success('Status updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMetrics = useMutation({
    mutationFn: async ({ id, before, after }: { id: string; before: PilotMetrics; after: PilotMetrics }) => {
      const { error } = await supabase
        .from('pilots')
        .update({ metrics_before: before as any, metrics_after: after as any } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilots'] });
      setEditingPilotId(null);
      toast.success('Pilot metrics updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleEditMetrics = (pilot: any) => {
    setExpandedPilotId(pilot.id);
    setEditingPilotId(pilot.id);
    setMetricsBefore(parseMetrics(pilot.metrics_before));
    setMetricsAfter(parseMetrics(pilot.metrics_after));
  };

  const selectedPilot = useMemo(
    () => (pilots || []).find((p: any) => p.id === editingPilotId) ?? null,
    [editingPilotId, pilots],
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Pilot Clients</h1>
            <p className="text-sm text-muted-foreground">Track onboarding and before/after performance for pilot accounts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Pilot</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">New Pilot Client</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="Business name" />
                </div>
                <div className="space-y-2">
                  <Label>Connected Number</Label>
                  <Input value={form.connected_number} onChange={(e) => setForm((f) => ({ ...f, connected_number: e.target.value }))} placeholder="+1..." />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." />
                </div>
                <Button className="w-full" disabled={!form.client_name || addPilot.isPending} onClick={() => addPilot.mutate()}>
                  {addPilot.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                  Add Pilot
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (pilots || []).length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No pilot clients yet</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(pilots || []).map((p: any) => {
              const before = parseMetrics(p.metrics_before);
              const after = parseMetrics(p.metrics_after);
              const expanded = expandedPilotId === p.id;

              return (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-base flex items-center justify-between gap-2">
                      <span className="truncate">{p.client_name}</span>
                      <Badge className={`text-xs ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-muted-foreground">
                    {p.connected_number && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {p.connected_number}</p>}
                    {p.start_date && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Started {format(new Date(p.start_date), 'MMM d, yyyy')}</p>}
                    {p.notes && <p className="flex items-center gap-1.5"><NotebookPen className="h-3.5 w-3.5" /> <span className="truncate">{p.notes}</span></p>}

                    <div className="flex items-center gap-2">
                      <Select value={p.status} onValueChange={(val) => updateStatus.mutate({ id: p.id, status: val })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="churned">Churned</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => setExpandedPilotId(expanded ? null : p.id)}>
                        {expanded ? 'Hide Metrics' : 'View Metrics'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleEditMetrics(p)}>
                        Edit
                      </Button>
                    </div>

                    {expanded && (
                      <div className="rounded-md border p-3 space-y-3">
                        <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                          <BarChart3 className="h-4 w-4" /> Case Study Snapshot
                        </div>
                        {METRIC_FIELDS.map((field) => {
                          const beforeVal = before[field.key];
                          const afterVal = after[field.key];
                          const delta = metricDelta(beforeVal, afterVal);
                          const inverted = field.key === 'avg_response_time_minutes';
                          return (
                            <div key={field.key} className="grid grid-cols-3 gap-2 text-xs">
                              <span className="text-foreground/80">{field.label}</span>
                              <span>Before: {beforeVal}</span>
                              <span className={deltaClass(delta, inverted)}>
                                After: {afterVal} ({delta >= 0 ? '+' : ''}{delta})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedPilot && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Edit Metrics: {selectedPilot.client_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Before NexaOS</h3>
                  {METRIC_FIELDS.map((field) => (
                    <div key={`before-${field.key}`} className="space-y-1">
                      <Label>{field.label}</Label>
                      <Input
                        type="number"
                        value={metricsBefore[field.key]}
                        onChange={(e) => setMetricsBefore((prev) => ({ ...prev, [field.key]: Number(e.target.value || 0) }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">After NexaOS</h3>
                  {METRIC_FIELDS.map((field) => (
                    <div key={`after-${field.key}`} className="space-y-1">
                      <Label>{field.label}</Label>
                      <Input
                        type="number"
                        value={metricsAfter[field.key]}
                        onChange={(e) => setMetricsAfter((prev) => ({ ...prev, [field.key]: Number(e.target.value || 0) }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Generated Case Study Summary</p>
                <p className="text-muted-foreground">
                  {selectedPilot.client_name} improved qualified leads by{' '}
                  <span className="font-medium text-foreground">{metricDelta(metricsBefore.qualified_leads, metricsAfter.qualified_leads)}</span>
                  {' '}and jobs created by{' '}
                  <span className="font-medium text-foreground">{metricDelta(metricsBefore.jobs_created, metricsAfter.jobs_created)}</span>.
                  Average response time changed by{' '}
                  <span className={deltaClass(metricDelta(metricsBefore.avg_response_time_minutes, metricsAfter.avg_response_time_minutes), true)}>
                    {metricDelta(metricsBefore.avg_response_time_minutes, metricsAfter.avg_response_time_minutes)} minutes
                  </span>.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPilotId(null)}>Cancel</Button>
                <Button
                  disabled={updateMetrics.isPending}
                  onClick={() => updateMetrics.mutate({ id: selectedPilot.id, before: metricsBefore, after: metricsAfter })}
                >
                  {updateMetrics.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
