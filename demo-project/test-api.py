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
        """Test if database initialized and tables are reachable."""
        stats = database.get_db_stats()
        self.assertEqual(stats['status'], "ONLINE & READY")
        self.assertGreater(stats['tables']['users'], 0)
        self.assertGreater(stats['tables']['events'], 0)
        self.assertGreater(stats['tables']['event_tiers'], 0)

    def test_demo_data_integrity(self):
        """Test if seeded demo data contains required demo accounts and events."""
        db = database.export_database()
        
        # Check users
        emails = [u['email'] for u in db['users']]
        self.assertIn('admin@eventhub.id', emails)
        self.assertIn('promotor@nusantara.id', emails)
        self.assertIn('budi@gmail.com', emails)
        
        # Check VIP subscription for Budi
        budi = next(u for u in db['users'] if u['email'] == 'budi@gmail.com')
        self.assertIsNotNone(budi['subscription'])
        self.assertEqual(budi['subscription']['planId'], 'gold')

        # Check events
        titles = [e['title'] for e in db['events']]
        self.assertTrue(any('Pesta Musik Indie' in t for t in titles))
        self.assertTrue(any('Esports' in t for t in titles))

        # Check tickets
        ticket_codes = [t['code'] for t in db['tickets']]
        self.assertIn('TKT-DEMO-VALID-01', ticket_codes)
        self.assertIn('TKT-DEMO-USED-01', ticket_codes)

        # Check vouchers
        voucher_codes = [v['code'] for v in db['vouchers']]
        self.assertIn('VIPHEMAT10', voucher_codes)

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
