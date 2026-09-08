(() => {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const $ = (selector, root = document) => root.querySelector(selector);
        const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

        // Dados demonstrativos: em produção, esta coleção pode ser substituída por uma resposta da API.
        const exams = [
            { id: 'HEM-001', name: 'Hemograma completo', category: 'Hematologia', description: 'Avaliação quantitativa e qualitativa das células do sangue.', prep: 'Não requer jejum', deadline: '2 horas', hours: 2, price: 28.90, accent: 'teal' },
            { id: 'GLI-002', name: 'Glicemia em jejum', category: 'Bioquímica', description: 'Medição da concentração de glicose no sangue para acompanhamento metabólico.', prep: 'Jejum de 8 horas', deadline: '4 horas', hours: 4, price: 12.50, accent: 'blue' },
            { id: 'TSH-003', name: 'TSH ultra-sensível', category: 'Hormônios', description: 'Exame utilizado na avaliação da função da tireoide.', prep: 'Não requer jejum', deadline: '1 dia útil', hours: 24, price: 42.00, accent: 'purple' },
            { id: 'COL-004', name: 'Colesterol total e frações', category: 'Bioquímica', description: 'Perfil lipídico para avaliação do risco cardiovascular.', prep: 'Jejum recomendado de 8 horas', deadline: '6 horas', hours: 6, price: 55.90, accent: 'amber' },
            { id: 'URI-005', name: 'Urina tipo 1', category: 'Urinálise', description: 'Análise física, química e microscópica da urina.', prep: 'Primeira urina da manhã', deadline: '4 horas', hours: 4, price: 24.90, accent: 'cyan' },
            { id: 'VIT-006', name: 'Vitamina D', category: 'Vitaminas', description: 'Dosagem da 25-hidroxivitamina D para avaliação dos níveis séricos.', prep: 'Não requer jejum', deadline: '2 dias úteis', hours: 48, price: 68.00, accent: 'rose' },
            { id: 'PCR-007', name: 'Proteína C reativa', category: 'Imunologia', description: 'Marcador laboratorial associado a processos inflamatórios.', prep: 'Não requer jejum', deadline: '6 horas', hours: 6, price: 35.00, accent: 'teal' },
            { id: 'FER-008', name: 'Ferritina', category: 'Hematologia', description: 'Avalia as reservas de ferro do organismo.', prep: 'Jejum de 4 horas', deadline: '1 dia útil', hours: 24, price: 49.90, accent: 'purple' },
            { id: 'B12-009', name: 'Vitamina B12', category: 'Vitaminas', description: 'Dosagem importante para investigação de anemias e alterações neurológicas.', prep: 'Jejum de 4 horas', deadline: '2 dias úteis', hours: 48, price: 61.50, accent: 'amber' },
            { id: 'HBA-010', name: 'Hemoglobina glicada', category: 'Bioquímica', description: 'Indica a média da glicemia dos últimos meses.', prep: 'Não requer jejum', deadline: '1 dia útil', hours: 24, price: 39.90, accent: 'blue' },
            { id: 'PSA-011', name: 'PSA total', category: 'Hormônios', description: 'Marcador utilizado na avaliação prostática.', prep: 'Evitar exercícios intensos por 24 horas', deadline: '1 dia útil', hours: 24, price: 58.90, accent: 'cyan' },
            { id: 'TGO-012', name: 'TGO e TGP', category: 'Bioquímica', description: 'Enzimas empregadas na avaliação da função hepática.', prep: 'Jejum de 8 horas', deadline: '6 horas', hours: 6, price: 32.00, accent: 'rose' }
        ];

        const state = { query: '', category: 'all', sort: 'relevance', favorites: new Set(JSON.parse(localStorage.getItem('GM4med-favorite-exams') || '[]')), onlyFavorites: false, page: 1, perPage: 6, selectedExam: null, creating: false };
        const elements = { grid: $('#examGrid'), empty: $('#emptyState'), pagination: $('#pagination'), search: $('#searchInput'), clear: $('#clearSearch'), category: $('#categoryFilter'), sort: $('#sortFilter'), favorite: $('#favoriteFilter'), activeFilters: $('#activeFilters'), resultCount: $('#resultCount'), total: $('#totalExams'), categories: $('#totalCategories'), favoriteCount: $('#favoriteCount'), modal: $('#examModal'), modalTitle: $('#modalTitle'), modalCode: $('#modalCode'), modalBody: $('#modalBody'), modalAction: $('#modalAction'), toast: $('#toast') };
        let toastTimer;

        try {
            initializeCatalog();
            initializeModal();
            initializeActions();
            initializeBackButton();
        } catch (error) {
            console.error('[GM4med] Erro ao carregar catálogo:', error);
            showToast('Não foi possível carregar o catálogo.');
        }

        function initializeCatalog() {
            const categories = [...new Set(exams.map((exam) => exam.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
            categories.forEach((category) => elements.category.append(new Option(category, category)));
            elements.total.textContent = exams.length;
            elements.categories.textContent = categories.length;
            render();

            elements.search.addEventListener('input', () => { state.query = elements.search.value.trim().toLowerCase(); state.page = 1; elements.clear.hidden = !state.query; render(); });
            elements.clear.addEventListener('click', () => { elements.search.value = ''; state.query = ''; elements.clear.hidden = true; elements.search.focus(); state.page = 1; render(); });
            elements.category.addEventListener('change', () => { state.category = elements.category.value; state.page = 1; render(); });
            elements.sort.addEventListener('change', () => { state.sort = elements.sort.value; state.page = 1; render(); });
            elements.favorite.addEventListener('click', () => { state.onlyFavorites = !state.onlyFavorites; state.page = 1; elements.favorite.setAttribute('aria-pressed', String(state.onlyFavorites)); elements.favorite.innerHTML = `<i class="fa-${state.onlyFavorites ? 'solid' : 'regular'} fa-star" aria-hidden="true"></i> Favoritos`; render(); });
            elements.grid.addEventListener('click', handleGridClick);
            elements.pagination.addEventListener('click', (event) => { const button = event.target.closest('[data-page]'); if (button) { state.page = Number(button.dataset.page); render(); elements.grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
            $('#resetFilters').addEventListener('click', resetFilters);
        }

        function getFilteredExams() {
            const filtered = exams.filter((exam) => {
                const searchable = `${exam.name} ${exam.id} ${exam.category} ${exam.description} ${exam.prep}`.toLowerCase();
                return (!state.query || searchable.includes(state.query)) && (state.category === 'all' || exam.category === state.category) && (!state.onlyFavorites || state.favorites.has(exam.id));
            });
            return filtered.sort((a, b) => {
                if (state.sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
                if (state.sort === 'fastest') return a.hours - b.hours;
                if (state.sort === 'price-low') return a.price - b.price;
                return exams.indexOf(a) - exams.indexOf(b);
            });
        }

        function render() {
            const filtered = getFilteredExams();
            const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
            if (state.page > totalPages) state.page = totalPages;
            const visible = filtered.slice((state.page - 1) * state.perPage, state.page * state.perPage);
            elements.resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;
            elements.empty.hidden = filtered.length > 0;
            elements.grid.hidden = filtered.length === 0;
            elements.pagination.hidden = filtered.length === 0;
            elements.grid.innerHTML = visible.map(renderCard).join('');
            elements.pagination.innerHTML = renderPagination(totalPages);
            elements.favoriteCount.textContent = state.favorites.size;
            renderActiveFilters();
        }

        function renderCard(exam) {
            const favorite = state.favorites.has(exam.id);
            return `<article class="exam-card" data-id="${exam.id}"><div class="exam-card-head"><span class="exam-category">${exam.category}</span><button class="favorite-button ${favorite ? 'is-favorite' : ''}" data-action="favorite" type="button" aria-label="${favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${favorite}"><i class="fa-${favorite ? 'solid' : 'regular'} fa-star" aria-hidden="true"></i></button></div><h3>${exam.name}</h3><span class="exam-code">Código ${exam.id}</span><p class="exam-description">${exam.description}</p><div class="exam-meta"><div><span>Preparo</span><strong>${exam.prep}</strong></div><div><span>Resultado</span><strong>${exam.deadline}</strong></div></div><div class="exam-card-footer"><strong class="exam-price">R$ ${exam.price.toFixed(2).replace('.', ',')}</strong><button class="details-button" data-action="details" type="button">Ver detalhes <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div></article>`;
        }

        function renderPagination(totalPages) {
            if (totalPages <= 1) return '';
            const buttons = [];
            buttons.push(`<button class="page-button" data-page="${state.page - 1}" type="button" aria-label="Página anterior" ${state.page === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>`);
            for (let page = 1; page <= totalPages; page += 1) buttons.push(`<button class="page-button ${page === state.page ? 'is-active' : ''}" data-page="${page}" type="button" aria-label="Página ${page}" ${page === state.page ? 'aria-current="page"' : ''}>${page}</button>`);
            buttons.push(`<button class="page-button" data-page="${state.page + 1}" type="button" aria-label="Próxima página" ${state.page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>`);
            return buttons.join('');
        }

        function renderActiveFilters() {
            const chips = [];
            if (state.query) chips.push(`<span class="active-filter">Busca: ${escapeHtml(state.query)} <button type="button" data-clear="query" aria-label="Remover busca"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>`);
            if (state.category !== 'all') chips.push(`<span class="active-filter">${escapeHtml(state.category)} <button type="button" data-clear="category" aria-label="Remover categoria"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>`);
            if (state.onlyFavorites) chips.push('<span class="active-filter">Somente favoritos <button type="button" data-clear="favorites" aria-label="Remover filtro de favoritos"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>');
            elements.activeFilters.innerHTML = chips.join('');
            elements.activeFilters.querySelectorAll('[data-clear]').forEach((button) => button.addEventListener('click', () => clearFilter(button.dataset.clear)));
        }

        function clearFilter(filter) { if (filter === 'query') { state.query = ''; elements.search.value = ''; elements.clear.hidden = true; } if (filter === 'category') { state.category = 'all'; elements.category.value = 'all'; } if (filter === 'favorites') { state.onlyFavorites = false; elements.favorite.setAttribute('aria-pressed', 'false'); elements.favorite.innerHTML = '<i class="fa-regular fa-star" aria-hidden="true"></i> Favoritos'; } state.page = 1; render(); }
        function resetFilters() { state.query = ''; state.category = 'all'; state.sort = 'relevance'; state.onlyFavorites = false; state.page = 1; elements.search.value = ''; elements.clear.hidden = true; elements.category.value = 'all'; elements.sort.value = 'relevance'; elements.favorite.setAttribute('aria-pressed', 'false'); elements.favorite.innerHTML = '<i class="fa-regular fa-star" aria-hidden="true"></i> Favoritos'; render(); }
        function handleGridClick(event) { const action = event.target.closest('[data-action]')?.dataset.action; const card = event.target.closest('[data-id]'); if (!action || !card) return; const exam = exams.find((item) => item.id === card.dataset.id); if (!exam) return; if (action === 'favorite') toggleFavorite(exam); if (action === 'details') openExamModal(exam); }
        function toggleFavorite(exam) { if (state.favorites.has(exam.id)) { state.favorites.delete(exam.id); showToast('Exame removido dos favoritos.'); } else { state.favorites.add(exam.id); showToast('Exame salvo nos favoritos.'); } localStorage.setItem('GM4med-favorite-exams', JSON.stringify([...state.favorites])); render(); }

        function initializeModal() { $('#closeModal').addEventListener('click', closeModal); $('#cancelModal').addEventListener('click', closeModal); elements.modal.addEventListener('click', (event) => { if (event.target === elements.modal) closeModal(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.modal.hidden) closeModal(); }); }
        function openExamModal(exam) { state.selectedExam = exam; state.creating = false; elements.modalTitle.textContent = exam.name; elements.modalCode.textContent = `Código ${exam.id} · ${exam.category}`; elements.modalBody.innerHTML = `<div class="detail-row"><label>Descrição clínica</label><p>${exam.description}</p></div><div class="detail-columns"><div class="detail-row"><label>Preparo</label><p>${exam.prep}</p></div><div class="detail-row"><label>Prazo estimado</label><p>${exam.deadline}</p></div><div class="detail-row"><label>Valor particular</label><p>R$ ${exam.price.toFixed(2).replace('.', ',')}</p></div><div class="detail-row"><label>Status</label><p><strong style="color:#16a34a">Ativo no catálogo</strong></p></div></div><div class="detail-row"><label>Orientação operacional</label><p>Confirme a indicação clínica, a preparação do paciente e a disponibilidade da unidade antes da coleta.</p></div>`; elements.modalAction.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i> Editar cadastro'; elements.modal.hidden = false; document.body.style.overflow = 'hidden'; $('#closeModal').focus(); }
        function openNewExamModal() { state.creating = true; state.selectedExam = null; elements.modalTitle.textContent = 'Novo exame'; elements.modalCode.textContent = 'Cadastro de exame'; elements.modalBody.innerHTML = '<div class="detail-row"><label for="newExamName">Nome do exame</label><input class="form-input" id="newExamName" type="text" placeholder="Ex.: Magnésio sérico"></div><div class="detail-columns"><div class="detail-row"><label for="newExamCategory">Categoria</label><input class="form-input" id="newExamCategory" type="text" placeholder="Ex.: Bioquímica"></div><div class="detail-row"><label for="newExamPrice">Valor particular</label><input class="form-input" id="newExamPrice" type="number" min="0" step="0.01" placeholder="0,00"></div></div><div class="detail-row"><label for="newExamDescription">Descrição</label><textarea class="form-input" id="newExamDescription" rows="3" placeholder="Descreva a finalidade do exame"></textarea></div>'; elements.modalAction.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Salvar exame'; elements.modal.hidden = false; document.body.style.overflow = 'hidden'; $('#newExamName').focus(); }
        function closeModal() { elements.modal.hidden = true; document.body.style.overflow = ''; }

        function initializeBackButton() {
            const backButton = $('#backButton');
            if (!backButton) return;
            backButton.addEventListener('click', () => {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '../index.html';
            });
        }

        function initializeActions() { $('#openNewExam').addEventListener('click', openNewExamModal); $('#exportCatalog').addEventListener('click', exportCatalog); elements.modalAction.addEventListener('click', () => { if (state.creating) { const name = $('#newExamName')?.value.trim(); if (!name) { showToast('Informe o nome do exame.'); $('#newExamName')?.focus(); return; } closeModal(); showToast('Cadastro pronto para integração com a API.'); } else { closeModal(); showToast('Modo de edição disponível na próxima etapa.'); } }); }
        function exportCatalog() { const rows = [['Código', 'Exame', 'Categoria', 'Preparo', 'Prazo', 'Valor'], ...exams.map((exam) => [exam.id, exam.name, exam.category, exam.prep, exam.deadline, exam.price.toFixed(2)])]; const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n'); const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'catalogo-GM4med.csv'; link.click(); URL.revokeObjectURL(url); showToast('Catálogo exportado com sucesso.'); }
        function showToast(message) { const text = elements.toast.querySelector('span'); text.textContent = message; elements.toast.classList.add('is-visible'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 3000); }
        function escapeHtml(value) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character])); }
    });
})();
