'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'GM4med_atendimentos_recepcao';
    const CLINIC_KEYS = ['GM4med_clinica', 'GM4med_clinica', 'GM4med_dados_clinica', 'dados_clinica', 'clinica'];
    const DEFAULT_LOGO = 'logo.png11.png';

    const $ = id => document.getElementById(id);
    const state = { records: [], selectedId: null, mode: 'view', filtered: [] };

    const editables = [
        'cpf', 'nomePaciente', 'dataNasc', 'celular', 'convenio', 'carteirinha',
        'validadeConvenio', 'dataAtendimento', 'horaChegada', 'tipoAtendimento',
        'procedimento', 'medico', 'prioridade', 'obsAtendimento', 'pacientePresente',
        'docsConferidos', 'convenioValido', 'autorizacaoRealizada', 'lgpdAceita'
    ];

    const specialties = {
        'Dr. Ricardo Silva': 'Cardiologia',
        'Dra. Ana Beatriz': 'Clínica geral',
        'Dr. Marcos Pereira': 'Ortopedia'
    };

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

    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const timeNow = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const dateBR = value => value && value.includes('-') ? value.split('-').reverse().join('/') : value || '-';

    const clinicValue = (clinic, ...keys) => {
        for (const key of keys) {
            if (clinic[key] !== undefined && clinic[key] !== null && String(clinic[key]).trim()) {
                return fixEncoding(String(clinic[key]).trim());
            }
        }
        return '';
    };

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

    const toast = message => {
        const t = $('toast');
        if (!t) return;
        t.textContent = message;
        t.classList.remove('hidden');
        clearTimeout(t.timer);
        t.timer = setTimeout(() => t.classList.add('hidden'), 2600);
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
            toast('Não foi possível salvar no navegador.');
        }
    };

    const newPatientId = () => `PAC-${today().replaceAll('-', '')}-${String(Date.now()).slice(-5)}`;

    const newTicket = priority => {
        const prefix = priority === 'Normal' ? 'G' : 'P';
        const nums = state.records
            .map(r => String(r.numeroSenha || ''))
            .filter(v => v.startsWith(`${prefix}-`))
            .map(v => Number(v.split('-')[1]))
            .filter(Number.isInteger);
        return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
    };

    const selected = () => state.records.find(record => record.id === state.selectedId);

    function setEditable(on) {
        editables.forEach(id => { if ($(id)) $(id).disabled = !on; });
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
    }

    function collect() {
        return {
            id: $('pacienteId')?.value.trim() || newPatientId(),
            cpf: $('cpf')?.value.trim() || '',
            nomePaciente: $('nomePaciente')?.value.trim().toUpperCase() || '',
            dataNasc: $('dataNasc')?.value || '',
            celular: $('celular')?.value.trim() || '',
            convenio: $('convenio')?.value || '',
            carteirinha: $('carteirinha')?.value.trim() || '',
            validadeConvenio: $('validadeConvenio')?.value.trim() || '',
            dataAtendimento: $('dataAtendimento')?.value || '',
            horaChegada: $('horaChegada')?.value || '',
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
        const values = {
            pacienteId: record.id, cpf: record.cpf, nomePaciente: record.nomePaciente,
            dataNasc: record.dataNasc, celular: record.celular, convenio: record.convenio,
            carteirinha: record.carteirinha, validadeConvenio: record.validadeConvenio,
            dataAtendimento: record.dataAtendimento, horaChegada: record.horaChegada,
            tipoAtendimento: record.tipoAtendimento, procedimento: record.procedimento,
            medico: record.medico, especialidade: record.especialidade,
            numeroSenha: record.numeroSenha, prioridade: record.prioridade,
            obsAtendimento: record.obsAtendimento
        };

        Object.entries(values).forEach(([id, value]) => { if ($(id)) $(id).value = value || ''; });

        const checks = record.checklist || {};
        ['pacientePresente', 'docsConferidos', 'convenioValido', 'autorizacaoRealizada', 'lgpdAceita'].forEach(id => {
            if ($(id)) $(id).checked = Boolean(checks[id]);
        });

        if ($('recordId')) $('recordId').textContent = String(record.id || '--').replace('PAC-', '').slice(-5);
        if ($('formState')) $('formState').textContent = `${record.nomePaciente} · ${record.status || 'Aguardando'}`;
    }

    function filteredRecords() {
        const q = normalize($('inputBusca')?.value.trim() || '');
        return q ? state.records.filter(r => [r.nomePaciente, r.cpf, r.numeroSenha, r.medico, r.tipoAtendimento, r.status].some(value => normalize(value).includes(q))) : [...state.records];
    }

    const priorityClass = value => ({ Normal: 'normal', Idoso: 'preferred', Gestante: 'preferred', PCD: 'preferred', Emergencial: 'emergency' })[value] || 'normal';
    const statusClass = value => ({ Aguardando: 'waiting', 'Em atendimento': 'service', Finalizado: 'done', Cancelado: 'cancelled' })[value] || 'waiting';

    function updateToolbar() {
        const has = Boolean(state.selectedId), editing = ['new', 'edit'].includes(state.mode), list = state.filtered.length ? state.filtered : state.records, index = list.findIndex(r => r.id === state.selectedId);
        if ($('btnEditar')) $('btnEditar').disabled = !has || editing;
        if ($('btnExcluir')) $('btnExcluir').disabled = !has || editing;
        if ($('btnImprimir')) $('btnImprimir').disabled = !has && !editing;
        if ($('btnAnterior')) $('btnAnterior').disabled = !has || editing || index <= 0;
        if ($('btnProximo')) $('btnProximo').disabled = !has || editing || index < 0 || index >= list.length - 1;
    }

    function render() {
        state.filtered = filteredRecords();
        const body = $('corpoTabelaAtendimentos');
        if (body) {
            body.innerHTML = state.filtered.length ? state.filtered.map(record => `
                <tr data-id="${esc(record.id)}" tabindex="0" class="hover:bg-slate-50 cursor-pointer border-b border-slate-100 ${record.id === state.selectedId ? 'bg-blue-50' : ''}">
                    <td class="p-3"><span class="badge ticket ${priorityClass(record.prioridade)}">${esc(record.numeroSenha || '-')}</span></td>
                    <td class="p-3 text-slate-600">${esc(record.horaChegada || '-')}</td>
                    <td class="p-3"><strong>${esc(record.nomePaciente || '-')}</strong><br><small class="text-slate-400">${esc(record.cpf || '')}</small></td>
                    <td class="p-3 text-slate-600">${esc(record.tipoAtendimento || '-')}</td>
                    <td class="p-3 text-slate-600">${esc(record.medico || '-')}</td>
                    <td class="p-3"><span class="badge status ${statusClass(record.status)}">${esc(record.status || 'Aguardando')}</span></td>
                </tr>`).join('') : '<tr class="empty"><td colspan="6" class="p-4 text-center text-slate-400">Nenhum atendimento encontrado.</td></tr>';
        }
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

    function openTab(id) {
        document.querySelectorAll('.tab-content').forEach(panel => panel.classList.toggle('active', panel.id === id));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.getAttribute('aria-controls') === id));
    }

    function startNew() {
        state.mode = 'new';
        state.selectedId = null;
        clearForm();
        if ($('pacienteId')) $('pacienteId').value = newPatientId();
        if ($('dataAtendimento')) $('dataAtendimento').value = today();
        if ($('horaChegada')) $('horaChegada').value = timeNow();
        if ($('prioridade')) $('prioridade').value = 'Normal';
        if ($('numeroSenha')) $('numeroSenha').value = newTicket('Normal');
        if ($('formState')) $('formState').textContent = 'Novo atendimento em preenchimento.';
        setEditable(true);
        updateToolbar();
        openTab('dados-paciente');
        if ($('nomePaciente')) $('nomePaciente').focus();
    }

    function startEdit() {
        if (!selected()) return toast('Selecione um atendimento para editar.');
        state.mode = 'edit';
        setEditable(true);
        updateToolbar();
        if ($('nomePaciente')) $('nomePaciente').focus();
    }

    function save() {
        if (!['new', 'edit'].includes(state.mode)) return toast('Clique em Novo ou Editar antes de gravar.');
        const record = collect();
        for (const [id, message] of [['nomePaciente', 'Informe o nome do paciente.'], ['cpf', 'Informe o CPF do paciente.'], ['dataAtendimento', 'Informe a data do atendimento.'], ['horaChegada', 'Informe o horário de chegada.'], ['tipoAtendimento', 'Selecione o tipo de atendimento.'], ['medico', 'Selecione o médico responsável.'], ['numeroSenha', 'A senha não foi gerada.']]) {
            if (!record[id]) {
                toast(message);
                if ($(id)) $(id).focus();
                return;
            }
        }
        const index = state.records.findIndex(item => item.id === state.selectedId);
        if (index < 0) {
            state.records.push(record);
            state.selectedId = record.id;
            toast('Atendimento cadastrado com sucesso.');
        } else {
            state.records[index] = { ...state.records[index], ...record, atualizadoEm: new Date().toISOString() };
            toast('Atendimento atualizado com sucesso.');
        }
        saveRecords();
        state.mode = 'view';
        fill(selected());
        setEditable(false);
        render();
    }

    function remove() {
        const record = selected();
        if (!record) return toast('Selecione um atendimento para excluir.');
        if (!confirm(`Deseja realmente excluir o atendimento de ${record.nomePaciente}?`)) return;
        state.records = state.records.filter(item => item.id !== record.id);
        state.selectedId = null;
        state.mode = 'view';
        saveRecords();
        clearForm();
        setEditable(false);
        render();
        toast('Atendimento excluído.');
    }

    function navigate(direction) {
        const list = state.filtered.length ? state.filtered : state.records;
        const index = list.findIndex(record => record.id === state.selectedId);
        if (index >= 0 && list[index + direction]) selectRecord(list[index + direction].id);
    }

    function printItem(label, value) {
        return `<div class="p-item"><span class="p-label">${esc(label)}</span><span class="p-value">${esc(value || '-')}</span></div>`;
    }

    function printFicha() {
        const record = selected() || (state.mode === 'new' ? collect() : null);
        if (!record || !record.nomePaciente) return toast('Selecione ou preencha um atendimento antes de imprimir.');
        const clinic = readClinic();
        const logo = clinicValue(clinic, 'logo', 'logoUrl', 'logoBase64', 'logoDataUrl', 'logoSrc') || DEFAULT_LOGO;
        const name = clinicValue(clinic, 'nome', 'nomeClinica', 'name');
        const fullAddress = [clinicValue(clinic, 'endereco', 'address'), clinicValue(clinic, 'numero', 'number'), clinicValue(clinic, 'complemento', 'complement'), clinicValue(clinic, 'bairro', 'neighborhood')].filter(Boolean).join(', ');
        const cityUF = [clinicValue(clinic, 'cidade', 'city'), clinicValue(clinic, 'estado', 'uf', 'state')].filter(Boolean).join('/');
        const cep = clinicValue(clinic, 'cep', 'zipCode', 'zipcode');
        const phone = clinicValue(clinic, 'telefone', 'phone');
        const email = clinicValue(clinic, 'email');
        const footerInfo = [name, fullAddress, cityUF, cep ? `CEP: ${cep}` : '', phone ? `Tel.: ${phone}` : ''].filter(Boolean).join(' | ');
        const checks = record.checklist || {};

        const printDoc = $('print-document');
        if (!printDoc) return;

        printDoc.innerHTML = `
            <header class="p-header">
                <img class="p-logo" src="${esc(logo)}" alt="Logo oficial GM4med">
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
            <footer class="p-footer">
                <span>GM4med &middot; Intelligent Health System</span>
                <span>${esc(footerInfo)}</span>
                <span class="p-page"></span>
            </footer>
            <main class="p-content">
                <header class="p-title">
                    <div>
                        <div class="p-kicker">Documento institucional</div>
                        <h1>Ficha m&eacute;dica de atendimento</h1>
                    </div>
                    <div class="p-ticket">${esc(record.numeroSenha || '-')}</div>
                </header>
                <section class="p-section">
                    <h2>Dados do paciente</h2>
                    <div class="p-grid">
                        ${printItem('C&oacute;digo ID', record.id)}
                        ${printItem('CPF', record.cpf)}
                        ${printItem('Paciente', record.nomePaciente)}
                        ${printItem('Data de nascimento', dateBR(record.dataNasc))}
                        ${printItem('Celular', record.celular)}
                        ${printItem('Conv&ecirc;nio', record.convenio)}
                        ${printItem('Carteirinha', record.carteirinha)}
                        ${printItem('Validade', record.validadeConvenio)}
                    </div>
                </section>
                <section class="p-section">
                    <h2>Dados do atendimento</h2>
                    <div class="p-grid">
                        ${printItem('Data', dateBR(record.dataAtendimento))}
                        ${printItem('Hor&aacute;rio', record.horaChegada)}
                        ${printItem('Tipo', record.tipoAtendimento)}
                        ${printItem('Procedimento', record.procedimento)}
                        ${printItem('M&eacute;dico', record.medico)}
                        ${printItem('Especialidade', record.especialidade)}
                        ${printItem('Prioridade', record.prioridade)}
                        ${printItem('Status', record.status)}
                    </div>
                </section>
                <section class="p-section">
                    <h2>Checklist da recep&ccedil;&atilde;o</h2>
                    <ul class="p-checks">
                        <li>Paciente presente: <strong>${checks.pacientePresente ? 'Sim' : 'N&atilde;o'}</strong></li>
                        <li>Documentos conferidos: <strong>${checks.docsConferidos ? 'Sim' : 'N&atilde;o'}</strong></li>
                        <li>Conv&ecirc;nio v&aacute;lido: <strong>${checks.convenioValido ? 'Sim' : 'N&atilde;o'}</strong></li>
                        <li>Autoriza&ccedil;&atilde;o realizada: <strong>${checks.autorizacaoRealizada ? 'Sim' : 'N&atilde;o'}</strong></li>
                        <li>LGPD aceita: <strong>${checks.lgpdAceita ? 'Sim' : 'N&atilde;o'}</strong></li>
                    </ul>
                </section>
                <section class="p-section">
                    <h2>Observa&ccedil;&otilde;es</h2>
                    <div class="p-notes">${esc(record.obsAtendimento || 'Nenhuma observa&ccedil;&atilde;o registrada.')}</div>
                </section>
                <section class="p-signatures">
                    <div class="p-signature">Assinatura da recep&ccedil;&atilde;o</div>
                    <div class="p-signature">Assinatura do paciente</div>
                </section>
            </main>`;

        const image = printDoc.querySelector('img');
        let printed = false;
        const start = () => { if (printed) return; printed = true; requestAnimationFrame(() => requestAnimationFrame(() => window.print())); };
        if (image) {
            image.addEventListener('load', start, { once: true });
            image.addEventListener('error', start, { once: true });
            if (image.complete) start();
            setTimeout(start, 800);
        } else {
            start();
        }
    }

    function mask(id, formatter) {
        const el = $(id);
        if (el) el.addEventListener('input', event => event.target.value = formatter(event.target.value));
    }

    mask('cpf', value => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'));
    mask('celular', value => { value = value.replace(/\D/g, '').slice(0, 11); return value.length < 11 ? value.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2') : value.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'); });
    mask('validadeConvenio', value => { value = value.replace(/\D/g, '').slice(0, 4); return value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value; });

    if ($('btnNovo')) $('btnNovo').onclick = startNew;
    if ($('btnSalvar')) $('btnSalvar').onclick = save;
    if ($('btnEditar')) $('btnEditar').onclick = startEdit;
    if ($('btnExcluir')) $('btnExcluir').onclick = remove;
    if ($('btnImprimir')) $('btnImprimir').onclick = printFicha;
    if ($('btnAnterior')) $('btnAnterior').onclick = () => navigate(-1);
    if ($('btnProximo')) $('btnProximo').onclick = () => navigate(1);
    if ($('btnLimpar')) $('btnLimpar').onclick = () => { clearForm(); toast('Campos limpos.'); };
    if ($('btnBuscar')) $('btnBuscar').onclick = render;
    if ($('inputBusca')) $('inputBusca').oninput = render;
    if ($('medico')) $('medico').onchange = () => { if ($('especialidade')) $('especialidade').value = specialties[$('medico').value] || ''; };
    if ($('prioridade')) $('prioridade').onchange = () => { if (state.mode === 'new' && $('numeroSenha')) $('numeroSenha').value = newTicket($('prioridade').value); };
    if ($('atendimentoForm')) $('atendimentoForm').onsubmit = event => { event.preventDefault(); save(); };

    const tbody = $('corpoTabelaAtendimentos');
    if (tbody) {
        tbody.onclick = event => { const row = event.target.closest('tr[data-id]'); if (row) selectRecord(row.dataset.id); };
        tbody.onkeydown = event => { const row = event.target.closest('tr[data-id]'); if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectRecord(row.dataset.id); } };
    }

    if ($('tabPaciente')) $('tabPaciente').onclick = () => openTab('dados-paciente');
    if ($('tabAtendimento')) $('tabAtendimento').onclick = () => openTab('dados-atendimento');
    if ($('btnAvancar')) $('btnAvancar').onclick = () => openTab(document.querySelector('.tab.active')?.getAttribute('aria-controls') === 'dados-paciente' ? 'dados-atendimento' : 'dados-paciente');
    if ($('btnSair')) $('btnSair').onclick = () => { window.location.href = '../Menu-Principal.html'; };

    state.records = loadRecords();
    state.filtered = [...state.records];
    if ($('todayLabel')) $('todayLabel').textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date());
    setEditable(false);
    render();
});