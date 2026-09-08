/* =============================================
   GERENCIAMENTO DE USUÁRIOS - GM4med
   JavaScript Funcional
   Design System: Shadcn/UI + teal-600
   ============================================= */

// =============================================
// ESTADO GLOBAL
// =============================================
let usuariosData = [];
let filteredUsers = [];
let usuarioAtual = null;
let modoEdicao = false;
let usuarioParaExcluir = null;
let currentTheme = 'light';

// Dados simulados (em produção, viriam do backend)
const mockUsuarios = [
    { id: 'U-001', nome: 'Dr. Rodrigo Silva', login: 'dr.rodrigo', email: 'rodrigo@GM4med.com', perfil: 'Administrador', status: 'Ativo', ultimoAcesso: '2026-08-18T10:30:00' },
    { id: 'U-002', nome: 'Dra. Ana Costa', login: 'dra.ana', email: 'ana@GM4med.com', perfil: 'Médico', status: 'Ativo', ultimoAcesso: '2026-08-18T09:15:00' },
    { id: 'U-003', nome: 'Carlos Oliveira', login: 'carlos.recepcao', email: 'carlos@GM4med.com', perfil: 'Recepção', status: 'Ativo', ultimoAcesso: '2026-08-18T08:45:00' },
    { id: 'U-004', nome: 'Mariana Santos', login: 'mariana.financeiro', email: 'mariana@GM4med.com', perfil: 'Financeiro', status: 'Ativo', ultimoAcesso: '2026-08-17T16:20:00' },
    { id: 'U-005', nome: 'Dr. Pedro Almeida', login: 'dr.pedro', email: 'pedro@GM4med.com', perfil: 'Médico', status: 'Bloqueado', ultimoAcesso: '2026-08-15T14:00:00' },
    { id: 'U-006', nome: 'Juliana Ferreira', login: 'juliana.adm', email: 'juliana@GM4med.com', perfil: 'Administrador', status: 'Ativo', ultimoAcesso: '2026-08-18T07:30:00' },
];

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar ícones Lucide
    lucide.createIcons();

    // Carregar dados
    usuariosData = [...mockUsuarios];
    filteredUsers = [...usuariosData];

    // Popular tabela
    renderTable();

    // Atualizar stats
    updateStats();

    // Configurar event listeners
    configurarEventListeners();

    // Atualizar footer
    updateFooter();

    console.log('Sistema de Gerenciamento de Usuários inicializado!');
});

// =============================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================
function configurarEventListeners() {
    // Topbar
    const tTheme = document.getElementById('tTheme');
    if (tTheme) {
        tTheme.addEventListener('click', toggleTheme);
    }

    // Page actions
    const btnExport = document.getElementById('btnExport');
    const btnPrint = document.getElementById('btnPrint');

    if (btnExport) {
        btnExport.addEventListener('click', exportCSV);
    }

    if (btnPrint) {
        btnPrint.addEventListener('click', printPage);
    }

    // Card actions
    const buscarUsuario = document.getElementById('buscarUsuario');
    const filtroPerfil = document.getElementById('filtroPerfil');
    const btnNovoUsuario = document.getElementById('btnNovoUsuario');

    if (buscarUsuario) {
        buscarUsuario.addEventListener('input', searchUsers);
    }

    if (filtroPerfil) {
        filtroPerfil.addEventListener('change', filterByProfile);
    }

    if (btnNovoUsuario) {
        btnNovoUsuario.addEventListener('click', openNewUserModal);
    }

    // Modal Cadastro
    const bCloseCad = document.getElementById('bCloseCad');
    const bCancelCad = document.getElementById('bCancelCad');
    const bSalvar = document.getElementById('bSalvar');
    const cSenha = document.getElementById('cSenha');

    if (bCloseCad) {
        bCloseCad.addEventListener('click', closeCadastroModal);
    }

    if (bCancelCad) {
        bCancelCad.addEventListener('click', closeCadastroModal);
    }

    if (bSalvar) {
        bSalvar.addEventListener('click', salvarUsuario);
    }

    if (cSenha) {
        cSenha.addEventListener('input', checkPasswordStrength);
    }

    // Modal Excluir
    const bCancelDel = document.getElementById('bCancelDel');
    const bConfirmDel = document.getElementById('bConfirmDel');

    if (bCancelDel) {
        bCancelDel.addEventListener('click', closeExcluirModal);
    }

    if (bConfirmDel) {
        bConfirmDel.addEventListener('click', confirmDelete);
    }

    // Fechar modais ao clicar fora
    const mCadastro = document.getElementById('mCadastro');
    const mExcluir = document.getElementById('mExcluir');

    if (mCadastro) {
        mCadastro.addEventListener('click', function (e) {
            if (e.target === this) {
                closeCadastroModal();
            }
        });
    }

    if (mExcluir) {
        mExcluir.addEventListener('click', function (e) {
            if (e.target === this) {
                closeExcluirModal();
            }
        });
    }

    // Form validation
    const fCadastro = document.getElementById('fCadastro');
    if (fCadastro) {
        fCadastro.addEventListener('submit', function (e) {
            e.preventDefault();
            salvarUsuario();
        });
    }
}

// =============================================
// FUNÇÕES DE TABELA
// =============================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: #94a3b8;">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin: 0 auto 1rem; display: block; opacity: 0.5;"></i>
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    filteredUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.dataset.id = user.id;

        tr.innerHTML = `
            <td>
                <div class="avatar" style="width: 32px; height: 32px; font-size: 0.75rem;">
                    ${getInitials(user.nome)}
                </div>
            </td>
            <td>
                <div style="font-weight: 500;">${user.nome}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${user.email}</div>
            </td>
            <td>${user.login}</td>
            <td><span class="status-badge" style="background: #dbeafe; color: #1d4ed8;">${user.perfil}</span></td>
            <td>
                <span class="status-badge ${user.status.toLowerCase()}">
                    <span class="status-dot"></span>
                    ${user.status}
                </span>
            </td>
            <td>${formatLastAccess(user.ultimoAcesso)}</td>
            <td>
                <button class="action-btn" onclick="editUser('${user.id}')" aria-label="Editar" title="Editar">
                    <i data-lucide="edit-2"></i>
                </button>
            </td>
        `;

        // Adicionar evento de clique na linha
        tr.addEventListener('click', function (e) {
            if (!e.target.closest('.action-btn')) {
                selectUser(user.id);
            }
        });

        tbody.appendChild(tr);
    });

    lucide.createIcons();

    // Atualizar contador
    document.getElementById('showing').textContent = filteredUsers.length;
    document.getElementById('totalRows').textContent = usuariosData.length;
}

function selectUser(userId) {
    // Remove active de todas as linhas
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => row.classList.remove('active'));

    // Adiciona active na linha selecionada
    const selectedRow = document.querySelector(`#tableBody tr[data-id="${userId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('active');
    }

    // Carrega dados para edição
    editUser(userId);
}

// =============================================
// FUNÇÕES DE FILTRO E BUSCA
// =============================================
function searchUsers() {
    const termo = document.getElementById('buscarUsuario').value.toLowerCase();
    const filtroPerfil = document.getElementById('filtroPerfil').value;

    filteredUsers = usuariosData.filter(user => {
        const matchSearch = !termo ||
            user.nome.toLowerCase().includes(termo) ||
            user.login.toLowerCase().includes(termo) ||
            user.email.toLowerCase().includes(termo);

        const matchProfile = !filtroPerfil || user.perfil === filtroPerfil;

        return matchSearch && matchProfile;
    });

    renderTable();
    updateStats();
}

function filterByProfile() {
    searchUsers(); // Reutiliza a lógica de busca
}

// =============================================
// FUNÇÕES DE STATS
// =============================================
function updateStats() {
    const total = filteredUsers.length;
    const ativos = filteredUsers.filter(u => u.status === 'Ativo').length;
    const bloqueados = filteredUsers.filter(u => u.status === 'Bloqueado').length;
    const administradores = filteredUsers.filter(u => u.perfil === 'Administrador').length;

    document.getElementById('totalUsuarios').textContent = total;
    document.getElementById('usuariosAtivos').textContent = ativos;
    document.getElementById('usuariosBloqueados').textContent = bloqueados;
    document.getElementById('administradores').textContent = administradores;
}

function updateFooter() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('lastSync').textContent = timeStr;
    document.getElementById('syncFooter').textContent = `Atualizado em ${timeStr}`;
}

// =============================================
// FUNÇÕES DE MODAL (CADASTRO)
// =============================================
function openNewUserModal() {
    modoEdicao = false;
    usuarioAtual = null;

    // Limpar formulário
    document.getElementById('fCadastro').reset();

    // Atualizar UI
    document.getElementById('tTag').textContent = 'NOVO';
    document.getElementById('tTitle').textContent = 'Novo Usuário';
    document.getElementById('reqSenha').textContent = '*';
    document.getElementById('hintSenha').innerHTML = 'Força: <b>—</b>';

    // Abrir modal
    document.getElementById('mCadastro').hidden = false;
    document.getElementById('cNome').focus();
}

function editUser(userId) {
    const user = usuariosData.find(u => u.id === userId);
    if (!user) return;

    modoEdicao = true;
    usuarioAtual = user;

    // Preencher formulário
    document.getElementById('cNome').value = user.nome;
    document.getElementById('cLogin').value = user.login;
    document.getElementById('cEmail').value = user.email;
    document.getElementById('cPerfil').value = user.perfil;
    document.getElementById('cStatus').value = user.status;
    document.getElementById('cSenha').value = '';

    // Atualizar UI
    document.getElementById('tTag').textContent = 'EDITAR';
    document.getElementById('tTitle').textContent = 'Editar Usuário';
    document.getElementById('reqSenha').textContent = '(opcional)';
    document.getElementById('hintSenha').innerHTML = 'Força: <b>—</b>';

    // Abrir modal
    document.getElementById('mCadastro').hidden = false;
    document.getElementById('cNome').focus();
}

function closeCadastroModal() {
    document.getElementById('mCadastro').hidden = true;
}

function salvarUsuario() {
    const nome = document.getElementById('cNome').value.trim();
    const login = document.getElementById('cLogin').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const perfil = document.getElementById('cPerfil').value;
    const senha = document.getElementById('cSenha').value;
    const status = document.getElementById('cStatus').value;

    // Validação básica
    if (!nome || !login || !email) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('E-mail inválido', 'error');
        return;
    }

    // Validação de senha (apenas para novo usuário)
    if (!modoEdicao && senha.length < 6) {
        showToast('Senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }

    if (modoEdicao && usuarioAtual) {
        // Atualizar usuário existente
        usuarioAtual.nome = nome;
        usuarioAtual.login = login;
        usuarioAtual.email = email;
        usuarioAtual.perfil = perfil;
        usuarioAtual.status = status;

        if (senha) {
            // Atualizar senha (simulado)
        }

        showToast('Usuário atualizado com sucesso!', 'success');
    } else {
        // Criar novo usuário
        const novoUsuario = {
            id: 'U-' + String(usuariosData.length + 1).padStart(3, '0'),
            nome: nome,
            login: login,
            email: email,
            perfil: perfil,
            status: status,
            ultimoAcesso: new Date().toISOString()
        };

        usuariosData.push(novoUsuario);
        showToast('Usuário criado com sucesso!', 'success');
    }

    // Atualizar tabela e stats
    filteredUsers = [...usuariosData];
    renderTable();
    updateStats();
    updateFooter();

    // Fechar modal
    closeCadastroModal();
}

// =============================================
// FUNÇÕES DE MODAL (EXCLUSÃO)
// =============================================
function confirmDelete() {
    if (!usuarioParaExcluir) return;

    // Remover usuário
    usuariosData = usuariosData.filter(u => u.id !== usuarioParaExcluir.id);
    filteredUsers = [...usuariosData];

    // Atualizar tabela e stats
    renderTable();
    updateStats();
    updateFooter();

    // Fechar modal
    closeExcluirModal();

    showToast('Usuário excluído com sucesso!', 'success');
}

function closeExcluirModal() {
    document.getElementById('mExcluir').hidden = true;
    usuarioParaExcluir = null;
}

// =============================================
// FUNÇÕES DE AÇÃO
// =============================================
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    const btn = document.getElementById('tTheme');

    if (currentTheme === 'dark') {
        btn.innerHTML = '<i data-lucide="sun"></i>';
        document.body.style.background = '#0f172a';
        document.body.style.color = '#f1f5f9';
        showToast('Tema escuro ativado', 'info');
    } else {
        btn.innerHTML = '<i data-lucide="moon"></i>';
        document.body.style.background = '#e6f7f5';
        document.body.style.color = '#1e293b';
        showToast('Tema claro ativado', 'info');
    }

    lucide.createIcons();
}

function exportCSV() {
    const headers = ['ID', 'Nome', 'Login', 'Email', 'Perfil', 'Status', 'Último Acesso'];
    const rows = filteredUsers.map(user => [
        user.id,
        user.nome,
        user.login,
        user.email,
        user.perfil,
        user.status,
        user.ultimoAcesso
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();

    showToast('CSV exportado com sucesso!', 'success');
}

function printPage() {
    window.print();
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================
function getInitials(nome) {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
}

function formatLastAccess(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Hoje';
    } else if (diffDays === 1) {
        return 'Ontem';
    } else if (diffDays < 7) {
        return `${diffDays} dias atrás`;
    } else {
        return date.toLocaleDateString('pt-BR');
    }
}

function checkPasswordStrength() {
    const senha = document.getElementById('cSenha').value;
    const hint = document.getElementById('hintSenha');

    if (!senha) {
        hint.innerHTML = 'Força: <b>—</b>';
        return;
    }

    let strength = 0;
    if (senha.length >= 6) strength++;
    if (senha.length >= 8) strength++;
    if (/[A-Z]/.test(senha)) strength++;
    if (/[0-9]/.test(senha)) strength++;
    if (/[^A-Za-z0-9]/.test(senha)) strength++;

    const labels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    const index = Math.min(strength, 4);
    hint.innerHTML = `Força: <b style="color: ${colors[index]}">${labels[index]}</b>`;
}

function showToast(message, type = 'info') {
    const toastBox = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast';

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    const color = type === 'success' ? 'ok' : type === 'error' ? 'danger' : 'info';

    toast.innerHTML = `
        <i data-lucide="${icon}" style="color: var(--${color})"></i>
        <span>${message}</span>
    `;

    toastBox.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Exportar funções para escopo global
window.editUser = editUser;