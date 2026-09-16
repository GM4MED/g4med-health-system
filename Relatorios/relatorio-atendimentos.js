/* =========================================================
   GM4med · Relatório de Atendimentos · BI · JS
   Padrão: JavaScript ES6+, Frontend-Ready, Accessibility WCAG
   ========================================================= */
(() => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    /* ============ COLOR PALETTE ============ */
    const COLORS = {
        brand: '#0d9488',
        brand2: '#0f766e',
        brand3: '#115e59',
        ok: '#16a34a',
        warn: '#d97706',
        danger: '#dc2626',
        info: '#0369a1',
        purple: '#7c3aed',
        rose: '#e11d48'
    };

    /* ============ STATE SYSTEM ============ */
    const state = {
        currentPage: 1,
        pageSize: 7,
        filters: {
            dateFrom: '',
            dateTo: '',
            doc: '',
            status: '',
            spec: '',
            unit: '',
            search: ''
        },
        rawAtendimentos: [],
        filteredAtendimentos: [],
        isLoading: false,
        isError: false
    };

    const charts = {};
    const ctx = id => $('#' + id)?.getContext('2d');

    /* ============ MOCK DATA INITIALIZATION ============ */
    function generateMockAtendimentos() {
        const doctors = [
            { name: 'Dr. João Silva', spec: 'Cardiologia' },
            { name: 'Dra. Maria Souza', spec: 'Ginecologia' },
            { name: 'Dra. Mariana Costa', spec: 'Cardiologia' },
            { name: 'Dr. Felipe Andrade', spec: 'Ortopedia' },
            { name: 'Dra. Helena Vieira', spec: 'Pediatria' },
            { name: 'Dr. Rafael Mendes', spec: 'Neurologia' }
        ];

        const patients = [
            'Ana Beatriz Lima', 'Carlos Eduardo Ramos', 'Fernanda Oliveira', 'Gabriel Santos',
            'Juliana Mendes', 'Lucas Ferreira', 'Mariana Rocha', 'Pedro Henrique Alves',
            'Patricia Barbosa', 'Roberto Garcia', 'Sofia Castro', 'Thiago Martins',
            'Vanessa Duarte', 'Wagner Silva', 'Yasmin Costa'
        ];

        const types = ['Consulta de Retorno', 'Primeira Consulta', 'Exame Cardiológico', 'Avaliação Pré-Operatória', 'Consulta de Rotina', 'Urgência Médica'];
        const statuses = ['Realizado', 'Realizado', 'Realizado', 'Realizado', 'Agendado', 'Agendado', 'Cancelado'];
        const units = ['Itaim Bibi · Matriz', 'Alphaville', 'Jardins'];
        const insurances = ['Unimed', 'Bradesco Saúde', 'Particular', 'Amil', 'SulAmérica'];

        const items = [];
        const baseDate = new Date();

        for (let i = 1; i <= 65; i++) {
            const docObj = doctors[i % doctors.length];
            const d = new Date(baseDate);
            d.setDate(d.getDate() - (i % 30));
            d.setHours(8 + (i % 10), (i * 15) % 60);

            const status = statuses[i % statuses.length];
            items.push({
                id: `ATD-2026-${String(i).padStart(4, '0')}`,
                dateTime: d.toISOString(),
                dateTimeFormatted: d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                patient: patients[i % patients.length],
                doctor: docObj.name,
                specialty: docObj.spec,
                type: types[i % types.length],
                status: status,
                unit: units[i % units.length],
                insurance: insurances[i % insurances.length]
            });
        }
        return items;
    }

    /* ============ FRONTEND-READY BACKEND API SIMULATION ============ */
    async function carregarRelatorioAtendimentos(filtros) {
        state.isLoading = true;
        state.isError = false;
        renderTableState();

        try {
            // Em produção: const response = await fetch('/api/v1/relatorios/atendimentos', { method: 'POST', body: JSON.stringify(filtros) });
            // Simulate network latency (250ms)
            await new Promise(res => setTimeout(res, 250));

            if (!state.rawAtendimentos.length) {
                state.rawAtendimentos = generateMockAtendimentos();
            }

            // Client-side filtering logic matching backend parameters
            let result = [...state.rawAtendimentos];

            if (filtros.dateFrom) {
                const fromTime = new Date(filtros.dateFrom + 'T00:00:00').getTime();
                result = result.filter(item => new Date(item.dateTime).getTime() >= fromTime);
            }

            if (filtros.dateTo) {
                const toTime = new Date(filtros.dateTo + 'T23:59:59').getTime();
                result = result.filter(item => new Date(item.dateTime).getTime() <= toTime);
            }

            if (filtros.doc) {
                result = result.filter(item => item.doctor === filtros.doc);
            }

            if (filtros.status) {
                result = result.filter(item => item.status === filtros.status);
            }

            if (filtros.spec) {
                result = result.filter(item => item.specialty === filtros.spec);
            }

            if (filtros.unit) {
                result = result.filter(item => item.unit === filtros.unit);
            }

            if (filtros.search) {
                const q = filtros.search.toLowerCase();
                result = result.filter(item =>
                    item.patient.toLowerCase().includes(q) ||
                    item.doctor.toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q)
                );
            }

            state.filteredAtendimentos = result;
            state.currentPage = 1;

            updateKPIs();
            renderTable();
            renderPagination();
        } catch (err) {
            console.error('Erro ao carregar relatório de atendimentos:', err);
            state.isError = true;
        } finally {
            state.isLoading = false;
            renderTableState();
        }
    }

    /* ============ DATE VALIDATION ============ */
    function validateDates() {
        const fromVal = $('#dateFrom').value;
        const toVal = $('#dateTo').value;
        const errorContainer = $('#dateValidationError');
        const fromInput = $('#dateFrom');
        const toInput = $('#dateTo');

        if (fromVal && toVal && toVal < fromVal) {
            errorContainer.classList.remove('hidden');
            fromInput.style.borderColor = 'var(--danger)';
            toInput.style.borderColor = 'var(--danger)';
            return false;
        }

        errorContainer.classList.add('hidden');
        fromInput.style.borderColor = '';
        toInput.style.borderColor = '';
        return true;
    }

    /* ============ KPI CALCULATIONS & RENDERING ============ */
    function updateKPIs() {
        const data = state.filteredAtendimentos;
        const total = data.length;
        const realizados = data.filter(i => i.status === 'Realizado').length;
        const cancelados = data.filter(i => i.status === 'Cancelado').length;
        const agendados = data.filter(i => i.status === 'Agendado').length;

        const totalApplicable = realizados + cancelados + agendados;
        const comparecimento = totalApplicable > 0 ? ((realizados / totalApplicable) * 100).toFixed(1) : '0.0';

        $('#kpiTotalValue').textContent = total.toLocaleString('pt-BR');
        $('#kpiRealizedValue').textContent = realizados.toLocaleString('pt-BR');
        $('#kpiCanceledValue').textContent = cancelados.toLocaleString('pt-BR');
        $('#kpiScheduledValue').textContent = agendados.toLocaleString('pt-BR');
        $('#kpiAttendanceRateValue').innerHTML = `${comparecimento}<small>%</small>`;

        const doughTotalEl = $('#doughTotal');
        if (doughTotalEl) doughTotalEl.textContent = total.toLocaleString('pt-BR');
    }

    /* ============ TABLE RENDERING ============ */
    function renderTableState() {
        const loadingBox = $('#atendimentosLoadingState');
        const errorBox = $('#atendimentosErrorState');
        const emptyBox = $('#atendimentosEmptyState');
        const table = $('#atendimentosTable');
        const pagination = $('#paginationBar');

        loadingBox?.classList.add('hidden');
        errorBox?.classList.add('hidden');
        emptyBox?.classList.add('hidden');

        if (state.isLoading) {
            loadingBox?.classList.remove('hidden');
            table.style.display = 'none';
            pagination.style.display = 'none';
        } else if (state.isError) {
            errorBox?.classList.remove('hidden');
            table.style.display = 'none';
            pagination.style.display = 'none';
        } else if (!state.filteredAtendimentos.length) {
            emptyBox?.classList.remove('hidden');
            table.style.display = 'none';
            pagination.style.display = 'none';
        } else {
            table.style.display = '';
            pagination.style.display = '';
        }
    }

    function renderTable() {
        const tbody = $('#atendimentosTableBody');
        if (!tbody) return;

        const startIdx = (state.currentPage - 1) * state.pageSize;
        const pageItems = state.filteredAtendimentos.slice(startIdx, startIdx + state.pageSize);

        tbody.innerHTML = pageItems.map(item => {
            let statusClass = 'status-agendado';
            let statusIcon = 'clock';

            if (item.status === 'Realizado') {
                statusClass = 'status-realizado';
                statusIcon = 'check-circle-2';
            } else if (item.status === 'Cancelado') {
                statusClass = 'status-cancelado';
                statusIcon = 'x-circle';
            }

            return `
                <tr>
                    <td>
                        <strong style="font-size:13px">${item.dateTimeFormatted}</strong>
                        <div style="font-size:11px;color:var(--muted)">${item.id}</div>
                    </td>
                    <td>
                        <strong style="font-weight:700;color:var(--ink)">${escapeHTML(item.patient)}</strong>
                        <div style="font-size:11px;color:var(--muted)">${escapeHTML(item.insurance)}</div>
                    </td>
                    <td>
                        <div>${escapeHTML(item.doctor)}</div>
                        <div style="font-size:11px;color:var(--muted)">${escapeHTML(item.specialty)}</div>
                    </td>
                    <td>
                        <span>${escapeHTML(item.type)}</span>
                        <div style="font-size:11px;color:var(--muted)">${escapeHTML(item.unit)}</div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <i data-lucide="${statusIcon}" aria-hidden="true"></i>
                            ${item.status}
                        </span>
                    </td>
                    <td class="text-right">
                        <button type="button" class="btn ghost sm btn-detail" data-id="${item.id}" aria-label="Ver detalhes do atendimento de ${escapeHTML(item.patient)}">
                            <i data-lucide="eye" aria-hidden="true"></i> Detalhes
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();

        // Bind detail buttons
        $$('.btn-detail', tbody).forEach(btn => {
            btn.addEventListener('click', () => showAtendimentoDetail(btn.dataset.id));
        });
    }

    function renderPagination() {
        const total = state.filteredAtendimentos.length;
        const totalPages = Math.ceil(total / state.pageSize) || 1;
        const start = (state.currentPage - 1) * state.pageSize + 1;
        const end = Math.min(state.currentPage * state.pageSize, total);

        const info = $('#paginationInfo');
        if (info) {
            info.textContent = total > 0 ? `Exibindo ${start}-${end} de ${total} registros` : 'Nenhum registro encontrado';
        }

        const prevBtn = $('#btnPrevPage');
        const nextBtn = $('#btnNextPage');
        if (prevBtn) prevBtn.disabled = state.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = state.currentPage >= totalPages;

        const numbersContainer = $('#pageNumbers');
        if (numbersContainer) {
            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button type="button" class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            numbersContainer.innerHTML = html;

            $$('.page-btn', numbersContainer).forEach(btn => {
                btn.addEventListener('click', () => {
                    state.currentPage = parseInt(btn.dataset.page, 10);
                    renderTable();
                    renderPagination();
                });
            });
        }
    }

    /* ============ MODAL DETAILS ============ */
    function showAtendimentoDetail(id) {
        const item = state.rawAtendimentos.find(i => i.id === id);
        if (!item) return;

        const modal = $('#atendimentoDetailModal');
        const body = $('#modalBody');

        body.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><strong>Código:</strong> <span>${item.id}</span></div>
                <div><strong>Status:</strong> <span class="status-badge ${item.status === 'Realizado' ? 'status-realizado' : item.status === 'Cancelado' ? 'status-cancelado' : 'status-agendado'}">${item.status}</span></div>
                <div><strong>Paciente:</strong> <span>${escapeHTML(item.patient)}</span></div>
                <div><strong>Convênio:</strong> <span>${escapeHTML(item.insurance)}</span></div>
                <div><strong>Profissional:</strong> <span>${escapeHTML(item.doctor)}</span></div>
                <div><strong>Especialidade:</strong> <span>${escapeHTML(item.specialty)}</span></div>
                <div><strong>Data e Hora:</strong> <span>${item.dateTimeFormatted}</span></div>
                <div><strong>Unidade:</strong> <span>${escapeHTML(item.unit)}</span></div>
            </div>
            <hr style="border-color:var(--line);margin:8px 0">
            <div><strong>Tipo de Consulta:</strong> <span>${escapeHTML(item.type)}</span></div>
            <div><strong>Observação Prontuário:</strong> <span>Atendimento registrado normalmente conforme protocolo GM4Med. SLA e triagem em conformidade.</span></div>
        `;

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        lucide.createIcons();
    }

    function closeModal() {
        const modal = $('#atendimentoDetailModal');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }

    /* ============ EXPORT HANDLERS (PDF & EXCEL) ============ */
    function exportToExcel() {
        const headers = ['ID', 'Data/Hora', 'Paciente', 'Profissional', 'Especialidade', 'Tipo', 'Status', 'Convênio', 'Unidade'];
        const rows = state.filteredAtendimentos.map(i => [
            i.id, i.dateTimeFormatted, i.patient, i.doctor, i.specialty, i.type, i.status, i.insurance, i.unit
        ]);

        const csvContent = [headers, ...rows]
            .map(e => e.map(val => `"${String(val).replaceAll('"', '""')}"`).join(';'))
            .join('\r\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `relatorio-atendimentos-gm4med-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast('Exportação concluída', 'Planilha Excel (CSV) gerada com sucesso.', 'ok');
    }

    function exportToPdf() {
        toast('Gerando PDF...', 'Formatando relatório para impressão.', 'info');
        setTimeout(() => window.print(), 300);
    }

    /* ============ CHARTS INITIALIZATION ============ */
    function cfgChart() {
        const dark = document.documentElement.dataset.theme === 'dark';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = dark ? '#cbd5e1' : '#475569';
        Chart.defaults.borderColor = dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)';
    }

    const tooltipConfig = {
        enabled: true,
        backgroundColor: 'rgba(15,23,42,.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8
    };

    function initCharts() {
        cfgChart();

        // Chart 1: Doctors
        const cDoc = ctx('chartDoctors');
        if (cDoc) {
            charts.doctors = new Chart(cDoc, {
                type: 'bar',
                data: {
                    labels: ['Dra. Mariana', 'Dr. Felipe', 'Dra. Helena', 'Dr. Rafael', 'Dra. Larissa', 'Dr. Bruno'],
                    datasets: [{
                        label: 'Atendimentos',
                        data: [312, 289, 276, 251, 238, 217],
                        backgroundColor: COLORS.brand,
                        borderRadius: 6
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipConfig } }
            });
        }

        // Chart 2: Status
        const cStatus = ctx('chartStatus');
        if (cStatus) {
            charts.status = new Chart(cStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Realizados', 'Agendados', 'Cancelados'],
                    datasets: [{
                        data: [67, 27, 6],
                        backgroundColor: [COLORS.ok, COLORS.info, COLORS.danger],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '74%', plugins: { legend: { display: false }, tooltip: tooltipConfig } }
            });
            $('#legendStatus').innerHTML = `
                <span class="legend-item"><span class="sw" style="background:${COLORS.ok}"></span>Realizados <b>67%</b></span>
                <span class="legend-item"><span class="sw" style="background:${COLORS.info}"></span>Agendados <b>27%</b></span>
                <span class="legend-item"><span class="sw" style="background:${COLORS.danger}"></span>Cancelados <b>6%</b></span>
            `;
        }

        // Chart 3: Spec
        const cSpec = ctx('chartSpec');
        if (cSpec) {
            charts.spec = new Chart(cSpec, {
                type: 'polarArea',
                data: {
                    labels: ['Cardiologia', 'Ortopedia', 'Pediatria', 'Ginecologia', 'Dermatologia'],
                    datasets: [{ data: [842, 678, 912, 587, 521], backgroundColor: [COLORS.brand + 'cc', COLORS.info + 'cc', COLORS.purple + 'cc', COLORS.rose + 'cc', COLORS.warn + 'cc'] }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipConfig } }
            });
        }

        // Chart 4: Week
        const cWeek = ctx('chartWeek');
        if (cWeek) {
            charts.week = new Chart(cWeek, {
                type: 'bar',
                data: {
                    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                    datasets: [{ data: [842, 891, 654, 789, 803, 512], backgroundColor: COLORS.brand, borderRadius: 6 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        // Chart 5: History
        const cHist = ctx('chartHistory');
        if (cHist) {
            charts.history = new Chart(cHist, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
                    datasets: [
                        { label: 'Realizado', data: [3812, 3920, 4102, 4230, 4118, 4382, 4521, 4678, 4812, 4827], borderColor: COLORS.brand, tension: 0.3, fill: false },
                        { label: 'Meta', data: [3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700], borderColor: COLORS.ok, borderDash: [5, 5], fill: false }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipConfig } }
            });
        }

        // Heatmap
        renderHeatmap();
        // Sparklines
        renderSparklines();
        // Doctors Ranking
        renderDoctorsRank();
    }

    function renderHeatmap() {
        const el = $('#heatmap');
        if (!el) return;
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        const hours = ['08h', '10h', '12h', '14h', '16h', '18h'];
        let html = '<div></div>' + days.map(d => `<div class="hm-th">${d}</div>`).join('');
        hours.forEach(h => {
            html += `<div class="hm-rh">${h}</div>`;
            for (let d = 0; d < 5; d++) {
                const c = (d + h.charCodeAt(0)) % 2 === 0 ? '#ccfbf1' : '#0d9488';
                html += `<div class="hm-cell" style="background:${c}" title="${h} - ${days[d]}"></div>`;
            }
        });
        el.innerHTML = html;
    }

    function renderSparklines() {
        $$('.spark').forEach(el => {
            const color = COLORS[el.dataset.spark] || COLORS.brand;
            const data = Array.from({ length: 10 }, () => Math.random() * 40 + 20);
            const c = el.getContext('2d');
            new Chart(c, {
                type: 'line',
                data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
            });
        });
    }

    function renderDoctorsRank() {
        const tb = $('#rankTable tbody');
        if (!tb) return;
        const doctors = [
            { rank: 1, name: 'Dra. Mariana Costa', spec: 'Cardiologia', atend: 312, nps: 9.6, punc: '96%', score: 9.8 },
            { rank: 2, name: 'Dr. Felipe Andrade', spec: 'Ortopedia', atend: 289, nps: 9.2, punc: '92%', score: 9.4 },
            { rank: 3, name: 'Dra. Helena Vieira', spec: 'Pediatria', atend: 276, nps: 9.7, punc: '94%', score: 9.3 },
            { rank: 4, name: 'Dr. Rafael Mendes', spec: 'Neurologia', atend: 251, nps: 9.0, punc: '88%', score: 8.9 }
        ];

        tb.innerHTML = doctors.map(d => `
            <tr>
                <td><strong>#${d.rank}</strong></td>
                <td><strong>${d.name}</strong></td>
                <td>${d.spec}</td>
                <td><b>${d.atend}</b></td>
                <td><b style="color:var(--ok)">${d.nps}</b></td>
                <td>${d.punc}</td>
                <td><b style="color:var(--brand)">${d.score}</b></td>
            </tr>
        `).join('');
    }

    /* ============ HELPERS ============ */
    function escapeHTML(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function toast(title, msg = '', type = 'info') {
        const box = $('#toastBox');
        if (!box) return;
        const icons = { info: 'info', ok: 'check-circle-2', warn: 'alert-triangle' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><div><strong>${title}</strong>${msg ? `<span>${msg}</span>` : ''}</div>`;
        box.appendChild(el);
        lucide.createIcons();
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(40px)'; }, 3000);
        setTimeout(() => el.remove(), 3400);
    }

    /* ============ EVENT BINDINGS ============ */
    function bindEvents() {
        // Filter Apply
        $('#btnApply')?.addEventListener('click', () => {
            if (!validateDates()) return;

            state.filters = {
                dateFrom: $('#dateFrom').value,
                dateTo: $('#dateTo').value,
                doc: $('#fDoc').value,
                status: $('#fStatus').value,
                spec: $('#fSpec').value,
                unit: $('#fUnit').value,
                search: $('#atendSearch').value
            };

            carregarRelatorioAtendimentos(state.filters);
            toast('Filtros aplicados', 'Resultados atualizados com sucesso.', 'ok');
        });

        // Filter Clear
        const clearFilters = () => {
            $('#dateFrom').value = '';
            $('#dateTo').value = '';
            $('#fDoc').selectedIndex = 0;
            $('#fStatus').selectedIndex = 0;
            $('#fSpec').selectedIndex = 0;
            $('#fUnit').selectedIndex = 0;
            $('#atendSearch').value = '';

            validateDates();
            state.filters = { dateFrom: '', dateTo: '', doc: '', status: '', spec: '', unit: '', search: '' };
            carregarRelatorioAtendimentos(state.filters);
            toast('Filtros limpos', 'Exibindo todos os atendimentos.', 'info');
        };

        $('#btnClear')?.addEventListener('click', clearFilters);
        $('#btnResetFiltersEmpty')?.addEventListener('click', clearFilters);

        // Search Input
        $('#atendSearch')?.addEventListener('input', e => {
            state.filters.search = e.target.value;
            carregarRelatorioAtendimentos(state.filters);
        });

        // Pagination buttons
        $('#btnPrevPage')?.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderTable();
                renderPagination();
            }
        });

        $('#btnNextPage')?.addEventListener('click', () => {
            const totalPages = Math.ceil(state.filteredAtendimentos.length / state.pageSize);
            if (state.currentPage < totalPages) {
                state.currentPage++;
                renderTable();
                renderPagination();
            }
        });

        // Export Dropdown
        const exportMenu = $('#exportMenu');
        const exportBtn = $('#btnExportMenu');

        exportBtn?.addEventListener('click', e => {
            e.stopPropagation();
            const isExpanded = exportBtn.getAttribute('aria-expanded') === 'true';
            exportBtn.setAttribute('aria-expanded', !isExpanded);
            exportMenu?.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            exportMenu?.classList.add('hidden');
            exportBtn?.setAttribute('aria-expanded', 'false');
        });

        $('#btnExportPdf')?.addEventListener('click', exportToPdf);
        $('#btnExportExcel')?.addEventListener('click', exportToExcel);

        // Retry button
        $('#btnRetryAtendimentos')?.addEventListener('click', () => {
            carregarRelatorioAtendimentos(state.filters);
        });

        // Theme Toggle
        $('#toggleTheme')?.addEventListener('click', () => {
            const current = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = current;
            const icon = $('#toggleTheme i');
            if (icon) icon.setAttribute('data-lucide', current === 'dark' ? 'sun' : 'moon');
            lucide.createIcons();
            cfgChart();
            Object.values(charts).forEach(c => c.update());
            toast(`Tema ${current === 'dark' ? 'escuro' : 'claro'} ativado`);
        });

        // Refresh Button
        $('#btnRefresh')?.addEventListener('click', () => {
            carregarRelatorioAtendimentos(state.filters);
            $('#lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            toast('Dados sincronizados', 'Relatório atualizado.', 'ok');
        });

        // Modal Close
        $('#btnCloseModal')?.addEventListener('click', closeModal);
        $('#btnModalClose')?.addEventListener('click', closeModal);
        $('#btnModalPrint')?.addEventListener('click', () => window.print());

        // Period tabs
        $$('#periodTabs button').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('#periodTabs button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const period = btn.dataset.period;
                if (period !== 'custom') {
                    const to = new Date();
                    const from = new Date();
                    from.setDate(from.getDate() - parseInt(period, 10));

                    $('#dateFrom').valueAsDate = from;
                    $('#dateTo').valueAsDate = to;
                    validateDates();
                    state.filters.dateFrom = $('#dateFrom').value;
                    state.filters.dateTo = $('#dateTo').value;
                    carregarRelatorioAtendimentos(state.filters);
                }
            });
        });
    }

    /* ============ INITIALIZATION ============ */
    function init() {
        lucide.createIcons();

        // Default 30 days date range
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);
        $('#dateFrom').valueAsDate = from;
        $('#dateTo').valueAsDate = to;

        state.filters.dateFrom = $('#dateFrom').value;
        state.filters.dateTo = $('#dateTo').value;

        initCharts();
        bindEvents();
        carregarRelatorioAtendimentos(state.filters);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
