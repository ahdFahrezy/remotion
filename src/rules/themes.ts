import { ColorPalette, ThemePreset } from "../types/schema";

export const THEME_PALETTES: Record<Exclude<ThemePreset, "custom">, ColorPalette> = {
  // 1. Cyber Neon: High-octane futuristic tech (Cyan / Violet / Deep Space)
  "cyber-neon": {
    primary: "#00F0FF",      // Electric Cyan
    secondary: "#8B5CF6",    // Neon Violet
    accent: "#38BDF8",       // Bright Sky
    background: "#080B11",   // Deep Space Obsidian
    cardBg: "rgba(14, 21, 37, 0.65)", // Frosted Cyan-Tinted Glass
    text: "#F8FAFC",         // Crisp White
    mutedText: "#94A3B8",    // Slate Silver
    border: "rgba(0, 240, 255, 0.22)", // Luminous Cyan Stroke
  },

  // 2. Modern Dark: Sleek, refined, minimal developer/product aesthetic
  "modern-dark": {
    primary: "#10B981",      // Emerald Glow
    secondary: "#06B6D4",    // Aqua Blue
    accent: "#34D399",       // Mint Highlight
    background: "#09090B",   // Pure Zinc Black
    cardBg: "rgba(24, 24, 27, 0.7)",  // Dark Frosted Glass
    text: "#FFFFFF",
    mutedText: "#A1A1AA",    // Zinc Muted
    border: "rgba(255, 255, 255, 0.12)",
  },

  // 3. Luxury Gold: Editorial, executive, premium champagne warmth
  "luxury-gold": {
    primary: "#F59E0B",      // Warm Amber
    secondary: "#D97706",    // Burnished Gold
    accent: "#FDE68A",       // Pale Champagne
    background: "#0C0A09",   // Warm Black / Espresso
    cardBg: "rgba(28, 25, 23, 0.75)", // Deep Bronze Glass
    text: "#FAFAF9",         // Warm Ivory
    mutedText: "#A8A29E",    // Warm Stone
    border: "rgba(245, 158, 11, 0.25)",
  },

  // 4. Clean SaaS: Corporate clarity, royal indigo, vibrant and trustworthy
  "clean-saas": {
    primary: "#6366F1",      // Royal Indigo
    secondary: "#3B82F6",    // High-tech Blue
    accent: "#818CF8",       // Periwinkle
    background: "#0B0F19",   // Midnight Navy
    cardBg: "rgba(17, 24, 39, 0.7)",
    text: "#F9FAFB",
    mutedText: "#9CA3AF",
    border: "rgba(99, 102, 241, 0.25)",
  },

  // 5. Sunset Flare: Warm crimson, vibrant coral, electric orange
  "sunset-flare": {
    primary: "#F43F5E",      // Rose Crimson
    secondary: "#FB923C",    // Bright Tangerine
    accent: "#FDA4AF",       // Soft Coral
    background: "#0F070A",   // Wine Black
    cardBg: "rgba(30, 10, 18, 0.7)",
    text: "#FFF1F2",
    mutedText: "#FDA4AF",
    border: "rgba(244, 63, 94, 0.28)",
  },
};

export const resolvePalette = (preset: ThemePreset, custom?: ColorPalette): ColorPalette => {
  if (preset === "custom" && custom) {
    return custom;
  }
  return THEME_PALETTES[preset as keyof typeof THEME_PALETTES] || THEME_PALETTES["cyber-neon"];
};
