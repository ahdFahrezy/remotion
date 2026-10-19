import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, SpringPhysicsPreset } from "../types/schema";
import { getSpringConfig } from "../rules/physics";

interface StatCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  trend?: string;
  palette: ColorPalette;
  physics?: SpringPhysicsPreset;
  delayInFrames?: number;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  label,
  prefix = "",
  suffix = "",
  trend,
  palette,
  physics = "bouncy",
  delayInFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance for card container
  const cardEntrance = spring({
    frame: frame - delayInFrames,
    fps,
    config: getSpringConfig(physics),
  });

  // Numeric count-up progress over 60 frames (1 second at 60 fps)
  const countProgress = spring({
    frame: frame - delayInFrames - 6,
    fps,
    config: { mass: 0.9, damping: 18, stiffness: 90 },
  });

  const clampedProgress = Math.max(0, Math.min(1, countProgress));
  const isDecimal = value % 1 !== 0;
  const currentValue = isDecimal
    ? (clampedProgress * value).toFixed(1)
    : Math.floor(clampedProgress * value);

  const opacity = interpolate(cardEntrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(cardEntrance, [0, 1], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        minWidth: 260,
        padding: "36px 32px",
        borderRadius: 24,
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity,
        transform: `translateY(${translateY}px) scale(${cardEntrance})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent light sweep */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${palette.primary}, transparent)`,
        }}
      />

      {/* Main big metric number */}
      <div
        style={{
          fontSize: 68,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: palette.text,
          backgroundImage: `linear-gradient(180deg, #FFFFFF 0%, ${palette.primary} 120%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          display: "flex",
          alignItems: "baseline",
          gap: 2,
        }}
      >
        {prefix && (
          <span style={{ fontSize: "0.65em", color: palette.primary }}>
            {prefix}
          </span>
        )}
        <span>{currentValue}</span>
        {suffix && (
          <span style={{ fontSize: "0.55em", color: palette.accent }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: palette.mutedText,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </div>

      {/* Trend tag */}
      {trend && (
        <div
          style={{
            marginTop: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 9999,
            backgroundColor: `${palette.primary}18`,
            border: `1px solid ${palette.primary}33`,
            fontSize: 13,
            fontWeight: 700,
            color: palette.primary,
            letterSpacing: "0.04em",
          }}
        >
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
