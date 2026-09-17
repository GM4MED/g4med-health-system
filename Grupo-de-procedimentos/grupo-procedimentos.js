(() => {
    "use strict";

    const state = {
        groups: [],
        procedures: [],
        rooms: [
            "Consultório 01",
            "Sala de Ultrassom",
            "Centro Cirúrgico",
            "Sala de Procedimentos",
            "Consultório 02"
        ],
        equipment: [
            "Ultrassonógrafo",
            "Eletrocardiógrafo",
            "Monitor multiparamétrico",
            "Equipamento de Raio-X",
            "Tomógrafo"
        ],
        professionals: [
            "Dr. Carlos Mendes",
            "Dra. Ana Oliveira",
            "Dr. Marcos Silva",
            "Dra. Juliana Costa"
        ],
        specialties: [
            "Cardiologia",
            "Clínica Médica",
            "Pediatria",
            "Radiologia",
            "Cirurgia",
            "Ortopedia"
        ],
        currentGroup: null,
        selectedProcedureIds: new Set(),
        pendingAction: null,
        page: 1,
        pageSize: 10,
        lastFocusedElement: null
    };

    const el = {};

    const categories = [
        "Consultas",
        "Diagnóstico",
        "Cirúrgico",
        "Ambulatorial",
        "Terapêutico",
        "Preventivo",
        "Hospitalar",
        "Outros"
    ];

    const documentsCatalog = [
        "Termo de Consentimento",
        "Checklist Pré-Procedimento",
        "Orientações ao Paciente",
        "Avaliação Pré-Anestésica",
        "Checklist de Segurança"
    ];

    const proceduresMock = [
        {
            id: 1,
            code: "PROC001",
            name: "Consulta Clínica",
            specialty: "Clínica Médica",
            duration: 30,
            status: "ACTIVE"
        },
        {
            id: 2,
            code: "PROC002",
            name: "Consulta Cardiológica",
            specialty: "Cardiologia",
            duration: 40,
            status: "ACTIVE"
        },
        {
            id: 3,
            code: "PROC003",
            name: "Consulta Pediátrica",
            specialty: "Pediatria",
            duration: 30,
            status: "ACTIVE"
        },
        {
            id: 4,
            code: "PROC004",
            name: "Eletrocardiograma",
            specialty: "Cardiologia",
            duration: 20,
            status: "ACTIVE"
        },
        {
            id: 5,
            code: "PROC005",
            name: "Holter",
            specialty: "Cardiologia",
            duration: 30,
            status: "ACTIVE"
        },
        {
            id: 6,
            code: "PROC006",
            name: "MAPA",
            specialty: "Cardiologia",
            duration: 30,
            status: "ACTIVE"
        },
        {
            id: 7,
            code: "PROC007",
            name: "Ultrassonografia abdominal",
            specialty: "Radiologia",
            duration: 40,
            status: "ACTIVE"
        },
        {
            id: 8,
            code: "PROC008",
            name: "Radiografia de tórax",
            specialty: "Radiologia",
            duration: 20,
            status: "ACTIVE"
        },
        {
            id: 9,
            code: "PROC009",
            name: "Pequena cirurgia dermatológica",
            specialty: "Cirurgia",
            duration: 60,
            status: "ACTIVE"
        },
        {
            id: 10,
            code: "PROC010",
            name: "Curativo simples",
            specialty: "Clínica Médica",
            duration: 20,
            status: "ACTIVE"
        },
        {
            id: 11,
            code: "PROC011",
            name: "Sessão de fisioterapia",
            specialty: "Ortopedia",
            duration: 50,
            status: "ACTIVE"
        },
        {
            id: 12,
            code: "PROC012",
            name: "Tomografia computadorizada",
            specialty: "Radiologia",
            duration: 45,
            status: "ACTIVE"
        },
        {
            id: 13,
            code: "PROC013",
            name: "Ressonância magnética",
            specialty: "Radiologia",
            duration: 60,
            status: "ACTIVE"
        },
        {
            id: 14,
            code: "PROC014",
            name: "Consulta ortopédica",
            specialty: "Ortopedia",
            duration: 40,
            status: "ACTIVE"
        },
        {
            id: 15,
            code: "PROC015",
            name: "Avaliação pré-operatória",
            specialty: "Cirurgia",
            duration: 45,
            status: "INACTIVE"
        },
        {
            id: 16,
            code: "PROC016",
            name: "Teste ergométrico",
            specialty: "Cardiologia",
            duration: 45,
            status: "ACTIVE"
        },
        {
            id: 17,
            code: "PROC017",
            name: "Endoscopia digestiva",
            specialty: "Clínica Médica",
            duration: 50,
            status: "ACTIVE"
        },
        {
            id: 18,
            code: "PROC018",
            name: "Consulta de retorno",
            specialty: "Clínica Médica",
            duration: 20,
            status: "ACTIVE"
        },
        {
            id: 19,
            code: "PROC019",
            name: "Infiltração articular",
            specialty: "Ortopedia",
            duration: 30,
            status: "ACTIVE"
        },
        {
            id: 20,
            code: "PROC020",
            name: "Consulta preventiva",
            specialty: "Clínica Médica",
            duration: 40,
            status: "ACTIVE"
        }
    ];

    const groupsMock = [
        {
            id: 1,
            code: "GP001",
            name: "Consultas",
            shortName: "CONS",
            category: "Consultas",
            parentId: null,
            description: "Grupo principal para consultas médicas.",
            status: "ACTIVE",
            procedureIds: [1, 2, 3, 14, 18, 20],
            rules: {
                scheduling: true,
                authorization: false,
                medicalRequest: false,
                guide: false,
                private: true,
                agreement: true,
                billing: true,
                walkIn: true,
                digitalSignature: true
            },
            schedule: {
                duration: 30,
                preparation: 10,
                interval: 5,
                room: "Consultório 01",
                equipment: "",
                specialty: "Clínica Médica",
                professionals: ["Dr. Carlos Mendes"]
            },
            resources: {
                rooms: ["Consultório 01"],
                equipment: [],
                professionals: ["Dr. Carlos Mendes"],
                specialties: ["Clínica Médica", "Cardiologia"]
            },
            documents: [],
            audit: [
                {
                    user: "Administrador",
                    date: "21/08/2026 15:10",
                    action: "Alteração",
                    field: "Descrição",
                    previous: "",
                    next: "Grupo principal para consultas médicas."
                },
                {
                    user: "Administrador",
                    date: "21/08/2026 14:32",
                    action: "Criação",
                    field: "Grupo",
                    previous: "—",
                    next: "Consultas"
                }
            ],
            updatedAt: "21/08/2026 15:10",
            linkedRecords: true
        },
        {
            id: 2,
            code: "GP002",
            name: "Diagnóstico",
            shortName: "DIAG",
            category: "Diagnóstico",
            parentId: null,
            description: "Procedimentos de diagnóstico por imagem e avaliação.",
            status: "ACTIVE",
            procedureIds: [4, 5, 6, 7, 8, 12, 13, 16],
            rules: {
                scheduling: true,
                authorization: true,
                medicalRequest: true,
                guide: true,
                private: true,
                agreement: true,
                billing: true,
                walkIn: false,
                digitalSignature: true
            },
            schedule: {
                duration: 40,
                preparation: 10,
                interval: 5,
                room: "Sala de Ultrassom",
                equipment: "Ultrassonógrafo",
                specialty: "Radiologia",
                professionals: ["Dra. Ana Oliveira"]
            },
            resources: {
                rooms: ["Sala de Ultrassom"],
                equipment: ["Ultrassonógrafo", "Eletrocardiógrafo"],
                professionals: ["Dra. Ana Oliveira"],
                specialties: ["Radiologia", "Cardiologia"]
            },
            documents: [
                {
                    name: "Orientações ao Paciente",
                    type: "Orientação",
                    required: true,
                    status: "ACTIVE"
                }
            ],
            audit: [],
            updatedAt: "20/08/2026 11:20",
            linkedRecords: true
        },
        {
            id: 3,
            code: "GP003",
            name: "Exames Cardiológicos",
            shortName: "CARD",
            category: "Diagnóstico",
            parentId: 2,
            description: "Subgrupo de exames cardiovasculares.",
            status: "ACTIVE",
            procedureIds: [4, 5, 6, 16],
            rules: {
                scheduling: true,
                authorization: true,
                medicalRequest: true,
                guide: false,
                private: true,
                agreement: true,
                billing: true,
                walkIn: false,
                digitalSignature: false
            },
            schedule: {
                duration: 30,
                preparation: 5,
                interval: 5,
                room: "Sala de Procedimentos",
                equipment: "Eletrocardiógrafo",
                specialty: "Cardiologia",
                professionals: ["Dr. Carlos Mendes"]
            },
            resources: {
                rooms: ["Sala de Procedimentos"],
                equipment: ["Eletrocardiógrafo"],
                professionals: ["Dr. Carlos Mendes"],
                specialties: ["Cardiologia"]
            },
            documents: [],
            audit: [],
            updatedAt: "19/08/2026 16:40",
            linkedRecords: false
        },
        {
            id: 4,
            code: "GP004",
            name: "Cirurgias Ambulatoriais",
            shortName: "CIR",
            category: "Cirúrgico",
            parentId: null,
            description: "Procedimentos cirúrgicos realizados em ambiente ambulatorial.",
            status: "ACTIVE",
            procedureIds: [9, 15],
            rules: {
                scheduling: true,
                authorization: true,
                medicalRequest: true,
                guide: true,
                private: true,
                agreement: true,
                billing: true,
                walkIn: false,
                digitalSignature: true
            },
            schedule: {
                duration: 60,
                preparation: 20,
                interval: 10,
                room: "Centro Cirúrgico",
                equipment: "Monitor multiparamétrico",
                specialty: "Cirurgia",
                professionals: ["Dr. Marcos Silva"]
            },
            resources: {
                rooms: ["Centro Cirúrgico"],
                equipment: ["Monitor multiparamétrico"],
                professionals: ["Dr. Marcos Silva"],
                specialties: ["Cirurgia"]
            },
            documents: [
                {
                    name: "Termo de Consentimento",
                    type: "Termo",
                    required: true,
                    status: "ACTIVE"
                },
                {
                    name: "Checklist de Segurança",
                    type: "Checklist",
                    required: true,
                    status: "ACTIVE"
                }
            ],
            audit: [],
            updatedAt: "18/08/2026 10:15",
            linkedRecords: true
        },
        {
            id: 5,
            code: "GP005",
            name: "Procedimentos Terapêuticos",
            shortName: "TER",
            category: "Terapêutico",
            parentId: null,
            description: "Procedimentos destinados ao tratamento e reabilitação.",
            status: "ACTIVE",
            procedureIds: [10, 11, 19],
            rules: {
                scheduling: true,
                authorization: false,
                medicalRequest: true,
                guide: false,
                private: true,
                agreement: true,
                billing: true,
                walkIn: false,
                digitalSignature: false
            },
            schedule: {
                duration: 40,
                preparation: 5,
                interval: 5,
                room: "Sala de Procedimentos",
                equipment: "",
                specialty: "Ortopedia",
                professionals: ["Dra. Juliana Costa"]
            },
            resources: {
                rooms: ["Sala de Procedimentos"],
                equipment: [],
                professionals: ["Dra. Juliana Costa"],
                specialties: ["Ortopedia"]
            },
            documents: [],
            audit: [],
            updatedAt: "17/08/2026 09:30",
            linkedRecords: false
        }
    ];

    function cacheElements() {
        [
            "newGroupBtn",
            "emptyCreateBtn",
            "topSearch",
            "groupSearch",
            "filterCategory",
            "filterStatus",
            "filterParent",
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
            "subgroupsMetric",
            "linkedProceduresMetric",
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
            "procedureCount",
            "proceduresEmptyState",
            "proceduresTableWrapper",
            "proceduresTableBody",
            "proceduresError",
            "addProcedureBtn",
            "procedureModal",
            "procedureModalSearch",
            "procedureSpecialtyFilter",
            "selectAllProcedures",
            "selectedProcedureCount",
            "procedureResults",
            "procedureResultsEmpty",
            "associateProceduresBtn",
            "documentModal",
            "documentForm",
            "documentName",
            "documentNameError",
            "documentType",
            "documentRequired",
            "addDocumentBtn",
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
            "requiredRoom",
            "requiredEquipment",
            "requiredSpecialty",
            "qualifiedProfessional",
            "resourceRooms",
            "resourceEquipment",
            "resourceProfessionals",
            "resourceSpecialties"
        ].forEach((id) => {
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
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function currentDate() {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(new Date());
    }

    function nextCode() {
        const max = Math.max(
            0,
            ...state.groups.map((group) => Number(group.code.replace(/\D/g, "")))
        );

        return `GP${String(max + 1).padStart(3, "0")}`;
    }

    function getGroup(id) {
        return state.groups.find((group) => group.id === Number(id));
    }

    function getProcedure(id) {
        return state.procedures.find((procedure) => procedure.id === Number(id));
    }

    function getParentName(group) {
        return group.parentId ? getGroup(group.parentId)?.name || "—" : "—";
    }

    function statusBadge(status) {
        const active = status === "ACTIVE";

        return `
            <span class="status-badge ${active ? "status-active" : "status-inactive"}">
                ${active ? "Ativo" : "Inativo"}
            </span>
        `;
    }

    function getFilters() {
        return {
            search: normalize(el.groupSearch.value || el.topSearch.value),
            category: el.filterCategory.value,
            status: el.filterStatus.value,
            parent: el.filterParent.value
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

            const matchesSearch =
                !filters.search || searchable.includes(filters.search);

            const matchesCategory =
                !filters.category || group.category === filters.category;

            const matchesStatus =
                !filters.status || group.status === filters.status;

            const matchesParent =
                !filters.parent ||
                (filters.parent === "ROOT" && !group.parentId) ||
                (filters.parent === "SUBGROUP" && Boolean(group.parentId));

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus &&
                matchesParent
            );
        });
    }

    function renderGroups() {
        const filtered = filterGroups();
        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / state.pageSize)
        );

        if (state.page > totalPages) {
            state.page = totalPages;
        }

        const start = (state.page - 1) * state.pageSize;
        const pageItems = filtered.slice(start, start + state.pageSize);

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
                    <div>
                        <p class="font-semibold text-slate-900">
                            ${escapeHtml(group.name)}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                            ${escapeHtml(group.shortName || "Sem nome abreviado")}
                        </p>
                    </div>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(group.category)}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(getParentName(group))}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${group.procedureIds.length}
                    ${group.procedureIds.length === 1 ? "procedimento" : "procedimentos"}
                </td>

                <td class="px-5 py-4">
                    ${statusBadge(group.status)}
                </td>

                <td class="px-5 py-4 text-slate-500">
                    ${escapeHtml(group.updatedAt || "—")}
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

                            <button type="button" data-action="procedures" role="menuitem">
                                Gerenciar procedimentos
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

        updateListState(filtered.length);
        updatePagination(filtered.length, pageItems.length, start);
        updateMetrics();
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
        const pages = Math.max(1, Math.ceil(total / state.pageSize));

        el.paginationInfo.textContent = total
            ? `Exibindo ${start + 1}–${start + visible} de ${total} grupos`
            : "Exibindo 0 grupos";

        el.pageLabel.textContent = `Página ${state.page} de ${pages}`;
        el.previousPageBtn.disabled = state.page <= 1;
        el.nextPageBtn.disabled = state.page >= pages;
    }

    function updateMetrics() {
        const total = state.groups.length;
        const active = state.groups.filter(
            (group) => group.status === "ACTIVE"
        ).length;

        const subgroups = state.groups.filter(
            (group) => Boolean(group.parentId)
        ).length;

        const procedures = new Set(
            state.groups.flatMap((group) => group.procedureIds)
        ).size;

        if (el.totalGroupsMetric) el.totalGroupsMetric.textContent = total;
        if (el.activeGroupsMetric) el.activeGroupsMetric.textContent = active;
        if (el.subgroupsMetric) el.subgroupsMetric.textContent = subgroups;
        if (el.linkedProceduresMetric) el.linkedProceduresMetric.textContent = procedures;
    }

    function clearFilters() {
        el.topSearch.value = "";
        el.groupSearch.value = "";
        el.filterCategory.value = "";
        el.filterStatus.value = "";
        el.filterParent.value = "";
        state.page = 1;
        renderGroups();
    }

    /* Modais */

    function openModal(id) {
        const modal = document.getElementById(id);

        if (!modal) {
            return;
        }

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

        if (!modal) {
            return;
        }

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
            panel.classList.toggle("hidden", panel.dataset.panel !== name);
        });
    }

    function resetForm() {
        el.groupForm.reset();

        el.groupId.value = "";
        el.groupCode.value = nextCode();
        el.statusActive.checked = true;
        el.statusInactive.checked = false;

        populateParentGroups();
        populateResources();

        state.currentGroup = {
            id: null,
            procedureIds: [],
            documents: [],
            audit: []
        };

        renderProcedures();
        renderDocuments([]);
        renderAudit(null);
        clearValidation();
        selectTab("general");
    }

    function openNewGroup() {
        resetForm();

        el.groupModalTitle.textContent = "Novo Grupo de Procedimentos";
        el.saveGroupBtn?.querySelector(".btn-label") &&
            (el.saveGroupBtn.querySelector(".btn-label").textContent = "Salvar Grupo");

        setFormReadonly(false);
        openModal("groupModal");
    }

    function openGroup(group, readonly = false) {
        state.currentGroup = clone(group);

        fillForm(group);
        renderProcedures();
        renderDocuments(group.documents || []);
        renderAudit(group);
        populateParentGroups(group.id);
        populateResources(group);

        el.groupModalTitle.textContent = readonly
            ? "Visualizar Grupo de Procedimentos"
            : "Editar Grupo de Procedimentos";

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
        el.groupDescription.value = group.description || "";
        el.statusActive.checked = group.status === "ACTIVE";
        el.statusInactive.checked = group.status === "INACTIVE";

        setSelectedValues(el.groupParent, group.parentId ? [String(group.parentId)] : []);

        const rules = group.rules || {};

        Object.entries({
            ruleScheduling: rules.scheduling,
            ruleAuthorization: rules.authorization,
            ruleMedicalRequest: rules.medicalRequest,
            ruleGuide: rules.guide,
            rulePrivate: rules.private,
            ruleAgreement: rules.agreement,
            ruleBilling: rules.billing,
            ruleWalkIn: rules.walkIn,
            ruleDigitalSignature: rules.digitalSignature
        }).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) field.checked = Boolean(value);
        });

        const schedule = group.schedule || {};

        setValue("defaultDuration", schedule.duration);
        setValue("preparationTime", schedule.preparation);
        setValue("intervalTime", schedule.interval);
        setValue("requiredRoom", schedule.room);
        setValue("requiredEquipment", schedule.equipment);
        setValue("requiredSpecialty", schedule.specialty);
        setSelectedValues(el.qualifiedProfessional, schedule.professionals || []);

        setSelectedValues(el.resourceRooms, group.resources?.rooms || []);
        setSelectedValues(el.resourceEquipment, group.resources?.equipment || []);
        setSelectedValues(el.resourceProfessionals, group.resources?.professionals || []);
        setSelectedValues(el.resourceSpecialties, group.resources?.specialties || []);
    }

    function setValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.value = value ?? "";
    }

    function setSelectedValues(select, values) {
        if (!select) {
            return;
        }

        [...select.options].forEach((option) => {
            option.selected = values.map(String).includes(String(option.value));
        });
    }

    function getSelectedValues(select) {
        return [...(select?.selectedOptions || [])].map(
            (option) => option.value
        );
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

        el.addProcedureBtn.disabled = readonly;
        el.addDocumentBtn.disabled = readonly;
    }

    function populateParentGroups(excludeId = null) {
        const previous = el.groupParent.value;

        el.groupParent.innerHTML = `
            <option value="">Nenhum — Grupo principal</option>
        `;

        state.groups
            .filter((group) => group.id !== excludeId && !group.parentId)
            .forEach((group) => {
                const option = document.createElement("option");
                option.value = group.id;
                option.textContent = `${group.code} — ${group.name}`;
                el.groupParent.appendChild(option);
            });

        if (previous) {
            el.groupParent.value = previous;
        }
    }

    function populateResources(group = {}) {
        populateSelect(el.requiredRoom, state.rooms);
        populateSelect(el.requiredEquipment, state.equipment);
        populateSelect(el.requiredSpecialty, state.specialties);
        populateSelect(el.qualifiedProfessional, state.professionals);
        populateSelect(el.resourceRooms, state.rooms);
        populateSelect(el.resourceEquipment, state.equipment);
        populateSelect(el.resourceProfessionals, state.professionals);
        populateSelect(el.resourceSpecialties, state.specialties);

        if (group.schedule) {
            setValue("requiredRoom", group.schedule.room);
            setValue("requiredEquipment", group.schedule.equipment);
            setValue("requiredSpecialty", group.schedule.specialty);
            setSelectedValues(el.qualifiedProfessional, group.schedule.professionals || []);
        }
    }

    function populateSelect(select, values) {
        if (!select) {
            return;
        }

        const current = getSelectedValues(select);

        select.innerHTML = "";

        if (!select.multiple) {
            const empty = document.createElement("option");
            empty.value = "";
            empty.textContent = "Selecione uma opção";
            select.appendChild(empty);
        }

        values.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = current.includes(value);
            select.appendChild(option);
        });
    }

    /* Procedimentos */

    function renderProcedures() {
        const ids = state.currentGroup?.procedureIds || [];
        const items = ids
            .map((id) => getProcedure(id))
            .filter(Boolean);

        el.procedureCount.textContent = items.length;
        el.proceduresTableBody.innerHTML = "";

        const empty = items.length === 0;

        el.proceduresEmptyState.classList.toggle("hidden", !empty);
        el.proceduresTableWrapper.classList.toggle("hidden", empty);

        items.forEach((procedure) => {
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
        populateSpecialtyFilter();
        renderProcedureResults();
        updateSelectedProcedureCount();
        openModal("procedureModal");
    }

    function populateSpecialtyFilter() {
        el.procedureSpecialtyFilter.innerHTML = `
            <option value="">Todas</option>
        `;

        state.specialties.forEach((specialty) => {
            const option = document.createElement("option");
            option.value = specialty;
            option.textContent = specialty;
            el.procedureSpecialtyFilter.appendChild(option);
        });
    }

    function renderProcedureResults() {
        const query = normalize(el.procedureModalSearch.value);
        const specialty = el.procedureSpecialtyFilter.value;
        const currentIds = new Set(state.currentGroup?.procedureIds || []);

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
        el.procedureResultsEmpty.classList.toggle(
            "hidden",
            results.length > 0
        );

        results.forEach((procedure) => {
            const alreadyAdded = currentIds.has(procedure.id);
            const selected = state.selectedProcedureIds.has(procedure.id);

            const label = document.createElement("label");
            label.className = `procedure-option ${alreadyAdded ? "opacity-60" : ""
                }`;

            label.innerHTML = `
                <input type="checkbox"
                    class="procedure-checkbox"
                    data-procedure-id="${procedure.id}"
                    ${selected ? "checked" : ""}
                    ${alreadyAdded ? "disabled" : ""}>

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

    function updateSelectedProcedureCount() {
        const count = state.selectedProcedureIds.size;

        el.selectedProcedureCount.textContent =
            `${count} ${count === 1 ? "procedimento selecionado" : "procedimentos selecionados"}`;

        el.associateProceduresBtn.disabled = count === 0;
    }

    function associateProcedures() {
        if (!state.currentGroup) {
            return;
        }

        const current = new Set(state.currentGroup.procedureIds || []);

        state.selectedProcedureIds.forEach((id) => current.add(id));

        state.currentGroup.procedureIds = [...current];

        renderProcedures();
        closeModal("procedureModal");
        selectTab("procedures");
        showToast("Procedimentos associados com sucesso.", "success");
    }

    function removeProcedure(id) {
        if (!state.currentGroup) {
            return;
        }

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
        el.documentNameError.textContent = "";
        el.documentName.classList.remove("is-invalid");
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

        if (!state.currentGroup) {
            return;
        }

        state.currentGroup.documents ||= [];

        const exists = state.currentGroup.documents.some(
            (document) => normalize(document.name) === normalize(name)
        );

        if (exists) {
            el.documentNameError.textContent =
                "Este documento já está associado ao grupo.";
            return;
        }

        state.currentGroup.documents.push({
            name,
            type: el.documentType.value,
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

            row.innerHTML = `
                <td class="px-4 py-4 font-medium text-slate-800">
                    ${escapeHtml(document.name)}
                </td>

                <td class="px-4 py-4 text-slate-600">
                    ${escapeHtml(document.type)}
                </td>

                <td class="px-4 py-4 text-slate-600">
                    ${document.required ? "Sim" : "Não"}
                </td>

                <td class="px-4 py-4">
                    ${statusBadge(document.status)}
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

    /* Auditoria */

    function renderAudit(group) {
        if (!group) {
            el.auditUser.textContent = "—";
            el.auditDate.textContent = "—";
            el.auditTimeline.innerHTML = "";
            return;
        }

        const last = group.audit?.[0];

        el.auditUser.textContent = last?.user || "Administrador";
        el.auditDate.textContent = last?.date || group.updatedAt || "—";
        el.auditTimeline.innerHTML = "";

        (group.audit || []).forEach((event) => {
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

    /* Validação e persistência */

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
            el.proceduresError
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
                group.id !== Number(data.id)
        );

        const duplicateName = state.groups.some(
            (group) =>
                normalize(group.name) === normalize(data.name) &&
                group.id !== Number(data.id)
        );

        if (!data.code) {
            el.groupCode.classList.add("is-invalid");
            el.groupCodeError.textContent = "O código é obrigatório.";
            valid = false;
        } else if (duplicateCode) {
            el.groupCode.classList.add("is-invalid");
            el.groupCodeError.textContent = "Este código já está cadastrado.";
            valid = false;
        }

        if (!data.name) {
            el.groupName.classList.add("is-invalid");
            el.groupNameError.textContent = "O nome do grupo é obrigatório.";
            valid = false;
        } else if (duplicateName) {
            el.groupName.classList.add("is-invalid");
            el.groupNameError.textContent = "Este nome já está cadastrado.";
            valid = false;
        }

        if (!data.category) {
            el.groupCategory.classList.add("is-invalid");
            el.groupCategoryError.textContent = "A categoria é obrigatória.";
            valid = false;
        }

        if (!data.status) {
            el.groupStatusError.textContent = "Selecione um status.";
            valid = false;
        }

        if (
            data.parentId &&
            Number(data.parentId) === Number(data.id)
        ) {
            el.groupParent.classList.add("is-invalid");
            el.groupParentError.textContent =
                "Um grupo não pode ser pai de si mesmo.";
            valid = false;
        }

        if (!data.procedureIds.length) {
            el.proceduresError.textContent =
                "Associe pelo menos um procedimento ao grupo.";
            valid = false;
        }

        if (!valid) {
            showToast("Revise os campos obrigatórios.", "error");
        }

        return valid;
    }

    function collectFormData() {
        const status = el.statusActive.checked ? "ACTIVE" : "INACTIVE";

        const rules = {
            scheduling: document.getElementById("ruleScheduling").checked,
            authorization: document.getElementById("ruleAuthorization").checked,
            medicalRequest: document.getElementById("ruleMedicalRequest").checked,
            guide: document.getElementById("ruleGuide").checked,
            private: document.getElementById("rulePrivate").checked,
            agreement: document.getElementById("ruleAgreement").checked,
            billing: document.getElementById("ruleBilling").checked,
            walkIn: document.getElementById("ruleWalkIn").checked,
            digitalSignature: document.getElementById("ruleDigitalSignature").checked
        };

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
            status,
            procedureIds: clone(state.currentGroup?.procedureIds || []),
            rules,
            schedule: {
                duration: Number(el.defaultDuration.value) || 0,
                preparation: Number(el.preparationTime.value) || 0,
                interval: Number(el.intervalTime.value) || 0,
                room: el.requiredRoom.value,
                equipment: el.requiredEquipment.value,
                specialty: el.requiredSpecialty.value,
                professionals: getSelectedValues(el.qualifiedProfessional)
            },
            resources: {
                rooms: getSelectedValues(el.resourceRooms),
                equipment: getSelectedValues(el.resourceEquipment),
                professionals: getSelectedValues(el.resourceProfessionals),
                specialties: getSelectedValues(el.resourceSpecialties)
            },
            documents: clone(state.currentGroup?.documents || [])
        };
    }

    function saveGroup(event) {
        event.preventDefault();

        if (el.groupForm.querySelector(":disabled")) {
            closeModal("groupModal");
            return;
        }

        const data = collectFormData();

        if (!validateForm(data)) {
            return;
        }

        const now = currentDate();

        if (data.id) {
            const index = state.groups.findIndex(
                (group) => group.id === data.id
            );

            if (index === -1) {
                showToast("Grupo não encontrado.", "error");
                return;
            }

            const previous = state.groups[index];

            state.groups[index] = {
                ...previous,
                ...data,
                updatedAt: now,
                audit: [
                    {
                        user: "Administrador",
                        date: now,
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
                updatedAt: now,
                audit: [
                    {
                        user: "Administrador",
                        date: now,
                        action: "Criação",
                        field: "Grupo",
                        previous: "—",
                        next: data.name
                    }
                ],
                linkedRecords: false
            });

            showToast("Grupo criado com sucesso.", "success");
        }

        closeModal("groupModal");
        state.page = 1;
        renderGroups();
    }

    /* Ações */

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
        el.groupModalTitle.textContent = "Novo Grupo de Procedimentos";
        setFormReadonly(false);
        selectTab("general");
        openModal("groupModal");
    }

    function toggleGroupStatus(group) {
        const active = group.status === "ACTIVE";

        openConfirmModal({
            title: active ? "Inativar grupo?" : "Ativar grupo?",
            message: active
                ? "Procedimentos associados continuarão disponíveis, mas o grupo não poderá ser utilizado em novos cadastros."
                : "O grupo será disponibilizado para novos cadastros.",
            confirmLabel: active ? "Inativar" : "Ativar",
            type: active ? "danger" : "primary",
            action: () => {
                group.status = active ? "INACTIVE" : "ACTIVE";
                group.updatedAt = currentDate();
                group.audit ||= [];

                group.audit.unshift({
                    user: "Administrador",
                    date: group.updatedAt,
                    action: active ? "Inativação" : "Ativação",
                    field: "Status",
                    previous: active ? "Ativo" : "Inativo",
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
        if (group.linkedRecords || group.procedureIds.length > 0) {
            openConfirmModal({
                title: "Grupo não pode ser excluído",
                message:
                    "Este grupo possui registros vinculados e não pode ser excluído. Utilize a opção Inativar.",
                confirmLabel: "Fechar",
                type: "primary",
                action: () => { }
            });

            return;
        }

        openConfirmModal({
            title: "Excluir grupo?",
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

    function manageProcedures(group) {
        state.currentGroup = clone(group);
        renderProcedures();
        populateResources(group);
        selectTab("procedures");
        setFormReadonly(false);
        el.groupModalTitle.textContent = "Gerenciar Procedimentos";
        openModal("groupModal");
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

    /* Eventos */

    function bindEvents() {
        el.newGroupBtn.addEventListener("click", openNewGroup);
        el.emptyCreateBtn.addEventListener("click", openNewGroup);
        el.groupForm.addEventListener("submit", saveGroup);
        el.documentForm.addEventListener("submit", addDocument);

        el.clearFiltersBtn.addEventListener("click", clearFilters);
        el.retryBtn.addEventListener("click", initialize);

        [el.groupSearch, el.topSearch].forEach((field) => {
            field.addEventListener("input", (event) => {
                if (field === el.topSearch) {
                    el.groupSearch.value = event.target.value;
                } else {
                    el.topSearch.value = event.target.value;
                }

                state.page = 1;
                renderGroups();
            });
        });

        [el.filterCategory, el.filterStatus, el.filterParent].forEach(
            (field) => {
                field.addEventListener("change", () => {
                    state.page = 1;
                    renderGroups();
                });
            }
        );

        el.previousPageBtn.addEventListener("click", () => {
            if (state.page > 1) {
                state.page -= 1;
                renderGroups();
            }
        });

        el.nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(
                filterGroups().length / state.pageSize
            );

            if (state.page < totalPages) {
                state.page += 1;
                renderGroups();
            }
        });

        el.addProcedureBtn.addEventListener("click", openProcedureModal);
        el.associateProceduresBtn.addEventListener(
            "click",
            associateProcedures
        );

        el.procedureModalSearch.addEventListener(
            "input",
            renderProcedureResults
        );

        el.procedureSpecialtyFilter.addEventListener(
            "change",
            renderProcedureResults
        );

        el.selectAllProcedures.addEventListener("change", (event) => {
            const currentIds = new Set(
                state.currentGroup?.procedureIds || []
            );

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

            currentIds.forEach((id) =>
                state.selectedProcedureIds.delete(id)
            );

            updateSelectedProcedureCount();
        });

        el.addDocumentBtn.addEventListener("click", openDocumentModal);

        el.confirmActionBtn.addEventListener("click", () => {
            const action = state.pendingAction;
            closeModal("confirmModal");
            state.pendingAction = null;
            action?.();
        });

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

            if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(
                document.activeElement.tagName
            )) {
                event.preventDefault();
                el.groupSearch.focus();
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

        const action = event.target.closest("[data-action]");

        if (action) {
            const row = action.closest(".group-row");
            const group = getGroup(row?.dataset.id);

            document.querySelectorAll(".row-menu").forEach((menu) => {
                menu.classList.add("hidden");
            });

            if (group) {
                handleGroupAction(action.dataset.action, group);
            }

            return;
        }

        const removeProcedureButton = event.target.closest(
            "[data-remove-procedure]"
        );

        if (removeProcedureButton) {
            removeProcedure(removeProcedureButton.dataset.removeProcedure);
            return;
        }

        const removeDocumentButton = event.target.closest(
            "[data-remove-document]"
        );

        if (removeDocumentButton) {
            removeDocument(removeDocumentButton.dataset.removeDocument);
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

            updateSelectedProcedureCount();
        }

        if (!event.target.closest(".row-actions")) {
            document.querySelectorAll(".row-menu").forEach((menu) => {
                menu.classList.add("hidden");
            });
        }
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

            case "procedures":
                manageProcedures(group);
                break;

            case "toggle":
                toggleGroupStatus(group);
                break;

            case "delete":
                deleteGroup(group);
                break;

            default:
                break;
        }
    }

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

    async function loadGroups() {
        return clone(groupsMock);
    }

    async function loadProcedures() {
        return clone(proceduresMock);
    }

    async function initialize() {
        cacheElements();

        el.groupsLoading.classList.remove("hidden");
        el.groupsTableWrapper.classList.add("hidden");
        el.groupsEmptyState.classList.add("hidden");
        el.groupsErrorState.classList.add("hidden");

        try {
            state.groups = await loadGroups();
            state.procedures = await loadProcedures();

            populateParentGroups();
            populateResources();
            bindEvents();

            window.setTimeout(() => {
                el.groupsLoading.classList.add("hidden");
                renderGroups();
            }, 350);
        } catch (error) {
            el.groupsLoading.classList.add("hidden");
            el.groupsErrorState.classList.remove("hidden");
            showToast("Não foi possível carregar os grupos.", "error");
        }
    }

    initialize();
})();