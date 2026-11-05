import * as React from 'react';
import { Plane } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { icons } from './icons';

export interface FlightRouteProps {
  from: string;
  to: string;
  className?: string;
}

/**
 * Home-to-destination route for dark heroes: two badges joined by a dashed line that draws itself while a plane
 * glides across, then rests on arrival. Plays once; under Reduce Motion it shows the arrived state.
 * Keyframes (fr-draw, fr-fly) live in landing.css.
 *
 *   <FlightRoute from="You" to="Bali" />
 */
export function FlightRoute({ from, to, className }: FlightRouteProps) {
  return (
    <div role="img" aria-label={`Route from ${from} to ${to}`} className={cn('flex max-w-md items-center gap-3', className)}>
      <Badge size="lg" icon={icons.departure} className="shrink-0 bg-white/10 text-white ring-1 ring-inset ring-white/15">
        {from}
      </Badge>
      <div aria-hidden className="relative mx-1 h-6 min-w-16 flex-1">
        {/* The full route, faint and dashed. */}
        <span className="absolute inset-x-0 top-1/2 border-0 border-t border-dashed border-white/25" />
        {/* The flown part, drawn left to right. */}
        <span className="fr-draw absolute inset-x-0 top-1/2 h-px -translate-y-px origin-left rounded-full bg-gradient-to-r from-white/10 via-white/60 to-warm-300" />
        <span className="fr-fly absolute top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-900 ring-1 ring-white/15">
          <Plane className="size-3.5 rotate-45 text-warm-300" strokeWidth={2} />
        </span>
      </div>
      <Badge size="lg" icon={icons.destination} className="shrink-0 bg-warm-300 text-brand-950">
        {to}
      </Badge>
    </div>
  );
}
