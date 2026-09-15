'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Constantes e Configurações
    // ==========================================================================
    const STORAGE_KEY = 'GM4med_atendimentos_recepcao';
    const CLINIC_KEYS = ['GM4med_clinica', 'GM4med_dados_clinica', 'dados_clinica', 'clinica'];
    const DEFAULT_LOGO = 'logo.png11.png';

    const $ = id => document.getElementById(id);

    // Estado Global da Aplicação
    const state = {
        records: [],
        selectedId: null,
        mode: 'view', // 'view', 'new', 'edit'
        filtered: [],
        activeModal: null,
        previousFocus: null
    };

    // Campos do formulário gerenciados pela máquina de estado
    const editables = [
        'cpf', 'nomePaciente', 'dataNasc', 'celular', 'convenio', 'carteirinha',
        'validadeConvenio', 'dataAtendimento', 'horaChegada', 'tipoAtendimento',
        'procedimento', 'medico', 'prioridade', 'obsAtendimento', 'pacientePresente',
        'docsConferidos', 'convenioValido', 'autorizacaoRealizada', 'lgpdAceita'
    ];

    // Mapeamento automático de médico para especialidade
    const specialties = {
        'Dr. Ricardo Silva': 'Cardiologia',
        'Dra. Ana Beatriz': 'Clínica geral',
        'Dr. Marcos Pereira': 'Ortopedia',
        'Dra. Camila Rocha': 'Pediatria',
        'Dr. Fernando Costa': 'Dermatologia'
    };

    // ==========================================================================
    // Funções Utilitárias e Auxiliares
    // ==========================================================================
    const fixEncoding = value => {
        if (typeof value !== 'string') return value;
        try {
            return decodeURIComponent(escape(value));
        } catch {
            return value;
        }
    };

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

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const timeNow = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const dateBR = value => {
        if (!value) return '-';
        if (value.includes('-')) {
            const parts = value.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return value;
    };

    const unmaskDigits = value => String(value ?? '').replace(/\D/g, '');

    // ==========================================================================
    // Validações de Formulário (CPF Matemático, Datas, Carteirinha)
    // ==========================================================================

    /**
     * Valida matemática do CPF (Algoritmo Modulo 11)
     */
    function isValidCPF(cpf) {
        const clean = unmaskDigits(cpf);
        if (clean.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(clean)) return false;

        let sum = 0;
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
        }
        let rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(clean.substring(9, 10), 10)) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        return rest === parseInt(clean.substring(10, 11), 10);
    }

    /**
     * Verifica se a validade da carteirinha está vencida
     */
    function isCarteirinhaExpired(validadeStr) {
        if (!validadeStr) return false;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        // Formato YYYY-MM
        if (validadeStr.includes('-')) {
            const [y, m] = validadeStr.split('-').map(Number);
            if (y < currentYear || (y === currentYear && m < currentMonth)) return true;
        } 
        // Formato MM/YY ou MM/YYYY
        else if (validadeStr.includes('/')) {
            const [mStr, yStr] = validadeStr.split('/');
            const m = Number(mStr);
            let y = Number(yStr);
            if (yStr.length === 2) y += 2000;
            if (y < currentYear || (y === currentYear && m < currentMonth)) return true;
        }
        return false;
    }

    function showFieldError(fieldId, errorId, message) {
        const field = $(fieldId);
        const errorEl = $(errorId);
        if (field) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
        }
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    }

    function clearFieldError(fieldId, errorId) {
        const field = $(fieldId);
        const errorEl = $(errorId);
        if (field) {
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
        }
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
        }
    }

    function clearAllErrors() {
        [
            ['cpf', 'errorCpf'],
            ['nomePaciente', 'errorNome'],
            ['dataNasc', 'errorDataNasc'],
            ['celular', 'errorCelular'],
            ['convenio', 'errorConvenio'],
            ['carteirinha', 'errorCarteirinha'],
            ['validadeConvenio', 'errorValidadeConvenio'],
            ['dataAtendimento', 'errorDataAtendimento'],
            ['horaChegada', 'errorHoraChegada'],
            ['tipoAtendimento', 'errorTipoAtendimento'],
            ['medico', 'errorMedico']
        ].forEach(([f, e]) => clearFieldError(f, e));
    }

    // ==========================================================================
    // Leitura e Escrita de Dados (LocalStorage & Backend Payload)
    // ==========================================================================
    const readClinic = () => {
        for (const key of CLINIC_KEYS) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                const clinic = parsed?.clinica || parsed?.clinic || parsed;
                if (clinic && typeof clinic === 'object') return clinic;
            } catch { }
        }
        return {};
    };

    const clinicValue = (clinic, ...keys) => {
        for (const key of keys) {
            if (clinic[key] !== undefined && clinic[key] !== null && String(clinic[key]).trim()) {
                return fixEncoding(String(clinic[key]).trim());
            }
        }
        return '';
    };

    const loadRecords = () => {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    };

    const saveRecords = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
        } catch {
            toast('Erro: Não foi possível salvar os registros no navegador.');
        }
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
    // Gerador de Identificadores e Senhas de Atendimento
    // ==========================================================================
    const newPatientId = () => `PAC-${today().replaceAll('-', '')}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    const newTicket = priority => {
        let prefix = 'G';
        if (priority === 'Emergencial') prefix = 'E';
        else if (['Idoso', 'Gestante', 'PCD'].includes(priority)) prefix = 'P';

        const nums = state.records
            .map(r => String(r.numeroSenha || ''))
            .filter(v => v.startsWith(`${prefix}-`))
            .map(v => Number(v.split('-')[1]))
            .filter(Number.isInteger);
        return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
    };

    const selected = () => state.records.find(record => record.id === state.selectedId);

    // ==========================================================================
    // Gerenciamento de Estado de Formulário e Habilitação de Campos
    // ==========================================================================
    function setEditable(on) {
        editables.forEach(id => {
            if ($(id)) $(id).disabled = !on;
        });

        // Campos com controle especial (somente leitura permanente ou calculados)
        if ($('pacienteId')) $('pacienteId').disabled = true;
        if ($('especialidade')) $('especialidade').disabled = true;
        if ($('numeroSenha')) $('numeroSenha').disabled = true;

        if ($('btnSalvar')) $('btnSalvar').disabled = !on;
        if ($('btnLimpar')) $('btnLimpar').disabled = !on;
    }

    function clearForm() {
        if ($('atendimentoForm')) $('atendimentoForm').reset();
        if ($('pacienteId')) $('pacienteId').value = '';
        if ($('numeroSenha')) $('numeroSenha').value = '';
        if ($('especialidade')) $('especialidade').value = '';
        if ($('recordId')) $('recordId').textContent = '--';
        if ($('obsCounter')) $('obsCounter').textContent = '0 / 500';

        const badge = $('badgeCarteirinhaStatus');
        if (badge) {
            badge.classList.add('hidden');
            badge.textContent = '';
        }
        clearAllErrors();
    }

    /**
     * Coleta os dados do formulário e prepara payload para Backend
     */
    function collect() {
        const rawCpf = $('cpf')?.value.trim() || '';
        const rawCelular = $('celular')?.value.trim() || '';
        const validade = $('validadeConvenio')?.value.trim() || '';

        return {
            id: $('pacienteId')?.value.trim() || newPatientId(),
            pacienteId: $('pacienteId')?.value.trim() || newPatientId(),
            cpf: rawCpf,
            cpfClean: unmaskDigits(rawCpf), // Para API Backend
            nomePaciente: ($('nomePaciente')?.value.trim() || '').replace(/\s+/g, ' ').toUpperCase(),
            dataNasc: $('dataNasc')?.value || '',
            celular: rawCelular,
            celularClean: unmaskDigits(rawCelular), // Para API Backend
            convenio: $('convenio')?.value || '',
            carteirinha: $('carteirinha')?.value.trim() || '',
            validadeConvenio: validade,
            carteirinhaVencida: isCarteirinhaExpired(validade),
            dataAtendimento: $('dataAtendimento')?.value || today(),
            horaChegada: $('horaChegada')?.value || timeNow(),
            tipoAtendimento: $('tipoAtendimento')?.value || '',
            procedimento: $('procedimento')?.value.trim() || '',
            medico: $('medico')?.value || '',
            especialidade: $('especialidade')?.value || '',
            numeroSenha: $('numeroSenha')?.value.trim() || '',
            prioridade: $('prioridade')?.value || 'Normal',
            checklist: {
                pacientePresente: $('pacientePresente')?.checked || false,
                docsConferidos: $('docsConferidos')?.checked || false,
                convenioValido: $('convenioValido')?.checked || false,
                autorizacaoRealizada: $('autorizacaoRealizada')?.checked || false,
                lgpdAceita: $('lgpdAceita')?.checked || false
            },
            obsAtendimento: $('obsAtendimento')?.value.trim() || '',
            status: 'Aguardando',
            criadoEm: new Date().toISOString()
        };
    }

    function fill(record) {
        clearAllErrors();

        const values = {
            pacienteId: record.id,
            cpf: record.cpf,
            nomePaciente: record.nomePaciente,
            dataNasc: record.dataNasc,
            celular: record.celular,
            convenio: record.convenio,
            carteirinha: record.carteirinha,
            validadeConvenio: record.validadeConvenio,
            dataAtendimento: record.dataAtendimento,
            horaChegada: record.horaChegada,
            tipoAtendimento: record.tipoAtendimento,
            procedimento: record.procedimento,
            medico: record.medico,
            especialidade: record.especialidade || specialties[record.medico] || '',
            numeroSenha: record.numeroSenha,
            prioridade: record.prioridade,
            obsAtendimento: record.obsAtendimento
        };

        Object.entries(values).forEach(([id, value]) => {
            if ($(id)) $(id).value = value || '';
        });

        // Atualizar checklist
        const checks = record.checklist || {};
        ['pacientePresente', 'docsConferidos', 'convenioValido', 'autorizacaoRealizada', 'lgpdAceita'].forEach(id => {
            if ($(id)) $(id).checked = Boolean(checks[id]);
        });

        // Atualizar contador de observações
        if ($('obsCounter')) {
            $('obsCounter').textContent = `${(record.obsAtendimento || '').length} / 500`;
        }

        // Atualizar badge de validade da carteirinha
        checkCarteirinhaStatus();

        if ($('recordId')) $('recordId').textContent = String(record.id || '--').replace('PAC-', '').slice(-7);
        if ($('formState')) $('formState').textContent = `${record.nomePaciente} · ${record.status || 'Aguardando'}`;
    }

    function checkCarteirinhaStatus() {
        const validadeVal = $('validadeConvenio')?.value || '';
        const badge = $('badgeCarteirinhaStatus');
        if (!badge) return;

        if (!validadeVal) {
            badge.classList.add('hidden');
            return;
        }

        if (isCarteirinhaExpired(validadeVal)) {
            badge.textContent = 'VENCIDA';
            badge.className = 'card-status-badge expired';
        } else {
            badge.textContent = 'VÁLIDA';
            badge.className = 'card-status-badge valid';
        }
    }

    // ==========================================================================
    // Filtro e Busca de Registros
    // ==========================================================================
    function filteredRecords() {
        const q = normalize($('inputBusca')?.value.trim() || '');
        if (!q) return [...state.records];
        return state.records.filter(r => [
            r.nomePaciente, r.cpf, r.id, r.numeroSenha, r.medico, r.tipoAtendimento, r.convenio, r.status
        ].some(value => normalize(value).includes(q)));
    }

    const priorityClass = value => ({
        Normal: 'normal', Idoso: 'preferred', Gestante: 'preferred', PCD: 'preferred', Emergencial: 'emergency'
    })[value] || 'normal';

    const statusClass = value => ({
        Aguardando: 'waiting', 'Em atendimento': 'service', Finalizado: 'done', Cancelado: 'cancelled'
    })[value] || 'waiting';

    // ==========================================================================
    // Máquina de Estado da Barra de Ações (Toolbar State Machine)
    // ==========================================================================
    function updateToolbar() {
        const hasSelected = Boolean(state.selectedId);
        const isEditing = ['new', 'edit'].includes(state.mode);
        const list = state.filtered.length ? state.filtered : state.records;
        const index = list.findIndex(r => r.id === state.selectedId);

        if ($('btnNovo')) $('btnNovo').disabled = isEditing;
        if ($('btnEditar')) $('btnEditar').disabled = !hasSelected || isEditing;
        if ($('btnExcluir')) $('btnExcluir').disabled = !hasSelected || isEditing;
        if ($('btnImprimir')) $('btnImprimir').disabled = !hasSelected && !isEditing;
        if ($('btnAnterior')) $('btnAnterior').disabled = !hasSelected || isEditing || index <= 0;
        if ($('btnProximo')) $('btnProximo').disabled = !hasSelected || isEditing || index < 0 || index >= list.length - 1;
        if ($('btnBuscar')) $('btnBuscar').disabled = false;
        if ($('btnSair')) $('btnSair').disabled = false;
    }

    // ==========================================================================
    // Renderização da Tabela de Atendimentos
    // ==========================================================================
    function render() {
        state.filtered = filteredRecords();
        const body = $('corpoTabelaAtendimentos');
        if (body) {
            body.innerHTML = state.filtered.length ? state.filtered.map(record => `
                <tr data-id="${esc(record.id)}" tabindex="0" aria-label="Atendimento de ${esc(record.nomePaciente)}" class="${record.id === state.selectedId ? 'selected' : ''}">
                    <td><span class="badge ${priorityClass(record.prioridade)}">${esc(record.numeroSenha || '-')}</span></td>
                    <td>${esc(record.horaChegada || '-')}</td>
                    <td>
                        <strong>${esc(record.nomePaciente || '-')}</strong>
                        <small>CPF: ${esc(record.cpf || 'Não informado')} | ${esc(record.convenio || 'Particular')}</small>
                    </td>
                    <td>${esc(record.tipoAtendimento || '-')}</td>
                    <td>${esc(record.medico || '-')}</td>
                    <td><span class="badge ${statusClass(record.status)}">${esc(record.status || 'Aguardando')}</span></td>
                </tr>`).join('') : `
                <tr class="empty">
                    <td colspan="6">
                        <p>Nenhum atendimento encontrado para a pesquisa.</p>
                    </td>
                </tr>`;
        }

        // Estatísticas
        if ($('waitingCount')) $('waitingCount').textContent = state.records.filter(r => r.status === 'Aguardando').length;
        if ($('serviceCount')) $('serviceCount').textContent = state.records.filter(r => r.status === 'Em atendimento').length;
        if ($('priorityCount')) $('priorityCount').textContent = state.records.filter(r => ['Idoso', 'Gestante', 'PCD', 'Emergencial'].includes(r.prioridade)).length;
        
        updateToolbar();
    }

    function selectRecord(id) {
        const record = state.records.find(item => item.id === id);
        if (!record) return;
        state.selectedId = id;
        state.mode = 'view';
        fill(record);
        setEditable(false);
        render();
    }

    // ==========================================================================
    // Controle de Abas (WAI-ARIA Tablist)
    // ==========================================================================
    function openTab(id) {
        document.querySelectorAll('.tab-content').forEach(panel => {
            const match = panel.id === id;
            panel.classList.toggle('active', match);
        });

        document.querySelectorAll('.tab').forEach(tab => {
            const match = tab.getAttribute('aria-controls') === id;
            tab.classList.toggle('active', match);
            tab.setAttribute('aria-selected', match ? 'true' : 'false');
            tab.setAttribute('tabindex', match ? '0' : '-1');
        });
    }

    // ==========================================================================
    // Comandos da Barra de Ferramentas (Novo, Editar, Gravar, Excluir, Sair)
    // ==========================================================================
    function startNew() {
        state.mode = 'new';
        state.selectedId = null;
        clearForm();

        const pid = newPatientId();
        if ($('pacienteId')) $('pacienteId').value = pid;
        if ($('dataAtendimento')) $('dataAtendimento').value = today();
        if ($('horaChegada')) $('horaChegada').value = timeNow();
        if ($('prioridade')) $('prioridade').value = 'Normal';
        if ($('numeroSenha')) $('numeroSenha').value = newTicket('Normal');
        if ($('formState')) $('formState').textContent = 'Novo atendimento em preenchimento.';
        if ($('recordId')) $('recordId').textContent = pid.replace('PAC-', '').slice(-7);

        setEditable(true);
        updateToolbar();
        openTab('dados-paciente');

        setTimeout(() => {
            if ($('cpf')) $('cpf').focus();
        }, 50);
    }

    function startEdit() {
        if (!selected()) return toast('Selecione um atendimento para editar.');
        state.mode = 'edit';
        setEditable(true);
        updateToolbar();
        openTab('dados-paciente');
        if ($('nomePaciente')) $('nomePaciente').focus();
    }

    function validateFormBeforeSave(record) {
        clearAllErrors();
        let valid = true;

        // 1. Validar Nome Completo
        if (!record.nomePaciente || record.nomePaciente.length < 3) {
            showFieldError('nomePaciente', 'errorNome', 'Informe o nome completo do paciente (mínimo 3 letras).');
            if (valid) { openTab('dados-paciente'); $('nomePaciente')?.focus(); }
            valid = false;
        }

        // 2. Validar CPF Matemático
        if (!record.cpf) {
            showFieldError('cpf', 'errorCpf', 'O CPF é obrigatório.');
            if (valid) { openTab('dados-paciente'); $('cpf')?.focus(); }
            valid = false;
        } else if (!isValidCPF(record.cpf)) {
            showFieldError('cpf', 'errorCpf', 'CPF inválido. Verifique os números informados.');
            if (valid) { openTab('dados-paciente'); $('cpf')?.focus(); }
            valid = false;
        }

        // 3. Validar Data de Nascimento
        if (!record.dataNasc) {
            showFieldError('dataNasc', 'errorDataNasc', 'Informe a data de nascimento.');
            if (valid) { openTab('dados-paciente'); $('dataNasc')?.focus(); }
            valid = false;
        } else if (record.dataNasc > today()) {
            showFieldError('dataNasc', 'errorDataNasc', 'A data de nascimento não pode ser no futuro.');
            if (valid) { openTab('dados-paciente'); $('dataNasc')?.focus(); }
            valid = false;
        }

        // 4. Validar Convênio
        if (!record.convenio) {
            showFieldError('convenio', 'errorConvenio', 'Selecione o convênio.');
            if (valid) { openTab('dados-paciente'); $('convenio')?.focus(); }
            valid = false;
        }

        // 5. Validar Validade do Convênio
        if (record.convenio !== 'Particular' && record.validadeConvenio && isCarteirinhaExpired(record.validadeConvenio)) {
            showFieldError('validadeConvenio', 'errorValidadeConvenio', 'Carteirinha do convênio está vencida.');
            if (valid) { openTab('dados-paciente'); $('validadeConvenio')?.focus(); }
            valid = false;
        }

        // 6. Validar Data do Atendimento
        if (!record.dataAtendimento) {
            showFieldError('dataAtendimento', 'errorDataAtendimento', 'Informe a data do atendimento.');
            if (valid) { openTab('dados-atendimento'); $('dataAtendimento')?.focus(); }
            valid = false;
        }

        // 7. Validar Horário de Chegada
        if (!record.horaChegada) {
            showFieldError('horaChegada', 'errorHoraChegada', 'Informe o horário de chegada.');
            if (valid) { openTab('dados-atendimento'); $('horaChegada')?.focus(); }
            valid = false;
        }

        // 8. Validar Tipo de Atendimento
        if (!record.tipoAtendimento) {
            showFieldError('tipoAtendimento', 'errorTipoAtendimento', 'Selecione o tipo de atendimento.');
            if (valid) { openTab('dados-atendimento'); $('tipoAtendimento')?.focus(); }
            valid = false;
        }

        // 9. Validar Médico Responsável
        if (!record.medico) {
            showFieldError('medico', 'errorMedico', 'Selecione o médico responsável.');
            if (valid) { openTab('dados-atendimento'); $('medico')?.focus(); }
            valid = false;
        }

        return valid;
    }

    function save() {
        if (!['new', 'edit'].includes(state.mode)) {
            return toast('Clique em Novo ou Editar antes de gravar.');
        }

        const record = collect();
        if (!validateFormBeforeSave(record)) {
            return toast('Por favor, corrija os erros indicados no formulário.');
        }

        const index = state.records.findIndex(item => item.id === state.selectedId);
        if (index < 0) {
            state.records.unshift(record);
            state.selectedId = record.id;
            toast('✓ Atendimento cadastrado com sucesso!');
        } else {
            state.records[index] = { ...state.records[index], ...record, atualizadoEm: new Date().toISOString() };
            toast('✓ Atendimento atualizado com sucesso!');
        }

        saveRecords();
        state.mode = 'view';
        fill(selected());
        setEditable(false);
        render();
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
            const rec = selected();
            if ($('modalExcluirDetails')) {
                $('modalExcluirDetails').innerHTML = `
                    <strong>Paciente:</strong> ${esc(rec?.nomePaciente)}<br>
                    <strong>Senha:</strong> ${esc(rec?.numeroSenha)} | <strong>Médico:</strong> ${esc(rec?.medico)}<br>
                    <strong>Data:</strong> ${dateBR(rec?.dataAtendimento)} às ${esc(rec?.horaChegada)}`;
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
        const record = selected();
        if (!record) return;

        state.records = state.records.filter(item => item.id !== record.id);
        state.selectedId = null;
        state.mode = 'view';
        saveRecords();
        clearForm();
        setEditable(false);
        closeModal('modalExcluir');
        render();
        toast('Atendimento excluído com sucesso.');
    }

    function renderModalSearchResults() {
        const body = $('listaResultadosBuscaModal');
        if (!body) return;
        const q = normalize($('inputBuscaModal')?.value.trim() || '');
        const filtered = q ? state.records.filter(r => [
            r.nomePaciente, r.cpf, r.id, r.numeroSenha, r.convenio, r.medico
        ].some(v => normalize(v).includes(q))) : state.records;

        body.innerHTML = filtered.length ? filtered.map(r => `
            <tr>
                <td><strong>${esc(r.id)}</strong></td>
                <td>${esc(r.nomePaciente)}</td>
                <td>${esc(r.cpf)}</td>
                <td>${esc(r.convenio)}</td>
                <td>${dateBR(r.dataAtendimento)} ${esc(r.horaChegada)}</td>
                <td>
                    <button type="button" class="btn primary btn-select-search" data-id="${esc(r.id)}">Selecionar</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="text-center p-4">Nenhum registro encontrado.</td></tr>';

        body.querySelectorAll('.btn-select-search').forEach(btn => {
            btn.onclick = () => {
                selectRecord(btn.dataset.id);
                closeModal('modalBuscar');
            };
        });
    }

    function navigate(direction) {
        const list = state.filtered.length ? state.filtered : state.records;
        const index = list.findIndex(record => record.id === state.selectedId);
        if (index >= 0 && list[index + direction]) {
            selectRecord(list[index + direction].id);
        }
    }

    // ==========================================================================
    // Impressão da Ficha do Atendimento
    // ==========================================================================
    function printItem(label, value) {
        return `<div class="p-item"><span class="p-label">${esc(label)}</span><span class="p-value">${esc(value || '-')}</span></div>`;
    }

    function printFicha() {
        const record = selected() || (state.mode === 'new' ? collect() : null);
        if (!record || !record.nomePaciente) {
            return toast('Selecione ou preencha um atendimento antes de imprimir.');
        }

        const clinic = readClinic();
        const logo = clinicValue(clinic, 'logo', 'logoUrl', 'logoBase64', 'logoDataUrl', 'logoSrc') || DEFAULT_LOGO;
        const name = clinicValue(clinic, 'nome', 'nomeClinica', 'name');
        const fullAddress = [clinicValue(clinic, 'endereco', 'address'), clinicValue(clinic, 'numero', 'number'), clinicValue(clinic, 'complemento', 'complement'), clinicValue(clinic, 'bairro', 'neighborhood')].filter(Boolean).join(', ');
        const cityUF = [clinicValue(clinic, 'cidade', 'city'), clinicValue(clinic, 'estado', 'uf', 'state')].filter(Boolean).join('/');
        const cep = clinicValue(clinic, 'cep', 'zipCode', 'zipcode');
        const phone = clinicValue(clinic, 'telefone', 'phone');
        const email = clinicValue(clinic, 'email');
        const checks = record.checklist || {};

        const printDoc = $('print-document');
        if (!printDoc) return;

        printDoc.innerHTML = `
            <header class="p-header">
                <img class="p-logo" src="${esc(logo)}" alt="Logo oficial GM4Med">
                <div class="p-clinic">
                    <div class="p-brand">GM4med</div>
                    <div class="p-system">Intelligent Health System</div>
                    ${name ? `<div class="p-name">${esc(name)}</div>` : ''}
                    ${fullAddress ? `<div class="p-line">${esc(fullAddress)}</div>` : ''}
                    ${cityUF || cep ? `<div class="p-line">${esc(cityUF)}${cep ? ' &middot; CEP: ' + esc(cep) : ''}</div>` : ''}
                    ${phone ? `<div class="p-line">Tel.: ${esc(phone)}</div>` : ''}
                    ${email ? `<div class="p-line">E-mail: ${esc(email)}</div>` : ''}
                </div>
            </header>

            <main class="p-content">
                <header class="p-title">
                    <div>
                        <div class="p-kicker">Documento institucional</div>
                        <h1>Ficha de atendimento médico</h1>
                    </div>
                    <div class="p-ticket">${esc(record.numeroSenha || '-')}</div>
                </header>

                <section class="p-section">
                    <h2>Dados do paciente</h2>
                    <div class="p-grid">
                        ${printItem('Código ID', record.id)}
                        ${printItem('CPF', record.cpf)}
                        ${printItem('Paciente', record.nomePaciente)}
                        ${printItem('Data de nascimento', dateBR(record.dataNasc))}
                        ${printItem('Celular', record.celular)}
                        ${printItem('Convênio', record.convenio)}
                        ${printItem('Carteirinha', record.carteirinha)}
                        ${printItem('Validade da carteirinha', record.validadeConvenio)}
                    </div>
                </section>

                <section class="p-section">
                    <h2>Dados do atendimento</h2>
                    <div class="p-grid">
                        ${printItem('Data do atendimento', dateBR(record.dataAtendimento))}
                        ${printItem('Horário de chegada', record.horaChegada)}
                        ${printItem('Tipo de atendimento', record.tipoAtendimento)}
                        ${printItem('Exame / Procedimento', record.procedimento)}
                        ${printItem('Médico responsável', record.medico)}
                        ${printItem('Especialidade', record.especialidade)}
                        ${printItem('Prioridade', record.prioridade)}
                        ${printItem('Status', record.status)}
                    </div>
                </section>

                <section class="p-section">
                    <h2>Checklist de recepção e autorização</h2>
                    <ul class="p-checks">
                        <li>Paciente presente: <strong>${checks.pacientePresente ? 'SIM' : 'NÃO'}</strong></li>
                        <li>Documentos conferidos: <strong>${checks.docsConferidos ? 'SIM' : 'NÃO'}</strong></li>
                        <li>Convênio válido: <strong>${checks.convenioValido ? 'SIM' : 'NÃO'}</strong></li>
                        <li>Autorização realizada: <strong>${checks.autorizacaoRealizada ? 'SIM' : 'NÃO'}</strong></li>
                        <li>Termo LGPD aceito: <strong>${checks.lgpdAceita ? 'SIM' : 'NÃO'}</strong></li>
                    </ul>
                </section>

                <section class="p-section">
                    <h2>Observações</h2>
                    <div class="p-notes">${esc(record.obsAtendimento || 'Nenhuma observação registrada.')}</div>
                </section>

                <section class="p-signatures">
                    <div class="p-signature">Assinatura da recepção</div>
                    <div class="p-signature">Assinatura do paciente / responsável</div>
                </section>
            </main>

            <footer class="p-footer">
                GM4med Intelligent Health System &middot; Documento impresso em ${new Date().toLocaleString('pt-BR')}
            </footer>`;

        const image = printDoc.querySelector('img');
        let printed = false;
        const start = () => {
            if (printed) return;
            printed = true;
            requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
        };

        if (image) {
            image.addEventListener('load', start, { once: true });
            image.addEventListener('error', start, { once: true });
            if (image.complete) start();
            setTimeout(start, 600);
        } else {
            start();
        }
    }

    // ==========================================================================
    // Máscaras de Entrada de Dados (CPF, Celular)
    // ==========================================================================
    function maskInput(id, formatter) {
        const el = $(id);
        if (el) {
            el.addEventListener('input', event => {
                event.target.value = formatter(event.target.value);
            });
        }
    }

    maskInput('cpf', value => {
        value = value.replace(/\D/g, '').slice(0, 11);
        return value
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    });

    maskInput('celular', value => {
        value = value.replace(/\D/g, '').slice(0, 11);
        return value.length < 11
            ? value.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
            : value.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    });

    // ==========================================================================
    // Event Listeners e Atalhos de Teclado
    // ==========================================================================
    if ($('btnNovo')) $('btnNovo').onclick = startNew;
    if ($('btnSalvar')) $('btnSalvar').onclick = save;
    if ($('btnEditar')) $('btnEditar').onclick = startEdit;
    if ($('btnExcluir')) $('btnExcluir').onclick = () => openModal('modalExcluir');
    if ($('btnBuscar')) $('btnBuscar').onclick = () => openModal('modalBuscar');
    if ($('btnImprimir')) $('btnImprimir').onclick = printFicha;
    if ($('btnAnterior')) $('btnAnterior').onclick = () => navigate(-1);
    if ($('btnProximo')) $('btnProximo').onclick = () => navigate(1);
    if ($('btnLimpar')) $('btnLimpar').onclick = () => { clearForm(); toast('Campos limpos.'); };
    if ($('btnSair')) $('btnSair').onclick = () => { window.location.href = '../Menu-Principal.html'; };

    // Modais
    if ($('btnCancelarExclusao')) $('btnCancelarExclusao').onclick = () => closeModal('modalExcluir');
    if ($('btnConfirmarExclusao')) $('btnConfirmarExclusao').onclick = confirmDelete;
    if ($('btnFecharModalBuscar')) $('btnFecharModalBuscar').onclick = () => closeModal('modalBuscar');
    if ($('inputBuscaModal')) $('inputBuscaModal').oninput = renderModalSearchResults;

    // Busca na fila principal
    if ($('inputBusca')) $('inputBusca').oninput = render;

    // Alteração de médico atualiza especialidade
    if ($('medico')) {
        $('medico').onchange = () => {
            const med = $('medico').value;
            if ($('especialidade')) $('especialidade').value = specialties[med] || '';
        };
    }

    // Alteração de prioridade gera nova senha se for novo cadastro
    if ($('prioridade')) {
        $('prioridade').onchange = () => {
            if (state.mode === 'new' && $('numeroSenha')) {
                $('numeroSenha').value = newTicket($('prioridade').value);
            }
        };
    }

    // Alteração da validade da carteirinha checa status
    if ($('validadeConvenio')) {
        $('validadeConvenio').onchange = checkCarteirinhaStatus;
        $('validadeConvenio').oninput = checkCarteirinhaStatus;
    }

    // Contador de observações
    if ($('obsAtendimento')) {
        $('obsAtendimento').oninput = event => {
            if ($('obsCounter')) {
                $('obsCounter').textContent = `${event.target.value.length} / 500`;
            }
        };
    }

    // Submissão do formulário via Enter
    if ($('atendimentoForm')) {
        $('atendimentoForm').onsubmit = event => {
            event.preventDefault();
            save();
        };
    }

    // Tabela de atendimentos (Seleção por clique e Enter/Space)
    const tbody = $('corpoTabelaAtendimentos');
    if (tbody) {
        tbody.onclick = event => {
            const row = event.target.closest('tr[data-id]');
            if (row) selectRecord(row.dataset.id);
        };
        tbody.onkeydown = event => {
            const row = event.target.closest('tr[data-id]');
            if (row && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                selectRecord(row.dataset.id);
            }
        };
    }

    // Navegação entre abas
    if ($('tabPaciente')) $('tabPaciente').onclick = () => openTab('dados-paciente');
    if ($('tabAtendimento')) $('tabAtendimento').onclick = () => openTab('dados-atendimento');
    if ($('btnAvancar')) {
        $('btnAvancar').onclick = () => {
            const activeTab = document.querySelector('.tab.active');
            const currentId = activeTab?.getAttribute('aria-controls');
            openTab(currentId === 'dados-paciente' ? 'dados-atendimento' : 'dados-paciente');
        };
    }

    // Atalhos de Teclado Globais (Teclas Escape e Setas nas Abas)
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && state.activeModal) {
            closeModal(state.activeModal);
            return;
        }

        // Navegação por setas entre abas quando o foco estiver numa aba
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('tab')) {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                const targetId = activeEl.id === 'tabPaciente' ? 'dados-atendimento' : 'dados-paciente';
                openTab(targetId);
                const targetTab = $(activeEl.id === 'tabPaciente' ? 'tabAtendimento' : 'tabPaciente');
                if (targetTab) targetTab.focus();
            }
        }
    });

    // Initial load
    state.records = loadRecords();
    state.filtered = [...state.records];

    if ($('todayLabel')) {
        $('todayLabel').textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date());
    }

    setEditable(false);
    render();
});