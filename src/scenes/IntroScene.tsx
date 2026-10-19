import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, IntroScene as IntroSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { KineticText } from "../components/KineticText";
import { IconRenderer } from "../components/IconRenderer";

interface IntroSceneProps {
  scene: IntroSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ scene, rules, palette }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isVertical = height > width;

  const logoEntrance = spring({
    frame,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const subheadlineProgress = spring({
    frame: frame - 16,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const subheadlineOpacity = interpolate(subheadlineProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subheadlineTranslateY = interpolate(subheadlineProgress, [0, 1], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "40px 32px" : "60px 80px",
        textAlign: "center",
        zIndex: 1,
      }}
    >
      {/* Animated Hero Icon / Logo */}
      <div
        style={{
          width: isVertical ? 72 : 96,
          height: isVertical ? 72 : 96,
          borderRadius: isVertical ? 22 : 28,
          background: `linear-gradient(135deg, ${palette.primary}25 0%, ${palette.secondary}20 100%)`,
          border: `2px solid ${palette.primary}66`,
          boxShadow: `0 0 50px -10px ${palette.primary}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: palette.primary,
          marginBottom: isVertical ? 24 : 32,
          transform: `scale(${logoEntrance}) rotate(${interpolate(logoEntrance, [0, 1], [-20, 0])}deg)`,
          opacity: interpolate(logoEntrance, [0, 1], [0, 1]),
        }}
      >
        <IconRenderer name={scene.icon} size={isVertical ? 36 : 48} color={palette.primary} />
      </div>

      {/* Top Badge */}
      <div style={{ marginBottom: isVertical ? 20 : 28 }}>
        <CalloutBadge
          text={scene.badgeText}
          palette={palette}
          physics={rules.physics}
          delayInFrames={6}
        />
      </div>

      {/* Kinetic Headline */}
      <div style={{ maxWidth: isVertical ? 900 : 1200, marginBottom: isVertical ? 20 : 28 }}>
        <KineticText
          text={scene.headline}
          palette={palette}
          physics={rules.physics}
          highlightWords={[scene.highlightWord]}
          fontSize={isVertical ? 58 : 84}
          delayInFrames={10}
        />
      </div>

      {/* Subheadline */}
      <p
        style={{
          maxWidth: isVertical ? 800 : 860,
          fontSize: isVertical ? 22 : 28,
          fontWeight: 500,
          color: palette.mutedText,
          lineHeight: 1.5,
          margin: 0,
          opacity: subheadlineOpacity,
          transform: `translateY(${subheadlineTranslateY}px)`,
        }}
      >
        {scene.subheadline}
      </p>
    </div>
  );
};
