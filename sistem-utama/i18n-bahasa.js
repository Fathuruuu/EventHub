/**
 * EventHub - Multi-Language Internationalization (i18n) Module
 * Mendukung Bahasa Indonesia (ID), English (EN), 日本語 (JA), dan 한국어 (KO)
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'eventhub_lang_v1';

  var LANGUAGES = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', short: 'ID' },
    { code: 'jv', name: 'Basa Jawa', flag: '🇮🇩', short: 'JV' },
    { code: 'en', name: 'English', flag: '🇬🇧', short: 'EN' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', short: 'JA' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', short: 'KO' }
  ];
  var TRANSLATIONS = {
    // =========================================================================
    // BAHASA INDONESIA (ID)
    // =========================================================================
    id: {
      // Navigasi
      nav_explore: 'Jelajahi',
      nav_favorites: 'Favorit',
      nav_tickets: 'Tiket Saya',
      nav_refunds: 'Refund',
      nav_messages: 'Pesan & Tanya',
      nav_fasttrack: 'Fast-Track VIP',
      nav_profile: 'Profil',
      nav_organizer: 'Panel Penyelenggara',
      nav_admin: 'Platform Admin',
      nav_login: 'Masuk / Daftar',
      nav_logout: 'Keluar',
      nav_scan: 'SCAN',

      // Hero Beranda
      hero_pill: 'Platform Tiket & Event Terpercaya #1 di Indonesia',
      hero_title_1: 'Tiket Resmi, Akses Cepat,',
      hero_title_2: 'Tanpa Biaya Tersembunyi.',
      hero_sub: 'Beli tiket konser musik, festival, turnamen gaming, dan hackathon dengan kode QR instan berkeamanan tinggi. Didukung sistem refund transparan yang diverifikasi langsung oleh penyelenggara acara.',
      stat_active_events: 'Event Aktif',
      stat_sold_tickets: 'Tiket Terjual',
      stat_qr_guarantee: 'Garansi QR Valid',
      stat_refund_system: 'Sistem Refund',

      // Toolbar Pencarian
      search_placeholder: 'Cari nama konser, turnamen, kota, atau penyelenggara...',
      cat_all: 'Semua',
      cat_music: 'Musik',
      cat_tech: 'Teknologi',
      cat_gaming: 'Gaming',
      cat_workshop: 'Workshop',
      price_all: 'Semua Kisaran Harga',
      price_under_75k: 'Di bawah Rp 75.000',
      price_under_150k: 'Di bawah Rp 150.000',
      price_under_300k: 'Di bawah Rp 300.000',

      // Pengumuman Kosong
      empty_title: 'Belum Ada Acara yang Diselenggarakan',
      empty_desc: 'Saat ini belum ada jadwal konser, festival, atau turnamen yang sedang berlangsung. Nantikan rilis pengumuman jadwal acara dan penjualan tiket resmi terbaru dalam waktu dekat!',
      btn_check_schedule: '🔄 Periksa Jadwal Terbaru',
      btn_login_register: 'Masuk / Daftar Akun',
      admin_create_event_prompt: 'Halo Administrator! Saat ini belum ada jadwal event aktif di platform. Anda dapat langsung membuat acara baru, mengatur kuota tiket, dan mempublikasikan acara perdana sekarang.',
      btn_admin_create_event: '➕ Buat & Terbitkan Acara Baru',

      // Pricing & Fast-Track VIP
      pricing_pill: 'JALUR EKSPRES PRIORITAS GATE MASUK ACARA',
      pricing_title_1: 'shadcn',
      pricing_title_2: 'Pricing Pages',
      pricing_sub: 'Nikmati akses kilat Fast-Track VIP langsung masuk tanpa antre di seluruh konser & festival pilihan. Buka jalur gerbang ekspres prioritas, diskon tiket otomatis hingga 15%, bebas biaya platform, serta badge level VIP eksklusif di samping nama dan e-tiket Anda.',
      pricing_starter: 'Starter',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_popular_badge: 'Popular',
      pricing_per_month: '/bulan',
      pricing_billed_monthly: '(ditagih bulanan)',
      pricing_most_popular: '(paling diminati penonton)',
      pricing_vvip_complete: '(fasilitas VVIP terlengkap)',
      btn_choose_starter: 'Choose Starter',
      btn_upgrade_now: 'Upgrade Now',
      btn_select_enterprise: 'Select Enterprise',
      btn_plan_used: '✓ Paket Sedang Digunakan',
      pricing_footer: 'Start your 14-day free trial. No credit card required. Akses jalur gate instan aktif seketika.',
      btn_admin_edit_pricing: '✏️ Kelola & Ubah Harga Subscription (Mode Super Admin)',
      btn_edit_plan_card: '✏️ Edit Harga & Fitur',

      // Scanner Modal
      scan_modal_title: '📷 Scan Tiket Acara',
      scan_modal_sub: 'Arahkan kamera ke kode QR e-tiket peserta untuk memeriksa keabsahan & status check-in gate secara instan.',
      scan_aim_camera: 'Arahkan Kamera ke Kode QR Tiket',
      scan_manual_label: 'Atau Masukkan Kode Tiket Manual:',
      scan_manual_btn: 'Validasi',
      scan_mobile_btn: '📱 Ambil Foto Kamera HP (Kamera Native)',

      // Bahasa Switcher
      lang_switch_label: 'Bahasa'
    },

    // =========================================================================
    // ENGLISH (EN)
    // =========================================================================
    en: {
      // Navigation
      nav_explore: 'Explore',
      nav_favorites: 'Favorites',
      nav_tickets: 'My Tickets',
      nav_refunds: 'Refunds',
      nav_messages: 'Messages',
      nav_fasttrack: 'Fast-Track VIP',
      nav_profile: 'Profile',
      nav_organizer: 'Organizer Desk',
      nav_admin: 'Platform Admin',
      nav_login: 'Login / Register',
      nav_logout: 'Logout',
      nav_scan: 'SCAN',

      // Home Hero
      hero_pill: '#1 Trusted Event & Ticketing Platform in Indonesia',
      hero_title_1: 'Official Tickets, Fast Access,',
      hero_title_2: 'Zero Hidden Fees.',
      hero_sub: 'Purchase verified tickets for music concerts, festivals, esports tournaments, and tech hackathons with instant high-security QR codes. Backed by transparent refund mechanisms approved directly by event organizers.',
      stat_active_events: 'Active Events',
      stat_sold_tickets: 'Tickets Sold',
      stat_qr_guarantee: 'Verified QR',
      stat_refund_system: 'Refund System',

      // Search Toolbar
      search_placeholder: 'Search concerts, tournaments, cities, or organizers...',
      cat_all: 'All',
      cat_music: 'Music',
      cat_tech: 'Technology',
      cat_gaming: 'Gaming',
      cat_workshop: 'Workshop',
      price_all: 'All Price Ranges',
      price_under_75k: 'Under Rp 75,000',
      price_under_150k: 'Under Rp 150,000',
      price_under_300k: 'Under Rp 300,000',

      // Empty State
      empty_title: 'No Events Scheduled Yet',
      empty_desc: 'There are currently no concerts, festivals, or tournaments in progress. Stay tuned for upcoming official event announcements and ticket sales opening soon!',
      btn_check_schedule: '🔄 Check Latest Schedule',
      btn_login_register: 'Login / Register',
      admin_create_event_prompt: 'Hello Administrator! There are currently no active events on the platform. You can create a new event, configure ticket quotas, and publish the debut event now.',
      btn_admin_create_event: '➕ Create & Publish New Event',

      // Pricing & Fast-Track VIP
      pricing_pill: 'EXPRESS PRIORITY GATE ACCESS PASS',
      pricing_title_1: 'shadcn',
      pricing_title_2: 'Pricing Pages',
      pricing_sub: 'Enjoy lightning-fast Fast-Track VIP entrance with zero queue wait times at select concerts & festivals. Unlock priority gate lanes, up to 15% automatic ticket discounts, zero platform service fees, and exclusive VIP badges on your profile and e-tickets.',
      pricing_starter: 'Starter',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_popular_badge: 'Popular',
      pricing_per_month: '/month',
      pricing_billed_monthly: '(billed monthly)',
      pricing_most_popular: '(most popular among attendees)',
      pricing_vvip_complete: '(all-inclusive VVIP access)',
      btn_choose_starter: 'Choose Starter',
      btn_upgrade_now: 'Upgrade Now',
      btn_select_enterprise: 'Select Enterprise',
      btn_plan_used: '✓ Plan Currently Active',
      pricing_footer: 'Start your 14-day free trial. No credit card required. Instant gate priority access activated.',
      btn_admin_edit_pricing: '✏️ Manage & Edit Subscription Pricing (Super Admin Mode)',
      btn_edit_plan_card: '✏️ Edit Price & Features',

      // Scanner Modal
      scan_modal_title: '📷 Event Ticket Scanner',
      scan_modal_sub: 'Point your camera at attendee e-ticket QR codes to verify authenticity & gate check-in status instantly.',
      scan_aim_camera: 'Point Camera at Ticket QR Code',
      scan_manual_label: 'Or Enter Ticket Code Manually:',
      scan_manual_btn: 'Validate',
      scan_mobile_btn: '📱 Take Photo with Native Camera',

      // Language Switcher
      lang_switch_label: 'Language'
    },

    // =========================================================================
    // JAPANESE / 日本語 (JA)
    // =========================================================================
    ja: {
      // ナビゲーション
      nav_explore: '探索',
      nav_favorites: 'お気に入り',
      nav_tickets: 'マイチケ',
      nav_refunds: '返金申請',
      nav_messages: 'メッセージ',
      nav_fasttrack: 'ファストパス',
      nav_profile: 'マイページ',
      nav_organizer: '主催者管理',
      nav_admin: 'システム管理',
      nav_login: 'ログイン/登録',
      nav_logout: 'ログアウト',
      nav_scan: 'スキャン',

      // ヒーロー
      hero_pill: 'インドネシアNo.1 信頼のチケット＆イベントプラットフォーム',
      hero_title_1: '公式チケット、最速アクセス、',
      hero_title_2: '隠れた手数料ゼロ。',
      hero_sub: '高セキュリティQRコードで音楽フェス、コンサート、eスポーツ、ハッカソンのチケットを即時購入。主催者による透明な返金対応を完全保証。',
      stat_active_events: '開催中イベント',
      stat_sold_tickets: '販売済みチケット',
      stat_qr_guarantee: '公式QR完全保証',
      stat_refund_system: '安心返金対応',

      // 検索バー
      search_placeholder: 'コンサート、フェス、都市、主催者を検索...',
      cat_all: 'すべて',
      cat_music: '音楽',
      cat_tech: 'テクノロジー',
      cat_gaming: 'ゲーム',
      cat_workshop: 'ワークショップ',
      price_all: 'すべての価格帯',
      price_under_75k: '75,000ルピア以下',
      price_under_150k: '150,000ルピア以下',
      price_under_300k: '300,000ルピア以下',

      // 空白状態
      empty_title: '現在予定されているイベントはありません',
      empty_desc: '現在開催中のコンサートやフェスティバルはありません。近日公開予定の公式イベント発表とチケット発売をお待ちください！',
      btn_check_schedule: '🔄 最新スケジュールを確認',
      btn_login_register: 'ログイン / 会員登録',
      admin_create_event_prompt: '管理者様へ：現在プラットフォームにイベントはありません。今すぐ新規イベントを作成し、チケット枠を設定して公開できます。',
      btn_admin_create_event: '➕ 新規イベントを作成・公開',

      // 料金プラン / ファストパス
      pricing_pill: '入場ゲート優先ファストトラックパス',
      pricing_title_1: 'shadcn',
      pricing_title_2: '料金プラン',
      pricing_sub: '行列なしで最速入場できるファストトラックVIPメンバーシップ。優先レーン、最大15%自動割引、手数料無料、限定VIPバッジをご提供します。',
      pricing_starter: 'Starter',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_popular_badge: '人気',
      pricing_per_month: '/月',
      pricing_billed_monthly: '(月額課金)',
      pricing_most_popular: '(最も選ばれているプラン)',
      pricing_vvip_complete: '(VVIPフルアクセス)',
      btn_choose_starter: 'Starterを選択',
      btn_upgrade_now: '今すぐアップグレード',
      btn_select_enterprise: 'Enterpriseを選択',
      btn_plan_used: '✓ ご利用中のプラン',
      pricing_footer: '14日間の無料トライアル。クレジットカード不要。即座に優先入場アクセス有効。',
      btn_admin_edit_pricing: '✏️ サブスク料金の管理（管理者モード）',
      btn_edit_plan_card: '✏️ 料金と特典を編集',

      // スキャナー
      scan_modal_title: '📷 チケットQRスキャナー',
      scan_modal_sub: 'カメラを参加者のQRコードに向けて、ゲートチェックイン状況を即座に認証します。',
      scan_aim_camera: 'カメラをQRコードに向けてください',
      scan_manual_label: 'またはチケットコードを手動入力:',
      scan_manual_btn: '認証',
      scan_mobile_btn: '📱 スマホカメラで撮影',

      // 言語
      lang_switch_label: '言語'
    },

    // =========================================================================
    // KOREAN / 한국어 (KO)
    // =========================================================================
    ko: {
      // 내비게이션
      nav_explore: '둘러보기',
      nav_favorites: '관심목록',
      nav_tickets: '내 티켓',
      nav_refunds: '환불신청',
      nav_messages: '메시지',
      nav_fasttrack: '패스트트랙 VIP',
      nav_profile: '프로필',
      nav_organizer: '주최자 패널',
      nav_admin: '플랫폼 관리자',
      nav_login: '로그인/가입',
      nav_logout: '로그아웃',
      nav_scan: '스캔',

      // 홈 히어로
      hero_pill: '인도네시아 1위 공식 티켓 & 이벤트 플랫폼',
      hero_title_1: '공식 티켓, 신속한 입장,',
      hero_title_2: '숨은 수수료 제로.',
      hero_sub: '고보안 QR 코드로 콘서트, 페스티벌, e스포츠, 해커톤 티켓을 즉시 예매하세요. 주최자가 직접 검증하는 투명한 환불 시스템을 지원합니다.',
      stat_active_events: '진행중 이벤트',
      stat_sold_tickets: '판매된 티켓',
      stat_qr_guarantee: '공식 QR 보증',
      stat_refund_system: '안심 환불 시스템',

      // 검색창
      search_placeholder: '콘서트, 페스티벌, 도시 또는 주최자 검색...',
      cat_all: '전체',
      cat_music: '음악',
      cat_tech: '기술',
      cat_gaming: '게임',
      cat_workshop: '워크숍',
      price_all: '전체 가격대',
      price_under_75k: '75,000 루피아 이하',
      price_under_150k: '150,000 루피아 이하',
      price_under_300k: '300,000 루피아 이하',

      // 빈 상태 안내
      empty_title: '현재 예정된 이벤트가 없습니다',
      empty_desc: '현재 진행 중인 콘서트나 축제가 없습니다. 곧 공개될 공식 이벤트 일정과 티켓 오픈 소식을 기대해 주세요!',
      btn_check_schedule: '🔄 최신 일정 확인',
      btn_login_register: '로그인 / 회원가입',
      admin_create_event_prompt: '관리자 안내: 현재 플랫폼에 활성 이벤트가 없습니다. 지금 바로 새 이벤트를 등록하고 티켓을 오픈하세요.',
      btn_admin_create_event: '➕ 새 이벤트 생성 및 게시',

      // 멤버십 요금제
      pricing_pill: '게이트 우선 입장 패스트트랙 패스',
      pricing_title_1: 'shadcn',
      pricing_title_2: '요금제 안내',
      pricing_sub: '대기열 없이 신속하게 입장할 수 있는 패스트트랙 VIP 멤버십입니다. 우선 입장 레인, 최대 15% 티켓 자동 할인, 플랫폼 수수료 무료 혜택을 누리세요.',
      pricing_starter: 'Starter',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_popular_badge: '인기',
      pricing_per_month: '/월',
      pricing_billed_monthly: '(월간 결제)',
      pricing_most_popular: '(가장 인기 있는 요금제)',
      pricing_vvip_complete: '(VVIP 전용 패키지)',
      btn_choose_starter: 'Starter 선택',
      btn_upgrade_now: '지금 업그레이드',
      btn_select_enterprise: 'Enterprise 선택',
      btn_plan_used: '✓ 현재 이용 중인 플랜',
      pricing_footer: '14일 무료 체험. 신용카드 등록 불필요. 즉시 우선 입장 가능.',
      btn_admin_edit_pricing: '✏️ 멤버십 요금 관리 (관리자 모드)',
      btn_edit_plan_card: '✏️ 가격 및 혜택 수정',

      // 스캐너 모달
      scan_modal_title: '📷 이벤트 티켓 스캐너',
      scan_modal_sub: '입장객의 e-티켓 QR 코드를 카메라로 스캔하여 입장 자격을 실시간으로 인증하세요.',
      scan_aim_camera: '카메라를 티켓 QR 코드에 맞추세요',
      scan_manual_label: '또는 티켓 코드 직접 입력:',
      scan_manual_btn: '인증하기',
      scan_mobile_btn: '📱 스마트폰 카메라로 촬영',

      // 언어 설정
      lang_switch_label: '언어'
    },

    // =========================================================================
    // BASA JAWA (JV)
    // =========================================================================
    jv: {
      // Navigasi
      nav_explore: 'Madosi Acara',
      nav_favorites: 'Koleksi Remen',
      nav_tickets: 'Tiket Kula',
      nav_refunds: 'Wangsul Arta',
      nav_messages: 'Serat & Pitaken',
      nav_fasttrack: 'Fast-Track VIP',
      nav_profile: 'Profil Akun',
      nav_organizer: 'Papan Panitia (EO)',
      nav_admin: 'Pangarsa Admin',
      nav_login: 'Mlebet / Ndhaptar',
      nav_logout: 'Medal',
      nav_scan: 'SCAN',

      // Hero Beranda
      hero_pill: 'Platform Tiket & Acara Paling Terpercaya #1 ing Indonesia',
      hero_title_1: 'Tiket Asli, Mlebet Cepet,',
      hero_title_2: 'Mboten Wonten Biaya Ditutup-tutupi.',
      hero_sub: 'Pundhut tiket konser musik, festival, tandhing gaming, lan hackathon kanthi kode QR instan ingkang aman sanget. Dipundhukung sistem wangsul arta transparan ingkang dipunteliti langsung dening panitia acara.',
      stat_active_events: 'Acara Lumaku',
      stat_sold_tickets: 'Tiket Payu',
      stat_qr_guarantee: 'Jaminan QR Sah',
      stat_refund_system: 'Layanan Wangsul Arta',

      // Toolbar Pencarian
      search_placeholder: 'Padosi asma konser, tandhing, kitha, utawi panitia...',
      cat_all: 'Sedaya',
      cat_music: 'Gending & Musik',
      cat_tech: 'Teknologi',
      cat_gaming: 'Tandhing Game',
      cat_workshop: 'Pasinaon (Workshop)',
      price_all: 'Sedaya Regi',
      price_under_75k: 'Ing ngandhap Rp 75.000',
      price_under_150k: 'Ing ngandhap Rp 150.000',
      price_under_300k: 'Ing ngandhap Rp 300.000',

      // Pengumuman Kosong
      empty_title: 'Dèrèng Wonten Acara Ingkang Lumaku',
      empty_desc: 'Wekdal punika dèrèng wonten jadwal konser, festival, utawi tandhing ingkang dipunadani. Mangga nenggo pawartos resmi jadwal acara lan pambikakan sadean tiket ing wekdal caket!',
      btn_check_schedule: '🔄 Priksa Jadwal Enggal',
      btn_login_register: 'Mlebet / Ndhaptar Akun',
      admin_create_event_prompt: 'Sugeng rawuh Administrator! Wekdal punika dèrèng wonten acara ingkang aktif ing platform. Panjenengan saged langsung ndamel acara enggal, ngatur kuota tiket, lan mbabar acara sepisanan sapunika.',
      btn_admin_create_event: '➕ Dhasaraken & Babar Acara Enggal',

      // Pricing & Fast-Track VIP
      pricing_pill: 'LURUNG PRIORITAS EKSPRES MLEBET ACARA',
      pricing_title_1: 'shadcn',
      pricing_title_2: 'Paket VIP',
      pricing_sub: 'Kersaa ngraosaken akses kilat Fast-Track VIP langsung mlebet tanpa antri wonten ing sedaya konser lan festival pilihan. Bikak jalur gerbang prioritas, potongan regi tiket dumugi 15%, mboten wonten biaya layanan, sarta badge VIP mirunggan wonten ing profil lan e-tiket panjenengan.',
      pricing_starter: 'Starter (Pambuka)',
      pricing_pro: 'Pro (Paling Remen)',
      pricing_business: 'Business (Usaha)',
      pricing_popular_badge: 'Paling Remen',
      pricing_per_month: '/sasi',
      pricing_billed_monthly: '(dipuntagih saben sasi)',
      pricing_most_popular: '(paling kathah dipunpilih penonton)',
      pricing_vvip_complete: '(fasilitas VVIP paling jangkep)',
      btn_choose_starter: 'Pilih Paket Starter',
      btn_upgrade_now: 'Tingkataken Sapunika',
      btn_select_enterprise: 'Pilih Paket Enterprise',
      btn_plan_used: '✓ Paket Saweg Dipunginakaken',
      pricing_footer: 'Cobi 14 dinten lelahanan tanpa ragat. Mboten betah kertu kredit. Hak mlebet prioritas langsung aktif seketika.',
      btn_admin_edit_pricing: '✏️ Atur & Gantos Regi Langganan (Mode Super Admin)',
      btn_edit_plan_card: '✏️ Gantos Regi & Fitur',

      // Scanner Modal
      scan_modal_title: '📷 Pindai (Scan) Tiket Acara',
      scan_modal_sub: 'Arahaken kamera dhateng kode QR e-tiket peserta kagem mriksa kasahihan & status mlebet gate kanthi instan.',
      scan_aim_camera: 'Arahaken Kamera dhateng Kode QR Tiket',
      scan_manual_label: 'Utawi Lebetaken Kode Tiket Manual:',
      scan_manual_btn: 'Sahaken',
      scan_mobile_btn: '📱 Pendhet Foto Kamera HP (Kamera Asli)',

      // Bahasa Switcher
      lang_switch_label: 'Basa'
    }
  };

  // State management
  var currentLang = 'id';
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) {
      currentLang = saved;
    }
  } catch (e) {}

  var I18n = {
    getLanguage: function() {
      return currentLang;
    },

    setLanguage: function(langCode) {
      if (!TRANSLATIONS[langCode]) langCode = 'id';
      currentLang = langCode;
      try {
        localStorage.setItem(STORAGE_KEY, langCode);
      } catch (e) {}

      // Trigger app re-render
      if (window.EventHub && window.EventHub.renderApp) {
        window.EventHub.renderApp();
      }
    },

    t: function(key, fallback) {
      var dict = TRANSLATIONS[currentLang] || TRANSLATIONS['id'];
      if (dict && typeof dict[key] !== 'undefined') {
        return dict[key];
      }
      var fallbackDict = TRANSLATIONS['id'];
      if (fallbackDict && typeof fallbackDict[key] !== 'undefined') {
        return fallbackDict[key];
      }
      return fallback || key;
    },

    getLanguages: function() {
      return LANGUAGES;
    },

    renderLanguageSwitcher: function() {
      var current = LANGUAGES.find(function(l) { return l.code === currentLang; }) || LANGUAGES[0];

      var html = [
        '<div class="lang-dropdown-wrapper" style="position:relative; display:inline-block">',
          '<button class="lang-pill-btn" onclick="EventI18n.toggleDropdown(event)" aria-label="Ganti Bahasa" style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:99px; padding:6px 12px; font-size:0.8rem; font-weight:700; color:#ffffff; cursor:pointer; transition:all 0.2s ease">',
            '<span>' + current.flag + '</span>',
            '<span>' + current.short + '</span>',
            '<small style="font-size:0.65rem; opacity:0.7">▼</small>',
          '</button>',
          '<div id="lang-dropdown-menu" style="display:none; position:absolute; top:calc(100% + 8px); right:0; background:rgba(15,23,42,0.95); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.12); border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.5); padding:6px; min-width:160px; z-index:1100">',
      ];

      LANGUAGES.forEach(function(l) {
        var isSelected = l.code === currentLang;
        html.push(
          '<button onclick="EventI18n.selectLanguage(\'' + l.code + '\')" style="width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 12px; background:' + (isSelected ? 'rgba(99,102,241,0.2)' : 'none') + '; border:none; border-radius:8px; color:' + (isSelected ? '#a5b4fc' : '#cbd5e1') + '; font-size:0.82rem; font-weight:600; cursor:pointer; text-align:left; transition:background 0.15s ease">',
            '<span>' + l.flag + ' ' + l.name + '</span>',
            (isSelected ? '<span style="color:#10b981; font-weight:800">✓</span>' : ''),
          '</button>'
        );
      });

      html.push(
          '</div>',
        '</div>'
      );

      return html.join('');
    },

    toggleDropdown: function(e) {
      if (e) e.stopPropagation();
      var el = document.getElementById('lang-dropdown-menu');
      if (!el) return;
      var isOpen = el.style.display === 'block';
      el.style.display = isOpen ? 'none' : 'block';

      // Auto close on outside click
      if (!isOpen) {
        var closeHandler = function() {
          el.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        };
        setTimeout(function() {
          document.addEventListener('click', closeHandler);
        }, 10);
      }
    },

    selectLanguage: function(code) {
      this.setLanguage(code);
      var el = document.getElementById('lang-dropdown-menu');
      if (el) el.style.display = 'none';
    }
  };

  window.EventI18n = I18n;
})(window);
