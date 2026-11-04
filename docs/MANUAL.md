# Panduan Lengkap Pengguna (EventHub Pro User Manual)

Selamat datang di panduan resmi penggunaan platform **EventHub Pro**. Panduan ini mencakup seluruh alur kerja untuk tiga peran pengguna: **Peserta Event**, **Penyelenggara Acara (Event Organizer)**, dan **Super Administrator**.

---

## Daftar Isi
1. [Memulai & Otentikasi](#1-memulai--otentikasi)
2. [Panduan Peserta Event](#2-panduan-peserta-event)
   - [Jelajah Acara & Filter Pencarian](#jelajah-acara--filter-pencarian)
   - [Pembelian Tiket & Kode Promo Voucher](#pembelian-tiket--kode-promo-voucher)
   - [E-Tiket Digital & Kode QR Gate](#e-tiket-digital--kode-qr-gate)
   - [Keanggotaan Fast-Track VIP](#keanggotaan-fast-track-vip)
   - [Pengajuan Refund Tiket](#pengajuan-refund-tiket)
   - [Pesan & Tanya Penyelenggara](#pesan--tanya-penyelenggara)
3. [Panduan Penyelenggara Acara (Organizer)](#3-panduan-penyelenggara-acara-organizer)
   - [Membuat & Mempublikasikan Acara Baru](#membuat--mempublikasikan-acara-baru)
   - [POS Kasir & Scanner Kamera Gate (WebRTC)](#pos-kasir--scanner-kamera-gate-webrtc)
   - [Kelola Kode Voucher Diskon](#kelola-kode-voucher-diskon)
   - [Manajemen & Persetujuan Refund Tiket](#manajemen--persetujuan-refund-tiket)
   - [Laporan Keuangan & Moneyflow Analytics](#laporan-keuangan--moneyflow-analytics)
4. [Panduan Super Administrator](#4-panduan-super-administrator)
   - [Monitoring Keamanan Firewall WAF Real-Time](#monitoring-keamanan-firewall-waf-real-time)
   - [Persetujuan & Audit Penyelenggara](#persetujuan--audit-penyelenggara)
   - [CMS Pengaturan Banner Hero & Video Teaser](#cms-pengaturan-banner-hero--video-teaser)
   - [Mode Pemeliharaan (Maintenance Mode)](#mode-pemeliharaan-maintenance-mode)
   - [Audit Feedback & Testimoni](#audit-feedback--testimoni)

---

## 1. Memulai & Otentikasi

EventHub Pro dilengkapi sistem otentikasi role-based access (RBAC) dengan kode verifikasi 6 digit langsung dari server.

### Cara Masuk (Login):
1. Klik tombol **Masuk / Daftar** di bar navigasi atas.
2. Masukkan alamat email dan kata sandi akun Anda yang telah terdaftar, atau gunakan tombol role cepat untuk pengujian lokal.
3. Klik tombol **Masuk ke EventHub**.
### Cara Daftar Akun Baru:
1. Klik tautan **Daftar Akun Baru** pada modal masuk.
2. Pilih tipe akun:
   - **👤 Peserta Event:** Untuk membeli dan menyimpan tiket acara.
   - **🎪 Penyelenggara Acara:** Membutuhkan nama organisasi/perusahaan dan verifikasi admin.
3. Masukkan nama lengkap, nomor HP WhatsApp, email aktif, dan kata sandi minimal 8 karakter (kombinasi huruf & angka).
4. Klik **Daftar & Minta Kode Server**: Server akan menerbitkan 6-digit kode OTP di layar secara transparan tanpa ketergantungan SMTP luar.
5. Klik **Salin & Masukkan Otomatis**, lalu klik **Verifikasi & Aktifkan Akun**.

---

## 2. Panduan Peserta Event

### Jelajah Acara & Filter Pencarian
- **Pencarian Real-Time:** Ketik judul acara, musisi, kota, atau nama venue pada kolom pencarian di halaman utama.
- **Filter Kategori:** Pilih pill kategori: *Semua*, *Musik*, *Teknologi*, *Gaming*, atau *Workshop*.
- **Filter Harga:** Pilih rentang harga (Di bawah Rp 75.000, Rp 150.000, atau Rp 300.000).
- **Simpan Favorit (❤️):** Klik tombol hati pada pojok kartu acara untuk menyimpannya ke daftar favorit tanpa login ulang.

### Pembelian Tiket & Kode Promo Voucher
1. Klik kartu acara yang ingin Anda hadiri untuk membuka rincian lengkap acara.
2. Tonton video teaser trailer interaktif dan jelajahi galeri foto resolusi tinggi.
3. Pilih kategori tiket (misal: *Presale Regular* atau *VIP Soundcheck*).
4. Klik **Beli Tiket**.
5. Masukkan kode voucher jika Anda memilikinya (contoh: `VIPHEMAT10` atau `ESPORTS2026`) dan klik **Gunakan Kode**. Diskon otomatis memotong tagihan subtotal.
6. Pilih metode pembayaran simulasi (QRIS, Transfer Bank BCA, Mandiri, atau E-Wallet).
7. Klik **Konfirmasi Pembayaran**: Nikmati animasi selebrasi confetti partikel dan feedback audio procedural.

### E-Tiket Digital & Kode QR Gate
1. Buka menu **Tiket Saya** di navigasi atas.
2. Seluruh tiket resmi Anda ditampilkan dengan kode tiket unik (`TKT-...`) dan status validitas (*VALID*, *SUDAH DIGUNAKAN*, atau *REFUNDED*).
3. Klik **Lihat QR & Cetak**: Kode matriks QR siap dipindai di pintu masuk venue. Anda juga dapat mengklik tombol **Cetak / Simpan E-Tiket** untuk mencetak PDF.

### Keanggotaan Fast-Track VIP
1. Buka menu **Fast-Track VIP** (⚡) di navigasi atas.
2. Pilih paket langganan bulanan:
   - 🥈 **Silver Express (Rp 29.000/bln):** 1x akses gate prioritas/bln, diskon tiket 5%.
   - 🥇 **Gold VIP Pass (Rp 59.000/bln):** Akses Fast-Track UNLIMITED di semua acara, diskon 10%, presale H-2, badge emas berkilau.
   - 👑 **Platinum Black (Rp 99.000/bln):** Zero wait time di VVIP gate, akses VIP Lounge, diskon 15%, 0% biaya platform, 100% garansi refund instan.
3. Setelah berlangganan, badge akun Anda langsung muncul di logo header dan di atas seluruh e-tiket Anda.

### Pengajuan Refund Tiket
1. Jika berhalangan hadir, buka menu **Refund** atau klik opsi refund pada kartu tiket di menu **Tiket Saya**.
2. Pilih alasan pembatalan dan masukkan nomor rekening bank/e-wallet pengembalian dana.
3. Klik **Ajukan Refund**: Status pengajuan akan masuk ke panel review penyelenggara terkait.

### Pesan & Tanya Penyelenggara
1. Buka halaman detail acara, lalu klik tombol **Tanya Penyelenggara**.
2. Ketik pertanyaan Anda mengenai rundown, dress code, atau barang bawaan.
3. Jawaban balasan dari promotor akan masuk ke menu **Pesan & Tanya** Anda.

---

## 3. Panduan Penyelenggara Acara (Organizer)

### Membuat & Mempublikasikan Acara Baru
1. Masuk menggunakan akun Penyelenggara.
2. Buka menu **Panel Penyelenggara** → Klik tombol **➕ Buat Acara Baru**.
3. Isi informasi acara:
   - Judul acara, kategori, kota pelaksanaan, tanggal, dan jam.
   - Venue / lokasi stadion/hall.
   - Link video teaser trailer (YouTube / MP4) dan link foto galeri.
   - Kuota tiket dan harga per tier tiket (misal: *Early Bird*, *Regular*, *VIP*).
4. Klik **Terbitkan Acara**: Acara langsung aktif dan dapat dibeli oleh ribuan pengunjung di platform.

### POS Kasir & Scanner Kamera Gate (WebRTC)
1. Buka menu **Panel Penyelenggara** → Tab **Kasir & Gate Scanner** (atau klik tombol **Scan Tiket** di bilah bawah).
2. Izinkan akses kamera browser. Sistem WebRTC akan memindai QR code dalam frekuensi 30 frame/detik.
3. **Indikator Respons Scanner:**
   - 🟢 **TIKET VALID:** Suara chime nada ganda sukses, lampu status hijau, detail tiket dan nama pemegang ditampilkan. Bila berstatus subscriber, muncul badge `⚡ FAST-TRACK ACCESS`.
   - 🟡 **TIKET SUDAH CHECK-IN:** Suara buzz peringatan, menunjukkan tanggal dan waktu check-in sebelumnya untuk mencegah tiket ganda.
   - 🔴 **TIKET REFUND / INVALID:** Suara buzz gagal, akses ditolak karena tiket telah dibatalkan atau tidak terdaftar.
4. Jika kamera tidak tersedia, gunakan kolom **Input Kode Manual** untuk mengetik kode 16-karakter tiket.

### Kelola Kode Voucher Diskon
1. Pada Panel Penyelenggara, pilih tab **Kupon & Voucher**.
2. Buat kode promo baru (misal: `KONSER2026`, persentase diskon 15%, kuota 100 tiket).
3. Pantau jumlah kuota terpakai secara real-time.

### Manajemen & Persetujuan Refund Tiket
1. Buka tab **Pusat Refund** di Panel Penyelenggara.
2. Tinjau alasan pembatalan dari peserta dan nomor rekening pengembalian dana.
3. Klik **Setujui Refund** untuk membatalkan tiket dan mencatat bukti transfer, atau **Tolak Refund** dengan menyertakan alasan penolakan.

### Laporan Keuangan & Moneyflow Analytics
- Pada dashboard kasir penyelenggara, pantau grafik **Total Pendapatan Tiket**, **Tiket Terjual vs Kuota**, dan **Estimasi Kas Bersih** setelah potongan biaya operasional.

---

## 4. Panduan Super Administrator

### Monitoring Keamanan Firewall WAF Real-Time
1. Masuk menggunakan sesi akun dengan hak akses Super Administrator.
2. Buka menu **Platform Admin** → Tab **Firewall & Keamanan (WAF)**.
3. Pantau statistik:
   - Total request yang diinspeksi.
   - Jumlah serangan terblokir (SQL Injection, XSS, Path Traversal, Bot Scanner).
   - Mode Firewall (*Aggressive* vs *Permissive*).
   - Log insiden real-time lengkap dengan IP asal, waktu WIB, dan payload penyerang.

### Persetujuan & Audit Penyelenggara
1. Buka tab **Approval Penyelenggara**.
2. Tinjau pendaftaran promotor baru yang berstatus `pending_approval`.
3. Klik **Setujui Akun** untuk mengaktifkan akses pembuatan event atau **Tolak** jika identitas tidak valid.

### CMS Pengaturan Banner Hero & Video Teaser
1. Buka halaman utama saat login sebagai Super Admin.
2. Klik tombol mengambang **✏️ Edit Hero Banner (Admin)**.
3. Ubah teks badge, judul headline (Title 1 & Title 2), deskripsi sambutan, dan link video latar belakang secara dinamis tanpa perlu mengubah baris kode sumber.

### Mode Pemeliharaan (Maintenance Mode)
1. Buka menu **Platform Admin** → Tab **Mode Pemeliharaan**.
2. Aktifkan toggle switch untuk menutup sementara akses publik saat pemeliharaan infrastruktur server.
3. Pengunjung umum akan melihat layar standby pemeliharaan dengan estimasi waktu, sedangkan Super Admin tetap memiliki tombol bypass login.

### Audit Feedback & Testimoni
1. Buka tab **Ulasan Pengguna**.
2. Evaluasi rating bintang 1 hingga 5 dan masukan saran dari peserta untuk perbaikan layanan sistem secara berkesinambungan.
