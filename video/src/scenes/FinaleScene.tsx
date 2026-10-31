import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.finale);

export const FinaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = interpolate(frame, [hits[1] ?? 30, SCENES.finale.duration - 1], [320, 720], {
    easing: easings.soft,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonP = interpolate(frame, [hits[2] ?? 58, (hits[2] ?? 58) + 18], [0, 1], {
    easing: easings.slowInLand,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.accentStrong, color: colors.onAccent, fontFamily: fonts.ui, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          width: ring,
          height: ring,
          borderRadius: 9999,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(244,183,64,0.12) 0%, rgba(244,183,64,0.03) 48%, rgba(244,183,64,0) 72%)",
        }}
      />

      <div style={{ position: "absolute", top: 105, display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 56,
            height: 68,
            background: colors.onAccent,
            maskImage: `url(${staticFile("fermat-mark.png")})`,
            WebkitMaskImage: `url(${staticFile("fermat-mark.png")})`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskSize: "contain",
            WebkitMaskSize: "contain",
          }}
        />
        <div style={{ fontSize: 44, fontWeight: 750 }}>Fermat</div>
      </div>

      <div style={{ position: "absolute", top: 327, left: 340, right: 340, textAlign: "center", fontSize: 74, lineHeight: 1.08, letterSpacing: -3.8, fontWeight: 750 }}>
        <TypedText text={"Plan the trip everyone\ncan actually take"} startFrame={-44} perWord={9} riseDistance={18} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 620,
          height: 70,
          borderRadius: 999,
          background: colors.onAccent,
          color: colors.accentStrong,
          padding: "0 34px",
          display: "flex",
          alignItems: "center",
          fontSize: 22,
          fontWeight: 750,
          opacity: buttonP,
          transform: `translateY(${(1 - buttonP) * 16}px)`,
          boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
        }}
      >
        Start a group trip
      </div>

      <div style={{ position: "absolute", bottom: 118, fontFamily: fonts.mono, fontSize: 19, letterSpacing: 2, color: "#C9DED1" }}>
        fermatlabs.org
      </div>
    </AbsoluteFill>
  );
};
