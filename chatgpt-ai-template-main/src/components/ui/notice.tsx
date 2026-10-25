import * as React from 'react';

import { cn } from '@/lib/utils';
import { icons, type IconComponent } from './icons';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger' | 'private' | 'neutral';

const toneClass: Record<NoticeTone, { box: string; icon: string; Icon: IconComponent }> = {
  info: { box: 'bg-info-soft text-info-ink', icon: 'text-info', Icon: icons.info },
  success: { box: 'bg-success-soft text-success-ink', icon: 'text-success', Icon: icons.success },
  warning: { box: 'bg-warning-soft text-warning-ink', icon: 'text-warning', Icon: icons.warning },
  danger: { box: 'bg-danger-soft text-danger-ink', icon: 'text-danger', Icon: icons.danger },
  private: { box: 'bg-private-soft text-private-ink', icon: 'text-private', Icon: icons.private },
  neutral: { box: 'bg-surface-muted text-ink-soft', icon: 'text-ink-muted', Icon: icons.info },
};

export interface NoticeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: NoticeTone;
  /** Bold first line. Keep it to a few words. */
  title?: React.ReactNode;
  /** Override the tone's default icon. */
  icon?: IconComponent;
  /** Right-aligned action (a small Button). */
  action?: React.ReactNode;
  /** "inline" = no background, just icon + text (for the one-line "Estimates" note). */
  variant?: 'box' | 'inline';
}

/**
 * A short message in context. One per section at most.
 *   <Notice tone="warning" title="2 budgets short">Pick a cheaper option or ask the group to stretch.</Notice>
 *   <Notice tone="private">Your budget is never shown to the group.</Notice>
 *   <Notice variant="inline" tone="neutral">Estimates. Check prices before you book.</Notice>
 */
export function Notice({ tone = 'info', title, icon, action, variant = 'box', className, children, ...props }: NoticeProps) {
  const t = toneClass[tone];
  const Icon = icon ?? t.Icon;
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';
  if (variant === 'inline') {
    return (
      <div role={role} className={cn('type-small flex items-start gap-2 text-ink-muted', className)} {...props}>
        <Icon className={cn('mt-0.5 size-4 shrink-0', t.icon)} strokeWidth={1.75} aria-hidden />
        <div className="min-w-0">
          {title && <span className="font-semibold text-ink-soft">{title} </span>}
          {children}
        </div>
      </div>
    );
  }
  return (
    <div role={role} className={cn('flex items-start gap-3 rounded-xl px-4 py-3', t.box, className)} {...props}>
      <Icon className={cn('mt-0.5 size-[1.125rem] shrink-0', t.icon)} strokeWidth={2} aria-hidden />
      <div className="type-small min-w-0 flex-1">
        {title && <p className="m-0 font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
