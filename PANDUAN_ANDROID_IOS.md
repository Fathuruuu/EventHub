# 📱 Panduan Instalasi & Build Aplikasi EventHub di Seluruh Perangkat
*(Android, iOS, Windows, macOS, Linux, dan ChromeOS)*

Project **EventHub** telah dikonfigurasi sebagai **Universal Cross-Platform Application (PWA + Capacitor Native)** yang dapat dipasang dan dijalankan langsung di seluruh jenis perangkat:

---

## 🌟 METODE 1: Instalasi Instan (PWA Standalone) — Semua Perangkat
Metode ini tidak membutuhkan kompilasi kode dan didukung penuh oleh Google Chrome, Microsoft Edge, Mozilla Firefox, dan Apple Safari.

### 🚀 Tombol Pasang Cepat di Aplikasi:
Cukup klik tombol **"📲 Pasang App"** di header navigasi atas atau klik banner **"📲 Pasang Sekarang"** yang muncul di layar.

### A. Untuk HP & Tablet Android:
1. Buka browser **Google Chrome** di perangkat Android Anda.
2. Buka URL EventHub (`http://localhost:3000` atau domain online Anda).
3. Klik tombol **"📲 Pasang Sekarang"** pada banner aplikasi, atau buka menu titik tiga `⋮` > **"Instal Aplikasi"** (*Install App*).
4. Aplikasi EventHub akan terpasang di laci aplikasi HP dengan ikon resmi, splash screen, dan mode layar penuh (*standalone*).

### B. Untuk iPhone / iPad (Apple iOS):
1. Buka browser **Safari** di iPhone/iPad Anda.
2. Buka URL EventHub.
3. Tekan tombol **Share** (ikon kotak dengan panah ke atas `📤`) di bilah bawah peramban.
4. Pilih opsi **"Tambah ke Layar Utama"** (*Add to Home Screen* `➕`).
5. Tekan **"Tambah"** (*Add*) di sudut kanan atas.
6. Ikon EventHub akan aktif di Home Screen iPhone/iPad Anda dan berjalan sebagai aplikasi mandiri (*fullscreen*).

### C. Untuk PC Laptop / Komputer Desktop (Windows, macOS, Linux, ChromeOS):
1. Buka browser **Google Chrome** atau **Microsoft Edge** di PC Anda.
2. Buka URL EventHub (`http://localhost:3000`).
3. Klik tombol **"📲 Pasang App"** pada header website, ATAU klik ikon komputer/instalasi `📲` di sebelah kanan address bar browser.
4. Klik **"Install"**.
5. EventHub akan terbuka di jendela aplikasi desktop tersendiri, memiliki shortcut di desktop & start menu Windows, serta dock aplikasi macOS.

## 🚀 METODE 2: Build Native APK / AAB (Android) & IPA (iOS) Menggunakan Capacitor

File konfigurasi `capacitor.config.json` dan `package.json` telah dikonfigurasi secara lengkap di dalam project ini.

### Prasyarat:
- **Node.js** v18+ dan NPM terpasang.
- Untuk Android: **Android Studio** terpasang.
- Untuk iOS: **macOS** dengan **Xcode** terpasang.

---

### 🤖 Langkah Build Native Android (APK / AAB):
Jalankan perintah berikut di terminal root project `C:\KEPROF`:

```bash
# 1. Install dependensi Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inisialisasi folder project Android
npx cap add android

# 3. Sinkronisasi aset web, manifest, dan icon ke Android
npx cap sync android

# 4. Buka project langsung di Android Studio
npx cap open android
```

Di dalam **Android Studio**:
1. Tunggu proses Gradle Build selesai.
2. Pilih menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. File `.apk` siap diinstal langsung ke perangkat Android atau diunggah ke Google Play Console!

---

### 🍏 Langkah Build Native iOS (IPA / TestFlight):
*(Dijalankan di macOS)*:

```bash
# 1. Install dependensi Capacitor iOS
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 2. Inisialisasi folder project iOS
npx cap add ios

# 3. Sinkronisasi aset web ke iOS
npx cap sync ios

# 4. Buka project langsung di Xcode
npx cap open ios
```

Di dalam **Xcode**:
1. Pilih Target Device (iPhone Simulator atau perangkat iPhone fisik).
2. Konfigurasikan *Signing & Capabilities* dengan Apple Developer ID Anda.
3. Klik tombol **Run** (Play) untuk menguji langsung di iPhone, atau pilih **Product** > **Archive** untuk upload ke App Store / TestFlight!

---

## 🛡️ Fitur Mobile & Keamanan yang Telah Terpasang:
1. **Tombol Scan Hero di Tengah Bar Bawah:** Tombol melingkar `📷 SCAN` beranimasi pendar neon di tengah navigasi bawah untuk kemudahan scan tiket gate 1-tap.
2. **Kamera Native & WebRTC Fallback:** Mendukung pembacaan QR via kamera langsung dan pengambilan foto dari galeri/kamera HP.
3. **Web Application Firewall (WAF):** Melindungi backend dan database dari serangan peretasan (SQL Injection, XSS, Path Traversal, Hacker Scanner Bots, dan Brute-Force Rate Limiting).
