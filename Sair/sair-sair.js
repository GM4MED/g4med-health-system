(() => {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const $ = (selector) => document.querySelector(selector);
        const modal = $('#modalLogout');
        const loading = $('#logoutLoading');
        const openButton = $('#openLogout');
        const closeButton = $('#closeModal');
        const cancelButton = $('#cancelModal');
        const continueButton = $('#cancelLogout');
        const confirmButton = $('#confirmLogout');
        const logoutTime = $('#logoutHora');
        const duration = $('#sessionDuration');
        const sessionStartedAt = Date.now();
        let logoutInProgress = false;

        if (!modal || !loading || !openButton || !confirmButton) return;

        // Mantém os dados temporais atualizados sem depender de elementos inline.
        const pad = (value) => String(value).padStart(2, '0');
        const updateSessionDuration = () => {
            const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            if (duration) duration.textContent = `${pad(hours)}h ${pad(minutes)}m`;
        };
        updateSessionDuration();
        window.setInterval(updateSessionDuration, 1000);

        const openModal = () => {
            if (logoutInProgress) return;
            if (logoutTime) logoutTime.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
            modal.hidden = false;
            document.body.classList.add('modal-open');
            closeButton?.focus();
        };

        const closeModal = () => {
            if (logoutInProgress) return;
            modal.hidden = true;
            document.body.classList.remove('modal-open');
            openButton.focus();
        };

        const continueSession = () => {
            const target = continueButton?.dataset.redirect || '../Menu-Principal.html';
            window.location.href = target;
        };

        const performLogout = () => {
            if (logoutInProgress) return;
            logoutInProgress = true;
            modal.hidden = true;
            loading.hidden = false;
            document.body.classList.add('logout-in-progress');
            confirmButton.disabled = true;

            // Substitua este atraso pela chamada real de invalidação de sessão da sua API.
            window.setTimeout(() => {
                window.location.href = '../Menu-Principal.html';
            }, 1100);
        };

        openButton.addEventListener('click', openModal);
        closeButton?.addEventListener('click', closeModal);
        cancelButton?.addEventListener('click', closeModal);
        continueButton?.addEventListener('click', continueSession);
        confirmButton.addEventListener('click', performLogout);
        modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
    });
})();
