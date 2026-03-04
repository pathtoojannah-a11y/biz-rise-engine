import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeadDetail } from '@/hooks/useLeadDetail';
import { useLeadMutations } from '@/hooks/useLeadMutations';
import { StatusBadge } from './LeadsInbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLocations } from '@/hooks/useLocations';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { Constants } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Mail, FileText, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';

interface Props {
  leadId: string | null;
  onClose: () => void;
}

export function LeadDetailDrawer({ leadId, onClose }: Props) {
  const { lead, conversations, calls, isLoading } = useLeadDetail(leadId);
  const { updateLead } = useLeadMutations();
  const { data: locations } = useLocations();
  const { data: members } = useWorkspaceMembers();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ status: '', assigned_to: '', source: '', location_id: '', phone: '', email: '' });

  useEffect(() => {
    if (lead) {
      setForm({
        status: lead.status,
        assigned_to: lead.assigned_to || '',
        source: lead.source || '',
        location_id: lead.location_id || '',
        phone: lead.phone || '',
        email: lead.email || '',
      });
      setEditing(false);
    }
  }, [lead]);

  const handleSave = () => {
    if (!lead) return;
    updateLead.mutate({
      id: lead.id,
      status: form.status as any,
      assigned_to: form.assigned_to || null,
      source: form.source || null,
      location_id: form.location_id || null,
      phone: form.phone || null,
      email: form.email || null,
    }, { onSuccess: () => setEditing(false) });
  };

  // Merge conversations + calls for activity timeline
  const activity = [
    ...conversations.map(c => ({ type: 'conversation' as const, ...c })),
    ...calls.map(c => ({ type: 'call' as const, ...c, channel: 'call' as const, content: null, direction: c.direction })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !lead ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-display flex items-center gap-2">
                {lead.name}
                <StatusBadge status={lead.status} />
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Edit form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">Details</h3>
                  {!editing ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSave} disabled={updateLead.isPending}>Save</Button>
                    </div>
                  )}
                </div>

                {editing ? (
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Constants.public.Enums.lead_status.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Assigned To</Label>
                      <Select value={form.assigned_to || 'none'} onValueChange={(v) => setForm(f => ({ ...f, assigned_to: v === 'none' ? '' : v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {(members ?? []).map((m: any) => (
                            <SelectItem key={m.user_id} value={m.user_id}>{m.profiles?.full_name || 'Unknown'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Source</Label>
                      <Input value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Location</Label>
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
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Phone</span><span className="text-foreground">{lead.phone || '—'}</span>
                    <span className="text-muted-foreground">Email</span><span className="text-foreground">{lead.email || '—'}</span>
                    <span className="text-muted-foreground">Source</span><span className="text-foreground capitalize">{lead.source || '—'}</span>
                    <span className="text-muted-foreground">Assigned</span><span className="text-foreground">{(lead as any).profiles?.full_name || 'Unassigned'}</span>
                    <span className="text-muted-foreground">Location</span><span className="text-foreground">{(lead as any).locations?.name || '—'}</span>
                    <span className="text-muted-foreground">Created</span><span className="text-foreground">{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  <TabsTrigger value="conversations" className="flex-1">Messages</TabsTrigger>
                  <TabsTrigger value="calls" className="flex-1">Calls</TabsTrigger>
                </TabsList>

                <TabsContent value="activity">
                  {activity.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {activity.map((item, i) => (
                        <ActivityItem key={i} item={item} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="conversations">
                  {conversations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No conversations yet</p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {conversations.map(c => (
                        <div key={c.id} className="rounded-lg border border-border bg-card p-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <ChannelIcon channel={c.channel} />
                            <span className="capitalize">{c.channel}</span>
                            <span>·</span>
                            <span className="capitalize">{c.direction}</span>
                            <span className="ml-auto">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                          </div>
                          {c.content && <p className="text-sm text-foreground">{c.content}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="calls">
                  {calls.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No calls yet</p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {calls.map(c => (
                        <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                          {c.direction === 'inbound' ? <PhoneIncoming className="h-4 w-4 text-accent" /> : <PhoneOutgoing className="h-4 w-4 text-primary" />}
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize text-foreground">{c.direction} · {c.status}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, h:mm a')}</p>
                          </div>
                          {c.duration != null && c.duration > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, '0')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel) {
    case 'sms': return <MessageSquare className="h-3 w-3" />;
    case 'call': return <Phone className="h-3 w-3" />;
    case 'email': return <Mail className="h-3 w-3" />;
    case 'form': return <FileText className="h-3 w-3" />;
    default: return <MessageSquare className="h-3 w-3" />;
  }
}

function ActivityItem({ item }: { item: any }) {
  const isCall = item.type === 'call';
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div className="mt-0.5 rounded-full bg-muted p-1.5">
        {isCall ? <Phone className="h-3 w-3 text-muted-foreground" /> : <ChannelIcon channel={item.channel} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground capitalize">
          {isCall ? `${item.direction} call · ${item.status}` : `${item.channel} · ${item.direction}`}
        </p>
        {!isCall && item.content && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.content}</p>}
        <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(item.created_at), 'MMM d, h:mm a')}</p>
      </div>
    </div>
  );
}
