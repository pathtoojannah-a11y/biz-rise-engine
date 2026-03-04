import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon } from 'lucide-react';
import { toast } from 'sonner';

const trades = ['General Contractor', 'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Landscaping', 'Painting', 'Cleaning', 'Other'];
const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix'];

export default function Setup() {
  const { user, loading: authLoading } = useAuth();
  const { hasWorkspace, loading: wsLoading, createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('General Contractor');
  const [timezone, setTimezone] = useState('America/New_York');
  const [submitting, setSubmitting] = useState(false);

  if (authLoading || wsLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (hasWorkspace) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await createWorkspace(name, industry, timezone);
    if (error) toast.error(error.message);
    else toast.success('Workspace created!');
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Hexagon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">Set Up Your Business</h1>
          <p className="text-sm text-muted-foreground">Let's get NexaOS configured for your team</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Business Details</CardTitle>
            <CardDescription>We'll create your workspace and default pipeline stages.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biz-name">Business Name</Label>
                <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Smith's HVAC" />
              </div>
              <div className="space-y-2">
                <Label>Trade / Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {trades.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz.replace('America/', '').replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Workspace'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
