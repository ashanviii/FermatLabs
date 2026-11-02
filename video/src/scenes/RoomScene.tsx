import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { ClickRipple, Cursor, clickPath } from "../components/Cursor";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.room);
const PANEL = { left: 760, top: 124, width: 1060, height: 832 };
const INVITE = { x: PANEL.left + PANEL.width - 102, y: PANEL.top + 252 };

const people = [
  { initial: "S", name: "You", color: colors.accent },
  { initial: "A", name: "Aanya", color: colors.private },
  { initial: "R", name: "Rohan", color: "#A76E22" },
  { initial: "M", name: "Meera", color: "#9B4D68" },
];

export const RoomScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clickAt = hits[1] ?? 30;
  const arrivals = [0, hits[2] ?? 59, hits[3] ?? 88, hits[4] ?? 117];
  const joined = arrivals.filter((at) => frame >= at).length;
  const buttonScale = interpolate(frame, [clickAt, clickAt + 3, clickAt + 8], [1, 1.045, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelSettle = interpolate(frame, [0, 24], [0, 1], {
    easing: easings.slowInLand,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.background, color: colors.ink, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 92, top: 68 }}><BrandMark compact /></div>

      <div style={{ position: "absolute", left: 110, top: 267, width: 570 }}>
        <div style={{ fontFamily: fonts.mono, color: colors.accent, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", fontSize: 18 }}>
          One shared place
        </div>
        <div style={{ marginTop: 26, fontSize: 76, lineHeight: 1.04, letterSpacing: -3.8, fontWeight: 750 }}>
          <TypedText text={"Start one\ntrip room"} startFrame={-36} perWord={10} riseDistance={18} />
        </div>
        <div style={{ marginTop: 34, maxWidth: 500, fontSize: 27, lineHeight: 1.46, color: colors.inkMuted }}>
          One link for the dates, the group and every decision after.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          ...PANEL,
          borderRadius: 38,
          background: colors.surface,
          border: `1px solid ${colors.borderSubtle}`,
          boxShadow: "0 34px 100px rgba(21, 53, 36, 0.12)",
          padding: "48px 52px",
          boxSizing: "border-box",
          transform: `translateX(${(1 - panelSettle) * 48}px) scale(${0.98 + panelSettle * 0.02})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontFamily: fonts.mono, color: colors.accent, fontSize: 15, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase" }}>Trip room</div>
            <div style={{ marginTop: 10, fontSize: 38, letterSpacing: -1.2, fontWeight: 750 }}>Friends escape</div>
            <div style={{ marginTop: 8, fontSize: 19, color: colors.inkMuted }}>15-19 Dec · Home or abroad</div>
          </div>
          <div style={{ borderRadius: 999, background: colors.accentSoft, color: colors.accent, padding: "12px 18px", fontSize: 16, fontWeight: 750 }}>
            4 travellers
          </div>
        </div>

        <div style={{ marginTop: 37, borderRadius: 26, background: colors.surfaceMuted, padding: "28px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 750 }}>Invite your friends</div>
              <div style={{ marginTop: 6, fontSize: 17, color: colors.inkMuted }}>Share one private room link.</div>
            </div>
            <div
              style={{
                height: 58,
                borderRadius: 999,
                background: colors.accent,
                color: colors.onAccent,
                padding: "0 27px",
                display: "flex",
                alignItems: "center",
                fontSize: 18,
                fontWeight: 750,
                transform: `scale(${buttonScale})`,
                boxShadow: "0 12px 28px rgba(46, 118, 80, 0.22)",
              }}
            >
              Invite friends
            </div>
          </div>
        </div>

        <div style={{ marginTop: 36, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 750 }}>{joined} of 4 joined</div>
            <div style={{ marginTop: 6, fontSize: 16, color: joined === 4 ? colors.accent : colors.inkMuted, fontWeight: joined === 4 ? 700 : 500 }}>
              {joined === 4 ? "Everyone is in" : "Waiting for the group"}
            </div>
          </div>
          <div style={{ width: 470 }}>
            <div style={{ height: 9, borderRadius: 99, background: colors.borderSubtle, overflow: "hidden" }}>
              <div
                style={{
                  width: `${joined * 25}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: colors.accent,
                  transition: "none",
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {people.map((person, index) => {
            const p = spring({ frame: frame - arrivals[index], fps, config: { damping: 17, stiffness: 160, mass: 0.68 } });
            return (
              <div
                key={person.name}
                style={{
                  height: 170,
                  borderRadius: 24,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 13,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 20}px)`,
                }}
              >
                <div style={{ width: 58, height: 58, borderRadius: 999, background: person.color, color: colors.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 750 }}>
                  {person.initial}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{person.name}</div>
                <div style={{ fontSize: 14, color: colors.accent, fontWeight: 700 }}>Joined</div>
              </div>
            );
          })}
        </div>
      </div>

      <Cursor
        keypoints={clickPath(
          { frame: 0, x: 1840, y: 1020 },
          [{ frame: clickAt, x: INVITE.x, y: INVITE.y }],
          { exit: { x: 1810, y: 980 } },
        )}
        hidden={frame > clickAt + 28}
      />
      <ClickRipple clickFrame={clickAt} x={INVITE.x} y={INVITE.y} />
    </AbsoluteFill>
  );
};
