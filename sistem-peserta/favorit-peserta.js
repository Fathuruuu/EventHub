/**
 * EventHub Pro - Acara Favorit (Wishlist) Peserta
 * Berkas khusus untuk menampilkan antarmuka acara yang disimpan ke favorit
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Router = window.EventRouter;
  var Icons = Router.Icons;
  var formatRp = Router.formatRp;

  var ParticipantFavorites = {
    renderFavoritesView: function() {
      var bookmarks = Store.getBookmarks();
      var allEvents = Store.getEvents();
      var favEvents = allEvents.filter(function(e) { return bookmarks.indexOf(e.id) >= 0; });

      var html = [
        '<div class="view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h1 style="font-size:1.85rem; font-weight:800; color:#ffffff">Acara Favorit Saya (Wishlist)</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Daftar event yang Anda simpan untuk dibeli nanti.</p>',
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
    }
  };

  window.EventParticipantFavorites = ParticipantFavorites;
})(window);
