import React from "react";
import { CalculateMetadataFunction, useVideoConfig, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { MotionGraphicScript, TransitionType } from "../types/schema";
import { resolvePalette } from "../rules/themes";
import { getFontFamilyName } from "../rules/typography";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { SceneRenderer } from "./SceneRenderer";

export const TRANSITION_DURATION_SECONDS = 0.4;

export const getPresentation = (type: TransitionType): any => {
  switch (type) {
    case "slide":
      return slide({ direction: "from-right" });
    case "wipe":
      return wipe({ direction: "from-top-right" });
    case "fade":
    default:
      return fade();
  }
};

export const MotionGraphic: React.FC<MotionGraphicScript> = ({
  rules,
  scenes,
}) => {
  const { fps } = useVideoConfig();
  const palette = resolvePalette(rules.themePreset, rules.customColors);
  const fontFamily = getFontFamilyName(rules.fontFamily);
  const transitionFrames = Math.round(TRANSITION_DURATION_SECONDS * fps);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily,
        backgroundColor: palette.background,
        color: palette.text,
        overflow: "hidden",
      }}
    >
      {/* Dynamic Background Mesh & Ambient Effects */}
      <BackgroundLayer
        styleType={rules.backgroundStyle}
        palette={palette}
        glowIntensity={rules.glowIntensity}
      />

      {/* Master Audio Track (fallback only if scenes do not have their own voiceovers and not in cloned mode) */}
      {Boolean(!rules?.clonedVoice && rules?.masterAudioFile && rules.masterAudioFile.trim() !== "" && !scenes.some(s => Boolean(s.audioFile && !s.audioFile.includes("uploaded-sample") && s.audioFile.trim() !== ""))) && (
        <Audio src={staticFile(rules.masterAudioFile)} />
      )}

      {/* Sequential Scene Presentation at 60 FPS */}
      <TransitionSeries>
        {scenes.map((scene, index) => {
          const isLast = index === scenes.length - 1;
          const sceneFrames = Math.round(scene.durationInSeconds * fps);
          const hasTransition = !isLast && scene.transition !== "none";

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={sceneFrames}>
                {Boolean(scene.audioFile && !scene.audioFile.includes("uploaded-sample") && scene.audioFile.trim() !== "") && (
                  <Audio src={staticFile(scene.audioFile)} />
                )}
                <SceneRenderer
                  scene={scene}
                  rules={rules}
                  palette={palette}
                />
              </TransitionSeries.Sequence>

              {hasTransition && (
                <TransitionSeries.Transition
                  presentation={getPresentation(scene.transition)}
                  timing={springTiming({
                    config: { damping: 200 },
                    durationInFrames: transitionFrames,
                  })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </div>
  );
};

/**
 * Calculate dynamic composition metadata:
 * - 60 FPS locked
 * - Dynamic width & height from aspect ratio
 * - Dynamic frame count computed from scenes & transitions
 */
export const calculateMotionGraphicMetadata: CalculateMetadataFunction<MotionGraphicScript> = ({
  props,
}) => {
  const targetFps = 60;
  const scenes = props.scenes || [];
  const transitionFrames = Math.round(TRANSITION_DURATION_SECONDS * targetFps);

  let totalFrames = 0;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneFrames = Math.round((scene.durationInSeconds || 3.5) * targetFps);
    totalFrames += sceneFrames;

    const isLast = i === scenes.length - 1;
    const hasTransition = !isLast && scene.transition !== "none";
    if (hasTransition) {
      totalFrames -= transitionFrames;
    }
  }

  // Safety clamp: at least 60 frames (1 second)
  const durationInFrames = Math.max(60, totalFrames);

  // Resolution based on aspect ratio
  let width = 1920;
  let height = 1080;
  if (props.aspectRatio === "9:16") {
    width = 1080;
    height = 1920;
  } else if (props.aspectRatio === "1:1") {
    width = 1080;
    height = 1080;
  }

  const safeTitle = (props.title || "motion-graphic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    fps: targetFps,
    durationInFrames,
    width,
    height,
    defaultOutName: `${safeTitle}-60fps`,
  };
};
