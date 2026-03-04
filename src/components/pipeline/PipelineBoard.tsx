import { usePipelineStages } from '@/hooks/usePipelineStages';
import { usePipeline } from '@/hooks/usePipeline';
import { useJobMutations } from '@/hooks/useJobMutations';
import { PipelineColumn } from './PipelineColumn';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { AddJobModal } from './AddJobModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function PipelineBoard() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { jobsByStage, isLoading: jobsLoading } = usePipeline();
  const { moveJob } = useJobMutations();
  const [showAddJob, setShowAddJob] = useState(false);

  const handleDrop = (jobId: string, newStageId: string) => {
    moveJob.mutate({ jobId, newStageId });
  };

  if (stagesLoading || jobsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[280px] space-y-3">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag jobs between stages</p>
        </div>
        <Button size="sm" onClick={() => setShowAddJob(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Job
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
        {(stages ?? []).map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            jobs={jobsByStage[stage.id] ?? []}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <AddJobModal open={showAddJob} onClose={() => setShowAddJob(false)} />
    </div>
  );
}
