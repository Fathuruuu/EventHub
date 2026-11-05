/**
 * EventHub Pro - Core Router, Preloader & Navigation Engine
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Sound = window.EventAudio;

  var App = {
    currentRoute: 'home',
    routeParam: null,
    searchQuery: '',
    selectedCategory: 'Semua',
    maxPrice: '',
    pendingEventId: null,
    authNotice: null,

    // Checkout State
    checkoutEventId: null,
    checkoutTierId: null,
    checkoutQty: 1,
    checkoutVoucherCode: '',
    checkoutVoucherDiscount: 0,
    checkoutPaymentMethod: 'QRIS',
    checkoutStep: 1,

    // Organizer State
    activeOrganizerEventId: null,
    lastScanResult: null,

    // Modal State
    activeModal: null,
    modalData: null
  };

  function formatRp(num) {
    if (isNaN(num)) num = 0;
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  }

  function showToast(message, type, duration) {
    type = type || 'success';
    duration = duration || 3200;

    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    var item = document.createElement('div');
    item.className = 'toast-item toast-' + type;

    var iconSvg = type === 'success'
      ? '<svg width="20" height="20" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
      : type === 'error'
      ? '<svg width="20" height="20" fill="none" stroke="#f43f5e" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-6 6M9 9l6 6"/></svg>'
      : '<svg width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';

    item.innerHTML = iconSvg + '<span>' + message + '</span>';
    container.appendChild(item);

    setTimeout(function() {
      item.style.opacity = '0';
      item.style.transform = 'translateX(100%)';
      item.style.transition = 'all 0.3s ease';
      setTimeout(function() {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 300);
    }, duration);
  }

  function triggerPreloader(message, duration, onComplete) {
    duration = duration || 800;
    var preloader = document.getElementById('app-preloader');
    var statusText = document.getElementById('preloader-status');
    var progressBar = document.getElementById('preloader-progress-bar');

    if (!preloader) {
      if (onComplete) onComplete();
      return;
    }

    if (statusText) statusText.textContent = message || 'Memuat...';
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      setTimeout(function() {
        progressBar.style.transition = 'width ' + (duration / 1000) + 's ease';
        progressBar.style.width = '100%';
      }, 30);
    }

    preloader.style.display = 'flex';
    preloader.classList.remove('fade-out');

    setTimeout(function() {
      preloader.classList.add('fade-out');
      setTimeout(function() {
        preloader.style.display = 'none';
      }, 450);
      if (onComplete) onComplete();
    }, duration);
  }

  var Icons = {
    ticket: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>',
    search: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/></svg>',
    calendar: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    mapPin: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21c-4.418-5.385-7-8.918-7-12a7 7 0 1114 0c0 3.082-2.582 6.615-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    qr: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>',
    scan: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>',
    refund: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>',
    check: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
    close: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
    sparkles: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
    plus: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>',
    download: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>',
    edit: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
  };

  function navigate(route, param) {
    if (Sound) Sound.playClick();
    var user = Store.getCurrentUser();

    // REQUIREMENT: Before entering ticket selection / event detail, redirect unauthenticated user to login/register first!
    if (route === 'detail' || route === 'checkout') {
      if (!user) {
        App.pendingEventId = param || App.checkoutEventId;
        App.authNotice = 'Silakan masuk atau daftar akun terlebih dahulu untuk memilih & membeli tiket acara ini.';
        EventHub.openAuthModal('login');
        triggerPreloader('Mempersiapkan Akses Tiket... Mohon Masuk / Daftar Akun Terlebih Dahulu', 750);
        return;
      }
    }

    if (route === 'tickets' || route === 'refunds' || route === 'messages' || route === 'profile') {
      if (!user) {
        App.authNotice = 'Silakan masuk untuk mengakses profil, tiket, dan pesan Anda.';
        EventHub.openAuthModal('login');
        triggerPreloader('Membuka Halaman...', 600);
        return;
      }
    }

    // REQUIREMENT: Peserta should NEVER access or see organizer or admin panel!
    if (route === 'organizer') {
      if (!user || (user.role !== 'penyelenggara' && user.role !== 'superadmin')) {
        showToast('Akses dibatasi: Hanya akun Penyelenggara yang dapat mengakses halaman ini.', 'error');
        App.currentRoute = 'home';
        EventHub.renderApp();
        return;
      }
    }

    if (route === 'admin') {
      if (!user || user.role !== 'superadmin') {
        showToast('Akses dibatasi: Hanya Super Admin yang dapat mengakses halaman ini.', 'error');
        App.currentRoute = 'home';
        EventHub.renderApp();
        return;
      }
    }

    if (window.EventScannerService && window.EventScannerService.isRunning()) {
      window.EventScannerService.stopCamera();
    }

    App.currentRoute = route;
    App.routeParam = param || null;

    EventHub.renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHeader() {
    var user = Store.getCurrentUser();
    var isPeserta = user && user.role === 'peserta';
    var isPenyelenggara = user && user.role === 'penyelenggara';
    var isSuperAdmin = user && user.role === 'superadmin';

    var myTickets = isPeserta ? Store.getUserTickets(user.email) : [];
    var pendingRefundCount = 0;

    if (isPenyelenggara) {
      var orgRefunds = Store.getOrganizerRefunds(user.email);
      pendingRefundCount = orgRefunds.filter(function(r) { return r.status === 'pending'; }).length;
    } else if (isPeserta) {
      var userRefunds = Store.getUserRefunds(user.email);
      pendingRefundCount = userRefunds.filter(function(r) { return r.status === 'pending'; }).length;
    }

    var sub = user ? Store.getUserSubscription(user.email) : null;
    var vipBadgeHtml = '';
    if (sub && sub.active) {
      var badgeClass = sub.planId === 'platinum' ? 'badge-platinum'
        : sub.planId === 'gold' ? 'badge-gold'
        : 'badge-silver';
      vipBadgeHtml = '<span class="brand-vip-badge ' + badgeClass + '">' + sub.badgeText + '</span>';
    }

    var html = [
      '<header class="app-header">',
        '<div class="header-container">',
          '<button class="brand-logo" onclick="EventHub.go(\'home\')">',
            '<div class="brand-icon-box">',
              '<img src="assets/logo.svg" alt="EventHub Logo" class="brand-logo-img">',
            '</div>',
            '<span class="text">Event<span class="highlight">Hub</span>' + vipBadgeHtml + '</span>',
          '</button>',
          '<nav class="main-nav">',
            '<button class="nav-link ' + (App.currentRoute === 'home' || App.currentRoute === 'detail' ? 'active' : '') + '" onclick="EventHub.go(\'home\')">',
              Icons.search, ' ' + (window.EventI18n ? window.EventI18n.t('nav_explore', 'Jelajahi') : 'Jelajahi'),
            '</button>',
            '<button class="nav-link ' + (App.currentRoute === 'favorites' ? 'active' : '') + '" onclick="EventHub.go(\'favorites\')">',
              '<span>❤️</span> ' + (window.EventI18n ? window.EventI18n.t('nav_favorites', 'Favorit') : 'Favorit'),
              (Store.getBookmarks().length ? '<span class="nav-badge" style="background:#ec4899">' + Store.getBookmarks().length + '</span>' : ''),
            '</button>',
            '<button class="nav-link ' + (App.currentRoute === 'fasttrack' ? 'active' : '') + '" onclick="EventHub.go(\'fasttrack\')">',
              '<span>⚡</span> ' + (window.EventI18n ? window.EventI18n.t('nav_fasttrack', 'Fast-Track VIP') : 'Fast-Track VIP'),
            '</button>'
    ];
    if (isPeserta) {
      var userMsgs = Store.getUserMessages(user.email);
      html.push(
        '<button class="nav-link ' + (App.currentRoute === 'tickets' ? 'active' : '') + '" onclick="EventHub.go(\'tickets\')">',
          Icons.ticket, ' ' + (window.EventI18n ? window.EventI18n.t('nav_tickets', 'Tiket Saya') : 'Tiket Saya'),
          myTickets.length ? '<span class="nav-badge">' + myTickets.length + '</span>' : '',
        '</button>',
        '<button class="nav-link ' + (App.currentRoute === 'refunds' ? 'active' : '') + '" onclick="EventHub.go(\'refunds\')">',
          Icons.refund, ' ' + (window.EventI18n ? window.EventI18n.t('nav_refunds', 'Refund') : 'Refund'),
          pendingRefundCount ? '<span class="nav-badge" style="background:#f59e0b">' + pendingRefundCount + '</span>' : '',
        '</button>',
        '<button class="nav-link ' + (App.currentRoute === 'messages' ? 'active' : '') + '" onclick="EventHub.go(\'messages\')">',
          '<span>💬</span> ' + (window.EventI18n ? window.EventI18n.t('nav_messages', 'Pesan & Tanya') : 'Pesan & Tanya'),
          userMsgs.length ? '<span class="nav-badge" style="background:#6366f1">' + userMsgs.length + '</span>' : '',
        '</button>',
        '<button class="nav-link ' + (App.currentRoute === 'profile' ? 'active' : '') + '" onclick="EventHub.go(\'profile\')">',
          '<span>👤</span> ' + (window.EventI18n ? window.EventI18n.t('nav_profile', 'Profil') : 'Profil'),
        '</button>'
      );
    }

    // ONLY for Penyelenggara: show Panel Penyelenggara
    if (isPenyelenggara) {
      html.push(
        '<button class="nav-link ' + (App.currentRoute === 'organizer' ? 'active' : '') + '" onclick="EventHub.go(\'organizer\')">',
          Icons.scan, ' Penyelenggara',
          pendingRefundCount ? '<span class="nav-badge" style="background:#f59e0b">' + pendingRefundCount + '</span>' : '',
        '</button>'
      );
    }

    // ONLY for Super Admin: show Platform Admin
    if (isSuperAdmin) {
      html.push(
        '<button class="nav-link ' + (App.currentRoute === 'admin' ? 'active' : '') + '" onclick="EventHub.go(\'admin\')">',
          '<span>🛡️</span> Admin',
        '</button>'
      );
    }

    html.push(
          '</nav>',
          '<div class="header-actions">',
            '<button type="button" class="btn-pwa-install" id="header-pwa-install-btn" onclick="EventHub.promptInstallApp()" title="Pasang Aplikasi EventHub di Perangkat">',
              '<span>📲</span> <span>Pasang App</span>',
            '</button>',
            (window.EventI18n ? window.EventI18n.renderLanguageSwitcher() : ''),
            '<button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem; border-color:rgba(255,255,255,0.15)" onclick="EventHub.openFeedbackModal()">',
              '⭐ Feedback',
            '</button>'
          );
    if (user) {
      html.push(
        '<button class="user-profile-btn" onclick="EventHub.go(\'profile\')" title="Buka Profil Saya">',
          '<div class="user-avatar-sm">' + (user.avatarText || user.name.charAt(0)) + '</div>',
          '<div class="user-info-text">',
            '<div class="user-info-name">' + user.name.split(' ')[0] + '</div>',
            '<span class="user-role-tag role-' + user.role + '">' + user.role + '</span>',
          '</div>',
        '</button>',
        '<button class="btn-secondary" style="padding:6px 12px; font-size:0.8rem; color:#fb7185; border-color:rgba(244,63,94,0.3)" onclick="EventHub.logout()" title="Keluar dari Akun">',
          '🚪 ' + (window.EventI18n ? window.EventI18n.t('nav_logout', 'Keluar') : 'Keluar'),
        '</button>'
      );
    } else {
      html.push(
        '<button class="btn-primary" style="padding:8px 18px; font-size:0.85rem;" onclick="EventHub.openAuthModal(\'login\')">',
          (window.EventI18n ? window.EventI18n.t('nav_login', 'Masuk / Daftar') : 'Masuk / Daftar'),
        '</button>'
      );
    }

    html.push(
          '</div>',
        '</div>',
      '</header>'
    );

    return html.join('');
  }

  function renderBottomBar() {
    var user = Store.getCurrentUser();
    var isPenyelenggara = user && user.role === 'penyelenggara';
    var isSuperAdmin = user && user.role === 'superadmin';

    // REQUIREMENT: Saat tidak masuk akun admin dan penyelenggara, MAKA TIDAK ADA FITUR SCAN INI!
    // Fitur ini hanya bisa diakses oleh Admin dan Penyelenggara.
    if (!isPenyelenggara && !isSuperAdmin) {
      return '';
    }

    var qrSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1.5"></rect></svg>';

    var html = [
      '<div class="app-bottom-bar">',
        '<div class="bottom-bar-inner">',
          // Item 1: Jelajahi
          '<button class="bottom-bar-item ' + (App.currentRoute === 'home' || App.currentRoute === 'detail' ? 'active' : '') + '" onclick="EventHub.go(\'home\')">',
            '<span class="item-icon">🎪</span>',
            '<span>Jelajahi</span>',
          '</button>',

          // Item 2: Fast-Track VIP
          '<button class="bottom-bar-item ' + (App.currentRoute === 'fasttrack' ? 'active' : '') + '" onclick="EventHub.go(\'fasttrack\')">',
            '<span class="item-icon">⚡</span>',
            '<span>Fast-Track</span>',
          '</button>',

          // CENTER ITEM: The Elevated Hero Scan Button (DI TENGAH-TENGAH)
          '<div class="center-scan-wrapper">',
            '<button class="btn-center-scan" onclick="EventHub.openQuickScanModal()" aria-label="Scan Tiket" title="Scan QR Tiket Acara">',
              qrSvg,
              '<span>SCAN</span>',
            '</button>',
          '</div>',

          // Item 4: Role-specific panel / Tiket Saya
          (isPenyelenggara ? (
            '<button class="bottom-bar-item ' + (App.currentRoute === 'organizer' ? 'active' : '') + '" onclick="EventHub.go(\'organizer\')">' +
              '<span class="item-icon">🏢</span>' +
              '<span>Kasir POS</span>' +
            '</button>'
          ) : isSuperAdmin ? (
            '<button class="bottom-bar-item ' + (App.currentRoute === 'admin' ? 'active' : '') + '" onclick="EventHub.go(\'admin\')">' +
              '<span class="item-icon">🛡️</span>' +
              '<span>Admin</span>' +
            '</button>'
          ) : (
            '<button class="bottom-bar-item ' + (App.currentRoute === 'tickets' ? 'active' : '') + '" onclick="EventHub.go(\'tickets\')">' +
              '<span class="item-icon">🎟️</span>' +
              '<span>Tiket Saya</span>' +
            '</button>'
          )),

          // Item 5: Profil / Masuk
          (user ? (
            '<button class="bottom-bar-item ' + (App.currentRoute === 'profile' ? 'active' : '') + '" onclick="EventHub.go(\'profile\')">' +
              '<span class="item-icon">👤</span>' +
              '<span>Akun</span>' +
            '</button>'
          ) : (
            '<button class="bottom-bar-item" onclick="EventHub.openAuthModal(\'login\')">' +
              '<span class="item-icon">🔑</span>' +
              '<span>Masuk</span>' +
            '</button>'
          )),
        '</div>',
      '</div>'
    ];

    return html.join('');
  }

  window.EventApp = App;
  window.EventRouter = {
    navigate: navigate,
    renderHeader: renderHeader,
    renderBottomBar: renderBottomBar,
    triggerPreloader: triggerPreloader,
    formatRp: formatRp,
    showToast: showToast,
    Icons: Icons
  };
})(window);
