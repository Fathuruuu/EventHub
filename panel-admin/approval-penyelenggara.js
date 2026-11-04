/**
 * EventHub Pro - Approval Penyelenggara (Khusus Super Admin)
 * Berkas khusus untuk meninjau, menyetujui (approve), atau menolak pendaftaran akun penyelenggara acara
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Confetti = window.EventConfetti;
  var Router = window.EventRouter;

  var AdminApproval = {
    renderApprovalSection: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') return '';

      var pending = Store.getPendingOrganizers();
      // Hanya muncul saat ada akun penyelenggara yang mendaftar dan menunggu approval
      if (!pending || pending.length === 0) return '';

      var html = [
        '<div class="pos-table-card" style="margin-bottom:24px; border:1px solid rgba(245,158,11,0.3); background:rgba(245,158,11,0.03)">',
          '<div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">',
            '<div>',
              '<b style="font-size:1.05rem; color:#f59e0b">⏳ Permohonan Pendaftaran Akun Penyelenggara (Menunggu Persetujuan Admin)</b><br>',
              '<small style="color:#94a3b8">Penyelenggara baru yang mendaftar harus disetujui admin terlebih dahulu sebelum dapat login dan membuat event.</small>',
            '</div>',
            '<span style="background:rgba(245,158,11,0.15); color:#fbbf24; font-weight:800; font-size:0.8rem; padding:4px 12px; border-radius:99px; border:1px solid rgba(245,158,11,0.3)">',
              pending.length + ' Menunggu Approval',
            '</span>',
          '</div>'
      ];

      html.push(
        '<table class="pos-table">',
          '<thead>',
              '<tr>',
                '<th>Tanggal Daftar</th>',
                '<th>Nama Penanggung Jawab</th>',
                '<th>Nama Organisasi / Promotor / EO</th>',
                '<th>Email Resmi</th>',
                '<th>No. WhatsApp</th>',
                '<th style="text-align:right">Tindakan Admin</th>',
              '</tr>',
            '</thead>',
            '<tbody>'
        );

        pending.forEach(function(p) {
          html.push(
            '<tr>',
              '<td><small style="color:#64748b">' + (p.createdAt || 'Hari Ini') + '</small></td>',
              '<td><b style="color:#ffffff">' + p.name + '</b></td>',
              '<td><span style="color:#38bdf8; font-weight:700">' + (p.company || p.name) + '</span></td>',
              '<td><code>' + p.email + '</code></td>',
              '<td>' + (p.phone || '-') + '</td>',
              '<td style="text-align:right">',
                '<button class="btn-primary" style="padding:6px 14px; font-size:0.8rem; width:auto; display:inline-block; margin-right:6px; background:#10b981" onclick="EventAdminApproval.approve(\'' + p.email + '\')">',
                  '✓ Setujui (Approve)',
                '</button>',
                '<button class="btn-danger" style="padding:6px 14px; font-size:0.8rem; width:auto; display:inline-block" onclick="EventAdminApproval.rejectPrompt(\'' + p.email + '\')">',
                  '✖ Tolak',
                '</button>',
              '</td>',
            '</tr>'
          );
        });

        html.push('</tbody></table>');

      html.push('</div>');
      return html.join('');
    },

    approve: function(email) {
      var user = Store.getCurrentUser();
      try {
        var org = Store.approveOrganizer(email, user);
        if (Sound) Sound.playSuccess();
        if (Confetti) Confetti.celebrate();
        Router.showToast('Akun penyelenggara "' + (org.company || org.name) + '" (' + email + ') BERHASIL DISETUJUI! Sekarang penyelenggara sudah bisa login.', 'success', 5000);
        EventHub.renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    },

    rejectPrompt: function(email) {
      var reason = prompt('Masukkan alasan penolakan pendaftaran penyelenggara:', 'Data promotor / organisasi tidak dapat diverifikasi.');
      if (reason === null) return;
      var user = Store.getCurrentUser();
      try {
        Store.rejectOrganizer(email, reason, user);
        if (Sound) Sound.playWarning();
        Router.showToast('Pendaftaran penyelenggara ' + email + ' telah ditolak.', 'warning');
        EventHub.renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    }
  };

  window.EventAdminApproval = AdminApproval;
})(window);
