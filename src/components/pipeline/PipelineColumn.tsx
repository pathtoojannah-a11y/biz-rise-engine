import { PipelineCard } from './PipelineCard';
import { useState } from 'react';

interface Props {
  stage: { id: string; name: string; position: number };
  jobs: any[];
  onDrop: (jobId: string, stageId: string) => void;
}

export function PipelineColumn({ stage, jobs, onDrop }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const jobId = e.dataTransfer.getData('jobId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');
    if (jobId && sourceStageId !== stage.id) {
      onDrop(jobId, stage.id);
    }
  };

  return (
    <div
      className={`min-w-[280px] max-w-[320px] flex-shrink-0 snap-start rounded-xl border bg-card p-3 transition-colors ${
        dragOver ? 'border-primary/50 bg-primary/5' : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-display text-sm font-semibold text-foreground">{stage.name}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {jobs.length}
        </span>
      </div>

      <div className="space-y-2 min-h-[100px]">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No jobs in this stage</p>
        ) : (
          jobs.map((job) => (
            <PipelineCard key={job.id} job={job} stageId={stage.id} />
          ))
        )}
      </div>
    </div>
  );
}
