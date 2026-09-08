/* =============================================
   SIGLAS — CORREÇÃO DEFINITIVA DA EDIÇÃO
   ============================================= */

(() => {
    'use strict';

    const STORAGE_KEY = 'GM4med.siglas.v1';

    const state = {
        data: [],
        editingId: null,
        deleteId: null
    };

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const mockData = [
        {
            id: 'S-001',
            sigla: 'SUS',
            obs: 'Sistema Único de Saúde',
            status: 'ativo',
            criadoEm: '2026-08-15T10:00:00'
        },
        {
            id: 'S-002',
            sigla: 'AMB',
            obs: 'Associação Médica Brasileira',
            status: 'ativo',
            criadoEm: '2026-08-14T14:30:00'
        },
        {
            id: 'S-003',
            sigla: 'TCE',
            obs: 'Termo de Consentimento Esclarecido',
            status: 'ativo',
            criadoEm: '2026-08-13T09:15:00'
        },
        {
            id: 'S-004',
            sigla: 'UTI',
            obs: 'Unidade de Terapia Intensiva',
            status: 'ativo',
            criadoEm: '2026-08-12T16:45:00'
        },
        {
            id: 'S-005',
            sigla: 'PS',
            obs: 'Pronto Socorro',
            status: 'inativo',
            criadoEm: '2026-08-10T11:20:00'
        },
        {
            id: 'S-006',
            sigla: 'CRM',
            obs: 'Conselho Regional de Medicina',
            status: 'ativo',
            criadoEm: '2026-08-08T08:00:00'
        }
    ];

    function getData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = JSON.parse(saved);

            return Array.isArray(parsed)
                ? parsed
                : structuredClone(mockData);
        } catch (error) {
            console.warn('Falha ao carregar siglas:', error);
            return structuredClone(mockData);
        }
    }

    function saveData() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state.data)
        );
    }

    function init() {
        state.data = getData();

        bindEvents();
        renderTable();
        updateKPIs();
        resetForm();
        updateFooter();
        initializeIcons();
    }

    function bindEvents() {
        const form = $('#siglaForm');
        const tbody = $('#corpoTabela');
        const cancelButton = $('#btnCancelar');
        const deleteCancel = $('#delCancel');
        const deleteConfirm = $('#delConfirm');
        const modal = $('#delModal');

        form?.addEventListener('submit', handleSubmit);
        tbody?.addEventListener('click', handleTableClick);
        cancelButton?.addEventListener('click', resetForm);
        deleteCancel?.addEventListener('click', closeDeleteModal);
        deleteConfirm?.addEventListener('click', confirmDelete);

        modal?.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeDeleteModal();
            }
        });

        $('#searchSigla')?.addEventListener(
            'input',
            renderTable
        );

        $('#filtroStatus')?.addEventListener(
            'change',
            renderTable
        );
    }

    /* =============================================
       CORREÇÃO DO BOTÃO EDITAR
       ============================================= */

    function handleTableClick(event) {
        const editButton = event.target.closest(
            'button[data-edit-id]'
        );

        const deleteButton = event.target.closest(
            'button[data-delete-id]'
        );

        if (editButton) {
            event.preventDefault();
            event.stopPropagation();

            const id = editButton.getAttribute(
                'data-edit-id'
            );

            if (!id) {
                console.error(
                    'O botão editar não possui data-edit-id.'
                );
                return;
            }

            editSigla(id);
            return;
        }

        if (deleteButton) {
            event.preventDefault();
            event.stopPropagation();

            const id = deleteButton.getAttribute(
                'data-delete-id'
            );

            if (id) {
                openDeleteModal(id);
            }
        }
    }

    function editSigla(id) {
        const record = state.data.find(
            (item) => String(item.id) === String(id)
        );

        if (!record) {
            console.error(
                `Registro não encontrado para edição: ${id}`
            );

            showToast(
                'Registro não encontrado para edição.',
                'error'
            );

            return;
        }

        const idInput = $('#idSigla');
        const siglaInput = $('#sigla');
        const obsInput = $('#obs');
        const statusInput = $('#status');

        if (!idInput || !siglaInput || !obsInput || !statusInput) {
            console.error(
                'Campos necessários para edição não encontrados.'
            );

            showToast(
                'Não foi possível abrir o formulário de edição.',
                'error'
            );

            return;
        }

        state.editingId = record.id;

        idInput.value = record.id;
        siglaInput.value = record.sigla || '';
        obsInput.value = record.obs || '';
        statusInput.value = record.status || 'ativo';

        setFormMode(true);
        updateStatusToggle(statusInput.value);
        updateObsCounter();
        clearValidationState();
        markActiveRow(record.id);

        const formCard = $('#formCard');

        formCard?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        window.setTimeout(() => {
            siglaInput.focus();
            siglaInput.select();
        }, 250);
    }

    function markActiveRow(id) {
        $$('#corpoTabela tr[data-id]').forEach((row) => {
            row.classList.toggle(
                'active',
                String(row.dataset.id) === String(id)
            );
        });
    }

    /* =============================================
       SALVAR E ATUALIZAR
       ============================================= */

    function handleSubmit(event) {
        event.preventDefault();
        saveSigla();
    }

    function saveSigla() {
        const siglaInput = $('#sigla');
        const obsInput = $('#obs');
        const statusInput = $('#status');

        if (!siglaInput || !obsInput || !statusInput) {
            return;
        }

        const sigla = siglaInput.value
            .trim()
            .toUpperCase();

        const obs = obsInput.value.trim();
        const status = statusInput.value;

        if (!validateSigla(sigla)) {
            return;
        }

        const editingId = state.editingId;

        if (editingId) {
            const index = state.data.findIndex(
                (item) => String(item.id) === String(editingId)
            );

            if (index === -1) {
                showToast(
                    'Registro não encontrado para atualização.',
                    'error'
                );

                return;
            }

            state.data[index] = {
                ...state.data[index],
                sigla,
                obs,
                status
            };

            saveData();
            resetForm();
            renderTable();
            updateKPIs();
            updateFooter();

            showToast(
                'Sigla atualizada com sucesso.',
                'success'
            );

            return;
        }

        state.data.push({
            id: generateId(),
            sigla,
            obs,
            status,
            criadoEm: new Date().toISOString()
        });

        saveData();
        resetForm();
        renderTable();
        updateKPIs();
        updateFooter();

        showToast(
            'Sigla criada com sucesso.',
            'success'
        );
    }

    function validateSigla(value) {
        const input = $('#sigla');

        if (!value) {
            showFieldError(input, 'Informe a sigla.');
            return false;
        }

        if (value.length < 2) {
            showFieldError(
                input,
                'A sigla deve ter pelo menos 2 caracteres.'
            );

            return false;
        }

        if (value.length > 20) {
            showFieldError(
                input,
                'A sigla deve ter no máximo 20 caracteres.'
            );

            return false;
        }

        const duplicate = state.data.some((item) => {
            return (
                item.id !== state.editingId &&
                normalize(item.sigla) === normalize(value)
            );
        });

        if (duplicate) {
            showFieldError(
                input,
                'Esta sigla já está cadastrada.'
            );

            return false;
        }

        clearFieldError(input);
        return true;
    }

    function resetForm() {
        state.editingId = null;

        $('#siglaForm')?.reset();

        const idInput = $('#idSigla');
        const statusInput = $('#status');

        if (idInput) {
            idInput.value = generateId();
        }

        if (statusInput) {
            statusInput.value = 'ativo';
        }

        setFormMode(false);
        updateStatusToggle('ativo');
        updateObsCounter();
        clearValidationState();
        markActiveRow(null);
    }

    function setFormMode(editing) {
        const title = $('#formTitle');
        const mode = $('#formMode');

        if (title) {
            title.textContent = editing
                ? 'Editar Sigla'
                : 'Nova Sigla';
        }

        if (mode) {
            mode.innerHTML = editing
                ? 'Modo: <b>Edição</b>'
                : 'Modo: <b>Inserção</b>';
        }
    }

    function generateId() {
        const numbers = state.data
            .map((item) => Number(
                String(item.id).replace('S-', '')
            ))
            .filter(Number.isFinite);

        return `S-${String(
            Math.max(0, ...numbers) + 1
        ).padStart(3, '0')}`;
    }

    /* =============================================
       TABELA
       ============================================= */

    function renderTable() {
        const tbody = $('#corpoTabela');

        if (!tbody) {
            console.error(
                'Elemento #corpoTabela não encontrado.'
            );

            return;
        }

        const term = normalize(
            $('#searchSigla')?.value
        );

        const status = $('#filtroStatus')?.value || '';

        const records = state.data.filter((item) => {
            const matchesTerm =
                !term ||
                [item.id, item.sigla, item.obs]
                    .some((value) => {
                        return normalize(value).includes(term);
                    });

            const matchesStatus =
                !status || item.status === status;

            return matchesTerm && matchesStatus;
        });

        tbody.innerHTML = '';

        if (!records.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        Nenhum registro encontrado.
                    </td>
                </tr>
            `;

            updateCounters(0);
            return;
        }

        const fragment = document.createDocumentFragment();

        records.forEach((item) => {
            const row = document.createElement('tr');

            row.dataset.id = item.id;

            row.innerHTML = `
                <td>${escapeHTML(item.id)}</td>
                <td>
                    <strong>${escapeHTML(item.sigla)}</strong>
                </td>
                <td>${escapeHTML(item.obs || '—')}</td>
                <td>
                    <span class="status-badge ${item.status}">
                        <span class="status-dot"></span>
                        ${item.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${formatDate(item.criadoEm)}</td>
                <td>
                    <button
                        type="button"
                        class="action-btn"
                        data-edit-id="${escapeHTML(item.id)}"
                        title="Editar sigla"
                        aria-label="Editar ${escapeHTML(item.sigla)}"
                    >
                        <i data-lucide="edit-2"></i>
                    </button>

                    <button
                        type="button"
                        class="action-btn"
                        data-delete-id="${escapeHTML(item.id)}"
                        title="Excluir sigla"
                        aria-label="Excluir ${escapeHTML(item.sigla)}"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;

            fragment.appendChild(row);
        });

        tbody.appendChild(fragment);
        markActiveRow(state.editingId);
        initializeIcons();
        updateCounters(records.length);
    }

    function updateCounters(count) {
        $('#showing') && ($('#showing').textContent = count);
        $('#totalRows') && ($('#totalRows').textContent = state.data.length);
    }

    /* =============================================
       EXCLUSÃO
       ============================================= */

    function openDeleteModal(id) {
        const item = state.data.find(
            (record) => String(record.id) === String(id)
        );

        if (!item) {
            return;
        }

        state.deleteId = item.id;

        const name = $('#delName');

        if (name) {
            name.textContent = item.sigla;
        }

        const modal = $('#delModal');

        if (modal) {
            modal.hidden = false;
        }

        $('#delConfirm')?.focus();
    }

    function closeDeleteModal() {
        const modal = $('#delModal');

        if (modal) {
            modal.hidden = true;
        }

        state.deleteId = null;
    }

    function confirmDelete() {
        if (!state.deleteId) {
            return;
        }

        state.data = state.data.filter(
            (item) => item.id !== state.deleteId
        );

        saveData();
        closeDeleteModal();
        resetForm();
        renderTable();
        updateKPIs();
        updateFooter();

        showToast(
            'Sigla excluída com sucesso.',
            'success'
        );
    }

    /* =============================================
       STATUS, VALIDAÇÃO E UTILITÁRIOS
       ============================================= */

    function updateStatusToggle(status) {
        const toggle = $('#statusToggle');
        const knob = $('#toggleKnob');
        const activeLabel = $('#labelAtivo');
        const inactiveLabel = $('#labelInativo');

        if (!toggle || !knob) {
            return;
        }

        const active = status === 'ativo';

        toggle.setAttribute(
            'aria-pressed',
            String(active)
        );

        toggle.style.background = active
            ? '#10b981'
            : '#ef4444';

        knob.style.left = active
            ? '27px'
            : '3px';

        if (activeLabel) {
            activeLabel.style.color = active
                ? '#10b981'
                : '#64748b';
        }

        if (inactiveLabel) {
            inactiveLabel.style.color = active
                ? '#64748b'
                : '#ef4444';
        }
    }

    function updateObsCounter() {
        const counter = $('#obsLen');
        const textarea = $('#obs');

        if (counter && textarea) {
            counter.textContent = textarea.value.length;
        }
    }

    function showFieldError(input, message) {
        if (!input) {
            return;
        }

        clearFieldError(input);

        input.closest('.input-wrap')
            ?.classList.add('error');

        const error = document.createElement('small');

        error.className = 'field-error';
        error.id = `error-${input.id}`;
        error.textContent = message;

        input.closest('.field')?.appendChild(error);
        input.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError(input) {
        if (!input) {
            return;
        }

        $(`#error-${input.id}`)?.remove();

        input.closest('.input-wrap')
            ?.classList.remove('error');

        input.removeAttribute('aria-invalid');
    }

    function clearValidationState() {
        $$('#siglaForm input, #siglaForm textarea')
            .forEach(clearFieldError);
    }

    function showToast(message, type = 'info') {
        const box = $('#toastBox');

        if (!box) {
            console.info(message);
            return;
        }

        const toast = document.createElement('div');

        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');

        box.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function updateKPIs() {
        const total = state.data.length;
        const active = state.data.filter(
            (item) => item.status === 'ativo'
        ).length;

        $('#kpiTotal') && ($('#kpiTotal').textContent = total);
        $('#kpiAtivas') && ($('#kpiAtivas').textContent = active);
        $('#kpiInativas') && ($('#kpiInativas').textContent = total - active);

        const latest = state.data.reduce(
            (max, item) => Math.max(max, Date.parse(item.criadoEm)),
            0
        );

        $('#kpiLast') && ($('#kpiLast').textContent = latest
            ? new Date(latest).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            })
            : '—');
    }

    function updateFooter() {
        const footer = $('#lastSync');

        if (footer) {
            footer.textContent = new Date().toLocaleTimeString(
                'pt-BR',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );
        }
    }

    function normalize(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function formatDate(value) {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? '—'
            : date.toLocaleDateString('pt-BR');
    }

    function escapeHTML(value) {
        const element = document.createElement('div');
        element.textContent = String(value ?? '');
        return element.innerHTML;
    }

    function initializeIcons() {
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    window.editSigla = editSigla;

    document.addEventListener(
        'DOMContentLoaded',
        init
    );
})();
