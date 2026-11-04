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
              '<div style="display:flex; align-items:center; gap:8px">',
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
            '<h3 style="font-size:1.05rem; font-weight:800; margin-bottom:12px; color:#ffffff">Check-in & Tiket Terakhir</h3>',
            '<div class="pos-table-card">',
              '<table class="pos-table">',
                '<thead>',
                  '<tr>',
                    '<th>Waktu</th>',
                    '<th>Kode Tiket</th>',
                    '<th>Peserta</th>',
                    '<th>Metode Bayar</th>',
                    '<th style="text-align:right">Nominal</th>',
                    '<th>Status Check-In</th>',
                  '</tr>',
                '</thead>',
                '<tbody>'
        );

        if (validTickets.length === 0) {
          html.push('<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b">Belum ada transaksi tiket.</td></tr>');
        } else {
          validTickets.slice(0, 6).forEach(function(t) {
            html.push(
              '<tr>',
                '<td><small style="color:#64748b">' + (t.createdAt || 'Hari Ini') + '</small></td>',
                '<td><code style="font-family:var(--font-mono); font-weight:700; color:#38bdf8">' + t.code + '</code></td>',
                '<td><b>' + t.buyerName + '</b><br><small style="color:#64748b">' + t.buyerEmail + '</small></td>',
                '<td>' + t.paymentMethod + '</td>',
                '<td style="text-align:right"><b>' + formatRp(t.price) + '</b></td>',
                '<td>' + (t.status === 'used' ? '<span style="color:#10b981; font-weight:700">✓ Sudah Masuk</span>' : '<span style="color:#64748b">○ Belum Check-in</span>') + '</td>',
              '</tr>'
            );
          });
        }

        html.push(
                '</tbody>',
              '</table>',
              '<div class="pos-table-footer">',
                '<span class="pos-total-label">TOTAL TIKET TERBIT:</span>',
                '<span class="pos-total-val" style="color:#10b981">' + validTickets.length + ' Tiket</span>',
              '</div>',
            '</div>',
          '</div>'
        );
      } else if (currentActiveTab === 'history') {
        // Tab 2: Gate Check-in Roster
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08)">',
              '<div><b>Daftar Kehadiran Gate Masuk</b><br><small style="color:#64748b">Seluruh tiket yang telah berhasil diverifikasi</small></div>',
              '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem" onclick="EventHub.exportAttendeeCSV(\'' + currentEvent.id + '\')">📄 Ekspor CSV</button>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>Waktu Check-in</th>',
                  '<th>Kode Tiket</th>',
                  '<th>Nama Peserta</th>',
                  '<th>Kategori Tiket</th>',
                  '<th>Gate Scanner</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (checkedInTickets.length === 0) {
          html.push('<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b">Belum ada peserta yang check-in pada gate masuk.</td></tr>');
        } else {
          checkedInTickets.forEach(function(t) {
            html.push(
              '<tr>',
                '<td><span style="color:#10b981; font-weight:700">' + (t.usedAt || 'Hari Ini') + '</span></td>',
                '<td><code>' + t.code + '</code></td>',
                '<td><b>' + t.buyerName + '</b><br><small style="color:#64748b">' + t.buyerPhone + '</small></td>',
                '<td>' + t.tierName + '</td>',
                '<td><span style="color:#94a3b8">Gate #1</span></td>',
              '</tr>'
            );
          });
        }

        html.push(
              '</tbody>',
            '</table>',
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
    }
  };

  window.EventOrganizer = OrganizerModule;
})(window);
