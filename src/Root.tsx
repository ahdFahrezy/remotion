import React from "react";
import { Composition, Folder } from "remotion";
import {
  MotionGraphic,
  calculateMotionGraphicMetadata,
} from "./engine/MotionGraphic";
import { MotionGraphicScript, MotionGraphicScriptSchema } from "./types/schema";
import { DEFAULT_SCRIPT } from "./rules/defaultScript";
import latestAiScript from "../scripts/latest-generated-script.json";
import { IntroScene } from "./scenes/IntroScene";
import { KineticTextScene } from "./scenes/KineticTextScene";
import { MetricsScene } from "./scenes/MetricsScene";
import { FeatureGridScene } from "./scenes/FeatureGridScene";
import { ComparisonScene } from "./scenes/ComparisonScene";
import { QuoteScene } from "./scenes/QuoteScene";
import { OutroScene } from "./scenes/OutroScene";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { resolvePalette } from "./rules/themes";

const defaultPalette = resolvePalette(
  DEFAULT_SCRIPT.rules.themePreset,
  DEFAULT_SCRIPT.rules.customColors
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. AI Generated Motion Graphic (Updated by Gemini & Voicebox) */}
      <Composition
        id="AIMotionGraphic"
        component={MotionGraphic}
        fps={60}
        width={1920}
        height={1080}
        durationInFrames={1200}
        defaultProps={latestAiScript as MotionGraphicScript}
        schema={MotionGraphicScriptSchema}
        calculateMetadata={calculateMotionGraphicMetadata}
      />

      {/* 2. Default Preset Motion Graphic (Landscape 16:9) */}
      <Composition
        id="MotionGraphic"
        component={MotionGraphic}
        fps={60}
        width={1920}
        height={1080}
        durationInFrames={1200}
        defaultProps={DEFAULT_SCRIPT}
        schema={MotionGraphicScriptSchema}
        calculateMetadata={calculateMotionGraphicMetadata}
      />

      {/* 2. Vertical Format (Reels, TikTok, Shorts 9:16) */}
      <Composition
        id="MotionGraphicVertical"
        component={MotionGraphic}
        fps={60}
        width={1080}
        height={1920}
        durationInFrames={1200}
        defaultProps={{
          ...DEFAULT_SCRIPT,
          aspectRatio: "9:16",
        }}
        schema={MotionGraphicScriptSchema}
        calculateMetadata={calculateMotionGraphicMetadata}
      />

      {/* 3. Square Format (Social Posts 1:1) */}
      <Composition
        id="MotionGraphicSquare"
        component={MotionGraphic}
        fps={60}
        width={1080}
        height={1080}
        durationInFrames={1200}
        defaultProps={{
          ...DEFAULT_SCRIPT,
          aspectRatio: "1:1",
        }}
        schema={MotionGraphicScriptSchema}
        calculateMetadata={calculateMotionGraphicMetadata}
      />

      {/* 4. Folder of Individual Scene Previews for Fast Prototyping */}
      <Folder name="Scenes">
        <Composition
          id="Scene-Intro"
          component={() => (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <BackgroundLayer styleType="grid-mesh" palette={defaultPalette} />
              <IntroScene
                scene={DEFAULT_SCRIPT.scenes[0] as any}
                rules={DEFAULT_SCRIPT.rules}
                palette={defaultPalette}
              />
            </div>
          )}
          fps={60}
          width={1920}
          height={1080}
          durationInFrames={Math.round(DEFAULT_SCRIPT.scenes[0].durationInSeconds * 60)}
        />

        <Composition
          id="Scene-KineticText"
          component={() => (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <BackgroundLayer styleType="grid-mesh" palette={defaultPalette} />
              <KineticTextScene
                scene={DEFAULT_SCRIPT.scenes[1] as any}
                rules={DEFAULT_SCRIPT.rules}
                palette={defaultPalette}
              />
            </div>
          )}
          fps={60}
          width={1920}
          height={1080}
          durationInFrames={Math.round(DEFAULT_SCRIPT.scenes[1].durationInSeconds * 60)}
        />

        <Composition
          id="Scene-Metrics"
          component={() => (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <BackgroundLayer styleType="grid-mesh" palette={defaultPalette} />
              <MetricsScene
                scene={DEFAULT_SCRIPT.scenes[2] as any}
                rules={DEFAULT_SCRIPT.rules}
                palette={defaultPalette}
              />
            </div>
          )}
          fps={60}
          width={1920}
          height={1080}
          durationInFrames={Math.round(DEFAULT_SCRIPT.scenes[2].durationInSeconds * 60)}
        />

        <Composition
          id="Scene-Features"
          component={() => (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <BackgroundLayer styleType="grid-mesh" palette={defaultPalette} />
              <FeatureGridScene
                scene={DEFAULT_SCRIPT.scenes[3] as any}
                rules={DEFAULT_SCRIPT.rules}
                palette={defaultPalette}
              />
            </div>
          )}
          fps={60}
          width={1920}
          height={1080}
          durationInFrames={Math.round(DEFAULT_SCRIPT.scenes[3].durationInSeconds * 60)}
        />

        <Composition
          id="Scene-Comparison"
          component={() => (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <BackgroundLayer styleType="grid-mesh" palette={defaultPalette} />
              <ComparisonScene
                scene={DEFAULT_SCRIPT.scenes[4] as any}
                rules={DEFAULT_SCRIPT.rules}
                palette={defaultPalette}
              />
            </div>
          )}
          fps={60}
          width={1920}
          height={1080}
          durationInFrames={Math.round(DEFAULT_SCRIPT.scenes[4].durationInSeconds * 60)}
        />

        <Composition
          id="Scene-Outro"
          component={() => (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <BackgroundLayer styleType="grid-mesh" palette={defaultPalette} />
              <OutroScene
                scene={DEFAULT_SCRIPT.scenes[5] as any}
                rules={DEFAULT_SCRIPT.rules}
                palette={defaultPalette}
              />
            </div>
          )}
          fps={60}
          width={1920}
          height={1080}
          durationInFrames={Math.round(DEFAULT_SCRIPT.scenes[5].durationInSeconds * 60)}
        />
      </Folder>
    </>
  );
};
