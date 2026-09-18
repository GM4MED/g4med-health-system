(() => {
  const querySelector = (s, r = document) => r.querySelector(s);
  const querySelectorAll = (s, r = document) => [...r.querySelectorAll(s)];

  const panels = querySelectorAll('.tab-panel');
  const navItems = querySelectorAll('.nav-link');
  const breadcrumb = querySelector('#breadcrumbCurrent');

  const names = {
    overview: 'Visão geral',
    faq: 'Perguntas frequentes',
    contact: 'Fale conosco',
    updates: 'Atualizações',
    about: 'Sobre o sistema'
  };

  // Gerenciamento de Abas
  function openTab(tabId) {
    const id = tabId && names[tabId] ? tabId : 'overview';

    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === id));
    navItems.forEach(item => {
      const active = item.dataset.tab === id;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (breadcrumb) breadcrumb.textContent = names[id] || names.overview;
    history.replaceState(null, '', `#${id}`);

    querySelector('#sidebar')?.classList.remove('is-open');
    querySelector('#menuToggle')?.setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.openTab = openTab;

  navItems.forEach(item => item.addEventListener('click', () => openTab(item.dataset.tab)));
  querySelectorAll('[data-open-tab]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.openTab)));

  const initialHash = location.hash.slice(1);
  openTab(names[initialHash] ? initialHash : 'overview');

  // Menu Mobile Toggle
  const menuToggle = querySelector('#menuToggle');
  menuToggle?.addEventListener('click', () => {
    const sidebar = querySelector('#sidebar');
    if (!sidebar) return;
    const open = sidebar.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  // Alternância de Tema (Dark/Light)
  const theme = document.documentElement;
  const themeButton = querySelector('#themeToggle');
  const savedTheme = localStorage.getItem('GM4med-theme') || 'light';

  theme.dataset.theme = savedTheme;

  function syncTheme() {
    if (!themeButton) return;
    const dark = theme.dataset.theme === 'dark';
    themeButton.innerHTML = `<i class="fa-solid fa-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    themeButton.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  }

  syncTheme();

  themeButton?.addEventListener('click', () => {
    const newTheme = theme.dataset.theme === 'dark' ? 'light' : 'dark';
    theme.dataset.theme = newTheme;
    localStorage.setItem('GM4med-theme', newTheme);
    syncTheme();
  });

  // Sistema de Acordeão / FAQ Corrigido para .GM4med-accordion-trigger
  const accordionTriggers = querySelectorAll(`
    .GM4med-accordion-trigger, 
    .GM4med-accordion-header, 
    [data-accordion-toggle], 
    .faq-question, 
    .faq-item > header, 
    .faq-item > button
  `);

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      // Tenta achar o container pai pelo padrão GM4med ou .faq-item
      const item = trigger.closest('.GM4med-accordion-item, .faq-item');
      if (!item) return;

      // Pega o painel associado via aria-controls ou busca dentro do item
      const controlsId = trigger.getAttribute('aria-controls');
      const content = controlsId
        ? querySelector(`#${controlsId}`)
        : item.querySelector('.GM4med-accordion-content, .faq-content, .faq-answer');

      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Alterna atributos e classes de estado
      trigger.setAttribute('aria-expanded', String(!isExpanded));
      item.classList.toggle('is-open', !isExpanded);

      if (content) {
        if (isExpanded) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });
  });

  // Interação com a Tabela de Atualizações / Versões
  querySelectorAll('.updates-table tbody tr').forEach(row => {
    const select = () => {
      querySelectorAll('.updates-table tbody tr').forEach(item => item.classList.remove('active'));
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

  // Filtragem Genérica (Busca)
  function filterItems(input, items) {
    const term = input.value.toLowerCase().trim();
    items.forEach(item => {
      const match = item.textContent.toLowerCase().includes(term);
      item.hidden = !match;
    });
  }

  const globalSearch = querySelector('#globalSearch');
  const clearSearchBtn = querySelector('#clearSearch');

  globalSearch?.addEventListener('input', () => {
    if (clearSearchBtn) clearSearchBtn.hidden = !globalSearch.value;
    const term = globalSearch.value.toLowerCase().trim();
    if (term) {
      openTab('faq');
      const faqItems = querySelectorAll('.faq-item, .GM4med-accordion-item');
      const faqInput = querySelector('.faq-search');
      if (faqInput) faqInput.value = globalSearch.value;
      filterItems(faqInput || globalSearch, faqItems);
    }
  });

  clearSearchBtn?.addEventListener('click', () => {
    if (globalSearch) globalSearch.value = '';
    clearSearchBtn.hidden = true;
    globalSearch?.focus();
  });

  const faqSearch = querySelector('.faq-search');
  faqSearch?.addEventListener('input', () => filterItems(faqSearch, querySelectorAll('.faq-item, .GM4med-accordion-item')));

  // Contador de Caracteres para Textarea
  const supportMessage = querySelector('#supportMessage') || querySelector('textarea[name="message"]');
  const charCounter = querySelector('.GM4med-char-counter');

  if (supportMessage && charCounter) {
    const maxLength = supportMessage.getAttribute('maxlength') || 500;
    supportMessage.addEventListener('input', () => {
      const currentLength = supportMessage.value.length;
      charCounter.textContent = `${currentLength}/${maxLength}`;
    });
  }

  // Upload customizado de arquivos
  const fileInput = querySelector('#supportFile') || querySelector('input[type="file"]');
  const fileUploadArea = querySelector('.file-upload-area');

  if (fileInput && fileUploadArea) {
    fileUploadArea.addEventListener('click', () => fileInput.click());

    fileUploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      fileUploadArea.classList.add('is-dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
      fileUploadArea.classList.remove('is-dragover');
    });

    fileUploadArea.addEventListener('drop', e => {
      e.preventDefault();
      fileUploadArea.classList.remove('is-dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileLabel(e.dataTransfer.files[0].name);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        updateFileLabel(fileInput.files[0].name);
      }
    });
  }

  function updateFileLabel(filename) {
    const label = querySelector('.file-upload-name') || fileUploadArea;
    if (label) label.textContent = `Arquivo selecionado: ${filename}`;
  }

  // Validação e Envio do Formulário de Suporte
  const supportForm = querySelector('#supportForm');
  supportForm?.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    querySelectorAll('.form-field', e.currentTarget).forEach(field => {
      const input = querySelector('input, textarea, select', field);
      if (!input) return;

      const ok = input.checkValidity();
      field.classList.toggle('has-error', !ok);
      input.classList.toggle('is-error', !ok);
      valid &&= ok;
    });

    if (valid) {
      e.currentTarget.reset();
      querySelectorAll('.form-field').forEach(field => field.classList.remove('has-error'));
      if (charCounter) charCounter.textContent = `0/500`;
      showToast('Solicitação enviada com sucesso!');
    } else {
      showToast('Por favor, preencha os campos obrigatórios corretamente.', 'error');
    }
  });

  supportForm?.addEventListener('reset', () => {
    querySelectorAll('.form-field').forEach(field => {
      field.classList.remove('has-error');
      const input = querySelector('input, textarea, select', field);
      if (input) input.classList.remove('is-error');
    });
    if (charCounter) charCounter.textContent = `0/500`;
  });

  // Sistema de Notificações Toast
  function showToast(message, type = 'success') {
    let container = querySelector('#toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
})();