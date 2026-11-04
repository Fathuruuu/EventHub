/**
 * EventHub Pro - Checkout & Payment Simulation Module
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Confetti = window.EventConfetti;
  var QR = window.EventQR;
  var App = window.EventApp;
  var Router = window.EventRouter;
  var formatRp = Router.formatRp;
  var Icons = Router.Icons;

  var CheckoutModule = {
    renderCheckoutView: function() {
      var ev = Store.getEventById(App.checkoutEventId);
      if (!ev) {
        return '<div class="card-panel">Event tidak ditemukan. <button class="btn-primary" onclick="EventHub.go(\'home\')">Kembali</button></div>';
      }

      var selectedTier = ev.tiers.find(function(t){ return t.id === App.checkoutTierId; }) || ev.tiers[0];
      var subtotal = selectedTier.price * App.checkoutQty;
      var discount = App.checkoutVoucherDiscount || 0;
      var taxableAmount = Math.max(0, subtotal - discount);
      var fee = Math.round(taxableAmount * 0.05);
      var finalTotal = taxableAmount + fee;
      var user = Store.getCurrentUser();

      var html = [
        '<div class="view-animated" style="max-width:820px; margin:0 auto">',
          '<div style="margin-bottom:20px">',
            '<button class="btn-secondary" onclick="EventHub.go(\'detail\', \'' + ev.id + '\')">← Kembali ke Detail Event</button>',
          '</div>',

          '<div class="card-panel">',
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-glass)">',
              '<div>',
                '<h2 style="font-size:1.4rem; font-weight:800">Pembayaran Tiket Event</h2>',
                '<p style="color:var(--text-muted); font-size:0.88rem">' + ev.title + ' • ' + selectedTier.name + ' (' + App.checkoutQty + ' Tiket)</p>',
              '</div>',
              '<div style="text-align:right">',
                '<div style="font-size:0.75rem; color:var(--text-dim)">Total Tagihan</div>',
                '<div style="font-size:1.4rem; font-weight:800; color:#38bdf8">' + formatRp(finalTotal) + '</div>',
              '</div>',
            '</div>'
      ];

      if (App.checkoutStep === 1) {
        html.push(
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px">',
            '<div>',
              '<h3 style="font-size:1.05rem; font-weight:700; margin-bottom:14px">1. Data Pemesan Tiket</h3>',
              '<div class="form-group">',
                '<label class="form-label">Nama Lengkap</label>',
                '<input class="form-control" id="buyer-name" value="' + (user ? user.name : '') + '" placeholder="Sesuai KTP/Identitas">',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Email Penerima Tiket</label>',
                '<input class="form-control" id="buyer-email" type="email" value="' + (user ? user.email : '') + '" readonly style="opacity:0.8">',
              '</div>',
              '<div class="form-group">',
                '<label class="form-label">Nomor WhatsApp / HP</label>',
                '<input class="form-control" id="buyer-phone" type="tel" value="' + (user && user.phone ? user.phone : '081234567890') + '" placeholder="08xxxxxxxxxx">',
              '</div>',

              '<div style="margin-top:20px; padding:16px; background:var(--bg-surface-elevated); border-radius:var(--radius-md)">',
                '<label class="form-label">Kupon / Voucher Diskon</label>',
                '<div style="display:flex; gap:8px">',
                  '<input class="form-control" id="voucher-input" placeholder="Contoh: HEMAT10" value="' + (App.checkoutVoucherCode || '') + '" style="text-transform:uppercase">',
                  '<button class="btn-secondary" onclick="EventHub.applyVoucher()">Gunakan</button>',
                '</div>',
                discount > 0 ? '<div style="color:#10b981; font-size:0.8rem; margin-top:6px; font-weight:700">✓ Kupon diskon aktif: -' + formatRp(discount) + '</div>' : '',
              '</div>',
            '</div>',

            '<div>',
              '<h3 style="font-size:1.05rem; font-weight:700; margin-bottom:14px">2. Pilih Metode Pembayaran</h3>',
              '<div style="display:flex; flex-direction:column; gap:10px">'
        );

        var methods = [
          { id: 'QRIS', name: 'QRIS (Semua E-Wallet & Mobile Banking)', desc: 'BCA, Mandiri, GoPay, OVO, Dana, ShopeePay' },
          { id: 'BCA Virtual Account', name: 'BCA Virtual Account', desc: 'Verifikasi instan otomatis 24 jam' },
          { id: 'Mandiri Virtual Account', name: 'Mandiri Virtual Account', desc: 'Transfer melalui Livin\' by Mandiri atau ATM' },
          { id: 'GoPay', name: 'GoPay / GoPay Coins', desc: 'Bayar via aplikasi Gojek' }
        ];

        methods.forEach(function(m) {
          var isSel = App.checkoutPaymentMethod === m.id;
          html.push(
            '<div style="padding:14px; border-radius:var(--radius-md); border:1px solid ' + (isSel ? 'var(--primary)' : 'var(--border-glass)') + '; background:' + (isSel ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface-elevated)') + '; cursor:pointer; transition:all var(--transition-fast)" onclick="EventHub.setPaymentMethod(\'' + m.id + '\')">',
              '<div style="display:flex; justify-content:space-between; align-items:center">',
                '<b>' + m.name + '</b>',
                isSel ? '<span style="color:#6366f1">●</span>' : '<span style="color:var(--text-dim)">○</span>',
              '</div>',
              '<div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px">' + m.desc + '</div>',
            '</div>'
          );
        });

        html.push(
              '</div>',

              '<div style="margin-top:24px">',
                '<button class="btn-primary" onclick="EventHub.proceedToPaymentGateway()">',
                  'Bayar Sekarang ' + formatRp(finalTotal) + ' →',
                '</button>',
              '</div>',
            '</div>',
          '</div>'
        );
      } else if (App.checkoutStep === 2) {
        html.push(
          '<div style="text-align:center; padding:20px 0">',
            '<div style="display:inline-block; padding:6px 14px; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:var(--radius-full); color:#fbbf24; font-size:0.82rem; font-weight:700; margin-bottom:16px">',
              '⏳ MENUNGGU PEMBAYARAN: Sisa Waktu 14:48',
            '</div>',
            '<h3 style="font-size:1.35rem; font-weight:800; margin-bottom:6px">Silakan Selesaikan Pembayaran</h3>',
            '<p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:24px">Metode: <b>' + App.checkoutPaymentMethod + '</b></p>'
        );

        if (App.checkoutPaymentMethod.indexOf('QRIS') >= 0) {
          var qrisPayload = 'QRIS-' + ev.id + '-PAY' + finalTotal;
          html.push(
            '<div class="qris-pulse-ring" style="margin-bottom:20px; display:inline-block; background:#ffffff; padding:18px 20px; border-radius:20px; box-shadow:0 12px 35px rgba(0,0,0,0.5); min-width:260px">',
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e2e8f0">',
                '<span style="font-weight:900; font-size:1.15rem; color:#dc2626; letter-spacing:1px">QRIS</span>',
                '<span style="font-size:0.72rem; color:#64748b; font-weight:700">PEMBAYARAN NASIONAL</span>',
              '</div>',
              '<div style="width:200px; height:200px; margin:0 auto; display:flex; align-items:center; justify-content:center; background:#ffffff">',
                QR.generateSvg(qrisPayload, { cellSize: 6, margin: 1 }),
              '</div>',
              '<div style="margin-top:10px; padding-top:8px; border-top:1px dashed #cbd5e1; text-align:center">',
                '<div style="font-size:0.82rem; font-weight:800; color:#111827; max-width:200px; margin:0 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">' + ev.title + '</div>',
                '<div style="font-size:0.75rem; color:#64748b; font-weight:700">NMID: ID10200234567 • ' + formatRp(finalTotal) + '</div>',
              '</div>',
            '</div>',
            '<p style="color:var(--text-muted); font-size:0.85rem; max-width:420px; margin:0 auto 24px">Buka aplikasi mobile banking atau e-wallet Anda (BCA, Mandiri, GoPay, OVO, Dana, ShopeePay), lalu scan barcode QR di atas.</p>'
          );
        } else {
          var vaNumber = '88019' + Math.floor(10000000 + Math.random() * 90000000);
          html.push(
            '<div style="background:var(--bg-surface-elevated); max-width:440px; margin:0 auto 24px; padding:24px; border-radius:var(--radius-lg); border:1px solid var(--border-glass)">',
              '<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px">Nomor Virtual Account:</div>',
              '<div style="font-family:var(--font-mono); font-size:1.6rem; font-weight:800; letter-spacing:1px; color:#38bdf8; margin-bottom:12px">' + vaNumber + '</div>',
              '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem" onclick="navigator.clipboard.writeText(\'' + vaNumber + '\'); EventHub.showToast(\'Nomor VA disalin!\', \'success\')">Salin Nomor VA</button>',
            '</div>'
          );
        }

        html.push(
            '<div style="max-width:420px; margin:0 auto">',
              '<button class="btn-primary" onclick="EventHub.completePaymentSimulation()">',
                '✓ Simulasikan Pembayaran Berhasil',
              '</button>',
              '<button class="btn-secondary" style="margin-top:10px; width:100%" onclick="EventApp.checkoutStep = 1; EventHub.renderApp()">',
                'Ganti Metode Pembayaran',
              '</button>',
            '</div>',
          '</div>'
        );
      } else if (App.checkoutStep === 3) {
        html.push(
          '<div style="text-align:center; padding:30px 10px">',
            '<div style="width:72px; height:72px; border-radius:50%; background:rgba(16,185,129,0.2); border:2px solid #10b981; color:#10b981; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; font-size:2rem; animation:scaleSpring 0.4s ease">',
              '✓',
            '</div>',
            '<h2 style="font-size:1.8rem; font-weight:800; margin-bottom:8px">Pembayaran Berhasil!</h2>',
            '<p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px">Terima kasih. Tiket digital Anda telah berhasil diterbitkan dan siap digunakan.</p>',

            '<div style="background:var(--bg-surface-elevated); max-width:480px; margin:0 auto 28px; padding:20px; border-radius:var(--radius-lg); text-align:left; border:1px solid var(--border-glass)">',
              '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                '<span style="color:var(--text-muted)">Acara</span>',
                '<b>' + ev.title + '</b>',
              '</div>',
              '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                '<span style="color:var(--text-muted)">Kategori</span>',
                '<b>' + selectedTier.name + '</b>',
              '</div>',
              '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                '<span style="color:var(--text-muted)">Jumlah</span>',
                '<b>' + App.checkoutQty + ' Tiket</b>',
              '</div>',
              '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                '<span style="color:var(--text-muted)">Metode Bayar</span>',
                '<b>' + App.checkoutPaymentMethod + '</b>',
              '</div>',
              '<div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px dashed var(--border-glass); font-size:1.05rem">',
                '<span>Total Bayar</span>',
                '<b style="color:#10b981">' + formatRp(finalTotal) + '</b>',
              '</div>',
            '</div>',
            '<div style="background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.3); border-radius:var(--radius-lg); padding:20px; max-width:480px; margin:0 auto 24px; text-align:center">',
              '<div style="font-size:1.8rem; margin-bottom:4px">⭐</div>',
              '<b style="color:#ffffff; font-size:1.05rem">Evaluasi Pembelian & Layanan Acara</b>',
              '<p style="color:var(--text-muted); font-size:0.82rem; margin:6px 0 14px">Bantu evaluasi penyelenggara dan layanan pemesanan tiket ini (Hanya dapat dilihat oleh tim Admin).</p>',
              '<button class="btn-primary" style="background:#10b981; padding:10px" onclick="EventHub.openFeedbackModal(\'' + ev.id + '\')">',
                '⭐ Beri Feedback Sekarang',
              '</button>',
            '</div>',

            '<div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap">',
              '<button class="btn-primary" style="width:auto; padding:12px 28px" onclick="EventHub.go(\'tickets\')">',
                Icons.ticket, ' Lihat Tiket Saya',
              '</button>',
              '<button class="btn-secondary" onclick="EventHub.go(\'home\')">',
                'Kembali ke Beranda',
              '</button>',
            '</div>',
          '</div>'
        );
      }

      html.push(
          '</div>',
        '</div>'
      );

      return html.join('');
    },

    applyVoucher: function() {
      var input = document.getElementById('voucher-input');
      var code = (input ? input.value : '').trim().toUpperCase();
      var vouchers = Store.getVouchers();
      var v = vouchers.find(function(x){ return x.code === code; });

      if (!v) {
        if (Sound) Sound.playError();
        Router.showToast('Kode voucher tidak ditemukan.', 'error');
        return;
      }

      var ev = Store.getEventById(App.checkoutEventId);
      var tier = ev.tiers.find(function(t){ return t.id === App.checkoutTierId; });
      var subtotal = tier.price * App.checkoutQty;

      if (v.minPurchase && subtotal < v.minPurchase) {
        Router.showToast('Minimal pembelian ' + formatRp(v.minPurchase) + ' untuk voucher ini.', 'warning');
        return;
      }

      var disc = Math.round(subtotal * (v.discountPercent / 100));
      if (v.maxDiscount && disc > v.maxDiscount) disc = v.maxDiscount;

      App.checkoutVoucherCode = code;
      App.checkoutVoucherDiscount = disc;
      if (Sound) Sound.playSuccess();
      Router.showToast('Voucher hemat ' + v.discountPercent + '% berhasil diterapkan!', 'success');
      EventHub.renderApp();
    },

    proceedToPaymentGateway: function() {
      if (Sound) Sound.playClick();
      App.checkoutStep = 2;
      EventHub.renderApp();
    },

    completePaymentSimulation: function() {
      var user = Store.getCurrentUser();
      var ev = Store.getEventById(App.checkoutEventId);
      var tier = ev.tiers.find(function(t){ return t.id === App.checkoutTierId; });

      try {
        Store.purchaseTickets({
          eventId: ev.id,
          tierId: tier.id,
          quantity: App.checkoutQty,
          paymentMethod: App.checkoutPaymentMethod,
          voucherCode: App.checkoutVoucherCode
        }, user);

        if (Sound) Sound.playFanfare();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Pembayaran berhasil! ' + App.checkoutQty + ' tiket digital diterbitkan.', 'success');
        App.checkoutStep = 3;
        EventHub.renderApp();

        // REQUIREMENT: Setiap selesai pembelian tiket langsung diarahkan ke feedbacknya!
        setTimeout(function() {
          EventHub.openFeedbackModal(ev.id);
        }, 750);
      } catch (err) {
      }
    }
  };

  window.EventCheckout = CheckoutModule;
})(window);
