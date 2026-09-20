(function (global) {
    class AtendimentoService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('atendimentos', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'AT-001', pacienteId: 'PAC-2026-00001', medicoId: 1, tipo: 'Consulta', status: 'Em andamento' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.AtendimentoService = AtendimentoService;
})(window);
