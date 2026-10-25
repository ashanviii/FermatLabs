import * as React from 'react';
import type { LucideProps } from 'lucide-react';

/**
 * WhatsApp glyph drawn to match lucide's 24px grid and stroke style (lucide ships no brand icons).
 * Accepts the same props as a lucide icon, so it can live in the icons map and inside <Button icon={...}>.
 */
export const WhatsAppIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, strokeWidth = 2, color = 'currentColor', absoluteStrokeWidth, className, ...props }, ref) => {
    const width = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        {...props}
      >
        <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" />
        <path d="M9 8.6c0-.3.3-.6.6-.6h.7c.3 0 .5.2.6.4l.6 1.4c.1.2 0 .5-.1.7l-.6.6a5.4 5.4 0 0 0 2.5 2.5l.6-.6c.2-.2.5-.2.7-.1l1.4.6c.2.1.4.3.4.6v.7c0 .3-.3.6-.6.6A6.4 6.4 0 0 1 9 8.6z" />
      </svg>
    );
  },
);
WhatsAppIcon.displayName = 'WhatsAppIcon';
