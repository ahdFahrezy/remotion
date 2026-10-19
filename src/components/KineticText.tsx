import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ColorPalette, SpringPhysicsPreset } from "../types/schema";
import { getSpringConfig } from "../rules/physics";

interface KineticTextProps {
  text: string;
  palette: ColorPalette;
  physics?: SpringPhysicsPreset;
  highlightWords?: string[];
  delayInFrames?: number;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: "center" | "left" | "right";
  lineHeight?: number;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  palette,
  physics = "bouncy",
  highlightWords = [],
  delayInFrames = 0,
  fontSize = 72,
  fontWeight = 800,
  textAlign = "center",
  lineHeight = 1.15,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(" ");

  // Normalization for matching highlight words regardless of punctuation
  const isHighlighted = (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return highlightWords.some(
      (hw) => hw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanWord
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
        gap: "0.28em",
        fontSize,
        fontWeight,
        lineHeight,
        textAlign,
        letterSpacing: "-0.03em",
      }}
    >
      {words.map((word, index) => {
        // Stagger each word by 4 frames (at 60fps, 4 frames = 0.066s)
        const wordDelay = delayInFrames + index * 4;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: getSpringConfig(physics),
        });

        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const translateY = interpolate(progress, [0, 1], [40, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const scale = interpolate(progress, [0, 1], [0.85, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const highlighted = isHighlighted(word);

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              color: highlighted ? "transparent" : palette.text,
              backgroundImage: highlighted
                ? `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 50%, ${palette.secondary} 100%)`
                : undefined,
              WebkitBackgroundClip: highlighted ? "text" : undefined,
              backgroundClip: highlighted ? "text" : undefined,
              textShadow: highlighted
                ? `0 0 40px ${palette.primary}66`
                : "0 4px 18px rgba(0,0,0,0.4)",
              filter: highlighted ? `drop-shadow(0 0 12px ${palette.primary}55)` : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
