(function (global) {
    class FinanceiroService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('financeiro', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'LC-001', descricao: 'Consulta cardiológica', tipo: 'Entrada', valor: 450.00, status: 'Pago' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.FinanceiroService = FinanceiroService;
})(window);
