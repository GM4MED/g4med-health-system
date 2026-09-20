(function (global) {
    class AgendaService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('agenda', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'AG-001', pacienteId: 'PAC-2026-00001', medicoId: 1, data: '2026-09-20', horario: '08:30', status: 'Agendado' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.AgendaService = AgendaService;
})(window);
