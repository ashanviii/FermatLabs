// theme.ts - brand tokens: colors, fonts, canvas size.
//
// Every value in `colors` and `fonts` is a PLACEHOLDER. Replace them with the
// product's real brand before the first render. Components read these tokens
// and never hard-code a hex value, so the whole film re-skins from this file.
// If you change a font family here, change the matching loadFont() in Root.tsx.

export const colors = {
  accent: "#2E7650",
  accentStrong: "#153524",
  accentSoft: "#E8F2EC",
  onAccent: "#FFFFFF",
  background: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceMuted: "#F3F3F0",
  ink: "#131316",
  inkSoft: "#3F3F46",
  inkMuted: "#4B554F",
  border: "#DCDCE3",
  borderSubtle: "#EFEFF2",
  marigold: "#F4B740",
  private: "#5856D6",
  privateSoft: "#EEEEFC",
  shadowTint: "rgba(21, 53, 36, 0.12)",
} as const;

export const fonts = {
  display: "Manrope, system-ui, sans-serif",
  editorial: "Instrument Serif, Georgia, serif",
  ui: "Manrope, system-ui, sans-serif",
  mono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

// 16:9 master, and the 9:16 size used by the optional vertical master.
export const canvas = { width: 1920, height: 1080 } as const;
export const canvasVertical = { width: 1080, height: 1920 } as const;

/** Blend two #rrggbb colors; t = 0 gives a, t = 1 gives b. For scene-background shifts without a cut. */
export const blendHex = (a: string, b: string, t: number): string => {
  const channels = (hex: string) =>
    [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16));
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return `#${[ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]
    .map((n) => Math.round(n).toString(16).padStart(2, "0"))
    .join("")}`;
};
