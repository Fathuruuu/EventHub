/**
 * EventHub Pro - Organizer POS Kasir & Management Desk
 * Modeled after the HIMS / Billing enterprise POS dashboard layout
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Confetti = window.EventConfetti;
  var App = window.EventApp;
  var Router = window.EventRouter;
  var formatRp = Router.formatRp;
  var Icons = Router.Icons;

  var currentActiveTab = 'charges'; // 'charges' | 'history' | 'refunds'

  function parseDateTime(str) {
    if (!str) {
      var d = new Date();
      return {
        date: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(),
        time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' WIB'
      };
    }
    var parts = String(str).trim().split(' ');
    var datePart = parts[0] || '';
    var timePart = parts.slice(1).join(' ') || '12:00 WIB';
    if (datePart.indexOf('-') > 0) {
      var p = datePart.split('-');
      if (p.length === 3) datePart = p[2] + '/' + p[1] + '/' + p[0];
    }
    return { date: datePart, time: timePart };
  }

  var OrganizerModule = {
    setActiveTab: function(tab) {
      if (Sound) Sound.playClick();
      currentActiveTab = tab;
      EventHub.renderApp();
    },

    renderOrganizerView: function() {
      var user = Store.getCurrentUser();
      if (!user || (user.role !== 'penyelenggara' && user.role !== 'superadmin')) {
        return '<div class="card-panel">Akses ditolak: Hanya akun penyelenggara yang dapat membuka halaman ini.</div>';
      }

      // STRICT SCOPING: Only get events created by this organizer!
      var myEvents = Store.getOrganizerEvents(user.email);

      if (myEvents.length === 0) {
        return [
          '<div class="view-animated">',
            '<div class="card-panel" style="text-align:center; padding:60px 20px">',
              '<div style="font-size:3rem; margin-bottom:12px">🎪</div>',
              '<h2 style="font-size:1.4rem; font-weight:800; margin-bottom:8px">Anda Belum Memiliki Event</h2>',
              '<p style="color:var(--text-muted); margin-bottom:24px">Mulai buat dan publikasikan event pertama Anda sekarang!</p>',
              '<button class="btn-primary" style="width:auto; display:inline-flex" onclick="EventHub.openCreateEventModal()">',
                Icons.plus, ' Buat Event Baru Sekarang',
              '</button>',
            '</div>',
          '</div>'
        ].join('');
      }

      if (!App.activeOrganizerEventId || !myEvents.some(function(e){ return e.id === App.activeOrganizerEventId; })) {
        App.activeOrganizerEventId = myEvents[0].id;
      }

      var currentEvent = myEvents.find(function(e){ return e.id === App.activeOrganizerEventId; }) || myEvents[0];

      var allTickets = Store.getTickets().filter(function(t){ return t.eventId === currentEvent.id; });
      var validTickets = allTickets.filter(function(t){ return t.status !== 'refunded'; });
      var checkedInTickets = validTickets.filter(function(t){ return t.status === 'used'; });
      var grossRevenue = validTickets.reduce(function(a, t){ return a + t.price; }, 0);
      var platformFee = Math.round(grossRevenue * 0.10);
      var netIncome = grossRevenue - platformFee;
      var totalQuota = currentEvent.tiers.reduce(function(a, t){ return a + t.quota; }, 0);
      var checkInPercentage = validTickets.length ? Math.round((checkedInTickets.length / validTickets.length) * 100) : 0;

      var orgRefunds = Store.getOrganizerRefunds(user.email).filter(function(r){ return r.eventId === currentEvent.id; });
      var pendingRefunds = orgRefunds.filter(function(r){ return r.status === 'pending'; });

      var isCamRunning = window.EventScannerService && window.EventScannerService.isRunning();

      var html = [
        '<div class="pos-wrapper view-animated">',
          // Left POS Sidebar
          '<div class="pos-sidebar">',
            '<div class="pos-nav-group">',
              '<div style="font-size:0.7rem; color:#64748b; font-weight:800; text-transform:uppercase; padding:6px 12px; letter-spacing:0.5px">POS Menu Kasir</div>',
              '<button class="pos-nav-item ' + (currentActiveTab === 'charges' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'charges\')">',
                '<span>📊</span> Dashboard Kasir',
              '</button>',
              '<button class="pos-nav-item ' + (currentActiveTab === 'events' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'events\')">',
                '<span>🎪</span> Kelola Semua Acara',
                '<span class="pos-nav-badge" style="background:#8b5cf6">' + myEvents.length + '</span>',
              '</button>',
              '<button class="pos-nav-item ' + (currentActiveTab === 'history' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'history\')">',
                '<span>🎟️</span> Riwayat Gate Check-in',
                checkedInTickets.length ? '<span class="pos-nav-badge" style="background:#10b981">' + checkedInTickets.length + '</span>' : '',
              '</button>',
              '<button class="pos-nav-item ' + (currentActiveTab === 'refunds' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'refunds\')">',
                '<span>🔄</span> Permohonan Refund',
                pendingRefunds.length ? '<span class="pos-nav-badge">' + pendingRefunds.length + '</span>' : '',
              '</button>',
              '<button class="pos-nav-item ' + (currentActiveTab === 'moneyflow' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'moneyflow\')">',
                '<span>📈</span> MoneyFlow Finansial',
              '</button>',
              '<button class="pos-nav-item ' + (currentActiveTab === 'messages' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'messages\')">',
                '<span>💬</span> Pesan Peserta',
                (Store.getOrganizerMessages(user.email).length ? '<span class="pos-nav-badge" style="background:#6366f1">' + Store.getOrganizerMessages(user.email).length + '</span>' : ''),
              '</button>',
              '<button class="pos-nav-item" onclick="EventHub.openAddTierModal(\'' + currentEvent.id + '\')">',
                '<span>🏷️</span> Tambah Kategori Tiket',
              '</button>',
              '<button class="pos-nav-item" onclick="EventHub.openEditEventModal(\'' + currentEvent.id + '\')">',
                '<span>⚙️</span> Edit Detail Acara',
              '</button>',
              '<button class="pos-nav-item" onclick="EventHub.openCreateEventModal()">',
                '<span>➕</span> Buat Event Baru',
              '</button>',
              '<button class="pos-nav-item" style="color:#fb7185; border:1px solid rgba(244,63,94,0.25); background:rgba(244,63,94,0.06); margin-top:6px" onclick="EventHub.confirmDeleteEvent(\'' + currentEvent.id + '\')">',
                '<span>🗑️</span> Hapus Acara Ini',
              '</button>',
            '</div>',

            '<div>',
              '<button class="pos-nav-item" style="color:#fb7185" onclick="EventHub.logout()">',
                '<span>🚪</span> Keluar (Logout)',
              '</button>',
            '</div>',
          '</div>',

          // Main Workspace
          '<div class="pos-workspace">',
            // Breadcrumbs & Header
            '<div class="pos-breadcrumb">',
              '<span>Dashboard</span> <span>›</span> <span>Penyelenggara</span> <span>›</span> <span class="current">Kasir POS & Gate Desk</span>',
            '</div>',

            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px">',
              '<h1 class="pos-page-title" style="margin-bottom:0">POS Desk Kasir & Gate Scanner</h1>',
              '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">',
                '<span style="font-size:0.8rem; color:#64748b; font-weight:700">PILIH EVENT:</span>',
                '<select class="filter-select" style="font-weight:700; padding:8px 14px" onchange="EventHub.switchOrganizerEvent(this.value)">'
      ];

      myEvents.forEach(function(e) {
        html.push(
          '<option value="' + e.id + '" ' + (e.id === currentEvent.id ? 'selected' : '') + '>',
            e.title,
          '</option>'
        );
      });

      html.push(
                '</select>',
                '<button class="btn-secondary" style="padding:7px 12px; font-size:0.78rem" onclick="EventHub.openEditEventModal(\'' + currentEvent.id + '\')" title="Edit Acara Ini">⚙️ Edit</button>',
                '<button class="btn-danger" style="padding:7px 12px; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px" onclick="EventHub.confirmDeleteEvent(\'' + currentEvent.id + '\')" title="Hapus Acara Ini">🗑️ Hapus</button>',
              '</div>',
            '</div>',

            // Event Header Horizontal Card
            '<div class="pos-header-card">',
              '<div class="pos-header-left">',
                '<div class="pos-header-avatar">🎫</div>',
                '<div class="pos-header-meta">',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">ID Event / Kategori</span>',
                    '<span class="pos-meta-val">' + currentEvent.id + ' • ' + currentEvent.category + '</span>',
                    '<small style="color:#94a3b8; font-weight:600">' + currentEvent.title + '</small>',
                  '</div>',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Lokasi & Kota</span>',
                    '<span class="pos-meta-val">' + currentEvent.venue + '</span>',
                    '<small style="color:#94a3b8">' + currentEvent.city + '</small>',
                  '</div>',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Jadwal Acara</span>',
                    '<span class="pos-meta-val">' + currentEvent.date + '</span>',
                    '<small style="color:#94a3b8">' + currentEvent.time + '</small>',
                  '</div>',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Total Tiket Terjual</span>',
                    '<span class="pos-meta-val" style="color:#34d399">' + validTickets.length + ' / ' + totalQuota + ' Tiket</span>',
                    '<small style="color:#94a3b8">Check-in: ' + checkedInTickets.length + ' (' + checkInPercentage + '%)</small>',
                  '</div>',
                '</div>',
              '</div>',

              '<div class="pos-balance-pill">',
                '<div class="pos-balance-label">TOTAL OMSET BERSIH (NET)</div>',
                '<div class="pos-balance-amount">' + formatRp(netIncome) + '</div>',
                '<div style="font-size:0.72rem; color:#64748b">Kotor ' + formatRp(grossRevenue) + ' (Fee 10%)</div>',
              '</div>',
            '</div>',

            // 2-Column POS Layout
            '<div class="pos-grid-layout">',
              // Left/Middle Main Column
              '<div>',
                '<div class="pos-tabs-row">',
                  '<button class="pos-tab-btn ' + (currentActiveTab === 'charges' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'charges\')">Rincian Tiket & Kasir</button>',
                  '<button class="pos-tab-btn ' + (currentActiveTab === 'events' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'events\')">🎪 Kelola Semua Acara (' + myEvents.length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentActiveTab === 'history' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'history\')">Riwayat Check-In Gate (' + checkedInTickets.length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentActiveTab === 'refunds' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'refunds\')">Pengajuan Refund (' + pendingRefunds.length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentActiveTab === 'moneyflow' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'moneyflow\')">📈 MoneyFlow Finansial</button>',
                  '<button class="pos-tab-btn ' + (currentActiveTab === 'messages' ? 'active' : '') + '" onclick="EventOrganizer.setActiveTab(\'messages\')">💬 Pesan Peserta (' + Store.getOrganizerMessages(user.email).length + ')</button>',
                '</div>'
      );

      if (currentActiveTab === 'charges') {
        // Tab 1: Itemized Charges / Tiers Table
        html.push(
          '<div class="pos-table-card">',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>Kategori Tiket</th>',
                  '<th>Fasilitas / Deskripsi</th>',
                  '<th style="text-align:center">Terjual</th>',
                  '<th style="text-align:center">Kuota</th>',
                  '<th style="text-align:right">Harga Satuan</th>',
                  '<th style="text-align:right">Subtotal Omset</th>',
                  '<th style="text-align:center">Aksi</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        currentEvent.tiers.forEach(function(tier) {
          var tierSales = tier.sold * tier.price;
          html.push(
            '<tr>',
              '<td><b style="color:#ffffff">' + tier.name + '</b></td>',
              '<td><span style="color:#94a3b8; font-size:0.8rem">' + tier.description + '</span></td>',
              '<td style="text-align:center"><b style="color:#38bdf8">' + tier.sold + '</b></td>',
              '<td style="text-align:center">' + tier.quota + '</td>',
              '<td style="text-align:right">' + formatRp(tier.price) + '</td>',
              '<td style="text-align:right; font-weight:700; color:#ffffff">' + formatRp(tierSales) + '</td>',
              '<td style="text-align:center">',
                '<button class="btn-secondary" style="padding:4px 8px; font-size:0.75rem" onclick="EventHub.openEditTierModal(\'' + currentEvent.id + '\', \'' + tier.id + '\')">✏️ Ganti Harga</button>',
              '</td>',
            '</tr>'
          );
        });

        html.push(
              '</tbody>',
            '</table>',
            '<div class="pos-table-footer">',
              '<span class="pos-total-label">TOTAL PENDAPATAN KOTOR:</span>',
              '<span class="pos-total-val">' + formatRp(grossRevenue) + '</span>',
            '</div>',
          '</div>',

          // Bottom Check-In / Payment Summary Table
          '<div style="margin-top:24px">',
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px">',
              '<div>',
                '<h3 style="font-size:1.1rem; font-weight:800; margin:0; color:#ffffff">Tabel Laporan Transaksi & Pembelian Tiket</h3>',
                '<small style="color:#64748b">Rekapitulasi nomor urut, tanggal, jam, bruto, fee 10%, dan netto dengan rumus matematis</small>',
              '</div>',
              '<button class="btn-secondary" style="padding:6px 14px; font-size:0.78rem" onclick="EventOrganizer.exportChargesCSV(\'' + currentEvent.id + '\')">📄 Ekspor CSV</button>',
            '</div>',
            '<div class="pos-table-card">',
              '<table class="pos-table" id="pos-charges-table">',
                '<thead>',
                  '<tr>',
                    '<th style="text-align:center; width:45px">No.</th>',
                    '<th>Tanggal</th>',
                    '<th>Jam</th>',
                    '<th>No. Tiket / Ref</th>',
                    '<th>Peserta</th>',
                    '<th>Kategori Tiket</th>',
                    '<th>Metode Bayar</th>',
                    '<th style="text-align:right">Harga Bruto</th>',
                    '<th style="text-align:right">Komisi (10%)</th>',
                    '<th style="text-align:right">Netto (90%)</th>',
                    '<th style="text-align:center">Status Check-In</th>',
                  '</tr>',
                '</thead>',
                '<tbody>'
        );

        var chargesTotalBruto = 0;
        var chargesTotalFee = 0;
        var chargesTotalNet = 0;

        if (validTickets.length === 0) {
          html.push('<tr><td colspan="11" style="text-align:center; padding:32px; color:#64748b">Belum ada transaksi tiket untuk acara ini.</td></tr>');
        } else {
          validTickets.forEach(function(t, idx) {
            var no = idx + 1;
            var dt = parseDateTime(t.createdAt);
            var bruto = Number(t.price) || 0;
            var fee = Math.round(bruto * 0.10);
            var net = bruto - fee;
            chargesTotalBruto += bruto;
            chargesTotalFee += fee;
            chargesTotalNet += net;

            html.push(
              '<tr>',
                '<td style="text-align:center; color:#94a3b8; font-weight:700">' + no + '</td>',
                '<td><span style="color:#ffffff; font-weight:600">' + dt.date + '</span></td>',
                '<td><span style="color:#a5b4fc; font-family:var(--font-mono)">' + dt.time + '</span></td>',
                '<td><code style="font-family:var(--font-mono); font-weight:700; color:#38bdf8">' + t.code + '</code></td>',
                '<td><b>' + (t.buyerName || '-') + '</b><br><small style="color:#64748b">' + (t.buyerEmail || '-') + '</small></td>',
                '<td>' + (t.tierName || 'Tiket') + '</td>',
                '<td><span style="color:#e2e8f0; font-size:0.8rem">' + (t.paymentMethod || 'QRIS') + '</span></td>',
                '<td style="text-align:right; font-weight:700; color:#ffffff">' + formatRp(bruto) + '</td>',
                '<td style="text-align:right; color:#f59e0b; font-size:0.82rem">- ' + formatRp(fee) + '</td>',
                '<td style="text-align:right; font-weight:800; color:#34d399">' + formatRp(net) + '</td>',
                '<td style="text-align:center">' + (t.status === 'used' ? '<span style="color:#10b981; font-weight:700">✓ Sudah Masuk</span>' : '<span style="color:#64748b">○ Belum Check-in</span>') + '</td>',
              '</tr>'
            );
          });
        }

        html.push(
                '</tbody>',
                '<tfoot>',
                  '<tr style="background:rgba(99,102,241,0.1); font-weight:800; border-top:2px solid rgba(99,102,241,0.3)">',
                    '<td colspan="7" style="padding:12px; text-align:right; color:#ffffff">TOTAL REKAPITULASI (Σ):</td>',
                    '<td style="padding:12px; text-align:right; color:#38bdf8">' + formatRp(chargesTotalBruto) + '</td>',
                    '<td style="padding:12px; text-align:right; color:#f59e0b">- ' + formatRp(chargesTotalFee) + '</td>',
                    '<td style="padding:12px; text-align:right; color:#34d399; font-size:0.95rem">' + formatRp(chargesTotalNet) + '</td>',
                    '<td style="padding:12px; text-align:center; color:#a5b4fc">' + validTickets.length + ' Tiket</td>',
                  '</tr>',
                '</tfoot>',
              '</table>',
              '<div style="padding:10px 16px; background:rgba(0,0,0,0.25); border-top:1px solid rgba(255,255,255,0.06); font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px">',
                '<span>📐 <b>Rumus Net Payout:</b> <code>Penerimaan Bersih = Harga Bruto - Komisi Platform (10%) = 90%</code></span>',
                '<span><b>Margin Netto:</b> <code>' + (chargesTotalBruto > 0 ? ((chargesTotalNet / chargesTotalBruto) * 100).toFixed(1) : '90.0') + '%</code></span>',
              '</div>',
            '</div>',
          '</div>'
        );
      } else if (currentActiveTab === 'events') {
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<b style="font-size:1.1rem; color:#ffffff">Daftar & Pengaturan Acara Anda</b><br>',
                '<small style="color:#94a3b8">Kelola semua acara yang Anda buat, ubah informasi, atau hapus acara yang diinginkan</small>',
              '</div>',
              '<button class="btn-primary" style="width:auto; padding:8px 16px; font-size:0.82rem; display:inline-flex; align-items:center; gap:6px" onclick="EventHub.openCreateEventModal()">',
                '<span>➕</span> Buat Acara Baru',
              '</button>',
            '</div>',
            '<div style="overflow-x:auto">',
              '<table class="pos-table">',
                '<thead>',
                  '<tr>',
                    '<th>Acara</th>',
                    '<th>Kategori</th>',
                    '<th>Jadwal & Lokasi</th>',
                    '<th style="text-align:center">Tiket Terjual</th>',
                    '<th style="text-align:right">Omset Bersih</th>',
                    '<th style="text-align:center">Status POS</th>',
                    '<th style="text-align:center">Aksi & Pengaturan</th>',
                  '</tr>',
                '</thead>',
                '<tbody>'
        );

        myEvents.forEach(function(ev) {
          var evTix = Store.getTickets().filter(function(t){ return t.eventId === ev.id && t.status !== 'refunded'; });
          var evTotalQuota = ev.tiers.reduce(function(a, t){ return a + t.quota; }, 0);
          var evGross = evTix.reduce(function(a, t){ return a + t.price; }, 0);
          var evNet = Math.round(evGross * 0.90);
          var isCurrent = (ev.id === currentEvent.id);

          html.push(
            '<tr style="' + (isCurrent ? 'background:rgba(99,102,241,0.08);' : '') + '">',
              '<td>',
                '<div style="display:flex; align-items:center; gap:12px">',
                  (ev.bannerImg ? '<img src="' + ev.bannerImg + '" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:1px solid var(--border-glass)">' : '<div style="width:48px; height:48px; border-radius:8px; background:linear-gradient(135deg, #6366f1, #8b5cf6); display:flex; align-items:center; justify-content:center; font-size:1.2rem">🎪</div>'),
                  '<div>',
                    '<b style="color:#ffffff; font-size:0.95rem">' + ev.title + '</b><br>',
                    '<small style="color:#64748b">ID: ' + ev.id + '</small>',
                  '</div>',
                '</div>',
              '</td>',
              '<td><span class="category-pill" style="font-size:0.75rem; padding:4px 10px">' + ev.category + '</span></td>',
              '<td>',
                '<div><b>' + ev.date + '</b></div>',
                '<small style="color:#94a3b8">' + ev.venue + ', ' + ev.city + '</small>',
              '</td>',
              '<td style="text-align:center">',
                '<b style="color:#38bdf8">' + evTix.length + '</b> / ' + evTotalQuota + ' Tiket',
              '</td>',
              '<td style="text-align:right; font-weight:700; color:#34d399">',
                formatRp(evNet),
              '</td>',
              '<td style="text-align:center">',
                (isCurrent ? '<span style="color:#10b981; font-weight:700; font-size:0.78rem; background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.3); padding:4px 8px; border-radius:6px">⭐ Aktif di POS</span>' : '<button class="btn-secondary" style="padding:4px 10px; font-size:0.75rem" onclick="App.activeOrganizerEventId=\'' + ev.id + '\'; EventOrganizer.setActiveTab(\'charges\');">Pilih Event</button>'),
              '</td>',
              '<td style="text-align:center">',
                '<div style="display:inline-flex; gap:6px; align-items:center">',
                  '<button class="btn-secondary" style="padding:5px 10px; font-size:0.78rem" onclick="EventHub.openEditEventModal(\'' + ev.id + '\')" title="Edit Detail Acara">⚙️ Edit</button>',
                  '<button class="btn-danger" style="padding:5px 10px; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px" onclick="EventHub.confirmDeleteEvent(\'' + ev.id + '\')" title="Hapus Acara">🗑️ Hapus</button>',
                '</div>',
              '</td>',
            '</tr>'
          );
        });

        html.push(
                '</tbody>',
              '</table>',
            '</div>',
          '</div>'
        );
      } else if (currentActiveTab === 'history') {
        // Tab 2: Gate Check-in Roster
        var checkInPct = validTickets.length > 0 ? ((checkedInTickets.length / validTickets.length) * 100).toFixed(1) : '0.0';
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); flex-wrap:wrap; gap:10px">',
              '<div>',
                '<b style="font-size:1.05rem">Daftar Kehadiran Gate Masuk (' + checkedInTickets.length + ' Peserta Check-in)</b><br>',
                '<small style="color:#64748b">Rekap nomor urut, tanggal, jam check-in, dan rasio kehadiran</small>',
              '</div>',
              '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem" onclick="EventHub.exportAttendeeCSV(\'' + currentEvent.id + '\')">📄 Ekspor CSV</button>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th style="text-align:center; width:45px">No.</th>',
                  '<th>Tanggal Check-in</th>',
                  '<th>Jam Check-in</th>',
                  '<th>No. Tiket / Ref</th>',
                  '<th>Nama Peserta</th>',
                  '<th>Kontak HP / WA</th>',
                  '<th>Kategori Tiket</th>',
                  '<th>Gate Scanner</th>',
                  '<th style="text-align:center">Status</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (checkedInTickets.length === 0) {
          html.push('<tr><td colspan="9" style="text-align:center; padding:32px; color:#64748b">Belum ada peserta yang check-in pada gate masuk.</td></tr>');
        } else {
          checkedInTickets.forEach(function(t, idx) {
            var no = idx + 1;
            var dt = parseDateTime(t.checkedInAt || t.usedAt);
            html.push(
              '<tr>',
                '<td style="text-align:center; color:#94a3b8; font-weight:700">' + no + '</td>',
                '<td><span style="color:#ffffff; font-weight:600">' + dt.date + '</span></td>',
                '<td><span style="color:#34d399; font-family:var(--font-mono); font-weight:700">' + dt.time + '</span></td>',
                '<td><code style="font-family:var(--font-mono); color:#38bdf8">' + t.code + '</code></td>',
                '<td><b>' + t.buyerName + '</b></td>',
                '<td><span style="color:#94a3b8">' + (t.buyerPhone || '-') + '</span></td>',
                '<td>' + t.tierName + '</td>',
                '<td><span style="color:#a5b4fc">Gate #1 (POS)</span></td>',
                '<td style="text-align:center"><span style="background:rgba(16,185,129,0.15); color:#34d399; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:700">✓ Hadir</span></td>',
              '</tr>'
            );
          });
        }

        html.push(
              '</tbody>',
              '<tfoot>',
                '<tr style="background:rgba(16,185,129,0.08); font-weight:700; border-top:2px solid rgba(16,185,129,0.25)">',
                  '<td colspan="6" style="padding:12px; text-align:right">TOTAL KEHADIRAN GATE MASUK:</td>',
                  '<td colspan="3" style="padding:12px; color:#34d399"><b>' + checkedInTickets.length + ' / ' + validTickets.length + ' Peserta (' + checkInPct + '%)</b></td>',
                '</tr>',
              '</tfoot>',
            '</table>',
            '<div style="padding:10px 16px; background:rgba(0,0,0,0.2); font-size:0.75rem; color:#94a3b8">',
              '📐 <b>Rumus Rasio Kehadiran:</b> <code>Persentase Hadir = (Jumlah Tiket Check-in ÷ Total Tiket Terbit) × 100% = ' + checkInPct + '%</code>',
            '</div>',
          '</div>'
        );
      } else if (currentActiveTab === 'refunds') {
        // Tab 3: Refunds Desk
        html.push(
          '<div class="pos-table-card">',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>ID & Tanggal</th>',
                  '<th>Peserta</th>',
                  '<th>Tiket & Nominal</th>',
                  '<th>Alasan Pembatalan</th>',
                  '<th>Status</th>',
                  '<th style="text-align:right">Aksi Kasir</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (orgRefunds.length === 0) {
          html.push('<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b">Tidak ada permohonan refund untuk acara ini.</td></tr>');
        } else {
          orgRefunds.forEach(function(r) {
            var isPending = r.status === 'pending';
            html.push(
              '<tr>',
                '<td><b>' + r.id + '</b><br><small style="color:#64748b">' + r.createdAt + '</small></td>',
                '<td><b>' + r.buyerName + '</b><br><small style="color:#64748b">' + r.buyerEmail + '</small></td>',
                '<td><b>' + formatRp(r.refundAmount) + '</b><br><small>' + r.tierName + '</small></td>',
                '<td>' + r.reason + (r.reasonDetails ? '<br><small style="color:#64748b">"' + r.reasonDetails + '"</small>' : '') + '</td>',
                '<td>' + (r.status === 'approved' ? '<span style="color:#10b981; font-weight:700">✓ Disetujui</span>' : r.status === 'rejected' ? '<span style="color:#f43f5e; font-weight:700">✖ Ditolak</span>' : '<span style="color:#f59e0b; font-weight:700">⏳ Pending</span>') + '</td>',
                '<td style="text-align:right">'
            );

            if (isPending) {
              html.push(
                '<button class="btn-primary" style="padding:4px 10px; font-size:0.75rem; width:auto; display:inline-block; margin-right:4px; background:#10b981" onclick="EventHub.confirmApproveRefund(\'' + r.id + '\')">✓ Setujui</button>',
                '<button class="btn-danger" style="padding:4px 10px; font-size:0.75rem; width:auto; display:inline-block" onclick="EventHub.openRejectRefundModal(\'' + r.id + '\')">✖ Tolak</button>'
              );
            } else {
              html.push('<span style="font-size:0.75rem; color:#64748b">Selesai</span>');
            }

            html.push(
                '</td>',
              '</tr>'
            );
          });
        }

        html.push(
              '</tbody>',
            '</table>',
          '</div>'
        );
      } else if (currentActiveTab === 'moneyflow') {
        html.push(window.EventMoneyFlow.renderMoneyFlowView('organizer', currentEvent.id));
      } else if (currentActiveTab === 'messages') {
        var orgMsgs = Store.getOrganizerMessages(user.email);
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08)">',
              '<b>Pertanyaan & Pesan dari Peserta Acara</b><br><small style="color:#64748b">Jawab pertanyaan seputar acara langsung ke peserta</small>',
            '</div>'
        );

        if (orgMsgs.length === 0) {
          html.push('<div style="text-align:center; padding:40px; color:#64748b">Belum ada pesan dari peserta untuk acara ini.</div>');
        } else {
          html.push('<div style="padding:16px; display:flex; flex-direction:column; gap:16px">');
          orgMsgs.forEach(function(m) {
            html.push(
              '<div style="background:var(--bg-surface-elevated); padding:16px; border-radius:12px; border:1px solid var(--border-glass)">',
                '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                  '<div><b>' + m.subject + '</b><br><small style="color:#38bdf8">Dari: ' + m.senderName + ' (' + m.senderEmail + ')</small></div>',
                  '<span style="font-size:0.75rem; color:#64748b">' + m.createdAt + '</span>',
                '</div>',
                '<div style="background:rgba(255,255,255,0.04); padding:12px; border-radius:8px; font-size:0.85rem; margin-bottom:12px">' +
                  m.thread.map(function(t){ return '<div><b>' + t.senderName + ':</b> ' + t.text + ' <small style="color:#64748b">(' + t.time + ')</small></div>'; }).join('<hr style="border:none; border-top:1px dashed rgba(255,255,255,0.06); margin:6px 0">') +
                '</div>',
                '<div style="display:flex; gap:8px">',
                  '<input class="form-control" id="org-reply-' + m.id + '" placeholder="Ketik balasan Anda..." style="padding:8px 12px; font-size:0.85rem" onkeydown="if(event.key===\'Enter\') EventHub.submitOrganizerReply(\'' + m.id + '\')">',
                  '<button class="btn-primary" style="width:auto; padding:8px 16px; font-size:0.8rem; background:#10b981" onclick="EventHub.submitOrganizerReply(\'' + m.id + '\')">Kirim Balasan</button>',
                '</div>',
              '</div>'
            );
          });
          html.push('</div>');
        }
        html.push('</div>');
      }

      html.push('</div>'); // Close left/middle column

      // RIGHT COLUMN: QUICK POS DESK (Overview + Add Tier + Camera Scanner + Tools)
      html.push(
        '<div>',
          // 1. BILLING OVERVIEW CARD
          '<div class="pos-side-card">',
            '<div class="pos-side-header-blue">OVERVIEW PENJUALAN TIKET</div>',
            '<div class="pos-side-body">',
              '<div class="pos-summary-row">',
                '<span style="color:#94a3b8">Total Tiket Terjual:</span>',
                '<b>' + validTickets.length + ' / ' + totalQuota + ' Tiket</b>',
              '</div>',
              '<div class="pos-summary-row">',
                '<span style="color:#94a3b8">Total Pendapatan Kotor:</span>',
                '<b style="color:#38bdf8">' + formatRp(grossRevenue) + '</b>',
              '</div>',
              '<div class="pos-summary-row">',
                '<span style="color:#94a3b8">Komisi EventHub (10%):</span>',
                '<span style="color:#fb7185">- ' + formatRp(platformFee) + '</span>',
              '</div>',
              '<div class="pos-summary-row total-row">',
                '<span>Payout Bersih:</span>',
                '<span style="color:#10b981">' + formatRp(netIncome) + '</span>',
              '</div>',
            '</div>',
          '</div>',

          // 2. QUICK ENTRY: TAMBAH KATEGORI TIKET / GANTI HARGA
          '<div class="pos-side-card">',
            '<div class="pos-side-header-dark">TAMBAH KATEGORI TIKET CEPAT</div>',
            '<div class="pos-side-body">',
              '<div class="form-group" style="margin-bottom:10px">',
                '<label class="form-label" style="font-size:0.78rem">Nama Kategori Tiket</label>',
                '<input class="form-control" id="pos-tier-name" placeholder="Contoh: VIP Pass" style="padding:8px 12px; font-size:0.85rem">',
              '</div>',
              '<div class="form-group" style="margin-bottom:10px">',
                '<label class="form-label" style="font-size:0.78rem">Fasilitas / Deskripsi</label>',
                '<input class="form-control" id="pos-tier-desc" placeholder="Akses baris depan & minuman" style="padding:8px 12px; font-size:0.85rem">',
              '</div>',
              '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px">',
                '<div>',
                  '<label class="form-label" style="font-size:0.78rem">Harga (Rp)</label>',
                  '<input class="form-control" id="pos-tier-price" type="number" value="100000" style="padding:8px 12px; font-size:0.85rem">',
                '</div>',
                '<div>',
                  '<label class="form-label" style="font-size:0.78rem">Kuota</label>',
                  '<input class="form-control" id="pos-tier-quota" type="number" value="50" style="padding:8px 12px; font-size:0.85rem">',
                '</div>',
              '</div>',
              '<button class="btn-primary" style="padding:10px; font-size:0.85rem; background:#1d4ed8" onclick="EventOrganizer.submitQuickTier(\'' + currentEvent.id + '\')">',
                '+ Tambah Kategori Tiket',
              '</button>',
            '</div>',
          '</div>',

          // 3. SCANNER KAMERA & CHECK-IN KASIR
          '<div class="pos-side-card">',
            '<div class="pos-side-header-dark" style="display:flex; justify-content:space-between; align-items:center">',
              '<span>SCANNER KAMERA & GATE POS</span>',
              '<span class="radar-ping"></span>',
            '</div>',
            '<div class="pos-side-body">',
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px">',
                '<button id="btn-org-cam" class="btn-primary" style="padding:8px 14px; font-size:0.8rem; width:auto; background:' + (isCamRunning ? '#f43f5e' : '#1d4ed8') + '" onclick="EventHub.toggleOrganizerCamera()">',
                  isCamRunning ? '⏹ Tutup Kamera' : '📷 Buka Kamera',
                '</button>',
                '<select id="org-cam-select" class="filter-select" style="font-size:0.75rem; padding:6px 10px; display:' + (isCamRunning ? 'inline-block' : 'none') + '" onchange="EventHub.switchOrganizerCamera(this.value)">',
                  '<option value="">Pilih Kamera...</option>',
                '</select>',
              '</div>',

              '<div class="scanner-viewport" style="height:220px; margin-bottom:14px">',
                '<video id="organizer-video" class="scanner-video" playsinline autoplay muted style="width:100%; height:100%; object-fit:cover; display:' + (isCamRunning ? 'block' : 'none') + '"></video>',
                '<div id="organizer-cam-placeholder" style="position:absolute; inset:0; display:' + (isCamRunning ? 'none' : 'flex') + '; flex-direction:column; align-items:center; justify-content:center; color:#64748b; padding:16px; text-align:center; background:#000000">',
                  '<div style="font-size:2rem; margin-bottom:6px">📷</div>',
                  '<b style="color:#ffffff; font-size:0.85rem">Kamera Kasir Belum Aktif</b>',
                  '<p style="font-size:0.75rem; color:#64748b; margin-top:2px">Klik "Buka Kamera" untuk scan QR otomatis.</p>',
                '</div>',
                // Controls Overlay for Mobile Android & iOS
                '<div class="scanner-controls-overlay" style="display:' + (isCamRunning ? 'flex' : 'none') + '">',
                  '<button type="button" class="scanner-ctrl-btn btn-cam-flip" onclick="EventHub.flipCamera(\'organizer-video\')" title="Balik Kamera Depan / Belakang">',
                    '<span>🔄</span> <span>Flip</span>',
                  '</button>',
                  '<button type="button" class="scanner-ctrl-btn" id="btn-org-torch" onclick="EventHub.toggleTorch(\'btn-org-torch\')" title="Lampu Flash Senter">',
                    '<span>⚡</span> <span>Flash</span>',
                  '</button>',
                '</div>',
                '<div class="scanner-overlay" style="display:' + (isCamRunning ? 'flex' : 'none') + '">',
                  '<div class="scanner-target-box" style="width:160px; height:160px">',
                    '<div class="scanner-laser-bar"></div>',
                  '</div>',
                '</div>',
              '</div>',

              // Manual barcode gun entry
              '<div style="margin-bottom:12px">',
                '<label class="form-label" style="font-size:0.78rem">Scan Gun / Ketik Manual:</label>',
                '<input class="form-control" id="manual-ticket-code" placeholder="EH-JZZ-XXXXXX" style="font-family:var(--font-mono); font-weight:700; padding:8px 12px; font-size:0.85rem; margin-bottom:8px" onkeydown="if(event.key===\'Enter\') EventHub.doScanInput()">',
                '<button class="btn-primary" style="padding:10px; font-size:0.85rem; background:#10b981" onclick="EventHub.doScanInput()">',
                  '✓ Validasi & Check-in Masuk',
                '</button>',
              '</div>',

              // Quick Test Scan Dropdown
              '<div style="background:rgba(255,255,255,0.02); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06)">',
                '<div style="font-size:0.72rem; font-weight:700; color:#38bdf8; margin-bottom:4px">⚡ TES CEPAT:</div>',
                '<div style="display:flex; gap:6px">'
        );

        var sampleTicketsForThisEv = allTickets.slice(0, 4);
        if (sampleTicketsForThisEv.length === 0) {
          html.push('<div style="font-size:0.75rem; color:#64748b">Belum ada tiket terjual.</div>');
        } else {
          html.push('<select class="filter-select" id="sample-ticket-picker" style="flex:1; font-size:0.75rem; padding:6px">');
          sampleTicketsForThisEv.forEach(function(t) {
            html.push(
              '<option value="' + t.code + '">',
                t.code + ' (' + t.buyerName + ')',
              '</option>'
            );
          });
          html.push('</select><button class="btn-secondary" style="padding:6px 10px; font-size:0.75rem" onclick="EventHub.testScanPicker()">Scan</button>');
        }

        html.push(
                '</div>',
              '</div>'
        );

        html.push('<div id="organizer-scan-result-box">');
        if (App.lastScanResult) {
          var res = App.lastScanResult;
          var bannerClass = res.status === 'success' ? 'scan-result-success'
            : res.status === 'warning' ? 'scan-result-warning'
            : 'scan-result-error';

          html.push(
            '<div class="scan-result-card ' + bannerClass + '" style="margin-top:12px; padding:12px 14px; flex-direction:column; gap:8px">',
              '<div style="display:flex; align-items:center; gap:10px">',
                '<div style="font-size:1.4rem">' + (res.status === 'success' ? '✓' : res.status === 'warning' ? '⚠️' : '✖') + '</div>',
                '<div>',
                  '<div style="font-weight:800; font-size:0.85rem">' + res.message + '</div>',
                  res.ticket ? '<div style="font-size:0.75rem; opacity:0.9">' + res.ticket.buyerName + ' (' + res.ticket.tierName + ')</div>' : '',
                '</div>',
              '</div>',
              '<button class="btn-primary" style="padding:6px 14px; font-size:0.78rem; width:100%; margin-top:4px; background:#1d4ed8" onclick="EventHub.resumeScanner()">',
                '🔄 Scan Tiket Berikutnya',
              '</button>',
            '</div>'
          );
        }
        html.push('</div>');

        html.push(
            '</div>',
          '</div>',

          // 4. QUICK TOOLS 4-BUTTON GRID
          '<div class="pos-tools-grid">',
            '<button class="pos-tool-btn" onclick="window.print()">',
              '<span>🖨️</span>',
              '<span>Cetak Struk</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventHub.exportAttendeeCSV(\'' + currentEvent.id + '\')">',
              '<span>📄</span>',
              '<span>Ekspor CSV</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventHub.openAddTierModal(\'' + currentEvent.id + '\')">',
              '<span>🏷️</span>',
              '<span>Ganti Harga</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventOrganizer.setActiveTab(\'refunds\')">',
              '<span>🔄</span>',
              '<span>Refund Desk</span>',
            '</button>',
          '</div>',
        '</div>', // Close right column
        '</div>', // Close pos-grid-layout
        '</div>', // Close pos-workspace
        '</div>'  // Close pos-wrapper
      );

      return html.join('');
    },

    submitQuickTier: function(eventId) {
      var name = (document.getElementById('pos-tier-name').value || '').trim();
      var desc = (document.getElementById('pos-tier-desc').value || '').trim();
      var price = Number(document.getElementById('pos-tier-price').value);
      var quota = Number(document.getElementById('pos-tier-quota').value);
      var user = Store.getCurrentUser();

      if (!name) {
        Router.showToast('Nama kategori tiket tidak boleh kosong.', 'error');
        return;
      }
      if (price < 0 || quota < 1) {
        Router.showToast('Harga dan kuota tidak valid.', 'error');
        return;
      }

      try {
        Store.addEventTier(eventId, { name: name, price: price, quota: quota, description: desc }, user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Kategori tiket "' + name + '" berhasil ditambahkan!', 'success');
        document.getElementById('pos-tier-name').value = '';
        document.getElementById('pos-tier-desc').value = '';
        EventHub.renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },
    exportChargesCSV: function(eventId) {
      var table = document.getElementById('pos-charges-table');
      if (!table) return;
      var rows = table.querySelectorAll('tr');
      var csv = [];
      rows.forEach(function(row) {
        var cols = row.querySelectorAll('th, td');
        var rowData = [];
        cols.forEach(function(col) {
          var val = col.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""').trim();
          rowData.push('"' + val + '"');
        });
        if (rowData.length) csv.push(rowData.join(','));
      });
      var blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Laporan_Transaksi_' + (eventId || 'POS') + '_' + Date.now() + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Router.showToast('Laporan CSV transaksi berhasil diunduh!', 'success');
    },
  };

  window.EventOrganizer = OrganizerModule;
})(window);
