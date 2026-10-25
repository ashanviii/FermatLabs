import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { icons, type IconComponent } from './icons';

/**
 * Badge: a small label. Status is always icon + words, never colour alone, so prefer <StatusPill>
 * for anything that means good/bad/waiting.
 *
 *   <Badge>Beach</Badge>                         neutral tag
 *   <Badge tone="brand" icon={icons.route}>2 stops</Badge>
 *   <Badge tone="private">Fits ~₹42k</Badge>    lock icon added automatically
 *
 * Back-compat: variant "default" | "secondary" | "outline" still work.
 */
const badgeVariants = cva(
  'inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full font-semibold leading-none [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-ink-soft',
        brand: 'bg-brand-50 text-brand-800',
        warm: 'bg-warm-100 text-warm-800',
        success: 'bg-success-soft text-success-ink',
        warning: 'bg-warning-soft text-warning-ink',
        danger: 'bg-danger-soft text-danger-ink',
        info: 'bg-info-soft text-info-ink',
        private: 'bg-private-soft text-private-ink',
        solid: 'bg-brand-900 text-white',
        outline: 'bg-surface text-ink-soft ring-1 ring-inset ring-line',
      },
      size: {
        sm: 'h-6 px-2 text-[0.6875rem] [&_svg]:size-3',
        md: 'h-7 px-2.5 text-xs [&_svg]:size-3.5',
        lg: 'h-8 px-3 text-[0.8125rem] [&_svg]:size-4',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

type LegacyVariant = 'default' | 'secondary' | 'outline';
const legacyTone: Record<LegacyVariant, BadgeTone> = { default: 'solid', secondary: 'brand', outline: 'outline' };

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Deprecated alias kept for older markup; use `tone`. */
  variant?: LegacyVariant | null;
  /** Leading icon. tone="private" defaults to the lock icon; pass `icon={null}` to hide it. */
  icon?: IconComponent | null;
}

function Badge({ className, tone, variant, size, icon, children, ...props }: BadgeProps) {
  const resolvedTone: BadgeTone = tone ?? (variant ? legacyTone[variant] : 'neutral');
  const Icon = icon === undefined ? (resolvedTone === 'private' ? icons.private : undefined) : icon ?? undefined;
  return (
    <span className={cn(badgeVariants({ tone: resolvedTone, size }), className)} {...props}>
      {Icon && <Icon strokeWidth={2} aria-hidden />}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

export type Status = 'ok' | 'warning' | 'blocked' | 'pending' | 'info' | 'private' | 'done';

const statusMeta: Record<Status, { tone: BadgeTone; icon: IconComponent }> = {
  ok: { tone: 'success', icon: icons.success },
  done: { tone: 'success', icon: icons.check },
  warning: { tone: 'warning', icon: icons.warning },
  blocked: { tone: 'danger', icon: icons.danger },
  pending: { tone: 'neutral', icon: icons.pending },
  info: { tone: 'info', icon: icons.info },
  private: { tone: 'private', icon: icons.private },
};

export interface StatusPillProps extends Omit<BadgeProps, 'tone' | 'icon' | 'variant'> {
  status: Status;
  /** Override the default icon for the status (e.g. icons.budget for "2 budgets short"). */
  icon?: IconComponent;
}

/**
 * Status = icon + label. The label carries the meaning; colour only reinforces it.
 *
 *   <StatusPill status="ok">Everyone can go</StatusPill>
 *   <StatusPill status="warning" icon={icons.budget}>2 budgets short</StatusPill>
 *   <StatusPill status="blocked">Blocked by your passport</StatusPill>
 */
function StatusPill({ status, icon, ...props }: StatusPillProps) {
  const meta = statusMeta[status];
  return <Badge tone={meta.tone} icon={icon ?? meta.icon} {...props} />;
}

/**
 * The standard "Only you see this" marker. Put it in the header of anything private to the viewer.
 *   <PrivateBadge />  or  <PrivateBadge>Only you see your budget</PrivateBadge>
 */
function PrivateBadge({ children = 'Only you see this', ...props }: Omit<BadgeProps, 'tone' | 'variant'>) {
  return <Badge tone="private" {...props}>{children}</Badge>;
}

export { Badge, StatusPill, PrivateBadge, badgeVariants };
