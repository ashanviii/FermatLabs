import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.plan);
const days = [
  { day: "Day 1", title: "Arrive in Ubud", detail: "Check in · Campuhan walk" },
  { day: "Day 2", title: "Temples + rice terraces", detail: "Tirta Empul · Tegallalang" },
  { day: "Day 3", title: "Uluwatu sunset", detail: "Beach day · Kecak dance" },
];

export const PlanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = interpolate(frame, [0, 28], [0, 1], {
    easing: easings.slowInLand,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.accentStrong, color: colors.onAccent, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 92, top: 68 }}><BrandMark light compact /></div>

      <div style={{ position: "absolute", left: 108, top: 260, width: 570 }}>
        <div style={{ fontFamily: fonts.mono, color: "#A9D0B8", fontSize: 18, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
          Decision made
        </div>
        <div style={{ marginTop: 27, fontSize: 68, lineHeight: 1.08, letterSpacing: -3.2, fontWeight: 750 }}>
          <TypedText text={"The winning trip\nbecomes a real plan"} startFrame={-44} perWord={9} riseDistance={18} />
        </div>
        <div style={{ marginTop: 34, fontSize: 24, lineHeight: 1.5, color: "#C9DED1" }}>
          Cost, bookings and every day in one shared place.
        </div>
        <div style={{ marginTop: 48, display: "flex", gap: 18 }}>
          <div style={{ borderRadius: 22, background: "rgba(255,255,255,0.10)", padding: "21px 24px", width: 200 }}>
            <div style={{ fontSize: 15, color: "#A9D0B8", textTransform: "uppercase", letterSpacing: 1.2 }}>Per person</div>
            <div style={{ marginTop: 8, fontSize: 31, fontWeight: 750 }}>₹82,873</div>
          </div>
          <div style={{ borderRadius: 22, background: "rgba(255,255,255,0.10)", padding: "21px 24px", width: 178 }}>
            <div style={{ fontSize: 15, color: "#A9D0B8", textTransform: "uppercase", letterSpacing: 1.2 }}>Travellers</div>
            <div style={{ marginTop: 8, fontSize: 31, fontWeight: 750 }}>4 people</div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 730,
          top: 112,
          width: 1082,
          height: 856,
          borderRadius: 38,
          background: colors.background,
          color: colors.ink,
          boxShadow: "0 50px 120px rgba(0,0,0,0.26)",
          overflow: "hidden",
          transform: `translateX(${(1 - reveal) * 60}px) scale(${0.97 + reveal * 0.03})`,
        }}
      >
        <div
          style={{
            height: 238,
            background: "linear-gradient(125deg, #2E7650 0%, #153524 66%, #F4B740 160%)",
            color: colors.onAccent,
            padding: "44px 48px",
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontFamily: fonts.mono, fontSize: 15, letterSpacing: 1.7, textTransform: "uppercase", color: "#C9DED1" }}>Winning trip</div>
            <div style={{ marginTop: 13, fontSize: 54, fontWeight: 750, letterSpacing: -2 }}>Bali</div>
            <div style={{ marginTop: 9, fontSize: 20, color: "#E8F2EC" }}>10-15 Dec · Ubud to Seminyak</div>
          </div>
          <div style={{ alignSelf: "flex-start", borderRadius: 999, padding: "13px 18px", background: "rgba(255,255,255,0.14)", fontSize: 16, fontWeight: 700 }}>
            Trip locked
          </div>
        </div>

        <div style={{ padding: "38px 44px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 23 }}>
            <div style={{ fontSize: 26, fontWeight: 750 }}>Your day-by-day plan</div>
            <div style={{ fontSize: 17, color: colors.inkMuted }}>Group total ₹3.5L</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
            {days.map((day, index) => {
              const start = index === 0 ? -12 : (hits[index + 1] ?? index * 30);
              const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 145, mass: 0.72 } });
              return (
                <div
                  key={day.day}
                  style={{
                    minHeight: 132,
                    borderRadius: 22,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    display: "grid",
                    gridTemplateColumns: "112px 1fr auto",
                    alignItems: "center",
                    gap: 24,
                    padding: "0 28px",
                    boxSizing: "border-box",
                    opacity: p,
                    transform: `translateY(${(1 - p) * 18}px)`,
                  }}
                >
                  <div style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.accent, fontWeight: 600 }}>{day.day}</div>
                  <div>
                    <div style={{ fontSize: 23, fontWeight: 700 }}>{day.title}</div>
                    <div style={{ marginTop: 7, fontSize: 17, color: colors.inkMuted }}>{day.detail}</div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 999, background: colors.accentSoft, color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>✓</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
