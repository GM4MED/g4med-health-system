(() => {
    "use strict";

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const CONFIG = {
        storageKey: "GM4med-procedure",
        maxFileSize: 10 * 1024 * 1024,

        allowedFileTypes: new Set([
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ])
    };

    const patients = [
        {
            name: "Carolina Mendes",
            cpf: "123.456.789-00",
            birth: "14/03/1988",
            record: "PRT-004821",
            sex: "Feminino",
            history: [
                "12/08/2026 | Consulta | Dra. Ana Costa | Concluído",
                "29/07/2026 | Exame laboratorial | Dr. João Silva | Concluído",
                "18/07/2026 | Prescrição | Dra. Ana Costa | Concluído"
            ]
        },
        {
            name: "Roberto Almeida",
            cpf: "987.654.321-00",
            birth: "22/11/1975",
            record: "PRT-003117",
            sex: "Masculino",
            history: [
                "10/08/2026 | Retorno | Dr. João Silva | Concluído",
                "02/08/2026 | Exame de imagem | Dra. Ana Costa | Concluído"
            ]
        },
        {
            name: "Mariana Souza",
            cpf: "456.789.123-00",
            birth: "05/09/1996",
            record: "PRT-005903",
            sex: "Feminino",
            history: [
                "15/08/2026 | Triagem | Maria Souza | Concluído"
            ]
        }
    ];

    const state = {
        patient: null,
        files: [],
        audit: [],
        toastTimer: null
    };

    const elements = {
        form: $("#procedure-form"),
        toast: $("#toast"),

        patientSearch: $("#patient-search"),
        patientResults: $("#patient-results"),
        patientHistory: $("#patient-history"),
        patientName: $("#patient-name"),
        patientCpf: $("#patient-cpf"),
        patientBirth: $("#patient-birth"),
        patientRecord: $("#patient-record"),
        patientSex: $("#patient-sex"),
        viewRecord: $("#view-record"),

        historyModal: $("#history-modal"),
        historyPatient: $("#history-patient"),
        historyContent: $("#history-content"),

        procedure: $("#procedure-search"),
        responsible: $("#responsible"),
        procedureDate: $("#procedure-date"),
        startTime: $("#start-time"),
        endTime: $("#end-time"),
        duration: $("#duration"),
        status: $("#status"),
        headerStatus: $("#header-status"),

        clinicalDescription: $("#clinical-description"),

        professionalsBody: $("#professionals-body"),
        materialsBody: $("#materials-body"),

        fileInput: $("#file-input"),
        dropZone: $("#drop-zone"),
        attachmentsBody: $("#attachments-body"),

        auditTimeline: $("#audit-timeline")
    };

    function escapeHtml(value) {
        const element = document.createElement("div");

        element.textContent = String(value ?? "");

        return element.innerHTML;
    }

    function formatDate(date = new Date()) {
        return new Intl.DateTimeFormat("pt-BR").format(date);
    }

    function formatDateTime(date = new Date()) {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(date);
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }

    function notify(message) {
        if (!elements.toast) {
            return;
        }

        window.clearTimeout(state.toastTimer);

        elements.toast.textContent = message;
        elements.toast.classList.add("show");

        state.toastTimer = window.setTimeout(() => {
            elements.toast.classList.remove("show");
        }, 3200);
    }

    function setStatus() {
        if (!elements.status || !elements.headerStatus) {
            return;
        }

        const statusClasses = {
            Agendado: "status-agendado",
            "Em andamento": "status-andamento",
            Concluído: "status-concluido",
            Cancelado: "status-cancelado"
        };

        const status = elements.status.value;

        elements.headerStatus.textContent = status;
        elements.headerStatus.className =
            `status-badge ${statusClasses[status] || "status-agendado"}`;
    }

    function renderHistory() {
        if (!elements.patientHistory) {
            return;
        }

        if (!state.patient) {
            elements.patientHistory.innerHTML =
                '<p class="text-sm text-slate-500">Selecione um paciente para visualizar o histórico.</p>';

            return;
        }

        elements.patientHistory.innerHTML = state.patient.history
            .map(
                (item) => `
          <div class="border-b border-slate-100 pb-2 text-xs text-slate-600">
            ${escapeHtml(item)}
          </div>
        `
            )
            .join("");
    }

    function selectPatient(patient) {
        state.patient = patient;

        elements.patientName.textContent = patient.name;
        elements.patientCpf.textContent = patient.cpf;
        elements.patientBirth.textContent = patient.birth;
        elements.patientRecord.textContent = patient.record;
        elements.patientSex.textContent = patient.sex;
        elements.viewRecord.disabled = false;
        elements.patientSearch.value = patient.name;
        elements.patientResults.classList.add("hidden");

        renderHistory();
        clearError("patient");

        addAudit(
            "Paciente selecionado.",
            "Paciente",
            "—",
            patient.name
        );
    }

    function searchPatients() {
        const query = elements.patientSearch.value
            .toLowerCase()
            .trim();

        if (!query) {
            elements.patientResults.classList.add("hidden");
            return;
        }

        const results = patients.filter((patient) =>
            [patient.name, patient.cpf, patient.record].some((value) =>
                value.toLowerCase().includes(query)
            )
        );

        if (!results.length) {
            elements.patientResults.innerHTML =
                '<p class="p-3 text-sm text-slate-500">Nenhum paciente encontrado.</p>';
        } else {
            elements.patientResults.innerHTML = results
                .map(
                    (patient) => `
            <button
              type="button"
              class="search-result"
              data-patient-id="${escapeHtml(patient.record)}"
            >
              <strong>${escapeHtml(patient.name)}</strong>
              <small>
                CPF ${escapeHtml(patient.cpf)}
                · Prontuário ${escapeHtml(patient.record)}
              </small>
            </button>
          `
                )
                .join("");
        }

        elements.patientResults.classList.remove("hidden");
    }

    function calculateDuration() {
        const start = elements.startTime.value;
        const end = elements.endTime.value;

        if (!start || !end) {
            elements.duration.value = "";
            return;
        }

        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;
        const duration = endInMinutes - startInMinutes;

        elements.duration.value =
            duration > 0
                ? `${duration} minutos`
                : "Horário inválido";
    }

    function addProfessional() {
        const row = document.createElement("tr");

        row.innerHTML = `
      <td>
        <select
          class="input"
          name="teamProfessional[]"
        >
          <option>Dr. João Silva</option>
          <option>Dra. Ana Costa</option>
          <option>Maria Souza</option>
        </select>
      </td>

      <td>
        <select
          class="input"
          name="teamRole[]"
        >
          <option>Responsável</option>
          <option>Auxiliar</option>
          <option>Assistente</option>
          <option>Enfermagem</option>
          <option>Técnico</option>
          <option>Outro</option>
        </select>
      </td>

      <td>
        <input
          class="input"
          name="teamParticipation[]"
          value="Participante"
        />
      </td>

      <td>
        <button
          type="button"
          class="btn btn-outline remove-row"
        >
          Remover
        </button>
      </td>
    `;

        elements.professionalsBody.appendChild(row);
    }

    function addMaterial() {
        const row = document.createElement("tr");

        row.innerHTML = `
      <td>
        <input
          class="input"
          name="materialName[]"
          placeholder="Nome do material"
        />
      </td>

      <td>
        <input
          class="input"
          name="materialQuantity[]"
          type="number"
          min="1"
          value="1"
        />
      </td>

      <td>
        <input
          class="input"
          name="materialLot[]"
          placeholder="Lote"
        />
      </td>

      <td>
        <input
          class="input"
          name="materialManufacturer[]"
          placeholder="Fabricante"
        />
      </td>

      <td>
        <input
          class="input"
          name="materialExpiration[]"
          type="date"
        />
      </td>

      <td>
        <button
          type="button"
          class="btn btn-outline remove-row"
        >
          Remover
        </button>
      </td>
    `;

        elements.materialsBody.appendChild(row);
    }

    function renderFiles() {
        if (!elements.attachmentsBody) {
            return;
        }

        if (!state.files.length) {
            elements.attachmentsBody.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="text-center text-slate-500"
          >
            Nenhum anexo adicionado.
          </td>
        </tr>
      `;

            return;
        }

        elements.attachmentsBody.innerHTML = state.files
            .map(
                (file, index) => `
          <tr>
            <td>${escapeHtml(file.name)}</td>
            <td>${escapeHtml(file.type || "Documento")}</td>
            <td>${formatFileSize(file.size)}</td>
            <td>${escapeHtml(file.date)}</td>
            <td>${escapeHtml(file.user)}</td>
            <td>
              <button
                type="button"
                class="btn btn-outline"
                data-file-remove="${index}"
              >
                Remover
              </button>
            </td>
          </tr>
        `
            )
            .join("");
    }

    function addFiles(fileList) {
        [...fileList].forEach((file) => {
            const validType = CONFIG.allowedFileTypes.has(file.type);
            const validSize = file.size <= CONFIG.maxFileSize;

            if (!validType || !validSize) {
                notify(`Arquivo inválido: ${file.name}`);
                return;
            }

            state.files.push({
                file,
                name: file.name,
                type: file.type || "Documento",
                size: file.size,
                date: formatDate(),
                user: "Usuário atual"
            });

            addAudit(
                "Arquivo anexado.",
                "Anexo",
                "—",
                file.name
            );
        });

        renderFiles();
    }

    function addAudit(
        action,
        field = "—",
        before = "—",
        after = "—"
    ) {
        state.audit.unshift({
            date: formatDateTime(),
            user: "Usuário atual",
            action,
            field,
            before,
            after
        });

        renderAudit();
    }

    function renderAudit() {
        if (!elements.auditTimeline) {
            return;
        }

        if (!state.audit.length) {
            elements.auditTimeline.innerHTML =
                '<p class="text-sm text-slate-500">Nenhuma alteração registrada.</p>';

            return;
        }

        elements.auditTimeline.innerHTML = state.audit
            .map(
                (item) => `
          <div class="timeline-item">
            <time>${escapeHtml(item.date)}</time>
            <strong>${escapeHtml(item.user)}</strong>
            <p>${escapeHtml(item.action)}</p>
            <p>
              Campo: ${escapeHtml(item.field)}
              · ${escapeHtml(item.before)}
              → ${escapeHtml(item.after)}
            </p>
          </div>
        `
            )
            .join("");
    }

    function activateTab(name) {
        $$(".tab").forEach((tab) => {
            const active = tab.dataset.tab === name;

            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
        });

        $$(".tab-panel").forEach((panel) => {
            panel.hidden = panel.id !== `panel-${name}`;
        });
    }

    function setError(key, message) {
        const error = $(`[data-error="${key}"]`);

        if (error) {
            error.textContent = message;
        }
    }

    function clearError(key) {
        setError(key, "");
    }

    function clearValidation() {
        $$("[data-error]").forEach((error) => {
            error.textContent = "";
        });
    }

    function validate() {
        clearValidation();

        let valid = true;

        if (!state.patient) {
            setError("patient", "Selecione um paciente.");
            valid = false;
        }

        if (!elements.procedure.value) {
            setError("procedure", "Selecione um procedimento.");
            valid = false;
        }

        if (!elements.responsible.value) {
            setError(
                "responsible",
                "Informe o profissional responsável."
            );

            valid = false;
        }

        if (!elements.procedureDate.value) {
            setError(
                "date",
                "Informe a data do procedimento."
            );

            valid = false;
        }

        const start = elements.startTime.value;
        const end = elements.endTime.value;

        if (start && end && end <= start) {
            notify(
                "O horário de término deve ser posterior ao início."
            );

            valid = false;
        }

        if (!valid) {
            activateTab("general");
            notify(
                "Verifique os campos obrigatórios antes de continuar."
            );
        }

        return valid;
    }

    function collectRows(selector) {
        return $$(selector).map((row) => {
            const fields = $$(
                "input, select, textarea",
                row
            );

            return Object.fromEntries(
                fields
                    .filter((field) => field.name)
                    .map((field) => [
                        field.name.replace("[]", ""),
                        field.value
                    ])
            );
        });
    }

    function collectFormData() {
        const data = Object.fromEntries(
            new FormData(elements.form).entries()
        );

        return {
            ...data,
            patient: state.patient,
            professionals: collectRows(
                "#professionals-body tr"
            ),
            materials: collectRows(
                "#materials-body tr"
            ),
            clinicalDescription:
                elements.clinicalDescription?.innerHTML || "",
            files: state.files.map(
                ({ name, type, size, date, user }) => ({
                    name,
                    type,
                    size,
                    date,
                    user
                })
            ),
            audit: state.audit
        };
    }

    function save(draft = false) {
        if (!draft && !validate()) {
            return;
        }

        const data = collectFormData();

        localStorage.setItem(
            CONFIG.storageKey,
            JSON.stringify(data)
        );

        addAudit(
            draft
                ? "Rascunho salvo."
                : "Procedimento salvo."
        );

        notify(
            draft
                ? "Rascunho salvo com sucesso."
                : "Procedimento salvo com sucesso."
        );

        console.log(
            "GM4med procedimento:",
            JSON.stringify(data, null, 2)
        );
    }

    function loadSavedData() {
        const savedData = localStorage.getItem(
            CONFIG.storageKey
        );

        if (!savedData) {
            return;
        }

        try {
            const data = JSON.parse(savedData);

            if (data.patient) {
                selectPatient(data.patient);
            }

            Object.entries(data).forEach(([key, value]) => {
                const field = $(`[name="${key}"]`);

                if (
                    field &&
                    typeof value === "string"
                ) {
                    field.value = value;
                }
            });

            if (
                elements.clinicalDescription &&
                data.clinicalDescription
            ) {
                elements.clinicalDescription.innerHTML =
                    data.clinicalDescription;
            }

            if (Array.isArray(data.audit)) {
                state.audit = data.audit;
                renderAudit();
            }

            setStatus();
            calculateDuration();
        } catch (error) {
            console.warn(
                "Não foi possível restaurar os dados salvos.",
                error
            );
        }
    }

    function openOverlay(selector) {
        const overlay = $(selector);

        if (!overlay) {
            return;
        }

        overlay.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
    }

    function closeOverlays() {
        $$(".overlay").forEach((overlay) => {
            overlay.classList.add("hidden");
        });

        document.body.classList.remove("overflow-hidden");
    }

    function showPatientRecord() {
        if (!state.patient) {
            return;
        }

        elements.historyPatient.textContent =
            state.patient.name;

        elements.historyContent.innerHTML = `
      <div class="space-y-3">
        ${state.patient.history
                .map(
                    (item) => `
              <div class="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                ${escapeHtml(item)}
              </div>
            `
                )
                .join("")}
      </div>
    `;

        openOverlay("#history-modal");
    }

    function handleKeyboard(event) {
        if (event.key === "Escape") {
            closeOverlays();
            elements.patientResults?.classList.add("hidden");
        }

        const historyIsOpen =
            elements.historyModal &&
            !elements.historyModal.classList.contains("hidden");

        if (
            event.key === "Tab" &&
            historyIsOpen
        ) {
            const focusable = $$(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                elements.historyModal
            );

            if (!focusable.length) {
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        }
    }

    function bindEvents() {
        elements.patientSearch?.addEventListener(
            "input",
            searchPatients
        );

        elements.patientResults?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest("[data-patient-id]");

                if (!button) {
                    return;
                }

                const patient = patients.find(
                    (item) =>
                        item.record === button.dataset.patientId
                );

                if (patient) {
                    selectPatient(patient);
                }
            }
        );

        elements.startTime?.addEventListener(
            "change",
            calculateDuration
        );

        elements.endTime?.addEventListener(
            "change",
            calculateDuration
        );

        elements.status?.addEventListener(
            "change",
            () => {
                setStatus();

                addAudit(
                    "Status atualizado.",
                    "Status",
                    "—",
                    elements.status.value
                );
            }
        );

        $("#add-professional")?.addEventListener(
            "click",
            addProfessional
        );

        $("#add-material")?.addEventListener(
            "click",
            addMaterial
        );

        elements.fileInput?.addEventListener(
            "change",
            (event) => {
                addFiles(event.target.files);
                event.target.value = "";
            }
        );

        elements.dropZone?.addEventListener(
            "dragover",
            (event) => {
                event.preventDefault();
                elements.dropZone.classList.add("dragover");
            }
        );

        elements.dropZone?.addEventListener(
            "dragleave",
            () => {
                elements.dropZone.classList.remove("dragover");
            }
        );

        elements.dropZone?.addEventListener(
            "drop",
            (event) => {
                event.preventDefault();
                elements.dropZone.classList.remove("dragover");
                addFiles(event.dataTransfer.files);
            }
        );

        elements.professionalsBody?.addEventListener(
            "click",
            (event) => {
                if (!event.target.closest(".remove-row")) {
                    return;
                }

                event.target.closest("tr")?.remove();
                addAudit("Profissional removido da equipe.");
            }
        );

        elements.materialsBody?.addEventListener(
            "click",
            (event) => {
                if (!event.target.closest(".remove-row")) {
                    return;
                }

                event.target.closest("tr")?.remove();
                addAudit("Material removido.");
            }
        );

        elements.attachmentsBody?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest("[data-file-remove]");

                if (!button) {
                    return;
                }

                const index = Number(
                    button.dataset.fileRemove
                );

                const removedFile = state.files[index];

                state.files.splice(index, 1);
                renderFiles();

                if (removedFile) {
                    addAudit(
                        "Arquivo removido.",
                        "Anexo",
                        removedFile.name,
                        "—"
                    );
                }
            }
        );

        elements.form?.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();
                save(false);
            }
        );

        $("#save-top")?.addEventListener(
            "click",
            () => save(false)
        );

        $("#draft-procedure")?.addEventListener(
            "click",
            () => save(true)
        );

        $("#print-procedure")?.addEventListener(
            "click",
            () => window.print()
        );

        $("#cancel-procedure")?.addEventListener(
            "click",
            () => {
                if (
                    window.confirm(
                        "Descartar alterações não salvas?"
                    )
                ) {
                    window.location.reload();
                }
            }
        );

        elements.viewRecord?.addEventListener(
            "click",
            showPatientRecord
        );

        $("#full-history")?.addEventListener(
            "click",
            showPatientRecord
        );

        $$("[data-close-overlay]").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    closeOverlays
                );
            }
        );

        $("#view-consent")?.addEventListener(
            "click",
            () => {
                notify(
                    "Visualização do termo preparada para integração futura."
                );
            }
        );

        $$("[data-format]").forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        document.execCommand(
                            button.dataset.format,
                            false,
                            null
                        );

                        elements.clinicalDescription?.focus();
                    }
                );
            }
        );

        $$(".tab").forEach(
            (tab, index, tabs) => {
                tab.addEventListener(
                    "click",
                    () => activateTab(tab.dataset.tab)
                );

                tab.addEventListener(
                    "keydown",
                    (event) => {
                        let nextIndex = index;

                        if (event.key === "ArrowRight") {
                            nextIndex =
                                (index + 1) % tabs.length;
                        }

                        if (event.key === "ArrowLeft") {
                            nextIndex =
                                (index - 1 + tabs.length) %
                                tabs.length;
                        }

                        if (event.key === "Home") {
                            nextIndex = 0;
                        }

                        if (event.key === "End") {
                            nextIndex = tabs.length - 1;
                        }

                        if (nextIndex !== index) {
                            event.preventDefault();
                            tabs[nextIndex].focus();
                            activateTab(tabs[nextIndex].dataset.tab);
                        }
                    }
                );
            }
        );

        document.addEventListener(
            "keydown",
            handleKeyboard
        );

        document.addEventListener(
            "click",
            (event) => {
                const clickedSearch =
                    elements.patientSearch?.contains(
                        event.target
                    );

                const clickedResults =
                    elements.patientResults?.contains(
                        event.target
                    );

                if (!clickedSearch && !clickedResults) {
                    elements.patientResults?.classList.add(
                        "hidden"
                    );
                }
            }
        );
    }

    function initialize() {
        if (!elements.form) {
            return;
        }

        activateTab("general");
        setStatus();
        addProfessional();
        renderFiles();
        renderHistory();
        addAudit("Procedimento iniciado.");
        bindEvents();
        loadSavedData();
    }

    initialize();
})();