# Demo Project & Skenario Pengujian EventHub Pro

Paket demonstrasi ini dirancang agar penilai, penguji, dan pengembang dapat langsung mengevaluasi seluruh kapabilitas platform **EventHub Pro** tanpa konfigurasi rumit.

---

## 📂 Berkas Paket Demo
- `.eventhub/flow.json`: Peta alur proses (data flow) sistem tiket dan gate POS.
- `.eventhub/prd.md`: Spesifikasi PRD dan arsitektur sistem.
- `tiket-qr-tester.html`: Halaman uji coba tiket QR siap scan kamera WebRTC.
- `test-api.py`: Automated unit test untuk memverifikasi database dan firewall.

---

## ⚡ 4 Alur Pengujian Mandiri (Mulai dari Nol)

### Skenario 1: Penyelenggara Membuat & Menerbitkan Acara Perdana
1. Buka browser: `http://localhost:3000/index.html`.
2. Klik tombol **Masuk / Daftar** ➔ Pilih **Daftar Akun Baru** sebagai **Penyelenggara Acara**.
3. Setelah akun aktif, buka **Panel Penyelenggara** ➔ Klik **➕ Buat Acara Baru**.
4. Isi judul event, kategori (Musik/Teknologi/Gaming/Workshop), kota, tanggal, dan kuota tiket.
5. Klik **Terbitkan Acara**: Acara baru langsung tampil di halaman depan katalog utama.

### Skenario 2: Peserta Membeli Tiket & Menerbitkan E-Tiket QR
1. Masuk atau daftar akun sebagai **Peserta Event**.
2. Pilih acara yang telah diterbitkan di beranda, lalu klik **Beli Tiket**.
3. Konfirmasi pembayaran: sistem menjalankan simulasi transaksi dan partikel confetti animasi.
4. Buka menu **Tiket Saya**: E-tiket digital lengkap dengan kode QR instan berhasil diterbitkan.

### Skenario 3: Penyelenggara Memvalidasi Tiket di POS Kasir Gate Scanner
1. Masuk menggunakan akun Penyelenggara pemilik acara.
2. Buka menu **Panel Penyelenggara** ➔ Tab **Kasir & Gate Scanner** (atau klik tombol **Scan Tiket** di bilah bawah).
3. Arahkan kamera ke kode QR e-tiket peserta atau ketik kode manualnya:
   - **Check-in Pertama:** Suara chime nada ganda berbunyi, status hijau VALID, dan tiket ditandai telah digunakan.
   - **Scan Ulang (Tiket Ganda):** Suara buzz peringatan berbunyi dan menolak akses masuk untuk mencegah kecurangan.

### Skenario 4: Super Admin Monitoring Firewall & CMS Platform
1. Masuk menggunakan akun dengan hak akses Super Administrator.
2. Buka menu **Platform Admin**:
   - Tab **Keamanan Firewall (WAF)**: Pantau total request yang diinspeksi, jumlah serangan terblokir, dan log insiden real-time.
   - Tab **Approval Penyelenggara**: Verifikasi dan setujui pendaftaran promotor baru.
   - Tab **CMS Hero Banner**: Ubah headline dan background video hero banner secara visual.
---

## 🧪 Menjalankan Automated Test
Jalankan perintah ini di terminal:
```bash
python demo-project/test-api.py
```
Seluruh 5 pengujian (Database Integrity, Demo Seeding, WAF SQLi, WAF XSS, dan HTTP Bypass) akan diverifikasi otomatis dalam hitungan milidetik.
