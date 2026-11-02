import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.voteResults);
const rows = [
  { name: "Tokyo", votes: 3, note: "Most votes, but 1 budget short", result: "missed" as const },
  { name: "Bali", votes: 1, note: "Won: top pick that fits everyone", result: "won" as const },
];

export const VoteResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const revealAt = hits[1] ?? 29;

  return (
    <AbsoluteFill style={{ background: colors.background, color: colors.ink, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 92, top: 68 }}><BrandMark compact /></div>

      <div style={{ position: "absolute", left: 110, top: 248, width: 610 }}>
        <div style={{ fontFamily: fonts.mono, color: colors.accent, fontSize: 18, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
          Fair by design
        </div>
        <div style={{ marginTop: 26, fontSize: 70, lineHeight: 1.07, letterSpacing: -3.5, fontWeight: 750 }}>
          <TypedText text={"The winner has to work\nfor everyone"} startFrame={-42} perWord={8} riseDistance={18} />
        </div>
        <div style={{ marginTop: 34, maxWidth: 530, fontSize: 25, lineHeight: 1.5, color: colors.inkMuted }}>
          The vote count is public after the lock. Nobody's vote is named.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 790,
          top: 124,
          width: 1020,
          height: 832,
          borderRadius: 38,
          background: colors.surface,
          border: `1px solid ${colors.borderSubtle}`,
          boxShadow: "0 34px 100px rgba(21, 53, 36, 0.12)",
          padding: "46px 50px",
          boxSizing: "border-box",
          transform: `translateX(${interpolate(frame, [0, 25], [48, 0], { easing: easings.slowInLand, extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontFamily: fonts.mono, color: colors.accent, fontSize: 15, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase" }}>Trip locked</div>
            <div style={{ marginTop: 8, fontSize: 36, fontWeight: 750, letterSpacing: -1 }}>Why Bali won</div>
          </div>
          <div style={{ borderRadius: 999, background: colors.surfaceMuted, padding: "11px 17px", fontSize: 15, fontWeight: 700 }}>
            Everyone sees this
          </div>
        </div>

        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 20 }}>
          {rows.map((row, index) => {
            const start = index === 0 ? -10 : revealAt;
            const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 150, mass: 0.7 } });
            const fill = interpolate(frame, [start + 8, start + 32], [0, row.votes / 3], {
              easing: easings.slowInLand,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const won = row.result === "won";
            return (
              <div
                key={row.name}
                style={{
                  minHeight: 218,
                  borderRadius: 26,
                  border: `${won ? 2 : 1}px solid ${won ? colors.accent : colors.border}`,
                  background: won ? "#F6FBF8" : colors.surfaceMuted,
                  padding: "29px 32px",
                  boxSizing: "border-box",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 18}px)`,
                  boxShadow: won ? "0 18px 44px rgba(46, 118, 80, 0.10)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                  <div style={{ fontSize: 29, fontWeight: 750 }}>{row.name}</div>
                  <div style={{ fontSize: 21, fontWeight: 750 }}>{row.votes} {row.votes === 1 ? "vote" : "votes"}</div>
                </div>
                <div style={{ marginTop: 20, height: 11, borderRadius: 99, background: colors.borderSubtle, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${fill * 100}%`, borderRadius: 99, background: won ? colors.accent : "#9A9AA1" }} />
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    marginTop: 22,
                    borderRadius: 999,
                    padding: "10px 15px",
                    background: won ? colors.accentSoft : "#FFF4D8",
                    color: won ? colors.accent : "#845B18",
                    fontSize: 16,
                    fontWeight: 750,
                  }}
                >
                  {row.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
