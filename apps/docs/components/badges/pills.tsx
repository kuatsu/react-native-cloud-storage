import { cn } from '@/lib/cn';

const CONTAINER_CLASS = 'mt-1 mb-1 flex flex-wrap gap-1.5';
const PILL_CLASS =
  'inline-flex items-center rounded-full border border-fd-primary/40 bg-fd-primary/10 px-2.5 py-0.5 text-xs font-medium text-fd-primary';

export function BadgePills({ badges, className }: { badges: string[]; className?: string }) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      {badges.map((badge) => (
        <span key={badge} className={PILL_CLASS}>
          {badge}
        </span>
      ))}
    </div>
  );
}
