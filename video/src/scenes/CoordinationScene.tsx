import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.coordination);
const rows = [
  { key: "₹", title: "Money", detail: "2 of 4 paid the advance", tone: colors.accent },
  { key: "4", title: "Commitments", detail: "3 firmly in", tone: colors.private },
  { key: "✓", title: "Tasks", detail: "2 of 4 done", tone: "#A76E22" },
  { key: "↗", title: "Sharing", detail: "Send the plan and useful trip cards", tone: "#9B4D68" },
];

export const CoordinationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settle = interpolate(frame, [0, 25], [0, 1], {
    easing: easings.slowInLand,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.accentStrong, color: colors.onAccent, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 92, top: 68 }}><BrandMark light compact /></div>

      <div style={{ position: "absolute", left: 108, top: 269, width: 580 }}>
        <div style={{ fontFamily: fonts.mono, color: "#A9D0B8", fontSize: 18, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
          After the plan
        </div>
        <div style={{ marginTop: 27, fontSize: 72, lineHeight: 1.06, letterSpacing: -3.6, fontWeight: 750 }}>
          <TypedText text={"Keep the trip\nmoving"} startFrame={-38} perWord={10} riseDistance={18} />
        </div>
        <div style={{ marginTop: 34, maxWidth: 520, fontSize: 25, lineHeight: 1.5, color: "#C9DED1" }}>
          Payments, commitments, tasks and sharing stay with the plan.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 760,
          top: 110,
          width: 1060,
          height: 860,
          borderRadius: 40,
          background: colors.background,
          color: colors.ink,
          boxShadow: "0 50px 120px rgba(0,0,0,0.27)",
          padding: "46px 50px",
          boxSizing: "border-box",
          transform: `translateX(${(1 - settle) * 58}px) scale(${0.98 + settle * 0.02})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: fonts.mono, color: colors.accent, fontSize: 15, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase" }}>Bali · 10-15 Dec</div>
            <div style={{ marginTop: 9, fontSize: 36, fontWeight: 750, letterSpacing: -1 }}>Get going</div>
          </div>
          <div style={{ borderRadius: 999, background: colors.accentSoft, color: colors.accent, padding: "11px 17px", fontSize: 15, fontWeight: 750 }}>
            Plan approved
          </div>
        </div>

        <div style={{ marginTop: 33, display: "flex", flexDirection: "column", gap: 15 }}>
          {rows.map((row, index) => {
            const start = index === 0 ? -10 : (hits[index] ?? index * 30);
            const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 150, mass: 0.7 } });
            const active = index === Math.min(3, Math.max(0, Math.floor(frame / 42)));
            return (
              <div
                key={row.title}
                style={{
                  height: 152,
                  borderRadius: 26,
                  border: `1px solid ${active ? row.tone : colors.border}`,
                  background: active ? colors.surface : colors.surfaceMuted,
                  display: "grid",
                  gridTemplateColumns: "72px 1fr auto",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 28px",
                  boxSizing: "border-box",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 18}px)`,
                  boxShadow: active ? "0 14px 38px rgba(21, 53, 36, 0.09)" : "none",
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `${row.tone}18`, color: row.tone, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>
                  {row.key}
                </div>
                <div>
                  <div style={{ fontSize: 25, fontWeight: 750 }}>{row.title}</div>
                  <div style={{ marginTop: 7, fontSize: 17, color: colors.inkMuted }}>{row.detail}</div>
                </div>
                <div style={{ color: row.tone, fontSize: 27, fontWeight: 700 }}>›</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
