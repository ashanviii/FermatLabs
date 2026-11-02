import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { ClickRipple, Cursor, clickPath } from "../components/Cursor";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.vote);
const PANEL = { left: 780, top: 135, width: 1035, height: 816 };
const VOTE_TARGET = { x: PANEL.left + PANEL.width - 285, y: PANEL.top + 210 };
const options = [
  { name: "Bali", detail: "10-15 Dec · ₹82,873 each" },
  { name: "Tokyo", detail: "10-15 Dec · 1 budget short" },
  { name: "Dubai", detail: "10-14 Dec · Visa timing" },
];

export const VoteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const voteAt = hits[3] ?? 88;
  const panelSettle = interpolate(frame, [0, 24], [0, 1], {
    easing: easings.slowInLand,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.background, color: colors.ink, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 92, top: 68 }}><BrandMark compact /></div>

      <div style={{ position: "absolute", left: 112, top: 230, width: 590 }}>
        <div style={{ fontFamily: fonts.mono, color: colors.private, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", fontSize: 18 }}>
          No pressure, no politics
        </div>
        <div style={{ marginTop: 26, fontSize: 78, lineHeight: 1.06, letterSpacing: -4, fontWeight: 750 }}>
          <TypedText text="Vote in private" startFrame={-30} perWord={10} riseDistance={18} />
        </div>
        <div style={{ marginTop: 32, maxWidth: 540, fontSize: 24, lineHeight: 1.5, color: colors.inkMuted }}>
          Your vote is secret. A place someone can't afford or enter can't win.
        </div>
        <div style={{ marginTop: 38, width: 500, padding: "20px 23px", borderRadius: 20, background: colors.privateSoft, color: colors.private, fontSize: 18, lineHeight: 1.45, fontWeight: 650 }}>
          No names. No numbers. Votes stay hidden until the trip is locked.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          ...PANEL,
          borderRadius: 36,
          background: colors.surface,
          border: `1px solid ${colors.borderSubtle}`,
          boxShadow: "0 30px 90px rgba(21, 53, 36, 0.10)",
          padding: "50px 52px",
          boxSizing: "border-box",
          transform: `translateY(${(1 - panelSettle) * 34}px)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 31, fontWeight: 750 }}>Where should we go?</div>
            <div style={{ marginTop: 7, fontSize: 18, color: colors.inkMuted }}>Pick one. Your vote is private.</div>
          </div>
          <div style={{ borderRadius: 999, background: frame >= voteAt ? colors.accentSoft : colors.surfaceMuted, color: frame >= voteAt ? colors.accent : colors.ink, padding: "12px 18px", fontSize: 16, fontWeight: 700 }}>
            {frame >= voteAt ? "4 of 4 voted" : "3 of 4 voted"}
          </div>
        </div>

        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
          {options.map((option, index) => {
            const start = index === 0 ? -12 : (hits[index] ?? index * 30);
            const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 145, mass: 0.72 } });
            const selected = index === 0 && frame >= voteAt;
            return (
              <div
                key={option.name}
                style={{
                  height: 160,
                  borderRadius: 24,
                  border: `2px solid ${selected ? colors.accent : colors.border}`,
                  background: selected ? "#F6FBF8" : colors.surface,
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  gap: 22,
                  alignItems: "center",
                  padding: "0 30px",
                  boxSizing: "border-box",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 18}px) scale(${selected ? 1.006 : 1})`,
                  boxShadow: selected ? "0 18px 42px rgba(46, 118, 80, 0.10)" : "none",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 999, border: `2px solid ${selected ? colors.accent : colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selected && <div style={{ width: 22, height: 22, borderRadius: 999, background: colors.accent }} />}
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 750 }}>{option.name}</div>
                  <div style={{ marginTop: 7, fontSize: 18, color: colors.inkMuted }}>{option.detail}</div>
                </div>
                <div style={{ minWidth: 96, textAlign: "right", color: selected ? colors.accent : colors.inkMuted, fontSize: 17, fontWeight: 750 }}>
                  {selected ? "Voted" : "Choose"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Cursor
        keypoints={clickPath(
          { frame: 0, x: 1860, y: 1010 },
          [{ frame: voteAt, x: VOTE_TARGET.x, y: VOTE_TARGET.y }],
          { exit: { x: 1860, y: 990 } },
        )}
        hidden={frame > voteAt + 26}
      />
      <ClickRipple clickFrame={voteAt} x={VOTE_TARGET.x} y={VOTE_TARGET.y} />
    </AbsoluteFill>
  );
};
