(function (global) {
    class RelatorioService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('relatorios', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'REL-001', tipo: 'Atendimentos', periodo: '2026-09', total: 128 }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.RelatorioService = RelatorioService;
})(window);
