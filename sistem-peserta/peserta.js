/**
 * EventHub Pro - Participant Module (Discovery, Detail & Tiers, My Tickets, Refund)
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var QR = window.EventQR;
  var App = window.EventApp;
  var Router = window.EventRouter;
  var Icons = Router.Icons;
  var formatRp = Router.formatRp;

  var ParticipantModule = {
    renderHomeView: function() {
      var events = Store.getEvents();
      var categories = ['Semua', 'Musik', 'Teknologi', 'Gaming', 'Workshop'];

      var filtered = events.filter(function(e) {
        if (App.selectedCategory !== 'Semua' && e.category !== App.selectedCategory) return false;
        if (App.searchQuery) {
          var q = App.searchQuery.toLowerCase();
          var matchTitle = e.title.toLowerCase().indexOf(q) >= 0;
          var matchVenue = e.venue.toLowerCase().indexOf(q) >= 0;
          var matchCity = e.city.toLowerCase().indexOf(q) >= 0;
          var matchOrg = e.organizerName.toLowerCase().indexOf(q) >= 0;
          if (!matchTitle && !matchVenue && !matchCity && !matchOrg) return false;
        }
        if (App.maxPrice) {
          var minTierPrice = Math.min.apply(null, e.tiers.map(function(t){ return t.price; }));
          if (minTierPrice > Number(App.maxPrice)) return false;
        }
        return true;
      });

      var totalTicketsCount = events.reduce(function(acc, e) {
        return acc + e.tiers.reduce(function(a, t) { return a + t.sold; }, 0);
      }, 0);

      var t = function(k, d) { return window.EventI18n ? window.EventI18n.t(k, d) : d; };
      var hero = Store.getHeroConfig();
      var currUser = Store.getCurrentUser();
      var isAdminUser = currUser && currUser.role === 'superadmin';

      var html = [
        '<div class="view-animated">',
          '<div class="hero-card">',
            (hero.showVideo && hero.videoUrl ? (
              '<div class="hero-video-bg-wrap">' +
                '<video class="hero-video-bg" autoplay loop muted playsinline poster="' + (hero.videoPoster || '') + '">' +
                  '<source src="' + hero.videoUrl + '" type="video/mp4">' +
                '</video>' +
                '<div class="hero-video-overlay"></div>' +
              '</div>'
            ) : ''),

            (isAdminUser ? (
              '<div class="hero-admin-edit-badge">' +
                '<button class="btn-primary" style="padding:7px 16px; font-size:0.78rem; background:linear-gradient(135deg, #10b981, #059669); border:none; box-shadow:0 0 20px rgba(16,185,129,0.5)" onclick="EventHub.openEditHeroModal()">' +
                  '✏️ Edit Hero Banner (Admin)' +
                '</button>' +
              '</div>'
            ) : ''),

            '<div class="hero-glow-back"></div>',
            '<div class="hero-content">',
              '<div class="hero-badge-pill">',
                '<span class="radar-ping"></span> ' + (hero.badgeText || t('hero_pill', 'Platform Tiket & Event Terpercaya #1 di Indonesia')),
              '</div>',
              '<h1 class="hero-title">' + (hero.title1 || t('hero_title_1', 'Tiket Resmi, Akses Cepat,')) + ' <span class="gradient-text">' + (hero.title2 || t('hero_title_2', 'Tanpa Biaya Tersembunyi.')) + '</span></h1>',
              '<p class="hero-subtitle">' + (hero.description || t('hero_sub', 'Rasakan getaran panggung spektakuler, gemuruh sorak penonton, dan momen magis konser impian Anda! Dapatkan tiket resmi festival musik, turnamen esports bergengsi, dan konferensi akbar nasional dengan garansi kode QR instan, keamanan berlapis, serta kemudahan refund terpercaya.')) + '</p>',
              '<div class="hero-stats-row">',
                '<div class="hero-stat-item">',
                  '<b>' + events.length + '</b>',
                  '<span>' + t('stat_active_events', 'Event Aktif') + '</span>',
                '</div>',
                '<div class="hero-stat-item">',
                  '<b>' + totalTicketsCount.toLocaleString('id-ID') + '</b>',
                  '<span>' + t('stat_sold_tickets', 'Tiket Terjual') + '</span>',
                '</div>',
                '<div class="hero-stat-item">',
                  '<b>100%</b>',
                  '<span>' + t('stat_qr_guarantee', 'Garansi QR Valid') + '</span>',
                '</div>',
                '<div class="hero-stat-item">',
                  '<b>24/7</b>',
                  '<span>' + t('stat_refund_system', 'Sistem Refund') + '</span>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',

          '<div class="filter-toolbar">',
            '<div style="display:flex; gap:14px; flex-wrap:wrap; width:100%">',
              '<div class="search-input-box">',
                Icons.search,
                '<input type="text" placeholder="' + t('search_placeholder', 'Cari nama konser, turnamen, kota, atau penyelenggara...') + '" value="' + (App.searchQuery || '') + '" oninput="EventHub.handleSearch(this.value)">',
              '</div>',
              '<select class="filter-select" onchange="EventHub.handlePriceFilter(this.value)">',
                '<option value="">Semua Kisaran Harga</option>',
                '<option value="75000" ' + (App.maxPrice === '75000' ? 'selected' : '') + '>Di bawah Rp 75.000</option>',
                '<option value="150000" ' + (App.maxPrice === '150000' ? 'selected' : '') + '>Di bawah Rp 150.000</option>',
                '<option value="300000" ' + (App.maxPrice === '300000' ? 'selected' : '') + '>Di bawah Rp 300.000</option>',
              '</select>',
            '</div>',

            '<div class="category-pills">'
      ];

      var catLabels = {
        'Semua': t('cat_all', 'Semua'),
        'Musik': t('cat_music', 'Musik'),
        'Teknologi': t('cat_tech', 'Teknologi'),
        'Gaming': t('cat_gaming', 'Gaming'),
        'Workshop': t('cat_workshop', 'Workshop')
      };

      categories.forEach(function(cat) {
        html.push(
          '<button class="category-pill-btn ' + (App.selectedCategory === cat ? 'active' : '') + '" onclick="EventHub.handleCategorySelect(\'' + cat + '\')">',
            (catLabels[cat] || cat),
          '</button>'
        );
      });

      html.push(
            '</div>',
          '</div>',

          '<div class="events-grid">'
      );

      if (events.length === 0) {
        var currUser = Store.getCurrentUser();
        var isAdminUser = currUser && currUser.role === 'superadmin';

        html.push(
          '<div style="grid-column:1/-1; text-align:center; padding:70px 24px; background:var(--bg-surface); border-radius:var(--radius-xl); border:1px solid var(--border-glass)">',
            '<div style="font-size:3.5rem; margin-bottom:14px">📅</div>',
            '<h3 style="font-size:1.4rem; font-weight:800; color:#ffffff; margin-bottom:8px">' + t('empty_title', 'Belum Ada Acara yang Diselenggarakan') + '</h3>',
            '<p style="color:var(--text-muted); margin-bottom:24px; max-width:560px; margin-left:auto; margin-right:auto; line-height:1.6">',
              (isAdminUser ?
                t('admin_create_event_prompt', 'Halo Administrator! Saat ini belum ada jadwal event aktif di platform. Anda dapat langsung membuat acara baru, mengatur kuota tiket, dan mempublikasikan acara perdana sekarang.') :
                t('empty_desc', 'Saat ini belum ada jadwal konser, festival, atau turnamen yang sedang berlangsung. Nantikan rilis pengumuman jadwal acara dan penjualan tiket resmi terbaru dalam waktu dekat!')),
            '</p>',
            '<div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap">',
              (isAdminUser ? (
                '<button class="btn-primary" style="width:auto; padding:10px 24px; background:linear-gradient(135deg, #10b981, #059669); border:none" onclick="EventHub.openCreateEventModal()">' +
                  t('btn_admin_create_event', '➕ Buat & Terbitkan Acara Baru') +
                '</button>' +
                '<button class="btn-secondary" style="padding:10px 20px" onclick="EventHub.go(\'admin\')">' +
                  'Platform Admin Desk' +
                '</button>'
              ) : (
                '<button class="btn-primary" style="width:auto; padding:10px 24px" onclick="location.reload()">' +
                  t('btn_check_schedule', '🔄 Periksa Jadwal Terbaru') +
                '</button>' +
                '<button class="btn-secondary" style="padding:10px 20px" onclick="EventHub.openAuthModal(\'login\')">' +
                  t('btn_login_register', 'Masuk / Daftar Akun') +
                '</button>'
              )),
            '</div>',
          '</div>'
        );
      } else if (filtered.length === 0) {
        html.push(
          '<div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:var(--bg-surface); border-radius:var(--radius-xl); border:1px solid var(--border-glass)">',
            '<div style="font-size:3rem; margin-bottom:12px">🔍</div>',
            '<h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px">Tidak Ada Event Ditemukan</h3>',
            '<p style="color:var(--text-muted); margin-bottom:18px">Coba ubah kata kunci pencarian atau bersihkan filter harga dan kategori.</p>',
            '<button class="btn-secondary" onclick="EventHub.resetFilters()">Reset Semua Filter</button>',
          '</div>'
        );
      } else {
        filtered.forEach(function(ev) {
          var minPrice = Math.min.apply(null, ev.tiers.map(function(t){ return t.price; }));
          var totalQuota = ev.tiers.reduce(function(a, t){ return a + t.quota; }, 0);
          var totalSold = ev.tiers.reduce(function(a, t){ return a + t.sold; }, 0);
          var pctSold = Math.min(100, Math.round((totalSold / Math.max(totalQuota, 1)) * 100));
          var isBookmarked = Store.isBookmarked(ev.id);

          html.push(
            '<div class="event-card" onclick="EventHub.go(\'detail\', \'' + ev.id + '\')">',
              '<div class="event-banner-box" style="background:' + ev.gradient + '">',
                '<div class="event-badge-top">',
                  '<span class="category-tag">' + ev.category + '</span>',
                  '<button class="btn-bookmark ' + (isBookmarked ? 'active' : '') + '" onclick="event.stopPropagation(); EventHub.toggleBookmark(\'' + ev.id + '\')">',
                    '♥',
                  '</button>',
                '</div>',
                '<div class="event-date-pill">',
                  ev.date, '<br><span>' + ev.time + '</span>',
                '</div>',
              '</div>',

              '<div class="event-body">',
                '<div>',
                  '<div class="event-organizer-row">',
                    '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981"></span>',
                    '<span>' + ev.organizerName + '</span>',
                  '</div>',
                  '<h3 class="event-card-title">' + ev.title + '</h3>',
                  '<div class="event-venue-row">',
                    Icons.mapPin,
                    '<span>' + ev.venue + ', ' + ev.city + '</span>',
                  '</div>',
                '</div>',

                '<div>',
                  '<div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-dim); margin-bottom:4px">',
                    '<span>Terjual ' + totalSold + ' / ' + totalQuota + '</span>',
                    '<span style="font-weight:700; color:#a5b4fc">' + pctSold + '%</span>',
                  '</div>',
                  '<div class="event-quota-bar">',
                    '<div class="event-quota-progress" style="width:' + pctSold + '%"></div>',
                  '</div>',

                  '<div class="event-price-footer">',
                    '<div>',
                      '<div class="label">Mulai dari</div>',
                      '<div class="val">' + formatRp(minPrice) + '</div>',
                    '</div>',
                    '<span class="btn-book-sm">Pilih Tiket →</span>',
                  '</div>',
                '</div>',
              '</div>',
            '</div>'
          );
        });
      }

      html.push(
          '</div>',
        '</div>'
      );

      return html.join('');
    },

    renderDetailView: function() {
      var ev = Store.getEventById(App.routeParam);
      if (!ev) {
        return '<div class="view-animated card-panel" style="text-align:center; padding:60px"><h3>Event tidak ditemukan</h3><button class="btn-primary" style="margin-top:20px; width:auto; display:inline-flex" onclick="EventHub.go(\'home\')">Kembali ke Beranda</button></div>';
      }

      if (!App.checkoutTierId || !ev.tiers.some(function(t){ return t.id === App.checkoutTierId; })) {
        var availableTier = ev.tiers.find(function(t){ return t.sold < t.quota && t.status !== 'sold_out'; }) || ev.tiers[0];
        App.checkoutTierId = availableTier ? availableTier.id : ev.tiers[0].id;
      }

      var selectedTier = ev.tiers.find(function(t){ return t.id === App.checkoutTierId; }) || ev.tiers[0];
      var subtotal = selectedTier.price * App.checkoutQty;
      var serviceFee = Math.round(subtotal * 0.05);
      var totalAmount = subtotal + serviceFee;
      var remainingQuota = Math.max(0, selectedTier.quota - selectedTier.sold);

      var html = [
        '<div class="view-animated">',
          '<div style="margin-bottom:18px">',
            '<button class="btn-secondary" style="padding:6px 14px; font-size:0.85rem" onclick="EventHub.go(\'home\')">',
              '← Kembali ke Jelajahi Event',
            '</button>',
          '</div>',

          '<div class="detail-layout">',
            '<div class="detail-main">',
              '<div class="detail-hero-banner" style="background:' + ev.gradient + '">',
                '<div style="display:flex; justify-content:space-between; align-items:center">',
                  '<span class="category-tag">' + ev.category + '</span>',
                  '<div class="countdown-box">',
                    '⭐ ' + ev.rating + ' (' + ev.reviewsCount + ' Ulasan)',
                  '</div>',
                '</div>',
                '<div>',
                  '<h1 style="font-size:clamp(1.8rem, 3vw, 2.5rem); font-weight:800; color:white; line-height:1.2; text-shadow:0 2px 8px rgba(0,0,0,0.5)">' + ev.title + '</h1>',
                  '<p style="color:rgba(255,255,255,0.85); font-size:0.95rem; margin-top:6px">Diselenggarakan oleh <b>' + ev.organizerName + '</b></p>',
                '</div>',
              '</div>',

              '<div class="card-panel">',
                '<h3 style="font-size:1.2rem; font-weight:800; margin-bottom:14px">Informasi Acara</h3>',
                '<div class="detail-meta-grid">',
                  '<div class="meta-item">',
                    '<div class="meta-icon-box">' + Icons.calendar + '</div>',
                    '<div class="meta-content">',
                      '<div class="label">Tanggal & Waktu</div>',
                      '<div class="val">' + ev.date + '<br><small style="color:var(--text-muted); font-weight:500">' + ev.time + '</small></div>',
                    '</div>',
                  '</div>',
                  '<div class="meta-item">',
                    '<div class="meta-icon-box">' + Icons.mapPin + '</div>',
                    '<div class="meta-content">',
                      '<div class="label">Lokasi Venue</div>',
                      '<div class="val">' + ev.venue + '<br><small style="color:var(--text-muted); font-weight:500">' + ev.city + '</small></div>',
                    '</div>',
                  '</div>',
                '</div>',

                '<h4 style="font-size:1rem; font-weight:800; margin:24px 0 8px">Deskripsi Acara</h4>',
                '<p style="color:var(--text-muted); line-height:1.7; font-size:0.95rem">' + ev.description + '</p>',
                (ev.videoTrailer ? (
                  '<h4 style="font-size:1rem; font-weight:800; margin:24px 0 8px; color:#ffffff">🎬 Video Trailer & Teaser Acara</h4>' +
                  '<div class="event-video-wrapper">' +
                    '<iframe src="' + ev.videoTrailer + '" title="Trailer Acara" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
                  '</div>'
                ) : ''),

                (ev.galleryImages && ev.galleryImages.length ? (
                  '<h4 style="font-size:1rem; font-weight:800; margin:24px 0 8px; color:#ffffff">📸 Galeri Foto Acara</h4>' +
                  '<div class="event-gallery-grid">' +
                    ev.galleryImages.map(function(img){
                      return '<div class="event-gallery-item"><img src="' + img + '" alt="Dokumentasi Event"></div>';
                    }).join('') +
                  '</div>'
                ) : ''),
                '<h4 style="font-size:1rem; font-weight:800; margin:24px 0 8px">Syarat & Ketentuan Masuk</h4>',
                '<div style="background:var(--bg-surface-elevated); padding:16px 20px; border-radius:var(--radius-md); border-left:4px solid var(--primary); font-size:0.88rem; color:var(--text-muted); line-height:1.6">',
                  ev.terms,
                '</div>',

                '<h4 style="font-size:1rem; font-weight:800; margin:24px 0 8px">Kebijakan Refund Tiket</h4>',
                '<p style="font-size:0.88rem; color:var(--text-muted); line-height:1.6">',
                  'Peserta dapat mengajukan pembatalan / refund langsung dari akun profil selama tiket belum di-scan di gate. Permintaan refund akan diverifikasi dan disetujui/ditolak oleh penyelenggara acara sesuai dengan alasan pengajuan.',
                '</p>',

                '<div style="margin-top:24px; padding:18px 20px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.25); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
                  '<div>',
                    '<b style="color:#ffffff; font-size:0.95rem">Ada pertanyaan seputar acara ini?</b>',
                    '<p style="color:var(--text-muted); font-size:0.82rem; margin:2px 0 0">Kirim pesan langsung ke panitia penyelenggara resmi.</p>',
                  '</div>',
                  '<button class="btn-primary" style="width:auto; padding:8px 18px; font-size:0.85rem" onclick="EventHub.openSendMessageModal(\'' + ev.id + '\')">',
                    '💬 Tanya Penyelenggara',
                  '</button>',
                '</div>',
              '</div>',
            '</div>',

            // Ticket Choice Box
            '<div>',
              '<div class="card-panel" style="position:sticky; top:90px">',
                '<h3 style="font-size:1.25rem; font-weight:800; margin-bottom:16px">Pilih Kategori Tiket</h3>',
                '<div style="margin-bottom:18px">'
      ];

      ev.tiers.forEach(function(tier) {
        var isSoldOut = tier.sold >= tier.quota || tier.status === 'sold_out';
        var isSelected = tier.id === App.checkoutTierId;
        var left = Math.max(0, tier.quota - tier.sold);

        html.push(
          '<div class="tier-item-card ' + (isSelected ? 'selected' : '') + ' ' + (isSoldOut ? 'sold-out' : '') + '" onclick="' + (isSoldOut ? '' : 'EventHub.selectTier(\'' + tier.id + '\')') + '">',
            '<div class="tier-head">',
              '<div class="tier-name">' + tier.name + '</div>',
              '<div class="tier-price">' + formatRp(tier.price) + '</div>',
            '</div>',
            '<div class="tier-desc">' + tier.description + '</div>',
            '<div>',
              '<span class="tier-remaining-tag ' + (isSoldOut ? 'tag-sold-out' : 'tag-available') + '">',
                isSoldOut ? 'Tiket Habis' : 'Tersisa ' + left + ' tiket',
              '</span>',
            '</div>',
          '</div>'
        );
      });

      html.push(
                '</div>',

                '<div style="margin-bottom:20px; padding-top:16px; border-top:1px solid var(--border-glass)">',
                  '<div class="form-label">Jumlah Tiket (Maks. 5 tiket)</div>',
                  '<div class="qty-stepper">',
                    '<button class="qty-btn" onclick="EventHub.updateCheckoutQty(-1)" ' + (App.checkoutQty <= 1 ? 'disabled' : '') + '>−</button>',
                    '<span class="qty-display">' + App.checkoutQty + '</span>',
                    '<button class="qty-btn" onclick="EventHub.updateCheckoutQty(1)" ' + (App.checkoutQty >= 5 || App.checkoutQty >= remainingQuota ? 'disabled' : '') + '>+</button>',
                    '<span style="font-size:0.82rem; color:var(--text-dim)">tiket</span>',
                  '</div>',
                '</div>',

                '<div style="background:var(--bg-surface-elevated); padding:16px; border-radius:var(--radius-md); margin-bottom:20px; font-size:0.88rem">',
                  '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                    '<span style="color:var(--text-muted)">' + App.checkoutQty + 'x ' + selectedTier.name + '</span>',
                    '<b>' + formatRp(subtotal) + '</b>',
                  '</div>',
                  '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                    '<span style="color:var(--text-muted)">Biaya Platform & Payment (5%)</span>',
                    '<span>' + formatRp(serviceFee) + '</span>',
                  '</div>',
                  '<div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px dashed var(--border-glass); font-size:1.05rem; font-weight:800">',
                    '<span>Total Pembayaran</span>',
                    '<span style="color:#38bdf8">' + formatRp(totalAmount) + '</span>',
                  '</div>',
                '</div>',

                '<button class="btn-primary" ' + (remainingQuota <= 0 ? 'disabled' : '') + ' onclick="EventHub.startCheckout(\'' + ev.id + '\', \'' + selectedTier.id + '\')">',
                  remainingQuota <= 0 ? 'Tiket Habis' : 'Lanjutkan ke Pembayaran →',
                '</button>',
                '<p style="font-size:0.75rem; color:var(--text-dim); text-align:center; margin-top:10px">QR e-tiket instan otomatis terbit setelah pembayaran selesai.</p>',
              '</div>',
            '</div>',
          '</div>',
        '</div>'
      );

      return html.join('');
    },

    renderTicketsView: function() {
      var user = Store.getCurrentUser();
      if (!user) {
        return '<div class="card-panel">Silakan login terlebih dahulu.</div>';
      }

      var tickets = Store.getUserTickets(user.email);

      var html = [
        '<div class="view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h1 style="font-size:1.8rem; font-weight:800">Tiket Saya</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Tunjukkan kode QR tiket ini kepada panitia / penyelenggara di pintu masuk venue.</p>',
            '</div>',
            '<button class="btn-secondary" onclick="EventHub.go(\'refunds\')">',
              Icons.refund, ' Riwayat Pengajuan Refund',
            '</button>',
          '</div>'
      ];

      if (tickets.length === 0) {
        html.push(
          '<div class="card-panel" style="text-align:center; padding:60px 20px">',
            '<div style="font-size:3rem; margin-bottom:12px">🎟️</div>',
            '<h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px">Belum Ada Tiket</h3>',
            '<p style="color:var(--text-muted); margin-bottom:20px">Anda belum memiliki tiket aktif. Jelajahi event seru dan pesan tiket favorit Anda sekarang!</p>',
            '<button class="btn-primary" style="width:auto; display:inline-flex" onclick="EventHub.go(\'home\')">',
              'Jelajahi Event Sekarang →',
            '</button>',
          '</div>'
        );
      } else {
        tickets.forEach(function(t) {
          var ev = Store.getEventById(t.eventId) || {
            date: '2026', time: '', venue: 'Venue Acara', city: 'Bandung', gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)'
          };

          var statusClass = 'status-' + t.status;
          var statusLabel = t.status === 'valid' ? '● SIAP DIPAKAI'
            : t.status === 'used' ? '✓ SUDAH CHECK-IN'
            : t.status === 'refund_pending' ? '⏳ REFUND DIAJUKAN'
            : '✖ DIREFUND';

          var canRefund = (t.status === 'valid');
          var userSub = Store.getUserSubscription(user.email);
          var hasFastTrack = userSub && userSub.active;

          html.push(
            '<div class="ticket-pass-card">',
              '<div class="ticket-left">',
                '<div>',
                  '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px">',
                    '<div style="display:flex; align-items:center; gap:8px">',
                      '<span class="ticket-status-badge ' + statusClass + '">' + statusLabel + '</span>',
                      (hasFastTrack ? '<span style="background:linear-gradient(135deg,#f59e0b,#fbbf24); color:#000000; font-weight:900; font-size:0.7rem; padding:3px 8px; border-radius:99px; box-shadow:0 0 10px rgba(245,158,11,0.5)">⚡ FAST-TRACK GATE</span>' : ''),
                    '</div>',
                    '<span style="font-size:0.75rem; color:var(--text-dim)">Order: ' + (t.orderId || t.id) + '</span>',
                  '</div>',
                  '<h2 style="font-size:1.45rem; font-weight:800; margin-bottom:4px">' + t.eventName + '</h2>',
                  '<div style="color:#818cf8; font-weight:700; font-size:0.95rem; margin-bottom:14px">' + t.tierName + '</div>',
                  '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:16px">',
                    '<div>',
                      '<div style="font-size:0.75rem; color:var(--text-dim)">Tanggal & Waktu</div>',
                      '<div style="font-size:0.88rem; font-weight:700">' + ev.date + '<br><small style="color:var(--text-muted)">' + ev.time + '</small></div>',
                    '</div>',
                    '<div>',
                      '<div style="font-size:0.75rem; color:var(--text-dim)">Lokasi Venue</div>',
                      '<div style="font-size:0.88rem; font-weight:700">' + ev.venue + ', ' + ev.city + '</div>',
                    '</div>',
                    '<div>',
                      '<div style="font-size:0.75rem; color:var(--text-dim)">Nama Pemegang</div>',
                      '<div style="font-size:0.88rem; font-weight:700">' + t.buyerName + '</div>',
                    '</div>',
                  '</div>',
                '</div>',

                '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding-top:14px; border-top:1px dashed var(--border-glass)">',
                  '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem" onclick="EventHub.openTicketModal(\'' + t.code + '\')">',
                    Icons.qr, ' Perbesar QR',
                  '</button>',
                  canRefund ? '<button class="btn-danger" style="padding:6px 14px; font-size:0.8rem" onclick="EventHub.openRefundModal(\'' + t.code + '\')">' + Icons.refund + ' Ajukan Refund</button>' : '',
                  t.status === 'refund_pending' ? '<span style="font-size:0.8rem; color:#f59e0b">Menunggu persetujuan penyelenggara</span>' : '',
                '</div>',
              '</div>',

              '<div class="ticket-right">',
                '<div class="ticket-qr-frame">',
                  QR.generateSvg(t.code, { cellSize: 4, margin: 1 }),
                '</div>',
                '<div class="ticket-code-tag">' + t.code + '</div>',
                '<div style="font-size:0.72rem; color:var(--text-dim); text-align:center">Scan oleh panitia acara</div>',
              '</div>',
            '</div>'
          );
        });
      }

      html.push('</div>');
      return html.join('');
    },

    renderRefundsView: function() {
      var user = Store.getCurrentUser();
      var refunds = user ? Store.getUserRefunds(user.email) : [];

      var html = [
        '<div class="view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">',
            '<div>',
              '<h1 style="font-size:1.8rem; font-weight:800">Pusat Refund Tiket</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Status permohonan pengembalian dana tiket Anda langsung ke penyelenggara acara.</p>',
            '</div>',
            '<button class="btn-secondary" onclick="EventHub.go(\'tickets\')">',
              Icons.ticket, ' Kembali ke Tiket Saya',
            '</button>',
          '</div>',

          '<div class="card-panel" style="margin-bottom:24px">',
            '<h3 style="font-size:1.05rem; font-weight:800; margin-bottom:8px">Kebijakan & Alur Pengajuan Refund</h3>',
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-top:14px">',
              '<div style="background:var(--bg-surface-elevated); padding:14px; border-radius:var(--radius-md)">',
                '<b>1. Ajukan dari Tiket Aktif</b>',
                '<p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px">Tiket belum pernah di-scan dan acara belum selesai.</p>',
              '</div>',
              '<div style="background:var(--bg-surface-elevated); padding:14px; border-radius:var(--radius-md)">',
                '<b>2. Verifikasi Penyelenggara</b>',
                '<p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px">Penyelenggara akan menyetujui atau menolak dengan alasan jelas.</p>',
              '</div>',
              '<div style="background:var(--bg-surface-elevated); padding:14px; border-radius:var(--radius-md)">',
                '<b>3. Pengembalian Dana</b>',
                '<p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px">Dana dikembalikan ke rekening/e-wallet yang Anda daftarkan.</p>',
              '</div>',
            '</div>',
          '</div>'
      ];

      if (refunds.length === 0) {
        html.push(
          '<div class="card-panel" style="text-align:center; padding:50px 20px">',
            '<p style="color:var(--text-muted)">Belum ada pengajuan refund. Anda dapat mengajukan refund melalui menu <b>Tiket Saya</b>.</p>',
          '</div>'
        );
      } else {
        html.push('<div style="display:flex; flex-direction:column; gap:16px">');
        refunds.forEach(function(r) {
          var statusBadge = r.status === 'approved'
            ? '<span style="background:rgba(16,185,129,0.15); color:#34d399; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">✓ DISETUJUI PENYELENGGARA</span>'
            : r.status === 'rejected'
            ? '<span style="background:rgba(244,63,94,0.15); color:#fb7185; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">✖ DITOLAK PENYELENGGARA</span>'
            : '<span style="background:rgba(245,158,11,0.15); color:#fbbf24; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">⏳ MENUNGGU PERSETUJUAN</span>';

          html.push(
            '<div class="card-panel" style="padding:20px">',
              '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px">',
                '<div>',
                  '<div style="font-size:0.75rem; color:var(--text-dim)">ID Refund: ' + r.id + ' • ' + r.createdAt + '</div>',
                  '<h3 style="font-size:1.15rem; font-weight:800; margin:2px 0">' + r.eventName + '</h3>',
                  '<div style="font-size:0.85rem; color:#818cf8">' + r.tierName + ' • Kode: ' + r.ticketCode + '</div>',
                '</div>',
                '<div>' + statusBadge + '</div>',
              '</div>',

              '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin:14px 0; background:var(--bg-surface-elevated); padding:14px; border-radius:var(--radius-md); font-size:0.85rem">',
                '<div>',
                  '<span style="color:var(--text-dim)">Nominal Pengembalian:</span><br>',
                  '<b style="color:#38bdf8; font-size:1.05rem">' + formatRp(r.refundAmount) + '</b>',
                '</div>',
                '<div>',
                  '<span style="color:var(--text-dim)">Rekening / E-Wallet Tujuan:</span><br>',
                  '<b>' + r.bankName + ' - ' + r.accountNumber + '</b> (' + r.accountHolder + ')',
                '</div>',
                '<div>',
                  '<span style="color:var(--text-dim)">Alasan Pembatalan:</span><br>',
                  '<b>' + r.reason + '</b>',
                '</div>',
              '</div>',

              r.organizerNote ? (
                '<div style="padding:10px 14px; border-radius:var(--radius-sm); background:' + (r.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)') + '; font-size:0.85rem; color:var(--text-main)">' +
                  '<b>Catatan Penyelenggara:</b> ' + r.organizerNote +
                '</div>'
              ) : '',
            '</div>'
          );
        });
        html.push('</div>');
      }

      html.push('</div>');
      return html.join('');
    },
    renderMessagesView: function() {
      var user = Store.getCurrentUser();
      if (!user) {
        return '<div class="card-panel">Silakan login terlebih dahulu.</div>';
      }

      var userMsgs = Store.getUserMessages(user.email);

      var html = [
        '<div class="view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h1 style="font-size:1.8rem; font-weight:800">Pesan & Tanya Penyelenggara</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Percakapan langsung antara Anda dan pihak penyelenggara acara resmi.</p>',
            '</div>',
            '<button class="btn-secondary" onclick="EventHub.go(\'home\')">',
              '← Jelajahi Event',
            '</button>',
          '</div>'
      ];

      if (userMsgs.length === 0) {
        html.push(
          '<div class="card-panel" style="text-align:center; padding:60px 20px">',
            '<div style="font-size:3rem; margin-bottom:12px">💬</div>',
            '<h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px">Belum Ada Pesan</h3>',
            '<p style="color:var(--text-muted); margin-bottom:20px">Anda belum pernah mengirim pertanyaan ke penyelenggara. Buka detail event favorit Anda lalu klik tombol "Tanya Penyelenggara"!</p>',
            '<button class="btn-primary" style="width:auto; display:inline-flex" onclick="EventHub.go(\'home\')">',
              'Jelajahi Event Sekarang →',
            '</button>',
          '</div>'
        );
      } else {
        html.push('<div style="display:flex; flex-direction:column; gap:20px">');
        userMsgs.forEach(function(m) {
          var statusBadge = m.status === 'replied'
            ? '<span style="background:rgba(16,185,129,0.15); color:#34d399; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">✓ DIBALAS PENYELENGGARA</span>'
            : '<span style="background:rgba(99,102,241,0.15); color:#a5b4fc; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">⏳ MENUNGGU BALASAN</span>';

          html.push(
            '<div class="card-panel" style="padding:24px">',
              '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:8px">',
                '<div>',
                  '<div style="font-size:0.75rem; color:var(--text-dim)">' + m.id + ' • ' + m.createdAt + '</div>',
                  '<h3 style="font-size:1.25rem; font-weight:800; margin:2px 0; color:#ffffff">' + m.subject + '</h3>',
                  '<div style="font-size:0.85rem; color:#818cf8">Acara: <b>' + m.eventName + '</b> (Penyelenggara: ' + m.organizerName + ')</div>',
                '</div>',
                '<div>' + statusBadge + '</div>',
              '</div>',

              '<div style="background:var(--bg-surface-elevated); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-glass); margin-bottom:16px; display:flex; flex-direction:column; gap:12px">'
          );

          m.thread.forEach(function(t) {
            var isMe = t.sender.toLowerCase() === user.email.toLowerCase();
            html.push(
              '<div style="display:flex; flex-direction:column; align-items:' + (isMe ? 'flex-end' : 'flex-start') + '">',
                '<div style="font-size:0.72rem; color:var(--text-dim); margin-bottom:3px">' + t.senderName + ' • ' + t.time + '</div>',
                '<div style="max-width:80%; padding:10px 16px; border-radius:12px; font-size:0.9rem; line-height:1.5; background:' + (isMe ? 'rgba(99,102,241,0.25); color:#ffffff; border:1px solid rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06); color:#f1f5f9; border:1px solid rgba(255,255,255,0.1)') + '">',
                  t.text,
                '</div>',
              '</div>'
            );
          });

          html.push(
              '</div>',

              '<div style="display:flex; gap:10px">',
                '<input class="form-control" id="reply-msg-' + m.id + '" placeholder="Ketik balasan Anda..." onkeydown="if(event.key===\'Enter\') EventHub.submitReplyMessage(\'' + m.id + '\')">',
                '<button class="btn-primary" style="width:auto; padding:10px 20px; white-space:nowrap" onclick="EventHub.submitReplyMessage(\'' + m.id + '\')">',
                  'Kirim Balasan',
                '</button>',
              '</div>',
            '</div>'
          );
        });
        html.push('</div>');
      }

      html.push('</div>');
      return html.join('');
    },

    renderFavoritesView: function() {
      var bookmarks = Store.getBookmarks();
      var allEvents = Store.getEvents();
      var favEvents = allEvents.filter(function(e) { return bookmarks.indexOf(e.id) >= 0; });

      var html = [
        '<div class="view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h1 style="font-size:1.8rem; font-weight:800">Acara Favorit Saya (Wishlist)</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Koleksi tiket event yang Anda simpan untuk dibeli nanti.</p>',
            '</div>',
            '<button class="btn-secondary" onclick="EventHub.go(\'home\')">',
              '← Jelajahi Event Lainnya',
            '</button>',
          '</div>'
      ];

      if (favEvents.length === 0) {
        html.push(
          '<div class="card-panel" style="text-align:center; padding:60px 20px">',
            '<div style="font-size:3.2rem; margin-bottom:12px">❤️</div>',
            '<h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px">Belum Ada Event Favorit</h3>',
            '<p style="color:var(--text-muted); margin-bottom:20px">Klik ikon hati (♥) pada kartu event di halaman Jelajahi untuk menyimpannya di sini!</p>',
            '<button class="btn-primary" style="width:auto; display:inline-flex" onclick="EventHub.go(\'home\')">',
              'Jelajahi Event Sekarang →',
            '</button>',
          '</div>'
        );
      } else {
        html.push('<div class="events-grid">');
        favEvents.forEach(function(ev) {
          var minPrice = Math.min.apply(null, ev.tiers.map(function(t){ return t.price; }));
          var totalQuota = ev.tiers.reduce(function(a, t){ return a + t.quota; }, 0);
          var totalSold = ev.tiers.reduce(function(a, t){ return a + t.sold; }, 0);
          var pctSold = Math.min(100, Math.round((totalSold / Math.max(totalQuota, 1)) * 100));

          html.push(
            '<div class="event-card" onclick="EventHub.go(\'detail\', \'' + ev.id + '\')">',
              '<div class="event-banner-box" style="background:' + ev.gradient + '">',
                '<div class="event-badge-top">',
                  '<span class="category-tag">' + ev.category + '</span>',
                  '<button class="btn-bookmark active" onclick="event.stopPropagation(); EventHub.toggleBookmark(\'' + ev.id + '\')">',
                    '♥',
                  '</button>',
                '</div>',
                '<div class="event-date-pill">',
                  ev.date, '<br><span>' + ev.time + '</span>',
                '</div>',
              '</div>',

              '<div class="event-body">',
                '<div>',
                  '<div class="event-organizer-row">',
                    '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981"></span>',
                    '<span>' + ev.organizerName + '</span>',
                  '</div>',
                  '<h3 class="event-card-title">' + ev.title + '</h3>',
                  '<div class="event-venue-row">',
                    Icons.mapPin,
                    '<span>' + ev.venue + ', ' + ev.city + '</span>',
                  '</div>',
                '</div>',

                '<div>',
                  '<div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-dim); margin-bottom:4px">',
                    '<span>Terjual ' + totalSold + ' / ' + totalQuota + '</span>',
                    '<span style="font-weight:700; color:#a5b4fc">' + pctSold + '%</span>',
                  '</div>',
                  '<div class="event-quota-bar">',
                    '<div class="event-quota-progress" style="width:' + pctSold + '%"></div>',
                  '</div>',

                  '<div class="event-price-footer">',
                    '<div>',
                      '<div class="label">Mulai dari</div>',
                      '<div class="val">' + formatRp(minPrice) + '</div>',
                    '</div>',
                    '<span class="btn-book-sm">Pilih Tiket →</span>',
                  '</div>',
                '</div>',
              '</div>',
            '</div>'
          );
        });
        html.push('</div>');
      }

      html.push('</div>');
      return html.join('');
    },

    renderProfileView: function() {
      var user = Store.getCurrentUser();
      if (!user) {
        return '<div class="card-panel">Silakan login terlebih dahulu untuk mengakses profil.</div>';
      }

      var userTickets = Store.getUserTickets(user.email);
      var userRefunds = Store.getUserRefunds(user.email);
      var userMsgs = Store.getUserMessages(user.email);
      var bookmarks = Store.getBookmarks();

      var html = [
        '<div class="view-animated" style="max-width:1100px; margin:0 auto">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h1 style="font-size:1.85rem; font-weight:800; color:#ffffff">Profil & Pengaturan Akun</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Kelola identitas diri, nomor kontak e-tiket, keamanan kata sandi, dan status akun Anda.</p>',
            '</div>',
            '<button class="btn-danger" style="padding:10px 20px; font-size:0.85rem" onclick="EventHub.logout()">',
              '🚪 Keluar dari Akun (Logout)',
            '</button>',
          '</div>',

          // Top Profile Card Banner
          '<div class="pos-header-card" style="margin-bottom:24px; padding:24px 28px">',
            '<div class="pos-header-left">',
              '<div class="user-avatar-sm" style="width:72px; height:72px; font-size:1.8rem; border-radius:20px; box-shadow:0 8px 24px rgba(99,102,241,0.4)">',
                (user.avatarText || user.name.charAt(0)),
              '</div>',
              '<div>',
                '<div style="display:flex; align-items:center; gap:10px; margin-bottom:4px">',
                  '<h2 style="font-size:1.45rem; font-weight:800; color:#ffffff">' + user.name + '</h2>',
                  '<span class="user-role-tag role-' + user.role + '" style="font-size:0.75rem; padding:3px 10px">' + (user.role === 'peserta' ? 'Peserta Terdaftar' : user.role) + '</span>',
                '</div>',
                '<div style="color:var(--text-muted); font-size:0.88rem; display:flex; align-items:center; gap:14px; flex-wrap:wrap">',
                  '<span>✉️ ' + user.email + ' <small style="color:#10b981; font-weight:700">(Terverifikasi)</small></span>',
                  '<span>📱 ' + (user.phone || 'Belum isi no HP') + '</span>',
                  '<span>📅 Bergabung: ' + (user.createdAt || '2026') + '</span>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',

          // Quick Stats Grid
          '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:18px; margin-bottom:28px">',
            '<div class="card-panel" style="padding:18px 20px; cursor:pointer" onclick="EventHub.go(\'tickets\')">',
              '<div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700">Tiket Dimiliki</div>',
              '<div style="font-size:1.6rem; font-weight:800; color:#38bdf8; margin:4px 0">' + userTickets.length + ' Tiket</div>',
              '<small style="color:#10b981">Lihat E-Tiket & Kode QR →</small>',
            '</div>',
            '<div class="card-panel" style="padding:18px 20px; cursor:pointer" onclick="EventHub.go(\'favorites\')">',
              '<div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700">Wishlist Favorit</div>',
              '<div style="font-size:1.6rem; font-weight:800; color:#ec4899; margin:4px 0">' + bookmarks.length + ' Acara</div>',
              '<small style="color:#ec4899">Buka Halaman Favorit →</small>',
            '</div>',
            '<div class="card-panel" style="padding:18px 20px; cursor:pointer" onclick="EventHub.go(\'messages\')">',
              '<div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700">Pesan & Tanya</div>',
              '<div style="font-size:1.6rem; font-weight:800; color:#818cf8; margin:4px 0">' + userMsgs.length + ' Percakapan</div>',
              '<small style="color:#818cf8">Chat dengan Penyelenggara →</small>',
            '</div>',
            '<div class="card-panel" style="padding:18px 20px; cursor:pointer" onclick="EventHub.go(\'refunds\')">',
              '<div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700">Pengajuan Refund</div>',
              '<div style="font-size:1.6rem; font-weight:800; color:#fbbf24; margin:4px 0">' + userRefunds.length + ' Pengajuan</div>',
              '<small style="color:#fbbf24">Cek Status Pengembalian →</small>',
            '</div>',
          '</div>',

          // 2-Column Settings (Biodata & Password)
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px">',
            // Column 1: Biodata & Kontak
            '<div class="card-panel">',
              '<h3 style="font-size:1.15rem; font-weight:800; margin-bottom:16px; color:#ffffff">Data Pribadi & Kontak</h3>',
              '<div class="form-group">',
                '<label class="form-label">Nama Lengkap</label>',
                '<input class="form-control" id="profile-name" value="' + user.name + '">',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Email Akun (Terdaftar)</label>',
                '<input class="form-control" value="' + user.email + '" readonly style="opacity:0.8; background:rgba(255,255,255,0.04)">',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Nomor WhatsApp / HP (Untuk Tiket)</label>',
                '<input class="form-control" id="profile-phone" value="' + (user.phone || '') + '" placeholder="08xxxxxxxxxx">',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Kota Asal / Domisili</label>',
                '<input class="form-control" id="profile-city" value="' + (user.city || 'Bandung') + '">',
              '</div>',
              '<button class="btn-primary" style="margin-top:14px" onclick="EventHub.saveProfileFromPage()">',
                '💾 Simpan Perubahan Profil',
              '</button>',
            '</div>',

            // Column 2: Keamanan & Ganti Password
            '<div class="card-panel">',
              '<h3 style="font-size:1.15rem; font-weight:800; margin-bottom:16px; color:#ffffff">Keamanan & Ubah Kata Sandi</h3>',
              '<div class="form-group">',
                '<label class="form-label">Kata Sandi Lama</label>',
                '<input class="form-control" id="pw-old" type="password" placeholder="Masukkan kata sandi lama">',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Kata Sandi Baru</label>',
                '<input class="form-control" id="pw-new" type="password" placeholder="Minimal 8 karakter (kombinasi huruf & angka)">',
                '<span class="auth-req-hint">Wajib minimal 8 karakter dengan huruf dan angka.</span>',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Ulangi Kata Sandi Baru</label>',
                '<input class="form-control" id="pw-confirm" type="password" placeholder="Ulangi kata sandi baru">',
              '</div>',
              '<button class="btn-primary" style="margin-top:14px; background:#1d4ed8" onclick="EventHub.submitChangePassword()">',
                '🔒 Perbarui Kata Sandi Akun',
              '</button>',
            '</div>',
          '</div>',

          // Bottom Action Row
          '<div class="card-panel" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">',
            '<div>',
              '<b style="font-size:1rem; color:#ffffff">Sesi & Akun Perangkat</b>',
              '<p style="color:var(--text-muted); font-size:0.82rem; margin:2px 0 0">Keluar dari akun Anda dengan aman atau reset data demo jika diperlukan.</p>',
            '</div>',
            '<div style="display:flex; gap:10px">',
              '<button class="btn-secondary" style="font-size:0.85rem" onclick="EventHub.resetAllDemoData()">',
                '🔄 Reset Data Demo',
              '</button>',
              '<button class="btn-danger" style="font-size:0.85rem; padding:10px 20px" onclick="EventHub.logout()">',
                '🚪 Keluar dari Akun',
              '</button>',
            '</div>',
          '</div>',
        '</div>'
      ];

      return html.join('');
    }
  };

  window.EventParticipant = ParticipantModule;
})(window);
