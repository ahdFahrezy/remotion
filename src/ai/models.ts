export interface AIModelInfo {
  id: string;
  name: string;
  badge?: string;
  tags: string[];
  pricing: string;
  description: string;
  recommended?: boolean;
}

export const PENPOD_MODELS: AIModelInfo[] = [
  {
    id: "gemini-3.8-flash-high",
    name: "Gemini 3.8 Flash",
    badge: "⭐ REKOMENDASI UTAMA",
    tags: ["Reasoning", "Audio", "Video", "Image"],
    pricing: "$0.75 in / $3.75 out / 1M tokens",
    description: "Sangat cepat, hemat biaya, dan mendukung input audio/suara secara native.",
    recommended: true,
  },
  {
    id: "gemini-4-argon-high",
    name: "Gemini 4 Argon",
    badge: "🚀 NEXT-GEN",
    tags: ["Reasoning", "Audio", "Video", "Image"],
    pricing: "Free / Special Tier",
    description: "Versi Gemini tercanggih dengan reasoning tingkat tinggi untuk skrip kompleks.",
  },
  {
    id: "claude-opus-4-6-thinking",
    name: "Claude Opus 4.6 (Thinking)",
    badge: "🧠 DEEP THINKING",
    tags: ["Reasoning", "Image"],
    pricing: "$5 in / $25 out / 1M tokens",
    description: "Storytelling & copywriting tingkat tertinggi, cocok untuk narasi premium.",
  },
  {
    id: "deepseek-v4.1-flash:paid",
    name: "DeepSeek v4.1 Flash",
    badge: "⚡ ULTRA CHEAP & FAST",
    tags: ["Reasoning"],
    pricing: "$0.15 in / $0.6 out / 1M tokens",
    description: "Ekonomis super murah, respons cepat untuk teks prompt.",
  },
  {
    id: "gpt-6-luna",
    name: "GPT 6.0 Luna",
    badge: "✨ HIGH REASONING",
    tags: ["Reasoning", "Tools", "Image"],
    pricing: "$0.5 in / $2 out / 1M tokens",
    description: "Model reasoning OpenAI generasi baru dengan pemahaman instruksi sangat baik.",
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT 5.6 Luna",
    badge: "🎯 RELIABLE",
    tags: ["Reasoning", "Tools", "Image"],
    pricing: "$0.5 in / $2 out / 1M tokens",
    description: "Stabil dan handal untuk struktur JSON dan alur animasi.",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek v4 Flash",
    tags: ["Reasoning"],
    pricing: "$0.5 in / $1 out / 1M tokens",
    description: "Model reasoning alternatif berkecepatan tinggi.",
  },
  {
    id: "gpt-oss-120b-medium",
    name: "GPT-OSS 120B (Medium)",
    tags: ["Reasoning"],
    pricing: "$0.15 in / $0.6 out / 1M tokens",
    description: "Open-weights model bertenaga tinggi dengan harga hemat.",
  },
  {
    id: "apodex-1.1-mini",
    name: "Apodex 1.1 Mini",
    tags: ["Reasoning"],
    pricing: "Custom",
    description: "Model ringan untuk iterasi cepat.",
  },
];

export const getDefaultModelId = (): string => {
  return process.env.PENPOD_MODEL || "gemini-3.8-flash-high";
};

export const resolveModelId = (input?: string): string => {
  if (!input) return getDefaultModelId();

  // If user passed a number index (1-based)
  const num = parseInt(input, 10);
  if (!isNaN(num) && num >= 1 && num <= PENPOD_MODELS.length) {
    return PENPOD_MODELS[num - 1].id;
  }

  // If matched by exact ID or partial name
  const found = PENPOD_MODELS.find(
    (m) =>
      m.id.toLowerCase() === input.toLowerCase() ||
      m.name.toLowerCase().includes(input.toLowerCase())
  );

  return found ? found.id : input;
};
