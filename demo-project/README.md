# Demo Project & Skenario Pengujian EventHub Pro

Paket demonstrasi ini dirancang agar penilai, penguji, dan pengembang dapat langsung mengevaluasi seluruh kapabilitas platform **EventHub Pro** tanpa konfigurasi rumit.

---

## 📂 Berkas Paket Demo
- `.eventhub/flow.json`: Peta alur proses (data flow) sistem tiket dan gate POS.
- `.eventhub/prd.md`: Spesifikasi PRD dan arsitektur sistem.
- `tiket-qr-tester.html`: Halaman uji coba tiket QR siap scan kamera WebRTC.
- `test-api.py`: Automated unit test untuk memverifikasi database dan firewall.

---

## ⚡ 4 Skenario Pengujian Interaktif

### Skenario 1: Peserta Membeli Tiket & Mengklaim Promo Voucher
1. Buka browser: `http://localhost:3000/index.html`.
2. Klik tombol **Masuk / Daftar** di kanan atas.
3. Klik tombol cepat **⚡ Peserta VIP Gold** (`budi@gmail.com`).
4. Perhatikan badge **GOLD VIP** berkilau aktif di header navigasi samping logo.
5. Pilih acara **Pesta Musik Indie Jakarta 2026** di halaman utama.
6. Klik **Beli Tiket Sekarang**, pilih kategori tiket **Presale Regular Gate A**, masukkan kode voucher `VIPHEMAT10`, lalu klik **Terapkan**.
7. Konfirmasi pembelian: amati efek suara perayaan dan partikel confetti animasi.
8. Buka menu **Tiket Saya**: E-tiket digital dengan kode QR dan badge Fast-Track otomatis diterbitkan!

### Skenario 2: Penyelenggara Menggunakan Pos Kasir Gate Scanner
1. Logout atau buka mode incognito/browser lain, lalu login sebagai Penyelenggara:
   - Email: `promotor@nusantara.id` | Kata Sandi: `promotor123`
2. Buka menu **Panel Penyelenggara** atau klik tombol bulat **Scan Tiket** di bilah bawah.
3. Buka berkas `demo-project/tiket-qr-tester.html` di ponsel Anda atau tab browser terpisah:
   - **Uji Tiket 1 (`TKT-DEMO-VALID-01`):** Arahkan scanner kamera ke QR valid ini. Sistem memutar suara chime sukses, status gate berubah menjadi hijau, dan muncul tanda `⚡ FAST-TRACK VIP ACCESS`.
   - **Uji Tiket 2 (`TKT-DEMO-USED-01`):** Arahkan ke tiket yang sudah pernah dipakai. Sistem membunyikan buzz error dan menampilkan peringatan bahwa tiket sudah check-in pada pukul 14:15 WIB.
   - **Uji Tiket 3 (`TKT-DEMO-REFUND-01`):** Arahkan ke tiket refund. Sistem langsung menolak tiket dengan status dibatalkan.

### Skenario 3: Alur Refund Transparan
1. Login sebagai Peserta Reguler: `reza@gmail.com` / `peserta123`.
2. Buka menu **Refund**: Terlihat pengajuan refund pending untuk tiket `TKT-DEMO-PENDING-01`.
3. Buka tab baru sebagai Penyelenggara: `techfest@nusantara.id` / `techfest123`.
4. Masuk ke **Panel Penyelenggara** → Tab **Pusat Refund**.
5. Klik **Setujui Refund** atau **Tolak** dengan catatan: status tiket dan riwayat tersinkronisasi instan.

### Skenario 4: Super Admin Monitoring Firewall & Zero-Knowledge Privacy
1. Login sebagai Super Admin: `admin@eventhub.id` / `admin123`.
2. Buka menu **Platform Admin**:
   - Tab **Keamanan Firewall (WAF)**: Pantau total serangan terblokir, mode agresif, dan log insiden real-time.
   - Tab **Audit Pengguna**: Perhatikan bahwa identitas root admin disembunyikan dan dienkripsi menjadi `Administrator Sistem (Privat)`.
   - Tab **CMS Hero Banner**: Ubah judul headline atau video background hero secara visual langsung di layar utama.

---

## 🧪 Menjalankan Automated Test
Jalankan perintah ini di terminal:
```bash
python demo-project/test-api.py
```
Seluruh 5 pengujian (Database Integrity, Demo Seeding, WAF SQLi, WAF XSS, dan HTTP Bypass) akan diverifikasi otomatis dalam hitungan milidetik.
