import * as React from 'react';

import { cn } from '@/lib/utils';

/*
 * ASCII art kit. Static pieces live here (safe in server components); animated ones are in ./ascii-motion.
 *
 *   <AsciiArt art={asciiArt.passport} className="text-brand-700" />
 *
 * Art is decorative: it is aria-hidden unless you pass `label`, which makes it role="img".
 * Rows are padded to the same width, so a piece never shifts when its lines differ in length.
 * Plain ASCII only (no emoji or box-drawing), so every monospace fallback font keeps the columns lined up.
 */

export const asciiArt = {
  /** Step 1: invite your group. */
  envelope: [
    ' ____________________ ',
    '|\\                  /|',
    '| \\                / |',
    '|  \\    INVITE    /  |',
    '|   \\____________/   |',
    '|                    |',
    '|____________________|',
  ],
  /** Step 2: your private details. */
  passport: [
    ' .------------------. ',
    ' |    PASSPORT      | ',
    ' |      .----.      | ',
    ' |     ( o  o )     | ',
    ' |      \\ -- /      | ',
    " |       '--'       | ",
    ' |  P<IND<<FERMAT<  | ',
    " '------------------' ",
  ],
  /** Step 3: vote in private. */
  ballot: [
    '      .--------.      ',
    '      |  [x]   |      ',
    '      |  GOA   |      ',
    "  .---'========'---.  ",
    '  |                |  ',
    '  |   your  vote   |  ',
    '  |                |  ',
    "  '----------------'  ",
  ],
  /** Step 4: the plan, a route with stops. */
  route: [
    ' o DEL                ',
    "  '.                  ",
    "    '. . . . . o JAI  ",
    "                 '.   ",
    '                   :  ',
    "        GOA o. . .'   ",
    '                      ',
  ],
  /** Go: packed and ready. */
  suitcase: [
    '        .------.      ',
    '        |      |      ',
    "  .-----'------'-----.",
    '  |  []  FERMAT  []  |',
    '  |------------------|',
    '  |   DEL  ->  GOA   |',
    '  |------------------|',
    "  '-()------------()-'",
  ],
  /** Empty: something private / not allowed. */
  lock: [
    '   .--.   ',
    '  /    \\  ',
    '  |    |  ',
    " .'----'. ",
    ' |  ()  | ',
    ' |  ||  | ',
    " '------' ",
  ],
  /** Empty: places will appear here. */
  pin: [
    '   .--.   ',
    '  / .. \\  ',
    "  \\ '' /  ",
    '   \\  /   ',
    '    \\/    ',
    '  ~~~~~~  ',
  ],
  /** Empty: no tasks yet. */
  clipboard: [
    ' .--[__]--. ',
    ' | [x] ___| ',
    ' | [ ] ___| ',
    ' | [ ] ___| ',
    " '--------' ",
  ],
  /** Footer wordmark (figlet "standard"). */
  wordmark: [
    '  _____                         _   ',
    ' |  ___|__ _ __ _ __ ___   __ _| |_ ',
    " | |_ / _ \\ '__| '_ ` _ \\ / _` | __|",
    ' |  _|  __/ |  | | | | | | (_| | |_ ',
    ' |_|  \\___|_|  |_| |_| |_|\\__,_|\\__|',
  ],
} satisfies Record<string, string[]>;

export type AsciiArtName = keyof typeof asciiArt;

/** Pads every row to the widest one so the block is a clean rectangle. */
export function asciiBlock(lines: string[]) {
  const width = Math.max(...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(width, ' ')).join('\n');
}

export interface AsciiArtProps extends Omit<React.HTMLAttributes<HTMLPreElement>, 'children'> {
  art: string[];
  /** Accessible description. Omit for decorative art (the default). */
  label?: string;
}

/** Renders a piece of ASCII art. Size it with a text-* class; colour it with text-*. */
export function AsciiArt({ art, label, className, ...props }: AsciiArtProps) {
  return (
    <pre
      className={cn('ascii text-[0.6875rem]', className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
    >
      {asciiBlock(art)}
    </pre>
  );
}
