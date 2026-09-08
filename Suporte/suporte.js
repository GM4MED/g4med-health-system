(() => {
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const panels = $$('.tab-panel'),
    navItems = $$('.nav-link'),
    breadcrumb = $('#breadcrumbCurrent');

  const names = {
    overview: 'Visão geral',
    faq: 'Perguntas frequentes',
    contact: 'Fale conosco',
    updates: 'Atualizações',
    about: 'Sobre o sistema'
  };

  function openTab(tabId) {
    const id = tabId || 'overview';
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === id));
    navItems.forEach(item => {
      const active = item.dataset.tab === id;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (breadcrumb) breadcrumb.textContent = names[id] || names.overview;
    history.replaceState(null, '', `#${id}`);
    $('#sidebar')?.classList.remove('is-open');
    $('#menuToggle')?.setAttribute('aria-expanded', 'false');
  }

  window.openTab = openTab;

  navItems.forEach(item => item.addEventListener('click', () => openTab(item.dataset.tab)));
  $$('[data-open-tab]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.openTab)));

  const initial = location.hash.slice(1);
  openTab(names[initial] ? initial : 'overview');

  $('#menuToggle')?.addEventListener('click', () => {
    const sidebar = $('#sidebar'),
      open = sidebar.classList.toggle('is-open');
    $('#menuToggle').setAttribute('aria-expanded', String(open));
  });

  const theme = $('html'),
    themeButton = $('#themeToggle');
  const saved = localStorage.getItem('GM4med-theme');

  if (saved) theme.dataset.theme = saved;

  function syncTheme() {
    const dark = theme.dataset.theme === 'dark';
    themeButton.innerHTML = `<i class="fa-solid fa-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    themeButton.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  }

  syncTheme();

  themeButton?.addEventListener('click', () => {
    theme.dataset.theme = theme.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('GM4med-theme', theme.dataset.theme);
    syncTheme();
  });

  $$('.updates-table tbody tr').forEach(row => {
    const select = () => {
      $$('.updates-table tbody tr').forEach(item => item.classList.remove('active'));
      row.classList.add('active');
    };
    row.addEventListener('click', select);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select();
      }
    });
  });

  function filter(input, items) {
    const term = input.value.toLowerCase().trim();
    items.forEach(item => item.hidden = !item.textContent.toLowerCase().includes(term));
  }

  const globalSearch = $('#globalSearch'),
    clear = $('#clearSearch');

  globalSearch?.addEventListener('input', () => {
    clear.hidden = !globalSearch.value;
    const term = globalSearch.value.toLowerCase().trim();
    if (term) {
      openTab('faq');
      const faq = $$('.faq-item');
      const faqInput = $('.faq-search');
      if (faqInput) faqInput.value = globalSearch.value;
      filter(faqInput || globalSearch, faq);
    }
  });

  clear?.addEventListener('click', () => {
    globalSearch.value = '';
    clear.hidden = true;
    globalSearch.focus();
  });

  const faqSearch = $('.faq-search');
  faqSearch?.addEventListener('input', () => filter(faqSearch, $$('.faq-item')));

  $('#supportForm')?.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('.form-field', e.currentTarget).forEach(field => {
      const input = $('input,textarea', field),
        ok = input.checkValidity();
      field.classList.toggle('has-error', !ok);
      input.classList.toggle('is-error', !ok);
      valid &&= ok;
    });
    if (valid) {
      e.currentTarget.reset();
      showToast('Solicitação enviada com sucesso.');
    }
  });
  // Exemplo de validação restritiva antiga
  if (horaInput < "08:00" || horaInput > "17:30") {
    mostrarToast("Horário fora do funcionamento da agenda.");
    return;
  }
  $('#supportForm')?.addEventListener('reset', () => $$('.form-field').forEach(field => field.classList.remove('has-error')));

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    $('#toastContainer').append(toast);
    setTimeout(() => toast.remove(), 4000);
  }
})();
