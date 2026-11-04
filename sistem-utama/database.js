/**
 * EventHub Pro - Reactive State & LocalStorage Store
 * Complete data persistence with pre-seeded Indonesian events, users, tickets, and refund requests
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'eventhub_clean_zero_v7';
  var AUTH_KEY = 'eventhub_clean_zero_auth_v7';

  // AUTOMATIC PURGE: Hapus tuntas seluruh sisa data demo lama di localStorage browser pengunjung
  try {
    ['eventhub_pro_v2_db', 'eventhub_pro_db', 'eventhub_pro_v3_clean', 'eventhub_pro_v2_auth', 'eventhub_pro_v3_auth', 'eventhub_auth'].forEach(function(k){
      localStorage.removeItem(k);
    });
  } catch (e) {}

  var INITIAL_DATA = {
    // HANYA AKUN ROOT ADMIN (Seluruh akun demo dibersihkan total)
    users: [
      {
        id: 'usr-admin',
        name: 'EventHub Super Administrator',
        email: 'admin@eventhub.id',
        password: 'admin123',
        role: 'superadmin',
        phone: '08001234567',
        company: 'EventHub Enterprise',
        status: 'active',
        rejectionReason: '',
        avatarText: 'AD',
        verified: true,
        subscription: null,
        createdAt: '2026-01-01'
      }
    ],

    // 100% KOSONG BERSIH DARI NOL (0)
    events: [],
    tickets: [],
    refundRequests: [],
    vouchers: [],
    scanLogs: [],
    bookmarks: [],
    messages: [],
    feedbacks: [],

    activityLogs: [
      {
        id: 'ACT-INIT',
        timestamp: '2026-11-04 10:00 WIB',
        userName: 'Administrator Sistem (Privat)',
        userEmail: 'admin@private.internal',
        userRole: 'system',
        action: 'Sistem Diinisialisasi Bersih',
        details: 'Platform EventHub siap digunakan mulai dari nol (0). Seluruh data event dan akun pengujian telah dibersihkan.',
        status: 'success'
      }
    ],
    heroConfig: {
      badgeText: 'Platform Tiket & Event Terpercaya #1 di Indonesia',
      title1: 'Tiket Resmi, Akses Cepat,',
      title2: 'Tanpa Biaya Tersembunyi.',
      description: 'Rasakan getaran panggung spektakuler, gemuruh sorak penonton, dan momen magis konser impian Anda! Dapatkan tiket resmi festival musik, turnamen esports bergengsi, dan konferensi akbar nasional dengan garansi kode QR instan, keamanan berlapis, serta kemudahan refund terpercaya.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-audience-at-a-music-concert-holding-lights-42537-large.mp4',
      videoPoster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
      showVideo: true,
      updatedAt: '2026-11-04 10:00 WIB'
    },
    maintenance: {
      active: false,
      message: 'Sistem EventHub sedang dalam pemeliharaan berkala untuk peningkatan performa infrastruktur server.',
      estimatedEnd: 'Sekitar 1-2 jam ke depan',
      updatedAt: '2026-11-04 10:00 WIB'
    },
    memberships: [
      { id: 'silver', name: 'Silver Express', price: 29000, badgeColor: '#94a3b8', icon: '🥈', badgeText: 'SILVER', benefits: ['Akses Fast-Track Gate Masuk (1x per bulan)', 'Diskon tiket 5% untuk semua acara', 'Badge eksklusif Silver Member di E-Tiket', 'Customer Support prioritas standar'] },
      { id: 'gold', name: 'Gold VIP Pass', price: 59000, badgeColor: '#fbbf24', popular: true, icon: '🥇', badgeText: 'GOLD VIP', benefits: ['Akses Fast-Track UNLIMITED di semua gate masuk acara', 'Akses Presale H-2 sebelum penjualan dibuka ke publik', 'Diskon tiket 10% setiap pembelian', 'Gratis welcome drink di VIP zone acara', 'Badge emas Gold VIP Member berkilau di header & tiket'] },
      { id: 'platinum', name: 'Platinum Black Access', price: 99000, badgeColor: '#ec4899', icon: '👑', badgeText: 'PLATINUM', benefits: ['Jalur Prioritas VVIP Gate (Zero Wait Time)', 'Akses VIP Lounge & Sesi Soundcheck Artis', 'Diskon tiket 15% setiap pembelian', 'Bebas biaya layanan platform (0% service fee)', 'Jaminan refund instan 100% tanpa potongan', 'Badge eksklusif Platinum Black Member di header & tiket'] }
    ]
  };

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.events) && Array.isArray(parsed.users)) {
          // Jika terdapat sisa data demo event lama, bersihkan tuntas
          if (parsed.events.some(function(e){ return e.id === 'EVT-BAT0' || e.id === 'EVT-F6OQ' || e.id === 'EVT-TECH' || e.id === 'EVT-ART0' || e.id === 'EVT-JZZ' || e.id === 'EVT-ESP' || e.id === 'EVT-HCK' || e.id === 'EVT-UXW'; })) {
            saveData(INITIAL_DATA);
            return JSON.parse(JSON.stringify(INITIAL_DATA));
          }
          if (!parsed.activityLogs || !parsed.activityLogs.length) parsed.activityLogs = JSON.parse(JSON.stringify(INITIAL_DATA.activityLogs || []));
          if (!parsed.messages || !parsed.messages.length) parsed.messages = JSON.parse(JSON.stringify(INITIAL_DATA.messages || []));
          if (!parsed.feedbacks || !parsed.feedbacks.length) parsed.feedbacks = JSON.parse(JSON.stringify(INITIAL_DATA.feedbacks || []));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored EventHub data, resetting to seed:', e);
    }
    saveData(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  var syncDebounceTimer = null;
  function syncWithBackend(data, immediateSync) {
    if (typeof fetch === 'undefined') return;
    clearTimeout(syncDebounceTimer);
    var doSync = function() {
      try {
        fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(function() {});
      } catch (e) {}
    };
    if (immediateSync) {
      doSync();
    } else {
      syncDebounceTimer = setTimeout(doSync, 300);
    }
  }

  function saveData(data, immediateSync) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
    syncWithBackend(data, immediateSync);
  }

  async function hydrateFromBackend() {
    if (typeof fetch === 'undefined') return;
    try {
      var res = await fetch('/api/db/export');
      if (res.ok) {
        var serverDb = await res.json();
        if (serverDb && Array.isArray(serverDb.users) && serverDb.users.length > 0) {
          var localEventsCount = (DB.events ? DB.events.length : 0);
          var serverEventsCount = (serverDb.events ? serverDb.events.length : 0);
          if (serverEventsCount >= localEventsCount) {
            DB = serverDb;
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); } catch (e) {}
            if (window.EventHub && window.EventHub.renderApp) {
              window.EventHub.renderApp();
            }
          } else {
            syncWithBackend(DB);
          }
        }
      }
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    setTimeout(hydrateFromBackend, 200);
  }

  function loadAuth() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    // Default to unauthenticated guest so visitor is prompted to log in/register before picking tickets!
    return null;
  }

  function saveAuth(user) {
    try {
      if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {}
  }

  var DB = loadData();
  var currentUser = loadAuth();

  var Store = {
    seedDemoData: async function() {
      if (typeof fetch !== 'undefined') {
        try {
          var res = await fetch('/api/db/seed-demo', { method: 'POST' });
          var data = await res.json();
          await hydrateFromBackend();
          return data;
        } catch (e) {}
      }
      DB = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveData(DB);
      if (window.EventHub && window.EventHub.renderApp) {
        window.EventHub.renderApp();
      }
      return { success: true, message: 'Data demo berhasil dimuat.' };
    },

    resetDemoData: function() {
      DB = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveData(DB);
      currentUser = null;
      saveAuth(null);
      if (typeof fetch !== 'undefined') {
        fetch('/api/db/seed-demo', { method: 'POST' }).catch(function() {});
      }
      return true;
    },

    purgeAllDemoData: async function() {
      DB = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveData(DB);
      if (typeof fetch !== 'undefined') {
        try {
          var res = await fetch('/api/db/purge-demo', { method: 'POST' });
          return await res.json();
        } catch (e) {
          return { success: true, message: 'Data demo lokal telah dibersihkan.' };
        }
      }
      return { success: true, message: 'Data demo lokal telah dibersihkan.' };
    },

    getData: function() { return DB; },
    // PRIVASI DATA ADMIN: Akun superadmin tidak pernah diekspos sembarangan ke publik
    getUsers: function(callingUser) {
      var u = callingUser || currentUser;
      if (u && u.role === 'superadmin') {
        return DB.users;
      }
      return DB.users.filter(function(usr) { return usr.role !== 'superadmin'; });
    },
    getPublicUsers: function() {
      return DB.users.filter(function(usr) { return usr.role !== 'superadmin'; });
    },
    getEvents: function() { return DB.events; },
    getTickets: function() { return DB.tickets; },
    getRefundRequests: function() { return DB.refundRequests; },
    getVouchers: function() { return DB.vouchers; },
    getScanLogs: function() { return DB.scanLogs; },
    getBookmarks: function() { return DB.bookmarks || []; },

    getCurrentUser: function() { return currentUser; },
    setCurrentUser: function(user) {
      currentUser = user;
      saveAuth(user);
    },
    logout: function() {
      currentUser = null;
      saveAuth(null);
    },

    registerUser: function(userData) {
      var name = (userData.name || '').trim();
      if (!name || name.length < 3) {
        throw new Error('Nama lengkap tidak valid: Minimal harus 3 karakter.');
      }
      if (!/^[a-zA-Z\s'.]+$/.test(name)) {
        throw new Error('Nama lengkap hanya boleh berisi huruf dan spasi.');
      }

      var email = (userData.email || '').trim().toLowerCase();
      var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        throw new Error('Format email tidak valid. Gunakan format yang benar, contoh: nama@gmail.com');
      }

      var exists = DB.users.some(function(u) { return u.email === email; });
      if (exists) {
        throw new Error('Email ' + email + ' sudah terdaftar. Silakan gunakan email lain atau langsung masuk.');
      }

      var password = userData.password || '';
      if (!password || password.length < 8) {
        throw new Error('Kata sandi terlalu pendek: Minimal harus 8 karakter.');
      }
      var hasLetter = /[a-zA-Z]/.test(password);
      var hasNumber = /[0-9]/.test(password);
      if (!hasLetter || !hasNumber) {
        throw new Error('Kata sandi harus mengandung kombinasi huruf dan angka (contoh: Password123).');
      }
      var role = userData.role || 'peserta';
      var isOrganizer = role === 'penyelenggara';
      var newUser = {
        id: 'usr-' + Date.now().toString(36),
        name: userData.name.trim(),
        email: email,
        password: userData.password,
        role: role,
        phone: userData.phone || '',
        avatarText: userData.name.split(' ').map(function(s){ return s[0]; }).join('').toUpperCase().slice(0, 2),
        company: userData.company || '',
        verified: !isOrganizer,
        status: isOrganizer ? 'pending_approval' : 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      DB.users.push(newUser);
      saveData(DB);
      if (!isOrganizer) {
        this.setCurrentUser(newUser);
      }
      return newUser;
    },
    createOrganizerByAdmin: function(organizerData) {
      var email = (organizerData.email || '').trim().toLowerCase();
      var exists = DB.users.some(function(u) { return u.email === email; });
      if (exists) {
        throw new Error('Email ' + email + ' sudah terdaftar di sistem.');
      }
      var newOrg = {
        id: 'usr-org-' + Date.now().toString(36),
        name: organizerData.name.trim(),
        email: email,
        password: organizerData.password || 'password123',
        role: 'penyelenggara',
        phone: organizerData.phone || '',
        avatarText: organizerData.name.split(' ').map(function(s){ return s[0]; }).join('').toUpperCase().slice(0, 2),
        company: organizerData.company || organizerData.name.trim(),
        verified: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      DB.users.push(newOrg);
      saveData(DB);
      return newOrg;
    },

    loginUser: function(email, password) {
      email = (email || '').trim().toLowerCase();
      var user = DB.users.find(function(u) { return u.email === email; });
      if (!user || user.password !== password) {
        throw new Error('Email atau kata sandi tidak cocok.');
      }
      if (user.role === 'penyelenggara') {
        if (user.status === 'pending_approval') {
          throw new Error('Akun penyelenggara Anda (' + email + ') masih menunggu persetujuan (approval) dari Administrator Platform EventHub.');
        }
        if (user.status === 'rejected') {
          throw new Error('Pendaftaran akun penyelenggara Anda telah ditolak oleh Administrator: ' + (user.rejectionReason || 'Tidak memenuhi syarat.'));
        }
      }
      this.setCurrentUser(user);
      return user;
    },

    getPendingOrganizers: function() {
      return DB.users.filter(function(u) {
        return u.role === 'penyelenggara' && u.status === 'pending_approval';
      });
    },

    approveOrganizer: function(organizerEmail, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Hanya Super Administrator yang berhak menyetujui akun penyelenggara.');
      }
      var org = DB.users.find(function(u) {
        return u.email.toLowerCase() === organizerEmail.toLowerCase();
      });
      if (!org) throw new Error('Akun penyelenggara tidak ditemukan.');
      org.status = 'active';
      org.verified = true;
      saveData(DB);
      this.logActivity('Setujui Penyelenggara', 'Admin menyetujui akun penyelenggara: ' + (org.company || org.name) + ' (' + org.email + ')', adminUser);
      return org;
    },

    rejectOrganizer: function(organizerEmail, reason, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Hanya Super Administrator yang berhak menolak akun penyelenggara.');
      }
      var org = DB.users.find(function(u) {
        return u.email.toLowerCase() === organizerEmail.toLowerCase();
      });
      if (!org) throw new Error('Akun penyelenggara tidak ditemukan.');
      org.status = 'rejected';
      org.rejectionReason = reason || 'Data organisasi tidak memenuhi syarat.';
      saveData(DB);
      this.logActivity('Tolak Penyelenggara', 'Admin menolak akun ' + org.email + ' (Alasan: ' + org.rejectionReason + ')', adminUser);
      return org;
    },

    updateUserProfile: function(updatedFields) {
      if (!currentUser) return null;
      var user = DB.users.find(function(u) { return u.email === currentUser.email; });
      if (!user) return null;

      Object.assign(user, updatedFields);
      if (updatedFields.name) {
        user.avatarText = updatedFields.name.split(' ').map(function(s){ return s[0]; }).join('').toUpperCase().slice(0, 2);
      }
      currentUser = Object.assign({}, user);
      saveAuth(currentUser);
      saveData(DB);
      return currentUser;
    },

    changePassword: function(oldPw, newPw, user) {
      if (!user) throw new Error('Silakan masuk terlebih dahulu.');
      var u = DB.users.find(function(x) { return x.email.toLowerCase() === user.email.toLowerCase(); });
      if (!u) throw new Error('Pengguna tidak ditemukan.');
      if (u.password !== oldPw) throw new Error('Kata sandi lama salah.');
      if (!newPw || newPw.length < 8) throw new Error('Kata sandi baru minimal harus 8 karakter.');
      if (!/[a-zA-Z]/.test(newPw) || !/[0-9]/.test(newPw)) throw new Error('Kata sandi baru harus kombinasi huruf dan angka.');
      u.password = newPw;
      if (currentUser && currentUser.email.toLowerCase() === user.email.toLowerCase()) {
        currentUser.password = newPw;
        saveAuth(currentUser);
      }
      saveData(DB);
      return true;
    },

    // EVENT SCOPING - Critical Requirement: Organizer ONLY sees their own events
    getOrganizerEvents: function(organizerEmail) {
      if (!organizerEmail) return [];
      return DB.events.filter(function(e) {
        return e.organizerEmail.toLowerCase() === organizerEmail.toLowerCase();
      });
    },

    getEventById: function(eventId) {
      return DB.events.find(function(e) { return e.id === eventId; }) || null;
    },

    canManageEvent: function(user, eventId) {
      if (!user) return false;
      if (user.role === 'superadmin') return true;
      if (user.role !== 'penyelenggara') return false;
      var ev = this.getEventById(eventId);
      return ev && ev.organizerEmail.toLowerCase() === user.email.toLowerCase();
    },

    createEvent: function(eventPayload, organizerUser) {
      if (!organizerUser || (organizerUser.role !== 'penyelenggara' && organizerUser.role !== 'superadmin')) {
        throw new Error('Hanya akun penyelenggara atau administrator yang dapat membuat event.');
      }

      var id = 'EVT-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      var newEvent = {
        id: id,
        organizerEmail: organizerUser.email,
        organizerName: organizerUser.name,
        title: eventPayload.title,
        category: eventPayload.category || 'Musik',
        date: eventPayload.date,
        time: eventPayload.time || '19:00 WIB',
        city: eventPayload.city || 'Bandung',
        venue: eventPayload.venue,
        gradient: eventPayload.gradient || 'linear-gradient(135deg, #1e1b4b, #4338ca, #312e81)',
        badgeColor: eventPayload.badgeColor || '#6366f1',
        bannerImg: eventPayload.bannerImg || '',
        description: eventPayload.description || '',
        terms: eventPayload.terms || 'Bawa e-tiket QR dan identitas resmi.',
        featured: false,
        rating: 5.0,
        reviewsCount: 0,
        tiers: eventPayload.tiers && eventPayload.tiers.length ? eventPayload.tiers : [
          {
            id: 'tier-' + Date.now() + '-1',
            name: 'Regular Ticket',
            price: Number(eventPayload.price) || 50000,
            quota: Number(eventPayload.quota) || 100,
            sold: 0,
            description: 'Akses masuk venue acara',
            status: 'available'
          }
        ]
      };

      DB.events.unshift(newEvent);
      saveData(DB);
      return newEvent;
    },

    updateEvent: function(eventId, updatedFields, user) {
      if (!this.canManageEvent(user, eventId)) {
        throw new Error('Akses ditolak: Anda hanya dapat mengelola event milik Anda sendiri.');
      }
      var ev = this.getEventById(eventId);
      if (!ev) throw new Error('Event tidak ditemukan');

      Object.assign(ev, updatedFields);
      saveData(DB);
      return ev;
    },

    deleteEvent: function(eventId, user, force) {
      if (!this.canManageEvent(user, eventId)) {
        throw new Error('Akses ditolak: Anda hanya dapat menghapus event milik Anda sendiri.');
      }
      var hasSold = DB.tickets.some(function(t) { return t.eventId === eventId && t.status !== 'refunded'; });
      if (hasSold && !force) {
        throw new Error('Event sudah memiliki tiket terjual. Konfirmasi penghapusan diperlukan.');
      }
      // Cascade delete related records
      DB.tickets = (DB.tickets || []).filter(function(t) { return t.eventId !== eventId; });
      DB.refundRequests = (DB.refundRequests || []).filter(function(r) { return r.eventId !== eventId; });
      DB.vouchers = (DB.vouchers || []).filter(function(v) { return v.eventId !== eventId; });
      DB.messages = (DB.messages || []).filter(function(m) { return m.eventId !== eventId; });
      DB.events = (DB.events || []).filter(function(e) { return e.id !== eventId; });

      try {
        fetch('/api/events/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: eventId })
        }).catch(function() {});
      } catch (e) {}

      saveData(DB, true);
      return true;
    },

    // TICKET TIER MANAGEMENT
    addEventTier: function(eventId, tierData, user) {
      if (!this.canManageEvent(user, eventId)) {
        throw new Error('Akses ditolak: Anda hanya dapat mengedit tiket event Anda sendiri.');
      }
      var ev = this.getEventById(eventId);
      if (!ev) throw new Error('Event tidak ditemukan');

      var newTier = {
        id: 'tier-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*100),
        name: tierData.name.trim(),
        price: Number(tierData.price),
        quota: Number(tierData.quota),
        sold: 0,
        description: tierData.description || 'Akses masuk event',
        status: 'available'
      };

      ev.tiers.push(newTier);
      saveData(DB);
      return newTier;
    },

    updateEventTier: function(eventId, tierId, updatedData, user) {
      if (!this.canManageEvent(user, eventId)) {
        throw new Error('Akses ditolak: Anda hanya dapat mengubah harga tiket event Anda sendiri.');
      }
      var ev = this.getEventById(eventId);
      if (!ev) throw new Error('Event tidak ditemukan');

      var tier = ev.tiers.find(function(t) { return t.id === tierId; });
      if (!tier) throw new Error('Kategori tiket tidak ditemukan');

      if (updatedData.price !== undefined) {
        tier.price = Number(updatedData.price);
      }
      if (updatedData.quota !== undefined) {
        var newQuota = Number(updatedData.quota);
        if (newQuota < tier.sold) {
          throw new Error('Kuota tiket baru (' + newQuota + ') tidak boleh lebih kecil dari jumlah tiket terjual (' + tier.sold + ').');
        }
        tier.quota = newQuota;
      }
      if (updatedData.name !== undefined) tier.name = updatedData.name.trim();
      if (updatedData.description !== undefined) tier.description = updatedData.description;
      if (updatedData.status !== undefined) tier.status = updatedData.status;

      saveData(DB);
      return tier;
    },

    deleteEventTier: function(eventId, tierId, user) {
      if (!this.canManageEvent(user, eventId)) {
        throw new Error('Akses ditolak.');
      }
      var ev = this.getEventById(eventId);
      if (!ev) throw new Error('Event tidak ditemukan');

      var tier = ev.tiers.find(function(t) { return t.id === tierId; });
      if (!tier) throw new Error('Tier tidak ditemukan');
      if (tier.sold > 0) {
        throw new Error('Kategori tiket ini tidak dapat dihapus karena sudah ada ' + tier.sold + ' tiket terjual. Anda bisa menonaktifkannya.');
      }

      ev.tiers = ev.tiers.filter(function(t) { return t.id !== tierId; });
      saveData(DB);
      return true;
    },

    // TICKET PURCHASES
    purchaseTickets: function(orderPayload, buyerUser) {
      if (!buyerUser) throw new Error('Silakan masuk terlebih dahulu untuk membeli tiket.');
      if (buyerUser.role === 'penyelenggara') {
        throw new Error('Akun penyelenggara tidak dapat membeli tiket. Silakan gunakan akun peserta.');
      }

      var ev = this.getEventById(orderPayload.eventId);
      if (!ev) throw new Error('Event tidak valid');

      var tier = ev.tiers.find(function(t) { return t.id === orderPayload.tierId; });
      if (!tier) throw new Error('Kategori tiket tidak valid');

      var qty = Number(orderPayload.quantity) || 1;
      var remaining = tier.quota - tier.sold;
      if (remaining < qty) {
        throw new Error('Kuota tiket tidak mencukupi. Sisa tiket: ' + remaining);
      }

      var unitPrice = Number(orderPayload.unitPrice !== undefined ? orderPayload.unitPrice : tier.price);
      var subtotal = unitPrice * qty;
      var feePerTicket = Math.round(unitPrice * 0.05);

      var createdTickets = [];
      var orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random()*900 + 100);

      for (var i = 0; i < qty; i++) {
        var randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        var ticketCode = 'EH-' + ev.id.replace('EVT-', '') + '-' + randomCode;
        var ticket = {
          id: 'TIX-' + Date.now().toString(36) + '-' + i,
          code: ticketCode,
          orderId: orderId,
          eventId: ev.id,
          eventName: ev.title,
          organizerEmail: ev.organizerEmail,
          tierId: tier.id,
          tierName: tier.name,
          price: unitPrice,
          fee: feePerTicket,
          buyerEmail: buyerUser.email,
          buyerName: buyerUser.name,
          buyerPhone: buyerUser.phone || orderPayload.phone || '',
          paymentMethod: orderPayload.paymentMethod || 'QRIS',
          paymentStatus: 'paid',
          status: 'valid',
          usedAt: null,
          usedBy: null,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        DB.tickets.unshift(ticket);
        createdTickets.push(ticket);
      }

      tier.sold += qty;
      if (tier.sold >= tier.quota) {
        tier.status = 'sold_out';
      }

      if (orderPayload.voucherCode) {
        var v = DB.vouchers.find(function(x) { return x.code === orderPayload.voucherCode; });
        if (v) v.used += qty;
      }

      saveData(DB);
      return {
        orderId: orderId,
        tickets: createdTickets,
        totalPaid: (unitPrice + feePerTicket) * qty
      };
    },

    getUserTickets: function(userEmail) {
      if (!userEmail) return [];
      return DB.tickets.filter(function(t) {
        return t.buyerEmail.toLowerCase() === userEmail.toLowerCase();
      });
    },

    // QR SCANNING / CHECK-IN VALIDATION
    scanTicket: function(ticketCode, activeEventId, organizerEmail) {
      ticketCode = (ticketCode || '').trim().toUpperCase();
      var nowStr = new Date().toLocaleString('id-ID');

      if (!ticketCode) {
        return {
          status: 'error',
          code: 'EMPTY',
          message: 'Kode tiket tidak boleh kosong.'
        };
      }

      var ticket = DB.tickets.find(function(t) { return t.code === ticketCode; });

      if (!ticket) {
        var logEntry = {
          id: 'log-' + Date.now(),
          ticketCode: ticketCode,
          eventId: activeEventId,
          status: 'error',
          message: 'Tiket tidak ditemukan di sistem.',
          scannedAt: nowStr,
          scannedBy: organizerEmail
        };
        DB.scanLogs.unshift(logEntry);
        saveData(DB);
        return {
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Tiket tidak ditemukan! Kode ini tidak terdaftar di sistem EventHub.'
        };
      }

      var ev = this.getEventById(ticket.eventId);
      var isSuperAdmin = currentUser && currentUser.role === 'superadmin';

      if (!isSuperAdmin && organizerEmail && ticket.organizerEmail.toLowerCase() !== organizerEmail.toLowerCase()) {
        return {
          status: 'warning',
          code: 'WRONG_ORGANIZER',
          ticket: ticket,
          message: 'Tiket ini adalah milik penyelenggara lain (' + (ev ? ev.organizerName : ticket.organizerEmail) + ').'
        };
      }

      if (!isSuperAdmin && activeEventId && ticket.eventId !== activeEventId) {
        var targetEv = this.getEventById(activeEventId);
        return {
          status: 'warning',
          code: 'WRONG_EVENT',
          ticket: ticket,
          message: 'Tiket ini terdaftar untuk acara: "' + ticket.eventName + '", bukan untuk acara yang sedang Anda scan (' + (targetEv ? targetEv.title : activeEventId) + ').'
        };
      }

      if (ticket.status === 'refunded') {
        var logRefund = {
          id: 'log-' + Date.now(),
          ticketCode: ticketCode,
          eventId: ticket.eventId,
          status: 'error',
          message: 'Ditolak: Tiket sudah direfund.',
          scannedAt: nowStr,
          scannedBy: organizerEmail
        };
        DB.scanLogs.unshift(logRefund);
        saveData(DB);
        return {
          status: 'error',
          code: 'REFUNDED',
          ticket: ticket,
          message: 'Ditolak! Tiket ini sudah disetujui refund dan tidak berlaku lagi untuk masuk.'
        };
      }

      if (ticket.status === 'refund_pending') {
        return {
          status: 'warning',
          code: 'REFUND_PENDING',
          ticket: ticket,
          message: 'Perhatian: Tiket ini sedang dalam proses pengajuan refund oleh peserta. Harap selesaikan status refund terlebih dahulu.'
        };
      }

      if (ticket.status === 'used' || ticket.usedAt) {
        var logUsed = {
          id: 'log-' + Date.now(),
          ticketCode: ticketCode,
          eventId: ticket.eventId,
          status: 'error',
          message: 'Ditolak: Tiket sudah dipakai pada ' + (ticket.usedAt || 'sebelumnya'),
          scannedAt: nowStr,
          scannedBy: organizerEmail
        };
        DB.scanLogs.unshift(logUsed);
        saveData(DB);
        return {
          status: 'error',
          code: 'ALREADY_USED',
          ticket: ticket,
          message: 'Ditolak! Tiket sudah pernah di-scan sebelumnya pada: ' + (ticket.usedAt || 'Sesi Sebelumnya') + '.'
        };
      }

      ticket.status = 'used';
      ticket.usedAt = nowStr;
      ticket.usedBy = organizerEmail || 'Scanner Gate #1';

      var logSuccess = {
        id: 'log-' + Date.now(),
        ticketCode: ticketCode,
        eventId: ticket.eventId,
        status: 'valid',
        message: 'Check-in Berhasil (' + ticket.buyerName + ' - ' + ticket.tierName + ')',
        scannedAt: nowStr,
        scannedBy: organizerEmail
      };
      DB.scanLogs.unshift(logSuccess);
      saveData(DB);

      return {
        status: 'success',
        code: 'VALID',
        ticket: ticket,
        message: 'VALID! Check-in berhasil. Selamat menikmati acara, ' + ticket.buyerName + '!'
      };
    },

    // FITUR MULTIFUNGSI SCANNER SUPER ADMINISTRATOR (OVERRIDE, RESET, FORCE CHECK-IN, QUICK REFUND)
    adminResetTicket: function(ticketCode, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Akses dibatasi: Hanya Super Administrator yang berhak mereset status tiket.');
      }
      var ticket = DB.tickets.find(function(t) { return t.code === ticketCode; });
      if (!ticket) throw new Error('Tiket tidak ditemukan.');

      ticket.status = 'valid';
      ticket.usedAt = null;
      ticket.usedBy = null;
      saveData(DB);
      this.logActivity('Reset Status Tiket', 'Admin mereset tiket ' + ticketCode + ' (' + ticket.buyerName + ') menjadi VALID kembali', adminUser);
      return ticket;
    },

    adminForceCheckIn: function(ticketCode, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Akses dibatasi: Hanya Super Administrator yang berhak memaksakan check-in tiket.');
      }
      var ticket = DB.tickets.find(function(t) { return t.code === ticketCode; });
      if (!ticket) throw new Error('Tiket tidak ditemukan.');

      ticket.status = 'used';
      ticket.usedAt = new Date().toLocaleString('id-ID');
      ticket.usedBy = 'Super Admin Override (' + adminUser.name + ')';
      saveData(DB);
      this.logActivity('Force Check-in Tiket', 'Admin melakukan bypass check-in manual pada tiket ' + ticketCode + ' (' + ticket.buyerName + ')', adminUser);
      return ticket;
    },

    adminQuickRefund: function(ticketCode, reason, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Akses dibatasi: Hanya Super Administrator yang berhak memproses refund kilat admin.');
      }
      var ticket = DB.tickets.find(function(t) { return t.code === ticketCode; });
      if (!ticket) throw new Error('Tiket tidak ditemukan.');

      ticket.status = 'refunded';
      var ev = this.getEventById(ticket.eventId);
      if (ev) {
        var tier = ev.tiers.find(function(tr){ return tr.id === ticket.tierId; });
        if (tier && tier.sold > 0) tier.sold -= 1;
      }

      var refundEntry = {
        id: 'REF-' + Date.now().toString(36).toUpperCase(),
        ticketId: ticket.id,
        ticketCode: ticket.code,
        eventId: ticket.eventId,
        eventName: ticket.eventName,
        organizerEmail: ticket.organizerEmail,
        buyerEmail: ticket.buyerEmail,
        buyerName: ticket.buyerName,
        buyerPhone: ticket.buyerPhone,
        tierName: ticket.tierName,
        originalPrice: ticket.price,
        fee: ticket.fee,
        refundAmount: ticket.price,
        reason: reason || 'Pembatalan Kilat oleh Super Administrator',
        reasonDetails: 'Refund langsung diproses melalui Scanner Hub Super Admin',
        bankName: ticket.paymentMethod || 'Refund Saldo Asal',
        accountNumber: 'REFUND-AUTO',
        accountHolder: ticket.buyerName,
        status: 'approved',
        organizerNote: 'Disetujui langsung oleh Administrator Sistem',
        createdAt: new Date().toLocaleString('id-ID'),
        updatedAt: new Date().toLocaleString('id-ID')
      };

      if (!DB.refundRequests) DB.refundRequests = [];
      DB.refundRequests.unshift(refundEntry);

      saveData(DB);
      this.logActivity('Refund Kilat Admin', 'Admin memproses refund penuh senilai Rp ' + ticket.price.toLocaleString('id-ID') + ' untuk tiket ' + ticketCode, adminUser);
      return ticket;
    },
    // REFUND LIFECYCLE
    requestRefund: function(ticketCode, refundPayload, buyerUser) {
      if (!buyerUser) throw new Error('Silakan masuk terlebih dahulu.');

      var ticket = DB.tickets.find(function(t) { return t.code === ticketCode; });
      if (!ticket) throw new Error('Tiket tidak ditemukan.');

      if (ticket.buyerEmail.toLowerCase() !== buyerUser.email.toLowerCase()) {
        throw new Error('Anda hanya bisa mengajukan refund untuk tiket milik Anda sendiri.');
      }

      if (ticket.status === 'used') {
        throw new Error('Tiket yang sudah digunakan / di-check in tidak dapat direfund.');
      }

      if (ticket.status === 'refund_pending') {
        throw new Error('Tiket ini sudah memiliki pengajuan refund yang sedang diproses.');
      }

      if (ticket.status === 'refunded') {
        throw new Error('Tiket ini sudah direfund sebelumnya.');
      }

      var refundId = 'REF-' + Math.floor(1000 + Math.random() * 9000);
      var req = {
        id: refundId,
        ticketId: ticket.id,
        ticketCode: ticket.code,
        eventId: ticket.eventId,
        eventName: ticket.eventName,
        organizerEmail: ticket.organizerEmail,
        buyerEmail: buyerUser.email,
        buyerName: buyerUser.name,
        buyerPhone: buyerUser.phone || '',
        tierName: ticket.tierName,
        originalPrice: ticket.price,
        fee: ticket.fee,
        refundAmount: ticket.price,
        reason: refundPayload.reason || 'Jadwal bentrok',
        reasonDetails: refundPayload.reasonDetails || '',
        bankName: refundPayload.bankName || 'BCA',
        accountNumber: refundPayload.accountNumber || '',
        accountHolder: refundPayload.accountHolder || buyerUser.name,
        status: 'pending',
        organizerNote: '',
        createdAt: new Date().toLocaleString('id-ID'),
        updatedAt: new Date().toLocaleString('id-ID')
      };

      ticket.status = 'refund_pending';
      DB.refundRequests.unshift(req);
      saveData(DB);
      return req;
    },

    getOrganizerRefunds: function(organizerEmail) {
      if (!organizerEmail) return [];
      return DB.refundRequests.filter(function(r) {
        return r.organizerEmail.toLowerCase() === organizerEmail.toLowerCase();
      });
    },

    getUserRefunds: function(userEmail) {
      if (!userEmail) return [];
      return DB.refundRequests.filter(function(r) {
        return r.buyerEmail.toLowerCase() === userEmail.toLowerCase();
      });
    },

    approveRefund: function(refundId, organizerNote, user) {
      var req = DB.refundRequests.find(function(r) { return r.id === refundId; });
      if (!req) throw new Error('Pengajuan refund tidak ditemukan');

      if (!this.canManageEvent(user, req.eventId)) {
        throw new Error('Akses ditolak: Anda hanya dapat memproses refund untuk event milik Anda.');
      }

      req.status = 'approved';
      req.organizerNote = organizerNote || 'Refund disetujui oleh penyelenggara. Dana akan dikembalikan ke rekening/e-wallet Anda.';
      req.updatedAt = new Date().toLocaleString('id-ID');

      var ticket = DB.tickets.find(function(t) { return t.id === req.ticketId || t.code === req.ticketCode; });
      if (ticket) {
        ticket.status = 'refunded';
      }

      var ev = this.getEventById(req.eventId);
      if (ev && ticket) {
        var tier = ev.tiers.find(function(t) { return t.id === ticket.tierId; });
        if (tier && tier.sold > 0) {
          tier.sold -= 1;
          if (tier.status === 'sold_out') tier.status = 'available';
        }
      }

      saveData(DB);
      return req;
    },

    rejectRefund: function(refundId, rejectionReason, user) {
      var req = DB.refundRequests.find(function(r) { return r.id === refundId; });
      if (!req) throw new Error('Pengajuan refund tidak ditemukan');

      if (!this.canManageEvent(user, req.eventId)) {
        throw new Error('Akses ditolak: Anda hanya dapat memproses refund untuk event milik Anda.');
      }

      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Harap sertakan alasan penolakan refund.');
      }

      req.status = 'rejected';
      req.organizerNote = rejectionReason.trim();
      req.updatedAt = new Date().toLocaleString('id-ID');

      var ticket = DB.tickets.find(function(t) { return t.id === req.ticketId || t.code === req.ticketCode; });
      if (ticket && ticket.status === 'refund_pending') {
        ticket.status = 'valid';
      }

      saveData(DB);
      return req;
    },

    // Vouchers
    addVoucher: function(voucherData, organizerUser) {
      if (!organizerUser || organizerUser.role !== 'penyelenggara') {
        throw new Error('Hanya penyelenggara yang dapat membuat voucher.');
      }
      var code = (voucherData.code || '').trim().toUpperCase();
      if (!code) throw new Error('Kode voucher tidak boleh kosong');

      if (DB.vouchers.some(function(v) { return v.code === code; })) {
        throw new Error('Kode voucher "' + code + '" sudah pernah digunakan.');
      }

      var v = {
        code: code,
        discountPercent: Number(voucherData.discountPercent) || 10,
        maxDiscount: Number(voucherData.maxDiscount) || 50000,
        minPurchase: Number(voucherData.minPurchase) || 0,
        eventId: voucherData.eventId || '*',
        quota: Number(voucherData.quota) || 50,
        used: 0,
        organizerEmail: organizerUser.email
      };

      DB.vouchers.push(v);
      saveData(DB);
      return v;
    },

    toggleBookmark: function(eventId) {
      if (!DB.bookmarks) DB.bookmarks = [];
      var idx = DB.bookmarks.indexOf(eventId);
      if (idx >= 0) {
        DB.bookmarks.splice(idx, 1);
      } else {
        DB.bookmarks.push(eventId);
      }
      saveData(DB);
      return DB.bookmarks.indexOf(eventId) >= 0;
    },

    isBookmarked: function(eventId) {
      return (DB.bookmarks || []).indexOf(eventId) >= 0;
    },

    // MESSAGING SYSTEM
    getMessages: function() {
      return DB.messages || [];
    },

    getUserMessages: function(userEmail) {
      if (!userEmail) return [];
      return (DB.messages || []).filter(function(m) {
        return m.senderEmail.toLowerCase() === userEmail.toLowerCase();
      });
    },

    getOrganizerMessages: function(organizerEmail) {
      if (!organizerEmail) return [];
      return (DB.messages || []).filter(function(m) {
        return m.organizerEmail.toLowerCase() === organizerEmail.toLowerCase();
      });
    },

    getAllMessagesForAdmin: function(user) {
      if (!user || user.role !== 'superadmin') {
        throw new Error('Hanya Super Administrator yang berhak mengawasi seluruh pesan platform.');
      }
      return DB.messages || [];
    },

    sendMessage: function(msgPayload, senderUser) {
      if (!senderUser) throw new Error('Silakan masuk terlebih dahulu untuk mengirim pesan.');
      var ev = this.getEventById(msgPayload.eventId);
      if (!ev) throw new Error('Event tidak ditemukan.');

      var nowStr = new Date().toLocaleString('id-ID');
      var newMsg = {
        id: 'MSG-' + Math.floor(100 + Math.random() * 900),
        eventId: ev.id,
        eventName: ev.title,
        organizerEmail: ev.organizerEmail,
        organizerName: ev.organizerName,
        senderEmail: senderUser.email,
        senderName: senderUser.name,
        subject: msgPayload.subject || ('Pertanyaan seputar ' + ev.title),
        thread: [
          {
            sender: senderUser.email,
            senderName: senderUser.name,
            text: msgPayload.text.trim(),
            time: nowStr
          }
        ],
        status: 'open',
        createdAt: nowStr,
        updatedAt: nowStr
      };

      if (!DB.messages) DB.messages = [];
      DB.messages.unshift(newMsg);
      saveData(DB);
      return newMsg;
    },

    replyMessage: function(msgId, replyText, senderUser) {
      if (!senderUser) throw new Error('Silakan masuk terlebih dahulu.');
      var msg = (DB.messages || []).find(function(m) { return m.id === msgId; });
      if (!msg) throw new Error('Pesan tidak ditemukan.');

      var nowStr = new Date().toLocaleString('id-ID');
      msg.thread.push({
        sender: senderUser.email,
        senderName: senderUser.name,
        text: replyText.trim(),
        time: nowStr
      });
      msg.status = senderUser.role === 'penyelenggara' ? 'replied' : 'open';
      msg.updatedAt = nowStr;

      saveData(DB);
      return msg;
    },

    // WEBSITE FEEDBACK SYSTEM (Hanya Admin yang berhak melihat hasil)
    submitWebsiteFeedback: function(feedbackPayload, user) {
      var rating = Number(feedbackPayload.rating) || 5;
      var comment = (feedbackPayload.comment || '').trim();
      var category = feedbackPayload.category || 'Tampilan & Fitur';

      if (!comment || comment.length < 5) {
        throw new Error('Mohon isi saran/masukan Anda minimal 5 karakter.');
      }

      var newFeedback = {
        id: 'FDB-' + Math.floor(100 + Math.random() * 900),
        userEmail: user ? user.email : 'anonim@eventhub.id',
        userName: user ? user.name : 'Pengunjung Tamu',
        userRole: user ? user.role : 'tamu',
        rating: rating,
        category: category,
        comment: comment,
        createdAt: new Date().toLocaleString('id-ID')
      };

      if (!DB.feedbacks) DB.feedbacks = [];
      DB.feedbacks.unshift(newFeedback);
      saveData(DB);
      return newFeedback;
    },

    getWebsiteFeedbacksForAdmin: function(user) {
      // HANYA ADMIN yang bisa melihat hasil feedback!
      if (!user || user.role !== 'superadmin') {
        return [];
      }
      return DB.feedbacks || [];
    },

    // REAL-TIME USER ACTIVITY MONITORING (HANYA ADMIN YANG BISA AKSES!)
    logActivity: function(action, details, user) {
      var nowStr = new Date().toLocaleString('id-ID');
      var u = user || currentUser;
      var isAdmin = u && u.role === 'superadmin';
      var entry = {
        id: 'ACT-' + Date.now().toString(36),
        timestamp: nowStr,
        // Privasikan data personal admin di log aktivitas
        userName: isAdmin ? 'Administrator Sistem (Privat)' : (u ? u.name : 'Pengunjung Tamu'),
        userEmail: isAdmin ? 'admin@private.internal' : (u ? u.email : 'guest@eventhub.id'),
        userRole: u ? u.role : 'tamu',
        action: action,
        details: details,
        status: action.toLowerCase().indexOf('tolak') >= 0 || action.toLowerCase().indexOf('error') >= 0 ? 'warning' : 'success'
      };

      if (!DB.activityLogs) DB.activityLogs = [];
      DB.activityLogs.unshift(entry);
      // Keep last 150 activities
      if (DB.activityLogs.length > 150) {
        DB.activityLogs = DB.activityLogs.slice(0, 150);
      }
      saveData(DB);
      return entry;
    },

    getActivityLogsForAdmin: function(user) {
      // HANYA ADMIN yang boleh melihat aktivitas peserta & penyelenggara!
      if (!user || user.role !== 'superadmin') {
        throw new Error('Akses dibatasi: Hanya Super Administrator yang berhak memantau log aktivitas platform.');
      }
      return DB.activityLogs || [];
    },

    // MAINTENANCE MODE (Khusus Super Admin)
    getMaintenanceMode: function() {
      if (!DB.maintenance) {
        DB.maintenance = {
          active: false,
          message: 'Sistem EventHub sedang dalam pemeliharaan rutin untuk peningkatan performa server.',
          estimatedEnd: 'Segera kembali dalam beberapa saat',
          updatedAt: new Date().toLocaleString('id-ID')
        };
      }
      return DB.maintenance;
    },

    setMaintenanceMode: function(active, message, estimatedEnd, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Akses dibatasi: Hanya Super Administrator yang berhak mengatur status pemeliharaan.');
      }
      if (!DB.maintenance) DB.maintenance = {};
      DB.maintenance.active = !!active;
      if (message) DB.maintenance.message = message.trim();
      if (estimatedEnd) DB.maintenance.estimatedEnd = estimatedEnd.trim();
      DB.maintenance.updatedAt = new Date().toLocaleString('id-ID');
      saveData(DB);
      this.logActivity('Mode Pemeliharaan', (active ? 'Admin MENGAKTIFKAN mode pemeliharaan platform' : 'Admin MENONAKTIFKAN mode pemeliharaan (sistem live kembali)'), adminUser);
      return DB.maintenance;
    },

    // FAST-TRACK VIP MEMBERSHIP SYSTEM
    getMemberships: function() {
      return DB.memberships || [];
    },

    // DAFTAR PESERTA YANG BERLANGGANAN (Dapat dilihat oleh Penyelenggara & Admin)
    getSubscribers: function() {
      return (DB.users || []).filter(function(u) {
        return u.role === 'peserta' && u.subscription && u.subscription.active;
      }).map(function(u) {
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '-',
          role: u.role,
          subscription: u.subscription
        };
      });
    },

    // EDIT HARGA & KETENTUAN PAKET SUBSCRIPTION (HANYA SUPER ADMIN)
    updateMembership: function(planId, updatedFields, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Akses ditolak: Hanya Super Administrator yang berhak mengubah harga dan paket subscription.');
      }
      if (!DB.memberships) DB.memberships = JSON.parse(JSON.stringify(INITIAL_DATA.memberships));
      var plan = DB.memberships.find(function(p){ return p.id === planId; });
      if (!plan) throw new Error('Paket membership tidak ditemukan: ' + planId);

      if (typeof updatedFields.price !== 'undefined') plan.price = Math.max(0, Number(updatedFields.price));
      if (updatedFields.name) plan.name = updatedFields.name.trim();
      if (updatedFields.badgeText) plan.badgeText = updatedFields.badgeText.trim();
      if (Array.isArray(updatedFields.benefits)) plan.benefits = updatedFields.benefits;
      if (typeof updatedFields.popular !== 'undefined') plan.popular = Boolean(updatedFields.popular);

      saveData(DB);
      this.logActivity('Ubah Harga Subscription', 'Super Admin memperbarui harga/rincian paket ' + plan.name + ' menjadi Rp ' + plan.price.toLocaleString('id-ID'), adminUser);
      return plan;
    },
    getUserSubscription: function(userEmail) {
      if (!userEmail) return null;
      var u = DB.users.find(function(x) { return x.email.toLowerCase() === userEmail.toLowerCase(); });
      return (u && u.subscription && u.subscription.active) ? u.subscription : null;
    },

    subscribePlan: function(planId, user) {
      if (!user) throw new Error('Silakan masuk terlebih dahulu untuk berlangganan Fast-Track VIP.');
      var plan = (DB.memberships || []).find(function(m) { return m.id === planId; });
      if (!plan) throw new Error('Paket membership tidak ditemukan.');

      var u = DB.users.find(function(x) { return x.email.toLowerCase() === user.email.toLowerCase(); });
      if (!u) throw new Error('Pengguna tidak ditemukan.');

      u.subscription = {
        planId: plan.id,
        planName: plan.name,
        badgeText: plan.badgeText,
        badgeColor: plan.badgeColor,
        active: true,
        fastTrack: true,
        discountPercent: plan.id === 'platinum' ? 15 : plan.id === 'gold' ? 10 : 5,
        startedAt: new Date().toISOString().split('T')[0],
        expiresAt: '2026-12-31'
      };

      if (currentUser && currentUser.email.toLowerCase() === u.email.toLowerCase()) {
        currentUser.subscription = u.subscription;
        saveAuth(currentUser);
      }

      saveData(DB);
      this.logActivity('Langganan VIP', 'Berhasil berlangganan paket ' + plan.name + ' (' + plan.badgeText + ')', u);
      return u.subscription;
    },

    // HERO BANNER CMS (HANYA SUPER ADMIN)
    getHeroConfig: function() {
      if (!DB.heroConfig) {
        DB.heroConfig = JSON.parse(JSON.stringify(INITIAL_DATA.heroConfig));
      }
      return DB.heroConfig;
    },

    updateHeroConfig: function(updatedData, adminUser) {
      if (!adminUser || adminUser.role !== 'superadmin') {
        throw new Error('Akses dibatasi: Hanya Super Administrator yang berhak mengedit konten Hero Banner.');
      }
      if (!DB.heroConfig) {
        DB.heroConfig = JSON.parse(JSON.stringify(INITIAL_DATA.heroConfig));
      }
      if (updatedData.badgeText) DB.heroConfig.badgeText = updatedData.badgeText.trim();
      if (updatedData.title1) DB.heroConfig.title1 = updatedData.title1.trim();
      if (updatedData.title2) DB.heroConfig.title2 = updatedData.title2.trim();
      if (updatedData.description) DB.heroConfig.description = updatedData.description.trim();
      if (typeof updatedData.videoUrl !== 'undefined') DB.heroConfig.videoUrl = updatedData.videoUrl.trim();
      if (typeof updatedData.videoPoster !== 'undefined') DB.heroConfig.videoPoster = updatedData.videoPoster.trim();
      if (typeof updatedData.showVideo !== 'undefined') DB.heroConfig.showVideo = Boolean(updatedData.showVideo);
      DB.heroConfig.updatedAt = new Date().toLocaleString('id-ID');

      saveData(DB);
      this.logActivity('Edit Hero Banner', 'Admin memperbarui teks dan background video pada Hero Banner Beranda', adminUser);
      return DB.heroConfig;
    },

    syncWithBackendNow: async function() {
      if (typeof fetch === 'undefined') return { success: false, error: 'No network fetch' };
      try {
        var res = await fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DB)
        });
        return await res.json();
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    getBackendDbStats: async function() {
      if (typeof fetch === 'undefined') return null;
      try {
        var res = await fetch('/api/db/status');
        return await res.json();
      } catch (err) {
        return null;
      }
    }
  };

  window.EventStore = Store;
})(window);
