/**
 * Landing-only overrides that turn the product's coloured badges and private panels monochrome.
 * The shared primitives keep their colours for the app; on the landing page the icon + words carry the meaning,
 * private things get a dashed outline, and green is left only for the "works for everyone" tick.
 *
 *   <StatusPill status="warning" className={mono.pill}>2 budgets short</StatusPill>
 */
export const mono = {
  /** Status pill: outlined, grey icon. */
  pill: 'bg-surface text-ink-soft ring-1 ring-inset ring-line [&_svg]:text-ink-muted',
  /** The one positive status: same outline, green tick. */
  okPill: 'bg-surface text-ink ring-1 ring-inset ring-line [&_svg]:text-success',
  /** "Only you see this" and the selected pick: a solid ink chip. */
  solid: 'bg-ink text-white',
  /** Private panel or strip: dashed outline on the muted surface. */
  privatePanel: 'border border-dashed border-line-strong bg-surface-muted text-ink',
};
