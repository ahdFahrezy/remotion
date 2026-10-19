import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, OutroScene as OutroSceneType, MotionRules } from "../types/schema";
import { getSpringConfig } from "../rules/physics";
import { CalloutBadge } from "../components/CalloutBadge";
import { KineticText } from "../components/KineticText";
import { ArrowRight, Terminal } from "lucide-react";

interface OutroSceneProps {
  scene: OutroSceneType;
  rules: MotionRules;
  palette: ColorPalette;
}

export const OutroScene: React.FC<OutroSceneProps> = ({ scene, rules, palette }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isVertical = height > width;

  const subheadlineProgress = spring({
    frame: frame - 12,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const ctaEntrance = spring({
    frame: frame - 20,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const socialsEntrance = spring({
    frame: frame - 28,
    fps,
    config: getSpringConfig(rules.physics),
  });

  const subheadlineOpacity = interpolate(subheadlineProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glowing pulse on the CTA button
  const ctaPulse = interpolate(
    Math.sin((frame / fps) * 3),
    [-1, 1],
    [0.98, 1.02]
  );
  const ctaGlow = interpolate(
    Math.sin((frame / fps) * 3),
    [-1, 1],
    [20, 36]
  );

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
      <div style={{ marginBottom: 20 }}>
        <CalloutBadge
          text={scene.badgeText}
          palette={palette}
          physics={rules.physics}
          delayInFrames={4}
        />
      </div>

      <div style={{ maxWidth: 1100, marginBottom: 16 }}>
        <KineticText
          text={scene.headline}
          palette={palette}
          physics={rules.physics}
          fontSize={isVertical ? 54 : 80}
          delayInFrames={8}
        />
      </div>

      <p
        style={{
          maxWidth: 780,
          fontSize: isVertical ? 20 : 26,
          fontWeight: 500,
          color: palette.mutedText,
          lineHeight: 1.45,
          margin: "0 0 44px 0",
          opacity: subheadlineOpacity,
        }}
      >
        {scene.subheadline}
      </p>

      {/* High-Impact CTA Button */}
      <div
        style={{
          transform: `scale(${ctaEntrance * ctaPulse})`,
          opacity: interpolate(ctaEntrance, [0, 1], [0, 1]),
          marginBottom: 36,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 42px",
            borderRadius: 9999,
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
            color: "#000000",
            fontSize: isVertical ? 20 : 24,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            boxShadow: `0 0 ${ctaGlow}px ${palette.primary}88, 0 10px 30px rgba(0,0,0,0.5)`,
          }}
        >
          <Terminal size={24} color="#000000" />
          <span>{scene.ctaText}</span>
          <ArrowRight size={24} color="#000000" />
        </div>
      </div>

      {/* Social / URL footer tag */}
      <div
        style={{
          opacity: interpolate(socialsEntrance, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(socialsEntrance, [0, 1], [20, 0])}px)`,
          display: "flex",
          gap: 20,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: palette.text,
            letterSpacing: "0.02em",
          }}
        >
          {scene.url}
        </span>
        {scene.socials?.map((social, i) => (
          <span
            key={i}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.06)",
              fontSize: 14,
              fontWeight: 600,
              color: palette.mutedText,
            }}
          >
            {social}
          </span>
        ))}
      </div>
    </div>
  );
};
