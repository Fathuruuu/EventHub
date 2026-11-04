# PRD & Arsitektur: EventHub Pro Ticket & Gate Management Platform

## 1. Sasaran Produk & Ringkasan Fitur
- **Tujuan Utama:** Menyediakan platform sistem tiket acara dan kasir gate check-in modern berkinerja tinggi dengan arsitektur role-based access (RBAC), scanner WebRTC kamera real-time, zero-knowledge privacy data administrator, dan Web Application Firewall (WAF) mandiri.
- **Target Pengguna:**
  - **Peserta / Pengunjung Event:** Pembelian tiket cepat, garansi keaslian QR code, fasilitas Fast-Track VIP tanpa antre, dan alur refund transparan.
  - **Penyelenggara Acara (Event Organizer):** Manajemen multi-tier kuota tiket, kode promo voucher, kasir gate scanner cepat, laporan keuangan Moneyflow real-time, dan verifikasi refund.
  - **Super Administrator:** Monitoring insiden keamanan firewall WAF, persetujuan akun promotor baru, manajemen CMS banner video hero, dan pengawasan audit trail.

## 2. Tech Stack & Dependensi Fullstack
- **Frontend Client:** Vanilla JavaScript Modular (ES6+), CSS Grid/Flexbox modern dengan variabel tema dinamis, Web Audio API prosedural (sintesis frekuensi tanpa aset audio eksternal), canvas particle confetti engine, dan WebRTC camera stream.
- **QR Code Engine:** Procedural SVG generator (`generator-qr.js`) & scanner pengurai matriks baris-kolom real-time (`jsqr-engine.js`).
- **Backend Core:** Python 3.12 HTTP Server dengan Threading HTTPServer, reverse-proxy bypass cache headers, dan WAF deep packet inspection.
- **Database Engine:** SQLite 3 relasional dengan WAL (Write-Ahead Logging) mode, Foreign Keys constraint, dan skema ternormalisasi.
- **Mobile Packaging:** Capacitor 6 (Android & iOS) + Progressive Web App (PWA) manifest & Service Worker offline.

## 3. Arsitektur Keamanan & Kebijakan Data
- **Zero-Knowledge Privacy Administrator:**
  - Akun `superadmin` tidak pernah ditampilkan pada daftar tabel pengguna publik (`Store.getUsers()`).
  - Jejak aktivitas root admin dimasking menjadi `Administrator Sistem (Privat)` dengan identitas privat `admin@private.internal`.
- **EventHub Enterprise WAF:**
  - Deteksi pola serangan SQL Injection (SQLi), Cross-Site Scripting (XSS), Remote Code Execution (RCE), Path Traversal, dan Automated Scanner/Bot.
  - Perlindungan brute-force login dengan batas percobaan dan rate-limiting per alamat IP.
  - Injeksi HTTP Security Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Content-Security-Policy`.

## 4. Model Data Relasional (SQLite Schema)
Tabel utama meliputi:
1. `users` (id, name, email, password, role, phone, company, status, verified, subscription_json, created_at)
2. `events` (id, title, category, city, date, time, venue, description, banner_img, video_trailer, gallery_images_json, organizer_id, status)
3. `event_tiers` (id, event_id, name, price, quota, sold, description)
4. `tickets` (id, code, event_id, event_name, organizer_email, tier_name, price, buyer_email, is_checked_in, checked_in_at, status, qr_token)
5. `refund_requests` (id, ticket_code, event_id, organizer_email, buyer_email, amount, reason, bank_name, account_number, status)
6. `vouchers` (code, event_id, organizer_email, discount_percent, max_discount, min_purchase, quota, used_count, is_active)
7. `scan_logs` (id, ticket_code, scanned_by, scanned_at, status, method, details)
8. `messages`, `feedbacks`, `activity_logs`, `memberships`, `hero_config`, `maintenance_config`.

## 5. Kriteria Selesai & Pengujian
- [x] Basis data SQLite terpasang dengan mode WAL dan foreign keys aktif.
- [x] Seeding data demo kaya (4 acara di Jakarta/Bandung/Bali, 7 akun uji coba, e-tiket siap scan, voucher aktif, pengajuan refund).
- [x] Scanner kamera WebRTC teruji membaca kode QR dan memvalidasi status tiket (VALID, ALREADY_USED, REFUNDED).
- [x] Sistem Fast-Track VIP aktif dengan deteksi badge dinamis pada navbar dan e-tiket.
- [x] WAF endpoint `/api/firewall/summary` aktif merekam lalu lintas request mencurigakan.
