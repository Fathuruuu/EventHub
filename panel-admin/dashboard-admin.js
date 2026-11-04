/**
 * EventHub Pro - Super Admin Module
 * Complete platform-wide management desk with HIMS/Billing POS layout
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

  var currentAdminTab = 'events'; // 'events' | 'refunds' | 'transactions'

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

  var AdminModule = {
    setAdminTab: function(tab) {
      if (Sound) Sound.playClick();
      currentAdminTab = tab;
      EventHub.renderApp();
    },

    renderAdminView: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        return '<div class="card-panel">Akses ditolak: Hanya Super Administrator yang dapat mengakses halaman ini.</div>';
      }

      var allEvents = Store.getEvents();
      var allTickets = Store.getTickets();
      var allUsers = Store.getUsers();
      var validTickets = allTickets.filter(function(t){ return t.status !== 'refunded'; });
      var totalGMV = validTickets.reduce(function(a, t){ return a + t.price; }, 0);
      var platformCommission = Math.round(totalGMV * 0.10);
      var organizerPayout = totalGMV - platformCommission;
      var allRefunds = Store.getRefundRequests();
      var pendingRefunds = allRefunds.filter(function(r){ return r.status === 'pending'; });
      var maint = Store.getMaintenanceMode();

      var isCamRunning = window.EventScannerService && window.EventScannerService.isRunning();

      var html = [
        '<div class="pos-wrapper view-animated">',
          // Left Sidebar
          '<div class="pos-sidebar">',
            '<div class="pos-nav-group">',
              '<div style="font-size:0.7rem; color:#64748b; font-weight:800; text-transform:uppercase; padding:6px 12px; letter-spacing:0.5px">Admin Super Panel</div>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'events' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'events\')">',
                '<span>🎪</span> Seluruh Event Platform',
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'refunds' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'refunds\')">',
                '<span>🔄</span> Global Refund Audit',
                pendingRefunds.length ? '<span class="pos-nav-badge">' + pendingRefunds.length + '</span>' : '',
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'transactions' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'transactions\')">',
                '<span>💳</span> Transaksi Tiket Nasional',
                validTickets.length ? '<span class="pos-nav-badge" style="background:#10b981">' + validTickets.length + '</span>' : '',
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'users' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'users\')">',
                '<span>👥</span> Manajemen Akun (' + allUsers.length + ')',
                (Store.getPendingOrganizers().length ? '<span class="pos-nav-badge" style="background:#f59e0b">' + Store.getPendingOrganizers().length + '</span>' : ''),
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'moneyflow' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'moneyflow\')">',
                '<span>📈</span> MoneyFlow Finansial',
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'activity' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'activity\')">',
                '<span>📡</span> Log Aktivitas Real-Time',
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'feedback' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'feedback\')">',
                '<span>⭐</span> Feedback Website',
                (Store.getWebsiteFeedbacksForAdmin(user).length ? '<span class="pos-nav-badge" style="background:#f59e0b">' + Store.getWebsiteFeedbacksForAdmin(user).length + '</span>' : ''),
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'messages' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'messages\')">',
                '<span>💬</span> Pengawasan Pesan',
                (Store.getAllMessagesForAdmin(user).length ? '<span class="pos-nav-badge" style="background:#6366f1">' + Store.getAllMessagesForAdmin(user).length + '</span>' : ''),
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'subscriptions' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'subscriptions\')">',
                '<span>👑</span> Pelanggan VIP & Paket',
                (Store.getSubscribers().length ? '<span class="pos-nav-badge" style="background:#fbbf24; color:#000">' + Store.getSubscribers().length + '</span>' : ''),
              '</button>',
              '<button class="pos-nav-item ' + (currentAdminTab === 'firewall' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'firewall\')">',
                '<span>🛡️</span> Web Firewall (WAF)',
                '<span class="pos-nav-badge" style="background:#10b981">Shield ON</span>',
              '</button>',
              '<button class="pos-nav-item" onclick="EventAdmin.openMaintenanceModal()" style="' + (maint.active ? 'background:rgba(245,158,11,0.18); color:#fbbf24; font-weight:700' : '') + '">',
                '<span>🚧</span> Mode Pemeliharaan',
                (maint.active ? '<span class="pos-nav-badge" style="background:#ef4444; color:#fff">AKTIF</span>' : '<span class="pos-nav-badge" style="background:#10b981">Live</span>'),
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
            '<div class="pos-breadcrumb">',
              '<span>Dashboard</span> <span>›</span> <span>Super Administrator</span> <span>›</span> <span class="current">Platform Control Desk</span>',
            '</div>',

            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<h1 class="pos-page-title" style="margin-bottom:4px">Platform Control & Audit Desk</h1>',
                '<div style="font-size:0.8rem; color:#64748b">Pusat kendali operasional, status server, dan proteksi platform.</div>',
              '</div>',
              '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">',
                '<button class="btn-secondary" style="padding:7px 14px; font-size:0.8rem; display:inline-flex; align-items:center; gap:8px; border-color:' + (maint.active ? '#f59e0b' : 'rgba(255,255,255,0.15)') + '; background:' + (maint.active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)') + '; color:' + (maint.active ? '#fbbf24' : '#cbd5e1') + '; cursor:pointer; border-radius:8px" onclick="EventAdmin.openMaintenanceModal()" title="Buka pengaturan mode pemeliharaan sistem">',
                  '<span>🚧</span>',
                  '<span>Maintenance: <b style="color:' + (maint.active ? '#f87171' : '#34d399') + '">' + (maint.active ? 'AKTIF (Sistem Dikunci)' : 'NONAKTIF (Live)') + '</b></span>',
                  (maint.active ? '<span class="radar-ping" style="background:#f59e0b; width:8px; height:8px"></span>' : ''),
                '</button>',
                '<span class="user-role-tag role-superadmin" style="padding:6px 14px; font-size:0.8rem">Super Administrator</span>',
              '</div>',
            '</div>',
            (maint.active ? [
              '<div class="view-animated" style="background:linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.12)); border:1px solid rgba(245,158,11,0.45); border-radius:12px; padding:12px 18px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
                '<div style="display:flex; align-items:center; gap:12px">',
                  '<div style="font-size:1.8rem">🚧</div>',
                  '<div>',
                    '<div style="font-weight:800; color:#fbbf24; font-size:0.95rem">PERINGATAN: MODE PEMELIHARAAN SEDANG AKTIF</div>',
                    '<div style="font-size:0.82rem; color:#e2e8f0; margin-top:2px">Sistem dikunci untuk pengunjung umum. Estimasi: <b>' + (maint.estimatedEnd || 'Segera') + '</b>. Super Admin saat ini dalam sesi bypass.</div>',
                  '</div>',
                '</div>',
                '<div style="display:flex; gap:8px">',
                  '<button class="btn-primary" style="padding:7px 14px; font-size:0.8rem; background:#10b981; border:none; width:auto; font-weight:700" onclick="EventAdmin.quickToggleMaintenance(false)">✓ Buka Sistem (Live)</button>',
                  '<button class="btn-secondary" style="padding:7px 12px; font-size:0.8rem" onclick="EventAdmin.openMaintenanceModal()">⚙️ Atur Pesan</button>',
                '</div>',
              '</div>'
            ].join('') : ''),

            // Top Profile Card
            '<div class="pos-header-card">',
              '<div class="pos-header-left">',
                '<div class="pos-header-avatar" style="background:linear-gradient(135deg, #ec4899, #8b5cf6)">⚡</div>',
                '<div class="pos-header-meta">',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Total Acara di Platform</span>',
                    '<span class="pos-meta-val">' + allEvents.length + ' Event Aktif</span>',
                    '<small style="color:#94a3b8">Se-Indonesia</small>',
                  '</div>',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Volume Tiket Terbit</span>',
                    '<span class="pos-meta-val" style="color:#38bdf8">' + allTickets.length + ' Tiket</span>',
                    '<small style="color:#94a3b8">' + validTickets.length + ' Aktif • ' + (allTickets.length - validTickets.length) + ' Direfund</small>',
                  '</div>',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Total Pengguna Terdaftar</span>',
                    '<span class="pos-meta-val">' + allUsers.length + ' User</span>',
                    '<small style="color:#94a3b8">Penyelenggara & Peserta</small>',
                  '</div>',
                  '<div class="pos-meta-col">',
                    '<span class="pos-meta-label">Status Refund Platform</span>',
                    '<span class="pos-meta-val" style="color:' + (pendingRefunds.length ? '#f59e0b' : '#10b981') + '">' + pendingRefunds.length + ' Pending</span>',
                    '<small style="color:#94a3b8">Dari ' + allRefunds.length + ' pengajuan</small>',
                  '</div>',
                '</div>',
              '</div>',

              '<div class="pos-balance-pill" style="background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.3)">',
                '<div class="pos-balance-label" style="color:#34d399">KOMISI EVENTHUB PLATFORM (10%)</div>',
                '<div class="pos-balance-amount" style="color:#34d399">' + formatRp(platformCommission) + '</div>',
                '<div style="font-size:0.72rem; color:#64748b">Dari Total GMV ' + formatRp(totalGMV) + '</div>',
              '</div>',
            '</div>',
            // 2-Column Layout
            '<div class="pos-grid-layout">',
              // Left Column
              '<div>',
                '<div class="pos-tabs-row">',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'events' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'events\')">Seluruh Event (' + allEvents.length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'moneyflow' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'moneyflow\')">📈 MoneyFlow Finansial</button>',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'activity' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'activity\')">📡 Log Aktivitas (' + Store.getActivityLogsForAdmin(user).length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'feedback' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'feedback\')">⭐ Feedback Web (' + Store.getWebsiteFeedbacksForAdmin(user).length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'messages' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'messages\')">💬 Pengawasan Pesan (' + Store.getAllMessagesForAdmin(user).length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'refunds' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'refunds\')">Audit Refund (' + allRefunds.length + ')</button>',
                  '<button class="pos-tab-btn ' + (currentAdminTab === 'users' ? 'active' : '') + '" onclick="EventAdmin.setAdminTab(\'users\')">Kelola Akun (' + allUsers.length + ')' + (Store.getPendingOrganizers().length ? ' <span style="background:#f59e0b; color:white; padding:1px 6px; border-radius:99px; font-size:0.7rem">' + Store.getPendingOrganizers().length + '</span>' : '') + '</button>',
                '</div>'
      ];

      if (currentAdminTab === 'events') {
        html.push(
          '<div class="pos-table-card">',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>ID & Kategori</th>',
                  '<th>Nama Acara</th>',
                  '<th>Penyelenggara</th>',
                  '<th>Lokasi & Tanggal</th>',
                  '<th style="text-align:center">Terjual / Kuota</th>',
                  '<th style="text-align:right">GMV Omset</th>',
                  '<th style="text-align:center">Aksi</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (allEvents.length === 0) {
          html.push('<tr><td colspan="7" style="text-align:center; padding:36px; color:#64748b">Belum ada event terdaftar. Seluruh data demo telah dibersihkan.</td></tr>');
        } else {
          allEvents.forEach(function(e) {
            var evTix = allTickets.filter(function(t){ return t.eventId === e.id && t.status !== 'refunded'; });
            var evRevenue = evTix.reduce(function(a, t){ return a + t.price; }, 0);
            var totalQ = e.tiers.reduce(function(a, t){ return a + t.quota; }, 0);

            html.push(
              '<tr>',
                '<td><code>' + e.id + '</code><br><small style="color:#818cf8">' + e.category + '</small></td>',
                '<td><b style="color:#ffffff">' + e.title + '</b></td>',
                '<td>' + e.organizerName + '<br><small style="color:#64748b">' + e.organizerEmail + '</small></td>',
                '<td>' + e.city + '<br><small style="color:#64748b">' + e.date + '</small></td>',
                '<td style="text-align:center"><b>' + evTix.length + '</b> / ' + totalQ + '</td>',
                '<td style="text-align:right; font-weight:700; color:#38bdf8">' + formatRp(evRevenue) + '</td>',
                '<td style="text-align:center">',
                  '<div style="display:inline-flex; gap:6px; align-items:center">',
                    '<button class="btn-secondary" style="padding:4px 8px; font-size:0.75rem" onclick="EventHub.openEditEventModal(\'' + e.id + '\')">✏️ Edit</button>',
                    '<button class="btn-danger" style="padding:4px 8px; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px" onclick="EventHub.confirmDeleteEvent(\'' + e.id + '\')">🗑️ Hapus</button>',
                  '</div>',
                '</td>',
              '</tr>'
            );
          });
        }

        html.push(
              '</tbody>',
            '</table>',
            '<div class="pos-table-footer">',
              '<span class="pos-total-label">TOTAL GMV PENJUALAN NASIONAL:</span>',
              '<span class="pos-total-val">' + formatRp(totalGMV) + '</span>',
            '</div>',
          '</div>'
        );
      } else if (currentAdminTab === 'refunds') {
        html.push(
          '<div class="pos-table-card">',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>ID & Tanggal</th>',
                  '<th>Acara & Tiket</th>',
                  '<th>Peserta</th>',
                  '<th>Penyelenggara</th>',
                  '<th style="text-align:right">Nominal</th>',
                  '<th>Status</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (allRefunds.length === 0) {
          html.push('<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b">Belum ada data refund di platform.</td></tr>');
        } else {
          allRefunds.forEach(function(r) {
            html.push(
              '<tr>',
                '<td><b>' + r.id + '</b><br><small style="color:#64748b">' + r.createdAt + '</small></td>',
                '<td><b>' + r.eventName + '</b><br><small style="color:#818cf8">' + r.ticketCode + ' (' + r.tierName + ')</small></td>',
                '<td>' + r.buyerName + '<br><small style="color:#64748b">' + r.buyerEmail + '</small></td>',
                '<td><small>' + r.organizerEmail + '</small></td>',
                '<td style="text-align:right"><b>' + formatRp(r.refundAmount) + '</b></td>',
                '<td>' + (r.status === 'approved' ? '<span style="color:#10b981; font-weight:700">✓ Disetujui</span>' : r.status === 'rejected' ? '<span style="color:#f43f5e; font-weight:700">✖ Ditolak</span>' : '<span style="color:#f59e0b; font-weight:700">⏳ Pending</span>') + '</td>',
              '</tr>'
            );
          });
        }

        html.push(
              '</tbody>',
            '</table>',
          '</div>'
        );
      } else if (currentAdminTab === 'transactions') {
        var adminTotalGMV = 0;
        var adminTotalComm = 0;
        var adminTotalPayout = 0;

        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<b style="font-size:1.1rem; color:#ffffff">Laporan Transaksi Penjualan Tiket Nasional</b><br>',
                '<small style="color:#64748b">Rekapitulasi nomor urut, tanggal, jam, komisi platform 10%, dan hak bersih penyelenggara</small>',
              '</div>',
              '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem" onclick="EventAdmin.exportTransactionsCSV()">📄 Ekspor CSV</button>',
            '</div>',
            '<div style="overflow-x:auto">',
              '<table class="pos-table" id="admin-transactions-table">',
                '<thead>',
                  '<tr>',
                    '<th style="text-align:center; width:45px">No.</th>',
                    '<th>Tanggal</th>',
                    '<th>Jam</th>',
                    '<th>No. Tiket / Ref</th>',
                    '<th>Nama Acara & Kategori</th>',
                    '<th>Penyelenggara (EO)</th>',
                    '<th>Peserta / Pembeli</th>',
                    '<th style="text-align:right">Harga Bruto</th>',
                    '<th style="text-align:right">Komisi (10%)</th>',
                    '<th style="text-align:right">Payout EO (90%)</th>',
                    '<th style="text-align:center">Status Masuk</th>',
                  '</tr>',
                '</thead>',
                '<tbody>'
        );

        if (validTickets.length === 0) {
          html.push('<tr><td colspan="11" style="text-align:center; padding:36px; color:#64748b">Belum ada transaksi tiket nasional yang tercatat.</td></tr>');
        } else {
          validTickets.forEach(function(t, idx) {
            var no = idx + 1;
            var dt = parseDateTime(t.createdAt);
            var price = Number(t.price) || 0;
            var comm = Math.round(price * 0.10);
            var payout = price - comm;
            adminTotalGMV += price;
            adminTotalComm += comm;
            adminTotalPayout += payout;

            html.push(
              '<tr>',
                '<td style="text-align:center; color:#94a3b8; font-weight:700">' + no + '</td>',
                '<td><span style="color:#ffffff; font-weight:600">' + dt.date + '</span></td>',
                '<td><span style="color:#a5b4fc; font-family:var(--font-mono)">' + dt.time + '</span></td>',
                '<td><code style="font-family:var(--font-mono); font-weight:700; color:#38bdf8">' + t.code + '</code></td>',
                '<td><b>' + t.eventName + '</b><br><small style="color:#64748b">' + t.tierName + '</small></td>',
                '<td><span style="color:#e2e8f0; font-size:0.8rem">' + (t.organizerEmail || 'Promotor') + '</span></td>',
                '<td><b>' + t.buyerName + '</b><br><small style="color:#64748b">' + t.buyerEmail + '</small></td>',
                '<td style="text-align:right; font-weight:700; color:#ffffff">' + formatRp(price) + '</td>',
                '<td style="text-align:right; color:#34d399; font-weight:600">+ ' + formatRp(comm) + '</td>',
                '<td style="text-align:right; color:#38bdf8; font-weight:700">' + formatRp(payout) + '</td>',
                '<td style="text-align:center">' + (t.status === 'used' ? '<span style="color:#10b981; font-weight:700">✓ Sudah Masuk</span>' : '<span style="color:#64748b">○ Belum Check-in</span>') + '</td>',
              '</tr>'
            );
          });
        }

        html.push(
                '</tbody>',
                '<tfoot>',
                  '<tr style="background:rgba(99,102,241,0.12); font-weight:800; border-top:2px solid rgba(99,102,241,0.3)">',
                    '<td colspan="7" style="padding:14px; text-align:right; color:#ffffff">TOTAL TRANSAKSI NASIONAL (Σ):</td>',
                    '<td style="padding:14px; text-align:right; color:#38bdf8">' + formatRp(adminTotalGMV) + '</td>',
                    '<td style="padding:14px; text-align:right; color:#34d399">+ ' + formatRp(adminTotalComm) + '</td>',
                    '<td style="padding:14px; text-align:right; color:#38bdf8">' + formatRp(adminTotalPayout) + '</td>',
                    '<td style="padding:14px; text-align:center; color:#a5b4fc">' + validTickets.length + ' Tiket</td>',
                  '</tr>',
                '</tfoot>',
              '</table>',
            '</div>',
            '<div style="padding:12px 20px; background:rgba(0,0,0,0.25); border-top:1px solid rgba(255,255,255,0.06); font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px">',
              '<span>📐 <b>Rumus Komisi Platform:</b> <code>Pendapatan Platform (10%) = Total GMV Bruto × 0.10</code></span>',
              '<span><b>Rumus Payout Penyelenggara:</b> <code>Hak Bersih EO (90%) = Total GMV Bruto × 0.90</code></span>',
            '</div>',
          '</div>'
        );
      } else if (currentAdminTab === 'users') {
        if (window.EventAdminApproval) {
          var approvalHtml = window.EventAdminApproval.renderApprovalSection();
          if (approvalHtml) html.push(approvalHtml);
        }
        var publicUsers = allUsers.filter(function(u){ return u.role !== 'superadmin'; });
        html.push(
          '<div style="background:rgba(15,23,42,0.7); border:1px solid rgba(99,102,241,0.3); border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; gap:16px">',
            '<div style="font-size:2rem">🛡️</div>',
            '<div>',
              '<b style="color:#ffffff; font-size:0.95rem">Data Master Administrator Diprivasikan (Zero-Knowledge Privacy)</b>',
              '<p style="color:var(--text-muted); font-size:0.82rem; margin:2px 0 0">Data kredensial, kontak, dan identitas Super Administrator diprivasikan secara ketat dan disembunyikan dari tabel pengguna umum demi keamanan infrastruktur.</p>',
            '</div>',
          '</div>',
          '<div class="pos-table-card">',
            '<div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); flex-wrap:wrap; gap:10px">',
              '<div>',
                '<b style="font-size:1.05rem">Daftar Akun Pengguna & Penyelenggara (' + publicUsers.length + ')</b><br>',
                '<small style="color:#64748b">Kelola akun penyelenggara acara dan peserta yang terdaftar di platform</small>',
              '</div>',
              '<button class="btn-primary" style="width:auto; padding:8px 18px; font-size:0.82rem; background:#10b981" onclick="EventHub.openCreateOrganizerModal()">',
                '➕ Tambah Akun Penyelenggara',
              '</button>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>ID Pengguna</th>',
                  '<th>Nama Akun</th>',
                  '<th>Peran (Role)</th>',
                  '<th>Instansi / EO</th>',
                  '<th>Email Akun</th>',
                  '<th>No. WhatsApp</th>',
                  '<th>Terdaftar</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (publicUsers.length === 0) {
          html.push('<tr><td colspan="7" style="text-align:center; padding:36px; color:#64748b">Belum ada akun peserta atau penyelenggara terdaftar. Seluruh akun demo telah dibersihkan.</td></tr>');
        } else {
          publicUsers.forEach(function(u) {
            var roleBadge = u.role === 'penyelenggara' ? '<span class="user-role-tag role-penyelenggara">Penyelenggara</span>'
              : '<span class="user-role-tag role-peserta">Peserta</span>';

            html.push(
              '<tr>',
                '<td><code>' + u.id + '</code></td>',
                '<td><b style="color:#ffffff">' + u.name + '</b></td>',
                '<td>' + roleBadge + '</td>',
                '<td>' + (u.company || '<span style="color:#64748b">-</span>') + '</td>',
                '<td><code>' + u.email + '</code></td>',
                '<td>' + (u.phone || '<span style="color:#64748b">-</span>') + '</td>',
                '<td><small style="color:#64748b">' + (u.createdAt || '-') + '</small></td>',
              '</tr>'
            );
          });
        }
        html.push(
              '</tbody>',
            '</table>',
          '</div>'
        );
      } else if (currentAdminTab === 'moneyflow') {
        html.push(window.EventMoneyFlow.renderMoneyFlowView('admin'));
      } else if (currentAdminTab === 'activity') {
        html.push(window.EventAdminActivity.renderActivityTab());
      } else if (currentAdminTab === 'subscriptions') {
        var subscribers = Store.getSubscribers();
        var totalMRR = subscribers.reduce(function(acc, s){
          return acc + (s.subscription.planId === 'platinum' ? 99000 : s.subscription.planId === 'gold' ? 59000 : 29000);
        }, 0);

        html.push(
          '<div class="pos-table-card view-animated">',
            '<div style="padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<b style="font-size:1.15rem; color:#ffffff">👑 Manajemen Pelanggan Fast-Track VIP & Subscription (' + subscribers.length + ')</b><br>',
                '<small style="color:#94a3b8">Super Admin dapat memantau seluruh pelanggan aktif dan mengubah harga atau ketentuan paket</small>',
              '</div>',
              '<div style="display:flex; gap:8px">',
                '<button class="btn-primary" style="width:auto; padding:7px 16px; font-size:0.8rem; background:linear-gradient(135deg, #10b981, #059669)" onclick="EventHub.openEditMembershipModal(\'gold\')">',
                  '✏️ Ubah Harga & Paket',
                '</button>',
                '<button class="btn-secondary" style="padding:7px 14px; font-size:0.8rem" onclick="EventHub.go(\'fasttrack\')">',
                  'Lihat Halaman Pricing',
                '</button>',
              '</div>',
            '</div>',

            // 3 KPI cards for subscription
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; padding:18px 24px; background:rgba(15,23,42,0.4)">',
              '<div style="background:rgba(255,255,255,0.04); padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,0.06)">',
                '<div style="font-size:0.75rem; color:#94a3b8; font-weight:700">TOTAL SUBSCRIBER</div>',
                '<div style="font-size:1.6rem; font-weight:800; color:#ffffff">' + subscribers.length + ' Peserta</div>',
              '</div>',
              '<div style="background:rgba(16,185,129,0.1); padding:14px; border-radius:12px; border:1px solid rgba(16,185,129,0.3)">',
                '<div style="font-size:0.75rem; color:#34d399; font-weight:700">ESTIMASI MRR BULANAN</div>',
                '<div style="font-size:1.6rem; font-weight:800; color:#ffffff">' + formatRp(totalMRR) + '</div>',
              '</div>',
              '<div style="background:rgba(139,92,246,0.1); padding:14px; border-radius:12px; border:1px solid rgba(139,92,246,0.3)">',
                '<div style="font-size:0.75rem; color:#c084fc; font-weight:700">PAKET PALING POPULER</div>',
                '<div style="font-size:1.6rem; font-weight:800; color:#ffffff">Pro (Gold VIP)</div>',
              '</div>',
            '</div>',

            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>Nama Peserta</th>',
                  '<th>Email Akun</th>',
                  '<th>WhatsApp</th>',
                  '<th>Paket VIP</th>',
                  '<th>Durasi & Masa Berlaku</th>',
                  '<th>Diskon Tiket</th>',
                  '<th>Hak Akses Gate</th>',
                  '<th>Status</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (subscribers.length === 0) {
          html.push('<tr><td colspan="8" style="text-align:center; padding:36px; color:#64748b">Belum ada peserta yang berlangganan membership Fast-Track VIP.</td></tr>');
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

        html.push('</tbody></table></div>');
      } else if (currentAdminTab === 'feedback') {
        var feedbacks = Store.getWebsiteFeedbacksForAdmin(user);
        var avgRating = feedbacks.length ? (feedbacks.reduce(function(a, f){ return a + f.rating; }, 0) / feedbacks.length).toFixed(1) : '5.0';
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:18px 22px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<b style="font-size:1.1rem">⭐ Hasil Feedback & Evaluasi Website (Khusus Admin)</b><br>',
                '<small style="color:#64748b">Ulasan dan saran pengembangan website dari pengguna yang hanya bisa diakses oleh Super Administrator</small>',
              '</div>',
              '<div style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); padding:8px 16px; border-radius:12px; text-align:center">',
                '<span style="font-size:0.75rem; color:#fbbf24; font-weight:700">RATA-RATA KEPUASAN</span><br>',
                '<b style="font-size:1.3rem; color:#fbbf24">⭐ ' + avgRating + ' / 5.0</b>',
              '</div>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>Tanggal</th>',
                  '<th>Pengguna</th>',
                  '<th>Rating</th>',
                  '<th>Kategori Evaluasi</th>',
                  '<th>Masukan & Komentar</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (feedbacks.length === 0) {
          html.push('<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b">Belum ada feedback yang masuk.</td></tr>');
        } else {
          feedbacks.forEach(function(f) {
            var stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
            html.push(
              '<tr>',
                '<td><small style="color:#64748b">' + f.createdAt + '</small></td>',
                '<td><b>' + f.userName + '</b><br><small style="color:#64748b">' + f.userEmail + ' (' + f.userRole + ')</small></td>',
                '<td><span style="color:#fbbf24; font-size:1rem">' + stars + '</span></td>',
                '<td><span style="background:rgba(99,102,241,0.15); color:#a5b4fc; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700">' + f.category + '</span></td>',
                '<td style="max-width:320px; font-size:0.85rem; color:#f1f5f9; line-height:1.5">"' + f.comment + '"</td>',
              '</tr>'
            );
          });
        }
        html.push('</tbody></table></div>');
      } else if (currentAdminTab === 'messages') {
        var allMsgs = Store.getAllMessagesForAdmin(user);
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08)">',
              '<b>💬 Pengawasan Seluruh Pesan Platform (Khusus Admin)</b><br><small style="color:#64748b">Audit percakapan tanya jawab antara peserta dan penyelenggara se-Indonesia</small>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>ID & Tanggal</th>',
                  '<th>Topik / Acara</th>',
                  '<th>Peserta</th>',
                  '<th>Penyelenggara</th>',
                  '<th>Pesan Terakhir</th>',
                  '<th>Status</th>',
                '</tr>',
              '</thead>',
              '<tbody>'
        );

        if (allMsgs.length === 0) {
          html.push('<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b">Belum ada pesan di platform.</td></tr>');
        } else {
          allMsgs.forEach(function(m) {
            var lastText = m.thread.length ? m.thread[m.thread.length - 1].text : '';
            html.push(
              '<tr>',
                '<td><code>' + m.id + '</code><br><small style="color:#64748b">' + m.createdAt + '</small></td>',
                '<td><b>' + m.subject + '</b><br><small style="color:#818cf8">' + m.eventName + '</small></td>',
                '<td><b>' + m.senderName + '</b><br><small style="color:#64748b">' + m.senderEmail + '</small></td>',
                '<td><b>' + m.organizerName + '</b><br><small style="color:#64748b">' + m.organizerEmail + '</small></td>',
                '<td style="max-width:240px; font-size:0.8rem; color:#cbd5e1">"' + (lastText.length > 50 ? lastText.substring(0, 50) + '...' : lastText) + '"</td>',
                '<td>' + (m.status === 'replied' ? '<span style="color:#10b981; font-weight:700">✓ Dibalas</span>' : '<span style="color:#f59e0b; font-weight:700">⏳ Terbuka</span>') + '</td>',
              '</tr>'
            );
          });
        }
        html.push('</tbody></table></div>');
      } else if (currentAdminTab === 'firewall') {
        html.push(
          '<div class="pos-table-card">',
            '<div style="padding:18px 22px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
              '<div>',
                '<b style="font-size:1.1rem; color:#ffffff">🛡️ EventHub Enterprise Web Application Firewall (WAF)</b><br>',
                '<small style="color:#10b981">● Status: AKTIF & MELINDUNGI (Inspeksi Paket Real-Time & DDoS Shield)</small>',
              '</div>',
              '<div style="display:flex; gap:8px">',
                '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem" onclick="EventAdmin.fetchFirewallLogs()">🔄 Refresh Log</button>',
                '<button class="btn-danger" style="padding:6px 14px; font-size:0.8rem" onclick="EventAdmin.clearFirewallLogs()">Bersihkan Log</button>',
              '</div>',
            '</div>',

            // 4 WAF KPI Metric Cards
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; padding:20px; background:rgba(15,23,42,0.4)">',
              '<div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:14px; border-radius:12px">',
                '<div style="font-size:0.75rem; color:#34d399; font-weight:800; text-transform:uppercase">TOTAL SERANGAN DITANGKIS</div>',
                '<div style="font-size:1.8rem; font-weight:800; color:#ffffff; margin-top:2px" id="waf-stat-total">4 Ditangkis</div>',
                '<div style="font-size:0.75rem; color:#94a3b8">100% Netralisir</div>',
              '</div>',
              '<div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); padding:14px; border-radius:12px">',
                '<div style="font-size:0.75rem; color:#818cf8; font-weight:800; text-transform:uppercase">SQL INJECTION SHIELD</div>',
                '<div style="font-size:1.8rem; font-weight:800; color:#ffffff; margin-top:2px" id="waf-stat-sqli">1 Terdeteksi</div>',
                '<div style="font-size:0.75rem; color:#94a3b8">Regex & Heuristik Aktif</div>',
              '</div>',
              '<div style="background:rgba(236,72,153,0.1); border:1px solid rgba(236,72,153,0.3); padding:14px; border-radius:12px">',
                '<div style="font-size:0.75rem; color:#f472b6; font-weight:800; text-transform:uppercase">ANTI-XSS & SCRIPT</div>',
                '<div style="font-size:1.8rem; font-weight:800; color:#ffffff; margin-top:2px" id="waf-stat-xss">1 Terdeteksi</div>',
                '<div style="font-size:0.75rem; color:#94a3b8">Filter Script & Tag Injeksi</div>',
              '</div>',
              '<div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); padding:14px; border-radius:12px">',
                '<div style="font-size:0.75rem; color:#fbbf24; font-weight:800; text-transform:uppercase">LFI & BOT SCANNER</div>',
                '<div style="font-size:1.8rem; font-weight:800; color:#ffffff; margin-top:2px" id="waf-stat-bot">2 Terdeteksi</div>',
                '<div style="font-size:0.75rem; color:#94a3b8">Sqlmap, Nikto, Traversal</div>',
              '</div>',
            '</div>',

            // Real-time Incident Table
            '<div style="padding:16px 20px 8px; border-top:1px solid rgba(255,255,255,0.08)">',
              '<b style="color:#ffffff; font-size:0.95rem">Log Audit Percobaan Serangan Real-Time</b>',
            '</div>',
            '<table class="pos-table">',
              '<thead>',
                '<tr>',
                  '<th>ID & Waktu</th>',
                  '<th>Alamat IP</th>',
                  '<th>Jenis Ancaman</th>',
                  '<th>Cuplikan Kode / Payload Jahat</th>',
                  '<th>Aksi Mitigasi WAF</th>',
                '</tr>',
              '</thead>',
              '<tbody id="waf-incidents-body">',
                '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b">Memuat status log keamanan firewall...</td></tr>',
              '</tbody>',
            '</table>',
          '</div>'
        );

        // Asynchronously fetch firewall data from server
        setTimeout(function() {
          if (window.EventAdmin && window.EventAdmin.fetchFirewallLogs) {
            window.EventAdmin.fetchFirewallLogs();
          }
        }, 100);
      }
      html.push('</div>'); // Close left column

      // Right Column: Platform Overview & Global Camera Scanner
      html.push(
        '<div>',
          // Overview Card
          '<div class="pos-side-card">',
            '<div class="pos-side-header-blue">RINGKASAN KEUANGAN PLATFORM</div>',
            '<div class="pos-side-body">',
              '<div class="pos-summary-row">',
                '<span style="color:#94a3b8">Total GMV Penjualan:</span>',
                '<b style="color:#38bdf8">' + formatRp(totalGMV) + '</b>',
              '</div>',
              '<div class="pos-summary-row">',
                '<span style="color:#94a3b8">Komisi Platform (10%):</span>',
                '<b style="color:#10b981">' + formatRp(platformCommission) + '</b>',
              '</div>',
              '<div class="pos-summary-row">',
                '<span style="color:#94a3b8">Hak Penyelenggara:</span>',
                '<b>' + formatRp(organizerPayout) + '</b>',
              '</div>',
              '<div class="pos-summary-row total-row">',
                '<span>Total Tiket Terbit:</span>',
                '<span style="color:#ffffff">' + allTickets.length + ' Tiket</span>',
              '</div>',
            '</div>',
          '</div>',

          // Global Camera Scanner
          '<div class="pos-side-card">',
            '<div class="pos-side-header-dark" style="display:flex; justify-content:space-between; align-items:center">',
              '<span>SCANNER KAMERA PLATFORM (ADMIN)</span>',
              '<span class="radar-ping"></span>',
            '</div>',
            '<div class="pos-side-body">',
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px">',
                '<button id="btn-admin-cam" class="btn-primary" style="padding:8px 14px; font-size:0.8rem; width:auto; background:' + (isCamRunning ? '#f43f5e' : '#1d4ed8') + '" onclick="EventHub.toggleAdminCamera()">',
                  isCamRunning ? '⏹ Tutup Kamera Admin' : '📷 Buka Kamera Admin',
                '</button>',
                '<select id="admin-cam-select" class="filter-select" style="font-size:0.75rem; padding:6px 10px; display:' + (isCamRunning ? 'inline-block' : 'none') + '" onchange="EventHub.switchAdminCamera(this.value)">',
                  '<option value="">Pilih Kamera...</option>',
                '</select>',
              '</div>',

              '<div class="scanner-viewport" style="height:220px; margin-bottom:14px">',
                '<video id="admin-video" class="scanner-video" playsinline autoplay muted style="width:100%; height:100%; object-fit:cover; display:' + (isCamRunning ? 'block' : 'none') + '"></video>',
                '<div id="admin-cam-placeholder" style="position:absolute; inset:0; display:' + (isCamRunning ? 'none' : 'flex') + '; flex-direction:column; align-items:center; justify-content:center; color:#64748b; padding:16px; text-align:center; background:#000000">',
                  '<div style="font-size:2rem; margin-bottom:6px">📷</div>',
                  '<b style="color:#ffffff; font-size:0.85rem">Kamera Admin Belum Aktif</b>',
                  '<p style="font-size:0.75rem; color:#64748b; margin-top:2px">Scan tiket acara apa pun se-Indonesia.</p>',
                '</div>',
                '<div class="scanner-overlay" style="display:' + (isCamRunning ? 'flex' : 'none') + '">',
                  '<div class="scanner-target-box" style="width:160px; height:160px">',
                    '<div class="scanner-laser-bar"></div>',
                  '</div>',
                '</div>',
              '</div>',

              // Manual Code entry
              '<div style="margin-bottom:12px">',
                '<label class="form-label" style="font-size:0.78rem">Scan Gun / Input Kode:</label>',
                '<input class="form-control" id="manual-admin-code" placeholder="EH-XXX-XXXXXX" style="font-family:var(--font-mono); font-weight:700; padding:8px 12px; font-size:0.85rem; margin-bottom:8px" onkeydown="if(event.key===\'Enter\') EventHub.doAdminScanInput()">',
                '<button class="btn-primary" style="padding:10px; font-size:0.85rem; background:#10b981" onclick="EventHub.doAdminScanInput()">',
                  '✓ Validasi Tiket Nasional',
                '</button>',
              '</div>',

              // Quick Test Scan across all platform tickets
              '<div style="background:rgba(255,255,255,0.02); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06)">',
                '<div style="font-size:0.72rem; font-weight:700; color:#38bdf8; margin-bottom:4px">⚡ TES CEPAT ADMIN:</div>',
                '<div style="display:flex; gap:6px">' +
                  '<select class="filter-select" id="sample-admin-picker" style="flex:1; font-size:0.75rem; padding:6px">' +
                    allTickets.slice(0, 5).map(function(t){ return '<option value="' + t.code + '">' + t.code + ' (' + t.eventName.substring(0, 16) + '...)</option>'; }).join('') +
                  '</select>' +
                  '<button class="btn-secondary" style="padding:6px 10px; font-size:0.75rem" onclick="EventHub.testAdminScanPicker()">Scan</button>' +
                '</div>',
              '</div>'
        );

        if (App.lastAdminScanResult) {
          var resAdmin = App.lastAdminScanResult;
          var bannerAdminClass = resAdmin.status === 'success' ? 'scan-result-success'
            : resAdmin.status === 'warning' ? 'scan-result-warning'
            : 'scan-result-error';

          html.push(
            '<div class="scan-result-card ' + bannerAdminClass + '" style="margin-top:12px; padding:12px 14px">',
              '<div style="font-size:1.4rem">' + (resAdmin.status === 'success' ? '✓' : resAdmin.status === 'warning' ? '⚠️' : '✖') + '</div>',
              '<div>',
                '<div style="font-weight:800; font-size:0.85rem">' + resAdmin.message + '</div>',
                resAdmin.ticket ? '<div style="font-size:0.75rem; opacity:0.9">' + resAdmin.ticket.eventName + ' • ' + resAdmin.ticket.buyerName + '</div>' : '',
              '</div>',
            '</div>'
          );
        }

        html.push(
            '</div>',
          '</div>',

          // 4-Button Grid
          '<div class="pos-tools-grid">',
            '<button class="pos-tool-btn" onclick="window.print()">',
              '<span>🖨️</span>',
              '<span>Cetak Laporan</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventHub.openCreateEventModal()">',
              '<span>➕</span>',
              '<span>Buat Event</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventAdmin.setAdminTab(\'refunds\')">',
              '<span>🔄</span>',
              '<span>Audit Refund</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventAdmin.downloadDatabaseBackup()">',
              '<span>💾</span>',
              '<span>Backup DB</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventAdmin.setAdminTab(\'subscriptions\')">',
              '<span>👑</span>',
              '<span>Paket VIP</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventHub.openQuickScanModal()">',
              '<span>⚡</span>',
              '<span>Super Scan</span>',
            '</button>',
            '<button class="pos-tool-btn" onclick="EventHub.renderApp()">',
              '<span>🔄</span>',
              '<span>Refresh Data</span>',
            '</button>',
            '<button class="pos-tool-btn" style="' + (maint.active ? 'border-color:rgba(245,158,11,0.6); background:rgba(245,158,11,0.15)' : '') + '" onclick="EventAdmin.openMaintenanceModal()">',
              '<span>🚧</span>',
              '<span>' + (maint.active ? 'Maintenance ON' : 'Mode Maintenance') + '</span>',
            '</button>',
          '</div>',
        '</div>', // Close right column
        '</div>', // Close pos-grid-layout
        '</div>', // Close pos-workspace
        '</div>'  // Close pos-wrapper
      );

      return html.join('');
    },

    fetchFirewallLogs: async function() {
      try {
        var res = await fetch('/api/firewall/summary');
        var data = await res.json();
        var stats = data.stats || {};

        var totEl = document.getElementById('waf-stat-total');
        if (totEl) totEl.textContent = (stats.blocked_threats || 0) + ' Ditangkis';
        var sqliEl = document.getElementById('waf-stat-sqli');
        if (sqliEl) sqliEl.textContent = (stats.sqli_blocked || 0) + ' Terdeteksi';
        var xssEl = document.getElementById('waf-stat-xss');
        if (xssEl) xssEl.textContent = (stats.xss_blocked || 0) + ' Terdeteksi';
        var botEl = document.getElementById('waf-stat-bot');
        if (botEl) botEl.textContent = ((stats.traversal_blocked || 0) + (stats.bot_blocked || 0)) + ' Terdeteksi';

        var bodyEl = document.getElementById('waf-incidents-body');
        if (!bodyEl) return;
        var incidents = data.recent_incidents || [];
        if (incidents.length === 0) {
          bodyEl.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:#10b981">✓ Tidak ada ancaman aktif. Seluruh lalu lintas website aman dan dalam perlindungan WAF.</td></tr>';
          return;
        }

        bodyEl.innerHTML = incidents.map(function(inc) {
          return [
            '<tr>',
              '<td><code>' + inc.id + '</code><br><small style="color:#64748b">' + inc.timestamp + '</small></td>',
              '<td><b style="color:#f43f5e">' + inc.ip + '</b></td>',
              '<td><span class="user-role-tag" style="background:rgba(244,63,94,0.15); color:#fb7185">' + inc.threat_type + '</span></td>',
              '<td style="font-family:var(--font-mono); font-size:0.75rem; color:#cbd5e1; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap"><code>' + (inc.payload_snippet || inc.reason) + '</code></td>',
              '<td><span style="color:#10b981; font-weight:800; font-size:0.8rem">🛡️ DITANGKIS (403 BLOCKED)</span></td>',
            '</tr>'
          ].join('');
        }).join('');
      } catch (e) {
        console.warn('WAF fetch error:', e);
      }
    },

    clearFirewallLogs: async function() {
      try {
        await fetch('/api/firewall/clear-logs', { method: 'POST' });
        Router.showToast('Log firewall berhasil dibersihkan.', 'success');
        this.fetchFirewallLogs();
      } catch (e) {}
    },

    downloadDatabaseBackup: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        Router.showToast('Hanya Super Admin yang berhak mengunduh backup database.', 'error');
        return;
      }
      var data = Store.getData();
      var jsonStr = JSON.stringify(data, null, 2);
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'EventHub_Backup_Database_' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Router.showToast('Database platform berhasil dicadangkan ke file JSON!', 'success');
    },
    openMaintenanceModal: function() {
      if (window.EventHub && window.EventHub.openMaintenanceModal) {
        window.EventHub.openMaintenanceModal();
      }
    },

    quickToggleMaintenance: function(active) {
      if (window.EventHub && window.EventHub.quickToggleMaintenance) {
        window.EventHub.quickToggleMaintenance(active);
      }
    },
    exportTransactionsCSV: function() {
      var table = document.getElementById('admin-transactions-table');
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
      link.setAttribute('download', 'Laporan_Transaksi_Nasional_EventHub_' + Date.now() + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Router.showToast('Laporan CSV transaksi nasional berhasil diunduh!', 'success');
    },
  };
  window.EventAdmin = AdminModule;
})(window);
