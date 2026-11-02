import React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

/**
 * Example people on the landing page. Portraits are free Pexels photos (pexels.com/license), saved square at 160px
 * in /public/landing/people. Anyone without a photo falls back to their initial.
 */
const photos: Record<string, string> = {
  Aanya: 'aanya',
  Asha: 'aanya',
  Rohan: 'rohan',
  Meera: 'meera',
  Kabir: 'kabir',
  Alex: 'alex',
  Sam: 'sam',
  Jordan: 'jordan',
};

/** A round face for an example person. Decorative: the name is always written next to it or in a caption. */
export function Face({ name, className }: { name: string; className?: string }) {
  const photo = photos[name];
  return (
    <span
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-[0.8125rem] font-semibold text-ink shadow-card',
        className,
      )}
    >
      {photo ? <Image src={`/landing/people/${photo}.jpg`} alt="" fill sizes="48px" className="object-cover" /> : name[0]}
    </span>
  );
}

/** Overlapping faces with a "+n" chip, like the avatar stack in the app. */
export function FaceStack({ names, max = 3, className }: { names: string[]; max?: number; className?: string }) {
  const rest = names.length - max;
  return (
    <div className={cn('flex items-center', className)}>
      {names.slice(0, max).map((name, index) => (
        <Face key={name} name={name} className={cn('size-10 shadow-none ring-2 ring-surface', index > 0 && '-ml-2')} />
      ))}
      {rest > 0 && (
        <span className="-ml-2 flex size-10 items-center justify-center rounded-full bg-surface-strong text-xs font-bold text-ink-soft ring-2 ring-surface">
          +{rest}
        </span>
      )}
    </div>
  );
}
