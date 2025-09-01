/**
 * API Service
 * Handles all API communication with the backend
 */

const ApiService = {
    /**
     * Make authenticated HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async makeRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add authentication header if session exists
        const sessionId = window.StorageUtils.getSessionId();
        if (sessionId) {
            headers.Authorization = `Bearer ${sessionId}`;
        }
        
        const requestOptions = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(url, requestOptions);
            return response;
        } catch (error) {
            console.error('API Request failed:', error);
            throw new Error('Falha na comunicação com o servidor');
        }
    },

    /**
     * Make GET request
     * @param {string} url - Request URL
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    async get(url, options = {}) {
        const response = await this.makeRequest(url, {
            method: 'GET',
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        
        return await response.json();
    },

    /**
     * Make POST request
     * @param {string} url - Request URL
     * @param {Object} data - Request body data
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    async post(url, data = {}, options = {}) {
        const response = await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        
        return await response.json();
    },

    /**
     * Make PUT request
     * @param {string} url - Request URL
     * @param {Object} data - Request body data
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    async put(url, data = {}, options = {}) {
        const response = await this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        
        return await response.json();
    },

    /**
     * Make DELETE request
     * @param {string} url - Request URL
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    async delete(url, options = {}) {
        const response = await this.makeRequest(url, {
            method: 'DELETE',
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        
        return await response.json();
    },

    /**
     * Get application status
     * @returns {Promise<Object>} Status data
     */
    async getStatus() {
        return await this.get(window.CONFIG.API.STATUS);
    },

    /**
     * Get subdomain only (faster than full status)
     * @returns {Promise<Object>} Subdomain data
     */
    async getSubdomain() {
        return await this.get(window.CONFIG.API.STATUS + '/subdomain');
    },

    /**
     * Get applications list with resolved URLs
     * @returns {Promise<Object>} Applications data
     */
    async getApplications() {
        return await this.get(window.CONFIG.API.STATUS + '/applications');
    },

    /**
     * Get current application version
     * @returns {Promise<Object>} Version data
     */
    async getVersion() {
        return await this.get(window.CONFIG.API.STATUS + '/version');
    },

    /**
     * Check for available updates
     * @returns {Promise<Object>} Update check result
     */
    async checkForUpdates() {
        return await this.get('/api/updates/check');
    },

    /**
     * Get update requirements validation
     * @returns {Promise<Object>} Requirements validation
     */
    async getUpdateRequirements() {
        return await this.get('/api/updates/requirements');
    },

    /**
     * Start update installation
     * @returns {Promise<Object>} Installation result
     */
    async installUpdate() {
        return await this.post('/api/updates/install');
    },

    /**
     * Get update installation status
     * @returns {Promise<Object>} Installation status
     */
    async getUpdateStatus() {
        return await this.get('/api/updates/status');
    },

    /**
     * Rollback to previous version
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackUpdate() {
        return await this.post('/api/updates/rollback');
    },

    /**
     * Add new application
     * @param {Object} applicationData - Application data
     * @returns {Promise<Object>} Response
     */
    async addApplication(applicationData) {
        return await this.post(window.CONFIG.API.STATUS + '/applications', applicationData);
    },

    /**
     * Remove application by index
     * @param {number} index - Application index
     * @returns {Promise<Object>} Response
     */
    async removeApplication(index) {
        return await this.delete(window.CONFIG.API.STATUS + '/applications/' + index);
    },

    /**
     * Get authentication status
     * @returns {Promise<Object>} Auth status
     */
    async getAuthStatus() {
        return await this.get(window.CONFIG.API.AUTH.STATUS);
    },

    /**
     * Login with password
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response
     */
    async login(password) {
        return await this.post(window.CONFIG.API.AUTH.LOGIN, { password });
    },

    /**
     * Set new password
     * @param {string} password - New password
     * @returns {Promise<Object>} Response
     */
    async setPassword(password) {
        return await this.post(window.CONFIG.API.AUTH.SET_PASSWORD, { password });
    },

    /**
     * Remove password protection
     * @returns {Promise<Object>} Response
     */
    async removePassword() {
        return await this.post(window.CONFIG.API.AUTH.REMOVE_PASSWORD);
    },

    /**
     * Logout user
     * @returns {Promise<Object>} Response
     */
    async logout() {
        return await this.post(window.CONFIG.API.AUTH.LOGOUT);
    },

    /**
     * Handle API errors with user-friendly messages
     * @param {Error} error - The error object
     * @returns {string} User-friendly error message
     */
    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Não foi possível conectar ao servidor';
        }
        
        if (error.message.includes('401')) {
            return 'Sessão expirada. Faça login novamente.';
        }
        
        if (error.message.includes('403')) {
            return 'Acesso negado';
        }
        
        if (error.message.includes('404')) {
            return 'Recurso não encontrado';
        }
        
        if (error.message.includes('500')) {
            return 'Erro interno do servidor';
        }
        
        return error.message || 'Erro desconhecido';
    }
};

// Export to global scope
window.ApiService = ApiService;
