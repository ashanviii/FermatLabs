import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { colors, fonts } from "../theme";

const messages = [
  { text: "15-19 Dec works", x: 164, y: 238, start: 18, rotate: -3 },
  { text: "₹45k max", x: 1395, y: 235, start: 34, rotate: 2 },
  { text: "Visa?", x: 215, y: 770, start: 52, rotate: 2 },
  { text: "Flying from Delhi", x: 1360, y: 775, start: 70, rotate: -2 },
];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gather = interpolate(frame, [102, 138], [0, 1], {
    easing: easings.rampIn,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineScale = interpolate(gather, [0, 1], [1, 0.78]);
  const headlineY = interpolate(gather, [0, 1], [0, -108]);

  return (
    <AbsoluteFill style={{ background: colors.background, color: colors.ink, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 94, top: 74 }}>
        <BrandMark compact />
      </div>

      <div
        style={{
          position: "absolute",
          left: 340,
          right: 340,
          top: 360,
          textAlign: "center",
          transform: `translateY(${headlineY}px) scale(${headlineScale})`,
        }}
      >
        <div style={{ fontSize: 94, lineHeight: 1.04, letterSpacing: -4.8, fontWeight: 700 }}>
          Trips die in the
          <br />
          group chat
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.mono,
            fontSize: 20,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: colors.inkMuted,
          }}
        >
          Too many constraints. No shared answer.
        </div>
      </div>

      {messages.map((message, index) => {
        const enter = spring({
          frame: frame - message.start,
          fps,
          config: { damping: 15, stiffness: 150, mass: 0.65 },
        });
        const targetX = 960 + (index - 1.5) * 124;
        const targetY = 770;
        const x = message.x + (targetX - message.x) * gather;
        const y = message.y + (targetY - message.y) * gather;
        const scale = (0.88 + 0.12 * enter) * interpolate(gather, [0, 1], [1, 0.62]);
        const opacity = enter * interpolate(gather, [0, 0.62, 0.84], [1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={message.text}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${message.rotate * (1 - gather)}deg) scale(${scale})`,
              opacity,
              padding: "22px 30px",
              borderRadius: 999,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 18px 45px rgba(21, 53, 36, 0.10)",
              fontSize: 27,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {message.text}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 960,
          top: 788,
          width: interpolate(gather, [0, 1], [360, 760]),
          height: 102,
          transform: `translate(-50%, -50%) scale(${interpolate(gather, [0, 1], [0.92, 1])})`,
          opacity: interpolate(gather, [0, 0.18, 0.68], [0, 0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          borderRadius: 28,
          background: colors.accentStrong,
          color: colors.onAccent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          boxShadow: "0 28px 70px rgba(21, 53, 36, 0.20)",
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 24 }}>●</span>
        <TypedText text="One private place for what works" startFrame={108} perWord={5} />
      </div>
    </AbsoluteFill>
  );
};
