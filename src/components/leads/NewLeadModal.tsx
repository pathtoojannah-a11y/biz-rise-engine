import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLeadMutations } from '@/hooks/useLeadMutations';
import { useJobMutations } from '@/hooks/useJobMutations';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useLocations } from '@/hooks/useLocations';
import { Constants } from '@/integrations/supabase/types';
import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().optional(),
  status: z.string().default('new'),
  location_id: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewLeadModal({ open, onClose }: Props) {
  const { createLead } = useLeadMutations();
  const { createJob } = useJobMutations();
  const { data: stages } = usePipelineStages();
  const { data: locations } = useLocations();
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: '', status: 'new', location_id: '' });
  const [createInitialJob, setCreateInitialJob] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[String(i.path[0])] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const lead = await createLead.mutateAsync({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      source: form.source || null,
      status: form.status as any,
      location_id: form.location_id || null,
    });

    if (createInitialJob && stages && stages.length > 0) {
      await createJob.mutateAsync({
        lead_id: lead.id,
        stage_id: stages[0].id,
      });
    }

    setForm({ name: '', phone: '', email: '', source: '', status: 'new', location_id: '' });
    setCreateInitialJob(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">New Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Google, referral..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.lead_status.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Select value={form.location_id || 'none'} onValueChange={(v) => setForm(f => ({ ...f, location_id: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {(locations ?? []).map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="create-job" checked={createInitialJob} onCheckedChange={(v) => setCreateInitialJob(!!v)} />
            <label htmlFor="create-job" className="text-sm text-muted-foreground cursor-pointer">Create initial job in first pipeline stage</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createLead.isPending}>Create Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
