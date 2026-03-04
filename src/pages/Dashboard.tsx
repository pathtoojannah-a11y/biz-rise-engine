import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone, Star, Kanban } from 'lucide-react';

const stats = [
  { label: 'Total Leads', value: '0', icon: Users, color: 'text-primary' },
  { label: 'Missed Calls', value: '0', icon: Phone, color: 'text-destructive' },
  { label: 'Reviews Sent', value: '0', icon: Star, color: 'text-nexa-warning' },
  { label: 'Active Jobs', value: '0', icon: Kanban, color: 'text-accent' },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your business performance</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center text-muted-foreground">
            <p>Connect your first integration to start tracking leads and calls.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
