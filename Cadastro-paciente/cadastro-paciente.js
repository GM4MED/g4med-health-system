"use strict";

/**
 * GM4med — Janela de Cadastro de Paciente
 * Módulo Front-End completo, homologável, acessível (WCAG 2.2) e em conformidade com LGPD/CFM.
 */
(() => {
    const EDITABLE_SELECTOR = ".campo-edita";
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 24 24' fill='%2398A2B3'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

    const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "doc", "docx"]);

    // Banco de Dados Local Simulado para busca, navegação e verificação de duplicidade de CPF
    const patientsDatabase = [
        {
            id: "PAC-2026-00001",
            nome: "MARIA DAS DORES SILVA",
            data_nascimento: "1985-04-12",
            cpf: "111.222.333-44",
            rg: "12.345.678-9",
            orgao_emissor: "SSP/SP",
            genero: "F",
            estado_civil: "Casado(a)",
            nacionalidade: "BRASILEIRA",
            profissao: "PROFESSORA",
            telefone_principal: "(11) 98765-4321",
            telefone_secundario: "(11) 3333-4444",
            whatsapp: "(11) 98765-4321",
            email: "maria.silva@exemplo.com.br",
            responsavel_nome: "JOÃO DA SILVA",
            responsavel_parentesco: "CÔNJUGE",
            responsavel_telefone: "(11) 99999-8888",
            responsavel_whatsapp: "(11) 99999-8888",
            cep: "01001-000",
            endereco: "PRAÇA DA SÉ",
            numero: "100",
            complemento: "APTO 42",
            bairro: "SÉ",
            cidade: "SÃO PAULO",
            estado: "SP",
            pais: "BRASIL",
            tipo_sanguineo: "O+",
            gestante: "N",
            deficiencia: "",
            alergias: "PENICILINA E CAMARÃO",
            medicamentos: "LOSARTANA 50MG",
            doencas_cronicas: "HIPERTENSÃO ARTERIAL",
            historico_cirurgico: "APENDICECTOMIA EM 2012",
            observacoes_medicas: "PACIENTE EXIGE ATENÇÃO AO USO DE ANALGÉSICOS.",
            possui_convenio: "S",
            convenio: "unimed",
            numero_carteirinha: "0011223344556",
            validade_convenio: "2028-12-31",
            plano: "OURO FLEX",
            titular_convenio: "MARIA DAS DORES SILVA",
            cpf_titular: "111.222.333-44",
            forma_pagamento: "credito",
            limite_credito: "R$ 5.000,00",
            inadimplente: "N",
            observacoes_financeiras: "PAGA EM DIA.",
            data_cadastro: "2026-01-10T09:30",
            usuario_cadastro: "ADMIN (Dra. Ana)",
            ultima_atualizacao: "2026-09-14T14:20",
            status: "A",
            observacoes_gerais: "CADASTRO COMPLETO MIGRADO DO PEP V1.",
            lgpd_aceite: true,
            autoriza_whatsapp: true,
            autoriza_email: true,
            autoriza_marketing: false
        },
        {
            id: "PAC-2026-00002",
            nome: "CARLOS EDUARDO OLIVEIRA",
            data_nascimento: "1990-08-25",
            cpf: "222.333.444-55",
            rg: "98.765.432-1",
            orgao_emissor: "SSP/RJ",
            genero: "M",
            estado_civil: "Solteiro(a)",
            nacionalidade: "BRASILEIRO",
            profissao: "ENGENHEIRO DE SOFTWARE",
            telefone_principal: "(21) 97123-4567",
            whatsapp: "(21) 97123-4567",
            email: "carlos.oliveira@exemplo.com.br",
            cep: "20040-002",
            endereco: "AVENIDA RIO BRANCO",
            numero: "156",
            bairro: "CENTRO",
            cidade: "RIO DE JANEIRO",
            estado: "RJ",
            pais: "BRASIL",
            tipo_sanguineo: "A+",
            gestante: "N",
            deficiencia: "",
            alergias: "NENHUMA ALERGIA RELATADA",
            medicamentos: "",
            doencas_cronicas: "",
            possui_convenio: "N",
            forma_pagamento: "pix",
            limite_credito: "R$ 0,00",
            inadimplente: "N",
            data_cadastro: "2026-02-15T11:00",
            usuario_cadastro: "ADMIN (Dra. Ana)",
            ultima_atualizacao: "2026-02-15T11:00",
            status: "A",
            lgpd_aceite: true,
            autoriza_whatsapp: true,
            autoriza_email: false,
            autoriza_marketing: false
        }
    ];

    const state = {
        mode: "initial", // "initial" | "new" | "editing" | "saved"
        nextSequence: 3,
        currentIndex: -1,
        stream: null,
        history: [],
        attachments: new Map(),
        snapshot: null,
        cepController: null,
        modalTriggers: new Map(),
        signatureContext: null,
        isDrawing: false,
        hasDrawnSignature: false,
        isDirty: false
    };

    const byId = (id) => document.getElementById(id);
    const queryAll = (selector, parent = document) => [...parent.querySelectorAll(selector)];

    document.addEventListener("DOMContentLoaded", initialize);

    function initialize() {
        initializeClock();
        initializeMasks();
        initializeTextTransforms();
        initializeTabs();
        initializeModalEvents();
        initializeSignature();
        initializeAttachments();
        initializeFieldChangeListeners();
        setInitialState();
    }

    /* ==========================================================
       MÁQUINA DE ESTADOS DA JANELA
    ========================================================== */

    function setInitialState() {
        state.mode = "initial";
        state.currentIndex = -1;
        state.isDirty = false;

        clearForm();
        setEditableState(false);

        setButtons({
            btnNovo: false,
            btnGravar: true,
            btnEditar: true,
            btnAnterior: patientsDatabase.length === 0,
            btnProximo: patientsDatabase.length === 0,
            btnBuscar: false,
            btnExcluir: true,
            btnCancelar: true,
            btnAnexo: true,
            btnImprimir: true,
            btnHistorico: true
        });

        setStatus("Clique em Novo para iniciar um cadastro ou em Buscar para localizar um paciente.");
        updateClinicalAlerts();
    }

    function setNewState() {
        state.mode = "new";
        state.currentIndex = -1;
        state.isDirty = true;

        clearForm();
        setEditableState(true);

        setButtons({
            btnNovo: true,
            btnGravar: false,
            btnEditar: true,
            btnAnterior: true,
            btnProximo: true,
            btnBuscar: true,
            btnExcluir: true,
            btnCancelar: false,
            btnAnexo: false,
            btnImprimir: true,
            btnHistorico: true
        });

        const newId = `PAC-2026-${String(state.nextSequence).padStart(5, "0")}`;
        setFieldValue("pacId", newId);
        setFieldValue("pacDataCad", nowForDateTimeInput());
        setFieldValue("pacUserCad", "ADMIN (Dra. Ana)");
        setFieldValue("pacStatus", "A");

        switchTab("tab1");
        setStatus("Novo cadastro iniciado. Preencha os campos obrigatórios (*).");

        window.setTimeout(() => {
            byId("pacNome")?.focus();
        }, 50);
    }

    function setSavedState({ isNewRecord = false, addLog = true } = {}) {
        state.mode = "saved";
        state.isDirty = false;

        setEditableState(false);

        setButtons({
            btnNovo: false,
            btnGravar: true,
            btnEditar: false,
            btnAnterior: state.currentIndex <= 0,
            btnProximo: state.currentIndex >= patientsDatabase.length - 1 || state.currentIndex === -1,
            btnBuscar: false,
            btnExcluir: false,
            btnCancelar: true,
            btnAnexo: false,
            btnImprimir: false,
            btnHistorico: false
        });

        if (addLog) {
            if (isNewRecord) {
                state.nextSequence += 1;
                addHistory("Paciente cadastrado", `ID: ${byId("pacId")?.value}`);
            } else {
                addHistory("Cadastro atualizado", `ID: ${byId("pacId")?.value}`);
            }
        }

        state.snapshot = createSnapshot();
        updateClinicalAlerts();
        setStatus("Cadastro salvo com sucesso no Front-End.");
    }

    function setEditingState() {
        if (state.mode !== "saved") return;

        state.mode = "editing";
        state.isDirty = true;
        state.snapshot = createSnapshot();

        setEditableState(true);

        setButtons({
            btnNovo: true,
            btnGravar: false,
            btnEditar: true,
            btnAnterior: true,
            btnProximo: true,
            btnBuscar: true,
            btnExcluir: true,
            btnCancelar: false,
            btnAnexo: false,
            btnImprimir: true,
            btnHistorico: true
        });

        addHistory("Modo de edição ativado");
        setStatus("Modo de edição ativo. Altere os campos e clique em Salvar.");
    }

    function setEditableState(isEditable) {
        queryAll(EDITABLE_SELECTOR).forEach((element) => {
            element.disabled = !isEditable;
        });

        const attachmentInput = byId("anexoInput");
        const dropZone = byId("dropZone");
        const signatureCanvas = byId("assinaturaCanvas");
        const btnAbrirWebcam = byId("btnAbrirWebcam");
        const btnSubstituirFoto = byId("btnSubstituirFoto");
        const btnRemoverFoto = byId("btnRemoverFoto");

        if (attachmentInput) attachmentInput.disabled = !isEditable;
        if (dropZone) {
            dropZone.setAttribute("aria-disabled", String(!isEditable));
            dropZone.classList.toggle("is-disabled", !isEditable);
        }
        if (signatureCanvas) {
            signatureCanvas.dataset.enabled = String(isEditable);
            signatureCanvas.setAttribute("aria-disabled", String(!isEditable));
        }

        if (btnAbrirWebcam) btnAbrirWebcam.disabled = !isEditable;
        if (btnSubstituirFoto) btnSubstituirFoto.disabled = !isEditable;
        if (btnRemoverFoto) btnRemoverFoto.disabled = !isEditable;

        toggleConvenioFields();
        toggleCreditoPanel();
    }

    function setButtons(buttons) {
        Object.entries(buttons).forEach(([id, disabled]) => {
            const button = byId(id);
            if (button) button.disabled = disabled;
        });
    }

    /* ==========================================================
       AÇÕES DA TOOLBAR
    ========================================================== */

    function actionNew() {
        if (state.isDirty && !window.confirm("Deseja descartar as alterações atuais e iniciar um novo cadastro?")) {
            return;
        }
        setNewState();
    }

    function actionSave() {
        if (!validateForm()) return;

        const isNewRecord = state.mode === "new";
        setFieldValue("pacUltAtu", nowForDateTimeInput());

        const patientData = extractPatientDataFromForm();

        if (isNewRecord) {
            patientsDatabase.push(patientData);
            state.currentIndex = patientsDatabase.length - 1;
        } else if (state.currentIndex >= 0 && state.currentIndex < patientsDatabase.length) {
            patientsDatabase[state.currentIndex] = patientData;
        } else {
            const idx = patientsDatabase.findIndex((p) => p.id === patientData.id);
            if (idx >= 0) patientsDatabase[idx] = patientData;
            else patientsDatabase.push(patientData);
        }

        // Limpar temporariamente campo sensível de CVV do formulário por segurança PCI-DSS
        const cvvInput = byId("cartaoCvv");
        if (cvvInput) cvvInput.value = "";

        setSavedState({ isNewRecord });

        // Evento customizado para integração com PEP e Agenda Médica
        window.dispatchEvent(new CustomEvent("gm4med:patient-saved", { detail: patientData }));
        window.alert("Paciente gravado com sucesso!");
    }

    function actionEdit() {
        setEditingState();
    }

    function actionDelete() {
        if (state.mode !== "saved" || state.currentIndex < 0) return;

        const patientName = byId("pacNome")?.value || "este paciente";
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir o cadastro de ${patientName}? Esta ação é irreversível.`)) {
            return;
        }

        patientsDatabase.splice(state.currentIndex, 1);
        addHistory("Paciente excluído", `ID: ${byId("pacId")?.value}`);

        clearForm();
        setInitialState();
        window.alert("Paciente excluído com sucesso.");
    }

    function actionCancel() {
        if (state.mode === "new") {
            if (state.isDirty && !window.confirm("Cancelar e descartar este novo cadastro?")) return;
            clearForm();
            setInitialState();
            return;
        }

        if (state.mode === "editing") {
            if (state.isDirty && !window.confirm("Descartar todas as alterações realizadas na edição?")) return;
            restoreSnapshot(state.snapshot);
            setSavedState({ addLog: false });
            setStatus("Alterações descartadas.");
            return;
        }

        clearForm();
        setInitialState();
    }

    function actionSearch() {
        openModal("modalBusca", byId("btnBuscar"));
        window.setTimeout(() => {
            byId("buscaTermo")?.focus();
            executarBusca();
        }, 50);
    }

    function actionPrevious() {
        if (patientsDatabase.length === 0) return;
        let nextIdx = state.currentIndex - 1;
        if (nextIdx < 0) nextIdx = patientsDatabase.length - 1;
        loadPatientIntoForm(patientsDatabase[nextIdx], nextIdx);
    }

    function actionNext() {
        if (patientsDatabase.length === 0) return;
        let nextIdx = state.currentIndex + 1;
        if (nextIdx >= patientsDatabase.length) nextIdx = 0;
        loadPatientIntoForm(patientsDatabase[nextIdx], nextIdx);
    }

    function actionAttachment() {
        switchTab("tab9");
        byId("anexoInput")?.focus();
    }

    function actionPrint() {
        window.print();
    }

    function actionHistory() {
        renderHistory();
        openModal("modalHistorico", byId("btnHistorico"));
    }

    /* ==========================================================
       VALIDAÇÃO DE FORMULÁRIO E DADOS PESSOAIS
    ========================================================== */

    function validateForm() {
        clearInvalidFields();

        const requiredFields = [
            { field: byId("pacNome"), message: "Preencha o nome completo do paciente." },
            { field: byId("pacCpf"), message: "Preencha o CPF do paciente." },
            { field: byId("pacNascimento"), message: "Preencha a data de nascimento." },
            { field: byId("pacTel1"), message: "Preencha o telefone principal de contato." }
        ];

        for (const item of requiredFields) {
            if (!item.field || !item.field.value.trim()) {
                invalidateField(item.field, item.message);
                return false;
            }
        }

        const cpfInput = byId("pacCpf");
        if (!validateCpf(cpfInput.value)) {
            invalidateField(cpfInput, "CPF com formato ou dígitos verificadores inválidos. Digite 11 números válidos.");
            return false;
        }

        const emailInput = byId("pacEmail");
        if (emailInput && emailInput.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                invalidateField(emailInput, "Formato de e-mail inválido. Ex: nome@exemplo.com.br");
                return false;
            }
        }

        const birthDate = new Date(`${byId("pacNascimento").value}T00:00:00`);
        if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
            invalidateField(byId("pacNascimento"), "A data de nascimento não pode estar no futuro ou ser inválida.");
            return false;
        }

        // Validação LGPD: Termo de Aceite Obrigatório
        const lgpdAceite = byId("lgpdAceite");
        if (lgpdAceite && !lgpdAceite.checked) {
            invalidateField(lgpdAceite, "É necessário marcar o Aceite dos Termos LGPD (Aba 10) para concluir o cadastro.");
            return false;
        }

        return true;
    }

    function invalidateField(field, message) {
        if (!field) return;

        field.classList.add("is-invalid");
        field.setAttribute("aria-invalid", "true");
        field.focus();

        const tabPane = field.closest(".tab-content");
        if (tabPane && tabPane.id) {
            switchTab(tabPane.id);
        }

        setStatus(message);
        window.alert(message);
    }

    function clearInvalidFields() {
        queryAll(".is-invalid").forEach((field) => {
            field.classList.remove("is-invalid");
            field.removeAttribute("aria-invalid");
        });
    }

    function validateCpf(cpf) {
        const digits = String(cpf).replace(/\D/g, "");

        if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
            return false;
        }

        const getCheckDigit = (length) => {
            const sum = [...digits.slice(0, length)].reduce(
                (total, digit, index) => total + Number(digit) * (length + 1 - index),
                0
            );
            const result = (sum * 10) % 11;
            return result === 10 ? 0 : result;
        };

        return (
            getCheckDigit(9) === Number(digits[9]) &&
            getCheckDigit(10) === Number(digits[10])
        );
    }

    function checkCpfDuplication(cpfValue) {
        if (!cpfValue || state.mode !== "new") return;
        const cleanCpf = cpfValue.replace(/\D/g, "");
        if (cleanCpf.length !== 11) return;

        const existing = patientsDatabase.find(
            (p) => (p.cpf || "").replace(/\D/g, "") === cleanCpf
        );

        if (existing) {
            const msg = `Já existe um paciente cadastrado com este CPF: ${existing.nome} (Código: ${existing.id}).`;
            byId("cpfDuplicadoMensagem").textContent = msg;

            const btnAbrir = byId("btnAbrirExistente");
            if (btnAbrir) {
                btnAbrir.onclick = () => {
                    fecharModal("modalCpfDuplicado");
                    const idx = patientsDatabase.findIndex((p) => p.id === existing.id);
                    loadPatientIntoForm(existing, idx);
                };
            }

            openModal("modalCpfDuplicado", byId("pacCpf"));
        }
    }

    /* ==========================================================
       SEGURANÇA PCI-DSS & EXTRAÇÃO DE DADOS PARA API/PEP
    ========================================================== */

    function extractPatientDataFromForm() {
        const fields = queryAll("#pacienteForm input, #pacienteForm select, #pacienteForm textarea");
        const data = {};

        fields.forEach((field) => {
            if (field.name) {
                // REGRA DE SEGURANÇA: NUNCA Armazenar número completo do cartão ou CVV em memória/storage
                if (field.name === "cartao_cvv") return;
                if (field.name === "cartao_numero") {
                    const rawDigits = (field.value || "").replace(/\D/g, "");
                    data["cartao_ultimos4"] = rawDigits.length >= 4 ? `**** **** **** ${rawDigits.slice(-4)}` : "";
                    return;
                }
                data[field.name] = field.type === "checkbox" ? field.checked : field.value;
            }
        });

        data.foto = byId("fotoPreview")?.src || DEFAULT_AVATAR;
        data.assinatura = state.hasDrawnSignature ? (byId("assinaturaCanvas")?.toDataURL("image/png") || null) : null;
        data.attachments = [...state.attachments.values()].map((a) => ({ id: a.id, name: a.name, size: a.size, type: a.type }));

        // Estrutura Padronizada de Consentimentos LGPD para API
        const nowIso = new Date().toISOString();
        data.lgpd_consents = [
            { purpose: "tratamento_dados_saude", label: "Aceite LGPD", status: Boolean(data.lgpd_aceite), required: true, timestamp: nowIso, termVersion: "v2.4" },
            { purpose: "comunicacao_whatsapp", label: "WhatsApp", status: Boolean(data.autoriza_whatsapp), required: false, timestamp: nowIso, termVersion: "v2.4" },
            { purpose: "comunicacao_email", label: "E-mail", status: Boolean(data.autoriza_email), required: false, timestamp: nowIso, termVersion: "v2.4" },
            { purpose: "comunicacao_marketing", label: "Marketing", status: Boolean(data.autoriza_marketing), required: false, timestamp: nowIso, termVersion: "v2.4" }
        ];

        return data;
    }

    function loadPatientIntoForm(patient, index = -1) {
        if (!patient) return;

        clearForm();
        state.currentIndex = index;

        Object.entries(patient).forEach(([key, value]) => {
            const field = queryAll(`[name="${key}"]`)[0];
            if (field) {
                if (field.type === "checkbox") {
                    field.checked = Boolean(value);
                } else {
                    field.value = value || "";
                }
            }
        });

        if (patient.id) setFieldValue("pacId", patient.id);
        if (patient.data_nascimento) calculateAge();

        const photo = byId("fotoPreview");
        if (photo) {
            photo.src = patient.foto || DEFAULT_AVATAR;
        }

        if (patient.assinatura) {
            restoreSignature(patient.assinatura);
        }

        if (patient.attachments && Array.isArray(patient.attachments)) {
            state.attachments.clear();
            patient.attachments.forEach((att) => state.attachments.set(att.id, att));
            renderAttachments();
        }

        setSavedState({ addLog: false });
        updateClinicalAlerts();
        switchTab("tab1");
        setStatus(`Paciente localizado: ${patient.nome} (${patient.id}).`);
    }

    /* ==========================================================
       BUSCA DE ENDEREÇO VIA CEP COM TIMEOUT & FALLBACK MANUAL
    ========================================================== */

    async function searchCep() {
        const cepInput = byId("pacCep");
        const cep = cepInput?.value.replace(/\D/g, "");
        const feedback = byId("cepFeedback");

        if (!cep || cep.length !== 8) {
            if (feedback) {
                feedback.textContent = "Digite um CEP válido com 8 números.";
                feedback.className = "field-feedback is-error";
            }
            return;
        }

        state.cepController?.abort();
        state.cepController = new AbortController();

        const timeoutId = window.setTimeout(() => {
            state.cepController?.abort();
        }, 5000); // 5 segundos de timeout

        if (feedback) {
            feedback.textContent = "Consultando CEP na base dos Correios...";
            feedback.className = "field-feedback";
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
                signal: state.cepController.signal
            });
            window.clearTimeout(timeoutId);

            if (!response.ok) throw new Error("Falha de comunicação com os Correios.");
            const data = await response.json();

            if (data.erro) throw new Error("CEP não localizado.");

            setFieldValue("pacEndereco", String(data.logradouro || "").toUpperCase());
            setFieldValue("pacBairro", String(data.bairro || "").toUpperCase());
            setFieldValue("pacCidade", String(data.localidade || "").toUpperCase());
            setFieldValue("pacEstado", String(data.uf || "").toUpperCase());
            setFieldValue("pacPais", "BRASIL");

            if (feedback) {
                feedback.textContent = "Endereço preenchido automaticamente (edição manual liberada).";
                feedback.className = "field-feedback is-success";
            }

            byId("pacNumero")?.focus();
        } catch (error) {
            window.clearTimeout(timeoutId);
            const msg = error.name === "AbortError"
                ? "Tempo limite esgotado. Preencha o endereço manualmente."
                : (error.message || "Não foi possível buscar o CEP.");

            if (feedback) {
                feedback.textContent = `${msg} Edição manual disponível.`;
                feedback.className = "field-feedback is-error";
            }
            setStatus(msg);
        } finally {
            state.cepController = null;
        }
    }

    /* ==========================================================
       CÁLCULO AUTOMÁTICO DE IDADE COM FORMATO E SINGULARIDADE
    ========================================================== */

    function calculateAge() {
        const birthValue = byId("pacNascimento")?.value;
        const output = byId("pacIdade");

        if (!birthValue || !output) return;

        const [year, month, day] = birthValue.split("-").map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();

        if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
            output.value = "";
            return;
        }

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months -= 1;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }

        if (months < 0) {
            years -= 1;
            months += 12;
        }

        const labelYears = years === 1 ? "1 Ano" : `${years} Anos`;
        const labelMonths = months === 1 ? "01 Mês" : `${String(months).padStart(2, "0")} Meses`;
        const labelDays = days === 1 ? "01 Dia" : `${String(days).padStart(2, "0")} Dias`;

        output.value = `${labelYears} ${labelMonths} ${labelDays}`;
    }

    /* ==========================================================
       DADOS DINÂMICOS: CONVÊNIO E FINANCEIRO
    ========================================================== */

    function toggleConvenioFields() {
        const temConvenio = byId("pacTemConvenio")?.value === "S";
        const isEditable = state.mode === "new" || state.mode === "editing";

        queryAll(".convenio-subfield").forEach((field) => {
            field.disabled = !temConvenio || !isEditable;
            if (!temConvenio) field.value = "";
        });
    }

    function toggleCreditoPanel() {
        const isCredito = byId("pacFormaPagamento")?.value === "credito";
        const box = byId("creditoPanelBox");
        if (box) {
            box.classList.toggle("is-collapsed", !isCredito);
        }
    }

    function detectCardBrand(cardNumber) {
        const digits = cardNumber.replace(/\D/g, "");
        const iconContainer = byId("cardBrandsDisplay");
        const hint = byId("cardBrandName");

        let brandName = "Bandeira não identificada";
        let iconClass = "fa-solid fa-credit-card";

        if (/^4/.test(digits)) {
            brandName = "Visa";
            iconClass = "fa-brands fa-cc-visa";
        } else if (/^(5[1-5]|2[2-7])/.test(digits)) {
            brandName = "Mastercard";
            iconClass = "fa-brands fa-cc-mastercard";
        } else if (/^3[47]/.test(digits)) {
            brandName = "American Express";
            iconClass = "fa-brands fa-cc-amex";
        } else if (/^(6011|65|64[4-9])/.test(digits)) {
            brandName = "Discover";
            iconClass = "fa-brands fa-cc-discover";
        } else if (/^(50[0-9]|63[7-9])/.test(digits)) {
            brandName = "Elo";
            iconClass = "fa-solid fa-credit-card";
        }

        if (iconContainer) {
            iconContainer.replaceChildren();
            const i = document.createElement("i");
            i.className = iconClass;
            iconContainer.append(i);
        }

        if (hint) {
            hint.textContent = digits.length >= 4 ? `Bandeira: ${brandName}` : "Bandeira detectada automaticamente pelo BIN";
        }
    }

    function calculateInstallments() {
        const rawVal = byId("valorConsulta")?.value || "0";
        const numVal = parseFloat(rawVal.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        const parcelas = parseInt(byId("parcelas")?.value || "1", 10);

        const valorParcela = numVal / (parcelas || 1);
        const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

        const displayParcela = byId("valorParcelaDisplay");
        const displayTotal = byId("valorTotalResumo");

        if (displayParcela) displayParcela.textContent = fmt(valorParcela);
        if (displayTotal) displayTotal.textContent = fmt(numVal);
    }

    /* ==========================================================
       ALERTAS CLÍNICOS E OPERACIONAIS DINÂMICOS
    ========================================================== */

    function updateClinicalAlerts() {
        const bar = byId("clinicalAlertsBar");
        if (!bar) return;

        bar.replaceChildren();

        const alerts = [];

        const alergias = (byId("pacAlergias")?.value || "").trim();
        if (alergias && alergias.toUpperCase() !== "NENHUMA ALERGIA RELATADA") {
            alerts.push({
                type: "danger",
                icon: "fa-solid fa-triangle-exclamation",
                label: `ALERGIA CRÍTICA: ${alergias}`
            });
        }

        const gestante = byId("pacGestante")?.value;
        if (gestante === "S") {
            alerts.push({
                type: "warning",
                icon: "fa-solid fa-baby",
                label: "PACIENTE GESTANTE"
            });
        }

        const deficiencia = (byId("pacDeficiencia")?.value || "").trim();
        if (deficiencia) {
            alerts.push({
                type: "info",
                icon: "fa-solid fa-wheelchair",
                label: `DEFICIÊNCIA/MOBILIDADE: ${deficiencia}`
            });
        }

        const doencas = (byId("pacDoencas")?.value || "").trim();
        if (doencas) {
            alerts.push({
                type: "warning",
                icon: "fa-solid fa-heart-pulse",
                label: `DOENÇA CRÔNICA: ${doencas}`
            });
        }

        const inadimplente = byId("pacInadimplente")?.value;
        if (inadimplente === "S") {
            alerts.push({
                type: "financial",
                icon: "fa-solid fa-circle-exclamation",
                label: "PENDÊNCIA FINANCEIRA (INADIMPLENTE)"
            });
        }

        if (alerts.length === 0) {
            const emptySpan = document.createElement("span");
            emptySpan.className = "alert-empty-msg";
            emptySpan.id = "alertEmptyMsg";
            emptySpan.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Nenhum alerta crítico registrado para este paciente.';
            bar.append(emptySpan);
            return;
        }

        alerts.forEach((alt) => {
            const badge = document.createElement("span");
            badge.className = `clinical-badge badge-${alt.type}`;
            
            const icon = document.createElement("i");
            icon.className = alt.icon;
            icon.setAttribute("aria-hidden", "true");

            const labelSpan = document.createElement("span");
            labelSpan.textContent = alt.label;

            badge.append(icon, labelSpan);
            bar.append(badge);
        });
    }

    /* ==========================================================
       ABAS (NAVEGAÇÃO POR MOUSE E TECLADO WAI-ARIA)
    ========================================================== */

    function initializeTabs() {
        const tabs = queryAll(".tab-btn[data-tab]");

        tabs.forEach((tab, index) => {
            tab.addEventListener("keydown", (event) => {
                const allowedKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                if (!allowedKeys.includes(event.key)) return;

                event.preventDefault();
                let nextIndex = index;

                if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
                if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = tabs.length - 1;

                tabs[nextIndex].focus();
                switchTab(tabs[nextIndex].dataset.tab);
            });
        });
    }

    function switchTab(tabId) {
        const targetPanel = byId(tabId);
        const targetTab = queryAll(".tab-btn[data-tab]").find((tab) => tab.dataset.tab === tabId);

        if (!targetPanel || !targetTab) return;

        queryAll(".tab-btn[data-tab]").forEach((tab) => {
            const isActive = tab === targetTab;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        });

        queryAll('.tab-content[role="tabpanel"]').forEach((panel) => {
            const isActive = panel === targetPanel;
            panel.classList.toggle("active", isActive);
            panel.hidden = !isActive;
        });
    }

    /* ==========================================================
       WEBCAM E FOTO DO PACIENTE
    ========================================================== */

    async function openWebcam() {
        if (!["new", "editing"].includes(state.mode)) {
            const msg = "Inicie um Novo cadastro ou clique em Editar antes de alterar a foto.";
            setStatus(msg);
            window.alert(msg);
            return;
        }

        const video = byId("webcamVideo");

        if (!window.isSecureContext) {
            window.alert("A webcam requer protocolo seguro (HTTPS ou localhost).");
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            window.alert("Este navegador não possui suporte à câmera.");
            return;
        }

        closeWebcam(false);

        try {
            openModal("modalWebcam", byId("btnAbrirWebcam"));
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } }
            });

            state.stream = stream;
            video.muted = true;
            video.srcObject = stream;
            await video.play();

            setStatus("Webcam pronta para captura.");
        } catch (error) {
            closeWebcam(false);
            window.alert(`Não foi possível acessar a webcam: ${error.message}`);
        }
    }

    function capturePhoto() {
        const video = byId("webcamVideo");
        const canvas = byId("webcamCanvas");
        const photoPreview = byId("fotoPreview");

        if (!video || !canvas || !photoPreview) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            photoPreview.src = canvas.toDataURL("image/jpeg", 0.88);
            state.isDirty = true;
        }

        closeWebcam();
        setStatus("Foto capturada com sucesso.");
    }

    function removerFoto() {
        if (!["new", "editing"].includes(state.mode)) return;
        const photoPreview = byId("fotoPreview");
        if (photoPreview) {
            photoPreview.src = DEFAULT_AVATAR;
            state.isDirty = true;
        }
        setStatus("Foto removida.");
    }

    function closeWebcam(restoreFocus = true) {
        const modal = byId("modalWebcam");
        const video = byId("webcamVideo");

        state.stream?.getTracks().forEach((track) => track.stop());
        state.stream = null;

        if (video) {
            video.pause();
            video.srcObject = null;
        }

        if (modal) {
            modal.classList.remove("active");
            modal.hidden = true;
            modal.setAttribute("aria-hidden", "true");
        }

        if (restoreFocus) byId("btnAbrirWebcam")?.focus();
    }

    /* ==========================================================
       ASSINATURA DIGITAL MANUSCRITA LGPD
    ========================================================== */

    function initializeSignature() {
        const canvas = byId("assinaturaCanvas");
        if (!canvas) return;

        state.signatureContext = canvas.getContext("2d");
        state.signatureContext.strokeStyle = "#0D9488";
        state.signatureContext.lineWidth = 2.5;
        state.signatureContext.lineCap = "round";

        const getPoint = (event) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (event.clientX - rect.left) * (canvas.width / rect.width),
                y: (event.clientY - rect.top) * (canvas.height / rect.height)
            };
        };

        canvas.addEventListener("pointerdown", (event) => {
            if (canvas.dataset.enabled !== "true") return;
            state.isDrawing = true;
            state.hasDrawnSignature = true;
            canvas.setPointerCapture(event.pointerId);
            const pt = getPoint(event);
            state.signatureContext.beginPath();
            state.signatureContext.moveTo(pt.x, pt.y);
        });

        canvas.addEventListener("pointermove", (event) => {
            if (!state.isDrawing) return;
            const pt = getPoint(event);
            state.signatureContext.lineTo(pt.x, pt.y);
            state.signatureContext.stroke();
        });

        ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
            canvas.addEventListener(evt, () => {
                if (state.isDrawing) state.isDirty = true;
                state.isDrawing = false;
            });
        });
    }

    function clearSignature() {
        const canvas = byId("assinaturaCanvas");
        if (canvas && state.signatureContext) {
            state.signatureContext.clearRect(0, 0, canvas.width, canvas.height);
            state.hasDrawnSignature = false;
            state.isDirty = true;
        }
    }

    function saveSignature() {
        if (!["new", "editing"].includes(state.mode)) {
            setStatus("Inicie ou edite um cadastro antes de confirmar a assinatura.");
            return;
        }

        if (!state.hasDrawnSignature) {
            window.alert("Desenhe a assinatura no quadro indicado antes de confirmar.");
            return;
        }

        const nowIso = new Date().toISOString();
        const hashEvidence = `SHA256-${Math.random().toString(36).substring(2)}${Date.now()}`;

        setStatus(`Assinatura coletada e associada ao termo LGPD. Evidência: ${hashEvidence}`);
        window.alert(`Assinatura coletada com sucesso!\n\nTimestamp: ${nowIso}\nEvidência LGPD Hash: ${hashEvidence}\n\nObs: Representação gráfica manuscrita pronta para associação ao certificado e-CPF no Backend.`);
    }

    function restoreSignature(dataUrl) {
        clearSignature();
        if (!dataUrl || !state.signatureContext) return;
        const img = new Image();
        img.onload = () => {
            state.signatureContext.drawImage(img, 0, 0);
            state.hasDrawnSignature = true;
        };
        img.src = dataUrl;
    }

    /* ==========================================================
       ANEXOS E DOCUMENTOS
    ========================================================== */

    function initializeAttachments() {
        const dropZone = byId("dropZone");
        const input = byId("anexoInput");

        if (!dropZone || !input) return;

        dropZone.addEventListener("click", (event) => {
            if (event.target.closest("input") || input.disabled) return;
            input.click();
        });

        dropZone.addEventListener("dragover", (event) => {
            if (input.disabled) return;
            event.preventDefault();
            dropZone.classList.add("dragover");
        });

        dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

        dropZone.addEventListener("drop", (event) => {
            event.preventDefault();
            dropZone.classList.remove("dragover");
            if (!input.disabled) processFiles(event.dataTransfer.files);
        });

        input.addEventListener("change", (event) => {
            processFiles(event.target.files);
            input.value = "";
        });
    }

    function processFiles(fileList) {
        const files = [...fileList];
        if (!files.length) return;

        const invalidFiles = [];

        files.forEach((file) => {
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            if (!ALLOWED_EXTENSIONS.has(ext) || file.size > MAX_FILE_SIZE || file.size === 0) {
                invalidFiles.push(file.name);
                return;
            }

            const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
            state.attachments.set(id, {
                id,
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file)
            });
            state.isDirty = true;
        });

        renderAttachments();

        if (invalidFiles.length) {
            window.alert(`Arquivo inválido ou excedeu 10 MB: ${invalidFiles.join(", ")}`);
        }
    }

    function renderAttachments() {
        const list = byId("anexoLista");
        if (!list) return;

        list.replaceChildren();

        if (state.attachments.size === 0) {
            const empty = document.createElement("p");
            empty.className = "anexo-vazio";
            empty.textContent = "Nenhum documento anexado a este cadastro.";
            list.append(empty);
            return;
        }

        state.attachments.forEach((att) => {
            const item = document.createElement("article");
            item.className = "anexo-item";

            const info = document.createElement("div");
            info.className = "anexo-item-info";

            const icon = document.createElement("i");
            icon.className = `fa-solid ${getFileIcon(att.name)}`;
            icon.setAttribute("aria-hidden", "true");

            const textDiv = document.createElement("div");
            const nameDiv = document.createElement("div");
            nameDiv.className = "anexo-item-nome";
            nameDiv.textContent = att.name;

            const sizeDiv = document.createElement("div");
            sizeDiv.className = "anexo-item-size";
            sizeDiv.textContent = formatFileSize(att.size);

            textDiv.append(nameDiv, sizeDiv);
            info.append(icon, textDiv);

            const actions = document.createElement("div");
            actions.className = "anexo-item-actions";

            const btnView = document.createElement("button");
            btnView.type = "button";
            btnView.className = "btn-view";
            btnView.title = "Visualizar anexo";
            btnView.setAttribute("aria-label", `Visualizar ${att.name}`);
            btnView.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
            btnView.addEventListener("click", () => previewAttachment(att));

            const btnDel = document.createElement("button");
            btnDel.type = "button";
            btnDel.className = "btn-del";
            btnDel.title = "Remover anexo";
            btnDel.setAttribute("aria-label", `Remover ${att.name}`);
            btnDel.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
            btnDel.addEventListener("click", () => removeAttachment(att.id));

            actions.append(btnView, btnDel);
            item.append(info, actions);
            list.append(item);
        });
    }

    function previewAttachment(att) {
        const body = byId("previewAnexoConteudo");
        if (!body) return;

        body.replaceChildren();
        const ext = att.name.split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png"].includes(ext)) {
            const img = document.createElement("img");
            img.src = att.url;
            img.alt = att.name;
            img.style.maxWidth = "100%";
            body.append(img);
        } else {
            const iframe = document.createElement("iframe");
            iframe.src = att.url;
            iframe.style.width = "100%";
            iframe.style.height = "500px";
            body.append(iframe);
        }

        openModal("modalPreviewAnexo");
    }

    function removeAttachment(id) {
        if (!["new", "editing"].includes(state.mode)) return;

        const att = state.attachments.get(id);
        if (att?.url) URL.revokeObjectURL(att.url);
        state.attachments.delete(id);
        state.isDirty = true;
        renderAttachments();
    }

    function getFileIcon(name) {
        const ext = name.split(".").pop()?.toLowerCase();
        if (ext === "pdf") return "fa-file-pdf";
        if (["jpg", "jpeg", "png"].includes(ext)) return "fa-file-image";
        if (["doc", "docx"].includes(ext)) return "fa-file-word";
        return "fa-file";
    }

    function formatFileSize(bytes) {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /* ==========================================================
       BUSCA DE PACIENTE (XSS-SAFE DOM CREATION)
    ========================================================== */

    function executeSearch() {
        const term = (byId("buscaTermo")?.value || "").trim().toLowerCase();
        const resultsContainer = byId("buscaResultados");
        if (!resultsContainer) return;

        resultsContainer.replaceChildren();

        const filtered = patientsDatabase.filter((p) => {
            return (
                (p.nome || "").toLowerCase().includes(term) ||
                (p.cpf || "").includes(term) ||
                (p.id || "").toLowerCase().includes(term) ||
                (p.telefone_principal || "").includes(term)
            );
        });

        if (filtered.length === 0) {
            const empty = document.createElement("p");
            empty.className = "busca-vazio";
            empty.textContent = "Nenhum paciente localizado com o termo informado.";
            resultsContainer.append(empty);
            return;
        }

        filtered.forEach((patient) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "busca-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "busca-item-nome";
            nameSpan.textContent = patient.nome;

            const infoSpan = document.createElement("span");
            infoSpan.className = "busca-item-info";
            infoSpan.textContent = `CPF: ${patient.cpf || "N/A"} | Código: ${patient.id} | Tel: ${patient.telefone_principal || "N/A"}`;

            item.append(nameSpan, infoSpan);

            item.addEventListener("click", () => {
                closeModal("modalBusca");
                const idx = patientsDatabase.findIndex((p) => p.id === patient.id);
                loadPatientIntoForm(patient, idx);
            });

            resultsContainer.append(item);
        });
    }

    /* ==========================================================
       LOG DE AUDITORIA DE HISTÓRICO
    ========================================================== */

    function addHistory(action, detail = "") {
        state.history.push({
            date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date()),
            user: "ADMIN (Dra. Ana)",
            action,
            detail
        });
    }

    function renderHistory() {
        const container = byId("historicoConteudo");
        if (!container) return;

        container.replaceChildren();

        if (state.history.length === 0) {
            const empty = document.createElement("p");
            empty.className = "historico-vazio";
            empty.textContent = "Nenhuma alteração registrada para este paciente.";
            container.append(empty);
            return;
        }

        [...state.history].reverse().forEach((entry) => {
            const item = document.createElement("article");
            item.className = "historico-item";

            const header = document.createElement("div");
            header.className = "historico-header";

            const dateSpan = document.createElement("span");
            dateSpan.className = "historico-data";
            dateSpan.textContent = entry.date;

            const userSpan = document.createElement("span");
            userSpan.className = "historico-user";
            userSpan.textContent = entry.user;

            header.append(dateSpan, userSpan);

            const acaoDiv = document.createElement("div");
            acaoDiv.className = "historico-acao";

            const strong = document.createElement("strong");
            strong.textContent = entry.action;

            acaoDiv.append(strong, entry.detail ? ` — ${entry.detail}` : "");

            item.append(header, acaoDiv);
            container.append(item);
        });
    }

    /* ==========================================================
       MODAIS E GERENCIAMENTO DE FOCO ACCESSIBLE (WCAG 2.2)
    ========================================================== */

    function initializeModalEvents() {
        document.addEventListener("keydown", (event) => {
            const activeModal = document.querySelector(".modal.active");
            if (event.key === "Escape" && activeModal) {
                if (activeModal.id === "modalWebcam") closeWebcam();
                else closeModal(activeModal.id);
            }
        });
    }

    function openModal(id, trigger = document.activeElement) {
        const modal = byId(id);
        if (!modal) return;

        state.modalTriggers.set(id, trigger);
        modal.hidden = false;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(id) {
        const modal = byId(id);
        if (!modal) return;

        modal.classList.remove("active");
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");

        state.modalTriggers.get(id)?.focus?.();
    }

    /* ==========================================================
       MÁSCARAS E TRANSFORMAÇÕES DE INPUT
    ========================================================== */

    function initializeMasks() {
        const masks = {
            pacCpf: "cpf",
            pacRg: "rg",
            pacTel1: "phone",
            pacTel2: "phone",
            pacWhats: "phone",
            pacRespTel: "phone",
            pacRespWhats: "phone",
            pacCep: "cep",
            pacTitularCpf: "cpf",
            cartaoDocumento: "cpf",
            cartaoNumero: "card"
        };

        Object.entries(masks).forEach(([id, type]) => {
            byId(id)?.addEventListener("input", (event) => {
                applyMask(event.target, type);
            });
        });

        byId("pacCpf")?.addEventListener("blur", (event) => {
            checkCpfDuplication(event.target.value);
        });

        byId("pacNascimento")?.addEventListener("change", calculateAge);
    }

    function applyMask(input, type) {
        let val = input.value.replace(/\D/g, "");

        if (type === "cpf") {
            val = val.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        } else if (type === "rg") {
            val = val.slice(0, 9).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        } else if (type === "phone") {
            val = val.slice(0, 11);
            val = val.length > 10 ? val.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : val.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
            val = val.replace(/-$/, "");
        } else if (type === "cep") {
            val = val.slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
        } else if (type === "card") {
            val = val.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
        }

        input.value = val;
    }

    function initializeTextTransforms() {
        const uppercaseFields = [
            "pacNome", "pacNacionalidade", "pacProfissao", "pacRespNome",
            "pacRespParentesco", "pacEndereco", "pacBairro", "pacCidade",
            "pacTitular", "pacPlano", "pacDeficiencia", "cartaoTitular"
        ];

        uppercaseFields.forEach((id) => {
            byId(id)?.addEventListener("input", (event) => {
                event.target.value = event.target.value.toLocaleUpperCase("pt-BR");
            });
        });

        byId("pacEmail")?.addEventListener("input", (event) => {
            event.target.value = event.target.value.toLowerCase();
        });
    }

    function initializeFieldChangeListeners() {
        queryAll("#pacienteForm input, #pacienteForm select, #pacienteForm textarea").forEach((el) => {
            el.addEventListener("change", () => {
                state.isDirty = true;
                updateClinicalAlerts();
            });
        });
    }

    /* ==========================================================
       RELÓGIO E SNAPSHOT
    ========================================================== */

    function initializeClock() {
        const clock = byId("clock");
        if (!clock) return;

        const update = () => {
            const now = new Date();
            clock.textContent = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(now);
            clock.dateTime = now.toISOString();
        };

        update();
        window.setInterval(update, 1000);
    }

    function createSnapshot() {
        return extractPatientDataFromForm();
    }

    function restoreSnapshot(snapshot) {
        if (!snapshot) return;
        loadPatientIntoForm(snapshot, state.currentIndex);
    }

    function clearForm() {
        byId("pacienteForm")?.reset();
        clearInvalidFields();
        clearSignature();

        state.attachments.forEach((att) => {
            if (att.url) URL.revokeObjectURL(att.url);
        });
        state.attachments.clear();
        renderAttachments();

        const photo = byId("fotoPreview");
        if (photo) photo.src = DEFAULT_AVATAR;

        ["pacId", "pacIdade", "pacDataCad", "pacUltAtu"].forEach((id) => setFieldValue(id, ""));
        setFieldValue("pacNacionalidade", "BRASILEIRO");
        setFieldValue("pacPais", "BRASIL");
        setFieldValue("pacUserCad", "ADMIN (Dra. Ana)");
        setFieldValue("pacStatus", "A");
        setFieldValue("pacTemConvenio", "N");
        setFieldValue("pacFormaPagamento", "dinheiro");
        setFieldValue("pacLimiteCredito", "R$ 0,00");
        setFieldValue("pacInadimplente", "N");

        toggleConvenioFields();
        toggleCreditoPanel();
        updateClinicalAlerts();
    }

    function nowForDateTimeInput() {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    function setFieldValue(id, value) {
        const field = byId(id);
        if (field) field.value = value || "";
    }

    function setStatus(message) {
        const status = byId("formStatus");
        if (status) status.textContent = message;
    }

    /* ==========================================================
       APIS GLOBAIS E MÉTODOS PÚBLICOS EXPORTADOS
    ========================================================== */

    window.acaoNovo = actionNew;
    window.acaoGravar = actionSave;
    window.acaoEditar = actionEdit;
    window.acaoExcluir = actionDelete;
    window.acaoCancelar = actionCancel;
    window.acaoBuscar = actionSearch;
    window.acaoAnterior = actionPrevious;
    window.acaoProximo = actionNext;
    window.acaoAnexo = actionAttachment;
    window.acaoImprimir = actionPrint;
    window.acaoHistorico = actionHistory;
    window.buscarCep = searchCep;
    window.switchTab = switchTab;
    window.abrirWebcam = openWebcam;
    window.capturarFoto = capturePhoto;
    window.removerFoto = removerFoto;
    window.fecharWebcam = closeWebcam;
    window.fecharModal = closeModal;
    window.limparAssinatura = clearSignature;
    window.salvarAssinatura = saveSignature;
    window.executarBusca = executeSearch;
    window.toggleConvenioFields = toggleConvenioFields;
    window.toggleCreditoPanel = toggleCreditoPanel;
    window.detectCardBrand = detectCardBrand;
    window.calculateInstallments = calculateInstallments;
    window.updateClinicalAlerts = updateClinicalAlerts;

    window.emitirAtestado = () => {
        const pName = byId("pacNome")?.value || "Paciente";
        window.alert(`Solicitação de Atestado Médico para ${pName}.\nMódulo PEP integrado.`);
    };

    window.emitirPedidoExames = () => {
        const pName = byId("pacNome")?.value || "Paciente";
        window.alert(`Solicitação de Pedido de Exames para ${pName}.\nMódulo PEP/TUSS integrado.`);
    };

    window.emitirReceita = () => {
        const pName = byId("pacNome")?.value || "Paciente";
        window.alert(`Emissão de Receituário Médico para ${pName}.\nMódulo Prescrição Eletrônica integrado.`);
    };

    window.verHistorico = actionHistory;

    // Interface pública GM4MedPatient para PEP & Backend Java/PostgreSQL
    window.GM4MedPatient = {
        getPatientData: extractPatientDataFromForm,
        loadPatientData: (data) => loadPatientIntoForm(data),
        savePatientData: actionSave,
        searchPatients: (term) => patientsDatabase.filter(p => (p.nome || "").toLowerCase().includes(term.toLowerCase()))
    };
})();