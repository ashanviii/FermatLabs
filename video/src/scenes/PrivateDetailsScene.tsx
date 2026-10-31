import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { colors, fonts } from "../theme";

const Field: React.FC<{
  label: string;
  value: string;
  note?: string;
  start: number;
  width?: number;
}> = ({ label, value, note, start, width = 382 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 145, mass: 0.7 } });
  return (
    <div style={{ width, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <div style={{ fontSize: 19, fontWeight: 650, marginBottom: 10, color: colors.ink }}>{label}</div>
      <div
        style={{
          height: 66,
          borderRadius: 16,
          border: `1.5px solid ${p > 0.7 ? colors.border : colors.accent}`,
          background: colors.surface,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          boxSizing: "border-box",
          fontSize: 23,
          color: colors.ink,
          boxShadow: p > 0.7 ? "none" : "0 0 0 5px rgba(46, 118, 80, 0.10)",
        }}
      >
        {value}
      </div>
      {note && <div style={{ marginTop: 8, fontSize: 15, color: colors.inkMuted }}>{note}</div>}
    </div>
  );
};

export const PrivateDetailsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 24], [0, 1], {
    easing: easings.slowInLand,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelScale = interpolate(settle, [0, 1], [1.055, 1]);
  const panelX = interpolate(settle, [0, 1], [-52, 0]);

  return (
    <AbsoluteFill style={{ background: colors.background, color: colors.ink, fontFamily: fonts.ui }}>
      <header
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 112,
          borderBottom: `1px solid ${colors.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 92px",
          boxSizing: "border-box",
          background: "rgba(250, 250, 248, 0.96)",
        }}
      >
        <BrandMark compact />
        <div style={{ display: "flex", alignItems: "center", gap: 13, fontSize: 18, color: colors.inkMuted }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: colors.privateSoft,
              color: colors.private,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            S
          </span>
          Your details are private
        </div>
      </header>

      <div
        style={{
          position: "absolute",
          left: 92 + panelX,
          top: 156,
          width: 1020,
          height: 814,
          transform: `scale(${panelScale})`,
          transformOrigin: "center",
          borderRadius: 34,
          background: colors.surface,
          border: `1px solid ${colors.borderSubtle}`,
          boxShadow: "0 30px 90px rgba(21, 53, 36, 0.09)",
          padding: "54px 58px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 17,
              background: colors.privateSoft,
              color: colors.private,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 25,
            }}
          >
            ◆
          </div>
          <div>
            <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: -0.8 }}>What works for you</div>
            <div style={{ marginTop: 5, fontSize: 18, color: colors.inkMuted }}>
              Only Fermat uses these details to find shared options.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "32px 28px", marginTop: 42 }}>
          <Field label="Leaving from" value="Delhi" start={-12} />
          <Field label="Your total budget" value="₹150,000" note="Flights and stay included" start={24} />
          <Field label="Earliest date" value="10 Dec 2026" start={52} />
          <Field label="Latest return" value="15 Dec 2026" start={76} />
          <Field label="Passport expires" value="18 Aug 2028" note="Kept private" start={98} width={792} />
        </div>

        <div style={{ position: "absolute", right: 58, bottom: 48, display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 16, color: colors.inkMuted }}>You can change this later</span>
          <div
            style={{
              height: 58,
              borderRadius: 999,
              background: colors.accent,
              color: colors.onAccent,
              padding: "0 31px",
              display: "flex",
              alignItems: "center",
              fontSize: 20,
              fontWeight: 700,
              boxShadow: "0 12px 30px rgba(46, 118, 80, 0.22)",
            }}
          >
            Save my details
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 1215, top: 284, width: 590 }}>
        <div
          style={{
            fontFamily: fonts.mono,
            color: colors.accent,
            textTransform: "uppercase",
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: 2.2,
            marginBottom: 28,
          }}
        >
          Private by default
        </div>
        <div style={{ fontSize: 67, lineHeight: 1.07, letterSpacing: -3.2, fontWeight: 700 }}>
          <TypedText
            text={"Everyone adds\nwhat works for them"}
            startFrame={24}
            perWord={10}
            riseDistance={18}
          />
        </div>
        <div style={{ marginTop: 34, fontSize: 27, lineHeight: 1.5, color: colors.inkMuted }}>
          <TypedText text="Budget. Dates. Passport. All private." startFrame={70} perWord={8} />
        </div>
        <div
          style={{
            marginTop: 44,
            width: 470,
            height: 2,
            background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentSoft})`,
            transform: `scaleX(${interpolate(frame, [102, 130], [0, 1], {
              easing: easings.maskReveal,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            transformOrigin: "left",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
