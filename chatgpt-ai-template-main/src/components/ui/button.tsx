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
    'relative inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-sans font-semibold no-underline',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-brand-900 text-white shadow-card hover:bg-brand-800',
        default: 'bg-brand-900 text-white shadow-card hover:bg-brand-800',
        secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
        outline: 'border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted',
        ghost: 'bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink',
        danger: 'bg-danger text-white shadow-card hover:bg-danger-ink',
        whatsapp: 'bg-whatsapp text-whatsapp-ink shadow-card hover:bg-whatsapp-hover',
        link: 'h-auto rounded-md bg-transparent px-0 text-brand-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-[0.8125rem] [&_svg]:size-4',
        md: 'h-11 px-5 text-sm [&_svg]:size-[1.125rem]',
        default: 'h-11 px-5 text-sm [&_svg]:size-[1.125rem]',
        lg: 'h-12 px-6 text-[0.9375rem] [&_svg]:size-5',
        icon: 'h-10 w-10 p-0 [&_svg]:size-[1.125rem]',
        'icon-sm': 'h-8 w-8 p-0 [&_svg]:size-4',
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
    { className, variant, size, block, asChild = false, icon: Icon, iconRight: IconRight, loading = false, disabled, children, type, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, block }), className);
    if (asChild) {
      return <Slot className={classes} ref={ref} {...props}>{children}</Slot>;
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
