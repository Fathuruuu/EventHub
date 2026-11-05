/**
 * EventHub Pro - Main Application Coordinator
 * Connects modular components, handles modal lifecycle, and mounts router
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Confetti = window.EventConfetti;
  var QR = window.EventQR;
  var App = window.EventApp;
  var Router = window.EventRouter;
  var Icons = Router.Icons;
  var formatRp = Router.formatRp;

  function renderModal() {
    var backdrop = document.getElementById('modal-container');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'modal-container';
      document.body.appendChild(backdrop);
    }
    backdrop.onclick = function(e) {
      if (e.target === backdrop) {
        EventHub.closeModal();
      }
    };

    if (!App.activeModal) {
      if (window.EventScannerService) {
        window.EventScannerService.stopCamera();
      }
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = '';
      return;
    }
    backdrop.className = 'modal-backdrop open';
    var html = ['<div class="modal-sheet">'];

    if (App.activeModal === 'auth') {
      html.push(EventAuth.renderAuthModal());
    } else if (App.activeModal === 'ticketQr') {
      var ticket = Store.getTickets().find(function(t){ return t.code === App.modalData; });
      if (ticket) {
        html.push(
          '<div class="modal-header">',
            '<h3 class="modal-title">E-Tiket & Kode QR</h3>',
            '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
          '</div>',
          '<div style="text-align:center; padding:10px 0">',
            '<div style="width:240px; height:240px; background:white; padding:12px; border-radius:18px; margin:0 auto 16px; box-shadow:0 10px 30px rgba(0,0,0,0.5)">',
              QR.generateSvg(ticket.code, { cellSize: 6, margin: 1 }),
            '</div>',
            '<div style="font-family:var(--font-mono); font-size:1.3rem; font-weight:800; letter-spacing:1px; margin-bottom:6px">' + ticket.code + '</div>',
            '<h4 style="font-size:1.15rem; font-weight:800">' + ticket.eventName + '</h4>',
            '<p style="color:#818cf8; font-weight:700; margin-bottom:16px">' + ticket.tierName + ' • Pemegang: ' + ticket.buyerName + '</p>',
            '<button class="btn-primary" style="width:auto; margin:0 auto; padding:10px 24px" onclick="window.print()">',
              Icons.download, ' Cetak / Simpan E-Tiket',
            '</button>',
          '</div>'
        );
      }
    } else if (App.activeModal === 'refundRequest') {
      var ticketToRefund = Store.getTickets().find(function(t){ return t.code === App.modalData; });
      if (ticketToRefund) {
        html.push(
          '<div class="modal-header">',
            '<h3 class="modal-title">Ajukan Refund Tiket</h3>',
            '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
          '</div>',
          '<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px">Pengajuan ini akan diverifikasi langsung oleh penyelenggara acara: <b>' + ticketToRefund.eventName + '</b>.</p>',

          '<div class="form-group">',
            '<label class="form-label">Tiket yang Dibatalkan</label>',
            '<input class="form-control" value="' + ticketToRefund.code + ' (' + ticketToRefund.tierName + ' - ' + formatRp(ticketToRefund.price) + ')" readonly style="opacity:0.8">',
          '</div>',

          '<div class="form-group">',
            '<label class="form-label">Alasan Pengajuan Refund</label>',
            '<select class="form-control" id="refund-reason">',
              '<option>Jadwal bentrok / berhalangan hadir</option>',
              '<option>Event diundur / perubahan lineup musisi</option>',
              '<option>Salah membeli kategori tiket</option>',
              '<option>Kondisi darurat kesehatan</option>',
              '<option>Alasan lainnya</option>',
            '</select>',
          '</div>',

          '<div class="form-group">',
            '<label class="form-label">Penjelasan Tambahan (Opsional)</label>',
            '<textarea class="form-control" id="refund-details" placeholder="Jelaskan detail alasan kepada penyelenggara..."></textarea>',
          '</div>',

          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
            '<div class="form-group">',
              '<label class="form-label">Bank / E-Wallet Tujuan</label>',
              '<select class="form-control" id="refund-bank">',
                '<option>BCA</option>',
                '<option>Mandiri</option>',
                '<option>BRI</option>',
                '<option>BNI</option>',
                '<option>GoPay</option>',
                '<option>Dana</option>',
                '<option>OVO</option>',
              '</select>',
            '</div>',
            '<div class="form-group">',
              '<label class="form-label">Nomor Rekening / Akun</label>',
              '<input class="form-control" id="refund-account" placeholder="Contoh: 1234567890">',
            '</div>',
          '</div>',

          '<div class="form-group">',
            '<label class="form-label">Nama Pemilik Rekening</label>',
            '<input class="form-control" id="refund-holder" value="' + ticketToRefund.buyerName + '">',
          '</div>',

          '<div style="background:var(--bg-surface-elevated); padding:14px; border-radius:var(--radius-md); margin:18px 0; font-size:0.85rem">',
            '<div style="display:flex; justify-content:space-between">',
              '<span>Nominal Pengembalian Dana:</span>',
              '<b style="color:#38bdf8; font-size:1.05rem">' + formatRp(ticketToRefund.price) + '</b>',
            '</div>',
          '</div>',

          '<button class="btn-primary" onclick="EventHub.submitRefundRequest(\'' + ticketToRefund.code + '\')">',
            'Kirim Pengajuan Refund ke Penyelenggara',
          '</button>'
        );
      }
    } else if (App.activeModal === 'rejectRefund') {
      var reqId = App.modalData;
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">Tolak Pengajuan Refund</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',
        '<p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:16px">Berikan alasan mengapa pengajuan refund peserta ini ditolak. Alasan akan ditampilkan di profil tiket peserta.</p>',

        '<div class="form-group">',
          '<label class="form-label">Pilih Opsi Alasan Penolakan</label>',
          '<select class="form-control" id="reject-reason-preset" onchange="if(this.value) document.getElementById(\'reject-reason-text\').value = this.value">',
            '<option value="">Pilih opsi...</option>',
            '<option value="Melewati batas waktu pengajuan H-3 acara sesuai syarat ketentuan.">Melewati batas waktu H-3 acara</option>',
            '<option value="Tiket kategori Promo / Flash Sale bersifat non-refundable.">Kategori non-refundable</option>',
            '<option value="Bukti dan data rekening tujuan tidak valid.">Data rekening tidak valid</option>',
            '<option value="Acara tetap berlangsung normal sesuai jadwal yang ditentukan.">Acara berjalan sesuai jadwal</option>',
          '</select>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Catatan Penolakan untuk Peserta</label>',
          '<textarea class="form-control" id="reject-reason-text" placeholder="Tulis alasan resmi kepada peserta..."></textarea>',
        '</div>',

        '<button class="btn-danger" style="width:100%; padding:12px; font-size:0.95rem" onclick="EventHub.submitRejectRefund(\'' + reqId + '\')">',
          'Konfirmasi Tolak Refund',
        '</button>'
      );
    } else if (App.activeModal === 'addTier' || App.activeModal === 'editTier') {
      var isEdit = App.activeModal === 'editTier';
      var eventId = App.modalData.eventId;
      var tierId = App.modalData.tierId;
      var ev = Store.getEventById(eventId);
      var tier = isEdit ? ev.tiers.find(function(t){ return t.id === tierId; }) : null;

      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">' + (isEdit ? 'Ubah Harga & Kuota Tiket' : 'Tambah Kategori Tiket Baru') + '</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Nama Kategori Tiket</label>',
          '<input class="form-control" id="tier-name" value="' + (tier ? tier.name : '') + '" placeholder="Contoh: VIP Front Row / Presale 2">',
        '</div>',

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
          '<div class="form-group">',
            '<label class="form-label">Harga Tiket (Rp)</label>',
            '<input class="form-control" id="tier-price" type="number" min="0" value="' + (tier ? tier.price : 50000) + '">',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Kuota Total</label>',
            '<input class="form-control" id="tier-quota" type="number" min="1" value="' + (tier ? tier.quota : 100) + '">',
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Fasilitas & Deskripsi Tiket</label>',
          '<input class="form-control" id="tier-desc" value="' + (tier ? tier.description : '') + '" placeholder="Contoh: Free drink voucher & tempat duduk VIP">',
        '</div>',

        '<button class="btn-primary" style="margin-top:16px" onclick="EventHub.saveTierForm(\'' + eventId + '\', \'' + (tierId || '') + '\')">',
          isEdit ? 'Simpan Perubahan Harga' : 'Terbitkan Kategori Tiket',
        '</button>'
      );
    } else if (App.activeModal === 'createEvent' || App.activeModal === 'editEvent') {
      var isEditEv = App.activeModal === 'editEvent';
      var evData = isEditEv ? Store.getEventById(App.modalData) : null;

      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">' + (isEditEv ? 'Edit Detail Acara' : 'Buat Event Baru') + '</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Nama Acara</label>',
          '<input class="form-control" id="ev-title" value="' + (evData ? evData.title : '') + '" placeholder="Nama konser / turnamen...">',
        '</div>',

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
          '<div class="form-group">',
            '<label class="form-label">Kategori</label>',
            '<select class="form-control" id="ev-cat">',
              '<option ' + (evData && evData.category === 'Musik' ? 'selected' : '') + '>Musik</option>',
              '<option ' + (evData && evData.category === 'Teknologi' ? 'selected' : '') + '>Teknologi</option>',
              '<option ' + (evData && evData.category === 'Gaming' ? 'selected' : '') + '>Gaming</option>',
              '<option ' + (evData && evData.category === 'Workshop' ? 'selected' : '') + '>Workshop</option>',
            '</select>',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Kota</label>',
            '<input class="form-control" id="ev-city" value="' + (evData ? evData.city : 'Bandung') + '">',
          '</div>',
        '</div>',

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
          '<div class="form-group">',
            '<label class="form-label">Tanggal (2026)</label>',
            '<input class="form-control" id="ev-date" type="date" value="' + (evData ? evData.date : '2026-12-15') + '">',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Waktu Acara</label>',
            '<input class="form-control" id="ev-time" value="' + (evData ? evData.time : '18:00 - 23:00 WIB') + '">',
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Venue / Gedung</label>',
          '<input class="form-control" id="ev-venue" value="' + (evData ? evData.venue : '') + '" placeholder="Gedung Sabuga / Convention Center">',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Deskripsi Lengkap</label>',
          '<textarea class="form-control" id="ev-desc" placeholder="Rincian acara, artis, dan jadwal...">' + (evData ? evData.description : '') + '</textarea>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label" style="display:flex; justify-content:space-between; align-items:center">',
            '<span>Banner Utama Acara</span>',
            '<small style="color:#818cf8; font-weight:600">Drag & Drop / Klik File</small>',
          '</label>',
          '<input type="hidden" id="ev-banner" value="' + (evData && evData.bannerImg ? evData.bannerImg : '') + '">',
          '<input type="file" id="ev-banner-file" accept="image/*" style="display:none" onchange="EventHub.handleMediaUpload(this, \'ev-banner\', \'ev-banner-preview\')">',
          '<div class="media-dropzone" id="ev-banner-dropzone" onclick="document.getElementById(\'ev-banner-file\').click()" ondragover="EventHub.handleDragOver(event, this)" ondragleave="EventHub.handleDragLeave(event, this)" ondrop="EventHub.handleDropMedia(event, \'ev-banner\', \'ev-banner-preview\', false, this)">',
            '<div class="media-dropzone-icon">🖼️</div>',
            '<div class="media-dropzone-title">Tarik & Lepas Foto Banner ke Sini</div>',
            '<div class="media-dropzone-sub">atau klik langsung untuk memilih foto banner (JPG, PNG, WebP)</div>',
            '<div class="media-dropzone-btn">📁 Pilih File Foto</div>',
          '</div>',
          '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px">',
            '<span style="font-size:0.75rem; color:#64748b">Preset Cepat:</span>',
            '<button type="button" class="btn-secondary" style="padding:4px 10px; font-size:0.74rem" onclick="EventHub.setPresetMedia(\'ev-banner\', \'ev-banner-preview\', \'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800\')">🎸 Template Musik</button>',
            '<button type="button" class="btn-secondary" style="padding:4px 10px; font-size:0.74rem" onclick="EventHub.setPresetMedia(\'ev-banner\', \'ev-banner-preview\', \'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800\')">🎮 Template Game</button>',
            '<button type="button" class="btn-secondary" style="padding:4px 10px; font-size:0.74rem" onclick="EventHub.setPresetMedia(\'ev-banner\', \'ev-banner-preview\', \'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800\')">💻 Template Tech</button>',
          '</div>',
          '<div id="ev-banner-preview">' +
            (evData && evData.bannerImg ? EventHub.renderBannerPreviewHtml(evData.bannerImg) : '<small style="color:#64748b; display:block; margin-top:6px">Belum ada foto banner yang dipilih.</small>') +
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label" style="display:flex; justify-content:space-between; align-items:center">',
            '<span>Video Trailer / Teaser Acara</span>',
            '<small style="color:#c084fc; font-weight:600">Drag & Drop / Klik File</small>',
          '</label>',
          '<input type="hidden" id="ev-trailer" value="' + (evData && evData.videoTrailer ? evData.videoTrailer : '') + '">',
          '<input type="file" id="ev-trailer-file" accept="video/mp4,video/webm" style="display:none" onchange="EventHub.handleMediaUpload(this, \'ev-trailer\', \'ev-trailer-preview\', true)">',
          '<div class="media-dropzone" id="ev-trailer-dropzone" onclick="document.getElementById(\'ev-trailer-file\').click()" ondragover="EventHub.handleDragOver(event, this)" ondragleave="EventHub.handleDragLeave(event, this)" ondrop="EventHub.handleDropMedia(event, \'ev-trailer\', \'ev-trailer-preview\', true, this)">',
            '<div class="media-dropzone-icon" style="color:#a855f7; background:rgba(168,85,247,0.12)">🎬</div>',
            '<div class="media-dropzone-title">Tarik & Lepas Video Trailer ke Sini</div>',
            '<div class="media-dropzone-sub">atau klik langsung untuk memilih file video (MP4, WebM maks 25MB)</div>',
            '<div class="media-dropzone-btn">📁 Pilih File Video</div>',
          '</div>',
          '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px">',
            '<span style="font-size:0.75rem; color:#64748b">Preset Cepat:</span>',
            '<button type="button" class="btn-secondary" style="padding:4px 10px; font-size:0.74rem" onclick="EventHub.setPresetMedia(\'ev-trailer\', \'ev-trailer-preview\', \'https://assets.mixkit.co/videos/preview/mixkit-audience-at-a-music-concert-holding-lights-42537-large.mp4\', true)">🎸 Template Teaser Musik</button>',
          '</div>',
          '<div id="ev-trailer-preview">' +
            (evData && evData.videoTrailer ? EventHub.renderTrailerPreviewHtml(evData.videoTrailer) : '<small style="color:#64748b; display:block; margin-top:6px">Belum ada video trailer yang dipilih.</small>') +
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label" style="display:flex; justify-content:space-between; align-items:center">',
            '<span>Foto-foto Galeri Acara</span>',
            '<small style="color:#22d3ee; font-weight:600">Bisa Banyak Sekaligus</small>',
          '</label>',
          '<input type="hidden" id="ev-gallery" value="' + (evData && evData.galleryImages ? evData.galleryImages.join(',') : '') + '">',
          '<input type="file" id="ev-gallery-files" accept="image/*" multiple style="display:none" onchange="EventHub.handleGalleryUpload(this)">',
          '<div class="media-dropzone" id="ev-gallery-dropzone" onclick="document.getElementById(\'ev-gallery-files\').click()" ondragover="EventHub.handleDragOver(event, this)" ondragleave="EventHub.handleDragLeave(event, this)" ondrop="EventHub.handleDropGallery(event, this)">',
            '<div class="media-dropzone-icon" style="color:#06b6d4; background:rgba(6,182,212,0.12)">📸</div>',
            '<div class="media-dropzone-title">Tarik & Lepas Banyak Foto Galeri ke Sini</div>',
            '<div class="media-dropzone-sub">atau klik langsung untuk memilih beberapa foto sekaligus dari komputer</div>',
            '<div class="media-dropzone-btn">📁 Unggah Foto Galeri</div>',
          '</div>',
          '<div id="ev-gallery-preview">' +
            (evData && evData.galleryImages && evData.galleryImages.length ? EventHub.renderGalleryPreviewHtml(evData.galleryImages) : '<small style="color:#64748b; display:block; margin-top:6px">Belum ada foto galeri.</small>') +
          '</div>',
        '</div>'
      );

      if (!isEditEv) {
        html.push(
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
            '<div class="form-group">',
              '<label class="form-label">Harga Tiket Awal (Rp)</label>',
              '<input class="form-control" id="ev-init-price" type="number" value="75000">',
            '</div>',
            '<div class="form-group">',
              '<label class="form-label">Kuota Tiket Awal</label>',
              '<input class="form-control" id="ev-init-quota" type="number" value="200">',
            '</div>',
          '</div>'
        );
      }

      if (isEditEv) {
        html.push(
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; gap:12px; flex-wrap:wrap; border-top:1px solid var(--border-glass); padding-top:16px">',
            '<button type="button" class="btn-danger" style="padding:10px 18px; font-size:0.85rem; border-radius:10px; display:inline-flex; align-items:center; gap:8px" onclick="EventHub.confirmDeleteEvent(\'' + evData.id + '\')">',
              '<span>🗑️</span> Hapus Acara Ini',
            '</button>',
            '<div style="display:flex; gap:10px">',
              '<button type="button" class="btn-secondary" onclick="EventHub.closeModal()">Batal</button>',
              '<button type="button" class="btn-primary" onclick="EventHub.saveEventForm(\'' + evData.id + '\')">Simpan Perubahan Acara</button>',
            '</div>',
          '</div>'
        );
      } else {
        html.push(
          '<div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-glass); padding-top:16px">',
            '<button type="button" class="btn-secondary" onclick="EventHub.closeModal()">Batal</button>',
            '<button type="button" class="btn-primary" onclick="EventHub.saveEventForm()">Terbitkan Acara Sekarang</button>',
          '</div>'
        );
      }
    } else if (App.activeModal === 'deleteEventConfirm') {
      var evToDelete = Store.getEventById(App.modalData);
      var evTitle = evToDelete ? evToDelete.title : 'Acara Ini';
      var evId = evToDelete ? evToDelete.id : App.modalData;
      var tixCount = Store.getTickets().filter(function(t){ return t.eventId === evId; }).length;
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title" style="color:#fb7185; display:flex; align-items:center; gap:8px">⚠️ Konfirmasi Hapus Acara</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',
        '<div style="padding:16px 0; text-align:center">',
          '<div style="font-size:3.5rem; margin-bottom:12px">🗑️</div>',
          '<h3 style="font-size:1.3rem; font-weight:800; color:#ffffff; margin-bottom:8px">Hapus Acara "' + evTitle + '"?</h3>',
          '<p style="font-size:0.88rem; color:#94a3b8; line-height:1.6; max-width:440px; margin:0 auto 16px">',
            'Apakah Anda yakin ingin menghapus acara ini secara permanen dari sistem? ',
            (tixCount ? '<br><b style="color:#fb7185">Perhatian: Ada ' + tixCount + ' tiket terkait yang juga akan ikut dibatalkan & dihapus.</b>' : ''),
          '</p>',
          '<div style="background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:10px; padding:12px; font-size:0.8rem; color:#fca5a5; max-width:440px; margin:0 auto 20px; text-align:left">',
            '⚠️ <b>Tindakan ini permanen dan tidak dapat dibatalkan.</b> Seluruh data tiket, kuota kategori, dan riwayat yang terkait dengan acara ini akan dihapus permanen.',
          '</div>',
          '<div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap">',
            '<button type="button" class="btn-secondary" style="padding:10px 22px" onclick="EventHub.closeModal()">Batal</button>',
            '<button type="button" class="btn-danger" style="padding:10px 24px; font-weight:700" onclick="EventHub.executeDeleteEvent(\'' + evId + '\')">Ya, Hapus Acara Permanen</button>',
          '</div>',
        '</div>'
      );
    } else if (App.activeModal === 'profile') {
      var u = Store.getCurrentUser();
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">Profil Akun Anda</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        '<div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding:16px; background:var(--bg-surface-elevated); border-radius:var(--radius-md)">',
          '<div class="user-avatar-sm" style="width:52px; height:52px; font-size:1.2rem">' + (u.avatarText || u.name[0]) + '</div>',
          '<div>',
            '<b style="font-size:1.1rem">' + u.name + '</b>',
            '<div style="font-size:0.8rem; color:var(--text-muted)">' + u.email + '</div>',
            '<span class="user-role-tag role-' + u.role + '" style="margin-top:4px; display:inline-block">' + u.role + '</span>',
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Nama Lengkap</label>',
          '<input class="form-control" id="prof-name" value="' + u.name + '">',
        '</div>',
        '<div class="form-group">',
          '<label class="form-label">Nomor WhatsApp / HP</label>',
          '<input class="form-control" id="prof-phone" value="' + (u.phone || '') + '">',
        '</div>',

        '<button class="btn-primary" style="margin-top:14px" onclick="EventHub.saveProfile()">Simpan Profil</button>',

        '<div style="margin-top:24px; padding-top:18px; border-top:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center">',
          '<button class="btn-secondary" style="color:#fb7185" onclick="EventHub.logout()">Keluar dari Akun</button>',
          '<button class="btn-secondary" style="font-size:0.8rem" onclick="EventHub.resetAllDemoData()">Reset Data Demo</button>',
        '</div>'
      );
    } else if (App.activeModal === 'createOrganizer') {
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">Buat Akun Penyelenggara Baru</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',
        '<div id="admin-org-err" class="auth-error-box" style="display:none"></div>',

        '<div class="form-group">',
          '<label class="form-label">Nama Lengkap Penanggung Jawab <span style="color:#f43f5e">*</span></label>',
          '<input class="form-control" id="adm-org-name" placeholder="Nama penanggung jawab EO">',
          '<span class="auth-req-hint">Minimal 3 karakter, huruf dan spasi.</span>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Nama Perusahaan / Promotor / Organisasi <span style="color:#f43f5e">*</span></label>',
          '<input class="form-control" id="adm-org-company" placeholder="Contoh: PT Kreasi Musik Indonesia">',
          '<span class="auth-req-hint">Wajib diisi minimal 3 karakter.</span>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Email Resmi Penyelenggara <span style="color:#f43f5e">*</span></label>',
          '<input class="form-control" id="adm-org-email" type="email" placeholder="organizer@event.id">',
          '<span class="auth-req-hint">Digunakan untuk login ke Panel Kasir Penyelenggara.</span>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Nomor WhatsApp / HP Kontak <span style="color:#f43f5e">*</span></label>',
          '<input class="form-control" id="adm-org-phone" type="tel" placeholder="08xxxxxxxxxx">',
          '<span class="auth-req-hint">Format Indonesia 10-13 digit (contoh: 081198765432).</span>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Kata Sandi Awal <span style="color:#f43f5e">*</span></label>',
          '<input class="form-control" id="adm-org-password" type="password" value="password123">',
          '<span class="auth-req-hint">Minimal 8 karakter dan kombinasi huruf serta angka.</span>',
        '</div>',

        '<button class="btn-primary" style="margin-top:18px; background:#10b981" onclick="EventHub.saveOrganizerByAdmin()">',
          'Terbitkan Akun Penyelenggara',
        '</button>'
      );
    } else if (App.activeModal === 'sendMessage') {
      var evId = App.modalData;
      var ev = Store.getEventById(evId);
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">Tanya Penyelenggara Acara</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',
        '<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px">Tanyakan seputar lineup, jadwal open gate, atau fasilitas acara <b>' + (ev ? ev.title : '') + '</b> langsung ke pihak ' + (ev ? ev.organizerName : 'Penyelenggara') + '.</p>',

        '<div class="form-group">',
          '<label class="form-label">Topik Pertanyaan</label>',
          '<input class="form-control" id="msg-subject" placeholder="Contoh: Ketentuan Masuk & Open Gate VIP">',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Pertanyaan Anda</label>',
          '<textarea class="form-control" id="msg-text" placeholder="Tuliskan pertanyaan Anda secara jelas..."></textarea>',
        '</div>',

        '<button class="btn-primary" style="margin-top:16px" onclick="EventHub.submitSendMessage(\'' + evId + '\')">',
          'Kirim Pesan ke Penyelenggara',
        '</button>'
      );
    } else if (App.activeModal === 'websiteFeedback') {
      var allEventsList = Store.getEvents();
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">Formulir Evaluasi & Feedback Layanan</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',
        '<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px">Beri evaluasi mengenai pelayanan penyelenggara, kenyamanan acara/venue, dan gate tiket. Hasil evaluasi <b>hanya dapat dilihat oleh tim Super Administrator</b>.</p>',

        '<div class="form-group">',
          '<label class="form-label">Acara / Penyelenggara yang Dievaluasi</label>',
          '<select class="form-control" id="fdb-target">' +
            '<option value="" disabled selected>-- Pilih Opsi Acara / Penyelenggara --</option>' +
            '<option value="Umum / Semua Penyelenggara">Umum / Semua Penyelenggara</option>' +
            allEventsList.map(function(e){ return '<option value="' + e.title + ' (' + e.organizerName + ')">' + e.title + ' - ' + e.organizerName + '</option>'; }).join('') +
          '</select>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Tingkat Kepuasan Layanan (Bintang 1-5)</label>',
          '<select class="form-control" id="fdb-rating">',
            '<option value="" disabled selected>-- Pilih Opsi Tingkat Kepuasan --</option>',
            '<option value="5">⭐⭐⭐⭐⭐ Sangat Memuaskan (5 Bintang)</option>',
            '<option value="4">⭐⭐⭐⭐ Puas & Tertib (4 Bintang)</option>',
            '<option value="3">⭐⭐⭐ Cukup / Standar (3 Bintang)</option>',
            '<option value="2">⭐⭐ Kurang Memuaskan (2 Bintang)</option>',
            '<option value="1">⭐ Perlu Banyak Perbaikan (1 Bintang)</option>',
          '</select>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Aspek Pelayanan yang Dinilai</label>',
          '<select class="form-control" id="fdb-cat">',
            '<option value="" disabled selected>-- Pilih Opsi Aspek Pelayanan --</option>',
            '<option value="Pelayanan & Kejelasan Informasi Penyelenggara">Pelayanan & Kejelasan Informasi Penyelenggara</option>',
            '<option value="Ketertiban Gate & Kecepatan Scan Tiket">Ketertiban Gate & Kecepatan Scan Tiket</option>',
            '<option value="Kenyamanan & Fasilitas Tempat Acara (Venue)">Kenyamanan & Fasilitas Tempat Acara (Venue)</option>',
            '<option value="Kemudahan Transaksi & Pembayaran Tiket">Kemudahan Transaksi & Pembayaran Tiket</option>',
            '<option value="Tanggapan Penyelenggara Terhadap Refund / Keluhan">Tanggapan Penyelenggara Terhadap Refund / Keluhan</option>',
            '<option value="Kritik & Saran Pengembangan Lainnya">Kritik & Saran Pengembangan Lainnya</option>',
          '</select>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Komentar, Ulasan & Saran Lengkap</label>',
          '<textarea class="form-control" id="fdb-comment" placeholder="Ceritakan pengalaman Anda mengenai pelayanan penyelenggara atau acara..."></textarea>',
        '</div>',

        '<button class="btn-primary" style="margin-top:16px; background:#10b981" onclick="EventHub.submitWebsiteFeedback()">',
          'Kirim Feedback ke Tim Admin',
        '</button>'
      );
    } else if (App.activeModal === 'emailConfig') {
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">Hubungkan Gmail Pengirim (Google SMTP)</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',
        '<div style="background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.3); padding:16px; border-radius:12px; margin-bottom:18px; font-size:0.85rem; line-height:1.6">',
          '<b style="color:#ffffff">Panduan 3 Langkah Menghubungkan Gmail:</b><br>',
          '1. Buka <b>myaccount.google.com/security</b> dan pastikan <i>Verifikasi 2 Langkah</i> aktif.<br>',
          '2. Buka <b>myaccount.google.com/apppasswords</b>, ketik nama "EventHub", lalu klik <b>Buat</b>.<br>',
          '3. Salin 16 karakter sandi aplikasi yang diberikan Google dan masukkan di bawah ini.',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Email Gmail Pengirim</label>',
          '<input class="form-control" id="cfg-gmail-user" placeholder="contoh: akun.anda@gmail.com">',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Google App Password (16 Karakter)</label>',
          '<input class="form-control" id="cfg-gmail-pass" type="password" placeholder="xxxx xxxx xxxx xxxx" style="font-family:var(--font-mono)">',
        '</div>',

        '<button class="btn-primary" style="margin-top:16px; background:#10b981" onclick="EventHub.saveEmailConfig()">',
          '💾 Simpan & Uji Coba Kirim Email',
        '</button>'
      );
    } else if (App.activeModal === 'maintenance') {
      var maint = Store.getMaintenanceMode();
      var isAct = !!(maint && maint.active);
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">🚧 Kontrol Mode Pemeliharaan (Maintenance)</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        // Status Card
        '<div style="background:' + (isAct ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)') + '; border:1px solid ' + (isAct ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)') + '; padding:14px 18px; border-radius:12px; margin-bottom:18px; display:flex; align-items:center; gap:14px">',
          '<div style="font-size:2rem">' + (isAct ? '🔒' : '🌐') + '</div>',
          '<div style="flex:1">',
            '<div style="font-weight:800; font-size:0.95rem; color:' + (isAct ? '#f87171' : '#34d399') + '">' +
              (isAct ? 'STATUS: PEMELIHARAAN AKTIF (PLATFORM DIKUNCI)' : 'STATUS: NORMAL / LIVE (PLATFORM DAPAT DIAKSES)') +
            '</div>',
            '<div style="font-size:0.8rem; color:#94a3b8; margin-top:2px">' +
              (isAct ? 'Seluruh pengunjung non-admin dialihkan ke layar pemeliharaan. Hanya Super Admin yang memiliki hak bypass.'
                     : 'Website dan transaksi berjalan lancar tanpa pembatasan pemeliharaan.') +
            '</div>',
          '</div>',
        '</div>',

        // Switch Toggle
        '<div style="background:var(--bg-surface-elevated); padding:14px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px">',
          '<div>',
            '<label for="maint-active-toggle" style="font-weight:700; color:#ffffff; cursor:pointer; display:block; margin-bottom:2px">Kunci Platform untuk Pemeliharaan</label>',
            '<small style="color:#94a3b8; font-size:0.78rem">Aktifkan untuk mengalihkan pengunjung umum ke layar pemeliharaan.</small>',
          '</div>',
          '<input type="checkbox" id="maint-active-toggle" ' + (isAct ? 'checked' : '') + ' style="width:22px; height:22px; cursor:pointer; accent-color:#f59e0b">',
        '</div>',

        // Presets
        '<div style="margin-bottom:16px">',
          '<label class="form-label" style="font-size:0.8rem; margin-bottom:6px">⚡ Preset Cepat Estimasi Waktu:</label>',
          '<div style="display:flex; gap:6px; flex-wrap:wrap">',
            '<button type="button" class="btn-secondary" style="padding:5px 10px; font-size:0.75rem" onclick="document.getElementById(\'maint-est-end\').value=\'Sekitar 30 menit ke depan\'">⏱️ 30 Menit</button>',
            '<button type="button" class="btn-secondary" style="padding:5px 10px; font-size:0.75rem" onclick="document.getElementById(\'maint-est-end\').value=\'Sekitar 1-2 jam ke depan\'">🛠️ 1-2 Jam</button>',
            '<button type="button" class="btn-secondary" style="padding:5px 10px; font-size:0.75rem" onclick="document.getElementById(\'maint-est-end\').value=\'Sekitar 4 jam ke depan\'">🚀 4 Jam</button>',
            '<button type="button" class="btn-secondary" style="padding:5px 10px; font-size:0.75rem" onclick="document.getElementById(\'maint-est-end\').value=\'Pukul 05:00 WIB Pagi Ini\'">🌙 Selesai Subuh</button>',
          '</div>',
        '</div>',

        // Form Fields
        '<div class="form-group">',
          '<label class="form-label">Estimasi Waktu Selesai</label>',
          '<input class="form-control" id="maint-est-end" value="' + (maint.estimatedEnd || 'Sekitar 1-2 jam ke depan') + '" placeholder="Contoh: Sekitar 1-2 jam ke depan">',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Pesan Informasi Pemeliharaan untuk Pengunjung</label>',
          '<textarea class="form-control" id="maint-message" rows="3" placeholder="Tuliskan pesan pemeliharaan untuk peserta...">' +
            (maint.message || 'Sistem EventHub sedang dalam pemeliharaan rutin untuk peningkatan infrastruktur dan stabilitas transaksi.') +
          '</textarea>',
        '</div>',

        '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:22px; flex-wrap:wrap; gap:10px">',
          (isAct ? '<button type="button" class="btn-danger" style="padding:10px 16px; font-size:0.85rem; width:auto" onclick="EventHub.quickToggleMaintenance(false)">✓ Matikan Maintenance Sekarang</button>' : '<div></div>'),
          '<div style="display:flex; gap:10px">',
            '<button type="button" class="btn-secondary" style="padding:10px 18px" onclick="EventHub.closeModal()">Batal</button>',
            '<button type="button" class="btn-primary" style="width:auto; padding:10px 22px; background:' + (isAct ? '#f59e0b' : '#10b981') + '; border:none" onclick="EventHub.saveMaintenanceForm()">',
              '💾 Simpan Pengaturan',
            '</button>',
          '</div>',
        '</div>'
      );
    } else if (App.activeModal === 'editMembership') {
      var planId = App.modalData || 'gold';
      var plan = (Store.getMemberships() || []).find(function(p){ return p.id === planId; }) || {
        id: 'gold', name: 'Gold VIP Pass', price: 59000, badgeText: 'GOLD VIP', benefits: []
      };

      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">✏️ Edit Harga & Ketentuan Subscription</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Pilih Paket yang Ingin Diedit</label>',
          '<select class="form-control" id="plan-id-select" onchange="EventHub.openEditMembershipModal(this.value)">',
            '<option value="silver" ' + (plan.id === 'silver' ? 'selected' : '') + '>Starter (Silver Express)</option>',
            '<option value="gold" ' + (plan.id === 'gold' ? 'selected' : '') + '>Pro (Gold VIP Pass - Paling Populer)</option>',
            '<option value="platinum" ' + (plan.id === 'platinum' ? 'selected' : '') + '>Business (Platinum Black)</option>',
          '</select>',
        '</div>',

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
          '<div class="form-group">',
            '<label class="form-label">Harga Durasi 1 Bulan (Rp)</label>',
            '<input class="form-control" id="plan-price" type="number" value="' + plan.price + '">',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Harga Durasi 1 Tahun (Rp)</label>',
            '<input class="form-control" id="plan-price-yearly" type="number" value="' + (plan.priceYearly || plan.price * 10) + '">',
            '<small style="color:#10b981; font-weight:600">Disarankan bayar 10 bulan hemat 2 bulan.</small>',
          '</div>',
        '</div>',

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
          '<div class="form-group">',
            '<label class="form-label">Nama Sub-Paket</label>',
            '<input class="form-control" id="plan-name" value="' + plan.name + '">',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Teks Badge (Header & Tiket)</label>',
            '<input class="form-control" id="plan-badge" value="' + (plan.badgeText || '') + '">',
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Daftar Fasilitas / Keuntungan (Satu baris per fasilitas)</label>',
          '<textarea class="form-control" id="plan-benefits" rows="5">' + (plan.benefits ? plan.benefits.join('\n') : '') + '</textarea>',
        '</div>',

        '<div class="form-group" style="display:flex; align-items:center; gap:8px">',
          '<input type="checkbox" id="plan-popular" ' + (plan.popular ? 'checked' : '') + ' style="width:18px; height:18px; cursor:pointer">',
          '<label for="plan-popular" style="color:#ffffff; font-size:0.9rem; cursor:pointer">Tandai sebagai Paket Paling Populer (Ribbon & Kartu Menonjol)</label>',
        '</div>',

        '<button class="btn-primary" style="margin-top:16px; background:linear-gradient(135deg, #10b981, #059669)" onclick="EventHub.saveMembershipForm(\'' + plan.id + '\')">',
          '💾 Simpan Perubahan Harga & Ketentuan Paket',
        '</button>'
      );
    } else if (App.activeModal === 'editHero') {
      var hero = Store.getHeroConfig();
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">✏️ Edit Konten & Video Hero Banner</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Teks Badge Pill (Paling Atas)</label>',
          '<input class="form-control" id="hero-badge-input" value="' + (hero.badgeText || '') + '">',
        '</div>',

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">',
          '<div class="form-group">',
            '<label class="form-label">Judul Baris 1 (Teks Putih)</label>',
            '<input class="form-control" id="hero-title1-input" value="' + (hero.title1 || '') + '">',
          '</div>',
          '<div class="form-group">',
            '<label class="form-label">Judul Baris 2 (Gradien Neon)</label>',
            '<input class="form-control" id="hero-title2-input" value="' + (hero.title2 || '') + '">',
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Deskripsi Menarik (Subtitle)</label>',
          '<textarea class="form-control" id="hero-desc-input" rows="4">' + (hero.description || '') + '</textarea>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Video Background Hero Banner</label>',
          '<input type="hidden" id="hero-video-url-input" value="' + (hero.videoUrl || '') + '">',
          '<input type="file" id="hero-video-file-picker" accept="video/mp4,video/webm" style="display:none" onchange="EventHub.handleMediaUpload(this, \'hero-video-url-input\', \'hero-video-live-preview\', true)">',
          '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">',
            '<button type="button" class="btn-primary" style="padding:10px 18px; font-size:0.85rem; background:linear-gradient(135deg, #8b5cf6, #6366f1); display:flex; align-items:center; gap:8px" onclick="document.getElementById(\'hero-video-file-picker\').click()">',
              '📁 Pilih & Unggah Video dari Komputer',
            '</button>',
          '</div>',
          '<div style="font-size:0.75rem; color:#94a3b8; margin:10px 0 6px">Atau Pilih Langsung Video Event Siap Pakai:</div>',
          '<div style="display:flex; gap:6px; flex-wrap:wrap">',
            '<button type="button" class="btn-secondary" style="padding:6px 12px; font-size:0.75rem" onclick="EventHub.setPresetMedia(\'hero-video-url-input\', \'hero-video-live-preview\', \'https://assets.mixkit.co/videos/preview/mixkit-audience-at-a-music-concert-holding-lights-42537-large.mp4\', true)">🎸 Konser Live Musik</button>',
            '<button type="button" class="btn-secondary" style="padding:6px 12px; font-size:0.75rem" onclick="EventHub.setPresetMedia(\'hero-video-url-input\', \'hero-video-live-preview\', \'https://assets.mixkit.co/videos/preview/mixkit-stage-lights-at-a-rock-concert-42544-large.mp4\', true)">🎆 Festival EDM & Laser</button>',
            '<button type="button" class="btn-secondary" style="padding:6px 12px; font-size:0.75rem" onclick="EventHub.setPresetMedia(\'hero-video-url-input\', \'hero-video-live-preview\', \'https://assets.mixkit.co/videos/preview/mixkit-stadium-lights-in-the-night-42536-large.mp4\', true)">🏟️ Stadion Megah</button>',
          '</div>',
          '<div id="hero-video-live-preview" style="margin-top:12px">' +
            (hero.videoUrl ? '<video src="' + hero.videoUrl + '" autoplay loop muted style="height:120px; border-radius:10px; border:1px solid var(--border-glass)"></video>' : '<small style="color:#64748b">Belum ada video dipilih.</small>') +
          '</div>',
        '</div>',

        '<div class="form-group">',
          '<label class="form-label">Gambar Poster Cadangan (Saat Video Dimatikan)</label>',
          '<input type="hidden" id="hero-video-poster-input" value="' + (hero.videoPoster || '') + '">',
          '<input type="file" id="hero-poster-file-picker" accept="image/*" style="display:none" onchange="EventHub.handleMediaUpload(this, \'hero-video-poster-input\', \'hero-poster-live-preview\')">',
          '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">',
            '<button type="button" class="btn-secondary" style="padding:9px 16px; font-size:0.82rem; display:flex; align-items:center; gap:8px" onclick="document.getElementById(\'hero-poster-file-picker\').click()">',
              '🖼️ Pilih Foto Poster dari Komputer',
            '</button>',
            '<button type="button" class="btn-secondary" style="padding:6px 10px; font-size:0.75rem" onclick="EventHub.setPresetMedia(\'hero-video-poster-input\', \'hero-poster-live-preview\', \'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600\')">🎤 Panggung Megah</button>',
            '<button type="button" class="btn-secondary" style="padding:6px 10px; font-size:0.75rem" onclick="EventHub.setPresetMedia(\'hero-video-poster-input\', \'hero-poster-live-preview\', \'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600\')">🌌 Crowd Penonton</button>',
          '</div>',
          '<div id="hero-poster-live-preview" style="margin-top:10px">' +
            (hero.videoPoster ? '<img src="' + hero.videoPoster + '" style="height:90px; border-radius:10px; border:1px solid var(--border-glass)">' : '<small style="color:#64748b">Belum ada poster dipilih.</small>') +
          '</div>',
        '</div>',

        '<div class="form-group" style="display:flex; align-items:center; gap:8px">',
          '<input type="checkbox" id="hero-show-video-input" ' + (hero.showVideo ? 'checked' : '') + ' style="width:18px; height:18px; cursor:pointer">',
          '<label for="hero-show-video-input" style="color:#ffffff; font-size:0.9rem; cursor:pointer">Aktifkan Video Background Bergerak di Hero Banner</label>',
        '</div>',

        '<button class="btn-primary" style="margin-top:16px; background:linear-gradient(135deg, #10b981, #059669)" onclick="EventHub.saveHeroForm()">',
          '💾 Simpan Perubahan Hero Banner',
        '</button>'
      );
    } else if (App.activeModal === 'quickScan') {
      html.push(
        '<div class="modal-header">',
          '<h3 class="modal-title">📷 Scan Tiket Acara</h3>',
          '<button class="modal-close-btn" onclick="EventHub.closeModal()">✕</button>',
        '</div>',

        '<div style="text-align:center; margin-bottom:14px; font-size:0.85rem; color:#94a3b8">',
          'Arahkan kamera ke kode QR e-tiket peserta untuk memeriksa keabsahan & status check-in gate secara instan.',
        '</div>',

        // Viewfinder
        '<div class="scanner-viewfinder" style="border-radius:18px; margin-bottom:14px; height:240px; background:#000000; position:relative; overflow:hidden">',
          '<video id="quick-scanner-video" playsinline webkit-playsinline autoplay muted style="width:100%; height:100%; object-fit:cover; display:block"></video>',
          '<canvas id="quick-scanner-canvas" style="display:none"></canvas>',
          '<div class="scanner-laser-beam" style="animation:laserSweep 1.8s infinite"></div>',
          // Mobile Controls Overlay (Flip Kamera Depan/Belakang, Flash Senter, dan Efek Suara Blip)
          '<div class="scanner-controls-overlay">',
            '<button type="button" class="scanner-ctrl-btn" onclick="EventHub.flipCamera(\'quick-scanner-video\')" title="Balik Kamera Depan / Belakang">',
              '<span>🔄</span> <span id="lbl-flip-cam">Flip</span>',
            '</button>',
            '<div style="display:flex; gap:6px">',
              '<button type="button" class="scanner-ctrl-btn" id="btn-quick-torch" onclick="EventHub.toggleTorch(\'btn-quick-torch\')" title="Lampu Flash Senter Kamera (Android / iOS)">',
                '<span>⚡</span> <span>Flash</span>',
              '</button>',
              '<button type="button" class="scanner-ctrl-btn" id="btn-quick-sound" onclick="EventHub.toggleScanSound(\'btn-quick-sound\')" title="Efek Suara Blip Scanner">',
                '<span>🔊</span> <span>Blip</span>',
              '</button>',
            '</div>',
          '</div>',
          '<div id="quick-scanner-fallback" style="display:none; position:absolute; inset:0; background:#0f172a; flex-direction:column; align-items:center; justify-content:center; padding:16px; text-align:center; z-index:5">',
            '<div style="font-size:2.2rem; margin-bottom:6px">📷</div>',
            '<b style="color:#ffffff; font-size:0.95rem">Kamera Belum Aktif</b>',
            '<p style="font-size:0.75rem; color:#94a3b8; margin:4px 0 12px; max-width:280px">Izinkan akses kamera di peramban atau klik tombol di bawah untuk menyalakan ulang.</p>',
            '<button type="button" class="btn-primary" style="width:auto; padding:8px 18px; font-size:0.8rem; background:linear-gradient(135deg, #6366f1, #8b5cf6)" onclick="EventHub.restartQuickScanCamera()">',
              '▶️ Nyalakan Kamera',
            '</button>',
          '</div>',
          '<div style="position:absolute; bottom:10px; left:0; right:0; text-align:center; z-index:4">',
            '<span style="background:rgba(0,0,0,0.7); color:#ffffff; font-size:0.75rem; font-weight:700; padding:4px 12px; border-radius:99px; backdrop-filter:blur(8px)">',
              'Arahkan Kamera ke Kode QR Tiket',
            '</span>',
          '</div>',
        '</div>',

        // Live Validation Result Container
        '<div id="quick-scan-result-container"></div>',

        // Manual Input Section
        '<div style="margin-top:14px">',
          '<label class="form-label" style="font-size:0.8rem">Atau Masukkan Kode Tiket Manual:</label>',
          '<div style="display:flex; gap:8px">',
            '<input class="form-control" id="quick-ticket-input" placeholder="Contoh: EH-JZZ-8K21FA" style="font-family:var(--font-mono); font-weight:700" onkeydown="if(event.key===\'Enter\') EventHub.doQuickScanInput()">',
            '<button class="btn-primary" style="width:auto; padding:8px 18px; white-space:nowrap; background:#10b981" onclick="EventHub.doQuickScanInput()">',
              'Validasi',
            '</button>',
          '</div>',
        '</div>',

        // Native Camera Fallback for Mobile (Android & iOS)
        '<div style="margin-top:14px; display:flex; gap:8px">',
          '<input type="file" id="mobile-qr-file-input" accept="image/*" capture="environment" style="display:none" onchange="EventHub.handleQrFileInput(this)">',
          '<button class="btn-secondary" style="flex:1; padding:9px 12px; font-size:0.8rem" onclick="document.getElementById(\'mobile-qr-file-input\').click()">',
            '📱 Ambil Foto Kamera HP (Kamera Native)',
          '</button>',
        '</div>'
      );
    }
    html.push('</div>');
    backdrop.innerHTML = html.join('');
  }

  window.EventHub = {
    go: Router.navigate,
    showToast: Router.showToast,

    toggleBookmark: function(eventId) {
      if (Sound) Sound.playClick();
      var isBookmarked = Store.toggleBookmark(eventId);
      Router.showToast(isBookmarked ? 'Event disimpan ke favorit!' : 'Event dihapus dari favorit.', 'success');
      renderApp();
    },

    handleSearch: function(val) {
      App.searchQuery = val;
      renderApp();
    },

    handleCategorySelect: function(cat) {
      if (Sound) Sound.playClick();
      App.selectedCategory = cat;
      renderApp();
    },

    handlePriceFilter: function(val) {
      App.maxPrice = val;
      renderApp();
    },

    resetFilters: function() {
      App.searchQuery = '';
      App.selectedCategory = 'Semua';
      App.maxPrice = '';
      renderApp();
    },

    selectTier: function(tierId) {
      if (Sound) Sound.playClick();
      App.checkoutTierId = tierId;
      App.checkoutQty = 1;
      renderApp();
    },

    updateCheckoutQty: function(delta) {
      if (Sound) Sound.playClick();
      App.checkoutQty = Math.max(1, Math.min(5, App.checkoutQty + delta));
      renderApp();
    },

    startCheckout: function(eventId, tierId) {
      var user = Store.getCurrentUser();
      if (!user) {
        App.pendingEventId = eventId;
        App.authNotice = 'Silakan masuk atau daftar akun terlebih dahulu untuk memilih & memesan tiket acara.';
        Router.triggerPreloader('Mempersiapkan Akses Tiket...', 700, function() {
          EventHub.openAuthModal('login');
        });
        return;
      }
      if (user.role === 'penyelenggara') {
        Router.showToast('Akun Penyelenggara tidak dapat membeli tiket. Silakan gunakan akun Peserta.', 'warning');
        return;
      }

      App.checkoutEventId = eventId;
      App.checkoutTierId = tierId;
      App.checkoutStep = 1;
      App.checkoutVoucherCode = '';
      App.checkoutVoucherDiscount = 0;
      Router.navigate('checkout');
    },

    setPaymentMethod: function(method) {
      if (Sound) Sound.playClick();
      App.checkoutPaymentMethod = method;
      renderApp();
    },

    applyVoucher: function() {
      EventCheckout.applyVoucher();
    },

    proceedToPaymentGateway: function() {
      EventCheckout.proceedToPaymentGateway();
    },

    completePaymentSimulation: function() {
      EventCheckout.completePaymentSimulation();
    },

    // Organizer Controls
    switchOrganizerEvent: function(eventId) {
      if (Sound) Sound.playClick();
      App.activeOrganizerEventId = eventId;
      App.lastScanResult = null;
      renderApp();
    },

    doScanInput: function() {
      var code = (document.getElementById('manual-ticket-code').value || '').trim();
      var user = Store.getCurrentUser();
      var res = Store.scanTicket(code, App.activeOrganizerEventId, user.email);

      App.lastScanResult = res;

      if (res.status === 'success') {
        if (Sound) Sound.playSuccess();
        if (Confetti) Confetti.burst(window.innerWidth * 0.5, window.innerHeight * 0.5, 60);
        Router.showToast('VALID! Check-in berhasil.', 'success');
        document.getElementById('manual-ticket-code').value = '';
      } else if (res.status === 'warning') {
        if (Sound) Sound.playWarning();
        Router.showToast(res.message, 'warning');
      } else {
        if (Sound) Sound.playError();
        Router.showToast(res.message, 'error');
      }

      renderApp();
    },

    testScanPicker: function() {
      var picker = document.getElementById('sample-ticket-picker');
      if (picker && picker.value) {
        document.getElementById('manual-ticket-code').value = picker.value;
        this.doScanInput();
      }
    },
    // Camera Scanner Controls (Penyelenggara)
    toggleOrganizerCamera: async function() {
      var videoEl = document.getElementById('organizer-video');
      var placeholderEl = document.getElementById('organizer-cam-placeholder');
      var btnEl = document.getElementById('btn-org-cam');
      var selectEl = document.getElementById('org-cam-select');

      if (!videoEl) return;

      if (window.EventScannerService && window.EventScannerService.isRunning()) {
        window.EventScannerService.stopCamera(videoEl);
        if (placeholderEl) placeholderEl.style.display = 'flex';
        videoEl.style.display = 'none';
        if (btnEl) {
          btnEl.textContent = '📷 Aktifkan Kamera';
          btnEl.style.background = 'var(--gradient-brand)';
        }
        if (selectEl) selectEl.style.display = 'none';
        Router.showToast('Kamera dinonaktifkan.', 'info');
      } else {
        Router.showToast('Menghubungkan ke kamera...', 'info');
        var success = await window.EventScannerService.startCamera(
          videoEl,
          function(code) {
            EventHub.handleCameraScan(code);
          },
          function(errMsg) {
            Router.showToast(errMsg, 'error');
          }
        );

        if (success) {
          if (placeholderEl) placeholderEl.style.display = 'none';
          videoEl.style.display = 'block';
          if (btnEl) {
            btnEl.textContent = '⏹ Matikan Kamera';
            btnEl.style.background = '#f43f5e';
          }

          var cameras = await window.EventScannerService.getAvailableCameras();
          if (cameras.length > 1 && selectEl) {
            selectEl.innerHTML = cameras.map(function(c, idx) {
              return '<option value="' + c.deviceId + '">' + (c.label || ('Kamera ' + (idx + 1))) + '</option>';
            }).join('');
            selectEl.style.display = 'inline-block';
          }
          Router.showToast('Kamera aktif! Arahkan ke kode QR tiket.', 'success');
        }
      }
    },

    switchOrganizerCamera: async function(deviceId) {
      var videoEl = document.getElementById('organizer-video');
      if (!videoEl) return;
      await window.EventScannerService.startCamera(
        videoEl,
        function(code) { EventHub.handleCameraScan(code); },
        function(err) { Router.showToast(err, 'error'); },
        deviceId
      );
    },

    handleCameraScan: function(code) {
      var user = Store.getCurrentUser();
      var res = Store.scanTicket(code, App.activeOrganizerEventId, user.email);
      App.lastScanResult = res;

      if (res.status === 'success') {
        if (Sound) Sound.playSuccess();
        if (Confetti) Confetti.burst(window.innerWidth * 0.5, window.innerHeight * 0.5, 70);
        Router.showToast('VALID! Check-in: ' + (res.ticket ? res.ticket.buyerName : code), 'success');
        Store.logActivity('Scan Gate Masuk', 'Berhasil check-in tiket ' + code + ' (' + (res.ticket ? res.ticket.buyerName : '') + ')', user);
      } else if (res.status === 'warning') {
        if (Sound) Sound.playWarning();
        Router.showToast(res.message, 'warning');
        Store.logActivity('Scan Peringatan', res.message + ' (Kode: ' + code + ')', user);
      } else {
        if (Sound) Sound.playError();
        Router.showToast(res.message, 'error');
        Store.logActivity('Scan Ditolak', res.message + ' (Kode: ' + code + ')', user);
      }

      // SURGICAL DOM UPDATE: Update result box directly without re-rendering DOM so the camera video keeps playing!
      var resBox = document.getElementById('organizer-scan-result-box');
      if (resBox) {
        var bannerClass = res.status === 'success' ? 'scan-result-success'
          : res.status === 'warning' ? 'scan-result-warning'
          : 'scan-result-error';
        var bannerIcon = res.status === 'success' ? '✓' : res.status === 'warning' ? '⚠️' : '✖';

        resBox.innerHTML = [
          '<div class="scan-result-card ' + bannerClass + '" style="margin-top:12px; padding:12px 14px; flex-direction:column; gap:8px">',
            '<div style="display:flex; align-items:center; gap:10px">',
              '<div style="font-size:1.4rem">' + bannerIcon + '</div>',
              '<div>',
                '<div style="font-weight:800; font-size:0.85rem">' + res.message + '</div>',
                res.ticket ? '<div style="font-size:0.75rem; opacity:0.9">' + res.ticket.buyerName + ' (' + res.ticket.tierName + ')</div>' : '',
              '</div>',
            '</div>',
            '<button class="btn-primary" style="padding:6px 14px; font-size:0.78rem; width:100%; margin-top:4px; background:#1d4ed8" onclick="EventHub.resumeScanner()">',
              '🔄 Scan Tiket Berikutnya',
            '</button>',
          '</div>'
        ].join('');
      }
    },

    // Camera Scanner Controls (Super Admin)
    toggleAdminCamera: async function() {
      var videoEl = document.getElementById('admin-video');
      var placeholderEl = document.getElementById('admin-cam-placeholder');
      var btnEl = document.getElementById('btn-admin-cam');
      var selectEl = document.getElementById('admin-cam-select');

      if (!videoEl) return;

      if (window.EventScannerService && window.EventScannerService.isRunning()) {
        window.EventScannerService.stopCamera(videoEl);
        if (placeholderEl) placeholderEl.style.display = 'flex';
        videoEl.style.display = 'none';
        if (btnEl) {
          btnEl.textContent = '📷 Aktifkan Kamera Admin';
          btnEl.style.background = 'var(--gradient-brand)';
        }
        if (selectEl) selectEl.style.display = 'none';
        Router.showToast('Kamera admin dinonaktifkan.', 'info');
      } else {
        Router.showToast('Menghubungkan ke kamera administrator...', 'info');
        var success = await window.EventScannerService.startCamera(
          videoEl,
          function(code) {
            EventHub.handleAdminCameraScan(code);
          },
          function(errMsg) {
            Router.showToast(errMsg, 'error');
          }
        );

        if (success) {
          if (placeholderEl) placeholderEl.style.display = 'none';
          videoEl.style.display = 'block';
          if (btnEl) {
            btnEl.textContent = '⏹ Matikan Kamera Admin';
            btnEl.style.background = '#f43f5e';
          }

          var cameras = await window.EventScannerService.getAvailableCameras();
          if (cameras.length > 1 && selectEl) {
            selectEl.innerHTML = cameras.map(function(c, idx) {
              return '<option value="' + c.deviceId + '">' + (c.label || ('Kamera ' + (idx + 1))) + '</option>';
            }).join('');
            selectEl.style.display = 'inline-block';
          }
          Router.showToast('Kamera admin aktif! Memindai seluruh tiket platform.', 'success');
        }
      }
    },

    switchAdminCamera: async function(deviceId) {
      var videoEl = document.getElementById('admin-video');
      if (!videoEl) return;
      await window.EventScannerService.startCamera(
        videoEl,
        function(code) { EventHub.handleAdminCameraScan(code); },
        function(err) { Router.showToast(err, 'error'); },
        deviceId
      );
    },

    handleAdminCameraScan: function(code) {
      var user = Store.getCurrentUser();
      var res = Store.scanTicket(code, null, user.email);
      App.lastAdminScanResult = res;

      if (res.status === 'success') {
        if (Sound) Sound.playSuccess();
        if (Confetti) Confetti.burst(window.innerWidth * 0.5, window.innerHeight * 0.5, 70);
        Router.showToast('VALID! (' + (res.ticket ? res.ticket.eventName : '') + ')', 'success');
        Store.logActivity('Scan Gate Admin', 'Validasi tiket ' + code + ' (' + (res.ticket ? res.ticket.eventName : '') + ')', user);
      } else if (res.status === 'warning') {
        if (Sound) Sound.playWarning();
        Router.showToast(res.message, 'warning');
        Store.logActivity('Scan Admin Peringatan', res.message + ' (Kode: ' + code + ')', user);
      } else {
        if (Sound) Sound.playError();
        Router.showToast(res.message, 'error');
        Store.logActivity('Scan Admin Ditolak', res.message + ' (Kode: ' + code + ')', user);
      }

      var resBox = document.getElementById('admin-scan-result-box');
      if (resBox) {
        var bannerClass = res.status === 'success' ? 'scan-result-success'
          : res.status === 'warning' ? 'scan-result-warning'
          : 'scan-result-error';
        var bannerIcon = res.status === 'success' ? '✓' : res.status === 'warning' ? '⚠️' : '✖';

        resBox.innerHTML = [
          '<div class="scan-result-card ' + bannerClass + '" style="margin-top:12px; padding:12px 14px; flex-direction:column; gap:8px">',
            '<div style="display:flex; align-items:center; gap:10px">',
              '<div style="font-size:1.4rem">' + bannerIcon + '</div>',
              '<div>',
                '<div style="font-weight:800; font-size:0.85rem">' + res.message + '</div>',
                res.ticket ? '<div style="font-size:0.75rem; opacity:0.9">' + res.ticket.eventName + ' • ' + res.ticket.buyerName + '</div>' : '',
              '</div>',
            '</div>',
            '<button class="btn-primary" style="padding:6px 14px; font-size:0.78rem; width:100%; margin-top:4px; background:#10b981" onclick="EventHub.resumeAdminScanner()">',
              '🔄 Scan Tiket Berikutnya',
            '</button>',
          '</div>'
        ].join('');
      }
    },

    doAdminScanInput: function() {
      var input = document.getElementById('manual-admin-code');
      var code = (input ? input.value : '').trim();
      var user = Store.getCurrentUser();
      var res = Store.scanTicket(code, null, user.email);
      App.lastAdminScanResult = res;

      if (res.status === 'success') {
        if (Sound) Sound.playSuccess();
        if (Confetti) Confetti.burst(window.innerWidth * 0.5, window.innerHeight * 0.5, 70);
        Router.showToast('VALID! (' + (res.ticket ? res.ticket.eventName : '') + ')', 'success');
        if (input) input.value = '';
      } else if (res.status === 'warning') {
        if (Sound) Sound.playWarning();
        Router.showToast(res.message, 'warning');
      } else {
        if (Sound) Sound.playError();
        Router.showToast(res.message, 'error');
      }

      renderApp();
    },

    testAdminScanPicker: function() {
      var picker = document.getElementById('sample-admin-picker');
      if (picker && picker.value) {
        var input = document.getElementById('manual-admin-code');
        if (input) input.value = picker.value;
        this.doAdminScanInput();
      }
    },

    confirmApproveRefund: function(refundId) {
      var user = Store.getCurrentUser();
      try {
        Store.approveRefund(refundId, 'Disetujui oleh penyelenggara acara.', user);
        if (Sound) Sound.playSuccess();
        if (Confetti) Confetti.burst(window.innerWidth * 0.5, window.innerHeight * 0.5, 70);
        Router.showToast('Refund disetujui! Status tiket diperbarui menjadi direfund.', 'success');
        renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    openRejectRefundModal: function(refundId) {
      App.activeModal = 'rejectRefund';
      App.modalData = refundId;
      renderModal();
    },

    submitRejectRefund: function(refundId) {
      var reason = (document.getElementById('reject-reason-text').value || '').trim();
      var user = Store.getCurrentUser();
      try {
        Store.rejectRefund(refundId, reason, user);
        if (Sound) Sound.playWarning();
        Router.showToast('Refund ditolak. Tiket dikembalikan ke status aktif peserta.', 'warning');
        this.closeModal();
        renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    exportAttendeeCSV: function(eventId) {
      var ev = Store.getEventById(eventId);
      var tickets = Store.getTickets().filter(function(t){ return t.eventId === eventId && t.status !== 'refunded'; });

      var csvRows = [
        ['Kode Tiket', 'Nama Peserta', 'Email', 'No Telepon', 'Kategori', 'Harga', 'Metode Bayar', 'Status Checkin', 'Waktu Checkin']
      ];

      tickets.forEach(function(t) {
        csvRows.push([
          t.code,
          t.buyerName,
          t.buyerEmail,
          t.buyerPhone,
          t.tierName,
          t.price,
          t.paymentMethod,
          t.status === 'used' ? 'Sudah Masuk' : 'Belum Masuk',
          t.usedAt || ''
        ]);
      });

      var csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(function(e){ return e.join(','); }).join('\n');
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'Peserta_' + ev.title.replace(/[^a-zA-Z0-9]/g, '_') + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Router.showToast('Laporan CSV peserta berhasil diunduh.', 'success');
    },

    openAddTierModal: function(eventId) {
      App.activeModal = 'addTier';
      App.modalData = { eventId: eventId };
      renderModal();
    },

    openEditTierModal: function(eventId, tierId) {
      App.activeModal = 'editTier';
      App.modalData = { eventId: eventId, tierId: tierId };
      renderModal();
    },

    saveTierForm: function(eventId, tierId) {
      var name = document.getElementById('tier-name').value.trim();
      var price = Number(document.getElementById('tier-price').value);
      var quota = Number(document.getElementById('tier-quota').value);
      var desc = document.getElementById('tier-desc').value.trim();
      var user = Store.getCurrentUser();

      if (!name) {
        Router.showToast('Nama kategori tidak boleh kosong.', 'error');
        return;
      }
      if (price < 0 || quota < 1) {
        Router.showToast('Harga dan kuota tidak valid.', 'error');
        return;
      }

      try {
        if (tierId) {
          Store.updateEventTier(eventId, tierId, { name: name, price: price, quota: quota, description: desc }, user);
          Router.showToast('Kategori tiket & harga berhasil diperbarui!', 'success');
        } else {
          Store.addEventTier(eventId, { name: name, price: price, quota: quota, description: desc }, user);
          Router.showToast('Kategori tiket baru berhasil ditambahkan!', 'success');
        }
        if (Sound) Sound.playSuccess();
        this.closeModal();
        renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    deleteTier: function(eventId, tierId) {
      var user = Store.getCurrentUser();
      try {
        Store.deleteEventTier(eventId, tierId, user);
        Router.showToast('Kategori tiket dihapus.', 'success');
        renderApp();
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    openCreateEventModal: function() {
      App.activeModal = 'createEvent';
      App.modalData = null;
      renderModal();
    },

    openEditEventModal: function(eventId) {
      App.activeModal = 'editEvent';
      App.modalData = eventId;
      renderModal();
    },

    confirmDeleteEvent: function(eventId) {
      if (Sound) Sound.playClick();
      App.activeModal = 'deleteEventConfirm';
      App.modalData = eventId;
      renderModal();
    },

    executeDeleteEvent: function(eventId) {
      var user = Store.getCurrentUser();
      if (!user) {
        Router.showToast('Silakan login terlebih dahulu.', 'error');
        return;
      }
      try {
        var ev = Store.getEventById(eventId);
        var evTitle = ev ? ev.title : eventId;
        Store.deleteEvent(eventId, user, true);
        if (Sound) Sound.playBuzz();
        Router.showToast('Acara "' + evTitle + '" berhasil dihapus.', 'success');

        var remainingEvents = Store.getOrganizerEvents(user.email);
        if (remainingEvents.length > 0) {
          App.activeOrganizerEventId = remainingEvents[0].id;
        } else {
          App.activeOrganizerEventId = null;
        }
        this.closeModal();
        if (App.currentRoute === 'detail' && App.routeParam === eventId) {
          if (user.role === 'penyelenggara') {
            Router.navigate('organizer');
          } else if (user.role === 'superadmin') {
            Router.navigate('admin');
          } else {
            Router.navigate('home');
          }
        } else {
          renderApp();
        }
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    saveEventForm: function(eventId) {
      var title = document.getElementById('ev-title').value.trim();
      var cat = document.getElementById('ev-cat').value;
      var city = document.getElementById('ev-city').value.trim();
      var date = document.getElementById('ev-date').value;
      var time = document.getElementById('ev-time').value.trim();
      var venue = document.getElementById('ev-venue').value.trim();
      var desc = document.getElementById('ev-desc').value.trim();
      var user = Store.getCurrentUser();

      if (!title || !venue || !date) {
        Router.showToast('Lengkapi nama acara, venue, dan tanggal.', 'error');
        return;
      }

      try {
        var banner = document.getElementById('ev-banner') ? document.getElementById('ev-banner').value.trim() : '';
        var trailer = document.getElementById('ev-trailer') ? document.getElementById('ev-trailer').value.trim() : '';
        var galleryRaw = document.getElementById('ev-gallery') ? document.getElementById('ev-gallery').value.trim() : '';
        var gallery = galleryRaw ? galleryRaw.split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(Boolean) : [];

        if (eventId) {
          Store.updateEvent(eventId, {
            title: title, category: cat, city: city, date: date, time: time, venue: venue, description: desc,
            bannerImg: banner, videoTrailer: trailer, galleryImages: gallery
          }, user);
          Router.showToast('Acara berhasil diperbarui!', 'success');
        } else {
          var price = Number(document.getElementById('ev-init-price').value) || 50000;
          var quota = Number(document.getElementById('ev-init-quota').value) || 100;
          var newEv = Store.createEvent({
            title: title, category: cat, city: city, date: date, time: time, venue: venue, description: desc,
            bannerImg: banner, videoTrailer: trailer, galleryImages: gallery,
            price: price, quota: quota
          }, user);
          App.activeOrganizerEventId = newEv.id;
          Router.showToast('Event baru berhasil dibuat!', 'success');
        }
        if (Sound) Sound.playSuccess();
        this.closeModal();
        renderApp();
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    openAuthModal: function(mode, notice) {
      App.activeModal = 'auth';
      App.modalData = mode || 'login';
      if (notice) App.authNotice = notice;
      renderModal();
    },

    openTicketModal: function(ticketCode) {
      App.activeModal = 'ticketQr';
      App.modalData = ticketCode;
      renderModal();
    },

    openRefundModal: function(ticketCode) {
      App.activeModal = 'refundRequest';
      App.modalData = ticketCode;
      renderModal();
    },

    openProfileModal: function() {
      App.activeModal = 'profile';
      App.modalData = null;
      renderModal();
    },

    closeModal: function() {
      if (window.EventScannerService) {
        window.EventScannerService.stopCamera();
      }
      App.activeModal = null;
      App.modalData = null;
      renderModal();
    },

    submitRefundRequest: function(ticketCode) {
      var reason = document.getElementById('refund-reason').value;
      var details = document.getElementById('refund-details').value.trim();
      var bank = document.getElementById('refund-bank').value;
      var account = document.getElementById('refund-account').value.trim();
      var holder = document.getElementById('refund-holder').value.trim();
      var user = Store.getCurrentUser();

      if (!account || !holder) {
        Router.showToast('Nomor rekening dan nama pemilik rekening harus diisi.', 'error');
        return;
      }

      try {
        Store.requestRefund(ticketCode, {
          reason: reason,
          reasonDetails: details,
          bankName: bank,
          accountNumber: account,
          accountHolder: holder
        }, user);

        if (Sound) Sound.playSuccess();
        Router.showToast('Pengajuan refund berhasil dikirimkan ke penyelenggara acara.', 'success');
        this.closeModal();
        Router.navigate('refunds');
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    submitAuth: function() {
      EventAuth.submitAuth();
    },

    openCreateOrganizerModal: function() {
      App.activeModal = 'createOrganizer';
      App.modalData = null;
      renderModal();
    },

    saveOrganizerByAdmin: function() {
      var name = (document.getElementById('adm-org-name').value || '').trim();
      var company = (document.getElementById('adm-org-company').value || '').trim();
      var email = (document.getElementById('adm-org-email').value || '').trim().toLowerCase();
      var phone = (document.getElementById('adm-org-phone').value || '').trim();
      var password = (document.getElementById('adm-org-password').value || '');

      var errBox = document.getElementById('admin-org-err');
      var showErr = function(msg) {
        if (errBox) {
          errBox.innerHTML = '<span style="font-size:1.1rem">⚠️</span><span>' + msg + '</span>';
          errBox.style.display = 'flex';
        }
        if (Sound) Sound.playError();
        Router.showToast(msg, 'error');
      };

      if (!name || name.length < 3) return showErr('Nama penanggung jawab minimal 3 karakter.');
      if (!company || company.length < 3) return showErr('Nama organisasi/promotor minimal 3 karakter.');
      var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) return showErr('Format email resmi tidak valid. Contoh: nama@event.id');
      if (!password || password.length < 8) return showErr('Kata sandi awal minimal 8 karakter.');
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return showErr('Kata sandi harus mengandung kombinasi huruf dan angka.');

      try {
        Store.createOrganizerByAdmin({
          name: name,
          company: company,
          email: email,
          phone: phone,
          password: password
        });
        if (Sound) Sound.playSuccess();
        Router.showToast('Akun penyelenggara "' + company + '" (' + email + ') berhasil dibuat!', 'success');
        this.closeModal();
        renderApp();
      } catch (err) {
        showErr(err.message);
      }
    },

    saveProfile: function() {
      var name = document.getElementById('prof-name').value.trim();
      var phone = document.getElementById('prof-phone').value.trim();
      if (!name) {
        Router.showToast('Nama tidak boleh kosong.', 'error');
        return;
      }
      Store.updateUserProfile({ name: name, phone: phone });
      Router.showToast('Profil berhasil disimpan.', 'success');
      this.closeModal();
      renderApp();
    },

    logout: function() {
      Store.logout();
      Router.showToast('Anda telah keluar dari akun.', 'success');
      this.closeModal();
      Router.navigate('home');
    },

    resetAllDemoData: function() {
      Store.resetDemoData();
      Router.showToast('Data berhasil di-reset.', 'success');
      this.closeModal();
      Router.navigate('home');
    },

    resumeScanner: function() {
      if (window.EventScannerService) {
        window.EventScannerService.resume();
      }
      var resBox = document.getElementById('organizer-scan-result-box');
      if (resBox) resBox.innerHTML = '';
      Router.showToast('Kamera siap memindai tiket berikutnya.', 'info');
    },

    resumeAdminScanner: function() {
      if (window.EventScannerService) {
        window.EventScannerService.resume();
      }
      var resBox = document.getElementById('admin-scan-result-box');
      if (resBox) resBox.innerHTML = '';
      Router.showToast('Kamera admin siap memindai tiket berikutnya.', 'info');
    },

    openSendMessageModal: function(eventId) {
      var user = Store.getCurrentUser();
      if (!user) {
        App.pendingEventId = eventId;
        App.authNotice = 'Silakan masuk atau daftar akun terlebih dahulu untuk mengirim pesan ke penyelenggara.';
        Router.triggerPreloader('Mempersiapkan Akses Pesan...', 600, function() {
          EventHub.openAuthModal('login');
        });
        return;
      }
      App.activeModal = 'sendMessage';
      App.modalData = eventId;
      renderModal();
    },

    submitSendMessage: function(eventId) {
      var subject = (document.getElementById('msg-subject').value || '').trim();
      var text = (document.getElementById('msg-text').value || '').trim();
      var user = Store.getCurrentUser();

      if (!subject || !text) {
        Router.showToast('Topik dan pertanyaan tidak boleh kosong.', 'error');
        return;
      }

      try {
        Store.sendMessage({ eventId: eventId, subject: subject, text: text }, user);
        Store.logActivity('Kirim Pesan', 'Mengirim pertanyaan "' + subject + '" untuk event ' + eventId, user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Pertanyaan Anda berhasil dikirim ke penyelenggara!', 'success');
        this.closeModal();
        Router.navigate('messages');
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    submitReplyMessage: function(msgId) {
      var input = document.getElementById('reply-msg-' + msgId);
      var text = (input ? input.value : '').trim();
      var user = Store.getCurrentUser();

      if (!text) return;

      try {
        Store.replyMessage(msgId, text, user);
        Store.logActivity('Balas Pesan', 'Membalas pesan ID: ' + msgId, user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Balasan terkirim!', 'success');
        if (input) input.value = '';
        renderApp();
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    submitOrganizerReply: function(msgId) {
      var input = document.getElementById('org-reply-' + msgId);
      var text = (input ? input.value : '').trim();
      var user = Store.getCurrentUser();

      if (!text) return;

      try {
        Store.replyMessage(msgId, text, user);
        Store.logActivity('Balasan Penyelenggara', 'Penyelenggara menjawab pertanyaan peserta (ID: ' + msgId + ')', user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Balasan berhasil dikirimkan ke peserta!', 'success');
        if (input) input.value = '';
        renderApp();
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    openFeedbackModal: function(eventId) {
      App.activeModal = 'websiteFeedback';
      App.modalData = eventId || null;
      renderModal();
    },

    submitWebsiteFeedback: function() {
      var targetEl = document.getElementById('fdb-target');
      var target = targetEl ? targetEl.value : '';
      var ratingEl = document.getElementById('fdb-rating');
      var ratingVal = ratingEl ? ratingEl.value : '';
      var catEl = document.getElementById('fdb-cat');
      var cat = catEl ? catEl.value : '';
      var comment = (document.getElementById('fdb-comment').value || '').trim();
      var user = Store.getCurrentUser();

      if (!target) {
        Router.showToast('Harap pilih opsi acara atau penyelenggara yang dievaluasi terlebih dahulu.', 'warning');
        if (targetEl) targetEl.focus();
        return;
      }
      if (!ratingVal) {
        Router.showToast('Harap pilih opsi tingkat kepuasan layanan terlebih dahulu.', 'warning');
        if (ratingEl) ratingEl.focus();
        return;
      }
      if (!cat) {
        Router.showToast('Harap pilih opsi aspek pelayanan yang dinilai terlebih dahulu.', 'warning');
        if (catEl) catEl.focus();
        return;
      }
      if (!comment || comment.length < 5) {
        Router.showToast('Mohon tuliskan komentar / ulasan Anda minimal 5 karakter.', 'warning');
        return;
      }
      var rating = Number(ratingVal) || 5;
      try {
        Store.submitWebsiteFeedback({
          rating: rating,
          category: cat + ' (' + target + ')',
          comment: comment
        }, user);

        Store.logActivity('Kirim Feedback', 'Mengirimkan evaluasi ' + rating + ' bintang untuk ' + cat + ' - ' + target, user);

        if (Sound) Sound.playSuccess();
        Router.showToast('Terima kasih! Evaluasi Anda berhasil dikirim ke Tim Administrator.', 'success');
        this.closeModal();

        if (App.currentRoute === 'checkout') {
          Router.navigate('tickets');
        } else {
          renderApp();
        }
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    saveProfileFromPage: function() {
      var name = (document.getElementById('profile-name').value || '').trim();
      var phone = (document.getElementById('profile-phone').value || '').trim();
      var city = (document.getElementById('profile-city').value || '').trim();

      if (!name || name.length < 3) {
        Router.showToast('Nama lengkap minimal harus 3 karakter.', 'error');
        return;
      }
      if (phone) {
        var cleanPhone = phone.replace(/[\s-]/g, '');
        if (!/^(\+62|62|0)8[0-9]{8,11}$/.test(cleanPhone)) {
          Router.showToast('Nomor HP/WhatsApp tidak valid. Contoh: 081234567890.', 'error');
          return;
        }
      }

      Store.updateUserProfile({ name: name, phone: phone, city: city });
      Store.logActivity('Perbarui Profil', 'Memperbarui nama dan nomor kontak profil akun', Store.getCurrentUser());
      if (Sound) Sound.playSuccess();
      Router.showToast('Profil akun berhasil diperbarui!', 'success');
      renderApp();
    },

    submitChangePassword: function() {
      var oldPw = document.getElementById('pw-old').value;
      var newPw = document.getElementById('pw-new').value;
      var confirmPw = document.getElementById('pw-confirm').value;
      var user = Store.getCurrentUser();

      if (!oldPw || !newPw) {
        Router.showToast('Kata sandi lama dan baru harus diisi.', 'error');
        return;
      }
      if (newPw !== confirmPw) {
        Router.showToast('Konfirmasi kata sandi baru tidak cocok.', 'error');
        return;
      }

      try {
        Store.changePassword(oldPw, newPw, user);
        Store.logActivity('Ganti Kata Sandi', 'Berhasil memperbarui kata sandi akun', user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Kata sandi berhasil diubah!', 'success');
        if (document.getElementById('pw-old')) document.getElementById('pw-old').value = '';
        if (document.getElementById('pw-new')) document.getElementById('pw-new').value = '';
        if (document.getElementById('pw-confirm')) document.getElementById('pw-confirm').value = '';
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    openEmailConfigModal: function() {
      App.activeModal = 'emailConfig';
      App.modalData = null;
      renderModal();
    },

    saveEmailConfig: async function() {
      var user = (document.getElementById('cfg-gmail-user').value || '').trim();
      var pass = (document.getElementById('cfg-gmail-pass').value || '').trim();

      if (!user || !pass) {
        Router.showToast('Email Gmail dan App Password harus diisi.', 'error');
        return;
      }

      Router.showToast('Menyimpan & menguji koneksi Google SMTP...', 'info');

      try {
        var res = await fetch('/api/save-email-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail_user: user, gmail_app_password: pass })
        });
        var data = await res.json();
        if (data.success) {
          if (data.test_result && data.test_result.dispatched_real) {
            Router.showToast('✅ Berhasil terhubung ke Google SMTP! Email uji coba telah masuk ke ' + user, 'success', 6000);
            if (Sound) Sound.playFanfare();
          } else {
            Router.showToast('Pengaturan disimpan. ' + (data.test_result && data.test_result.error ? data.test_result.error : ''), 'warning', 6000);
          }
          this.closeModal();
          renderApp();
        }
      } catch (err) {
        Router.showToast('Gagal menghubungi server backend: ' + err.message, 'error');
      }
    },

    openMaintenanceModal: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Hanya Super Administrator yang berhak mengatur status pemeliharaan.', 'error');
        return;
      }
      if (Sound) Sound.playClick();
      App.activeModal = 'maintenance';
      App.modalData = null;
      renderModal();
    },

    quickToggleMaintenance: function(active) {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Hanya Super Administrator yang berhak mengatur status pemeliharaan.', 'error');
        return;
      }
      var maint = Store.getMaintenanceMode();
      Store.setMaintenanceMode(active, maint.message, maint.estimatedEnd, user);
      if (active) {
        Router.showToast('🚧 Mode Pemeliharaan DIAKTIFKAN. Akses publik dikunci!', 'warning');
        if (Sound) Sound.playClick();
      } else {
        Router.showToast('✅ Mode Pemeliharaan DINONAKTIFKAN. Platform kini LIVE kembali!', 'success');
        if (Sound) Sound.playSuccess();
      }
      this.closeModal();
      renderApp();
    },

    saveMaintenanceForm: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Hanya Super Administrator yang berhak mengatur status pemeliharaan.', 'error');
        return;
      }
      var checkEl = document.getElementById('maint-active-toggle');
      var active = checkEl ? checkEl.checked : false;
      var est = (document.getElementById('maint-est-end').value || '').trim();
      var msg = (document.getElementById('maint-message').value || '').trim();

      try {
        Store.setMaintenanceMode(active, msg, est, user);
        this.closeModal();
        if (active) {
          Router.showToast('🚧 Mode Pemeliharaan Berhasil Diterapkan (Publik Dikunci)!', 'warning');
          if (Sound) Sound.playClick();
        } else {
          Router.showToast('✅ Pengaturan disimpan. Platform berstatus LIVE normal!', 'success');
          if (Sound) Sound.playSuccess();
        }
        renderApp();
      } catch (err) {
        Router.showToast(err.message, 'error');
      }
    },

    openEditMembershipModal: function(planId) {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Akses ditolak: Hanya Super Admin yang berhak mengubah harga paket subscription.', 'error');
        return;
      }
      App.activeModal = 'editMembership';
      App.modalData = planId || 'gold';
      renderModal();
    },

    saveMembershipForm: function(planId) {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Akses ditolak: Hanya Super Admin yang berhak mengubah harga paket subscription.', 'error');
        return;
      }
      var price = Number(document.getElementById('plan-price').value);
      var priceYearly = Number(document.getElementById('plan-price-yearly').value) || (price * 10);
      var name = document.getElementById('plan-name').value.trim();
      var badge = document.getElementById('plan-badge').value.trim();
      var benefitsRaw = document.getElementById('plan-benefits').value.trim();
      var popular = document.getElementById('plan-popular').checked;

      var benefits = benefitsRaw.split('\n').map(function(s){ return s.trim(); }).filter(Boolean);

      try {
        Store.updateMembership(planId, {
          price: price,
          priceYearly: priceYearly,
          name: name,
          badgeText: badge,
          benefits: benefits,
          popular: popular
        }, user);

        if (Sound) Sound.playFanfare();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Harga dan ketentuan paket ' + name + ' berhasil diperbarui!', 'success');
        this.closeModal();
        renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    openEditHeroModal: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Akses ditolak: Hanya Super Admin yang berhak mengedit konten Hero Banner.', 'error');
        return;
      }
      if (Sound) Sound.playClick();
      App.activeModal = 'editHero';
      renderModal();
    },

    saveHeroForm: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Akses ditolak: Hanya Super Admin yang berhak mengedit konten Hero Banner.', 'error');
        return;
      }
      var badge = (document.getElementById('hero-badge-input').value || '').trim();
      var t1 = (document.getElementById('hero-title1-input').value || '').trim();
      var t2 = (document.getElementById('hero-title2-input').value || '').trim();
      var desc = (document.getElementById('hero-desc-input').value || '').trim();
      var vUrl = (document.getElementById('hero-video-url-input').value || '').trim();
      var vPoster = (document.getElementById('hero-video-poster-input').value || '').trim();
      var sVideo = document.getElementById('hero-show-video-input').checked;

      try {
        Store.updateHeroConfig({
          badgeText: badge,
          title1: t1,
          title2: t2,
          description: desc,
          videoUrl: vUrl,
          videoPoster: vPoster,
          showVideo: sVideo
        }, user);

        if (Sound) Sound.playFanfare();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Tampilan Hero Banner berhasil diperbarui!', 'success');
        this.closeModal();
        renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    renderBannerPreviewHtml: function(url) {
      if (!url) return '<small style="color:#64748b; display:block; margin-top:6px">Belum ada foto banner yang dipilih.</small>';
      return [
        '<div class="media-preview-container">',
          '<div class="media-preview-badge">✓ Banner Aktif</div>',
          '<button type="button" class="media-remove-btn" onclick="EventHub.clearMedia(\'ev-banner\', \'ev-banner-preview\', false)">✕ Hapus Banner</button>',
          '<img src="' + url + '" style="width:100%; height:130px; object-fit:cover; display:block">',
        '</div>'
      ].join('');
    },

    renderTrailerPreviewHtml: function(url) {
      if (!url) return '<small style="color:#64748b; display:block; margin-top:6px">Belum ada video trailer yang dipilih.</small>';
      return [
        '<div class="media-preview-container">',
          '<div class="media-preview-badge">✓ Video Aktif</div>',
          '<button type="button" class="media-remove-btn" onclick="EventHub.clearMedia(\'ev-trailer\', \'ev-trailer-preview\', true)">✕ Hapus Video</button>',
          '<video src="' + url + '" controls autoplay loop muted style="width:100%; height:160px; object-fit:cover; display:block"></video>',
        '</div>'
      ].join('');
    },

    renderGalleryPreviewHtml: function(images) {
      if (!images || !images.length) return '<small style="color:#64748b; display:block; margin-top:6px">Belum ada foto galeri.</small>';
      var cards = images.map(function(img, idx) {
        return [
          '<div style="position:relative; width:90px; height:70px; border-radius:8px; overflow:hidden; border:1px solid var(--border-glass); flex-shrink:0">',
            '<img src="' + img + '" style="width:100%; height:100%; object-fit:cover; display:block">',
            '<button type="button" style="position:absolute; top:3px; right:3px; background:rgba(244,63,94,0.9); color:white; border:none; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:10px; cursor:pointer" title="Hapus foto ini" onclick="EventHub.removeGalleryImage(' + idx + ')">✕</button>',
          '</div>'
        ].join('');
      });
      return [
        '<div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:8px">',
          cards.join(''),
          '<button type="button" class="btn-secondary" style="padding:6px 12px; font-size:0.75rem; height:70px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px" onclick="document.getElementById(\'ev-gallery-files\').click()">',
            '<span>➕</span><span>Tambah</span>',
          '</button>',
        '</div>',
        '<div style="font-size:0.72rem; color:#64748b; margin-top:6px">Total: ' + images.length + ' foto galeri. Klik ✕ pada foto untuk menghapusnya.</div>'
      ].join('');
    },

    clearMedia: function(targetInputId, previewElId, isVideo) {
      var targetInput = document.getElementById(targetInputId);
      if (targetInput) targetInput.value = '';
      var prevBox = document.getElementById(previewElId);
      if (prevBox) {
        if (isVideo) {
          prevBox.innerHTML = this.renderTrailerPreviewHtml('');
        } else {
          prevBox.innerHTML = this.renderBannerPreviewHtml('');
        }
      }
      Router.showToast('Media dihapus.', 'info');
    },

    removeGalleryImage: function(index) {
      var target = document.getElementById('ev-gallery');
      if (!target) return;
      var items = target.value ? target.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
        target.value = items.join(',');
        var prev = document.getElementById('ev-gallery-preview');
        if (prev) prev.innerHTML = this.renderGalleryPreviewHtml(items);
        Router.showToast('Foto galeri dihapus.', 'info');
      }
    },

    handleDragOver: function(e, dropzoneEl) {
      e.preventDefault();
      e.stopPropagation();
      if (dropzoneEl) dropzoneEl.classList.add('dragover');
    },

    handleDragLeave: function(e, dropzoneEl) {
      e.preventDefault();
      e.stopPropagation();
      if (dropzoneEl) dropzoneEl.classList.remove('dragover');
    },

    handleDropMedia: function(e, targetInputId, previewElId, isVideo, dropzoneEl) {
      e.preventDefault();
      e.stopPropagation();
      if (dropzoneEl) dropzoneEl.classList.remove('dragover');
      var dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      var file = dt.files[0];
      if (isVideo && !file.type.startsWith('video/')) {
        Router.showToast('Harap pilih/tarik file video (.mp4 atau .webm)', 'error');
        return;
      }
      if (!isVideo && !file.type.startsWith('image/')) {
        Router.showToast('Harap pilih/tarik file gambar (.jpg, .png, .webp)', 'error');
        return;
      }
      this.processMediaFile(file, targetInputId, previewElId, isVideo);
    },

    handleDropGallery: function(e, dropzoneEl) {
      e.preventDefault();
      e.stopPropagation();
      if (dropzoneEl) dropzoneEl.classList.remove('dragover');
      var dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      var imageFiles = Array.from(dt.files).filter(function(f){ return f.type.startsWith('image/'); });
      if (imageFiles.length === 0) {
        Router.showToast('Harap tarik file foto / gambar.', 'error');
        return;
      }
      this.processGalleryFiles(imageFiles);
    },

    processMediaFile: function(file, targetInputId, previewElId, isVideo) {
      if (!file) return;
      var self = this;
      Router.showToast('Memproses file ' + file.name + '...', 'info');

      var reader = new FileReader();
      reader.onload = async function(e) {
        var dataUri = e.target.result;
        var finalUrl = dataUri;

        try {
          var res = await fetch('/api/upload-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, data: dataUri })
          });
          var json = await res.json();
          if (json && json.success && json.url) {
            finalUrl = json.url;
          }
        } catch (err) {}

        var targetInput = document.getElementById(targetInputId);
        if (targetInput) targetInput.value = finalUrl;

        var prevBox = document.getElementById(previewElId);
        if (prevBox) {
          if (isVideo) {
            prevBox.innerHTML = self.renderTrailerPreviewHtml(finalUrl);
          } else {
            prevBox.innerHTML = self.renderBannerPreviewHtml(finalUrl);
          }
        }
        if (Sound) Sound.playSuccess();
        Router.showToast('File ' + (isVideo ? 'video' : 'foto') + ' berhasil dimuat!', 'success');
      };
      reader.readAsDataURL(file);
    },

    processGalleryFiles: function(files) {
      if (!files || !files.length) return;
      var self = this;
      var targetInput = document.getElementById('ev-gallery');
      var currentGallery = [];
      if (targetInput && targetInput.value) {
        currentGallery = targetInput.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      }

      Router.showToast('Memproses ' + files.length + ' foto...', 'info');
      var processed = 0;

      files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = async function(e) {
          var dataUri = e.target.result;
          var finalUrl = dataUri;
          try {
            var res = await fetch('/api/upload-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: file.name, data: dataUri })
            });
            var json = await res.json();
            if (json && json.success && json.url) finalUrl = json.url;
          } catch (err) {}

          currentGallery.push(finalUrl);
          processed++;

          if (processed === files.length) {
            if (targetInput) targetInput.value = currentGallery.join(',');
            var prevBox = document.getElementById('ev-gallery-preview');
            if (prevBox) prevBox.innerHTML = self.renderGalleryPreviewHtml(currentGallery);
            if (Sound) Sound.playSuccess();
            Router.showToast(files.length + ' foto galeri berhasil ditambahkan!', 'success');
          }
        };
        reader.readAsDataURL(file);
      });
    },

    handleMediaUpload: function(fileInput, targetInputId, previewElId, isVideo) {
      if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
      this.processMediaFile(fileInput.files[0], targetInputId, previewElId, isVideo);
      fileInput.value = '';
    },

    setPresetMedia: function(targetInputId, previewElId, url, isVideo) {
      if (Sound) Sound.playClick();
      var targetInput = document.getElementById(targetInputId);
      if (targetInput) targetInput.value = url;

      var prevBox = document.getElementById(previewElId);
      if (prevBox) {
        if (isVideo) {
          prevBox.innerHTML = this.renderTrailerPreviewHtml(url);
        } else {
          prevBox.innerHTML = this.renderBannerPreviewHtml(url);
        }
      }
      Router.showToast('Template ' + (isVideo ? 'video' : 'foto') + ' berhasil diterapkan!', 'success');
    },

    handleGalleryUpload: function(fileInput) {
      if (!fileInput || !fileInput.files || !fileInput.files.length) return;
      this.processGalleryFiles(Array.from(fileInput.files));
      fileInput.value = '';
    },

    openQuickScanModal: function() {
      if (Sound) Sound.playClick();
      if (window.EventScannerService) {
        window.EventScannerService.stopCamera();
      }
      App.activeModal = 'quickScan';
      renderModal();

      // Start WebRTC camera in quick viewfinder
      setTimeout(async function() {
        var videoEl = document.getElementById('quick-scanner-video');
        var fallbackEl = document.getElementById('quick-scanner-fallback');
        if (!videoEl || !window.EventScannerService) return;

        var success = await window.EventScannerService.startCamera(
          videoEl,
          function(code) {
            EventHub.processTicketScan(code);
          },
          function(err) {
            Router.showToast(err, 'error');
            if (fallbackEl) fallbackEl.style.display = 'flex';
          }
        );
        if (success && fallbackEl) {
          fallbackEl.style.display = 'none';
        }
      }, 100);
    },

    restartQuickScanCamera: async function() {
      var videoEl = document.getElementById('quick-scanner-video');
      var fallbackEl = document.getElementById('quick-scanner-fallback');
      if (fallbackEl) fallbackEl.style.display = 'none';
      if (!videoEl || !window.EventScannerService) return;

      Router.showToast('Menghubungkan ke kamera...', 'info');
      var success = await window.EventScannerService.startCamera(
        videoEl,
        function(code) {
          EventHub.processTicketScan(code);
        },
        function(err) {
          Router.showToast(err, 'error');
          if (fallbackEl) fallbackEl.style.display = 'flex';
        }
      );
      if (success && fallbackEl) {
        fallbackEl.style.display = 'none';
        Router.showToast('Kamera aktif! Arahkan ke kode QR tiket.', 'success');
      }
    },

    resumeQuickScan: function() {
      if (window.EventScannerService) {
        window.EventScannerService.resume();
      }
      var resBox = document.getElementById('quick-scan-result-container');
      if (resBox) resBox.innerHTML = '';
      Router.showToast('Kamera siap memindai tiket berikutnya.', 'info');
    },

    flipCamera: async function(videoId) {
      if (!window.EventScannerService || !window.EventScannerService.isRunning()) {
        Router.showToast('Kamera belum aktif.', 'warning');
        return;
      }
      var videoEl = document.getElementById(videoId || 'quick-scanner-video');
      Router.showToast('Membalik kamera...', 'info');
      var newMode = await window.EventScannerService.flipCamera(
        videoEl,
        function(code) {
          if (videoId === 'organizer-video') {
            EventHub.handleCameraScan(code);
          } else if (videoId === 'admin-video') {
            EventHub.handleAdminCameraScan(code);
          } else {
            EventHub.processTicketScan(code);
          }
        },
        function(err) {
          Router.showToast(err, 'error');
        }
      );
      var modeName = (newMode === 'user') ? 'Depan (Selfie)' : 'Belakang (Utama)';
      Router.showToast('Kamera aktif: ' + modeName, 'success');
      var flipLbl = document.getElementById('lbl-flip-cam');
      if (flipLbl) flipLbl.textContent = 'Flip: ' + (newMode === 'user' ? 'Depan' : 'Belakang');
    },

    toggleTorch: async function(btnId) {
      if (!window.EventScannerService || !window.EventScannerService.isRunning()) {
        Router.showToast('Aktifkan kamera terlebih dahulu untuk menyalakan flash.', 'warning');
        return;
      }
      var hasTorch = window.EventScannerService.hasTorch();
      var isTorch = await window.EventScannerService.toggleTorch();
      var btn = document.getElementById(btnId || 'btn-quick-torch');
      if (btn) {
        if (isTorch) {
          btn.classList.add('active');
          Router.showToast('⚡ Lampu flash senter kamera aktif.', 'success');
        } else {
          btn.classList.remove('active');
          if (!hasTorch) {
            Router.showToast('Fitur lampu flash tidak didukung kamera/browser saat ini.', 'info');
          } else {
            Router.showToast('Lampu flash kamera dimatikan.', 'info');
          }
        }
      }
    },

    toggleScanSound: function(btnId) {
      if (!window.EventAudio) return;
      var currentMuted = window.EventAudio.isMuted();
      window.EventAudio.setMuted(!currentMuted);
      var btn = document.getElementById(btnId || 'btn-quick-sound');
      if (btn) {
        if (!currentMuted) {
          btn.innerHTML = '<span>🔇</span> <span>Mute</span>';
          Router.showToast('Efek suara blip scanner dimatikan (Muted).', 'info');
        } else {
          btn.innerHTML = '<span>🔊</span> <span>Blip</span>';
          window.EventAudio.playBlip();
          Router.showToast('Efek suara blip scanner diaktifkan.', 'success');
        }
      }
    },

    doQuickScanInput: function() {
      var inputEl = document.getElementById('quick-ticket-input');
      if (!inputEl) return;
      var code = inputEl.value.trim();
      if (!code) {
        Router.showToast('Masukkan kode tiket terlebih dahulu.', 'warning');
        return;
      }
      this.processTicketScan(code);
      inputEl.value = '';
    },

    processTicketScan: function(code) {
      var user = Store.getCurrentUser();
      var resBox = document.getElementById('quick-scan-result-container');

      try {
        var result = Store.scanTicket(code, user ? user.email : null);
        if (result.status === 'valid') {
          if (Sound) Sound.playSuccess();
          if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
          Router.showToast('✓ ' + result.message, 'success');
        } else if (result.status === 'already_used') {
          if (Sound) Sound.playError();
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          Router.showToast('⚠️ ' + result.message, 'warning');
        } else {
          if (Sound) Sound.playError();
          Router.showToast('✖ ' + result.message, 'error');
        }

        if (resBox) {
          var bannerBg = result.status === 'valid' ? 'rgba(16,185,129,0.18)' : result.status === 'already_used' ? 'rgba(245,158,11,0.18)' : 'rgba(244,63,94,0.18)';
          var bannerBorder = result.status === 'valid' ? '#10b981' : result.status === 'already_used' ? '#f59e0b' : '#f43f5e';
          var bannerIcon = result.status === 'valid' ? '✅' : result.status === 'already_used' ? '⚠️' : '❌';

          resBox.innerHTML = [
            '<div style="background:' + bannerBg + '; border:1px solid ' + bannerBorder + '; padding:14px; border-radius:12px; margin-top:12px; display:flex; align-items:flex-start; gap:12px">',
              '<div style="font-size:1.6rem">' + bannerIcon + '</div>',
              '<div style="flex:1">',
                '<b style="color:#ffffff; font-size:0.95rem">' + result.message + '</b>',
                result.ticket ? '<div style="font-size:0.8rem; color:#cbd5e1; margin-top:2px">' + result.ticket.buyerName + ' (' + result.ticket.tierName + ') • ' + result.ticket.eventName + '</div>' : '',
                '<div style="font-size:0.75rem; color:#94a3b8; margin-top:2px">Kode: <code>' + code + '</code></div>',
                '<button type="button" class="btn-secondary" style="margin-top:10px; padding:6px 14px; font-size:0.78rem; width:100%; display:flex; align-items:center; justify-content:center; gap:6px" onclick="EventHub.resumeQuickScan()">',
                  '<span>🔄</span><span>Scan Tiket Berikutnya</span>',
                '</button>',
              '</div>',
            '</div>'
          ].join('');
        }
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    handleQrFileInput: function(fileInput) {
      if (!fileInput.files || !fileInput.files[0]) return;
      var file = fileInput.files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (window.jsQR) {
            var qrResult = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (qrResult && qrResult.data) {
              EventHub.processTicketScan(qrResult.data.trim());
            } else {
              Router.showToast('Kode QR tidak terdeteksi pada foto. Pastikan foto jelas dan terang.', 'warning');
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  function renderApp() {
    var headerEl = document.getElementById('app-header-container');
    if (headerEl) headerEl.innerHTML = Router.renderHeader();

    var mainEl = document.getElementById('app-root');
    if (!mainEl) return;

    var maint = Store.getMaintenanceMode();
    var user = Store.getCurrentUser();
    if (maint && maint.active && (!user || user.role !== 'superadmin')) {
      mainEl.innerHTML = [
        '<div class="maintenance-screen view-animated">',
          '<div class="maintenance-card">',
            '<div style="font-size:3.5rem; margin-bottom:12px">🚧</div>',
            '<h1 style="font-size:1.85rem; font-weight:800; color:#fbbf24; margin-bottom:12px">Platform Sedang Dalam Pemeliharaan</h1>',
            '<p style="color:var(--text-muted); font-size:1rem; line-height:1.6; margin-bottom:20px">' +
              (maint.message || 'Kami sedang melakukan pemeliharaan berkala untuk peningkatan infrastruktur dan stabilitas transaksi.') +
            '</p>',
            '<div style="background:var(--bg-surface-elevated); border:1px solid rgba(255,255,255,0.08); padding:14px; border-radius:12px; margin-bottom:24px; font-size:0.85rem; color:#cbd5e1">',
              '⏱️ <b>Estimasi Selesai:</b> ' + (maint.estimatedEnd || 'Segera kembali dalam beberapa saat') + '<br>',
              '<small style="color:var(--text-dim)">Pembaruan terakhir: ' + (maint.updatedAt || 'Hari Ini') + '</small>',
            '</div>',
            '<div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap">',
              '<button class="btn-primary" style="width:auto; padding:10px 22px" onclick="location.reload()">',
                '🔄 Muat Ulang Halaman',
              '</button>',
              '<button class="btn-secondary" style="padding:10px 20px" onclick="EventHub.openAuthModal(\'login\')">',
                '🔒 Akses Super Admin Bypass',
              '</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
      return;
    }

    var viewMap = {
      home: EventParticipant.renderHomeView,
      favorites: EventParticipant.renderFavoritesView,
      detail: EventParticipant.renderDetailView,
      checkout: EventCheckout.renderCheckoutView,
      tickets: EventParticipant.renderTicketsView,
      refunds: EventParticipant.renderRefundsView,
      messages: EventParticipant.renderMessagesView,
      profile: EventParticipant.renderProfileView,
      fasttrack: window.EventFastTrack ? window.EventFastTrack.renderFastTrackView : EventParticipant.renderHomeView,
      organizer: EventOrganizer.renderOrganizerView,
      admin: EventAdmin.renderAdminView
    };
    var renderFn = viewMap[App.currentRoute] || EventParticipant.renderHomeView;
    try {
      mainEl.innerHTML = renderFn();
    } catch (err) {
      console.error('Render error:', err);
      mainEl.innerHTML = '<div class="card-panel" style="text-align:center; padding:40px"><h3>Terjadi kendala saat memuat halaman</h3><p style="color:var(--text-muted)">' + err.message + '</p><button class="btn-primary" style="width:auto; margin-top:16px" onclick="location.reload()">Muat Ulang Halaman</button></div>';
    } finally {
      var preloader = document.getElementById('app-preloader');
      if (preloader) {
        setTimeout(function() {
          preloader.classList.add('fade-out');
        }, 850);
      }
    }

    // Render Floating Bottom Action Bar with Center Hero Scan Button
    var bottomEl = document.getElementById('app-bottom-bar-container');
    if (bottomEl) bottomEl.innerHTML = Router.renderBottomBar();
  }

  EventHub.renderApp = renderApp;

  function initApp() {
    renderApp();
    Router.triggerPreloader('Menyiapkan Sistem Tiket Event...', 850);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && App.activeModal) {
      EventHub.closeModal();
    }
  });
})(window);
