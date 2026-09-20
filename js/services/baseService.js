(function (global) {
    class BaseService {
        constructor(resource, options = {}) {
            this.resource = resource;
            this.client = options.client || global.GM4Med?.apiClient || null;
            this.mockEnabled = options.mockEnabled ?? true;
            this.mockData = options.mockData || [];
        }

        async getAll(params = {}) {
            if (!this.client || this.mockEnabled) {
                return this.mockData;
            }

            return this.client.get(this.resource, params);
        }

        async getById(id) {
            if (!this.client || this.mockEnabled) {
                return this.mockData.find(item => String(item.id) === String(id)) || null;
            }

            return this.client.get(`${this.resource}/${id}`);
        }

        async create(payload) {
            if (!this.client || this.mockEnabled) {
                return { ...payload, id: payload.id || crypto?.randomUUID?.() || `mock-${Date.now()}` };
            }

            return this.client.post(this.resource, payload);
        }

        async update(id, payload) {
            if (!this.client || this.mockEnabled) {
                return { id, ...payload };
            }

            return this.client.put(`${this.resource}/${id}`, payload);
        }

        async patch(id, payload) {
            if (!this.client || this.mockEnabled) {
                return { id, ...payload };
            }

            return this.client.patch(`${this.resource}/${id}`, payload);
        }

        async remove(id) {
            if (!this.client || this.mockEnabled) {
                return { id, deleted: true };
            }

            return this.client.del(`${this.resource}/${id}`);
        }
    }

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.BaseService = BaseService;
})(window);
