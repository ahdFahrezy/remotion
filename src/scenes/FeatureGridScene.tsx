import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, FeatureGridScene as FeatureGridSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { KineticText } from "../components/KineticText";
import { FeatureCard } from "../components/FeatureCard";

interface FeatureGridSceneProps {
  scene: FeatureGridSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const FeatureGridScene: React.FC<FeatureGridSceneProps> = ({ scene, rules, palette }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isVertical = height > width;

  const subheadlineProgress = spring({
    frame: frame - 12,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const subheadlineOpacity = interpolate(subheadlineProgress, [0, 1], [0, 1], {
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
        padding: isVertical ? "40px 32px" : "40px 80px",
        textAlign: "center",
        zIndex: 1,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <CalloutBadge
          text={scene.badgeText}
          palette={palette}
          physics={rules.physics}
          delayInFrames={4}
        />
      </div>

      <div style={{ maxWidth: 1100, marginBottom: 10 }}>
        <KineticText
          text={scene.headline}
          palette={palette}
          physics={rules.physics}
          fontSize={isVertical ? 46 : 64}
          delayInFrames={8}
        />
      </div>

      <p
        style={{
          maxWidth: 820,
          fontSize: isVertical ? 18 : 22,
          fontWeight: 500,
          color: palette.mutedText,
          lineHeight: 1.45,
          margin: "0 0 36px 0",
          opacity: subheadlineOpacity,
        }}
      >
        {scene.subheadline}
      </p>

      {/* Grid of feature cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isVertical ? "1fr" : "repeat(2, 1fr)",
          gap: isVertical ? 16 : 24,
          width: "100%",
          maxWidth: isVertical ? 540 : 1180,
          textAlign: "left",
        }}
      >
        {scene.features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            tag={feature.tag}
            palette={palette}
            physics={rules.physics}
            delayInFrames={14 + index * 5}
          />
        ))}
      </div>
    </div>
  );
};
