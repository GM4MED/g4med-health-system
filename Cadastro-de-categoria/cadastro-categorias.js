'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Constantes & Dados Iniciais (Categorias Padronizadas)
    // ==========================================================================
    const STORAGE_KEY = 'GM4med_categorias_exames';
    const ITEMS_PER_PAGE = 7;

    const $ = id => document.getElementById(id);

    // 15 Categorias Iniciais Padrão do Sistema
    const CATEGORIAS_INICIAIS = [
        { id: "001", nome: "CARDIOLOGIA", sigla: "CARD", descricao: "Exames relacionados ao sistema cardiovascular", status: "Ativo", dataCad: "2026-01-10", usuario: "ADMIN", dataAlt: "2026-01-10" },
        { id: "002", nome: "VASCULAR", sigla: "VASC", descricao: "Diagnóstico e exames do sistema vascular", status: "Ativo", dataCad: "2026-01-12", usuario: "ADMIN", dataAlt: "2026-01-12" },
        { id: "003", nome: "LABORATÓRIO", sigla: "LAB", descricao: "Análises clínicas e exames laboratoriais", status: "Ativo", dataCad: "2026-01-15", usuario: "ADMIN", dataAlt: "2026-01-15" },
        { id: "004", nome: "ULTRASSONOGRAFIA", sigla: "USG", descricao: "Exames de ultrassom e ecografia geral", status: "Ativo", dataCad: "2026-01-20", usuario: "ADMIN", dataAlt: "2026-01-20" },
        { id: "005", nome: "DIAGNÓSTICO POR IMAGEM", sigla: "DIAG", descricao: "Raio-X, tomografia e ressonância magnética", status: "Ativo", dataCad: "2026-01-25", usuario: "ADMIN", dataAlt: "2026-01-25" },
        { id: "006", nome: "NEUROLOGIA", sigla: "NEUR", descricao: "Exames do sistema nervoso central e periférico", status: "Ativo", dataCad: "2026-02-01", usuario: "ADMIN", dataAlt: "2026-02-01" },
        { id: "007", nome: "PNEUMOLOGIA", sigla: "PNEU", descricao: "Exames da função respiratória e pulmonar", status: "Ativo", dataCad: "2026-02-05", usuario: "ADMIN", dataAlt: "2026-02-05" },
        { id: "008", nome: "ENDOSCOPIA", sigla: "ENDO", descricao: "Exames endoscópicos e colonoscopia", status: "Ativo", dataCad: "2026-02-10", usuario: "ADMIN", dataAlt: "2026-02-10" },
        { id: "009", nome: "OFTALMOLOGIA", sigla: "OFTA", descricao: "Exames da visão e estrutura ocular", status: "Ativo", dataCad: "2026-02-15", usuario: "ADMIN", dataAlt: "2026-02-15" },
        { id: "010", nome: "OTORRINOLARINGOLOGIA", sigla: "OTOR", descricao: "Exames de ouvido, nariz e garganta", status: "Ativo", dataCad: "2026-02-20", usuario: "ADMIN", dataAlt: "2026-02-20" },
        { id: "011", nome: "GINECOLOGIA E OBSTETRÍCIA", sigla: "GINE", descricao: "Saúde feminina e acompanhamento pré-natal", status: "Ativo", dataCad: "2026-02-25", usuario: "ADMIN", dataAlt: "2026-02-25" },
        { id: "012", nome: "PATOLOGIA", sigla: "PATO", descricao: "Exames anátomo-patológicos e citologia", status: "Ativo", dataCad: "2026-03-01", usuario: "ADMIN", dataAlt: "2026-03-01" },
        { id: "013", nome: "REPRODUÇÃO HUMANA", sigla: "REPR", descricao: "Exames e procedimentos de fertilidade", status: "Ativo", dataCad: "2026-03-05", usuario: "ADMIN", dataAlt: "2026-03-05" },
        { id: "014", nome: "PROCEDIMENTOS AMBULATORIAIS", sigla: "PROC", descricao: "Pequenos procedimentos e intervenções", status: "Ativo", dataCad: "2026-03-10", usuario: "ADMIN", dataAlt: "2026-03-10" },
        { id: "015", nome: "OUTROS", sigla: "OUTR", descricao: "Outros tipos de exames diversos", status: "Ativo", dataCad: "2026-03-15", usuario: "ADMIN", dataAlt: "2026-03-15" }
    ];

    // Estado da Aplicação
    const state = {
        categorias: [],
        selectedId: null,
        mode: 'view', // 'view', 'new', 'edit'
        filtered: [],
        sortField: 'id',
        sortAsc: true,
        currentPage: 1,
        activeModal: null,
        previousFocus: null
    };

    // Campos editáveis
    const editableFields = ['nomeCategoria', 'siglaCategoria', 'descricaoCategoria', 'statusCategoria'];

    // ==========================================================================
    // Utilitários e Auxiliares
    // ==========================================================================
    const esc = value => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const normalize = value => String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const todayDate = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const toast = message => {
        const t = $('toast');
        if (!t) return;
        t.textContent = message;
        t.classList.remove('hidden');
        clearTimeout(t.timer);
        t.timer = setTimeout(() => t.classList.add('hidden'), 3200);
    };

    // ==========================================================================
    // Persistência em LocalStorage
    // ==========================================================================
    const loadCategorias = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { }
        return [...CATEGORIAS_INICIAIS];
    };

    const saveCategorias = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.categorias));
        } catch {
            toast('Erro ao salvar os dados no armazenamento do navegador.');
        }
    };

    const selectedCategory = () => state.categorias.find(c => c.id === state.selectedId);

    const generateNextId = () => {
        const nums = state.categorias.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
        const max = nums.length ? Math.max(...nums) : 0;
        return String(max + 1).padStart(3, '0');
    };

    // ==========================================================================
    // Gerenciamento de Formulário e Erros Inline
    // ==========================================================================
    function setEditable(on) {
        editableFields.forEach(id => {
            if ($(id)) $(id).disabled = !on;
        });

        if ($('categoriaId')) $('categoriaId').disabled = true;
        if ($('btnSalvar')) $('btnSalvar').disabled = !on;
    }

    function clearFieldError(fieldId, errorId) {
        const field = $(fieldId);
        const err = $(errorId);
        if (field) {
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
        }
        if (err) {
            err.textContent = '';
            err.classList.remove('visible');
        }
    }

    function showFieldError(fieldId, errorId, message) {
        const field = $(fieldId);
        const err = $(errorId);
        if (field) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
        }
        if (err) {
            err.textContent = message;
            err.classList.add('visible');
        }
    }

    function clearAllErrors() {
        clearFieldError('nomeCategoria', 'errorNome');
        clearFieldError('siglaCategoria', 'errorSigla');
    }

    function clearForm() {
        if ($('categoriaForm')) $('categoriaForm').reset();
        if ($('categoriaId')) $('categoriaId').value = '';
        if ($('recordIdBadge')) $('recordIdBadge').textContent = '--';
        if ($('descCounter')) $('descCounter').textContent = '0 / 50';
        clearAllErrors();
    }

    function fillForm(cat) {
        clearAllErrors();
        if ($('categoriaId')) $('categoriaId').value = cat.id || '';
        if ($('nomeCategoria')) $('nomeCategoria').value = cat.nome || '';
        if ($('siglaCategoria')) $('siglaCategoria').value = cat.sigla || '';
        if ($('descricaoCategoria')) $('descricaoCategoria').value = cat.descricao || '';
        if ($('statusCategoria')) $('statusCategoria').value = cat.status || 'Ativo';

        if ($('dataCadastro')) $('dataCadastro').value = cat.dataCad || todayDate();
        if ($('usuarioCadastro')) $('usuarioCadastro').value = cat.usuario || 'ADMIN';
        if ($('dataAlteracao')) $('dataAlteracao').value = cat.dataAlt || todayDate();

        if ($('recordIdBadge')) $('recordIdBadge').textContent = cat.id || '--';
        if ($('formState')) $('formState').textContent = `${cat.nome} · Status: ${cat.status}`;
        if ($('descCounter')) $('descCounter').textContent = `${(cat.descricao || '').length} / 50`;
    }

    function collectFormData() {
        const nomeRaw = ($('nomeCategoria')?.value || '').trim().replace(/\s+/g, ' ').toUpperCase();
        const siglaRaw = ($('siglaCategoria')?.value || '').trim().toUpperCase();
        const descRaw = ($('descricaoCategoria')?.value || '').trim();
        const statusVal = $('statusCategoria')?.value || 'Ativo';

        return {
            id: $('categoriaId')?.value.trim() || generateNextId(),
            nome: nomeRaw,
            sigla: siglaRaw,
            descricao: descRaw,
            status: statusVal,
            dataCad: $('dataCadastro')?.value || todayDate(),
            usuario: $('usuarioCadastro')?.value || 'ADMIN',
            dataAlt: todayDate(),
            // Payload format para REST API / Backend
            idCategoria: parseInt($('categoriaId')?.value.trim() || generateNextId(), 10),
            ativo: statusVal === 'Ativo'
        };
    }

    // ==========================================================================
    // Validações Regra de Negócio (Obrigatoriedade, Tamanhos, Duplicidade)
    // ==========================================================================
    function validateForm(data) {
        clearAllErrors();
        let valid = true;

        // 1. Validar Nome da Categoria
        if (!data.nome) {
            showFieldError('nomeCategoria', 'errorNome', 'Informe o nome da categoria.');
            if (valid) { openTab('dados-categoria'); $('nomeCategoria')?.focus(); }
            valid = false;
        } else if (data.nome.length > 25) {
            showFieldError('nomeCategoria', 'errorNome', 'O nome da categoria deve ter no máximo 25 caracteres.');
            if (valid) { openTab('dados-categoria'); $('nomeCategoria')?.focus(); }
            valid = false;
        } else {
            // Verificar duplicidade de Nome
            const dupeNome = state.categorias.find(c => c.nome === data.nome && c.id !== data.id);
            if (dupeNome) {
                showFieldError('nomeCategoria', 'errorNome', `Já existe uma categoria cadastrada com este nome (Cód: ${dupeNome.id}).`);
                if (valid) { openTab('dados-categoria'); $('nomeCategoria')?.focus(); }
                valid = false;
            }
        }

        // 2. Validar Sigla
        if (!data.sigla) {
            showFieldError('siglaCategoria', 'errorSigla', 'Informe a sigla da categoria.');
            if (valid) { openTab('dados-categoria'); $('siglaCategoria')?.focus(); }
            valid = false;
        } else if (data.sigla.length > 4) {
            showFieldError('siglaCategoria', 'errorSigla', 'A sigla deve ter no máximo 4 caracteres.');
            if (valid) { openTab('dados-categoria'); $('siglaCategoria')?.focus(); }
            valid = false;
        } else {
            // Verificar duplicidade de Sigla
            const dupeSigla = state.categorias.find(c => c.sigla === data.sigla && c.id !== data.id);
            if (dupeSigla) {
                showFieldError('siglaCategoria', 'errorSigla', `Já existe uma categoria com esta sigla (${dupeSigla.nome}).`);
                if (valid) { openTab('dados-categoria'); $('siglaCategoria')?.focus(); }
                valid = false;
            }
        }

        // 3. Validar Descrição
        if (data.descricao && data.descricao.length > 50) {
            toast('A descrição excede o limite máximo de 50 caracteres.');
            valid = false;
        }

        return valid;
    }

    // ==========================================================================
    // Máquina de Estados da Barra de Ferramentas
    // ==========================================================================
    function updateToolbar() {
        const hasSelected = Boolean(state.selectedId);
        const isEditing = ['new', 'edit'].includes(state.mode);
        const list = state.filtered.length ? state.filtered : state.categorias;
        const index = list.findIndex(c => c.id === state.selectedId);

        if ($('btnNovo')) $('btnNovo').disabled = isEditing;
        if ($('btnEditar')) $('btnEditar').disabled = !hasSelected || isEditing;
        if ($('btnExcluir')) $('btnExcluir').disabled = !hasSelected || isEditing;
        if ($('btnSalvar')) $('btnSalvar').disabled = !isEditing;
        if ($('btnAnterior')) $('btnAnterior').disabled = !hasSelected || isEditing || index <= 0;
        if ($('btnProximo')) $('btnProximo').disabled = !hasSelected || isEditing || index < 0 || index >= list.length - 1;
        if ($('btnBuscar')) $('btnBuscar').disabled = false;
        if ($('btnSair')) $('btnSair').disabled = false;
    }

    // ==========================================================================
    // Filtro, Ordenação & Paginação do Grid
    // ==========================================================================
    function getFilteredAndSortedRecords() {
        const q = normalize($('inputBusca')?.value.trim() || '');
        let list = [...state.categorias];

        if (q) {
            list = list.filter(c => [c.id, c.nome, c.sigla, c.status, c.descricao].some(val => normalize(val).includes(q)));
        }

        // Ordenação
        const field = state.sortField;
        const dir = state.sortAsc ? 1 : -1;
        list.sort((a, b) => {
            const valA = String(a[field] ?? '');
            const valB = String(b[field] ?? '');
            return valA.localeCompare(valB, 'pt-BR', { numeric: true }) * dir;
        });

        return list;
    }

    function renderGrid() {
        state.filtered = getFilteredAndSortedRecords();
        const total = state.filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

        if (state.currentPage > totalPages) state.currentPage = totalPages;

        const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = state.filtered.slice(start, end);

        const tbody = $('corpoTabelaCategorias');
        if (tbody) {
            tbody.innerHTML = pageItems.length ? pageItems.map(cat => `
                <tr data-id="${esc(cat.id)}" tabindex="0" class="${cat.id === state.selectedId ? 'selected' : ''}">
                    <td><strong>${esc(cat.id)}</strong></td>
                    <td><strong>${esc(cat.nome)}</strong></td>
                    <td><span class="GM4med-input--uppercase">${esc(cat.sigla)}</span></td>
                    <td>
                        <span class="GM4med-status-badge ${cat.status === 'Ativo' ? 'GM4med-status-badge--ativo' : 'GM4med-status-badge--inativo'}">
                            ${cat.status === 'Ativo' ? '✓ Ativo' : '✕ Inativo'}
                        </span>
                    </td>
                </tr>
            `).join('') : `
                <tr class="empty">
                    <td colspan="4" class="text-center p-4">
                        Nenhuma categoria encontrada.
                    </td>
                </tr>`;
        }

        // Atualizar informações da paginação e resumo
        if ($('gridSummary')) $('gridSummary').textContent = `Total: ${total} categoria${total !== 1 ? 's' : ''}`;
        if ($('paginationInfo')) $('paginationInfo').textContent = total ? `Exibindo ${start + 1} a ${Math.min(end, total)} de ${total}` : 'Nenhum registro';
        if ($('paginationPages')) $('paginationPages').textContent = `Página ${state.currentPage} de ${totalPages}`;
        if ($('btnPagPrev')) $('btnPagPrev').disabled = state.currentPage <= 1;
        if ($('btnPagNext')) $('btnPagNext').disabled = state.currentPage >= totalPages;

        updateToolbar();
    }

    function selectCategory(id) {
        const cat = state.categorias.find(c => c.id === id);
        if (!cat) return;
        state.selectedId = id;
        state.mode = 'view';
        fillForm(cat);
        setEditable(false);
        renderGrid();
    }

    // ==========================================================================
    // Controle de Abas WAI-ARIA
    // ==========================================================================
    function openTab(id) {
        document.querySelectorAll('.GM4med-tab-content').forEach(panel => {
            const match = panel.id === id;
            panel.classList.toggle('GM4med-tab-content--active', match);
        });

        document.querySelectorAll('.GM4med-tab').forEach(tab => {
            const match = tab.getAttribute('aria-controls') === id;
            tab.classList.toggle('GM4med-tab--active', match);
            tab.setAttribute('aria-selected', match ? 'true' : 'false');
            tab.setAttribute('tabindex', match ? '0' : '-1');
        });
    }

    // ==========================================================================
    // Comandos de Ação (Novo, Editar, Gravar, Excluir, Navegação, Sair)
    // ==========================================================================
    function startNew() {
        state.mode = 'new';
        state.selectedId = null;
        clearForm();

        const newId = generateNextId();
        if ($('categoriaId')) $('categoriaId').value = newId;
        if ($('dataCadastro')) $('dataCadastro').value = todayDate();
        if ($('dataAlteracao')) $('dataAlteracao').value = todayDate();
        if ($('usuarioCadastro')) $('usuarioCadastro').value = 'ADMIN';
        if ($('statusCategoria')) $('statusCategoria').value = 'Ativo';

        if ($('recordIdBadge')) $('recordIdBadge').textContent = newId;
        if ($('formState')) $('formState').textContent = 'Nova categoria em preenchimento.';

        setEditable(true);
        updateToolbar();
        openTab('dados-categoria');

        setTimeout(() => {
            if ($('nomeCategoria')) $('nomeCategoria').focus();
        }, 50);
    }

    function startEdit() {
        if (!selectedCategory()) return toast('Selecione uma categoria para editar.');
        state.mode = 'edit';
        setEditable(true);
        updateToolbar();
        openTab('dados-categoria');
        if ($('nomeCategoria')) $('nomeCategoria').focus();
    }

    function save() {
        if (!['new', 'edit'].includes(state.mode)) return toast('Clique em Novo ou Editar antes de gravar.');

        const formData = collectFormData();
        if (!validateForm(formData)) {
            return toast('Por favor, corrija os erros apontados no formulário.');
        }

        const index = state.categorias.findIndex(c => c.id === state.selectedId);
        if (index < 0) {
            state.categorias.unshift(formData);
            state.selectedId = formData.id;
            toast('✓ Categoria cadastrada com sucesso!');
        } else {
            state.categorias[index] = { ...state.categorias[index], ...formData };
            toast('✓ Categoria atualizada com sucesso!');
        }

        saveCategorias();
        state.mode = 'view';
        fillForm(selectedCategory());
        setEditable(false);
        renderGrid();
    }

    // ==========================================================================
    // Modais Acessíveis (Exclusão & Busca Avançada)
    // ==========================================================================
    function openModal(modalId) {
        const modal = $(modalId);
        if (!modal) return;
        state.previousFocus = document.activeElement;
        state.activeModal = modalId;
        modal.classList.remove('hidden');

        if (modalId === 'modalExcluir') {
            const cat = selectedCategory();
            if ($('modalExcluirDetails')) {
                $('modalExcluirDetails').innerHTML = `
                    <strong>Código:</strong> ${esc(cat?.id)}<br>
                    <strong>Categoria:</strong> ${esc(cat?.nome)} (${esc(cat?.sigla)})<br>
                    <strong>Status:</strong> ${esc(cat?.status)}`;
            }
            $('btnCancelarExclusao')?.focus();
        } else if (modalId === 'modalBuscar') {
            renderModalSearchResults();
            $('inputBuscaModal')?.focus();
        }
    }

    function closeModal(modalId) {
        const modal = $(modalId);
        if (modal) modal.classList.add('hidden');
        state.activeModal = null;
        if (state.previousFocus && typeof state.previousFocus.focus === 'function') {
            state.previousFocus.focus();
        }
    }

    function confirmDelete() {
        const cat = selectedCategory();
        if (!cat) return;

        state.categorias = state.categorias.filter(c => c.id !== cat.id);
        state.selectedId = null;
        state.mode = 'view';
        saveCategorias();
        clearForm();
        setEditable(false);
        closeModal('modalExcluir');
        renderGrid();
        toast('Categoria excluída com sucesso.');
    }

    function renderModalSearchResults() {
        const body = $('listaResultadosBuscaModal');
        if (!body) return;

        const q = normalize($('inputBuscaModal')?.value.trim() || '');
        const filtered = q ? state.categorias.filter(c => [
            c.id, c.nome, c.sigla, c.status, c.descricao
        ].some(v => normalize(v).includes(q))) : state.categorias;

        body.innerHTML = filtered.length ? filtered.map(c => `
            <tr>
                <td><strong>${esc(c.id)}</strong></td>
                <td>${esc(c.nome)}</td>
                <td>${esc(c.sigla)}</td>
                <td><span class="GM4med-status-badge ${c.status === 'Ativo' ? 'GM4med-status-badge--ativo' : 'GM4med-status-badge--inativo'}">${esc(c.status)}</span></td>
                <td>
                    <button type="button" class="GM4med-btn GM4med-btn--primary GM4med-btn--sm btn-select-search" data-id="${esc(c.id)}">Selecionar</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="5" class="text-center p-4">Nenhuma categoria encontrada.</td></tr>';

        body.querySelectorAll('.btn-select-search').forEach(btn => {
            btn.onclick = () => {
                selectCategory(btn.dataset.id);
                closeModal('modalBuscar');
            };
        });
    }

    function navigate(direction) {
        const list = state.filtered.length ? state.filtered : state.categorias;
        const index = list.findIndex(c => c.id === state.selectedId);
        if (index >= 0 && list[index + direction]) {
            selectCategory(list[index + direction].id);
        }
    }

    // ==========================================================================
    // Event Listeners e Atalhos
    // ==========================================================================
    if ($('btnNovo')) $('btnNovo').onclick = startNew;
    if ($('btnSalvar')) $('btnSalvar').onclick = save;
    if ($('btnEditar')) $('btnEditar').onclick = startEdit;
    if ($('btnExcluir')) $('btnExcluir').onclick = () => openModal('modalExcluir');
    if ($('btnBuscar')) $('btnBuscar').onclick = () => openModal('modalBuscar');
    if ($('btnAnterior')) $('btnAnterior').onclick = () => navigate(-1);
    if ($('btnProximo')) $('btnProximo').onclick = () => navigate(1);
    if ($('btnSair')) $('btnSair').onclick = () => { window.location.href = '../Menu-Principal.html'; };

    // Modais
    if ($('btnCancelarExclusao')) $('btnCancelarExclusao').onclick = () => closeModal('modalExcluir');
    if ($('btnConfirmarExclusao')) $('btnConfirmarExclusao').onclick = confirmDelete;
    if ($('btnFecharModalBuscar')) $('btnFecharModalBuscar').onclick = () => closeModal('modalBuscar');
    if ($('inputBuscaModal')) $('inputBuscaModal').oninput = renderModalSearchResults;

    // Busca do Grid Principal
    if ($('inputBusca')) $('inputBusca').oninput = () => {
        state.currentPage = 1;
        renderGrid();
    };

    // Contador de Descrição
    if ($('descricaoCategoria')) {
        $('descricaoCategoria').oninput = event => {
            if ($('descCounter')) $('descCounter').textContent = `${event.target.value.length} / 50`;
        };
    }

    // Caixa Alta Automática nos inputs de Nome e Sigla
    ['nomeCategoria', 'siglaCategoria'].forEach(id => {
        if ($(id)) {
            $(id).addEventListener('input', event => {
                const start = event.target.selectionStart;
                const end = event.target.selectionEnd;
                event.target.value = event.target.value.toUpperCase();
                event.target.setSelectionRange(start, end);
            });
        }
    });

    // Ordenação do Grid ao clicar nas colunas
    document.querySelectorAll('.GM4med-table th.sortable').forEach(th => {
        th.onclick = () => {
            const field = th.dataset.sort;
            if (state.sortField === field) {
                state.sortAsc = !state.sortAsc;
            } else {
                state.sortField = field;
                state.sortAsc = true;
            }
            renderGrid();
        };
    });

    // Paginação
    if ($('btnPagPrev')) $('btnPagPrev').onclick = () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderGrid();
        }
    };

    if ($('btnPagNext')) $('btnPagNext').onclick = () => {
        const totalPages = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderGrid();
        }
    };

    // Navegação em abas por teclado
    if ($('tabCategoria')) $('tabCategoria').onclick = () => openTab('dados-categoria');
    if ($('tabAuditoria')) $('tabAuditoria').onclick = () => openTab('metadados');

    // Tabela Seleção por Clique / Enter / Space
    const tbody = $('corpoTabelaCategorias');
    if (tbody) {
        tbody.onclick = event => {
            const row = event.target.closest('tr[data-id]');
            if (row) selectCategory(row.dataset.id);
        };
        tbody.onkeydown = event => {
            const row = event.target.closest('tr[data-id]');
            if (row && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                selectCategory(row.dataset.id);
            }
        };
    }

    // Atalho de Teclado Global (Escape para Modais e Setas para Abas)
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && state.activeModal) {
            closeModal(state.activeModal);
            return;
        }

        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('GM4med-tab')) {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                const targetId = activeEl.id === 'tabCategoria' ? 'metadados' : 'dados-categoria';
                openTab(targetId);
                const targetTab = $(activeEl.id === 'tabCategoria' ? 'tabAuditoria' : 'tabCategoria');
                if (targetTab) targetTab.focus();
            }
        }
    });

    // Submissão do Formulário via Enter
    if ($('categoriaForm')) {
        $('categoriaForm').onsubmit = event => {
            event.preventDefault();
            save();
        };
    }

    // Carga Inicial
    state.categorias = loadCategorias();
    state.filtered = [...state.categorias];
    setEditable(false);
    renderGrid();

    // Selecionar o primeiro registro se existir
    if (state.categorias.length > 0) {
        selectCategory(state.categorias[0].id);
    }
});