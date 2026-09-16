/**
 * Módulo de Gerenciamento de Grupos de Exames
 * Código refatorado, corrigido e organizado para melhor performance e legibilidade.
 */
(function () {
    "use strict";

    // Estado global da aplicação
    const state = {
        grupos: [],
        exames: [],
        grupoAtual: null,
        examesSelecionados: new Set(),
        paginaAtual: 1,
        itensPorPagina: 10,
        modalAnterior: null,
        acaoConfirmada: null
    };

    // Cache de elementos do DOM
    const elementos = {};

    function cacheElements() {
        elementos.groupsTableBody = document.getElementById("groupsTableBody");
        elementos.groupsTableWrapper = document.getElementById("groupsTableWrapper");
        elementos.groupsEmptyState = document.getElementById("groupsEmptyState");
        elementos.groupsSkeleton = document.getElementById("groupsSkeleton");
        elementos.groupsErrorState = document.getElementById("groupsErrorState");
        elementos.pagination = document.getElementById("pagination");
        elementos.resultCount = document.getElementById("resultCount");
        elementos.paginationInfo = document.getElementById("paginationInfo");
        elementos.currentPageLabel = document.getElementById("currentPageLabel");
        elementos.previousPageBtn = document.getElementById("previousPageBtn");
        elementos.nextPageBtn = document.getElementById("nextPageBtn");

        // Filtros
        elementos.searchGroup = document.getElementById("searchGroup");
        elementos.filterCategory = document.getElementById("filterCategory");
        elementos.filterSpecialty = document.getElementById("filterSpecialty");
        elementos.filterStatus = document.getElementById("filterStatus");
        elementos.clearFiltersBtn = document.getElementById("clearFiltersBtn");

        // Botões principais
        elementos.newGroupBtn = document.getElementById("newGroupBtn");
        elementos.emptyCreateBtn = document.getElementById("emptyCreateBtn");
        elementos.retryGroupsBtn = document.getElementById("retryGroupsBtn");

        // Modais e Formulários
        elementos.groupModal = document.getElementById("groupModal");
        elementos.groupModalTitle = document.getElementById("groupModalTitle");
        elementos.groupForm = document.getElementById("groupForm");
        elementos.saveGroupBtn = document.getElementById("saveGroupBtn");
        elementos.saveGroupLabel = document.getElementById("saveGroupLabel");

        // Campos do formulário de grupo
        elementos.groupId = document.getElementById("groupId");
        elementos.groupCode = document.getElementById("groupCode");
        elementos.groupName = document.getElementById("groupName");
        elementos.groupShortName = document.getElementById("groupShortName");
        elementos.groupCategory = document.getElementById("groupCategory");
        elementos.groupSpecialties = document.getElementById("groupSpecialties");
        elementos.groupDescription = document.getElementById("groupDescription");
        elementos.groupStatus = document.getElementById("groupStatus");

        // Mensagens de erro
        elementos.groupNameError = document.getElementById("groupNameError");
        elementos.groupCategoryError = document.getElementById("groupCategoryError");
        elementos.groupExamsError = document.getElementById("groupExamsError");

        // Abas do Modal
        elementos.tabButtons = document.querySelectorAll("[data-tab]");
        elementos.tabPanels = document.querySelectorAll("[data-panel]");

        // Exames do Grupo
        elementos.groupExamsTableBody = document.getElementById("groupExamsTableBody");
        elementos.groupExamsEmpty = document.getElementById("groupExamsEmpty");
        elementos.groupExamsTableWrapper = document.getElementById("groupExamsTableWrapper");
        elementos.modalExamCount = document.getElementById("modalExamCount");
        elementos.addExamBtn = document.getElementById("addExamBtn");

        // Modal de Seleção de Exames
        elementos.examModal = document.getElementById("examModal");
        elementos.searchExam = document.getElementById("searchExam");
        elementos.filterExamType = document.getElementById("filterExamType");
        elementos.filterExamMaterial = document.getElementById("filterExamMaterial");
        elementos.filterExamStatus = document.getElementById("filterExamStatus");
        elementos.examResults = document.getElementById("examResults");
        elementos.examResultsEmpty = document.getElementById("examResultsEmpty");
        elementos.addSelectedExamsBtn = document.getElementById("addSelectedExamsBtn");

        // Modal de Confirmação e Toasts
        elementos.confirmModal = document.getElementById("confirmModal");
        elementos.confirmModalTitle = document.getElementById("confirmModalTitle");
        elementos.confirmModalMessage = document.getElementById("confirmModalMessage");
        elementos.confirmActionBtn = document.getElementById("confirmActionBtn");
        elementos.toastContainer = document.getElementById("toastContainer");

        // Auditoria
        elementos.auditCreatedBy = document.getElementById("auditCreatedBy");
        elementos.auditCreatedAt = document.getElementById("auditCreatedAt");
        elementos.auditUpdatedAt = document.getElementById("auditUpdatedAt");
        elementos.auditUpdatedBy = document.getElementById("auditUpdatedBy");
        elementos.auditHistory = document.getElementById("auditHistory");

        // Fechamento geral
        elementos.closeButtons = document.querySelectorAll("[data-close-modal]");
    }

    // Utilitários de formatação e segurança
    function escaparHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizarTexto(texto) {
        if (!texto) return "";
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function clonarDados(dados) {
        return JSON.parse(JSON.stringify(dados));
    }

    function obterProximoCodigo() {
        const maior = state.grupos.reduce((max, g) => {
            const num = parseInt(g.codigo, 10);
            return !isNaN(num) && num > max ? num : max;
        }, 0);
        return String(maior + 1).padStart(3, "0");
    }

    function obterExamePorId(id) {
        return state.exames.find((e) => e.id === Number(id));
    }

    // Renderização da Tabela Principal
    function filtrarGrupos() {
        const termoBusca = normalizarTexto(elementos.searchGroup.value);
        const cat = elementos.filterCategory.value;
        const esp = elementos.filterSpecialty.value;
        const stat = elementos.filterStatus.value;

        return state.grupos.filter((grupo) => {
            const matchBusca = !termoBusca || normalizarTexto(`${grupo.codigo} ${grupo.nome} ${grupo.sigla}`).includes(termoBusca);
            const matchCat = !cat || grupo.categoria === cat;
            const matchEsp = !esp || (grupo.especialidades && grupo.especialidades.includes(esp));
            const matchStat = !stat || grupo.status === stat;

            return matchBusca && matchCat && matchEsp && matchStat;
        });
    }

    function criarBadgeStatus(status) {
        const span = document.createElement("span");
        const ativo = status === "ATIVO";
        span.className = `status-badge ${ativo ? "status-badge-active" : "status-badge-inactive"}`;
        span.textContent = ativo ? "Ativo" : "Inativo";
        return span;
    }

    function renderizarTabela() {
        const gruposFiltrados = filtrarGrupos();
        const inicio = (state.paginaAtual - 1) * state.itensPorPagina;
        const gruposPagina = gruposFiltrados.slice(inicio, inicio + state.itensPorPagina);

        elementos.groupsTableBody.innerHTML = "";

        if (gruposPagina.length === 0) {
            atualizarEstadoLista(0);
            return;
        }

        gruposPagina.forEach((grupo) => {
            const linha = document.createElement("tr");
            linha.className = "group-row hover:bg-slate-50 transition";
            linha.dataset.id = grupo.id;

            linha.innerHTML = `
                <td class="px-4 py-4 font-semibold text-teal-700">
                    ${escaparHtml(grupo.codigo)}
                </td>
                <td class="px-4 py-4">
                    <span class="font-semibold text-slate-800 block">${escaparHtml(grupo.nome)}</span>
                    <span class="text-xs text-slate-500">${escaparHtml(grupo.sigla || "—")}</span>
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${escaparHtml(grupo.categoria)}
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${grupo.exames ? grupo.exames.length : 0} exames
                </td>
                <td class="px-4 py-4 status-cell"></td>
                <td class="px-4 py-4 text-right">
                    <div class="row-action-wrapper relative inline-block">
                        <button type="button" class="row-action-menu p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition" aria-label="Ações para ${escaparHtml(grupo.nome)}">
                            ⋮
                        </button>
                        <div class="row-action-list hidden absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg drop-down" role="menu">
                            <button type="button" data-action="view" class="row-action-item w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center" role="menuitem">Visualizar</button>
                            <button type="button" data-action="edit" class="row-action-item w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center" role="menuitem">Editar</button>
                            <button type="button" data-action="duplicate" class="row-action-item w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center" role="menuitem">Duplicar</button>
                            <button type="button" data-action="toggle" class="row-action-item w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center" role="menuitem">${grupo.status === "ATIVO" ? "Inativar" : "Ativar"}</button>
                            <button type="button" data-action="delete" class="row-action-item w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center" role="menuitem">Excluir</button>
                        </div>
                    </div>
                </td>
            `;

            linha.querySelector(".status-cell").appendChild(criarBadgeStatus(grupo.status));
            elementos.groupsTableBody.appendChild(linha);
        });

        atualizarEstadoLista(gruposFiltrados.length);
        atualizarPaginacao(gruposFiltrados.length, gruposPagina.length, inicio);
    }
    function atualizarEstadoLista(total) {
        const semResultados = total === 0;
        elementos.groupsTableWrapper.classList.toggle("hidden", semResultados);
        elementos.groupsEmptyState.classList.toggle("hidden", !semResultados);
        elementos.pagination.classList.toggle("hidden", semResultados);
    }

    function atualizarPaginacao(total, quantidadePagina, inicio) {
        const totalPaginas = Math.max(1, Math.ceil(total / state.itensPorPagina));

        elementos.resultCount.textContent = `${total} ${total === 1 ? "grupo encontrado" : "grupos encontrados"}`;
        elementos.paginationInfo.textContent = total ? `Exibindo ${inicio + 1}–${inicio + quantidadePagina} de ${total} grupos` : "Exibindo 0 grupos";
        elementos.currentPageLabel.textContent = `Página ${state.paginaAtual} de ${totalPaginas}`;

        elementos.previousPageBtn.disabled = state.paginaAtual <= 1;
        elementos.nextPageBtn.disabled = state.paginaAtual >= totalPaginas;
    }

    function limparFiltros() {
        elementos.searchGroup.value = "";
        elementos.filterCategory.value = "";
        elementos.filterSpecialty.value = "";
        elementos.filterStatus.value = "";
        state.paginaAtual = 1;
        renderizarTabela();
    }

    // Modais e Formulários
    function abrirModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        state.modalAnterior = document.activeElement;
        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");

        const primeiroFoco = modal.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])");
        window.setTimeout(() => primeiroFoco?.focus(), 50);
    }

    function fecharModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.classList.add("hidden");

        const algumModalAberto = document.querySelector(".modal:not(.hidden)");
        if (!algumModalAberto) {
            document.body.classList.remove("overflow-hidden");
        }

        state.modalAnterior?.focus?.();
        state.modalAnterior = null;
    }

    // Estado do Multi-Select de Especialidades
    const especialidadesDisponiveis = [
        "Clínica Médica",
        "Cardiologia",
        "Pediatria",
        "Ginecologia",
        "Neurologia",
        "Oftalmologia",
        "Dermatologia",
        "Ortopedia",
        "Endocrinologia",
        "Outras"
    ];
    let selectedSpecialties = new Set();

    function setSpecialtiesValues(valores = []) {
        selectedSpecialties = new Set(valores);
        renderSpecialtiesTags();
        syncSpecialtiesWithSelect();
    }

    function renderSpecialtiesTags() {
        const container = document.getElementById("specialtiesTags");
        if (!container) return;

        container.innerHTML = "";

        selectedSpecialties.forEach((esp) => {
            const pill = document.createElement("span");
            pill.className = "specialty-pill";
            pill.innerHTML = `
                <span>${escaparHtml(esp)}</span>
                <button type="button" class="specialty-pill-remove" aria-label="Remover ${escaparHtml(esp)}" data-remove-specialty="${escaparHtml(esp)}">
                    &times;
                </button>
            `;
            container.appendChild(pill);
        });
    }

    function syncSpecialtiesWithSelect() {
        const select = elementos.groupSpecialties;
        if (!select) return;

        [...select.options].forEach((option) => {
            option.selected = selectedSpecialties.has(option.value);
        });
    }

    function renderSpecialtiesDropdownOptions(filtro = "") {
        const listContainer = document.getElementById("specialtiesOptionsList");
        const noResults = document.getElementById("specialtiesNoResults");
        if (!listContainer) return;

        listContainer.innerHTML = "";
        const termo = normalizarTexto(filtro);

        const filtrados = especialidadesDisponiveis.filter((esp) =>
            !termo || normalizarTexto(esp).includes(termo)
        );

        if (filtrados.length === 0) {
            noResults?.classList.remove("hidden");
            return;
        }
        noResults?.classList.add("hidden");

        filtrados.forEach((esp) => {
            const isSelected = selectedSpecialties.has(esp);
            const item = document.createElement("div");
            item.className = `specialties-dropdown-option ${isSelected ? "is-selected" : ""}`;
            item.setAttribute("role", "option");
            item.setAttribute("aria-selected", String(isSelected));
            item.dataset.specialtyValue = esp;

            item.innerHTML = `
                <span class="flex items-center gap-2">
                    <input type="checkbox" ${isSelected ? "checked" : ""} class="h-4 w-4 rounded border-slate-300 accent-teal-600 text-teal-600 focus:ring-teal-500 pointer-events-none">
                    <span>${escaparHtml(esp)}</span>
                </span>
                ${isSelected ? '<span class="text-teal-600 font-bold text-xs">✓</span>' : ""}
            `;
            listContainer.appendChild(item);
        });
    }

    function toggleSpecialtyOption(esp) {
        if (selectedSpecialties.has(esp)) {
            selectedSpecialties.delete(esp);
        } else {
            selectedSpecialties.add(esp);
        }
        renderSpecialtiesTags();
        syncSpecialtiesWithSelect();
        const searchInput = document.getElementById("specialtySearchInput");
        renderSpecialtiesDropdownOptions(searchInput ? searchInput.value : "");
    }

    function openSpecialtiesDropdown() {
        const dropdown = document.getElementById("specialtiesDropdown");
        const input = document.getElementById("specialtySearchInput");
        if (!dropdown) return;

        dropdown.classList.remove("hidden");
        input?.setAttribute("aria-expanded", "true");
        renderSpecialtiesDropdownOptions(input ? input.value : "");
    }

    function closeSpecialtiesDropdown() {
        const dropdown = document.getElementById("specialtiesDropdown");
        const input = document.getElementById("specialtySearchInput");
        if (!dropdown) return;

        dropdown.classList.add("hidden");
        input?.setAttribute("aria-expanded", "false");
    }

    function toggleSpecialtiesDropdown() {
        const dropdown = document.getElementById("specialtiesDropdown");
        if (dropdown?.classList.contains("hidden")) {
            openSpecialtiesDropdown();
        } else {
            closeSpecialtiesDropdown();
        }
    }

    function configurarNovoGrupo() {
        state.grupoAtual = null;

        elementos.groupModalTitle.textContent = "Novo Grupo de Exames";
        elementos.saveGroupLabel.textContent = "Salvar Grupo";
        elementos.groupForm.reset();

        elementos.groupCode.value = obterProximoCodigo();
        elementos.groupStatus.checked = true;
        
        // Reset de erros
        elementos.groupName?.setAttribute("aria-invalid", "false");
        elementos.groupCategory?.setAttribute("aria-invalid", "false");
        elementos.groupNameError?.classList.add("hidden");
        elementos.groupCategoryError?.classList.add("hidden");
        elementos.groupExamsError.textContent = "";

        setSpecialtiesValues([]);
        const searchInput = document.getElementById("specialtySearchInput");
        if (searchInput) searchInput.value = "";
        closeSpecialtiesDropdown();

        renderizarExamesDoGrupo([]);
        selecionarAba("general");
        abrirModal("groupModal");
    }

    function abrirEdicao(grupo, somenteVisualizacao = false) {
        state.grupoAtual = clonarDados(grupo);

        elementos.groupModalTitle.textContent = somenteVisualizacao ? "Visualizar Grupo de Exames" : "Editar Grupo de Exames";
        elementos.saveGroupLabel.textContent = somenteVisualizacao ? "Fechar" : "Salvar Alterações";

        preencherFormulario(grupo);
        renderizarExamesDoGrupo(grupo.exames || []);
        preencherAuditoria(grupo);
        selecionarAba("general");

        setFormularioSomenteLeitura(somenteVisualizacao);
        abrirModal("groupModal");
    }

    function preencherFormulario(grupo) {
        elementos.groupId.value = grupo.id || "";
        elementos.groupCode.value = grupo.codigo || "";
        elementos.groupName.value = grupo.nome || "";
        elementos.groupShortName.value = grupo.sigla || "";
        elementos.groupCategory.value = grupo.categoria || "";
        elementos.groupDescription.value = grupo.descricao || "";
        elementos.groupStatus.checked = grupo.status === "ATIVO";

        setSpecialtiesValues(grupo.especialidades || []);
        const searchInput = document.getElementById("specialtySearchInput");
        if (searchInput) searchInput.value = "";
        closeSpecialtiesDropdown();

        preencherCampo("generalPreparation", grupo.preparoGeral);
        preencherCampo("patientInstructions", grupo.orientacoesPaciente);
        preencherCampo("internalNotes", grupo.observacoesInternas);
        selecionarValores(document.getElementById("acceptedAgreements"), grupo.convenios || []);
        preencherCampo("priceTable", grupo.tabelaPreco);
        preencherCampo("tussCode", grupo.codigoTuss);
        preencherCampo("cbhpmCode", grupo.codigoCbhpm);
        preencherCampo("groupPrice", grupo.valor);
        preencherCampo("requiresScheduling", grupo.necessitaAgendamento, true);
        preencherCampo("requiresAuthorization", grupo.necessitaAutorizacao, true);
        preencherCampo("executionLocation", grupo.localRealizacao);
        preencherCampo("room", grupo.sala);
        preencherCampo("equipment", grupo.equipamento);
        preencherCampo("estimatedTime", grupo.tempoEstimado);
        preencherCampo("responsibleProfessional", grupo.profissionalResponsavel);
        preencherCampo("resultDeadline", grupo.prazoResultado);
    }

    function preencherCampo(id, valor, checkbox = false) {
        const campo = document.getElementById(id);
        if (!campo) return;

        if (checkbox) {
            campo.checked = Boolean(valor);
        } else {
            campo.value = valor || "";
        }
    }

    function selecionarValores(select, valores) {
        if (!select) return;
        [...select.options].forEach((option) => {
            option.selected = valores.includes(option.value);
        });
    }

    function setFormularioSomenteLeitura(somenteLeitura) {
        elementos.groupForm.querySelectorAll("input, select, textarea, button").forEach((campo) => {
            if (campo.closest(".modal-header") || campo.closest(".modal-tabs")) return;
            if (campo.dataset.closeModal) return;
            campo.disabled = somenteLeitura;
        });
    }

    function selecionarAba(nome) {
        elementos.tabButtons.forEach((botao) => {
            const ativo = botao.dataset.tab === nome;
            botao.classList.toggle("is-active", ativo);
            botao.setAttribute("aria-selected", String(ativo));
        });

        elementos.tabPanels.forEach((painel) => {
            painel.classList.toggle("hidden", painel.dataset.panel !== nome);
        });
    }

    // Exames do Grupo
    function renderizarExamesDoGrupo(itens) {
        const examesOrdenados = [...itens].sort((a, b) => a.ordem - b.ordem);

        elementos.groupExamsTableBody.innerHTML = "";
        elementos.modalExamCount.textContent = examesOrdenados.length;

        const vazio = examesOrdenados.length === 0;
        elementos.groupExamsEmpty.classList.toggle("hidden", !vazio);
        elementos.groupExamsTableWrapper.classList.toggle("hidden", vazio);

        examesOrdenados.forEach((item, indice) => {
            const exame = item.dados || obterExamePorId(item.exameId);
            if (!exame) return;

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td class="px-4 py-4 font-semibold text-slate-700">${indice + 1}</td>
                <td class="px-4 py-4 font-medium text-teal-700">${escaparHtml(exame.codigo)}</td>
                <td class="px-4 py-4"><span class="font-semibold text-slate-800">${escaparHtml(exame.nome)}</span></td>
                <td class="px-4 py-4 text-slate-600">${escaparHtml(exame.tipo)}</td>
                <td class="px-4 py-4 text-slate-600">${escaparHtml(exame.material)}</td>
                <td class="px-4 py-4">
                    <span class="status-badge ${exame.status === "ATIVO" ? "status-badge-active" : "status-badge-inactive"}">
                        ${exame.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </span>
                </td>
                <td class="px-4 py-4 text-right">
                    <div class="exam-order-actions justify-end flex items-center gap-1">
                        <button type="button" class="exam-order-button p-1 text-slate-500 hover:text-teal-700 disabled:opacity-30" data-move-exam="up" data-exam-id="${exame.id}" aria-label="Mover ${escaparHtml(exame.nome)} para cima" ${indice === 0 ? "disabled" : ""}>↑</button>
                        <button type="button" class="exam-order-button p-1 text-slate-500 hover:text-teal-700 disabled:opacity-30" data-move-exam="down" data-exam-id="${exame.id}" aria-label="Mover ${escaparHtml(exame.nome)} para baixo" ${indice === examesOrdenados.length - 1 ? "disabled" : ""}>↓</button>
                        <button type="button" class="exam-remove-button p-1 text-red-500 hover:text-red-700" data-remove-exam="${exame.id}" aria-label="Remover ${escaparHtml(exame.nome)}">×</button>
                    </div>
                </td>
            `;
            elementos.groupExamsTableBody.appendChild(linha);
        });
    }

    function abrirModalExames() {
        state.examesSelecionados.clear();
        renderizarResultadosExames();
        atualizarBotaoAdicionarExames();
        abrirModal("examModal");
    }

    function obterFiltrosExames() {
        return {
            busca: normalizarTexto(elementos.searchExam.value),
            tipo: elementos.filterExamType.value,
            material: elementos.filterExamMaterial.value,
            status: elementos.filterExamStatus.value
        };
    }

    function renderizarResultadosExames() {
        const filtros = obterFiltrosExames();
        const grupo = state.grupoAtual;
        const idsAtuais = new Set(grupo?.exames?.map((item) => item.exameId) || []);

        const resultados = state.exames.filter((exame) => {
            const correspondeBusca = !filtros.busca || normalizarTexto(`${exame.codigo} ${exame.nome} ${exame.tipo}`).includes(filtros.busca);
            const correspondeTipo = !filtros.tipo || exame.tipo === filtros.tipo;
            const correspondeMaterial = !filtros.material || exame.material === filtros.material;
            const correspondeStatus = !filtros.status || exame.status === filtros.status;

            return correspondeBusca && correspondeTipo && correspondeMaterial && correspondeStatus;
        });

        elementos.examResults.innerHTML = "";
        elementos.examResultsEmpty.classList.toggle("hidden", resultados.length > 0);

        resultados.forEach((exame) => {
            const jaPertence = idsAtuais.has(exame.id);
            const selecionado = state.examesSelecionados.has(exame.id);

            const item = document.createElement("label");
            item.className = `exam-option flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition ${jaPertence ? "opacity-60" : ""}`;

            item.innerHTML = `
                <input type="checkbox" class="exam-checkbox h-5 w-5 accent-teal-600" data-select-exam="${exame.id}" ${selecionado ? "checked" : ""} ${jaPertence ? "disabled" : ""}>
                <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold text-slate-800">${escaparHtml(exame.nome)}</span>
                    <span class="mt-1 block text-xs text-slate-500">${escaparHtml(exame.codigo)} · ${escaparHtml(exame.tipo)} · ${escaparHtml(exame.material)}</span>
                </span>
                <span class="status-badge ${exame.status === "ATIVO" ? "status-badge-active" : "status-badge-inactive"}">
                    ${exame.status === "ATIVO" ? "Ativo" : "Inativo"}
                </span>
            `;
            elementos.examResults.appendChild(item);
        });
    }

    function atualizarBotaoAdicionarExames() {
        elementos.addSelectedExamsBtn.disabled = state.examesSelecionados.size === 0;
    }
    function adicionarExamesSelecionados() {
        if (!state.grupoAtual) {
            state.grupoAtual = { exames: [] };
        }

        const examesAtuais = state.grupoAtual.exames || [];
        const idsAtuais = new Set(examesAtuais.map((item) => item.exameId));
        const maiorOrdem = Math.max(0, ...examesAtuais.map((item) => item.ordem));

        let ordem = maiorOrdem;

        state.examesSelecionados.forEach((exameId) => {
            if (idsAtuais.has(exameId)) return;

            ordem += 1;
            examesAtuais.push({
                exameId,
                ordem
            });
        });

        state.grupoAtual.exames = examesAtuais;
        renderizarExamesDoGrupo(examesAtuais);
        fecharModal("examModal");
        selecionarAba("exams");

        mostrarToast("Exames adicionados ao grupo.", "success");
    }

    function removerExameDoGrupo(exameId) {
        if (!state.grupoAtual) return;

        state.grupoAtual.exames = (state.grupoAtual.exames || [])
            .filter((item) => item.exameId !== Number(exameId))
            .map((item, indice) => ({
                ...item,
                ordem: indice + 1
            }));

        renderizarExamesDoGrupo(state.grupoAtual.exames);
        mostrarToast("Exame removido do grupo.", "success");
    }

    function moverExame(exameId, direcao) {
        if (!state.grupoAtual) return;

        const itens = [...(state.grupoAtual.exames || [])].sort((a, b) => a.ordem - b.ordem);
        const indiceAtual = itens.findIndex((item) => item.exameId === Number(exameId));
        const novoIndice = direcao === "up" ? indiceAtual - 1 : indiceAtual + 1;

        if (indiceAtual < 0 || novoIndice < 0 || novoIndice >= itens.length) return;

        [itens[indiceAtual], itens[novoIndice]] = [itens[novoIndice], itens[indiceAtual]];

        state.grupoAtual.exames = itens.map((item, indice) => ({
            ...item,
            ordem: indice + 1
        }));

        renderizarExamesDoGrupo(state.grupoAtual.exames);
    }

    // Formulário
    function coletarDadosFormulario() {
        const selecionar = (campo) => [...campo.selectedOptions].map((option) => option.value);

        return {
            nome: elementos.groupName.value.trim(),
            sigla: elementos.groupShortName.value.trim().toUpperCase(),
            categoria: elementos.groupCategory.value,
            especialidades: selecionar(elementos.groupSpecialties),
            descricao: elementos.groupDescription.value.trim(),
            status: elementos.groupStatus.checked ? "ATIVO" : "INATIVO",
            exames: clonarDados(state.grupoAtual?.exames || []),
            preparoGeral: document.getElementById("generalPreparation").value.trim(),
            orientacoesPaciente: document.getElementById("patientInstructions").value.trim(),
            observacoesInternas: document.getElementById("internalNotes").value.trim(),
            convenios: selecionar(document.getElementById("acceptedAgreements")),
            tabelaPreco: document.getElementById("priceTable").value,
            codigoTuss: document.getElementById("tussCode").value.trim(),
            codigoCbhpm: document.getElementById("cbhpmCode").value.trim(),
            valor: document.getElementById("groupPrice").value,
            necessitaAgendamento: document.getElementById("requiresScheduling").checked,
            necessitaAutorizacao: document.getElementById("requiresAuthorization").checked,
            localRealizacao: document.getElementById("executionLocation").value,
            sala: document.getElementById("room").value.trim(),
            equipamento: document.getElementById("equipment").value.trim(),
            tempoEstimado: document.getElementById("estimatedTime").value,
            profissionalResponsavel: document.getElementById("responsibleProfessional").value,
            prazoResultado: document.getElementById("resultDeadline").value.trim()
        };
    }

    function validarFormulario(dados) {
        let valido = true;
        let primeiroCampoInvalido = null;

        elementos.groupName.setAttribute("aria-invalid", "false");
        elementos.groupCategory.setAttribute("aria-invalid", "false");
        
        elementos.groupNameError.classList.add("hidden");
        elementos.groupNameError.innerHTML = "";
        
        elementos.groupCategoryError.classList.add("hidden");
        elementos.groupCategoryError.innerHTML = "";
        
        elementos.groupExamsError.textContent = "";

        const iconeErro = `<svg class="h-4 w-4 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

        if (!dados.nome) {
            elementos.groupName.setAttribute("aria-invalid", "true");
            elementos.groupNameError.innerHTML = `${iconeErro} <span>O nome do grupo é obrigatório.</span>`;
            elementos.groupNameError.classList.remove("hidden");
            valido = false;
            if (!primeiroCampoInvalido) primeiroCampoInvalido = elementos.groupName;
        }

        if (!dados.categoria) {
            elementos.groupCategory.setAttribute("aria-invalid", "true");
            elementos.groupCategoryError.innerHTML = `${iconeErro} <span>Selecione uma categoria válida.</span>`;
            elementos.groupCategoryError.classList.remove("hidden");
            valido = false;
            if (!primeiroCampoInvalido) primeiroCampoInvalido = elementos.groupCategory;
        }

        if (!dados.exames.length) {
            elementos.groupExamsError.textContent = "Adicione pelo menos um exame ao grupo.";
            valido = false;
        }

        if (!valido) {
            if (primeiroCampoInvalido) {
                selecionarAba("general");
                primeiroCampoInvalido.focus();
            } else if (!dados.exames.length) {
                selecionarAba("exams");
            }
            mostrarToast("Por favor, preencha os campos obrigatórios destacados.", "error");
        }

        return valido;
    }

    async function salvarGrupo(event) {
        event.preventDefault();

        if (elementos.saveGroupLabel.textContent === "Fechar") {
            fecharModal("groupModal");
            return;
        }

        const dados = coletarDadosFormulario();
        if (!validarFormulario(dados)) return;

        elementos.saveGroupBtn.disabled = true;

        try {
            if (state.grupoAtual?.id) {
                await atualizarGrupo(state.grupoAtual.id, dados);
                mostrarToast("Grupo atualizado com sucesso.", "success");
            } else {
                await criarGrupo(dados);
                mostrarToast("Grupo de exames criado com sucesso.", "success");
            }

            fecharModal("groupModal");
            state.paginaAtual = 1;
            renderizarTabela();
        } catch (erro) {
            mostrarToast("Não foi possível salvar o grupo.", "error");
        } finally {
            elementos.saveGroupBtn.disabled = false;
        }
    }

    // Ações da Tabela
    function executarAcaoGrupo(acao, id) {
        const grupo = state.grupos.find((item) => item.id === Number(id));
        if (!grupo) return;

        switch (acao) {
            case "view":
                abrirEdicao(grupo, true);
                break;
            case "edit":
                abrirEdicao(grupo, false);
                break;
            case "duplicate":
                duplicarGrupo(grupo);
                break;
            case "toggle":
                confirmarAlteracaoStatus(grupo);
                break;
            case "delete":
                confirmarExclusao(grupo);
                break;
        }
    }

    function duplicarGrupo(grupo) {
        state.grupoAtual = {
            ...clonarDados(grupo),
            id: null,
            codigo: obterProximoCodigo(),
            nome: `${grupo.nome} - Cópia`,
            sigla: grupo.sigla ? `${grupo.sigla}2` : "",
            status: "ATIVO"
        };

        elementos.groupModalTitle.textContent = "Novo Grupo de Exames";
        elementos.saveGroupLabel.textContent = "Salvar Grupo";

        preencherFormulario(state.grupoAtual);
        renderizarExamesDoGrupo(state.grupoAtual.exames);
        setFormularioSomenteLeitura(false);
        selecionarAba("general");
        abrirModal("groupModal");
    }

    function confirmarExclusao(grupo) {
        elementos.confirmModalTitle.textContent = "Excluir Grupo de Exames?";
        elementos.confirmModalMessage.textContent = `O grupo "${grupo.nome}" será excluído. Essa ação não poderá ser desfeita.`;
        elementos.confirmActionBtn.textContent = "Excluir";
        elementos.confirmActionBtn.className = "inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-5 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2";

        state.acaoConfirmada = { tipo: "excluir", id: grupo.id };
        abrirModal("confirmModal");
    }

    function confirmarAlteracaoStatus(grupo) {
        const ativar = grupo.status === "INATIVO";

        elementos.confirmModalTitle.textContent = ativar ? "Ativar Grupo de Exames?" : "Inativar Grupo de Exames?";
        elementos.confirmModalMessage.textContent = ativar ? `Tem certeza que deseja ativar o grupo "${grupo.nome}"?` : `Tem certeza que deseja inativar o grupo "${grupo.nome}"?`;

        elementos.confirmActionBtn.textContent = ativar ? "Ativar" : "Inativar";
        elementos.confirmActionBtn.className = ativar ? "action-primary inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-600 px-5 font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2" : "inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-5 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2";

        state.acaoConfirmada = { tipo: "status", id: grupo.id };
        abrirModal("confirmModal");
    }

    async function executarConfirmacao() {
        if (!state.acaoConfirmada) return;

        const { tipo, id } = state.acaoConfirmada;
        const grupo = state.grupos.find((item) => item.id === id);

        try {
            if (tipo === "excluir") {
                await excluirGrupo(id);
                mostrarToast("Grupo excluído com sucesso.", "success");
            }

            if (tipo === "status" && grupo) {
                const novoStatus = grupo.status === "ATIVO" ? "INATIVO" : "ATIVO";
                await atualizarGrupo(id, { ...grupo, status: novoStatus });
                mostrarToast(novoStatus === "ATIVO" ? "Grupo ativado com sucesso." : "Grupo inativado com sucesso.", "success");
            }

            fecharModal("confirmModal");
            renderizarTabela();
        } catch (erro) {
            mostrarToast("Não foi possível concluir a ação.", "error");
        } finally {
            state.acaoConfirmada = null;
        }
    }

    // Auditoria
    function preencherAuditoria(grupo) {
        elementos.auditCreatedBy.textContent = grupo.criadoPor || "—";
        elementos.auditCreatedAt.textContent = grupo.criadoEm || "—";
        elementos.auditUpdatedAt.textContent = grupo.atualizadoEm || "—";
        elementos.auditUpdatedBy.textContent = grupo.alteradoPor || "—";

        elementos.auditHistory.innerHTML = "";

        (grupo.historico || []).forEach((evento, indice) => {
            const item = document.createElement("li");
            item.className = "relative";
            item.innerHTML = `
                <span class="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${indice === 0 ? "bg-teal-600" : "bg-slate-400"}"></span>
                <time class="text-xs text-slate-500">${escaparHtml(evento.data)}</time>
                <p class="mt-1 text-sm font-medium text-slate-800">${escaparHtml(evento.usuario)}: ${escaparHtml(evento.descricao)}</p>
            `;
            elementos.auditHistory.appendChild(item);
        });
    }

    // Toasts
    function mostrarToast(mensagem, tipo = "info", titulo = "") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${tipo} flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl`;

        const titulos = { success: "Sucesso", error: "Erro", warning: "Atenção", info: "Informação" };
        const icones = { success: "✓", error: "!", warning: "!", info: "i" };

        toast.innerHTML = `
            <span class="toast-icon font-bold text-teal-700">${icones[tipo] || icones.info}</span>
            <div class="toast-content flex-1">
                <p class="toast-title font-semibold text-slate-800">${escaparHtml(titulo || titulos[tipo])}</p>
                <p class="toast-message text-sm text-slate-600">${escaparHtml(mensagem)}</p>
            </div>
            <button type="button" class="toast-close text-slate-400 hover:text-slate-600" aria-label="Fechar notificação">×</button>
        `;

        elementos.toastContainer.appendChild(toast);

        const remover = () => {
            toast.classList.add("is-leaving");
            window.setTimeout(() => toast.remove(), 180);
        };

        toast.querySelector(".toast-close").addEventListener("click", remover);
        window.setTimeout(remover, 4500);
    }

    // Menu de Ações (Smart Positioning)
    let activeMenu = null;

    function openRowMenu(button) {
        const wrapper = button.closest(".row-action-wrapper");
        const menu = wrapper.querySelector(".row-action-list");

        if (activeMenu && activeMenu !== menu) {
            closeRowMenu(activeMenu);
        }

        const rect = button.getBoundingClientRect();
        const menuHeight = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        menu.classList.remove("drop-down", "drop-up");

        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            menu.classList.add("drop-up");
        } else {
            menu.classList.add("drop-down");
        }

        menu.classList.remove("hidden");
        menu.offsetHeight;
        menu.classList.add("is-visible");
        button.setAttribute("aria-expanded", "true");
        activeMenu = menu;
    }

    function closeRowMenu(menu) {
        if (!menu) return;
        const wrapper = menu.closest(".row-action-wrapper");
        const button = wrapper ? wrapper.querySelector(".row-action-menu") : null;

        menu.classList.remove("is-visible");
        if (button) button.removeAttribute("aria-expanded");

        setTimeout(() => {
            menu.classList.add("hidden");
        }, 180);

        if (activeMenu === menu) {
            activeMenu = null;
        }
    }

    function toggleRowMenu(button) {
        const wrapper = button.closest(".row-action-wrapper");
        const menu = wrapper.querySelector(".row-action-list");
        const isOpen = menu.classList.contains("is-visible");

        if (isOpen) {
            closeRowMenu(menu);
        } else {
            openRowMenu(button);
        }
    }

    // Configuração de Eventos Globais
    function configurarEventos() {
        elementos.newGroupBtn.addEventListener("click", configurarNovoGrupo);
        elementos.emptyCreateBtn.addEventListener("click", configurarNovoGrupo);

        // Limpeza de erros em tempo real
        elementos.groupName?.addEventListener("input", () => {
            if (elementos.groupName.value.trim()) {
                elementos.groupName.setAttribute("aria-invalid", "false");
                elementos.groupNameError?.classList.add("hidden");
            }
        });

        elementos.groupCategory?.addEventListener("change", () => {
            if (elementos.groupCategory.value) {
                elementos.groupCategory.setAttribute("aria-invalid", "false");
                elementos.groupCategoryError?.classList.add("hidden");
            }
        });

        // Componente Multi-Select de Especialidades
        const searchInput = document.getElementById("specialtySearchInput");
        const toggleBtn = document.getElementById("specialtyDropdownToggle");
        const clearBtn = document.getElementById("clearAllSpecialtiesBtn");

        if (searchInput) {
            searchInput.addEventListener("focus", () => openSpecialtiesDropdown());
            searchInput.addEventListener("click", () => openSpecialtiesDropdown());
            searchInput.addEventListener("input", (e) => {
                openSpecialtiesDropdown();
                renderSpecialtiesDropdownOptions(e.target.value);
            });
            searchInput.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    closeSpecialtiesDropdown();
                } else if (e.key === "Backspace" && !searchInput.value && selectedSpecialties.size > 0) {
                    const arr = Array.from(selectedSpecialties);
                    const last = arr[arr.length - 1];
                    if (last) toggleSpecialtyOption(last);
                }
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleSpecialtiesDropdown();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                selectedSpecialties.clear();
                renderSpecialtiesTags();
                syncSpecialtiesWithSelect();
                renderSpecialtiesDropdownOptions(searchInput ? searchInput.value : "");
            });
        }

        [elementos.searchGroup, elementos.filterCategory, elementos.filterSpecialty, elementos.filterStatus].forEach((campo) => {
            campo?.addEventListener("input", () => { state.paginaAtual = 1; renderizarTabela(); });
            campo?.addEventListener("change", () => { state.paginaAtual = 1; renderizarTabela(); });
        });

        elementos.clearFiltersBtn.addEventListener("click", limparFiltros);

        elementos.previousPageBtn.addEventListener("click", () => {
            if (state.paginaAtual > 1) { state.paginaAtual -= 1; renderizarTabela(); }
        });

        elementos.nextPageBtn.addEventListener("click", () => {
            const total = filtrarGrupos().length;
            const totalPaginas = Math.ceil(total / state.itensPorPagina);
            if (state.paginaAtual < totalPaginas) { state.paginaAtual += 1; renderizarTabela(); }
        });

        elementos.groupForm.addEventListener("submit", salvarGrupo);
        elementos.addExamBtn.addEventListener("click", abrirModalExames);
        elementos.addSelectedExamsBtn.addEventListener("click", adicionarExamesSelecionados);

        [elementos.searchExam, elementos.filterExamType, elementos.filterExamMaterial, elementos.filterExamStatus].forEach((campo) => {
            campo?.addEventListener("input", renderizarResultadosExames);
            campo?.addEventListener("change", renderizarResultadosExames);
        });

        elementos.confirmActionBtn.addEventListener("click", executarConfirmacao);
        elementos.retryGroupsBtn.addEventListener("click", inicializar);

        elementos.tabButtons.forEach((botao) => {
            botao.addEventListener("click", () => { selecionarAba(botao.dataset.tab); });
        });

        elementos.closeButtons.forEach((botao) => {
            botao.addEventListener("click", () => { fecharModal(botao.dataset.closeModal); });
        });

        document.addEventListener("click", (event) => {
            // Remoção de tag de especialidade
            const removeSpecialtyBtn = event.target.closest("[data-remove-specialty]");
            if (removeSpecialtyBtn) {
                event.stopPropagation();
                toggleSpecialtyOption(removeSpecialtyBtn.dataset.removeSpecialty);
                return;
            }

            // Seleção de opção no dropdown de especialidades (permanece aberto!)
            const specialtyOption = event.target.closest("[data-specialty-value]");
            if (specialtyOption) {
                event.stopPropagation();
                toggleSpecialtyOption(specialtyOption.dataset.specialtyValue);
                return;
            }

            // Fechar dropdown de especialidades se clicar fora
            const specialtiesMultiSelect = document.getElementById("specialtiesMultiSelect");
            if (specialtiesMultiSelect && !specialtiesMultiSelect.contains(event.target)) {
                closeSpecialtiesDropdown();
            }

            const menuButton = event.target.closest(".row-action-menu");
            if (menuButton) {
                event.stopPropagation();
                toggleRowMenu(menuButton);
                return;
            }

            const actionButton = event.target.closest("[data-action]");
            if (actionButton) {
                const linha = actionButton.closest(".group-row");
                const id = linha?.dataset.id;
                if (id) {
                    executarAcaoGrupo(actionButton.dataset.action, id);
                    closeRowMenu(activeMenu);
                }
            }

            const removeButton = event.target.closest("[data-remove-exam]");
            if (removeButton) {
                removerExameDoGrupo(removeButton.dataset.removeExam);
            }

            const moveButton = event.target.closest("[data-move-exam]");
            if (moveButton) {
                moverExame(moveButton.dataset.examId, moveButton.dataset.moveExam);
            }

            const checkbox = event.target.closest("[data-select-exam]");
            if (checkbox) {
                const exameId = Number(checkbox.dataset.selectExam);
                if (checkbox.checked) {
                    state.examesSelecionados.add(exameId);
                } else {
                    state.examesSelecionados.delete(exameId);
                }
                atualizarBotaoAdicionarExames();
            }

            if (activeMenu) {
                const isInsideMenu = activeMenu.contains(event.target);
                const isButton = event.target.closest(".row-action-menu");
                if (!isInsideMenu && !isButton) {
                    closeRowMenu(activeMenu);
                }
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeSpecialtiesDropdown();
                if (activeMenu) {
                    closeRowMenu(activeMenu);
                }
                document.querySelectorAll(".modal:not(.hidden)").forEach((modal) => {
                    fecharModal(modal.id);
                });
            }
        });
    }

    function simularCarregamento(callback) {
        elementos.groupsSkeleton.classList.remove("hidden");
        elementos.groupsTableWrapper.classList.add("hidden");
        elementos.groupsEmptyState.classList.add("hidden");
        elementos.groupsErrorState.classList.add("hidden");

        window.setTimeout(() => {
            elementos.groupsSkeleton.classList.add("hidden");
            callback();
        }, 350);
    }

    function inicializar() {
        cacheElements();
        state.exames = clonarDados(typeof mockExames !== "undefined" ? mockExames : []);
        state.grupos = clonarDados(typeof mockGrupos !== "undefined" ? mockGrupos : []);

        configurarEventos();

        simularCarregamento(() => {
            renderizarTabela();
        });
    }

    // Funções simuladas para persistência ou API (caso não estejam declaradas globalmente)
    if (typeof window.criarGrupo === "undefined") {
        window.criarGrupo = async (dados) => { dados.id = Date.now(); state.grupos.push(dados); };
    }
    if (typeof window.atualizarGrupo === "undefined") {
        window.atualizarGrupo = async (id, dados) => { const idx = state.grupos.findIndex(g => g.id === Number(id)); if (idx !== -1) state.grupos[idx] = { ...state.grupos[idx], ...dados }; };
    }
    if (typeof window.excluirGrupo === "undefined") {
        window.excluirGrupo = async (id) => { state.grupos = state.grupos.filter(g => g.id !== Number(id)); };
    }

    inicializar();
})();