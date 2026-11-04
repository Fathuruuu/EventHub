/**
 * EventHub - Fast-Track VIP & Membership Subscription Module
 * Desain UI Pricing Page Terinspirasi shadcn/ui Sesuai Referensi Pengguna
 * Terbuka untuk Peserta, Penyelenggara & Admin (Hanya Super Admin yang berhak mengedit harga & paket)
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Confetti = window.EventConfetti;
  var Router = window.EventRouter;
  var formatRp = Router.formatRp;

  // Minimalist shadcn outline SVGs
  var checkSvg = '<svg class="shadcn-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  var userSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

  var badgeCheckSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>';

  var businessSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>';

  var currentBillingCycle = '1bulan';

  var FastTrackModule = {
    renderFastTrackView: function() {
      var user = Store.getCurrentUser();
      var currentSub = user ? Store.getUserSubscription(user.email) : null;
      var isOrganizer = user && user.role === 'penyelenggara';
      var isSuperAdmin = user && user.role === 'superadmin';

      // Ambil paket membership langsung dari Store (mendukung dynamic update harga dari Admin)
      var dbPlans = Store.getMemberships();
      var planMeta = {
        silver: {
          mainName: 'Starter',
          iconSvg: userSvg,
          buttonText: 'Choose Starter',
          priceSub: '(ditagih bulanan)',
          isFeatured: false
        },
        gold: {
          mainName: 'Pro',
          iconSvg: badgeCheckSvg,
          buttonText: 'Upgrade Now',
          priceSub: '(paling diminati penonton)',
          isFeatured: true
        },
        platinum: {
          mainName: 'Business',
          iconSvg: businessSvg,
          buttonText: 'Select Enterprise',
          priceSub: '(fasilitas VVIP terlengkap)',
          isFeatured: false
        }
      };

      var plans = dbPlans.map(function(p) {
        var meta = planMeta[p.id] || {
          mainName: p.name,
          iconSvg: userSvg,
          buttonText: 'Pilih Paket',
          priceSub: '(ditagih bulanan)',
          isFeatured: !!p.popular
        };
        return {
          id: p.id,
          name: meta.mainName,
          subName: p.name,
          price: p.price,
          priceYearly: p.priceYearly || (p.price * 10),
          priceSub: meta.priceSub,
          iconSvg: meta.iconSvg,
          buttonText: meta.buttonText,
          isFeatured: (typeof p.popular !== 'undefined') ? p.popular : meta.isFeatured,
          features: p.benefits || []
        };
      });

      var billingCycle = currentBillingCycle;

      var html = [
        '<div class="shadcn-pricing-container view-animated">',

          // Top Header (Typography matching reference image)
          '<div class="shadcn-header">',
            '<div class="hero-badge-pill" style="margin-bottom:14px">',
              '<span class="radar-ping"></span> JALUR EKSPRES PRIORITAS GATE MASUK ACARA',
            '</div>',
            '<h1 class="shadcn-title-top">',
              'shadcn <span class="gradient-text">Pricing Pages</span>',
            '</h1>',
            '<p class="shadcn-title-sub">',
              'Nikmati akses kilat Fast-Track VIP langsung masuk tanpa antre di seluruh konser & festival pilihan. Buka jalur gerbang ekspres prioritas, diskon tiket otomatis hingga 15%, bebas biaya platform, serta badge level VIP eksklusif di samping nama dan e-tiket Anda.',
            '</p>'
      ];

      // KONTROL KHUSUS SUPER ADMIN: Tombol kelola harga & paket membership
      if (isSuperAdmin) {
        html.push(
          '<div style="text-align:center; margin-top:16px">',
            '<button class="btn-primary" style="width:auto; padding:9px 24px; font-size:0.85rem; background:linear-gradient(135deg, #10b981, #059669); border:none; box-shadow:0 0 20px rgba(16,185,129,0.4)" onclick="EventHub.openEditMembershipModal(\'gold\')">',
              '✏️ Kelola & Ubah Harga Subscription (Mode Super Admin)',
            '</button>',
          '</div>'
        );
      }

      html.push('</div>'); // Close shadcn-header

      // Interactive Billing Duration Switcher (1 Bulan vs 1 Tahun)
      html.push(
        '<div class="billing-toggle-wrapper">',
          '<div class="billing-toggle-box">',
            '<button type="button" class="billing-toggle-btn ' + (billingCycle === '1bulan' ? 'active' : '') + '" onclick="EventFastTrack.setBillingCycle(\'1bulan\')">',
              '<span>📅</span> 1 Bulan (Bulanan)',
            '</button>',
            '<button type="button" class="billing-toggle-btn ' + (billingCycle === '1tahun' ? 'active' : '') + '" onclick="EventFastTrack.setBillingCycle(\'1tahun\')">',
              '<span>🌟</span> 1 Tahun (Tahunan) <span class="save-pill">Hemat 2 Bulan (~20%)</span>',
            '</button>',
          '</div>',
        '</div>'
      );

      // Current Active / Expired Plan Alert
      if (currentSub) {
        var daysRemaining = Store.getSubscriptionDaysRemaining ? Store.getSubscriptionDaysRemaining(currentSub.expiresAt) : 30;
        var isExpired = currentSub.isExpired || !currentSub.active;

        if (!isExpired) {
          html.push(
            '<div style="background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.35); padding:18px 24px; border-radius:20px; margin-bottom:32px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px">',
              '<div style="display:flex; align-items:center; gap:14px">',
                '<div style="font-size:2.2rem">👑</div>',
                '<div>',
                  '<div style="font-size:0.75rem; font-weight:800; color:#c084fc; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px">',
                    '<span>STATUS MEMBERSHIP AKTIF ANDA</span>',
                    '<span class="duration-badge badge-' + (currentSub.durationKey || '1bulan') + '">' + (currentSub.duration || '1 Bulan') + '</span>',
                  '</div>',
                  '<div style="margin:4px 0">',
                    '<b style="font-size:1.15rem; color:#ffffff">' + currentSub.planName + '</b> <span class="brand-vip-badge badge-' + currentSub.planId + '">' + currentSub.badgeText + '</span>',
                  '</div>',
                  '<div style="font-size:0.82rem; color:#cbd5e1">',
                    'Jalur Fast-Track Aktif • Diskon ' + (currentSub.discountPercent || 10) + '% Otomatis • Masa Berlaku: <b>' + (currentSub.startedAt || 'Hari Ini') + '</b> s/d <b>' + (currentSub.expiresAt || '-') + '</b> ',
                    '<span style="background:rgba(16,185,129,0.2); color:#34d399; font-weight:800; font-size:0.75rem; padding:2px 8px; border-radius:99px; margin-left:6px">Sisa ' + daysRemaining + ' Hari Lagi</span>',
                  '</div>',
                '</div>',
              '</div>',
              '<button class="shadcn-btn shadcn-btn-secondary" style="width:auto; padding:8px 18px; font-size:0.85rem" onclick="EventHub.go(\'tickets\')">',
                '🎟️ Lihat E-Tiket Fast-Track Saya',
              '</button>',
            '</div>'
          );
        } else {
          html.push(
            '<div style="background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.35); padding:18px 24px; border-radius:20px; margin-bottom:32px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px">',
              '<div style="display:flex; align-items:center; gap:14px">',
                '<div style="font-size:2.2rem">⏳</div>',
                '<div>',
                  '<div style="font-size:0.75rem; font-weight:800; color:#fb7185; text-transform:uppercase; letter-spacing:1px">MEMBERSHIP TELAH KEDALUWARSA (EXPIRED)</div>',
                  '<div style="margin:4px 0">',
                    '<b style="font-size:1.15rem; color:#ffffff">' + currentSub.planName + ' (' + (currentSub.duration || '1 Bulan') + ')</b> <span class="duration-badge badge-1bulan" style="background:rgba(244,63,94,0.2); color:#fb7185">Kedaluwarsa</span>',
                  '</div>',
                  '<div style="font-size:0.82rem; color:#cbd5e1">Masa aktif paket Anda telah berakhir pada <b>' + (currentSub.expiresAt || '-') + '</b>. Pilih paket durasi di bawah untuk memperpanjang jalur Fast-Track.</div>',
                '</div>',
              '</div>',
              '<button class="btn-primary" style="width:auto; padding:8px 18px; font-size:0.85rem; background:linear-gradient(135deg, #f43f5e, #fb7185); border:none" onclick="document.querySelector(\'.shadcn-cards-wrapper\').scrollIntoView({behavior:\'smooth\'})">',
                '🔄 Perpanjang Paket Sekarang',
              '</button>',
            '</div>'
          );
        }
      }

      // 3 Cards Layout (Pixel-Aligned with Reference Image)
      html.push('<div class="shadcn-cards-wrapper">');

      plans.forEach(function(plan) {
        var isCurrent = currentSub && currentSub.planId === plan.id && currentSub.active;

        html.push(
          '<div class="shadcn-card ' + (plan.isFeatured ? 'featured-pro' : '') + '">',
            // Floating "Popular" Pill & Diagonal Ribbon for Pro
            plan.isFeatured ? '<div class="shadcn-popular-pill">Popular</div>' : '',
            plan.isFeatured ? '<div class="shadcn-ribbon">Popular</div>' : '',

            '<div>',
              // Top Row: Title + Icon
              '<div class="shadcn-card-header">',
                '<div>',
                  '<h3 class="shadcn-plan-name">' + plan.name + '</h3>',
                  '<div style="font-size:0.75rem; color:#64748b; font-weight:600; margin-top:2px">' + plan.subName + '</div>',
                '</div>',
                '<div class="shadcn-plan-icon">' + plan.iconSvg + '</div>',
              '</div>',

              // Middle Features List with Checkmarks
              '<ul class="shadcn-features">'
        );

        plan.features.forEach(function(f) {
          html.push(
            '<li class="shadcn-feature-item">',
              checkSvg,
              '<span>' + f + '</span>',
            '</li>'
          );
        });

        html.push(
              '</ul>',
            '</div>',

            // Bottom Section: CTA Button + Anchored Price
            '<div>',
              (function() {
                var isThisCurrent = isCurrent && !currentSub.isExpired && (currentSub.durationKey === billingCycle || (!currentSub.durationKey && billingCycle === '1bulan'));
                if (isThisCurrent) {
                  return '<button class="shadcn-btn shadcn-btn-secondary" style="background:rgba(16,185,129,0.15); color:#34d399; border-color:rgba(16,185,129,0.3)" disabled>✓ Paket ' + (billingCycle === '1tahun' ? '1 Tahun' : '1 Bulan') + ' Aktif</button>';
                }
                return '<button class="shadcn-btn ' + (plan.isFeatured ? 'shadcn-btn-primary' : 'shadcn-btn-secondary') + '" onclick="EventFastTrack.subscribe(\'' + plan.id + '\', \'' + billingCycle + '\')">Pilih Paket (' + (billingCycle === '1tahun' ? '1 Tahun' : '1 Bulan') + ')</button>';
              })(),

              // HANYA ADMIN YANG DAPAT MELIHAT TOMBOL EDIT HARGA PER KARTU
              (isSuperAdmin ? (
                '<button class="btn-secondary" style="width:100%; margin-top:10px; padding:7px 12px; font-size:0.78rem; border-color:rgba(168,85,247,0.4); color:#c084fc" onclick="EventHub.openEditMembershipModal(\'' + plan.id + '\')">✏️ Edit Harga & Fitur</button>'
              ) : ''),

              '<div class="shadcn-price-section">',
                '<div class="shadcn-price-val">' + formatRp((billingCycle === '1tahun') ? (plan.priceYearly || plan.price * 10) : plan.price) + '<span class="shadcn-price-unit">' + ((billingCycle === '1tahun') ? '/tahun' : '/bulan') + '</span></div>',
                '<div class="shadcn-price-sub">' + ((billingCycle === '1tahun') ? '(setara ' + formatRp(Math.round((plan.priceYearly || plan.price * 10) / 12)) + '/bulan • Hemat 2 bulan)' : '(ditagih setiap 1 bulan)') + '</div>',
              '</div>',
            '</div>',
          '</div>'
        );
      });

      html.push('</div>'); // Close shadcn-cards-wrapper

      // Bottom Tagline matching the reference image footer
      html.push(
        '<div class="shadcn-footer-tagline">',
          'Start your 14-day free trial. No credit card required. Akses jalur gate instan aktif seketika.',
        '</div>'
      );

      // FITUR KHUSUS PENYELENGGARA & ADMIN: Melihat siapa saja peserta yang berlangganan VIP
      if (isOrganizer || isSuperAdmin) {
        var subscribers = Store.getSubscribers();
        html.push(
          '<div class="pos-table-card" style="margin-top:48px">',
            '<div style="padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<b style="font-size:1.15rem; color:#ffffff">👑 Daftar Peserta Langganan Fast-Track VIP (' + subscribers.length + ' Peserta)</b><br>',
                '<small style="color:#94a3b8">Daftar akun peserta aktif yang berhak mendapatkan jalur antrean ekspres dan diskon tiket di venue acara</small>',
              '</div>',
              '<span class="user-role-tag ' + (isSuperAdmin ? 'role-superadmin' : 'role-penyelenggara') + '">' +
                (isSuperAdmin ? 'Akses: Super Administrator' : 'Akses: Penyelenggara Acara') +
              '</span>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>Nama Peserta</th>',
                  '<th>WhatsApp</th>',
                  '<th>Paket VIP</th>',
                  '<th>Durasi & Masa Berlaku</th>',
                  '<th>Diskon Tiket</th>',
                  '<th>Hak Akses Gate</th>',
                  '<th>Status Langganan</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (subscribers.length === 0) {
          html.push(
            '<tr>',
              '<td colspan="7" style="text-align:center; padding:36px; color:#64748b">',
                'Belum ada akun peserta yang berlangganan Fast-Track VIP saat ini.',
              '</td>',
            '</tr>'
          );
        } else {
          subscribers.forEach(function(sub) {
            var s = sub.subscription;
            var daysRemaining = Store.getSubscriptionDaysRemaining ? Store.getSubscriptionDaysRemaining(s.expiresAt) : 0;
            var isExpired = s.isExpired || !s.active;
            html.push(
              '<tr>',
                '<td><b style="color:#ffffff">' + sub.name + '</b></td>',
                '<td><code>' + sub.email + '</code></td>',
                '<td>' + sub.phone + '</td>',
                '<td><span class="brand-vip-badge badge-' + s.planId + '">' + s.badgeText + '</span> ' + s.planName + '</td>',
                '<td><span class="duration-badge badge-' + (s.durationKey || '1bulan') + '">' + (s.duration || '1 Bulan') + '</span><br><small style="color:#94a3b8">' + (s.startedAt || '-') + ' s/d ' + (s.expiresAt || '-') + '</small></td>',
                '<td><b style="color:#10b981">' + (s.discountPercent || 10) + '% OFF</b></td>',
                '<td><span style="color:#fbbf24; font-weight:700">⚡ Jalur Prioritas Ekspres</span></td>',
                '<td>' + (!isExpired ? '<span style="color:#10b981; font-weight:700">✓ Aktif (Sisa ' + daysRemaining + ' hari)</span>' : '<span style="color:#f43f5e; font-weight:700">⏳ Kedaluwarsa</span>') + '</td>',
              '</tr>'
            );
          });
        }

        html.push(
              '</tbody>',
            '</table>',
          '</div>'
        );
      }

      html.push('</div>'); // Close shadcn-pricing-container
      return html.join('');
    },

    setBillingCycle: function(cycle) {
      currentBillingCycle = (cycle === '1tahun') ? '1tahun' : '1bulan';
      if (Sound) Sound.playClick();
      EventHub.renderApp();
    },

    getBillingCycle: function() {
      return currentBillingCycle;
    },

    subscribe: function(planId, duration) {
      duration = duration || currentBillingCycle || '1bulan';
      var user = Store.getCurrentUser();
      if (!user) {
        Router.showToast('Silakan masuk terlebih dahulu untuk mengaktifkan paket VIP Anda.', 'warning');
        EventHub.openAuthModal('login', 'Masuk atau daftar untuk mengaktifkan membership Fast-Track VIP.');
        return;
      }

      try {
        var sub = Store.subscribePlan(planId, user, duration);
        if (Sound) Sound.playFanfare();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Selamat! Anda resmi mengaktifkan ' + sub.planName + ' durasi ' + sub.duration + '. Berlaku hingga ' + sub.expiresAt + '!', 'success', 5000);
        EventHub.renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    }
  };

  window.EventFastTrack = FastTrackModule;
})(window);
