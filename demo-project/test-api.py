#!/usr/bin/env python3
"""
EventHub Pro - Automated Backend & Database Smoke Test Suite
Verifies database integrity, WAF firewall rules, and API endpoints.
"""

import unittest
import json
import os
import sys

# Ensure root directory is in python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import database
from firewall import waf

class TestEventHubBackend(unittest.TestCase):
    def setUp(self):
        database.init_db()

    def test_database_initialization(self):
        """Test if database initialized cleanly with active status and users table."""
        stats = database.get_db_stats()
        self.assertEqual(stats['status'], "ONLINE & READY")
        self.assertGreaterEqual(stats['tables']['users'], 1)

    def test_clean_state_integrity(self):
        """Test that all demo accounts, demo events, and demo tickets are purged."""
        db = database.export_database()
        self.assertTrue(any(u['role'] == 'superadmin' for u in db['users']))

        # Ensure demo events are completely absent
        event_ids = [e['id'] for e in db['events']]
        for d in ['EVT-BAT0', 'EVT-F6OQ', 'EVT-TECH', 'EVT-ART0']:
            self.assertNotIn(d, event_ids)

        # Ensure demo users are completely absent
        user_emails = [u['email'] for u in db['users']]
        for d in ['promotor@nusantara.id', 'soundfest@nusantara.id', 'techfest@nusantara.id', 'budi@gmail.com', 'siti@gmail.com', 'reza@gmail.com']:
            self.assertNotIn(d, user_emails)

        # Ensure demo tickets are completely absent
        ticket_codes = [t['code'] for t in db['tickets']]
        for d in ['TKT-DEMO-VALID-01', 'TKT-DEMO-VALID-02', 'TKT-DEMO-USED-01', 'TKT-DEMO-PENDING-01', 'TKT-DEMO-REFUND-01']:
            self.assertNotIn(d, ticket_codes)
    def test_waf_sqli_detection(self):
        """Test if WAF detects SQL injection attempts."""
        is_blocked, status, reason = waf.inspect_request(
            '127.0.0.1',
            '/api/events?category=1%20UNION%20SELECT%20null,password%20FROM%20users--',
            'GET',
            {}
        )
        self.assertTrue(is_blocked)
        self.assertEqual(status, 403)
        self.assertIn("SQL Injection", reason)

    def test_waf_xss_detection(self):
        """Test if WAF detects XSS script injection."""
        is_blocked, status, reason = waf.inspect_request(
            '127.0.0.1',
            '/api/search?q=<script>alert(document.cookie)</script>',
            'GET',
            {}
        )
        self.assertTrue(is_blocked)
        self.assertEqual(status, 403)
        self.assertIn("Cross-Site Scripting", reason)

    def test_waf_legitimate_request(self):
        """Test if legitimate requests pass through WAF cleanly."""
        is_blocked, status, reason = waf.inspect_request(
            '127.0.0.1',
            '/index.html',
            'GET',
            {'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0'}
        )
        self.assertFalse(is_blocked)

if __name__ == '__main__':
    print("[TEST SUITE] 🧪 Running EventHub Pro Backend & Security Verification...")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEventHubBackend)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
