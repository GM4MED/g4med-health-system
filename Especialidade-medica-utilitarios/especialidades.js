/* =============================================
   ESPECIALIDADES MÉDICAS - GM4med
   JavaScript Funcional Completo (Corrigido)
   ============================================= */

// =============================================
// ESTADO GLOBAL
// =============================================
let especialidadesData = [];
let filteredEspecialidades = [];
let especialidadeAtual = null;
let modoEdicao = false;
let especialidadeParaExcluir = null;
let currentTheme = 'light';
let currentPage = 1;
const itemsPerPage = 10;

// Dados simulados
const mockEspecialidades = [
    { id: 'ESP-001', codigo: 'ESP-001', nome: 'Cardiologia', descricao: 'Diagnóstico e tratamento das doenças cardiovasculares', profissionais: 12, status: 'ativo', criadaEm: '2026-05-10T08:00:00', atualizadaEm: '2026-08-18T14:32:00' },
    { id: 'ESP-002', codigo: 'ESP-002', nome: 'Neurologia', descricao: 'Avaliação e tratamento de doenças neurológicas', profissionais: 8, status: 'ativo', criadaEm: '2026-05-12T09:00:00', atualizadaEm: '2026-08-17T10:15:00' },
    { id: 'ESP-003', codigo: 'ESP-003', nome: 'Pediatria', descricao: 'Cuidados médicos com crianças e adolescentes', profissionais: 15, status: 'ativo', criadaEm: '2026-05-15T10:00:00', atualizadaEm: '2026-08-16T16:45:00' },
    { id: 'ESP-004', codigo: 'ESP-004', nome: 'Ortopedia', descricao: 'Tratamento de doenças e lesões do sistema musculoesquelético', profissionais: 10, status: 'ativo', criadaEm: '2026-05-18T11:00:00', atualizadaEm: '2026-08-15T09:30:00' },
    { id: 'ESP-005', codigo: 'ESP-005', nome: 'Dermatologia', descricao: 'Diagnóstico e tratamento de doenças da pele', profissionais: 6, status: 'ativo', criadaEm: '2026-05-20T14:00:00', atualizadaEm: '2026-08-14T11:20:00' },
    { id: 'ESP-006', codigo: 'ESP-006', nome: 'Oftalmologia', descricao: 'Cuidados com a saúde dos olhos e visão', profissionais: 7, status: 'ativo', criadaEm: '2026-05-22T15:00:00', atualizadaEm: '2026-08-13T13:45:00' },
    { id: 'ESP-007', codigo: 'ESP-007', nome: 'Ginecologia', descricao: 'Saúde feminina e cuidados reprodutivos', profissionais: 9, status: 'ativo', criadaEm: '2026-05-25T16:00:00', atualizadaEm: '2026-08-12T15:00:00' },
    { id: 'ESP-008', codigo: 'ESP-008', nome: 'Psiquiatria', descricao: 'Diagnóstico e tratamento de transtornos mentais', profissionais: 5, status: 'inativo', criadaEm: '2026-05-28T08:00:00', atualizadaEm: '2026-08-10T10:00:00' },
    { id: 'ESP-009', codigo: 'ESP-009', nome: 'Endocrinologia', descricao: 'Tratamento de distúrbios hormonais e metabólicos', profissionais: 4, status: 'ativo', criadaEm: '2026-06-01T09:00:00', atualizadaEm: '2026-08-08T14:30:00' },
    { id: 'ESP-010', codigo: 'ESP-010', nome: 'Gastroenterologia', descricao: 'Doenças do sistema digestivo', profissionais: 6, status: 'ativo', criadaEm: '2026-06-05T10:00:00', atualizadaEm: '2026-08-05T16:00:00' },
];

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    showLoadingSkeleton();

    setTimeout(() => {
        especialidadesData = [...mockEspecialidades];
        filteredEspecialidades = [...especialidadesData];

        renderTable();
        updateKPIs();
        updateFooter();
        configurarEventListeners();

        lucide.createIcons();
    }, 500);
});

// =============================================
// SKELETON LOADING
// =============================================
function showLoadingSkeleton() {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="skeleton skeleton-text" style="width: 80px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 150px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 100%;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 40px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 60px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 100px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 32px;"></div></td>
        `;
        tbody.appendChild(tr);
    }
}

// =============================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================
function configurarEventListeners() {
    const toggleTheme = document.getElementById('toggleTheme');
    if (toggleTheme) toggleTheme.addEventListener('click', toggleThemeMode);

    const btnNova = document.getElementById('btnNovaEspecialidade');
    if (btnNova) btnNova.addEventListener('click', abrirModalNova);

    const searchInput = document.getElementById('searchEspecialidade');
    if (searchInput) searchInput.addEventListener('input', aplicarFiltros);

    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltros);

    const filtroOrdenacao = document.getElementById('filtroOrdenacao');
    if (filtroOrdenacao) filtroOrdenacao.addEventListener('change', aplicarFiltros);

    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

    // Modais e Fechamentos
    setupModalEvents();

    // Atalho ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fecharModalEspecialidade();
            fecharModalVisualizar();
            fecharModalExcluir();
        }
    });
}

function setupModalEvents() {
    const modalEspecialidade = document.getElementById('modalEspecialidade');
    const modalClose = document.getElementById('modalClose');
    const btnCancelar = document.getElementById('btnCancelar');
    const especialidadeForm = document.getElementById('especialidadeForm');

    if (modalClose) modalClose.addEventListener('click', fecharModalEspecialidade);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalEspecialidade);
    if (especialidadeForm) {
        especialidadeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            gravarEspecialidade();
        });
    }
    if (modalEspecialidade) {
        modalEspecialidade.addEventListener('click', (e) => {
            if (e.target === modalEspecialidade) fecharModalEspecialidade();
        });
    }

    // Visualizar
    const modalVisualizar = document.getElementById('modalVisualizar');
    const modalViewClose = document.getElementById('modalViewClose');
    const modalViewClose2 = document.getElementById('modalViewClose2');
    const btnEditarDoView = document.getElementById('btnEditarDoView');

    if (modalViewClose) modalViewClose.addEventListener('click', fecharModalVisualizar);
    if (modalViewClose2) modalViewClose2.addEventListener('click', fecharModalVisualizar);
    if (btnEditarDoView) {
        btnEditarDoView.addEventListener('click', () => {
            fecharModalVisualizar();
            if (especialidadeAtual) editarEspecialidade(especialidadeAtual.id);
        });
    }
    if (modalVisualizar) {
        modalVisualizar.addEventListener('click', (e) => {
            if (e.target === modalVisualizar) fecharModalVisualizar();
        });
    }

    // Exclusão
    const modalExcluir = document.getElementById('modalExcluir');
    const delCancel = document.getElementById('delCancel');
    const delConfirm = document.getElementById('delConfirm');

    if (delCancel) delCancel.addEventListener('click', fecharModalExcluir);
    if (delConfirm) delConfirm.addEventListener('click', confirmarExclusao);
    if (modalExcluir) {
        modalExcluir.addEventListener('click', (e) => {
            if (e.target === modalExcluir) fecharModalExcluir();
        });
    }
}

// =============================================
// FUNÇÕES DE TABELA
// =============================================
function renderTable() {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filteredEspecialidades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i data-lucide="inbox"></i>
                        <p>Nenhuma especialidade encontrada.</p>
                        <small>Cadastre uma nova especialidade médica para começar.</small>
                        <div style="margin-top: 1rem;">
                            <button class="btn primary" onclick="abrirModalNova()">
                                <i data-lucide="plus-circle"></i> Nova Especialidade
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredEspecialidades.slice(startIndex, endIndex);

    paginatedData.forEach(esp => {
        const tr = document.createElement('tr');
        tr.dataset.id = esp.id;

        tr.innerHTML = `
            <td><span class="font-mono text-sm">${esp.codigo}</span></td>
            <td><strong>${esp.nome}</strong></td>
            <td>${esp.descricao || '—'}</td>
            <td><span class="badge-profissionais">${esp.profissionais} profissionais</span></td>
            <td>
                <span class="status-badge ${esp.status}">
                    <span class="status-dot"></span>
                    ${esp.status === 'ativo' ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td>${formatDate(esp.atualizadaEm)}</td>
            <td>
                <div class="actions-group">
                    <button type="button" class="action-btn" onclick="visualizarEspecialidade('${esp.id}')" aria-label="Visualizar" title="Visualizar">
                        <i data-lucide="eye"></i>
                    </button>
                    <button type="button" class="action-btn" onclick="editarEspecialidade('${esp.id}')" aria-label="Editar" title="Editar">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button type="button" class="action-btn text-red-500" onclick="abrirModalExcluirPorId('${esp.id}')" aria-label="Excluir" title="Excluir">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        // Exemplo aplicado na criação da linha (tr) e dos seus elementos:

        // 1. Ao criar o grupo de ações ou os botões, impeça que o clique neles suba para a linha (tr)
        const actionsGroup = tr.querySelector('.actions-group');
        if (actionsGroup) {
            actionsGroup.addEventListener('click', function (e) {
                e.stopPropagation(); // Impede que o clique chegue ao 'tr'
            });
        }

        // 2. No evento de clique da linha, certifique-se de que só abre a visualização se não foi em um botão
        tr.addEventListener('click', function (e) {
            // Se por algum motivo o stopPropagation falhar, esta salvaguarda dupla garante que não abre
            if (!e.target.closest('button') && !e.target.closest('.action-btn')) {
                visualizarEspecialidade(esp.id);
            }
        });
        tbody.appendChild(tr);
    });

    lucide.createIcons();

    const showingEl = document.getElementById('showing');
    const totalRowsEl = document.getElementById('totalRows');
    if (showingEl) showingEl.textContent = Math.min(endIndex, filteredEspecialidades.length);
    if (totalRowsEl) totalRowsEl.textContent = filteredEspecialidades.length;

    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredEspecialidades.length / itemsPerPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    html += `
        <button type="button" class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i data-lucide="chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="px-2 text-muted">...</span>`;
        }
    }

    html += `
        <button type="button" class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i data-lucide="chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
    lucide.createIcons();
}

function changePage(page) {
    const totalPages = Math.ceil(filteredEspecialidades.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

// =============================================
// FILTROS E PESQUISA
// =============================================
function aplicarFiltros() {
    const searchInput = document.getElementById('searchEspecialidade');
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroOrdenacao = document.getElementById('filtroOrdenacao');

    const termo = searchInput ? searchInput.value.toLowerCase() : '';
    const status = filtroStatus ? filtroStatus.value : '';
    const ordenacao = filtroOrdenacao ? filtroOrdenacao.value : 'nome-asc';

    filteredEspecialidades = especialidadesData.filter(esp => {
        const matchSearch = !termo ||
            esp.nome.toLowerCase().includes(termo) ||
            esp.codigo.toLowerCase().includes(termo) ||
            (esp.descricao && esp.descricao.toLowerCase().includes(termo));

        const matchStatus = !status || esp.status === status;
        return matchSearch && matchStatus;
    });

    filteredEspecialidades.sort((a, b) => {
        switch (ordenacao) {
            case 'nome-asc': return a.nome.localeCompare(b.nome);
            case 'nome-desc': return b.nome.localeCompare(a.nome);
            case 'recentes': return new Date(b.atualizadaEm) - new Date(a.atualizadaEm);
            case 'antigas': return new Date(a.atualizadaEm) - new Date(b.atualizadaEm);
            default: return 0;
        }
    });

    currentPage = 1;
    renderTable();
    updateKPIs();
}

function limparFiltros() {
    const searchInput = document.getElementById('searchEspecialidade');
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroOrdenacao = document.getElementById('filtroOrdenacao');

    if (searchInput) searchInput.value = '';
    if (filtroStatus) filtroStatus.value = '';
    if (filtroOrdenacao) filtroOrdenacao.value = 'nome-asc';

    filteredEspecialidades = [...especialidadesData];
    currentPage = 1;
    renderTable();
    updateKPIs();
}

// =============================================
// KPIS E FOOTER
// =============================================
function updateKPIs() {
    const total = filteredEspecialidades.length;
    const ativas = filteredEspecialidades.filter(e => e.status === 'ativo').length;
    const inativas = filteredEspecialidades.filter(e => e.status === 'inativo').length;

    const ultimaAtualizacao = especialidadesData.length > 0 ?
        new Date(Math.max(...especialidadesData.map(e => new Date(e.atualizadaEm)))) : null;

    const kpiTotal = document.getElementById('kpiTotal');
    const kpiAtivas = document.getElementById('kpiAtivas');
    const kpiInativas = document.getElementById('kpiInativas');
    const kpiLast = document.getElementById('kpiLast');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiAtivas) kpiAtivas.textContent = ativas;
    if (kpiInativas) kpiInativas.textContent = inativas;
    if (kpiLast) {
        kpiLast.textContent = ultimaAtualizacao ?
            ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
    }
}

function updateFooter() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const lastSync = document.getElementById('lastSync');
    if (lastSync) lastSync.textContent = timeStr;
}

// =============================================
// MODAIS (CRUD)
// =============================================
function abrirModalNova() {
    modoEdicao = false;
    especialidadeAtual = null;

    const form = document.getElementById('especialidadeForm');
    if (form) form.reset();

    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.value = 'ESP-' + String(especialidadesData.length + 1).padStart(3, '0');
    }

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerHTML = '<i data-lucide="plus-circle"></i> Nova Especialidade Médica';

    const modal = document.getElementById('modalEspecialidade');
    if (modal) modal.hidden = false;

    setTimeout(() => {
        const nomeInput = document.getElementById('nome');
        if (nomeInput) nomeInput.focus();
    }, 100);

    lucide.createIcons();
}

function fecharModalEspecialidade() {
    const modal = document.getElementById('modalEspecialidade');
    if (modal) modal.hidden = true;
    clearAllValidations();
}

function editarEspecialidade(id) {
    const esp = especialidadesData.find(e => e.id === id);
    if (!esp) return;

    modoEdicao = true;
    especialidadeAtual = esp;

    const codigoInput = document.getElementById('codigo');
    const nomeInput = document.getElementById('nome');
    const descInput = document.getElementById('descricao');
    const statusInput = document.getElementById('status');
    const obsInput = document.getElementById('observacoes');

    if (codigoInput) codigoInput.value = esp.codigo;
    if (nomeInput) nomeInput.value = esp.nome;
    if (descInput) descInput.value = esp.descricao || '';
    if (statusInput) statusInput.value = esp.status;
    if (obsInput) obsInput.value = esp.observacoes || '';

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerHTML = '<i data-lucide="edit-2"></i> Editar Especialidade';

    const modal = document.getElementById('modalEspecialidade');
    if (modal) modal.hidden = false;

    lucide.createIcons();
}

function visualizarEspecialidade(id) {
    const esp = especialidadesData.find(e => e.id === id);
    if (!esp) return;

    especialidadeAtual = esp;

    const vCodigo = document.getElementById('viewCodigo');
    const vNome = document.getElementById('viewNome');
    const vDesc = document.getElementById('viewDescricao');
    const vProf = document.getElementById('viewProfissionais');
    const vStatus = document.getElementById('viewStatus');
    const vCriada = document.getElementById('viewCriada');
    const vAtu = document.getElementById('viewAtualizacao');

    if (vCodigo) vCodigo.textContent = esp.codigo;
    if (vNome) vNome.textContent = esp.nome;
    if (vDesc) vDesc.textContent = esp.descricao || '—';
    if (vProf) vProf.textContent = `${esp.profissionais} profissionais`;
    if (vStatus) {
        vStatus.innerHTML = `
            <span class="status-badge ${esp.status}">
                <span class="status-dot"></span>
                ${esp.status === 'ativo' ? 'Ativa' : 'Inativa'}
            </span>
        `;
    }
    if (vCriada) vCriada.textContent = formatDate(esp.criadaEm);
    if (vAtu) vAtu.textContent = formatDate(esp.atualizadaEm);

    const modal = document.getElementById('modalVisualizar');
    if (modal) modal.hidden = false;

    lucide.createIcons();
}

function fecharModalVisualizar() {
    const modal = document.getElementById('modalVisualizar');
    if (modal) modal.hidden = true;
}

function abrirModalExcluirPorId(id) {
    const esp = especialidadesData.find(e => e.id === id);
    if (!esp) return;
    especialidadeParaExcluir = esp;

    const delNome = document.getElementById('delNome');
    if (delNome) delNome.textContent = esp.nome;

    const modal = document.getElementById('modalExcluir');
    if (modal) modal.hidden = false;
    lucide.createIcons();
}

function fecharModalExcluir() {
    const modal = document.getElementById('modalExcluir');
    if (modal) modal.hidden = true;
    especialidadeParaExcluir = null;
}

function confirmarExclusao() {
    if (!especialidadeParaExcluir) return;

    especialidadesData = especialidadesData.filter(e => e.id !== especialidadeParaExcluir.id);
    filteredEspecialidades = [...especialidadesData];

    renderTable();
    updateKPIs();
    updateFooter();
    fecharModalExcluir();

    showToast('Especialidade excluída com sucesso!', 'success');
}

// =============================================
// FORMULÁRIO E VALIDAÇÕES
// =============================================
function gravarEspecialidade() {
    if (!validateForm()) {
        showToast('Preencha os campos obrigatórios corretamente', 'error');
        return;
    }

    const nomeInput = document.getElementById('nome');
    const descInput = document.getElementById('descricao');
    const statusInput = document.getElementById('status');
    const obsInput = document.getElementById('observacoes');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const descricao = descInput ? descInput.value.trim() : '';
    const status = statusInput ? statusInput.value : 'ativo';
    const observacoes = obsInput ? obsInput.value.trim() : '';

    if (modoEdicao && especialidadeAtual) {
        especialidadeAtual.nome = nome;
        especialidadeAtual.descricao = descricao;
        especialidadeAtual.status = status;
        especialidadeAtual.observacoes = observacoes;
        especialidadeAtual.atualizadaEm = new Date().toISOString();

        showToast('Especialidade atualizada com sucesso!', 'success');
    } else {
        const codigoInput = document.getElementById('codigo');
        const novaEspecialidade = {
            id: codigoInput ? codigoInput.value : 'ESP-00X',
            codigo: codigoInput ? codigoInput.value : 'ESP-00X',
            nome: nome,
            descricao: descricao,
            profissionais: 0,
            status: status,
            observacoes: observacoes,
            criadaEm: new Date().toISOString(),
            atualizadaEm: new Date().toISOString()
        };

        especialidadesData.push(novaEspecialidade);
        showToast('Especialidade cadastrada com sucesso!', 'success');
    }

    filteredEspecialidades = [...especialidadesData];
    renderTable();
    updateKPIs();
    updateFooter();
    fecharModalEspecialidade();
}

function validateForm() {
    const inputNome = document.getElementById('nome');
    if (!inputNome) return true;
    const nome = inputNome.value.trim();
    const inputWrapNome = inputNome.closest('.input-wrap');
    let isValid = true;

    if (!inputWrapNome) return true;

    if (!nome) {
        inputWrapNome.classList.add('error');
        showFieldError(inputNome, 'Nome da especialidade é obrigatório');
        isValid = false;
    } else if (nome.length < 3) {
        inputWrapNome.classList.add('error');
        showFieldError(inputNome, 'Nome deve ter pelo menos 3 caracteres');
        isValid = false;
    } else {
        inputWrapNome.classList.remove('error');
        inputWrapNome.classList.add('success');
        clearFieldError(inputNome);
    }

    return isValid;
}

function clearAllValidations() {
    const inputs = document.querySelectorAll('#especialidadeForm input, #especialidadeForm textarea');
    inputs.forEach(input => {
        const inputWrap = input.closest('.input-wrap');
        if (inputWrap) inputWrap.classList.remove('error', 'success');
        clearFieldError(input);
    });
}

function showFieldError(input, message) {
    clearFieldError(input);
    const parentField = input.closest('.field');
    if (!parentField) return;

    const errorEl = document.createElement('small');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.id = 'error-' + input.id;
    parentField.appendChild(errorEl);
}

function clearFieldError(input) {
    const existingError = document.getElementById('error-' + input.id);
    if (existingError) existingError.remove();
}

// =============================================
// TEMA E UTILITÁRIOS
// =============================================
function toggleThemeMode() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    const btn = document.getElementById('toggleTheme');

    if (currentTheme === 'dark') {
        if (btn) btn.innerHTML = '<i data-lucide="sun"></i>';
        document.body.style.background = '#0f172a';
        document.body.style.color = '#f1f5f9';
        showToast('Tema escuro ativado', 'info');
    } else {
        if (btn) btn.innerHTML = '<i data-lucide="moon"></i>';
        document.body.style.background = '#f8fafc';
        document.body.style.color = '#0f172a';
        showToast('Tema claro ativado', 'info');
    }
    lucide.createIcons();
}

function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
}

function showToast(message, type = 'info') {
    const toastBox = document.getElementById('toastBox');
    if (!toastBox) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;

    toastBox.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================
// EXPOSIÇÃO GLOBAL (ESCOPO WINDOW)
// =============================================
window.abrirModalNova = abrirModalNova;
window.editarEspecialidade = editarEspecialidade;
window.visualizarEspecialidade = visualizarEspecialidade;
window.abrirModalExcluirPorId = abrirModalExcluirPorId;
window.changePage = changePage;