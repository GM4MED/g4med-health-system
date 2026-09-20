(function (global) {
    class PacienteService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('pacientes', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'PAC-2026-00001', nome: 'Maria da Silva', cpf: '111.222.333-44', status: 'A' },
                    { id: 'PAC-2026-00002', nome: 'Carlos Oliveira', cpf: '222.333.444-55', status: 'A' }
                ]
            });
        }

        async buscarPorCpf(cpf) {
            const lista = await this.getAll();
            return lista.find(item => String(item.cpf).replace(/\D/g, '') === String(cpf).replace(/\D/g, '')) || null;
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.PacienteService = PacienteService;
})(window);
