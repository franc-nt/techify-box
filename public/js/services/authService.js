/**
 * Authentication Service (Frontend)
 * Handles authentication logic and state management
 */

const AuthService = {
    // Authentication state
    state: {
        sessionId: null,
        hasPassword: false,
        isAuthenticated: false
    },

    /**
     * Initialize authentication service
     */
    init() {
        this.state.sessionId = window.StorageUtils.getSessionId();
        return this.checkAuthStatus();
    },

    /**
     * Check authentication status
     * @returns {Promise<Object>} Auth status
     */
    async checkAuthStatus() {
        try {
            const authData = await window.ApiService.getAuthStatus();
            
            this.state.hasPassword = authData.hasPassword;
            this.state.isAuthenticated = authData.isAuthenticated;
            
            return authData;
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.state.hasPassword = false;
            this.state.isAuthenticated = false;
            return { hasPassword: false, isAuthenticated: false };
        }
    },

    /**
     * Login with password
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result
     */
    async login(password) {
        try {
            if (!password || password.trim() === '') {
                throw new Error('Senha é obrigatória');
            }

            const response = await window.ApiService.login(password);
            
            if (response.sessionId) {
                this.state.sessionId = response.sessionId;
                this.state.isAuthenticated = true;
                window.StorageUtils.setSessionId(response.sessionId);
                
                return { success: true };
            } else {
                throw new Error('Resposta inválida do servidor');
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: window.ApiService.getErrorMessage(error)
            };
        }
    },

    /**
     * Set new password
     * @param {string} password - New password
     * @returns {Promise<Object>} Operation result
     */
    async setPassword(password) {
        try {
            if (!password || password.length < window.CONFIG.APP.PASSWORD_MIN_LENGTH) {
                throw new Error(`Senha deve ter pelo menos ${window.CONFIG.APP.PASSWORD_MIN_LENGTH} caracteres`);
            }

            await window.ApiService.setPassword(password);
            
            this.state.hasPassword = true;
            this.state.isAuthenticated = false;
            this.state.sessionId = null;
            window.StorageUtils.removeSessionId();
            
            return { success: true };
        } catch (error) {
            console.error('Set password error:', error);
            return {
                success: false,
                error: window.ApiService.getErrorMessage(error)
            };
        }
    },

    /**
     * Remove password protection
     * @returns {Promise<Object>} Operation result
     */
    async removePassword() {
        try {
            await window.ApiService.removePassword();
            
            this.state.hasPassword = false;
            this.state.isAuthenticated = true;
            this.state.sessionId = null;
            window.StorageUtils.removeSessionId();
            
            return { success: true };
        } catch (error) {
            console.error('Remove password error:', error);
            return {
                success: false,
                error: window.ApiService.getErrorMessage(error)
            };
        }
    },

    /**
     * Logout user
     * @returns {Promise<Object>} Operation result
     */
    async logout() {
        try {
            await window.ApiService.logout();
            
            this.state.isAuthenticated = false;
            this.state.sessionId = null;
            window.StorageUtils.removeSessionId();
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, clear local state
            this.state.isAuthenticated = false;
            this.state.sessionId = null;
            window.StorageUtils.removeSessionId();
            
            return { success: true };
        }
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.state.isAuthenticated;
    },

    /**
     * Check if password is set
     * @returns {boolean} Password status
     */
    hasPassword() {
        return this.state.hasPassword;
    },

    /**
     * Get current authentication state
     * @returns {Object} Current auth state
     */
    getState() {
        return { ...this.state };
    },

    /**
     * Handle session expiration
     */
    handleSessionExpired() {
        this.state.isAuthenticated = false;
        this.state.sessionId = null;
        window.StorageUtils.removeSessionId();
        
        // Trigger UI update
        if (window.App && window.App.showAuthUI) {
            window.App.showAuthUI();
        }
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        if (!password) {
            return {
                valid: false,
                error: 'Senha é obrigatória'
            };
        }

        if (password.length < window.CONFIG.APP.PASSWORD_MIN_LENGTH) {
            return {
                valid: false,
                error: `Senha deve ter pelo menos ${window.CONFIG.APP.PASSWORD_MIN_LENGTH} caracteres`
            };
        }

        return { valid: true };
    }
};

// Export to global scope
window.AuthService = AuthService;
