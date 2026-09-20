(function (global) {
    class ExameService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('exames', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'EX-001', nome: 'Hemograma Completo', categoria: 'Laboratório', status: 'Ativo' },
                    { id: 'EX-002', nome: 'Ressonância Magnética', categoria: 'Imagem', status: 'Ativo' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.ExameService = ExameService;
})(window);
