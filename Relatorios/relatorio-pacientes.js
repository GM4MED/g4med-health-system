/* =========================================================
   GM4med · Relatório de Pacientes · BI · JS
   Padrão: ES6+, Frontend-Ready, Accessibility WCAG 2.1
   ========================================================= */
(() => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    /* ============ STATE SYSTEM ============ */
    const state = {
        currentPage: 1,
        pageSize: 8,
        filters: {
            dateFrom: '',
            dateTo: '',
            status: '',
            insurance: '',
            ageGroup: '',
            origin: '',
            search: ''
        },
        rawPacientes: [],
        filteredPacientes: [],
        isLoading: false,
        isError: false
    };

    const charts = new Map();

    /* ============ MOCK PATIENT DATA GENERATOR ============ */
    function generateMockPacientes() {
        const names = [
            'Ana Paula Silveira', 'Bruno Henrique Costa', 'Carla Maria Mendes', 'Daniel Oliveira Santos',
            'Eduardo Ribeiro Franco', 'Fernanda Lima Souza', 'Gabriel Augusto Nogueira', 'Helena Martins Duarte',
            'Igor Vinicius Castro', 'Juliana Rocha Barbosa', 'Katia Regina Ramos', 'Leonardo Fonseca',
            'Manuela Dias Carvalho', 'Nataniel Guimarães', 'Olívia Prado Alcantara', 'Paulo Roberto Teixeira',
            'Renata Viana Neves', 'Sergio Ricardo Moraes', 'Tatiana Pires Monteiro', 'Vinicius Gabriel Xavier'
        ];

        const phones = ['(11) 98765-4321', '(11) 97123-8899', '(11) 99887-1122', '(11) 96543-2109', '(11) 98112-3344'];
        const insurances = ['Particular', 'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Hapvida'];
        const origins = ['Indicação', 'Google', 'Instagram', 'Convênio', 'Site', 'Retorno'];
        const statuses = ['Ativo', 'Ativo', 'Ativo', 'Ativo', 'Inativo'];

        const baseDate = new Date();
        const items = [];

        for (let i = 1; i <= 50; i++) {
            const birthYear = 1960 + (i * 3) % 45;
            const birthDate = `${String((i % 28) + 1).padStart(2, '0')}/${String((i % 12) + 1).padStart(2, '0')}/${birthYear}`;

            const regDate = new Date(baseDate);
            regDate.setDate(regDate.getDate() - (i * 2));

            const lastVisit = new Date(baseDate);
            lastVisit.setDate(lastVisit.getDate() - (i % 15));

            items.push({
                id: `PAC-2026-${String(i).padStart(5, '0')}`,
                nome: names[i % names.length],
                cpf: `${100 + i}.456.789-${String(i % 99).padStart(2, '0')}`,
                telefone: phones[i % phones.length],
                dataNascimento: birthDate,
                dataCadastro: regDate.toISOString().slice(0, 10),
                dataCadastroFormatted: regDate.toLocaleDateString('pt-BR'),
                dataUltimoAtendimento: lastVisit.toLocaleDateString('pt-BR'),
                status: statuses[i % statuses.length],
                convenio: insurances[i % insurances.length],
                origem: origins[i % origins.length],
                idade: 2026 - birthYear,
                consultasRealizadas: (i * 3) % 18 + 1,
                ltv: (i * 240) + 400
            });
        }
        return items;
    }

    /* ============ FRONTEND-READY BACKEND API SIMULATION ============ */
    async function carregarRelatorioPacientes(filtros) {
        state.isLoading = true;
        state.isError = false;
        renderTableState();

        try {
            // Em produção: const response = await fetch('/api/v1/relatorios/pacientes', { method: 'POST', body: JSON.stringify(filtros) });
            await new Promise(res => setTimeout(res, 220));

            if (!state.rawPacientes.length) {
                state.rawPacientes = generateMockPacientes();
            }

            let result = [...state.rawPacientes];

            if (filtros.dateFrom) {
                result = result.filter(item => item.dataCadastro >= filtros.dateFrom);
            }

            if (filtros.dateTo) {
                result = result.filter(item => item.dataCadastro <= filtros.dateTo);
            }

            if (filtros.status) {
                result = result.filter(item => item.status === filtros.status);
            }

            if (filtros.insurance) {
                result = result.filter(item => item.convenio === filtros.insurance);
            }

            if (filtros.origin) {
                result = result.filter(item => item.origem === filtros.origin);
            }

            if (filtros.search) {
                const q = filtros.search.toLowerCase();
                result = result.filter(item =>
                    item.nome.toLowerCase().includes(q) ||
                    item.cpf.toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q)
                );
            }

            state.filteredPacientes = result;
            state.currentPage = 1;

            updateKPIs();
            renderTable();
            renderPagination();
        } catch (err) {
            console.error('Erro ao carregar relatório de pacientes:', err);
            state.isError = true;
        } finally {
            state.isLoading = false;
            renderTableState();
        }
    }

    /* ============ DATE VALIDATION ============ */
    function validateDates() {
        const fromVal = $('#dateFrom')?.value;
        const toVal = $('#dateTo')?.value;
        const errorContainer = $('#dateValidationError');
        const fromInput = $('#dateFrom');
        const toInput = $('#dateTo');

        if (fromVal && toVal && toVal < fromVal) {
            errorContainer?.classList.remove('hidden');
            if (fromInput) fromInput.style.borderColor = 'var(--danger)';
            if (toInput) toInput.style.borderColor = 'var(--danger)';
            return false;
        }

        errorContainer?.classList.add('hidden');
        if (fromInput) fromInput.style.borderColor = '';
        if (toInput) toInput.style.borderColor = '';
        return true;
    }

    /* ============ KPI CALCULATIONS & RENDERING ============ */
    function updateKPIs() {
        const total = state.filteredPacientes.length;
        const novos = state.filteredPacientes.filter(p => p.dataCadastro >= (state.filters.dateFrom || '2026-08-01')).length;
        const ativos = state.filteredPacientes.filter(p => p.status === 'Ativo').length;

        const kpiTotal = $('#kpiTotalValue');
        const kpiNew = $('#kpiNewCountValue');
        const kpiActive = $('#kpiActiveValue');

        if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
        if (kpiNew) kpiNew.textContent = novos.toLocaleString('pt-BR');
        if (kpiActive) kpiActive.textContent = ativos.toLocaleString('pt-BR');

        const doughTotal = $('#doughnutTotal');
        if (doughTotal) doughTotal.textContent = total.toLocaleString('pt-BR');
    }

    /* ============ TABLE RENDERING ============ */
    function renderTableState() {
        const loadingBox = $('#pacientesLoadingState');
        const errorBox = $('#pacientesErrorState');
        const emptyBox = $('#pacientesEmptyState');
        const table = $('#pacientesTable');
        const pagination = $('#paginationBar');

        loadingBox?.classList.add('hidden');
        errorBox?.classList.add('hidden');
        emptyBox?.classList.add('hidden');

        if (state.isLoading) {
            loadingBox?.classList.remove('hidden');
            if (table) table.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        } else if (state.isError) {
            errorBox?.classList.remove('hidden');
            if (table) table.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        } else if (!state.filteredPacientes.length) {
            emptyBox?.classList.remove('hidden');
            if (table) table.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        } else {
            if (table) table.style.display = '';
            if (pagination) pagination.style.display = '';
        }
    }

    function renderTable() {
        const tbody = $('#pacientesTableBody');
        if (!tbody) return;

        const startIdx = (state.currentPage - 1) * state.pageSize;
        const pageItems = state.filteredPacientes.slice(startIdx, startIdx + state.pageSize);

        tbody.innerHTML = pageItems.map(item => {
            const statusClass = item.status === 'Ativo' ? 'status-badge-ativo' : 'status-badge-inativo';

            return `
                <tr class="border-b transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td class="p-3">
                        <strong class="font-extrabold text-slate-800 dark:text-slate-100">${escapeHTML(item.nome)}</strong>
                        <div class="text-[11px]" style="color:var(--muted)">CPF: ${escapeHTML(item.cpf)} · Reg: ${item.id}</div>
                    </td>
                    <td class="p-3">
                        <span>${escapeHTML(item.telefone)}</span>
                        <div class="text-[11px]" style="color:var(--muted)">${escapeHTML(item.convenio)}</div>
                    </td>
                    <td class="p-3">
                        <span>${item.dataNascimento}</span>
                        <div class="text-[11px]" style="color:var(--muted)">${item.idade} anos</div>
                    </td>
                    <td class="p-3">
                        <span>${item.dataUltimoAtendimento}</span>
                        <div class="text-[11px]" style="color:var(--muted)">${item.consultasRealizadas} consultas totais</div>
                    </td>
                    <td class="p-3">
                        <span class="${statusClass}">
                            ${item.status}
                        </span>
                    </td>
                    <td class="p-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button type="button" class="btn-history btn btn-ghost py-1 px-2.5 text-[11px]" data-id="${item.id}" aria-label="Ver histórico do paciente ${escapeHTML(item.nome)}">
                                <i data-lucide="history" class="h-3.5 w-3.5 text-teal-600" aria-hidden="true"></i>
                                <span>Ver histórico</span>
                            </button>
                            <button type="button" class="btn-profile btn btn-ghost py-1 px-2.5 text-[11px]" data-id="${item.id}" aria-label="Visualizar cadastro do paciente ${escapeHTML(item.nome)}">
                                <i data-lucide="user" class="h-3.5 w-3.5 text-teal-600" aria-hidden="true"></i>
                                <span>Visualizar cadastro</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        refreshIcons();

        // Bind Action Buttons
        $$('.btn-history', tbody).forEach(btn => {
            btn.addEventListener('click', () => showPatientHistory(btn.dataset.id));
        });

        $$('.btn-profile', tbody).forEach(btn => {
            btn.addEventListener('click', () => showPatientProfile(btn.dataset.id));
        });
    }

    function renderPagination() {
        const total = state.filteredPacientes.length;
        const totalPages = Math.ceil(total / state.pageSize) || 1;
        const start = (state.currentPage - 1) * state.pageSize + 1;
        const end = Math.min(state.currentPage * state.pageSize, total);

        const info = $('#paginationInfo');
        if (info) {
            info.textContent = total > 0 ? `Exibindo ${start}-${end} de ${total} pacientes` : 'Nenhum paciente encontrado';
        }

        const prevBtn = $('#btnPrevPage');
        const nextBtn = $('#btnNextPage');
        if (prevBtn) prevBtn.disabled = state.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = state.currentPage >= totalPages;

        const numbersContainer = $('#pageNumbers');
        if (numbersContainer) {
            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button type="button" class="px-2.5 py-1 text-xs font-bold rounded-md border ${i === state.currentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-transparent border-slate-200 text-slate-600 hover:border-teal-600 dark:border-slate-700 dark:text-slate-300'}" data-page="${i}">${i}</button>`;
            }
            numbersContainer.innerHTML = html;

            $$('button', numbersContainer).forEach(btn => {
                btn.addEventListener('click', () => {
                    state.currentPage = parseInt(btn.dataset.page, 10);
                    renderTable();
                    renderPagination();
                });
            });
        }
    }

    /* ============ MODAL HANDLERS FOR PATIENTS ============ */
    function showPatientHistory(id) {
        const p = state.rawPacientes.find(item => item.id === id);
        if (!p) return;

        const modal = $('#pacienteModal');
        const title = $('#pacienteModalTitle');
        const body = $('#pacienteModalBody');

        title.innerHTML = `<i data-lucide="history" class="h-5 w-5 text-teal-600" aria-hidden="true"></i> Histórico Clínico — ${escapeHTML(p.nome)}`;
        body.innerHTML = `
            <div class="grid grid-cols-2 gap-3 rounded-xl border p-3 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                <div><strong>Reg:</strong> ${p.id}</div>
                <div><strong>Status:</strong> <span class="${p.status === 'Ativo' ? 'status-badge-ativo' : 'status-badge-inativo'}">${p.status}</span></div>
                <div><strong>Convênio:</strong> ${escapeHTML(p.convenio)}</div>
                <div><strong>Consultas Realizadas:</strong> ${p.consultasRealizadas}</div>
            </div>
            <div class="mt-3">
                <h4 class="font-extrabold mb-2 text-slate-800 dark:text-slate-200">Últimas Consultas Registradas:</h4>
                <ul class="space-y-2">
                    <li class="rounded-lg border p-2.5 dark:border-slate-800">
                        <div class="font-bold">${p.dataUltimoAtendimento} — Cardiologia (Dr. João Silva)</div>
                        <div class="text-[11px] text-slate-500">Consulta de retorno presencial. Pressão arterial 120x80 mmHg. Exames aprovados.</div>
                    </li>
                    <li class="rounded-lg border p-2.5 dark:border-slate-800">
                        <div class="font-bold">14/05/2026 — Clínico Geral (Dra. Mariana Costa)</div>
                        <div class="text-[11px] text-slate-500">Check-up preventivo anual. Encaminhado para exames de rotina.</div>
                    </li>
                </ul>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        refreshIcons();
    }

    function showPatientProfile(id) {
        const p = state.rawPacientes.find(item => item.id === id);
        if (!p) return;

        const modal = $('#pacienteModal');
        const title = $('#pacienteModalTitle');
        const body = $('#pacienteModalBody');

        title.innerHTML = `<i data-lucide="user" class="h-5 w-5 text-teal-600" aria-hidden="true"></i> Cadastro do Paciente — ${escapeHTML(p.nome)}`;
        body.innerHTML = `
            <div class="grid grid-cols-2 gap-3 text-xs">
                <div><strong>Nome Completo:</strong> ${escapeHTML(p.nome)}</div>
                <div><strong>CPF:</strong> ${escapeHTML(p.cpf)}</div>
                <div><strong>Data de Nascimento:</strong> ${p.dataNascimento} (${p.idade} anos)</div>
                <div><strong>Telefone / Whats:</strong> ${escapeHTML(p.telefone)}</div>
                <div><strong>Convênio:</strong> ${escapeHTML(p.convenio)}</div>
                <div><strong>Origem do Cadastro:</strong> ${escapeHTML(p.origem)}</div>
                <div><strong>Data de Cadastro:</strong> ${p.dataCadastroFormatted}</div>
                <div><strong>Status do Cadastro:</strong> <span class="${p.status === 'Ativo' ? 'status-badge-ativo' : 'status-badge-inativo'}">${p.status}</span></div>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        refreshIcons();
    }

    function closePatientModal() {
        const modal = $('#pacienteModal');
        modal?.classList.add('hidden');
        modal?.setAttribute('aria-hidden', 'true');
    }

    /* ============ EXPORT HANDLERS ============ */
    function exportToExcel() {
        const headers = ['ID', 'Nome', 'CPF', 'Telefone', 'Data Nascimento', 'Data Cadastro', 'Último Atendimento', 'Status', 'Convênio', 'Origem'];
        const rows = state.filteredPacientes.map(p => [
            p.id, p.nome, p.cpf, p.telefone, p.dataNascimento, p.dataCadastroFormatted, p.dataUltimoAtendimento, p.status, p.convenio, p.origem
        ]);

        const csvContent = [headers, ...rows]
            .map(e => e.map(val => `"${String(val).replaceAll('"', '""')}"`).join(';'))
            .join('\r\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `relatorio-pacientes-gm4med-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Exportação concluída', 'Planilha de pacientes gerada com sucesso.', 'ok');
    }

    function exportToPdf() {
        showToast('Gerando PDF...', 'Formatando lista de pacientes para impressão.');
        setTimeout(() => window.print(), 300);
    }

    /* ============ HELPERS & UTILS ============ */
    function escapeHTML(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function showToast(title, msg = '', type = 'info') {
        const area = $('#toastBox');
        if (!area) return;

        const toastEl = document.createElement('div');
        toastEl.className = 'toast toast-' + type;
        toastEl.innerHTML = `<strong>${title}</strong>${msg ? `<div class="text-[11px] font-normal">${msg}</div>` : ''}`;
        area.appendChild(toastEl);

        setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateX(30px)';
        }, 2800);

        setTimeout(() => toastEl.remove(), 3200);
    }

    function refreshIcons() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /* ============ CHARTS INITIALIZATION ============ */
    function initCharts() {
        const ctxNovos = $('#chartNovosPacientes')?.getContext('2d');
        if (ctxNovos) {
            charts.set('novos', new Chart(ctxNovos, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                    datasets: [
                        { label: 'Novos Pacientes', data: [342, 368, 401, 389, 425, 448, 462, 471, 489, 512, 498, 487], backgroundColor: '#0d9488', borderRadius: 6 },
                        { label: 'Meta Captação', data: [350, 370, 390, 410, 430, 450, 470, 490, 510, 530, 550, 570], type: 'line', borderColor: '#10b981', borderDash: [5, 5], fill: false }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            }));
        }

        const ctxSexo = $('#chartSexoPacientes')?.getContext('2d');
        if (ctxSexo) {
            charts.set('sexo', new Chart(ctxSexo, {
                type: 'doughnut',
                data: {
                    labels: ['Feminino', 'Masculino', 'Outro'],
                    datasets: [{ data: [7048, 5011, 788], backgroundColor: ['#f43f5e', '#0d9488', '#94a3b8'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }
            }));
            const legendEl = $('#legendSexo');
            if (legendEl) {
                legendEl.innerHTML = `
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold"><span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span>Feminino 55%</span>
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold"><span class="h-2.5 w-2.5 rounded-full bg-teal-600"></span>Masculino 39%</span>
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold"><span class="h-2.5 w-2.5 rounded-full bg-slate-400"></span>Outros 6%</span>
                `;
            }
        }

        const ctxConv = $('#chartConveniosPacientes')?.getContext('2d');
        if (ctxConv) {
            charts.set('convenios', new Chart(ctxConv, {
                type: 'bar',
                data: {
                    labels: ['Particular', 'Unimed', 'Bradesco', 'SulAmérica', 'Amil'],
                    datasets: [{ data: [2840, 3210, 1980, 1420, 1180], backgroundColor: '#14b8a6', borderRadius: 6 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            }));
        }

        // Sparklines
        $$('.spark').forEach(el => {
            const color = el.dataset.color || '#0d9488';
            const data = Array.from({ length: 10 }, () => Math.random() * 40 + 20);
            const c = el.getContext('2d');
            new Chart(c, {
                type: 'line',
                data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
            });
        });
    }

    /* ============ EVENT BINDINGS ============ */
    function bindEvents() {
        // Filter Apply
        $('#btnApply')?.addEventListener('click', () => {
            if (!validateDates()) return;

            state.filters = {
                dateFrom: $('#dateFrom')?.value || '',
                dateTo: $('#dateTo')?.value || '',
                status: $('#fStatus')?.value || '',
                insurance: $('#fIns')?.value || '',
                ageGroup: $('#fAge')?.value || '',
                origin: $('#fOrig')?.value || '',
                search: $('#pacienteSearch')?.value || ''
            };

            carregarRelatorioPacientes(state.filters);
            showToast('Filtros aplicados', 'Lista de pacientes atualizada com sucesso.', 'ok');
        });

        // Filter Clear
        const clearFilters = () => {
            if ($('#dateFrom')) $('#dateFrom').value = '';
            if ($('#dateTo')) $('#dateTo').value = '';
            if ($('#fStatus')) $('#fStatus').selectedIndex = 0;
            if ($('#fIns')) $('#fIns').selectedIndex = 0;
            if ($('#fAge')) $('#fAge').selectedIndex = 0;
            if ($('#fOrig')) $('#fOrig').selectedIndex = 0;
            if ($('#pacienteSearch')) $('#pacienteSearch').value = '';

            validateDates();
            state.filters = { dateFrom: '', dateTo: '', status: '', insurance: '', ageGroup: '', origin: '', search: '' };
            carregarRelatorioPacientes(state.filters);
            showToast('Filtros limpos', 'Exibindo todos os pacientes.', 'info');
        };

        $('#btnClear')?.addEventListener('click', clearFilters);
        $('#btnResetFiltersEmpty')?.addEventListener('click', clearFilters);

        // Search Input
        $('#pacienteSearch')?.addEventListener('input', e => {
            state.filters.search = e.target.value;
            carregarRelatorioPacientes(state.filters);
        });

        // Pagination
        $('#btnPrevPage')?.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderTable();
                renderPagination();
            }
        });

        $('#btnNextPage')?.addEventListener('click', () => {
            const totalPages = Math.ceil(state.filteredPacientes.length / state.pageSize);
            if (state.currentPage < totalPages) {
                state.currentPage++;
                renderTable();
                renderPagination();
            }
        });

        // Export Dropdown
        const exportBtn = $('#btnExportMenu');
        const exportMenu = $('#exportMenu');

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
        $('#btnRetryPacientes')?.addEventListener('click', () => {
            carregarRelatorioPacientes(state.filters);
        });

        // Theme Toggle
        $('#toggleTheme')?.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            showToast('Tema alterado', 'Preferência de visualização atualizada.');
        });

        // Refresh Button
        $('#btnRefresh')?.addEventListener('click', () => {
            carregarRelatorioPacientes(state.filters);
            const lastUp = $('#lastUpdate');
            if (lastUp) lastUp.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            showToast('Dados sincronizados', 'Relatório de pacientes atualizado.');
        });

        // Modal Close
        $('#btnClosePatientModal')?.addEventListener('click', closePatientModal);
        $('#btnPatientModalClose')?.addEventListener('click', closePatientModal);
        $('#btnPatientModalPrint')?.addEventListener('click', () => window.print());

        // Period Buttons
        $$('#periodTabs button').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('#periodTabs button').forEach(b => {
                    b.classList.remove('active', 'text-white');
                    b.style.background = '';
                });

                btn.classList.add('active', 'text-white');
                btn.style.background = 'var(--gradient)';

                const period = btn.dataset.period;
                if (period !== 'custom') {
                    const to = new Date();
                    const from = new Date();
                    from.setDate(from.getDate() - parseInt(period, 10));

                    if ($('#dateFrom')) $('#dateFrom').valueAsDate = from;
                    if ($('#dateTo')) $('#dateTo').valueAsDate = to;

                    validateDates();
                    state.filters.dateFrom = $('#dateFrom')?.value || '';
                    state.filters.dateTo = $('#dateTo')?.value || '';
                    carregarRelatorioPacientes(state.filters);
                }
            });
        });
    }

    /* ============ INITIALIZATION ============ */
    function init() {
        refreshIcons();

        // Default date range
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        if ($('#dateFrom')) $('#dateFrom').valueAsDate = from;
        if ($('#dateTo')) $('#dateTo').valueAsDate = to;

        state.filters.dateFrom = $('#dateFrom')?.value || '';
        state.filters.dateTo = $('#dateTo')?.value || '';

        initCharts();
        bindEvents();
        carregarRelatorioPacientes(state.filters);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
