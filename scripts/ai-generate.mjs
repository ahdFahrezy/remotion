#!/usr/bin/env node

/**
 * 🤖 AI Prompt to Motion Graphics Generator (60 FPS + Voicebox Audio)
 * Usage:
 *   node scripts/ai-generate.mjs --prompt "Buatkan video promosi peluncuran AI platform 60 FPS"
 *   node scripts/ai-generate.mjs --voice path/to/my-voice-note.m4a
 *   node scripts/ai-generate.mjs --prompt "..." --render
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import { generateMotionGraphicFromAI } from "../src/ai/gemini-agent.ts";
import { isVoiceboxRunning, startVoiceboxSidecar } from "../src/ai/voicebox-service.ts";
import { PENPOD_MODELS, getDefaultModelId, resolveModelId } from "../src/ai/models.ts";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {
    prompt: "",
    voicePath: "",
    model: "",
    render: false,
    out: "",
    help: false,
    listModels: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") {
      result.help = true;
    } else if (args[i] === "--list-models" || args[i] === "--models") {
      result.listModels = true;
    } else if (args[i] === "--prompt" || args[i] === "-p") {
      result.prompt = args[++i] || "";
    } else if (args[i] === "--voice" || args[i] === "-v") {
      result.voicePath = args[++i] || "";
    } else if (args[i] === "--model" || args[i] === "-m") {
      result.model = args[++i] || "";
    } else if (args[i] === "--render" || args[i] === "-r") {
      result.render = true;
    } else if (args[i] === "--out" || args[i] === "-o") {
      result.out = args[++i] || "";
    } else if (!result.prompt && !args[i].startsWith("-")) {
      result.prompt = args[i];
    }
  }

  return result;
};

const askQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

const promptInteractiveFlow = async (defaultModel) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log(`\n============================================================`);
    console.log(`✨ Remotion AI Motion Graphic Generator (60 FPS)`);
    console.log(`============================================================`);

    const userPrompt = await askQuestion(rl, `💬 Ketik prompt ide video Anda: `);
    if (!userPrompt) {
      console.log(`❌ Prompt tidak boleh kosong.`);
      process.exit(1);
    }

    console.log(`\n🤖 Pilih Model AI Penpod:`);
    PENPOD_MODELS.forEach((m, idx) => {
      const isDefault = m.id === defaultModel;
      const tagStr = m.tags.join(", ");
      const badge = m.badge ? ` ${m.badge}` : "";
      const mark = isDefault ? " 👈 [DEFAULT .env]" : "";
      console.log(`   [${idx + 1}] ${m.name} (${m.id})${badge}${mark}`);
      console.log(`       ↳ ${m.description} | ${m.pricing}`);
    });

    const modelChoice = await askQuestion(
      rl,
      `\nPilih nomor [1-${PENPOD_MODELS.length}] atau ENTER untuk default (${defaultModel}): `
    );

    const selectedModel = modelChoice ? resolveModelId(modelChoice) : defaultModel;

    return { userPrompt, selectedModel };
  } finally {
    rl.close();
  }
};

async function main() {
  const args = parseArgs();
  const defaultModel = getDefaultModelId();

  if (args.help) {
    console.log(`
🎬 Remotion AI Motion Graphic Generator (60 FPS)
Penggunaan:
  npm run ai                                     # Mode interaktif (tanya prompt & pilih model)
  npm run ai -- --prompt "Ide video Anda"         # Langsung gunakan prompt teks
  npm run ai -- --voice path/to/voice-note.m4a    # Gunakan file rekaman suara
  npm run ai -- --model claude-opus-4-6-thinking  # Pilih model spesifik
  npm run ai -- --models                         # Lihat daftar semua model Penpod
  npm run ai:render                              # Generate sekaligus render MP4

Opsi:
  -p, --prompt <teks>     Prompt ide video motion graphics
  -v, --voice <path>      Path ke file audio suara (wav/mp3/m4a)
  -m, --model <id/nomor>  ID model atau nomor urut [1-9] (Default: ${defaultModel})
  -r, --render            Langsung render ke MP4 setelah skrip selesai
  -o, --out <path>        Path output video MP4
  --models                Tampilkan katalog model AI yang tersedia
  -h, --help              Tampilkan bantuan ini
`);
    process.exit(0);
  }

  if (args.listModels) {
    console.log(`\n📋 Katalog Model AI Penpod (https://ai.penpod.id):\n`);
    PENPOD_MODELS.forEach((m, idx) => {
      const isDefault = m.id === defaultModel;
      const badge = m.badge ? ` ${m.badge}` : "";
      const mark = isDefault ? " 👈 [DEFAULT SAAT INI]" : "";
      console.log(`[${idx + 1}] ${m.name} (${m.id})${badge}${mark}`);
      console.log(`    Tags: ${m.tags.join(", ")}`);
      console.log(`    Biaya: ${m.pricing}`);
      console.log(`    Keterangan: ${m.description}\n`);
    });
    console.log(`💡 Untuk mengganti default: edit PENPOD_MODEL di file .env`);
    console.log(`💡 Untuk memilih saat render: gunakan argumen --model <id/nomor>\n`);
    process.exit(0);
  }

  let userPrompt = args.prompt;
  let voicePath = args.voicePath;
  let chosenModel = args.model ? resolveModelId(args.model) : defaultModel;

  if (!userPrompt && !voicePath) {
    const interactive = await promptInteractiveFlow(defaultModel);
    userPrompt = interactive.userPrompt;
    chosenModel = interactive.selectedModel;
  }

  const penpodKey = process.env.PENPOD_API_KEY;

  if (!penpodKey || penpodKey.trim() === "") {
    console.error(`\n❌ Error: PENPOD_API_KEY belum diisi di file .env!`);
    console.log(`👉 Silakan buka file .env dan isi PENPOD_API_KEY.`);
    console.log(`   Dapatkan API Key di: https://ai.penpod.id\n`);
    process.exit(1);
  }

  console.log(`\n------------------------------------------------------------`);
  console.log(`1️⃣  Memeriksa status Voicebox Audio Engine...`);
  const voiceboxOnline = await isVoiceboxRunning();
  if (voiceboxOnline) {
    console.log(`   🟢 Voicebox Server aktif di port 17493 / 8000.`);
  } else {
    console.log(`   🟡 Voicebox Server offline, mencoba memulai sidecar lokal...`);
    await startVoiceboxSidecar();
  }

  console.log(`\n2️⃣  Menghubungi Penpod AI Agent (${chosenModel})...`);
  console.log(`   📝 Input: ${userPrompt || `Audio file: ${voicePath}`}`);

  try {
    const generatedScript = await generateMotionGraphicFromAI({
      prompt: userPrompt,
      audioPromptPath: voicePath,
      model: chosenModel,
      generateVoiceover: true,
    });

    // Save generated script
    const scriptsDir = path.resolve(process.cwd(), "scripts");
    const outJsonPath = path.join(scriptsDir, "latest-generated-script.json");
    fs.writeFileSync(outJsonPath, JSON.stringify(generatedScript, null, 2));

    console.log(`\n3️⃣  Script motion graphics & audio voiceover berhasil dibuat!`);
    console.log(`   💾 Tersimpan di: ${outJsonPath}`);
    console.log(`   🎬 Judul: ${generatedScript.title}`);
    console.log(`   🎨 Tema: ${generatedScript.rules.themePreset}`);
    console.log(`   ⚡ FPS: 60 FPS`);
    console.log(`   🎞️  Adegan: ${generatedScript.scenes.length} scenes`);

    if (args.render) {
      console.log(`\n4️⃣  Me-render video ke MP4 pada 60 FPS...`);
      const safeTitle = generatedScript.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const outMp4 = args.out || `out/${safeTitle}-ai-60fps.mp4`;

      const compId = generatedScript.aspectRatio === "9:16" ? "MotionGraphicVertical" : "MotionGraphic";
      const renderCmd = `npx remotion render src/index.ts ${compId} ${outMp4} --props=${outJsonPath}`;
      execSync(renderCmd, { stdio: "inherit" });
      console.log(`\n🎉 Selesai! Video MP4 tersimpan di: ${outMp4}\n`);
    } else {
      console.log(`\n👉 Untuk melihat preview secara live di Remotion Studio (60 FPS):`);
      console.log(`   npm run dev`);
      console.log(`\n👉 Atau untuk me-render langsung ke video MP4:`);
      console.log(`   npm run render:ai\n`);
    }
  } catch (error) {
    console.error(`\n❌ Gagal membuat motion graphic:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
