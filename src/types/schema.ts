import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// ==========================================
// 1. Theme & Color Rules
// ==========================================
export const ThemePresetSchema = z.enum([
  "cyber-neon",
  "modern-dark",
  "luxury-gold",
  "clean-saas",
  "sunset-flare",
  "custom",
]);
export type ThemePreset = z.infer<typeof ThemePresetSchema>;

export const ColorPaletteSchema = z.object({
  primary: zColor().describe("Main accent color (e.g. electric cyan, emerald, gold)"),
  secondary: zColor().describe("Secondary accent color (e.g. violet, cobalt, amber)"),
  accent: zColor().describe("Highlight / glow color"),
  background: zColor().describe("Dark canvas background color"),
  cardBg: zColor().describe("Glassmorphic card background (e.g. rgba(255,255,255,0.05))"),
  text: zColor().describe("Primary text color (usually white/near white)"),
  mutedText: zColor().describe("Secondary/description text color"),
  border: zColor().describe("Card border color"),
});
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

// ==========================================
// 2. Motion & Physics Rules (60 FPS Tuned)
// ==========================================
export const SpringPhysicsSchema = z.enum([
  "snappy",   // Fast, energetic, minimal overshoot
  "bouncy",   // Dynamic, playful, noticeable spring overshoot
  "smooth",   // Cinematic, silky, gentle deceleration
  "cinematic",// Heavy, luxurious, slow elegant ease
]);
export type SpringPhysicsPreset = z.infer<typeof SpringPhysicsSchema>;

export const BackgroundStyleSchema = z.enum([
  "grid-mesh",
  "particles",
  "cyber-grid",
  "minimal-glow",
]);
export type BackgroundStyle = z.infer<typeof BackgroundStyleSchema>;

export const FontFamilySchema = z.enum([
  "Inter",
  "Outfit",
  "SpaceGrotesk",
  "PlusJakartaSans",
  "Montserrat",
]);
export type FontFamily = z.infer<typeof FontFamilySchema>;

export const MotionRulesSchema = z.object({
  fps: z.literal(60).default(60).describe("Target framerate - locked to 60 FPS"),
  themePreset: ThemePresetSchema.default("cyber-neon").describe("Visual style preset"),
  customColors: ColorPaletteSchema.optional().describe("Overrides if themePreset is 'custom'"),
  fontFamily: FontFamilySchema.default("Outfit").describe("Primary font family"),
  physics: SpringPhysicsSchema.default("bouncy").describe("Spring animation physics profile"),
  backgroundStyle: BackgroundStyleSchema.default("grid-mesh").describe("Background visual effects"),
  glowIntensity: z.number().min(0).max(1).default(0.7).describe("Ambient glow brightness"),
  enableVoiceover: z.boolean().default(true).describe("Enable Voicebox audio narration"),
  voiceProfile: z.string().default("default").describe("Voicebox voice profile name"),
  masterAudioFile: z.string().optional().describe("Continuous audio or uploaded voice sample"),
  voiceboxStatus: z.string().optional().describe("Voicebox service status (online, offline, cloned)"),
  clonedVoice: z.boolean().optional().describe("True if audio was synthesized via voice cloning"),
  language: z.enum(["id", "ja", "en"]).default("id").describe("Script and voiceover language"),
});
export type MotionRules = z.infer<typeof MotionRulesSchema>;

// ==========================================
// 3. Scene Definitions
// ==========================================
export const TransitionTypeSchema = z.enum([
  "slide",
  "fade",
  "wipe",
  "none",
]);
export type TransitionType = z.infer<typeof TransitionTypeSchema>;

// Common Voiceover Fields (defaults to empty string to prevent studio startsWith error)
const VoiceoverFields = {
  voiceoverText: z.string().default("").describe("Spoken voiceover narrative for this scene"),
  audioFile: z.string().default("").describe("Path to generated audio file relative to public/"),
  audioDuration: z.number().default(0).describe("Exact duration of voiceover in seconds"),
};

// Scene 1: Intro Scene
export const IntroSceneSchema = z.object({
  type: z.literal("intro"),
  id: z.string().default("scene"),
  durationInSeconds: z.coerce.number().default(3.5),
  transition: TransitionTypeSchema.default("slide"),
  badgeText: z.string().default("INTRODUCING 2.0"),
  headline: z.string().default("The Future of Motion"),
  highlightWord: z.string().default("Motion"),
  subheadline: z.string().default("Automated. Ultra-fast. 60 FPS."),
  icon: z.string().default("Sparkles"),
  ...VoiceoverFields,
});
export type IntroScene = z.infer<typeof IntroSceneSchema>;

// Scene 2: Kinetic Typography Scene
export const KineticTextSceneSchema = z.object({
  type: z.literal("kinetic-text"),
  id: z.string().default("scene"),
  durationInSeconds: z.number().default(3.0),
  transition: TransitionTypeSchema.default("slide"),
  badgeText: z.string().default(""),
  headline: z.string().default("Think Faster. Ship Smarter."),
  highlightWords: z.array(z.string()).default(["Faster", "Smarter"]),
  body: z.string().default("Transform raw concepts into broadcast-grade motion graphics in minutes."),
  ...VoiceoverFields,
});
export type KineticTextScene = z.infer<typeof KineticTextSceneSchema>;

// Scene 3: Metrics / Growth Scene
export const MetricItemSchema = z.object({
  value: z.coerce.number().default(0),
  prefix: z.string().default(""),
  suffix: z.string().default(""),
  label: z.string().default(""),
  trend: z.string().default(""),
});
export type MetricItem = z.infer<typeof MetricItemSchema>;

export const MetricsSceneSchema = z.object({
  type: z.literal("metrics"),
  id: z.string().default("scene"),
  durationInSeconds: z.coerce.number().default(4.0),
  transition: TransitionTypeSchema.default("slide"),
  badgeText: z.string().default("MEASURED PERFORMANCE"),
  headline: z.string().default("Breakneck Acceleration"),
  subheadline: z.string().default("Real benchmark data tested under production workloads"),
  metrics: z.array(MetricItemSchema).default([
    { value: 60, prefix: "", suffix: " FPS", label: "Silky Frame Rate", trend: "Zero Stutter" },
    { value: 10, prefix: "", suffix: "x", label: "Faster Production", trend: "+900% ROI" },
    { value: 99.8, prefix: "", suffix: "%", label: "Render Precision", trend: "Flawless" },
  ]),
  ...VoiceoverFields,
});
export type MetricsScene = z.infer<typeof MetricsSceneSchema>;

// Scene 4: Feature Grid Scene
export const FeatureItemSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  tag: z.string().default(""),
});
export type FeatureItem = z.infer<typeof FeatureItemSchema>;

export const FeatureGridSceneSchema = z.object({
  type: z.literal("feature-grid"),
  id: z.string().default("scene"),
  durationInSeconds: z.coerce.number().default(4.0),
  transition: TransitionTypeSchema.default("slide"),
  badgeText: z.string().default("CORE CAPABILITIES"),
  headline: z.string().default("Engineered For Creators"),
  subheadline: z.string().default("Deep modular architecture with declarative motion rules"),
  features: z.array(FeatureItemSchema).default([
    { icon: "Zap", title: "Script Driven", description: "Edit JSON or props to re-generate video instantaneously.", tag: "Declarative" },
    { icon: "Layers", title: "Deep Modules", description: "Modular scenes, reusable layout components, and dynamic frame orchestrators.", tag: "Robust" },
    { icon: "Cpu", title: "60 FPS Native", description: "Tuned spring physics and zero dropped frames.", tag: "Silky" },
    { icon: "Gauge", title: "Instant Export", description: "Render to MP4 with Remotion CLI or preview in Studio.", tag: "Automated" },
  ]),
  ...VoiceoverFields,
});
export type FeatureGridScene = z.infer<typeof FeatureGridSceneSchema>;

// Scene 5: Comparison Scene
export const ComparisonColumnSchema = z.object({
  title: z.string(),
  status: z.enum(["negative", "positive"]),
  items: z.array(z.string()),
});
export type ComparisonColumn = z.infer<typeof ComparisonColumnSchema>;

export const ComparisonSceneSchema = z.object({
  type: z.literal("comparison"),
  id: z.string().default("scene"),
  durationInSeconds: z.number().default(4.0),
  transition: TransitionTypeSchema.default("slide"),
  badgeText: z.string().default("THE OLD WAY VS NEW WAY"),
  headline: z.string().default("Why Automation Wins"),
  subheadline: z.string().default("Eliminate manual timeline drag and repetitive keyframing"),
  left: ComparisonColumnSchema.default({
    title: "Manual Timeline Editing",
    status: "negative",
    items: [
      "Hours lost dragging keyframes manually",
      "Inconsistent pacing across videos",
      "Painful re-edits for text changes",
      "Manual export bottlenecks",
    ],
  }),
  right: ComparisonColumnSchema.default({
    title: "Remotion Motion Engine",
    status: "positive",
    items: [
      "Input script & rules in seconds",
      "Programmatic 60 FPS spring physics",
      "Instant updates via JSON or Studio UI",
      "Automated CI/CD rendering pipeline",
    ],
  }),
  ...VoiceoverFields,
});
export type ComparisonScene = z.infer<typeof ComparisonSceneSchema>;

// Scene 6: Quote Scene
export const QuoteSceneSchema = z.object({
  type: z.literal("quote"),
  id: z.string().default("scene"),
  durationInSeconds: z.coerce.number().default(3.5),
  transition: TransitionTypeSchema.default("slide"),
  badgeText: z.string().default("CREATOR SPOTLIGHT"),
  quote: z.string().default("“This engine completely replaced our 3-day video production sprint with a 5-minute JSON file.”"),
  author: z.string().default("Alex Chen"),
  role: z.string().default("Head of Media @ HyperScale"),
  rating: z.number().min(1).max(5).default(5),
  ...VoiceoverFields,
});
export type QuoteScene = z.infer<typeof QuoteSceneSchema>;

// Scene 7: Outro Scene
export const OutroSceneSchema = z.object({
  type: z.literal("outro"),
  id: z.string().default("scene-outro"),
  durationInSeconds: z.coerce.number().default(3.5),
  transition: TransitionTypeSchema.default("fade"),
  badgeText: z.string().default("GET STARTED TODAY"),
  headline: z.string().default("Transform Your Visuals"),
  subheadline: z.string().default("Plug in your script, customize your rules, and generate."),
  ctaText: z.string().default("npx remotion studio"),
  url: z.string().default("github.com/remotion-dev"),
  socials: z.array(z.string()).default(["@remotion", "remotion.dev"]),
  ...VoiceoverFields,
});
export type OutroScene = z.infer<typeof OutroSceneSchema>;

// Combined Scene Union
export const SceneSchema = z.discriminatedUnion("type", [
  IntroSceneSchema,
  KineticTextSceneSchema,
  MetricsSceneSchema,
  FeatureGridSceneSchema,
  ComparisonSceneSchema,
  QuoteSceneSchema,
  OutroSceneSchema,
]);
export type Scene = z.infer<typeof SceneSchema>;

// ==========================================
// 4. Root Motion Graphic Script Schema
// ==========================================
export const AspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const MotionGraphicScriptSchema = z.object({
  title: z.string().default("Next-Gen Motion Graphic"),
  aspectRatio: AspectRatioSchema.default("16:9").describe("Video format (16:9 landscape, 9:16 vertical, 1:1 square)"),
  rules: MotionRulesSchema.default({
    fps: 60,
    themePreset: "cyber-neon",
    fontFamily: "Outfit",
    physics: "bouncy",
    backgroundStyle: "grid-mesh",
    glowIntensity: 0.7,
    enableVoiceover: true,
    voiceProfile: "default",
  }),
  scenes: z.array(SceneSchema).describe("List of animated scenes in sequential order"),
});
export type MotionGraphicScript = z.infer<typeof MotionGraphicScriptSchema>;
