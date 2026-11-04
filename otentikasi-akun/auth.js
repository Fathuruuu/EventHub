/**
 * EventHub Pro - Auth Module (Login, Register, Server OTP & Forgot Password)
 * Menggunakan kode verifikasi OTP langsung dari server (tanpa ketergantungan Gmail eksternal)
 * Dilengkapi fitur Lupa Kata Sandi dan alur persetujuan admin untuk penyelenggara.
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Confetti = window.EventConfetti;
  var App = window.EventApp;
  var Router = window.EventRouter;

  var pendingRegistration = null;
  var pendingResetPassword = null;
  var authScreen = 'form'; // 'form' | 'verify_register_otp' | 'forgot_email' | 'forgot_reset_otp'

  var AuthModule = {
    handleRoleChange: function(role) {
      var companyBox = document.getElementById('org-company-field');
      if (companyBox) {
        companyBox.style.display = (role === 'penyelenggara') ? 'block' : 'none';
      }
    },

    autoFillOtp: function(code) {
      var input = document.getElementById('auth-otp-input');
      if (input) {
        input.value = code;
        if (Sound) Sound.playClick();
        Router.showToast('Kode OTP ' + code + ' otomatis disalin!', 'success');
      }
    },
    quickLogin: function(email, password) {
      var emailInput = document.getElementById('auth-email');
      var passInput = document.getElementById('auth-password');
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = password;
      if (Sound) Sound.playClick();
      Router.showToast('Memuat kredensial akun: ' + email, 'info', 1500);
      setTimeout(function() {
        AuthModule.submitAuth();
      }, 250);
    },

    cancelToLogin: function() {
      authScreen = 'form';
      pendingRegistration = null;
      pendingResetPassword = null;
      if (typeof EventHub !== 'undefined' && EventHub.openAuthModal) {
        EventHub.openAuthModal('login');
      }
    },

    cancelToRegister: function() {
      authScreen = 'form';
      pendingRegistration = null;
      pendingResetPassword = null;
      if (typeof EventHub !== 'undefined' && EventHub.openAuthModal) {
        EventHub.openAuthModal('register');
      }
    },

    openForgotPassword: function() {
      authScreen = 'forgot_email';
      pendingResetPassword = null;
      var container = document.getElementById('modal-container');
      if (container) {
        container.innerHTML = '<div class="modal-sheet">' + AuthModule.renderAuthModal() + '</div>';
        var inp = document.getElementById('forgot-email-input');
        if (inp) inp.focus();
      }
    },

    renderAuthModal: function() {
      var html = [];

      // =========================================================================
      // SCREEN 1: VERIFIKASI OTP PENDAFTARAN (SERVER OTP LANGSUNG)
      // =========================================================================
      if (authScreen === 'verify_register_otp' && pendingRegistration) {
        html.push(
          '<div class="modal-header">',
            '<h3 class="modal-title">Verifikasi Pendaftaran Akun</h3>',
            '<button class="modal-close-btn" onclick="EventAuth.cancelToRegister(); EventHub.closeModal()">✕</button>',
          '</div>',

          '<div id="auth-error-banner" class="auth-error-box" style="display:none"></div>',

          // Server OTP Card - Jelas, Resmi, dan Langsung dari Server
          '<div class="server-otp-card">',
            '<div class="server-otp-label">🔐 KODE VERIFIKASI RESMI DARI SERVER (OTP):</div>',
            '<div class="server-otp-code">' + pendingRegistration.code + '</div>',
            '<p style="color:#a5b4fc; font-size:0.85rem; margin:0 0 10px">',
              'Kode 6 digit diterbitkan untuk email: <b>' + pendingRegistration.email + '</b>.',
            '</p>',
            '<button type="button" class="btn-copy-otp" onclick="EventAuth.autoFillOtp(\'' + pendingRegistration.code + '\')">',
              '📋 Salin & Masukkan Otomatis',
            '</button>',
          '</div>',

          '<form id="otp-verification-form" onsubmit="event.preventDefault(); EventAuth.submitRegisterOtp()">',
            '<div class="form-group" style="margin-bottom:20px">',
              '<label class="form-label" for="auth-otp-input" style="text-align:center; display:block; font-size:0.9rem">',
                'Masukkan 6 Digit Kode Verifikasi',
              '</label>',
              '<input class="form-control" id="auth-otp-input" name="one-time-code" type="text" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="______" style="font-family:var(--font-mono); font-size:1.8rem; letter-spacing:8px; text-align:center; font-weight:800; padding:12px; background:rgba(0,0,0,0.3)" onkeydown="if(event.key===\'Enter\') EventAuth.submitRegisterOtp()">',
              '<span class="auth-req-hint" style="text-align:center; margin-top:8px">',
                'Klik tombol salin di atas atau ketik 6 digit kode untuk mengaktifkan akun.',
              '</span>',
            '</div>',

            '<button type="submit" class="btn-primary" style="background:#10b981; padding:12px">',
              '✓ Verifikasi & Aktifkan Akun',
            '</button>',
          '</form>',

          '<button class="btn-secondary" style="margin-top:10px; width:100%" onclick="EventAuth.cancelToRegister()">',
            '← Ubah Data Pendaftaran',
          '</button>'
        );

        return html.join('');
      }

      // =========================================================================
      // SCREEN 2: LUPA KATA SANDI - LANGKAH 1: INPUT EMAIL
      // =========================================================================
      if (authScreen === 'forgot_email') {
        html.push(
          '<div class="modal-header">',
            '<h3 class="modal-title">Lupa Kata Sandi Akun</h3>',
            '<button class="modal-close-btn" onclick="EventAuth.cancelToLogin(); EventHub.closeModal()">✕</button>',
          '</div>',

          '<div id="auth-error-banner" class="auth-error-box" style="display:none"></div>',

          '<p style="color:var(--text-muted); font-size:0.88rem; line-height:1.6; margin-bottom:18px">',
            'Masukkan alamat email yang terdaftar di akun EventHub Anda. Server akan menerbitkan 6 digit kode OTP untuk mengatur ulang kata sandi Anda.',
          '</p>',

          '<div class="form-group">',
            '<label class="form-label">Email Akun Terdaftar <span style="color:#f43f5e">*</span></label>',
            '<input class="form-control" id="forgot-email-input" type="email" placeholder="nama@gmail.com" onkeydown="if(event.key===\'Enter\') EventAuth.submitForgotPasswordEmail()">',
          '</div>',

          '<button class="btn-primary" style="margin-top:16px" onclick="EventAuth.submitForgotPasswordEmail()">',
            'Minta Kode Reset Sandi dari Server →',
          '</button>',

          '<button class="btn-secondary" style="margin-top:10px; width:100%" onclick="EventAuth.cancelToLogin()">',
            '← Batal & Kembali ke Masuk',
          '</button>'
        );

        return html.join('');
      }

      // =========================================================================
      // SCREEN 3: LUPA KATA SANDI - LANGKAH 2: VERIFIKASI KODE & SET KATA SANDI BARU
      // =========================================================================
      if (authScreen === 'forgot_reset_otp' && pendingResetPassword) {
        html.push(
          '<div class="modal-header">',
            '<h3 class="modal-title">Atur Ulang Kata Sandi</h3>',
            '<button class="modal-close-btn" onclick="EventAuth.cancelToLogin(); EventHub.closeModal()">✕</button>',
          '</div>',

          '<div id="auth-error-banner" class="auth-error-box" style="display:none"></div>',

          // Server Reset OTP Card
          '<div class="server-otp-card">',
            '<div class="server-otp-label">🔐 KODE RESET KATA SANDI SERVER (OTP):</div>',
            '<div class="server-otp-code">' + pendingResetPassword.code + '</div>',
            '<p style="color:#a5b4fc; font-size:0.85rem; margin:0 0 10px">',
              'Kode diterbitkan untuk mereset akun: <b>' + pendingResetPassword.email + '</b>.',
            '</p>',
            '<button type="button" class="btn-copy-otp" onclick="EventAuth.autoFillOtp(\'' + pendingResetPassword.code + '\')">',
              '📋 Salin & Masukkan Otomatis',
            '</button>',
          '</div>',

          '<form id="reset-pw-form" onsubmit="event.preventDefault(); EventAuth.submitResetPassword()">',
            '<div class="form-group">',
              '<label class="form-label">Masukkan 6 Digit Kode Reset</label>',
              '<input class="form-control" id="auth-otp-input" name="one-time-code" type="text" autocomplete="one-time-code" inputmode="numeric" maxlength="6" placeholder="______" style="font-family:var(--font-mono); font-size:1.5rem; letter-spacing:6px; text-align:center; font-weight:800; padding:10px">',
            '</div>',

            '<div class="form-group">',
              '<label class="form-label">Kata Sandi Baru <span style="color:#f43f5e">*</span></label>',
              '<input class="form-control" id="reset-new-password" type="password" placeholder="Minimal 8 karakter (kombinasi huruf & angka)">',
              '<span class="auth-req-hint">Wajib minimal 8 karakter dengan huruf dan angka.</span>',
            '</div>',

            '<div class="form-group">',
              '<label class="form-label">Ulangi Kata Sandi Baru <span style="color:#f43f5e">*</span></label>',
              '<input class="form-control" id="reset-confirm-password" type="password" placeholder="Ketik ulang kata sandi baru">',
            '</div>',

            '<button type="submit" class="btn-primary" style="background:#1d4ed8; padding:12px; margin-top:16px">',
              '🔒 Simpan & Perbarui Kata Sandi',
            '</button>',
          '</form>',

          '<button class="btn-secondary" style="margin-top:10px; width:100%" onclick="EventAuth.cancelToLogin()">',
            '← Batal & Kembali ke Masuk',
          '</button>'
        );

        return html.join('');
      }

      // =========================================================================
      // SCREEN 4: LOGIN UTAMA ATAU DAFTAR AKUN BARU
      // =========================================================================
      var isRegister = App.modalData === 'register';
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">' + (isRegister ? 'Daftar Akun Baru' : 'Masuk ke EventHub') + '</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>'
      );

      html.push('<div id="auth-error-banner" class="auth-error-box" style="display:none"></div>');

      if (App.authNotice) {
        html.push(
          '<div class="auth-notice-box">',
            '<span style="font-size:1.2rem">🔒</span>',
            '<span>' + App.authNotice + '</span>',
          '</div>'
        );
      }

      if (isRegister) {
        html.push(
          '<div class="form-group">',
            '<label class="form-label">Daftar Sebagai Tipe Akun</label>',
            '<select class="form-control" id="auth-role" onchange="EventAuth.handleRoleChange(this.value)">',
              '<option value="peserta">👤 Peserta Event (Membeli & Menyimpan E-Tiket)</option>',
              '<option value="penyelenggara">🎪 Penyelenggara Acara (Kelola Event, Harga Tiket & Kasir Gate)</option>',
            '</select>',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Nama Lengkap / Penanggung Jawab <span style="color:#f43f5e">*</span></label>',
            '<input class="form-control" id="auth-name" placeholder="Nama lengkap sesuai KTP/identitas">',
            '<span class="auth-req-hint">Minimal 3 karakter, hanya huruf dan spasi.</span>',
          '</div>',
          '<div id="org-company-field" class="form-group" style="display:none">',
            '<label class="form-label">Nama Organisasi / Promotor / EO <span style="color:#f43f5e">*</span></label>',
            '<input class="form-control" id="auth-company" placeholder="Contoh: PT Kreasi Musik / BEM Kampus">',
            '<span class="auth-req-hint">Wajib diisi minimal 3 karakter untuk akun Penyelenggara.</span>',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Nomor WhatsApp / HP Aktif</label>',
            '<input class="form-control" id="auth-phone" type="tel" placeholder="08xxxxxxxxxx">',
            '<span class="auth-req-hint">Format nomor Indonesia: 10-13 digit (contoh: 081234567890).</span>',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Email Aktif <span style="color:#f43f5e">*</span></label>',
            '<input class="form-control" id="auth-email" type="email" placeholder="nama@gmail.com">',
            '<span class="auth-req-hint">Kode verifikasi server akan diterbitkan untuk email ini.</span>',
          '</div>'
        );
      } else {
        html.push(
          '<div class="form-group">',
            '<label class="form-label">Email Akun</label>',
            '<input class="form-control" id="auth-email" type="email" placeholder="nama@gmail.com">',
          '</div>'
        );
      }

      html.push(
        '<div class="form-group">',
          '<div style="display:flex; justify-content:space-between; align-items:center">',
            '<label class="form-label" style="margin-bottom:0">Kata Sandi <span style="color:#f43f5e">*</span></label>',
            (!isRegister ? '<a href="javascript:void(0)" onclick="EventAuth.openForgotPassword()" style="color:#818cf8; font-size:0.78rem; text-decoration:underline; font-weight:600">Lupa kata sandi?</a>' : ''),
          '</div>',
          '<input class="form-control" id="auth-password" type="password" style="margin-top:6px" placeholder="Minimal 8 karakter (kombinasi huruf & angka)" onkeydown="if(event.key===\'Enter\') EventHub.submitAuth()">',
          (isRegister ? '<span class="auth-req-hint">Minimal 8 karakter dan wajib kombinasi huruf serta angka (contoh: Password123).</span>' : ''),
        '</div>',

        '<button class="btn-primary" style="margin-top:18px" onclick="EventHub.submitAuth()">',
          isRegister ? 'Lanjutkan & Dapatkan Kode Server →' : 'Masuk ke EventHub',
        '</button>',


        '<div style="text-align:center; margin-top:16px; font-size:0.85rem; color:var(--text-muted)">',
          isRegister
            ? 'Sudah punya akun? <a href="javascript:void(0)" style="color:#818cf8; font-weight:700" onclick="EventAuth.cancelToLogin()">Masuk di sini</a>'
            : 'Belum punya akun? <a href="javascript:void(0)" style="color:#818cf8; font-weight:700" onclick="EventAuth.cancelToRegister()">Daftar Akun Baru</a>',
        '</div>'
      );
      if (!isRegister) {
        html.push(
          '<div style="margin-top:20px; padding:12px; background:rgba(99,102,241,0.08); border:1px dashed rgba(99,102,241,0.35); border-radius:12px">',
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">',
              '<span style="font-size:0.75rem; font-weight:800; color:#a5b4fc; letter-spacing:0.5px">⚡ AKUN DEMO CEPAT (1-KLIK LOGIN)</span>',
              '<span style="font-size:0.68rem; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:10px">Langsung Masuk</span>',
            '</div>',
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">',
              '<button type="button" class="btn-demo-chip" onclick="EventAuth.quickLogin(\'admin@eventhub.id\', \'admin123\')" style="text-align:left; padding:8px 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; color:#fff">',
                '<div style="font-size:0.78rem; font-weight:700">👑 Super Admin</div>',
                '<div style="font-size:0.68rem; color:#94a3b8">admin@eventhub.id</div>',
              '</button>',
              '<button type="button" class="btn-demo-chip" onclick="EventAuth.quickLogin(\'promotor@nusantara.id\', \'promotor123\')" style="text-align:left; padding:8px 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; color:#fff">',
                '<div style="font-size:0.78rem; font-weight:700">🎪 Penyelenggara</div>',
                '<div style="font-size:0.68rem; color:#94a3b8">promotor@nusantara.id</div>',
              '</button>',
              '<button type="button" class="btn-demo-chip" onclick="EventAuth.quickLogin(\'budi@gmail.com\', \'peserta123\')" style="text-align:left; padding:8px 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; color:#fff">',
                '<div style="font-size:0.78rem; font-weight:700">⚡ Peserta VIP Gold</div>',
                '<div style="font-size:0.68rem; color:#94a3b8">budi@gmail.com</div>',
              '</button>',
              '<button type="button" class="btn-demo-chip" onclick="EventAuth.quickLogin(\'siti@gmail.com\', \'peserta123\')" style="text-align:left; padding:8px 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; color:#fff">',
                '<div style="font-size:0.78rem; font-weight:700">👤 Peserta Reguler</div>',
                '<div style="font-size:0.68rem; color:#94a3b8">siti@gmail.com</div>',
              '</button>',
            '</div>',
          '</div>'
        );
      }

      return html.join('');
    },

    showAuthError: function(msg, targetInputId) {
      var banner = document.getElementById('auth-error-banner');
      if (banner) {
        banner.innerHTML = '<span style="font-size:1.1rem">⚠️</span><span>' + msg + '</span>';
        banner.style.display = 'flex';
      }

      document.querySelectorAll('.form-control').forEach(function(el) {
        el.classList.remove('input-error');
      });

      if (targetInputId) {
        var target = document.getElementById(targetInputId);
        if (target) {
          target.classList.add('input-error');
          target.focus();
        }
      }

      if (Sound) Sound.playError();
      Router.showToast(msg, 'error', 4000);
    },

    submitAuth: function() {
      var isRegister = App.modalData === 'register';
      var emailInput = document.getElementById('auth-email');
      var passwordInput = document.getElementById('auth-password');
      var email = (emailInput ? emailInput.value : '').trim().toLowerCase();
      var password = (passwordInput ? passwordInput.value : '');

      var banner = document.getElementById('auth-error-banner');
      if (banner) banner.style.display = 'none';
      document.querySelectorAll('.form-control').forEach(function(el) { el.classList.remove('input-error'); });

      if (!email) {
        return this.showAuthError('Email tidak boleh kosong.', 'auth-email');
      }
      if (!password) {
        return this.showAuthError('Kata sandi tidak boleh kosong.', 'auth-password');
      }

      try {
        if (isRegister) {
          var nameInput = document.getElementById('auth-name');
          var roleSelect = document.getElementById('auth-role');
          var companyInput = document.getElementById('auth-company');
          var phoneInput = document.getElementById('auth-phone');

          var name = (nameInput ? nameInput.value : '').trim();
          var role = (roleSelect ? roleSelect.value : 'peserta');
          var company = (companyInput ? companyInput.value : '').trim();
          var phone = (phoneInput ? phoneInput.value : '').trim();

          // 1. Validasi Nama Lengkap
          if (!name || name.length < 3) {
            return this.showAuthError('Syarat Nama: Nama lengkap wajib diisi minimal 3 karakter.', 'auth-name');
          }
          if (!/^[a-zA-Z\s'.]+$/.test(name)) {
            return this.showAuthError('Syarat Nama: Nama hanya boleh berisi huruf dan spasi (tanpa angka/simbol khusus).', 'auth-name');
          }

          // 2. Validasi Format Email
          var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(email)) {
            return this.showAuthError('Syarat Email: Format email tidak valid. Gunakan format standar, contoh: nama@gmail.com', 'auth-email');
          }

          var allUsers = Store.getUsers();
          if (allUsers.some(function(u){ return u.email === email; })) {
            return this.showAuthError('Email "' + email + '" sudah terdaftar di sistem. Silakan gunakan email lain atau langsung masuk.', 'auth-email');
          }

          // 3. Validasi Kata Sandi
          if (password.length < 8) {
            return this.showAuthError('Syarat Kata Sandi: Panjang kata sandi minimal harus 8 karakter.', 'auth-password');
          }
          var hasLetter = /[a-zA-Z]/.test(password);
          var hasNumber = /[0-9]/.test(password);
          if (!hasLetter || !hasNumber) {
            return this.showAuthError('Syarat Kata Sandi: Kata sandi wajib mengandung kombinasi huruf dan angka (contoh: Tiket2026).', 'auth-password');
          }

          // 4. Validasi Nomor Telepon
          if (phone) {
            var cleanPhone = phone.replace(/[\s-]/g, '');
            if (!/^(\+62|62|0)8[0-9]{8,11}$/.test(cleanPhone)) {
              return this.showAuthError('Syarat No. HP: Nomor telepon tidak valid. Gunakan nomor Indonesia yang benar (contoh: 081234567890).', 'auth-phone');
            }
          }

          // 5. Validasi Nama Organisasi
          if (role === 'penyelenggara') {
            if (!company || company.length < 3) {
              return this.showAuthError('Syarat Penyelenggara: Nama Organisasi/Promotor/EO wajib diisi minimal 3 karakter.', 'auth-company');
            }
          }

          // GENERATE KODE OTP DARI SERVER LANGSUNG
          var otpCode = String(Math.floor(100000 + Math.random() * 900000));
          pendingRegistration = {
            name: name,
            email: email,
            password: password,
            role: role,
            company: company,
            phone: phone,
            code: otpCode
          };

          authScreen = 'verify_register_otp';
          if (Sound) Sound.playClick();
          Router.showToast('Kode verifikasi akun diterbitkan oleh server: ' + otpCode, 'info');

          // Render verification screen
          var container = document.getElementById('modal-container');
          if (container) {
            container.innerHTML = '<div class="modal-sheet">' + AuthModule.renderAuthModal() + '</div>';
            var otpInp = document.getElementById('auth-otp-input');
            if (otpInp) otpInp.focus();
          }
          return;
        } else {
          Store.loginUser(email, password);
          Router.showToast('Berhasil masuk! Selamat datang kembali.', 'success');
        }

        if (Sound) Sound.playSuccess();
        EventHub.closeModal();

        var currentUser = Store.getCurrentUser();
        var pendingEvent = App.pendingEventId;
        App.pendingEventId = null;
        App.authNotice = null;

        if (pendingEvent && currentUser.role === 'peserta') {
          Router.triggerPreloader('Mempersiapkan Pemilihan Tiket Acara...', 750, function() {
            Router.navigate('detail', pendingEvent);
          });
        } else if (currentUser.role === 'penyelenggara') {
          Router.triggerPreloader('Membuka Panel Kasir Penyelenggara...', 750, function() {
            var myEvents = Store.getOrganizerEvents(currentUser.email);
            if (myEvents.length > 0) {
              App.activeOrganizerEventId = myEvents[0].id;
            }
            Router.navigate('organizer');
          });
        } else if (currentUser.role === 'superadmin') {
          Router.triggerPreloader('Membuka Dashboard Admin...', 750, function() {
            Router.navigate('admin');
          });
        } else {
          Router.navigate('home');
        }
      } catch (err) {
        if (Sound) Sound.playError();
        this.showAuthError(err.message, isRegister ? 'auth-email' : 'auth-password');
      }
    },

    submitRegisterOtp: function() {
      var otpInput = document.getElementById('auth-otp-input');
      var enteredCode = (otpInput ? otpInput.value : '').trim();

      if (!enteredCode || enteredCode.length !== 6) {
        return this.showAuthError('Masukkan 6 digit kode verifikasi dengan lengkap.', 'auth-otp-input');
      }

      if (!pendingRegistration || enteredCode !== pendingRegistration.code) {
        return this.showAuthError('Kode verifikasi salah! Pastikan memasukkan 6 digit kode OTP yang benar.', 'auth-otp-input');
      }

      try {
        var role = pendingRegistration.role;
        var user = Store.registerUser({
          name: pendingRegistration.name,
          email: pendingRegistration.email,
          password: pendingRegistration.password,
          role: role,
          company: pendingRegistration.company,
          phone: pendingRegistration.phone
        });

        Store.logActivity('Verifikasi Akun', 'Pendaftaran & verifikasi kode OTP berhasil untuk ' + user.email + ' (' + user.role + ')', user);

        if (Sound) Sound.playFanfare();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Verifikasi berhasil! ' + (role === 'penyelenggara' ? 'Akun Anda menunggu persetujuan admin.' : 'Akun Anda telah aktif.'), 'success');

        // Jika Penyelenggara: Tampilkan layar persetujuan admin!
        if (role === 'penyelenggara') {
          authScreen = 'form';
          pendingRegistration = null;
          App.activeModal = 'pendingApprovalNotice';

          var container = document.getElementById('modal-container');
          if (container) {
            container.innerHTML = [
              '<div class="modal-sheet">',
                '<div class="modal-header">',
                  '<h3 class="modal-title">Pendaftaran Penyelenggara Terkirim</h3>',
                  '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
                '</div>',
                '<div style="text-align:center; padding:20px 10px">',
                  '<div style="font-size:3.5rem; margin-bottom:12px">⏳</div>',
                  '<h4 style="font-size:1.3rem; font-weight:800; color:#fbbf24; margin-bottom:8px">Menunggu Persetujuan Admin Platform</h4>',
                  '<p style="color:var(--text-muted); font-size:0.9rem; line-height:1.6; max-width:440px; margin:0 auto 20px">',
                    'Terima kasih telah mendaftar! Akun instansi <b>' + (user.company || user.name) + '</b> (' + user.email + ') telah terverifikasi dan saat ini <b>sedang menunggu persetujuan (approval) dari Administrator Platform EventHub</b> sebelum Anda dapat login dan menerbitkan acara.',
                  '</p>',
                  '<div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:14px; border-radius:12px; font-size:0.85rem; max-width:400px; margin:0 auto 24px; text-align:left">',
                    '<div>• <b>Penanggung Jawab:</b> ' + user.name + '</div>',
                    '<div>• <b>Organisasi / EO:</b> ' + (user.company || '-') + '</div>',
                    '<div>• <b>Email Akun:</b> ' + user.email + '</div>',
                    '<div>• <b>Status Akun:</b> <span style="color:#f59e0b; font-weight:700">⏳ Menunggu Persetujuan Admin</span></div>',
                  '</div>',
                  '<button class="btn-primary" style="max-width:280px; margin:0 auto" onclick="EventHub.closeModal(); EventHub.go(\'home\');">',
                    'Mengerti & Kembali ke Beranda',
                  '</button>',
                '</div>',
              '</div>'
            ].join('');
          }
          return;
        }

        var pendingEvent = App.pendingEventId;
        App.pendingEventId = null;
        App.authNotice = null;
        pendingRegistration = null;
        authScreen = 'form';

        EventHub.closeModal();

        if (pendingEvent && role === 'peserta') {
          Router.triggerPreloader('Mempersiapkan Pemilihan Tiket Acara...', 750, function() {
            Router.navigate('detail', pendingEvent);
          });
        } else {
          Router.navigate('home');
        }
      } catch (err) {
        if (Sound) Sound.playError();
        this.showAuthError(err.message, 'auth-otp-input');
      }
    },

    submitForgotPasswordEmail: function() {
      var emailInput = document.getElementById('forgot-email-input');
      var email = (emailInput ? emailInput.value : '').trim().toLowerCase();

      var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        return this.showAuthError('Format email tidak valid. Masukkan email terdaftar Anda.', 'forgot-email-input');
      }

      var users = Store.getUsers();
      var targetUser = users.find(function(u){ return u.email === email; });

      if (!targetUser) {
        return this.showAuthError('Email "' + email + '" tidak terdaftar di sistem EventHub.', 'forgot-email-input');
      }

      // Generate 6-digit server reset code
      var resetCode = String(Math.floor(100000 + Math.random() * 900000));
      pendingResetPassword = {
        email: email,
        code: resetCode,
        user: targetUser
      };

      authScreen = 'forgot_reset_otp';
      if (Sound) Sound.playClick();
      Router.showToast('Kode reset kata sandi diterbitkan oleh server: ' + resetCode, 'info');

      var container = document.getElementById('modal-container');
      if (container) {
        container.innerHTML = '<div class="modal-sheet">' + AuthModule.renderAuthModal() + '</div>';
        var inp = document.getElementById('auth-otp-input');
        if (inp) inp.focus();
      }
    },

    submitResetPassword: function() {
      var codeInp = document.getElementById('auth-otp-input');
      var newPwInp = document.getElementById('reset-new-password');
      var confirmPwInp = document.getElementById('reset-confirm-password');

      var code = (codeInp ? codeInp.value : '').trim();
      var newPw = (newPwInp ? newPwInp.value : '');
      var confirmPw = (confirmPwInp ? confirmPwInp.value : '');

      if (!code || code.length !== 6) {
        return this.showAuthError('Masukkan 6 digit kode reset kata sandi.', 'auth-otp-input');
      }

      if (!pendingResetPassword || code !== pendingResetPassword.code) {
        return this.showAuthError('Kode reset kata sandi salah. Harap masukkan 6 digit kode yang benar.', 'auth-otp-input');
      }

      if (!newPw || newPw.length < 8) {
        return this.showAuthError('Kata sandi baru minimal harus 8 karakter.', 'reset-new-password');
      }

      var hasLetter = /[a-zA-Z]/.test(newPw);
      var hasNumber = /[0-9]/.test(newPw);
      if (!hasLetter || !hasNumber) {
        return this.showAuthError('Kata sandi baru wajib mengandung kombinasi huruf dan angka.', 'reset-new-password');
      }

      if (newPw !== confirmPw) {
        return this.showAuthError('Konfirmasi kata sandi baru tidak cocok.', 'reset-confirm-password');
      }

      try {
        var u = pendingResetPassword.user;
        u.password = newPw;
        Store.saveData ? Store.saveData(Store.getData()) : null;
        Store.logActivity('Reset Kata Sandi', 'Kata sandi berhasil direset via kode server', u);

        if (Sound) Sound.playFanfare();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Kata sandi akun ' + u.email + ' berhasil diperbarui! Silakan masuk.', 'success', 5000);

        // Reset state and open login
        authScreen = 'form';
        pendingResetPassword = null;
        App.modalData = 'login';

        var container = document.getElementById('modal-container');
        if (container) {
          container.innerHTML = '<div class="modal-sheet">' + AuthModule.renderAuthModal() + '</div>';
          var emailInp = document.getElementById('auth-email');
          if (emailInp) emailInp.value = u.email;
          var pwInp = document.getElementById('auth-password');
          if (pwInp) pwInp.focus();
        }
      } catch (err) {
        if (Sound) Sound.playError();
        this.showAuthError(err.message);
      }
    }
  };

  window.EventAuth = AuthModule;
})(window);
