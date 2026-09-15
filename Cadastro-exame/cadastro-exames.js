/* ==========================================================================
   GM4Med — JANELA DE CADASTRO DE EXAMES
   Lógica Front-End, Máquina de Estados, Validações de Saúde, Acessibilidade e API PEP
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. BASE DE DADOS SIMULADA & ESTADO GLOBAL
  // --------------------------------------------------------------------------
  const BANCO_CONVENIOS = {
    'CON-00001': { id: 'CON-00001', nome: 'UNIMED BRASIL', ans: '345678', cnpj: '45.231.890/0001-12', tel: '(11) 3214-5500', email: 'atendimento@unimed.com.br', status: 'A' },
    'CON-00002': { id: 'CON-00002', nome: 'BRADESCO SAÚDE', ans: '123456', cnpj: '92.456.789/0001-34', tel: '(11) 4004-2700', email: 'credenciamento@bradescosaude.com.br', status: 'A' },
    'CON-00003': { id: 'CON-00003', nome: 'AMIL ASSISTÊNCIA MÉDICA', ans: '987654', cnpj: '29.309.123/0001-56', tel: '(11) 3003-1333', email: 'operacional@amil.com.br', status: 'A' },
    'CON-00004': { id: 'CON-00004', nome: 'SULAMÉRICA SAÚDE', ans: '554433', cnpj: '01.654.987/0001-89', tel: '(11) 4004-4444', email: 'contato@sulamerica.com.br', status: 'A' },
    'CON-00005': { id: 'CON-00005', nome: 'POSTAL SAÚDE', ans: '112233', cnpj: '18.234.567/0001-90', tel: '(61) 3003-8000', email: 'contato@postalsaude.com.br', status: 'I' }
  };

  let examesCadastrados = [
    {
      id: 'EXA-00001',
      nome: 'HEMOGRAMA COMPLETO',
      categoria: '02',
      categoriaNome: '02 — Laboratório / Análises Clínicas',
      tipo: '01',
      tipoNome: '01 — Laboratorial',
      convenio_vinculado_id: 'CON-00001',
      preparo: 'JEJUM OBRIGATÓRIO DE 8 HORAS. EVITAR EXERCÍCIOS FÍSICOS INTENSOS NAS 24h ANTES DA COLETA.',
      valorParticular: 'R$ 45,00',
      valorConvenio: 'R$ 40,00',
      custoInterno: 'R$ 25,00',
      status: 'A',
      dataCriacao: '10/01/2026 08:30',
      usuarioCriacao: 'DRA. ANA PAULA',
      dataAtualizacao: '15/02/2026 14:20',
      usuarioAtualizacao: 'ADMIN'
    },
    {
      id: 'EXA-00002',
      nome: 'RAIO-X DE TÓRAX AP E PERFIL',
      categoria: '03',
      categoriaNome: '03 — Diagnóstico por Imagem',
      tipo: '02',
      tipoNome: '02 — Imagem',
      convenio_vinculado_id: 'CON-00002',
      preparo: 'NÃO REQUER JEJUM. REMOVER ADORNOS METÁLICOS DA REGIÃO TORÁCICA.',
      valorParticular: 'R$ 120,00',
      valorConvenio: 'R$ 100,00',
      custoInterno: 'R$ 60,00',
      status: 'A',
      dataCriacao: '12/01/2026 09:15',
      usuarioCriacao: 'DR. MARCOS',
      dataAtualizacao: '12/01/2026 09:15',
      usuarioAtualizacao: 'DR. MARCOS'
    },
    {
      id: 'EXA-00003',
      nome: 'ULTRASSOM ABDOMINAL TOTAL',
      categoria: '04',
      categoriaNome: '04 — Ultrassonografia',
      tipo: '03',
      tipoNome: '03 — Ultrassonografia',
      convenio_vinculado_id: 'CON-00003',
      preparo: 'JEJUM DE 6 HORAS. TOMAR 4 COPOS DE ÁGUA 1 HORA ANTES E NÃO URINAR.',
      valorParticular: 'R$ 250,00',
      valorConvenio: 'R$ 220,00',
      custoInterno: 'R$ 150,00',
      status: 'A',
      dataCriacao: '15/01/2026 10:45',
      usuarioCriacao: 'DRA. CAMILA',
      dataAtualizacao: '20/02/2026 11:30',
      usuarioAtualizacao: 'ADMIN'
    },
    {
      id: 'EXA-00004',
      nome: 'ELETROCARDIOGRAMA (ECG)',
      categoria: '01',
      categoriaNome: '01 — Cardiologia',
      tipo: '04',
      tipoNome: '04 — Cardiológico',
      convenio_vinculado_id: 'CON-00004',
      preparo: 'NÃO USAR CREMES OU LOÇÕES NO TÓRAX NO DIA DO EXAME.',
      valorParticular: 'R$ 80,00',
      valorConvenio: 'R$ 70,00',
      custoInterno: 'R$ 40,00',
      status: 'A',
      dataCriacao: '18/01/2026 11:00',
      usuarioCriacao: 'DR. ROBERTO',
      dataAtualizacao: '18/01/2026 11:00',
      usuarioAtualizacao: 'DR. ROBERTO'
    },
    {
      id: 'EXA-00005',
      nome: 'ECO DOPPLER VASCULAR MEMBROS INFERIORES',
      categoria: '05',
      categoriaNome: '05 — Vascular',
      tipo: '05',
      tipoNome: '05 — Vascular',
      convenio_vinculado_id: '',
      preparo: 'SEM PREPARO ESPECIAL NECESSÁRIO.',
      valorParticular: 'R$ 350,00',
      valorConvenio: 'R$ 0,00',
      custoInterno: 'R$ 200,00',
      status: 'I',
      dataCriacao: '20/01/2026 15:30',
      usuarioCriacao: 'ADMIN',
      dataAtualizacao: '01/03/2026 16:00',
      usuarioAtualizacao: 'ADMIN'
    }
  ];

  let estadoApp = 'NAVEGACAO'; // 'NAVEGACAO' | 'NOVO' | 'EDICAO'
  let indiceAtual = 0;
  let examePendenteExclusaoId = null;

  // --------------------------------------------------------------------------
  // 2. ELEMENTOS DO DOM
  // --------------------------------------------------------------------------
  const elForm = document.getElementById('exameForm');
  const elExameId = document.getElementById('exameId');
  const elNomeExame = document.getElementById('nomeExame');
  const elCategoriaExame = document.getElementById('categoriaExame');
  const elTipoExame = document.getElementById('tipoExame');
  const elConvenioSelect = document.getElementById('convenioSelect');
  const elStatusExame = document.getElementById('statusExame');
  const elPreparoExame = document.getElementById('preparoExame');

  // Campos do Convênio
  const elConvenioId = document.getElementById('convenioId');
  const elNomeConvenio = document.getElementById('nomeConvenio');
  const elRegistroAns = document.getElementById('registroAns');
  const elCnpjConvenio = document.getElementById('cnpjConvenio');
  const elTelConvenio = document.getElementById('telConvenio');
  const elEmailConvenio = document.getElementById('emailConvenio');
  const elStatusConvenio = document.getElementById('statusConvenio');

  // Financeiro
  const elValorParticular = document.getElementById('valorParticular');
  const elValorConvenio = document.getElementById('valorConvenio');
  const elCustoInterno = document.getElementById('custoInterno');

  // Auditoria
  const elDataCriacao = document.getElementById('dataCriacao');
  const elUsuarioCriacao = document.getElementById('usuarioCriacao');
  const elDataAtualizacao = document.getElementById('dataAtualizacao');
  const elUsuarioAtualizacao = document.getElementById('usuarioAtualizacao');

  // Botões Toolbar
  const btnNovo = document.getElementById('btnNovo');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnEditar = document.getElementById('btnEditar');
  const btnExcluir = document.getElementById('btnExcluir');
  const btnAnterior = document.getElementById('btnAnterior');
  const btnProximo = document.getElementById('btnProximo');
  const btnBuscar = document.getElementById('btnBuscar');

  // Feedback & Status
  const elFormStatus = document.getElementById('formStatus');

  // --------------------------------------------------------------------------
  // 3. INICIALIZAÇÃO
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    inicializarMascaraMonetaria();
    inicializarValidadorCNPJ();
    inicializarAcessibilidadeAbas();
    carregarTabelaExames(examesCadastrados);

    if (examesCadastrados.length > 0) {
      exibirExamePorIndice(0);
    } else {
      limparFormulario();
      atualizarBotoesToolbar();
    }

    // Expor API Global para integração com o PEP
    window.GM4MedExame = {
      getExames: function () { return Array.from(examesCadastrados); },
      getExamePorId: function (id) { return examesCadastrados.find(e => e.id === id) || null; },
      salvarExame: function (dados) { return salvarExameProgramatico(dados); },
      excluirExame: function (id) { return excluirExameProgramatico(id); }
    };

    console.log('[GM4Med] Módulo de Cadastro de Exames pronto e homologado.');
  });

  // --------------------------------------------------------------------------
  // 4. MÁQUINA DE ESTADOS & CONTROLE DE INTERFACE
  // --------------------------------------------------------------------------
  function setEstado(novoEstado) {
    estadoApp = novoEstado;
    const campos = document.querySelectorAll('.campo-edita');

    if (estadoApp === 'NOVO' || estadoApp === 'EDICAO') {
      campos.forEach(c => c.removeAttribute('disabled'));
      btnNovo.disabled = true;
      btnSalvar.disabled = false;
      btnEditar.disabled = true;
      btnExcluir.disabled = true;
      btnAnterior.disabled = true;
      btnProximo.disabled = true;
      btnBuscar.disabled = true;
    } else {
      campos.forEach(c => c.setAttribute('disabled', 'true'));
      btnNovo.disabled = false;
      btnSalvar.disabled = true;
      btnEditar.disabled = examesCadastrados.length === 0;
      btnExcluir.disabled = examesCadastrados.length === 0;
      btnAnterior.disabled = indiceAtual <= 0;
      btnProximo.disabled = indiceAtual >= examesCadastrados.length - 1;
      btnBuscar.disabled = false;
    }
  }

  function anunciarStatus(mensagem) {
    if (elFormStatus) {
      elFormStatus.textContent = mensagem;
    }
  }

  // --------------------------------------------------------------------------
  // 5. NAVEGAÇÃO DE ABAS & TECLADO (WAI-ARIA)
  // --------------------------------------------------------------------------
  window.switchTab = function (tabId) {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      const isTarget = tab.getAttribute('data-tab') === tabId;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    panels.forEach(panel => {
      const isTarget = panel.id === tabId;
      if (isTarget) {
        panel.classList.remove('hidden');
        panel.classList.add('active');
      } else {
        panel.classList.add('hidden');
        panel.classList.remove('active');
      }
    });
  };

  function inicializarAcessibilidadeAbas() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;

    tablist.addEventListener('keydown', function (e) {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
      const activeIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (activeIndex + 1) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        tabs[prevIndex].focus();
        tabs[prevIndex].click();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. OPERAÇÕES DE EXAME (NOVO, SALVAR, EDITAR, EXCLUIR, NAVEGAR)
  // --------------------------------------------------------------------------
  window.acaoNovoExame = function () {
    setEstado('NOVO');
    limparFormulario();
    elExameId.value = gerarProximoId();
    elStatusExame.value = 'A';

    const agora = formatarDataHora(new Date());
    elDataCriacao.value = agora;
    elUsuarioCriacao.value = 'OPERADOR ATUAL';
    elDataAtualizacao.value = agora;
    elUsuarioAtualizacao.value = 'OPERADOR ATUAL';

    switchTab('dados-exame');
    elNomeExame.focus();
    anunciarStatus('Modo de inserção de novo exame ativado.');
  };

  window.acaoEditarExame = function () {
    if (examesCadastrados.length === 0 || indiceAtual < 0) return;
    setEstado('EDICAO');
    elNomeExame.focus();
    anunciarStatus(`Editando o exame ${elExameId.value}.`);
  };

  window.acaoSalvarExame = function () {
    if (!validarFormulario()) {
      anunciarStatus('Existem erros no formulário. Verifique os campos destacados em vermelho.');
      return;
    }

    const payload = extrairDadosFormulario();

    if (estadoApp === 'NOVO') {
      examesCadastrados.push(payload);
      indiceAtual = examesCadastrados.length - 1;
      anunciarStatus(`Exame ${payload.nome} gravado com sucesso!`);
    } else if (estadoApp === 'EDICAO') {
      examesCadastrados[indiceAtual] = payload;
      anunciarStatus(`Exame ${payload.nome} atualizado com sucesso!`);
    }

    // Disparar Evento de Integração com PEP
    window.dispatchEvent(new CustomEvent('gm4med:exame-saved', { detail: payload }));

    carregarTabelaExames(examesCadastrados);
    exibirExamePorIndice(indiceAtual);
    setEstado('NAVEGACAO');
  };

  window.acaoExcluirExame = function () {
    if (examesCadastrados.length === 0 || indiceAtual < 0) return;
    const exame = examesCadastrados[indiceAtual];
    examePendenteExclusaoId = exame.id;

    const elMsg = document.getElementById('modalConfirmMessage');
    if (elMsg) {
      elMsg.textContent = `Tem certeza de que deseja excluir o exame "${exame.nome}" (ID: ${exame.id}) do sistema? Esta ação não pode ser desfeita.`;
    }

    abrirModal('modalConfirmacao');
  };

  document.getElementById('btnConfirmarExclusao')?.addEventListener('click', function () {
    if (!examePendenteExclusaoId) return;

    const idx = examesCadastrados.findIndex(e => e.id === examePendenteExclusaoId);
    if (idx !== -1) {
      const removido = examesCadastrados.splice(idx, 1)[0];
      fecharModal('modalConfirmacao');
      anunciarStatus(`Exame ${removido.nome} excluído.`);

      if (examesCadastrados.length > 0) {
        indiceAtual = Math.min(idx, examesCadastrados.length - 1);
        exibirExamePorIndice(indiceAtual);
      } else {
        indiceAtual = -1;
        limparFormulario();
      }
      carregarTabelaExames(examesCadastrados);
      setEstado('NAVEGACAO');
    }
  });

  window.acaoNavegarRegistro = function (direcao) {
    if (estadoApp !== 'NAVEGACAO') return;
    const novoIndice = indiceAtual + direcao;
    if (novoIndice >= 0 && novoIndice < examesCadastrados.length) {
      exibirExamePorIndice(novoIndice);
    }
  };

  function exibirExamePorIndice(idx) {
    if (idx < 0 || idx >= examesCadastrados.length) return;
    indiceAtual = idx;
    const item = examesCadastrados[idx];

    elExameId.value = item.id;
    elNomeExame.value = item.nome;
    elCategoriaExame.value = item.categoria || '';
    elTipoExame.value = item.tipo || '';
    elConvenioSelect.value = item.convenio_vinculado_id || '';
    elStatusExame.value = item.status || 'A';
    elPreparoExame.value = item.preparo || '';

    elValorParticular.value = item.valorParticular || 'R$ 0,00';
    elValorConvenio.value = item.valorConvenio || 'R$ 0,00';
    elCustoInterno.value = item.custoInterno || 'R$ 0,00';

    elDataCriacao.value = item.dataCriacao || '';
    elUsuarioCriacao.value = item.usuarioCriacao || '';
    elDataAtualizacao.value = item.dataAtualizacao || '';
    elUsuarioAtualizacao.value = item.usuarioAtualizacao || '';

    carregarDadosConvenioSelecionado();
    destacarLinhaTabela(idx);
    setEstado('NAVEGACAO');
  }

  window.carregarDadosConvenioSelecionado = function () {
    const convId = elConvenioSelect.value;
    const dadosConv = BANCO_CONVENIOS[convId];

    if (dadosConv) {
      elConvenioId.value = dadosConv.id;
      elNomeConvenio.value = dadosConv.nome;
      elRegistroAns.value = dadosConv.ans;
      elCnpjConvenio.value = dadosConv.cnpj;
      elTelConvenio.value = dadosConv.tel;
      elEmailConvenio.value = dadosConv.email;
      elStatusConvenio.value = dadosConv.status;
    } else {
      elConvenioId.value = '';
      elNomeConvenio.value = '';
      elRegistroAns.value = '';
      elCnpjConvenio.value = '';
      elTelConvenio.value = '';
      elEmailConvenio.value = '';
      elStatusConvenio.value = 'A';
    }
  };

  // --------------------------------------------------------------------------
  // 7. VALIDAÇÕES DE FORMULÁRIO (CNPJ, EMAIL, CAMPOS OBRIGATÓRIOS)
  // --------------------------------------------------------------------------
  function validarFormulario() {
    let valido = true;

    // Nome
    const nomeVal = elNomeExame.value.trim();
    const fbNome = document.getElementById('nomeExameFeedback');
    if (!nomeVal) {
      setCampoInvalido(elNomeExame, fbNome, 'O nome do exame é obrigatório.');
      valido = false;
    } else {
      setCampoValido(elNomeExame, fbNome);
    }

    // Categoria
    const catVal = elCategoriaExame.value;
    const fbCat = document.getElementById('categoriaFeedback');
    if (!catVal) {
      setCampoInvalido(elCategoriaExame, fbCat, 'Selecione uma categoria médica.');
      valido = false;
    } else {
      setCampoValido(elCategoriaExame, fbCat);
    }

    // Tipo
    const tipoVal = elTipoExame.value;
    const fbTipo = document.getElementById('tipoFeedback');
    if (!tipoVal) {
      setCampoInvalido(elTipoExame, fbTipo, 'Selecione o tipo do exame.');
      valido = false;
    } else {
      setCampoValido(elTipoExame, fbTipo);
    }

    // CNPJ se preenchido
    if (elCnpjConvenio.value.trim()) {
      const fbCnpj = document.getElementById('cnpjFeedback');
      if (!validarCNPJMatematico(elCnpjConvenio.value)) {
        setCampoInvalido(elCnpjConvenio, fbCnpj, 'CNPJ inválido (verifique os dígitos verificadores).');
        valido = false;
      } else {
        setCampoValido(elCnpjConvenio, fbCnpj);
      }
    }

    return valido;
  }

  function setCampoInvalido(campo, feedbackEl, mensagem) {
    campo.classList.add('is-invalid');
    campo.classList.remove('is-valid');
    if (feedbackEl) {
      feedbackEl.textContent = mensagem;
      feedbackEl.className = 'field-feedback error';
    }
  }

  function setCampoValido(campo, feedbackEl) {
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'field-feedback success';
    }
  }

  function validarCNPJMatematico(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(1)) return false;

    return true;
  }

  function inicializarValidadorCNPJ() {
    if (elCnpjConvenio) {
      elCnpjConvenio.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, '');
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
        e.target.value = v.substring(0, 18);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 8. MÁSCARA MONETÁRIA BRL
  // --------------------------------------------------------------------------
  function inicializarMascaraMonetaria() {
    const inputsMonetarios = [elValorParticular, elValorConvenio, elCustoInterno];
    inputsMonetarios.forEach(input => {
      if (!input) return;
      input.addEventListener('input', function (e) {
        let digits = e.target.value.replace(/\D/g, '');
        if (!digits) {
          e.target.value = 'R$ 0,00';
          return;
        }
        let number = parseFloat(digits) / 100;
        e.target.value = number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      });
    });
  }

  // --------------------------------------------------------------------------
  // 9. TABELA E BUSCA
  // --------------------------------------------------------------------------
  function carregarTabelaExames(lista) {
    const corpo = document.getElementById('corpoTabelaExames');
    if (!corpo) return;

    corpo.innerHTML = '';
    if (lista.length === 0) {
      corpo.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 font-medium">Nenhum exame cadastrado.</td></tr>`;
      return;
    }

    lista.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors border-b border-slate-200';
      if (index === indiceAtual && lista === examesCadastrados) {
        tr.classList.add('selected');
      }

      const statusBadge = item.status === 'A'
        ? `<span class="badge-status badge-ativo"><i class="fa-solid fa-circle text-[8px]"></i> Ativo</span>`
        : `<span class="badge-status badge-inativo"><i class="fa-solid fa-circle text-[8px]"></i> Inativo</span>`;

      const catTexto = item.categoriaNome || (elCategoriaExame.querySelector(`option[value="${item.categoria}"]`)?.textContent || item.categoria);
      const tipoTexto = item.tipoNome || (elTipoExame.querySelector(`option[value="${item.tipo}"]`)?.textContent || item.tipo);

      tr.innerHTML = `
        <td class="p-3.5 font-bold text-teal-700">${item.id}</td>
        <td class="p-3.5 font-semibold text-slate-800">${item.nome}</td>
        <td class="p-3.5 text-xs text-slate-600">${catTexto}</td>
        <td class="p-3.5 text-xs text-slate-600">${tipoTexto}</td>
        <td class="p-3.5 text-sm font-semibold text-slate-700">${item.valorParticular || 'R$ 0,00'}</td>
        <td class="p-3.5 text-sm text-slate-600">${item.valorConvenio || 'R$ 0,00'}</td>
        <td class="p-3.5 text-center">${statusBadge}</td>
      `;

      tr.addEventListener('click', function () {
        if (estadoApp !== 'NAVEGACAO') return;
        const idxReal = examesCadastrados.findIndex(e => e.id === item.id);
        if (idxReal !== -1) {
          exibirExamePorIndice(idxReal);
        }
      });

      corpo.appendChild(tr);
    });
  }

  function destacarLinhaTabela(idx) {
    const linhas = document.querySelectorAll('#corpoTabelaExames tr');
    linhas.forEach((tr, i) => {
      tr.classList.toggle('selected', i === idx);
    });
  }

  window.executarBuscaExames = function () {
    const termo = document.getElementById('inputBusca')?.value.trim().toLowerCase();
    if (!termo) {
      carregarTabelaExames(examesCadastrados);
      return;
    }

    const filtrados = examesCadastrados.filter(e =>
      e.id.toLowerCase().includes(termo) ||
      e.nome.toLowerCase().includes(termo) ||
      (e.categoriaNome && e.categoriaNome.toLowerCase().includes(termo)) ||
      (e.tipoNome && e.tipoNome.toLowerCase().includes(termo))
    );

    carregarTabelaExames(filtrados);
    anunciarStatus(`Busca concluída. ${filtrados.length} exames encontrados.`);
  };

  // --------------------------------------------------------------------------
  // 10. MODAIS (ABRIR, FECHAR, BUSCA AVANÇADA)
  // --------------------------------------------------------------------------
  window.abrirModalBusca = function () {
    abrirModal('modalBusca');
    const input = document.getElementById('inputBuscaModal');
    if (input) {
      input.value = '';
      input.focus();
    }
    document.getElementById('resultadosBuscaModal').innerHTML = '<p class="text-sm text-slate-500 text-center py-6">Digite um termo acima e clique em Pesquisar.</p>';
  };

  window.executarBuscaModal = function () {
    const termo = document.getElementById('inputBuscaModal')?.value.trim().toLowerCase();
    const elRes = document.getElementById('resultadosBuscaModal');
    if (!elRes) return;

    if (!termo) {
      elRes.innerHTML = '<p class="text-sm text-red-500 text-center py-4">Digite um termo para pesquisar.</p>';
      return;
    }

    const res = examesCadastrados.filter(e =>
      e.id.toLowerCase().includes(termo) ||
      e.nome.toLowerCase().includes(termo) ||
      (e.categoriaNome && e.categoriaNome.toLowerCase().includes(termo))
    );

    if (res.length === 0) {
      elRes.innerHTML = '<p class="text-sm text-slate-500 text-center py-6">Nenhum exame encontrado com este critério.</p>';
      return;
    }

    elRes.innerHTML = res.map(e => `
      <div class="busca-item flex items-center justify-between p-3 hover:bg-teal-50 cursor-pointer rounded-lg border-b border-slate-100" data-id="${e.id}">
        <div>
          <span class="font-bold text-teal-700 text-sm">${e.id}</span> — <span class="font-semibold text-slate-800 text-sm">${e.nome}</span>
          <p class="text-xs text-slate-500">${e.categoriaNome || e.categoria}</p>
        </div>
        <span class="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded">${e.valorParticular || 'R$ 0,00'}</span>
      </div>
    `).join('');

    elRes.querySelectorAll('.busca-item').forEach(item => {
      item.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const idx = examesCadastrados.findIndex(e => e.id === id);
        if (idx !== -1) {
          exibirExamePorIndice(idx);
          fecharModal('modalBusca');
        }
      });
    });
  };

  window.abrirModal = function (modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.removeAttribute('hidden');
    }
  };

  window.fecharModal = function (modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.setAttribute('hidden', 'true');
    }
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      fecharModal('modalBusca');
      fecharModal('modalConfirmacao');
    }
  });

  // --------------------------------------------------------------------------
  // 11. HELPERS E EXPORTAÇÃO PROGRAMÁTICA
  // --------------------------------------------------------------------------
  function limparFormulario() {
    elForm.reset();
    document.querySelectorAll('.field-feedback').forEach(f => {
      f.textContent = '';
      f.className = 'field-feedback';
    });
    document.querySelectorAll('.input').forEach(i => i.classList.remove('is-invalid', 'is-valid'));
    elValorParticular.value = 'R$ 0,00';
    elValorConvenio.value = 'R$ 0,00';
    elCustoInterno.value = 'R$ 0,00';
    carregarDadosConvenioSelecionado();
  }

  function extrairDadosFormulario() {
    const catOpt = elCategoriaExame.options[elCategoriaExame.selectedIndex];
    const tipoOpt = elTipoExame.options[elTipoExame.selectedIndex];

    return {
      id: elExameId.value,
      nome: elNomeExame.value.trim().toUpperCase(),
      categoria: elCategoriaExame.value,
      categoriaNome: catOpt ? catOpt.textContent : '',
      tipo: elTipoExame.value,
      tipoNome: tipoOpt ? tipoOpt.textContent : '',
      convenio_vinculado_id: elConvenioSelect.value,
      status: elStatusExame.value,
      preparo: elPreparoExame.value.trim().toUpperCase(),
      valorParticular: elValorParticular.value,
      valorConvenio: elValorConvenio.value,
      custoInterno: elCustoInterno.value,
      dataCriacao: elDataCriacao.value || formatarDataHora(new Date()),
      usuarioCriacao: elUsuarioCriacao.value || 'ADMIN',
      dataAtualizacao: formatarDataHora(new Date()),
      usuarioAtualizacao: 'ADMIN'
    };
  }

  function gerarProximoId() {
    const maxNum = examesCadastrados.reduce((max, item) => {
      const n = parseInt(item.id.replace('EXA-', ''), 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const prox = maxNum + 1;
    return `EXA-${String(prox).padStart(5, '0')}`;
  }

  function formatarDataHora(data) {
    const pad = n => String(n).padStart(2, '0');
    const dia = pad(data.getDate());
    const mes = pad(data.getMonth() + 1);
    const ano = data.getFullYear();
    const hora = pad(data.getHours());
    const min = pad(data.getMinutes());
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  }

  function salvarExameProgramatico(dados) {
    if (!dados || !dados.nome) return { sucesso: false, erro: 'Nome do exame é obrigatório.' };

    const novoId = dados.id || gerarProximoId();
    const itemFinal = Object.assign({
      id: novoId,
      categoria: '15',
      tipo: '01',
      status: 'A',
      valorParticular: 'R$ 0,00',
      valorConvenio: 'R$ 0,00',
      custoInterno: 'R$ 0,00',
      dataCriacao: formatarDataHora(new Date()),
      usuarioCriacao: 'API',
      dataAtualizacao: formatarDataHora(new Date()),
      usuarioAtualizacao: 'API'
    }, dados);

    const idxExistente = examesCadastrados.findIndex(e => e.id === novoId);
    if (idxExistente !== -1) {
      examesCadastrados[idxExistente] = itemFinal;
    } else {
      examesCadastrados.push(itemFinal);
    }

    carregarTabelaExames(examesCadastrados);
    window.dispatchEvent(new CustomEvent('gm4med:exame-saved', { detail: itemFinal }));
    return { sucesso: true, exame: itemFinal };
  }

  function excluirExameProgramatico(id) {
    const idx = examesCadastrados.findIndex(e => e.id === id);
    if (idx !== -1) {
      const removido = examesCadastrados.splice(idx, 1)[0];
      carregarTabelaExames(examesCadastrados);
      return { sucesso: true, removido: removido };
    }
    return { sucesso: false, erro: 'Exame não encontrado.' };
  }

})();