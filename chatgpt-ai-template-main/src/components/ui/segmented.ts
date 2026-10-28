import { cn } from '@/lib/utils';

/**
 * iOS segmented control look: a grey track with a white, slightly raised thumb on the selected segment.
 * Styles only. Keep the semantics in the screen: role="tablist" + role="tab"/aria-selected when it switches
 * a panel, or plain buttons with aria-pressed when it picks an option.
 *
 *   <div role="tablist" aria-label="Example group" className={segmentedTrack}>
 *     <button role="tab" aria-selected={on} className={segmentedItem(on)}>Delhi</button>
 *   </div>
 */
export const segmentedTrack = 'inline-flex rounded-[0.6875rem] bg-fill p-0.5';

export const segmentedItem = (selected: boolean, className?: string) =>
  cn(
    'm-0 inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[0.5625rem] border-0 px-3.5 font-sans text-[0.8125rem] tracking-[-0.006em]',
    'transition-[background-color,color,box-shadow] duration-200 ease-apple',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    selected
      ? 'bg-surface font-semibold text-ink shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]'
      : 'bg-transparent font-medium text-ink-soft hover:text-ink',
    className,
  );
