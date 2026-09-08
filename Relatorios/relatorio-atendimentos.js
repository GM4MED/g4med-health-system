/* =========================================================
   GM4med · Relatório de Atendimentos · BI · JS
   ========================================================= */
(() => {
    'use strict';
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    /* ============ DATA ============ */
    const COLORS = {
        brand: '#4f46e5', brand2: '#6366f1', purple: '#8b5cf6', cyan: '#06b6d4',
        ok: '#10b981', warn: '#f59e0b', danger: '#ef4444', info: '#0284c7', rose: '#f43f5e',
    };
    const SPECS = [
        { name: 'Cardiologia', color: COLORS.brand, atend: 842, nshow: 5.1, tm: 32, nps: 9.3, rev: 421000, delta: 14.2, trend: [12, 15, 14, 18, 21, 19, 24] },
        { name: 'Ortopedia', color: COLORS.cyan, atend: 678, nshow: 7.4, tm: 28, nps: 8.7, rev: 298000, delta: 8.1, trend: [18, 16, 19, 17, 22, 24, 25] },
        { name: 'Pediatria', color: COLORS.purple, atend: 912, nshow: 4.8, tm: 24, nps: 9.5, rev: 312000, delta: 18.5, trend: [10, 14, 16, 19, 22, 26, 28] },
        { name: 'Ginecologia', color: COLORS.rose, atend: 587, nshow: 6.2, tm: 30, nps: 9.1, rev: 264000, delta: 5.4, trend: [14, 15, 17, 16, 18, 19, 20] },
        { name: 'Dermatologia', color: COLORS.warn, atend: 521, nshow: 8.1, tm: 22, nps: 8.9, rev: 189000, delta: -2.3, trend: [20, 18, 17, 16, 15, 16, 17] },
        { name: 'Neurologia', color: COLORS.info, atend: 412, nshow: 7.7, tm: 38, nps: 9.0, rev: 248000, delta: 11.0, trend: [10, 12, 14, 15, 17, 19, 21] },
        { name: 'Endocrinologia', color: COLORS.ok, atend: 389, nshow: 5.9, tm: 28, nps: 9.2, rev: 187000, delta: 6.7, trend: [14, 15, 16, 17, 18, 19, 20] },
        { name: 'Oftalmologia', color: COLORS.danger, atend: 486, nshow: 6.5, tm: 20, nps: 8.8, rev: 172000, delta: 9.4, trend: [12, 13, 14, 16, 18, 19, 21] },
    ];
    const DOCTORS = [
        { name: 'Dra. Mariana Costa', spec: 'Cardiologia', atend: 312, nps: 9.6, punc: 96, initials: 'MC' },
        { name: 'Dr. Felipe Andrade', spec: 'Ortopedia', atend: 289, nps: 9.2, punc: 92, initials: 'FA' },
        { name: 'Dra. Helena Vieira', spec: 'Pediatria', atend: 276, nps: 9.7, punc: 94, initials: 'HV' },
        { name: 'Dr. Rafael Mendes', spec: 'Cardiologia', atend: 251, nps: 9.0, punc: 88, initials: 'RM' },
        { name: 'Dra. Larissa Souza', spec: 'Ginecologia', atend: 238, nps: 9.4, punc: 91, initials: 'LS' },
        { name: 'Dr. Bruno Almeida', spec: 'Neurologia', atend: 217, nps: 9.1, punc: 87, initials: 'BA' },
        { name: 'Dra. Paula Ribeiro', spec: 'Pediatria', atend: 204, nps: 9.5, punc: 93, initials: 'PR' },
        { name: 'Dr. Gustavo Lima', spec: 'Dermatologia', atend: 189, nps: 8.8, punc: 85, initials: 'GL' },
        { name: 'Dra. Camila Torres', spec: 'Endocrinologia', atend: 178, nps: 9.3, punc: 90, initials: 'CT' },
        { name: 'Dr. André Castro', spec: 'Oftalmologia', atend: 164, nps: 8.9, punc: 89, initials: 'AC' },
    ];
    const STATUSES = [
        { label: 'Realizadas', value: 67, color: COLORS.ok },
        { label: 'Confirmadas', value: 14, color: COLORS.brand },
        { label: 'Aguardando', value: 8, color: COLORS.info },
        { label: 'No-Show', value: 6, color: COLORS.warn },
        { label: 'Canceladas', value: 5, color: COLORS.danger },
    ];
    const WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const WEEK_DATA = [842, 891, 654, 789, 803, 512, 336];
    const INSURANCES = [
        { name: 'Particular', value: 34, color: COLORS.brand },
        { name: 'Unimed', value: 24, color: COLORS.cyan },
        { name: 'Bradesco Saúde', value: 14, color: COLORS.purple },
        { name: 'SulAmérica', value: 11, color: COLORS.rose },
        { name: 'Amil', value: 9, color: COLORS.warn },
        { name: 'Outros', value: 8, color: COLORS.info },
    ];

    const charts = {};
    const ctx = id => $('#' + id).getContext('2d');

    /* ============ CHART DEFAULTS ============ */
    function cfgChart() {
        const dark = document.documentElement.dataset.theme === 'dark';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = dark ? '#94a3b8' : '#64748b';
        Chart.defaults.borderColor = dark ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.06)';
    }

    const tooltip = {
        enabled: true,
        backgroundColor: 'rgba(15,23,42,.95)',
        titleColor: '#fff', titleFont: { weight: 700, size: 12.5 },
        bodyColor: '#e2e8f0', bodyFont: { size: 12 },
        padding: 12, cornerRadius: 10, boxPadding: 6, displayColors: true, usePointStyle: true,
        borderColor: 'rgba(255,255,255,.08)', borderWidth: 1,
    };

    /* ============ CHART: DOCTORS ============ */
    function chartDoctors(mode = 'bar') {
        const top = DOCTORS.slice(0, 10);
        const grad = ctx('chartDoctors').createLinearGradient(0, 0, 0, 300);
        grad.addColorStop(0, COLORS.brand);
        grad.addColorStop(1, COLORS.cyan);
        charts.doctors?.destroy();
        charts.doctors = new Chart(ctx('chartDoctors'), {
            type: 'bar',
            data: {
                labels: top.map(d => d.name.replace('Dra. ', '').replace('Dr. ', '')),
                datasets: [{
                    label: 'Atendimentos',
                    data: top.map(d => d.atend),
                    backgroundColor: grad,
                    borderRadius: 8,
                    maxBarThickness: 32,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                indexAxis: mode === 'bar-h' ? 'y' : 'x',
                plugins: { legend: { display: false }, tooltip },
                scales: {
                    x: { grid: { display: mode === 'bar-h' }, border: { display: false }, ticks: { font: { size: 11 } } },
                    y: { grid: { color: 'rgba(15,23,42,.05)' }, border: { display: false }, beginAtZero: true, ticks: { font: { size: 11 } } }
                }
            }
        });
    }

    /* ============ CHART: STATUS DOUGHNUT ============ */
    function chartStatus() {
        charts.status?.destroy();
        charts.status = new Chart(ctx('chartStatus'), {
            type: 'doughnut',
            data: { labels: STATUSES.map(s => s.label), datasets: [{ data: STATUSES.map(s => s.value), backgroundColor: STATUSES.map(s => s.color), borderWidth: 0, spacing: 3, hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } } }
            }
        });
        // legend
        $('#legendStatus').innerHTML = STATUSES.map(s => `<span class="legend-item"><span class="sw" style="background:${s.color}"></span>${s.label} <b style="margin-left:6px;color:var(--ink);font-weight:700">${s.value}%</b></span>`).join('');
    }

    /* ============ CHART: SPECIALITIES ============ */
    function chartSpec() {
        charts.spec?.destroy();
        charts.spec = new Chart(ctx('chartSpec'), {
            type: 'polarArea',
            data: {
                labels: SPECS.map(s => s.name),
                datasets: [{ data: SPECS.map(s => s.atend), backgroundColor: SPECS.map(s => s.color + 'cc'), borderWidth: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 10, padding: 10, usePointStyle: true } },
                    tooltip
                },
                scales: { r: { ticks: { display: false }, grid: { color: 'rgba(15,23,42,.08)' }, angleLines: { color: 'rgba(15,23,42,.05)' } } }
            }
        });
    }

    /* ============ CHART: WEEK DAYS ============ */
    function chartWeek() {
        const max = Math.max(...WEEK_DATA);
        const colors = WEEK_DATA.map(v => {
            const ratio = v / max;
            if (ratio > .85) return COLORS.brand;
            if (ratio > .6) return COLORS.brand2;
            if (ratio > .4) return COLORS.cyan;
            return '#a5b4fc';
        });
        charts.week?.destroy();
        charts.week = new Chart(ctx('chartWeek'), {
            type: 'bar',
            data: { labels: WEEK, datasets: [{ data: WEEK_DATA, backgroundColor: colors, borderRadius: 10, maxBarThickness: 36 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip },
                scales: {
                    x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11.5, weight: 600 } } },
                    y: { grid: { color: 'rgba(15,23,42,.05)' }, border: { display: false }, beginAtZero: true, ticks: { font: { size: 11 } } }
                }
            }
        });
    }

    /* ============ HEATMAP HOUR×DAY ============ */
    function heatmap() {
        const hours = ['07h', '08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h'];
        const el = $('#heatmap');
        let html = `<div></div>` + WEEK.map(d => `<div class="hm-th">${d}</div>`).join('');
        hours.forEach(h => {
            html += `<div class="hm-rh">${h}</div>`;
            for (let d = 0; d < 7; d++) {
                const hh = parseInt(h);
                // simulate intensity: 9-12 and 14-17 high; weekend lower
                let intensity = 0.2;
                if ((hh >= 9 && hh <= 11) || (hh >= 14 && hh <= 17)) intensity = 0.7;
                if (hh === 10 || hh === 15) intensity = 0.95;
                if (d >= 5) intensity *= 0.4;
                intensity *= (0.85 + Math.random() * 0.3);
                intensity = Math.min(intensity, 1);
                const colors = ['#eef2ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#3730a3'];
                const idx = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
                const c = colors[idx];
                const v = Math.round(intensity * 60);
                html += `<div class="hm-cell" style="background:${c}" title="${h} · ${WEEK[d]}: ${v} atendimentos"></div>`;
            }
        });
        el.innerHTML = html;
    }

    /* ============ CHART: HISTORY ============ */
    function chartHistory(metric = 'all') {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const real = [3812, 3920, 4102, 4230, 4118, 4382, 4521, 4678, 4812, 4827, 0, 0];
        const target = [3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900];
        const prev = [3520, 3601, 3782, 3850, 3902, 3988, 4012, 4180, 4310, 4456, 4520, 4612];

        const c = ctx('chartHistory');
        const grad1 = c.createLinearGradient(0, 0, 0, 380);
        grad1.addColorStop(0, 'rgba(79,70,229,.35)');
        grad1.addColorStop(1, 'rgba(79,70,229,0)');

        const datasets = [];
        if (metric === 'all' || metric === 'real') datasets.push({ label: 'Realizado', data: real.map(v => v || null), borderColor: COLORS.brand, backgroundColor: grad1, fill: true, tension: .4, borderWidth: 3, pointRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: COLORS.brand, pointBorderWidth: 2, pointHoverRadius: 7 });
        if (metric === 'all' || metric === 'target') datasets.push({ label: 'Meta', data: target, borderColor: COLORS.ok, borderDash: [6, 4], borderWidth: 2, pointRadius: 0, tension: .4, fill: false });
        if (metric === 'all' || metric === 'prev') datasets.push({ label: 'Ano Anterior', data: prev, borderColor: COLORS.ink3 || '#94a3b8', borderWidth: 2, pointRadius: 3, tension: .4, fill: false, borderDash: [2, 3] });

        charts.history?.destroy();
        charts.history = new Chart(c, {
            type: 'line',
            data: { labels: months, datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 12 }, usePointStyle: true, padding: 14, boxWidth: 8 } },
                    tooltip
                },
                scales: {
                    x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11.5 } } },
                    y: { grid: { color: 'rgba(15,23,42,.05)' }, border: { display: false }, beginAtZero: false, ticks: { font: { size: 11 }, callback: v => v.toLocaleString('pt-BR') } }
                }
            }
        });
    }

    /* ============ SPARKLINES ============ */
    function sparklines() {
        $$('.spark').forEach(el => {
            const color = COLORS[el.dataset.spark] || COLORS.brand;
            const data = Array.from({ length: 14 }, () => Math.random() * 40 + 30);
            const c = el.getContext('2d');
            const grad = c.createLinearGradient(0, 0, 0, 40);
            grad.addColorStop(0, color + '66'); grad.addColorStop(1, color + '00');
            new Chart(c, {
                type: 'line',
                data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, backgroundColor: grad, fill: true, tension: .4, borderWidth: 2, pointRadius: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
            });
        });
    }

    /* ============ TREND MINI CHARTS (table) ============ */
    function trendMini(canvas, data, color) {
        const c = canvas.getContext('2d');
        const grad = c.createLinearGradient(0, 0, 0, 30);
        grad.addColorStop(0, color + '55'); grad.addColorStop(1, color + '00');
        new Chart(c, {
            type: 'line',
            data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, backgroundColor: grad, fill: true, tension: .4, borderWidth: 1.8, pointRadius: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }

    /* ============ BAR LIST: INSURANCES ============ */
    function renderInsurance() {
        const max = Math.max(...INSURANCES.map(i => i.value));
        $('#topInsurance').innerHTML = INSURANCES.map(i => `
    <div class="bar-item">
      <div class="bar-head"><strong>${i.name}</strong><span>${i.value}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(i.value / max * 100).toFixed(1)}%;background:${i.color}"></div></div>
    </div>
  `).join('');
    }

    /* ============ RANK TABLE ============ */
    function renderRank() {
        const tb = $('#rankTable tbody');
        // composite score: volume normalized + nps + punc
        const max = Math.max(...DOCTORS.map(d => d.atend));
        const ranked = DOCTORS.map(d => {
            const score = ((d.atend / max) * 40 + (d.nps / 10) * 30 + (d.punc / 100) * 30);
            return { ...d, score: Math.round(score * 10) / 10 };
        }).sort((a, b) => b.score - a.score);
        tb.innerHTML = ranked.map((d, i) => {
            const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            return `
    <tr>
      <td><span class="rank-pos ${cls}">${i + 1}</span></td>
      <td><div class="doc-cell"><div class="av">${d.initials}</div><div><strong>${d.name}</strong><small>${d.spec}</small></div></div></td>
      <td>${d.spec}</td>
      <td><b style="font-family:'JetBrains Mono',monospace">${d.atend}</b></td>
      <td><b style="color:${d.nps >= 9.3 ? 'var(--ok)' : d.nps >= 9 ? 'var(--brand)' : 'var(--warn)'};font-weight:700">${d.nps.toFixed(1)}</b></td>
      <td>${d.punc}%</td>
      <td><div class="score-bar"><div class="bar"><span style="width:${d.score}%"></span></div><b>${d.score}</b></div></td>
    </tr>`;
        }).join('');
    }

    /* ============ BREAKDOWN TABLE ============ */
    function renderBreakdown(filter = '') {
        const tb = $('#breakdownTable tbody');
        const list = SPECS.filter(s => !filter || s.name.toLowerCase().includes(filter.toLowerCase()));
        tb.innerHTML = list.map((s, i) => `
    <tr data-idx="${i}">
      <td><div class="spec-cell"><span class="dot" style="background:${s.color}"></span><strong>${s.name}</strong></div></td>
      <td class="num">${s.atend.toLocaleString('pt-BR')}</td>
      <td class="num">${s.nshow.toFixed(1)}%</td>
      <td class="num">${s.tm} min</td>
      <td class="num"><b style="color:${s.nps >= 9.2 ? 'var(--ok)' : 'var(--ink-2)'}">${s.nps.toFixed(1)}</b></td>
      <td class="num">R$ ${(s.rev / 1000).toFixed(0)}k</td>
      <td class="num">${s.delta >= 0 ? `<span class="delta up"><i data-lucide="trending-up"></i>+${s.delta}%</span>` : `<span class="delta down"><i data-lucide="trending-down"></i>${s.delta}%</span>`}</td>
      <td><canvas class="trend-cell" id="trend${i}"></canvas></td>
    </tr>
  `).join('');
        lucide.createIcons();
        list.forEach((s, i) => {
            const c = $('#trend' + i);
            if (c) trendMini(c, s.trend, s.color);
        });
        // totals
        const tot = list.reduce((a, s) => ({ atend: a.atend + s.atend, ns: a.ns + s.nshow * s.atend, tm: a.tm + s.tm * s.atend, nps: a.nps + s.nps * s.atend, rev: a.rev + s.rev }), { atend: 0, ns: 0, tm: 0, nps: 0, rev: 0 });
        $('#tFAtend').textContent = tot.atend.toLocaleString('pt-BR');
        $('#tFNs').textContent = (tot.ns / tot.atend).toFixed(1) + '%';
        $('#tFTm').textContent = Math.round(tot.tm / tot.atend) + ' min';
        $('#tFNps').textContent = (tot.nps / tot.atend).toFixed(1);
        $('#tFRev').textContent = 'R$ ' + (tot.rev / 1000).toFixed(0) + 'k';
    }

    /* ============ COUNTERS ============ */
    function counters() {
        $$('[data-counter]').forEach(el => {
            const target = +el.dataset.counter;
            const dur = 1200; const start = performance.now();
            function tick(now) {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased).toLocaleString('pt-BR');
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    /* ============ TOAST ============ */
    function toast(title, msg = '', type = 'info') {
        const icons = { info: 'info', ok: 'check-circle-2', warn: 'alert-triangle' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i data-lucide="${icons[type]}"></i><div><strong>${title}</strong>${msg ? `<span>${msg}</span>` : ''}</div>`;
        $('#toastBox').appendChild(el);
        lucide.createIcons();
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(40px)' }, 3200);
        setTimeout(() => el.remove(), 3700);
    }

    /* ============ BINDINGS ============ */
    function bind() {
        // theme
        $('#toggleTheme').addEventListener('click', () => {
            const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = cur;
            $('#toggleTheme i').setAttribute('data-lucide', cur === 'dark' ? 'sun' : 'moon');
            lucide.createIcons();
            cfgChart();
            Object.values(charts).forEach(c => c.update());
            toast(`Tema ${cur === 'dark' ? 'escuro' : 'claro'} ativado`);
        });

        // periods
        $$('.period-tabs button').forEach(b => b.addEventListener('click', () => {
            $$('.period-tabs button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            toast('Período atualizado', `${b.textContent.trim()} aplicado`, 'ok');
        }));

        // history seg
        $$('.seg button[data-metric]').forEach(b => b.addEventListener('click', () => {
            b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            chartHistory(b.dataset.metric);
        }));

        // doctors seg
        $$('.seg button[data-mode]').forEach(b => b.addEventListener('click', () => {
            b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            chartDoctors(b.dataset.mode);
        }));

        // refresh
        $('#btnRefresh').addEventListener('click', () => {
            const ic = $('#btnRefresh i');
            ic.style.transition = 'transform .8s';
            ic.style.transform = 'rotate(360deg)';
            setTimeout(() => { ic.style.transform = '' }, 800);
            toast('Dados atualizados', 'Última sincronização agora', 'ok');
            $('#lastUpdate').textContent = 'agora';
        });

        // export / print / share
        $('#btnExport').addEventListener('click', () => {
            const headers = ['Especialidade', 'Atendimentos', 'No-Show', 'Tempo medio', 'NPS', 'Receita', 'Variacao'];
            const rows = SPECS.map(s => [s.name, s.atend, s.nshow, s.tm, s.nps, s.rev, s.delta]);
            const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `relatorio-atendimentos-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            toast('Relatório exportado', 'arquivo CSV gerado', 'ok');
        });
        $('#btnPrint').addEventListener('click', () => window.print());
        $('#btnShare').addEventListener('click', () => {
            if (navigator.share) navigator.share({ title: 'Relatório GM4med', text: 'Veja o relatório', url: location.href }).catch(() => { });
            else { navigator.clipboard?.writeText(location.href); toast('Link copiado', 'Compartilhe com sua equipe', 'ok') }
        });

        // filters apply / clear
        $('#btnApply').addEventListener('click', () => {
            toast('Filtros aplicados', 'Atualizando dashboards...', 'ok');
            counters();
        });
        $('#btnClear').addEventListener('click', () => {
            $$('.filter-bar select').forEach(s => s.selectedIndex = 0);
            $('#dateFrom').value = ''; $('#dateTo').value = '';
            toast('Filtros limpos');
        });

        // table search
        $('#tblSearch').addEventListener('input', e => renderBreakdown(e.target.value));
    }

    /* ============ INIT ============ */
    function init() {
        lucide.createIcons();
        cfgChart();

        chartDoctors();
        chartStatus();
        chartSpec();
        chartWeek();
        chartHistory();
        heatmap();
        sparklines();
        renderInsurance();
        renderRank();
        renderBreakdown();
        counters();
        bind();

        // dates default = last 30 days
        const t = new Date();
        const f = new Date(); f.setDate(f.getDate() - 30);
        $('#dateFrom').valueAsDate = f;
        $('#dateTo').valueAsDate = t;

        setTimeout(() => toast('Bem-vindo ao BI', 'Dados consolidados em tempo real', 'ok'), 400);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
