import { useEffect, useState } from "react";
import { useAutomationConfig } from "@/hooks/useAutomationConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Phone, Send } from "lucide-react";

const statusLabel: Record<string, string> = {
  disconnected: "Not Provisioned",
  provisioned: "Forwarding Pending",
  connected: "Active",
};

export function TwilioSettings() {
  const { config, integrationStatus, isConnected, isLoading, saveConfig, sendTestSms } = useAutomationConfig();
  const [form, setForm] = useState(config);
  const [testNumber, setTestNumber] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setForm(config);
    }
  }, [config, dirty]);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleOfficeHoursChange = (key: "start" | "end", value: string) => {
    setForm((prev) => ({
      ...prev,
      office_hours: {
        ...prev.office_hours,
        [key]: value,
      },
    }));
    setDirty(true);
  };

  const handleSave = () => {
    saveConfig.mutate(form, { onSuccess: () => setDirty(false) });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-lg">NexaOS Number</CardTitle>
            </div>
            <Badge variant={integrationStatus === "connected" ? "default" : "secondary"}>
              {statusLabel[integrationStatus] || integrationStatus}
            </Badge>
          </div>
          <CardDescription>
            NexaOS manages Twilio in the background. This page only shows the assigned recovery number and automation settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Assigned recovery number</Label>
            <Input value={form.from_number || "Provision during onboarding"} disabled className="bg-muted/50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Provisioning scope</Label>
              <Input value={form.provisioning_scope || "Pending"} disabled className="bg-muted/50 capitalize" />
            </div>
            <div>
              <Label>Provisioned record</Label>
              <Input value={form.provisioned_number_id || "Unavailable"} disabled className="bg-muted/50" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep using the existing business number in public. Unanswered calls should forward to this NexaOS number.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Automation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Missed Call SMS</p>
              <p className="text-xs text-muted-foreground">Auto-send a text when the contractor misses a forwarded call</p>
            </div>
            <Switch checked={form.missed_call_sms} onCheckedChange={(value) => handleChange("missed_call_sms", value)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Qualification Flow</p>
              <p className="text-xs text-muted-foreground">Ask service type, urgency, and ZIP code by SMS</p>
            </div>
            <Switch checked={form.qualification_flow} onCheckedChange={(value) => handleChange("qualification_flow", value)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Create Job</p>
              <p className="text-xs text-muted-foreground">Create a pipeline card once qualification is finished</p>
            </div>
            <Switch checked={form.auto_create_job} onCheckedChange={(value) => handleChange("auto_create_job", value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">SMS Copy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Missed call message</Label>
            <Textarea
              value={form.missed_call_template}
              onChange={(event) => handleChange("missed_call_template", event.target.value)}
              placeholder="Sorry we missed your call. What service do you need help with?"
              rows={3}
            />
          </div>
          <div>
            <Label>Booking link</Label>
            <Input
              value={form.booking_link}
              onChange={(event) => handleChange("booking_link", event.target.value)}
              placeholder="https://calendly.com/your-business"
            />
          </div>
          <div>
            <Label>Review request message</Label>
            <Textarea
              value={form.review_template}
              onChange={(event) => handleChange("review_template", event.target.value)}
              placeholder="How was your experience with us? Reply 1-5."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Reminder Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Only send reminders during business hours</p>
              <p className="text-xs text-muted-foreground">Review reminder cron respects this window</p>
            </div>
            <Switch
              checked={form.office_hours.enabled}
              onCheckedChange={(value) =>
                handleChange("office_hours", {
                  ...form.office_hours,
                  enabled: value,
                })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Start</Label>
              <Input type="time" value={form.office_hours.start} onChange={(event) => handleOfficeHoursChange("start", event.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={form.office_hours.end} onChange={(event) => handleOfficeHoursChange("end", event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Test SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={testNumber}
                onChange={(event) => setTestNumber(event.target.value)}
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
