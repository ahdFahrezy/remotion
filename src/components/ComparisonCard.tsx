import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, ComparisonColumn, SpringPhysicsPreset } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { Check, X } from "lucide-react";

interface ComparisonCardProps {
  column: ComparisonColumn;
  palette: ColorPalette;
  physics?: SpringPhysicsPreset;
  delayInFrames?: number;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  column,
  palette,
  physics = "bouncy",
  delayInFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isPositive = column.status === "positive";

  const entrance = spring({
    frame: frame - delayInFrames,
    fps,
    config: getSpringConfig(physics),
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(entrance, [0, 1], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statusColor = isPositive ? palette.primary : "#EF4444";

  return (
    <div
      style={{
        flex: 1,
        minWidth: 320,
        padding: "36px 32px",
        borderRadius: 24,
        background: isPositive
          ? `linear-gradient(180deg, ${palette.primary}12 0%, ${palette.cardBg} 100%)`
          : "rgba(18, 18, 22, 0.6)",
        border: `1px solid ${isPositive ? palette.border : "rgba(239, 68, 68, 0.25)"}`,
        boxShadow: isPositive
          ? `0 24px 48px -12px ${palette.primary}20, inset 0 1px 0 rgba(255,255,255,0.15)`
          : `0 16px 32px -10px rgba(0,0,0,0.5)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity,
        transform: `translateY(${translateY}px) scale(${entrance})`,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: isPositive ? palette.text : "#9CA3AF",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {column.title}
        </h3>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 9999,
            backgroundColor: `${statusColor}18`,
            border: `1px solid ${statusColor}33`,
            fontSize: 12,
            fontWeight: 700,
            color: statusColor,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {isPositive ? <Check size={14} /> : <X size={14} />}
          {isPositive ? "Automated" : "Legacy"}
        </span>
      </div>

      {/* Item List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {column.items.map((item, index) => {
          const itemDelay = delayInFrames + 10 + index * 4;
          const itemProgress = spring({
            frame: frame - itemDelay,
            fps,
            config: getSpringConfig(physics),
          });

          const itemOpacity = interpolate(itemProgress, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const itemTranslateX = interpolate(itemProgress, [0, 1], [-16, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                opacity: itemOpacity,
                transform: `translateX(${itemTranslateX}px)`,
              }}
            >
              <div
                style={{
                  marginTop: 2,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: `${statusColor}22`,
                  border: `1px solid ${statusColor}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: statusColor,
                  flexShrink: 0,
                }}
              >
                {isPositive ? <Check size={13} /> : <X size={13} />}
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: isPositive ? palette.text : palette.mutedText,
                  lineHeight: 1.45,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
