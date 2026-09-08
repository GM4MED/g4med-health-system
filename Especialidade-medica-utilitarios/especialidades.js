/* =============================================
   ESPECIALIDADES MÉDICAS - GM4med
   JavaScript Funcional Completo
   Design System: Medical Enterprise + Clean UI
   Primary Color: teal-600 (#0D9488)
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

// Dados simulados (em produção, viriam do backend)
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
    // Inicializar ícones Lucide
    lucide.createIcons();

    // Mostrar loading skeleton
    showLoadingSkeleton();

    // Simular delay de carregamento
    setTimeout(() => {
        // Carregar dados
        especialidadesData = [...mockEspecialidades];
        filteredEspecialidades = [...especialidadesData];

        // Popular tabela
        renderTable();

        // Atualizar KPIs
        updateKPIs();

        // Atualizar footer
        updateFooter();

        // Configurar event listeners
        configurarEventListeners();

        console.log('Sistema de Especialidades Médicas inicializado!');
    }, 800);
});

// =============================================
// SKELETON LOADING
// =============================================
function showLoadingSkeleton() {
    const tbody = document.getElementById('corpoTabela');
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
    // Topbar
    const toggleTheme = document.getElementById('toggleTheme');
    if (toggleTheme) {
        toggleTheme.addEventListener('click', toggleThemeMode);
    }

    // Botão Nova Especialidade
    const btnNova = document.getElementById('btnNovaEspecialidade');
    if (btnNova) {
        btnNova.addEventListener('click', abrirModalNova);
    }

    // Barra de pesquisa
    const searchInput = document.getElementById('searchEspecialidade');
    if (searchInput) {
        searchInput.addEventListener('input', pesquisarEspecialidades);
    }

    // Filtros
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroOrdenacao = document.getElementById('filtroOrdenacao');

    if (filtroStatus) {
        filtroStatus.addEventListener('change', aplicarFiltros);
    }

    if (filtroOrdenacao) {
        filtroOrdenacao.addEventListener('change', aplicarFiltros);
    }

    // Limpar filtros
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFiltros);
    }

    // Modal Nova/Editar
    const modalEspecialidade = document.getElementById('modalEspecialidade');
    const modalClose = document.getElementById('modalClose');
    const btnCancelar = document.getElementById('btnCancelar');
    const especialidadeForm = document.getElementById('especialidadeForm');

    if (modalClose) {
        modalClose.addEventListener('click', fecharModalEspecialidade);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', fecharModalEspecialidade);
    }

    if (especialidadeForm) {
        especialidadeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            gravarEspecialidade();
        });
    }

    // Fechar modal ao clicar fora
    if (modalEspecialidade) {
        modalEspecialidade.addEventListener('click', function (e) {
            if (e.target === this) {
                fecharModalEspecialidade();
            }
        });
    }

    // Modal Visualização
    const modalVisualizar = document.getElementById('modalVisualizar');
    const modalViewClose = document.getElementById('modalViewClose');
    const modalViewClose2 = document.getElementById('modalViewClose2');
    const btnEditarDoView = document.getElementById('btnEditarDoView');

    if (modalViewClose) {
        modalViewClose.addEventListener('click', fecharModalVisualizar);
    }

    if (modalViewClose2) {
        modalViewClose2.addEventListener('click', fecharModalVisualizar);
    }

    if (btnEditarDoView) {
        btnEditarDoView.addEventListener('click', function () {
            fecharModalVisualizar();
            editarEspecialidade(especialidadeAtual?.id);
        });
    }

    if (modalVisualizar) {
        modalVisualizar.addEventListener('click', function (e) {
            if (e.target === this) {
                fecharModalVisualizar();
            }
        });
    }

    // Modal Exclusão
    const modalExcluir = document.getElementById('modalExcluir');
    const delCancel = document.getElementById('delCancel');
    const delConfirm = document.getElementById('delConfirm');

    if (delCancel) {
        delCancel.addEventListener('click', fecharModalExcluir);
    }

    if (delConfirm) {
        delConfirm.addEventListener('click', confirmarExclusao);
    }

    if (modalExcluir) {
        modalExcluir.addEventListener('click', function (e) {
            if (e.target === this) {
                fecharModalExcluir();
            }
        });
    }

    // Fechar com ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fecharModalEspecialidade();
            fecharModalVisualizar();
            fecharModalExcluir();
        }
    });
}

// =============================================
// FUNÇÕES DE TABELA
// =============================================
function renderTable() {
    const tbody = document.getElementById('corpoTabela');
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

    // Paginação
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
                    <button class="action-btn" onclick="visualizarEspecialidade('${esp.id}')" aria-label="Visualizar" title="Visualizar">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="action-btn" onclick="editarEspecialidade('${esp.id}')" aria-label="Editar" title="Editar">
                        <i data-lucide="edit-2"></i>
                    </button>
                </div>
            </td>
        `;

        // Adicionar evento de clique na linha
        tr.addEventListener('click', function (e) {
            if (!e.target.closest('.action-btn')) {
                visualizarEspecialidade(esp.id);
            }
        });

        tbody.appendChild(tr);
    });

    lucide.createIcons();

    // Atualizar contador
    document.getElementById('showing').textContent = Math.min(endIndex, filteredEspecialidades.length);
    document.getElementById('totalRows').textContent = filteredEspecialidades.length;

    // Renderizar paginação
    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredEspecialidades.length / itemsPerPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Botão anterior
    html += `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i data-lucide="chevron-left"></i>
        </button>
    `;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="px-2 text-muted">...</span>`;
        }
    }

    // Botão próximo
    html += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
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
// FUNÇÕES DE PESQUISA E FILTROS
// =============================================
function pesquisarEspecialidades() {
    aplicarFiltros();
}

function aplicarFiltros() {
    const termo = document.getElementById('searchEspecialidade').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const ordenacao = document.getElementById('filtroOrdenacao').value;

    filteredEspecialidades = especialidadesData.filter(esp => {
        const matchSearch = !termo ||
            esp.nome.toLowerCase().includes(termo) ||
            esp.codigo.toLowerCase().includes(termo) ||
            (esp.descricao && esp.descricao.toLowerCase().includes(termo));

        const matchStatus = !status || esp.status === status;

        return matchSearch && matchStatus;
    });

    // Ordenar
    filteredEspecialidades.sort((a, b) => {
        switch (ordenacao) {
            case 'nome-asc':
                return a.nome.localeCompare(b.nome);
            case 'nome-desc':
                return b.nome.localeCompare(a.nome);
            case 'recentes':
                return new Date(b.atualizadaEm) - new Date(a.atualizadaEm);
            case 'antigas':
                return new Date(a.atualizadaEm) - new Date(b.atualizadaEm);
            default:
                return 0;
        }
    });

    currentPage = 1;
    renderTable();
    updateKPIs();
}

function limparFiltros() {
    document.getElementById('searchEspecialidade').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroOrdenacao').value = 'nome-asc';

    filteredEspecialidades = [...especialidadesData];
    currentPage = 1;
    renderTable();
    updateKPIs();
}

// =============================================
// FUNÇÕES DE KPI
// =============================================
function updateKPIs() {
    const total = filteredEspecialidades.length;
    const ativas = filteredEspecialidades.filter(e => e.status === 'ativo').length;
    const inativas = filteredEspecialidades.filter(e => e.status === 'inativo').length;

    // Última atualização
    const ultimaAtualizacao = especialidadesData.length > 0 ?
        new Date(Math.max(...especialidadesData.map(e => new Date(e.atualizadaEm)))) : null;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiAtivas').textContent = ativas;
    document.getElementById('kpiInativas').textContent = inativas;
    document.getElementById('kpiLast').textContent = ultimaAtualizacao ?
        ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
}

function updateFooter() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastSync').textContent = timeStr;
}

// =============================================
// FUNÇÕES DE MODAL
// =============================================
function abrirModalNova() {
    modoEdicao = false;
    especialidadeAtual = null;

    // Limpar formulário
    document.getElementById('especialidadeForm').reset();

    // Gerar código automático
    const proximoCodigo = 'ESP-' + String(especialidadesData.length + 1).padStart(3, '0');
    document.getElementById('codigo').value = proximoCodigo;

    // Atualizar UI
    document.getElementById('modalTitle').innerHTML = '<i data-lucide="plus-circle"></i> Nova Especialidade Médica';

    // Abrir modal
    document.getElementById('modalEspecialidade').hidden = false;

    // Focar no primeiro campo
    setTimeout(() => document.getElementById('nome').focus(), 100);

    lucide.createIcons();
}

function fecharModalEspecialidade() {
    document.getElementById('modalEspecialidade').hidden = true;
    clearAllValidations();
}

function editarEspecialidade(id) {
    const esp = especialidadesData.find(e => e.id === id);
    if (!esp) return;

    modoEdicao = true;
    especialidadeAtual = esp;

    // Preencher formulário
    document.getElementById('codigo').value = esp.codigo;
    document.getElementById('nome').value = esp.nome;
    document.getElementById('descricao').value = esp.descricao || '';
    document.getElementById('status').value = esp.status;
    document.getElementById('observacoes').value = esp.observacoes || '';

    // Atualizar UI
    document.getElementById('modalTitle').innerHTML = '<i data-lucide="edit-2"></i> Editar Especialidade';

    // Abrir modal
    document.getElementById('modalEspecialidade').hidden = false;

    lucide.createIcons();
}

function visualizarEspecialidade(id) {
    const esp = especialidadesData.find(e => e.id === id);
    if (!esp) return;

    especialidadeAtual = esp;

    // Preencher modal de visualização
    document.getElementById('viewCodigo').textContent = esp.codigo;
    document.getElementById('viewNome').textContent = esp.nome;
    document.getElementById('viewDescricao').textContent = esp.descricao || '—';
    document.getElementById('viewProfissionais').textContent = `${esp.profissionais} profissionais`;
    document.getElementById('viewStatus').innerHTML = `
        <span class="status-badge ${esp.status}">
            <span class="status-dot"></span>
            ${esp.status === 'ativo' ? 'Ativa' : 'Inativa'}
        </span>
    `;
    document.getElementById('viewCriada').textContent = formatDate(esp.criadaEm);
    document.getElementById('viewAtualizacao').textContent = formatDate(esp.atualizadaEm);

    // Abrir modal
    document.getElementById('modalVisualizar').hidden = false;

    lucide.createIcons();
}

function fecharModalVisualizar() {
    document.getElementById('modalVisualizar').hidden = true;
}

function abrirModalExcluir(esp) {
    especialidadeParaExcluir = esp;
    document.getElementById('delNome').textContent = esp.nome;
    document.getElementById('modalExcluir').hidden = false;
}

function fecharModalExcluir() {
    document.getElementById('modalExcluir').hidden = true;
    especialidadeParaExcluir = null;
}

function confirmarExclusao() {
    if (!especialidadeParaExcluir) return;

    // Remover especialidade
    especialidadesData = especialidadesData.filter(e => e.id !== especialidadeParaExcluir.id);
    filteredEspecialidades = [...especialidadesData];

    // Atualizar tabela e KPIs
    renderTable();
    updateKPIs();
    updateFooter();

    // Fechar modal
    fecharModalExcluir();

    showToast('Especialidade excluída com sucesso!', 'success');
}

// =============================================
// FUNÇÕES DE FORMULÁRIO
// =============================================
function gravarEspecialidade() {
    // Validar todos os campos
    const isValid = validateForm();

    if (!isValid) {
        showToast('Preencha os campos obrigatórios corretamente', 'error');
        return;
    }

    const nome = document.getElementById('nome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const status = document.getElementById('status').value;
    const observacoes = document.getElementById('observacoes').value.trim();

    if (modoEdicao && especialidadeAtual) {
        // Atualizar especialidade existente
        especialidadeAtual.nome = nome;
        especialidadeAtual.descricao = descricao;
        especialidadeAtual.status = status;
        especialidadeAtual.observacoes = observacoes;
        especialidadeAtual.atualizadaEm = new Date().toISOString();

        showToast('Especialidade atualizada com sucesso!', 'success');
    } else {
        // Criar nova especialidade
        const novaEspecialidade = {
            id: document.getElementById('codigo').value,
            codigo: document.getElementById('codigo').value,
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

    // Atualizar tabela e KPIs
    filteredEspecialidades = [...especialidadesData];
    renderTable();
    updateKPIs();
    updateFooter();

    // Fechar modal
    fecharModalEspecialidade();
}

function validateForm() {
    const nome = document.getElementById('nome').value.trim();
    let isValid = true;

    // Validar nome
    const inputNome = document.getElementById('nome');
    const inputWrapNome = inputNome.closest('.input-wrap');

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
        if (inputWrap) {
            inputWrap.classList.remove('error', 'success');
        }
        clearFieldError(input);
    });
}

function showFieldError(input, message) {
    clearFieldError(input);

    const errorEl = document.createElement('small');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.id = 'error-' + input.id;

    input.closest('.field').appendChild(errorEl);
}

function clearFieldError(input) {
    const existingError = document.getElementById('error-' + input.id);
    if (existingError) {
        existingError.remove();
    }
}

// =============================================
// FUNÇÕES DE AÇÃO
// =============================================
function toggleThemeMode() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    const btn = document.getElementById('toggleTheme');

    if (currentTheme === 'dark') {
        btn.innerHTML = '<i data-lucide="sun"></i>';
        document.body.style.background = '#0f172a';
        document.body.style.color = '#f1f5f9';
        showToast('Tema escuro ativado', 'info');
    } else {
        btn.innerHTML = '<i data-lucide="moon"></i>';
        document.body.style.background = '#f8fafc';
        document.body.style.color = '#0f172a';
        showToast('Tema claro ativado', 'info');
    }

    lucide.createIcons();
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
}

function showToast(message, type = 'info') {
    const toastBox = document.getElementById('toastBox');
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

// Exportar funções para escopo global
window.abrirModalNova = abrirModalNova;
window.editarEspecialidade = editarEspecialidade;
window.visualizarEspecialidade = visualizarEspecialidade;
window.changePage = changePage;