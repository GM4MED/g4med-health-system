(() => {
  "use strict";

  const state = {
    groups: [],
    types: [],
    procedures: [],
    units: [
      "Unidade Centro",
      "Unidade Norte",
      "Unidade Sul",
      "Unidade Leste",
      "Unidade Oeste"
    ],
    rooms: [
      "Consultório 01",
      "Consultório 02",
      "Sala de Triagem",
      "Sala de Procedimentos",
      "Centro Cirúrgico"
    ],
    professionals: [
      "Dr. Carlos Mendes",
      "Dra. Ana Oliveira",
      "Dr. Marcos Silva",
      "Dra. Juliana Costa"
    ],
    specialties: [
      "Clínica Médica",
      "Cardiologia",
      "Pediatria",
      "Ginecologia",
      "Ortopedia",
      "Radiologia",
      "Enfermagem",
      "Nutrição",
      "Psicologia"
    ],
    currentGroup: null,
    selectedTypeIds: new Set(),
    selectedProcedureIds: new Set(),
    pendingAction: null,
    page: 1,
    pageSize: 10,
    eventsBound: false,
    lastFocusedElement: null
  };

  const el = {};

  const categories = [
    "Ambulatorial",
    "Consulta",
    "Retorno",
    "Urgência",
    "Emergência",
    "Internação",
    "Diagnóstico",
    "Terapêutico",
    "Cirúrgico",
    "Preventivo",
    "Teleatendimento",
    "Multiprofissional",
    "Outros"
  ];

  const proceduresMock = [
    ["PROC001", "Consulta Clínica", "Clínica Médica", 30],
    ["PROC002", "Consulta Cardiológica", "Cardiologia", 40],
    ["PROC003", "Consulta Pediátrica", "Pediatria", 30],
    ["PROC004", "Eletrocardiograma", "Cardiologia", 20],
    ["PROC005", "Holter", "Cardiologia", 30],
    ["PROC006", "MAPA", "Cardiologia", 30],
    ["PROC007", "Ultrassonografia abdominal", "Radiologia", 40],
    ["PROC008", "Radiografia de tórax", "Radiologia", 20],
    ["PROC009", "Pequena cirurgia", "Cirurgia", 60],
    ["PROC010", "Curativo simples", "Enfermagem", 20]
  ];

  const typesMock = [
    ["TA001", "Primeira Consulta", "Clínica Médica", 40, "Presencial"],
    ["TA002", "Consulta de Retorno", "Clínica Médica", 20, "Presencial"],
    ["TA003", "Consulta Cardiológica", "Cardiologia", 40, "Presencial"],
    ["TA004", "Teleconsulta", "Clínica Médica", 30, "Online"],
    ["TA005", "Triagem Inicial", "Enfermagem", 15, "Presencial"],
    ["TA006", "Pronto Atendimento", "Clínica Médica", 30, "Presencial"],
    ["TA007", "Atendimento Domiciliar", "Clínica Médica", 60, "Domiciliar"],
    ["TA008", "Consulta Pediátrica", "Pediatria", 30, "Presencial"],
    ["TA009", "Avaliação Ortopédica", "Ortopedia", 40, "Presencial"],
    ["TA010", "Atendimento Multiprofissional", "Nutrição", 50, "Presencial"],
    ["TA011", "Consulta por Telemedicina", "Cardiologia", 30, "Online"],
    ["TA012", "Retorno Cardiológico", "Cardiologia", 20, "Presencial"]
  ];

  function cacheElements() {
    const ids = [
      "newGroupBtn",
      "emptyCreateBtn",
      "topSearch",
      "groupSearch",
      "filterCategory",
      "filterStatus",
      "filterUnit",
      "clearFiltersBtn",
      "groupTableBody",
      "groupsTableWrapper",
      "groupsLoading",
      "groupsEmptyState",
      "groupsErrorState",
      "retryBtn",
      "resultCount",
      "pagination",
      "paginationInfo",
      "pageLabel",
      "previousPageBtn",
      "nextPageBtn",
      "totalGroupsMetric",
      "activeGroupsMetric",
      "linkedTypesMetric",
      "linkedUnitsMetric",
      "groupModal",
      "groupModalTitle",
      "groupForm",
      "groupId",
      "groupCode",
      "groupName",
      "groupShortName",
      "groupCategory",
      "groupParent",
      "groupDescription",
      "groupCodeError",
      "groupNameError",
      "groupCategoryError",
      "groupParentError",
      "groupStatusError",
      "statusActive",
      "statusInactive",
      "typeCount",
      "typesEmptyState",
      "typesTableWrapper",
      "typesTableBody",
      "typesError",
      "addTypeBtn",
      "typeModal",
      "typeSearch",
      "typeSpecialtyFilter",
      "selectAllTypes",
      "selectedTypeCount",
      "typeResults",
      "typeResultsEmpty",
      "associateTypesBtn",
      "addProcedureBtn",
      "procedureModal",
      "procedureSearch",
      "procedureSpecialtyFilter",
      "selectAllProcedures",
      "selectedProcedureCount",
      "procedureResults",
      "procedureResultsEmpty",
      "associateProceduresBtn",
      "proceduresEmptyState",
      "proceduresTableWrapper",
      "proceduresTableBody",
      "addDocumentBtn",
      "documentModal",
      "documentForm",
      "documentName",
      "documentNameError",
      "documentType",
      "documentMoment",
      "documentRequired",
      "documentsEmptyState",
      "documentsTableWrapper",
      "documentsTableBody",
      "confirmModal",
      "confirmModalTitle",
      "confirmModalMessage",
      "confirmActionBtn",
      "toastArea",
      "auditUser",
      "auditDate",
      "auditTimeline",
      "defaultDuration",
      "preparationTime",
      "intervalTime",
      "minimumAdvance",
      "maximumAdvance",
      "defaultRoom",
      "groupUnits",
      "groupSectors",
      "groupRooms",
      "groupSpecialties",
      "groupProfessionals",
      "resourceRooms",
      "resourceEquipment",
      "resourceStaff"
    ];

    ids.forEach((id) => {
      el[id] = document.getElementById(id);
    });

    el.tabs = document.querySelectorAll("[data-tab]");
    el.panels = document.querySelectorAll("[data-panel]");
    el.closeButtons = document.querySelectorAll("[data-close-modal]");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function now() {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date());
  }

  function statusBadge(status) {
    const active = status === "ACTIVE";

    return `
            <span class="status-badge ${active ? "status-active" : "status-inactive"}">
                ${active ? "Ativo" : "Inativo"}
            </span>
        `;
  }

  function getGroup(id) {
    return state.groups.find((group) => group.id === Number(id));
  }

  function getType(id) {
    return state.types.find((type) => type.id === Number(id));
  }

  function getProcedure(id) {
    return state.procedures.find(
      (procedure) => procedure.id === Number(id)
    );
  }

  function nextCode() {
    const last = Math.max(
      0,
      ...state.groups.map((group) =>
        Number(String(group.code).replace(/\D/g, ""))
      )
    );

    return `GA${String(last + 1).padStart(3, "0")}`;
  }

  function getSelectedValues(select) {
    return [...(select?.selectedOptions || [])].map(
      (option) => option.value
    );
  }

  function setSelectedValues(select, values = []) {
    if (!select) return;

    const normalized = values.map(String);

    [...select.options].forEach((option) => {
      option.selected = normalized.includes(String(option.value));
    });
  }

  function populateSelect(select, values, emptyText = "Selecione uma opção") {
    if (!select) return;

    select.innerHTML = "";

    if (!select.multiple) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = emptyText;
      select.appendChild(empty);
    }

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  /* Dados mockados */

  function createMockData() {
    state.procedures = proceduresMock.map(
      ([code, name, specialty, duration], index) => ({
        id: index + 1,
        code,
        name,
        specialty,
        duration,
        status: "ACTIVE"
      })
    );

    state.types = typesMock.map(
      ([code, name, specialty, duration, channel], index) => ({
        id: index + 1,
        code,
        name,
        specialty,
        duration,
        channel,
        status: "ACTIVE"
      })
    );

    state.groups = [
      createGroup(1, "Atendimento Ambulatorial", "AMB", "Ambulatorial", null, [1, 2, 3, 4]),
      createGroup(2, "Atendimento Diagnóstico", "DIAG", "Diagnóstico", null, [5, 6, 7]),
      createGroup(3, "Atendimento de Urgência", "URG", "Urgência", null, [5, 6]),
      createGroup(4, "Consultas Médicas", "CONS", "Consulta", 1, [1, 2, 3]),
      createGroup(5, "Atendimento Pediátrico", "PED", "Consulta", 1, [8]),
      createGroup(6, "Atendimento Cardiológico", "CARD", "Diagnóstico", 2, [3, 4, 5, 6]),
      createGroup(7, "Atendimento Cirúrgico", "CIR", "Cirúrgico", null, [9]),
      createGroup(8, "Atendimento Terapêutico", "TER", "Terapêutico", null, [10]),
      createGroup(9, "Teleatendimento", "TELE", "Teleatendimento", null, [4, 11]),
      createGroup(10, "Atendimento Preventivo", "PREV", "Preventivo", null, [10, 12])
    ];
  }

  function createGroup(
    id,
    name,
    shortName,
    category,
    parentId,
    typeIds
  ) {
    return {
      id,
      code: `GA${String(id).padStart(3, "0")}`,
      name,
      shortName,
      category,
      parentId,
      description: `Configuração administrativa para ${name.toLowerCase()}.`,
      status: "ACTIVE",
      typeIds,
      procedureIds: [],
      units: ["Unidade Centro"],
      sectors: ["Recepção", "Consultórios"],
      rooms: ["Consultório 01"],
      specialties: ["Clínica Médica"],
      professionals: ["Dr. Carlos Mendes"],
      rules: {
        scheduling: true,
        walkIn: false,
        waitingList: true,
        private: true,
        agreement: true,
        sus: false,
        telemedicine: category === "Teleatendimento",
        homeCare: false,
        confirmation: true,
        authorization: false,
        medicalRequest: false,
        guide: false,
        rescheduling: true,
        return: true,
        withoutScheduling: false
      },
      schedule: {
        duration: 30,
        preparation: 10,
        interval: 5,
        minimumAdvance: 30,
        maximumAdvance: 90,
        room: "Consultório 01",
        walkIn: false,
        waitingList: true,
        rescheduling: true,
        confirmation: true
      },
      flow: {
        scheduling: true,
        confirmation: true,
        checkIn: true,
        reception: true,
        triage: false,
        waiting: true,
        attendance: true,
        procedure: false,
        completion: true,
        billing: true
      },
      triage: {
        required: category === "Urgência",
        vitalSigns: category === "Urgência",
        riskClassification: category === "Urgência",
        nursingAssessment: category === "Urgência"
      },
      channels: category === "Teleatendimento"
        ? ["Telemedicina", "Teleconsulta"]
        : ["Presencial"],
      documents: [],
      records: {
        anamnesis: true,
        physicalExam: true,
        vitalSigns: false,
        diagnosis: true,
        prescription: true,
        examRequest: true,
        certificate: false,
        evolution: true
      },
      resources: {
        rooms: ["Consultório 01"],
        equipment: [],
        staff: ["Médico"]
      },
      agreements: {
        modalities: ["Particular", "Convênio"],
        cardRequired: false,
        authorization: false,
        guide: false,
        billing: true
      },
      audit: [],
      updatedAt: "21/08/2026 15:10",
      linkedRecords: id <= 3
    };
  }

  /* Listagem */

  function getFilters() {
    return {
      search: normalize(el.groupSearch.value || el.topSearch.value),
      category: el.filterCategory.value,
      status: el.filterStatus.value,
      unit: el.filterUnit.value
    };
  }

  function filterGroups() {
    const filters = getFilters();

    return state.groups.filter((group) => {
      const searchable = normalize([
        group.code,
        group.name,
        group.shortName,
        group.description
      ].join(" "));

      return (
        (!filters.search || searchable.includes(filters.search)) &&
        (!filters.category || group.category === filters.category) &&
        (!filters.status || group.status === filters.status) &&
        (!filters.unit || group.units.includes(filters.unit))
      );
    });
  }

  function renderGroups() {
    const groups = filterGroups();
    const totalPages = Math.max(
      1,
      Math.ceil(groups.length / state.pageSize)
    );

    if (state.page > totalPages) {
      state.page = totalPages;
    }

    const start = (state.page - 1) * state.pageSize;
    const pageItems = groups.slice(start, start + state.pageSize);

    el.groupTableBody.innerHTML = "";

    pageItems.forEach((group) => {
      const row = document.createElement("tr");

      row.className = `group-row ${group.status === "INACTIVE" ? "is-inactive" : ""
        }`;

      row.dataset.id = group.id;

      row.innerHTML = `
                <td class="px-5 py-4 font-semibold text-primary-700">
                    ${escapeHtml(group.code)}
                </td>

                <td class="px-5 py-4">
                    <p class="font-semibold text-slate-900">
                        ${escapeHtml(group.name)}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                        ${escapeHtml(group.shortName || "Sem abreviação")}
                    </p>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(group.category)}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(getParentName(group))}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    <button type="button"
                        class="font-semibold text-primary-700 underline-offset-2 hover:underline"
                        data-open-types="${group.id}">
                        ${group.typeIds.length}
                        ${group.typeIds.length === 1 ? "tipo" : "tipos"}
                    </button>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${group.units.length}
                    ${group.units.length === 1 ? "unidade" : "unidades"}
                </td>

                <td class="px-5 py-4">
                    ${statusBadge(group.status)}
                </td>

                <td class="px-5 py-4 text-slate-500">
                    ${escapeHtml(group.updatedAt)}
                </td>

                <td class="px-5 py-4 text-right">
                    <div class="row-actions">
                        <button type="button"
                            class="row-menu-button"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            aria-label="Abrir ações de ${escapeHtml(group.name)}">
                            ⋮
                        </button>

                        <div class="row-menu hidden" role="menu">
                            <button type="button" data-action="view" role="menuitem">
                                Visualizar
                            </button>
                            <button type="button" data-action="edit" role="menuitem">
                                Editar
                            </button>
                            <button type="button" data-action="duplicate" role="menuitem">
                                Duplicar
                            </button>
                            <button type="button" data-action="types" role="menuitem">
                                Gerenciar tipos
                            </button>
                            <button type="button" data-action="rules" role="menuitem">
                                Gerenciar regras
                            </button>
                            <button type="button" data-action="toggle" role="menuitem">
                                ${group.status === "ACTIVE" ? "Inativar" : "Ativar"}
                            </button>
                            <button type="button" data-action="delete"
                                class="danger-action" role="menuitem">
                                Excluir
                            </button>
                        </div>
                    </div>
                </td>
            `;

      el.groupTableBody.appendChild(row);
    });

    updateListState(groups.length);
    updatePagination(groups.length, pageItems.length, start);
    updateMetrics();
  }

  function getParentName(group) {
    return group.parentId
      ? getGroup(group.parentId)?.name || "—"
      : "—";
  }

  function updateListState(total) {
    const empty = total === 0;

    el.groupsTableWrapper.classList.toggle("hidden", empty);
    el.groupsEmptyState.classList.toggle("hidden", !empty);
    el.pagination.classList.toggle("hidden", empty);

    el.resultCount.textContent =
      `${total} ${total === 1 ? "grupo encontrado" : "grupos encontrados"}`;
  }

  function updatePagination(total, visible, start) {
    const totalPages = Math.max(
      1,
      Math.ceil(total / state.pageSize)
    );

    el.paginationInfo.textContent = total
      ? `Exibindo ${start + 1}–${start + visible} de ${total} grupos`
      : "Exibindo 0 grupos";

    el.pageLabel.textContent =
      `Página ${state.page} de ${totalPages}`;

    el.previousPageBtn.disabled = state.page <= 1;
    el.nextPageBtn.disabled = state.page >= totalPages;
  }

  function updateMetrics() {
    el.totalGroupsMetric.textContent = state.groups.length;

    el.activeGroupsMetric.textContent =
      state.groups.filter((group) => group.status === "ACTIVE").length;

    el.linkedTypesMetric.textContent =
      new Set(state.groups.flatMap((group) => group.typeIds)).size;

    el.linkedUnitsMetric.textContent =
      new Set(state.groups.flatMap((group) => group.units)).size;
  }

  function clearFilters() {
    el.topSearch.value = "";
    el.groupSearch.value = "";
    el.filterCategory.value = "";
    el.filterStatus.value = "";
    el.filterUnit.value = "";
    state.page = 1;
    renderGroups();
  }

  /* Modal */

  function openModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    state.lastFocusedElement = document.activeElement;
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");

    const focusable = modal.querySelector(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
    );

    window.setTimeout(() => focusable?.focus(), 50);
  }

  function closeModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.add("hidden");

    if (!document.querySelector(".modal:not(.hidden)")) {
      document.body.classList.remove("overflow-hidden");
    }

    state.lastFocusedElement?.focus?.();
    state.lastFocusedElement = null;
  }

  function selectTab(name) {
    el.tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;

      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    el.panels.forEach((panel) => {
      panel.classList.toggle(
        "hidden",
        panel.dataset.panel !== name
      );
    });
  }

  function openNewGroup() {
    state.currentGroup = {
      id: null,
      code: nextCode(),
      procedureIds: [],
      typeIds: [],
      units: [],
      rooms: [],
      specialties: [],
      professionals: [],
      documents: [],
      audit: []
    };

    el.groupForm.reset();
    el.groupId.value = "";
    el.groupCode.value = state.currentGroup.code;
    el.statusActive.checked = true;
    el.statusInactive.checked = false;
    el.groupModalTitle.textContent = "Novo Grupo de Atendimento";

    populateParentGroups();
    populateResources();
    renderTypes();
    renderProcedures();
    renderDocuments([]);
    renderAudit(null);
    clearValidation();
    setFormReadonly(false);
    selectTab("general");
    openModal("groupModal");
  }

  function openGroup(group, readonly = false) {
    state.currentGroup = clone(group);

    populateParentGroups(group.id);
    populateResources(group);
    fillForm(group);
    renderTypes();
    renderProcedures();
    renderDocuments(group.documents || []);
    renderAudit(group);
    clearValidation();

    el.groupModalTitle.textContent = readonly
      ? "Visualizar Grupo de Atendimento"
      : "Editar Grupo de Atendimento";

    setFormReadonly(readonly);
    selectTab("general");
    openModal("groupModal");
  }

  function fillForm(group) {
    el.groupId.value = group.id || "";
    el.groupCode.value = group.code || "";
    el.groupName.value = group.name || "";
    el.groupShortName.value = group.shortName || "";
    el.groupCategory.value = group.category || "";
    el.groupParent.value = group.parentId || "";
    el.groupDescription.value = group.description || "";
    el.statusActive.checked = group.status === "ACTIVE";
    el.statusInactive.checked = group.status === "INACTIVE";

    fillRules(group.rules || {});
    fillSchedule(group.schedule || {});
    fillFlow(group.flow || {});
    fillTriage(group.triage || {});
    fillChannels(group.channels || []);
    fillRecords(group.records || {});
    fillAgreements(group.agreements || {});

    setSelectedValues(el.groupUnits, group.units);
    setSelectedValues(el.groupSectors, group.sectors);
    setSelectedValues(el.groupRooms, group.rooms);
    setSelectedValues(el.groupSpecialties, group.specialties);
    setSelectedValues(el.groupProfessionals, group.professionals);
    setSelectedValues(el.resourceRooms, group.resources?.rooms);
    setSelectedValues(el.resourceEquipment, group.resources?.equipment);
    setSelectedValues(el.resourceStaff, group.resources?.staff);
  }

  function populateParentGroups(excludeId = null) {
    el.groupParent.innerHTML =
      `<option value="">Nenhum — Grupo principal</option>`;

    state.groups
      .filter((group) => group.id !== excludeId && !group.parentId)
      .forEach((group) => {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = `${group.code} — ${group.name}`;
        el.groupParent.appendChild(option);
      });
  }

  function populateResources(group = {}) {
    populateSelect(el.filterUnit, state.units, "Todas");
    populateSelect(el.defaultRoom, state.rooms, "Selecione uma sala");
    populateSelect(el.groupUnits, state.units);
    populateSelect(el.groupRooms, state.rooms);
    populateSelect(el.groupSpecialties, state.specialties);
    populateSelect(el.groupProfessionals, state.professionals);
    populateSelect(el.resourceRooms, state.rooms);
    populateSelect(el.resourceEquipment, [
      "Eletrocardiógrafo",
      "Ultrassonógrafo",
      "Monitor multiparamétrico",
      "Equipamentos específicos"
    ]);
  }

  function setFormReadonly(readonly) {
    el.groupForm
      .querySelectorAll("input, select, textarea, button")
      .forEach((field) => {
        if (
          field.closest(".modal-header") ||
          field.closest(".modal-tabs") ||
          field.dataset.closeModal
        ) {
          return;
        }

        field.disabled = readonly;
      });
  }

  /* Coleta das abas */

  function readCheckboxMap(ids) {
    return Object.fromEntries(
      ids.map((id) => [
        id,
        Boolean(document.getElementById(id)?.checked)
      ])
    );
  }

  function fillCheckboxMap(map) {
    Object.entries(map).forEach(([id, value]) => {
      const checkbox = document.getElementById(id);
      if (checkbox) checkbox.checked = Boolean(value);
    });
  }

  function fillRules(rules) {
    fillCheckboxMap({
      ruleScheduling: rules.scheduling,
      ruleWalkIn: rules.walkIn,
      ruleWaitingList: rules.waitingList,
      rulePrivate: rules.private,
      ruleAgreement: rules.agreement,
      ruleSus: rules.sus,
      ruleTelemedicine: rules.telemedicine,
      ruleHomeCare: rules.homeCare,
      ruleConfirmation: rules.confirmation,
      ruleAuthorization: rules.authorization,
      ruleMedicalRequest: rules.medicalRequest,
      ruleGuide: rules.guide,
      ruleRescheduling: rules.rescheduling,
      ruleReturn: rules.return,
      ruleWithoutScheduling: rules.withoutScheduling
    });
  }

  function fillSchedule(schedule) {
    el.defaultDuration.value = schedule.duration ?? 30;
    el.preparationTime.value = schedule.preparation ?? 10;
    el.intervalTime.value = schedule.interval ?? 5;
    el.minimumAdvance.value = schedule.minimumAdvance ?? 30;
    el.maximumAdvance.value = schedule.maximumAdvance ?? 90;
    el.defaultRoom.value = schedule.room || "";

    fillCheckboxMap({
      scheduleWalkIn: schedule.walkIn,
      scheduleWaitingList: schedule.waitingList,
      scheduleRescheduling: schedule.rescheduling,
      scheduleConfirmation: schedule.confirmation
    });
  }

  function fillFlow(flow) {
    fillCheckboxMap({
      flowScheduling: flow.scheduling,
      flowConfirmation: flow.confirmation,
      flowCheckIn: flow.checkIn,
      flowReception: flow.reception,
      flowTriage: flow.triage,
      flowWaiting: flow.waiting,
      flowAttendance: flow.attendance,
      flowProcedure: flow.procedure,
      flowCompletion: flow.completion,
      flowBilling: flow.billing
    });
  }

  function fillTriage(triage) {
    fillCheckboxMap({
      triageRequired: triage.required,
      triageVitalSigns: triage.vitalSigns,
      triageRiskClassification: triage.riskClassification,
      triageNursingAssessment: triage.nursingAssessment
    });
  }

  function fillChannels(channels) {
    document
      .querySelectorAll("[id^='channel']")
      .forEach((checkbox) => {
        checkbox.checked = channels.includes(checkbox.value);
      });
  }

  function fillRecords(records) {
    fillCheckboxMap({
      recordAnamnesis: records.anamnesis,
      recordPhysicalExam: records.physicalExam,
      recordVitalSigns: records.vitalSigns,
      recordDiagnosis: records.diagnosis,
      recordPrescription: records.prescription,
      recordExamRequest: records.examRequest,
      recordCertificate: records.certificate,
      recordEvolution: records.evolution
    });
  }

  function fillAgreements(agreements) {
    document
      .querySelectorAll("[id^='agreement']")
      .forEach((checkbox) => {
        checkbox.checked = agreements.modalities?.includes(
          checkbox.value
        );
      });

    fillCheckboxMap({
      agreementCardRequired: agreements.cardRequired,
      agreementAuthorization: agreements.authorization,
      agreementGuide: agreements.guide,
      agreementBilling: agreements.billing
    });
  }

  function collectFormData() {
    const rules = readCheckboxMap([
      "ruleScheduling",
      "ruleWalkIn",
      "ruleWaitingList",
      "rulePrivate",
      "ruleAgreement",
      "ruleSus",
      "ruleTelemedicine",
      "ruleHomeCare",
      "ruleConfirmation",
      "ruleAuthorization",
      "ruleMedicalRequest",
      "ruleGuide",
      "ruleRescheduling",
      "ruleReturn",
      "ruleWithoutScheduling"
    ]);

    const channels = [...document.querySelectorAll("[id^='channel']:checked")]
      .map((checkbox) => checkbox.value);

    const modalities = [...document.querySelectorAll("[id^='agreement']:checked")]
      .filter((checkbox) => checkbox.value)
      .map((checkbox) => checkbox.value);

    return {
      id: el.groupId.value ? Number(el.groupId.value) : null,
      code: el.groupCode.value.trim().toUpperCase(),
      name: el.groupName.value.trim(),
      shortName: el.groupShortName.value.trim().toUpperCase(),
      category: el.groupCategory.value,
      parentId: el.groupParent.value
        ? Number(el.groupParent.value)
        : null,
      description: el.groupDescription.value.trim(),
      status: el.statusActive.checked ? "ACTIVE" : "INACTIVE",
      typeIds: clone(state.currentGroup?.typeIds || []),
      procedureIds: clone(state.currentGroup?.procedureIds || []),
      units: getSelectedValues(el.groupUnits),
      sectors: getSelectedValues(el.groupSectors),
      rooms: getSelectedValues(el.groupRooms),
      specialties: getSelectedValues(el.groupSpecialties),
      professionals: getSelectedValues(el.groupProfessionals),
      rules: {
        scheduling: rules.ruleScheduling,
        walkIn: rules.ruleWalkIn,
        waitingList: rules.ruleWaitingList,
        private: rules.rulePrivate,
        agreement: rules.ruleAgreement,
        sus: rules.ruleSus,
        telemedicine: rules.ruleTelemedicine,
        homeCare: rules.ruleHomeCare,
        confirmation: rules.ruleConfirmation,
        authorization: rules.ruleAuthorization,
        medicalRequest: rules.ruleMedicalRequest,
        guide: rules.ruleGuide,
        rescheduling: rules.ruleRescheduling,
        return: rules.ruleReturn,
        withoutScheduling: rules.ruleWithoutScheduling
      },
      schedule: {
        duration: Number(el.defaultDuration.value) || 0,
        preparation: Number(el.preparationTime.value) || 0,
        interval: Number(el.intervalTime.value) || 0,
        minimumAdvance: Number(el.minimumAdvance.value) || 0,
        maximumAdvance: Number(el.maximumAdvance.value) || 0,
        room: el.defaultRoom.value,
        walkIn: document.getElementById("scheduleWalkIn").checked,
        waitingList: document.getElementById("scheduleWaitingList").checked,
        rescheduling: document.getElementById("scheduleRescheduling").checked,
        confirmation: document.getElementById("scheduleConfirmation").checked
      },
      flow: readFlow(),
      triage: readTriage(),
      channels,
      records: readRecords(),
      resources: {
        rooms: getSelectedValues(el.resourceRooms),
        equipment: getSelectedValues(el.resourceEquipment),
        staff: getSelectedValues(el.resourceStaff)
      },
      agreements: {
        modalities,
        cardRequired: document.getElementById("agreementCardRequired").checked,
        authorization: document.getElementById("agreementAuthorization").checked,
        guide: document.getElementById("agreementGuide").checked,
        billing: document.getElementById("agreementBilling").checked
      },
      documents: clone(state.currentGroup?.documents || [])
    };
  }

  function readFlow() {
    const flow = readCheckboxMap([
      "flowScheduling",
      "flowConfirmation",
      "flowCheckIn",
      "flowReception",
      "flowTriage",
      "flowWaiting",
      "flowAttendance",
      "flowProcedure",
      "flowCompletion",
      "flowBilling"
    ]);

    return {
      scheduling: flow.flowScheduling,
      confirmation: flow.flowConfirmation,
      checkIn: flow.flowCheckIn,
      reception: flow.flowReception,
      triage: flow.flowTriage,
      waiting: flow.flowWaiting,
      attendance: flow.flowAttendance,
      procedure: flow.flowProcedure,
      completion: flow.flowCompletion,
      billing: flow.flowBilling
    };
  }

  function readTriage() {
    const triage = readCheckboxMap([
      "triageRequired",
      "triageVitalSigns",
      "triageRiskClassification",
      "triageNursingAssessment"
    ]);

    return {
      required: triage.triageRequired,
      vitalSigns: triage.triageVitalSigns,
      riskClassification: triage.triageRiskClassification,
      nursingAssessment: triage.triageNursingAssessment
    };
  }

  function readRecords() {
    const records = readCheckboxMap([
      "recordAnamnesis",
      "recordPhysicalExam",
      "recordVitalSigns",
      "recordDiagnosis",
      "recordPrescription",
      "recordExamRequest",
      "recordCertificate",
      "recordEvolution"
    ]);

    return {
      anamnesis: records.recordAnamnesis,
      physicalExam: records.recordPhysicalExam,
      vitalSigns: records.recordVitalSigns,
      diagnosis: records.recordDiagnosis,
      prescription: records.recordPrescription,
      examRequest: records.recordExamRequest,
      certificate: records.recordCertificate,
      evolution: records.recordEvolution
    };
  }

  /* Tipos */

  function renderTypes() {
    const ids = state.currentGroup?.typeIds || [];
    const types = ids.map(getType).filter(Boolean);

    el.typeCount.textContent = types.length;
    el.typesTableBody.innerHTML = "";

    const empty = types.length === 0;

    el.typesEmptyState.classList.toggle("hidden", !empty);
    el.typesTableWrapper.classList.toggle("hidden", empty);

    types.forEach((type) => {
      const row = document.createElement("tr");
      row.className = "type-row";

      row.innerHTML = `
                <td class="px-4 py-4 font-medium text-primary-700">
                    ${escapeHtml(type.code)}
                </td>
                <td class="px-4 py-4 font-semibold text-slate-800">
                    ${escapeHtml(type.name)}
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${escapeHtml(type.specialty)}
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${type.duration} min
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${escapeHtml(type.channel)}
                </td>
                <td class="px-4 py-4">
                    ${statusBadge(type.status)}
                </td>
                <td class="px-4 py-4 text-right">
                    <button type="button"
                        class="exam-remove-button"
                        data-remove-type="${type.id}"
                        aria-label="Remover ${escapeHtml(type.name)}">
                        ×
                    </button>
                </td>
            `;

      el.typesTableBody.appendChild(row);
    });
  }

  function openTypeModal() {
    state.selectedTypeIds.clear();
    populateSpecialtyFilter(el.typeSpecialtyFilter);
    renderTypeResults();
    updateTypeSelection();
    openModal("typeModal");
  }

  function renderTypeResults() {
    const query = normalize(el.typeSearch.value);
    const specialty = el.typeSpecialtyFilter.value;
    const current = new Set(state.currentGroup?.typeIds || []);

    const results = state.types.filter((type) => {
      const searchable = normalize(
        `${type.code} ${type.name} ${type.specialty} ${type.channel}`
      );

      return (
        (!query || searchable.includes(query)) &&
        (!specialty || type.specialty === specialty)
      );
    });

    el.typeResults.innerHTML = "";
    el.typeResultsEmpty.classList.toggle("hidden", results.length > 0);

    results.forEach((type) => {
      const disabled = current.has(type.id);
      const label = document.createElement("label");

      label.className = `procedure-option ${disabled ? "opacity-60" : ""
        }`;

      label.innerHTML = `
                <input type="checkbox"
                    class="type-checkbox"
                    data-type-id="${type.id}"
                    ${disabled ? "disabled" : ""}
                    ${state.selectedTypeIds.has(type.id) ? "checked" : ""}>

                <span class="min-w-0 flex-1">
                    <strong>${escapeHtml(type.name)}</strong>
                    <small>
                        ${escapeHtml(type.code)} ·
                        ${escapeHtml(type.specialty)} ·
                        ${type.duration} min ·
                        ${escapeHtml(type.channel)}
                    </small>
                </span>

                ${statusBadge(type.status)}
            `;

      el.typeResults.appendChild(label);
    });
  }

  function updateTypeSelection() {
    const count = state.selectedTypeIds.size;

    el.selectedTypeCount.textContent =
      `${count} ${count === 1 ? "tipo selecionado" : "tipos selecionados"}`;

    el.associateTypesBtn.disabled = count === 0;
  }

  function associateTypes() {
    if (!state.currentGroup) return;

    const current = new Set(state.currentGroup.typeIds || []);

    state.selectedTypeIds.forEach((id) => current.add(id));

    state.currentGroup.typeIds = [...current];

    renderTypes();
    closeModal("typeModal");
    selectTab("types");
    showToast("Tipo de atendimento associado.", "success");
  }

  /* Procedimentos */

  function renderProcedures() {
    const ids = state.currentGroup?.procedureIds || [];
    const procedures = ids.map(getProcedure).filter(Boolean);

    el.proceduresTableBody.innerHTML = "";

    const empty = procedures.length === 0;

    el.proceduresEmptyState.classList.toggle("hidden", !empty);
    el.proceduresTableWrapper.classList.toggle("hidden", empty);

    procedures.forEach((procedure) => {
      const row = document.createElement("tr");
      row.className = "procedure-row";

      row.innerHTML = `
                <td class="px-4 py-4 font-medium text-primary-700">
                    ${escapeHtml(procedure.code)}
                </td>
                <td class="px-4 py-4 font-semibold text-slate-800">
                    ${escapeHtml(procedure.name)}
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${escapeHtml(procedure.specialty)}
                </td>
                <td class="px-4 py-4 text-slate-600">
                    ${procedure.duration} min
                </td>
                <td class="px-4 py-4">
                    ${statusBadge(procedure.status)}
                </td>
                <td class="px-4 py-4 text-right">
                    <button type="button"
                        class="exam-remove-button"
                        data-remove-procedure="${procedure.id}"
                        aria-label="Remover ${escapeHtml(procedure.name)}">
                        ×
                    </button>
                </td>
            `;

      el.proceduresTableBody.appendChild(row);
    });
  }

  function openProcedureModal() {
    state.selectedProcedureIds.clear();
    populateSpecialtyFilter(el.procedureSpecialtyFilter);
    renderProcedureResults();
    updateProcedureSelection();
    openModal("procedureModal");
  }

  function populateSpecialtyFilter(select) {
    select.innerHTML = `<option value="">Todas</option>`;

    state.specialties.forEach((specialty) => {
      const option = document.createElement("option");
      option.value = specialty;
      option.textContent = specialty;
      select.appendChild(option);
    });
  }

  function renderProcedureResults() {
    const query = normalize(el.procedureSearch.value);
    const specialty = el.procedureSpecialtyFilter.value;
    const current = new Set(
      state.currentGroup?.procedureIds || []
    );

    const results = state.procedures.filter((procedure) => {
      const searchable = normalize(
        `${procedure.code} ${procedure.name} ${procedure.specialty}`
      );

      return (
        (!query || searchable.includes(query)) &&
        (!specialty || procedure.specialty === specialty)
      );
    });

    el.procedureResults.innerHTML = "";
    el.procedureResultsEmpty.classList.toggle("hidden", results.length > 0);

    results.forEach((procedure) => {
      const disabled = current.has(procedure.id);
      const label = document.createElement("label");

      label.className = `procedure-option ${disabled ? "opacity-60" : ""
        }`;

      label.innerHTML = `
                <input type="checkbox"
                    class="procedure-checkbox"
                    data-procedure-id="${procedure.id}"
                    ${disabled ? "disabled" : ""}
                    ${state.selectedProcedureIds.has(procedure.id) ? "checked" : ""}>

                <span class="min-w-0 flex-1">
                    <strong>${escapeHtml(procedure.name)}</strong>
                    <small>
                        ${escapeHtml(procedure.code)} ·
                        ${escapeHtml(procedure.specialty)} ·
                        ${procedure.duration} min
                    </small>
                </span>

                ${statusBadge(procedure.status)}
            `;

      el.procedureResults.appendChild(label);
    });
  }

  function updateProcedureSelection() {
    const count = state.selectedProcedureIds.size;

    el.selectedProcedureCount.textContent =
      `${count} ${count === 1
        ? "procedimento selecionado"
        : "procedimentos selecionados"
      }`;

    el.associateProceduresBtn.disabled = count === 0;
  }

  function associateProcedures() {
    if (!state.currentGroup) return;

    const current = new Set(
      state.currentGroup.procedureIds || []
    );

    state.selectedProcedureIds.forEach((id) => current.add(id));

    state.currentGroup.procedureIds = [...current];

    renderProcedures();
    closeModal("procedureModal");
    selectTab("procedures");
    showToast("Procedimento associado.", "success");
  }

  function removeType(id) {
    state.currentGroup.typeIds =
      state.currentGroup.typeIds.filter(
        (typeId) => typeId !== Number(id)
      );

    renderTypes();
    showToast("Tipo removido do grupo.", "info");
  }

  function removeProcedure(id) {
    state.currentGroup.procedureIds =
      state.currentGroup.procedureIds.filter(
        (procedureId) => procedureId !== Number(id)
      );

    renderProcedures();
    showToast("Procedimento removido do grupo.", "info");
  }

  /* Documentos */

  function openDocumentModal() {
    el.documentForm.reset();
    el.documentName.classList.remove("is-invalid");
    el.documentNameError.textContent = "";
    openModal("documentModal");
  }

  function addDocument(event) {
    event.preventDefault();

    const name = el.documentName.value.trim();

    if (!name) {
      el.documentName.classList.add("is-invalid");
      el.documentNameError.textContent =
        "O nome do documento é obrigatório.";
      return;
    }

    const exists = state.currentGroup.documents.some(
      (document) => normalize(document.name) === normalize(name)
    );

    if (exists) {
      el.documentName.classList.add("is-invalid");
      el.documentNameError.textContent =
        "Este documento já está associado.";
      return;
    }

    state.currentGroup.documents.push({
      name,
      type: el.documentType.value,
      moment: el.documentMoment.value,
      required: el.documentRequired.checked,
      status: "ACTIVE"
    });

    renderDocuments(state.currentGroup.documents);
    closeModal("documentModal");
    showToast("Documento associado com sucesso.", "success");
  }

  function renderDocuments(documents = []) {
    el.documentsTableBody.innerHTML = "";

    const empty = documents.length === 0;

    el.documentsEmptyState.classList.toggle("hidden", !empty);
    el.documentsTableWrapper.classList.toggle("hidden", empty);

    documents.forEach((document, index) => {
      const row = document.createElement("tr");
      row.className = "document-row";

      row.innerHTML = `
                <td class="px-4 py-4 font-medium text-slate-800">
                    ${escapeHtml(document.name)}
                </td>

                <td class="px-4 py-4 text-slate-600">
                    ${escapeHtml(document.type)}
                </td>

                <td class="px-4 py-4 text-slate-600">
                    ${document.required ? "Obrigatório" : "Opcional"}
                </td>

                <td class="px-4 py-4 text-slate-600">
                    ${escapeHtml(document.moment || "—")}
                </td>

                <td class="px-4 py-4 text-right">
                    <button type="button"
                        class="exam-remove-button"
                        data-remove-document="${index}"
                        aria-label="Remover documento">
                        ×
                    </button>
                </td>
            `;

      el.documentsTableBody.appendChild(row);
    });
  }

  function removeDocument(index) {
    state.currentGroup.documents.splice(Number(index), 1);
    renderDocuments(state.currentGroup.documents);
    showToast("Documento removido.", "info");
  }

  /* Validação */

  function clearValidation() {
    [
      el.groupCode,
      el.groupName,
      el.groupCategory,
      el.groupParent
    ].forEach((field) => field?.classList.remove("is-invalid"));

    [
      el.groupCodeError,
      el.groupNameError,
      el.groupCategoryError,
      el.groupParentError,
      el.typesError
    ].forEach((field) => {
      if (field) field.textContent = "";
    });
  }

  function validateForm(data) {
    clearValidation();

    let valid = true;

    const duplicateCode = state.groups.some(
      (group) =>
        group.code === data.code &&
        group.id !== data.id
    );

    const duplicateName = state.groups.some(
      (group) =>
        normalize(group.name) === normalize(data.name) &&
        group.id !== data.id
    );

    if (!data.code) {
      el.groupCode.classList.add("is-invalid");
      el.groupCodeError.textContent = "O código é obrigatório.";
      valid = false;
    } else if (duplicateCode) {
      el.groupCode.classList.add("is-invalid");
      el.groupCodeError.textContent =
        "Este código já está cadastrado.";
      valid = false;
    }

    if (!data.name) {
      el.groupName.classList.add("is-invalid");
      el.groupNameError.textContent =
        "O nome do grupo é obrigatório.";
      valid = false;
    } else if (duplicateName) {
      el.groupName.classList.add("is-invalid");
      el.groupNameError.textContent =
        "Este nome já está cadastrado.";
      valid = false;
    }

    if (!data.category) {
      el.groupCategory.classList.add("is-invalid");
      el.groupCategoryError.textContent =
        "A categoria é obrigatória.";
      valid = false;
    }

    if (!data.status) {
      el.groupStatusError.textContent =
        "Selecione um status.";
      valid = false;
    }

    if (data.parentId === data.id && data.id !== null) {
      el.groupParent.classList.add("is-invalid");
      el.groupParentError.textContent =
        "Um grupo não pode ser pai de si mesmo.";
      valid = false;
    }

    if (data.schedule.duration <= 0) {
      showToast("A duração padrão deve ser maior que zero.", "error");
      valid = false;
    }

    if (data.schedule.minimumAdvance < 0 || data.schedule.maximumAdvance < 0) {
      showToast("Os valores de antecedência não podem ser negativos.", "error");
      valid = false;
    }

    if (!valid) {
      showToast("Revise os campos obrigatórios.", "error");
    }

    return valid;
  }

  function saveGroup(event) {
    event.preventDefault();

    const data = collectFormData();

    if (!validateForm(data)) {
      return;
    }

    const date = now();

    if (data.id) {
      const index = state.groups.findIndex(
        (group) => group.id === data.id
      );

      const previous = state.groups[index];

      state.groups[index] = {
        ...previous,
        ...data,
        updatedAt: date,
        audit: [
          {
            user: "Administrador",
            date,
            action: "Alteração",
            field: "Dados do grupo",
            previous: previous.name,
            next: data.name
          },
          ...(previous.audit || [])
        ]
      };

      showToast("Grupo atualizado com sucesso.", "success");
    } else {
      const id =
        Math.max(0, ...state.groups.map((group) => group.id)) + 1;

      state.groups.push({
        ...data,
        id,
        linkedRecords: false,
        updatedAt: date,
        audit: [
          {
            user: "Administrador",
            date,
            action: "Criação",
            field: "Grupo",
            previous: "—",
            next: data.name
          }
        ]
      });

      showToast("Grupo criado com sucesso.", "success");
    }

    closeModal("groupModal");
    renderGroups();
  }

  /* Ações da tabela */

  function duplicateGroup(group) {
    state.currentGroup = clone({
      ...group,
      id: null,
      code: nextCode(),
      name: `${group.name} - Cópia`,
      shortName: group.shortName
        ? `${group.shortName}2`
        : "",
      status: "ACTIVE"
    });

    fillForm(state.currentGroup);
    el.groupId.value = "";
    el.groupCode.value = nextCode();
    el.groupName.value = `${group.name} - Cópia`;
    el.groupModalTitle.textContent =
      "Novo Grupo de Atendimento";

    setFormReadonly(false);
    selectTab("general");
    openModal("groupModal");
  }

  function toggleGroup(group) {
    const active = group.status === "ACTIVE";

    openConfirmModal({
      title: active
        ? "Inativar grupo de atendimento?"
        : "Ativar grupo de atendimento?",
      message: active
        ? "O grupo continuará disponível para consulta histórica, mas não poderá ser utilizado em novos atendimentos."
        : "O grupo será disponibilizado para novos atendimentos.",
      confirmLabel: active ? "Inativar" : "Ativar",
      type: active ? "danger" : "primary",
      action: () => {
        const previous = group.status;
        group.status = active ? "INACTIVE" : "ACTIVE";
        group.updatedAt = now();
        group.audit ||= [];

        group.audit.unshift({
          user: "Administrador",
          date: group.updatedAt,
          action: active ? "Inativação" : "Ativação",
          field: "Status",
          previous: previous === "ACTIVE" ? "Ativo" : "Inativo",
          next: active ? "Inativo" : "Ativo"
        });

        renderGroups();

        showToast(
          active
            ? "Grupo inativado com sucesso."
            : "Grupo ativado com sucesso.",
          "success"
        );
      }
    });
  }

  function deleteGroup(group) {
    if (group.linkedRecords || group.typeIds.length > 0) {
      openConfirmModal({
        title: "Grupo não pode ser excluído",
        message: 'Este grupo possui atendimentos ou configurações vinculadas e não pode ser excluído. Utilize a opção "Inativar".',
        confirmLabel: "Fechar",
        type: "primary",
        action: () => { }
      });

      return;
    }

    openConfirmModal({
      title: "Excluir grupo de atendimento?",
      message: "Esta ação não poderá ser desfeita.",
      confirmLabel: "Excluir",
      type: "danger",
      action: () => {
        state.groups = state.groups.filter(
          (item) => item.id !== group.id
        );

        renderGroups();
        showToast("Grupo removido com sucesso.", "success");
      }
    });
  }

  function manageTypes(group) {
    state.currentGroup = clone(group);
    fillForm(group);
    renderTypes();
    setFormReadonly(false);
    selectTab("types");
    openModal("groupModal");
  }

  function manageRules(group) {
    state.currentGroup = clone(group);
    fillForm(group);
    selectTab("rules");
    setFormReadonly(false);
    openModal("groupModal");
  }

  function handleGroupAction(action, group) {
    switch (action) {
      case "view":
        openGroup(group, true);
        break;
      case "edit":
        openGroup(group, false);
        break;
      case "duplicate":
        duplicateGroup(group);
        break;
      case "types":
        manageTypes(group);
        break;
      case "rules":
        manageRules(group);
        break;
      case "toggle":
        toggleGroup(group);
        break;
      case "delete":
        deleteGroup(group);
        break;
      default:
        break;
    }
  }

  function openConfirmModal(config) {
    el.confirmModalTitle.textContent = config.title;
    el.confirmModalMessage.textContent = config.message;
    el.confirmActionBtn.textContent = config.confirmLabel;

    el.confirmActionBtn.className =
      config.type === "danger"
        ? "inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-5 font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2"
        : "action-primary";

    state.pendingAction = config.action;
    openModal("confirmModal");
  }

  /* Auditoria */

  function renderAudit(group) {
    el.auditTimeline.innerHTML = "";

    if (!group || !group.audit?.length) {
      el.auditUser.textContent = "—";
      el.auditDate.textContent = "—";

      el.auditTimeline.innerHTML = `
                <li>
                    <p>Nenhum evento de auditoria registrado.</p>
                </li>
            `;

      return;
    }

    const last = group.audit[0];

    el.auditUser.textContent = last.user;
    el.auditDate.textContent = last.date;

    group.audit.forEach((event) => {
      const item = document.createElement("li");

      item.innerHTML = `
                <time>${escapeHtml(event.date)}</time>
                <p>
                    <strong>${escapeHtml(event.user)}</strong>
                    realizou <strong>${escapeHtml(event.action)}</strong>
                    no campo <strong>${escapeHtml(event.field)}</strong>.
                </p>

                <div class="audit-values">
                    <span>Anterior: ${escapeHtml(event.previous)}</span>
                    <span>Novo: ${escapeHtml(event.next)}</span>
                </div>
            `;

      el.auditTimeline.appendChild(item);
    });
  }

  /* Toast */

  function showToast(message, type = "info") {
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    toast.innerHTML = `
            <span aria-hidden="true">
                ${type === "success" ? "✓" : type === "error" ? "!" : "i"}
            </span>
            <span>${escapeHtml(message)}</span>
        `;

    el.toastArea.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-leaving");

      window.setTimeout(() => {
        toast.remove();
      }, 180);
    }, 3500);
  }

  /* Eventos */

  function bindEvents() {
    if (state.eventsBound) return;

    state.eventsBound = true;

    el.newGroupBtn.addEventListener("click", openNewGroup);
    el.emptyCreateBtn.addEventListener("click", openNewGroup);
    el.groupForm.addEventListener("submit", saveGroup);
    el.documentForm.addEventListener("submit", addDocument);

    [el.groupSearch, el.topSearch].forEach((input) => {
      input.addEventListener("input", (event) => {
        el.groupSearch.value = event.target.value;
        el.topSearch.value = event.target.value;
        state.page = 1;
        renderGroups();
      });
    });

    [el.filterCategory, el.filterStatus, el.filterUnit].forEach(
      (select) => {
        select.addEventListener("change", () => {
          state.page = 1;
          renderGroups();
        });
      }
    );

    el.clearFiltersBtn.addEventListener("click", clearFilters);

    el.previousPageBtn.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        renderGroups();
      }
    });

    el.nextPageBtn.addEventListener("click", () => {
      const pages = Math.ceil(
        filterGroups().length / state.pageSize
      );

      if (state.page < pages) {
        state.page += 1;
        renderGroups();
      }
    });

    el.addTypeBtn.addEventListener("click", openTypeModal);
    el.addProcedureBtn.addEventListener("click", openProcedureModal);
    el.addDocumentBtn.addEventListener("click", openDocumentModal);

    el.associateTypesBtn.addEventListener(
      "click",
      associateTypes
    );

    el.associateProceduresBtn.addEventListener(
      "click",
      associateProcedures
    );

    el.typeSearch.addEventListener("input", renderTypeResults);
    el.typeSpecialtyFilter.addEventListener("change", renderTypeResults);

    el.procedureSearch.addEventListener(
      "input",
      renderProcedureResults
    );

    el.procedureSpecialtyFilter.addEventListener(
      "change",
      renderProcedureResults
    );

    el.selectAllTypes.addEventListener("change", (event) => {
      el.typeResults
        .querySelectorAll("[data-type-id]:not(:disabled)")
        .forEach((checkbox) => {
          const id = Number(checkbox.dataset.typeId);
          checkbox.checked = event.target.checked;

          if (event.target.checked) {
            state.selectedTypeIds.add(id);
          } else {
            state.selectedTypeIds.delete(id);
          }
        });

      updateTypeSelection();
    });

    el.selectAllProcedures.addEventListener("change", (event) => {
      el.procedureResults
        .querySelectorAll("[data-procedure-id]:not(:disabled)")
        .forEach((checkbox) => {
          const id = Number(checkbox.dataset.procedureId);
          checkbox.checked = event.target.checked;

          if (event.target.checked) {
            state.selectedProcedureIds.add(id);
          } else {
            state.selectedProcedureIds.delete(id);
          }
        });

      updateProcedureSelection();
    });

    el.confirmActionBtn.addEventListener("click", () => {
      const action = state.pendingAction;

      closeModal("confirmModal");
      state.pendingAction = null;
      action?.();
    });

    el.retryBtn.addEventListener("click", initialize);

    el.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        selectTab(tab.dataset.tab);
      });
    });

    el.closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        closeModal(button.dataset.closeModal);
      });
    });

    document.addEventListener("click", handleDocumentClick);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document
          .querySelectorAll(".modal:not(.hidden)")
          .forEach((modal) => closeModal(modal.id));
      }
    });
  }

  function handleDocumentClick(event) {
    const menuButton = event.target.closest(".row-menu-button");

    if (menuButton) {
      event.stopPropagation();

      document.querySelectorAll(".row-menu").forEach((menu) => {
        if (menu !== menuButton.nextElementSibling) {
          menu.classList.add("hidden");
        }
      });

      const menu = menuButton.nextElementSibling;
      const open = !menu.classList.contains("hidden");

      menu.classList.toggle("hidden", open);
      menuButton.setAttribute("aria-expanded", String(!open));
      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (actionButton) {
      const row = actionButton.closest(".group-row");
      const group = getGroup(row?.dataset.id);

      document.querySelectorAll(".row-menu").forEach((menu) => {
        menu.classList.add("hidden");
      });

      if (group) {
        handleGroupAction(actionButton.dataset.action, group);
      }

      return;
    }

    const typeCheckbox = event.target.closest("[data-type-id]");

    if (typeCheckbox) {
      const id = Number(typeCheckbox.dataset.typeId);

      if (typeCheckbox.checked) {
        state.selectedTypeIds.add(id);
      } else {
        state.selectedTypeIds.delete(id);
      }

      updateTypeSelection();
      return;
    }

    const procedureCheckbox = event.target.closest(
      "[data-procedure-id]"
    );

    if (procedureCheckbox) {
      const id = Number(procedureCheckbox.dataset.procedureId);

      if (procedureCheckbox.checked) {
        state.selectedProcedureIds.add(id);
      } else {
        state.selectedProcedureIds.delete(id);
      }

      updateProcedureSelection();
      return;
    }

    const openTypes = event.target.closest("[data-open-types]");

    if (openTypes) {
      const group = getGroup(openTypes.dataset.openTypes);

      if (group) {
        manageTypes(group);
      }

      return;
    }

    const removeTypeButton = event.target.closest("[data-remove-type]");

    if (removeTypeButton) {
      removeType(removeTypeButton.dataset.removeType);
      return;
    }

    const removeProcedureButton = event.target.closest(
      "[data-remove-procedure]"
    );

    if (removeProcedureButton) {
      removeProcedure(
        removeProcedureButton.dataset.removeProcedure
      );

      return;
    }

    const removeDocumentButton = event.target.closest(
      "[data-remove-document]"
    );

    if (removeDocumentButton) {
      removeDocument(
        removeDocumentButton.dataset.removeDocument
      );

      return;
    }

    if (!event.target.closest(".row-actions")) {
      document.querySelectorAll(".row-menu").forEach((menu) => {
        menu.classList.add("hidden");
      });
    }
  }

  /* API futura */

  async function loadGroups() {
    return clone(state.groups);
  }

  async function loadAttendanceTypes() {
    return clone(state.types);
  }

  async function loadProcedures() {
    return clone(state.procedures);
  }

  async function createGroup(data) {
    const id =
      Math.max(0, ...state.groups.map((group) => group.id)) + 1;

    const group = {
      ...data,
      id,
      updatedAt: now(),
      linkedRecords: false,
      audit: []
    };

    state.groups.push(group);
    return group;
  }

  async function updateGroup(id, data) {
    const index = state.groups.findIndex(
      (group) => group.id === Number(id)
    );

    if (index === -1) {
      throw new Error("Grupo não encontrado.");
    }

    state.groups[index] = {
      ...state.groups[index],
      ...data,
      updatedAt: now()
    };

    return state.groups[index];
  }

  async function removeGroup(id) {
    state.groups = state.groups.filter(
      (group) => group.id !== Number(id)
    );
  }

  // async function initialize() {
  //   cacheElements();

  //   el.groupsLoading.classList.remove("hidden");
  //   el.groupsTableWrapper.classList.add("hidden");
  //   el.groupsEmptyState.classList.add("hidden");
  //   el.groupsErrorState.classList.add("hidden");

  //   try {
  //     if (!state.groups.length) {
  //       createMockData();
  //     }

  //     bindEvents();

  //     populateResources();
  //     renderGroups();

  //     window.setTimeout(() => {
  //       el.groupsLoading.classList.add("hidden");
  //       renderGroups();
  //     }, 350);
  //   } catch (error) {
  //     el.groupsLoading.classList.add("hidden");
  //     el.groupsErrorState.classList.remove("hidden");
  //     showToast("Não foi possível carregar os grupos.", "error");
  //   }
  // }

  function initialize() {
    cacheElements();

    if (!el.newGroupBtn) {
      console.error("Elemento #newGroupBtn não encontrado.");
      return;
    }

    if (!el.groupModal) {
      console.error("Elemento #groupModal não encontrado.");
      return;
    }

    if (!el.groupForm) {
      console.error("Elemento #groupForm não encontrado.");
      return;
    }

    el.groupsLoading.classList.remove("hidden");
    el.groupsTableWrapper.classList.add("hidden");
    el.groupsEmptyState.classList.add("hidden");
    el.groupsErrorState.classList.add("hidden");

    try {
      if (!state.groups.length) {
        createMockData();
      }

      bindEvents();
      populateResources();
      renderGroups();

      window.setTimeout(() => {
        el.groupsLoading.classList.add("hidden");
        renderGroups();
      }, 350);
    } catch (error) {
      console.error("Erro ao inicializar Grupo de Atendimento:", error);

      el.groupsLoading.classList.add("hidden");
      el.groupsErrorState.classList.remove("hidden");

      showToast(
        "Não foi possível carregar a janela de Grupo de Atendimento.",
        "error"
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }


  initialize();

  window.GM4medGrupoAtendimento = {
    loadGroups,
    loadAttendanceTypes,
    loadProcedures,
    createGroup,
    updateGroup,
    removeGroup
  };
})();