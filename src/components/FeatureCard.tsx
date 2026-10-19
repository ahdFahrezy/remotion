import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, SpringPhysicsPreset } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { IconRenderer } from "./IconRenderer";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  tag?: string;
  palette: ColorPalette;
  physics?: SpringPhysicsPreset;
  delayInFrames?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  tag,
  palette,
  physics = "bouncy",
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

  const translateY = interpolate(entrance, [0, 1], [35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: "1 1 340px",
        padding: "32px",
        borderRadius: 24,
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity,
        transform: `translateY(${translateY}px) scale(${entrance})`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Icon Container with glowing background */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${palette.primary}22 0%, ${palette.secondary}20 100%)`,
            border: `1px solid ${palette.primary}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.primary,
            boxShadow: `0 0 20px ${palette.primary}22`,
          }}
        >
          <IconRenderer name={icon} size={28} color={palette.primary} />
        </div>

        {tag && (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 9999,
              backgroundColor: `${palette.primary}15`,
              border: `1px solid ${palette.primary}33`,
              fontSize: 12,
              fontWeight: 700,
              color: palette.primary,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {tag}
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: palette.text,
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: palette.mutedText,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};
