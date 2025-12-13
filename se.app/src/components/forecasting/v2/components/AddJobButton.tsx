import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface AddJobButtonProps {
  onClick: () => void;
}

export function AddJobButton({ onClick }: AddJobButtonProps) {
  const content = (
    <div className="fixed bottom-6 right-6 z-[1000] pointer-events-auto">
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            size="lg"
            aria-label="Create Job"
            className={cn(
              'h-14 w-14 rounded-full shadow-lg pointer-events-auto',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'transition-all duration-200 hover:scale-105 hover:shadow-xl'
            )}
          >
            <span className="text-white text-3xl leading-none font-bold select-none" aria-hidden="true">+</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Create Job</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
  // Portal to body to avoid clipping by overflow/stacking contexts
  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
