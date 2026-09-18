'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const SELECTORS = {
        submenuToggle: '.submenu-toggle',
        submenu: '.submenu',
        menuLink: '.sidebar a[href]',
        submenuLink: '.submenu-link'
    };

    const elements = {
        submenuToggles: [
            ...document.querySelectorAll(SELECTORS.submenuToggle)
        ],

        submenus: [
            ...document.querySelectorAll(SELECTORS.submenu)
        ],

        menuLinks: [
            ...document.querySelectorAll(SELECTORS.menuLink)
        ],

        sidebar: document.querySelector('#mainSidebar'),
        sidebarToggle: document.querySelector('#sidebarToggle'),
        mobileMenuButton: document.querySelector('#mobileMenuButton'),
        sidebarOverlay: document.querySelector('#sidebarOverlay'),
        mainContent: document.querySelector('.main-content'),
        clock: document.querySelector('#relogio-dinamico'),
        sessionTime: document.querySelector('#tempoLogado')
    };

    const state = {
        mobileMenuOpen: false,
        sidebarCollapsed: false,
        timers: [],
        sessionStorageAvailable: verificarStorage(sessionStorage)
    };

    inicializar();

    function inicializar() {
        inicializarSubmenus();
        inicializarMenuMobile();
        inicializarSidebarDesktop();
        inicializarLinksAtivos();
        inicializarRelogio();
        inicializarTempoSessao();
        inicializarLinksDeNavegacao();
        atualizarLabelsDeAcesso();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /*
     * =========================================================
     * SUBMENUS
     * =========================================================
     */

    function inicializarSubmenus() {
        elements.submenuToggles.forEach(toggle => {
            const submenu = obterSubmenuDoToggle(toggle);

            if (!submenu) {
                return;
            }

            configurarEstadoInicial(toggle, submenu);

            toggle.addEventListener('click', event => {
                event.preventDefault();

                const estaAberto =
                    toggle.getAttribute('aria-expanded') === 'true';

                fecharTodosOsSubmenus(toggle);

                if (estaAberto) {
                    fecharSubmenu(toggle, submenu);
                } else {
                    abrirSubmenu(toggle, submenu);
                }
            });

            toggle.addEventListener('keydown', event => {
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    event.preventDefault();
                    toggle.click();
                }

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    abrirSubmenu(toggle, submenu);

                    const primeiroLink =
                        submenu.querySelector('a[href]');

                    primeiroLink?.focus();
                }

                if (event.key === 'Escape') {
                    event.preventDefault();
                    fecharSubmenu(toggle, submenu);
                    toggle.focus();
                }
            });
        });
    }

    function obterSubmenuDoToggle(toggle) {
        const submenuId =
            toggle.getAttribute('aria-controls');

        if (!submenuId) {
            return null;
        }

        const submenu =
            document.getElementById(submenuId);

        return submenu instanceof HTMLElement
            ? submenu
            : null;
    }

    function configurarEstadoInicial(toggle, submenu) {
        const estaAberto =
            toggle.getAttribute('aria-expanded') === 'true';

        toggle.setAttribute(
            'aria-expanded',
            String(estaAberto)
        );

        submenu.setAttribute(
            'aria-hidden',
            String(!estaAberto)
        );

        if (estaAberto) {
            submenu.classList.remove('hidden');
            submenu.classList.add('is-open');
        } else {
            submenu.classList.remove('is-open');
            submenu.classList.add('hidden');
        }
    }

    function abrirSubmenu(toggle, submenu) {
        if (!toggle || !submenu) {
            return;
        }

        toggle.setAttribute('aria-expanded', 'true');
        submenu.setAttribute('aria-hidden', 'false');

        /*
         * É necessário remover hidden porque essa classe do
         * Tailwind aplica display: none !important.
         */
        submenu.classList.remove('hidden');
        submenu.classList.add('is-open');
    }

    function fecharSubmenu(toggle, submenu) {
        if (!toggle || !submenu) {
            return;
        }

        toggle.setAttribute('aria-expanded', 'false');
        submenu.setAttribute('aria-hidden', 'true');

        submenu.classList.remove('is-open');
        submenu.classList.add('hidden');
    }

    function fecharTodosOsSubmenus(toggleAtual = null) {
        elements.submenuToggles.forEach(toggle => {
            if (toggle === toggleAtual) {
                return;
            }

            const submenu = obterSubmenuDoToggle(toggle);

            if (submenu) {
                fecharSubmenu(toggle, submenu);
            }
        });
    }

    /*
     * =========================================================
     * MENU MOBILE
     * =========================================================
     */

    function inicializarMenuMobile() {
        const {
            sidebar,
            mobileMenuButton,
            sidebarOverlay
        } = elements;

        if (
            !sidebar ||
            !mobileMenuButton ||
            !sidebarOverlay
        ) {
            return;
        }

        mobileMenuButton.addEventListener(
            'click',
            alternarMenuMobile
        );

        sidebarOverlay.addEventListener(
            'click',
            fecharMenuMobile
        );

        document.addEventListener(
            'keydown',
            tratarTeclaEscape
        );

        window.addEventListener(
            'resize',
            tratarRedimensionamento
        );
    }

    function inicializarSidebarDesktop() {
        const { sidebarToggle, sidebar } = elements;

        if (!sidebarToggle || !sidebar) {
            return;
        }

        const estadoSalvo = obterEstadoSidebarSalvo();
        const desktop = window.innerWidth > 1024;

        state.sidebarCollapsed = desktop ? estadoSalvo : false;
        aplicarEstadoSidebar(state.sidebarCollapsed, false);

        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                return;
            }

            state.sidebarCollapsed = !state.sidebarCollapsed;
            aplicarEstadoSidebar(state.sidebarCollapsed, true);
        });
    }

    function obterEstadoSidebarSalvo() {
        try {
            const valor = localStorage.getItem('gm4med-sidebar-collapsed');
            return valor === 'true';
        } catch {
            return false;
        }
    }

    function salvarEstadoSidebar(estado) {
        try {
            localStorage.setItem('gm4med-sidebar-collapsed', String(estado));
        } catch {
            // Ignorar falha de persistência em ambientes restritos.
        }
    }

    function aplicarEstadoSidebar(estadoColapsado, persistir = false) {
        const { sidebar, sidebarToggle, mainContent } = elements;

        if (!sidebar) {
            return;
        }

        state.sidebarCollapsed = estadoColapsado;
        document.body.classList.toggle('sidebar-collapsed', estadoColapsado);
        sidebar.classList.toggle('sidebar-collapsed', estadoColapsado);

        if (persistir) {
            salvarEstadoSidebar(estadoColapsado);
        }

        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('sidebar-collapsed');
            document.body.classList.remove('sidebar-collapsed');
        }

        if (mainContent) {
            if (window.innerWidth > 1024) {
                mainContent.style.setProperty('margin-left', estadoColapsado ? '86px' : '290px', 'important');
                mainContent.style.transition = 'margin-left 220ms ease';
            } else {
                mainContent.style.setProperty('margin-left', '0', 'important');
            }
        }

        if (sidebarToggle) {
            const expandido = !estadoColapsado;
            sidebarToggle.setAttribute('aria-expanded', String(expandido));
            sidebarToggle.setAttribute(
                'aria-label',
                expandido ? 'Recolher sidebar' : 'Expandir sidebar'
            );

            const icone = sidebarToggle.querySelector('i');
            if (icone) {
                icone.classList.toggle('fa-angle-left', expandido);
                icone.classList.toggle('fa-angle-right', !expandido);
            }
        }

        atualizarLabelsDeAcesso();

        if (estadoColapsado) {
            fecharTodosOsSubmenus();
        }
    }

    function atualizarLabelsDeAcesso() {
        const emSidebarColapsada = document.body.classList.contains('sidebar-collapsed');

        document.querySelectorAll('.menu-item, .submenu-link').forEach(item => {
            const texto = (item.textContent || '').replace(/\s+/g, ' ').trim();

            if (!texto) {
                return;
            }

            item.setAttribute('title', texto);

            if (emSidebarColapsada) {
                item.setAttribute('aria-label', texto);
            } else {
                item.removeAttribute('aria-label');
            }
        });
    }

    function alternarMenuMobile() {
        if (state.mobileMenuOpen) {
            fecharMenuMobile();
        } else {
            abrirMenuMobile();
        }
    }

    function abrirMenuMobile() {
        const {
            sidebar,
            mobileMenuButton,
            sidebarOverlay
        } = elements;

        if (
            !sidebar ||
            !mobileMenuButton ||
            !sidebarOverlay
        ) {
            return;
        }

        state.mobileMenuOpen = true;

        sidebar.classList.add('is-open');
        sidebarOverlay.classList.add('is-visible');

        mobileMenuButton.setAttribute(
            'aria-expanded',
            'true'
        );

        mobileMenuButton.setAttribute(
            'aria-label',
            'Fechar menu principal'
        );

        atualizarIconeMenuMobile(true);

        document.body.classList.add(
            'menu-mobile-open'
        );
    }

    function fecharMenuMobile() {
        const {
            sidebar,
            mobileMenuButton,
            sidebarOverlay
        } = elements;

        if (
            !sidebar ||
            !mobileMenuButton ||
            !sidebarOverlay
        ) {
            return;
        }

        state.mobileMenuOpen = false;

        sidebar.classList.remove('is-open');
        sidebarOverlay.classList.remove('is-visible');

        mobileMenuButton.setAttribute(
            'aria-expanded',
            'false'
        );

        mobileMenuButton.setAttribute(
            'aria-label',
            'Abrir menu principal'
        );

        atualizarIconeMenuMobile(false);

        document.body.classList.remove(
            'menu-mobile-open'
        );
    }

    function atualizarIconeMenuMobile(menuAberto) {
        const button = elements.mobileMenuButton;

        if (!button) {
            return;
        }

        const icon = button.querySelector('i');

        if (!icon) {
            return;
        }

        icon.classList.toggle(
            'fa-bars',
            !menuAberto
        );

        icon.classList.toggle(
            'fa-xmark',
            menuAberto
        );
    }

    function tratarTeclaEscape(event) {
        if (event.key === 'Escape') {
            if (state.mobileMenuOpen) {
                fecharMenuMobile();
                elements.mobileMenuButton?.focus();
                return;
            }

            if (window.innerWidth <= 1024) {
                const sidebarAberta = elements.sidebar?.classList.contains('is-open');
                if (sidebarAberta) {
                    fecharMenuMobile();
                }
            }
        }
    }

    function tratarRedimensionamento() {
        if (window.innerWidth > 1024) {
            if (state.mobileMenuOpen) {
                fecharMenuMobile();
            }

            const estadoSalvo = obterEstadoSidebarSalvo();
            state.sidebarCollapsed = estadoSalvo;
            aplicarEstadoSidebar(state.sidebarCollapsed, false);
            return;
        }

        document.body.classList.remove('sidebar-collapsed');
        elements.sidebar?.classList.remove('sidebar-collapsed');
        if (elements.mainContent) {
            elements.mainContent.style.setProperty('margin-left', '0', 'important');
        }
        atualizarLabelsDeAcesso();
    }

    /*
     * =========================================================
     * LINKS ATIVOS
     * =========================================================
     */

    function inicializarLinksAtivos() {
        const paginaAtual =
            obterNomeDaPagina(
                window.location.pathname
            );

        elements.menuLinks.forEach(link => {
            const href = link.getAttribute('href');

            if (!href || href.startsWith('#')) {
                return;
            }

            const paginaDoLink =
                obterNomeDaPagina(href);

            if (
                paginaDoLink &&
                paginaDoLink === paginaAtual
            ) {
                ativarLink(link);
            }
        });
    }

    function ativarLink(link) {
        link.classList.add('is-active');

        const submenu =
            link.closest('.submenu');

        if (!submenu) {
            return;
        }

        const grupo =
            submenu.closest('.menu-group');

        const toggle =
            grupo?.querySelector('.submenu-toggle');

        if (toggle) {
            abrirSubmenu(toggle, submenu);
            toggle.classList.add('is-active');
        }
    }

    function obterNomeDaPagina(caminho) {
        try {
            const url = new URL(
                caminho,
                window.location.origin
            );

            const nome =
                url.pathname.split('/').pop();

            return (
                nome ||
                'index.html'
            ).toLowerCase();
        } catch {
            return '';
        }
    }

    function inicializarLinksDeNavegacao() {
        elements.menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (
                    window.innerWidth <= 1024
                ) {
                    fecharMenuMobile();
                }
            });
        });
    }

    /*
     * =========================================================
     * RELÓGIO
     * =========================================================
     */

    function inicializarRelogio() {
        const clock = elements.clock;

        if (!clock) {
            return;
        }

        atualizarRelogio(clock);

        const timer = window.setInterval(() => {
            atualizarRelogio(clock);
        }, 1000);

        state.timers.push(timer);
    }

    function atualizarRelogio(elemento) {
        const agora = new Date();

        try {
            const dataHora =
                new Intl.DateTimeFormat(
                    'pt-BR',
                    {
                        dateStyle: 'short',
                        timeStyle: 'medium'
                    }
                ).format(agora);

            elemento.textContent = dataHora;
        } catch {
            elemento.textContent =
                agora.toLocaleString('pt-BR');
        }
    }

    /*
     * =========================================================
     * TEMPO DE SESSÃO
     * =========================================================
     */

    function inicializarTempoSessao() {
        const elemento = elements.sessionTime;

        if (!elemento) {
            return;
        }

        const chaveSessao =
            'gm4med.session.inicio';

        let inicioSessao =
            obterInicioDaSessao(chaveSessao);

        atualizarTempoSessao(
            elemento,
            inicioSessao
        );

        const timer = window.setInterval(() => {
            atualizarTempoSessao(
                elemento,
                inicioSessao
            );
        }, 1000);

        state.timers.push(timer);
    }

    function obterInicioDaSessao(chave) {
        if (!state.sessionStorageAvailable) {
            return Date.now();
        }

        const valorSalvo =
            sessionStorage.getItem(chave);

        const valorNumerico =
            Number(valorSalvo);

        if (
            Number.isFinite(valorNumerico) &&
            valorNumerico > 0
        ) {
            return valorNumerico;
        }

        const novoInicio = Date.now();

        try {
            sessionStorage.setItem(
                chave,
                String(novoInicio)
            );
        } catch {
            return novoInicio;
        }

        return novoInicio;
    }

    function atualizarTempoSessao(elemento, inicio) {
        const inicioValido =
            Number.isFinite(inicio) &&
                inicio > 0
                ? inicio
                : Date.now();

        const tempoDecorrido =
            Math.max(
                0,
                Date.now() - inicioValido
            );

        const totalSegundos =
            Math.floor(
                tempoDecorrido / 1000
            );

        const horas =
            Math.floor(
                totalSegundos / 3600
            );

        const minutos =
            Math.floor(
                (totalSegundos % 3600) / 60
            );

        const segundos =
            totalSegundos % 60;

        elemento.textContent = [
            `${String(horas).padStart(2, '0')}h`,
            `${String(minutos).padStart(2, '0')}m`,
            `${String(segundos).padStart(2, '0')}s`
        ].join(' ');
    }

    /*
     * =========================================================
     * UTILITÁRIOS
     * =========================================================
     */

    function verificarStorage(storage) {
        try {
            const chaveTeste =
                '__gm4med_storage_test__';

            storage.setItem(chaveTeste, 'ok');
            storage.removeItem(chaveTeste);

            return true;
        } catch {
            return false;
        }
    }
});


