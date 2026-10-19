# 🎬 Remotion AI Motion Graphics Generator (60 FPS + Voicebox)

Sistem pembuatan video motion graphic otomatis bertenaga **Google Gemini AI** dan **Voicebox TTS Audio Studio** dengan framerate native **60 FPS**.

Cukup **ketik prompt ide video** (atau masukkan file rekaman suara), AI Agent akan:
1. Merancang alur cerita video, memilih tema visual & font, dan membuat adegan kinetik dinamis.
2. Menulis naskah narasi voiceover untuk tiap adegan.
3. Mengirim naskah narasi ke **Voicebox** untuk di-generate suaranya secara lokal.
4. Mengukur panjang audio dan menyelaraskan durasi animasi pada 60 FPS secara presisi.
5. Menampilkan preview real-time di Remotion Studio atau langsung merender ke video MP4!

---

## 🚀 Cara Penggunaan

### 1. Konfigurasi API (.env)
Buka file `.env` dan masukkan API Key Anda:
```env
# Penpod AI API (OpenAI-compatible)
# Dapatkan API Key di https://ai.penpod.id (dimulai dengan gp-...)
PENPOD_API_KEY=gp-your_penpod_api_key_here
PENPOD_BASE_URL=https://ai.penpod.id/v1

# Model default (bisa diganti kapan saja):
PENPOD_MODEL=gemini-3.8-flash-high

# Opsional: Google Gemini Direct Key (jika tidak menggunakan Penpod)
GEMINI_API_KEY=
```

---

### 2. Generate Video dari Prompt Teks atau Suara

#### A. Prompt Interaktif (Tanya Prompt & Pilih Model)
```bash
npm run ai
```
Terminal akan meminta Anda mengetikkan ide prompt, lalu menampilkan daftar model Penpod yang bisa Anda pilih dengan mengetik nomor urut [1-9] atau menekan `[ENTER]` untuk menggunakan default dari `.env`.

#### B. Lihat Katalog Semua Model AI
```bash
npm run models
# atau: npm run ai -- --models
```

#### C. Langsung Pilih Model Spesifik Lewat Parameter
```bash
# Menggunakan Gemini 3.8 Flash (Rekomendasi Utama)
npm run ai -- --prompt "Ide video produk" --model gemini-3.8-flash-high

# Menggunakan Claude Opus 4.6 Thinking (Deep Storytelling)
npm run ai -- --prompt "Ide video produk" --model claude-opus-4-6-thinking

# Atau gunakan nomor urut (1-9)
npm run ai -- --prompt "Ide video produk" -m 1
```

#### D. Menggunakan Input Rekaman Suara / Voice Note
```bash
npm run ai -- --voice path/to/rekaman-ide-kamu.m4a
```
AI Agent akan mentranskripsikan instruksi suara Anda dan langsung membuatkan motion graphic-nya!

#### E. Generate & Langsung Render ke File MP4
```bash
npm run ai:render -- --prompt "Peluncuran platform AI terbaru, 60 FPS, highlight kecepatan 10x"
```
Hasil video MP4 akan otomatis tersimpan di folder `out/`.

---

### 3. Preview Interaktif di Remotion Studio
Untuk memutar video hasil generate AI secara real-time pada 60 FPS:
```bash
npm run dev
# atau: npx remotion studio
```
Buka `http://localhost:3000` dan pilih komposisi:
- **`AIMotionGraphic`**: Komposisi terbaru yang dihasilkan oleh Gemini & Voicebox.
- **`MotionGraphic`**: Komposisi default preset 16:9.
- **`MotionGraphicVertical`**: Format vertikal 9:16 (TikTok, Reels, Shorts).
- **`Scenes/`**: Preview per-adegan untuk fine-tuning visual.

---

## 🎙️ Integrasi Voicebox (1 Runtime)

Backend Voicebox telah diintegrasikan langsung ke dalam project ini di folder [`voicebox/`](./voicebox):
- **Otomatis / Sidecar**: Script `npm run ai` akan otomatis mendeteksi apakah Voicebox aktif di `http://127.0.0.1:17493` atau meluncurkannya sebagai background sidecar.
- **Jalankan Mandiri**: Jika ingin menjalankan server Voicebox secara manual:
  ```bash
  npm run voicebox:start
  ```
- **Sinkronisasi Durasi Otomatis**: Setiap audio narasi yang dihasilkan Voicebox diukur panjangnya (dalam detik) dan dikalikan dengan 60 FPS, memastikan animasi scene tidak terpotong sebelum narasi selesai.

---

## 🎨 Tema & Gaya Desain yang Dihasilkan AI

AI Agent secara otomatis mencocokkan tema desain berdasarkan topik prompt Anda:
- `cyber-neon`: Teknologi, AI, Web3, coding, gaming (Cyan & Violet glow).
- `modern-dark`: SaaS, analitik, startup, B2B software (Emerald & Zinc glassmorphism).
- `luxury-gold`: Finansial, executive, brand mewah, edukasi premium (Champagne & Amber).
- `clean-saas`: Produktivitas, aplikasi mobile, gaya minimalis bersih (Royal Indigo).
- `sunset-flare`: Promosi penjualan, diskon, fitness, lifestyle dinamis (Rose & Coral).

---

## 📂 Struktur Project

```
├── src/
│   ├── ai/
│   │   ├── gemini-agent.ts      # Agent Gemini 2.5 Flash (prompt/voice to script)
│   │   └── voicebox-service.ts  # Voicebox sidecar manager & audio synchronization
│   ├── engine/
│   │   ├── MotionGraphic.tsx    # Remotion composition dengan Audio & 60 FPS transition
│   │   └── SceneRenderer.tsx    # Dispatcher 7 jenis adegan
│   ├── components/              # Komponen visual (KineticText, StatCounter, FeatureCard, dll.)
│   ├── scenes/                  # Layout adegan (Intro, Kinetic, Metrics, Features, Outro)
│   ├── rules/                   # Tema warna, tipografi Google Fonts, spring physics 60 FPS
│   └── types/schema.ts          # Zod Schema lengkap
├── voicebox/                    # Modul backend Voicebox TTS (terintegrasi 1 runtime)
├── scripts/
│   ├── ai-generate.mjs          # Generator CLI prompt & suara
│   ├── render-cli.mjs           # Renderer CLI
│   └── latest-generated-script.json # Script aktif hasil AI
├── .env                         # Konfigurasi GEMINI_API_KEY & Voicebox
└── package.json
```