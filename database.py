#!/usr/bin/env python3
"""
EventHub Pro - SQLite Database Manager & Backend Persistence Engine
Handles relational database storage, migrations, data seeding, and client synchronization.
"""

import sqlite3
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'eventhub.db')
SCHEMA_FILE = os.path.join(BASE_DIR, 'schema.sql')

def get_connection():
    """Returns a SQLite connection configured with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(DB_FILE, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes tables and seeds default platform configuration if empty."""
    conn = get_connection()
    cursor = conn.cursor()

    if os.path.exists(SCHEMA_FILE):
        with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
            schema_script = f.read()
        cursor.executescript(schema_script)
    else:
        # Fallback inline creation if schema.sql is missing
        pass

    # 1. Seed Super Admin User if not exists
    cursor.execute("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO users (id, name, email, password, role, phone, company, status, avatar_text, verified, subscription_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'usr-admin',
            'EventHub Super Administrator',
            'admin@eventhub.id',
            'admin123',
            'superadmin',
            '08001234567',
            'EventHub Enterprise',
            'active',
            'AD',
            1,
            None,
            '2026-01-01'
        ))

    # 2. Seed Hero Config
    cursor.execute("SELECT id FROM hero_config WHERE id = 1")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO hero_config (id, badge_text, title1, title2, description, video_url, video_poster, show_video, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1,
            'Platform Tiket & Event Terpercaya #1 di Indonesia',
            'Tiket Resmi, Akses Cepat,',
            'Tanpa Biaya Tersembunyi.',
            'Rasakan getaran panggung spektakuler, gemuruh sorak penonton, dan momen magis konser impian Anda! Dapatkan tiket resmi festival musik, turnamen esports bergengsi, dan konferensi akbar nasional dengan garansi kode QR instan, keamanan berlapis, serta kemudahan refund terpercaya.',
            'https://assets.mixkit.co/videos/preview/mixkit-audience-at-a-music-concert-holding-lights-42537-large.mp4',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
            1,
            '2026-11-04 10:00 WIB'
        ))

    # 3. Seed Maintenance Config
    cursor.execute("SELECT id FROM maintenance_config WHERE id = 1")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO maintenance_config (id, active, message, estimated_end, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            1,
            0,
            'Sistem EventHub sedang dalam pemeliharaan berkala untuk peningkatan performa infrastruktur server.',
            'Sekitar 1-2 jam ke depan',
            '2026-11-04 10:00 WIB'
        ))

    # 4. Seed Memberships
    cursor.execute("SELECT COUNT(*) FROM memberships")
    if cursor.fetchone()[0] == 0:
        memberships_data = [
            (
                'silver', 'Silver Express', 29000, '#94a3b8', 0, '🥈', 'SILVER',
                json.dumps([
                    'Akses Fast-Track Gate Masuk (1x per bulan)',
                    'Diskon tiket 5% untuk semua acara',
                    'Badge eksklusif Silver Member di E-Tiket',
                    'Customer Support prioritas standar'
                ])
            ),
            (
                'gold', 'Gold VIP Pass', 59000, '#fbbf24', 1, '🥇', 'GOLD VIP',
                json.dumps([
                    'Akses Fast-Track UNLIMITED di semua gate masuk acara',
                    'Akses Presale H-2 sebelum penjualan dibuka ke publik',
                    'Diskon tiket 10% setiap pembelian',
                    'Gratis welcome drink di VIP zone acara',
                    'Badge emas Gold VIP Member berkilau di header & tiket'
                ])
            ),
            (
                'platinum', 'Platinum Black Access', 99000, '#ec4899', 0, '👑', 'PLATINUM',
                json.dumps([
                    'Jalur Prioritas VVIP Gate (Zero Wait Time)',
                    'Akses VIP Lounge & Sesi Soundcheck Artis',
                    'Diskon tiket 15% setiap pembelian',
                    'Bebas biaya layanan platform (0% service fee)',
                    'Jaminan refund instan 100% tanpa potongan',
                    'Badge eksklusif Platinum Black Member di header & tiket'
                ])
            )
        ]
        cursor.executemany("""
            INSERT INTO memberships (id, name, price, badge_color, popular, icon, badge_text, benefits_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, memberships_data)

    # 5. Seed Activity Log
    cursor.execute("SELECT COUNT(*) FROM activity_logs")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO activity_logs (id, timestamp, user_name, user_email, user_role, action, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'ACT-INIT',
            datetime.now().strftime('%Y-%m-%d %H:%M WIB'),
            'Administrator Sistem (Privat)',
            'admin@private.internal',
            'system',
            'Database SQLite Diinisialisasi Bersih',
            'Database relasional eventhub.db siap digunakan.',
            'success'
        ))

    # Check if events table is empty; if so, populate rich demo dataset
    cursor.execute("SELECT COUNT(*) FROM events")
    has_events = cursor.fetchone()[0] > 0
    conn.commit()
    conn.close()
    if not has_events:
        seed_demo_data(force=False)
    print(f"[SQLITE DB] ✅ Database initialized successfully: {DB_FILE}", flush=True)
    return

def export_database():
    """Exports entire SQLite database as a Python dictionary formatted for frontend state synchronization."""
    conn = get_connection()
    cursor = conn.cursor()

    # Users
    cursor.execute("SELECT * FROM users")
    users = []
    for r in cursor.fetchall():
        sub = json.loads(r['subscription_json']) if r['subscription_json'] else None
        users.append({
            "id": r['id'],
            "name": r['name'],
            "email": r['email'],
            "password": r['password'],
            "role": r['role'],
            "phone": r['phone'] or '',
            "company": r['company'] or '',
            "status": r['status'],
            "rejectionReason": r['rejection_reason'] or '',
            "avatarText": r['avatar_text'] or 'U',
            "verified": bool(r['verified']),
            "subscription": sub,
            "createdAt": r['created_at']
        })

    # Events + Tiers
    cursor.execute("SELECT * FROM events")
    events = []
    for r in cursor.fetchall():
        ev_id = r['id']
        cursor.execute("SELECT * FROM event_tiers WHERE event_id = ?", (ev_id,))
        tiers = []
        for t in cursor.fetchall():
            tiers.append({
                "id": t['id'],
                "name": t['name'],
                "price": t['price'],
                "quota": t['quota'],
                "sold": t['sold'],
                "description": t['description'] or ''
            })

        gallery = json.loads(r['gallery_images_json']) if r['gallery_images_json'] else []
        events.append({
            "id": r['id'],
            "title": r['title'],
            "category": r['category'],
            "city": r['city'],
            "date": r['date'],
            "time": r['time'] or '',
            "venue": r['venue'],
            "description": r['description'] or '',
            "bannerImg": r['banner_img'] or '',
            "videoTrailer": r['video_trailer'] or '',
            "galleryImages": gallery,
            "organizerId": r['organizer_id'],
            "organizerName": r['organizer_name'],
            "organizerEmail": r['organizer_email'],
            "status": r['status'],
            "gradient": 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)' if 'Musik' in r['category'] else ('linear-gradient(135deg, #0284c7, #06b6d4, #10b981)' if 'Gaming' in r['category'] else ('linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)' if 'Teknologi' in r['category'] else 'linear-gradient(135deg, #ea580c, #f59e0b, #ef4444)')),
            "badgeColor": '#6366f1' if 'Musik' in r['category'] else ('#06b6d4' if 'Gaming' in r['category'] else ('#8b5cf6' if 'Teknologi' in r['category'] else '#f59e0b')),
            "createdAt": r['created_at'],
            "tiers": tiers
        })

    # Tickets
    cursor.execute("SELECT * FROM tickets")
    tickets = []
    for r in cursor.fetchall():
        tickets.append({
            "id": r['id'],
            "code": r['code'],
            "eventId": r['event_id'],
            "eventName": r['event_name'],
            "eventDate": r['event_date'],
            "eventTime": r['event_time'] or '',
            "eventVenue": r['event_venue'] or '',
            "organizerEmail": r['organizer_email'],
            "tierId": r['tier_id'] or '',
            "tierName": r['tier_name'],
            "price": r['price'],
            "buyerId": r['buyer_id'] or '',
            "buyerName": r['buyer_name'],
            "buyerEmail": r['buyer_email'],
            "buyerPhone": r['buyer_phone'] or '',
            "isCheckedIn": bool(r['is_checked_in']),
            "checkedInAt": r['checked_in_at'],
            "status": r['status'],
            "qrToken": r['qr_token'] or '',
            "createdAt": r['created_at']
        })

    # Refund Requests
    cursor.execute("SELECT * FROM refund_requests")
    refunds = []
    for r in cursor.fetchall():
        refunds.append({
            "id": r['id'],
            "ticketId": r['ticket_id'] or '',
            "ticketCode": r['ticket_code'],
            "eventId": r['event_id'],
            "eventName": r['event_name'],
            "organizerEmail": r['organizer_email'],
            "buyerEmail": r['buyer_email'],
            "buyerName": r['buyer_name'],
            "amount": r['amount'],
            "reason": r['reason'],
            "details": r['details'] or '',
            "bankName": r['bank_name'],
            "accountNumber": r['account_number'],
            "accountHolder": r['account_holder'],
            "status": r['status'],
            "organizerNote": r['organizer_note'] or '',
            "createdAt": r['created_at'],
            "resolvedAt": r['resolved_at']
        })

    # Vouchers
    cursor.execute("SELECT * FROM vouchers")
    vouchers = []
    for r in cursor.fetchall():
        vouchers.append({
            "code": r['code'],
            "eventId": r['event_id'] or '',
            "organizerEmail": r['organizer_email'],
            "discountPercent": r['discount_percent'],
            "maxDiscount": r['max_discount'],
            "minPurchase": r['min_purchase'],
            "quota": r['quota'],
            "usedCount": r['used_count'],
            "isActive": bool(r['is_active']),
            "createdAt": r['created_at']
        })

    # Scan Logs
    cursor.execute("SELECT * FROM scan_logs")
    scan_logs = []
    for r in cursor.fetchall():
        scan_logs.append({
            "id": r['id'],
            "ticketCode": r['ticket_code'],
            "eventId": r['event_id'] or '',
            "scannedBy": r['scanned_by'],
            "scannedAt": r['scanned_at'],
            "status": r['status'],
            "method": r['method'] or 'camera',
            "details": r['details'] or ''
        })

    # Bookmarks
    cursor.execute("SELECT event_id FROM bookmarks")
    bookmarks = [r['event_id'] for r in cursor.fetchall()]

    # Messages
    cursor.execute("SELECT * FROM messages")
    messages = []
    for r in cursor.fetchall():
        messages.append({
            "id": r['id'],
            "eventId": r['event_id'],
            "eventTitle": r['event_title'],
            "senderEmail": r['sender_email'],
            "senderName": r['sender_name'],
            "senderRole": r['sender_role'],
            "organizerEmail": r['organizer_email'],
            "message": r['message_text'],
            "reply": r['reply_text'] or '',
            "replyTime": r['reply_time'] or '',
            "createdAt": r['created_at']
        })

    # Feedbacks
    cursor.execute("SELECT * FROM feedbacks")
    feedbacks = []
    for r in cursor.fetchall():
        feedbacks.append({
            "id": r['id'],
            "userName": r['user_name'],
            "userEmail": r['user_email'],
            "rating": r['rating'],
            "category": r['category'],
            "comment": r['comment'] or '',
            "timestamp": r['timestamp']
        })

    # Activity Logs
    cursor.execute("SELECT * FROM activity_logs ORDER BY rowid DESC LIMIT 100")
    activity_logs = []
    for r in cursor.fetchall():
        activity_logs.append({
            "id": r['id'],
            "timestamp": r['timestamp'],
            "userName": r['user_name'],
            "userEmail": r['user_email'],
            "userRole": r['user_role'],
            "action": r['action'],
            "details": r['details'] or '',
            "status": r['status'] or 'success'
        })

    # Memberships
    cursor.execute("SELECT * FROM memberships")
    memberships = []
    for r in cursor.fetchall():
        benefits = json.loads(r['benefits_json']) if r['benefits_json'] else []
        memberships.append({
            "id": r['id'],
            "name": r['name'],
            "price": r['price'],
            "badgeColor": r['badge_color'],
            "popular": bool(r['popular']),
            "icon": r['icon'] or '⭐',
            "badgeText": r['badge_text'],
            "benefits": benefits
        })

    # Hero Config
    cursor.execute("SELECT * FROM hero_config WHERE id = 1")
    hero_row = cursor.fetchone()
    hero_config = {
        "badgeText": hero_row['badge_text'] if hero_row else 'Platform Tiket & Event Terpercaya',
        "title1": hero_row['title1'] if hero_row else 'Tiket Resmi, Akses Cepat,',
        "title2": hero_row['title2'] if hero_row else 'Tanpa Biaya Tersembunyi.',
        "description": hero_row['description'] if hero_row else '',
        "videoUrl": hero_row['video_url'] if hero_row else '',
        "videoPoster": hero_row['video_poster'] if hero_row else '',
        "showVideo": bool(hero_row['show_video']) if hero_row else True,
        "updatedAt": hero_row['updated_at'] if hero_row else ''
    }

    # Maintenance Config
    cursor.execute("SELECT * FROM maintenance_config WHERE id = 1")
    maint_row = cursor.fetchone()
    maintenance = {
        "active": bool(maint_row['active']) if maint_row else False,
        "message": maint_row['message'] if maint_row else '',
        "estimatedEnd": maint_row['estimated_end'] if maint_row else '',
        "updatedAt": maint_row['updated_at'] if maint_row else ''
    }

    conn.close()

    return {
        "users": users,
        "events": events,
        "tickets": tickets,
        "refundRequests": refunds,
        "vouchers": vouchers,
        "scanLogs": scan_logs,
        "bookmarks": bookmarks,
        "messages": messages,
        "feedbacks": feedbacks,
        "activityLogs": activity_logs,
        "memberships": memberships,
        "heroConfig": hero_config,
        "maintenance": maintenance
    }

def sync_database(payload):
    """Synchronizes client payload into SQLite database tables."""
    if not isinstance(payload, dict):
        return {"success": False, "error": "Invalid payload format: expected JSON object"}

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 1. Sync Users
        if 'users' in payload and isinstance(payload['users'], list):
            for u in payload['users']:
                sub_json = json.dumps(u.get('subscription')) if u.get('subscription') else None
                cursor.execute("""
                    INSERT INTO users (id, name, email, password, role, phone, company, status, rejection_reason, avatar_text, verified, subscription_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        password = excluded.password,
                        phone = excluded.phone,
                        company = excluded.company,
                        status = excluded.status,
                        rejection_reason = excluded.rejection_reason,
                        subscription_json = excluded.subscription_json
                """, (
                    u.get('id'),
                    u.get('name'),
                    (u.get('email') or '').lower().strip(),
                    u.get('password'),
                    u.get('role'),
                    u.get('phone'),
                    u.get('company'),
                    u.get('status', 'active'),
                    u.get('rejectionReason'),
                    u.get('avatarText', 'U'),
                    1 if u.get('verified', True) else 0,
                    sub_json,
                    u.get('createdAt', datetime.now().strftime('%Y-%m-%d'))
                ))

        # 2. Sync Events & Tiers
        if 'events' in payload and isinstance(payload['events'], list):
            existing_ev_ids = [e.get('id') for e in payload['events'] if e.get('id')]
            for e in payload['events']:
                ev_id = e.get('id')
                gallery_json = json.dumps(e.get('galleryImages', []))
                cursor.execute("""
                    INSERT INTO events (id, title, category, city, date, time, venue, description, banner_img, video_trailer, gallery_images_json, organizer_id, organizer_name, organizer_email, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title = excluded.title,
                        category = excluded.category,
                        city = excluded.city,
                        date = excluded.date,
                        time = excluded.time,
                        venue = excluded.venue,
                        description = excluded.description,
                        banner_img = excluded.banner_img,
                        video_trailer = excluded.video_trailer,
                        gallery_images_json = excluded.gallery_images_json,
                        status = excluded.status
                """, (
                    ev_id,
                    e.get('title'),
                    e.get('category'),
                    e.get('city'),
                    e.get('date'),
                    e.get('time', ''),
                    e.get('venue'),
                    e.get('description', ''),
                    e.get('bannerImg', ''),
                    e.get('videoTrailer', ''),
                    gallery_json,
                    e.get('organizerId'),
                    e.get('organizerName', ''),
                    e.get('organizerEmail', ''),
                    e.get('status', 'active'),
                    e.get('createdAt', datetime.now().strftime('%Y-%m-%d'))
                ))

                # Sync Tiers
                if 'tiers' in e and isinstance(e['tiers'], list):
                    for t in e['tiers']:
                        cursor.execute("""
                            INSERT INTO event_tiers (id, event_id, name, price, quota, sold, description)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(id) DO UPDATE SET
                                name = excluded.name,
                                price = excluded.price,
                                quota = excluded.quota,
                                sold = excluded.sold,
                                description = excluded.description
                        """, (
                            t.get('id'),
                            ev_id,
                            t.get('name'),
                            int(t.get('price', 0)),
                            int(t.get('quota', 100)),
                            int(t.get('sold', 0)),
                            t.get('description', '')
                        ))

        # 3. Sync Tickets
        if 'tickets' in payload and isinstance(payload['tickets'], list):
            for t in payload['tickets']:
                cursor.execute("""
                    INSERT INTO tickets (id, code, event_id, event_name, event_date, event_time, event_venue, organizer_email, tier_id, tier_name, price, buyer_id, buyer_name, buyer_email, buyer_phone, is_checked_in, checked_in_at, status, qr_token, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        is_checked_in = excluded.is_checked_in,
                        checked_in_at = excluded.checked_in_at,
                        status = excluded.status
                """, (
                    t.get('id'),
                    t.get('code'),
                    t.get('eventId'),
                    t.get('eventName'),
                    t.get('eventDate'),
                    t.get('eventTime', ''),
                    t.get('eventVenue', ''),
                    t.get('organizerEmail'),
                    t.get('tierId', ''),
                    t.get('tierName'),
                    int(t.get('price', 0)),
                    t.get('buyerId', ''),
                    t.get('buyerName'),
                    t.get('buyerEmail'),
                    t.get('buyerPhone', ''),
                    1 if t.get('isCheckedIn') else 0,
                    t.get('checkedInAt'),
                    t.get('status', 'valid'),
                    t.get('qrToken', ''),
                    t.get('createdAt', datetime.now().strftime('%Y-%m-%d'))
                ))

        # 4. Sync Refund Requests
        if 'refundRequests' in payload and isinstance(payload['refundRequests'], list):
            for r in payload['refundRequests']:
                cursor.execute("""
                    INSERT INTO refund_requests (id, ticket_id, ticket_code, event_id, event_name, organizer_email, buyer_email, buyer_name, amount, reason, details, bank_name, account_number, account_holder, status, organizer_note, created_at, resolved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        status = excluded.status,
                        organizer_note = excluded.organizer_note,
                        resolved_at = excluded.resolved_at
                """, (
                    r.get('id'),
                    r.get('ticketId', ''),
                    r.get('ticketCode'),
                    r.get('eventId'),
                    r.get('eventName'),
                    r.get('organizerEmail'),
                    r.get('buyerEmail'),
                    r.get('buyerName'),
                    int(r.get('amount', 0)),
                    r.get('reason'),
                    r.get('details', ''),
                    r.get('bankName'),
                    r.get('accountNumber'),
                    r.get('accountHolder'),
                    r.get('status', 'pending'),
                    r.get('organizerNote', ''),
                    r.get('createdAt', datetime.now().strftime('%Y-%m-%d')),
                    r.get('resolvedAt')
                ))

        # 5. Sync Messages
        if 'messages' in payload and isinstance(payload['messages'], list):
            for m in payload['messages']:
                cursor.execute("""
                    INSERT INTO messages (id, event_id, event_title, sender_email, sender_name, sender_role, organizer_email, message_text, reply_text, reply_time, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        reply_text = excluded.reply_text,
                        reply_time = excluded.reply_time
                """, (
                    m.get('id'),
                    m.get('eventId'),
                    m.get('eventTitle'),
                    m.get('senderEmail'),
                    m.get('senderName'),
                    m.get('senderRole', 'peserta'),
                    m.get('organizerEmail'),
                    m.get('message'),
                    m.get('reply'),
                    m.get('replyTime'),
                    m.get('createdAt', datetime.now().strftime('%Y-%m-%d'))
                ))

        # 6. Sync Feedbacks
        if 'feedbacks' in payload and isinstance(payload['feedbacks'], list):
            for fb in payload['feedbacks']:
                cursor.execute("""
                    INSERT INTO feedbacks (id, user_name, user_email, rating, category, comment, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO NOTHING
                """, (
                    fb.get('id'),
                    fb.get('userName'),
                    fb.get('userEmail'),
                    int(fb.get('rating', 5)),
                    fb.get('category', 'Umum'),
                    fb.get('comment', ''),
                    fb.get('timestamp', datetime.now().strftime('%Y-%m-%d'))
                ))

        # 7. Sync Activity Logs
        if 'activityLogs' in payload and isinstance(payload['activityLogs'], list):
            for al in payload['activityLogs'][-50:]:  # Keep newest
                cursor.execute("""
                    INSERT INTO activity_logs (id, timestamp, user_name, user_email, user_role, action, details, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO NOTHING
                """, (
                    al.get('id'),
                    al.get('timestamp'),
                    al.get('userName'),
                    al.get('userEmail'),
                    al.get('userRole'),
                    al.get('action'),
                    al.get('details', ''),
                    al.get('status', 'success')
                ))

        # 8. Sync Hero Config
        if 'heroConfig' in payload and isinstance(payload['heroConfig'], dict):
            hc = payload['heroConfig']
            cursor.execute("""
                INSERT INTO hero_config (id, badge_text, title1, title2, description, video_url, video_poster, show_video, updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    badge_text = excluded.badge_text,
                    title1 = excluded.title1,
                    title2 = excluded.title2,
                    description = excluded.description,
                    video_url = excluded.video_url,
                    video_poster = excluded.video_poster,
                    show_video = excluded.show_video,
                    updated_at = excluded.updated_at
            """, (
                hc.get('badgeText', ''),
                hc.get('title1', ''),
                hc.get('title2', ''),
                hc.get('description', ''),
                hc.get('videoUrl', ''),
                hc.get('videoPoster', ''),
                1 if hc.get('showVideo', True) else 0,
                hc.get('updatedAt', datetime.now().strftime('%Y-%m-%d %H:%M WIB'))
            ))

        # 9. Sync Maintenance Config
        if 'maintenance' in payload and isinstance(payload['maintenance'], dict):
            mc = payload['maintenance']
            cursor.execute("""
                INSERT INTO maintenance_config (id, active, message, estimated_end, updated_at)
                VALUES (1, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    active = excluded.active,
                    message = excluded.message,
                    estimated_end = excluded.estimated_end,
                    updated_at = excluded.updated_at
            """, (
                1 if mc.get('active') else 0,
                mc.get('message', ''),
                mc.get('estimatedEnd', ''),
                mc.get('updatedAt', datetime.now().strftime('%Y-%m-%d %H:%M WIB'))
            ))

        # 10. Sync Memberships
        if 'memberships' in payload and isinstance(payload['memberships'], list):
            for mem in payload['memberships']:
                cursor.execute("""
                    INSERT INTO memberships (id, name, price, badge_color, popular, icon, badge_text, benefits_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        price = excluded.price,
                        badge_color = excluded.badge_color,
                        popular = excluded.popular,
                        icon = excluded.icon,
                        badge_text = excluded.badge_text,
                        benefits_json = excluded.benefits_json
                """, (
                    mem.get('id'),
                    mem.get('name'),
                    int(mem.get('price', 0)),
                    mem.get('badgeColor', '#94a3b8'),
                    1 if mem.get('popular') else 0,
                    mem.get('icon', '⭐'),
                    mem.get('badgeText', ''),
                    json.dumps(mem.get('benefits', []))
                ))

        conn.commit()
        conn.close()
        return {"success": True, "message": "Database synchronized with SQLite storage"}

    except Exception as e:
        conn.rollback()
        conn.close()
        return {"success": False, "error": str(e)}
def purge_demo_data():
    """Purges all demo events, tickets, non-superadmin users, refund requests, vouchers, scan logs, feedbacks, bookmarks, and messages, leaving only Super Admin and default configs."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM event_tiers")
        cursor.execute("DELETE FROM events")
        cursor.execute("DELETE FROM tickets")
        cursor.execute("DELETE FROM refund_requests")
        cursor.execute("DELETE FROM scan_logs")
        cursor.execute("DELETE FROM vouchers")
        cursor.execute("DELETE FROM bookmarks")
        cursor.execute("DELETE FROM messages")
        cursor.execute("DELETE FROM feedbacks")

        # Delete all non-admin users
        cursor.execute("DELETE FROM users WHERE role != 'superadmin'")

        # Ensure Super Admin account exists
        cursor.execute("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (id, name, email, password, role, phone, company, status, avatar_text, verified, subscription_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'usr-admin',
                'EventHub Super Administrator',
                'admin@eventhub.id',
                'admin123',
                'superadmin',
                '08001234567',
                'EventHub Enterprise',
                'active',
                'AD',
                1,
                None,
                '2026-01-01'
            ))

        # Reset activity logs to clean state
        cursor.execute("DELETE FROM activity_logs")
        cursor.execute("""
            INSERT INTO activity_logs (id, timestamp, user_name, user_email, user_role, action, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'ACT-CLEAN',
            datetime.now().strftime('%Y-%m-%d %H:%M WIB'),
            'Administrator Sistem (Privat)',
            'admin@private.internal',
            'system',
            'Seluruh Data Demo Direset Bersih',
            'Database relasional SQLite telah dibersihkan total dari seluruh event, tiket, dan akun dummy.',
            'success'
        ))

        conn.commit()
        conn.close()
        return {"success": True, "message": "Seluruh data demo berhasil dihapus tuntas dari database."}
    except Exception as e:
        conn.rollback()
        conn.close()
        return {"success": False, "error": str(e)}
def seed_demo_data(force=False):
    """Populates complete realistic demo data for EventHub Pro."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM events")
    event_count = cursor.fetchone()[0]
    if event_count > 0 and not force:
        conn.close()
        return {"success": True, "message": "Data demo sudah terpasang.", "already_seeded": True}

    try:
        # 1. Clean existing records if force
        if force:
            cursor.execute("DELETE FROM scan_logs")
            cursor.execute("DELETE FROM refund_requests")
            cursor.execute("DELETE FROM tickets")
            cursor.execute("DELETE FROM event_tiers")
            cursor.execute("DELETE FROM events")
            cursor.execute("DELETE FROM vouchers")
            cursor.execute("DELETE FROM bookmarks")
            cursor.execute("DELETE FROM messages")
            cursor.execute("DELETE FROM feedbacks")
            cursor.execute("DELETE FROM users WHERE role != 'superadmin'")

        # 2. Users
        demo_users = [
            ('usr-org-promotor', 'Promotor Musik Nusantara', 'promotor@nusantara.id', 'promotor123', 'penyelenggara', '081288990011', 'PT Nada Kreasi Nusantara', 'active', None, 'PN', 1, None, '2026-01-10'),
            ('usr-org-soundfest', 'Soundfest Organizer Jakarta', 'soundfest@nusantara.id', 'soundfest123', 'penyelenggara', '081377889900', 'Soundfest Productions', 'active', None, 'SO', 1, None, '2026-01-15'),
            ('usr-org-tech', 'Indonesia Tech Fest', 'techfest@nusantara.id', 'techfest123', 'penyelenggara', '081122334455', 'Tech Innovate Indonesia', 'active', None, 'IT', 1, None, '2026-02-01'),
            ('usr-peserta-budi', 'Budi Pratama VIP', 'budi@gmail.com', 'peserta123', 'peserta', '081234567890', '', 'active', None, 'BP', 1, json.dumps({"active": True, "planId": "gold", "planName": "Gold VIP Pass", "badgeText": "GOLD VIP", "endDate": "2026-12-31"}), '2026-02-10'),
            ('usr-peserta-siti', 'Siti Rahma', 'siti@gmail.com', 'peserta123', 'peserta', '081987654321', '', 'active', None, 'SR', 1, None, '2026-02-14'),
            ('usr-peserta-reza', 'Reza Kurniawan', 'reza@gmail.com', 'peserta123', 'peserta', '085678901234', '', 'active', None, 'RK', 1, json.dumps({"active": True, "planId": "silver", "planName": "Silver Express", "badgeText": "SILVER", "endDate": "2026-11-30"}), '2026-02-20')
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO users (id, name, email, password, role, phone, company, status, rejection_reason, avatar_text, verified, subscription_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_users)

        # 3. Events
        demo_events = [
            (
                'EVT-BAT0',
                'Pesta Musik Indie Jakarta 2026',
                'Konser Musik',
                'Jakarta',
                '2026-11-28',
                '16:00 - 23:00 WIB',
                'Stadion Madya GBK, Senayan',
                'Festival musik indie terbesar se-Asia Tenggara dengan penampilan panggung spektakuler dari musisi papan atas nasional dan internasional. Dilengkapi zona kuliner festival, booth merchandise eksklusif, dan visual laser megah.',
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
                'https://assets.mixkit.co/videos/preview/mixkit-audience-at-a-music-concert-holding-lights-42537-large.mp4',
                json.dumps([
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80'
                ]),
                'usr-org-promotor',
                'Promotor Musik Nusantara',
                'promotor@nusantara.id',
                'active',
                '2026-01-10'
            ),
            (
                'EVT-F6OQ',
                'Nusantara Esports Championship 2026',
                'Gaming',
                'Bandung',
                '2026-12-05',
                '10:00 - 21:00 WIB',
                'Sabuga ITB Convention Hall',
                'Turnamen esports akbar tahunan memperebutkan total hadiah Rp 500.000.000! Saksikan pertempuran tim pro terbaik MLBB, Valorant, dan PUBG Mobile di arena panggung megah berlayar LED 360 derajat.',
                'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
                'https://assets.mixkit.co/videos/preview/mixkit-gamers-playing-online-games-in-a-cyber-cafe-41481-large.mp4',
                json.dumps([
                    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
                ]),
                'usr-org-soundfest',
                'Soundfest Organizer Jakarta',
                'soundfest@nusantara.id',
                'active',
                '2026-01-15'
            ),
            (
                'EVT-TECH',
                'Indonesia Tech & AI Summit 2026',
                'Teknologi',
                'Jakarta',
                '2026-12-12',
                '09:00 - 17:00 WIB',
                'Jakarta Convention Center (JCC) Senayan',
                'Konferensi teknologi dan kecerdasan buatan terdepan di Indonesia. Mengupas arsitektur LLM modern, cloud edge computing, cybersecurity, dan transformasi digital bersama pakar Silicon Valley dan praktisi industri nasional.',
                'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&auto=format&fit=crop&q=80',
                'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-person-typing-on-a-laptop-keyboard-43204-large.mp4',
                json.dumps([
                    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
                ]),
                'usr-org-tech',
                'Indonesia Tech Fest',
                'techfest@nusantara.id',
                'active',
                '2026-02-01'
            ),
            (
                'EVT-ART0',
                'Bali Creative & Sound Wave Fest 2026',
                'Konser Musik',
                'Bali',
                '2026-12-20',
                '15:00 - 24:00 WITA',
                'GWK Cultural Park, Jimbaran',
                'Perpaduan magis alunan musik tropis, festival seni patung kontemporer, dan pemandangan matahari terbenam GWK Bali yang ikonik. Nikmati malam tak terlupakan di pulau dewata.',
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80',
                'https://assets.mixkit.co/videos/preview/mixkit-audience-at-a-music-concert-holding-lights-42537-large.mp4',
                json.dumps([
                    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'
                ]),
                'usr-org-promotor',
                'Promotor Musik Nusantara',
                'promotor@nusantara.id',
                'active',
                '2026-02-10'
            )
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO events (id, title, category, city, date, time, venue, description, banner_img, video_trailer, gallery_images_json, organizer_id, organizer_name, organizer_email, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_events)

        # 4. Event Tiers
        demo_tiers = [
            ('tier-bat0-1', 'EVT-BAT0', 'Early Bird Festival', 150000, 200, 200, 'Akses Gate Festival Early Bird (SOLD OUT)'),
            ('tier-bat0-2', 'EVT-BAT0', 'Presale Regular Gate A', 250000, 500, 340, 'Akses Gate Regular A & Free Drink Voucher'),
            ('tier-bat0-3', 'EVT-BAT0', 'VIP Soundcheck Experience', 550000, 150, 95, 'Akses Fast-Track Gate, Baris Terdepan, dan Sesi Soundcheck Musisi'),
            ('tier-bat0-4', 'EVT-BAT0', 'VVIP Royal Lounge Access', 950000, 50, 38, 'Akses Fast-Track VVIP Gate, Free Flow Beverage & VIP Lounge'),

            ('tier-f6oq-1', 'EVT-F6OQ', 'General Tribune (1 Day)', 75000, 800, 620, 'Kursi Tribun Penonton & Akses Expo Gaming'),
            ('tier-f6oq-2', 'EVT-F6OQ', 'Gamer Pass + Exclusive T-Shirt', 175000, 300, 210, 'Akses Semua Stage Pertandingan + Kaos Resmi Turnamen'),
            ('tier-f6oq-3', 'EVT-F6OQ', 'VIP Front Row Player Stage', 350000, 100, 75, 'Akses Fast-Track Gate, Duduk di Area VIP Depan Pro Player, & Meet and Greet'),

            ('tier-tech-1', 'EVT-TECH', 'Standard Conference Pass', 300000, 400, 280, 'Akses Semua Sesi Keynote & Plenary Conference (1 Hari Penuh)'),
            ('tier-tech-2', 'EVT-TECH', 'All-Access VIP + Workshop Certificate', 650000, 150, 110, 'Akses Fast-Track Gate, Workshop Hands-on AI, VIP Lunch, & Sertifikat Resmi'),

            ('tier-art0-1', 'EVT-ART0', 'Sunset Pass (Early Entry)', 200000, 300, 180, 'Akses Masuk Sebelum Pukul 17:00 WITA'),
            ('tier-art0-2', 'EVT-ART0', 'General Admission Festival', 350000, 600, 420, 'Akses Masuk Festival & Galeri Seni Kontemporer'),
            ('tier-art0-3', 'EVT-ART0', 'VIP Sunset Deck + 2 Cocktails', 800000, 100, 85, 'Akses Fast-Track Gate, Deck Pemandangan GWK, & 2 Complimentary Cocktails')
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO event_tiers (id, event_id, name, price, quota, sold, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, demo_tiers)

        # 5. Tickets
        demo_tickets = [
            (
                'TKT-001', 'TKT-DEMO-VALID-01', 'EVT-BAT0', 'Pesta Musik Indie Jakarta 2026', '2026-11-28', '16:00 - 23:00 WIB', 'Stadion Madya GBK, Senayan',
                'promotor@nusantara.id', 'tier-bat0-3', 'VIP Soundcheck Experience', 550000,
                'usr-peserta-budi', 'Budi Pratama VIP', 'budi@gmail.com', '081234567890',
                0, None, 'valid', 'TOKEN-VALID-BAT0-VIP-001', '2026-02-15 14:20 WIB'
            ),
            (
                'TKT-002', 'TKT-DEMO-VALID-02', 'EVT-F6OQ', 'Nusantara Esports Championship 2026', '2026-12-05', '10:00 - 21:00 WIB', 'Sabuga ITB Convention Hall',
                'soundfest@nusantara.id', 'tier-f6oq-3', 'VIP Front Row Player Stage', 350000,
                'usr-peserta-budi', 'Budi Pratama VIP', 'budi@gmail.com', '081234567890',
                0, None, 'valid', 'TOKEN-VALID-F6OQ-VIP-002', '2026-02-16 11:10 WIB'
            ),
            (
                'TKT-003', 'TKT-DEMO-USED-01', 'EVT-BAT0', 'Pesta Musik Indie Jakarta 2026', '2026-11-28', '16:00 - 23:00 WIB', 'Stadion Madya GBK, Senayan',
                'promotor@nusantara.id', 'tier-bat0-2', 'Presale Regular Gate A', 250000,
                'usr-peserta-siti', 'Siti Rahma', 'siti@gmail.com', '081987654321',
                1, '2026-11-04 14:15 WIB', 'used', 'TOKEN-USED-BAT0-REG-003', '2026-02-17 09:30 WIB'
            ),
            (
                'TKT-004', 'TKT-DEMO-PENDING-01', 'EVT-TECH', 'Indonesia Tech & AI Summit 2026', '2026-12-12', '09:00 - 17:00 WIB', 'Jakarta Convention Center (JCC) Senayan',
                'techfest@nusantara.id', 'tier-tech-1', 'Standard Conference Pass', 300000,
                'usr-peserta-reza', 'Reza Kurniawan', 'reza@gmail.com', '085678901234',
                0, None, 'valid', 'TOKEN-PENDING-TECH-004', '2026-02-18 16:00 WIB'
            ),
            (
                'TKT-005', 'TKT-DEMO-REFUND-01', 'EVT-BAT0', 'Pesta Musik Indie Jakarta 2026', '2026-11-28', '16:00 - 23:00 WIB', 'Stadion Madya GBK, Senayan',
                'promotor@nusantara.id', 'tier-bat0-2', 'Presale Regular Gate A', 250000,
                'usr-peserta-reza', 'Reza Kurniawan', 'reza@gmail.com', '085678901234',
                0, None, 'refunded', 'TOKEN-REFUNDED-BAT0-005', '2026-02-19 10:15 WIB'
            )
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO tickets (id, code, event_id, event_name, event_date, event_time, event_venue, organizer_email, tier_id, tier_name, price, buyer_id, buyer_name, buyer_email, buyer_phone, is_checked_in, checked_in_at, status, qr_token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_tickets)

        # 6. Refund Requests
        demo_refunds = [
            (
                'REF-001', 'TKT-004', 'TKT-DEMO-PENDING-01', 'EVT-TECH', 'Indonesia Tech & AI Summit 2026',
                'techfest@nusantara.id', 'reza@gmail.com', 'Reza Kurniawan', 300000,
                'Jadwal bentrok / berhalangan hadir', 'Tiba-tiba ada dinas mendadak ke luar kota di tanggal acara.',
                'BCA', '8820192831', 'Reza Kurniawan', 'pending', '', '2026-11-04 09:00 WIB', None
            ),
            (
                'REF-002', 'TKT-005', 'TKT-DEMO-REFUND-01', 'EVT-BAT0', 'Pesta Musik Indie Jakarta 2026',
                'promotor@nusantara.id', 'reza@gmail.com', 'Reza Kurniawan', 250000,
                'Kondisi darurat kesehatan', 'Dirawat di rumah sakit sehingga tidak bisa menghadiri konser.',
                'Mandiri', '1310099882211', 'Reza Kurniawan', 'approved', 'Refund telah disetujui dan ditransfer ke rekening pemohon.', '2026-11-03 14:00 WIB', '2026-11-04 11:30 WIB'
            )
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO refund_requests (id, ticket_id, ticket_code, event_id, event_name, organizer_email, buyer_email, buyer_name, amount, reason, details, bank_name, account_number, account_holder, status, organizer_note, created_at, resolved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_refunds)

        # 7. Vouchers
        demo_vouchers = [
            ('VIPHEMAT10', 'EVT-BAT0', 'promotor@nusantara.id', 10, 50000, 100000, 200, 28, 1, '2026-02-01'),
            ('ESPORTS2026', 'EVT-F6OQ', 'soundfest@nusantara.id', 15, 75000, 50000, 100, 15, 1, '2026-02-05'),
            ('TECHPROMO', 'EVT-TECH', 'techfest@nusantara.id', 20, 100000, 200000, 50, 8, 1, '2026-02-10')
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO vouchers (code, event_id, organizer_email, discount_percent, max_discount, min_purchase, quota, used_count, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_vouchers)

        # 8. Scan Logs
        demo_scan_logs = [
            ('SCAN-001', 'TKT-DEMO-USED-01', 'EVT-BAT0', 'promotor@nusantara.id', '2026-11-04 14:15 WIB', 'SUCCESS', 'camera', 'Check-in berhasil via Gate Scanner POS')
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO scan_logs (id, ticket_code, event_id, scanned_by, scanned_at, status, method, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_scan_logs)

        # 9. Bookmarks
        demo_bookmarks = [
            ('budi@gmail.com', 'EVT-BAT0', '2026-02-15'),
            ('budi@gmail.com', 'EVT-TECH', '2026-02-16'),
            ('siti@gmail.com', 'EVT-F6OQ', '2026-02-17')
        ]
        cursor.executemany("""
            INSERT OR IGNORE INTO bookmarks (user_email, event_id, created_at)
            VALUES (?, ?, ?)
        """, demo_bookmarks)

        # 10. Messages
        demo_messages = [
            (
                'MSG-001', 'EVT-BAT0', 'Pesta Musik Indie Jakarta 2026', 'budi@gmail.com', 'Budi Pratama VIP', 'peserta',
                'promotor@nusantara.id',
                'Halo Promotor, apakah pemilik tiket VIP Soundcheck bisa membawa kamera mirrorless untuk dokumentasi pribadi?',
                'Halo Kak Budi! Untuk kamera mirrorless dengan lensa kit diperbolehkan. Mohon hindari penggunaan lensa telezoom lebih dari 200mm demi kenyamanan bersama. Sampai jumpa di venue!',
                '2026-11-04 10:45 WIB', '2026-11-04 09:10 WIB'
            ),
            (
                'MSG-002', 'EVT-F6OQ', 'Nusantara Esports Championship 2026', 'siti@gmail.com', 'Siti Rahma', 'peserta',
                'soundfest@nusantara.id',
                'Apakah gate masuk dibuka tepat pukul 10:00 atau ada antrean open gate lebih awal?',
                '', '', '2026-11-04 13:20 WIB'
            )
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO messages (id, event_id, event_title, sender_email, sender_name, sender_role, organizer_email, message_text, reply_text, reply_time, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_messages)

        # 11. Feedbacks
        demo_feedbacks = [
            ('FB-001', 'Dimas Anggara', 'dimas@alumni.ac.id', 5, 'Pemesanan Tiket', 'Proses pembelian tiket sangat cepat dan kode QR e-tiket langsung terbit tanpa delay! Fitur Fast-Track VIP sangat membantu.', '2026-11-03 16:30 WIB'),
            ('FB-002', 'Nadya Clarissa', 'nadya@creative.id', 5, 'Kasir Gate Scanner', 'Scanner kamera gate bekerja kilat bahkan dalam kondisi pencahayaan redup. Sistem POS sangat andal!', '2026-11-04 09:15 WIB')
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO feedbacks (id, user_name, user_email, rating, category, comment, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, demo_feedbacks)

        # 12. Activity Logs
        cursor.execute("DELETE FROM activity_logs WHERE id LIKE 'ACT-%'")
        demo_activity_logs = [
            ('ACT-001', '2026-11-04 10:00 WIB', 'Administrator Sistem (Privat)', 'admin@private.internal', 'system', 'Inisialisasi Database Relasional & Seeding Data Demo EventHub Pro Berhasil', 'Database SQLite eventhub.db telah diisi dengan data demo lengkap siap showcase.', 'success'),
            ('ACT-002', '2026-11-04 10:15 WIB', 'Promotor Musik Nusantara', 'promotor@nusantara.id', 'penyelenggara', 'Membuat Acara: Pesta Musik Indie Jakarta 2026', 'Acara baru berhasil diterbitkan dengan 4 kategori kuota tiket.', 'success'),
            ('ACT-003', '2026-11-04 10:30 WIB', 'Budi Pratama VIP', 'budi@gmail.com', 'peserta', 'Berlangganan Paket Membership Gold VIP Pass', 'Paket Fast-Track Gold VIP aktif dengan hak akses tanpa antre.', 'success'),
            ('ACT-004', '2026-11-04 10:45 WIB', 'Budi Pratama VIP', 'budi@gmail.com', 'peserta', 'Membeli E-Tiket VIP Soundcheck Experience (TKT-DEMO-VALID-01)', 'Transaksi pembayaran QRIS sukses, e-tiket QR aktif diterbitkan.', 'success')
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO activity_logs (id, timestamp, user_name, user_email, user_role, action, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_activity_logs)

        conn.commit()
        conn.close()
        print(f"[SQLITE DB] 🚀 Demo data seeded successfully into {DB_FILE}", flush=True)
        return {"success": True, "message": "Data demo lengkap berhasil diinisialisasi ke dalam database SQLite."}
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[SQLITE DB] ❌ Error seeding demo data: {e}", flush=True)
        return {"success": False, "error": str(e)}


def get_db_stats():
    """Returns database size, file status, and table record counts."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    counts = {}
    tables = [
        'users', 'events', 'event_tiers', 'tickets', 'refund_requests',
        'vouchers', 'scan_logs', 'bookmarks', 'messages', 'feedbacks',
        'activity_logs', 'memberships'
    ]

    for tbl in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
            counts[tbl] = cursor.fetchone()[0]
        except Exception:
            counts[tbl] = 0

    size_bytes = os.path.getsize(DB_FILE) if os.path.exists(DB_FILE) else 0
    conn.close()

    return {
        "status": "ONLINE & READY",
        "engine": "SQLite 3 Enterprise Relational Engine",
        "file": DB_FILE,
        "size_bytes": size_bytes,
        "size_kb": round(size_bytes / 1024, 2),
        "tables": counts
    }

if __name__ == '__main__':
    init_db()
    stats = get_db_stats()
    print("[DB STATS]", json.dumps(stats, indent=2))
