import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { IconComponent } from './icons';

/**
 * Button. One `primary` per step; everything else is secondary/outline/ghost.
 *
 *   <Button icon={icons.vote}>Open voting</Button>
 *   <Button variant="outline" size="sm" iconRight={ChevronRight}>See plan</Button>
 *   <Button variant="whatsapp" icon={icons.whatsapp}>Share on WhatsApp</Button>
 *
 * Back-compat: variant "default" === "primary", size "default" === "md", "icon" = square icon-only.
 */
const buttonVariants = cva(
  [
    'relative inline-flex touch-manipulation cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent font-sans font-semibold tracking-[-0.01em] no-underline',
    // iOS press feedback: a quick shrink and dim, released on the springy Apple curve.
    'transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-apple active:scale-[0.985] active:opacity-90',
    // Apple-style focus halo: a soft tinted ring hugging the control, no offset gap.
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35',
    'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      // Mapped to Apple's button styles: primary = filled, secondary = tinted, outline = grey, ghost = plain.
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        default: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary:
          'border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100',
        outline:
          'border-line bg-surface text-ink shadow-sm hover:border-line-strong hover:bg-surface-muted',
        ghost: 'bg-transparent text-brand-700 hover:bg-fill-subtle',
        danger: 'bg-danger text-white hover:bg-danger-ink',
        whatsapp: 'bg-whatsapp text-whatsapp-ink hover:bg-whatsapp-hover',
        link: 'h-auto rounded-md bg-transparent px-0 text-brand-700 underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-9 px-3.5 text-[0.875rem] [@media(pointer:coarse)]:min-h-11 [&_svg]:size-4',
        md: 'h-11 px-5 text-[0.9375rem] [&_svg]:size-[1.125rem]',
        default: 'h-11 px-5 text-[0.9375rem] [&_svg]:size-[1.125rem]',
        lg: 'h-12 px-6 text-[1rem] [&_svg]:size-5',
        icon: 'h-10 w-10 p-0 [&_svg]:size-[1.125rem]',
        'icon-sm':
          'h-8 w-8 p-0 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11 [&_svg]:size-4',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. <a>, <Link>) with button styles. Icons/loading are ignored with asChild. */
  asChild?: boolean;
  /** Leading icon (pass the component, e.g. icons.vote). */
  icon?: IconComponent;
  /** Trailing icon (e.g. ChevronRight). */
  iconRight?: IconComponent;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      asChild = false,
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, block }), className);
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <LoaderCircle className="animate-spin" strokeWidth={2} aria-hidden />
        ) : (
          Icon && <Icon strokeWidth={2} aria-hidden />
        )}
        {children}
        {IconRight && <IconRight strokeWidth={2} aria-hidden />}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
