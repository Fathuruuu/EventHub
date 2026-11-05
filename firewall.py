#!/usr/bin/env python3
"""
EventHub Enterprise Web Application Firewall (WAF) & Security Hardening Module
Melindungi sistem dari serangan SQL Injection, XSS, Path Traversal, RCE, Brute-force & Malicious Bots
"""

import re
import json
import os
import time
from datetime import datetime
from collections import defaultdict
from urllib.parse import unquote

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIREWALL_CONFIG_FILE = os.path.join(BASE_DIR, 'firewall_rules.json')
FIREWALL_LOG_FILE = os.path.join(BASE_DIR, 'firewall_security.log')

# ==============================================================================
# HACKER ATTACK SIGNATURES (REGEX PATTERNS)
# ==============================================================================

# 1. SQL Injection (SQLi) Patterns
SQLI_PATTERNS = [
    re.compile(r"(\b(union(\s+all)?)\s+select\b)", re.IGNORECASE),
    re.compile(r"(\b(select|insert|update|delete|drop|alter|truncate)\b\s+.*\b(from|into|table|database)\b)", re.IGNORECASE),
    re.compile(r"('|\%27)\s*(or|and)\s*('|\%27)?\d+('|\%27)?\s*=\s*('|\%27)?\d+", re.IGNORECASE),
    re.compile(r"(\bor\b\s+true\b|\bor\b\s+'1'='1'|\b1=1\b)", re.IGNORECASE),
    re.compile(r"(\bsleep\(\s*\d+\s*\)|\bbenchmark\(\s*\d+)", re.IGNORECASE),
    re.compile(r"(--\s*$|/\*.*?\*/|;\s*--)", re.IGNORECASE),
    re.compile(r"(\bwaitfor\s+delay\b|\bload_file\b|\binto\s+outfile\b)", re.IGNORECASE),
    re.compile(r"(\bexec(\s|\+)+(s|x)p\w+)", re.IGNORECASE)
]

# 2. Cross-Site Scripting (XSS) Patterns
XSS_PATTERNS = [
    re.compile(r"(<script.*?>.*?</script>|<script\b)", re.IGNORECASE),
    re.compile(r"(javascript\s*:\s*|vbscript\s*:\s*|data\s*:\s*text/html)", re.IGNORECASE),
    re.compile(r"(onload\s*=|onerror\s*=|onclick\s*=|onmouseover\s*=|onfocus\s*=)", re.IGNORECASE),
    re.compile(r"(<iframe|<embed|<object|<svg/onload|<img.*?onerror)", re.IGNORECASE),
    re.compile(r"(document\.(cookie|domain|location)|window\.location)", re.IGNORECASE),
    re.compile(r"(eval\(|alert\(|prompt\(|confirm\()", re.IGNORECASE)
]

# 3. Path Traversal & LFI / RFI Patterns
TRAVERSAL_PATTERNS = [
    re.compile(r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)", re.IGNORECASE),
    re.compile(r"(/etc/(passwd|shadow|hosts|group|issue))", re.IGNORECASE),
    re.compile(r"(c:\\windows\\|c:/windows/|win\.ini|boot\.ini)", re.IGNORECASE),
    re.compile(r"(\.env|\.git/|\.aws/|\.ssh/|wp-config\.php|web\.config)", re.IGNORECASE),
    re.compile(r"(php://filter|php://input|file://)", re.IGNORECASE)
]

# 4. Remote Code Execution (RCE) & Command Injection
RCE_PATTERNS = [
    re.compile(r"(;\s*(cat|ls|id|whoami|uname|nc|wget|curl|chmod|rm)\b)", re.IGNORECASE),
    re.compile(r"(\|\s*(bash|sh|cmd|powershell)\b)", re.IGNORECASE),
    re.compile(r"(\bpowershell\s+-enc|\bcmd\.exe\s+/c)", re.IGNORECASE),
    re.compile(r"(`.*?`|\$\(.*?\))", re.IGNORECASE)
]

# 5. Malicious Security Scanner User-Agents
SCANNER_UA_PATTERNS = [
    re.compile(r"(sqlmap|nikto|acunetix|dirbuster|nmap|masscan|wpscan|gobuster|havij|arachni|nessus|openvas|vega)", re.IGNORECASE),
    re.compile(r"(zgrab|nuclei|jaeles|ffuf|whatweb)", re.IGNORECASE)
]


class WebApplicationFirewall:
    def __init__(self):
        self.rate_limit_records = defaultdict(list)
        self.banned_ips = {}  # ip -> unban_timestamp
        self.stats = {
            "total_inspections": 0,
            "blocked_threats": 0,
            "sqli_blocked": 0,
            "xss_blocked": 0,
            "traversal_blocked": 0,
            "rce_blocked": 0,
            "bot_blocked": 0,
            "ratelimit_blocked": 0,
            "started_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S WIB')
        }
        self.recent_incidents = []
        self.load_config()

    def load_config(self):
        self.config = {
            "enabled": True,
            "mode": "aggressive",  # "standard" | "aggressive" | "strict"
            "rate_limit_window": 10,  # seconds
            "rate_limit_max_requests": 80,  # per window
            "sensitive_api_max_requests": 6,  # per 10s for /api/send-otp
            "auto_ban_duration": 300,  # 5 minutes in seconds
            "whitelisted_ips": ["127.0.0.1", "::1"],
            "blacklisted_ips": []
        }
        if os.path.exists(FIREWALL_CONFIG_FILE):
            try:
                with open(FIREWALL_CONFIG_FILE, 'r', encoding='utf-8') as f:
                    saved = json.load(f)
                    self.config.update(saved)
            except Exception as e:
                print(f"[FIREWALL] Error loading firewall_rules.json: {e}", flush=True)

    def save_config(self):
        try:
            with open(FIREWALL_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"[FIREWALL] Error saving firewall_rules.json: {e}", flush=True)

    def log_incident(self, ip, threat_type, reason, snippet=""):
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S WIB')
        incident = {
            "id": f"WAF-{int(time.time()*1000)}",
            "timestamp": now_str,
            "ip": ip,
            "threat_type": threat_type,
            "reason": reason,
            "payload_snippet": snippet[:180],
            "action": "BLOCKED 403"
        }
        self.recent_incidents.insert(0, incident)
        if len(self.recent_incidents) > 100:
            self.recent_incidents = self.recent_incidents[:100]

        # Log to physical log file
        try:
            with open(FIREWALL_LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(f"[{now_str}] [ATTACK_BLOCKED] IP: {ip} | TYPE: {threat_type} | REASON: {reason} | PAYLOAD: {snippet[:150]}\n")
        except Exception:
            pass

    def inspect_request(self, client_ip, path, method, headers, body=b""):
        """
        Main inspection pipeline.
        Returns: (is_blocked: bool, status_code: int, error_message: str)
        """
        if not self.config.get("enabled", True):
            return False, 200, ""

        self.stats["total_inspections"] += 1
        now = time.time()

        # 1. Check IP Blacklist
        if client_ip in self.config.get("blacklisted_ips", []):
            self.stats["blocked_threats"] += 1
            self.log_incident(client_ip, "BLACKLISTED_IP", "Alamat IP terdapat dalam daftar hitam (Blacklist).")
            return True, 403, "Akses Ditolak: Alamat IP Anda telah diblokir oleh Firewall Sistem."

        # 2. Check Temporary Ban
        if client_ip in self.banned_ips:
            if now < self.banned_ips[client_ip]:
                remaining = int(self.banned_ips[client_ip] - now)
                return True, 429, f"Akses Dibatasi: Terlalu banyak percobaan mencurigakan. Coba lagi dalam {remaining} detik."
            else:
                del self.banned_ips[client_ip]

        # Whitelist bypass for rate-limit
        is_whitelisted = client_ip in self.config.get("whitelisted_ips", [])

        # 3. Rate Limiting Check (DDoS & Brute-force Shield)
        if not is_whitelisted:
            window = self.config.get("rate_limit_window", 10)
            max_req = self.config.get("rate_limit_max_requests", 80)
            if "/api/send-otp" in path or "/login" in path:
                max_req = self.config.get("sensitive_api_max_requests", 6)

            timestamps = self.rate_limit_records[client_ip]
            # Prune old timestamps
            self.rate_limit_records[client_ip] = [t for t in timestamps if now - t < window]
            self.rate_limit_records[client_ip].append(now)

            if len(self.rate_limit_records[client_ip]) > max_req:
                ban_duration = self.config.get("auto_ban_duration", 300)
                self.banned_ips[client_ip] = now + ban_duration
                self.stats["blocked_threats"] += 1
                self.stats["ratelimit_blocked"] += 1
                self.log_incident(client_ip, "BRUTE_FORCE_RATE_LIMIT", f"Melebihi batas aman ({max_req} request / {window}s). Diblokir otomatis.")
                return True, 429, f"Peringatan Keamanan: Terdeteksi aktivitas brute-force / spam request. IP diblokir selama {ban_duration//60} menit."

        # 4. Inspect User-Agent for Malicious Scanners / Hack Tools
        ua = headers.get('User-Agent', '')
        for pat in SCANNER_UA_PATTERNS:
            if pat.search(ua):
                self.stats["blocked_threats"] += 1
                self.stats["bot_blocked"] += 1
                self.log_incident(client_ip, "HACKER_BOT_SCANNER", f"Scanner tool terdeteksi: {ua}", ua)
                return True, 403, "Akses Ditolak: Alat pemindai kerentanan otomatis dilarang oleh Firewall."

        # 5. Decode and Inspect URL Path & Query Strings
        try:
            decoded_path = unquote(unquote(path))
        except Exception:
            decoded_path = path

        # Check Path Traversal
        for pat in TRAVERSAL_PATTERNS:
            if pat.search(decoded_path):
                self.stats["blocked_threats"] += 1
                self.stats["traversal_blocked"] += 1
                self.log_incident(client_ip, "PATH_TRAVERSAL_LFI", "Upaya membaca file direktori server terlarang.", decoded_path)
                return True, 403, "Akses Ditolak: Upaya Directory Traversal / LFI digagalkan oleh WAF."

        # 6. Inspect Request Body (SQLi, XSS, RCE)
        body_text = ""
        if body:
            try:
                body_text = body.decode('utf-8', errors='ignore')
            except Exception:
                pass

        inspect_target = f"{decoded_path}\n{body_text}"

        # SQL Injection Check
        for pat in SQLI_PATTERNS:
            match = pat.search(inspect_target)
            if match:
                snippet = match.group(0)
                self.stats["blocked_threats"] += 1
                self.stats["sqli_blocked"] += 1
                self.log_incident(client_ip, "SQL_INJECTION", "Pola injeksi database SQL terdeteksi.", snippet)
                return True, 403, "Akses Ditolak: Upaya SQL Injection terdeteksi dan berhasil dinetralisir oleh WAF."

        # XSS Check
        for pat in XSS_PATTERNS:
            match = pat.search(inspect_target)
            if match:
                snippet = match.group(0)
                self.stats["blocked_threats"] += 1
                self.stats["xss_blocked"] += 1
                self.log_incident(client_ip, "CROSS_SITE_SCRIPTING_XSS", "Pola skrip berbahaya XSS terdeteksi.", snippet)
                return True, 403, "Akses Ditolak: Upaya Cross-Site Scripting (XSS) diblokir oleh WAF."

        # RCE / Command Injection Check
        for pat in RCE_PATTERNS:
            match = pat.search(inspect_target)
            if match:
                snippet = match.group(0)
                self.stats["blocked_threats"] += 1
                self.stats["rce_blocked"] += 1
                self.log_incident(client_ip, "REMOTE_CODE_EXECUTION", "Upaya eksekusi perintah terminal sistem terdeteksi.", snippet)
                return True, 403, "Akses Ditolak: Upaya Command Injection / RCE diblokir oleh WAF."

        return False, 200, ""

    def get_security_headers(self):
        """
        Enterprise-grade HTTP security headers to prevent Clickjacking, MIME sniffing, and XSS.
        """
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=*, microphone=(), geolocation=()",
            "Content-Security-Policy": (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; "
                "style-src 'self' 'unsafe-inline' https: http:; "
                "img-src 'self' data: blob: https: http:; "
                "media-src 'self' data: blob: https: http:; "
                "frame-src 'self' https: http:; "
                "font-src 'self' data: https: http:; "
                "connect-src 'self' * ws: wss:;"
            )
        }

    def get_dashboard_summary(self):
        return {
            "status": "ONLINE & PROTECTING",
            "mode": self.config.get("mode", "aggressive"),
            "stats": self.stats,
            "banned_ips_count": len(self.banned_ips) + len(self.config.get("blacklisted_ips", [])),
            "recent_incidents": self.recent_incidents[:15]
        }


# Global Singleton WAF Instance
waf = WebApplicationFirewall()
