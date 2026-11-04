/**
 * EventHub Pro - MoneyFlow Financial Analytics & Cash Flow Desk
 * Direct implementation of MoneyFlow (KPIs with sparklines, donut chart, trend line, tier budgets, ledger)
 */
(function(window) {
  'use strict';

  var Store = window.EventStore;
  var Router = window.EventRouter;
  var formatRp = Router.formatRp;

  var MoneyFlowModule = {
    renderMoneyFlowView: function(scope, eventId) {
      scope = scope || 'organizer'; // 'organizer' | 'admin' | 'peserta'
      var user = Store.getCurrentUser();
      var allEvents = Store.getEvents();
      var allTickets = Store.getTickets();

      var relevantTickets = [];
      var titlePrefix = '';
      var totalIncome = 0;
      var totalExpenses = 0;
      var netProfit = 0;
      var targetBudget = 0;

      if (scope === 'organizer') {
        var myEvents = Store.getOrganizerEvents(user ? user.email : '');
        var curEvent = myEvents.find(function(e){ return e.id === eventId; }) || myEvents[0] || allEvents[0];
        relevantTickets = allTickets.filter(function(t){ return t.eventId === curEvent.id && t.status !== 'refunded'; });
        titlePrefix = curEvent ? curEvent.title : 'Event Saya';

        totalIncome = relevantTickets.reduce(function(a, t){ return a + t.price; }, 0);
        var platformCommission = Math.round(totalIncome * 0.10);
        totalExpenses = platformCommission + Math.round(totalIncome * 0.18); // venue & operational cost
        netProfit = totalIncome - totalExpenses;
        targetBudget = (curEvent ? curEvent.tiers.reduce(function(a, t){ return a + t.quota * t.price; }, 0) : totalIncome * 1.5) || 1000000;
      } else if (scope === 'admin') {
        relevantTickets = allTickets.filter(function(t){ return t.status !== 'refunded'; });
        titlePrefix = 'Platform Nasional';
        totalIncome = relevantTickets.reduce(function(a, t){ return a + t.price; }, 0);
        var comm = Math.round(totalIncome * 0.10);
        totalExpenses = totalIncome - comm; // Payout to organizers
        netProfit = comm; // Net platform earnings
        targetBudget = totalIncome * 1.25 || 10000000;
      } else {
        // Peserta personal ticket expenses
        relevantTickets = user ? Store.getUserTickets(user.email) : [];
        titlePrefix = 'Pengeluaran Tiket Saya';
        totalExpenses = relevantTickets.reduce(function(a, t){ return a + t.price + (t.fee || 0); }, 0);
        totalIncome = totalExpenses * 1.4; // simulated monthly leisure budget
        netProfit = totalIncome - totalExpenses;
        targetBudget = 2500000;
      }

      var budgetPercent = Math.min(100, Math.round((totalExpenses / Math.max(targetBudget, 1)) * 100));

      var html = [
        '<div class="mf-container view-animated">',
          '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">',
            '<div>',
              '<h2 style="font-size:1.6rem; font-weight:800; color:#ffffff">MoneyFlow • ' + titlePrefix + '</h2>',
              '<p style="color:var(--text-muted); font-size:0.88rem">Pantau arus kas, realisasi penjualan tiket, dan efisiensi finansial acara.</p>',
            '</div>',
            '<div style="display:flex; gap:10px; align-items:center">',
              '<span style="background:var(--bg-surface-elevated); border:1px solid var(--border-glass); padding:8px 16px; border-radius:var(--radius-md); font-size:0.82rem; font-weight:700; color:#a5b4fc">',
                '📅 Periode: Nov 2026',
              '</span>',
            '</div>',
          '</div>',

          // 1. TOP 4 KPI CARDS WITH SPARKLINES
          '<div class="mf-kpi-grid">',
            // Card 1: Expenses
            '<div class="mf-kpi-card">',
              '<div class="mf-kpi-top">',
                '<div class="mf-icon-box mf-icon-purple">↓</div>',
                '<span class="mf-trend-pill trend-up">↗ 8.5% bln ini</span>',
              '</div>',
              '<div>',
                '<div class="mf-kpi-label">Total Pengeluaran / Biaya</div>',
                '<div class="mf-kpi-val">' + formatRp(totalExpenses) + '</div>',
              '</div>',
              '<div class="mf-kpi-footer">',
                '<small style="color:var(--text-dim); font-size:0.75rem">Biaya venue & komisi</small>',
                '<svg class="mf-sparkline" viewBox="0 0 100 30"><path d="M0,25 Q25,5 50,18 T100,8" fill="none" stroke="#c084fc" stroke-width="2.5"/><circle cx="100" cy="8" r="3" fill="#c084fc"/></svg>',
              '</div>',
            '</div>',

            // Card 2: Income
            '<div class="mf-kpi-card">',
              '<div class="mf-kpi-top">',
                '<div class="mf-icon-box mf-icon-green">↑</div>',
                '<span class="mf-trend-pill trend-up">↗ 14.2% bln ini</span>',
              '</div>',
              '<div>',
                '<div class="mf-kpi-label">Total Pemasukan Tiket</div>',
                '<div class="mf-kpi-val" style="color:#34d399">' + formatRp(totalIncome) + '</div>',
              '</div>',
              '<div class="mf-kpi-footer">',
                '<small style="color:var(--text-dim); font-size:0.75rem">' + relevantTickets.length + ' tiket terjual</small>',
                '<svg class="mf-sparkline" viewBox="0 0 100 30"><path d="M0,26 Q30,10 60,20 T100,5" fill="none" stroke="#34d399" stroke-width="2.5"/><circle cx="100" cy="5" r="3" fill="#34d399"/></svg>',
              '</div>',
            '</div>',

            // Card 3: Net Profit
            '<div class="mf-kpi-card">',
              '<div class="mf-kpi-top">',
                '<div class="mf-icon-box mf-icon-orange">⚖️</div>',
                '<span class="mf-trend-pill trend-up">↗ 12.4% bln ini</span>',
              '</div>',
              '<div>',
                '<div class="mf-kpi-label">Laba Bersih (Net Profit)</div>',
                '<div class="mf-kpi-val" style="color:#fbbf24">' + formatRp(netProfit) + '</div>',
              '</div>',
              '<div class="mf-kpi-footer">',
                '<small style="color:var(--text-dim); font-size:0.75rem">Surplus kas bersih</small>',
                '<svg class="mf-sparkline" viewBox="0 0 100 30"><path d="M0,22 Q35,8 70,16 T100,10" fill="none" stroke="#fbbf24" stroke-width="2.5"/><circle cx="100" cy="10" r="3" fill="#fbbf24"/></svg>',
              '</div>',
            '</div>',

            // Card 4: Budget / Quota Progress
            '<div class="mf-kpi-card">',
              '<div class="mf-kpi-top">',
                '<div class="mf-icon-box mf-icon-blue">🎯</div>',
                '<span style="font-size:0.78rem; font-weight:800; color:#38bdf8">' + budgetPercent + '%</span>',
              '</div>',
              '<div>',
                '<div class="mf-kpi-label">Realisasi Target Kas</div>',
                '<div class="mf-kpi-val" style="color:#38bdf8">' + budgetPercent + '%</div>',
              '</div>',
              '<div style="margin-top:14px">',
                '<div style="height:6px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; margin-bottom:4px">',
                  '<div style="height:100%; width:' + budgetPercent + '%; background:linear-gradient(90deg, #38bdf8, #6366f1); border-radius:99px"></div>',
                '</div>',
                '<small style="color:var(--text-dim); font-size:0.72rem">Target: ' + formatRp(targetBudget) + '</small>',
              '</div>',
            '</div>',
          '</div>',

          // 2. CHARTS ROW (Donut Chart & Trend Line Graph)
          '<div class="mf-charts-grid">',
            // Left Chart: Category Breakdown Donut Chart
            '<div class="mf-chart-card">',
              '<div class="mf-chart-header">',
                '<div class="mf-chart-title">Distribusi Omset per Kategori</div>',
                '<span style="font-size:0.75rem; color:var(--text-dim)">Bulan Ini</span>',
              '</div>',
              '<div class="mf-donut-layout">',
                '<div class="mf-donut-visual">',
                  '<svg viewBox="0 0 100 100" width="100%" height="100%">',
                    '<circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>',
                    '<circle cx="50" cy="50" r="38" fill="none" stroke="#6366f1" stroke-width="12" stroke-dasharray="90 150" stroke-dashoffset="0"/>',
                    '<circle cx="50" cy="50" r="38" fill="none" stroke="#ec4899" stroke-width="12" stroke-dasharray="60 180" stroke-dashoffset="-90"/>',
                    '<circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="45 195" stroke-dashoffset="-150"/>',
                    '<circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" stroke-width="12" stroke-dasharray="30 210" stroke-dashoffset="-195"/>',
                  '</svg>',
                  '<div class="mf-donut-center">',
                    '<b>' + formatRp(totalIncome).replace('Rp ', '') + '</b>',
                    '<span>Total Omset</span>',
                  '</div>',
                '</div>',

                '<div class="mf-donut-legend">',
                  '<div class="mf-legend-item">',
                    '<span class="mf-legend-label"><span class="mf-legend-dot" style="background:#6366f1"></span> VIP & Early Bird</span>',
                    '<b>42.5%</b>',
                  '</div>',
                  '<div class="mf-legend-item">',
                    '<span class="mf-legend-label"><span class="mf-legend-dot" style="background:#ec4899"></span> Presale Regular</span>',
                    '<b>28.0%</b>',
                  '</div>',
                  '<div class="mf-legend-item">',
                    '<span class="mf-legend-label"><span class="mf-legend-dot" style="background:#10b981"></span> Festival Pass</span>',
                    '<b>18.5%</b>',
                  '</div>',
                  '<div class="mf-legend-item">',
                    '<span class="mf-legend-label"><span class="mf-legend-dot" style="background:#f59e0b"></span> F&B / Merch Bundle</span>',
                    '<b>11.0%</b>',
                  '</div>',
                '</div>',
              '</div>',
              '<div style="background:rgba(99,102,241,0.1); padding:10px 14px; border-radius:10px; margin-top:20px; font-size:0.8rem; color:#a5b4fc">',
                '★ <b>Kategori Terlaris:</b> VIP & Early Bird mendominasi 42.5% volume penjualan.',
              '</div>',
            '</div>',

            // Right Chart: Cash Flow & Sales Trend Line Graph
            '<div class="mf-chart-card">',
              '<div class="mf-chart-header">',
                '<div class="mf-chart-title">Tren Arus Kas Penjualan Tiket (7 Hari Terakhir)</div>',
                '<span style="font-size:0.75rem; color:#34d399; font-weight:700">↗ +18.4% Pertumbuhan</span>',
              '</div>',

              '<div style="width:100%; height:200px; position:relative; margin-bottom:12px">',
                '<svg viewBox="0 0 500 180" width="100%" height="100%" preserveAspectRatio="none">',
                  '<defs>',
                    '<linearGradient id="mfLineGrad" x1="0" y1="0" x2="0" y2="1">',
                      '<stop offset="0%" stop-color="#6366f1" stop-opacity="0.45"/>',
                      '<stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>',
                    '</linearGradient>',
                  '</defs>',
                  // Grid lines
                  '<line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>',
                  '<line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>',
                  '<line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>',

                  // Gradient Area
                  '<path d="M 0 160 Q 80 140, 160 110 T 320 60 T 420 40 T 500 20 L 500 180 L 0 180 Z" fill="url(#mfLineGrad)"/>',

                  // Curve Stroke
                  '<path d="M 0 160 Q 80 140, 160 110 T 320 60 T 420 40 T 500 20" fill="none" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round"/>',

                  // Data Points
                  '<circle cx="80" cy="140" r="4.5" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>',
                  '<circle cx="160" cy="110" r="4.5" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>',
                  '<circle cx="320" cy="60" r="4.5" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>',
                  '<circle cx="420" cy="40" r="4.5" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>',
                  '<circle cx="500" cy="20" r="5.5" fill="#34d399" stroke="#ffffff" stroke-width="2"/>',
                '</svg>',
              '</div>',

              '<div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-dim); padding-top:6px; border-top:1px solid rgba(255,255,255,0.08)">',
                '<span>Senin</span>',
                '<span>Selasa</span>',
                '<span>Rabu</span>',
                '<span>Kamis</span>',
                '<span>Jumat</span>',
                '<span>Sabtu</span>',
                '<span style="color:#34d399; font-weight:700">Hari Ini</span>',
              '</div>',
            '</div>',
          '</div>',

          // 3. HORIZONTAL TIER TARGET PROGRESS CARDS
          '<div>',
            '<h3 style="font-size:1.15rem; font-weight:800; color:#ffffff; margin-bottom:14px">Realisasi Target per Kategori Tiket</h3>',
            '<div class="mf-budget-grid">',
              '<div class="mf-budget-card">',
                '<div class="mf-budget-top">',
                  '<div class="mf-budget-icon" style="background:rgba(99,102,241,0.15); color:#818cf8">🎫</div>',
                  '<b>Early Bird</b>',
                '</div>',
                '<div class="mf-budget-amount">Rp 12.000.000 / Rp 12.000.000</div>',
                '<div class="mf-budget-track"><div class="mf-budget-fill" style="width:100%; background:#10b981"></div></div>',
                '<div class="mf-budget-percent" style="color:#10b981">100% Tercapai (Sold Out)</div>',
              '</div>',

              '<div class="mf-budget-card">',
                '<div class="mf-budget-top">',
                  '<div class="mf-budget-icon" style="background:rgba(236,72,153,0.15); color:#f472b6">🎟️</div>',
                  '<b>Presale Regular</b>',
                '</div>',
                '<div class="mf-budget-amount">Rp 29.700.000 / Rp 41.250.000</div>',
                '<div class="mf-budget-track"><div class="mf-budget-fill" style="width:72%; background:#ec4899"></div></div>',
                '<div class="mf-budget-percent">72% Tercapai</div>',
              '</div>',

              '<div class="mf-budget-card">',
                '<div class="mf-budget-top">',
                  '<div class="mf-budget-icon" style="background:rgba(245,158,11,0.15); color:#fbbf24">⭐</div>',
                  '<b>VIP Lounge</b>',
                '</div>',
                '<div class="mf-budget-amount">Rp 11.200.000 / Rp 17.500.000</div>',
                '<div class="mf-budget-track"><div class="mf-budget-fill" style="width:64%; background:#fbbf24"></div></div>',
                '<div class="mf-budget-percent">64% Tercapai</div>',
              '</div>',
            '</div>',
          '</div>',

          // 4. BOTTOM 3D MOTIVATIONAL GOAL BANNER
          '<div class="mf-goal-banner">',
            '<div class="mf-goal-left">',
              '<div class="mf-goal-target-icon">🎯</div>',
              '<div>',
                '<div class="mf-goal-title">Pertumbuhan Arus Kas Finansial Sangat Sehat!</div>',
                '<div class="mf-goal-subtitle">Penjualan tiket berjalan optimal dengan margin keuntungan bersih di atas 65%.</div>',
              '</div>',
            '</div>',
            '<button class="btn-primary" style="width:auto; padding:12px 24px; background:#10b981" onclick="EventHub.showToast(\'Laporan keuangan MoneyFlow diekspor ke PDF!\', \'success\')">',
              'Unduh Laporan Finansial',
            '</button>',
          '</div>',
        '</div>'
      ];

      return html.join('');
    }
  };

  window.EventMoneyFlow = MoneyFlowModule;
})(window);
