/* =============================================
   LOGS DE AUDITORIA - GM4med
   JavaScript Funcional
   Design System: Shadcn/UI + teal-600
   ============================================= */

// =============================================
// ESTADO GLOBAL
// =============================================
let logsData = [];
let filteredLogs = [];
let autoRefresh = true;
let refreshInterval = null;
let currentTheme = 'light';

// Dados simulados (em produção, viriam do backend)
const mockLogs = [
    { id: 'LOG-001', timestamp: '2026-08-18T10:30:00', user: 'Dr. Rodrigo', action: 'create', module: 'Paciente', description: 'Cadastro de novo paciente', ip: '192.168.1.100', severity: 'info', session: 'sess_abc123', device: 'Chrome/Windows', payload: { pacienteId: 'P-1234', nome: 'João Silva' } },
    { id: 'LOG-002', timestamp: '2026-08-18T10:25:00', user: 'Dra. Ana', action: 'update', module: 'Agenda', description: 'Atualização de horário de consulta', ip: '192.168.1.101', severity: 'info', session: 'sess_def456', device: 'Firefox/Mac', payload: { consultaId: 'C-5678', novoHorario: '14:00' } },
    { id: 'LOG-003', timestamp: '2026-08-18T10:20:00', user: 'Dr. Rodrigo', action: 'login', module: 'Usuário', description: 'Login realizado com sucesso', ip: '192.168.1.100', severity: 'info', session: 'sess_abc123', device: 'Chrome/Windows', payload: { userId: 'U-001' } },
    { id: 'LOG-004', timestamp: '2026-08-18T10:15:00', user: 'Sistema', action: 'error', module: 'Financeiro', description: 'Erro ao processar pagamento', ip: '192.168.1.50', severity: 'error', session: 'sess_sys001', device: 'Server', payload: { erro: 'Timeout', transacaoId: 'T-9999' } },
    { id: 'LOG-005', timestamp: '2026-08-18T10:10:00', user: 'Dra. Ana', action: 'delete', module: 'Atendimento', description: 'Exclusão de atendimento cancelado', ip: '192.168.1.101', severity: 'warn', session: 'sess_def456', device: 'Firefox/Mac', payload: { atendimentoId: 'A-3456' } },
    { id: 'LOG-006', timestamp: '2026-08-18T10:05:00', user: 'Dr. Carlos', action: 'export', module: 'Estoque', description: 'Exportação de relatório de estoque', ip: '192.168.1.102', severity: 'info', session: 'sess_ghi789', device: 'Safari/Mac', payload: { relatorio: 'estoque_agosto' } },
    { id: 'LOG-007', timestamp: '2026-08-18T10:00:00', user: 'Sistema', action: 'logout', module: 'Usuário', description: 'Logout automático por inatividade', ip: '192.168.1.103', severity: 'info', session: 'sess_jkl012', device: 'Server', payload: { userId: 'U-005' } },
    { id: 'LOG-008', timestamp: '2026-08-18T09:55:00', user: 'Dr. Rodrigo', action: 'update', module: 'Configuração', description: 'Alteração de parâmetros do sistema', ip: '192.168.1.100', severity: 'warn', session: 'sess_abc123', device: 'Chrome/Windows', payload: { parametro: 'taxa_juros', valor: '1.5%' } },
];

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar ícones Lucide
    lucide.createIcons();

    // Carregar dados
    logsData = [...mockLogs];
    filteredLogs = [...logsData];

    // Popular tabela
    renderTable();

    // Atualizar KPIs
    updateKPIs();

    // Renderizar gráfico
    renderBarChart();

    // Popular filtro de usuários
    populateUserFilter();

    // Configurar event listeners CORRETAMENTE
    configurarEventListeners();

    // Iniciar auto-refresh
    if (autoRefresh) {
        startAutoRefresh();
    }

    console.log('Sistema de Logs de Auditoria inicializado!');
});

// =============================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================
function configurarEventListeners() {
    // Botões da topbar
    const btnAuto = document.getElementById('btnAuto');
    const btnToggleTheme = document.getElementById('toggleTheme');
    const btnRefresh = document.getElementById('btnRefresh');

    if (btnAuto) {
        btnAuto.addEventListener('click', toggleAutoRefresh);
    }

    if (btnToggleTheme) {
        btnToggleTheme.addEventListener('click', toggleTheme);
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', refreshData);
    }

    // Botões de ação
    const btnExport = document.getElementById('btnExport');
    const btnPrint = document.getElementById('btnPrint');
    const btnLive = document.getElementById('btnLive');

    if (btnExport) {
        btnExport.addEventListener('click', exportCSV);
    }

    if (btnPrint) {
        btnPrint.addEventListener('click', printLogs);
    }

    if (btnLive) {
        btnLive.addEventListener('click', toggleLiveMonitor);
    }

    // Filtros
    const btnApply = document.getElementById('btnApply');
    const btnClear = document.getElementById('btnClear');

    if (btnApply) {
        btnApply.addEventListener('click', applyFilters);
    }

    if (btnClear) {
        btnClear.addEventListener('click', clearFilters);
    }

    // Busca
    const searchLog = document.getElementById('searchLog');
    if (searchLog) {
        searchLog.addEventListener('input', searchLogs);
    }

    // Modal
    const mClose = document.getElementById('mClose');
    const mCopy = document.getElementById('mCopy');
    const detailModal = document.getElementById('detailModal');

    if (mClose) {
        mClose.addEventListener('click', closeModal);
    }

    if (mCopy) {
        mCopy.addEventListener('click', copyJSON);
    }

    if (detailModal) {
        detailModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

// =============================================
// FUNÇÕES DE TABELA
// =============================================
function renderTable() {
    const tbody = document.getElementById('logBody');
    tbody.innerHTML = '';

    if (filteredLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: #94a3b8;">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin: 0 auto 1rem; display: block; opacity: 0.5;"></i>
                    Nenhum log encontrado
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    filteredLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.dataset.id = log.id;

        tr.innerHTML = `
            <td>${formatTimestamp(log.timestamp)}</td>
            <td>${log.user}</td>
            <td><span class="sev-badge sev-${log.severity}">${log.action}</span></td>
            <td>${log.module}</td>
            <td>${log.description}</td>
            <td>${log.ip}</td>
            <td><span class="sev-badge sev-${log.severity}">${log.severity}</span></td>
            <td>
                <button class="action-btn" onclick="openModal('${log.id}')" aria-label="Ver detalhes">
                    <i data-lucide="eye"></i>
                </button>
            </td>
        `;

        // Adicionar evento de clique na linha
        tr.addEventListener('click', function (e) {
            if (!e.target.closest('.action-btn')) {
                openModal(log.id);
            }
        });

        tbody.appendChild(tr);
    });

    lucide.createIcons();

    // Atualizar contador
    document.getElementById('showing').textContent = filteredLogs.length;
    document.getElementById('totalRows').textContent = logsData.length;
}

// =============================================
// FUNÇÕES DE FILTRO
// =============================================
function applyFilters() {
    const fTipo = document.getElementById('fTipo').value;
    const fModulo = document.getElementById('fModulo').value;
    const fUser = document.getElementById('fUser').value;
    const fSev = document.getElementById('fSev').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    filteredLogs = logsData.filter(log => {
        if (fTipo && log.action !== fTipo) return false;
        if (fModulo && log.module !== fModulo) return false;
        if (fUser && log.user !== fUser) return false;
        if (fSev && log.severity !== fSev) return false;
        if (dateFrom && new Date(log.timestamp) < new Date(dateFrom)) return false;
        if (dateTo && new Date(log.timestamp) > new Date(dateTo)) return false;
        return true;
    });

    renderTable();
    updateKPIs();
    renderBarChart();
}

function clearFilters() {
    document.getElementById('fTipo').value = '';
    document.getElementById('fModulo').value = '';
    document.getElementById('fUser').value = '';
    document.getElementById('fSev').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';

    filteredLogs = [...logsData];
    renderTable();
    updateKPIs();
    renderBarChart();
}

function searchLogs() {
    const termo = document.getElementById('searchLog').value.toLowerCase();

    if (!termo) {
        filteredLogs = [...logsData];
    } else {
        filteredLogs = logsData.filter(log => {
            return log.description.toLowerCase().includes(termo) ||
                log.user.toLowerCase().includes(termo) ||
                log.module.toLowerCase().includes(termo) ||
                log.id.toLowerCase().includes(termo);
        });
    }

    renderTable();
}

function populateUserFilter() {
    const users = [...new Set(logsData.map(log => log.user))];
    const select = document.getElementById('fUser');

    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        select.appendChild(option);
    });
}

// =============================================
// FUNÇÕES DE KPI
// =============================================
function updateKPIs() {
    const today = new Date().toISOString().split('T')[0];

    const total = filteredLogs.length;
    const todayCount = filteredLogs.filter(log => log.timestamp.startsWith(today)).length;
    const newToday = Math.floor(Math.random() * 10);
    const alerts = filteredLogs.filter(log => log.severity === 'error' || log.severity === 'critical').length;
    const uniqueUsers = new Set(filteredLogs.map(log => log.user)).size;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiToday').textContent = todayCount;
    document.getElementById('kpiNewToday').textContent = newToday;
    document.getElementById('kpiWarn').textContent = alerts;
    document.getElementById('kpiUsers').textContent = uniqueUsers;
}

// =============================================
// FUNÇÕES DE GRÁFICO
// =============================================
function renderBarChart() {
    const container = document.getElementById('barHours');
    container.innerHTML = '';

    // Simular dados das últimas 24 horas
    const hours = [];
    for (let i = 23; i >= 0; i--) {
        const hour = new Date();
        hour.setHours(hour.getHours() - i);
        hours.push({
            hour: hour.getHours().toString().padStart(2, '0') + ':00',
            create: Math.floor(Math.random() * 5),
            update: Math.floor(Math.random() * 8),
            delete: Math.floor(Math.random() * 3),
            login: Math.floor(Math.random() * 6),
            error: Math.floor(Math.random() * 2)
        });
    }

    const maxVal = Math.max(...hours.flatMap(h => [h.create, h.update, h.delete, h.login, h.error]));

    hours.forEach(data => {
        const col = document.createElement('div');
        col.className = 'bar-col';

        const stack = document.createElement('div');
        stack.className = 'bar-stack';

        const segments = [
            { value: data.create, color: 'var(--brand)' },
            { value: data.update, color: 'var(--cyan)' },
            { value: data.delete, color: 'var(--warn)' },
            { value: data.login, color: 'var(--ok)' },
            { value: data.error, color: 'var(--danger)' }
        ];

        segments.forEach(seg => {
            if (seg.value > 0) {
                const bar = document.createElement('div');
                bar.className = 'bar-seg';
                bar.style.height = (seg.value / maxVal * 100) + 'px';
                bar.style.background = seg.color;
                stack.appendChild(bar);
            }
        });

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = data.hour;

        col.appendChild(stack);
        col.appendChild(label);
        container.appendChild(col);
    });
}

// =============================================
// FUNÇÕES DE MODAL
// =============================================
function openModal(logId) {
    const log = logsData.find(l => l.id === logId);
    if (!log) return;

    document.getElementById('mTag').textContent = log.severity.toUpperCase();
    document.getElementById('mTitle').textContent = log.description;
    document.getElementById('mId').textContent = log.id;
    document.getElementById('mUser').textContent = log.user;
    document.getElementById('mAction').textContent = log.action;
    document.getElementById('mModule').textContent = log.module;
    document.getElementById('mTime').textContent = formatTimestamp(log.timestamp);
    document.getElementById('mIP').textContent = log.ip;
    document.getElementById('mSession').textContent = log.session;
    document.getElementById('mDevice').textContent = log.device;
    document.getElementById('mDesc').textContent = log.description;
    document.getElementById('mPayload').textContent = JSON.stringify(log.payload, null, 2);

    document.getElementById('detailModal').hidden = false;
}

function closeModal() {
    document.getElementById('detailModal').hidden = true;
}

function copyJSON() {
    const payload = document.getElementById('mPayload').textContent;
    navigator.clipboard.writeText(payload).then(() => {
        showToast('JSON copiado com sucesso!', 'success');
    });
}

// =============================================
// FUNÇÕES DE AÇÃO - CORREGIDAS
// =============================================
function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    const btn = document.getElementById('btnAuto');

    if (autoRefresh) {
        btn.classList.add('on');
        startAutoRefresh();
        showToast('Auto-refresh ativado', 'info');
    } else {
        btn.classList.remove('on');
        stopAutoRefresh();
        showToast('Auto-refresh desativado', 'info');
    }
}

function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        refreshData();
    }, 30000); // 30 segundos
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function refreshData() {
    const btn = document.getElementById('btnRefresh');

    // Criar animação de spin
    btn.style.animation = 'spin 1s linear';

    setTimeout(() => {
        btn.style.animation = '';
        // Simular novos dados
        logsData = [...mockLogs];
        filteredLogs = [...logsData];
        renderTable();
        updateKPIs();
        renderBarChart();
        document.getElementById('lastSync').textContent = 'agora';
        showToast('Dados atualizados', 'success');
    }, 1000);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    const btn = document.getElementById('toggleTheme');

    if (currentTheme === 'dark') {
        // Trocar ícone para sun
        btn.innerHTML = '<i data-lucide="sun"></i>';
        document.body.style.background = '#0f172a';
        document.body.style.color = '#f1f5f9';
        showToast('Tema escuro ativado', 'info');
    } else {
        // Trocar ícone para moon
        btn.innerHTML = '<i data-lucide="moon"></i>';
        document.body.style.background = '#e6f7f5';
        document.body.style.color = '#1e293b';
        showToast('Tema claro ativado', 'info');
    }

    // Re-renderizar ícones Lucide
    lucide.createIcons();
}

function toggleLiveMonitor() {
    const btn = document.getElementById('btnLive');
    const dot = btn.querySelector('.dot-live');

    if (dot.style.animation) {
        dot.style.animation = '';
        btn.innerHTML = '<span class="dot-live"></span> Monitorar em tempo real';
        showToast('Monitoramento pausado', 'info');
    } else {
        dot.style.animation = 'pulse 2s infinite';
        btn.innerHTML = '<span class="dot-live"></span> Monitorando...';
        showToast('Monitoramento em tempo real ativado', 'success');
    }

    lucide.createIcons();
}

function exportCSV() {
    const headers = ['ID', 'Timestamp', 'Usuário', 'Ação', 'Módulo', 'Descrição', 'IP', 'Severidade'];
    const rows = filteredLogs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.module,
        log.description,
        log.ip,
        log.severity
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs_auditoria_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();

    showToast('CSV exportado com sucesso!', 'success');
}

function printLogs() {
    window.print();
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const toastBox = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" style="color: var(--${type === 'success' ? 'ok' : 'info'})"></i>
        <span>${message}</span>
    `;

    toastBox.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Adicionar animação de spin ao CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Exportar funções para escopo global
window.openModal = openModal;