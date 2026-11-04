-- ==============================================================================
-- EventHub Pro - Production Relational Database Schema
-- Dialect: SQLite / ANSI SQL (Compatible with PostgreSQL & MySQL)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabel Pengguna (Users & Administrators)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('peserta', 'penyelenggara', 'superadmin')),
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending_approval', 'rejected', 'suspended')),
    rejection_reason TEXT,
    avatar_text TEXT,
    verified INTEGER DEFAULT 1,
    subscription_json TEXT, -- Format JSON: { active: bool, planId: str, planName: str, endDate: str }
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Tabel Acara / Event
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    venue TEXT NOT NULL,
    description TEXT,
    banner_img TEXT,
    video_trailer TEXT,
    gallery_images_json TEXT, -- JSON Array URL foto galeri acara
    organizer_id TEXT,
    organizer_name TEXT NOT NULL,
    organizer_email TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'draft', 'ended', 'cancelled')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_email);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- 3. Tabel Kategori & Kuota Tiket (Event Ticket Tiers)
CREATE TABLE IF NOT EXISTS event_tiers (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    quota INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tiers_event ON event_tiers(event_id);

-- 4. Tabel Transaksi E-Tiket (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    event_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT,
    event_venue TEXT,
    organizer_email TEXT NOT NULL,
    tier_id TEXT,
    tier_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    buyer_id TEXT,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT,
    is_checked_in INTEGER DEFAULT 0,
    checked_in_at TEXT,
    status TEXT DEFAULT 'valid' CHECK(status IN ('valid', 'used', 'refunded', 'cancelled')),
    qr_token TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_organizer ON tickets(organizer_email);

-- 5. Tabel Pengajuan Refund Tiket (Refund Requests)
CREATE TABLE IF NOT EXISTS refund_requests (
    id TEXT PRIMARY KEY,
    ticket_id TEXT,
    ticket_code TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    organizer_email TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    organizer_note TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY (ticket_code) REFERENCES tickets(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refunds_organizer ON refund_requests(organizer_email);
CREATE INDEX IF NOT EXISTS idx_refunds_buyer ON refund_requests(buyer_email);

-- 6. Tabel Kode Voucher Diskon (Vouchers)
CREATE TABLE IF NOT EXISTS vouchers (
    code TEXT PRIMARY KEY,
    event_id TEXT,
    organizer_email TEXT NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 10,
    max_discount INTEGER DEFAULT 50000,
    min_purchase INTEGER DEFAULT 0,
    quota INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 7. Tabel Log Check-in Gate (Scan Logs)
CREATE TABLE IF NOT EXISTS scan_logs (
    id TEXT PRIMARY KEY,
    ticket_code TEXT NOT NULL,
    event_id TEXT,
    scanned_by TEXT NOT NULL,
    scanned_at TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS', 'ALREADY_USED', 'INVALID', 'REFUNDED'
    method TEXT DEFAULT 'camera', -- 'camera', 'manual_code', 'rfid'
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_scanlogs_ticket ON scan_logs(ticket_code);

-- 8. Tabel Bookmark / Acara Favorit (Bookmarks)
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    event_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_email, event_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 9. Tabel Pesan & Komunikasi (Messages)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    organizer_email TEXT NOT NULL,
    message_text TEXT NOT NULL,
    reply_text TEXT,
    reply_time TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_organizer ON messages(organizer_email);

-- 10. Tabel Ulasan & Feedback Website (Feedbacks)
CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    category TEXT NOT NULL,
    comment TEXT,
    timestamp TEXT NOT NULL
);

-- 11. Tabel Audit Aktivitas Real-Time (Activity Logs)
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'success'
);

-- 12. Tabel Paket Membership Fast-Track VIP (Memberships)
CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    badge_color TEXT NOT NULL,
    popular INTEGER DEFAULT 0,
    icon TEXT,
    badge_text TEXT NOT NULL,
    benefits_json TEXT NOT NULL
);

-- 13. Tabel Konfigurasi Hero Banner CMS (Hero Config)
CREATE TABLE IF NOT EXISTS hero_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    badge_text TEXT NOT NULL,
    title1 TEXT NOT NULL,
    title2 TEXT NOT NULL,
    description TEXT NOT NULL,
    video_url TEXT,
    video_poster TEXT,
    show_video INTEGER DEFAULT 1,
    updated_at TEXT NOT NULL
);

-- 14. Tabel Status Mode Pemeliharaan (Maintenance Config)
CREATE TABLE IF NOT EXISTS maintenance_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    active INTEGER DEFAULT 0,
    message TEXT NOT NULL,
    estimated_end TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
