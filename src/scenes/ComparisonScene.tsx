import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, ComparisonScene as ComparisonSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { KineticText } from "../components/KineticText";
import { ComparisonCard } from "../components/ComparisonCard";

interface ComparisonSceneProps {
  scene: ComparisonSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({ scene, rules, palette }) => {
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

      {/* Side-by-side comparison cards */}
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? 20 : 32,
          width: "100%",
          maxWidth: isVertical ? 540 : 1180,
          textAlign: "left",
        }}
      >
        <ComparisonCard
          column={scene.left}
          palette={palette}
          physics={rules.physics}
          delayInFrames={12}
        />
        <ComparisonCard
          column={scene.right}
          palette={palette}
          physics={rules.physics}
          delayInFrames={18}
        />
      </div>
    </div>
  );
};
