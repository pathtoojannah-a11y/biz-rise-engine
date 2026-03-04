import { useState } from 'react';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Send, Shield } from 'lucide-react';

export function TwilioSettings() {
  const { config, isConnected, isLoading, saveConfig, sendTestSms } = useAutomationConfig();
  const [form, setForm] = useState(config);
  const [testNumber, setTestNumber] = useState('');
  const [dirty, setDirty] = useState(false);

  // Sync form with loaded config
  const syncForm = () => {
    if (!dirty) setForm(config);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { syncForm(); });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    saveConfig.mutate(form, { onSuccess: () => setDirty(false) });
  };

  return (
    <div className="space-y-6">
      {/* Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-lg">Twilio Connection</CardTitle>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
          <CardDescription>Connect your Twilio account for SMS and voice automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Account SID</Label>
            <Input value={form.account_sid} onChange={(e) => handleChange('account_sid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              Auth Token <Shield className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              type="password"
              value={form.auth_token}
              onChange={(e) => handleChange('auth_token', e.target.value)}
              placeholder="Your Twilio auth token"
            />
            <p className="text-xs text-muted-foreground mt-1">Stored securely, never exposed to client-side code</p>
          </div>
          <div>
            <Label>From Number</Label>
            <Input value={form.from_number} onChange={(e) => handleChange('from_number', e.target.value)} placeholder="+15551234567" />
          </div>
        </CardContent>
      </Card>

      {/* Automation toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Automation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Missed Call SMS</p>
              <p className="text-xs text-muted-foreground">Auto-send SMS when a call is missed</p>
            </div>
            <Switch checked={form.missed_call_sms} onCheckedChange={(v) => handleChange('missed_call_sms', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Qualification Flow</p>
              <p className="text-xs text-muted-foreground">Ask service type, urgency, and zip code via SMS</p>
            </div>
            <Switch checked={form.qualification_flow} onCheckedChange={(v) => handleChange('qualification_flow', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Create Job</p>
              <p className="text-xs text-muted-foreground">Create a pipeline job when qualification completes</p>
            </div>
            <Switch checked={form.auto_create_job} onCheckedChange={(v) => handleChange('auto_create_job', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">SMS Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Missed Call Template</Label>
            <Textarea
              value={form.missed_call_template}
              onChange={(e) => handleChange('missed_call_template', e.target.value)}
              placeholder="Sorry we missed your call to {{business_name}}. What service do you need help with?"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">Leave blank to use default template</p>
          </div>
          <div>
            <Label>Booking Link</Label>
            <Input
              value={form.booking_link}
              onChange={(e) => handleChange('booking_link', e.target.value)}
              placeholder="https://calendly.com/your-business"
            />
            <p className="text-xs text-muted-foreground mt-1">Sent after qualification completes</p>
          </div>
        </CardContent>
      </Card>

      {/* Test SMS */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Test Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+15551234567"
                className="max-w-xs"
              />
              <Button
                variant="outline"
                onClick={() => sendTestSms.mutate(testNumber)}
                disabled={!testNumber || sendTestSms.isPending}
              >
                <Send className="mr-1 h-4 w-4" /> Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      {dirty && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saveConfig.isPending}>
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
