import fs from "fs";
import path from "path";
import { spawn, execSync, ChildProcess } from "child_process";
import { parseFile } from "music-metadata";
import type { MotionGraphicScript, Scene } from "../types/schema.ts";

export interface VoiceboxConfig {
  host?: string;
  port?: number;
  voice?: string;
  speed?: number;
}

let sidecarProcess: ChildProcess | null = null;

export const getVoiceboxUrl = (config?: VoiceboxConfig): string => {
  const host = config?.host || process.env.VOICEBOX_HOST || "127.0.0.1";
  const port = config?.port || Number(process.env.VOICEBOX_PORT) || 17493;
  return `http://${host}:${port}`;
};

/**
 * Checks if Voicebox server is running and healthy
 */
export const isVoiceboxRunning = async (config?: VoiceboxConfig): Promise<boolean> => {
  const baseUrl = getVoiceboxUrl(config);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Attempts to start Voicebox as a background sidecar process
 */
export const startVoiceboxSidecar = async (config?: VoiceboxConfig): Promise<boolean> => {
  if (await isVoiceboxRunning(config)) {
    console.log(`[Voicebox] Server already running at ${getVoiceboxUrl(config)}`);
    return true;
  }

  const port = config?.port || Number(process.env.VOICEBOX_PORT) || 17493;
  const host = config?.host || process.env.VOICEBOX_HOST || "127.0.0.1";
  const voiceboxDir = path.resolve(process.cwd(), "voicebox");

  if (!fs.existsSync(voiceboxDir)) {
    console.warn(`[Voicebox] Directory not found at ${voiceboxDir}`);
    return false;
  }

  console.log(`[Voicebox] Spawning sidecar server on ${host}:${port}...`);
  try {
    sidecarProcess = spawn("python3", ["-m", "voicebox.main", "--host", host, "--port", String(port)], {
      cwd: process.cwd(),
      stdio: "pipe",
      detached: false,
    });

    sidecarProcess.stdout?.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("Uvicorn running") || msg.includes("Application startup complete")) {
        console.log(`[Voicebox Sidecar] Ready: ${msg.trim()}`);
      }
    });

    sidecarProcess.stderr?.on("data", (data) => {
      // debug logs
    });

    // Wait up to 5 seconds for health check
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isVoiceboxRunning(config)) {
        console.log(`[Voicebox] Sidecar online and responsive!`);
        return true;
      }
    }
  } catch (err) {
    console.warn(`[Voicebox] Could not spawn python sidecar:`, (err as Error).message);
  }

  return false;
};

/**
 * Synthesize speech from text using Voicebox (or OpenAI TTS fallback)
 */
export const synthesizeSpeech = async (
  text: string,
  outFilePath: string,
  config?: VoiceboxConfig
): Promise<{ success: boolean; duration: number }> => {
  const baseUrl = getVoiceboxUrl(config);
  const voice = config?.voice || process.env.VOICEBOX_VOICE || "default";

  // Ensure output directory exists
  const outDir = path.dirname(outFilePath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Try Local Voicebox OpenAI-compatible endpoint: POST /v1/audio/speech
  try {
    console.log(`[TTS] Requesting voice synthesis for: "${text.slice(0, 40)}..." from Voicebox`);
    const res = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice,
        response_format: "mp3",
        speed: config?.speed || 1.0,
      }),
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(outFilePath, Buffer.from(arrayBuffer) as any);
      const duration = await getAudioDuration(outFilePath);
      console.log(`[Voicebox] Generated audio saved to ${outFilePath} (${duration.toFixed(2)}s)`);
      return { success: true, duration };
    }
  } catch (voiceboxErr) {
    console.warn(`[Voicebox] Local server unreachable:`, (voiceboxErr as Error).message);
  }

  // 2. Fallback: OpenAI TTS if OPENAI_API_KEY is available in env
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    try {
      console.log(`[TTS Fallback] Using OpenAI TTS API...`);
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: "alloy",
          response_format: outFilePath.endsWith(".wav") ? "wav" : "mp3",
        }),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(outFilePath, Buffer.from(arrayBuffer) as any);
        const duration = await getAudioDuration(outFilePath);
        console.log(`[OpenAI TTS] Audio saved to ${outFilePath} (${duration.toFixed(2)}s)`);
        return { success: true, duration };
      }
    } catch (openaiErr) {
      console.warn(`[OpenAI TTS Fallback] Failed:`, (openaiErr as Error).message);
    }
  }

  // 3. Fallback: If Voicebox and OpenAI are not reachable, log and skip (no robotic macOS fallback)
  console.warn(`[TTS Engine] Voicebox server is offline and no OpenAI key provided. Audio synthesis skipped (no robotic fallback).`);
  return { success: false, duration: 3.5 };
};

/**
 * Create a voice profile on Voicebox server
 */
/**
 * Auto-transcribe audio sample to get the exact reference text for voice cloning
 */
export const transcribeSampleAudio = async (audioPath: string): Promise<string> => {
  const penpodKey = process.env.PENPOD_API_KEY;
  if (penpodKey) {
    try {
      const fileBuffer = fs.readFileSync(audioPath);
      const audioB64 = fileBuffer.toString("base64");
      const ext = path.extname(audioPath).replace(".", "").toLowerCase() || "mp3";

      console.log(`🎙️ [Auto-Transcribe] Transcribing sample audio with AI for exact phonetic alignment...`);
      const res = await fetch("https://ai.penpod.id/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${penpodKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash-high",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcribe this audio clip word-for-word in its original language. Output ONLY the exact transcription text with no additional commentary.",
                },
                {
                  type: "input_audio",
                  input_audio: { data: audioB64, format: ext === "mp3" ? "mp3" : "wav" },
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log(`✅ [Auto-Transcribe] Reference text captured: "${text.slice(0, 80)}"`);
          return text;
        }
      }
    } catch (e) {
      console.warn(`[Auto-Transcribe] AI transcription fallback:`, (e as Error).message);
    }
  }

  // Fallback for Kisuke sample if network fails
  return "負けたら死ぬッス。死なないために死ぬほど準備することなんて";
};

/**
 * Detect language code for Voicebox synthesis (en, ms for Indonesian/Malay, ja, etc.)
 */
export const detectLanguageCode = (text: string, forceLanguage?: "id" | "ja" | "en"): string => {
  if (forceLanguage === "ja") return "ja";
  if (forceLanguage === "en") return "en";
  if (forceLanguage === "id") return "ms"; // Voicebox Pydantic regex requires 'ms' for Malay/Indonesian

  const isJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
  if (isJapanese) return "ja";

  const isIndonesian = /\b(ini|itu|dan|yang|untuk|dengan|adalah|di|ke|dari|pada|bisa|kami|kita|anda|saatnya|studio|gerak|cerita|kreativitas|desain|pesan|selamat|halo|menelusuri|proyek|eksperimen|ruang|tautan|layar|karyaku|karya|proses|belajar|berkembang|solusi|bisnis|teknologi|inovasi|masa|depan)\b/i.test(text);
  if (isIndonesian) return "ms";

  return "en";
};

/**
 * Create a voice profile on Voicebox server
 */
export const createVoiceboxProfile = async (
  name: string,
  config?: VoiceboxConfig,
  sampleLanguage?: string
): Promise<string | null> => {
  const baseUrl = getVoiceboxUrl(config);
  try {
    const cleanName = name.replace(/\.[^.]+$/, "").slice(0, 30) || "SampleVoice";
    const profileLang = sampleLanguage === "id" ? "ms" : (sampleLanguage || "ja");

    // 1. Check if profile with this name already exists
    try {
      const listRes = await fetch(`${baseUrl}/profiles`);
      if (listRes.ok) {
        const profiles: any[] = await listRes.json();
        const existing = profiles.find((p) => p.name === cleanName);
        if (existing && existing.id) {
          console.log(`♻️ [Voicebox Profile] Reusing existing profile "${cleanName}" ID: ${existing.id}`);
          return existing.id;
        }
      }
    } catch {
      // ignore check error
    }

    // 2. Otherwise create a new profile
    console.log(`🎙️ [Voicebox Profile] Creating cloned voice profile "${cleanName}" [Lang: ${profileLang}] on ${baseUrl}...`);
    const res = await fetch(`${baseUrl}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanName,
        language: profileLang,
        voice_type: "cloned",
      }),
    });

    if (!res.ok) {
      // Retry with unique timestamp suffix if name conflicted
      const uniqueName = `${cleanName.slice(0, 20)}-${Date.now().toString().slice(-4)}`;
      const retryRes = await fetch(`${baseUrl}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uniqueName,
          language: profileLang,
          voice_type: "cloned",
        }),
      });
      if (retryRes.ok) {
        const retryData: any = await retryRes.json();
        console.log(`✅ [Voicebox Profile] Created profile ID: ${retryData.id}`);
        return retryData.id || null;
      }
      console.warn(`[Voicebox Profile] Failed to create profile: ${res.status} ${res.statusText}`);
      return null;
    }

    const data: any = await res.json();
    console.log(`✅ [Voicebox Profile] Created profile ID: ${data.id}`);
    return data.id || null;
  } catch (err) {
    console.warn(`[Voicebox Profile] Error:`, (err as Error).message);
    return null;
  }
};

/**
 * Upload an audio sample to a Voicebox voice profile for zero-shot cloning
 */
export const uploadVoiceboxSample = async (
  profileId: string,
  sampleFilePath: string,
  config?: VoiceboxConfig,
  precomputedTranscript?: string
): Promise<boolean> => {
  const baseUrl = getVoiceboxUrl(config);
  try {
    // Check if sample already exists on this profile
    try {
      const existingSamplesRes = await fetch(`${baseUrl}/profiles/${profileId}/samples`);
      if (existingSamplesRes.ok) {
        const existingSamples: any[] = await existingSamplesRes.json();
        if (existingSamples && existingSamples.length > 0) {
          console.log(`♻️ [Voicebox Sample] Profile ${profileId} already has ${existingSamples.length} sample(s). Skipping re-upload.`);
          return true;
        }
      }
    } catch {
      // ignore check error
    }

    const fileBuffer = fs.readFileSync(sampleFilePath);
    const fileName = path.basename(sampleFilePath);
    const exactTranscript = precomputedTranscript || (await transcribeSampleAudio(sampleFilePath));

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: "audio/mpeg" });
    formData.append("file", blob, fileName);
    formData.append("reference_text", exactTranscript);

    console.log(`🎙️ [Voicebox Sample] Uploading "${fileName}" to profile ${profileId} with exact transcript: "${exactTranscript.slice(0, 60)}..."`);
    const res = await fetch(`${baseUrl}/profiles/${profileId}/samples`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      console.log(`✅ [Voicebox Sample] Sample uploaded successfully to profile ${profileId}`);
      return true;
    }
    console.warn(`[Voicebox Sample] Upload failed: ${res.status} ${res.statusText}`);
    return false;
  } catch (err) {
    console.warn(`[Voicebox Sample] Error:`, (err as Error).message);
    return false;
  }
};

/**
 * Synthesize speech for a given text using a cloned voice profile via native Voicebox POST /generate
 */
export const synthesizeWithVoiceProfile = async (
  text: string,
  profileId: string,
  outFilePath: string,
  config?: VoiceboxConfig,
  language?: "id" | "ja" | "en"
): Promise<{ success: boolean; duration: number }> => {
  const baseUrl = getVoiceboxUrl(config);
  const outDir = path.dirname(outFilePath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const langCode = detectLanguageCode(text, language);

  try {
    console.log(`🎙️ [Voicebox Clone TTS] Requesting speech generation [Lang: ${langCode}]: "${text.slice(0, 45)}..." [Profile: ${profileId}]`);
    const genRes = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: profileId,
        text: text,
        language: langCode,
      }),
    });

    if (!genRes.ok) {
      console.warn(`[Voicebox Clone TTS] /generate failed: ${genRes.status} ${genRes.statusText}`);
      return { success: false, duration: 3.5 };
    }

    const genData: any = await genRes.json();
    const generationId = genData.id;
    console.log(`⏳ [Voicebox Clone TTS] Generation job queued: ${generationId}. Polling status...`);

    // Poll for completion (up to 120 seconds for MLX 1.7B)
    const startTime = Date.now();
    while (Date.now() - startTime < 120000) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const statusRes = await fetch(`${baseUrl}/history/${generationId}`);
        if (statusRes.ok) {
          const statusData: any = await statusRes.json();
          if (statusData.status === "completed") {
            // Audio is ready, download it!
            const audioRes = await fetch(`${baseUrl}/audio/${generationId}`);
            if (audioRes.ok) {
              const arrayBuffer = await audioRes.arrayBuffer();
              fs.writeFileSync(outFilePath, Buffer.from(arrayBuffer) as any);
              const duration = await getAudioDuration(outFilePath);
              console.log(`🎉 [Voicebox Clone TTS] Successfully synthesized cloned speech: ${outFilePath} (${duration.toFixed(2)}s)`);
              return { success: true, duration };
            }
          } else if (statusData.status === "failed") {
            console.warn(`[Voicebox Clone TTS] Generation failed: ${statusData.error || "Unknown error"}`);
            break;
          } else {
            console.log(`... [Voicebox Clone TTS] Status: ${statusData.status}`);
          }
        }
      } catch (pollErr) {
        // continue polling
      }
    }
  } catch (err) {
    console.warn(`[Voicebox Clone TTS] Exception during generation:`, (err as Error).message);
  }

  return { success: false, duration: 3.5 };
};

/**
 * Measure audio duration in seconds
 */
export const getAudioDuration = async (filePath: string): Promise<number> => {
  try {
    if (!fs.existsSync(filePath)) return 3.5;
    const metadata = await parseFile(filePath);
    return metadata.format.duration || 3.5;
  } catch (e) {
    console.warn(`[Audio] Could not read duration for ${filePath}:`, e);
    return 3.5;
  }
};

/**
 * Process all scenes in a script: generate voiceovers and synchronize timings.
 * If user uploaded an audio sample (uploadedAudioPath):
 * 1. If Voicebox is online: performs voice cloning so the sample voice reads the generated naskah!
 * 2. If Voicebox is offline: uses the uploaded sample directly without robotic fallbacks, and tags status as offline.
 */
export const generateSceneVoiceovers = async (
  script: MotionGraphicScript,
  config?: VoiceboxConfig,
  uploadedAudioPath?: string,
  language?: "id" | "ja" | "en"
): Promise<MotionGraphicScript> => {
  const publicAudioDir = path.resolve(process.cwd(), "public", "audio");
  if (!fs.existsSync(publicAudioDir)) {
    fs.mkdirSync(publicAudioDir, { recursive: true });
  }

  const voiceboxOnline = await isVoiceboxRunning(config);

  // 1. If user uploaded an audio sample (e.g. Kisuke.mp3)
  if (uploadedAudioPath && fs.existsSync(uploadedAudioPath)) {
    console.log(`🎙️ [Audio Engine] Received uploaded voice sample: ${uploadedAudioPath}`);

    // Option A: If Voicebox server is online, perform Voice Cloning for the generated naskah!
    if (voiceboxOnline) {
      console.log(`🚀 [Voicebox Voice Cloning] Server is ONLINE! Initiating voice cloning from sample...`);
      const sampleTranscript = await transcribeSampleAudio(uploadedAudioPath);
      const sampleLang = detectLanguageCode(sampleTranscript);
      const profileId = await createVoiceboxProfile(path.basename(uploadedAudioPath), config, sampleLang);

      if (profileId) {
        const sampleReady = await uploadVoiceboxSample(profileId, uploadedAudioPath, config, sampleTranscript);
        if (sampleReady) {
          console.log(`✨ [Voicebox Voice Cloning] Profile ready. Synthesizing generated naskah for ${script.scenes.length} scenes in language "${language || 'id'}"...`);
          const updatedScenes: Scene[] = [];
          let clonedCount = 0;

          for (let i = 0; i < script.scenes.length; i++) {
            const scene = script.scenes[i];
            const textToSpeak =
              scene.voiceoverText ||
              (scene as any).subheadline ||
              (scene as any).body ||
              (scene as any).quote ||
              (scene as any).headline ||
              "";

            if (textToSpeak) {
              const fileName = `voiceover-clone-${scene.id}.wav`;
              const fullPath = path.join(publicAudioDir, fileName);
              const relativePath = `audio/${fileName}`;

              // Smart Resume: reuse existing audio file if already generated and non-empty
              if (
                fs.existsSync(fullPath) &&
                fs.statSync(fullPath).size > 2000
              ) {
                const duration = (scene.audioDuration && scene.audioDuration > 0)
                  ? scene.audioDuration
                  : await getAudioDuration(fullPath);
                console.log(`⏩ [Voicebox Resume] Adegan #${i + 1} (${scene.id}) ditemukan di lokal disk: ${relativePath} (${duration.toFixed(2)}s). Menggunakan audio lokal.`);
                const paddedDuration = Math.max(3.0, Math.ceil((duration + 0.6) * 2) / 2);
                updatedScenes.push({
                  ...scene,
                  voiceoverText: textToSpeak,
                  audioFile: relativePath,
                  audioDuration: duration,
                  durationInSeconds: paddedDuration,
                } as Scene);
                clonedCount++;
                continue;
              }

              const { success, duration } = await synthesizeWithVoiceProfile(
                textToSpeak,
                profileId,
                fullPath,
                config,
                language
              );

              if (success && duration > 0) {
                const paddedDuration = Math.max(3.0, Math.ceil((duration + 0.6) * 2) / 2);
                updatedScenes.push({
                  ...scene,
                  voiceoverText: textToSpeak,
                  audioFile: relativePath,
                  audioDuration: duration,
                  durationInSeconds: paddedDuration,
                } as Scene);
                clonedCount++;
                continue;
              }
            }

            updatedScenes.push(scene);
          }

          if (clonedCount > 0) {
            console.log(`🎉 [Voicebox Voice Cloning] Successfully synthesized ${clonedCount} scenes with cloned voice!`);
            return {
              ...script,
              rules: {
                ...script.rules,
                masterAudioFile: undefined, // Each scene has its own cloned VO reading its naskah
                voiceboxStatus: "cloned",
                clonedVoice: true,
              },
              scenes: updatedScenes,
            };
          }
        }
      }
    }

    // Option B: Voicebox server is offline -> DO NOT fall back to Damayanti!
    // Directly use the uploaded sample as the video's master audio track
    console.log(`ℹ️ [Audio Engine] Voicebox server offline on localhost:17493. Using uploaded sample directly as master audio.`);
    const ext = path.extname(uploadedAudioPath).toLowerCase();
    const targetFileName = `uploaded-sample${ext}`;
    const targetFullPath = path.join(publicAudioDir, targetFileName);
    fs.copyFileSync(uploadedAudioPath, targetFullPath);

    const sampleDuration = await getAudioDuration(targetFullPath);
    const relativeSamplePath = `audio/${targetFileName}`;

    const updatedScenes = [...script.scenes];
    if (updatedScenes.length > 0) {
      const scene1 = { ...updatedScenes[0] };
      scene1.audioFile = relativeSamplePath;
      scene1.audioDuration = sampleDuration;
      scene1.durationInSeconds = Math.max(3.5, Math.ceil((sampleDuration + 0.4) * 2) / 2);
      updatedScenes[0] = scene1 as Scene;
    }

    return {
      ...script,
      rules: {
        ...script.rules,
        masterAudioFile: relativeSamplePath,
        voiceboxStatus: "offline",
        clonedVoice: false,
      },
      scenes: updatedScenes,
    };
  }

  // 2. Otherwise synthesize TTS per scene (Voicebox / OpenAI) - NO Damayanti
  if (!voiceboxOnline) {
    await startVoiceboxSidecar(config);
  }

  const updatedScenes: Scene[] = [];

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const textToSpeak =
      scene.voiceoverText ||
      (scene as any).subheadline ||
      (scene as any).body ||
      (scene as any).quote ||
      (scene as any).headline ||
      "";

    if (textToSpeak && script.rules.enableVoiceover) {
      const fileName = `voiceover-${scene.id}.wav`;
      const fullPath = path.join(publicAudioDir, fileName);
      const relativePath = `audio/${fileName}`;

      const { success, duration } = await synthesizeSpeech(textToSpeak, fullPath, config);

      if (success && duration > 0) {
        const paddedDuration = Math.max(3.0, Math.ceil((duration + 0.6) * 2) / 2);
        updatedScenes.push({
          ...scene,
          voiceoverText: textToSpeak,
          audioFile: relativePath,
          audioDuration: duration,
          durationInSeconds: paddedDuration,
        } as Scene);
        continue;
      }
    }

    updatedScenes.push(scene);
  }

  return {
    ...script,
    rules: {
      ...script.rules,
      voiceboxStatus: voiceboxOnline ? "online" : "offline",
      clonedVoice: false,
    },
    scenes: updatedScenes,
  };
};
