(function (global) {
    class UsuarioService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('usuarios', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: 'U-001', nome: 'Dr. Rodrigo Silva', login: 'dr.rodrigo', perfil: 'Administrador', status: 'Ativo' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.UsuarioService = UsuarioService;
})(window);
