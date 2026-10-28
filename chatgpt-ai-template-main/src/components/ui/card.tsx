import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import type { IconComponent } from './icons';

/**
 * Card = a raised white surface (rounded-2xl + soft shadow, no border).
 * Use it for the one or two things a step is about, not for every block (see <Section> for plain groupings).
 *
 *   <Card>
 *     <CardHeader icon={icons.plan} title="Your plan" description="5 days in Goa" action={<Button size="sm">Share</Button>} />
 *     <CardBody>...</CardBody>
 *   </Card>
 *
 * Back-compat: <Card className="p-6"> with free children still works (no padding by default).
 */
const cardVariants = cva('relative text-ink', {
  variants: {
    variant: {
      default: 'rounded-2xl bg-surface shadow-card',
      raised: 'rounded-2xl bg-surface shadow-raised',
      flat: 'rounded-2xl bg-surface ring-1 ring-inset ring-line-subtle', // inside other surfaces / dense lists
      sunken: 'rounded-2xl bg-surface-muted',
      brand: 'rounded-2xl bg-brand-900 text-white shadow-raised',
      private: 'rounded-2xl bg-private-soft ring-1 ring-inset ring-private-line',
    },
    interactive: {
      // Lifts on hover and gives slightly under a press, like a tappable iOS card.
      true: 'cursor-pointer transition-[box-shadow,transform] duration-300 ease-apple hover:shadow-raised active:scale-[0.99] focus-within:ring-4 focus-within:ring-brand-500/35',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', interactive: false },
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, interactive, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant, interactive }), className)} {...props} />
));
Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Icon shown in a soft tile to the left of the title. */
  icon?: IconComponent;
  /** Tile colour for the icon. */
  iconTone?: 'brand' | 'warm' | 'private' | 'neutral';
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned slot: a Button, Badge or menu. Wraps under the title on narrow screens. */
  action?: React.ReactNode;
  /** Heading level for the title (default h3). */
  as?: 'h2' | 'h3' | 'h4';
}

const iconToneClass: Record<NonNullable<CardHeaderProps['iconTone']>, string> = {
  brand: 'bg-brand-50 text-brand-700',
  warm: 'bg-warm-50 text-warm-700',
  private: 'bg-private-soft text-private-ink ring-1 ring-inset ring-private-line',
  neutral: 'bg-surface-muted text-ink-soft',
};

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, icon: Icon, iconTone = 'brand', title, description, action, as: Heading = 'h3', children, ...props }, ref) => {
    // Legacy usage: <CardHeader><CardTitle/>...</CardHeader>
    if (title === undefined && !Icon && !action && description === undefined) {
      return <div ref={ref} className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props}>{children}</div>;
    }
    return (
      <div ref={ref} className={cn('flex flex-wrap items-start gap-x-4 gap-y-3 p-5 sm:p-6', className)} {...props}>
        {/* 15rem basis: on narrow cards the action wraps under the title instead of squeezing it. */}
        <div className="flex min-w-0 flex-[1_1_15rem] items-start gap-3">
          {Icon && (
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', iconToneClass[iconTone])}>
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            {title !== undefined && <Heading className="type-h3 m-0">{title}</Heading>}
            {description !== undefined && <p className="type-small m-0 mt-0.5 text-ink-muted">{description}</p>}
            {children}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    );
  },
);
CardHeader.displayName = 'CardHeader';

/** Card content. Use after a CardHeader (no top padding) or alone (pass className="pt-5 sm:pt-6"). */
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />
));
CardBody.displayName = 'CardBody';

/** Bottom bar with a hairline: secondary info left, actions right. */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-line-subtle px-5 py-4 sm:px-6', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

/* ---- Legacy shadcn parts (kept for existing imports) ---- */
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('type-h3', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('type-small text-ink-muted', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = CardBody;

export { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
