import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)} {...props}>
      <HeartPulse className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">HealthLens</h1>
    </div>
  );
}
