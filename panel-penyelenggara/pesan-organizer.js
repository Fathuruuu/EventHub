/**
 * EventHub Pro - Pesan Masuk Penyelenggara
 * Berkas khusus bagi penyelenggara untuk melihat pertanyaan dan membalas chat peserta acara
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Router = window.EventRouter;

  var OrganizerMessages = {
    renderMessagesTab: function(currentEvent) {
      var user = Store.getCurrentUser();
      var orgMsgs = Store.getOrganizerMessages(user ? user.email : '');
      if (currentEvent) {
        orgMsgs = orgMsgs.filter(function(m) { return m.eventId === currentEvent.id; });
      }

      var html = [
        '<div class="pos-table-card">',
          '<div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08)">',
            '<b>💬 Pertanyaan & Pesan dari Peserta Acara</b><br>',
            '<small style="color:#64748b">Jawab pertanyaan seputar acara, jadwal gate, dan fasilitas langsung kepada peserta.</small>',
          '</div>'
      ];

      if (orgMsgs.length === 0) {
        html.push(
          '<div style="text-align:center; padding:40px; color:#64748b">',
            'Belum ada pesan atau pertanyaan dari peserta untuk acara ini.',
          '</div>'
        );
      } else {
        html.push('<div style="padding:16px; display:flex; flex-direction:column; gap:16px">');
        orgMsgs.forEach(function(m) {
          html.push(
            '<div style="background:var(--bg-surface-elevated); padding:16px; border-radius:12px; border:1px solid var(--border-glass)">',
              '<div style="display:flex; justify-content:space-between; margin-bottom:8px">',
                '<div>',
                  '<b style="font-size:0.95rem; color:#ffffff">' + m.subject + '</b><br>',
                  '<small style="color:#38bdf8">Dari: ' + m.senderName + ' (' + m.senderEmail + ')</small>',
                '</div>',
                '<span style="font-size:0.75rem; color:#64748b">' + m.createdAt + '</span>',
              '</div>',

              '<div style="background:rgba(255,255,255,0.04); padding:12px; border-radius:8px; font-size:0.85rem; margin-bottom:12px">' +
                m.thread.map(function(t){
                  return '<div><b>' + t.senderName + ':</b> ' + t.text + ' <small style="color:#64748b">(' + t.time + ')</small></div>';
                }).join('<hr style="border:none; border-top:1px dashed rgba(255,255,255,0.06); margin:6px 0">') +
              '</div>',

              '<div style="display:flex; gap:8px">',
                '<input class="form-control" id="org-reply-' + m.id + '" placeholder="Ketik balasan Anda..." style="padding:8px 12px; font-size:0.85rem" onkeydown="if(event.key===\'Enter\') EventOrganizerMessages.reply(\'' + m.id + '\')">',
                '<button class="btn-primary" style="width:auto; padding:8px 16px; font-size:0.8rem; background:#10b981" onclick="EventOrganizerMessages.reply(\'' + m.id + '\')">Kirim Balasan</button>',
              '</div>',
            '</div>'
          );
        });
        html.push('</div>');
      }

      html.push('</div>');
      return html.join('');
    },

    reply: function(msgId) {
      var input = document.getElementById('org-reply-' + msgId);
      var text = (input ? input.value : '').trim();
      var user = Store.getCurrentUser();

      if (!text) return;

      try {
        Store.replyMessage(msgId, text, user);
        Store.logActivity('Balasan Penyelenggara', 'Penyelenggara menjawab pertanyaan peserta (ID: ' + msgId + ')', user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Balasan berhasil dikirimkan ke peserta!', 'success');
        if (input) input.value = '';
        EventHub.renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    }
  };

  window.EventOrganizerMessages = OrganizerMessages;
})(window);
