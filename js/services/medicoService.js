(function (global) {
    class MedicoService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('medicos', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 1, nome: 'Dr. Carlos Eduardo Silva', conselho: 'CRM 12345-GO', especialidade: 'Cardiologia', status: 'Ativo' },
                    { id: 2, nome: 'Dra. Ana Paula Mendes', conselho: 'CRM 24680-GO', especialidade: 'Dermatologia', status: 'Ativo' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.MedicoService = MedicoService;
})(window);
