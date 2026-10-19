import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, KineticTextScene as KineticTextSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { KineticText } from "../components/KineticText";

interface KineticTextSceneProps {
  scene: KineticTextSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const KineticTextScene: React.FC<KineticTextSceneProps> = ({ scene, rules, palette }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isVertical = height > width;

  const bodyProgress = spring({
    frame: frame - 18,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const bodyOpacity = interpolate(bodyProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bodyTranslateY = interpolate(bodyProgress, [0, 1], [35, 0], {
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
      {scene.badgeText && (
        <div style={{ marginBottom: isVertical ? 24 : 32 }}>
          <CalloutBadge
            text={scene.badgeText}
            palette={palette}
            physics={rules.physics}
            delayInFrames={4}
          />
        </div>
      )}

      <div style={{ maxWidth: isVertical ? 900 : 1300, marginBottom: isVertical ? 24 : 32 }}>
        <KineticText
          text={scene.headline}
          palette={palette}
          physics={rules.physics}
          highlightWords={scene.highlightWords}
          fontSize={isVertical ? 64 : 96}
          delayInFrames={8}
        />
      </div>

      <p
        style={{
          maxWidth: isVertical ? 800 : 880,
          fontSize: isVertical ? 24 : 30,
          fontWeight: 500,
          color: palette.mutedText,
          lineHeight: 1.5,
          margin: 0,
          opacity: bodyOpacity,
          transform: `translateY(${bodyTranslateY}px)`,
        }}
      >
        {scene.body}
      </p>
    </div>
  );
};
