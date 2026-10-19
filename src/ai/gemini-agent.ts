import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { MotionGraphicScriptSchema, type MotionGraphicScript, type ThemePreset } from "../types/schema.ts";
import { generateSceneVoiceovers, type VoiceboxConfig } from "./voicebox-service.ts";

export interface GenerateOptions {
  prompt?: string;
  audioPromptPath?: string;
  apiKey?: string;
  model?: string;
  themePreset?: ThemePreset;
  language?: "id" | "ja" | "en";
  voiceboxConfig?: VoiceboxConfig;
  generateVoiceover?: boolean;
}

const SYSTEM_INSTRUCTION = `
You are an expert AI Motion Graphics Director and Creative Producer.
Your task is to take a user's prompt (or spoken voice request) and generate a broadcast-grade Remotion motion graphics script at 60 FPS.

CRITICAL RULES:
1. OUTPUT FORMAT: Respond ONLY with a valid JSON object strictly adhering to the schema. No markdown backticks, no conversational preambles.
2. 60 FPS TARGET: The framerate is strictly 60 FPS.
3. SCENE COMPOSITION: Design 4 to 6 compelling sequential scenes that tell a complete story:
   - "intro": Bold hook with animated icon, pulsing badge, and headline with highlight word.
   - "kinetic-text": Punchy, high-energy typography with staggered words and glowing accents.
   - "metrics": Quantifiable impact, statistics, counters (e.g. 60 FPS, 10x, 99.8%) with labels and trend pills.
   - "feature-grid": 2 to 4 capability cards with Lucide icon names (e.g. Zap, Layers, Cpu, Shield, Gauge, Rocket), titles, and descriptions.
   - "comparison": "Old Way / Legacy" vs "New Way / Automated" contrast.
   - "quote": Testimonial or creator highlight with author details.
   - "outro": High-impact Call to Action (CTA) with button text and URL.
4. VOICEOVER SCRIPT: Each scene MUST have a "voiceoverText" field. CRITICAL REQUIREMENT: Keep voiceoverText short, punchy, and impactful: exactly 1 concise sentence (maximum 7 to 10 words). NEVER write multiple sentences or long paragraphs. Short voiceovers are essential for fast-paced 60 FPS motion graphics and allow neural voice synthesis to complete in seconds.
5. THEMES: Select the best theme preset matching the subject:
   - "cyber-neon": High tech, AI, crypto, gaming, developer tools
   - "modern-dark": SaaS, enterprise, analytics, sleek digital products
   - "luxury-gold": Executive, finance, premium brand, luxury goods
   - "clean-saas": Productivity, mobile app, collaborative tools, healthcare
   - "sunset-flare": High energy, marketing, fitness, creator economy, sales
6. FONTS: Choose between "Outfit", "Inter", "SpaceGrotesk", "PlusJakartaSans", "Montserrat".
7. PHYSICS: Choose between "bouncy", "snappy", "smooth", "cinematic".
`;

/**
 * Robust JSON parser that strips markdown codeblocks or extraneous chat text
 */
function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();

  // Strip markdown ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  // Find outermost JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Call Penpod AI endpoint (https://ai.penpod.id/v1/chat/completions)
 */
async function callPenpodAPI(
  apiKey: string,
  baseUrl: string,
  model: string,
  prompt?: string,
  audioPromptPath?: string,
  language?: "id" | "ja" | "en"
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  console.log(`🌐 [Penpod AI] Calling ${url} with model "${model}" [Language: ${language || "id"}]...`);

  let langInstruction = "";
  if (language === "ja") {
    langInstruction = "\n\nCRITICAL LANGUAGE REQUIREMENT: The user explicitly selected JAPANESE (日本語). You MUST write ALL textual content including title, headlines, subheadlines, badgeText, quote, and especially voiceoverText in natural, broadcast-grade JAPANESE (日本語).";
  } else if (language === "en") {
    langInstruction = "\n\nCRITICAL LANGUAGE REQUIREMENT: The user explicitly selected ENGLISH. You MUST write ALL textual content including title, headlines, subheadlines, badgeText, quote, and especially voiceoverText in punchy, modern ENGLISH.";
  } else if (language === "id") {
    langInstruction = "\n\nCRITICAL LANGUAGE REQUIREMENT: The user explicitly selected INDONESIAN (Bahasa Indonesia). You MUST write ALL textual content including title, headlines, subheadlines, badgeText, quote, and especially voiceoverText in engaging, natural BAHASA INDONESIA.";
  }

  const messages: any[] = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTION + langInstruction,
    },
  ];

  const userContent = prompt || (
    language === "ja" 
      ? "60 FPSの高品質で洗練されたテクノロジー向けモーショングラフィックス動画を制作してください"
      : language === "en"
      ? "Create a premium, modern high-tech motion graphics video at 60 FPS"
      : "Buatkan video motion graphic modern bertema teknologi 60 FPS"
  );

  // Support audio prompt if provided
  if (audioPromptPath && fs.existsSync(audioPromptPath)) {
    console.log(`🎤 [Penpod AI] Attaching voice audio reference from ${audioPromptPath}...`);
    try {
      const audioBuffer = fs.readFileSync(audioPromptPath);
      const ext = path.extname(audioPromptPath).toLowerCase().replace(".", "");
      const format = ext === "m4a" ? "m4a" : ext === "wav" ? "wav" : "mp3";
      const base64Data = audioBuffer.toString("base64");

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: userContent,
          },
          {
            type: "input_audio",
            input_audio: {
              data: base64Data,
              format,
            },
          },
        ],
      });
    } catch {
      messages.push({
        role: "user",
        content: userContent,
      });
    }
  } else {
    messages.push({
      role: "user",
      content: userContent,
    });
  }

  const payload: any = {
    model,
    messages,
    temperature: 0.7,
  };

  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  // If input_audio failed because model is text-only, retry with plain text prompt
  if (!response.ok && audioPromptPath) {
    console.log(`⚠️ [Penpod AI] Retrying with text-only prompt...`);
    payload.messages = [
      { role: "system", content: SYSTEM_INSTRUCTION + langInstruction },
      { role: "user", content: userContent },
    ];
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API Error (${response.status} ${response.statusText}): ${errorText}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`AI API returned empty message: ${JSON.stringify(data)}`);
  }

  return content;
}

export const generateMotionGraphicFromAI = async (
  options: GenerateOptions
): Promise<MotionGraphicScript> => {
  // Always hot-reload .env so newly saved keys take effect immediately
  dotenv.config({ override: true });

  const penpodKey = options.apiKey || process.env.PENPOD_API_KEY;

  if (!penpodKey || penpodKey.trim() === "") {
    throw new Error(
      "PENPOD_API_KEY belum terisi di file .env! Silakan isi PENPOD_API_KEY di file .env dengan token dari https://ai.penpod.id"
    );
  }

  const baseUrl = process.env.PENPOD_BASE_URL || "https://ai.penpod.id/v1";
  const model = options.model || process.env.PENPOD_MODEL || "gemini-3.8-flash-high";

  console.log(`\n🤖 [Penpod AI Agent] Memproses prompt menggunakan model "${model}" [Bahasa: ${options.language || "id"}]...`);
  const rawJsonText = await callPenpodAPI(
    penpodKey,
    baseUrl,
    model,
    options.prompt,
    options.audioPromptPath,
    options.language
  );

  // Parse and Validate with Zod Schema
  let rawScript: any;
  try {
    rawScript = cleanAndParseJson(rawJsonText);
  } catch (err) {
    console.error("Failed to parse JSON response:\n", rawJsonText);
    throw new Error(`Failed to parse Penpod AI response into JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Sanitize boilerplate fields so minor omissions by any model don't cause schema failures
  if (rawScript && Array.isArray(rawScript.scenes)) {
    rawScript.scenes.forEach((scene: any, idx: number) => {
      if (!scene.id) scene.id = `scene-${idx + 1}`;
      if (!scene.transition) scene.transition = "slide";
      if (typeof scene.durationInSeconds !== "number") scene.durationInSeconds = 3.5;
    });
  }

  const validatedScript = MotionGraphicScriptSchema.parse(rawScript);

  // Set language in rules
  if (options.language) {
    validatedScript.rules.language = options.language;
  }

  // Enforce user's selected theme preset & typography styling
  if (options.themePreset) {
    validatedScript.rules.themePreset = options.themePreset;
    if (options.themePreset === "luxury-gold") {
      validatedScript.rules.fontFamily = "Montserrat";
      validatedScript.rules.backgroundStyle = "radial-glow";
    } else if (options.themePreset === "modern-dark") {
      validatedScript.rules.fontFamily = "SpaceGrotesk";
      validatedScript.rules.backgroundStyle = "minimal-dots";
    } else if (options.themePreset === "clean-saas") {
      validatedScript.rules.fontFamily = "PlusJakartaSans";
      validatedScript.rules.backgroundStyle = "grid-mesh";
    } else if (options.themePreset === "sunset-flare") {
      validatedScript.rules.fontFamily = "Outfit";
      validatedScript.rules.backgroundStyle = "gradient-flow";
    }
  }

  console.log(`✅ [Penpod AI] Berhasil membuat skrip "${validatedScript.title}" dengan ${validatedScript.scenes.length} adegan (60 FPS) [Tema: ${validatedScript.rules.themePreset}, Bahasa: ${validatedScript.rules.language || 'id'}].`);

  // Synthesize Voiceover or integrate uploaded audio sample
  if (options.generateVoiceover !== false) {
    console.log(`\n🎙️ [Audio Engine] Menyiapkan audio & narasi suara per adegan...`);
    const finalScriptWithAudio = await generateSceneVoiceovers(
      validatedScript,
      options.voiceboxConfig,
      options.audioPromptPath,
      options.language
    );
    return finalScriptWithAudio;
  }

  return validatedScript;
};
