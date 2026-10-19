#!/usr/bin/env node

/**
 * CLI Runner for Remotion Motion Graphics Generator (60 FPS)
 * Usage:
 *   node scripts/render-cli.mjs [script.json] [output.mp4]
 * Example:
 *   node scripts/render-cli.mjs scripts/sample-product-launch.json out/launch.mp4
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const args = process.argv.slice(2);
const scriptPath = args[0] || "scripts/sample-product-launch.json";

if (!fs.existsSync(scriptPath)) {
  console.error(`❌ Error: Script file not found: ${scriptPath}`);
  console.log(`Available sample scripts:`);
  console.log(`  - scripts/sample-product-launch.json`);
  console.log(`  - scripts/sample-metrics-growth.json`);
  console.log(`  - scripts/sample-kinetic-typography.json`);
  console.log(`  - scripts/sample-vertical-reels.json`);
  process.exit(1);
}

const rawContent = fs.readFileSync(scriptPath, "utf-8");
let scriptData;
try {
  scriptData = JSON.parse(rawContent);
} catch (e) {
  console.error(`❌ Error: Invalid JSON in ${scriptPath}`, e);
  process.exit(1);
}

const title = scriptData.title || "motion-graphic";
const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const defaultOut = `out/${safeTitle}-60fps.mp4`;
const outputPath = args[1] || defaultOut;

// Ensure output dir exists
const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const isVertical = scriptData.aspectRatio === "9:16";
const isSquare = scriptData.aspectRatio === "1:1";
const compId = isVertical
  ? "MotionGraphicVertical"
  : isSquare
  ? "MotionGraphicSquare"
  : "MotionGraphic";

console.log(`\n==================================================`);
console.log(`🚀 Remotion Motion Graphic Generator (60 FPS)`);
console.log(`==================================================`);
console.log(`📄 Script:       ${scriptPath}`);
console.log(`🎬 Composition:  ${compId} (${scriptData.aspectRatio || "16:9"})`);
console.log(`🎨 Theme Preset: ${scriptData.rules?.themePreset || "cyber-neon"}`);
console.log(`⚡ Framerate:    60 FPS`);
console.log(`🎞️  Scenes:       ${scriptData.scenes?.length || 0} scenes`);
console.log(`💾 Output:       ${outputPath}`);
console.log(`==================================================\n`);
console.log(`Rendering video... please wait...\n`);

try {
  const cmd = `npx remotion render src/index.ts ${compId} ${outputPath} --props=${scriptPath} --log=info`;
  execSync(cmd, { stdio: "inherit" });
  console.log(`\n✅ Render successfully finished at 60 FPS!`);
  console.log(`🎉 Saved to: ${outputPath}\n`);
} catch (error) {
  console.error(`\n❌ Render failed:`, error.message);
  process.exit(1);
}
