import * as React from 'react';

import { cn } from '@/lib/utils';
import type { IconComponent } from './icons';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon: IconComponent;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Usually one Button. */
  action?: React.ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Nothing here yet. Say what will appear and the one thing to do next.
 *   <EmptyState icon={icons.tasks} title="No tasks yet" description="Add one, like booking the airport cab." action={<Button size="sm">Add a task</Button>} />
 */
export function EmptyState({ icon: Icon, title, description, action, size = 'md', className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center rounded-2xl bg-surface-muted text-center', size === 'md' ? 'gap-3 px-6 py-10' : 'gap-2 px-4 py-6', className)}
      {...props}
    >
      <span className={cn('flex items-center justify-center rounded-2xl bg-surface text-brand-700 shadow-card', size === 'md' ? 'size-12' : 'size-10')}>
        <Icon className={size === 'md' ? 'size-6' : 'size-5'} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="max-w-prose">
        <p className="type-h3 m-0">{title}</p>
        {description && <p className="type-small m-0 mt-1 text-ink-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
