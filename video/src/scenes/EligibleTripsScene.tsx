import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../components/BrandMark";
import { TypedText } from "../components/TypedText";
import { easings } from "../easings";
import { sceneBeats } from "../scene-frames";
import { colors, fonts } from "../theme";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.eligibleTrips);

const trips = [
  { name: "Bali", dates: "10-15 Dec", price: "₹82,873 each", tag: "Beach + culture" },
  { name: "Goa", dates: "11-15 Dec", price: "₹46,240 each", tag: "Easy weekend" },
  { name: "Bangkok", dates: "10-14 Dec", price: "₹68,510 each", tag: "Food + city" },
];

export const EligibleTripsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: colors.accentStrong, color: colors.onAccent, fontFamily: fonts.ui }}>
      <div style={{ position: "absolute", left: 92, top: 70 }}>
        <BrandMark light compact />
      </div>

      <div style={{ position: "absolute", left: 112, top: 248, width: 650 }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#A9D0B8",
            marginBottom: 28,
          }}
        >
          Shared answer
        </div>
        <div style={{ fontSize: 69, lineHeight: 1.08, letterSpacing: -3.2, fontWeight: 700 }}>
          <TypedText
            text={"Only trips that work\nfor everyone make\nthe ballot"}
            startFrame={-60}
            perWord={8}
            riseDistance={18}
          />
        </div>
        <div style={{ marginTop: 34, fontSize: 24, lineHeight: 1.5, color: "#C9DED1" }}>
          Dates, budget and passport rules checked together.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 850,
          top: 132,
          width: 954,
          height: 822,
          borderRadius: 36,
          background: colors.background,
          padding: "48px 48px",
          boxSizing: "border-box",
          color: colors.ink,
          boxShadow: "0 45px 110px rgba(0, 0, 0, 0.24)",
          transform: `translateX(${interpolate(frame, [0, 28], [42, 0], {
            easing: easings.slowInLand,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 750, letterSpacing: -0.6 }}>Trips your whole group can take</div>
            <div style={{ marginTop: 7, fontSize: 18, color: colors.inkMuted }}>4 travellers · 10-15 December</div>
          </div>
          <div
            style={{
              borderRadius: 999,
              padding: "11px 17px",
              background: colors.accentSoft,
              color: colors.accent,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            3 matches
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 19, marginTop: 36 }}>
          {trips.map((trip, index) => {
            const start = index === 0 ? -12 : (hits[Math.min(index + 1, hits.length - 1)] ?? index * 30);
            const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 155, mass: 0.7 } });
            return (
              <div
                key={trip.name}
                style={{
                  height: 176,
                  borderRadius: 24,
                  border: `1px solid ${index === 0 ? "#B8D8C5" : colors.border}`,
                  background: index === 0 ? "#F6FBF8" : colors.surface,
                  display: "grid",
                  gridTemplateColumns: "128px 1fr auto",
                  alignItems: "center",
                  gap: 26,
                  padding: "0 30px",
                  boxSizing: "border-box",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 22}px)`,
                  boxShadow: index === 0 ? "0 18px 42px rgba(46, 118, 80, 0.10)" : "none",
                }}
              >
                <div
                  style={{
                    width: 116,
                    height: 116,
                    borderRadius: 22,
                    background: index === 0 ? colors.accentStrong : index === 1 ? "#E8B058" : "#5856D6",
                    color: colors.onAccent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.display,
                    fontSize: 40,
                    fontWeight: 700,
                  }}
                >
                  {trip.name.slice(0, 1)}
                </div>
                <div>
                  <div style={{ fontSize: 29, fontWeight: 750 }}>{trip.name}</div>
                  <div style={{ marginTop: 8, fontSize: 18, color: colors.inkMuted }}>{trip.dates} · {trip.tag}</div>
                  <div style={{ marginTop: 10, fontSize: 19, fontWeight: 650 }}>{trip.price}</div>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    padding: "12px 17px",
                    background: colors.accentSoft,
                    color: colors.accent,
                    fontSize: 15,
                    fontWeight: 750,
                    whiteSpace: "nowrap",
                  }}
                >
                  Everyone can go
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
