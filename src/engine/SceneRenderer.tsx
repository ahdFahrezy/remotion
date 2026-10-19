import React from "react";
import { ColorPalette, MotionRules, Scene } from "../types/schema";
import { IntroScene } from "../scenes/IntroScene";
import { KineticTextScene } from "../scenes/KineticTextScene";
import { MetricsScene } from "../scenes/MetricsScene";
import { FeatureGridScene } from "../scenes/FeatureGridScene";
import { ComparisonScene } from "../scenes/ComparisonScene";
import { QuoteScene } from "../scenes/QuoteScene";
import { OutroScene } from "../scenes/OutroScene";

interface SceneRendererProps {
  scene: Scene;
  rules: MotionRules;
  palette: ColorPalette;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ scene, rules, palette }) => {
  switch (scene.type) {
    case "intro":
      return <IntroScene scene={scene} rules={rules} palette={palette} />;
    case "kinetic-text":
      return <KineticTextScene scene={scene} rules={rules} palette={palette} />;
    case "metrics":
      return <MetricsScene scene={scene} rules={rules} palette={palette} />;
    case "feature-grid":
      return <FeatureGridScene scene={scene} rules={rules} palette={palette} />;
    case "comparison":
      return <ComparisonScene scene={scene} rules={rules} palette={palette} />;
    case "quote":
      return <QuoteScene scene={scene} rules={rules} palette={palette} />;
    case "outro":
      return <OutroScene scene={scene} rules={rules} palette={palette} />;
    default:
      return null;
  }
};
