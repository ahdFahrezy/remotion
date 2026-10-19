import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, QuoteScene as QuoteSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { Star } from "lucide-react";

interface QuoteSceneProps {
  scene: QuoteSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const QuoteScene: React.FC<QuoteSceneProps> = ({ scene, rules, palette }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isVertical = height > width;

  const cardEntrance = spring({
    frame: frame - 6,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const cardOpacity = interpolate(cardEntrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardTranslateY = interpolate(cardEntrance, [0, 1], [40, 0], {
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
      <div style={{ marginBottom: 28 }}>
        <CalloutBadge
          text={scene.badgeText}
          palette={palette}
          physics={rules.physics}
          delayInFrames={4}
        />
      </div>

      {/* Quote Container Card */}
      <div
        style={{
          maxWidth: isVertical ? 600 : 960,
          padding: isVertical ? "36px 28px" : "56px 64px",
          borderRadius: 32,
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
          boxShadow: `0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          opacity: cardOpacity,
          transform: `translateY(${cardTranslateY}px) scale(${cardEntrance})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Star Rating */}
        <div style={{ display: "flex", gap: 6, color: palette.accent }}>
          {Array.from({ length: scene.rating }).map((_, i) => (
            <Star key={i} size={24} fill={palette.accent} color={palette.accent} />
          ))}
        </div>

        {/* Quote Text */}
        <p
          style={{
            fontSize: isVertical ? 26 : 38,
            fontWeight: 700,
            lineHeight: 1.35,
            color: palette.text,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {scene.quote}
        </p>

        {/* Author Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: palette.primary,
              letterSpacing: "-0.01em",
            }}
          >
            {scene.author}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: palette.mutedText,
            }}
          >
            {scene.role}
          </div>
        </div>
      </div>
    </div>
  );
};
