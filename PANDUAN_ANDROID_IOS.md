# 📱 Panduan Build Aplikasi EventHub ke Android & iOS

Project **EventHub** kini telah didesain dengan arsitektur **Cross-Platform Mobile-Ready** yang dapat dijalankan dan di-build menjadi aplikasi native untuk **Android** dan **iOS** melalui 2 metode pilihan:

---

## 🌟 METODE 1: Progressive Web App (PWA) — Siap Pakai Tanpa Kompilasi
Metode ini adalah cara paling cepat dan resmi yang didukung penuh oleh Google (Chrome) dan Apple (Safari).

### A. Untuk HP Android:
1. Buka browser **Google Chrome** di HP Android Anda.
2. Akses alamat web EventHub (misal: `http://localhost:3000` atau domain hosting Anda).
3. Klik ikon titik tiga `⋮` di pojok kanan atas browser.
4. Pilih **"Tambahkan ke Layar Utama"** (*Add to Home Screen*) atau **"Instal Aplikasi"** (*Install App*).
5. Ikon aplikasi **EventHub** akan muncul di menu aplikasi HP Android Anda dan dapat dibuka secara *fullscreen* tanpa address bar browser, lengkap dengan splash screen dan performa cepat layaknya aplikasi native.

### B. Untuk iPhone / iPad (iOS):
1. Buka browser **Safari** di iPhone Anda.
2. Akses alamat web EventHub.
3. Tekan tombol **Share** (ikon kotak dengan panah ke atas) di bagian bawah layar.
4. Gulir ke bawah dan pilih **"Tambah ke Layar Utama"** (*Add to Home Screen*).
5. Tekan **"Tambah"** (*Add*) di pojok kanan atas.
6. Aplikasi EventHub akan terpasang di Home Screen iPhone dengan icon resmi dan status bar *black-translucent*.

---

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
