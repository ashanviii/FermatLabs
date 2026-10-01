import React from 'react';

import { cn } from '@/lib/utils';

// Rendered as a mask so the mark takes the current text color.
export default function FermatMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Fermat"
      className={cn('inline-block aspect-[383/455] h-6 shrink-0 bg-current', className)}
      style={{
        WebkitMaskImage: 'url(/img/brand/fermat-mark.png)',
        maskImage: 'url(/img/brand/fermat-mark.png)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
