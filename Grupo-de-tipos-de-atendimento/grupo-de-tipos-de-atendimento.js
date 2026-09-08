(() => {
    "use strict";

    const state = {
        types: [],
        groups: [],
        specialties: [
            "Clínica Médica",
            "Cardiologia",
            "Pediatria",
            "Ginecologia",
            "Ortopedia",
            "Dermatologia",
            "Radiologia",
            "Neurologia",
            "Enfermagem",
            "Nutrição",
            "Psicologia"
        ],
        professionals: [
            "Dr. Carlos Mendes",
            "Dra. Ana Oliveira",
            "Dr. Marcos Silva",
            "Dra. Juliana Costa"
        ],
        procedures: [],
        currentType: null,
        selectedSpecialties: new Set(),
        selectedProcedures: new Set(),
        pendingAction: null,
        page: 1,
        pageSize: 10,
        lastFocusedElement: null,
        eventsBound: false
    };

    const el = {};

    const procedureData = [
        ["PROC001", "Consulta Clínica", "Clínica Médica", 30],
        ["PROC002", "Consulta Cardiológica", "Cardiologia", 40],
        ["PROC003", "Consulta Pediátrica", "Pediatria", 30],
        ["PROC004", "Eletrocardiograma", "Cardiologia", 20],
        ["PROC005", "Holter", "Cardiologia", 30],
        ["PROC006", "MAPA", "Cardiologia", 30],
        ["PROC007", "Ultrassonografia", "Radiologia", 40],
        ["PROC008", "Radiografia", "Radiologia", 20],
        ["PROC009", "Consulta Ortopédica", "Ortopedia", 40],
        ["PROC010", "Avaliação Nutricional", "Nutrição", 40],
        ["PROC011", "Consulta Neurológica", "Neurologia", 45],
        ["PROC012", "Atendimento de Enfermagem", "Enfermagem", 30],
        ["PROC013", "Consulta Ginecológica", "Ginecologia", 40],
        ["PROC014", "Ressonância Magnética", "Radiologia", 60],
        ["PROC015", "Tomografia Computadorizada", "Radiologia", 45]
    ];

    const groupData = [
        {
            id: 1,
            code: "GA001",
            name: "Atendimento Ambulatorial",
            category: "Ambulatorial",
            status: "ACTIVE"
        },
        {
            id: 2,
            code: "GA002",
            name: "Atendimento Diagnóstico",
            category: "Diagnóstico",
            status: "ACTIVE"
        },
        {
            id: 3,
            code: "GA003",
            name: "Atendimento de Urgência",
            category: "Urgência",
            status: "ACTIVE"
        },
        {
            id: 4,
            code: "GA004",
            name: "Atendimento Cirúrgico",
            category: "Cirúrgico",
            status: "ACTIVE"
        },
        {
            id: 5,
            code: "GA005",
            name: "Atendimento Domiciliar",
            category: "Domiciliar",
            status: "ACTIVE"
        }
    ];

    function cacheElements() {
        const ids = [
            "newAttendanceTypeBtn",
            "emptyCreateBtn",
            "topSearch",
            "attendanceTypeSearch",
            "filterGroup",
            "filterCategory",
            "filterModality",
            "filterStatus",
            "clearFiltersBtn",
            "attendanceTypesTableBody",
            "typesTableWrapper",
            "typesLoading",
            "typesEmptyState",
            "typesErrorState",
            "retryBtn",
            "resultCount",
            "pagination",
            "paginationInfo",
            "pageLabel",
            "previousPageBtn",
            "nextPageBtn",
            "totalTypesMetric",
            "activeTypesMetric",
            "specialtiesMetric",
            "proceduresMetric",
            "attendanceTypeModal",
            "attendanceTypeModalTitle",
            "attendanceTypeForm",
            "attendanceTypeId",
            "attendanceTypeCode",
            "attendanceTypeName",
            "attendanceTypeShortName",
            "attendanceTypeGroup",
            "attendanceTypeCategory",
            "attendanceTypeDescription",
            "codeError",
            "nameError",
            "groupError",
            "categoryError",
            "statusError",
            "statusActive",
            "statusInactive",
            "modalityError",
            "duration",
            "preparationTime",
            "intervalTime",
            "minimumAdvance",
            "maximumAdvance",
            "scheduleInheritanceStatus",
            "restoreInheritedScheduleBtn",
            "specialtiesEmptyState",
            "specialtiesTableWrapper",
            "specialtiesTableBody",
            "addSpecialtyBtn",
            "specialtyModal",
            "specialtySearch",
            "specialtyResults",
            "associateSpecialtiesBtn",
            "qualifiedProfessionals",
            "professionalsTableWrapper",
            "professionalsTableBody",
            "proceduresEmptyState",
            "proceduresTableWrapper",
            "proceduresTableBody",
            "addProcedureBtn",
            "procedureModal",
            "procedureSearch",
            "procedureSpecialtyFilter",
            "selectAllProcedures",
            "selectedProcedureCount",
            "procedureResults",
            "procedureResultsEmpty",
            "associateProceduresBtn",
            "documentsEmptyState",
            "documentsTableWrapper",
            "documentsTableBody",
            "addDocumentBtn",
            "documentModal",
            "documentForm",
            "documentName",
            "documentNameError",
            "documentType",
            "documentMoment",
            "documentRequired",
            "confirmModal",
            "confirmModalTitle",
            "confirmModalMessage",
            "confirmActionBtn",
            "toastArea",
            "auditUser",
            "auditDate",
            "auditTimeline",
            "typeUnits",
            "typeSectors",
            "typeRooms",
            "typeResourceRooms",
            "typeResourceEquipment",
            "typeResourceStaff"
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

    function currentDate() {
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

    function nextCode() {
        const max = Math.max(
            0,
            ...state.types.map((type) =>
                Number(String(type.code).replace(/\D/g, ""))
            )
        );

        return `TA${String(max + 1).padStart(3, "0")}`;
    }

    function getType(id) {
        return state.types.find((type) => type.id === Number(id));
    }

    function getGroup(id) {
        return state.groups.find((group) => group.id === Number(id));
    }

    function getProcedure(id) {
        return state.procedures.find(
            (procedure) => procedure.id === Number(id)
        );
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

    function createMockData() {
        state.groups = clone(groupData);

        state.procedures = procedureData.map(
            ([code, name, specialty, duration], index) => ({
                id: index + 1,
                code,
                name,
                specialty,
                duration,
                status: "ACTIVE"
            })
        );

        state.types = [
            createType(
                1,
                "Primeira Consulta",
                "1ª Consulta",
                1,
                "Consulta",
                ["Presencial", "Teleconsulta"],
                40,
                [1, 2],
                [1, 2]
            ),
            createType(
                2,
                "Retorno",
                "RET",
                1,
                "Retorno",
                ["Presencial"],
                20,
                [1],
                [1]
            ),
            createType(
                3,
                "Consulta Cardiológica",
                "CARD",
                1,
                "Consulta",
                ["Presencial", "Teleconsulta"],
                40,
                [2],
                [2, 4, 5, 6]
            ),
            createType(
                4,
                "Teleconsulta",
                "TELE",
                1,
                "Telemedicina",
                ["Telemedicina", "Teleconsulta"],
                30,
                [1, 2],
                [1, 2]
            ),
            createType(
                5,
                "Triagem Inicial",
                "TRI",
                3,
                "Triagem",
                ["Presencial"],
                15,
                [7],
                []
            ),
            createType(
                6,
                "Atendimento de Urgência",
                "URG",
                3,
                "Urgência",
                ["Presencial"],
                30,
                [1, 7],
                [12]
            ),
            createType(
                7,
                "Consulta Pediátrica",
                "PED",
                1,
                "Consulta",
                ["Presencial", "Teleconsulta"],
                30,
                [3],
                [3]
            ),
            createType(
                8,
                "Avaliação Ortopédica",
                "ORT",
                1,
                "Avaliação",
                ["Presencial"],
                40,
                [5],
                [9]
            ),
            createType(
                9,
                "Atendimento Domiciliar",
                "DOM",
                5,
                "Domiciliar",
                ["Domiciliar"],
                60,
                [1, 7],
                [1, 10]
            ),
            createType(
                10,
                "Avaliação Pré-operatória",
                "PREOP",
                4,
                "Pré-operatório",
                ["Presencial"],
                45,
                [1, 7],
                [9]
            )
        ];
    }

    function createType(
        id,
        name,
        shortName,
        groupId,
        category,
        modalities,
        duration,
        specialtyIds,
        procedureIds
    ) {
        return {
            id,
            code: `TA${String(id).padStart(3, "0")}`,
            name,
            shortName,
            groupId,
            category,
            description: `Configuração administrativa para ${name.toLowerCase()}.`,
            modalities,
            duration,
            preparationTime: 5,
            intervalTime: 5,
            minimumAdvance: 30,
            maximumAdvance: 90,
            status: "ACTIVE",
            specialtyIds,
            professionalIds: [],
            procedureIds,
            inheritedSchedule: true,
            schedule: {
                allowsScheduling: true,
                allowsWalkIn: false,
                allowsWaitlist: true,
                allowsRescheduling: true,
                allowsCancellation: true,
                requiresConfirmation: true
            },
            workflow: {
                scheduling: true,
                confirmation: true,
                checkIn: true,
                triage: false,
                waiting: true,
                attendance: true,
                procedure: false,
                medicalRecord: true,
                completion: true,
                billing: false
            },
            triage: {
                required: false,
                vitalSigns: false,
                riskClassification: false,
                nursingAssessment: false
            },
            medicalRecord: {
                anamnesis: true,
                history: true,
                physicalExam: true,
                vitalSigns: false,
                diagnosis: true,
                prescription: true,
                examRequest: true,
                certificate: false,
                evolution: true,
                therapeuticPlan: false
            },
            documents: [],
            units: ["Unidade Centro"],
            sectors: ["Consultórios"],
            rooms: ["Consultório 01"],
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

    function filterAttendanceTypes() {
        const search = normalize(
            el.attendanceTypeSearch.value || el.topSearch.value
        );

        const group = el.filterGroup.value;
        const category = el.filterCategory.value;
        const modality = el.filterModality.value;
        const status = el.filterStatus.value;

        return state.types.filter((type) => {
            const searchable = normalize([
                type.code,
                type.name,
                type.shortName,
                type.description
            ].join(" "));

            return (
                (!search || searchable.includes(search)) &&
                (!group || String(type.groupId) === group) &&
                (!category || type.category === category) &&
                (!modality || type.modalities.includes(modality)) &&
                (!status || type.status === status)
            );
        });
    }

    function renderAttendanceTypes() {
        const filtered = filterAttendanceTypes();
        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / state.pageSize)
        );

        if (state.page > totalPages) {
            state.page = totalPages;
        }

        const start = (state.page - 1) * state.pageSize;
        const visible = filtered.slice(start, start + state.pageSize);

        el.attendanceTypesTableBody.innerHTML = "";

        visible.forEach((type) => {
            const group = getGroup(type.groupId);
            const row = document.createElement("tr");

            row.className = `attendance-type-row ${type.status === "INACTIVE" ? "is-inactive" : ""
                }`;

            row.dataset.id = type.id;

            row.innerHTML = `
                <td class="px-5 py-4 font-semibold text-primary-700">
                    ${escapeHtml(type.code)}
                </td>

                <td class="px-5 py-4">
                    <p class="font-semibold text-slate-900">
                        ${escapeHtml(type.name)}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                        ${escapeHtml(type.shortName || "Sem abreviação")}
                    </p>
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(group?.name || "—")}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(type.category)}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${escapeHtml(type.modalities.join(", "))}
                </td>

                <td class="px-5 py-4 text-slate-600">
                    ${type.duration} min
                </td>

                <td class="px-5 py-4">
                    <button type="button"
                        class="clickable-count"
                        data-view-specialties="${type.id}">
                        ${type.specialtyIds.length}
                        ${type.specialtyIds.length === 1 ? "especialidade" : "especialidades"}
                    </button>
                </td>

                <td class="px-5 py-4">
                    ${statusBadge(type.status)}
                </td>

                <td class="px-5 py-4 text-slate-500">
                    ${escapeHtml(type.updatedAt)}
                </td>

                <td class="px-5 py-4 text-right">
                    <div class="row-actions">
                        <button type="button"
                            class="row-menu-button"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            aria-label="Abrir ações de ${escapeHtml(type.name)}">
                            ⋮
                        </button>

                        <div class="row-menu hidden" role="menu">
                            <button type="button" data-action="view" role="menuitem">Visualizar</button>
                            <button type="button" data-action="edit" role="menuitem">Editar</button>
                            <button type="button" data-action="duplicate" role="menuitem">Duplicar</button>
                            <button type="button" data-action="specialties" role="menuitem">Gerenciar especialidades</button>
                            <button type="button" data-action="procedures" role="menuitem">Gerenciar procedimentos</button>
                            <button type="button" data-action="toggle" role="menuitem">
                                ${type.status === "ACTIVE" ? "Inativar" : "Ativar"}
                            </button>
                            <button type="button" data-action="delete" class="danger-action" role="menuitem">
                                Excluir
                            </button>
                        </div>
                    </div>
                </td>
            `;

            el.attendanceTypesTableBody.appendChild(row);
        });

        el.resultCount.textContent =
            `${filtered.length} ${filtered.length === 1 ? "tipo encontrado" : "tipos encontrados"
            }`;

        el.typesTableWrapper.classList.toggle("hidden", filtered.length === 0);
        el.typesEmptyState.classList.toggle("hidden", filtered.length > 0);
        el.pagination.classList.toggle("hidden", filtered.length === 0);

        el.paginationInfo.textContent = filtered.length
            ? `Exibindo ${start + 1}–${start + visible.length} de ${filtered.length} tipos`
            : "Exibindo 0 tipos";

        el.pageLabel.textContent =
            `Página ${state.page} de ${totalPages}`;

        el.previousPageBtn.disabled = state.page <= 1;
        el.nextPageBtn.disabled = state.page >= totalPages;

        updateMetrics();
    }

    function updateMetrics() {
        el.totalTypesMetric.textContent = state.types.length;

        el.activeTypesMetric.textContent =
            state.types.filter((type) => type.status === "ACTIVE").length;

        el.specialtiesMetric.textContent =
            new Set(state.types.flatMap((type) => type.specialtyIds)).size;

        el.proceduresMetric.textContent =
            new Set(state.types.flatMap((type) => type.procedureIds)).size;
    }

    function populateGroups() {
        el.filterGroup.innerHTML = `<option value="">Todos</option>`;
        el.attendanceTypeGroup.innerHTML =
            `<option value="">Selecione um grupo</option>`;

        state.groups.forEach((group) => {
            const filterOption = document.createElement("option");
            filterOption.value = group.id;
            filterOption.textContent = `${group.code} — ${group.name}`;
            el.filterGroup.appendChild(filterOption);

            const formOption = filterOption.cloneNode(true);
            el.attendanceTypeGroup.appendChild(formOption);
        });
    }

    /* Modal principal */

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

    function openNewAttendanceType() {
        state.currentType = {
            id: null,
            code: nextCode(),
            specialtyIds: [],
            professionalIds: [],
            procedureIds: [],
            modalities: [],
            documents: []
        };

        el.attendanceTypeForm.reset();
        el.attendanceTypeId.value = "";
        el.attendanceTypeCode.value = state.currentType.code;
        el.statusActive.checked = true;
        el.statusInactive.checked = false;

        el.attendanceTypeModalTitle.textContent =
            "Novo Tipo de Atendimento";

        populateGroups();
        populateResources();
        renderSpecialties();
        renderProfessionals();
        renderProcedures();
        renderDocuments([]);
        renderAudit(null);
        clearValidation();
        setFormReadonly(false);
        selectTab("general");
        openModal("attendanceTypeModal");
    }

    function openAttendanceType(type, readonly = false) {
        state.currentType = clone(type);

        populateGroups();
        populateResources(type);
        fillForm(type);
        renderSpecialties();
        renderProfessionals();
        renderProcedures();
        renderDocuments(type.documents || []);
        renderAudit(type);
        clearValidation();

        el.attendanceTypeModalTitle.textContent = readonly
            ? "Visualizar Tipo de Atendimento"
            : "Editar Tipo de Atendimento";

        setFormReadonly(readonly);
        selectTab("general");
        openModal("attendanceTypeModal");
    }

    function fillForm(type) {
        el.attendanceTypeId.value = type.id || "";
        el.attendanceTypeCode.value = type.code || "";
        el.attendanceTypeName.value = type.name || "";
        el.attendanceTypeShortName.value = type.shortName || "";
        el.attendanceTypeGroup.value = type.groupId || "";
        el.attendanceTypeCategory.value = type.category || "";
        el.attendanceTypeDescription.value = type.description || "";

        el.statusActive.checked = type.status === "ACTIVE";
        el.statusInactive.checked = type.status === "INACTIVE";

        [
            ["modalityInPerson", "Presencial"],
            ["modalityTelemedicine", "Telemedicina"],
            ["modalityTeleconsultation", "Teleconsulta"],
            ["modalityHomeCare", "Domiciliar"],
            ["modalityExternal", "Externo"],
            ["modalityPhone", "Telefone"]
        ].forEach(([id, value]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = type.modalities.includes(value);
        });

        el.duration.value = type.duration ?? 30;
        el.preparationTime.value = type.preparationTime ?? 5;
        el.intervalTime.value = type.intervalTime ?? 5;
        el.minimumAdvance.value = type.minimumAdvance ?? 30;
        el.maximumAdvance.value = type.maximumAdvance ?? 90;

        const schedule = type.schedule || {};

        setCheckbox("allowsScheduling", schedule.allowsScheduling);
        setCheckbox("allowsWalkIn", schedule.allowsWalkIn);
        setCheckbox("allowsWaitlist", schedule.allowsWaitlist);
        setCheckbox("allowsRescheduling", schedule.allowsRescheduling);
        setCheckbox("allowsCancellation", schedule.allowsCancellation);
        setCheckbox("requiresConfirmation", schedule.requiresConfirmation);

        fillWorkflow(type.workflow || {});
        fillTriage(type.triage || {});
        fillMedicalRecord(type.medicalRecord || {});
        fillChannels(type.modalities || []);

        setSelectedValues(el.typeUnits, type.units || []);
        setSelectedValues(el.typeSectors, type.sectors || []);
        setSelectedValues(el.typeRooms, type.rooms || []);
        setSelectedValues(el.typeResourceRooms, type.resources?.rooms || []);
        setSelectedValues(el.typeResourceEquipment, type.resources?.equipment || []);
        setSelectedValues(el.typeResourceStaff, type.resources?.staff || []);
        setSelectedValues(el.qualifiedProfessionals, type.professionalIds || []);
    }

    function setCheckbox(id, value) {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = Boolean(value);
    }

    function fillWorkflow(flow) {
        const map = {
            flowScheduling: flow.scheduling,
            flowConfirmation: flow.confirmation,
            flowCheckIn: flow.checkIn,
            flowTriage: flow.triage,
            flowWaiting: flow.waiting,
            flowAttendance: flow.attendance,
            flowProcedure: flow.procedure,
            flowMedicalRecord: flow.medicalRecord,
            flowCompletion: flow.completion,
            flowBilling: flow.billing
        };

        Object.entries(map).forEach(([id, value]) => setCheckbox(id, value));
    }

    function fillTriage(triage) {
        setCheckbox("requiresTriage", triage.required);
        setCheckbox("requiresVitalSigns", triage.vitalSigns);
        setCheckbox("requiresRiskClassification", triage.riskClassification);
        setCheckbox("requiresNursingAssessment", triage.nursingAssessment);
    }

    function fillMedicalRecord(record) {
        Object.entries({
            recordAnamnesis: record.anamnesis,
            recordHistory: record.history,
            recordPhysicalExam: record.physicalExam,
            recordVitalSigns: record.vitalSigns,
            recordDiagnosis: record.diagnosis,
            recordPrescription: record.prescription,
            recordExamRequest: record.examRequest,
            recordCertificate: record.certificate,
            recordEvolution: record.evolution,
            recordTherapeuticPlan: record.therapeuticPlan
        }).forEach(([id, value]) => setCheckbox(id, value));
    }

    function fillChannels(channels) {
        [
            ["modalityInPerson", "Presencial"],
            ["modalityTelemedicine", "Telemedicina"],
            ["modalityTeleconsultation", "Teleconsulta"],
            ["modalityHomeCare", "Domiciliar"],
            ["modalityExternal", "Externo"],
            ["modalityPhone", "Telefone"]
        ].forEach(([id, value]) => {
            setCheckbox(id, channels.includes(value));
        });
    }

    function setFormReadonly(readonly) {
        el.attendanceTypeForm
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

    function clearValidation() {
        [
            el.attendanceTypeCode,
            el.attendanceTypeName,
            el.attendanceTypeGroup,
            el.attendanceTypeCategory
        ].forEach((field) => field?.classList.remove("is-invalid"));

        [
            el.codeError,
            el.nameError,
            el.groupError,
            el.categoryError,
            el.statusError,
            el.modalityError
        ].forEach((field) => {
            if (field) field.textContent = "";
        });
    }

    /* Especialidades */

    function renderSpecialties() {
        const ids = state.currentType?.specialtyIds || [];

        el.specialtiesTableBody.innerHTML = "";

        const empty = ids.length === 0;

        el.specialtiesEmptyState.classList.toggle("hidden", !empty);
        el.specialtiesTableWrapper.classList.toggle("hidden", empty);

        ids.forEach((id) => {
            const name = state.specialties[Number(id) - 1] || id;
            const row = document.createElement("tr");

            row.className = "specialty-row";

            row.innerHTML = `
                <td class="px-4 py-4 font-medium text-slate-800">
                    ${escapeHtml(name)}
                </td>

                <td class="px-4 py-4 text-slate-600">
                    ${state.currentType.professionalIds?.length || 0}
                </td>

                <td class="px-4 py-4">
                    ${statusBadge("ACTIVE")}
                </td>

                <td class="px-4 py-4 text-right">
                    <button type="button"
                        class="remove-item-button"
                        data-remove-specialty="${escapeHtml(id)}"
                        aria-label="Remover especialidade ${escapeHtml(name)}">
                        ×
                    </button>
                </td>
            `;

            el.specialtiesTableBody.appendChild(row);
        });
    }

    function openSpecialtyModal() {
        state.selectedSpecialties.clear();
        renderSpecialtyResults();
        openModal("specialtyModal");
    }

    function renderSpecialtyResults() {
        const query = normalize(el.specialtySearch.value);
        const current = new Set(state.currentType?.specialtyIds || []);

        el.specialtyResults.innerHTML = "";

        state.specialties
            .filter((name) => !query || normalize(name).includes(query))
            .forEach((name, index) => {
                const id = String(index + 1);
                const label = document.createElement("label");

                label.className = `procedure-option ${current.has(Number(id)) ? "opacity-60" : ""
                    }`;

                label.innerHTML = `
                    <input type="checkbox"
                        data-specialty-id="${id}"
                        ${current.has(Number(id)) ? "disabled" : ""}>

                    <span class="flex-1">
                        <strong>${escapeHtml(name)}</strong>
                        <small>Especialidade disponível para associação</small>
                    </span>
                `;

                el.specialtyResults.appendChild(label);
            });
    }

    function associateSpecialties() {
        const current = new Set(state.currentType.specialtyIds || []);

        state.selectedSpecialties.forEach((id) => current.add(Number(id)));

        state.currentType.specialtyIds = [...current];

        renderSpecialties();
        closeModal("specialtyModal");
        selectTab("specialties");
        showToast("Especialidade associada com sucesso.", "success");
    }

    /* Profissionais */

    function renderProfessionals() {
        const ids = state.currentType?.professionalIds || [];

        el.professionalsTableBody.innerHTML = "";

        const empty = ids.length === 0;

        el.professionalsTableWrapper.classList.toggle("hidden", empty);

        ids.forEach((id) => {
            const name = state.professionals[Number(id) - 1] || id;
            const row = document.createElement("tr");

            row.className = "professional-row";

            row.innerHTML = `
                <td class="px-4 py-4 font-medium text-slate-800">
                    ${escapeHtml(name)}
                </td>
                <td class="px-4 py-4 text-slate-600">
                    Profissional habilitado
                </td>
                <td class="px-4 py-4 text-slate-600">
                    CRM/COREN simulado
                </td>
                <td class="px-4 py-4 text-slate-600">
                    Unidade Centro
                </td>
                <td class="px-4 py-4">
                    ${statusBadge("ACTIVE")}
                </td>
            `;

            el.professionalsTableBody.appendChild(row);
        });
    }

    /* Procedimentos */

    function renderProcedures() {
        const ids = state.currentType?.procedureIds || [];

        el.proceduresTableBody.innerHTML = "";

        const empty = ids.length === 0;

        el.proceduresEmptyState.classList.toggle("hidden", !empty);
        el.proceduresTableWrapper.classList.toggle("hidden", empty);

        ids.map(getProcedure).filter(Boolean).forEach((procedure) => {
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
                        class="remove-item-button"
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
        state.selectedProcedures.clear();
        populateSpecialtyFilter();
        renderProcedureResults();
        updateProcedureSelection();
        openModal("procedureModal");
    }

    function populateSpecialtyFilter() {
        el.procedureSpecialtyFilter.innerHTML =
            `<option value="">Todas</option>`;

        state.specialties.forEach((specialty) => {
            const option = document.createElement("option");
            option.value = specialty;
            option.textContent = specialty;
            el.procedureSpecialtyFilter.appendChild(option);
        });
    }

    function renderProcedureResults() {
        const query = normalize(el.procedureSearch.value);
        const specialty = el.procedureSpecialtyFilter.value;
        const current = new Set(state.currentType?.procedureIds || []);

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
            const disabled = current.has(procedure.id);
            const label = document.createElement("label");

            label.className = `procedure-option ${disabled ? "opacity-60" : ""
                }`;

            label.innerHTML = `
                <input type="checkbox"
                    data-procedure-id="${procedure.id}"
                    ${disabled ? "disabled" : ""}
                    ${state.selectedProcedures.has(procedure.id) ? "checked" : ""}>

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
        const count = state.selectedProcedures.size;

        el.selectedProcedureCount.textContent =
            `${count} ${count === 1
                ? "procedimento selecionado"
                : "procedimentos selecionados"
            }`;

        el.associateProceduresBtn.disabled = count === 0;
    }

    function associateProcedures() {
        const current = new Set(state.currentType.procedureIds || []);

        state.selectedProcedures.forEach((id) => current.add(Number(id)));

        state.currentType.procedureIds = [...current];

        renderProcedures();
        closeModal("procedureModal");
        selectTab("procedures");
        showToast("Procedimento associado com sucesso.", "success");
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

        const exists = state.currentType.documents.some(
            (document) => normalize(document.name) === normalize(name)
        );

        if (exists) {
            el.documentName.classList.add("is-invalid");
            el.documentNameError.textContent =
                "Este documento já está associado.";
            return;
        }

        state.currentType.documents.push({
            name,
            type: el.documentType.value,
            moment: el.documentMoment.value,
            required: el.documentRequired.checked,
            status: "ACTIVE"
        });

        renderDocuments(state.currentType.documents);
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
                    ${escapeHtml(document.moment)}
                </td>

                <td class="px-4 py-4 text-right">
                    <button type="button"
                        class="remove-item-button"
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
        state.currentType.documents.splice(Number(index), 1);
        renderDocuments(state.currentType.documents);
        showToast("Documento removido.", "info");
    }

    /* Formulário */

    function collectFormData() {
        const modalities = [
            ["modalityInPerson", "Presencial"],
            ["modalityTelemedicine", "Telemedicina"],
            ["modalityTeleconsultation", "Teleconsulta"],
            ["modalityHomeCare", "Domiciliar"],
            ["modalityExternal", "Externo"],
            ["modalityPhone", "Telefone"]
        ]
            .filter(([id]) => document.getElementById(id)?.checked)
            .map(([, value]) => value);

        return {
            id: el.attendanceTypeId.value
                ? Number(el.attendanceTypeId.value)
                : null,
            code: el.attendanceTypeCode.value.trim().toUpperCase(),
            name: el.attendanceTypeName.value.trim(),
            shortName: el.attendanceTypeShortName.value.trim(),
            groupId: Number(el.attendanceTypeGroup.value) || null,
            category: el.attendanceTypeCategory.value,
            description: el.attendanceTypeDescription.value.trim(),
            status: el.statusActive.checked ? "ACTIVE" : "INACTIVE",
            modalities,
            duration: Number(el.duration.value) || 0,
            preparationTime: Number(el.preparationTime.value) || 0,
            intervalTime: Number(el.intervalTime.value) || 0,
            minimumAdvance: Number(el.minimumAdvance.value) || 0,
            maximumAdvance: Number(el.maximumAdvance.value) || 0,
            specialtyIds: clone(state.currentType?.specialtyIds || []),
            professionalIds: getSelectedValues(el.qualifiedProfessionals),
            procedureIds: clone(state.currentType?.procedureIds || []),
            documents: clone(state.currentType?.documents || []),
            units: getSelectedValues(el.typeUnits),
            sectors: getSelectedValues(el.typeSectors),
            rooms: getSelectedValues(el.typeRooms),
            resources: {
                rooms: getSelectedValues(el.typeResourceRooms),
                equipment: getSelectedValues(el.typeResourceEquipment),
                staff: getSelectedValues(el.typeResourceStaff)
            },
            schedule: {
                allowsScheduling: checked("allowsScheduling"),
                allowsWalkIn: checked("allowsWalkIn"),
                allowsWaitlist: checked("allowsWaitlist"),
                allowsRescheduling: checked("allowsRescheduling"),
                allowsCancellation: checked("allowsCancellation"),
                requiresConfirmation: checked("requiresConfirmation")
            },
            workflow: readWorkflow(),
            triage: readTriage(),
            medicalRecord: readMedicalRecord(),
            agreements: clone(state.currentType?.agreements || {})
        };
    }

    function checked(id) {
        return Boolean(document.getElementById(id)?.checked);
    }

    function readWorkflow() {
        return {
            scheduling: checked("flowScheduling"),
            confirmation: checked("flowConfirmation"),
            checkIn: checked("flowCheckIn"),
            triage: checked("flowTriage"),
            waiting: checked("flowWaiting"),
            attendance: checked("flowAttendance"),
            procedure: checked("flowProcedure"),
            medicalRecord: checked("flowMedicalRecord"),
            completion: checked("flowCompletion"),
            billing: checked("flowBilling")
        };
    }

    function readTriage() {
        return {
            required: checked("requiresTriage"),
            vitalSigns: checked("requiresVitalSigns"),
            riskClassification: checked("requiresRiskClassification"),
            nursingAssessment: checked("requiresNursingAssessment")
        };
    }

    function readMedicalRecord() {
        return {
            anamnesis: checked("recordAnamnesis"),
            history: checked("recordHistory"),
            physicalExam: checked("recordPhysicalExam"),
            vitalSigns: checked("recordVitalSigns"),
            diagnosis: checked("recordDiagnosis"),
            prescription: checked("recordPrescription"),
            examRequest: checked("recordExamRequest"),
            certificate: checked("recordCertificate"),
            evolution: checked("recordEvolution"),
            therapeuticPlan: checked("recordTherapeuticPlan")
        };
    }

    function validateForm(data) {
        clearValidation();

        let valid = true;

        const duplicateCode = state.types.some(
            (type) => type.code === data.code && type.id !== data.id
        );

        const duplicateName = state.types.some(
            (type) =>
                normalize(type.name) === normalize(data.name) &&
                type.id !== data.id
        );

        if (!data.code) {
            el.codeError.textContent = "O código é obrigatório.";
            el.attendanceTypeCode.classList.add("is-invalid");
            valid = false;
        } else if (duplicateCode) {
            el.codeError.textContent = "Este código já está cadastrado.";
            el.attendanceTypeCode.classList.add("is-invalid");
            valid = false;
        }

        if (!data.name) {
            el.nameError.textContent =
                "O nome do tipo de atendimento é obrigatório.";
            el.attendanceTypeName.classList.add("is-invalid");
            valid = false;
        } else if (duplicateName) {
            el.nameError.textContent = "Este nome já está cadastrado.";
            el.attendanceTypeName.classList.add("is-invalid");
            valid = false;
        }

        if (!data.groupId) {
            el.groupError.textContent =
                "O Grupo de Atendimento é obrigatório.";
            el.attendanceTypeGroup.classList.add("is-invalid");
            valid = false;
        }

        if (!data.category) {
            el.categoryError.textContent = "A categoria é obrigatória.";
            el.attendanceTypeCategory.classList.add("is-invalid");
            valid = false;
        }

        if (!data.status) {
            el.statusError.textContent = "Selecione um status.";
            valid = false;
        }

        if (!data.modalities.length) {
            el.modalityError.textContent =
                "Selecione pelo menos uma modalidade.";
            valid = false;
        }

        if (data.duration <= 0) {
            showToast("A duração deve ser maior que zero.", "error");
            valid = false;
        }

        if (data.intervalTime < 0 || data.preparationTime < 0) {
            showToast("Os tempos não podem ser negativos.", "error");
            valid = false;
        }

        if (data.minimumAdvance < 0 || data.maximumAdvance < 0) {
            showToast("Os valores de antecedência não podem ser negativos.", "error");
            valid = false;
        }

        if (!valid) {
            showToast("Revise os campos obrigatórios.", "error");
        }

        return valid;
    }

    function saveAttendanceType(event) {
        event.preventDefault();

        const data = collectFormData();

        if (!validateForm(data)) {
            return;
        }

        const date = currentDate();

        if (data.id) {
            const index = state.types.findIndex(
                (type) => type.id === data.id
            );

            const previous = state.types[index];

            state.types[index] = {
                ...previous,
                ...data,
                updatedAt: date,
                audit: [
                    {
                        user: "Administrador",
                        date,
                        action: "Alteração",
                        field: "Dados do tipo",
                        previous: previous.name,
                        next: data.name
                    },
                    ...(previous.audit || [])
                ]
            };

            showToast(
                "Tipo de atendimento atualizado com sucesso.",
                "success"
            );
        } else {
            const id =
                Math.max(0, ...state.types.map((type) => type.id)) + 1;

            state.types.push({
                ...data,
                id,
                linkedRecords: false,
                updatedAt: date,
                audit: [
                    {
                        user: "Administrador",
                        date,
                        action: "Criação",
                        field: "Tipo de atendimento",
                        previous: "—",
                        next: data.name
                    }
                ]
            });

            showToast(
                "Tipo de atendimento criado com sucesso.",
                "success"
            );
        }

        closeModal("attendanceTypeModal");
        state.page = 1;
        renderAttendanceTypes();
    }

    /* Ações */

    function duplicateAttendanceType(type) {
        state.currentType = clone({
            ...type,
            id: null,
            code: nextCode(),
            name: `${type.name} - Cópia`,
            shortName: `${type.shortName || "Tipo"} 2`,
            status: "ACTIVE"
        });

        populateGroups();
        fillForm(state.currentType);

        el.attendanceTypeId.value = "";
        el.attendanceTypeCode.value = nextCode();
        el.attendanceTypeName.value = `${type.name} - Cópia`;
        el.attendanceTypeModalTitle.textContent =
            "Novo Tipo de Atendimento";

        setFormReadonly(false);
        selectTab("general");
        openModal("attendanceTypeModal");
    }

    function toggleAttendanceType(type) {
        const active = type.status === "ACTIVE";

        openConfirmModal({
            title: active
                ? "Inativar tipo de atendimento?"
                : "Ativar tipo de atendimento?",
            message: active
                ? "O cadastro continuará disponível para consulta histórica, mas não poderá ser utilizado em novos atendimentos."
                : "O tipo será disponibilizado para novos atendimentos.",
            confirmLabel: active ? "Inativar" : "Ativar",
            type: active ? "danger" : "primary",
            action: () => {
                const previous = type.status;

                type.status = active ? "INACTIVE" : "ACTIVE";
                type.updatedAt = currentDate();
                type.audit ||= [];

                type.audit.unshift({
                    user: "Administrador",
                    date: type.updatedAt,
                    action: active ? "Inativação" : "Ativação",
                    field: "Status",
                    previous: previous === "ACTIVE" ? "Ativo" : "Inativo",
                    next: active ? "Inativo" : "Ativo"
                });

                renderAttendanceTypes();

                showToast(
                    active
                        ? "Tipo inativado com sucesso."
                        : "Tipo ativado com sucesso.",
                    "success"
                );
            }
        });
    }

    function deleteAttendanceType(type) {
        if (type.linkedRecords) {
            openConfirmModal({
                title: "Tipo não pode ser excluído",
                message:
                    'Este tipo de atendimento possui registros históricos e não pode ser excluído. Utilize a opção "Inativar".',
                confirmLabel: "Fechar",
                type: "primary",
                action: () => { }
            });

            return;
        }

        openConfirmModal({
            title: "Excluir tipo de atendimento?",
            message: "Esta ação não poderá ser desfeita.",
            confirmLabel: "Excluir",
            type: "danger",
            action: () => {
                state.types = state.types.filter(
                    (item) => item.id !== type.id
                );

                renderAttendanceTypes();
                showToast(
                    "Tipo de atendimento removido com sucesso.",
                    "success"
                );
            }
        });
    }

    function openConfirmModal(config) {
        el.confirmModalTitle.textContent = config.title;
        el.confirmModalMessage.textContent = config.message;
        el.confirmActionBtn.textContent = config.confirmLabel;

        el.confirmActionBtn.className =
            config.type === "danger"
                ? "inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-5 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                : "action-primary";

        state.pendingAction = config.action;
        openModal("confirmModal");
    }

    /* Auditoria */

    function renderAudit(type) {
        el.auditTimeline.innerHTML = "";

        if (!type || !type.audit?.length) {
            el.auditUser.textContent = "—";
            el.auditDate.textContent = "—";

            el.auditTimeline.innerHTML = `
                <li>
                    <p>Nenhum evento de auditoria registrado.</p>
                </li>
            `;

            return;
        }

        el.auditUser.textContent = type.audit[0].user;
        el.auditDate.textContent = type.audit[0].date;

        type.audit.forEach((event) => {
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

    /* Recursos */

    function populateResources() {
        populateSelect(el.typeUnits, [
            "Unidade Centro",
            "Unidade Norte",
            "Unidade Sul"
        ]);

        populateSelect(el.typeRooms, [
            "Consultório 01",
            "Consultório 02",
            "Sala de Triagem",
            "Sala de Procedimentos"
        ]);

        populateSelect(el.typeResourceRooms, [
            "Consultório 01",
            "Consultório 02",
            "Sala de Triagem",
            "Sala de Procedimentos"
        ]);

        populateSelect(el.typeResourceEquipment, [
            "Eletrocardiógrafo",
            "Ultrassonógrafo",
            "Monitor multiparamétrico",
            "Equipamento de imagem"
        ]);

        populateSelect(el.qualifiedProfessionals, state.professionals);
    }

    /* Eventos */

    function bindEvents() {
        if (state.eventsBound) return;

        state.eventsBound = true;

        el.newAttendanceTypeBtn.addEventListener(
            "click",
            openNewAttendanceType
        );

        el.emptyCreateBtn.addEventListener(
            "click",
            openNewAttendanceType
        );

        el.attendanceTypeForm.addEventListener(
            "submit",
            saveAttendanceType
        );

        el.addSpecialtyBtn.addEventListener(
            "click",
            openSpecialtyModal
        );

        el.associateSpecialtiesBtn.addEventListener(
            "click",
            associateSpecialties
        );

        el.specialtySearch.addEventListener(
            "input",
            renderSpecialtyResults
        );

        el.addProcedureBtn.addEventListener(
            "click",
            openProcedureModal
        );

        el.associateProceduresBtn.addEventListener(
            "click",
            associateProcedures
        );

        el.procedureSearch.addEventListener(
            "input",
            renderProcedureResults
        );

        el.procedureSpecialtyFilter.addEventListener(
            "change",
            renderProcedureResults
        );

        el.addDocumentBtn.addEventListener(
            "click",
            openDocumentModal
        );

        el.documentForm.addEventListener(
            "submit",
            addDocument
        );

        el.restoreInheritedScheduleBtn.addEventListener("click", () => {
            el.duration.value = 30;
            el.preparationTime.value = 5;
            el.intervalTime.value = 5;
            el.minimumAdvance.value = 30;
            el.maximumAdvance.value = 90;

            el.scheduleInheritanceStatus.textContent =
                "Herdado do grupo";

            showToast(
                "Configurações herdadas restauradas.",
                "info"
            );
        });

        [el.attendanceTypeSearch, el.topSearch].forEach((input) => {
            input.addEventListener("input", (event) => {
                el.attendanceTypeSearch.value = event.target.value;
                el.topSearch.value = event.target.value;
                state.page = 1;
                renderAttendanceTypes();
            });
        });

        [
            el.filterGroup,
            el.filterCategory,
            el.filterModality,
            el.filterStatus
        ].forEach((field) => {
            field.addEventListener("change", () => {
                state.page = 1;
                renderAttendanceTypes();
            });
        });

        el.clearFiltersBtn.addEventListener("click", () => {
            el.topSearch.value = "";
            el.attendanceTypeSearch.value = "";
            el.filterGroup.value = "";
            el.filterCategory.value = "";
            el.filterModality.value = "";
            el.filterStatus.value = "";
            state.page = 1;
            renderAttendanceTypes();
        });

        el.previousPageBtn.addEventListener("click", () => {
            if (state.page > 1) {
                state.page -= 1;
                renderAttendanceTypes();
            }
        });

        el.nextPageBtn.addEventListener("click", () => {
            const pages = Math.ceil(
                filterAttendanceTypes().length / state.pageSize
            );

            if (state.page < pages) {
                state.page += 1;
                renderAttendanceTypes();
            }
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
            const row = actionButton.closest(".attendance-type-row");
            const type = getType(row?.dataset.id);

            document.querySelectorAll(".row-menu").forEach((menu) => {
                menu.classList.add("hidden");
            });

            if (!type) return;

            switch (actionButton.dataset.action) {
                case "view":
                    openAttendanceType(type, true);
                    break;
                case "edit":
                    openAttendanceType(type, false);
                    break;
                case "duplicate":
                    duplicateAttendanceType(type);
                    break;
                case "specialties":
                    openAttendanceType(type, false);
                    selectTab("specialties");
                    break;
                case "procedures":
                    openAttendanceType(type, false);
                    selectTab("procedures");
                    break;
                case "toggle":
                    toggleAttendanceType(type);
                    break;
                case "delete":
                    deleteAttendanceType(type);
                    break;
                default:
                    break;
            }

            return;
        }

        const specialtyCheckbox = event.target.closest("[data-specialty-id]");

        if (specialtyCheckbox) {
            const id = Number(specialtyCheckbox.dataset.specialtyId);

            if (specialtyCheckbox.checked) {
                state.selectedSpecialties.add(id);
            } else {
                state.selectedSpecialties.delete(id);
            }

            el.associateSpecialtiesBtn.disabled =
                state.selectedSpecialties.size === 0;

            return;
        }

        const procedureCheckbox = event.target.closest(
            "[data-procedure-id]"
        );

        if (procedureCheckbox) {
            const id = Number(procedureCheckbox.dataset.procedureId);

            if (procedureCheckbox.checked) {
                state.selectedProcedures.add(id);
            } else {
                state.selectedProcedures.delete(id);
            }

            updateProcedureSelection();
            return;
        }

        const removeSpecialty = event.target.closest(
            "[data-remove-specialty]"
        );

        if (removeSpecialty) {
            state.currentType.specialtyIds =
                state.currentType.specialtyIds.filter(
                    (id) => id !== Number(removeSpecialty.dataset.removeSpecialty)
                );

            renderSpecialties();
            return;
        }

        const removeProcedure = event.target.closest(
            "[data-remove-procedure]"
        );

        if (removeProcedure) {
            state.currentType.procedureIds =
                state.currentType.procedureIds.filter(
                    (id) => id !== Number(removeProcedure.dataset.removeProcedure)
                );

            renderProcedures();
            return;
        }

        const removeDocument = event.target.closest(
            "[data-remove-document]"
        );

        if (removeDocument) {
            removeDocumentByIndex(removeDocument.dataset.removeDocument);
            return;
        }

        const viewSpecialties = event.target.closest(
            "[data-view-specialties]"
        );

        if (viewSpecialties) {
            const type = getType(viewSpecialties.dataset.viewSpecialties);

            if (type) {
                openAttendanceType(type, true);
                selectTab("specialties");
            }

            return;
        }

        if (!event.target.closest(".row-actions")) {
            document.querySelectorAll(".row-menu").forEach((menu) => {
                menu.classList.add("hidden");
            });
        }
    }

    function removeDocumentByIndex(index) {
        state.currentType.documents.splice(Number(index), 1);
        renderDocuments(state.currentType.documents);
        showToast("Documento removido.", "info");
    }

    function initialize() {
        cacheElements();

        el.typesLoading.classList.remove("hidden");
        el.typesTableWrapper.classList.add("hidden");
        el.typesEmptyState.classList.add("hidden");
        el.typesErrorState.classList.add("hidden");

        try {
            if (!state.types.length) {
                createMockData();
            }

            populateGroups();
            populateResources();
            bindEvents();

            window.setTimeout(() => {
                el.typesLoading.classList.add("hidden");
                renderAttendanceTypes();
            }, 350);
        } catch (error) {
            console.error("Erro ao inicializar Tipos de Atendimento:", error);

            el.typesLoading.classList.add("hidden");
            el.typesErrorState.classList.remove("hidden");

            showToast(
                "Não foi possível carregar os tipos de atendimento.",
                "error"
            );
        }
    }

    initialize();

    window.GM4medTiposAtendimento = {
        loadAttendanceTypes: async () => clone(state.types),
        loadGroups: async () => clone(state.groups),
        loadSpecialties: async () => clone(state.specialties),
        loadProfessionals: async () => clone(state.professionals),
        loadProcedures: async () => clone(state.procedures)
    };
})();