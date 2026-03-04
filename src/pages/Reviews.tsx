import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReviews } from '@/hooks/useReviews';
import { useFeedbackTickets } from '@/hooks/useFeedbackTickets';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { Star, MessageSquare, ArrowUpRight, AlertTriangle, BarChart3, Percent } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const outcomeColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  public_redirected: 'bg-accent/15 text-accent',
  private_recovery: 'bg-destructive/15 text-destructive',
  no_response: 'bg-muted text-muted-foreground',
};

const ticketStatusColors: Record<string, string> = {
  open: 'bg-destructive/15 text-destructive',
  in_review: 'bg-primary/15 text-primary',
  resolved: 'bg-accent/15 text-accent',
};

export default function Reviews() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const { reviews, stats, isLoading } = useReviews({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    outcome: outcomeFilter !== 'all' ? outcomeFilter : undefined,
  });
  const { tickets, isLoading: ticketsLoading, updateTicket } = useFeedbackTickets();
  const { data: members } = useWorkspaceMembers();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground">Post-job review routing & feedback recovery</p>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Sent" value={stats.sent} icon={MessageSquare} />
            <KPICard label="Response Rate" value={`${stats.responseRate}%`} icon={Percent} />
            <KPICard label="4-5 Stars" value={stats.high} icon={Star} color="text-accent" />
            <KPICard label="1-3 Stars" value={stats.low} icon={AlertTriangle} color="text-destructive" />
            <KPICard label="Google Redirects" value={`${stats.redirectRate}%`} icon={ArrowUpRight} color="text-accent" />
            <KPICard label="Total" value={stats.total} icon={BarChart3} />
          </div>
        )}

        <Tabs defaultValue="requests" className="w-full">
          <TabsList>
            <TabsTrigger value="requests" className="gap-1"><Star className="h-3.5 w-3.5" /> Requests</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Feedback Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="public_redirected">Google Redirect</SelectItem>
                  <SelectItem value="private_recovery">Private Recovery</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ))
                  ) : reviews.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No review requests yet</TableCell></TableRow>
                  ) : (
                    reviews.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.jobs?.leads?.name || '—'}</TableCell>
                        <TableCell>
                          {r.rating_value ? (
                            <span className={`font-bold ${r.rating_value >= 4 ? 'text-accent' : 'text-destructive'}`}>
                              {r.rating_value}/5
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.status}</Badge></TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${outcomeColors[r.outcome] || ''}`}>{r.outcome?.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.sent_at ? format(new Date(r.sent_at), 'MMM d, h:mm a') : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Low-Rating Feedback Queue</CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : tickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No feedback tickets</p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((t: any) => (
                      <div key={t.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">
                              {t.review_requests?.jobs?.leads?.name || 'Unknown'}
                            </span>
                            <Badge className={`text-xs ${ticketStatusColors[t.status] || ''}`}>{t.status?.replace('_', ' ')}</Badge>
                            <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{t.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rating: {t.review_requests?.rating_value}/5 · {format(new Date(t.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Select
                          value={t.status}
                          onValueChange={(val) => {
                            const updates: any = { status: val };
                            if (val === 'resolved') updates.resolved_at = new Date().toISOString();
                            updateTicket.mutate({ id: t.id, updates });
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <Icon className={`h-5 w-5 shrink-0 ${color || 'text-muted-foreground'}`} />
        <div>
          <p className="text-lg font-bold font-display text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
