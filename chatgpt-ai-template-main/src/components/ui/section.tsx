import * as React from 'react';

import { cn } from '@/lib/utils';
import type { IconComponent } from './icons';

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  /** One helper line, max. */
  description?: React.ReactNode;
  icon?: IconComponent;
  /** Right side of the heading row (Button / Badge). */
  action?: React.ReactNode;
  /** Small label above the title, e.g. "Step 3 of 5". */
  eyebrow?: React.ReactNode;
  /** h2 for page sections (default), h3 for sub-sections. */
  as?: 'h2' | 'h3';
}

/**
 * A titled group sitting directly on the canvas: the antidote to card soup.
 * Put plain content or ONE card inside, not a card per paragraph.
 *   <Section title="Who's doing what" icon={icons.tasks} action={<Button size="sm" variant="outline">Add</Button>}>...</Section>
 */
export function Section({ title, description, icon: Icon, action, eyebrow, as: Heading = 'h2', className, children, ...props }: SectionProps) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-4', className)} {...props}>
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {eyebrow && <p className="type-overline m-0 mb-1 text-brand-600">{eyebrow}</p>}
          <Heading className={cn('m-0 flex items-center gap-2', Heading === 'h2' ? 'type-h2' : 'type-h3')}>
            {Icon && <Icon className={cn('shrink-0 text-brand-600', Heading === 'h2' ? 'size-5' : 'size-[1.125rem]')} strokeWidth={1.75} aria-hidden />}
            {title}
          </Heading>
          {description && <p className="type-small m-0 mt-1 text-ink-muted">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      {children}
    </section>
  );
}

/** Page column: centred, max-w-page, responsive side padding. */
export function PageContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8', className)} {...props} />;
}
