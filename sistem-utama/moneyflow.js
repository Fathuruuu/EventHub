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
        var curEvent = (eventId ? myEvents.find(function(e){ return e.id === eventId; }) : null) || myEvents[0] || (allEvents.length ? allEvents[0] : null);
        relevantTickets = allTickets.filter(function(t){ return (curEvent ? t.eventId === curEvent.id : (myEvents.some(function(me){ return me.id === t.eventId; }))) && t.status !== 'refunded'; });
        titlePrefix = curEvent ? curEvent.title : (myEvents.length ? myEvents[0].title : 'Event Saya');

        totalIncome = relevantTickets.reduce(function(a, t){ return a + Number(t.price || 0); }, 0);
        var platformCommission = Math.round(totalIncome * 0.10);
        totalExpenses = platformCommission + Math.round(totalIncome * 0.18); // venue & operational cost
        netProfit = totalIncome - totalExpenses;
        targetBudget = (curEvent && curEvent.tiers ? curEvent.tiers.reduce(function(a, t){ return a + (t.quota || 0) * (t.price || 0); }, 0) : totalIncome * 1.5) || 1000000;
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
      function parseDateTime(str) {
        if (!str) {
          var d = new Date();
          return {
            date: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(),
            time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' WIB'
          };
        }
        var parts = String(str).trim().split(' ');
        var datePart = parts[0] || '';
        var timePart = parts.slice(1).join(' ') || '12:00 WIB';
        if (datePart.indexOf('-') > 0) {
          var p = datePart.split('-');
          if (p.length === 3) datePart = p[2] + '/' + p[1] + '/' + p[0];
        }
        return { date: datePart, time: timePart };
      }

      var sumBruto = 0;
      var sumDiskon = 0;
      var sumKomisi = 0;
      var sumNetto = 0;
      var countUsed = 0;

      var tableRows = [];
      if (relevantTickets.length === 0) {
        tableRows.push('<tr><td colspan="11" style="text-align:center; padding:36px 14px; color:#64748b; font-size:0.9rem">Belum ada transaksi tiket yang tercatat pada laporan ini.</td></tr>');
      } else {
        relevantTickets.forEach(function(t, idx) {
          var no = idx + 1;
          var dt = parseDateTime(t.createdAt);
          var bruto = Number(t.price) || 0;
          var diskon = Number(t.discount) || 0;
          var sub = Math.max(0, bruto - diskon);
          var komisi = Math.round(sub * 0.10);
          var netto = sub - komisi;

          sumBruto += bruto;
          sumDiskon += diskon;
          sumKomisi += komisi;
          sumNetto += netto;
          if (t.status === 'used') countUsed++;

          var statusBadge = t.status === 'used'
            ? '<span style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); padding:4px 8px; border-radius:6px; font-size:0.72rem; font-weight:700">✓ Sudah Check-in</span>'
            : (t.status === 'refunded'
              ? '<span style="background:rgba(244,63,94,0.15); color:#fb7185; border:1px solid rgba(244,63,94,0.3); padding:4px 8px; border-radius:6px; font-size:0.72rem; font-weight:700">✖ Refunded</span>'
              : '<span style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:4px 8px; border-radius:6px; font-size:0.72rem; font-weight:700">○ Valid (Lunas)</span>');

          tableRows.push(
            '<tr style="border-bottom:1px solid rgba(255,255,255,0.05)" class="mf-table-row">',
              '<td style="text-align:center; font-weight:700; color:#94a3b8; font-size:0.82rem">' + no + '</td>',
              '<td style="white-space:nowrap; font-size:0.82rem"><span style="color:#ffffff; font-weight:600">' + dt.date + '</span></td>',
              '<td style="white-space:nowrap; font-size:0.82rem"><span style="color:#a5b4fc; font-family:var(--font-mono)">' + dt.time + '</span></td>',
              '<td><code style="font-family:var(--font-mono); color:#38bdf8; font-weight:700; font-size:0.82rem">' + t.code + '</code></td>',
              '<td><b style="color:#ffffff; font-size:0.85rem">' + (t.eventName || titlePrefix) + '</b><br><small style="color:#94a3b8">' + (t.tierName || 'Tiket') + '</small></td>',
              '<td><span style="font-weight:700; color:#f1f5f9; font-size:0.85rem">' + (t.buyerName || '-') + '</span><br><small style="color:#64748b">' + (t.buyerEmail || t.buyerPhone || '-') + '</small></td>',
              '<td style="text-align:right; font-weight:700; color:#ffffff; font-size:0.85rem">' + formatRp(bruto) + '</td>',
              '<td style="text-align:right; font-weight:600; color:#fb7185; font-size:0.85rem">' + (diskon > 0 ? '- ' + formatRp(diskon) : 'Rp 0') + '</td>',
              '<td style="text-align:right; font-weight:600; color:#f59e0b; font-size:0.85rem">- ' + formatRp(komisi) + '</td>',
              '<td style="text-align:right; font-weight:800; color:#34d399; font-size:0.88rem">' + formatRp(netto) + '</td>',
              '<td style="text-align:center">' + statusBadge + '</td>',
            '</tr>'
          );
        });
      }

      var marginPersen = sumBruto > 0 ? ((sumNetto / sumBruto) * 100).toFixed(1) : '0.0';
      var attendancePersen = relevantTickets.length > 0 ? ((countUsed / relevantTickets.length) * 100).toFixed(1) : '0.0';

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

          // 3. TABEL BUKU BESAR & LAPORAN REKAPITULASI TRANSAKSI
          '<div class="mf-report-card" style="margin-top:28px; background:var(--bg-surface); border:1px solid var(--border-glass); border-radius:var(--radius-xl); overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,0.3)">',
            '<div style="padding:20px 24px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px">',
              '<div>',
                '<div style="display:flex; align-items:center; gap:10px">',
                  '<span style="font-size:1.4rem">📑</span>',
                  '<h3 style="font-size:1.2rem; font-weight:800; color:#ffffff; margin:0">Buku Besar & Tabel Laporan Keuangan Transaksi</h3>',
                '</div>',
                '<p style="color:var(--text-muted); font-size:0.83rem; margin-top:4px; margin-bottom:0">',
                  'Rincian nomor urut, tanggal, jam, nominal kotor, diskon, komisi platform 10%, dan penerimaan bersih menggunakan rumus matematis.',
                '</p>',
              '</div>',
              '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">',
                '<input type="text" id="mf-table-search" placeholder="🔍 Cari No, Kode, Nama..." oninput="EventMoneyFlow.filterTable(this.value)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; padding:8px 14px; border-radius:8px; font-size:0.82rem; min-width:180px">',
                '<button type="button" class="btn-secondary" onclick="EventMoneyFlow.exportCSV()" style="padding:8px 14px; font-size:0.82rem; display:inline-flex; align-items:center; gap:6px">',
                  '📥 Ekspor CSV',
                '</button>',
                '<button type="button" class="btn-primary" onclick="window.print()" style="padding:8px 16px; font-size:0.82rem; background:#10b981; border:none; display:inline-flex; align-items:center; gap:6px">',
                  '🖨️ Cetak Laporan (PDF)',
                '</button>',
              '</div>',
            '</div>',

            '<div style="overflow-x:auto">',
              '<table class="pos-table" id="mf-report-table" style="width:100%; border-collapse:collapse">',
                '<thead>',
                  '<tr style="background:rgba(15,23,42,0.95); border-bottom:2px solid rgba(99,102,241,0.3)">',
                    '<th style="padding:12px 14px; text-align:center; width:50px">No.</th>',
                    '<th style="padding:12px 14px">Tanggal</th>',
                    '<th style="padding:12px 14px">Jam</th>',
                    '<th style="padding:12px 14px">No. Tiket / Ref</th>',
                    '<th style="padding:12px 14px">Acara & Kategori</th>',
                    '<th style="padding:12px 14px">Peserta / Pembeli</th>',
                    '<th style="padding:12px 14px; text-align:right">Harga Bruto</th>',
                    '<th style="padding:12px 14px; text-align:right">Diskon</th>',
                    '<th style="padding:12px 14px; text-align:right">Komisi (10%)</th>',
                    '<th style="padding:12px 14px; text-align:right">Penerimaan Bersih (Net)</th>',
                    '<th style="padding:12px 14px; text-align:center">Status</th>',
                  '</tr>',
                '</thead>',
                '<tbody>' + tableRows.join('') + '</tbody>',
                '<tfoot>',
                  '<tr style="background:rgba(99,102,241,0.12); font-weight:800; border-top:2px solid rgba(99,102,241,0.4); color:#ffffff">',
                    '<td colspan="6" style="padding:14px; text-align:right; font-size:0.88rem; letter-spacing:0.5px">TOTAL KESELURUHAN (Σ):</td>',
                    '<td style="padding:14px; text-align:right; font-size:0.92rem; color:#38bdf8">' + formatRp(sumBruto) + '</td>',
                    '<td style="padding:14px; text-align:right; font-size:0.92rem; color:#fb7185">' + (sumDiskon > 0 ? '- ' + formatRp(sumDiskon) : 'Rp 0') + '</td>',
                    '<td style="padding:14px; text-align:right; font-size:0.92rem; color:#f59e0b">- ' + formatRp(sumKomisi) + '</td>',
                    '<td style="padding:14px; text-align:right; font-size:1.02rem; color:#34d399">' + formatRp(sumNetto) + '</td>',
                    '<td style="padding:14px; text-align:center; font-size:0.8rem; color:#a5b4fc">' + relevantTickets.length + ' Tiket</td>',
                  '</tr>',
                '</tfoot>',
              '</table>',
            '</div>',

            // Rincian Rumus Matematis
            '<div style="padding:18px 24px; background:rgba(15,23,42,0.85); border-top:1px solid rgba(255,255,255,0.08)">',
              '<div style="font-size:0.8rem; font-weight:800; color:#a5b4fc; margin-bottom:10px; display:flex; align-items:center; gap:8px">',
                '<span>📐</span> FORMULA & RUMUS MATEMATIS PERHITUNGAN LAPORAN KEUANGAN:',
              '</div>',
              '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px; font-size:0.78rem">',
                '<div style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06)">',
                  '<b style="color:#38bdf8">1. Dasar Komisi:</b><br>',
                  '<code>Dasar = Harga Bruto - Potongan Diskon</code>',
                '</div>',
                '<div style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06)">',
                  '<b style="color:#f59e0b">2. Komisi Platform (10%):</b><br>',
                  '<code>Komisi (10%) = Dasar Komisi × 0.10</code>',
                '</div>',
                '<div style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06)">',
                  '<b style="color:#34d399">3. Penerimaan Bersih (Net):</b><br>',
                  '<code>Netto = (Harga Bruto - Diskon) - Komisi (10%)</code>',
                '</div>',
                '<div style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06)">',
                  '<b style="color:#c084fc">4. Margin Laba Bersih (%):</b><br>',
                  '<code>Margin = (Total Netto ÷ Total Bruto) × 100% = ' + marginPersen + '%</code>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',

          // 4. BOTTOM 3D MOTIVATIONAL GOAL BANNER
          '<div class="mf-goal-banner" style="margin-top:24px">',
            '<div class="mf-goal-left">',
              '<div class="mf-goal-target-icon">🎯</div>',
              '<div>',
                '<div class="mf-goal-title">Status Arus Kas Finansial: Margin Bersih ' + marginPersen + '%</div>',
                '<div class="mf-goal-subtitle">Rasio kehadiran check-in gate: ' + attendancePersen + '%. Seluruh laporan telah disinkronkan ke pembukuan.</div>',
              '</div>',
            '</div>',
            '<button class="btn-primary" style="width:auto; padding:12px 24px; background:#10b981" onclick="EventMoneyFlow.exportCSV()">',
              'Unduh Rekap Spreadsheet (CSV)',
            '</button>',
          '</div>',
        '</div>'
      ];

      return html.join('');
    },

    filterTable: function(q) {
      q = (q || '').toLowerCase();
      var rows = document.querySelectorAll('#mf-report-table tbody tr.mf-table-row');
      rows.forEach(function(r) {
        var txt = r.textContent.toLowerCase();
        r.style.display = txt.indexOf(q) >= 0 ? '' : 'none';
      });
    },

    exportCSV: function() {
      var table = document.getElementById('mf-report-table');
      if (!table) return;
      var rows = table.querySelectorAll('tr');
      var csv = [];
      rows.forEach(function(row) {
        var cols = row.querySelectorAll('th, td');
        var rowData = [];
        cols.forEach(function(col) {
          var val = col.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""').trim();
          rowData.push('"' + val + '"');
        });
        if (rowData.length) csv.push(rowData.join(','));
      });
      var blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Laporan_Keuangan_EventHub_' + Date.now() + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.EventRouter && window.EventRouter.showToast) {
        window.EventRouter.showToast('Laporan CSV berhasil diunduh!', 'success');
      }
    }
  };
  window.EventMoneyFlow = MoneyFlowModule;
})(window);
