import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobMutations } from '@/hooks/useJobMutations';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useLeads } from '@/hooks/useLeads';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddJobModal({ open, onClose }: Props) {
  const { createJob } = useJobMutations();
  const { data: stages } = usePipelineStages();
  const { leads } = useLeads();
  const { data: members } = useWorkspaceMembers();
  const [form, setForm] = useState({ lead_id: '', stage_id: '', assigned_to: '', scheduled_at: '' });

  const handleSubmit = async () => {
    if (!form.lead_id || !form.stage_id) return;
    await createJob.mutateAsync({
      lead_id: form.lead_id,
      stage_id: form.stage_id,
      assigned_to: form.assigned_to || null,
      scheduled_at: form.scheduled_at || null,
    });
    setForm({ lead_id: '', stage_id: '', assigned_to: '', scheduled_at: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add Job</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Lead *</Label>
            <Select value={form.lead_id || 'none'} onValueChange={(v) => setForm(f => ({ ...f, lead_id: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Select a lead" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Select a lead</SelectItem>
                {leads.map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Stage *</Label>
            <Select value={form.stage_id || 'none'} onValueChange={(v) => setForm(f => ({ ...f, stage_id: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Select a stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Select a stage</SelectItem>
                {(stages ?? []).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned To</Label>
            <Select value={form.assigned_to || 'none'} onValueChange={(v) => setForm(f => ({ ...f, assigned_to: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {(members ?? []).map((m: any) => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.profiles?.full_name || 'Unknown'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Scheduled Date</Label>
            <Input type="date" value={form.scheduled_at} onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.lead_id || !form.stage_id || createJob.isPending}>Create Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
