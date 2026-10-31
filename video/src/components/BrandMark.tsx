import { staticFile } from "remotion";
import { colors, fonts } from "../theme";

export const BrandMark: React.FC<{ light?: boolean; compact?: boolean }> = ({
  light = false,
  compact = false,
}) => {
  const color = light ? colors.onAccent : colors.accentStrong;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 18, color }}>
      <div
        style={{
          width: compact ? 40 : 48,
          height: compact ? 48 : 58,
          backgroundColor: color,
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
      <span style={{ fontFamily: fonts.display, fontSize: compact ? 30 : 38, fontWeight: 700 }}>
        Fermat
      </span>
    </div>
  );
};
