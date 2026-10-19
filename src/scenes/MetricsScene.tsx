import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, MetricsScene as MetricsSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { KineticText } from "../components/KineticText";
import { StatCounter } from "../components/StatCounter";

interface MetricsSceneProps {
  scene: MetricsSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const MetricsScene: React.FC<MetricsSceneProps> = ({ scene, rules, palette }) => {
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
        padding: isVertical ? "40px 32px" : "50px 80px",
        textAlign: "center",
        zIndex: 1,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <CalloutBadge
          text={scene.badgeText}
          palette={palette}
          physics={rules.physics}
          delayInFrames={4}
        />
      </div>

      <div style={{ maxWidth: 1100, marginBottom: 12 }}>
        <KineticText
          text={scene.headline}
          palette={palette}
          physics={rules.physics}
          fontSize={isVertical ? 48 : 68}
          delayInFrames={8}
        />
      </div>

      <p
        style={{
          maxWidth: 800,
          fontSize: isVertical ? 20 : 24,
          fontWeight: 500,
          color: palette.mutedText,
          lineHeight: 1.45,
          margin: "0 0 44px 0",
          opacity: subheadlineOpacity,
        }}
      >
        {scene.subheadline}
      </p>

      {/* Row of Stat Counters with staggered 60 FPS roll-up */}
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? 18 : 28,
          width: "100%",
          maxWidth: isVertical ? 500 : 1200,
          justifyContent: "center",
        }}
      >
        {scene.metrics.map((metric, index) => (
          <StatCounter
            key={index}
            value={metric.value}
            prefix={metric.prefix}
            suffix={metric.suffix}
            label={metric.label}
            trend={metric.trend}
            palette={palette}
            physics={rules.physics}
            delayInFrames={14 + index * 6}
          />
        ))}
      </div>
    </div>
  );
};
