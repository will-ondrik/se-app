import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Crew, Job } from '@/data/calendarData';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crews: Crew[];
  onCreateJob: (job: Omit<Job, 'id'>) => void;
}

// Minimal placeholder implementation. Job creation flow is intentionally disabled in v2 for now.
export function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
