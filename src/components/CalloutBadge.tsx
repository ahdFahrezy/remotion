import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, SpringPhysicsPreset } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { IconRenderer } from "./IconRenderer";

interface CalloutBadgeProps {
  text: string;
  palette: ColorPalette;
  physics?: SpringPhysicsPreset;
  icon?: string;
  delayInFrames?: number;
}

export const CalloutBadge: React.FC<CalloutBadgeProps> = ({
  text,
  palette,
  physics = "bouncy",
  icon,
  delayInFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delayInFrames,
    fps,
    config: getSpringConfig(physics),
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(entrance, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing dot indicator
  const dotScale = interpolate(
    Math.sin((frame / fps) * 4),
    [-1, 1],
    [0.85, 1.25]
  );
  const dotGlow = interpolate(
    Math.sin((frame / fps) * 4),
    [-1, 1],
    [0.4, 0.9]
  );

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 9999,
        background: `linear-gradient(135deg, ${palette.primary}18 0%, ${palette.secondary}14 100%)`,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 8px 30px -4px ${palette.primary}22, inset 0 1px 0 rgba(255,255,255,0.15)`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        opacity,
        transform: `translateY(${translateY}px) scale(${entrance})`,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontSize: 15,
        fontWeight: 700,
        color: palette.text,
      }}
    >
      {/* Pulsing status indicator dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: palette.primary,
          boxShadow: `0 0 12px ${palette.primary}`,
          opacity: dotGlow,
          transform: `scale(${dotScale})`,
        }}
      />

      {icon && <IconRenderer name={icon} size={16} color={palette.primary} />}
      <span>{text}</span>
    </div>
  );
};
