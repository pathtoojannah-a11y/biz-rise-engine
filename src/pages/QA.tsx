import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useState } from 'react';
import { CheckCircle, XCircle, Play, Loader2, FlaskConical } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  logIds: string[];
}

export default function QA() {
  const { workspace } = useWorkspace();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState<string | null>(null);

  const runTests = async (s?: string) => {
    if (!workspace) return;
    setRunning(true);
    setScenario(s || null);
    try {
      const { data, error } = await supabase.functions.invoke('qa-simulate', {
        body: { workspace_id: workspace.id, scenario: s || undefined },
      });
      if (error) throw error;
      setResults(data?.results ?? []);
    } catch (err: any) {
      setResults([{ name: 'Error', passed: false, details: err.message, logIds: [] }]);
    } finally {
      setRunning(false);
    }
  };

  const allPassed = results.length > 0 && results.every(r => r.passed);
  const scenarios = [
    { id: 'missed_call', label: 'Missed Call → SMS' },
    { id: 'qualification', label: 'Qualification Flow' },
    { id: 'review_low', label: '2-Star → Ticket' },
    { id: 'opt_out', label: 'STOP → Opt-out' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">QA Harness</h1>
            <p className="text-sm text-muted-foreground">Run end-to-end simulation tests against your workspace</p>
          </div>
          <Button onClick={() => runTests()} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run All Tests
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {scenarios.map(s => (
            <Button key={s.id} variant="outline" size="sm" onClick={() => runTests(s.id)} disabled={running}>
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> {s.label}
            </Button>
          ))}
        </div>

        {results.length > 0 && (
          <Card className={allPassed ? 'border-accent/50' : 'border-destructive/50'}>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                {allPassed ? <CheckCircle className="h-5 w-5 text-accent" /> : <XCircle className="h-5 w-5 text-destructive" />}
                {allPassed ? 'All Tests Passed' : 'Some Tests Failed'}
              </CardTitle>
              <CardDescription>{results.length} test{results.length > 1 ? 's' : ''} executed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  {r.passed ? <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.details}</p>
                    {r.logIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Log IDs: {r.logIds.map(id => id.substring(0, 8)).join(', ')}
                      </p>
                    )}
                  </div>
                  <Badge variant={r.passed ? 'default' : 'destructive'} className="text-xs shrink-0">
                    {r.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
