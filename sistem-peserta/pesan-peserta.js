/**
 * EventHub Pro - Pesan & Tanya Penyelenggara (Sisi Peserta)
 * Berkas khusus untuk mengelola percakapan dan tanya jawab langsung peserta ke EO
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;
  var Router = window.EventRouter;

  var ParticipantMessages = {
    renderMessagesView: function() {
      var user = Store.getCurrentUser();
      if (!user) {
        return '<div class="card-panel">Silakan login terlebih dahulu untuk mengakses pesan.</div>';
      }

      var userMsgs = Store.getUserMessages(user.email);

      var html = [
        '<div class="view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h1 style="font-size:1.85rem; font-weight:800; color:#ffffff">Pesan & Tanya Penyelenggara</h1>',
              '<p style="color:var(--text-muted); font-size:0.9rem">Percakapan langsung antara Anda dan pihak penyelenggara acara resmi.</p>',
            '</div>',
            '<button class="btn-secondary" onclick="EventHub.go(\'home\')">',
              '← Jelajahi Event',
            '</button>',
          '</div>'
      ];

      if (userMsgs.length === 0) {
        html.push(
          '<div class="card-panel" style="text-align:center; padding:60px 20px">',
            '<div style="font-size:3.2rem; margin-bottom:12px">💬</div>',
            '<h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px">Belum Ada Pesan</h3>',
            '<p style="color:var(--text-muted); margin-bottom:20px">Anda belum pernah mengirim pertanyaan ke penyelenggara. Buka detail event favorit Anda lalu klik tombol "Tanya Penyelenggara"!</p>',
            '<button class="btn-primary" style="width:auto; display:inline-flex" onclick="EventHub.go(\'home\')">',
              'Jelajahi Event Sekarang →',
            '</button>',
          '</div>'
        );
      } else {
        html.push('<div style="display:flex; flex-direction:column; gap:20px">');
        userMsgs.forEach(function(m) {
          var statusBadge = m.status === 'replied'
            ? '<span style="background:rgba(16,185,129,0.15); color:#34d399; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">✓ DIBALAS PENYELENGGARA</span>'
            : '<span style="background:rgba(99,102,241,0.15); color:#a5b4fc; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:99px">⏳ MENUNGGU BALASAN</span>';

          html.push(
            '<div class="card-panel" style="padding:24px">',
              '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:8px">',
                '<div>',
                  '<div style="font-size:0.75rem; color:var(--text-dim)">' + m.id + ' • ' + m.createdAt + '</div>',
                  '<h3 style="font-size:1.25rem; font-weight:800; margin:2px 0; color:#ffffff">' + m.subject + '</h3>',
                  '<div style="font-size:0.85rem; color:#818cf8">Acara: <b>' + m.eventName + '</b> (Penyelenggara: ' + m.organizerName + ')</div>',
                '</div>',
                '<div>' + statusBadge + '</div>',
              '</div>',

              '<div style="background:var(--bg-surface-elevated); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-glass); margin-bottom:16px; display:flex; flex-direction:column; gap:12px">'
          );

          m.thread.forEach(function(t) {
            var isMe = t.sender.toLowerCase() === user.email.toLowerCase();
            html.push(
              '<div style="display:flex; flex-direction:column; align-items:' + (isMe ? 'flex-end' : 'flex-start') + '">',
                '<div style="font-size:0.72rem; color:var(--text-dim); margin-bottom:3px">' + t.senderName + ' • ' + t.time + '</div>',
                '<div style="max-width:80%; padding:10px 16px; border-radius:12px; font-size:0.9rem; line-height:1.5; background:' + (isMe ? 'rgba(99,102,241,0.25); color:#ffffff; border:1px solid rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06); color:#f1f5f9; border:1px solid rgba(255,255,255,0.1)') + '">',
                  t.text,
                '</div>',
              '</div>'
            );
          });

          html.push(
              '</div>',

              '<div style="display:flex; gap:10px">',
                '<input class="form-control" id="reply-msg-' + m.id + '" placeholder="Ketik balasan Anda..." onkeydown="if(event.key===\'Enter\') EventParticipantMessages.submitReply(\'' + m.id + '\')">',
                '<button class="btn-primary" style="width:auto; padding:10px 20px; white-space:nowrap" onclick="EventParticipantMessages.submitReply(\'' + m.id + '\')">',
                  'Kirim Balasan',
                '</button>',
              '</div>',
            '</div>'
          );
        });
        html.push('</div>');
      }

      html.push('</div>');
      return html.join('');
    },

    submitReply: function(msgId) {
      var input = document.getElementById('reply-msg-' + msgId);
      var text = (input ? input.value : '').trim();
      var user = Store.getCurrentUser();

      if (!text) return;

      try {
        Store.replyMessage(msgId, text, user);
        Store.logActivity('Balas Pesan', 'Membalas pesan ID: ' + msgId, user);
        if (Sound) Sound.playSuccess();
        Router.showToast('Balasan terkirim ke penyelenggara!', 'success');
        if (input) input.value = '';
        EventHub.renderApp();
      } catch (err) {
        if (Sound) Sound.playError();
        Router.showToast(err.message, 'error');
      }
    }
  };

  window.EventParticipantMessages = ParticipantMessages;
})(window);
