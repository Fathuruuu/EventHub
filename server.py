#!/usr/bin/env python3
"""
EventHub Pro - Local Server & Real Gmail OTP Dispatcher
Serves frontend web assets and sends 6-digit verification codes to Gmail
"""

import http.server
import socketserver
import json
import os
import smtplib
import re
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from firewall import waf
import database
PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, 'email_config.json')
OUTBOX_LOG = os.path.join(BASE_DIR, 'outbox_emails.log')

def load_email_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[CONFIG] Warning loading email_config.json: {e}", flush=True)
    return {}

def send_gmail_otp(recipient_email, recipient_name, otp_code):
    config = load_email_config()
    gmail_user = config.get('gmail_user', '').strip()
    gmail_pass = config.get('gmail_app_password', '').strip()
    sender_name = config.get('sender_name', 'EventHub Pro Security')
    smtp_host = config.get('smtp_host', 'smtp.gmail.com')
    smtp_port = int(config.get('smtp_port', 587))

    timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S WIB')

    # HTML Email Template
    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6fb; margin:0; padding:30px 10px;">
  <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); padding:28px 24px; text-align:center; color:#ffffff;">
      <h1 style="margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">EventHub Pro</h1>
      <p style="margin:6px 0 0; font-size:13px; opacity:0.9;">Verifikasi Keamanan Akun Anda</p>
    </div>

    <div style="padding:32px 28px; color:#1e293b;">
      <p style="font-size:16px; margin:0 0 14px;">Halo <b>{recipient_name}</b>,</p>
      <p style="font-size:14px; color:#475569; line-height:1.6; margin:0 0 24px;">
        Terima kasih telah mendaftar di <b>EventHub</b>. Gunakan kode verifikasi 6 digit di bawah ini untuk mengaktifkan akun Anda:
      </p>

      <div style="background:#f8fafc; border:2px dashed #6366f1; border-radius:14px; padding:20px; text-align:center; margin-bottom:24px;">
        <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Verification Code:</div>
        <div style="font-family:ui-monospace,Menlo,Consolas,monospace; font-size:36px; font-weight:800; letter-spacing:10px; color:#1e1b4b; margin-left:10px;">{otp_code}</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:8px;">One-time verification code (OTP). Berlaku selama 10 menit.</div>

      <p style="font-size:13px; color:#64748b; line-height:1.5; margin:0 0 16px;">
        Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda.
      </p>
    </div>

    <div style="background:#f8fafc; padding:18px 24px; text-align:center; border-top:1px solid #f1f5f9; font-size:12px; color:#94a3b8;">
      © 2026 EventHub Pro. Dikirim pada {timestamp_str} ke {recipient_email}.
    </div>
  </div>
</body>
</html>"""

    dispatched_real = False
    error_detail = None

    if gmail_user and gmail_pass:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"EventHub Verification Code: {otp_code}"
            msg['From'] = f"{sender_name} <{gmail_user}>"
            msg['To'] = recipient_email

            part_text = MIMEText(f"Halo {recipient_name},\n\nVerification Code: {otp_code}\n\nOne-time passcode: {otp_code}\n\nKode verifikasi EventHub Anda adalah: {otp_code}\nBerlaku selama 10 menit.", 'plain')
            part_html = MIMEText(html_body, 'html')
            msg.attach(part_text)
            msg.attach(part_html)

            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(gmail_user, gmail_pass)
            server.sendmail(gmail_user, [recipient_email], msg.as_string())
            server.quit()
            dispatched_real = True
            print(f"[GMAIL SMTP] ✅ Real email sent successfully to {recipient_email} with code {otp_code}", flush=True)
        except Exception as e:
            error_detail = str(e)
            print(f"[GMAIL SMTP] ⚠️ SMTP error sending to {recipient_email}: {e}", flush=True)
    else:
        print(f"[GMAIL DISPATCHER] ✉️ Email dispatched to {recipient_email} (Code: {otp_code}). To send live emails, configure gmail_user & gmail_app_password.", flush=True)

    log_entry = f"[{timestamp_str}] Recipient: {recipient_email} ({recipient_name}) | Code: {otp_code} | Real SMTP: {dispatched_real} | Error: {error_detail}\n"
    try:
        with open(OUTBOX_LOG, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    except Exception:
        pass

    return {
        "success": True,
        "recipient": recipient_email,
        "dispatched_real": dispatched_real,
        "timestamp": timestamp_str,
        "error": error_detail
    }


class EventHubRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        clean_path = self.path.split('?')[0]
        if clean_path.endswith('.js') or clean_path.endswith('.css') or clean_path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        # Inject enterprise HTTP security headers
        for h_k, h_v in waf.get_security_headers().items():
            self.send_header(h_k, h_v)
        super().end_headers()

    def do_GET(self):
        client_ip = self.client_address[0]
        # 1. WAF Inspection for GET requests (SQLi, XSS, Path Traversal, Scanners)
        is_blocked, status, reason = waf.inspect_request(client_ip, self.path, 'GET', self.headers)
        if is_blocked:
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "waf_blocked": True,
                "status": status,
                "error": reason,
                "firewall": "EventHub Enterprise WAF Active"
            }).encode('utf-8'))
            return

        # 2. Firewall Statistics & Incident Summary Endpoint
        if self.path == '/api/firewall/summary':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(waf.get_dashboard_summary()).encode('utf-8'))
            return

        if self.path == '/api/get-email-status':
            config = load_email_config()
            has_user = bool(config.get('gmail_user', '').strip())
            has_pass = bool(config.get('gmail_app_password', '').strip())
            user_masked = ""
            if has_user:
                u = config.get('gmail_user')
                parts = u.split('@')
                user_masked = parts[0][:3] + '***@' + parts[1] if len(parts) == 2 else u

            last_code = None
            if os.path.exists(OUTBOX_LOG):
                try:
                    with open(OUTBOX_LOG, 'r', encoding='utf-8') as f:
                        lines = [line.strip() for line in f if line.strip()]
                        if lines:
                            m = re.search(r'Code:\s*(\d{6})', lines[-1])
                            if m:
                                last_code = m.group(1)
                except Exception:
                    pass

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(json.dumps({
                "configured": bool(has_user and has_pass),
                "sender_user": user_masked,
                "last_outbox_code": last_code
            }).encode('utf-8'))
            return
        # Database Status Endpoint
        if self.path == '/api/db/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(json.dumps(database.get_db_stats()).encode('utf-8'))
            return

        # Database Export / Full Sync Endpoint
        if self.path == '/api/db/export':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(json.dumps(database.export_database()).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        client_ip = self.client_address[0]
        content_length = int(self.headers.get('Content-Length', 0))
        is_upload = (self.path == '/api/upload-media')
        max_allowed = 25 * 1024 * 1024 if is_upload else 2 * 1024 * 1024
        if content_length > max_allowed:
            self.send_response(413)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Ukuran file terlalu besar (Maksimal 25MB)."}).encode('utf-8'))
            return

        post_data = self.rfile.read(content_length) if content_length > 0 else b""

        # WAF Deep Inspection for POST requests (SQLi, XSS, RCE, Brute-force)
        is_blocked, status, reason = waf.inspect_request(client_ip, self.path, 'POST', self.headers, post_data)
        if is_blocked:
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "waf_blocked": True,
                "status": status,
                "error": reason,
                "firewall": "EventHub Enterprise WAF Active"
            }).encode('utf-8'))
            return

        # Firewall Admin Actions
        if self.path == '/api/firewall/toggle-mode':
            try:
                req_data = json.loads(post_data.decode('utf-8'))
                new_mode = req_data.get('mode', 'aggressive')
                waf.config['mode'] = new_mode
                waf.save_config()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "mode": new_mode}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if self.path == '/api/firewall/clear-logs':
            waf.recent_incidents = []
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            return
        if self.path == '/api/upload-media':
            try:
                import base64
                req_json = json.loads(post_data.decode('utf-8'))
                raw_filename = req_json.get('filename', 'media_file.bin')
                data_uri = req_json.get('data', '')

                safe_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', raw_filename)
                saved_filename = f"{int(time.time())}_{safe_name}"
                dest_path = os.path.join(BASE_DIR, 'uploads', saved_filename)

                b64_content = data_uri.split(',', 1)[1] if ',' in data_uri else data_uri
                file_bytes = base64.b64decode(b64_content)
                with open(dest_path, 'wb') as f:
                    f.write(file_bytes)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "url": f"uploads/{saved_filename}",
                    "size": len(file_bytes)
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if self.path == '/api/send-otp':
            try:
                data = json.loads(post_data.decode('utf-8'))
                email = data.get('email', '').strip()
                name = data.get('name', 'Pengguna').strip()
                code = data.get('code', '').strip()

                if not email or not code:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Email dan kode OTP wajib diisi"}).encode('utf-8'))
                    return

                result = send_gmail_otp(email, name, code)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if self.path == '/api/save-email-config':

            try:
                data = json.loads(post_data.decode('utf-8'))
                gmail_user = data.get('gmail_user', '').strip()
                gmail_pass = data.get('gmail_app_password', '').strip().replace(' ', '')

                config = load_email_config()
                config['gmail_user'] = gmail_user
                config['gmail_app_password'] = gmail_pass

                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=2)

                test_result = None
                if gmail_user and gmail_pass:
                    test_result = send_gmail_otp(gmail_user, "Penguji SMTP", "123456")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "test_result": test_result
                }).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return
        if self.path == '/api/db/sync':
            try:
                payload = json.loads(post_data.decode('utf-8'))
                sync_res = database.sync_database(payload)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(sync_res).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return
        if self.path == '/api/db/purge-demo':
            try:
                purge_res = database.purge_demo_data()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(purge_res).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return
        if self.path == '/api/db/seed-demo':
            try:
                seed_res = database.seed_demo_data(force=True)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(seed_res).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return

        super().do_POST()


def run_server():
    os.chdir(BASE_DIR)
    database.init_db()
    server_address = ("127.0.0.1", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, EventHubRequestHandler)
    print(f"[EVENTHUB SERVER] 🚀 Server running at http://localhost:{PORT}", flush=True)
    print(f"[EVENTHUB SERVER] ✉️ Gmail OTP endpoint active at /api/send-otp", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[EVENTHUB SERVER] Stopping server...", flush=True)
        httpd.shutdown()

if __name__ == '__main__':
    run_server()
