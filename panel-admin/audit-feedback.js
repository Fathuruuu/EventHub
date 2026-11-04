/**
 * EventHub Pro - Audit Feedback Pelayanan (Khusus Super Admin)
 * Berkas khusus untuk merekap hasil feedback dan evaluasi layanan dari pengguna
 * HANYA SUPER ADMIN YANG BISA MELIHAT HASILNYA
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;

  var AdminFeedbackAudit = {
    renderFeedbackTab: function() {
      var user = Store.getCurrentUser();
      if (!user || user.role !== 'superadmin') return '';

      var feedbacks = Store.getWebsiteFeedbacksForAdmin(user);
      var avgRating = feedbacks.length
        ? (feedbacks.reduce(function(a, f){ return a + f.rating; }, 0) / feedbacks.length).toFixed(1)
        : '5.0';

      var html = [
        '<div class="pos-table-card">',
          '<div style="padding:18px 22px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<b style="font-size:1.1rem">⭐ Hasil Evaluasi & Feedback Layanan (Khusus Super Admin)</b><br>',
              '<small style="color:#64748b">Rekapitulasi rating kepuasan penyelenggara, venue, dan gate tiket dari peserta yang hanya bisa diakses admin</small>',
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
                '<th>Masukan & Komentar Peserta</th>',
              '</tr>',
            '</thead>',
            '<tbody>'
      ];

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
      return html.join('');
    }
  };

  window.EventAdminFeedback = AdminFeedbackAudit;
})(window);
