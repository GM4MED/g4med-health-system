'use strict';

document.addEventListener('DOMContentLoaded', () => {
    /*
     * =========================================================================
     * CONFIGURAÇÕES
     * =========================================================================
     */

    const CONFIG = {
        storageKey: 'GM4med.agenda.agendamentos.v2',
        chatStorageKey: 'GM4med.chat.mensagens',
        lembretesStorageKey: 'GM4med.lembretes',

        horarioInicial: 8 * 60,
        horarioFinal: 18 * 60,
        intervalo: 30,

        limiteToasts: 5,
        duracaoToast: 4000,

        whatsappBaseUrl: 'https://wa.me/',
        telefoneClinica: '(62) 99999-9999',
        nomeClinica: 'GM4med - Clínica Médica'
    };

    const STATUS_LABELS = {
        agendado: 'Agendado',
        confirmado: 'Confirmado',
        espera: 'Em Espera',
        atendido: 'Atendido',
        cancelado: 'Cancelado',
        'nao-compareceu': 'Não Compareceu'
    };

    const TIPO_LABELS = {
        presencial: 'Presencial',
        online: 'Online',
        retorno: 'Retorno',
        procedimento: 'Procedimento'
    };

    const STATUS_IGNORADOS = new Set([
        'cancelado',
        'nao-compareceu'
    ]);

    const MEDICOS = {
        '1': {
            id: '1',
            nome: 'Dr. Carlos Silva',
            especialidade: 'Cardiologia',
            especialidadeId: 'cardio'
        },
        '2': {
            id: '2',
            nome: 'Dra. Ana Paula',
            especialidade: 'Dermatologia',
            especialidadeId: 'derma'
        },
        '3': {
            id: '3',
            nome: 'Dr. Roberto Lima',
            especialidade: 'Ortopedia e Traumatologia',
            especialidadeId: 'orto'
        }
    };

    /*
     * =========================================================================
     * ELEMENTOS DA INTERFACE
     * =========================================================================
     */

    const elements = {
        btnPrev: document.querySelector('#btn-prev'),
        btnNext: document.querySelector('#btn-next'),
        btnToday: document.querySelector('#btn-today'),
        btnNovo: document.querySelector('#btn-novo-agendamento'),

        currentDateLabel: document.querySelector('#current-date-label'),
        currentWeekday: document.querySelector('#current-weekday'),

        filterMedico: document.querySelector('#filter-medico'),
        filterEspecialidade: document.querySelector('#filter-especialidade'),

        agendaHeader: document.querySelector('#agenda-header'),
        agendaBody: document.querySelector('#agenda-body'),

        modalAgendamento: document.querySelector('#modal-agendamento'),
        modalAcoes: document.querySelector('#modal-acoes'),
        modalWhatsApp: document.querySelector('#modal-whatsapp'),

        modalTitulo: document.querySelector('#modal-titulo'),
        form: document.querySelector('#form-agendamento'),

        btnModalClose: document.querySelector('#modal-close'),
        btnModalAcoesClose: document.querySelector('#modal-acoes-close'),
        btnCancelar: document.querySelector('#btn-cancelar'),
        btnGravar: document.querySelector('#btn-gravar'),

        detalhesAgendamento: document.querySelector('#agendamento-detalhes'),
        toastContainer: document.querySelector('#toast-container'),

        btnWhatsAppEnviar: document.querySelector('#btn-whatsapp-enviar'),
        btnWhatsAppCancelar: document.querySelector('#btn-whatsapp-cancelar'),
        btnWhatsAppClose: document.querySelector('#modal-whatsapp-close'),
        whatsappPreview: document.querySelector('#whatsapp-preview'),
        whatsappMensagem: document.querySelector('#whatsapp-mensagem'),
        whatsappLembrete: document.querySelector('#whatsapp-lembrete'),

        btnChat: document.querySelector('#btn-chat-interno'),
        janelaChat: document.querySelector('#janela-chat'),
        btnChatFechar: document.querySelector('#chat-fechar'),
        btnChatEnviar: document.querySelector('#chat-enviar'),
        chatInput: document.querySelector('#chat-input'),
        chatLista: document.querySelector('#chat-lista'),
        chatMensagens: document.querySelector('#chat-mensagens'),
        chatBadge: document.querySelector('#chat-badge')
    };

    const fields = {
        id: document.querySelector('#agendamento-id'),
        paciente: document.querySelector('#paciente-nome'),
        medico: document.querySelector('#agendamento-medico'),
        data: document.querySelector('#agendamento-data'),
        hora: document.querySelector('#agendamento-hora'),
        duracao: document.querySelector('#agendamento-duracao'),
        tipo: document.querySelector('#agendamento-tipo'),
        convenio: document.querySelector('#agendamento-convenio'),
        status: document.querySelector('#agendamento-status'),
        observacoes: document.querySelector('#agendamento-obs'),
        lembrete: document.querySelector('#agendamento-lembrete')
    };

    /*
     * =========================================================================
     * ESTADO DA APLICAÇÃO
     * =========================================================================
     */

    const state = {
        dataAtual: inicioDoDia(new Date()),
        agendamentoSelecionadoId: null,
        ultimoElementoFocado: null,
        agendamentos: [],
        whatsappAgendamento: null,

        chat: {
            canalAtual: 'geral',
            mensagens: {
                geral: [],
                recepcao: [],
                medicos: []
            }
        }
    };

    /*
     * =========================================================================
     * GERENCIADOR DE TOAST
     * =========================================================================
     */

    const ToastManager = {
        ativos: new Map(),

        criarChave(mensagem, tipo) {
            return `${tipo}:${mensagem.trim()}`;
        },

        obter(chave) {
            return this.ativos.get(chave);
        },

        adicionar(chave, toast, timer) {
            this.ativos.set(chave, {
                elemento: toast,
                timer
            });
        },

        remover(chave) {
            const toastData = this.ativos.get(chave);

            if (toastData?.timer) {
                clearTimeout(toastData.timer);
            }

            this.ativos.delete(chave);
        },

        removerMaisAntigo() {
            const primeiraChave = this.ativos.keys().next().value;

            if (!primeiraChave) {
                return;
            }

            const toastData = this.ativos.get(primeiraChave);

            if (toastData) {
                fecharToast(toastData.elemento, primeiraChave);
            }
        }
    };

    /*
     * =========================================================================
     * INICIALIZAÇÃO
     * =========================================================================
     */

    inicializar();

    function inicializar() {
        state.agendamentos = carregarAgendamentos();
        carregarMensagensChat();

        aplicarAcessibilidadeBasica();
        configurarEventos();
        renderizarAgenda();
        renderizarCanalChat();
    }

    /*
     * =========================================================================
     * EVENTOS
     * =========================================================================
     */

    function configurarEventos() {
        console.log('🔧 Configurando eventos...');

        // Navegação de data
        elements.btnPrev?.addEventListener('click', () => alterarData(-1));
        elements.btnNext?.addEventListener('click', () => alterarData(1));
        elements.btnToday?.addEventListener('click', irParaHoje);

        // Filtros
        elements.filterMedico?.addEventListener('change', renderizarAgenda);
        elements.filterEspecialidade?.addEventListener('change', renderizarAgenda);

        // Botão Novo Agendamento
        elements.btnNovo?.addEventListener('click', () => {
            console.log('🖱️ Botão Novo Agendamento clicado!');
            abrirModalNovo();
        });

        // Modais
        elements.btnModalClose?.addEventListener('click', fecharModalAgendamento);
        elements.btnModalAcoesClose?.addEventListener('click', fecharModalAcoes);
        elements.btnCancelar?.addEventListener('click', fecharModalAgendamento);

        // Formulário
        elements.form?.addEventListener('submit', event => {
            event.preventDefault();
            salvarAgendamento();
        });

        // WhatsApp
        elements.btnWhatsAppEnviar?.addEventListener('click', enviarWhatsAppPaciente);
        elements.btnWhatsAppCancelar?.addEventListener('click', fecharModalWhatsApp);
        elements.btnWhatsAppClose?.addEventListener('click', fecharModalWhatsApp);

        // Chat
        elements.btnChat?.addEventListener('click', alternarChat);
        elements.btnChatFechar?.addEventListener('click', fecharChat);
        elements.btnChatEnviar?.addEventListener('click', enviarMensagemChat);

        elements.chatInput?.addEventListener('keydown', event => {
            if (event.key !== 'Enter') {
                return;
            }
            event.preventDefault();
            enviarMensagemChat();
        });

        elements.chatLista?.addEventListener('click', event => {
            const item = event.target.closest('.chat-interno__item');
            if (!item) {
                return;
            }
            selecionarCanalChat(item.dataset.chat);
        });

        // Eventos de exclusão do chat
        configurarEventosChat();

        // Overlay dos modais
        document.querySelectorAll('.modal__overlay').forEach(overlay => {
            overlay.addEventListener('click', event => {
                const modal = event.currentTarget.closest('.modal');
                if (!modal) {
                    return;
                }
                fecharModalPorElemento(modal);
            });
        });

        // Teclado e clicks globais
        document.addEventListener('keydown', tratarTecladoGlobal);
        document.addEventListener('click', tratarCliqueEmAcao);

        console.log('✅ Todos os eventos configurados!');
    }

    function tratarCliqueEmAcao(event) {
        const botao = event.target.closest('.modal__acao');

        if (!botao) {
            return;
        }

        executarAcao(botao.dataset.acao);
    }

    /*
     * =========================================================================
     * AGENDA
     * =========================================================================
     */

    function alterarData(dias) {
        const novaData = new Date(state.dataAtual);
        novaData.setDate(novaData.getDate() + dias);
        state.dataAtual = inicioDoDia(novaData);
        renderizarAgenda();
    }

    function irParaHoje() {
        state.dataAtual = inicioDoDia(new Date());
        renderizarAgenda();
        exibirToast('Agenda posicionada em hoje.', 'info');
    }

    function renderizarAgenda() {
        atualizarCabecalhoData();
        renderizarCabecalhoMedicos();
        renderizarCorpoAgenda();
    }

    function atualizarCabecalhoData() {
        if (!elements.currentDateLabel || !elements.currentWeekday) {
            return;
        }

        const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(state.dataAtual);

        const diaSemana = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long'
        }).format(state.dataAtual);

        elements.currentDateLabel.textContent = capitalizar(dataFormatada);
        elements.currentWeekday.textContent = capitalizar(diaSemana);
    }

    function renderizarCabecalhoMedicos() {
        if (!elements.agendaHeader) {
            return;
        }

        const medicosVisiveis = obterMedicosFiltrados();

        elements.agendaHeader.innerHTML = `
            <div class="agenda__col-time">
                Horário
            </div>
            ${medicosVisiveis.map(medico => `
                <div
                    class="agenda__col-prof"
                    data-medico="${escapeHTML(medico.id)}"
                >
                    <span class="agenda__prof-nome">
                        ${escapeHTML(medico.nome)}
                    </span>
                    <span class="agenda__prof-esp">
                        ${escapeHTML(medico.especialidade)}
                    </span>
                </div>
            `).join('')}
        `;

        elements.agendaHeader.style.setProperty(
            '--quantidade-medicos',
            String(Math.max(medicosVisiveis.length, 1))
        );
    }

    function renderizarCorpoAgenda() {
        if (!elements.agendaBody) {
            return;
        }

        const medicosVisiveis = obterMedicosFiltrados();
        const agendamentosDoDia = obterAgendamentosDoDia();

        if (!medicosVisiveis.length) {
            elements.agendaBody.innerHTML = `
                <div class="agenda__empty">
                    Nenhum médico corresponde aos filtros selecionados.
                </div>
            `;
            return;
        }

        const linhas = [];

        for (
            let minutos = CONFIG.horarioInicial;
            minutos <= CONFIG.horarioFinal;
            minutos += CONFIG.intervalo
        ) {
            const horario = minutosParaHora(minutos);

            const colunas = medicosVisiveis.map(medico => {
                const agendamento = encontrarAgendamentoNoHorario(
                    agendamentosDoDia,
                    medico.id,
                    minutos
                );

                return `
                    <div
                        class="agenda__slot"
                        data-medico="${escapeHTML(medico.id)}"
                        data-minutos="${minutos}"
                    >
                        ${agendamento
                        ? criarCardAgendamento(agendamento)
                        : ''
                    }
                    </div>
                `;
            }).join('');

            linhas.push(`
                <div
                    class="agenda__calendar-row"
                    data-horario="${escapeHTML(horario)}"
                >
                    <div class="agenda__time-cell">
                        <span>${escapeHTML(horario)}</span>
                    </div>
                    ${colunas}
                </div>
            `);
        }

        elements.agendaBody.innerHTML = linhas.join('');
        configurarInteracaoDosCards();
    }

    function configurarInteracaoDosCards() {
        elements.agendaBody
            ?.querySelectorAll('[data-agendamento-id]')
            .forEach(card => {
                card.addEventListener('click', () => {
                    abrirModalAcoes(card.dataset.agendamentoId);
                });

                card.addEventListener('keydown', event => {
                    if (!['Enter', ' '].includes(event.key)) {
                        return;
                    }
                    event.preventDefault();
                    abrirModalAcoes(card.dataset.agendamentoId);
                });
            });
    }

    function criarCardAgendamento(agendamento) {
        const status = STATUS_LABELS[agendamento.status]
            ? agendamento.status
            : 'agendado';

        const statusLabel = STATUS_LABELS[status];
        const tipoLabel = TIPO_LABELS[agendamento.tipo] || 'Atendimento';
        const duracao = Number(agendamento.duracao) || 30;
        const linhasOcupadas = Math.max(1, Math.ceil(duracao / CONFIG.intervalo));
        const altura = linhasOcupadas * 100;

        const iconeOnline = agendamento.tipo === 'online'
            ? `
                <i
                    class="fa-solid fa-video agenda__appointment-icon"
                    title="Teleconsulta"
                    aria-label="Teleconsulta"
                ></i>
            `
            : '';

        return `
            <article
                class="agenda__appointment agenda__appointment--${escapeHTML(status)}"
                data-agendamento-id="${escapeHTML(agendamento.id)}"
                tabindex="0"
                role="button"
                aria-label="Agendamento de ${escapeHTML(agendamento.paciente)} às ${escapeHTML(agendamento.hora)}"
                style="--appointment-height: ${altura}%"
            >
                <div class="agenda__appointment-time">
                    ${escapeHTML(agendamento.hora)}
                </div>
                <div class="agenda__appointment-content">
                    <strong>
                        ${escapeHTML(agendamento.paciente)}
                    </strong>
                    <span>
                        ${escapeHTML(tipoLabel)}
                    </span>
                    <small>
                        ${escapeHTML(statusLabel)}
                    </small>
                </div>
                ${iconeOnline}
            </article>
        `;
    }

    function obterMedicosFiltrados() {
        const medicoSelecionado = elements.filterMedico?.value || '';
        const especialidadeSelecionada = elements.filterEspecialidade?.value || '';

        return Object.values(MEDICOS).filter(medico => {
            const correspondeAoMedico =
                !medicoSelecionado ||
                medico.id === medicoSelecionado;

            const correspondeAEspecialidade =
                !especialidadeSelecionada ||
                medico.especialidadeId === especialidadeSelecionada;

            return (
                correspondeAoMedico &&
                correspondeAEspecialidade
            );
        });
    }

    function obterAgendamentosDoDia() {
        const data = formatarDataISO(state.dataAtual);
        const medicoSelecionado = elements.filterMedico?.value || '';
        const especialidadeSelecionada = elements.filterEspecialidade?.value || '';

        return state.agendamentos
            .filter(agendamento => {
                const medico = MEDICOS[agendamento.medicoId];

                if (!medico) {
                    return false;
                }

                return (
                    agendamento.data === data &&
                    (!medicoSelecionado || agendamento.medicoId === medicoSelecionado) &&
                    (!especialidadeSelecionada || medico.especialidadeId === especialidadeSelecionada)
                );
            })
            .sort((a, b) => {
                return horaParaMinutos(a.hora) - horaParaMinutos(b.hora);
            });
    }

    function encontrarAgendamentoNoHorario(lista, medicoId, minutos) {
        return lista.find(agendamento => {
            const inicio = horaParaMinutos(agendamento.hora);
            return (
                agendamento.medicoId === medicoId &&
                inicio === minutos
            );
        });
    }

    /*
     * =========================================================================
     * FORMULÁRIO DE AGENDAMENTO
     * =========================================================================
     */

    function abrirModalNovo() {
        if (!elements.modalAgendamento) {
            console.error('Modal de agendamento não encontrado no DOM');
            exibirToast('Erro: Modal não encontrado.', 'error');
            return;
        }

        limparFormulario();

        fields.data.value = formatarDataISO(state.dataAtual);
        fields.status.value = 'agendado';
        fields.duracao.value = '30';
        fields.tipo.value = 'presencial';
        fields.convenio.value = 'particular';
        fields.lembrete.checked = true;

        if (elements.modalTitulo) {
            elements.modalTitulo.innerHTML = `
                <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>
                <span>Novo Agendamento</span>
            `;
        }

        abrirModal(elements.modalAgendamento, '#paciente-nome');
        console.log('Modal de novo agendamento aberto com sucesso');
    }

    function abrirModalEdicao(agendamento) {
        if (!agendamento) {
            return;
        }

        fields.id.value = agendamento.id;
        fields.paciente.value = agendamento.paciente;
        fields.medico.value = agendamento.medicoId;
        fields.data.value = agendamento.data;
        fields.hora.value = agendamento.hora;
        fields.duracao.value = agendamento.duracao;
        fields.tipo.value = agendamento.tipo;
        fields.convenio.value = agendamento.convenio || 'particular';
        fields.status.value = agendamento.status;
        fields.observacoes.value = agendamento.observacoes || '';
        fields.lembrete.checked = Boolean(agendamento.lembrete);

        if (elements.modalTitulo) {
            elements.modalTitulo.innerHTML = `
                <i class="fa-solid fa-pen" aria-hidden="true"></i>
                <span>Editar Agendamento</span>
            `;
        }

        abrirModal(elements.modalAgendamento, '#paciente-nome');
    }

    function salvarAgendamento() {
        const dados = obterDadosFormulario();

        if (!validarAgendamento(dados)) {
            return;
        }

        const indiceExistente = state.agendamentos.findIndex(
            agendamento => agendamento.id === dados.id
        );

        if (indiceExistente >= 0) {
            state.agendamentos[indiceExistente] = {
                ...state.agendamentos[indiceExistente],
                ...dados,
                atualizadoEm: new Date().toISOString()
            };

            persistirAgendamentos();
            fecharModalAgendamento();
            renderizarAgenda();

            exibirToast('Agendamento atualizado com sucesso.', 'success');
            return;
        }

        const novoAgendamento = {
            ...dados,
            id: gerarId(),
            criadoEm: new Date().toISOString()
        };

        state.agendamentos.push(novoAgendamento);
        persistirAgendamentos();

        state.dataAtual = dataStringParaDate(novoAgendamento.data);

        fecharModalAgendamento();
        renderizarAgenda();

        exibirToast('Agendamento criado com sucesso.', 'success');

        oferecerWhatsApp(novoAgendamento);
    }

    function oferecerWhatsApp(agendamento) {
        window.setTimeout(() => {
            const desejaEnviar = window.confirm(
                'Deseja enviar uma confirmação ao paciente via WhatsApp?'
            );

            if (desejaEnviar) {
                abrirModalWhatsApp(agendamento);
            }
        }, 500);
    }

    function obterDadosFormulario() {
        return {
            id: fields.id?.value.trim() || '',
            paciente: fields.paciente?.value.trim() || '',
            medicoId: fields.medico?.value || '',
            data: fields.data?.value || '',
            hora: fields.hora?.value || '',
            duracao: Number(fields.duracao?.value) || 30,
            tipo: fields.tipo?.value || '',
            convenio: fields.convenio?.value || 'particular',
            status: fields.status?.value || 'agendado',
            observacoes: fields.observacoes?.value.trim() || '',
            lembrete: Boolean(fields.lembrete?.checked)
        };
    }

    function validarAgendamento(dados) {
        limparErrosFormulario();

        const obrigatorios = [
            [fields.paciente, 'Informe o nome do paciente.'],
            [fields.medico, 'Selecione um médico.'],
            [fields.data, 'Informe a data do agendamento.'],
            [fields.hora, 'Informe o horário.'],
            [fields.tipo, 'Selecione o tipo de atendimento.']
        ];

        let valido = true;

        obrigatorios.forEach(([campo, mensagem]) => {
            if (!campo?.value.trim()) {
                marcarErro(campo, mensagem);
                valido = false;
            }
        });

        if (!valido) {
            exibirToast('Preencha os campos obrigatórios.', 'warning');
            return false;
        }

        const inicio = horaParaMinutos(dados.hora);
        const duracaoNova = Number(dados.duracao) || 30;
        const fim = inicio + duracaoNova;

        if (
            Number.isNaN(inicio) ||
            inicio < CONFIG.horarioInicial ||
            inicio >= CONFIG.horarioFinal ||
            duracaoNova <= 0 ||
            fim > CONFIG.horarioFinal
        ) {
            marcarErro(fields.hora, 'Horário fora do expediente (08:00 - 18:00).');
            exibirToast('Horário deve estar entre 08:00 e 18:00.', 'warning');
            return false;
        }

        const temConflito = state.agendamentos.some(agendamento => {
            if (dados.id && agendamento.id === dados.id) {
                return false;
            }

            if (
                agendamento.medicoId !== dados.medicoId ||
                agendamento.data !== dados.data
            ) {
                return false;
            }

            if (STATUS_IGNORADOS.has(agendamento.status)) {
                return false;
            }

            const agendamentoInicio = horaParaMinutos(agendamento.hora);
            const agendamentoDuracao = Number(agendamento.duracao) || 30;
            const agendamentoFim = agendamentoInicio + agendamentoDuracao;

            if (
                Number.isNaN(agendamentoInicio) ||
                agendamentoInicio < 0
            ) {
                return false;
            }

            return (inicio < agendamentoFim && agendamentoInicio < fim);
        });

        if (temConflito) {
            marcarErro(fields.hora, 'Horário já possui agendamento para este médico.');
            exibirToast('Horário já possui agendamento para este médico.', 'error');
            return false;
        }

        return true;
    }

    /*
     * =========================================================================
     * DETALHES E AÇÕES DO AGENDAMENTO
     * =========================================================================
     */

    function abrirModalAcoes(id) {
        const agendamento = obterAgendamentoPorId(id);

        if (!agendamento) {
            return;
        }

        state.agendamentoSelecionadoId = id;
        renderizarDetalhesAgendamento(agendamento);

        abrirModal(elements.modalAcoes, '#modal-acoes-close');
    }

    function renderizarDetalhesAgendamento(agendamento) {
        if (!elements.detalhesAgendamento) {
            return;
        }

        const medico = MEDICOS[agendamento.medicoId];
        const statusLabel = STATUS_LABELS[agendamento.status] || 'Agendado';
        const tipoLabel = TIPO_LABELS[agendamento.tipo] || 'Atendimento';

        elements.detalhesAgendamento.innerHTML = `
            <div class="modal__detail-main">
                <strong>
                    ${escapeHTML(agendamento.paciente)}
                </strong>
                <span>
                    ${escapeHTML(statusLabel)}
                </span>
            </div>
            <dl class="modal__detail-list">
                <div>
                    <dt>Médico</dt>
                    <dd>
                        ${escapeHTML(medico?.nome || 'Não informado')}
                    </dd>
                </div>
                <div>
                    <dt>Especialidade</dt>
                    <dd>
                        ${escapeHTML(medico?.especialidade || 'Não informada')}
                    </dd>
                </div>
                <div>
                    <dt>Data e horário</dt>
                    <dd>
                        ${escapeHTML(formatarDataCurta(agendamento.data))}
                        às
                        ${escapeHTML(agendamento.hora)}
                    </dd>
                </div>
                <div>
                    <dt>Atendimento</dt>
                    <dd>
                        ${escapeHTML(tipoLabel)}
                    </dd>
                </div>
                <div>
                    <dt>Convênio</dt>
                    <dd>
                        ${escapeHTML(agendamento.convenio || 'Particular')}
                    </dd>
                </div>
            </dl>
            ${agendamento.observacoes
                ? `
                    <p class="modal__detail-observacao">
                        <strong>Observações:</strong>
                        ${escapeHTML(agendamento.observacoes)}
                    </p>
                `
                : ''
            }
            <div class="modal__detail-whatsapp">
                <button
                    type="button"
                    class="agenda__btn agenda__btn--primary"
                    data-acao="whatsapp"
                >
                    <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
                    <span>Enviar mensagem ao paciente</span>
                </button>
            </div>
        `;
    }

    function executarAcao(acao) {
        const agendamento = obterAgendamentoPorId(state.agendamentoSelecionadoId);

        if (!agendamento) {
            fecharModalAcoes();
            return;
        }

        switch (acao) {
            case 'confirmar':
                alterarStatus(agendamento, 'confirmado');
                break;
            case 'espera':
                alterarStatus(agendamento, 'espera');
                break;
            case 'atender':
                alterarStatus(agendamento, 'atendido');
                break;
            case 'cancelar':
                alterarStatus(agendamento, 'cancelado');
                break;
            case 'excluir':
                excluirAgendamento(agendamento);
                break;
            case 'editar':
                fecharModalAcoes();
                abrirModalEdicao(agendamento);
                break;
            case 'teleconsulta':
                iniciarTeleconsulta(agendamento);
                break;
            case 'prontuario':
                acessarProntuario(agendamento);
                break;
            case 'financeiro':
                acessarFinanceiro(agendamento);
                break;
            case 'whatsapp':
                abrirModalWhatsApp(agendamento);
                break;
            default:
                exibirToast('Ação não reconhecida.', 'warning');
        }
    }

    function alterarStatus(agendamento, novoStatus) {
        agendamento.status = novoStatus;
        agendamento.atualizadoEm = new Date().toISOString();

        persistirAgendamentos();
        fecharModalAcoes();
        renderizarAgenda();

        exibirToast(`Status alterado para ${STATUS_LABELS[novoStatus]}.`, 'success');
    }

    function excluirAgendamento(agendamento) {
        const desejaExcluir = window.confirm(
            `Excluir o agendamento de ${agendamento.paciente}?`
        );

        if (!desejaExcluir) {
            return;
        }

        state.agendamentos = state.agendamentos.filter(
            item => item.id !== agendamento.id
        );

        persistirAgendamentos();
        fecharModalAcoes();
        renderizarAgenda();

        exibirToast('Agendamento excluído com sucesso.', 'success');
    }

    function iniciarTeleconsulta(agendamento) {
        fecharModalAcoes();

        if (agendamento.tipo !== 'online') {
            exibirToast('Este agendamento não está configurado como teleconsulta.', 'warning');
            return;
        }

        window.dispatchEvent(new CustomEvent('GM4med:teleconsulta', {
            detail: agendamento
        }));

        exibirToast('Sala de teleconsulta acionada.', 'info');
    }

    function acessarProntuario(agendamento) {
        window.dispatchEvent(new CustomEvent('GM4med:prontuario', {
            detail: agendamento
        }));

        exibirToast(`Prontuário de ${agendamento.paciente} solicitado.`, 'info');
    }

    function acessarFinanceiro(agendamento) {
        window.dispatchEvent(new CustomEvent('GM4med:financeiro', {
            detail: agendamento
        }));

        exibirToast(`Financeiro do agendamento de ${agendamento.paciente} solicitado.`, 'info');
    }

    /*
     * =========================================================================
     * WHATSAPP
     * =========================================================================
     */

    function abrirModalWhatsApp(agendamento) {
        if (!agendamento || !elements.modalWhatsApp) {
            return;
        }

        state.whatsappAgendamento = agendamento;

        const medico = MEDICOS[agendamento.medicoId];
        const dataFormatada = formatarDataCurta(agendamento.data);
        const mensagem = criarMensagemWhatsApp({ agendamento, medico });

        if (elements.whatsappPreview) {
            elements.whatsappPreview.innerHTML = `
                <p>
                    <strong>Paciente:</strong>
                    ${escapeHTML(agendamento.paciente)}
                </p>
                <p>
                    <strong>Data:</strong>
                    ${escapeHTML(dataFormatada)}
                </p>
                <p>
                    <strong>Horário:</strong>
                    ${escapeHTML(agendamento.hora)}
                </p>
                <p>
                    <strong>Médico:</strong>
                    ${escapeHTML(medico?.nome || 'Não informado')}
                </p>
                <p>
                    <strong>Convênio:</strong>
                    ${escapeHTML(agendamento.convenio || 'Particular')}
                </p>
            `;
        }

        if (elements.whatsappMensagem) {
            elements.whatsappMensagem.value = mensagem;
        }

        abrirModal(elements.modalWhatsApp, '#whatsapp-mensagem');
    }

    function criarMensagemWhatsApp({ agendamento, medico }) {
        return [
            `Olá ${agendamento.paciente}! 👋`,
            '',
            '✅ *Agendamento confirmado*',
            '',
            `📅 Data: ${formatarDataCurta(agendamento.data)}`,
            `⏰ Horário: ${agendamento.hora}`,
            `👨‍⚕️ Médico: ${medico?.nome || 'Não informado'}`,
            `💳 Convênio: ${agendamento.convenio || 'Particular'}`,
            '',
            `📍 Local: ${CONFIG.nomeClinica}`,
            `📞 Dúvidas: ${CONFIG.telefoneClinica}`,
            '',
            'Agradecemos sua confiança!'
        ].join('\n');
    }

    function enviarWhatsAppPaciente() {
        const agendamento = state.whatsappAgendamento;
        const mensagem = elements.whatsappMensagem?.value.trim() || '';

        if (!agendamento) {
            exibirToast('Agendamento não encontrado.', 'error');
            return;
        }

        if (!mensagem) {
            exibirToast('Digite uma mensagem para enviar.', 'warning');
            return;
        }

        const telefone = obterTelefonePaciente(agendamento);

        if (!telefone) {
            exibirToast('Cadastre o telefone do paciente antes de enviar a mensagem.', 'warning');
            return;
        }

        const link = criarLinkWhatsApp(telefone, mensagem);

        window.open(link, '_blank', 'noopener,noreferrer');

        if (elements.whatsappLembrete?.checked) {
            salvarLembreteWhatsApp(agendamento, mensagem);
        }

        fecharModalWhatsApp();
        exibirToast('WhatsApp aberto. Revise e envie a mensagem ao paciente.', 'success');
    }

    function obterTelefonePaciente(agendamento) {
        const telefone = agendamento.telefone || '';
        return normalizarTelefone(telefone);
    }

    function criarLinkWhatsApp(telefone, mensagem) {
        return `${CONFIG.whatsappBaseUrl}${telefone}?text=${encodeURIComponent(mensagem)}`;
    }

    function salvarLembreteWhatsApp(agendamento, mensagem) {
        const lembretes = carregarDoStorage(CONFIG.lembretesStorageKey, []);

        const lembreteExistente = lembretes.some(
            lembrete => lembrete.agendamentoId === agendamento.id
        );

        if (lembreteExistente) {
            return;
        }

        lembretes.push({
            agendamentoId: agendamento.id,
            paciente: agendamento.paciente,
            dataEnvio: calcularDataLembrete(agendamento.data, agendamento.hora),
            mensagem
        });

        salvarNoStorage(CONFIG.lembretesStorageKey, lembretes);
    }

    function calcularDataLembrete(dataConsulta, horaConsulta) {
        const [ano, mes, dia] = dataConsulta.split('-').map(Number);
        const [horas, minutos] = horaConsulta.split(':').map(Number);

        const consulta = new Date(ano, mes - 1, dia, horas, minutos);
        consulta.setHours(consulta.getHours() - 24);

        return consulta.toISOString();
    }

    function fecharModalWhatsApp() {
        fecharModal(elements.modalWhatsApp);
        state.whatsappAgendamento = null;
    }

    /*
     * =========================================================================
     * CHAT INTERNO - FUNÇÕES DE EXCLUSÃO
     * =========================================================================
     */

    function configurarEventosChat() {
        // Botão de limpar canal
        const btnLimparCanal = document.querySelector('#btn-limpar-canal');
        if (btnLimparCanal) {
            btnLimparCanal.addEventListener('click', () => {
                confirmarLimparCanal();
            });
        }

        // Delegação de eventos para botão de apagar mensagem
        elements.chatMensagens?.addEventListener('click', event => {
            const btnApagar = event.target.closest('.chat-interno__msg-apagar');

            if (!btnApagar) {
                return;
            }

            const mensagemId = btnApagar.dataset.mensagemId;
            apagarMensagemIndividual(mensagemId);
        });

        // Prevenir propagação do clique na mensagem quando clicar no botão de apagar
        elements.chatMensagens?.addEventListener('mousedown', event => {
            const btnApagar = event.target.closest('.chat-interno__msg-apagar');

            if (btnApagar) {
                event.stopPropagation();
            }
        });
    }

    function criarMensagemChatHTML(mensagem) {
        const enviada = mensagem.autor === 'Você';
        const classe = enviada
            ? 'chat-interno__msg--enviada'
            : 'chat-interno__msg--recebida';

        return `
            <div 
                class="chat-interno__msg ${classe}" 
                data-mensagem-id="${escapeHTML(mensagem.id)}"
                role="article"
                aria-label="Mensagem de ${escapeHTML(mensagem.autor)} às ${escapeHTML(mensagem.hora)}"
            >
                <div class="chat-interno__msg-header">
                    <span class="chat-interno__msg-autor">
                        ${escapeHTML(mensagem.autor)}
                    </span>
                    <span class="chat-interno__msg-hora">
                        ${escapeHTML(mensagem.hora)}
                    </span>
                </div>
                <p class="chat-interno__msg-texto">
                    ${escapeHTML(mensagem.texto)}
                </p>
                ${enviada ? `
                    <button
                        type="button"
                        class="chat-interno__msg-apagar"
                        aria-label="Apagar esta mensagem"
                        title="Apagar mensagem"
                        data-mensagem-id="${escapeHTML(mensagem.id)}"
                    >
                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    function apagarMensagemIndividual(mensagemId) {
        if (!mensagemId) {
            return;
        }

        const canal = state.chat.canalAtual;
        const mensagemElemento = document.querySelector(
            `.chat-interno__msg[data-mensagem-id="${mensagemId}"]`
        );

        if (!mensagemElemento) {
            return;
        }

        // Animação de remoção
        mensagemElemento.classList.add('chat-interno__msg--removendo');

        // Aguarda animação e remove do DOM e do estado
        window.setTimeout(() => {
            state.chat.mensagens[canal] = state.chat.mensagens[canal].filter(
                msg => msg.id !== mensagemId
            );

            salvarMensagensChat();
            renderizarCanalChat();
            atualizarInfoCanal();

            exibirToast('Mensagem excluída.', 'info');
        }, 300);
    }

    function confirmarLimparCanal() {
        const canal = state.chat.canalAtual;
        const mensagens = state.chat.mensagens[canal] || [];

        if (mensagens.length === 0) {
            exibirToast('Este canal já está vazio.', 'info');
            return;
        }

        // Criar modal de confirmação
        const modalConfirmacao = criarModalConfirmacaoLimpeza(canal, mensagens.length);
        document.body.appendChild(modalConfirmacao);

        // Focar no botão de cancelar
        window.setTimeout(() => {
            modalConfirmacao.querySelector('.chat-confirm-modal__btn--cancelar')?.focus();
        }, 100);
    }

    function criarModalConfirmacaoLimpeza(canal, quantidadeMensagens) {
        const modal = document.createElement('div');
        modal.className = 'chat-confirm-modal';
        modal.setAttribute('role', 'alertdialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'chat-confirm-titulo');
        modal.setAttribute('aria-describedby', 'chat-confirm-desc');
        modal.setAttribute('aria-hidden', 'false');

        const nomesCanais = {
            geral: '🏥 Geral',
            recepcao: '📋 Recepção',
            medicos: '👨‍⚕️ Médicos'
        };

        const nomeCanal = nomesCanais[canal] || canal;

        modal.innerHTML = `
            <div class="chat-confirm-modal__overlay" aria-hidden="true"></div>
            <div class="chat-confirm-modal__content">
                <div class="chat-confirm-modal__header">
                    <div class="chat-confirm-modal__icon">
                        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                    </div>
                    <h2 id="chat-confirm-titulo" class="chat-confirm-modal__titulo">
                        Limpar histórico do canal?
                    </h2>
                </div>
                <div class="chat-confirm-modal__body">
                    <p id="chat-confirm-desc" class="chat-confirm-modal__texto">
                        Você está prestes a excluir 
                        <strong>${quantidadeMensagens} ${quantidadeMensagens === 1 ? 'mensagem' : 'mensagens'}</strong> 
                        do canal <strong>${nomeCanal}</strong>.
                    </p>
                    <div class="chat-confirm-modal__aviso">
                        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                        <span>
                            Esta ação não pode ser desfeita. Todas as mensagens serão permanentemente excluídas.
                        </span>
                    </div>
                </div>
                <div class="chat-confirm-modal__footer">
                    <button 
                        type="button" 
                        class="chat-confirm-modal__btn chat-confirm-modal__btn--cancelar"
                        data-acao="cancelar"
                    >
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        class="chat-confirm-modal__btn chat-confirm-modal__btn--confirmar"
                        data-acao="confirmar"
                    >
                        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                        Sim, limpar tudo
                    </button>
                </div>
            </div>
        `;

        // Eventos do modal
        const overlay = modal.querySelector('.chat-confirm-modal__overlay');
        const btnCancelar = modal.querySelector('[data-acao="cancelar"]');
        const btnConfirmar = modal.querySelector('[data-acao="confirmar"]');

        overlay?.addEventListener('click', () => {
            fecharModalConfirmacao(modal);
        });

        btnCancelar?.addEventListener('click', () => {
            fecharModalConfirmacao(modal);
        });

        btnConfirmar?.addEventListener('click', () => {
            executarLimpezaCanal(canal, modal);
        });

        // Fechar com Escape
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                fecharModalConfirmacao(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        document.addEventListener('keydown', handleEscape);

        return modal;
    }

    function fecharModalConfirmacao(modal) {
        if (!modal) {
            return;
        }

        modal.setAttribute('aria-hidden', 'true');

        window.setTimeout(() => {
            modal.remove();
        }, 200);
    }

    function executarLimpezaCanal(canal, modal) {
        const mensagens = state.chat.mensagens[canal] || [];
        const quantidade = mensagens.length;

        if (quantidade === 0) {
            fecharModalConfirmacao(modal);
            return;
        }

        // Limpar estado
        state.chat.mensagens[canal] = [];

        // Salvar
        salvarMensagensChat();

        // Re-renderizar
        renderizarCanalChat();
        atualizarInfoCanal();

        // Fechar modal
        fecharModalConfirmacao(modal);

        // Toast de confirmação
        exibirToast(
            `${quantidade} ${quantidade === 1 ? 'mensagem' : 'mensagens'} excluída${quantidade === 1 ? '' : 's'}.`,
            'success'
        );
    }

    function atualizarEstadoChat() {
        elements.chatLista
            ?.querySelectorAll('.chat-interno__item')
            .forEach(item => {
                const ativo = item.dataset.chat === state.chat.canalAtual;
                item.classList.toggle('ativo', ativo);
                item.setAttribute('aria-pressed', String(ativo));
            });

        atualizarInfoCanal();
    }

    function atualizarInfoCanal() {
        const infoTexto = document.querySelector('#chat-info-mensagens');

        if (!infoTexto) {
            return;
        }

        const canal = state.chat.canalAtual;
        const mensagens = state.chat.mensagens[canal] || [];
        const quantidade = mensagens.length;

        infoTexto.textContent = `${quantidade} ${quantidade === 1 ? 'mensagem' : 'mensagens'}`;
    }

    function renderizarCanalChat() {
        if (!elements.chatMensagens) {
            return;
        }

        const mensagens = state.chat.mensagens[state.chat.canalAtual] || [];

        elements.chatMensagens.innerHTML = mensagens
            .map(mensagem => criarMensagemChatHTML(mensagem))
            .join('');

        elements.chatMensagens.scrollTop = elements.chatMensagens.scrollHeight;

        atualizarInfoCanal();
    }

    function selecionarCanalChat(canal) {
        if (!state.chat.mensagens[canal]) {
            return;
        }

        state.chat.canalAtual = canal;
        atualizarEstadoChat();
        renderizarCanalChat();
    }

    /*
     * =========================================================================
     * MODAIS E ACESSIBILIDADE
     * =========================================================================
     */

    function abrirModal(modal, seletorFoco) {
        if (!modal) {
            console.error('Tentativa de abrir modal inexistente:', seletorFoco);
            return;
        }

        state.ultimoElementoFocado = document.activeElement;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        window.setTimeout(() => {
            const campoFoco = modal.querySelector(seletorFoco);

            if (campoFoco) {
                campoFoco.focus();
                console.log('Foco aplicado em:', seletorFoco);
            } else {
                console.warn('Campo de foco não encontrado:', seletorFoco);
            }
        }, 100);

        console.log('Modal aberto:', modal.id);
    }

    function fecharModalAgendamento() {
        fecharModal(elements.modalAgendamento);
    }

    function fecharModalAcoes() {
        fecharModal(elements.modalAcoes);
        state.agendamentoSelecionadoId = null;
    }

    function fecharModalPorElemento(modal) {
        if (!modal) {
            return;
        }

        switch (modal.id) {
            case 'modal-agendamento':
                fecharModalAgendamento();
                break;
            case 'modal-acoes':
                fecharModalAcoes();
                break;
            case 'modal-whatsapp':
                fecharModalWhatsApp();
                break;
            default:
                console.warn('Modal desconhecido:', modal.id);
        }
    }

    function fecharModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');

        const outrosModaisAbertos = document.querySelector('.modal.is-open');

        if (!outrosModaisAbertos) {
            document.body.classList.remove('modal-open');
        }

        const elementoAnterior = state.ultimoElementoFocado;

        if (elementoAnterior && typeof elementoAnterior.focus === 'function') {
            elementoAnterior.focus();
        }

        console.log('Modal fechado:', modal.id);
    }

    function tratarTecladoGlobal(event) {
        const modalAberto = document.querySelector('.modal.is-open');

        if (event.key === 'Escape') {
            if (elements.janelaChat?.classList.contains('is-open')) {
                fecharChat();
                return;
            }

            if (!modalAberto) {
                return;
            }

            event.preventDefault();
            fecharModalPorElemento(modalAberto);
            return;
        }

        if (event.key === 'Tab' && modalAberto) {
            manterFocoNoModal(event, modalAberto);
        }
    }

    function manterFocoNoModal(event, modal) {
        const focaveis = [
            ...modal.querySelectorAll(
                [
                    'button:not([disabled])',
                    'input:not([disabled])',
                    'select:not([disabled])',
                    'textarea:not([disabled])',
                    '[tabindex]:not([tabindex="-1"])'
                ].join(', ')
            )
        ].filter(elemento => elemento.offsetParent !== null);

        if (!focaveis.length) {
            return;
        }

        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (event.shiftKey && document.activeElement === primeiro) {
            event.preventDefault();
            ultimo.focus();
        }

        if (!event.shiftKey && document.activeElement === ultimo) {
            event.preventDefault();
            primeiro.focus();
        }
    }

    function aplicarAcessibilidadeBasica() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.setAttribute('aria-hidden', 'true');
        });

        elements.agendaBody?.setAttribute('aria-live', 'polite');

        inicializarChat();
    }

    function inicializarChat() {
        if (!elements.janelaChat) {
            return;
        }

        atualizarEstadoChat();
    }

    function alternarChat() {
        const aberto = elements.janelaChat?.getAttribute('aria-hidden') === 'false';

        if (aberto) {
            fecharChat();
        } else {
            abrirChat();
        }
    }

    function abrirChat() {
        if (!elements.janelaChat) {
            return;
        }

        elements.janelaChat.setAttribute('aria-hidden', 'false');
        elements.janelaChat.classList.add('is-open');
        elements.btnChat?.setAttribute('aria-expanded', 'true');

        if (elements.chatBadge) {
            elements.chatBadge.hidden = true;
        }

        window.setTimeout(() => {
            elements.chatInput?.focus();
        }, 100);
    }

    function fecharChat() {
        if (!elements.janelaChat) {
            return;
        }

        elements.janelaChat.setAttribute('aria-hidden', 'true');
        elements.janelaChat.classList.remove('is-open');
        elements.btnChat?.setAttribute('aria-expanded', 'false');
    }

    function enviarMensagemChat() {
        const texto = elements.chatInput?.value.trim() || '';

        if (!texto) {
            return;
        }

        const agora = new Date();
        const canal = state.chat.canalAtual;

        const mensagem = {
            id: gerarId(),
            texto,
            autor: 'Você',
            hora: agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: agora.toISOString()
        };

        state.chat.mensagens[canal].push(mensagem);
        salvarMensagensChat();
        renderizarCanalChat();

        elements.chatInput.value = '';
        elements.chatInput.focus();
    }

    function salvarMensagensChat() {
        salvarNoStorage(CONFIG.chatStorageKey, state.chat.mensagens);
    }

    function carregarMensagensChat() {
        const mensagens = carregarDoStorage(CONFIG.chatStorageKey, null);

        if (!mensagens || typeof mensagens !== 'object') {
            return;
        }

        Object.keys(state.chat.mensagens).forEach(canal => {
            if (Array.isArray(mensagens[canal])) {
                state.chat.mensagens[canal] = mensagens[canal];
            }
        });
    }

    /*
     * =========================================================================
     * TOAST
     * =========================================================================
     */

    function exibirToast(mensagem, tipo = 'info', duracao = CONFIG.duracaoToast) {
        const container = elements.toastContainer;

        if (!container || !mensagem?.trim()) {
            return;
        }

        const mensagemNormalizada = mensagem.trim();
        const chave = ToastManager.criarChave(mensagemNormalizada, tipo);
        const toastExistente = ToastManager.obter(chave);

        if (toastExistente) {
            clearTimeout(toastExistente.timer);

            const novoTimer = window.setTimeout(() => {
                fecharToast(toastExistente.elemento, chave);
            }, duracao);

            ToastManager.adicionar(chave, toastExistente.elemento, novoTimer);
            return;
        }

        if (ToastManager.ativos.size >= CONFIG.limiteToasts) {
            ToastManager.removerMaisAntigo();
        }

        const icones = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const labels = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };

        const toast = document.createElement('div');

        toast.className = `toast toast--${escapeHTML(tipo)}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute(
            'aria-label',
            `${labels[tipo] || 'Notificação'}: ${mensagemNormalizada}`
        );

        toast.innerHTML = `
            <div class="toast__icon">
                <i
                    class="fa-solid ${icones[tipo] || icones.info}"
                    aria-hidden="true"
                ></i>
            </div>
            <span class="toast__content">
                ${escapeHTML(mensagemNormalizada)}
            </span>
            <button
                type="button"
                class="toast__close"
                aria-label="Fechar notificação"
            >
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        `;

        container.appendChild(toast);

        const timer = window.setTimeout(() => {
            fecharToast(toast, chave);
        }, duracao);

        ToastManager.adicionar(chave, toast, timer);

        toast.querySelector('.toast__close')?.addEventListener('click', () => {
            fecharToast(toast, chave);
        });
    }

    function fecharToast(toast, chave) {
        if (!toast || toast.classList.contains('is-leaving')) {
            return;
        }

        toast.classList.add('is-leaving');
        ToastManager.remover(chave);

        window.setTimeout(() => {
            toast.remove();
        }, 350);
    }

    /*
     * =========================================================================
     * PERSISTÊNCIA
     * =========================================================================
     */

    function carregarAgendamentos() {
        const agendamentos = carregarDoStorage(CONFIG.storageKey, null);

        if (Array.isArray(agendamentos)) {
            return agendamentos;
        }

        const dadosIniciais = criarAgendamentosDemonstracao();
        salvarAgendamentos(dadosIniciais);

        return dadosIniciais;
    }

    function persistirAgendamentos() {
        salvarAgendamentos(state.agendamentos);
    }

    function salvarAgendamentos(dados) {
        salvarNoStorage(CONFIG.storageKey, dados);
    }

    function carregarDoStorage(chave, valorPadrao) {
        try {
            const valor = localStorage.getItem(chave);
            return valor ? JSON.parse(valor) : valorPadrao;
        } catch (erro) {
            console.warn(`Não foi possível carregar ${chave}.`, erro);
            return valorPadrao;
        }
    }

    function salvarNoStorage(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (erro) {
            console.warn(`Não foi possível salvar ${chave}.`, erro);
            exibirToast('Não foi possível salvar os dados neste navegador.', 'error');
        }
    }

    function criarAgendamentosDemonstracao() {
        const hoje = formatarDataISO(new Date());

        return [
            {
                id: gerarId(),
                paciente: 'Mariana Oliveira',
                medicoId: '1',
                data: hoje,
                hora: '08:30',
                duracao: 30,
                tipo: 'presencial',
                convenio: 'unimed',
                status: 'confirmado',
                observacoes: '',
                lembrete: true,
                criadoEm: new Date().toISOString()
            },
            {
                id: gerarId(),
                paciente: 'João Pereira',
                medicoId: '2',
                data: hoje,
                hora: '09:00',
                duracao: 45,
                tipo: 'online',
                convenio: 'particular',
                status: 'agendado',
                observacoes: 'Paciente solicitou teleconsulta.',
                lembrete: true,
                criadoEm: new Date().toISOString()
            },
            {
                id: gerarId(),
                paciente: 'Fernanda Costa',
                medicoId: '3',
                data: hoje,
                hora: '10:30',
                duracao: 30,
                tipo: 'retorno',
                convenio: 'amil',
                status: 'espera',
                observacoes: '',
                lembrete: false,
                criadoEm: new Date().toISOString()
            }
        ];
    }

    /*
     * =========================================================================
     * VALIDAÇÃO E UTILITÁRIOS
     * =========================================================================
     */

    function limparFormulario() {
        if (fields.id) fields.id.value = '';
        if (fields.paciente) fields.paciente.value = '';
        if (fields.medico) fields.medico.value = '';
        if (fields.data) fields.data.value = '';
        if (fields.hora) fields.hora.value = '';
        if (fields.duracao) fields.duracao.value = '30';
        if (fields.tipo) fields.tipo.value = 'presencial';
        if (fields.convenio) fields.convenio.value = 'particular';
        if (fields.status) fields.status.value = 'agendado';
        if (fields.observacoes) fields.observacoes.value = '';
        if (fields.lembrete) fields.lembrete.checked = true;

        limparErrosFormulario();
    }

    function marcarErro(campo, mensagem) {
        if (!campo) {
            return;
        }

        campo.classList.add('is-invalid');
        campo.setAttribute('aria-invalid', 'true');
        campo.setAttribute('title', mensagem);
    }

    function limparErrosFormulario() {
        document.querySelectorAll('.is-invalid').forEach(campo => {
            campo.classList.remove('is-invalid');
            campo.removeAttribute('aria-invalid');
            campo.removeAttribute('title');
        });
    }

    function obterAgendamentoPorId(id) {
        return state.agendamentos.find(agendamento => agendamento.id === id);
    }

    function gerarId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return [
            'agendamento',
            Date.now(),
            Math.random().toString(16).slice(2)
        ].join('-');
    }

    function inicioDoDia(data) {
        const resultado = new Date(data);
        resultado.setHours(0, 0, 0, 0);
        return resultado;
    }

    function formatarDataISO(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    function dataStringParaDate(dataString) {
        const partes = dataString.split('-');

        if (partes.length !== 3) {
            return new Date();
        }

        const [ano, mes, dia] = partes.map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function formatarDataCurta(dataString) {
        return new Intl.DateTimeFormat('pt-BR').format(
            dataStringParaDate(dataString)
        );
    }

    function horaParaMinutos(hora) {
        if (!hora || !hora.includes(':')) {
            return Number.NaN;
        }

        const [horas, minutos] = hora.split(':').map(Number);

        if (
            Number.isNaN(horas) ||
            Number.isNaN(minutos) ||
            horas < 0 ||
            horas > 23 ||
            minutos < 0 ||
            minutos > 59
        ) {
            return Number.NaN;
        }

        return horas * 60 + minutos;
    }

    function minutosParaHora(minutos) {
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        return [
            String(horas).padStart(2, '0'),
            String(minutosRestantes).padStart(2, '0')
        ].join(':');
    }

    function normalizarTelefone(telefone) {
        return String(telefone || '').replace(/\D/g, '');
    }

    function capitalizar(texto) {
        if (!texto) {
            return '';
        }

        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function escapeHTML(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
});