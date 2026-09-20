(function (global) {
    class ConvenioService extends global.GM4Med.BaseService {
        constructor(options = {}) {
            super('convenios', {
                ...options,
                mockEnabled: options.mockEnabled ?? true,
                mockData: options.mockData || [
                    { id: '001', razaoSocial: 'UNIMED GOIÂNIA', nomeFantasia: 'UNIMED', ans: '123456-0', status: 'A' }
                ]
            });
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.ConvenioService = ConvenioService;
})(window);
