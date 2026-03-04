import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const statusColors: Record<string, string> = {
  onboarding: 'bg-primary/15 text-primary',
  active: 'bg-accent/15 text-accent',
  paused: 'bg-muted text-muted-foreground',
  churned: 'bg-destructive/15 text-destructive',
};

export default function Pilots() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_name: '', connected_number: '', notes: '' });

  const { data: pilots, isLoading } = useQuery({
    queryKey: ['pilots', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('pilots').select('*').eq('workspace_id', workspace!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspace,
  });

  const addPilot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pilots').insert({
        workspace_id: workspace!.id, client_name: form.client_name,
        connected_number: form.connected_number || null, notes: form.notes || null,
        start_date: new Date().toISOString().split('T')[0], status: 'onboarding',
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilots'] }); toast.success('Status updated'); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Pilot Clients</h1>
            <p className="text-sm text-muted-foreground">Track onboarding and performance for pilot accounts</p>
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
                  <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Business name" />
                </div>
                <div className="space-y-2">
                  <Label>Connected Number</Label>
                  <Input value={form.connected_number} onChange={e => setForm(f => ({ ...f, connected_number: e.target.value }))} placeholder="+1..." />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." />
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(pilots || []).map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base flex items-center justify-between">
                    {p.client_name}
                    <Badge className={`text-xs ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  {p.connected_number && <p>📞 {p.connected_number}</p>}
                  {p.start_date && <p>📅 Started {format(new Date(p.start_date), 'MMM d, yyyy')}</p>}
                  {p.notes && <p className="truncate">📝 {p.notes}</p>}
                  <Select value={p.status} onValueChange={(val) => updateStatus.mutate({ id: p.id, status: val })}>
                    <SelectTrigger className="h-7 text-xs mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
