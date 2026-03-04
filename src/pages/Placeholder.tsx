import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function Placeholder({ title }: { title: string }) {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center text-muted-foreground">
            <p>{title} — coming soon in a future phase.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
