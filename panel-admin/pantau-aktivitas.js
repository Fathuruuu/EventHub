/**
 * EventHub Pro - Pemantauan Aktivitas Real-Time Seluruh Akun (Khusus Super Admin)
 * Mengaudit dan memantau seluruh aktivitas pengguna (peserta, penyelenggara, admin, dan tamu)
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Router = window.EventRouter;

  var currentRoleFilter = 'all';
  var currentSearchQuery = '';

  var AdminActivityMonitor = {
    setFilter: function(role) {
      currentRoleFilter = role;
      var el = document.getElementById('activity-filter-box');
      if (el) AdminActivityMonitor.refreshTable();
    },

    setSearch: function(query) {
      currentSearchQuery = (query || '').toLowerCase().trim();
      AdminActivityMonitor.refreshTable();
    },

    refreshTable: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') return;

      var logs = Store.getActivityLogsForAdmin(user);

      // Filter by Role
      if (currentRoleFilter !== 'all') {
        logs = logs.filter(function(l) {
          return l.userRole === currentRoleFilter;
        });
      }

      // Filter by Search Query
      if (currentSearchQuery) {
        logs = logs.filter(function(l) {
          var target = (l.userName + ' ' + l.userEmail + ' ' + l.action + ' ' + l.details).toLowerCase();
          return target.indexOf(currentSearchQuery) >= 0;
        });
      }

      var tbody = document.getElementById('admin-activity-tbody');
      var counter = document.getElementById('activity-count-display');
      if (counter) counter.textContent = logs.length + ' Aktivitas';

      if (!tbody) return;

      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:36px; color:#64748b">Tidak ada log aktivitas yang cocok dengan filter.</td></tr>';
        return;
      }

      tbody.innerHTML = logs.map(function(l) {
        var roleTag = l.userRole === 'penyelenggara' ? '<span class="user-role-tag role-penyelenggara">Penyelenggara</span>'
          : l.userRole === 'superadmin' ? '<span class="user-role-tag role-superadmin">Super Admin</span>'
          : l.userRole === 'peserta' ? '<span class="user-role-tag role-peserta">Peserta</span>'
          : '<span class="user-role-tag" style="background:rgba(255,255,255,0.08); color:#94a3b8">Tamu</span>';

        var statusChip = l.status === 'success' ? '<span style="color:#10b981; font-weight:700">✓ Berhasil</span>'
          : l.status === 'warning' ? '<span style="color:#f59e0b; font-weight:700">⚠️ Peringatan</span>'
          : '<span style="color:#38bdf8; font-weight:700">ℹ Tercatat</span>';

        return [
          '<tr>',
            '<td><small style="color:#64748b; font-family:var(--font-mono)">' + l.timestamp + '</small></td>',
            '<td><b style="color:#ffffff">' + l.userName + '</b><br><small style="color:#64748b">' + l.userEmail + '</small> ' + roleTag + '</td>',
            '<td><b style="color:#38bdf8">' + l.action + '</b></td>',
            '<td style="max-width:340px; font-size:0.83rem; color:#cbd5e1; line-height:1.4">' + l.details + '</td>',
            '<td>' + statusChip + '</td>',
          '</tr>'
        ].join('');
      }).join('');
    },

    exportCsv: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') return;

      var logs = Store.getActivityLogsForAdmin(user);
      if (logs.length === 0) {
        Router.showToast('Belum ada log aktivitas untuk diekspor.', 'warning');
        return;
      }

      var csvRows = [
        ['ID', 'Waktu', 'Nama Pengguna', 'Email Akun', 'Peran (Role)', 'Aksi', 'Rincian Aktivitas', 'Status']
      ];

      logs.forEach(function(l) {
        csvRows.push([
          l.id,
          l.timestamp,
          '"' + (l.userName || '').replace(/"/g, '""') + '"',
          l.userEmail,
          l.userRole,
          '"' + (l.action || '').replace(/"/g, '""') + '"',
          '"' + (l.details || '').replace(/"/g, '""') + '"',
          l.status
        ]);
      });

      var csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map(function(e){ return e.join(','); }).join('\n');
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'EventHub_Log_Aktivitas_Seluruh_Akun.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Router.showToast('Log aktivitas berhasil diekspor ke CSV!', 'success');
    },

    renderActivityTab: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') return '';

      var allLogs = Store.getActivityLogsForAdmin(user);
      var pesertaCount = allLogs.filter(function(l){ return l.userRole === 'peserta'; }).length;
      var eoCount = allLogs.filter(function(l){ return l.userRole === 'penyelenggara'; }).length;
      var adminCount = allLogs.filter(function(l){ return l.userRole === 'superadmin'; }).length;

      var html = [
        '<div class="pos-table-card view-animated">',
          // Header Bar
          '<div style="padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<b style="font-size:1.15rem; color:#ffffff">📡 Pemantauan Aktivitas Seluruh Akun Real-Time</b><br>',
              '<small style="color:#94a3b8">Audit jejak interaksi seluruh peserta, penyelenggara, admin, dan tamu di platform</small>',
            '</div>',
            '<div style="display:flex; gap:8px; align-items:center">',
              '<button class="btn-primary" style="width:auto; padding:7px 16px; font-size:0.8rem; background:#10b981" onclick="EventAdminActivity.exportCsv()">',
                '📥 Ekspor Log CSV',
              '</button>',
              '<button class="btn-secondary" style="padding:7px 14px; font-size:0.8rem" onclick="EventHub.renderApp()">',
                '🔄 Refresh',
              '</button>',
            '</div>',
          '</div>',

          // 4 Metric Mini Cards
          '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; padding:18px 24px; background:rgba(15,23,42,0.5); border-bottom:1px solid rgba(255,255,255,0.06)">',
            '<div style="background:rgba(255,255,255,0.04); padding:12px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.06)">',
              '<div style="font-size:0.72rem; color:#94a3b8; font-weight:700">TOTAL AKTIVITAS</div>',
              '<div style="font-size:1.5rem; font-weight:800; color:#ffffff" id="activity-count-display">' + allLogs.length + ' Aktivitas</div>',
            '</div>',
            '<div style="background:rgba(99,102,241,0.08); padding:12px 16px; border-radius:10px; border:1px solid rgba(99,102,241,0.2)">',
              '<div style="font-size:0.72rem; color:#818cf8; font-weight:700">AKTIVITAS PESERTA</div>',
              '<div style="font-size:1.5rem; font-weight:800; color:#ffffff">' + pesertaCount + ' Log</div>',
            '</div>',
            '<div style="background:rgba(16,185,129,0.08); padding:12px 16px; border-radius:10px; border:1px solid rgba(16,185,129,0.2)">',
              '<div style="font-size:0.72rem; color:#34d399; font-weight:700">AKTIVITAS PENYELENGGARA</div>',
              '<div style="font-size:1.5rem; font-weight:800; color:#ffffff">' + eoCount + ' Log</div>',
            '</div>',
            '<div style="background:rgba(236,72,153,0.08); padding:12px 16px; border-radius:10px; border:1px solid rgba(236,72,153,0.2)">',
              '<div style="font-size:0.72rem; color:#f472b6; font-weight:700">ADMINISTRATOR & SISTEM</div>',
              '<div style="font-size:1.5rem; font-weight:800; color:#ffffff">' + adminCount + ' Log</div>',
            '</div>',
          '</div>',

          // Search and Filter Toolbar
          '<div id="activity-filter-box" style="padding:14px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid rgba(255,255,255,0.06)">',
            '<div style="display:flex; gap:8px; flex-wrap:wrap">',
              '<button class="pos-tab-btn ' + (currentRoleFilter === 'all' ? 'active' : '') + '" onclick="EventAdminActivity.setFilter(\'all\')">Semua Akun (' + allLogs.length + ')</button>',
              '<button class="pos-tab-btn ' + (currentRoleFilter === 'peserta' ? 'active' : '') + '" onclick="EventAdminActivity.setFilter(\'peserta\')">Peserta (' + pesertaCount + ')</button>',
              '<button class="pos-tab-btn ' + (currentRoleFilter === 'penyelenggara' ? 'active' : '') + '" onclick="EventAdminActivity.setFilter(\'penyelenggara\')">Penyelenggara (' + eoCount + ')</button>',
              '<button class="pos-tab-btn ' + (currentRoleFilter === 'superadmin' ? 'active' : '') + '" onclick="EventAdminActivity.setFilter(\'superadmin\')">Admin (' + adminCount + ')</button>',
            '</div>',
            '<div style="max-width:280px; width:100%">',
              '<input class="form-control" placeholder="Cari nama, email, atau aksi..." style="padding:6px 12px; font-size:0.8rem" oninput="EventAdminActivity.setSearch(this.value)">',
            '</div>',
          '</div>',

          // Main Activity Log Table
          '<table class="pos-table">',
            '<thead>',
              '<tr>',
                '<th>Waktu</th>',
                '<th>Pengguna & Peran Akun</th>',
                '<th>Aksi / Kategori</th>',
                '<th>Rincian Aktivitas Interaksi</th>',
                '<th>Status</th>',
              '</tr>',
            '</thead>',
            '<tbody id="admin-activity-tbody">'
      ];

      if (allLogs.length === 0) {
        html.push('<tr><td colspan="5" style="text-align:center; padding:36px; color:#64748b">Belum ada aktivitas tercatat di platform.</td></tr>');
      } else {
        allLogs.forEach(function(l) {
          var roleTag = l.userRole === 'penyelenggara' ? '<span class="user-role-tag role-penyelenggara">Penyelenggara</span>'
            : l.userRole === 'superadmin' ? '<span class="user-role-tag role-superadmin">Super Admin</span>'
            : l.userRole === 'peserta' ? '<span class="user-role-tag role-peserta">Peserta</span>'
            : '<span class="user-role-tag" style="background:rgba(255,255,255,0.08); color:#94a3b8">Tamu</span>';

          var statusChip = l.status === 'success' ? '<span style="color:#10b981; font-weight:700">✓ Berhasil</span>'
            : l.status === 'warning' ? '<span style="color:#f59e0b; font-weight:700">⚠️ Peringatan</span>'
            : '<span style="color:#38bdf8; font-weight:700">ℹ Tercatat</span>';

          html.push(
            '<tr>',
              '<td><small style="color:#64748b; font-family:var(--font-mono)">' + l.timestamp + '</small></td>',
              '<td><b style="color:#ffffff">' + l.userName + '</b><br><small style="color:#64748b">' + l.userEmail + '</small> ' + roleTag + '</td>',
              '<td><b style="color:#38bdf8">' + l.action + '</b></td>',
              '<td style="max-width:340px; font-size:0.83rem; color:#cbd5e1; line-height:1.4">' + l.details + '</td>',
              '<td>' + statusChip + '</td>',
            '</tr>'
          );
        });
      }

      html.push('</tbody></table></div>');
      return html.join('');
    }
  };

  window.EventAdminActivity = AdminActivityMonitor;
})(window);
