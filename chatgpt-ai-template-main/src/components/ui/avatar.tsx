import * as React from 'react';

import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

// Soft tint + dark ink pairs (all >= 4.5:1). Picked deterministically from the name.
const palette = [
  'bg-brand-100 text-brand-800',
  'bg-warm-100 text-warm-800',
  'bg-private-soft text-private-ink',
  'bg-info-soft text-info-ink',
  'bg-success-soft text-success-ink',
  'bg-danger-soft text-danger-ink',
] as const;

/** Initials from the readable part of a nickname: "Aarav (demo)" -> "AA", "Ravi K." -> "RK", "Organizer" -> "OR". */
function readableName(name: string) {
  const cleaned = (name || '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || name || '?';
}

function avatarInitials(name: string) {
  return initials(readableName(name));
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const sizes = { xs: 'size-6 text-[0.625rem]', sm: 'size-8 text-[0.6875rem]', md: 'size-10 text-[0.8125rem]', lg: 'size-12 text-[0.9375rem]' } as const;
export type AvatarSize = keyof typeof sizes;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Nickname; initials and colour come from it. */
  name: string;
  size?: AvatarSize;
  /** Small corner marker. Pair with text elsewhere; the dot alone is decorative. */
  status?: 'ready' | 'pending';
}

/**
 *   <Avatar name="Asha" />   <Avatar name="Ravi K" size="lg" status="ready" />
 */
export function Avatar({ name, size = 'md', status, className, ...props }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn('relative inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold', sizes[size], palette[hash(readableName(name)) % palette.length], className)}
      {...props}
    >
      <span aria-hidden>{avatarInitials(name)}</span>
      <span className="sr-only">{name}</span>
      {status && (
        <span
          aria-hidden
          className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-surface', status === 'ready' ? 'bg-success' : 'bg-ink-faint')}
        />
      )}
    </span>
  );
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  names: string[];
  /** Avatars shown before "+N" (default 4). */
  max?: number;
  size?: AvatarSize;
}

/**
 *   <AvatarStack names={members.map((m) => m.nickname)} max={5} />
 */
export function AvatarStack({ names, max = 4, size = 'sm', className, ...props }: AvatarStackProps) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className={cn('flex items-center', className)} aria-label={`${names.length} ${names.length === 1 ? 'member' : 'members'}`} role="group" {...props}>
      {shown.map((name, index) => (
        <Avatar key={`${name}-${index}`} name={name} size={size} className={cn('ring-2 ring-surface', index > 0 && '-ml-1.5')} />
      ))}
      {extra > 0 && (
        <span className={cn('relative -ml-1.5 inline-flex items-center justify-center rounded-full bg-surface-strong font-bold text-ink-soft ring-2 ring-surface', sizes[size])}>
          +{extra}
        </span>
      )}
    </div>
  );
}
