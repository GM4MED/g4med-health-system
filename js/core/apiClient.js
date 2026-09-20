(function (global) {
    const DEFAULT_TIMEOUT = 15000;
    const DEFAULT_HEADERS = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const HTTP_STATUS = {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE: 422,
        INTERNAL_SERVER_ERROR: 500
    };

    class ApiClient {
        constructor(baseUrl = '/api/v1', timeout = DEFAULT_TIMEOUT) {
            this.baseUrl = baseUrl.replace(/\/$/, '');
            this.timeout = timeout;
        }

        buildUrl(path) {
            if (!path) {
                return this.baseUrl;
            }

            const cleanPath = String(path).replace(/^\//, '');
            return `${this.baseUrl}/${cleanPath}`;
        }

        async request(path, options = {}) {
            const url = this.buildUrl(path);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const requestOptions = {
                ...options,
                headers: {
                    ...DEFAULT_HEADERS,
                    ...(options.headers || {})
                },
                signal: controller.signal
            };

            try {
                const response = await fetch(url, requestOptions);
                const payload = await this.parseBody(response);

                if (!response.ok) {
                    throw this.createError(response.status, payload, url);
                }

                return payload;
            } catch (error) {
                if (error && error.name === 'AbortError') {
                    throw new Error(`Timeout ao consultar ${url}`);
                }

                throw error;
            } finally {
                clearTimeout(timeoutId);
            }
        }

        async parseBody(response) {
            const contentType = response.headers.get('content-type') || '';

            if (response.status === HTTP_STATUS.NO_CONTENT || response.status === 205) {
                return null;
            }

            if (contentType.includes('application/json')) {
                return response.json().catch(() => null);
            }

            return response.text().catch(() => null);
        }

        createError(status, payload, url) {
            const error = new Error(`Requisição falhou em ${url} com status ${status}`);
            error.status = status;
            error.payload = payload;
            error.name = 'ApiError';
            return error;
        }

        get(path, params = {}, options = {}) {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `${path}?${queryString}` : path;
            return this.request(url, { ...options, method: 'GET' });
        }

        post(path, body, options = {}) {
            return this.request(path, {
                ...options,
                method: 'POST',
                body: JSON.stringify(body ?? {})
            });
        }

        put(path, body, options = {}) {
            return this.request(path, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(body ?? {})
            });
        }

        patch(path, body, options = {}) {
            return this.request(path, {
                ...options,
                method: 'PATCH',
                body: JSON.stringify(body ?? {})
            });
        }

        del(path, options = {}) {
            return this.request(path, {
                ...options,
                method: 'DELETE'
            });
        }
    }

    const gm4medApi = new ApiClient();

    global.GM4Med = global.GM4Med || {};
    global.GM4Med.ApiClient = ApiClient;
    global.GM4Med.apiClient = gm4medApi;
    global.GM4Med.HTTP_STATUS = HTTP_STATUS;
})(window);
