#!/usr/bin/env node

/**
 * 🎨 MotionForge AI Web Studio Server (Port 3001)
 * Provides Web Interface for typing prompts, uploading sample voice notes,
 * choosing AI models from Penpod, and triggering 60 FPS motion graphic generation.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

import { generateMotionGraphicFromAI } from "../src/ai/gemini-agent.ts";
import { PENPOD_MODELS, getDefaultModelId, resolveModelId } from "../src/ai/models.ts";
import {
  isVoiceboxRunning,
  startVoiceboxSidecar,
  generateSceneVoiceovers,
  transcribeSampleAudio,
  detectLanguageCode,
  createVoiceboxProfile,
  uploadVoiceboxSample,
  synthesizeWithVoiceProfile,
  synthesizeSpeech,
  getAudioDuration
} from "../src/ai/voicebox-service.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const port = process.env.UI_PORT || 3001;
let lastRenderStatus = { status: "idle" };

// Detect if a fresh rendered MP4 exists in out/ (must be newer than latest script & cloned voiceovers)
try {
  const initialOutDir = path.join(rootDir, "out");
  const latestScriptPath = path.join(rootDir, "scripts", "latest-generated-script.json");
  const scriptMtime = fs.existsSync(latestScriptPath) ? fs.statSync(latestScriptPath).mtimeMs : 0;

  if (fs.existsSync(initialOutDir)) {
    const existingMp4s = fs.readdirSync(initialOutDir)
      .filter((f) => f.endsWith(".mp4"))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(initialOutDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (existingMp4s.length > 0 && existingMp4s[0].time >= scriptMtime) {
      lastRenderStatus = {
        status: "completed",
        videoUrl: `/out/${existingMp4s[0].name}`,
        outFileName: existingMp4s[0].name,
      };
    }
  }
} catch (e) {
  // ignore
}

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/m4a",
  ".mp4": "video/mp4",
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
};

const sendFile = (res, filePath, contentType) => {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType || "application/octet-stream",
    "Content-Length": stat.size,
    "Access-Control-Allow-Origin": "*",
  });
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};

const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        // 50MB limit
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
};

const server = http.createServer(async (req, res) => {
  // Always hot-reload .env on every incoming request so changes to .env take effect immediately
  dotenv.config({ override: true });

  const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = reqUrl.pathname;

  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // Handle Favicon
  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }

  // 1. API: Get AI Models
  if (req.method === "GET" && pathname === "/api/models") {
    return sendJson(res, 200, {
      models: PENPOD_MODELS,
      defaultModel: getDefaultModelId(),
      hasPenpodKey: Boolean(process.env.PENPOD_API_KEY),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  // 2. API: Get Voicebox & Remotion Status
  if (req.method === "GET" && pathname === "/api/status") {
    const voiceboxOnline = await isVoiceboxRunning();
    return sendJson(res, 200, {
      voiceboxOnline,
      remotionStudioPort: 3000,
      uiPort: port,
      defaultModel: getDefaultModelId(),
    });
  }

  // 3. API: Get Latest Script (with automatic local audio file scanning & syncing!)
  if (req.method === "GET" && pathname === "/api/latest") {
    const latestPath = path.join(rootDir, "scripts", "latest-generated-script.json");
    if (fs.existsSync(latestPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
        const publicAudioDir = path.join(rootDir, "public", "audio");

        let hasClonedVoice = false;
        if (data.scenes && Array.isArray(data.scenes)) {
          for (let i = 0; i < data.scenes.length; i++) {
            const scene = data.scenes[i];
            const cloneWav = `voiceover-clone-${scene.id}.wav`;
            const cloneFullPath = path.join(publicAudioDir, cloneWav);

            if (fs.existsSync(cloneFullPath) && fs.statSync(cloneFullPath).size > 2000) {
              scene.audioFile = `audio/${cloneWav}`;
              if (!scene.audioDuration || scene.audioDuration <= 0) {
                const dur = await getAudioDuration(cloneFullPath);
                scene.audioDuration = dur;
                scene.durationInSeconds = Math.max(3.0, Math.ceil((dur + 0.6) * 2) / 2);
              }
              hasClonedVoice = true;
            } else if (
              scene.audioFile &&
              scene.audioFile.includes("uploaded-sample")
            ) {
              scene.audioFile = "";
              scene.audioDuration = 0;
            } else if (
              scene.audioFile &&
              !scene.audioFile.includes("uploaded-sample") &&
              fs.existsSync(path.join(rootDir, "public", scene.audioFile.replace(/^\/+/, "")))
            ) {
              hasClonedVoice = true;
            }
          }
        }

        // If cloned voice files exist on local disk, clear masterAudioFile so it doesn't play raw sample!
        if (hasClonedVoice && data.rules) {
          delete data.rules.masterAudioFile;
          data.rules.clonedVoice = true;
          data.rules.voiceboxStatus = "cloned";
        }

        fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
        return sendJson(res, 200, data);
      } catch (e) {
        return sendJson(res, 500, { error: "Failed to read latest script" });
      }
    }
    return sendJson(res, 404, { error: "No script generated yet" });
  }

  // 4. API: Generate Motion Graphic
  if (req.method === "POST" && pathname === "/api/generate") {
    try {
      const payload = await parseJsonBody(req);
      const { prompt, model, aspectRatio, themePreset, language, audioBase64, audioName } = payload;

      if (!prompt && !audioBase64) {
        return sendJson(res, 400, { error: "Prompt text or audio file is required." });
      }

      // Check audio upload
      let audioPromptPath = undefined;
      if (audioBase64) {
        const tempDir = path.join(rootDir, "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const ext = path.extname(audioName || "voice.wav") || ".wav";
        const tempFileName = `upload-prompt-${Date.now()}${ext}`;
        audioPromptPath = path.join(tempDir, tempFileName);

        // Strip data:audio/...;base64, prefix if present
        const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");
        fs.writeFileSync(audioPromptPath, Buffer.from(cleanBase64, "base64"));
        console.log(`🎙️ [Web UI] Received audio prompt: ${audioPromptPath}`);
      }

      const chosenModel = model ? resolveModelId(model) : getDefaultModelId();
      const chosenLang = language && ["id", "ja", "en"].includes(language) ? language : "id";
      console.log(`\n🚀 [Web UI] Starting generation with model "${chosenModel}" [Language: ${chosenLang}]...`);
      console.log(`💬 [Web UI] Prompt: ${prompt || "(From Voice File)"}`);

      // Ensure Voicebox sidecar is running
      const voiceboxOnline = await isVoiceboxRunning();
      if (!voiceboxOnline) {
        console.log(`🟡 [Web UI] Voicebox offline, starting background sidecar...`);
        await startVoiceboxSidecar();
      }

      // Check if user explicitly asked for auto full neural cloning upfront
      const shouldAutoVoiceover = payload.autoVoiceover === true;
      console.log(`🎙️ [Web UI] Mode Voiceover: ${shouldAutoVoiceover ? "Full Auto Cloning Upfront" : "Fast Draft Storyboard (On-demand Voice)"}`);

      // Generate Motion Graphic Script (Instant ~2s if autoVoiceover is false)
      const script = await generateMotionGraphicFromAI({
        prompt: prompt || (themePreset ? `Video tema ${themePreset}` : undefined),
        audioPromptPath,
        model: chosenModel,
        themePreset,
        language: chosenLang,
        apiKey: process.env.PENPOD_API_KEY,
        generateVoiceover: shouldAutoVoiceover,
      });

      // If user uploaded an audio sample and hasn't run full neural cloning yet, attach sample directly (Instant 0s!)
      if (!shouldAutoVoiceover && audioPromptPath && fs.existsSync(audioPromptPath)) {
        const publicAudioDir = path.join(rootDir, "public", "audio");
        if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });
        const ext = path.extname(audioPromptPath).toLowerCase();
        const targetFileName = `uploaded-sample${ext}`;
        const targetFullPath = path.join(publicAudioDir, targetFileName);
        fs.copyFileSync(audioPromptPath, targetFullPath);
        const relativeSamplePath = `audio/${targetFileName}`;
        if (!script.rules) script.rules = {};
        script.rules.masterAudioFile = relativeSamplePath;
        if (script.scenes && script.scenes.length > 0 && !script.scenes[0].audioFile) {
          script.scenes[0].audioFile = relativeSamplePath;
        }
      }

      // Override themePreset explicitly
      if (themePreset && ["cyber-neon", "modern-dark", "luxury-gold", "clean-saas", "sunset-flare"].includes(themePreset)) {
        if (!script.rules) script.rules = {};
        script.rules.themePreset = themePreset;
      }

      // Override aspect ratio if user selected one
      if (aspectRatio && (aspectRatio === "16:9" || aspectRatio === "9:16" || aspectRatio === "1:1")) {
        script.aspectRatio = aspectRatio;
      }

      // Save to latest-generated-script.json
      const latestPath = path.join(rootDir, "scripts", "latest-generated-script.json");
      fs.writeFileSync(latestPath, JSON.stringify(script, null, 2));

      // Auto-render to MP4 at 60 FPS ONLY IF explicitly requested (validation first is default!)
      let videoUrl = null;
      let outFileName = null;

      if (payload.autoRender === true) {
        console.log(`🎬 [Web UI] Auto-rendering video to MP4 at 60 FPS...`);
        const safeTitle = (script.title || "motion-graphic")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `motion-graphic-cloned-${Date.now()}`;
        const outDir = path.join(rootDir, "out");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        outFileName = `${safeTitle}-60fps.mp4`;
        const outMp4Path = path.join(outDir, outFileName);

        const compId = "AIMotionGraphic";
        if (script.rules) {
          delete script.rules.masterAudioFile;
        }
        fs.writeFileSync(latestPath, JSON.stringify(script, null, 2));
        const cmd = `npx remotion render src/index.ts ${compId} "${outMp4Path}" --props="${latestPath}"`;

        await new Promise((resolve) => {
          exec(cmd, (err) => {
            if (err) {
              console.error("Auto-render failed:", err);
              resolve(null);
            } else {
              console.log(`🎉 [Web UI] Auto-render complete: ${outMp4Path}`);
              videoUrl = `/out/${outFileName}`;
              lastRenderStatus = {
                status: "completed",
                videoUrl,
                outFileName,
              };
              resolve(outFileName);
            }
          });
        });
      }

      return sendJson(res, 200, {
        success: true,
        script,
        videoUrl,
        outFileName,
        message: videoUrl 
          ? "Video MP4 60 FPS berhasil dibuat dan dirender!" 
          : "Skrip motion graphic berhasil dibuat!",
      });
    } catch (err) {
      console.error("❌ [Web UI] Generation error:", err);
      return sendJson(res, 500, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 4b. API: Update script from validation review
  if (req.method === "POST" && pathname === "/api/script/update") {
    try {
      const payload = await parseJsonBody(req);
      if (!payload.script) {
        return sendJson(res, 400, { error: "Missing script data." });
      }
      const latestPath = path.join(rootDir, "scripts", "latest-generated-script.json");
      fs.writeFileSync(latestPath, JSON.stringify(payload.script, null, 2));
      return sendJson(res, 200, { success: true, script: payload.script });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 4c. API: Resume / Regenerate Voiceovers for existing script
  if (req.method === "POST" && pathname === "/api/voice/regenerate") {
    try {
      const payload = await parseJsonBody(req).catch(() => ({}));
      const latestPath = path.join(rootDir, "scripts", "latest-generated-script.json");

      let script = payload.script;
      if (!script && fs.existsSync(latestPath)) {
        script = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
      }
      if (!script) {
        return sendJson(res, 400, { error: "Tidak ada skrip yang ditemukan untuk di-resume voiceover-nya." });
      }

      // Find uploaded sample if any
      let samplePath = undefined;
      if (payload.audioBase64) {
        const tempDir = path.join(rootDir, "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const ext = path.extname(payload.audioName || "voice.wav") || ".wav";
        samplePath = path.join(tempDir, `sample-resume-${Date.now()}${ext}`);
        const cleanBase64 = payload.audioBase64.replace(/^data:[^;]+;base64,/, "");
        fs.writeFileSync(samplePath, Buffer.from(cleanBase64, "base64"));
      } else {
        const tempDir = path.join(rootDir, "temp");
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir).filter((f) => f.startsWith("upload-prompt-") || f.startsWith("sample-"));
          if (files.length > 0) {
            files.sort((a, b) => fs.statSync(path.join(tempDir, b)).mtimeMs - fs.statSync(path.join(tempDir, a)).mtimeMs);
            samplePath = path.join(tempDir, files[0]);
          }
        }
        if (!samplePath) {
          const publicSample = path.join(rootDir, "public", "audio", "uploaded-sample.mp3");
          if (fs.existsSync(publicSample)) samplePath = publicSample;
        }
      }

      const lang = payload.language || script.rules?.language || "id";
      console.log(`🎙️ [Web UI] Resuming Voiceover for "${script.title}" (Lang: ${lang}, Sample: ${samplePath || 'None'})...`);

      // Ensure Voicebox sidecar is running
      const voiceboxOnline = await isVoiceboxRunning();
      if (!voiceboxOnline) {
        await startVoiceboxSidecar();
      }

      const updatedScript = await generateSceneVoiceovers(
        script,
        undefined,
        samplePath,
        lang
      );

      fs.writeFileSync(latestPath, JSON.stringify(updatedScript, null, 2));
      return sendJson(res, 200, { success: true, script: updatedScript });
    } catch (err) {
      console.error("❌ [Web UI] Resume voiceover error:", err);
      return sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  // 4d. API: Generate voice for an individual scene on-demand (Fast ~10-15s!)
  if (req.method === "POST" && pathname === "/api/voice/scene") {
    try {
      const payload = await parseJsonBody(req);
      const { sceneIndex, text, language } = payload;
      const latestPath = path.join(rootDir, "scripts", "latest-generated-script.json");
      if (!fs.existsSync(latestPath)) {
        return sendJson(res, 400, { error: "Belum ada naskah yang tersimpan." });
      }

      const script = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
      if (!script.scenes || !script.scenes[sceneIndex]) {
        return sendJson(res, 400, { error: "Adegan tidak ditemukan." });
      }

      const scene = script.scenes[sceneIndex];
      const textToSpeak = text || scene.voiceoverText || scene.headline || "";
      if (!textToSpeak) {
        return sendJson(res, 400, { error: "Teks narasi kosong." });
      }

      // Check uploaded sample
      let samplePath = undefined;
      const tempDir = path.join(rootDir, "temp");
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir).filter((f) => f.startsWith("upload-prompt-") || f.startsWith("sample-"));
        if (files.length > 0) {
          files.sort((a, b) => fs.statSync(path.join(tempDir, b)).mtimeMs - fs.statSync(path.join(tempDir, a)).mtimeMs);
          samplePath = path.join(tempDir, files[0]);
        }
      }
      if (!samplePath) {
        const publicSample = path.join(rootDir, "public", "audio", "uploaded-sample.mp3");
        if (fs.existsSync(publicSample)) samplePath = publicSample;
      }

      const publicAudioDir = path.join(rootDir, "public", "audio");
      if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });

      const fileName = `voiceover-clone-${scene.id}.wav`;
      const fullPath = path.join(publicAudioDir, fileName);
      const relativePath = `audio/${fileName}`;

      const voiceboxOnline = await isVoiceboxRunning();
      if (!voiceboxOnline) await startVoiceboxSidecar();

      const lang = language || script.rules?.language || "id";
      console.log(`🎙️ [Web UI] Synthesizing single scene #${sceneIndex + 1} (${scene.id}): "${textToSpeak.slice(0, 40)}..." [Lang: ${lang}]`);

      let profileId = null;
      if (samplePath && fs.existsSync(samplePath)) {
        const sampleTranscript = await transcribeSampleAudio(samplePath);
        const sampleLang = detectLanguageCode(sampleTranscript);
        profileId = await createVoiceboxProfile(path.basename(samplePath), undefined, sampleLang);
        if (profileId) {
          await uploadVoiceboxSample(profileId, samplePath, undefined, sampleTranscript);
        }
      }

      let resSynth;
      if (profileId) {
        resSynth = await synthesizeWithVoiceProfile(textToSpeak, profileId, fullPath, undefined, lang);
      } else {
        resSynth = await synthesizeSpeech(textToSpeak, fullPath);
      }

      if (resSynth.success && resSynth.duration > 0) {
        scene.voiceoverText = textToSpeak;
        scene.audioFile = relativePath;
        scene.audioDuration = resSynth.duration;
        scene.durationInSeconds = Math.max(3.0, Math.ceil((resSynth.duration + 0.6) * 2) / 2);

        // Sync other scenes that already have cloned voice files in public/audio
        if (script.scenes && Array.isArray(script.scenes)) {
          for (const s of script.scenes) {
            const cloneWav = `voiceover-clone-${s.id}.wav`;
            const cPath = path.join(publicAudioDir, cloneWav);
            if (fs.existsSync(cPath) && fs.statSync(cPath).size > 2000) {
              s.audioFile = `audio/${cloneWav}`;
            } else if (s.audioFile && s.audioFile.includes("uploaded-sample")) {
              s.audioFile = "";
            }
          }
        }

        if (script.rules) {
          delete script.rules.masterAudioFile;
          script.rules.clonedVoice = true;
          script.rules.voiceboxStatus = "cloned";
        }

        fs.writeFileSync(latestPath, JSON.stringify(script, null, 2));
        return sendJson(res, 200, { success: true, scene, script });
      }

      return sendJson(res, 500, { error: "Gagal membuat audio untuk adegan ini." });
    } catch (err) {
      console.error("Single scene voice synthesis error:", err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 5. API: Render MP4 with status tracking
  if (req.method === "POST" && pathname === "/api/render") {
    try {
      const latestPath = path.join(rootDir, "scripts", "latest-generated-script.json");
      if (!fs.existsSync(latestPath)) {
        return sendJson(res, 400, { error: "No generated script found to render." });
      }

      const script = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
      const safeTitle = (script.title || "motion-graphic")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `motion-graphic-cloned-${Date.now()}`;
      const outDir = path.join(rootDir, "out");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const outFileName = `${safeTitle}-60fps.mp4`;
      const outMp4Path = path.join(outDir, outFileName);

      const compId = "AIMotionGraphic";
      if (script.rules) {
        delete script.rules.masterAudioFile;
      }
      fs.writeFileSync(latestPath, JSON.stringify(script, null, 2));
      const cmd = `npx remotion render src/index.ts ${compId} "${outMp4Path}" --props="${latestPath}"`;

      console.log(`🎬 [Web UI] Rendering MP4 at 60 FPS: ${cmd}`);

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("Render failed:", error);
          lastRenderStatus = { status: "error", error: error.message };
          return;
        }
        console.log(`🎉 [Web UI] Render completed: ${outMp4Path}`);
        lastRenderStatus = {
          status: "completed",
          videoUrl: `/out/${outFileName}`,
          outFileName,
        };
      });

      lastRenderStatus = { status: "rendering", outFileName };

      return sendJson(res, 200, {
        success: true,
        rendering: true,
        outputFileName: outFileName,
        videoUrl: `/out/${outFileName}`,
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err) });
    }
  }

  // 5b. API: Render status polling
  if (req.method === "GET" && pathname === "/api/render/status") {
    return sendJson(res, 200, lastRenderStatus);
  }

  // 6. Serve static video files from /out/
  if (pathname.startsWith("/out/") || pathname.endsWith(".mp4")) {
    const cleanPath = pathname.startsWith("/out/") ? pathname.slice(5) : pathname.replace(/^\/+/, "");
    const outPath = path.join(rootDir, "out", cleanPath);
    if (fs.existsSync(outPath)) {
      return sendFile(res, outPath, "video/mp4");
    }
  }

  // 7. Serve static audio files from /public/ or root
  if (pathname.startsWith("/public/") || pathname.startsWith("/audio/") || pathname.startsWith("/voiceover-") || pathname.endsWith(".mp3") || pathname.endsWith(".wav") || pathname.endsWith(".m4a")) {
    let cleanPath = pathname;
    if (cleanPath.startsWith("/public/")) cleanPath = cleanPath.slice(8);
    else if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

    let publicPath = path.join(rootDir, "public", cleanPath);
    if (!fs.existsSync(publicPath) && !cleanPath.startsWith("audio/")) {
      const altPath = path.join(rootDir, "public", "audio", path.basename(cleanPath));
      if (fs.existsSync(altPath)) publicPath = altPath;
    }

    if (fs.existsSync(publicPath)) {
      const ext = path.extname(publicPath).toLowerCase();
      return sendFile(res, publicPath, MIME_TYPES[ext] || "application/octet-stream");
    }
  }

  // 7. Serve Web UI
  if (pathname === "/" || pathname === "/index.html") {
    const htmlPath = path.join(rootDir, "src", "ui", "index.html");
    return sendFile(res, htmlPath, "text/html; charset=UTF-8");
  }

  // Fallback 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(port, () => {
  console.log(`\n============================================================`);
  console.log(`🎨 MotionForge AI Web Studio is RUNNING!`);
  console.log(`============================================================`);
  console.log(`👉 Buka Web Studio di Browser:   http://localhost:${port}`);
  console.log(`👉 Remotion Studio 60 FPS:       http://localhost:3000`);
  console.log(`============================================================\n`);
});
