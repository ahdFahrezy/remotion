import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundStyle, ColorPalette } from "../types/schema";

interface BackgroundLayerProps {
  styleType: BackgroundStyle;
  palette: ColorPalette;
  glowIntensity?: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  styleType,
  palette,
  glowIntensity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Floating ambient glowing orbs driven by frame count at 60 FPS
  const orb1X = interpolate(
    Math.sin((frame / fps) * 0.8),
    [-1, 1],
    [width * 0.15, width * 0.35]
  );
  const orb1Y = interpolate(
    Math.cos((frame / fps) * 0.6),
    [-1, 1],
    [height * 0.2, height * 0.45]
  );

  const orb2X = interpolate(
    Math.cos((frame / fps) * 0.7),
    [-1, 1],
    [width * 0.65, width * 0.85]
  );
  const orb2Y = interpolate(
    Math.sin((frame / fps) * 0.5),
    [-1, 1],
    [height * 0.55, height * 0.8]
  );

  // Subtle grid pulse
  const gridOpacity = interpolate(
    Math.sin((frame / fps) * 1.2),
    [-1, 1],
    [0.12, 0.2]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: palette.background,
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Background Gradient Mesh Blob 1 */}
      <div
        style={{
          position: "absolute",
          left: orb1X,
          top: orb1Y,
          width: width * 0.55,
          height: width * 0.55,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.primary} 0%, transparent 68%)`,
          opacity: 0.25 * glowIntensity,
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      {/* Background Gradient Mesh Blob 2 */}
      <div
        style={{
          position: "absolute",
          left: orb2X,
          top: orb2Y,
          width: width * 0.65,
          height: width * 0.65,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.secondary} 0%, transparent 70%)`,
          opacity: 0.22 * glowIntensity,
          filter: "blur(110px)",
          pointerEvents: "none",
        }}
      />

      {/* Center ambient spotlight */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: width * 0.8,
          height: height * 0.8,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${palette.accent}15 0%, transparent 75%)`,
          opacity: 0.4 * glowIntensity,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Cyber Grid Lines or Dot Matrix */}
      {(styleType === "grid-mesh" || styleType === "cyber-grid") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: gridOpacity,
            backgroundImage: `
              linear-gradient(to right, ${palette.primary}33 1px, transparent 1px),
              linear-gradient(to bottom, ${palette.primary}33 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            backgroundPosition: `${frame * 0.2}px ${frame * 0.2}px`,
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          }}
        />
      )}

      {/* Floating Particle Star Accents */}
      {styleType === "particles" && (
        <>
          {Array.from({ length: 24 }).map((_, i) => {
            const seed = (i * 137.5) % 360;
            const baseX = ((seed * 19) % 100) * (width / 100);
            const baseY = ((seed * 31) % 100) * (height / 100);
            const speed = 0.3 + (i % 5) * 0.15;
            const yOffset = (frame * speed + i * 40) % (height + 40);
            const size = 3 + (i % 4) * 2;
            const particleOpacity = interpolate(
              Math.sin((frame / fps) * 2 + i),
              [-1, 1],
              [0.2, 0.75]
            );

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: baseX,
                  top: height - yOffset,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  backgroundColor: i % 2 === 0 ? palette.primary : palette.accent,
                  opacity: particleOpacity,
                  boxShadow: `0 0 10px ${palette.primary}`,
                }}
              />
            );
          })}
        </>
      )}

      {/* Subtle Cinematic Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 ${width * 0.15}px rgba(0, 0, 0, 0.8)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
