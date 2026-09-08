/* =====================================================
   GM4med ULTRA — DASHBOARD FINANCEIRO
   Arquivo: financeiro.js
   Padrão: IIFE + módulos (Config / State / Utils / ...)
   ===================================================== */
(function () {
    'use strict';

    /* ===== 1. CONFIG ================================ */
    const Config = {
        locale: 'pt-BR',
        currency: 'BRL',
        storageKey: 'GM4med-financeiro',
        counterDuration: 1100,
    };

    /* ===== 2. UTILS ================================= */
    const Utils = {
        qs: (sel, ctx = document) => ctx.querySelector(sel),
        qsa: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),
        formatBRL(v) {
            return new Intl.NumberFormat(Config.locale, {
                style: 'currency', currency: Config.currency,
                minimumFractionDigits: 2, maximumFractionDigits: 2,
            }).format(v);
        },
        formatNumber(v) {
            return new Intl.NumberFormat(Config.locale, {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
            }).format(v);
        },
        formatDateBR(iso) {
            if (!iso) return '—';
            const [y, m, d] = iso.split('-');
            return `${d}/${m}/${y}`;
        },
        todayISO() {
            const d = new Date();
            return d.toISOString().slice(0, 10);
        },
        uid() { return 'lc_' + Math.random().toString(36).slice(2, 10); },
        debounce(fn, ms = 200) {
            let t;
            return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
        },
        css(name) {
            return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        },
    };

    /* ===== 3. STATE / SEED DATA ===================== */
    const State = {
        lancamentos: [
            { id: 'lc_001', vencimento: '2026-06-02', descricao: 'Consulta cardiológica', cliente: 'Maria Souza', categoria: 'Consultas', valor: 450.00, tipo: 'Entrada', pagamento: 'Pix', banco: 'Itaú' },
            { id: 'lc_002', vencimento: '2026-06-03', descricao: 'Salário equipe enfermagem', cliente: 'Folha Junho', categoria: 'Salários', valor: 18500.00, tipo: 'Saída', pagamento: 'Transferência', banco: 'Bradesco' },
            { id: 'lc_003', vencimento: '2026-06-04', descricao: 'Procedimento - exame ECG', cliente: 'João Almeida', categoria: 'Procedimentos', valor: 890.00, tipo: 'Entrada', pagamento: 'Cartão de Crédito', banco: 'Santander' },
            { id: 'lc_004', vencimento: '2026-06-05', descricao: 'Aluguel da clínica', cliente: 'Imobiliária X', categoria: 'Contas Fixas', valor: 9200.00, tipo: 'Saída', pagamento: 'Boleto', banco: 'Banco do Brasil' },
            { id: 'lc_005', vencimento: '2026-06-06', descricao: 'Consulta pediátrica', cliente: 'Pedro Lima', categoria: 'Consultas', valor: 380.00, tipo: 'Entrada', pagamento: 'Pix', banco: 'Nubank' },
            { id: 'lc_006', vencimento: '2026-06-08', descricao: 'Compra de suprimentos médicos', cliente: 'MedShop', categoria: 'Suprimentos', valor: 2450.00, tipo: 'Saída', pagamento: 'Cartão de Débito', banco: 'Inter' },
            { id: 'lc_007', vencimento: '2026-06-10', descricao: 'Convênio Unimed - repasse', cliente: 'Unimed', categoria: 'Convênios', valor: 6200.00, tipo: 'Entrada', pagamento: 'Transferência', banco: 'Itaú' },
            { id: 'lc_008', vencimento: '2026-06-12', descricao: 'Campanha Google Ads', cliente: 'Google LLC', categoria: 'Marketing', valor: 1500.00, tipo: 'Saída', pagamento: 'Cartão de Crédito', banco: 'Bradesco' },
            { id: 'lc_009', vencimento: '2026-06-15', descricao: 'Procedimento - ressonância', cliente: 'Ana Carvalho', categoria: 'Procedimentos', valor: 2100.00, tipo: 'Entrada', pagamento: 'Pix', banco: 'Caixa' },
            { id: 'lc_010', vencimento: '2026-06-18', descricao: 'Energia elétrica', cliente: 'CPFL', categoria: 'Contas Fixas', valor: 1180.00, tipo: 'Saída', pagamento: 'Boleto', banco: 'Itaú' },
        ],
        filters: { search: '', categoria: '', tipo: '', from: '', to: '' },
        charts: {},
    };

    /* ===== 4. PERSISTENCE =========================== */
    const Storage = {
        load() {
            try {
                const raw = localStorage.getItem(Config.storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length) State.lancamentos = parsed;
                }
            } catch (_) { /* ignore */ }
        },
        save() {
            try { localStorage.setItem(Config.storageKey, JSON.stringify(State.lancamentos)); }
            catch (_) { /* ignore */ }
        },
    };

    /* ===== 5. TOAST ================================== */
    const Toast = {
        container: null,
        init() { this.container = Utils.qs('#toastContainer'); },
        show(title, msg = '', type = 'success') {
            if (!this.container) this.init();
            const icon = { success: 'check-circle-2', error: 'x-circle', warn: 'alert-triangle', info: 'info' }[type] || 'info';
            const el = document.createElement('div');
            el.className = `toast toast--${type}`;
            el.innerHTML = `
        <i class="lucide lucide-${icon} toast__icon" aria-hidden="true"></i>
        <div class="toast__body">
          <div class="toast__title">${title}</div>
          ${msg ? `<div class="toast__msg">${msg}</div>` : ''}
        </div>`;
            this.container.appendChild(el);
            setTimeout(() => {
                el.classList.add('is-leaving');
                el.addEventListener('animationend', () => el.remove(), { once: true });
            }, 3200);
        },
    };

    /* ===== 6. COUNTERS (KPI animation) =============== */
    const Counters = {
        animateAll() {
            Utils.qsa('[data-counter]').forEach(el => this.animate(el));
        },
        animate(el) {
            const target = parseFloat(el.dataset.counter) || 0;
            const start = performance.now();
            const dur = Config.counterDuration;
            const tick = (now) => {
                const t = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Utils.formatNumber(target * eased);
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        },
    };

    /* ===== 7. CHARTS =================================
       Usa Chart.js (CDN). Cores derivadas dos tokens.
       ============================================== */
    const Charts = {
        palette() {
            return {
                brand: '#6366f1',
                brand2: '#8b5cf6',
                success: '#10b981',
                danger: '#ef4444',
                warn: '#f59e0b',
                info: '#3b82f6',
                text: Utils.css('--text-mute') || '#64748b',
                grid: Utils.css('--border') || '#e5e7eb',
            };
        },
        commonOpts(p) {
            return {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: p.text, font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }, padding: 16, usePointStyle: true, pointStyle: 'circle' },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,23,42,.95)',
                        titleColor: '#fff', bodyColor: '#e2e8f0',
                        padding: 12, cornerRadius: 10, displayColors: true,
                        titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
                        bodyFont: { family: 'Plus Jakarta Sans' },
                        callbacks: {
                            label(ctx) {
                                const v = ctx.parsed.y ?? ctx.parsed;
                                return ` ${ctx.dataset.label || ctx.label}: ${Utils.formatBRL(v)}`;
                            }
                        }
                    },
                },
            };
        },

        line() {
            const ctx = Utils.qs('#chartLine')?.getContext('2d');
            if (!ctx) return;
            const p = this.palette();
            const labels = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
            const receitas = [78000, 82500, 91000, 88000, 95500, 102000, 98500, 110000, 115500, 118000, 121000, 125750];
            const despesas = [62000, 64500, 68000, 70500, 72000, 76500, 78000, 80500, 82500, 84000, 86500, 89200];

            const gradR = ctx.createLinearGradient(0, 0, 0, 320);
            gradR.addColorStop(0, 'rgba(99,102,241,.35)');
            gradR.addColorStop(1, 'rgba(99,102,241,0)');
            const gradD = ctx.createLinearGradient(0, 0, 0, 320);
            gradD.addColorStop(0, 'rgba(239,68,68,.30)');
            gradD.addColorStop(1, 'rgba(239,68,68,0)');

            State.charts.line = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Receitas', data: receitas, borderColor: p.brand, backgroundColor: gradR, fill: true, tension: .4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: p.brand, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 },
                        { label: 'Despesas', data: despesas, borderColor: p.danger, backgroundColor: gradD, fill: true, tension: .4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: p.danger, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 },
                    ]
                },
                options: {
                    ...this.commonOpts(p),
                    scales: {
                        x: { grid: { display: false }, ticks: { color: p.text, font: { family: 'Plus Jakarta Sans', size: 11 } } },
                        y: { grid: { color: p.grid, drawBorder: false }, ticks: { color: p.text, font: { family: 'Plus Jakarta Sans', size: 11 }, callback: (v) => 'R$ ' + (v / 1000).toFixed(0) + 'k' } },
                    }
                }
            });
        },

        pie() {
            const ctx = Utils.qs('#chartPie')?.getContext('2d');
            if (!ctx) return;
            const p = this.palette();
            State.charts.pie = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Salários', 'Suprimentos', 'Marketing', 'Convênios', 'Contas Fixas', 'Procedimentos'],
                    datasets: [{
                        data: [38, 14, 8, 18, 16, 6],
                        backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'],
                        borderWidth: 0, hoverOffset: 8,
                    }]
                },
                options: {
                    ...this.commonOpts(p),
                    cutout: '62%',
                    plugins: {
                        ...this.commonOpts(p).plugins,
                        tooltip: {
                            ...this.commonOpts(p).plugins.tooltip,
                            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` }
                        }
                    }
                }
            });
        },

        bar() {
            const ctx = Utils.qs('#chartBar')?.getContext('2d');
            if (!ctx) return;
            const p = this.palette();
            State.charts.bar = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [
                        { label: 'Receita', data: [251500, 285500, 343000, 365250], backgroundColor: p.brand, borderRadius: 8, borderSkipped: false, barThickness: 28 },
                        { label: 'Despesa', data: [194500, 220500, 240500, 256700], backgroundColor: p.danger, borderRadius: 8, borderSkipped: false, barThickness: 28 },
                    ]
                },
                options: {
                    ...this.commonOpts(p),
                    scales: {
                        x: { grid: { display: false }, ticks: { color: p.text, font: { weight: '600' } } },
                        y: { grid: { color: p.grid }, ticks: { color: p.text, callback: (v) => 'R$ ' + (v / 1000).toFixed(0) + 'k' } }
                    }
                }
            });
        },

        donut() {
            const ctx = Utils.qs('#chartDonut')?.getContext('2d');
            if (!ctx) return;
            const p = this.palette();
            State.charts.donut = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Contas a Receber', 'Contas a Pagar', 'Pendente'],
                    datasets: [{
                        data: [125750, 89200, 42900],
                        backgroundColor: [p.success, p.danger, p.warn],
                        borderWidth: 0, hoverOffset: 8,
                    }]
                },
                options: { ...this.commonOpts(p), cutout: '70%' }
            });
        },

        initAll() {
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js não carregado.');
                return;
            }
            Chart.defaults.font.family = 'Plus Jakarta Sans';
            this.line(); this.pie(); this.bar(); this.donut();
        },
    };

    /* ===== 8. TABLE ================================== */
    const Table = {
        body: null, empty: null, count: null,

        init() {
            this.body = Utils.qs('#tableBody');
            this.empty = Utils.qs('#tableEmpty');
            this.count = Utils.qs('#tableCount');
            this.bindFilters();
            this.render();
        },

        filtered() {
            const f = State.filters;
            return State.lancamentos.filter(l => {
                if (f.search) {
                    const t = f.search.toLowerCase();
                    const hay = `${l.descricao} ${l.cliente} ${l.categoria} ${l.banco}`.toLowerCase();
                    if (!hay.includes(t)) return false;
                }
                if (f.categoria && l.categoria !== f.categoria) return false;
                if (f.tipo && l.tipo !== f.tipo) return false;
                if (f.from && l.vencimento < f.from) return false;
                if (f.to && l.vencimento > f.to) return false;
                return true;
            });
        },

        render() {
            const items = this.filtered();
            this.body.innerHTML = items.map(l => this.row(l)).join('');
            this.empty.hidden = items.length > 0;
            this.count.textContent = `${items.length} lançamento${items.length === 1 ? '' : 's'}`;
            this.bindRowActions();
        },

        row(l) {
            const tipoCls = l.tipo === 'Entrada' ? 'tag--in' : 'tag--out';
            const tipoIcon = l.tipo === 'Entrada' ? 'arrow-down-left' : 'arrow-up-right';
            const valorSign = l.tipo === 'Entrada' ? '+' : '−';
            const valorColor = l.tipo === 'Entrada' ? 'var(--success)' : 'var(--danger)';
            return `
        <tr data-id="${l.id}">
          <td>${Utils.formatDateBR(l.vencimento)}</td>
          <td class="desc">${escapeHtml(l.descricao)}<small>${escapeHtml(l.cliente || '')}</small></td>
          <td><span class="tag tag--cat">${escapeHtml(l.categoria)}</span></td>
          <td class="num" style="color:${valorColor}">${valorSign} ${Utils.formatBRL(l.valor)}</td>
          <td><span class="tag ${tipoCls}"><i class="lucide lucide-${tipoIcon}"></i>${l.tipo}</span></td>
          <td>${escapeHtml(l.cliente || '—')}</td>
          <td>${escapeHtml(l.pagamento || '—')}</td>
          <td>${escapeHtml(l.banco || '—')}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-action="edit"      aria-label="Editar"><i class="lucide lucide-pencil"></i></button>
              <button class="icon-btn" data-action="duplicate" aria-label="Duplicar"><i class="lucide lucide-copy"></i></button>
              <button class="icon-btn" data-action="invoice"   aria-label="Gerar fatura"><i class="lucide lucide-receipt"></i></button>
              <button class="icon-btn" data-action="delete"    aria-label="Excluir"><i class="lucide lucide-trash-2"></i></button>
            </div>
          </td>
        </tr>`;
        },

        bindRowActions() {
            this.body.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tr = e.currentTarget.closest('tr');
                    const id = tr.dataset.id;
                    const action = btn.dataset.action;
                    const item = State.lancamentos.find(x => x.id === id);
                    if (!item) return;

                    switch (action) {
                        case 'edit':
                            Toast.show('Edição', `Abrindo "${item.descricao}" para edição.`, 'info');
                            Modal.openLancamento(item);
                            break;
                        case 'duplicate': {
                            const copy = { ...item, id: Utils.uid(), descricao: item.descricao + ' (cópia)' };
                            State.lancamentos.unshift(copy);
                            Storage.save();
                            Table.render();
                            Toast.show('Duplicado', 'Lançamento duplicado com sucesso.', 'success');
                            break;
                        }
                        case 'invoice':
                            Toast.show('Fatura gerada', `Fatura criada para "${item.descricao}".`, 'success');
                            break;
                        case 'delete':
                            if (confirm(`Excluir o lançamento "${item.descricao}"?`)) {
                                State.lancamentos = State.lancamentos.filter(x => x.id !== id);
                                Storage.save();
                                Table.render();
                                Toast.show('Excluído', 'Lançamento removido.', 'warn');
                            }
                            break;
                    }
                });
            });
        },

        bindFilters() {
            const search = Utils.qs('#tableSearch');
            const cat = Utils.qs('#filterCategoria');
            const tipo = Utils.qs('#filterTipo');
            const from = Utils.qs('#filterDateFrom');
            const to = Utils.qs('#filterDateTo');
            const limpar = Utils.qs('#btnLimparFiltros');
            const exp = Utils.qs('#btnExportar');
            const global = Utils.qs('#globalSearch');

            const onChange = Utils.debounce(() => {
                State.filters.search = search.value.trim();
                State.filters.categoria = cat.value;
                State.filters.tipo = tipo.value;
                State.filters.from = from.value;
                State.filters.to = to.value;
                Table.render();
            }, 150);

            [search, cat, tipo, from, to].forEach(el => {
                el.addEventListener('input', onChange);
                el.addEventListener('change', onChange);
            });

            // Busca global → propaga p/ tabela
            global?.addEventListener('input', Utils.debounce(() => {
                search.value = global.value;
                onChange();
            }, 150));

            limpar.addEventListener('click', () => {
                search.value = ''; cat.value = ''; tipo.value = '';
                from.value = ''; to.value = '';
                if (global) global.value = '';
                State.filters = { search: '', categoria: '', tipo: '', from: '', to: '' };
                Table.render();
                Toast.show('Filtros limpos', '', 'info');
            });

            exp.addEventListener('click', () => Table.exportCSV());
        },

        exportCSV() {
            const rows = Table.filtered();
            if (!rows.length) {
                Toast.show('Sem dados', 'Não há lançamentos para exportar.', 'warn');
                return;
            }
            const headers = ['Vencimento', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Cliente', 'Pagamento', 'Banco'];
            const csv = [
                headers.join(';'),
                ...rows.map(r => [
                    r.vencimento, r.descricao, r.categoria,
                    r.valor.toFixed(2).replace('.', ','),
                    r.tipo, r.cliente, r.pagamento, r.banco
                ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(';'))
            ].join('\n');

            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lancamentos-${Utils.todayISO()}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            Toast.show('Exportado', `${rows.length} lançamentos em CSV.`, 'success');
        },
    };

    /* ===== 9. MODAL ================================== */
    const Modal = {
        editingId: null,

        init() {
            // Abertura
            Utils.qs('#btnNovoLancamento').addEventListener('click', () => this.openLancamento());
            Utils.qs('#btnSair').addEventListener('click', () => this.openSair());

            // Fechamento (backdrop, [data-close], ESC)
            Utils.qsa('.modal').forEach(m => {
                m.addEventListener('click', (e) => {
                    if (e.target.matches('[data-close]')) this.close(m);
                });
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') Utils.qsa('.modal:not([hidden])').forEach(m => this.close(m));
            });

            // Submissão
            Utils.qs('#formLancamento').addEventListener('submit', (e) => this.submit(e));
        },

        openLancamento(data = null) {
            const m = Utils.qs('#modalLancamento');
            const f = Utils.qs('#formLancamento');
            f.reset();
            this.editingId = null;
            Utils.qs('#modalLancamentoTitle').innerHTML = `<i class="lucide lucide-plus-circle"></i> Novo Lançamento`;

            if (data) {
                this.editingId = data.id;
                Utils.qs('#modalLancamentoTitle').innerHTML = `<i class="lucide lucide-pencil"></i> Editar Lançamento`;
                f.querySelector(`input[name="tipo"][value="${data.tipo}"]`).checked = true;
                f.vencimento.value = data.vencimento;
                f.descricao.value = data.descricao;
                f.categoria.value = data.categoria;
                f.valor.value = data.valor;
                f.cliente.value = data.cliente || '';
                f.pagamento.value = data.pagamento || '';
                f.banco.value = data.banco || '';
            } else {
                f.vencimento.value = Utils.todayISO();
            }
            this.open(m);
        },

        openSair() { this.open(Utils.qs('#modalSair')); },

        open(m) {
            m.hidden = false;
            requestAnimationFrame(() => m.querySelector('input,select,button')?.focus());
            document.body.style.overflow = 'hidden';
        },
        close(m) {
            m.hidden = true;
            document.body.style.overflow = '';
        },

        submit(e) {
            e.preventDefault();
            const f = e.currentTarget;
            if (!f.checkValidity()) {
                f.reportValidity();
                Toast.show('Verifique os campos', 'Há informações obrigatórias.', 'error');
                return;
            }
            const fd = new FormData(f);
            const payload = {
                id: this.editingId || Utils.uid(),
                vencimento: fd.get('vencimento'),
                descricao: fd.get('descricao').trim(),
                categoria: fd.get('categoria'),
                valor: parseFloat(fd.get('valor')) || 0,
                tipo: fd.get('tipo'),
                cliente: (fd.get('cliente') || '').trim(),
                pagamento: fd.get('pagamento') || '',
                banco: fd.get('banco') || '',
            };

            if (this.editingId) {
                const idx = State.lancamentos.findIndex(x => x.id === this.editingId);
                if (idx >= 0) State.lancamentos[idx] = payload;
                Toast.show('Lançamento atualizado', payload.descricao, 'success');
            } else {
                State.lancamentos.unshift(payload);
                Toast.show('Lançamento criado', payload.descricao, 'success');
            }

            Storage.save();
            Table.render();
            this.close(Utils.qs('#modalLancamento'));
        },
    };

    /* ===== 10. CHIPS / RANGE TABS =================== */
    const Tabs = {
        init() {
            Utils.qsa('.chip-group').forEach(group => {
                group.addEventListener('click', (e) => {
                    const btn = e.target.closest('.chip');
                    if (!btn || !group.contains(btn)) return;
                    group.querySelectorAll('.chip').forEach(c => {
                        c.classList.remove('chip--active');
                        c.setAttribute('aria-selected', 'false');
                    });
                    btn.classList.add('chip--active');
                    btn.setAttribute('aria-selected', 'true');
                    if (btn.dataset.range) Toast.show('Período alterado', `Visualizando: ${btn.textContent.trim()}`, 'info');
                });
            });
        },
    };

    /* ===== 11. SIDEBAR TOGGLE ======================= */
    const Sidebar = {
        init() {
            const toggle = Utils.qs('#sidebarToggle');
            const sb = Utils.qs('.sidebar');
            toggle?.addEventListener('click', () => {
                sb.classList.toggle('is-open');
                if (window.innerWidth <= 768) {
                    sb.style.display = sb.classList.contains('is-open') ? 'flex' : 'none';
                    sb.style.position = 'fixed';
                    sb.style.zIndex = '50';
                    sb.style.width = '264px';
                    sb.style.height = '100vh';
                }
            });
        },
    };

    /* ===== 12. KEYBOARD SHORTCUTS =================== */
    const Shortcuts = {
        init() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K → busca global
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    Utils.qs('#globalSearch')?.focus();
                }
                // Ctrl/Cmd + N → novo lançamento
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    Modal.openLancamento();
                }
            });
        },
    };

    /* ===== 13. HELPERS =============================== */
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* ===== 14. APP BOOTSTRAP ======================== */
    const App = {
        init() {
            Storage.load();
            Toast.init();
            Sidebar.init();
            Tabs.init();
            Modal.init();
            Table.init();
            Shortcuts.init();

            // KPIs animados
            requestAnimationFrame(() => Counters.animateAll());

            // Charts (Chart.js já carregado pelo CDN)
            if (typeof Chart !== 'undefined') {
                Charts.initAll();
            } else {
                window.addEventListener('load', () => Charts.initAll());
            }

            console.info('%cGM4med Financeiro %cv1.0', 'color:#6366f1;font-weight:700', 'color:#94a3b8');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
})();
